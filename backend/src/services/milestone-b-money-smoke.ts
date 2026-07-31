/**
 * Milestone B — money-path business scenario smoke (service-level, no HTTP).
 * Run: npx tsx src/services/milestone-b-money-smoke.ts
 */
import { PrismaClient } from "@prisma/client";
import * as payments from "./payment.service";
import * as invoices from "./invoice.service";
import type { AuthCtx } from "../middleware/auth";

const prisma = new PrismaClient();
const round4 = (n: number) => Math.round((n + Number.EPSILON) * 10000) / 10000;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { deletedAt: null },
    select: { id: true, role: true, branchId: true },
    orderBy: { createdAt: "asc" },
  });
  assert(user, "Need a user");
  const branch = await prisma.branch.findFirst({ where: { deletedAt: null } });
  assert(branch, "Need a branch");
  const auth: AuthCtx = { userId: user.id, role: user.role, branchId: user.branchId ?? branch.id };

  // Ensure agent + wallet for scenario 4
  let agent = await prisma.agent.findFirst({ where: { deletedAt: null, commissionRate: { gt: 0 } } });
  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        agentCode: `AGT-SMOKE-${Date.now().toString(36).toUpperCase()}`,
        name: "Smoke Agent",
        branchId: branch.id,
        tier: "GOLD",
        commissionRate: 5,
        status: "active",
      },
    });
  }
  await prisma.agentWallet.upsert({
    where: { agentId: agent.id },
    create: { agentId: agent.id, balance: 0, currency: "BDT" },
    update: {},
  });

  const customer = await prisma.customer.create({
    data: {
      name: `Money Path Smoke ${Date.now()}`,
      phone: `01${String(Date.now()).slice(-9)}`,
      branchId: branch.id,
    },
  });

  const tag = Date.now().toString(36);

  // ── Scenario 1: single payment → complete ───────────────────────────────────
  const b1 = await prisma.booking.create({
    data: {
      branchId: branch.id,
      customerId: customer.id,
      serviceType: "VISA",
      status: "CONFIRMED",
      bookingNo: `BK-S1-${tag}`,
      amount: 10000,
      baseAmount: 10000,
      paidAmount: 0,
      currency: "BDT",
      travelersCount: 1,
      createdById: user.id,
    },
  });
  const inv1 = await invoices.createInvoiceFromBooking(auth, b1.id, { issue: true });
  assert(inv1.status === "SENT", "S1 invoice issued");
  const pay1 = await payments.recordPayment(auth, {
    invoiceId: inv1.id,
    bookingId: b1.id,
    amount: 10000,
    method: "CASH",
  });
  assert(pay1.payment.receiptNo, "S1 receipt generated");
  assert(pay1.invoiceStatus === "PAID", "S1 invoice PAID");
  const b1after = await prisma.booking.findUniqueOrThrow({ where: { id: b1.id } });
  assert(Number(b1after.paidAmount) === 10000, "S1 booking paidAmount synced");
  const income1 = await prisma.income.findFirst({ where: { description: { contains: pay1.payment.paymentNo ?? pay1.payment.id }, deletedAt: null } });
  assert(income1, "S1 income ledger posted");
  console.log("✓ Scenario 1 — single payment complete");

  // ── Scenario 2: 3 installments ──────────────────────────────────────────────
  const b2 = await prisma.booking.create({
    data: {
      branchId: branch.id,
      customerId: customer.id,
      serviceType: "TOUR",
      status: "CONFIRMED",
      bookingNo: `BK-S2-${tag}`,
      amount: 30000,
      baseAmount: 30000,
      paidAmount: 0,
      currency: "BDT",
      travelersCount: 2,
      createdById: user.id,
    },
  });
  const inv2 = await invoices.createInvoiceFromBooking(auth, b2.id, { issue: true });
  const plan = await payments.createInstallmentPlan(auth, {
    invoiceId: inv2.id,
    bookingId: b2.id,
    customerId: customer.id,
    downAmount: 0,
    installments: [
      { label: "Inst 1", amountDue: 10000, dueDate: "2026-08-01" },
      { label: "Inst 2", amountDue: 10000, dueDate: "2026-09-01" },
      { label: "Inst 3", amountDue: 10000, dueDate: "2026-10-01" },
    ],
  });
  assert(plan.installments.length === 3, "S2 three installments");
  for (let i = 0; i < 3; i++) {
    await payments.recordPayment(auth, { invoiceId: inv2.id, bookingId: b2.id, amount: 10000, method: "BANK_TRANSFER" });
  }
  const inv2after = await prisma.invoice.findUniqueOrThrow({ where: { id: inv2.id } });
  assert(inv2after.status === "PAID", "S2 invoice PAID after 3 installments");
  const planAfter = await prisma.installmentPlan.findUniqueOrThrow({
    where: { id: plan.id },
    include: { installments: true },
  });
  assert(planAfter.status === "completed", "S2 plan completed");
  assert(planAfter.installments.every((i) => i.status === "PAID"), "S2 all installments PAID");
  const b2after = await prisma.booking.findUniqueOrThrow({ where: { id: b2.id } });
  assert(Number(b2after.paidAmount) === 30000, "S2 booking fully paid");
  console.log("✓ Scenario 2 — 3 installments paid");

  // ── Scenario 3: refund → ledger updated ─────────────────────────────────────
  const refund = await payments.createRefund(auth, {
    invoiceId: inv1.id,
    bookingId: b1.id,
    amount: 2500,
    method: "BANK_TRANSFER",
    reason: "Smoke partial refund",
  });
  await payments.updateRefundStatus(auth, refund.id, "APPROVED");
  await payments.updateRefundStatus(auth, refund.id, "PROCESSED");
  const inv1afterRefund = await prisma.invoice.findUniqueOrThrow({ where: { id: inv1.id } });
  assert(Number(inv1afterRefund.paidAmount) === 7500, `S3 invoice paid after refund got ${inv1afterRefund.paidAmount}`);
  assert(inv1afterRefund.status === "PARTIAL", "S3 invoice PARTIAL after refund");
  const b1refund = await prisma.booking.findUniqueOrThrow({ where: { id: b1.id } });
  assert(Number(b1refund.paidAmount) === 7500, "S3 booking paid after refund");
  const outPay = await prisma.payment.findFirst({
    where: { invoiceId: inv1.id, direction: "OUT", reference: { contains: refund.refundNo ?? refund.id } },
    include: { receipt: true },
  });
  assert(outPay?.receipt, "S3 refund OUT payment has receipt");
  console.log("✓ Scenario 3 — refund processed with ledger");

  // ── Scenario 4: agent commission → settlement → wallet ──────────────────────
  const walletBefore = await prisma.agentWallet.findUniqueOrThrow({ where: { agentId: agent.id } });
  const balBefore = Number(walletBefore.balance);
  const b4 = await prisma.booking.create({
    data: {
      branchId: branch.id,
      customerId: customer.id,
      agentId: agent.id,
      serviceType: "UMRAH",
      status: "CONFIRMED",
      bookingNo: `BK-S4-${tag}`,
      amount: 20000,
      baseAmount: 20000,
      paidAmount: 0,
      currency: "BDT",
      travelersCount: 1,
      createdById: user.id,
    },
  });
  const inv4 = await invoices.createInvoiceFromBooking(auth, b4.id, { issue: true });
  await payments.recordPayment(auth, { invoiceId: inv4.id, bookingId: b4.id, amount: 20000, method: "CASH" });
  const rate = Number(agent.commissionRate);
  const expectedComm = round4((20000 * rate) / 100);
  const comm = await prisma.agentCommission.findFirst({
    where: { agentId: agent.id, bookingId: b4.id, deletedAt: null },
  });
  assert(comm, "S4 commission accrued");
  assert(comm.status === "PAID", "S4 commission settled on full payment");
  assert(Math.abs(Number(comm.amount) - expectedComm) < 0.01, `S4 commission amount ${comm.amount} vs ${expectedComm}`);
  const walletAfter = await prisma.agentWallet.findUniqueOrThrow({ where: { agentId: agent.id } });
  assert(Math.abs(Number(walletAfter.balance) - (balBefore + expectedComm)) < 0.01, "S4 wallet credited");
  const wtx = await prisma.walletTransaction.findFirst({
    where: { walletId: walletAfter.id, reference: comm.id, type: "CREDIT", isReversed: false },
  });
  assert(wtx, "S4 wallet credit transaction exists");
  console.log("✓ Scenario 4 — commission settled + wallet updated");

  console.log("\nAll Milestone B business scenarios PASSED.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
