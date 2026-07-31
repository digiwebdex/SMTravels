/**
 * NPSB bank-transfer payment proof: customer submission (PENDING) and staff
 * verification (CONFIRMED / FAILED). Uses existing PaymentStatus enum —
 * PENDING for customer submissions, CONFIRMED after staff approve.
 */
import { AuditSeverity, Prisma, type PaymentMethod } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { audit } from "../lib/audit";
import { AuthCtx, branchWhere, requireCustomerId } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { money, type CurrencyCode } from "../lib/money";
import { allocateSequence, formatDocNo } from "../lib/sequence";
import { moveIntoStore, removeQuietly } from "../lib/uploads";
import { notifyPaymentRecorded } from "./notification.service";
import { applyConfirmedPaymentEffects, num, round4 } from "./finance.effects";
import type {
  PublicBankAccountDto,
  PaymentDto,
  PaymentProofSubmitInput,
  PaymentVerifyInput,
  PendingPaymentDto,
  PendingPaymentListResponse,
} from "../contracts/finance.contract";

const EPS = 0.0001;
const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);

type PayRow = Prisma.PaymentGetPayload<{
  include: { invoice: { select: { invoiceNo: true; customer: { select: { name: true } } } }; receipt: { select: { receiptNo: true } } };
}>;

function toPaymentDto(p: PayRow): PaymentDto {
  return {
    id: p.id, paymentNo: p.paymentNo, direction: p.direction, branchId: p.branchId, invoiceId: p.invoiceId, invoiceNo: p.invoice?.invoiceNo ?? null,
    customerName: p.invoice?.customer?.name ?? null, amount: num(p.amount), currency: p.currency as PaymentDto["currency"], baseAmount: num(p.baseAmount),
    method: p.method, gateway: p.gateway, reference: p.reference, status: p.status, isReversed: p.isReversed, reversalOfId: p.reversalOfId,
    receiptNo: p.receipt?.receiptNo ?? null, paidAt: dIso(p.paidAt)!, createdAt: dIso(p.createdAt)!,
  };
}

const payInclude = {
  invoice: { select: { invoiceNo: true, customer: { select: { name: true } } } },
  receipt: { select: { receiptNo: true } },
} satisfies Prisma.PaymentInclude;

const PROOF_TAG_PREFIX = "payment:";

function toPublicBank(b: Prisma.BankAccountGetPayload<object>): PublicBankAccountDto {
  return {
    id: b.id, name: b.name, bankName: b.bankName, accountNumber: b.accountNumber,
    iban: b.iban, branchName: b.branchName, currency: b.currency as PublicBankAccountDto["currency"],
  };
}

/** Active company bank accounts for NPSB instructions (no balance). */
export async function listBankAccountsPublic(): Promise<{ data: PublicBankAccountDto[] }> {
  const rows = await prisma.bankAccount.findMany({
    where: { deletedAt: null, active: true },
    orderBy: { createdAt: "asc" },
  });
  return { data: rows.map(toPublicBank) };
}

/** ERP: same public fields (staff already have full CRUD on /bank-accounts). */
export async function listBankAccounts(_auth: AuthCtx): Promise<{ data: PublicBankAccountDto[] }> {
  return listBankAccountsPublic();
}

async function findProofDocument(paymentId: string): Promise<{ id: string; name: string } | null> {
  const tag = `${PROOF_TAG_PREFIX}${paymentId}`;
  const doc = await prisma.document.findFirst({
    where: { deletedAt: null, tags: { has: tag } },
    select: { id: true, name: true },
  });
  return doc;
}

async function linkProofDocument(documentId: string, paymentId: string, customerId: string): Promise<void> {
  const doc = await prisma.document.findFirst({
    where: {
      id: documentId,
      deletedAt: null,
      OR: [{ customerId }, { booking: { customerId, deletedAt: null } }],
    },
    select: { id: true, tags: true },
  });
  if (!doc) throw new HttpError(404, "DocumentNotFound", { detail: "Payment proof document not found." });
  const tag = `${PROOF_TAG_PREFIX}${paymentId}`;
  if (!doc.tags.includes(tag)) {
    await prisma.document.update({ where: { id: doc.id }, data: { tags: { set: [...doc.tags, tag] } } });
  }
}

async function createProofDocument(
  auth: AuthCtx,
  customerId: string,
  file: Express.Multer.File,
  bookingId: string | null,
): Promise<string> {
  try {
    const filePath = moveIntoStore(file.path, file.mimetype);
    const d = await prisma.document.create({
      data: {
        ownerType: bookingId ? "BOOKING" : "CUSTOMER",
        bookingId,
        customerId: bookingId ? null : customerId,
        type: "OTHER",
        name: file.originalname || "NPSB payment proof",
        filePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        status: "PENDING",
        tags: ["payment-proof"],
        uploadedById: auth.userId,
      },
    });
    return d.id;
  } catch (err) {
    removeQuietly(file.path);
    throw err;
  }
}

/** Customer submits NPSB transfer proof — creates a PENDING inbound payment. */
export async function submitPaymentProof(
  auth: AuthCtx,
  input: PaymentProofSubmitInput,
  file?: Express.Multer.File,
): Promise<PaymentDto> {
  const customerId = await requireCustomerId(auth);
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    select: { branchId: true, branch: { select: { code: true } } },
  });

  const invoice = input.invoiceId
    ? await prisma.invoice.findFirst({
        where: { id: input.invoiceId, customerId, deletedAt: null, status: { notIn: ["DRAFT", "CANCELLED"] } },
      })
    : null;
  if (input.invoiceId && !invoice) throw new HttpError(404, "InvoiceNotFound");

  if (input.bookingId) {
    const b = await prisma.booking.findFirst({ where: { id: input.bookingId, customerId, deletedAt: null }, select: { id: true } });
    if (!b) throw new HttpError(404, "BookingNotFound");
  }

  const branchId = invoice?.branchId ?? customer.branchId;
  const m = money(input.amount, (input.currency as CurrencyCode) ?? (invoice?.currency as CurrencyCode) ?? "BDT");

  if (invoice) {
    const due = round4(num(invoice.total) - num(invoice.paidAmount));
    if (m.amount > due + EPS) {
      throw new HttpError(400, "PaymentExceedsDue", { detail: `Payment ${m.amount} exceeds the amount due ${due}.` });
    }
  }

  if (!input.documentId && !file) {
    throw new HttpError(400, "ProofRequired", { detail: "Attach a proof file or provide documentId." });
  }

  const paidAt = new Date();
  const year = paidAt.getUTCFullYear();
  const bookingId = input.bookingId ?? invoice?.bookingId ?? null;

  const paymentId = await prisma.$transaction(async (tx) => {
    const pseq = await allocateSequence(tx, "PAYMENT", branchId, year);
    const payment = await tx.payment.create({
      data: {
        paymentNo: formatDocNo("PAY", customer.branch.code, year, pseq),
        direction: "IN",
        branchId,
        invoiceId: input.invoiceId || null,
        bookingId,
        customerId,
        amount: m.amount,
        currency: m.currency,
        exchangeRate: m.exchangeRate,
        baseAmount: m.baseAmount,
        method: "BANK_TRANSFER" as PaymentMethod,
        gateway: "NPSB",
        reference: input.reference,
        status: "PENDING",
        paidAt,
      },
    });
    await tx.activityLog.create({
      data: { userId: auth.userId, action: "PAYMENT_PROOF_SUBMITTED", target: payment.id, module: "invoices" },
    });
    return payment.id;
  });

  let documentId = input.documentId ?? null;
  if (file) {
    documentId = await createProofDocument(auth, customerId, file, bookingId);
  }
  if (documentId) {
    await linkProofDocument(documentId, paymentId, customerId);
  }

  const p = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: payInclude });
  return toPaymentDto(p);
}

/** Staff queue: NPSB proofs awaiting verification. */
export async function listPendingVerify(auth: AuthCtx): Promise<PendingPaymentListResponse> {
  const where: Prisma.PaymentWhereInput = {
    ...branchWhere(auth),
    status: "PENDING",
    gateway: "NPSB",
    direction: "IN",
    isReversed: false,
  };
  const rows = await prisma.payment.findMany({
    where,
    include: payInclude,
    orderBy: { paidAt: "asc" },
  });
  const data: PendingPaymentDto[] = await Promise.all(
    rows.map(async (p) => {
      const proof = await findProofDocument(p.id);
      return {
        ...toPaymentDto(p),
        customerId: p.customerId,
        proofDocumentId: proof?.id ?? null,
        proofDocumentName: proof?.name ?? null,
      };
    }),
  );
  return { data, total: data.length };
}

/** Staff approves or rejects a submitted NPSB proof. */
export async function verifyPayment(
  auth: AuthCtx,
  paymentId: string,
  input: PaymentVerifyInput,
  ip?: string | null,
): Promise<PaymentDto> {
  const p = await prisma.payment.findFirst({
    where: { id: paymentId, ...branchWhere(auth), status: "PENDING", gateway: "NPSB", direction: "IN" },
    include: { invoice: { include: { customer: { select: { name: true } } } }, receipt: true },
  });
  if (!p) throw new HttpError(404, "NotFound", { detail: "Pending NPSB payment not found." });
  if (p.receipt) throw new HttpError(409, "AlreadyVerified");

  if (!input.approve) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "FAILED",
          ...(input.note ? { reference: `${p.reference ?? ""} [rejected: ${input.note}]`.trim() } : {}),
        },
      });
      await tx.activityLog.create({
        data: {
          userId: auth.userId,
          action: "PAYMENT_PROOF_REJECTED",
          target: paymentId,
          module: "invoices",
        },
      });
    });
    void audit({
      event: "PAYMENT_VERIFY_REJECTED",
      userId: auth.userId,
      ip: ip ?? null,
      resource: "invoices",
      severity: AuditSeverity.WARNING,
      detail: `payment=${paymentId}${input.note ? ` note=${input.note.slice(0, 120)}` : ""}`,
    });
    const row = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: payInclude });
    return toPaymentDto(row);
  }

  if (p.invoice) {
    const due = round4(num(p.invoice.total) - num(p.invoice.paidAmount));
    if (num(p.amount) > due + EPS) {
      throw new HttpError(400, "PaymentExceedsDue", { detail: `Payment ${num(p.amount)} exceeds the amount due ${due}.` });
    }
  }

  const year = p.paidAt.getUTCFullYear();
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: p.branchId }, select: { code: true } });

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "CONFIRMED", receivedById: auth.userId },
    });
    const rseq = await allocateSequence(tx, "RECEIPT", p.branchId, year);
    await tx.receipt.create({
      data: {
        receiptNo: formatDocNo("RCP", branch.code, year, rseq),
        paymentId,
        branchId: p.branchId,
        amount: num(p.amount),
        currency: p.currency,
        baseAmount: num(p.baseAmount),
        issuedById: auth.userId,
      },
    });
    await applyConfirmedPaymentEffects(tx, {
      paymentId,
      paymentNo: p.paymentNo,
      invoiceId: p.invoiceId,
      bookingId: p.bookingId ?? p.invoice?.bookingId ?? null,
      amount: num(p.amount),
      currency: p.currency,
      exchangeRate: num(p.exchangeRate),
      baseAmount: num(p.baseAmount),
      method: p.method,
      branchId: p.branchId,
      branchCode: branch.code,
      payerName: p.invoice?.customer?.name ?? null,
      paidAt: p.paidAt,
      userId: auth.userId,
    });
    await tx.activityLog.create({
      data: {
        userId: auth.userId,
        action: "PAYMENT_PROOF_APPROVED",
        target: paymentId,
        module: "invoices",
      },
    });
  });

  notifyPaymentRecorded(paymentId);
  void audit({
    event: "PAYMENT_VERIFY_APPROVED",
    userId: auth.userId,
    ip: ip ?? null,
    resource: "invoices",
    severity: AuditSeverity.INFO,
    detail: `payment=${paymentId} amount=${num(p.amount)} ${p.currency}`,
  });
  const row = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: payInclude });
  return toPaymentDto(row);
}
