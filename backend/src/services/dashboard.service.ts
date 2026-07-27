/**
 * Dashboard — the ERP admin overview (/erp home). Read-only aggregation.
 *
 * Reconciliation: the headline money/booking numbers, revenue trend, service
 * split and branch performance are delegated to report.overview() so the
 * dashboard can NEVER drift from the Reports module. The extra operational KPIs
 * (dues, leads, departures), the activity feed and my-tasks are computed here
 * with the same branch-scoping + baseAmount discipline.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthCtx, isGlobalRole } from "../middleware/auth";
import { overview } from "./report.service";
import type { ReportQuery } from "../contracts/report.contract";
import type {
  DashboardQuery, DashboardSummary, DashboardKpis, FunnelStage,
} from "../contracts/dashboard.contract";

const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : Number(d));
const round2 = (n: number) => Math.round(n * 100) / 100;
const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);

// Funnel display order (LOST is intentionally excluded — it is not a pipeline stage).
const FUNNEL: { stage: string; label: string }[] = [
  { stage: "NEW", label: "New Leads" },
  { stage: "QUALIFIED", label: "Qualified" },
  { stage: "PROPOSAL", label: "Proposal" },
  { stage: "NEGOTIATION", label: "Negotiation" },
  { stage: "WON", label: "Won" },
];

/** branchWhere() semantics, matching report.service's branchScope(): a scoped
 *  user is pinned to their branch; a global user may narrow to one branch. */
function scopeWhere(auth: AuthCtx, requested?: string): { branchId?: string } {
  if (!isGlobalRole(auth.role)) return { branchId: auth.branchId ?? "__no_branch__" };
  if (requested && requested !== "all") return { branchId: requested };
  return {};
}

/** Rebuild the [from, toExcl) window from the range the overview actually applied,
 *  so every "in range" count here uses the exact same window as the headline KPIs. */
function windowFromApplied(from: string | null, to: string | null): Prisma.DateTimeFilter | null {
  if (!from && !to) return null;
  const gte = from ? new Date(`${from}T00:00:00.000Z`) : undefined;
  const lt = to ? new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 86_400_000) : undefined;
  return { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) };
}

export async function getSummary(auth: AuthCtx, q: DashboardQuery): Promise<DashboardSummary> {
  // 1) Headline numbers + trend/breakdowns — delegated to Reports (single source of truth).
  const reportQ: ReportQuery = {
    range: q.range as ReportQuery["range"],
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    branchId: q.branchId,
  };
  const ov = await overview(auth, reportQ);

  const where = scopeWhere(auth, q.branchId);
  const win = windowFromApplied(ov.applied.from, ov.applied.to);
  const now = new Date();
  const startToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // 2) Operational aggregates (branch-scoped) computed in parallel.
  const [dueRows, funnelRows, newLeads, upcoming, activeAgents, activityRaw, taskRows, recent] =
    await Promise.all([
      // Outstanding dues (as-of; all-time, not range-bound). Currency-correct in baseAmount:
      // residual = invoice.baseAmount − Σ(confirmed IN payment.baseAmount).
      prisma.invoice.findMany({
        where: { ...where, status: { in: ["SENT", "PARTIAL", "OVERDUE"] }, deletedAt: null },
        select: {
          baseAmount: true,
          dueDate: true,
          payments: {
            where: { status: "CONFIRMED", direction: "IN", isReversed: false },
            select: { baseAmount: true },
          },
        },
      }),
      // Lead funnel — current pipeline by stage.
      prisma.lead.groupBy({ by: ["stage"], where: { ...where, deletedAt: null }, _count: { _all: true } }),
      // New leads created inside the applied window.
      prisma.lead.count({ where: { ...where, deletedAt: null, ...(win ? { createdAt: win } : {}) } }),
      // Upcoming departures — today or later, non-cancelled/non-draft.
      prisma.booking.findMany({
        where: { ...where, deletedAt: null, status: { notIn: ["DRAFT", "CANCELLED"] }, departureDate: { gte: startToday } },
        select: { travelersCount: true },
      }),
      // Active agents (matches Agents report: status active, not deleted).
      prisma.agent.count({ where: { deletedAt: null, status: "active" } }),
      // Recent activity (ActivityLog has no branch/user relation — resolve actors below).
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, userId: true, action: true, target: true, module: true, createdAt: true },
      }),
      // My open tasks (assigned to the signed-in user).
      prisma.task.findMany({
        where: { assigneeId: auth.userId, status: { not: "DONE" }, deletedAt: null },
        orderBy: [{ dueAt: "asc" }],
        take: 6,
        select: { id: true, title: true, priority: true, status: true, dueAt: true, category: true },
      }),
      // Recent bookings table (branch-scoped, non-draft).
      prisma.booking.findMany({
        where: { ...where, status: { not: "DRAFT" }, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true, bookingNo: true, createdAt: true, departureDate: true, serviceType: true, status: true,
          amount: true, currency: true, baseAmount: true,
          customer: { select: { name: true } },
          agent: { select: { name: true } },
          branch: { select: { name: true } },
          package: { select: { name: true } },
        },
      }),
    ]);

  // Dues + overdue count.
  let pendingDues = 0;
  let overdueCount = 0;
  for (const inv of dueRows) {
    const paid = inv.payments.reduce((s, p) => s + num(p.baseAmount), 0);
    const residual = num(inv.baseAmount) - paid;
    if (residual > 0.005) {
      pendingDues += residual;
      if (inv.dueDate && inv.dueDate < startToday) overdueCount++;
    }
  }

  // Funnel counts.
  const stageCount = new Map<string, number>();
  for (const r of funnelRows) stageCount.set(r.stage, r._count._all);
  const leadFunnel: FunnelStage[] = FUNNEL.map((f) => ({ ...f, count: stageCount.get(f.stage) ?? 0 }));

  // Resolve activity actors (name + branch) so the feed can be branch-scoped in-app.
  const actorIds = [...new Set(activityRaw.map((a) => a.userId).filter((v): v is string => !!v))];
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, branchId: true } })
    : [];
  const actorMap = new Map(actors.map((u) => [u.id, u]));
  const activity = activityRaw
    .filter((a) => !where.branchId || (a.userId != null && actorMap.get(a.userId)?.branchId === where.branchId))
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      action: a.action,
      module: a.module,
      target: a.target,
      actor: a.userId ? actorMap.get(a.userId)?.name ?? null : null,
      createdAt: a.createdAt.toISOString(),
    }));

  const kpis: DashboardKpis = {
    bookings: ov.kpis.bookings,
    revenue: ov.kpis.revenue,
    expenses: ov.kpis.expenses,
    netProfit: ov.kpis.netProfit,
    pendingDues: round2(pendingDues),
    overdueCount,
    newLeads,
    qualifiedLeads: stageCount.get("QUALIFIED") ?? 0,
    wonLeads: stageCount.get("WON") ?? 0,
    activeAgents,
    upcomingDepartures: upcoming.length,
    upcomingPilgrims: upcoming.reduce((s, b) => s + (b.travelersCount ?? 0), 0),
  };

  return {
    applied: ov.applied,
    kpis,
    revenueTrend: ov.monthly,
    serviceBreakdown: ov.serviceBreakdown,
    branchPerformance: ov.branchBreakdown,
    leadFunnel,
    recentBookings: recent.map((b) => ({
      id: b.id,
      bookingNo: b.bookingNo,
      customerName: b.customer?.name ?? null,
      serviceType: b.serviceType,
      packageName: b.package?.name ?? null,
      branchName: b.branch?.name ?? null,
      agentName: b.agent?.name ?? null,
      departureDate: dOnly(b.departureDate),
      date: b.createdAt.toISOString().slice(0, 10),
      amount: num(b.amount),
      currency: b.currency,
      baseAmount: num(b.baseAmount),
      status: b.status,
    })),
    activity,
    myTasks: taskRows.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      dueAt: t.dueAt ? t.dueAt.toISOString() : null,
      category: t.category,
    })),
  };
}
