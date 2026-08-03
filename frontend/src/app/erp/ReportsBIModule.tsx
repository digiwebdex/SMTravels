import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  LayoutDashboard, Plane, Hotel, TrendingUp, TrendingDown, DollarSign, Users,
  BarChart3, Star, Activity, Zap, Target, Award, RefreshCw,
  Download, Printer, Filter, Calendar, Building2, Search,
  ChevronRight, Plus, X, GripVertical, Eye, Check,
  ArrowUpRight, ArrowDownRight, Clock, AlertTriangle,
  FileText, Sliders, Globe, Layers, CheckCircle, TrendingDown,
} from "lucide-react";
import { SampleBadge } from "../portal/SampleBadge";
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

// ─── Mock data (staff KPI / custom builder — no API) ───────────────────────────
const STAFF = [
  { name:"Abdullah Chowdhury", role:"Ops Manager",  tasks:48, done:45, csat:96, sales:0,       hours:176, kpi:94 },
  { name:"Fatema Begum",       role:"Visa Officer",  tasks:62, done:60, csat:92, sales:0,       hours:168, kpi:91 },
  { name:"Rahim Khan",         role:"Sales Exec",   tasks:38, done:36, csat:89, sales:8400000,  hours:172, kpi:87 },
  { name:"Nasir Ahmed",        role:"Manpower Mgr", tasks:29, done:28, csat:88, sales:0,       hours:160, kpi:85 },
  { name:"Salma Khatun",       role:"Customer Rel.",tasks:55, done:51, csat:94, sales:0,       hours:168, kpi:89 },
  { name:"Kamal Hossain",      role:"Accounts",     tasks:41, done:40, csat:0,  sales:0,       hours:176, kpi:92 },
];

const RADAR_DATA = [
  { subject:"Bookings",    A:94, B:80 },
  { subject:"Revenue",     A:88, B:72 },
  { subject:"CSAT",        A:96, B:78 },
  { subject:"Attendance",  A:100,B:90 },
  { subject:"Tasks",       A:92, B:85 },
  { subject:"Compliance",  A:98, B:88 },
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
  const [selected, setSelected] = useState(0);
  const emp = STAFF[selected];
  return (
    <div className="space-y-5">
      <SampleBadge />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Staff KPI Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Individual performance tracking — July 2024</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
            <Printer size={14} /> PDF Report
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Avg KPI Score",   value:"90%",   delta:"+4%", up:true, icon:Award,      color:"bg-[#1B75BC]"  },
          { label:"Tasks Completed", value:"260/273",delta:"+8%", up:true, icon:CheckCircle,color:"bg-emerald-500"},
          { label:"Avg CSAT",        value:"91.8%",  delta:"+3%", up:true, icon:Star,       color:"bg-amber-500"  },
          { label:"Avg Hours",       value:"170h",   delta:"",    up:true, icon:Clock,      color:"bg-blue-500"   },
        ].map(p => <KpiCard key={p.label} {...p} />)}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Staff list */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Team Members</p>
          </div>
          <div>
            {STAFF.map((s, i) => (
              <button key={i} onClick={() => setSelected(i)}
                className={cn("w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 transition-colors",
                  selected === i ? "bg-[#1B75BC]/5 border-l-2 border-[#1B75BC]" : "")}>
                <div className="w-8 h-8 rounded-full bg-[#1B75BC] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {s.name.slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.role}</p>
                </div>
                <span className={cn("text-xs font-bold ml-auto",
                  s.kpi >= 90 ? "text-emerald-600" : s.kpi >= 80 ? "text-amber-600" : "text-red-500")}>
                  {s.kpi}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail + radar */}
        <div className="col-span-2 space-y-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-slate-800 text-base">{emp.name}</p>
                <p className="text-sm text-slate-500">{emp.role}</p>
              </div>
              <div className={cn("text-3xl font-black",
                emp.kpi >= 90 ? "text-emerald-600" : emp.kpi >= 80 ? "text-amber-600" : "text-red-500")}>
                {emp.kpi}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label:"Tasks Done", value:`${emp.done}/${emp.tasks}`, color:"text-[#1B75BC]" },
                { label:"CSAT Score", value:emp.csat > 0 ? `${emp.csat}%` : "N/A", color:"text-emerald-600" },
                { label:"Hours Worked", value:`${emp.hours}h`, color:"text-slate-700" },
                { label:"Sales Revenue", value:emp.sales > 0 ? fmtC(emp.sales) : "N/A", color:"text-amber-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                  <p className={cn("text-lg font-bold", color)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
            <p className="text-sm font-semibold text-slate-800 mb-3">Performance Radar</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius={75}>
                <PolarGrid stroke="#F1F5F9" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#CBD5E1" }} tickCount={4} />
                <Radar name="This Period" dataKey="A" stroke="#1B75BC" fill="#1B75BC" fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Department Avg" dataKey="B" stroke="#F15A24" fill="#F15A24" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOM REPORT BUILDER ────────────────────────────────────────────────────
const ALL_FIELDS = [
  { id:"date",      label:"Date",           group:"Basic"    },
  { id:"booking_id",label:"Booking ID",     group:"Basic"    },
  { id:"customer",  label:"Customer Name",  group:"Customer" },
  { id:"phone",     label:"Phone",          group:"Customer" },
  { id:"email",     label:"Email",          group:"Customer" },
  { id:"service",   label:"Service Type",   group:"Service"  },
  { id:"package",   label:"Package Name",   group:"Service"  },
  { id:"branch",    label:"Branch",         group:"Office"   },
  { id:"agent",     label:"Agent",          group:"Office"   },
  { id:"staff",     label:"Staff Member",   group:"Office"   },
  { id:"amount",    label:"Amount",         group:"Finance"  },
  { id:"paid",      label:"Amount Paid",    group:"Finance"  },
  { id:"balance",   label:"Balance Due",    group:"Finance"  },
  { id:"method",    label:"Payment Method", group:"Finance"  },
  { id:"status",    label:"Status",         group:"Status"   },
  { id:"departure", label:"Departure Date", group:"Travel"   },
  { id:"return",    label:"Return Date",    group:"Travel"   },
  { id:"visa_no",   label:"Visa Number",    group:"Travel"   },
  { id:"hotel",     label:"Hotel",          group:"Travel"   },
  { id:"flight",    label:"Flight No.",     group:"Travel"   },
  { id:"notes",     label:"Notes",          group:"Basic"    },
];

const PREVIEW_ROWS = [
  { date:"Jul 14", booking_id:"BK-0892", customer:"Md. Abdullah", service:"Hajj Economy", branch:"Chattogram HQ", amount:"৳5,20,000", status:"Confirmed" },
  { date:"Jul 13", booking_id:"BK-0891", customer:"Rabeya Khatun", service:"Umrah VIP",  branch:"Dhaka Office",  amount:"৳1,85,000", status:"Partial"   },
  { date:"Jul 12", booking_id:"BK-0890", customer:"Ahmed Family",  service:"Malaysia Tour",branch:"Chattogram HQ",amount:"৳2,15,000", status:"Pending"   },
];

function CustomBuilder() {
  const [selected, setSelected] = useState(["date","booking_id","customer","service","branch","amount","status"]);
  const [groupBy, setGroupBy] = useState("service");
  const [sortBy, setSortBy] = useState("date");
  const [preview, setPreview] = useState(false);
  const [name, setName] = useState("My Custom Report");

  const groups = [...new Set(ALL_FIELDS.map(f => f.group))];
  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="space-y-5">
      <SampleBadge />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Custom Report Builder</h2>
          <p className="text-sm text-slate-500 mt-0.5">Drag-select fields · configure · preview · export</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(v => !v)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all",
              preview ? "bg-[#1B75BC] text-white border-[#1B75BC]" : "border-[var(--color-border)] text-slate-600 hover:bg-slate-50")}>
            <Eye size={14} /> {preview ? "Hide Preview" : "Preview"}
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
            <Printer size={14} /> PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Field selector */}
        <div className="col-span-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-slate-800">Select Fields</p>
            <span className="text-xs text-slate-400">{selected.length} selected</span>
          </div>
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{group}</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_FIELDS.filter(f => f.group === group).map(f => (
                    <button key={f.id} onClick={() => toggle(f.id)}
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all",
                        selected.includes(f.id)
                          ? "bg-[#1B75BC] text-white border-[#1B75BC]"
                          : "border-[var(--color-border)] text-slate-600 hover:border-[#1B75BC] hover:text-[#1B75BC]")}>
                      {selected.includes(f.id) && <Check size={11} />}
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Selected chips with drag handles */}
          {selected.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Column Order (drag to reorder)</p>
              <div className="flex flex-wrap gap-2">
                {selected.map(id => {
                  const f = ALL_FIELDS.find(x => x.id === id)!;
                  return (
                    <div key={id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1B75BC]/10 border border-[#1B75BC]/20 rounded-lg text-xs text-[#1B75BC]">
                      <GripVertical size={11} className="text-[#1B75BC]/40 cursor-grab" />
                      {f.label}
                      <button onClick={() => toggle(id)} className="hover:text-red-500"><X size={10} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Config panel */}
        <div className="space-y-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Report Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Report Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date Range</label>
                <select className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
                  {["This Month","Last Month","Q2 2024","YTD 2024","Custom…"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Group By</label>
                <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
                  {["none","service","branch","agent","month","status"].map(o => <option key={o} value={o}>{o === "none" ? "No grouping" : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sort By</label>
                <div className="flex gap-2">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="flex-1 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
                    {selected.map(id => <option key={id} value={id}>{ALL_FIELDS.find(f=>f.id===id)?.label}</option>)}
                  </select>
                  <select className="border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm focus:outline-none">
                    <option>Desc</option><option>Asc</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Filters</label>
                {[
                  { label:"Branch", opts:["All","Chattogram HQ","Dhaka"] },
                  { label:"Service", opts:["All","Hajj","Umrah","Visa"] },
                  { label:"Status", opts:["All","Confirmed","Pending","Overdue"] },
                ].map(f => (
                  <select key={f.label} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm mb-1.5 focus:outline-none">
                    {f.opts.map(o => <option key={o}>{o === "All" ? `${f.label}: All` : o}</option>)}
                  </select>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">Run Report</button>
                <button className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">Save</button>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">Saved Templates</p>
            {["Monthly Agent Summary","Hajj Season Overview","Overdue Payments"].map(t => (
              <button key={t} className="w-full text-left text-xs text-[#1B75BC] hover:underline py-1 flex items-center gap-1.5">
                <ChevronRight size={10} /> {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview table */}
      {preview && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[#1B75BC]/20 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#1B75BC]/5 border-b border-[#1B75BC]/10">
            <p className="text-sm font-semibold text-[#1B75BC]">Report Preview — {name}</p>
            <span className="text-xs text-slate-400">Showing 3 of ~{Math.floor(Math.random()*200+100)} rows</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {selected.map(id => (
                    <th key={id} className="text-left text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">
                      {ALL_FIELDS.find(f=>f.id===id)?.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PREVIEW_ROWS.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    {selected.map(id => (
                      <td key={id} className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {(row as any)[id] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Preview showing 3 sample rows</span>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
                <Printer size={12} /> Export PDF
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Download size={12} /> Export Excel
              </button>
            </div>
          </div>
        </div>
      )}
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
