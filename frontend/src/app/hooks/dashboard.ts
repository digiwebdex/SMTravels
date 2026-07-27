import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { DashboardSummary } from "@contracts/dashboard.contract";

/** Filters as the ERP topbar holds them (branch id + a date-range label). */
export interface DashboardFilters {
  branchId?: string;   // "all" or a branch id
  dateRange?: string;  // one of the topbar labels below
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Map a topbar date-range label to backend query params. The clean calendar
 * presets use the backend's `range` presets; the finer windows are sent as an
 * explicit dateFrom/dateTo (which the backend honours over `range`), so the
 * data shown always matches the label the user picked.
 * "Custom Range" has no picker yet → falls back to year-to-date.
 */
function mapDateRange(label?: string): { range?: string; dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const back = (days: number) => { const d = new Date(today); d.setDate(d.getDate() - days); return d; };
  switch (label) {
    case "This Month":    return { range: "this-month" };
    case "Last Month":    return { range: "last-month" };
    case "This Year":     return { range: "ytd" };
    case "Today":         return { dateFrom: iso(today), dateTo: iso(today) };
    case "Yesterday": {
      const y = back(1); return { dateFrom: iso(y), dateTo: iso(y) };
    }
    case "This Week": {
      const s = back(today.getDay()); // week starts Sunday
      return { dateFrom: iso(s), dateTo: iso(today) };
    }
    case "Last Week": {
      const s = back(today.getDay() + 7);
      const e = new Date(s); e.setDate(e.getDate() + 6);
      return { dateFrom: iso(s), dateTo: iso(e) };
    }
    case "Last 3 Months": {
      const s = new Date(today); s.setMonth(s.getMonth() - 3);
      return { dateFrom: iso(s), dateTo: iso(today) };
    }
    default:              return { range: "ytd" }; // "Custom Range" (no picker yet) + fallback
  }
}

function buildQuery(f: DashboardFilters): string {
  const d = mapDateRange(f.dateRange);
  const p = new URLSearchParams();
  if (f.branchId && f.branchId !== "all") p.set("branchId", f.branchId);
  if (d.range) p.set("range", d.range);
  if (d.dateFrom) p.set("dateFrom", d.dateFrom);
  if (d.dateTo) p.set("dateTo", d.dateTo);
  return p.toString();
}

export const dashboardKeys = {
  summary: (f: DashboardFilters) => ["dashboard", "summary", f] as const,
};

export const useDashboardSummary = (f: DashboardFilters) =>
  useQuery({
    queryKey: dashboardKeys.summary(f),
    queryFn: () => apiFetch<DashboardSummary>(`/dashboard/summary?${buildQuery(f)}`),
    placeholderData: (p) => p,
    staleTime: 30_000,
  });

export type { DashboardSummary };
