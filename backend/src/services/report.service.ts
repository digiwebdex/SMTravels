/**
 * Reports & Analytics — read-only aggregation. No writes, no transactions.
 *
 * Correctness guarantees:
 *  - Money is summed in baseAmount (BDT) so mixed-currency rows aggregate right.
 *  - Financial reports (P&L, Balance Sheet, Cash Flow) sum POSTED journal lines
 *    only; a reversed entry + its mirror are both POSTED and cancel to zero.
 *  - Each report filters on its own business date (bookings→createdAt,
 *    invoices→issueDate, journals→date, expense/income→date).
 *  - branchScope() honours branchWhere(): a branch user is pinned to their branch.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthCtx, isGlobalRole } from "../middleware/auth";
import type {
  ReportQuery, AppliedRange, OverviewReport, SalesReport, BookingsReport,
  AgentsReport, ServiceReport, PnlReport, BalanceSheetReport, CashFlowReport,
  MonthlyPoint, ServiceSlice,
} from "../contracts/report.contract";

const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : Number(d));
const round2 = (n: number) => Math.round(n * 100) / 100;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SERVICE_LABEL: Record<string, string> = {
  HAJJ: "Hajj", UMRAH: "Umrah", VISA: "Visa", AIR_TICKET: "Air Ticket", MANPOWER: "Manpower", TOUR: "Tour", HOTEL: "Hotel",
};
const ymOf = (d: Date): string => d.toISOString().slice(0, 7);
const monthLabel = (ym: string): string => MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym;

// ── date range resolution (business-date presets, relative to now) ────────────
interface Range { from: Date | null; toExcl: Date | null; label: string }
function resolveRange(q: ReportQuery): Range {
  if (q.dateFrom || q.dateTo) {
    const from = q.dateFrom ? new Date(`${q.dateFrom}T00:00:00.000Z`) : null;
    const toExcl = q.dateTo ? new Date(new Date(`${q.dateTo}T00:00:00.000Z`).getTime() + 86_400_000) : null;
    return { from, toExcl, label: `${q.dateFrom ?? "…"} → ${q.dateTo ?? "…"}` };
  }
  const now = new Date();
  const y = now.getUTCFullYear();
  const utc = (yy: number, mm: number, dd: number) => new Date(Date.UTC(yy, mm, dd));
  const tomorrow = utc(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  switch (q.range) {
    case "this-month": return { from: utc(y, now.getUTCMonth(), 1), toExcl: utc(y, now.getUTCMonth() + 1, 1), label: `${MONTHS[now.getUTCMonth()]} ${y}` };
    case "last-month": { const m = now.getUTCMonth(); return { from: utc(y, m - 1, 1), toExcl: utc(y, m, 1), label: `${MONTHS[(m + 11) % 12]} ${m === 0 ? y - 1 : y}` }; }
    case "q1": return { from: utc(y, 0, 1), toExcl: utc(y, 3, 1), label: `Q1 ${y}` };
    case "q2": return { from: utc(y, 3, 1), toExcl: utc(y, 6, 1), label: `Q2 ${y}` };
    case "q3": return { from: utc(y, 6, 1), toExcl: utc(y, 9, 1), label: `Q3 ${y}` };
    case "q4": return { from: utc(y, 9, 1), toExcl: utc(y, 12, 1), label: `Q4 ${y}` };
    case "last-year": return { from: utc(y - 1, 0, 1), toExcl: utc(y, 0, 1), label: `${y - 1}` };
    case "all": return { from: null, toExcl: null, label: "All time" };
    case "ytd":
    default: return { from: utc(y, 0, 1), toExcl: tomorrow, label: `YTD ${y}` };
  }
}
const dateFilter = (r: Range): Prisma.DateTimeFilter | undefined =>
  r.from || r.toExcl ? { ...(r.from ? { gte: r.from } : {}), ...(r.toExcl ? { lt: r.toExcl } : {}) } : undefined;

// ── branch scoping (branchWhere semantics for reports) ────────────────────────
interface Scope { where: { branchId?: string }; branchId: string | null; scoped: boolean }
function branchScope(auth: AuthCtx, requested?: string): Scope {
  if (!isGlobalRole(auth.role)) {
    const bid = auth.branchId ?? "__no_branch__";
    return { where: { branchId: bid }, branchId: bid, scoped: true };
  }
  if (requested && requested !== "all") return { where: { branchId: requested }, branchId: requested, scoped: false };
  return { where: {}, branchId: null, scoped: false };
}

let branchNameCache: Map<string, string> | null = null;
async function branchNames(): Promise<Map<string, string>> {
  if (!branchNameCache) {
    const rows = await prisma.branch.findMany({ select: { id: true, name: true } });
    branchNameCache = new Map(rows.map((b) => [b.id, b.name]));
  }
  return branchNameCache;
}

function applied(r: Range, scope: Scope): AppliedRange {
  const toDisplay = r.toExcl ? new Date(r.toExcl.getTime() - 86_400_000).toISOString().slice(0, 10) : null;
  return {
    from: r.from ? r.from.toISOString().slice(0, 10) : null,
    to: toDisplay,
    label: r.label,
    branchId: scope.branchId,
    scoped: scope.scoped,
  };
}

// group helper → sorted monthly buckets
function monthlyMerge(seed: Map<string, { revenue: number; expense: number; bookings: number }>): MonthlyPoint[] {
  return [...seed.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, v]) => ({ ym, month: monthLabel(ym), revenue: round2(v.revenue), expense: round2(v.expense), bookings: v.bookings }));
}
const bucket = (m: Map<string, { revenue: number; expense: number; bookings: number }>, ym: string) => {
  let b = m.get(ym);
  if (!b) { b = { revenue: 0, expense: 0, bookings: 0 }; m.set(ym, b); }
  return b;
};

const ISSUED: Prisma.InvoiceWhereInput = { status: { in: ["SENT", "PARTIAL", "PAID"] }, deletedAt: null };

// ═══════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════
export async function overview(auth: AuthCtx, q: ReportQuery): Promise<OverviewReport> {
  const r = resolveRange(q);
  const scope = branchScope(auth, q.branchId);
  const names = await branchNames();
  const df = dateFilter(r);

  const invoices = await prisma.invoice.findMany({
    where: { ...scope.where, ...ISSUED, ...(df ? { issueDate: df } : {}) },
    select: { baseAmount: true, issueDate: true },
  });
  const bookings = await prisma.booking.findMany({
    where: { ...scope.where, status: { not: "DRAFT" }, deletedAt: null, ...(df ? { createdAt: df } : {}), ...(q.serviceType ? { serviceType: q.serviceType } : {}) },
    select: { baseAmount: true, createdAt: true, serviceType: true, branchId: true, status: true },
  });
  const expenses = await prisma.expense.findMany({
    where: { ...scope.where, deletedAt: null, ...(df ? { date: df } : {}) },
    select: { baseAmount: true, date: true },
  });

  const revenue = invoices.reduce((s, i) => s + num(i.baseAmount), 0);
  const expenseTotal = expenses.reduce((s, e) => s + num(e.baseAmount), 0);

  const mm = new Map<string, { revenue: number; expense: number; bookings: number }>();
  for (const i of invoices) if (i.issueDate) bucket(mm, ymOf(i.issueDate)).revenue += num(i.baseAmount);
  for (const e of expenses) bucket(mm, ymOf(e.date)).expense += num(e.baseAmount);
  for (const b of bookings) bucket(mm, ymOf(b.createdAt)).bookings += 1;

  // service breakdown (bookings, non-cancelled)
  const svc = new Map<string, { count: number; revenue: number }>();
  for (const b of bookings) {
    if (b.status === "CANCELLED") continue;
    const s = svc.get(b.serviceType) ?? { count: 0, revenue: 0 };
    s.count += 1; s.revenue += num(b.baseAmount); svc.set(b.serviceType, s);
  }
  const svcTotal = [...svc.values()].reduce((s, v) => s + v.revenue, 0) || 1;
  const serviceBreakdown: ServiceSlice[] = [...svc.entries()]
    .map(([service, v]) => ({ service, label: SERVICE_LABEL[service] ?? service, count: v.count, revenue: round2(v.revenue), pct: round2((v.revenue / svcTotal) * 100) }))
    .sort((a, b) => b.revenue - a.revenue);

  // branch breakdown
  const br = new Map<string, { bookings: number; revenue: number }>();
  for (const b of bookings) {
    if (b.status === "CANCELLED") continue;
    const s = br.get(b.branchId) ?? { bookings: 0, revenue: 0 };
    s.bookings += 1; s.revenue += num(b.baseAmount); br.set(b.branchId, s);
  }
  const branchBreakdown = [...br.entries()]
    .map(([branchId, v]) => ({ branchId, branchName: names.get(branchId) ?? branchId, bookings: v.bookings, revenue: round2(v.revenue) }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    applied: applied(r, scope),
    kpis: { revenue: round2(revenue), bookings: bookings.filter((b) => b.status !== "CANCELLED").length, expenses: round2(expenseTotal), netProfit: round2(revenue - expenseTotal) },
    monthly: monthlyMerge(mm),
    serviceBreakdown,
    branchBreakdown,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SALES (invoice-sourced, issueDate)
// ═══════════════════════════════════════════════════════════════════════════
export async function sales(auth: AuthCtx, q: ReportQuery): Promise<SalesReport> {
  const r = resolveRange(q);
  const scope = branchScope(auth, q.branchId);
  const df = dateFilter(r);

  const invoices = await prisma.invoice.findMany({
    where: {
      ...scope.where, ...ISSUED, ...(df ? { issueDate: df } : {}),
      ...(q.serviceType ? { booking: { serviceType: q.serviceType } } : {}),
    },
    select: { baseAmount: true, paidAmount: true, total: true, issueDate: true, booking: { select: { serviceType: true } } },
  });

  const totalRevenue = invoices.reduce((s, i) => s + num(i.baseAmount), 0);
  const totalCollected = invoices.reduce((s, i) => s + num(i.paidAmount), 0);
  const rawAmountTotal = invoices.reduce((s, i) => s + num(i.total), 0); // WRONG across currencies

  const mm = new Map<string, { revenue: number; expense: number; bookings: number }>();
  for (const i of invoices) if (i.issueDate) bucket(mm, ymOf(i.issueDate)).revenue += num(i.baseAmount);

  const svc = new Map<string, { count: number; revenue: number }>();
  for (const i of invoices) {
    const key = i.booking?.serviceType ?? "OTHER";
    const s = svc.get(key) ?? { count: 0, revenue: 0 };
    s.count += 1; s.revenue += num(i.baseAmount); svc.set(key, s);
  }
  const svcTotal = totalRevenue || 1;
  const byService: ServiceSlice[] = [...svc.entries()]
    .map(([service, v]) => ({ service, label: SERVICE_LABEL[service] ?? "Other", count: v.count, revenue: round2(v.revenue), pct: round2((v.revenue / svcTotal) * 100) }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    applied: applied(r, scope),
    totalRevenue: round2(totalRevenue),
    totalCollected: round2(totalCollected),
    invoiceCount: invoices.length,
    avgValue: invoices.length ? round2(totalRevenue / invoices.length) : 0,
    monthly: monthlyMerge(mm),
    byService,
    rawAmountTotal: round2(rawAmountTotal),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOKINGS (booking-sourced, createdAt = placed date)
// ═══════════════════════════════════════════════════════════════════════════
export async function bookings(auth: AuthCtx, q: ReportQuery): Promise<BookingsReport> {
  const r = resolveRange(q);
  const scope = branchScope(auth, q.branchId);
  const names = await branchNames();
  const df = dateFilter(r);

  const rows = await prisma.booking.findMany({
    where: {
      ...scope.where, status: { not: "DRAFT" }, deletedAt: null,
      ...(df ? { createdAt: df } : {}), ...(q.serviceType ? { serviceType: q.serviceType } : {}), ...(q.agentId ? { agentId: q.agentId } : {}),
    },
    select: {
      id: true, bookingNo: true, createdAt: true, serviceType: true, status: true, branchId: true,
      amount: true, currency: true, baseAmount: true,
      customer: { select: { name: true } }, agent: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = rows.filter((b) => b.status !== "CANCELLED");
  const totalValue = active.reduce((s, b) => s + num(b.baseAmount), 0);
  const rawAmountTotal = active.reduce((s, b) => s + num(b.amount), 0); // WRONG across currencies

  const svc = new Map<string, { count: number; value: number }>();
  for (const b of active) { const s = svc.get(b.serviceType) ?? { count: 0, value: 0 }; s.count += 1; s.value += num(b.baseAmount); svc.set(b.serviceType, s); }
  const statusMap = new Map<string, number>();
  for (const b of rows) statusMap.set(b.status, (statusMap.get(b.status) ?? 0) + 1);

  return {
    applied: applied(r, scope),
    total: rows.length,
    confirmed: statusMap.get("CONFIRMED") ?? 0,
    pending: (statusMap.get("PENDING") ?? 0) + (statusMap.get("PROCESSING") ?? 0) + (statusMap.get("ON_HOLD") ?? 0),
    cancelled: statusMap.get("CANCELLED") ?? 0,
    totalValue: round2(totalValue),
    rawAmountTotal: round2(rawAmountTotal),
    byService: [...svc.entries()].map(([service, v]) => ({ service: SERVICE_LABEL[service] ?? service, count: v.count, value: round2(v.value) })).sort((a, b) => b.value - a.value),
    byStatus: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
    rows: rows.slice(0, 100).map((b) => ({
      id: b.id, bookingNo: b.bookingNo, date: b.createdAt.toISOString().slice(0, 10),
      customerName: b.customer?.name ?? null, serviceType: b.serviceType, branchName: names.get(b.branchId) ?? null,
      agentName: b.agent?.name ?? null, amount: num(b.amount), currency: b.currency, baseAmount: num(b.baseAmount), status: b.status,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENTS
// ═══════════════════════════════════════════════════════════════════════════
export async function agents(auth: AuthCtx, q: ReportQuery): Promise<AgentsReport> {
  const r = resolveRange(q);
  const scope = branchScope(auth, q.branchId);
  const df = dateFilter(r);

  const agentRows = await prisma.agent.findMany({ where: { deletedAt: null }, select: { id: true, name: true, status: true } });
  const bookingRows = await prisma.booking.findMany({
    where: { ...scope.where, agentId: { not: null }, status: { not: "DRAFT" }, deletedAt: null, ...(df ? { createdAt: df } : {}) },
    select: { agentId: true, baseAmount: true, status: true },
  });
  const commissionRows = await prisma.agentCommission.findMany({ where: { deletedAt: null }, select: { agentId: true, baseAmount: true } });

  const bookAgg = new Map<string, { bookings: number; revenue: number }>();
  for (const b of bookingRows) {
    if (!b.agentId || b.status === "CANCELLED") continue;
    const s = bookAgg.get(b.agentId) ?? { bookings: 0, revenue: 0 };
    s.bookings += 1; s.revenue += num(b.baseAmount); bookAgg.set(b.agentId, s);
  }
  const commAgg = new Map<string, number>();
  for (const c of commissionRows) commAgg.set(c.agentId, (commAgg.get(c.agentId) ?? 0) + num(c.baseAmount));

  const list = agentRows.map((a) => ({
    agentId: a.id, name: a.name, status: a.status,
    bookings: bookAgg.get(a.id)?.bookings ?? 0,
    revenue: round2(bookAgg.get(a.id)?.revenue ?? 0),
    commission: round2(commAgg.get(a.id) ?? 0),
  })).sort((x, y) => y.revenue - x.revenue);

  return {
    applied: applied(r, scope),
    activeAgents: agentRows.filter((a) => a.status === "active").length,
    totalBookings: list.reduce((s, a) => s + a.bookings, 0),
    totalRevenue: round2(list.reduce((s, a) => s + a.revenue, 0)),
    totalCommission: round2(list.reduce((s, a) => s + a.commission, 0)),
    agents: list,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE REPORT (hajj / umrah / visa / manpower / …)
// ═══════════════════════════════════════════════════════════════════════════
export async function serviceReport(auth: AuthCtx, type: string, q: ReportQuery): Promise<ServiceReport> {
  const r = resolveRange(q);
  const scope = branchScope(auth, q.branchId);
  const names = await branchNames();
  const df = dateFilter(r);

  const rows = await prisma.booking.findMany({
    where: { ...scope.where, serviceType: type as never, status: { not: "DRAFT" }, deletedAt: null, ...(df ? { createdAt: df } : {}) },
    select: { createdAt: true, status: true, branchId: true, baseAmount: true, travelersCount: true },
  });

  const active = rows.filter((b) => b.status !== "CANCELLED");
  const mm = new Map<string, { revenue: number; expense: number; bookings: number }>();
  for (const b of active) { const bk = bucket(mm, ymOf(b.createdAt)); bk.revenue += num(b.baseAmount); bk.bookings += 1; }
  const statusMap = new Map<string, number>();
  for (const b of rows) statusMap.set(b.status, (statusMap.get(b.status) ?? 0) + 1);
  const brMap = new Map<string, { bookings: number; revenue: number }>();
  for (const b of active) { const s = brMap.get(b.branchId) ?? { bookings: 0, revenue: 0 }; s.bookings += 1; s.revenue += num(b.baseAmount); brMap.set(b.branchId, s); }

  return {
    applied: applied(r, scope),
    serviceType: type,
    totalBookings: rows.length,
    confirmed: statusMap.get("CONFIRMED") ?? 0,
    pending: (statusMap.get("PENDING") ?? 0) + (statusMap.get("PROCESSING") ?? 0) + (statusMap.get("ON_HOLD") ?? 0),
    totalRevenue: round2(active.reduce((s, b) => s + num(b.baseAmount), 0)),
    travelers: active.reduce((s, b) => s + (b.travelersCount ?? 0), 0),
    monthly: monthlyMerge(mm),
    byStatus: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
    byBranch: [...brMap.entries()].map(([branchId, v]) => ({ branchId, branchName: names.get(branchId) ?? branchId, bookings: v.bookings, revenue: round2(v.revenue) })).sort((a, b) => b.revenue - a.revenue),
  };
}

// ── posted-journal line fetch (shared by financial reports) ───────────────────
interface PostedLine { debit: number; credit: number; cls: string; code: string; name: string; date: Date }
async function postedLines(scope: Scope, opts: { df?: Prisma.DateTimeFilter; toExcl?: Date | null }): Promise<PostedLine[]> {
  const entryWhere: Prisma.JournalEntryWhereInput = {
    status: "POSTED",
    ...(scope.where.branchId ? { branchId: scope.where.branchId } : {}),
    ...(opts.df ? { date: opts.df } : opts.toExcl ? { date: { lt: opts.toExcl } } : {}),
  };
  const lines = await prisma.journalLine.findMany({
    where: { entry: entryWhere },
    select: { debit: true, credit: true, entry: { select: { date: true } }, account: { select: { accountClass: true, code: true, name: true } } },
  });
  return lines.map((l) => ({ debit: num(l.debit), credit: num(l.credit), cls: l.account.accountClass, code: l.account.code, name: l.account.name, date: l.entry!.date }));
}

// ═══════════════════════════════════════════════════════════════════════════
// P&L (POSTED journals; reversed pair nets to zero)
// ═══════════════════════════════════════════════════════════════════════════
export async function pnl(auth: AuthCtx, q: ReportQuery): Promise<PnlReport> {
  const r = resolveRange(q);
  const scope = branchScope(auth, q.branchId);
  const lines = await postedLines(scope, { df: dateFilter(r) });

  let revenue = 0, expense = 0;
  const revAcct = new Map<string, { name: string; amount: number }>();
  const expAcct = new Map<string, { name: string; amount: number }>();
  const mm = new Map<string, { revenue: number; expense: number }>();
  const mBucket = (ym: string) => { let b = mm.get(ym); if (!b) { b = { revenue: 0, expense: 0 }; mm.set(ym, b); } return b; };

  for (const l of lines) {
    const ym = ymOf(l.date);
    if (l.cls === "REVENUE") {
      const v = l.credit - l.debit; revenue += v;
      const a = revAcct.get(l.code) ?? { name: l.name, amount: 0 }; a.amount += v; revAcct.set(l.code, a);
      mBucket(ym).revenue += v;
    } else if (l.cls === "EXPENSE") {
      const v = l.debit - l.credit; expense += v;
      const a = expAcct.get(l.code) ?? { name: l.name, amount: 0 }; a.amount += v; expAcct.set(l.code, a);
      mBucket(ym).expense += v;
    }
  }
  const netProfit = revenue - expense;
  return {
    applied: applied(r, scope),
    revenue: round2(revenue), expense: round2(expense),
    grossProfit: round2(netProfit), netProfit: round2(netProfit),
    netMargin: revenue ? round2((netProfit / revenue) * 100) : 0,
    monthly: [...mm.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([ym, v]) => ({ ym, month: monthLabel(ym), revenue: round2(v.revenue), expense: round2(v.expense) })),
    revenueLines: [...revAcct.entries()].map(([code, v]) => ({ code, name: v.name, accountClass: "REVENUE", amount: round2(v.amount) })).sort((a, b) => b.amount - a.amount),
    expenseLines: [...expAcct.entries()].map(([code, v]) => ({ code, name: v.name, accountClass: "EXPENSE", amount: round2(v.amount) })).sort((a, b) => b.amount - a.amount),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BALANCE SHEET (cumulative posted balances as-of period end)
// ═══════════════════════════════════════════════════════════════════════════
export async function balanceSheet(auth: AuthCtx, q: ReportQuery): Promise<BalanceSheetReport> {
  const r = resolveRange(q);
  const scope = branchScope(auth, q.branchId);
  const lines = await postedLines(scope, { toExcl: r.toExcl });

  const assetA = new Map<string, { name: string; balance: number }>();
  const liabA = new Map<string, { name: string; balance: number }>();
  const eqA = new Map<string, { name: string; balance: number }>();
  let retained = 0;
  const add = (m: Map<string, { name: string; balance: number }>, code: string, name: string, v: number) => {
    const a = m.get(code) ?? { name, balance: 0 }; a.balance += v; m.set(code, a);
  };
  for (const l of lines) {
    if (l.cls === "ASSET") add(assetA, l.code, l.name, l.debit - l.credit);
    else if (l.cls === "LIABILITY") add(liabA, l.code, l.name, l.credit - l.debit);
    else if (l.cls === "EQUITY") add(eqA, l.code, l.name, l.credit - l.debit);
    else if (l.cls === "REVENUE") retained += l.credit - l.debit;
    else if (l.cls === "EXPENSE") retained -= l.debit - l.credit;
  }
  const shape = (m: Map<string, { name: string; balance: number }>) =>
    [...m.entries()].map(([code, v]) => ({ code, name: v.name, balance: round2(v.balance) })).sort((a, b) => a.code.localeCompare(b.code));
  const totalAssets = [...assetA.values()].reduce((s, v) => s + v.balance, 0);
  const totalLiabilities = [...liabA.values()].reduce((s, v) => s + v.balance, 0);
  const capital = [...eqA.values()].reduce((s, v) => s + v.balance, 0);
  const totalEquity = capital + retained;
  const imbalance = totalAssets - (totalLiabilities + totalEquity);
  return {
    applied: applied(r, scope),
    assets: shape(assetA), liabilities: shape(liabA),
    equity: [...shape(eqA), { code: "RE", name: "Retained Earnings (period)", balance: round2(retained) }],
    totalAssets: round2(totalAssets), totalLiabilities: round2(totalLiabilities), totalEquity: round2(totalEquity),
    capital: round2(capital), retainedEarnings: round2(retained),
    balanced: Math.abs(imbalance) < 0.01, imbalance: round2(imbalance),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CASH FLOW (net movement on cash/bank accounts from posted journals)
// ═══════════════════════════════════════════════════════════════════════════
export async function cashFlow(auth: AuthCtx, q: ReportQuery): Promise<CashFlowReport> {
  const r = resolveRange(q);
  const scope = branchScope(auth, q.branchId);

  // cash/bank COA accounts = those linked from a BankAccount
  const banks = await prisma.bankAccount.findMany({ where: { coaAccountId: { not: null } }, select: { coaAccountId: true } });
  const cashCodesRows = await prisma.account.findMany({ where: { id: { in: banks.map((b) => b.coaAccountId!).filter(Boolean) } }, select: { code: true } });
  const cashCodes = new Set(cashCodesRows.map((a) => a.code));

  // fetch entries in range with all lines so each cash movement can be classified by its counter leg
  const entries = await prisma.journalEntry.findMany({
    where: { status: "POSTED", ...(scope.where.branchId ? { branchId: scope.where.branchId } : {}), ...(dateFilter(r) ? { date: dateFilter(r) } : {}) },
    select: { date: true, lines: { select: { debit: true, credit: true, account: { select: { code: true, accountClass: true } } } } },
  });

  const mm = new Map<string, { operating: number; investing: number; financing: number }>();
  const mBucket = (ym: string) => { let b = mm.get(ym); if (!b) { b = { operating: 0, investing: 0, financing: 0 }; mm.set(ym, b); } return b; };
  for (const e of entries) {
    const cashLegs = e.lines.filter((l) => cashCodes.has(l.account.code));
    if (!cashLegs.length) continue;
    const cashDelta = cashLegs.reduce((s, l) => s + num(l.debit) - num(l.credit), 0); // + inflow
    // classify by dominant non-cash counter leg
    const counters = e.lines.filter((l) => !cashCodes.has(l.account.code));
    const cls = counters[0]?.account.accountClass ?? "REVENUE";
    const kind = cls === "EQUITY" ? "financing" : cls === "ASSET" ? "investing" : "operating"; // ASSET counter = non-cash asset (e.g. fixed) → investing
    mBucket(ymOf(e.date))[kind] += cashDelta;
  }

  let running = 0;
  const monthly = [...mm.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([ym, v]) => {
    const net = v.operating + v.investing + v.financing;
    running += net;
    return { ym, month: monthLabel(ym), operating: round2(v.operating), investing: round2(v.investing), financing: round2(v.financing), net: round2(net), balance: round2(running) };
  });
  const sum = (k: "operating" | "investing" | "financing") => round2(monthly.reduce((s, m) => s + m[k], 0));
  return {
    applied: applied(r, scope),
    monthly,
    totalOperating: sum("operating"), totalInvesting: sum("investing"), totalFinancing: sum("financing"),
    netChange: round2(monthly.reduce((s, m) => s + m.net, 0)),
    note: "Net cash movement on cash/bank accounts from POSTED journals, classified by each entry's counter-account class. Investing/financing appear only where the COA carries fixed-asset / equity counter legs.",
  };
}

/** Customer list report (branch-scoped). */
export async function customersReport(auth: AuthCtx, q: ReportQuery) {
  const r = resolveRange(q);
  const scope = branchScope(auth, q.branchId);
  const df = dateFilter(r);
  const rows = await prisma.customer.findMany({
    where: { ...scope.where, deletedAt: null, ...(df ? { createdAt: df } : {}) },
    select: { name: true, phone: true, email: true, createdAt: true, branchId: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  return {
    applied: applied(r, scope),
    total: rows.length,
    rows: rows.map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email,
      date: c.createdAt.toISOString().slice(0, 10),
      branchId: c.branchId,
    })),
  };
}

/** Outbound notification channel stats. */
export async function notificationsReport(auth: AuthCtx, q: ReportQuery) {
  void auth;
  const r = resolveRange(q);
  const df = dateFilter(r);
  const rows = await prisma.outboundNotification.groupBy({
    by: ["channel", "status"],
    where: df ? { createdAt: df } : {},
    _count: { _all: true },
  });
  return {
    applied: applied(r, { where: {}, branchId: null, scoped: false }),
    rows: rows.map((x) => ({ channel: x.channel, status: x.status, count: x._count._all })),
  };
}
