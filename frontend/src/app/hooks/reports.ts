import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, getAccessToken } from "../lib/api";
import { API_BASE_URL } from "../lib/config";
import { useBranches } from "./bookings";
import type {
  OverviewReport, SalesReport, BookingsReport, AgentsReport,
  ServiceReport, PnlReport, BalanceSheetReport, CashFlowReport,
} from "@contracts/report.contract";

export { useBranches };

/** Filters as the UI holds them; mapped to the backend query here. */
export interface ReportFilters {
  range?: string;      // this-month | last-month | q1..q4 | ytd | last-year | all
  branchId?: string;   // "all" or a branch id
  serviceType?: string;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function qs(p: Record<string, string | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v && v !== "all" && v !== "All") s.set(k, v);
  return s.toString();
}
const buildQuery = (f: ReportFilters): string =>
  qs({ range: f.range, branchId: f.branchId, serviceType: f.serviceType, agentId: f.agentId, dateFrom: f.dateFrom, dateTo: f.dateTo });

export const reportKeys = {
  overview: (f: ReportFilters) => ["rpt", "overview", f] as const,
  sales: (f: ReportFilters) => ["rpt", "sales", f] as const,
  bookings: (f: ReportFilters) => ["rpt", "bookings", f] as const,
  agents: (f: ReportFilters) => ["rpt", "agents", f] as const,
  service: (t: string, f: ReportFilters) => ["rpt", "service", t, f] as const,
  pnl: (f: ReportFilters) => ["rpt", "pnl", f] as const,
  balance: (f: ReportFilters) => ["rpt", "balance", f] as const,
  cashflow: (f: ReportFilters) => ["rpt", "cashflow", f] as const,
};

const opts = { placeholderData: <T,>(p: T) => p, staleTime: 30_000 };

export const useOverview = (f: ReportFilters) =>
  useQuery({ queryKey: reportKeys.overview(f), queryFn: () => apiFetch<OverviewReport>(`/reports/overview?${buildQuery(f)}`), ...opts });
export const useSalesReport = (f: ReportFilters) =>
  useQuery({ queryKey: reportKeys.sales(f), queryFn: () => apiFetch<SalesReport>(`/reports/sales?${buildQuery(f)}`), ...opts });
export const useBookingsReport = (f: ReportFilters) =>
  useQuery({ queryKey: reportKeys.bookings(f), queryFn: () => apiFetch<BookingsReport>(`/reports/bookings?${buildQuery(f)}`), ...opts });
export const useAgentsReport = (f: ReportFilters) =>
  useQuery({ queryKey: reportKeys.agents(f), queryFn: () => apiFetch<AgentsReport>(`/reports/agents?${buildQuery(f)}`), ...opts });
export const useServiceReport = (type: string, f: ReportFilters) =>
  useQuery({ queryKey: reportKeys.service(type, f), queryFn: () => apiFetch<ServiceReport>(`/reports/service/${type}?${buildQuery(f)}`), ...opts });
export const usePnlReport = (f: ReportFilters) =>
  useQuery({ queryKey: reportKeys.pnl(f), queryFn: () => apiFetch<PnlReport>(`/reports/pnl?${buildQuery(f)}`), ...opts });
export const useBalanceSheet = (f: ReportFilters) =>
  useQuery({ queryKey: reportKeys.balance(f), queryFn: () => apiFetch<BalanceSheetReport>(`/reports/balance-sheet?${buildQuery(f)}`), ...opts });
export const useCashFlow = (f: ReportFilters) =>
  useQuery({ queryKey: reportKeys.cashflow(f), queryFn: () => apiFetch<CashFlowReport>(`/reports/cashflow?${buildQuery(f)}`), ...opts });

/** CSV export — authenticated fetch → blob → browser download. */
export async function downloadReport(report: "sales" | "bookings" | "agents" | "pnl", f: ReportFilters): Promise<void> {
  try {
    const url = `${API_BASE_URL}/reports/export?${qs({ report, ...f } as Record<string, string | undefined>)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` }, credentials: "include" });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${report}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(href);
    toast.success(`Exported ${report} report (CSV)`);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Export failed");
  }
}

export type { OverviewReport, SalesReport, BookingsReport, AgentsReport, ServiceReport, PnlReport, BalanceSheetReport, CashFlowReport };
