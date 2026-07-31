/**
 * Shared money-path side-effects. Called inside payment / refund / verify
 * transactions so Invoice, Booking, Installments, Income ledger, and Agent
 * commission/wallet stay consistent — no manual sync.
 */
import { Prisma, type PaymentMethod } from "@prisma/client";
import { allocateSequence, formatDocNo } from "../lib/sequence";

export type Tx = Prisma.TransactionClient;

const EPS = 0.0001;
export const num = (v: Prisma.Decimal | number | null | undefined): number =>
  v == null ? 0 : typeof v === "number" ? v : Number(v);
export const round4 = (n: number): number => Math.round((n + Number.EPSILON) * 10000) / 10000;

export function invoiceStatusFor(total: number, paid: number): "SENT" | "PARTIAL" | "PAID" {
  if (paid >= total - EPS) return "PAID";
  if (paid > EPS) return "PARTIAL";
  return "SENT";
}

function installmentStatusFor(due: number, paid: number, dueDate: Date): "UPCOMING" | "DUE" | "PAID" | "OVERDUE" {
  if (paid >= due - EPS) return "PAID";
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const d = new Date(dueDate);
  d.setUTCHours(0, 0, 0, 0);
  if (d < today) return "OVERDUE";
  if (d.getTime() === today.getTime()) return "DUE";
  return "UPCOMING";
}

/** Apply (+delta) or unwind (−delta) paid amounts on invoice + linked booking. */
export async function syncPaidAggregates(
  tx: Tx,
  opts: {
    invoiceId?: string | null;
    bookingId?: string | null;
    delta: number;
    paidAt?: Date;
  },
): Promise<{ invoiceStatus: string | null; bookingId: string | null; invoiceFullyPaid: boolean }> {
  const delta = round4(opts.delta);
  let invoiceStatus: string | null = null;
  let bookingId = opts.bookingId ?? null;
  let invoiceFullyPaid = false;
  let invoiceTotal = 0;
  let invoiceNewPaid = 0;

  if (opts.invoiceId) {
    const inv = await tx.invoice.findUniqueOrThrow({
      where: { id: opts.invoiceId },
      select: { id: true, total: true, paidAmount: true, bookingId: true, status: true },
    });
    if (inv.status === "CANCELLED" || inv.status === "DRAFT") {
      throw new Error(`Cannot adjust paid amount on ${inv.status} invoice`);
    }
    bookingId = bookingId || inv.bookingId;
    invoiceTotal = num(inv.total);
    invoiceNewPaid = round4(Math.max(0, num(inv.paidAmount) + delta));
    invoiceStatus = invoiceStatusFor(invoiceTotal, invoiceNewPaid);
    invoiceFullyPaid = invoiceNewPaid >= invoiceTotal - EPS;
    await tx.invoice.update({
      where: { id: inv.id },
      data: { paidAmount: invoiceNewPaid, status: invoiceStatus as "SENT" | "PARTIAL" | "PAID" },
    });
  }

  if (bookingId) {
    const b = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, amount: true, paidAmount: true, status: true, deletedAt: true },
    });
    if (b && !b.deletedAt) {
      const newPaid = round4(Math.max(0, num(b.paidAmount) + delta));
      const data: Prisma.BookingUpdateInput = { paidAmount: newPaid };
      // Payment progress never flips COMPLETED/CANCELLED; only lifts PENDING → CONFIRMED when fully paid.
      if (
        newPaid >= num(b.amount) - EPS &&
        (b.status === "PENDING" || b.status === "PROCESSING")
      ) {
        data.status = "CONFIRMED";
      }
      await tx.booking.update({ where: { id: b.id }, data });
    }
  }

  // Installment FIFO allocate / unwind for plans linked to invoice or booking
  await allocateInstallments(tx, {
    invoiceId: opts.invoiceId ?? null,
    bookingId,
    delta,
    paidAt: opts.paidAt,
  });

  return { invoiceStatus, bookingId, invoiceFullyPaid };
}

/** FIFO allocate (+delta) or LIFO unwind (−delta) across installment rows. */
export async function allocateInstallments(
  tx: Tx,
  opts: { invoiceId?: string | null; bookingId?: string | null; delta: number; paidAt?: Date },
): Promise<void> {
  const delta = round4(opts.delta);
  if (Math.abs(delta) < EPS) return;

  const or: Prisma.InstallmentPlanWhereInput[] = [];
  if (opts.invoiceId) or.push({ invoiceId: opts.invoiceId });
  if (opts.bookingId) or.push({ bookingId: opts.bookingId });
  if (!or.length) return;

  const plans = await tx.installmentPlan.findMany({
    where: { deletedAt: null, OR: or, status: { in: ["active", "completed"] } },
    include: { installments: { orderBy: { number: "asc" } } },
  });
  if (!plans.length) return;

  for (const plan of plans) {
    let remaining = Math.abs(delta);
    const rows = delta > 0 ? plan.installments : [...plan.installments].reverse();

    for (const inst of rows) {
      if (remaining < EPS) break;
      const due = num(inst.amountDue);
      const paid = num(inst.paidAmount);

      if (delta > 0) {
        const room = round4(due - paid);
        if (room < EPS) continue;
        const apply = Math.min(room, remaining);
        const newPaid = round4(paid + apply);
        await tx.installment.update({
          where: { id: inst.id },
          data: {
            paidAmount: newPaid,
            paidDate: newPaid >= due - EPS ? (opts.paidAt ?? new Date()) : inst.paidDate,
            status: installmentStatusFor(due, newPaid, inst.dueDate),
          },
        });
        remaining = round4(remaining - apply);
      } else {
        if (paid < EPS) continue;
        const unwind = Math.min(paid, remaining);
        const newPaid = round4(paid - unwind);
        await tx.installment.update({
          where: { id: inst.id },
          data: {
            paidAmount: newPaid,
            paidDate: newPaid < EPS ? null : inst.paidDate,
            status: installmentStatusFor(due, newPaid, inst.dueDate),
          },
        });
        remaining = round4(remaining - unwind);
      }
    }

    const refreshed = await tx.installment.findMany({ where: { planId: plan.id } });
    const allPaid = refreshed.every((i) => num(i.paidAmount) >= num(i.amountDue) - EPS);
    const anyPaid = refreshed.some((i) => num(i.paidAmount) > EPS);
    await tx.installmentPlan.update({
      where: { id: plan.id },
      data: { status: allPaid ? "completed" : anyPaid || plan.status === "active" ? "active" : plan.status },
    });
  }
}

/** Post CONFIRMED income row for a collected payment (customer ledger). */
export async function postPaymentIncome(
  tx: Tx,
  opts: {
    branchId: string;
    branchCode: string;
    amount: number;
    currency: string;
    exchangeRate: number;
    baseAmount: number;
    method: PaymentMethod;
    paymentNo: string | null;
    paymentId: string;
    payerName?: string | null;
    paidAt: Date;
    userId?: string | null;
  },
): Promise<void> {
  const year = opts.paidAt.getUTCFullYear();
  const seq = await allocateSequence(tx, "INCOME", opts.branchId, year);
  await tx.income.create({
    data: {
      ref: formatDocNo("INC", opts.branchCode, year, seq),
      branchId: opts.branchId,
      category: "Customer Payment",
      description: `Payment ${opts.paymentNo ?? opts.paymentId}`,
      payerName: opts.payerName ?? null,
      amount: opts.amount,
      currency: opts.currency as never,
      exchangeRate: opts.exchangeRate,
      baseAmount: opts.baseAmount,
      method: opts.method,
      status: "CONFIRMED",
      date: opts.paidAt,
      createdById: opts.userId ?? null,
    },
  });
}

/** Soft-delete income rows posted for a reversed payment. */
export async function voidPaymentIncome(tx: Tx, paymentNo: string | null, paymentId: string): Promise<void> {
  const needles = [paymentNo, paymentId].filter(Boolean) as string[];
  if (!needles.length) return;
  await tx.income.updateMany({
    where: {
      deletedAt: null,
      OR: needles.map((n) => ({ description: { contains: n } })),
    },
    data: { deletedAt: new Date() },
  });
}

/**
 * Accrue PENDING commission on first payment for an agent booking.
 * Settle (PAID + wallet CREDIT) when the linked invoice is fully paid.
 * Unsettle (wallet DEBIT + PENDING) when a reverse/refund un-pays the invoice.
 */
export async function syncAgentCommission(
  tx: Tx,
  opts: {
    bookingId: string | null;
    invoiceFullyPaid: boolean;
    userId?: string | null;
  },
): Promise<void> {
  if (!opts.bookingId) return;
  const booking = await tx.booking.findUnique({
    where: { id: opts.bookingId },
    select: {
      id: true,
      agentId: true,
      amount: true,
      baseAmount: true,
      currency: true,
      bookingNo: true,
    },
  });
  if (!booking?.agentId) return;

  const agent = await tx.agent.findUnique({
    where: { id: booking.agentId },
    select: { id: true, commissionRate: true, tier: true, name: true },
  });
  if (!agent) return;

  let rate = num(agent.commissionRate);
  if (rate <= 0) {
    const tier = await tx.commissionTier.findUnique({ where: { tier: agent.tier } });
    rate = num(tier?.rate);
  }
  if (rate <= 0) return;

  const gross = num(booking.amount);
  const baseGross = num(booking.baseAmount);
  const amount = round4((gross * rate) / 100);
  const baseAmount = round4((baseGross * rate) / 100);
  const period = new Date().toISOString().slice(0, 7);

  let commission = await tx.agentCommission.findFirst({
    where: { agentId: agent.id, bookingId: booking.id, deletedAt: null },
  });

  if (!commission) {
    commission = await tx.agentCommission.create({
      data: {
        agentId: agent.id,
        bookingId: booking.id,
        period,
        grossAmount: gross,
        rate,
        amount,
        currency: booking.currency,
        baseAmount,
        status: "PENDING",
      },
    });
  }

  if (opts.invoiceFullyPaid && commission.status === "PENDING") {
    await settleCommission(tx, {
      commissionId: commission.id,
      agentId: agent.id,
      amount: num(commission.amount),
      baseAmount: num(commission.baseAmount),
      currency: commission.currency,
      bookingId: booking.id,
      bookingNo: booking.bookingNo,
      userId: opts.userId,
    });
  } else if (!opts.invoiceFullyPaid && commission.status === "PAID") {
    await unsettleCommission(tx, {
      commissionId: commission.id,
      agentId: agent.id,
      amount: num(commission.amount),
      baseAmount: num(commission.baseAmount),
      currency: commission.currency,
      bookingId: booking.id,
      bookingNo: booking.bookingNo,
    });
  }
}

async function ensureWallet(tx: Tx, agentId: string, currency: string) {
  let wallet = await tx.agentWallet.findUnique({ where: { agentId } });
  if (!wallet) {
    wallet = await tx.agentWallet.create({
      data: { agentId, balance: 0, currency: currency as never },
    });
  }
  return wallet;
}

async function settleCommission(
  tx: Tx,
  opts: {
    commissionId: string;
    agentId: string;
    amount: number;
    baseAmount: number;
    currency: string;
    bookingId: string;
    bookingNo: string | null;
    userId?: string | null;
  },
): Promise<void> {
  const wallet = await ensureWallet(tx, opts.agentId, opts.currency);
  const newBal = round4(num(wallet.balance) + opts.amount);
  await tx.agentWallet.update({
    where: { id: wallet.id },
    data: { balance: newBal, lastCreditAt: new Date() },
  });
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "CREDIT",
      description: `Commission settlement${opts.bookingNo ? ` · ${opts.bookingNo}` : ""}`,
      amount: opts.amount,
      currency: opts.currency as never,
      baseAmount: opts.baseAmount,
      method: "COMMISSION",
      reference: opts.commissionId,
      relatedBookingId: opts.bookingId,
    },
  });
  await tx.agentCommission.update({
    where: { id: opts.commissionId },
    data: { status: "PAID" },
  });
  if (opts.userId) {
    await tx.activityLog.create({
      data: {
        userId: opts.userId,
        action: "COMMISSION_SETTLED",
        target: opts.commissionId,
        module: "partners",
      },
    });
  }
}

async function unsettleCommission(
  tx: Tx,
  opts: {
    commissionId: string;
    agentId: string;
    amount: number;
    baseAmount: number;
    currency: string;
    bookingId: string;
    bookingNo: string | null;
  },
): Promise<void> {
  const wallet = await ensureWallet(tx, opts.agentId, opts.currency);
  const newBal = round4(Math.max(0, num(wallet.balance) - opts.amount));
  await tx.agentWallet.update({
    where: { id: wallet.id },
    data: { balance: newBal },
  });
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "DEBIT",
      description: `Commission reverse${opts.bookingNo ? ` · ${opts.bookingNo}` : ""}`,
      amount: opts.amount,
      currency: opts.currency as never,
      baseAmount: opts.baseAmount,
      method: "COMMISSION_REVERSE",
      reference: opts.commissionId,
      relatedBookingId: opts.bookingId,
    },
  });
  await tx.agentCommission.update({
    where: { id: opts.commissionId },
    data: { status: "PENDING" },
  });
}

/** Full post-payment effects after Payment+Receipt rows exist. */
export async function applyConfirmedPaymentEffects(
  tx: Tx,
  opts: {
    paymentId: string;
    paymentNo: string | null;
    invoiceId?: string | null;
    bookingId?: string | null;
    amount: number;
    currency: string;
    exchangeRate: number;
    baseAmount: number;
    method: PaymentMethod;
    branchId: string;
    branchCode: string;
    payerName?: string | null;
    paidAt: Date;
    userId?: string | null;
    /** When false, skip income post (e.g. already posted). Default true. */
    postIncome?: boolean;
  },
): Promise<{ invoiceStatus: string | null }> {
  const sync = await syncPaidAggregates(tx, {
    invoiceId: opts.invoiceId,
    bookingId: opts.bookingId,
    delta: opts.amount,
    paidAt: opts.paidAt,
  });

  if (opts.postIncome !== false) {
    await postPaymentIncome(tx, {
      branchId: opts.branchId,
      branchCode: opts.branchCode,
      amount: opts.amount,
      currency: opts.currency,
      exchangeRate: opts.exchangeRate,
      baseAmount: opts.baseAmount,
      method: opts.method,
      paymentNo: opts.paymentNo,
      paymentId: opts.paymentId,
      payerName: opts.payerName,
      paidAt: opts.paidAt,
      userId: opts.userId,
    });
  }

  await syncAgentCommission(tx, {
    bookingId: sync.bookingId,
    invoiceFullyPaid: sync.invoiceFullyPaid,
    userId: opts.userId,
  });

  return { invoiceStatus: sync.invoiceStatus };
}

/** Unwind effects for a reversed payment or processed refund (negative delta). */
export async function applyPaymentUnwindEffects(
  tx: Tx,
  opts: {
    invoiceId?: string | null;
    bookingId?: string | null;
    amount: number;
    paymentNo?: string | null;
    paymentId?: string;
    userId?: string | null;
  },
): Promise<void> {
  const sync = await syncPaidAggregates(tx, {
    invoiceId: opts.invoiceId,
    bookingId: opts.bookingId,
    delta: -Math.abs(opts.amount),
  });

  if (opts.paymentNo || opts.paymentId) {
    await voidPaymentIncome(tx, opts.paymentNo ?? null, opts.paymentId ?? "");
  }

  await syncAgentCommission(tx, {
    bookingId: sync.bookingId,
    invoiceFullyPaid: sync.invoiceFullyPaid,
    userId: opts.userId,
  });
}
