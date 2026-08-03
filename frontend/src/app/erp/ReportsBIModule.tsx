import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  LayoutDashboard, Plane, Hotel, TrendingUp, TrendingDown, DollarSign, Users,
  BarChart3, Star, Activity, Zap, Target, Award, RefreshCw,
  Download, Printer, Filter, Calendar, Building2, Search,
  ChevronRight, Plus, X, GripVertical, Eye, Check,
  ArrowUpRight, ArrowDownRight, Clock, AlertTriangle,
  FileText, Sliders, Globe, Layers, CheckCircle, TrendingDown,
} from "lucide-react";
import { EmptyState } from "../lib/ds";
import { cn } from "../lib/utils";
import { Loader2 } from "lucide-react";
import {
  useOverview, useSalesReport, useBookingsReport, useAgentsReport, useServiceReport,
  usePnlReport, useCashFlow, useBranches, type ReportFilters,
} from "../hooks/reports";

// ─── Types ────────────────────────────────────────────────────────────────────
type BiView =
  | "realtime" | "visa" | "tickets" | "hotels"
  | "sales" | "financial" | "agents" | "staff" | "custom";

const fmtC = (n: number) => "৳ " + n.toLocaleString("en-BD");
const fmtM = (n: number) => "৳" + (n / 1000000).toFixed(2) + "M";

type BiFilters = { dateRange: string; branch: string };
const DEFAULT_BI_FILTERS: BiFilters = { dateRange: "ytd", branch: "all" };
function toReportFilters(f: BiFilters): ReportFilters {
  return { range: f.dateRange, branchId: f.branch };
}

function ReportLoad({ query, children }: { query: { isLoading: boolean; isError: boolean; error?: unknown }; children: React.ReactNode }) {
  if (query.isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={24} className="animate-spin" /></div>;
  if (query.isError) return <div className="bg-[var(--color-surface)] rounded-xl border border-red-200 p-6 text-center text-sm text-red-600">{(query.error as Error)?.message || "Failed to load report."}</div>;
  return <>{children}</>;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"realtime"  as BiView, label:"Real-time Dashboard", icon:Activity    },
  { id:"visa"      as BiView, label:"Visa Reports",         icon:Globe       },
  { id:"tickets"   as BiView, label:"Ticket Reports",       icon:Plane       },
  { id:"hotels"    as BiView, label:"Hotel Reports",        icon:Hotel       },
  { id:"sales"     as BiView, label:"Sales Reports",        icon:TrendingUp  },
  { id:"financial" as BiView, label:"Financial Reports",    icon:DollarSign  },
  { id:"agents"    as BiView, label:"Agent Performance",    icon:Users       },
  { id:"staff"     as BiView, label:"Staff KPI Dashboard",  icon:Star        },
  { id:"custom"    as BiView, label:"Custom Report Builder",icon:Sliders     },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, delta, up, icon: Icon, color, pulse }: {
  label: string; value: string; delta?: string; up?: boolean;
  icon: React.ElementType; color: string; pulse?: boolean;
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center relative", color)}>
          <Icon size={18} className="text-white" />
          {pulse && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
        </div>
        {delta && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium mt-0.5",
            up ? "text-emerald-600" : "text-red-500")}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {delta}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function Section({ title, actions, children, className }: {
  title: string; actions?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]", className)}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium font-mono">
            {typeof p.value === "number" && p.value > 10000 ? fmtC(p.value) : p.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────
function FilterBar({
  title, subtitle, filters, branches, onChange, onRefresh,
}: {
  title: string; subtitle?: string;
  filters: BiFilters;
  branches: { id: string; name: string }[];
  onChange: (partial: Partial<BiFilters>) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onRefresh} className="p-2 border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-500">
            <RefreshCw size={14} />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
            <Printer size={14} /> PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-slate-600">
          <Calendar size={14} className="text-slate-400" />
          <select value={filters.dateRange} onChange={(e) => onChange({ dateRange: e.target.value })}
            className="bg-transparent focus:outline-none cursor-pointer">
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="q1">Q1</option>
            <option value="q2">Q2</option>
            <option value="q3">Q3</option>
            <option value="q4">Q4</option>
            <option value="ytd">YTD</option>
            <option value="last-year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-slate-600">
          <Building2 size={14} className="text-slate-400" />
          <select value={filters.branch} onChange={(e) => onChange({ branch: e.target.value })}
            className="bg-transparent focus:outline-none cursor-pointer">
            <option value="all">All Branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── REAL-TIME DASHBOARD ──────────────────────────────────────────────────────
function RealtimeView({ rf, filters, branches, onFilterChange, onRefresh }: {
  rf: ReportFilters; filters: BiFilters; branches: { id: string; name: string }[];
  onFilterChange: (p: Partial<BiFilters>) => void; onRefresh: () => void;
}) {
  const overviewQ = useOverview(rf);
  const salesQ = useSalesReport(rf);
  const bookingsQ = useBookingsReport(rf);
  const overview = overviewQ.data;
  const sales = salesQ.data;
  const bookings = bookingsQ.data;
  const loading = overviewQ.isLoading || salesQ.isLoading || bookingsQ.isLoading;
  const failed = overviewQ.isError || salesQ.isError || bookingsQ.isError;
  const monthly = overview?.monthly ?? [];
  const monthlyChart = monthly.slice(-4);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Real-time Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">{overview?.applied.label ?? "Live KPIs from operational data"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { overviewQ.refetch(); salesQ.refetch(); bookingsQ.refetch(); }} className="p-2 border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-500">
            <RefreshCw size={14} className={overviewQ.isFetching ? "animate-spin" : ""} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-xs font-semibold text-emerald-700">LIVE DATA</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-slate-600">
          <Calendar size={14} className="text-slate-400" />
          <select value={filters.dateRange} onChange={(e) => onFilterChange({ dateRange: e.target.value })}
            className="bg-transparent focus:outline-none cursor-pointer">
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="ytd">YTD</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-slate-600">
          <Building2 size={14} className="text-slate-400" />
          <select value={filters.branch} onChange={(e) => onFilterChange({ branch: e.target.value })}
            className="bg-transparent focus:outline-none cursor-pointer">
            <option value="all">All Branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="flex justify-center py-16 text-slate-400"><Loader2 size={24} className="animate-spin" /></div>}
      {failed && !loading && <p className="text-sm text-red-500 text-center py-8">Failed to load dashboard data.</p>}

      {overview && sales && bookings && !loading && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Total Bookings" value={overview.kpis.bookings.toLocaleString()} icon={Calendar} color="bg-emerald-500" />
            <KpiCard label="Revenue" value={fmtC(overview.kpis.revenue)} icon={DollarSign} color="bg-amber-500" />
            <KpiCard label="Net Profit" value={fmtC(overview.kpis.netProfit)} icon={TrendingUp} color="bg-[#1B75BC]" />
            <KpiCard label="Pending Bookings" value={String(bookings.pending)} icon={AlertTriangle} color="bg-red-500" />
          </div>

          <div className="grid grid-cols-3 gap-5">
            <Section title="Bookings — Monthly Trend" className="col-span-2">
              {monthly.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No booking data in range.</p>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                    <defs>
                      <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B75BC" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1B75BC" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#1B75BC" strokeWidth={2} fill="url(#sessGrad)" />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#F15A24" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Section>

            <Section title="Service Breakdown">
              {(overview.serviceBreakdown ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No services in range.</p>
              ) : (
                <div className="space-y-2">
                  {overview.serviceBreakdown.map((s) => (
                    <div key={s.service} className="flex items-center justify-between py-1.5">
                      <p className="text-xs font-medium text-slate-700">{s.label}</p>
                      <p className="text-xs text-slate-500">{s.count} · {fmtC(s.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Section title={`Revenue vs Expense — ${overview.applied.label}`}>
              {monthlyChart.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No revenue data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthlyChart} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                      tickFormatter={v => `৳${(v/1000000).toFixed(0)}M`} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="revenue" name="Revenue" fill="#1B75BC" radius={[4,4,0,0]} />
                    <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>

            <Section title="Sales Summary">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Invoices", value: sales.invoiceCount.toLocaleString(), icon: FileText },
                  { label: "Collected", value: fmtC(sales.totalCollected), icon: DollarSign },
                  { label: "Avg Invoice", value: fmtC(sales.avgValue), icon: TrendingUp },
                  { label: "Billed", value: fmtC(sales.totalRevenue), icon: Layers },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100">
                      <Icon size={15} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 font-mono">{value}</p>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

// ─── VISA REPORTS ─────────────────────────────────────────────────────────────
function VisaReport({ rf, filters, branches, onFilterChange, onRefresh }: {
  rf: ReportFilters; filters: BiFilters; branches: { id: string; name: string }[];
  onFilterChange: (p: Partial<BiFilters>) => void; onRefresh: () => void;
}) {
  const q = useServiceReport("VISA", { ...rf, serviceType: "VISA" });
  const d = q.data;
  const approvalRate = d && d.totalBookings > 0 ? Math.round((d.confirmed / d.totalBookings) * 1000) / 10 : 0;
  const branchRows = d?.byBranch ?? [];

  return (
    <div className="space-y-5">
      <FilterBar title="Visa Reports" subtitle="Visa applications, approvals, and processing metrics"
        filters={filters} branches={branches} onChange={onFilterChange} onRefresh={() => q.refetch()} />
      <ReportLoad query={q}>
        {d && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="Total Applications" value={d.totalBookings.toLocaleString()} icon={FileText} color="bg-[#1B75BC]" />
              <KpiCard label="Confirmed" value={d.confirmed.toLocaleString()} icon={CheckCircle} color="bg-emerald-500" />
              <KpiCard label="Approval Rate" value={d.totalBookings ? `${approvalRate}%` : "—"} icon={TrendingUp} color="bg-blue-500" />
              <KpiCard label="Revenue" value={fmtC(d.totalRevenue)} icon={Clock} color="bg-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-5">
              <Section title="By Branch" className="col-span-2">
                {branchRows.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No visa bookings in range.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Branch","Bookings","Revenue","Share"].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {branchRows.map((r) => {
                        const pct = d.totalRevenue > 0 ? Math.round((r.revenue / d.totalRevenue) * 100) : 0;
                        return (
                          <tr key={r.branchId} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-3 pr-4 text-sm font-medium text-slate-700">{r.branchName}</td>
                            <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{r.bookings}</td>
                            <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono">{fmtC(r.revenue)}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-semibold text-emerald-600">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </Section>
              <Section title="Monthly Trend">
                {d.monthly.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No data.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={d.monthly} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTip />} />
                      <Line type="monotone" dataKey="bookings" name="Visas" stroke="#1B75BC" strokeWidth={2.5} dot={{ r: 3, fill: "#1B75BC" }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Section>
            </div>
          </>
        )}
      </ReportLoad>
    </div>
  );
}

// ─── TICKET REPORTS ───────────────────────────────────────────────────────────
function TicketReport({ rf, filters, branches, onFilterChange, onRefresh }: {
  rf: ReportFilters; filters: BiFilters; branches: { id: string; name: string }[];
  onFilterChange: (p: Partial<BiFilters>) => void; onRefresh: () => void;
}) {
  const q = useServiceReport("AIR_TICKET", { ...rf, serviceType: "AIR_TICKET" });
  const d = q.data;
  const rows = d?.byBranch ?? [];
  const totalTickets = d?.totalBookings ?? 0;
  const totalRevenue = d?.totalRevenue ?? 0;
  const avgFare = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0;

  return (
    <div className="space-y-5">
      <FilterBar title="Air Ticket Reports" subtitle="Flight bookings, revenue, and load factor analysis"
        filters={filters} branches={branches} onChange={onFilterChange} onRefresh={() => q.refetch()} />
      <ReportLoad query={q}>
        {d && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="Tickets Issued" value={totalTickets.toLocaleString()} icon={Plane} color="bg-[#1B75BC]" />
              <KpiCard label="Ticket Revenue" value={fmtM(totalRevenue)} icon={DollarSign} color="bg-emerald-500" />
              <KpiCard label="Confirmed" value={d.confirmed.toLocaleString()} icon={Target} color="bg-blue-500" />
              <KpiCard label="Avg Fare" value={fmtC(avgFare)} icon={TrendingUp} color="bg-amber-500" />
            </div>
            <Section title="Branch Performance">
              {rows.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No air ticket bookings in range.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Branch","Tickets","Revenue","Avg Fare"].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.branchId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-3 pr-4 text-sm font-medium text-slate-700">{r.branchName}</td>
                        <td className="py-3 pr-4 text-sm text-slate-700 font-mono">{r.bookings}</td>
                        <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono">{fmtC(r.revenue)}</td>
                        <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{fmtC(r.bookings > 0 ? Math.round(r.revenue / r.bookings) : 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50">
                      <td className="py-3 pr-4 text-xs font-bold text-slate-800">Total</td>
                      <td className="py-3 pr-4 text-sm font-bold text-slate-800 font-mono">{totalTickets}</td>
                      <td className="py-3 pr-4 text-sm font-bold text-slate-800 font-mono">{fmtC(totalRevenue)}</td>
                      <td className="py-3 pr-4 text-sm font-bold text-slate-800 font-mono">{fmtC(avgFare)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </Section>
          </>
        )}
      </ReportLoad>
    </div>
  );
}

// ─── HOTEL REPORTS ────────────────────────────────────────────────────────────
const HOTEL_CHART_COLORS = ["#1B75BC","#F15A24","#0E7C66","#2563EB","#7C3AED"];

function HotelReport({ rf, filters, branches, onFilterChange, onRefresh }: {
  rf: ReportFilters; filters: BiFilters; branches: { id: string; name: string }[];
  onFilterChange: (p: Partial<BiFilters>) => void; onRefresh: () => void;
}) {
  const q = useServiceReport("HOTEL", { ...rf, serviceType: "HOTEL" });
  const d = q.data;
  const rows = d?.byBranch ?? [];
  const pieData = rows.map((r) => ({ city: r.branchName, revenue: r.revenue, nights: r.bookings }));

  return (
    <div className="space-y-5">
      <FilterBar title="Hotel Reports" subtitle="Accommodation bookings, occupancy, and revenue"
        filters={filters} branches={branches} onChange={onFilterChange} onRefresh={() => q.refetch()} />
      <ReportLoad query={q}>
        {d && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="Total Bookings" value={d.totalBookings.toLocaleString()} icon={Hotel} color="bg-[#1B75BC]" />
              <KpiCard label="Hotel Revenue" value={fmtM(d.totalRevenue)} icon={DollarSign} color="bg-emerald-500" />
              <KpiCard label="Confirmed" value={d.confirmed.toLocaleString()} icon={Target} color="bg-blue-500" />
              <KpiCard label="Travelers" value={d.travelers.toLocaleString()} icon={Star} color="bg-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-5">
              <Section title="Branch Performance" className="col-span-2">
                {rows.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No hotel bookings in range.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Branch","Bookings","Revenue"].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.branchId} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-3 pr-4 text-sm font-medium text-slate-700">{r.branchName}</td>
                          <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{r.bookings.toLocaleString()}</td>
                          <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono">{fmtC(r.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>
              <Section title="Revenue by Branch">
                {pieData.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No data.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} dataKey="revenue" nameKey="city"
                          cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={HOTEL_CHART_COLORS[i % HOTEL_CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [fmtC(v), ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {pieData.map((h, i) => (
                        <div key={h.city} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: HOTEL_CHART_COLORS[i % HOTEL_CHART_COLORS.length] }} />
                            <span className="text-slate-600">{h.city}</span>
                          </div>
                          <span className="font-medium text-slate-700 font-mono">{fmtC(h.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Section>
            </div>
          </>
        )}
      </ReportLoad>
    </div>
  );
}

// ─── SALES REPORTS ────────────────────────────────────────────────────────────
function SalesReportView({ rf, filters, branches, onFilterChange, onRefresh }: {
  rf: ReportFilters; filters: BiFilters; branches: { id: string; name: string }[];
  onFilterChange: (p: Partial<BiFilters>) => void; onRefresh: () => void;
}) {
  const q = useSalesReport(rf);
  const d = q.data;

  return (
    <div className="space-y-5">
      <FilterBar title="Sales Reports" subtitle="Revenue performance vs targets by service and branch"
        filters={filters} branches={branches} onChange={onFilterChange} onRefresh={() => q.refetch()} />
      <ReportLoad query={q}>
        {d && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label={`Total Revenue (${d.applied.label})`} value={fmtM(d.totalRevenue)} icon={TrendingUp} color="bg-[#1B75BC]" />
              <KpiCard label="Collected" value={fmtM(d.totalCollected)} icon={CheckCircle} color="bg-emerald-500" />
              <KpiCard label="Total Invoices" value={d.invoiceCount.toLocaleString()} icon={Calendar} color="bg-amber-500" />
              <KpiCard label="Avg Invoice Value" value={fmtC(d.avgValue)} icon={DollarSign} color="bg-blue-500" />
            </div>
            <Section title={`Revenue Trend — ${d.applied.label}`}>
              {d.monthly.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No sales data in range.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={d.monthly} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                    <defs>
                      <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B75BC" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1B75BC" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                      tickFormatter={v => `৳${(v/1000000).toFixed(0)}M`} />
                    <Tooltip content={<ChartTip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1B75BC" strokeWidth={2.5} fill="url(#revGrad2)" />
                    <Line type="monotone" dataKey="expense" name="Expense" stroke="#F15A24" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Section>
          </>
        )}
      </ReportLoad>
    </div>
  );
}

// ─── FINANCIAL REPORTS ────────────────────────────────────────────────────────
function FinancialReport({ rf, filters, branches, onFilterChange, onRefresh }: {
  rf: ReportFilters; filters: BiFilters; branches: { id: string; name: string }[];
  onFilterChange: (p: Partial<BiFilters>) => void; onRefresh: () => void;
}) {
  const pnlQ = usePnlReport(rf);
  const cfQ = useCashFlow(rf);
  const pnl = pnlQ.data;
  const cf = cfQ.data;
  const loading = pnlQ.isLoading || cfQ.isLoading;
  const failed = pnlQ.isError || cfQ.isError;

  return (
    <div className="space-y-5">
      <FilterBar title="Financial Reports" subtitle="P&L, cash flow, and financial health overview"
        filters={filters} branches={branches} onChange={onFilterChange} onRefresh={() => { pnlQ.refetch(); cfQ.refetch(); }} />
      {loading && <div className="flex justify-center py-16 text-slate-400"><Loader2 size={24} className="animate-spin" /></div>}
      {failed && !loading && <p className="text-sm text-red-500 text-center py-8">Failed to load financial reports.</p>}
      {pnl && cf && !loading && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label={`Net Revenue (${pnl.applied.label})`} value={fmtM(pnl.revenue)} icon={TrendingUp} color="bg-emerald-500" />
            <KpiCard label="Total Expenses" value={fmtM(pnl.expense)} icon={TrendingDown} color="bg-red-500" />
            <KpiCard label="Net Profit" value={fmtM(pnl.netProfit)} icon={DollarSign} color="bg-[#1B75BC]" />
            <KpiCard label="Net Margin" value={`${pnl.netMargin.toFixed(1)}%`} icon={Target} color="bg-amber-500" />
          </div>
          <Section title={`Revenue vs Expense — ${pnl.applied.label}`}>
            {pnl.monthly.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No posted journal activity in range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pnl.monthly} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `৳${(v/1000000).toFixed(0)}M`} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#0E7C66" radius={[3,3,0,0]} />
                  <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>
          <Section title={`Cash Flow — ${cf.applied.label}`}>
            {cf.monthly.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No cash movement in range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cf.monthly} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="operating" name="Operating" fill="#0E7C66" radius={[3,3,0,0]} />
                  <Bar dataKey="investing" name="Investing" fill="#EF4444" radius={[3,3,0,0]} />
                  <Bar dataKey="financing" name="Financing" fill="#F15A24" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

// ─── AGENT PERFORMANCE ────────────────────────────────────────────────────────
function AgentReport({ rf, filters, branches, onFilterChange, onRefresh }: {
  rf: ReportFilters; filters: BiFilters; branches: { id: string; name: string }[];
  onFilterChange: (p: Partial<BiFilters>) => void; onRefresh: () => void;
}) {
  const q = useAgentsReport(rf);
  const d = q.data;
  const agents = d?.agents ?? [];

  return (
    <div className="space-y-5">
      <FilterBar title="Agent Performance" subtitle="Bookings, revenue, commission, and CSAT by agent"
        filters={filters} branches={branches} onChange={onFilterChange} onRefresh={() => q.refetch()} />
      <ReportLoad query={q}>
        {d && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="Active Agents" value={d.activeAgents.toLocaleString()} icon={Users} color="bg-[#1B75BC]" />
              <KpiCard label="Agent Bookings" value={d.totalBookings.toLocaleString()} icon={Calendar} color="bg-emerald-500" />
              <KpiCard label="Total Commission" value={fmtC(d.totalCommission)} icon={DollarSign} color="bg-amber-500" />
              <KpiCard label="Agent Revenue" value={fmtC(d.totalRevenue)} icon={TrendingUp} color="bg-blue-500" />
            </div>
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100"><p className="font-semibold text-slate-800 text-sm">Agent Leaderboard</p></div>
              {agents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No agent activity in range.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["#","Agent","Bookings","Revenue","Commission","Status"].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((a, i) => (
                      <tr key={a.agentId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-500")}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{a.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{a.bookings}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">{fmtC(a.revenue)}</td>
                        <td className="px-4 py-3 text-sm text-amber-600 font-mono">{fmtC(a.commission)}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                            a.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </ReportLoad>
    </div>
  );
}

// ─── STAFF KPI ────────────────────────────────────────────────────────────────
function StaffKpi() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Staff KPI Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Individual performance tracking</p>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState
          variant="no-data"
          title="Staff performance analytics"
          desc="Metrics will appear once staff activity is recorded."
        />
      </div>
    </div>
  );
}

// ─── CUSTOM REPORT BUILDER ────────────────────────────────────────────────────

function CustomBuilder() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Custom Report Builder</h2>
        <p className="text-sm text-slate-500 mt-0.5">Build-your-own reports</p>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState
          variant="coming-soon"
          title="Custom report builder"
          desc="Build-your-own reports is planned for a later release."
        />
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────
export function ReportsBIModule() {
  const [view, setView] = useState<BiView>("realtime");
  const [filters, setFilters] = useState<BiFilters>(DEFAULT_BI_FILTERS);
  const { data: branches = [] } = useBranches();
  const rf = toReportFilters(filters);
  const onFilterChange = (partial: Partial<BiFilters>) => setFilters((prev) => ({ ...prev, ...partial }));

  const sharedProps = {
    rf,
    filters,
    branches,
    onFilterChange,
    onRefresh: () => { /* refetch handled per-query via filter key change */ },
  };

  const render = () => {
    switch (view) {
      case "realtime":  return <RealtimeView {...sharedProps} />;
      case "visa":      return <VisaReport {...sharedProps} />;
      case "tickets":   return <TicketReport {...sharedProps} />;
      case "hotels":    return <HotelReport {...sharedProps} />;
      case "sales":     return <SalesReportView {...sharedProps} />;
      case "financial": return <FinancialReport {...sharedProps} />;
      case "agents":    return <AgentReport {...sharedProps} />;
      case "staff":     return <StaffKpi />;
      case "custom":    return <CustomBuilder />;
      default:          return null;
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      <div className="w-56 flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reports & BI</h2>
        </div>
        <nav className="flex-1 py-2 no-scrollbar overflow-y-auto">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={cn("w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                view === item.id ? "bg-[#1B75BC]/8 text-[#1B75BC] font-medium" : "text-slate-600 hover:bg-slate-50")}>
              <item.icon size={15} className={view === item.id ? "text-[#1B75BC]" : "text-slate-400"} />
              {item.label}
              {item.id === "realtime" && (
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 space-y-1.5">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
            <Printer size={12} /> Export Current PDF
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Download size={12} /> Export Excel
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">{render()}</div>
      </div>
    </div>
  );
}
