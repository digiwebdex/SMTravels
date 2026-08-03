/**
 * Shared Reports & Analytics contract. Read-only aggregation — no writes.
 * zod query schema + inferred DTO types (frontend imports these type-only).
 *
 * Correctness rules encoded here as documentation for the service:
 *   - Money is aggregated in baseAmount (BDT). Never sum raw `amount` across
 *     mixed currencies.
 *   - Financial reports (P&L, Balance Sheet, Cash Flow) derive from POSTED
 *     journal entries only; a reversed entry + its mirror net to zero.
 *   - Each report filters on its own business date: bookings→createdAt (placed),
 *     invoices→issueDate, journals→date, expenses/income→date.
 *   - Branch-scoped reports honour branchWhere(): a branch user sees only their
 *     branch; a global user may filter by branchId or see all.
 */
import { z } from "zod";

const optStr = z.string().trim().min(1).optional();

export const reportRangeSchema = z.enum([
  "this-month", "last-month", "q1", "q2", "q3", "q4", "ytd", "last-year", "all",
]);
export const serviceTypeSchema = z.enum(["HAJJ", "UMRAH", "VISA", "AIR_TICKET", "MANPOWER", "TOUR", "HOTEL"]);

export const reportQuerySchema = z.object({
  range: reportRangeSchema.optional(),       // preset; ignored if dateFrom/dateTo given
  dateFrom: optStr,                          // ISO yyyy-mm-dd — overrides range
  dateTo: optStr,
  branchId: optStr,                          // "all" or a branch id (global users only)
  serviceType: serviceTypeSchema.optional(),
  agentId: optStr,
});
export type ReportQuery = z.infer<typeof reportQuerySchema>;

export const exportQuerySchema = reportQuerySchema.extend({
  report: z.enum([
    "sales",
    "bookings",
    "agents",
    "pnl",
    "expenses",
    "income",
    "customers",
    "notifications",
    "visa",
    "hajj",
    "umrah",
  ]),
  format: z.enum(["csv", "xlsx", "pdf"]).default("csv"),
});
export type ExportQuery = z.infer<typeof exportQuerySchema>;

// ── shared shapes ─────────────────────────────────────────────────────────────
export interface MonthlyPoint { ym: string; month: string; revenue: number; expense: number; bookings: number }
export interface ServiceSlice { service: string; label: string; count: number; revenue: number; pct: number }
export interface BranchRow { branchId: string; branchName: string; bookings: number; revenue: number }
export interface AppliedRange { from: string | null; to: string | null; label: string; branchId: string | null; scoped: boolean }

// ── overview ──────────────────────────────────────────────────────────────────
export interface OverviewReport {
  applied: AppliedRange;
  kpis: { revenue: number; bookings: number; expenses: number; netProfit: number };
  monthly: MonthlyPoint[];
  serviceBreakdown: ServiceSlice[];
  branchBreakdown: BranchRow[];
}

// ── sales (invoice-sourced) ───────────────────────────────────────────────────
export interface SalesReport {
  applied: AppliedRange;
  totalRevenue: number;   // Σ baseAmount of issued invoices (SENT/PARTIAL/PAID)
  totalCollected: number; // Σ paidAmount
  invoiceCount: number;
  avgValue: number;
  monthly: MonthlyPoint[];
  byService: ServiceSlice[];
  // transparency for the mixed-currency invariant:
  rawAmountTotal: number; // Σ raw total (WRONG across currencies) — for the report to warn on
}

// ── bookings ──────────────────────────────────────────────────────────────────
export interface BookingRow {
  id: string; bookingNo: string | null; date: string; customerName: string | null;
  serviceType: string; branchName: string | null; agentName: string | null;
  amount: number; currency: string; baseAmount: number; status: string;
}
export interface BookingsReport {
  applied: AppliedRange;
  total: number; confirmed: number; pending: number; cancelled: number;
  totalValue: number;      // Σ baseAmount (non-draft)
  rawAmountTotal: number;  // Σ raw amount (WRONG across currencies)
  byService: { service: string; count: number; value: number }[];
  byStatus: { status: string; count: number }[];
  rows: BookingRow[];
}

// ── agents ────────────────────────────────────────────────────────────────────
export interface AgentRow { agentId: string; name: string; bookings: number; revenue: number; commission: number; status: string }
export interface AgentsReport {
  applied: AppliedRange;
  activeAgents: number; totalBookings: number; totalRevenue: number; totalCommission: number;
  agents: AgentRow[];
}

// ── service report (hajj / umrah / visa / manpower / …) ───────────────────────
export interface ServiceReport {
  applied: AppliedRange;
  serviceType: string;
  totalBookings: number; confirmed: number; pending: number; totalRevenue: number; travelers: number;
  monthly: MonthlyPoint[];
  byStatus: { status: string; count: number }[];
  byBranch: BranchRow[];
}

// ── financial (posted-journal sourced) ────────────────────────────────────────
export interface PnlLine { code: string; name: string; accountClass: string; amount: number }
export interface PnlReport {
  applied: AppliedRange;
  revenue: number; expense: number; grossProfit: number; netProfit: number; netMargin: number;
  monthly: { ym: string; month: string; revenue: number; expense: number }[];
  revenueLines: PnlLine[];
  expenseLines: PnlLine[];
}
export interface AcctBalance { code: string; name: string; balance: number }
export interface BalanceSheetReport {
  applied: AppliedRange;
  assets: AcctBalance[]; liabilities: AcctBalance[]; equity: AcctBalance[];
  totalAssets: number; totalLiabilities: number; totalEquity: number;
  capital: number; retainedEarnings: number;
  balanced: boolean; imbalance: number;
}
export interface CashFlowMonth { ym: string; month: string; operating: number; investing: number; financing: number; net: number; balance: number }
export interface CashFlowReport {
  applied: AppliedRange;
  monthly: CashFlowMonth[];
  totalOperating: number; totalInvesting: number; totalFinancing: number; netChange: number;
  note: string;
}
