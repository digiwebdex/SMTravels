import { Prisma, type PaymentMethod } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, resolveBranchId, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { money, type CurrencyCode } from "../lib/money";
import { allocateSequence, formatDocNo } from "../lib/sequence";
import type { ExpenseCreateInput, IncomeCreateInput, LedgerListQuery, LedgerEntryDto, LedgerListResponse } from "../contracts/finance.contract";

const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const num = (v: Prisma.Decimal | number | null | undefined): number => (v == null ? 0 : typeof v === "number" ? v : Number(v));
function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

type Row = { id: string; ref: string | null; branchId: string; branch: { name: string } | null; category: string; description: string | null; party: string | null; amount: Prisma.Decimal; currency: string; baseAmount: Prisma.Decimal; method: string | null; status: string; date: Date; createdAt: Date };
function toDto(r: Row): LedgerEntryDto {
  return { id: r.id, ref: r.ref, branchId: r.branchId, branchName: r.branch?.name ?? null, category: r.category, description: r.description, party: r.party, amount: num(r.amount), currency: r.currency as LedgerEntryDto["currency"], baseAmount: num(r.baseAmount), method: r.method, status: r.status, date: dOnly(r.date)!, createdAt: dIso(r.createdAt)! };
}

function buildWhere<T extends { branchId?: unknown; date?: unknown; OR?: unknown; category?: unknown }>(auth: AuthCtx, q: LedgerListQuery): T {
  const where = { ...branchWhere(auth), deletedAt: null } as unknown as T;
  if (q.branchId && isGlobalRole(auth.role)) (where as { branchId?: string }).branchId = q.branchId;
  if (q.category) (where as { category?: unknown }).category = { contains: q.category, mode: "insensitive" };
  if (q.dateFrom || q.dateTo) {
    const d: Prisma.DateTimeFilter = {};
    if (q.dateFrom) d.gte = toDate(q.dateFrom)!;
    if (q.dateTo) d.lte = toDate(q.dateTo)!;
    (where as { date?: unknown }).date = d;
  }
  if (q.q) (where as { OR?: unknown }).OR = [{ ref: { contains: q.q, mode: "insensitive" } }, { description: { contains: q.q, mode: "insensitive" } }, { category: { contains: q.q, mode: "insensitive" } }];
  return where as unknown as T;
}

// ── expenses ──────────────────────────────────────────────────────────────────
export async function listExpenses(auth: AuthCtx, q: LedgerListQuery): Promise<LedgerListResponse> {
  const where = buildWhere<Prisma.ExpenseWhereInput>(auth, q);
  const [rows, total, agg] = await Promise.all([
    prisma.expense.findMany({ where, include: { branch: { select: { name: true } } }, orderBy: { date: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);
  return { data: rows.map((r) => toDto({ ...r, party: r.vendorName })), page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)), stats: { total, totalAmount: num(agg._sum.amount) } };
}
export async function createExpense(auth: AuthCtx, input: ExpenseCreateInput): Promise<LedgerEntryDto> {
  const branchId = resolveBranchId(auth, input.branchId);
  const m = money(input.amount, (input.currency as CurrencyCode) ?? "BDT", input.exchangeRate);
  const year = (toDate(input.date) ?? new Date()).getUTCFullYear();
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } });
  const id = await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "EXPENSE", branchId, year);
    const e = await tx.expense.create({ data: { ref: formatDocNo("EXP", branch.code, year, seq), branchId, category: input.category, description: input.description, vendorName: input.vendorName, supplierId: input.supplierId || null, accountId: input.accountId || null, amount: m.amount, currency: m.currency, exchangeRate: m.exchangeRate, baseAmount: m.baseAmount, method: input.method as PaymentMethod | undefined, status: "PENDING", date: toDate(input.date)!, createdById: auth.userId } });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "EXPENSE_CREATED", target: e.id, module: "accounts" } });
    return e.id;
  });
  const e = await prisma.expense.findUniqueOrThrow({ where: { id }, include: { branch: { select: { name: true } } } });
  return toDto({ ...e, party: e.vendorName });
}

// ── income ────────────────────────────────────────────────────────────────────
export async function listIncome(auth: AuthCtx, q: LedgerListQuery): Promise<LedgerListResponse> {
  const where = buildWhere<Prisma.IncomeWhereInput>(auth, q);
  const [rows, total, agg] = await Promise.all([
    prisma.income.findMany({ where, include: { branch: { select: { name: true } } }, orderBy: { date: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.income.count({ where }),
    prisma.income.aggregate({ where, _sum: { amount: true } }),
  ]);
  return { data: rows.map((r) => toDto({ ...r, party: r.payerName })), page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)), stats: { total, totalAmount: num(agg._sum.amount) } };
}
export async function createIncome(auth: AuthCtx, input: IncomeCreateInput): Promise<LedgerEntryDto> {
  const branchId = resolveBranchId(auth, input.branchId);
  const m = money(input.amount, (input.currency as CurrencyCode) ?? "BDT", input.exchangeRate);
  const year = (toDate(input.date) ?? new Date()).getUTCFullYear();
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } });
  const id = await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "INCOME", branchId, year);
    const e = await tx.income.create({ data: { ref: formatDocNo("INC", branch.code, year, seq), branchId, category: input.category, description: input.description, payerName: input.payerName, accountId: input.accountId || null, amount: m.amount, currency: m.currency, exchangeRate: m.exchangeRate, baseAmount: m.baseAmount, method: input.method as PaymentMethod | undefined, status: "PENDING", date: toDate(input.date)!, createdById: auth.userId } });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "INCOME_CREATED", target: e.id, module: "accounts" } });
    return e.id;
  });
  const e = await prisma.income.findUniqueOrThrow({ where: { id }, include: { branch: { select: { name: true } } } });
  return toDto({ ...e, party: e.payerName });
}
