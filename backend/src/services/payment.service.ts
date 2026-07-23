import { Prisma, type PaymentMethod } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, resolveBranchId, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { money, type CurrencyCode } from "../lib/money";
import { allocateSequence, formatDocNo } from "../lib/sequence";
import { notifyPaymentRecorded } from "./notification.service";
import type {
  PaymentRecordInput, PaymentListQuery, PaymentDto, PaymentListResponse,
  RefundCreateInput, RefundDto, RefundListResponse,
  InstallmentPlanCreateInput, InstallmentPlanDto, InstallmentPlanListResponse,
  LedgerListQuery,
} from "../contracts/finance.contract";

const EPS = 0.0001;
const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const num = (v: Prisma.Decimal | number | null | undefined): number => (v == null ? 0 : typeof v === "number" ? v : Number(v));
const round4 = (n: number): number => Math.round((n + Number.EPSILON) * 10000) / 10000;
function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
function invoiceStatusFor(total: number, paid: number, issued: boolean): "SENT" | "PARTIAL" | "PAID" {
  if (paid >= total - EPS) return "PAID";
  if (paid > EPS) return "PARTIAL";
  return issued ? "SENT" : "SENT";
}

type PayRow = Prisma.PaymentGetPayload<{ include: { invoice: { select: { invoiceNo: true; customer: { select: { name: true } } } }; receipt: { select: { receiptNo: true } } } }>;
function toPaymentDto(p: PayRow): PaymentDto {
  return {
    id: p.id, paymentNo: p.paymentNo, direction: p.direction, branchId: p.branchId, invoiceId: p.invoiceId, invoiceNo: p.invoice?.invoiceNo ?? null,
    customerName: p.invoice?.customer?.name ?? null, amount: num(p.amount), currency: p.currency as PaymentDto["currency"], baseAmount: num(p.baseAmount),
    method: p.method, gateway: p.gateway, reference: p.reference, status: p.status, isReversed: p.isReversed, reversalOfId: p.reversalOfId,
    receiptNo: p.receipt?.receiptNo ?? null, paidAt: dIso(p.paidAt)!, createdAt: dIso(p.createdAt)!,
  };
}
const payInclude = { invoice: { select: { invoiceNo: true, customer: { select: { name: true } } } }, receipt: { select: { receiptNo: true } } } satisfies Prisma.PaymentInclude;

export async function listPayments(auth: AuthCtx, q: PaymentListQuery): Promise<PaymentListResponse> {
  const where: Prisma.PaymentWhereInput = { ...branchWhere(auth) };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.invoiceId) where.invoiceId = q.invoiceId;
  if (q.customerId) where.customerId = q.customerId;
  if (q.method) where.method = q.method;
  if (q.q) where.OR = [{ paymentNo: { contains: q.q, mode: "insensitive" } }, { reference: { contains: q.q, mode: "insensitive" } }];

  const [rows, total, inAgg, outAgg] = await Promise.all([
    prisma.payment.findMany({ where, include: payInclude, orderBy: { paidAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where: { ...where, direction: "IN", isReversed: false }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { ...where, direction: "OUT", isReversed: false }, _sum: { amount: true } }),
  ]);
  return { data: rows.map(toPaymentDto), page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)), stats: { total, totalIn: num(inAgg._sum.amount), totalOut: num(outAgg._sum.amount) } };
}

/**
 * Record a customer payment. Payment + Receipt are created and the invoice's
 * paidAmount + status are updated ALL in one transaction. paymentNo + receiptNo
 * are gapless (allocated in-tx). Gateway (bKash/Nagad/SSLCommerz) is a hook point
 * for the integrations phase — for now payments are recorded manually.
 */
export async function recordPayment(auth: AuthCtx, input: PaymentRecordInput): Promise<{ payment: PaymentDto; invoiceStatus: string | null }> {
  const invoice = input.invoiceId
    ? await prisma.invoice.findFirst({ where: { id: input.invoiceId, ...branchWhere(auth), deletedAt: null } })
    : null;
  if (input.invoiceId && !invoice) throw new HttpError(404, "InvoiceNotFound");
  if (invoice && (invoice.status === "DRAFT" || invoice.status === "CANCELLED")) {
    throw new HttpError(409, "InvoiceNotPayable", { detail: `Cannot record a payment against a ${invoice.status} invoice.` });
  }

  const branchId = invoice ? invoice.branchId : resolveBranchId(auth, input.branchId);
  const customerId = invoice ? invoice.customerId : input.customerId ?? null;
  const m = money(input.amount, (input.currency as CurrencyCode) ?? (invoice?.currency as CurrencyCode) ?? "BDT", input.exchangeRate);

  if (invoice) {
    const due = round4(num(invoice.total) - num(invoice.paidAmount));
    if (m.amount > due + EPS) throw new HttpError(400, "PaymentExceedsDue", { detail: `Payment ${m.amount} exceeds the amount due ${due}.` });
  }

  const paidAt = toDate(input.paidAt) ?? new Date();
  const year = paidAt.getUTCFullYear();
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } });

  const paymentId = await prisma.$transaction(async (tx) => {
    const pseq = await allocateSequence(tx, "PAYMENT", branchId, year);
    const payment = await tx.payment.create({
      data: {
        paymentNo: formatDocNo("PAY", branch.code, year, pseq), direction: "IN", branchId, invoiceId: input.invoiceId || null,
        bookingId: input.bookingId || invoice?.bookingId || null, customerId, amount: m.amount, currency: m.currency, exchangeRate: m.exchangeRate,
        baseAmount: m.baseAmount, method: input.method as PaymentMethod, gateway: input.gateway, reference: input.reference, status: "CONFIRMED",
        receivedById: auth.userId, paidAt,
      },
    });
    const rseq = await allocateSequence(tx, "RECEIPT", branchId, year);
    await tx.receipt.create({ data: { receiptNo: formatDocNo("RCP", branch.code, year, rseq), paymentId: payment.id, branchId, amount: m.amount, currency: m.currency, baseAmount: m.baseAmount, issuedById: auth.userId } });
    if (invoice) {
      const newPaid = round4(num(invoice.paidAmount) + m.amount);
      await tx.invoice.update({ where: { id: invoice.id }, data: { paidAmount: newPaid, status: invoiceStatusFor(num(invoice.total), newPaid, true) } });
    }
    await tx.activityLog.create({ data: { userId: auth.userId, action: "PAYMENT_RECORDED", target: payment.id, module: "invoices" } });
    return payment.id;
  });

  // customer receipt (email/SMS/in-app) — after the tx commits, fire-and-forget
  notifyPaymentRecorded(paymentId);

  const p = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: payInclude });
  const inv = input.invoiceId ? await prisma.invoice.findUnique({ where: { id: input.invoiceId }, select: { status: true } }) : null;
  return { payment: toPaymentDto(p), invoiceStatus: inv?.status ?? null };
}

/** Reverse a payment: mirror payment (opposite direction, reversalOfId), original
 *  flagged REVERSED, invoice paidAmount/status rolled back. No hard delete. */
export async function reversePayment(auth: AuthCtx, id: string): Promise<PaymentDto> {
  const p = await prisma.payment.findFirst({ where: { id, ...branchWhere(auth) }, include: { invoice: true } });
  if (!p) throw new HttpError(404, "NotFound");
  if (p.isReversed) throw new HttpError(409, "AlreadyReversed", { detail: `Already reversed by ${p.reversedById}.` });
  if (p.reversalOfId) throw new HttpError(409, "IsAReversal", { detail: "A reversal payment cannot itself be reversed." });

  const year = new Date().getUTCFullYear();
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: p.branchId }, select: { code: true } });

  const mirrorId = await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "PAYMENT", p.branchId, year);
    const mirror = await tx.payment.create({
      data: {
        paymentNo: formatDocNo("PAY", branch.code, year, seq), direction: p.direction === "IN" ? "OUT" : "IN", branchId: p.branchId,
        invoiceId: p.invoiceId, bookingId: p.bookingId, customerId: p.customerId, amount: num(p.amount), currency: p.currency,
        exchangeRate: num(p.exchangeRate), baseAmount: num(p.baseAmount), method: p.method, reference: `Reversal of ${p.paymentNo ?? p.id}`,
        status: "CONFIRMED", reversalOfId: p.id, receivedById: auth.userId,
      },
    });
    await tx.payment.update({ where: { id: p.id }, data: { isReversed: true, reversedById: mirror.id, status: "REVERSED" } });
    if (p.invoice) {
      const newPaid = round4(Math.max(0, num(p.invoice.paidAmount) - num(p.amount)));
      await tx.invoice.update({ where: { id: p.invoice.id }, data: { paidAmount: newPaid, status: invoiceStatusFor(num(p.invoice.total), newPaid, true) } });
    }
    await tx.activityLog.create({ data: { userId: auth.userId, action: "PAYMENT_REVERSED", target: p.id, module: "invoices" } });
    return mirror.id;
  });
  const m = await prisma.payment.findUniqueOrThrow({ where: { id: mirrorId }, include: payInclude });
  return toPaymentDto(m);
}

// ── refunds ───────────────────────────────────────────────────────────────────
type RefundRow = Prisma.RefundGetPayload<{ include: { invoice: { select: { invoiceNo: true; customer: { select: { name: true } } } } } }>;
function toRefundDto(r: RefundRow): RefundDto {
  return { id: r.id, refundNo: r.refundNo, branchId: r.branchId, invoiceId: r.invoiceId, invoiceNo: r.invoice?.invoiceNo ?? null, customerName: r.invoice?.customer?.name ?? null, reason: r.reason, amount: num(r.amount), currency: r.currency as RefundDto["currency"], method: r.method, status: r.status, createdAt: dIso(r.createdAt)! };
}
export async function listRefunds(auth: AuthCtx, q: PaymentListQuery): Promise<RefundListResponse> {
  const where: Prisma.RefundWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId;
  const [rows, total] = await Promise.all([
    prisma.refund.findMany({ where, include: { invoice: { select: { invoiceNo: true, customer: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.refund.count({ where }),
  ]);
  return { data: rows.map(toRefundDto), page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) };
}
export async function createRefund(auth: AuthCtx, input: RefundCreateInput): Promise<RefundDto> {
  const invoice = input.invoiceId ? await prisma.invoice.findFirst({ where: { id: input.invoiceId, ...branchWhere(auth), deletedAt: null } }) : null;
  if (input.invoiceId && !invoice) throw new HttpError(404, "InvoiceNotFound");
  const branchId = invoice ? invoice.branchId : resolveBranchId(auth, input.branchId);
  const m = money(input.amount, (input.currency as CurrencyCode) ?? "BDT", input.exchangeRate);
  const year = new Date().getUTCFullYear();
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } });
  const id = await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "REFUND", branchId, year);
    const r = await tx.refund.create({
      data: { refundNo: formatDocNo("REF", branch.code, year, seq), branchId, invoiceId: input.invoiceId || null, customerId: input.customerId || invoice?.customerId || null, bookingId: input.bookingId || null, reason: input.reason, amount: m.amount, currency: m.currency, exchangeRate: m.exchangeRate, baseAmount: m.baseAmount, method: input.method as PaymentMethod | undefined, status: "PENDING", createdById: auth.userId },
    });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "REFUND_CREATED", target: r.id, module: "invoices" } });
    return r.id;
  });
  const r = await prisma.refund.findUniqueOrThrow({ where: { id }, include: { invoice: { select: { invoiceNo: true, customer: { select: { name: true } } } } } });
  return toRefundDto(r);
}
export async function updateRefundStatus(auth: AuthCtx, id: string, status: "PENDING" | "APPROVED" | "PROCESSED" | "REJECTED"): Promise<RefundDto> {
  const r = await prisma.refund.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true } });
  if (!r) throw new HttpError(404, "NotFound");
  await prisma.refund.update({ where: { id }, data: { status, approvedById: status === "APPROVED" || status === "PROCESSED" ? auth.userId : undefined } });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: `REFUND_${status}`, target: id, module: "invoices" } });
  const row = await prisma.refund.findUniqueOrThrow({ where: { id }, include: { invoice: { select: { invoiceNo: true, customer: { select: { name: true } } } } } });
  return toRefundDto(row);
}

// ── installment plans ─────────────────────────────────────────────────────────
type PlanRow = Prisma.InstallmentPlanGetPayload<{ include: { installments: true } }>;
async function toPlanDto(p: PlanRow): Promise<InstallmentPlanDto> {
  const customer = await prisma.customer.findUnique({ where: { id: p.customerId }, select: { name: true } });
  return {
    id: p.id, branchId: p.branchId, invoiceId: p.invoiceId, bookingId: p.bookingId, customerId: p.customerId, customerName: customer?.name ?? null,
    total: num(p.total), currency: p.currency as InstallmentPlanDto["currency"], downAmount: num(p.downAmount), status: p.status,
    installments: p.installments.sort((a, b) => a.number - b.number).map((i) => ({ id: i.id, number: i.number, label: i.label, amountDue: num(i.amountDue), paidAmount: num(i.paidAmount), dueDate: dOnly(i.dueDate)!, paidDate: dOnly(i.paidDate), status: i.status })),
    createdAt: dIso(p.createdAt)!,
  };
}
export async function listInstallmentPlans(auth: AuthCtx, q: LedgerListQuery): Promise<InstallmentPlanListResponse> {
  const where: Prisma.InstallmentPlanWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId;
  const [rows, total] = await Promise.all([
    prisma.installmentPlan.findMany({ where, include: { installments: true }, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.installmentPlan.count({ where }),
  ]);
  const data = await Promise.all(rows.map(toPlanDto));
  return { data, page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) };
}
export async function createInstallmentPlan(auth: AuthCtx, input: InstallmentPlanCreateInput): Promise<InstallmentPlanDto> {
  const invoice = input.invoiceId ? await prisma.invoice.findFirst({ where: { id: input.invoiceId, ...branchWhere(auth), deletedAt: null } }) : null;
  if (input.invoiceId && !invoice) throw new HttpError(404, "InvoiceNotFound");
  const branchId = invoice ? invoice.branchId : resolveBranchId(auth, input.branchId);
  const currency = (input.currency as CurrencyCode) ?? "BDT";
  const total = round4((input.downAmount ?? 0) + input.installments.reduce((s, i) => s + i.amountDue, 0));
  const m = money(total, currency);
  const id = await prisma.$transaction(async (tx) => {
    const plan = await tx.installmentPlan.create({ data: { branchId, invoiceId: input.invoiceId || null, bookingId: input.bookingId || invoice?.bookingId || null, customerId: input.customerId, total: m.amount, currency: m.currency, baseAmount: m.baseAmount, downAmount: input.downAmount ?? 0, status: "active", createdById: auth.userId } });
    for (let i = 0; i < input.installments.length; i++) {
      const inst = input.installments[i];
      const im = money(inst.amountDue, currency);
      await tx.installment.create({ data: { planId: plan.id, number: i + 1, label: inst.label, amountDue: im.amount, currency: im.currency, baseAmount: im.baseAmount, dueDate: toDate(inst.dueDate)!, status: "UPCOMING" } });
    }
    await tx.activityLog.create({ data: { userId: auth.userId, action: "INSTALLMENT_PLAN_CREATED", target: plan.id, module: "invoices" } });
    return plan.id;
  });
  const p = await prisma.installmentPlan.findUniqueOrThrow({ where: { id }, include: { installments: true } });
  return toPlanDto(p);
}
