/**
 * Shared Dashboard contract — the ERP admin overview (/erp home). Read-only
 * aggregation, no writes. zod query schema + inferred DTO types (frontend imports
 * these type-only).
 *
 * Correctness / reconciliation rules encoded here as documentation for the service:
 *   - The headline money & booking figures (kpis.revenue / bookings / expenses /
 *     netProfit), revenueTrend, serviceBreakdown and branchPerformance are the
 *     SAME numbers the Reports "overview" endpoint returns — the service delegates
 *     to report.overview() so the dashboard can never drift from Reports.
 *   - Money is aggregated in baseAmount (BDT); never the raw `amount`.
 *   - Branch scoping honours branchWhere(): a branch user sees only their branch;
 *     a global user may filter by branchId or see all.
 *   - Access is staff-only: the route requires the "dashboard" module at "manage"
 *     (RBAC access "full"), which every internal staff role holds and portal roles
 *     (customer/agent/supplier — access "view") do NOT, so branch aggregates never
 *     leak to a portal account.
 */
import { z } from "zod";
import { reportRangeSchema } from "./report.contract";
import type { AppliedRange, MonthlyPoint, ServiceSlice, BranchRow } from "./report.contract";

const optStr = z.string().trim().min(1).optional();

export const dashboardQuerySchema = z.object({
  range: reportRangeSchema.optional(), // preset; ignored if dateFrom/dateTo given
  dateFrom: optStr,                     // ISO yyyy-mm-dd — overrides range
  dateTo: optStr,
  branchId: optStr,                     // "all" or a branch id (global users only)
});
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

// ── KPI headline numbers ───────────────────────────────────────────────────────
export interface DashboardKpis {
  bookings: number;            // non-cancelled bookings placed in range (== overview.kpis.bookings)
  revenue: number;             // Σ baseAmount of issued invoices in range (== overview.kpis.revenue)
  expenses: number;            // Σ baseAmount of expenses in range (== overview.kpis.expenses)
  netProfit: number;           // revenue − expenses (== overview.kpis.netProfit)
  pendingDues: number;         // Σ (invoice.baseAmount − confirmed IN payments) of issued unpaid invoices (as-of, all-time)
  overdueCount: number;        // # issued unpaid invoices past their dueDate
  newLeads: number;            // leads created in range
  qualifiedLeads: number;      // leads currently in QUALIFIED stage
  wonLeads: number;            // leads currently in WON stage
  activeAgents: number;        // agents with status "active" (== Agents report activeAgents)
  upcomingDepartures: number;  // non-cancelled bookings departing today or later
  upcomingPilgrims: number;    // Σ travelersCount of those upcoming departures
}

export interface FunnelStage { stage: string; label: string; count: number }

export interface DashboardBooking {
  id: string;
  bookingNo: string | null;
  customerName: string | null;
  serviceType: string;
  packageName: string | null;
  branchName: string | null;
  agentName: string | null;
  departureDate: string | null; // yyyy-mm-dd or null
  date: string;                 // placed date (createdAt) yyyy-mm-dd
  amount: number;
  currency: string;
  baseAmount: number;
  status: string;
}

export interface DashboardActivity {
  id: string;
  action: string;
  module: string | null;
  target: string | null;
  actor: string | null;
  createdAt: string; // ISO
}

export interface DashboardTask {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueAt: string | null; // ISO or null
  category: string | null;
}

export interface DashboardSummary {
  applied: AppliedRange;
  kpis: DashboardKpis;
  revenueTrend: MonthlyPoint[];     // == overview.monthly
  serviceBreakdown: ServiceSlice[]; // == overview.serviceBreakdown
  branchPerformance: BranchRow[];   // == overview.branchBreakdown
  leadFunnel: FunnelStage[];
  recentBookings: DashboardBooking[];
  activity: DashboardActivity[];
  myTasks: DashboardTask[];
}
