/**
 * Payroll (Module 5) service. Runs + payslips. Reuses Employee (no duplicate records).
 * Workflow DRAFT→CALCULATED→APPROVED→PAID→CLOSED. Calculate seeds a payslip per active
 * employee, carrying the basic salary forward from that employee's most recent payslip.
 * gross = basic+allowances+bonus+overtime; net = gross − (deductions+advance+loan).
 */
import { prisma } from "../lib/prisma";
import type { AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  PayrollRunCreateInput, PayrollRunListQuery, PayslipUpdateInput,
  PayrollRunDto, PayslipDto,
} from "../contracts/payroll.contract";

const ACTIVE_EMPLOYEE = ["JOINED", "PROBATION", "CONFIRMED", "TRANSFERRED"];
const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => Number(v ?? 0);

/* eslint-disable @typescript-eslint/no-explicit-any */
function slipTotals(s: any) {
  const gross = r2(num(s.basic) + num(s.allowances) + num(s.bonus) + num(s.overtime));
  const ded = r2(num(s.deductions) + num(s.advance) + num(s.loan));
  const net = r2(gross - ded);
  return { gross, ded, net };
}
function toSlip(s: any): PayslipDto {
  return {
    id: s.id, employeeId: s.employeeId, employeeCode: s.employeeCode, employeeName: s.employeeName,
    basic: String(s.basic), allowances: String(s.allowances), bonus: String(s.bonus), overtime: String(s.overtime),
    deductions: String(s.deductions), advance: String(s.advance), loan: String(s.loan),
    gross: String(s.gross), net: String(s.net), paymentStatus: s.paymentStatus, remarks: s.remarks,
  };
}
function toRun(run: any, payslipCount = run.payslips?.length ?? 0): PayrollRunDto {
  return {
    id: run.id, code: run.code, periodMonth: run.periodMonth, periodYear: run.periodYear, label: run.label,
    branchId: run.branchId, status: run.status, grossTotal: String(run.grossTotal),
    deductionTotal: String(run.deductionTotal), netTotal: String(run.netTotal),
    approvedAt: run.approvedAt ? run.approvedAt.toISOString() : null,
    paidAt: run.paidAt ? run.paidAt.toISOString() : null,
    notes: run.notes, payslipCount, createdAt: run.createdAt.toISOString(),
  };
}

async function recomputeRunTotals(runId: string) {
  const slips = await prisma.payslip.findMany({ where: { payrollRunId: runId } });
  let gross = 0, ded = 0, net = 0;
  for (const s of slips) { gross += num(s.gross); ded += num(s.deductions) + num(s.advance) + num(s.loan); net += num(s.net); }
  await prisma.payrollRun.update({ where: { id: runId }, data: { grossTotal: r2(gross), deductionTotal: r2(ded), netTotal: r2(net) } });
}

export async function listPayrollRuns(_auth: AuthCtx, q: PayrollRunListQuery) {
  const runs = await prisma.payrollRun.findMany({
    where: { deletedAt: null, ...(q.status ? { status: q.status } : {}), ...(q.year ? { periodYear: q.year } : {}) },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { createdAt: "desc" }],
    include: { payslips: { select: { id: true } } },
    take: 200,
  });
  return { runs: runs.map((r) => toRun(r, r.payslips.length)) };
}

export async function getPayrollRun(_auth: AuthCtx, id: string) {
  const run = await prisma.payrollRun.findFirst({
    where: { id, deletedAt: null },
    include: { payslips: { orderBy: { employeeName: "asc" } } },
  });
  if (!run) throw new HttpError(404, "NotFound");
  return { ...toRun(run, run.payslips.length), payslips: run.payslips.map(toSlip) };
}

export async function createPayrollRun(auth: AuthCtx, input: PayrollRunCreateInput) {
  const run = await prisma.$transaction(async (tx) => {
    const n = await tx.payrollRun.count();
    return tx.payrollRun.create({
      data: {
        code: `PR-${input.periodYear}${String(input.periodMonth).padStart(2, "0")}-${String(n + 1).padStart(3, "0")}`,
        periodMonth: input.periodMonth, periodYear: input.periodYear,
        label: input.label ?? null, branchId: input.branchId ?? auth.branchId ?? null,
        notes: input.notes ?? null, createdById: auth.userId, status: "DRAFT",
      },
    });
  });
  return toRun(run, 0);
}

export async function calculatePayrollRun(_auth: AuthCtx, id: string) {
  const run = await prisma.payrollRun.findFirst({ where: { id, deletedAt: null } });
  if (!run) throw new HttpError(404, "NotFound");
  if (run.status !== "DRAFT" && run.status !== "CALCULATED") throw new HttpError(400, "InvalidState", { message: "Only DRAFT/CALCULATED runs can be (re)calculated." });

  const employees = await prisma.employee.findMany({
    where: { deletedAt: null, status: { in: ACTIVE_EMPLOYEE as never }, ...(run.branchId ? { branchId: run.branchId } : {}) },
    select: { id: true, employeeCode: true, firstName: true, lastName: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const e of employees) {
      const existing = await tx.payslip.findUnique({ where: { payrollRunId_employeeId: { payrollRunId: id, employeeId: e.id } } });
      if (existing) continue; // keep already-entered lines on recalc
      const prev = await tx.payslip.findFirst({
        where: { employeeId: e.id, payrollRunId: { not: id } },
        orderBy: { createdAt: "desc" },
      });
      const basic = prev ? num(prev.basic) : 0;
      const allowances = prev ? num(prev.allowances) : 0;
      const totals = slipTotals({ basic, allowances, bonus: 0, overtime: 0, deductions: 0, advance: 0, loan: 0 });
      await tx.payslip.create({
        data: {
          payrollRunId: id, employeeId: e.id, employeeCode: e.employeeCode,
          employeeName: `${e.firstName} ${e.lastName}`.trim(),
          basic, allowances, gross: totals.gross, net: totals.net,
        },
      });
    }
    await tx.payrollRun.update({ where: { id }, data: { status: "CALCULATED" } });
  });
  await recomputeRunTotals(id);
  return getPayrollRun(_auth, id);
}

export async function updatePayslip(_auth: AuthCtx, payslipId: string, input: PayslipUpdateInput) {
  const slip = await prisma.payslip.findUnique({ where: { id: payslipId }, include: { run: true } });
  if (!slip) throw new HttpError(404, "NotFound");
  if (slip.run.status !== "DRAFT" && slip.run.status !== "CALCULATED") throw new HttpError(400, "Locked", { message: "Payslips can only be edited before approval." });
  const merged = {
    basic: input.basic ?? num(slip.basic), allowances: input.allowances ?? num(slip.allowances),
    bonus: input.bonus ?? num(slip.bonus), overtime: input.overtime ?? num(slip.overtime),
    deductions: input.deductions ?? num(slip.deductions), advance: input.advance ?? num(slip.advance),
    loan: input.loan ?? num(slip.loan),
  };
  const totals = slipTotals(merged);
  await prisma.payslip.update({
    where: { id: payslipId },
    data: { ...merged, gross: totals.gross, net: totals.net, ...(input.remarks !== undefined ? { remarks: input.remarks || null } : {}) },
  });
  await recomputeRunTotals(slip.payrollRunId);
  return getPayrollRun(_auth, slip.payrollRunId);
}

export async function approvePayrollRun(auth: AuthCtx, id: string) {
  const run = await prisma.payrollRun.findFirst({ where: { id, deletedAt: null } });
  if (!run) throw new HttpError(404, "NotFound");
  if (run.status !== "CALCULATED") throw new HttpError(400, "InvalidState", { message: "Only CALCULATED runs can be approved." });
  await recomputeRunTotals(id);
  await prisma.payrollRun.update({ where: { id }, data: { status: "APPROVED", approvedById: auth.userId, approvedAt: new Date() } });
  return getPayrollRun(auth, id);
}

export async function markPayrollRunPaid(auth: AuthCtx, id: string) {
  const run = await prisma.payrollRun.findFirst({ where: { id, deletedAt: null } });
  if (!run) throw new HttpError(404, "NotFound");
  if (run.status !== "APPROVED") throw new HttpError(400, "InvalidState", { message: "Only APPROVED runs can be marked paid." });
  const now = new Date();
  await prisma.$transaction([
    prisma.payslip.updateMany({ where: { payrollRunId: id }, data: { paymentStatus: "PAID", paidAt: now } }),
    prisma.payrollRun.update({ where: { id }, data: { status: "PAID", paidAt: now } }),
  ]);
  return getPayrollRun(auth, id);
}

export async function closePayrollRun(auth: AuthCtx, id: string) {
  const run = await prisma.payrollRun.findFirst({ where: { id, deletedAt: null } });
  if (!run) throw new HttpError(404, "NotFound");
  if (run.status !== "PAID") throw new HttpError(400, "InvalidState", { message: "Only PAID runs can be closed." });
  await prisma.payrollRun.update({ where: { id }, data: { status: "CLOSED" } });
  return getPayrollRun(auth, id);
}
