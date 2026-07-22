import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import {
  BarChart3, TrendingUp, TrendingDown, Download, Filter, Calendar,
  Building2, Users, Plane, FileText, Globe, Briefcase, DollarSign,
  ArrowUpRight, ArrowDownRight, RefreshCw, ChevronDown, Search,
  Printer, Sheet, LayoutDashboard, Star, CheckCircle, Clock,
  AlertTriangle, Layers, Sliders, Eye, Package,
} from "lucide-react";
import { cn, fmtPrice } from "../lib/utils";
import {
  useOverview, useSalesReport, useBookingsReport, useAgentsReport, useServiceReport,
  usePnlReport, useBalanceSheet, useCashFlow, useBranches, downloadReport,
  type ReportFilters,
} from "../hooks/reports";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportView =
  | "overview" | "bookings" | "sales" | "hajj" | "umrah"
  | "visa" | "manpower" | "agents" | "pnl" | "balance-sheet"
  | "cashflow" | "custom";

type LoadState = "loading" | "loaded" | "empty";

const fmtC = (n: number) => "৳ " + n.toLocaleString("en-BD");
const fmtM = (n: number) => "৳ " + (n / 1000000).toFixed(2) + "M";

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    group: "Overview",
    items: [
      { id: "overview" as ReportView, label: "Dashboard & Charts", icon: LayoutDashboard },
    ],
  },
  {
    group: "Operational",
    items: [
      { id: "bookings"  as ReportView, label: "Booking Report",  icon: Calendar },
      { id: "sales"     as ReportView, label: "Sales Report",    icon: TrendingUp },
      { id: "agents"    as ReportView, label: "Agent Report",    icon: Users },
    ],
  },
  {
    group: "By Service",
    items: [
      { id: "hajj"      as ReportView, label: "Hajj Report",     icon: Star },
      { id: "umrah"     as ReportView, label: "Umrah Report",    icon: Globe },
      { id: "visa"      as ReportView, label: "Visa Report",     icon: FileText },
      { id: "manpower"  as ReportView, label: "Manpower Report", icon: Briefcase },
    ],
  },
  {
    group: "Financial",
    items: [
      { id: "pnl"           as ReportView, label: "Profit & Loss",  icon: DollarSign },
      { id: "balance-sheet" as ReportView, label: "Balance Sheet",  icon: Layers },
      { id: "cashflow"      as ReportView, label: "Cash Flow",      icon: TrendingUp },
    ],
  },
  {
    group: "Tools",
    items: [
      { id: "custom" as ReportView, label: "Custom Reports", icon: Sliders },
    ],
  },
];


// ─── Shared UI components ─────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, icon: Icon, color, mono = true }: {
  label: string; value: string; sub?: string; trend?: number;
  icon: React.ElementType; color: string; mono?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800" style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}>{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
interface Filters {
  dateRange: string;
  branch: string;
  service: string;
  agent: string;
}
function FilterBar({
  filters, branches, onChange, onExport, onRefresh, title, subtitle,
}: {
  filters: Filters;
  branches: { id: string; name: string }[];
  onChange: (f: Partial<Filters>) => void;
  onExport: (type: "pdf" | "excel") => void;
  onRefresh: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => onExport("pdf")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Printer size={14} /> PDF
          </button>
          <button onClick={() => onExport("excel")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
          <Calendar size={14} className="text-slate-400" />
          <select value={filters.dateRange} onChange={e => onChange({ dateRange: e.target.value })}
            className="bg-transparent focus:outline-none cursor-pointer">
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="q1">Q1</option>
            <option value="q2">Q2</option>
            <option value="q3">Q3</option>
            <option value="q4">Q4</option>
            <option value="ytd">Year to Date</option>
            <option value="last-year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
          <Building2 size={14} className="text-slate-400" />
          <select value={filters.branch} onChange={e => onChange({ branch: e.target.value })}
            className="bg-transparent focus:outline-none cursor-pointer">
            <option value="all">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
          <Package size={14} className="text-slate-400" />
          <select value={filters.service} onChange={e => onChange({ service: e.target.value })}
            className="bg-transparent focus:outline-none cursor-pointer">
            <option value="all">All Services</option>
            <option value="hajj">Hajj</option>
            <option value="umrah">Umrah</option>
            <option value="visa">Visa</option>
            <option value="air-ticket">Air Ticket</option>
            <option value="manpower">Manpower</option>
            <option value="tour">Tour Packages</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
          <Users size={14} className="text-slate-400" />
          <select value={filters.agent} onChange={e => onChange({ agent: e.target.value })}
            className="bg-transparent focus:outline-none cursor-pointer">
            <option value="all">All Agents</option>
            <option value="rahim">Rahim & Sons</option>
            <option value="nmt">NMT Travels</option>
            <option value="almadina">Al-Madina Agency</option>
            <option value="haji">Haji Travels</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-28">
            <div className="w-10 h-10 bg-slate-100 rounded-lg mb-3" />
            <div className="h-6 bg-slate-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-64">
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
            <div className="flex items-end gap-3 h-40">
              {[...Array(7)].map((_, j) => (
                <div key={j} className="flex-1 bg-slate-100 rounded-t" style={{ height: `${40 + Math.random() * 60}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 h-48">
        <div className="h-4 bg-slate-100 rounded w-1/4 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-slate-50">
            <div className="h-3 bg-slate-100 rounded flex-1" />
            <div className="h-3 bg-slate-100 rounded w-24" />
            <div className="h-3 bg-slate-100 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ report }: { report: string }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <BarChart3 size={28} className="text-slate-300" />
      </div>
      <h3 className="text-base font-semibold text-slate-600 mb-1">No data for this period</h3>
      <p className="text-sm text-slate-400 max-w-xs">
        No {report} data matches the current filters. Try adjusting the date range or branch selection.
      </p>
      <button className="mt-5 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center gap-1.5">
        <Filter size={13} /> Reset Filters
      </button>
    </div>
  );
}

// ─── Query state wrapper (loading / error / empty around a real report) ───────
function ReportState({ query, report, isEmpty, children }: {
  query: { isLoading: boolean; isError: boolean; error?: unknown; isFetching?: boolean };
  report: string; isEmpty?: boolean; children: React.ReactNode;
}) {
  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return (
    <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
      <AlertTriangle size={22} className="mx-auto text-red-400 mb-2" />
      <p className="text-sm text-red-600">{(query.error as Error)?.message || `Failed to load ${report} report.`}</p>
    </div>
  );
  if (isEmpty) return <EmptyState report={report} />;
  return <>{children}</>;
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ title, actions, children, className }: {
  title: string; actions?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200", className)}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {typeof p.value === "number" && p.value > 10000 ? fmtC(p.value) : p.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── OVERVIEW DASHBOARD ───────────────────────────────────────────────────────
const CHART_COLORS = ["#0E6BB8", "#E8471F", "#0E7C66", "#2563EB", "#7C3AED", "#EA580C", "#F59E0B"];

function OverviewReport({ rf }: { rf: ReportFilters }) {
  const q = useOverview(rf);
  const d = q.data;
  const svc = d?.serviceBreakdown ?? [];
  const maxBranch = Math.max(1, ...(d?.branchBreakdown ?? []).map(b => b.revenue));

  return (
    <ReportState query={q} report="overview" isEmpty={!!d && d.kpis.revenue === 0 && d.kpis.bookings === 0}>
      {d && (
      <div className="space-y-5" data-report="overview">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={fmtM(d.kpis.revenue)} icon={TrendingUp} color="bg-[#0E6BB8]" />
          <KpiCard label="Total Bookings" value={d.kpis.bookings.toLocaleString()} icon={Calendar} color="bg-emerald-500" />
          <KpiCard label="Total Expenses" value={fmtM(d.kpis.expenses)} icon={TrendingDown} color="bg-red-500" />
          <KpiCard label="Net Profit" value={fmtM(d.kpis.netProfit)} icon={DollarSign} color="bg-amber-500" />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Section title={`Revenue vs Expense — ${d.applied.label}`} className="col-span-2">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={d.monthly} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0E6BB8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0E6BB8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `৳${(v / 1000000).toFixed(1)}M`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0E6BB8" strokeWidth={2.5} fill="url(#revGrad)" />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#E8471F" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Bookings by Service">
            {svc.length === 0 ? <p className="text-sm text-slate-400 py-8 text-center">No bookings in range.</p> : <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={svc} dataKey="revenue" nameKey="label" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}>
                  {svc.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [fmtC(v), ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {svc.map((s, i) => (
                <div key={s.service} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-slate-600">{s.label}</span>
                  </div>
                  <span className="font-medium text-slate-700">{s.count} · {s.pct}%</span>
                </div>
              ))}
            </div></>}
          </Section>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Section title="Revenue by Branch">
            <div className="space-y-3">
              {d.branchBreakdown.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No data.</p>}
              {d.branchBreakdown.map((b, i) => (
                <div key={b.branchId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{b.branchName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{b.bookings} bkgs</span>
                      <span className="font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtM(b.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(b.revenue / maxBranch) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title={`Monthly Bookings — ${d.applied.label}`}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.monthly} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="bookings" name="Bookings" fill="#0E6BB8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      </div>
      )}
    </ReportState>
  );
}

// ─── BOOKING REPORT ───────────────────────────────────────────────────────────
const STATUS_CHK: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending:   "bg-amber-50 text-amber-700",
  cancelled: "bg-slate-100 text-slate-500",
  overdue:   "bg-red-50 text-red-600",
};

function BookingReport({ rf }: { rf: ReportFilters }) {
  const q = useBookingsReport(rf);
  const d = q.data;
  return (
    <ReportState query={q} report="booking" isEmpty={!!d && d.total === 0}>
      {d && (
      <div className="space-y-5" data-report="bookings">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Total Bookings" value={d.total.toLocaleString()} icon={Calendar} color="bg-[#0E6BB8]" />
          <KpiCard label="Confirmed" value={d.confirmed.toLocaleString()} icon={CheckCircle} color="bg-emerald-500" />
          <KpiCard label="Pending" value={d.pending.toLocaleString()} icon={Clock} color="bg-amber-500" />
          <KpiCard label="Cancelled" value={d.cancelled.toLocaleString()} icon={AlertTriangle} color="bg-red-500" />
        </div>
        <div className="grid grid-cols-3 gap-5">
          <Section title="Bookings by Service" className="col-span-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.byService} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="service" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Bookings" radius={[3, 3, 0, 0]}>
                  {d.byService.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Status Breakdown">
            <div className="space-y-3">
              {d.byStatus.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No data.</p>}
              {d.byStatus.map(s => (
                <div key={s.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 capitalize">{s.status.toLowerCase()}</span>
                    <span className="font-semibold text-slate-800">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#0E6BB8]" style={{ width: `${(s.count / Math.max(1, d.total)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
        <Section title={`Booking Transactions (${d.rows.length} shown)`}>
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="border-b border-slate-100">
                {["Booking No", "Date", "Customer", "Service", "Branch", "Agent", "Amount (base)", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.rows.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4 text-xs font-mono text-slate-400">{r.bookingNo || "—"}</td>
                  <td className="py-3 pr-4 text-sm text-slate-500">{r.date}</td>
                  <td className="py-3 pr-4 text-sm font-medium text-slate-700">{r.customerName || "—"}</td>
                  <td className="py-3 pr-4 text-sm text-slate-500">{r.serviceType}</td>
                  <td className="py-3 pr-4 text-sm text-slate-500">{r.branchName || "—"}</td>
                  <td className="py-3 pr-4 text-sm text-slate-500">{r.agentName || "Direct"}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(r.baseAmount)}{r.currency !== "BDT" && <span className="ml-1 text-[10px] text-amber-600">({r.currency})</span>}
                  </td>
                  <td className="py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", STATUS_CHK[r.status.toLowerCase()] ?? "bg-slate-100 text-slate-500")}>
                      {r.status.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={6} className="px-0 py-3 text-xs font-semibold text-slate-600">Total value (base, non-cancelled)</td>
                <td className="py-3 text-sm font-bold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(d.totalValue)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </Section>
      </div>
      )}
    </ReportState>
  );
}

// ─── SALES REPORT ─────────────────────────────────────────────────────────────
function SalesReport({ rf }: { rf: ReportFilters }) {
  const q = useSalesReport(rf);
  const d = q.data;
  const mixed = !!d && Math.abs(d.rawAmountTotal - d.totalRevenue) > 0.5;
  return (
    <ReportState query={q} report="sales" isEmpty={!!d && d.invoiceCount === 0}>
      {d && (
      <div className="space-y-5" data-report="sales">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label={`Billed Revenue (${d.applied.label})`} value={fmtC(d.totalRevenue)} icon={TrendingUp} color="bg-[#0E6BB8]" />
          <KpiCard label="Collected" value={fmtC(d.totalCollected)} icon={CheckCircle} color="bg-emerald-500" />
          <KpiCard label="Invoices" value={d.invoiceCount.toLocaleString()} icon={FileText} color="bg-blue-500" />
          <KpiCard label="Avg. Invoice Value" value={fmtC(d.avgValue)} icon={DollarSign} color="bg-amber-500" />
        </div>
        {mixed && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <AlertTriangle size={13} className="text-amber-500" />
            Totals are summed in <b>baseAmount (BDT)</b> so mixed-currency invoices aggregate correctly — a naive raw-amount sum would read {fmtC(d.rawAmountTotal)}.
          </div>
        )}
        <Section title={`Revenue Trend — ${d.applied.label}`}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={d.monthly} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0E6BB8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0E6BB8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                tickFormatter={v => `৳${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0E6BB8" strokeWidth={2.5} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
        <Section title={`Sales by Service — ${d.applied.label}`}>
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="border-b border-slate-100">
                {["Service", "Invoices", "Revenue (base)", "% of Total"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.byService.map((s, i) => (
                <tr key={s.service} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm font-medium text-slate-700">{s.label}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{s.count.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(s.revenue)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                      <span className="text-xs text-slate-500">{s.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td className="py-3 pr-4 text-xs font-bold text-slate-700">Total</td>
                <td className="py-3 pr-4 text-sm font-bold text-slate-700 font-mono">{d.invoiceCount.toLocaleString()}</td>
                <td className="py-3 pr-4 text-sm font-bold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(d.totalRevenue)}</td>
                <td className="py-3 pr-4 text-xs font-bold text-slate-600">100%</td>
              </tr>
            </tfoot>
          </table>
        </Section>
      </div>
      )}
    </ReportState>
  );
}

// ─── SERVICE REPORT (Hajj / Umrah / Visa / Manpower) ──────────────────────────
function ServiceReportView({ rf, type, title }: { rf: ReportFilters; type: string; title: string }) {
  const q = useServiceReport(type, { ...rf, serviceType: type });
  const d = q.data;
  return (
    <ReportState query={q} report={title.toLowerCase()} isEmpty={!!d && d.totalBookings === 0}>
      {d && (
      <div className="space-y-5" data-report={`service-${type.toLowerCase()}`}>
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label={`${title} Bookings`} value={d.totalBookings.toLocaleString()} icon={Calendar} color="bg-[#0E6BB8]" />
          <KpiCard label="Confirmed" value={d.confirmed.toLocaleString()} icon={CheckCircle} color="bg-emerald-500" />
          <KpiCard label="Travelers" value={d.travelers.toLocaleString()} icon={Users} color="bg-purple-500" />
          <KpiCard label={`Revenue (${d.applied.label})`} value={fmtM(d.totalRevenue)} icon={DollarSign} color="bg-amber-500" />
        </div>
        <div className="grid grid-cols-3 gap-5">
          <Section title={`${title} Revenue — Monthly`} className="col-span-2">
            {d.monthly.length === 0 ? <p className="text-sm text-slate-400 py-10 text-center">No {title.toLowerCase()} bookings in range.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.monthly} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#0E6BB8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </Section>
          <Section title="Status Breakdown">
            <div className="space-y-3">
              {d.byStatus.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No data.</p>}
              {d.byStatus.map(s => (
                <div key={s.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 capitalize">{s.status.toLowerCase()}</span>
                    <span className="font-semibold text-slate-800">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#0E6BB8]" style={{ width: `${(s.count / Math.max(1, d.totalBookings)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
        <Section title={`${title} by Branch`}>
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="border-b border-slate-100">
                {["Branch", "Bookings", "Revenue (base)"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.byBranch.map(b => (
                <tr key={b.branchId} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4 text-sm font-medium text-slate-700">{b.branchName}</td>
                  <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{b.bookings}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(b.revenue)}</td>
                </tr>
              ))}
              {d.byBranch.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-sm text-slate-400">No bookings in range.</td></tr>}
            </tbody>
          </table>
        </Section>
      </div>
      )}
    </ReportState>
  );
}

// ─── AGENT REPORT ─────────────────────────────────────────────────────────────
function AgentReport({ rf }: { rf: ReportFilters }) {
  const q = useAgentsReport(rf);
  const d = q.data;
  return (
    <ReportState query={q} report="agent" isEmpty={!!d && d.agents.length === 0}>
      {d && (
      <div className="space-y-5" data-report="agents">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Active Agents" value={d.activeAgents.toLocaleString()} icon={Users} color="bg-[#0E6BB8]" />
          <KpiCard label={`Agent Bookings (${d.applied.label})`} value={d.totalBookings.toLocaleString()} icon={Calendar} color="bg-emerald-500" />
          <KpiCard label="Total Commission" value={fmtC(d.totalCommission)} icon={DollarSign} color="bg-amber-500" />
          <KpiCard label="Agent Revenue" value={fmtC(d.totalRevenue)} icon={TrendingUp} color="bg-blue-500" />
        </div>
        <Section title="Top Agents — Revenue vs Commission">
          {d.agents.length === 0 ? <p className="text-sm text-slate-400 py-10 text-center">No agent activity in range.</p> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.agents.slice(0, 6)} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#0E6BB8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="commission" name="Commission" fill="#E8471F" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </Section>
        <Section title="Agent Detail Report">
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="border-b border-slate-100">
                {["Agent", "Bookings", "Revenue (base)", "Commission (base)", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.agents.map(a => (
                <tr key={a.agentId} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4 text-sm font-medium text-slate-700">{a.name}</td>
                  <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{a.bookings}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(a.revenue)}</td>
                  <td className="py-3 pr-4 text-sm text-amber-600 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(a.commission)}</td>
                  <td className="py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", a.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{a.status}</span>
                  </td>
                </tr>
              ))}
              {d.agents.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-sm text-slate-400">No agents.</td></tr>}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td className="py-3 pr-4 text-xs font-bold text-slate-700">Total</td>
                <td className="py-3 pr-4 text-sm font-bold text-slate-700 font-mono">{d.totalBookings}</td>
                <td className="py-3 pr-4 text-sm font-bold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(d.totalRevenue)}</td>
                <td className="py-3 pr-4 text-sm font-bold text-amber-600 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(d.totalCommission)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </Section>
      </div>
      )}
    </ReportState>
  );
}

// ─── P&L ─────────────────────────────────────────────────────────────────────
function PnlReport({ rf }: { rf: ReportFilters }) {
  const q = usePnlReport(rf);
  const d = q.data;
  return (
    <ReportState query={q} report="P&L" isEmpty={!!d && d.revenue === 0 && d.expense === 0}>
      {d && (
      <div className="space-y-5" data-report="pnl">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label={`Revenue (${d.applied.label})`} value={fmtC(d.revenue)} icon={TrendingUp} color="bg-emerald-500" />
          <KpiCard label="Expenses" value={fmtC(d.expense)} icon={TrendingDown} color="bg-red-500" />
          <KpiCard label="Net Profit" value={fmtC(d.netProfit)} icon={DollarSign} color="bg-[#0E6BB8]" />
          <KpiCard label="Net Margin" value={`${d.netMargin}%`} icon={BarChart3} color="bg-amber-500" />
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle size={13} className="text-emerald-500" />
          Derived from <b>POSTED</b> journal entries only; reversed entries net to zero.
        </div>
        <Section title={`Revenue vs Expense — ${d.applied.label}`}>
          {d.monthly.length === 0 ? <p className="text-sm text-slate-400 py-10 text-center">No posted journal activity in range.</p> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.monthly} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#0E7C66" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </Section>
        <Section title={`Profit & Loss — ${d.applied.label}`}>
          <table className="w-full min-w-[480px] md:min-w-0">
            <tbody>
              <tr className="border-b border-slate-100"><td className="py-2.5 text-sm font-bold text-slate-800" colSpan={2}>Revenue</td></tr>
              {d.revenueLines.map(l => (
                <tr key={l.code} className="border-b border-slate-50">
                  <td className="py-2 pl-6 text-sm text-slate-600">{l.name}</td>
                  <td className="py-2 pr-2 text-sm text-right font-mono text-emerald-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(l.amount)}</td>
                </tr>
              ))}
              <tr className="border-b border-slate-200 bg-emerald-50/40"><td className="py-2 text-sm font-semibold text-slate-800">Total Revenue</td><td className="py-2 pr-2 text-sm text-right font-bold font-mono text-emerald-700">{fmtC(d.revenue)}</td></tr>
              <tr className="border-b border-slate-100"><td className="py-2.5 text-sm font-bold text-slate-800 pt-4" colSpan={2}>Expenses</td></tr>
              {d.expenseLines.map(l => (
                <tr key={l.code} className="border-b border-slate-50">
                  <td className="py-2 pl-6 text-sm text-slate-600">{l.name}</td>
                  <td className="py-2 pr-2 text-sm text-right font-mono text-red-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(l.amount)}</td>
                </tr>
              ))}
              <tr className="border-b border-slate-200 bg-red-50/40"><td className="py-2 text-sm font-semibold text-slate-800">Total Expenses</td><td className="py-2 pr-2 text-sm text-right font-bold font-mono text-red-600">{fmtC(d.expense)}</td></tr>
              <tr className="bg-[#0E6BB8]/5"><td className="py-3 text-sm font-bold text-[#0E6BB8]">Net Profit</td><td className="py-3 pr-2 text-sm text-right font-bold font-mono text-[#0E6BB8]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(d.netProfit)}</td></tr>
            </tbody>
          </table>
        </Section>
      </div>
      )}
    </ReportState>
  );
}

// ─── BALANCE SHEET ────────────────────────────────────────────────────────────
function BalanceSheetReport({ rf }: { rf: ReportFilters }) {
  const q = useBalanceSheet(rf);
  const d = q.data;
  const tbl = (title: string, rows: { code: string; name: string; balance: number }[], total: number, totalColor: string) => (
    <Section title={title}>
      <table className="w-full min-w-[280px] md:min-w-0">
        <tbody>
          {rows.map(a => (
            <tr key={a.code} className="border-b border-slate-50">
              <td className="py-2 text-xs text-slate-600">{a.name}</td>
              <td className="py-2 text-xs text-right font-mono text-slate-800">{fmtC(a.balance)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-xs text-slate-400">No balances.</td></tr>}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200"><td className="py-2 text-xs font-bold text-slate-800">Total</td><td className={cn("py-2 text-xs font-bold text-right font-mono", totalColor)}>{fmtC(total)}</td></tr>
        </tfoot>
      </table>
    </Section>
  );
  return (
    <ReportState query={q} report="balance sheet" isEmpty={!!d && d.totalAssets === 0 && d.totalLiabilities === 0 && d.totalEquity === 0}>
      {d && (
      <div className="space-y-5" data-report="balance-sheet">
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Total Assets" value={fmtC(d.totalAssets)} icon={Layers} color="bg-[#0E6BB8]" />
          <KpiCard label="Total Liabilities" value={fmtC(d.totalLiabilities)} icon={AlertTriangle} color="bg-red-500" />
          <KpiCard label="Total Equity" value={fmtC(d.totalEquity)} icon={TrendingUp} color="bg-emerald-500" />
        </div>
        <div className={cn("flex items-center gap-2 text-xs rounded-lg px-3 py-2 border", d.balanced ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700")}>
          {d.balanced ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
          {d.balanced
            ? `Balanced: Assets ${fmtC(d.totalAssets)} = Liabilities ${fmtC(d.totalLiabilities)} + Equity ${fmtC(d.totalEquity)} (incl. retained earnings ${fmtC(d.retainedEarnings)}).`
            : `Out of balance by ${fmtC(d.imbalance)}.`}
        </div>
        <div className="grid grid-cols-3 gap-5">
          {tbl("Assets", d.assets, d.totalAssets, "text-[#0E6BB8]")}
          {tbl("Liabilities", d.liabilities, d.totalLiabilities, "text-red-600")}
          {tbl("Equity", d.equity, d.totalEquity, "text-emerald-700")}
        </div>
      </div>
      )}
    </ReportState>
  );
}

// ─── CASH FLOW ────────────────────────────────────────────────────────────────
function CashFlowReport({ rf }: { rf: ReportFilters }) {
  const q = useCashFlow(rf);
  const d = q.data;
  return (
    <ReportState query={q} report="cash flow" isEmpty={!!d && d.monthly.length === 0}>
      {d && (
      <div className="space-y-5" data-report="cashflow">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Operating" value={fmtC(d.totalOperating)} icon={TrendingUp} color="bg-emerald-500" />
          <KpiCard label="Investing" value={fmtC(d.totalInvesting)} icon={TrendingDown} color="bg-red-500" />
          <KpiCard label="Financing" value={fmtC(d.totalFinancing)} icon={DollarSign} color="bg-amber-500" />
          <KpiCard label="Net Cash Change" value={fmtC(d.netChange)} icon={BarChart3} color="bg-[#0E6BB8]" />
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">{d.note}</div>
        <Section title={`Cash Flow — ${d.applied.label}`}>
          {d.monthly.length === 0 ? <p className="text-sm text-slate-400 py-10 text-center">No cash movement in range.</p> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.monthly} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="operating" name="Operating" fill="#0E7C66" radius={[3, 3, 0, 0]} />
              <Bar dataKey="investing" name="Investing" fill="#EF4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="financing" name="Financing" fill="#E8471F" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </Section>
        <Section title="Cash Flow Statement">
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Month</th>
                {["Operating", "Investing", "Financing", "Net", "Running Balance"].map(h => (
                  <th key={h} className="text-right text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.monthly.map(m => (
                <tr key={m.ym} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4 text-sm font-medium text-slate-700">{m.month}</td>
                  <td className="py-3 pr-4 text-sm text-right font-mono text-emerald-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(m.operating)}</td>
                  <td className="py-3 pr-4 text-sm text-right font-mono text-red-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(m.investing)}</td>
                  <td className="py-3 pr-4 text-sm text-right font-mono text-amber-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(m.financing)}</td>
                  <td className={cn("py-3 pr-4 text-sm text-right font-bold font-mono", m.net >= 0 ? "text-emerald-700" : "text-red-600")} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(m.net)}</td>
                  <td className="py-3 pr-4 text-sm text-right font-mono font-semibold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(m.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="py-3 pr-4 text-xs font-bold text-slate-800">Total</td>
                <td className="py-3 pr-4 text-sm font-bold text-right font-mono text-emerald-700">{fmtC(d.totalOperating)}</td>
                <td className="py-3 pr-4 text-sm font-bold text-right font-mono text-red-600">{fmtC(d.totalInvesting)}</td>
                <td className="py-3 pr-4 text-sm font-bold text-right font-mono text-amber-600">{fmtC(d.totalFinancing)}</td>
                <td className="py-3 pr-4 text-sm font-bold text-right font-mono text-[#0E6BB8]">{fmtC(d.netChange)}</td>
                <td className="py-3 pr-4" />
              </tr>
            </tfoot>
          </table>
        </Section>
      </div>
      )}
    </ReportState>
  );
}

// ─── CUSTOM REPORTS ───────────────────────────────────────────────────────────
const SAVED_REPORTS = [
  { name:"Monthly Agent Commission Summary", schedule:"1st of each month", lastRun:"Jul 1", format:"Excel" },
  { name:"Hajj Season Occupancy Report", schedule:"Weekly (Mon)", lastRun:"Jul 8", format:"PDF" },
  { name:"Branch Revenue Comparison", schedule:"Monthly", lastRun:"Jul 1", format:"Excel" },
  { name:"Overdue Payments Alert", schedule:"Daily", lastRun:"Jul 14", format:"Email" },
];

function CustomReports() {
  const [fields, setFields] = useState(["Date","Customer","Service","Branch","Amount","Status"]);
  const [drag, setDrag] = useState<string | null>(null);
  const AVAILABLE = ["Date","Booking ID","Customer","Phone","Service","Branch","Agent","Amount","Paid","Balance","Status","Departure","Notes"];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        {/* Builder */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Report Builder</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Report Name</label>
              <input defaultValue="Custom Booking Report — Jul 2024"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Primary Group By</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option>Service Type</option><option>Branch</option><option>Agent</option><option>Month</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sort By</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option>Amount (desc)</option><option>Date (desc)</option><option>Customer</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Columns to Include</label>
              <div className="flex flex-wrap gap-1.5 p-3 border border-slate-200 rounded-lg min-h-[80px] bg-slate-50">
                {fields.map(f => (
                  <span key={f} className="flex items-center gap-1 px-2 py-1 bg-[#0E6BB8] text-white text-xs rounded-md">
                    {f}
                    <button onClick={() => setFields(prev => prev.filter(x => x !== f))} className="hover:opacity-70">×</button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">Click × to remove · Add from list below</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Available Columns</label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE.filter(a => !fields.includes(a)).map(a => (
                  <button key={a} onClick={() => setFields(prev => [...prev, a])}
                    className="px-2 py-1 border border-slate-200 text-xs text-slate-600 rounded-md hover:border-[#0E6BB8] hover:text-[#0E6BB8] transition-colors">
                    + {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button className="flex-1 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
                Generate Report
              </button>
              <button className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                Save Template
              </button>
            </div>
          </div>
        </div>
        {/* Saved / scheduled */}
        <div className="space-y-4">
          <Section title="Saved Report Templates">
            <div className="space-y-3">
              {SAVED_REPORTS.map(r => (
                <div key={r.name} className="flex items-start justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{r.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <Clock size={10} className="inline mr-1" />{r.schedule} · Last: {r.lastRun}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium",
                      r.format === "PDF" ? "bg-red-50 text-red-600" :
                      r.format === "Excel" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>
                      {r.format}
                    </span>
                    <button className="text-xs text-[#0E6BB8] hover:underline">Run</button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Schedule a Report">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Frequency</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option>Daily</option><option>Weekly</option><option>Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Deliver to</label>
                <input placeholder="email@example.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Format</label>
                <div className="flex gap-2">
                  {["PDF","Excel","CSV"].map(fmt => (
                    <label key={fmt} className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
                      <input type="radio" name="fmt" value={fmt} defaultChecked={fmt === "Excel"} />
                      {fmt}
                    </label>
                  ))}
                </div>
              </div>
              <button className="w-full py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                Set Schedule
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────
const SERVICE_ENUM: Record<string, string | undefined> = {
  hajj: "HAJJ", umrah: "UMRAH", visa: "VISA", "air-ticket": "AIR_TICKET", manpower: "MANPOWER", tour: "TOUR",
};
// which CSV export each report view maps to (endpoint supports sales/bookings/agents/pnl)
const EXPORT_FOR: Record<ReportView, "sales" | "bookings" | "agents" | "pnl" | null> = {
  overview: "bookings", bookings: "bookings", sales: "sales", agents: "agents",
  hajj: "bookings", umrah: "bookings", visa: "bookings", manpower: "bookings",
  pnl: "pnl", "balance-sheet": "pnl", cashflow: "pnl", custom: null,
};

export function ReportsModule() {
  const [view, setView] = useState<ReportView>("overview");
  const { data: branches } = useBranches();
  const [filters, setFilters] = useState<Filters>({
    dateRange: "ytd",
    branch: "all",
    service: "all",
    agent: "all",
  });

  // map the UI filters onto the backend report query
  const rf: ReportFilters = {
    range: filters.dateRange === "custom" ? "ytd" : filters.dateRange,
    branchId: filters.branch,
    serviceType: SERVICE_ENUM[filters.service],
    agentId: filters.agent !== "all" ? filters.agent : undefined,
  };

  const updateFilters = (partial: Partial<Filters>) => setFilters(prev => ({ ...prev, ...partial }));
  const handleViewChange = (v: ReportView) => setView(v);

  const handleExport = (type: "pdf" | "excel") => {
    if (type === "pdf") { toast.info("PDF export is deferred — use Excel/CSV for now."); return; }
    const report = EXPORT_FOR[view];
    if (!report) { toast.info("This view has no tabular export."); return; }
    void downloadReport(report, rf);
  };

  const REPORT_TITLES: Record<ReportView, { title: string; subtitle: string }> = {
    overview:       { title: "Dashboard & Analytics", subtitle: "Executive KPI summary across all operations" },
    bookings:       { title: "Booking Report", subtitle: "All bookings by customer, service, and branch" },
    sales:          { title: "Sales Report", subtitle: "Revenue performance vs targets" },
    hajj:           { title: "Hajj Report", subtitle: "Applications, approvals, departures & revenue" },
    umrah:          { title: "Umrah Report", subtitle: "Packages, pilgrims & revenue breakdown" },
    visa:           { title: "Visa Report", subtitle: "Applications funnel & approval rates" },
    manpower:       { title: "Manpower Report", subtitle: "Worker placements by country & category" },
    agents:         { title: "Agent Report", subtitle: "Agent performance, bookings & commissions" },
    pnl:            { title: "Profit & Loss Statement", subtitle: "Income, expenses & net profit" },
    "balance-sheet":{ title: "Balance Sheet", subtitle: "Assets, liabilities & equity" },
    cashflow:       { title: "Cash Flow Statement", subtitle: "Operating, investing & financing activities" },
    custom:         { title: "Custom Reports", subtitle: "Build, schedule & export tailored reports" },
  };

  const { title, subtitle } = REPORT_TITLES[view];

  const renderReport = () => {
    switch (view) {
      case "overview":        return <OverviewReport rf={rf} />;
      case "bookings":        return <BookingReport rf={rf} />;
      case "sales":           return <SalesReport rf={rf} />;
      case "hajj":            return <ServiceReportView rf={rf} type="HAJJ" title="Hajj" />;
      case "umrah":           return <ServiceReportView rf={rf} type="UMRAH" title="Umrah" />;
      case "visa":            return <ServiceReportView rf={rf} type="VISA" title="Visa" />;
      case "manpower":        return <ServiceReportView rf={rf} type="MANPOWER" title="Manpower" />;
      case "agents":          return <AgentReport rf={rf} />;
      case "pnl":             return <PnlReport rf={rf} />;
      case "balance-sheet":   return <BalanceSheetReport rf={rf} />;
      case "cashflow":        return <CashFlowReport rf={rf} />;
      case "custom":          return <CustomReports />;
      default:                return null;
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      {/* Sub-nav */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reports & Analytics</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group} className="mb-1">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{group}</p>
              {items.map(item => (
                <button key={item.id} onClick={() => handleViewChange(item.id)}
                  className={cn("w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                    view === item.id
                      ? "bg-[#0E6BB8]/8 text-[#0E6BB8] font-medium"
                      : "text-slate-600 hover:bg-slate-50")}>
                  <item.icon size={15} className={view === item.id ? "text-[#0E6BB8]" : "text-slate-400"} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Quick export strip */}
        <div className="p-3 border-t border-slate-100 space-y-1.5">
          <button onClick={() => handleExport("pdf")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Printer size={12} /> Export current as PDF
          </button>
          <button onClick={() => handleExport("excel")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
            <Download size={12} /> Export as Excel
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <FilterBar
            filters={filters}
            branches={branches ?? []}
            onChange={updateFilters}
            onExport={handleExport}
            onRefresh={() => setFilters(prev => ({ ...prev }))}
            title={title}
            subtitle={subtitle}
          />
          {renderReport()}
        </div>
      </div>
    </div>
  );
}
