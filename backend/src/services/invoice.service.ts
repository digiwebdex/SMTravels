import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, resolveBranchId, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { money, type CurrencyCode } from "../lib/money";
import { allocateSequence, formatDocNo } from "../lib/sequence";
import type {
  InvoiceCreateInput, InvoiceUpdateInput, InvoiceListQuery,
  InvoiceListItem, InvoiceListResponse, InvoiceDetail,
} from "../contracts/finance.contract";

type Tx = Prisma.TransactionClient;
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

/** subtotal → discount → tax → total, then the money invariant (baseAmount). */
function computeTotals(items: InvoiceCreateInput["items"], discountAmount = 0, taxRate = 0, currency: CurrencyCode = "BDT", exchangeRate?: number) {
  const subtotal = round4(items.reduce((s, it) => s + (it.qty ?? 1) * it.unitPrice, 0));
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = round4((taxable * taxRate) / 100);
  const total = round4(taxable + taxAmount);
  const m = money(total, currency, exchangeRate);
  return { subtotal, discountAmount: round4(discountAmount), taxAmount, total, baseAmount: m.baseAmount, exchangeRate: m.exchangeRate };
}

type InvRow = Prisma.InvoiceGetPayload<{
  include: {
    branch: { select: { name: true } };
    customer: { select: { name: true; phone: true; email: true } };
  };
}>;
function toListItem(inv: InvRow): InvoiceListItem {
  const total = num(inv.total), paid = num(inv.paidAmount);
  return {
    id: inv.id, invoiceNo: inv.invoiceNo, branchId: inv.branchId, branchName: inv.branch?.name ?? null,
    customerId: inv.customerId, customerName: inv.customer?.name ?? null, customerPhone: inv.customer?.phone ?? null, customerEmail: inv.customer?.email ?? null,
    bookingId: inv.bookingId, issueDate: dOnly(inv.issueDate), dueDate: dOnly(inv.dueDate), currency: inv.currency as InvoiceListItem["currency"],
    subtotal: num(inv.subtotal), discountAmount: num(inv.discountAmount), taxAmount: num(inv.taxAmount), total, paidAmount: paid, dueAmount: round4(total - paid),
    status: inv.status, createdAt: dIso(inv.createdAt)!,
  };
}

export async function listInvoices(auth: AuthCtx, q: InvoiceListQuery): Promise<InvoiceListResponse> {
  const where: Prisma.InvoiceWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.status) where.status = q.status;
  if (q.customerId) where.customerId = q.customerId;
  if (q.dateFrom || q.dateTo) {
    where.issueDate = {};
    if (q.dateFrom) (where.issueDate as Prisma.DateTimeFilter).gte = toDate(q.dateFrom)!;
    if (q.dateTo) (where.issueDate as Prisma.DateTimeFilter).lte = toDate(q.dateTo)!;
  }
  if (q.q) where.OR = [{ invoiceNo: { contains: q.q, mode: "insensitive" } }, { customer: { is: { name: { contains: q.q, mode: "insensitive" } } } }, { notes: { contains: q.q, mode: "insensitive" } }];
  const orderBy: Prisma.InvoiceOrderByWithRelationInput = q.sort === "amount" ? { total: q.dir } : q.sort === "due" ? { dueDate: q.dir } : { createdAt: q.dir };

  const [rows, total, agg, overdue] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        customer: { select: { name: true, phone: true, email: true } },
      },
      orderBy,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({ where, _sum: { total: true, paidAmount: true } }),
    prisma.invoice.count({ where: { ...where, status: "OVERDUE" } }),
  ]);
  const totalBilled = num(agg._sum.total), totalPaid = num(agg._sum.paidAmount);
  return {
    data: rows.map(toListItem), page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    stats: { total, totalBilled, totalPaid, totalDue: round4(totalBilled - totalPaid), overdue },
  };
}

export async function getInvoice(auth: AuthCtx, id: string): Promise<InvoiceDetail> {
  const inv = await prisma.invoice.findFirst({
    where: { id, ...branchWhere(auth), deletedAt: null },
    include: {
      branch: true, customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "desc" }, include: { receipt: { select: { receiptNo: true } } } },
      refunds: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!inv) throw new HttpError(404, "NotFound");
  return {
    ...toListItem(inv as unknown as InvRow),
    fiscalYear: inv.fiscalYear, taxRate: num(inv.taxRate), baseAmount: num(inv.baseAmount), exchangeRate: num(inv.exchangeRate), notes: inv.notes,
    items: inv.items.map((it) => ({ id: it.id, description: it.description, qty: it.qty, unitPrice: num(it.unitPrice), amount: num(it.amount) })),
    payments: inv.payments.map((p) => ({ id: p.id, paymentNo: p.paymentNo, amount: num(p.amount), method: p.method, reference: p.reference, status: p.status, isReversed: p.isReversed, paidAt: dIso(p.paidAt)!, receiptNo: p.receipt?.receiptNo ?? null })),
    refunds: inv.refunds.map((r) => ({ id: r.id, refundNo: r.refundNo, amount: num(r.amount), reason: r.reason, status: r.status, createdAt: dIso(r.createdAt)! })),
  };
}

async function writeItems(tx: Tx, invoiceId: string, items: InvoiceCreateInput["items"]): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const qty = it.qty ?? 1;
    await tx.invoiceItem.create({ data: { invoiceId, description: it.description, qty, unitPrice: it.unitPrice, amount: round4(qty * it.unitPrice), bookingId: it.bookingId || null, sortOrder: i } });
  }
}

export async function createInvoice(auth: AuthCtx, input: InvoiceCreateInput): Promise<InvoiceDetail> {
  const branchId = resolveBranchId(auth, input.branchId);
  const t = computeTotals(input.items, input.discountAmount ?? 0, input.taxRate ?? 0, (input.currency as CurrencyCode) ?? "BDT", input.exchangeRate);
  const fiscalYear = (toDate(input.dueDate) ?? new Date()).getUTCFullYear();

  const id = await prisma.$transaction(async (tx) => {
    // DRAFT — NO invoiceNo yet (allocated at issue, so deleting a draft never gaps).
    const inv = await tx.invoice.create({
      data: {
        fiscalYear, branchId, customerId: input.customerId, bookingId: input.bookingId || null, dueDate: toDate(input.dueDate),
        currency: input.currency ?? "BDT", exchangeRate: t.exchangeRate, subtotal: t.subtotal, discountAmount: t.discountAmount,
        taxRate: input.taxRate ?? 0, taxAmount: t.taxAmount, total: t.total, baseAmount: t.baseAmount, status: "DRAFT",
        notes: input.notes, createdById: auth.userId,
      },
    });
    await writeItems(tx, inv.id, input.items);
    await tx.activityLog.create({ data: { userId: auth.userId, action: "INVOICE_CREATED", target: inv.id, module: "invoices" } });
    return inv.id;
  });
  return getInvoice(auth, id);
}

export async function updateInvoice(auth: AuthCtx, id: string, input: InvoiceUpdateInput): Promise<InvoiceDetail> {
  const existing = await prisma.invoice.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  if (existing.status !== "DRAFT") throw new HttpError(409, "InvoiceIssued", { detail: "Only a DRAFT invoice can be edited; issued invoices are cancelled via status, never changed." });

  await prisma.$transaction(async (tx) => {
    const items = input.items ?? undefined;
    const data: Prisma.InvoiceUpdateInput = {};
    if (input.dueDate !== undefined) data.dueDate = toDate(input.dueDate);
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.bookingId !== undefined) data.booking = input.bookingId ? { connect: { id: input.bookingId } } : { disconnect: true };
    if (items) {
      const t = computeTotals(items, input.discountAmount ?? num(existing.discountAmount), input.taxRate ?? num(existing.taxRate), (input.currency as CurrencyCode) ?? (existing.currency as CurrencyCode), input.exchangeRate);
      data.subtotal = t.subtotal; data.discountAmount = t.discountAmount; data.taxRate = input.taxRate ?? num(existing.taxRate);
      data.taxAmount = t.taxAmount; data.total = t.total; data.baseAmount = t.baseAmount; data.exchangeRate = t.exchangeRate;
      if (input.currency) data.currency = input.currency;
    }
    await tx.invoice.update({ where: { id }, data });
    if (items) { await tx.invoiceItem.deleteMany({ where: { invoiceId: id } }); await writeItems(tx, id, items); }
    await tx.activityLog.create({ data: { userId: auth.userId, action: "INVOICE_UPDATED", target: id, module: "invoices" } });
  });
  return getInvoice(auth, id);
}

/**
 * DRAFT → SENT. Allocates the gapless invoiceNo INSIDE the transaction. A post-
 * allocation business guard (no zero-total invoice) throws AFTER the number is
 * drawn — proving a failed issue rolls back and does NOT consume the number.
 */
export async function issueInvoice(auth: AuthCtx, id: string): Promise<InvoiceDetail> {
  const inv = await prisma.invoice.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, include: { branch: true } });
  if (!inv) throw new HttpError(404, "NotFound");
  if (inv.status !== "DRAFT") throw new HttpError(409, "AlreadyIssued", { detail: `Invoice is ${inv.status}; only a DRAFT can be issued.` });

  const year = new Date().getUTCFullYear();
  await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "INVOICE", inv.branchId, year); // gapless, inside the tx
    const invoiceNo = formatDocNo("INV", inv.branch.code, year, seq);
    await tx.invoice.update({ where: { id }, data: { invoiceNo, status: "SENT", issueDate: new Date(), fiscalYear: year } });
    // post-allocation guard: if this throws, the sequence bump is rolled back.
    if (num(inv.total) <= 0) throw new HttpError(400, "ZeroTotalInvoice", { detail: "Cannot issue an invoice with a zero total." });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "INVOICE_ISSUED", target: id, module: "invoices" } });
  });
  return getInvoice(auth, id);
}

export async function cancelInvoice(auth: AuthCtx, id: string): Promise<InvoiceDetail> {
  const inv = await prisma.invoice.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true, status: true, paidAmount: true } });
  if (!inv) throw new HttpError(404, "NotFound");
  if (inv.status === "CANCELLED") throw new HttpError(409, "AlreadyCancelled");
  if (num(inv.paidAmount) > 0) throw new HttpError(409, "InvoiceHasPayments", { detail: "Invoice has payments; reverse them before cancelling." });
  await prisma.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "INVOICE_CANCELLED", target: id, module: "invoices" } });
  return getInvoice(auth, id);
}

/** Soft-delete a DRAFT only (it has no number, so no gap). Issued → cancel via status. */
export async function deleteInvoice(auth: AuthCtx, id: string): Promise<void> {
  const inv = await prisma.invoice.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true, status: true } });
  if (!inv) throw new HttpError(404, "NotFound");
  if (inv.status !== "DRAFT") throw new HttpError(409, "CannotDelete", { detail: "Only a DRAFT invoice can be deleted; issued invoices are cancelled via status." });
  await prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
}

/**
 * Create (and optionally issue) an invoice from a confirmed booking.
 * Reuses booking amount/customer/branch — no redesign of invoice lifecycle.
 */
export async function createInvoiceFromBooking(
  auth: AuthCtx,
  bookingId: string,
  opts: { issue?: boolean } = {},
): Promise<InvoiceDetail> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, ...branchWhere(auth), deletedAt: null },
    include: { package: { select: { name: true } }, customer: { select: { name: true } } },
  });
  if (!booking) throw new HttpError(404, "BookingNotFound");
  if (!booking.customerId) throw new HttpError(400, "BookingHasNoCustomer");
  if (booking.status === "DRAFT" || booking.status === "CANCELLED") {
    throw new HttpError(409, "BookingNotInvoiceable", { detail: `Cannot invoice a ${booking.status} booking.` });
  }

  const existing = await prisma.invoice.findFirst({
    where: { bookingId, deletedAt: null, status: { not: "CANCELLED" } },
    select: { id: true, status: true, invoiceNo: true },
  });
  if (existing) {
    if (opts.issue !== false && existing.status === "DRAFT") return issueInvoice(auth, existing.id);
    return getInvoice(auth, existing.id);
  }

  const desc =
    booking.package?.name ||
    `${booking.serviceType.replace(/_/g, " ")} booking${booking.bookingNo ? ` ${booking.bookingNo}` : ""}`;
  const amount = num(booking.amount);
  if (amount <= 0) throw new HttpError(400, "ZeroBookingAmount");

  const draft = await createInvoice(auth, {
    branchId: booking.branchId,
    customerId: booking.customerId,
    bookingId: booking.id,
    currency: booking.currency as CurrencyCode,
    exchangeRate: num(booking.exchangeRate),
    items: [{ description: desc, qty: 1, unitPrice: amount, bookingId: booking.id }],
    notes: `Auto-generated from booking ${booking.bookingNo ?? booking.id}`,
  });

  if (opts.issue === false) return draft;
  return issueInvoice(auth, draft.id);
}
