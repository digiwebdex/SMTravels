import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  CalendarDays, Wallet, Users, TrendingUp, Plane, AlertTriangle,
  Plus, Send, Download, RefreshCw, ChevronRight, Briefcase, Receipt,
  BarChart3, User, Clock, type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { formatAmount, formatAmountShort, EmptyState, SkeletonKpi, ErrorBanner } from "../lib/ds";
import { useDashboardSummary } from "../hooks/dashboard";
import { relAge } from "../hooks/notifications";
import type {
  DashboardSummary, DashboardKpis, DashboardBooking, DashboardActivity, DashboardTask, FunnelStage,
} from "@contracts/dashboard.contract";
import type { MonthlyPoint, ServiceSlice, BranchRow } from "@contracts/report.contract";

// ─── Outlet context from ErpLayout (real branch id + label + date-range label) ──
interface OutletCtx { branchId: string; branchLabel: string; dateRange: string; }

// ─── Service + status palettes ─────────────────────────────────────────────────
const SERVICE_COLOR: Record<string, string> = {
  HAJJ: "#1B75BC", UMRAH: "#F15A24", VISA: "#0E7C66", AIR_TICKET: "#2563EB",
  MANPOWER: "#7C3AED", TOUR: "#EA580C", HOTEL: "#0891B2",
};
const SERVICE_LABEL: Record<string, string> = {
  HAJJ: "Hajj", UMRAH: "Umrah", VISA: "Visa", AIR_TICKET: "Air Ticket",
  MANPOWER: "Manpower", TOUR: "Tour", HOTEL: "Hotel",
};

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  CONFIRMED:  { color: "#065F46", bg: "#D1FAE5" },
  COMPLETED:  { color: "#0F766E", bg: "#CCFBF1" },
  PROCESSING: { color: "#1D4ED8", bg: "#DBEAFE" },
  PENDING:    { color: "#92400E", bg: "#FEF3C7" },
  ON_HOLD:    { color: "#92400E", bg: "#FEF3C7" },
  CANCELLED:  { color: "#991B1B", bg: "#FEE2E2" },
  DRAFT:      { color: "#6B7280", bg: "#F3F4F6" },
};
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || { color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {titleCase(status)}
    </span>
  );
}

const PRIORITY_CFG: Record<string, { color: string; label: string }> = {
  HIGH:   { color: "#DC2626", label: "High" },
  MEDIUM: { color: "#F59E0B", label: "Med" },
  LOW:    { color: "#0E7C66", label: "Low" },
};

// ─── Shared layout bits (kept from the original design) ─────────────────────────
function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-[14px] font-bold text-[#111827]">{title}</h2>
        {sub && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white border border-[#E5E7EB] rounded-[14px] p-5", className)}>{children}</div>;
}
const viewAll = (
  <button className="flex items-center gap-1 text-[11px] text-[#1B75BC] font-semibold hover:underline cursor-pointer">
    View all <ChevronRight size={12} />
  </button>
);

// ─── KPI cards ──────────────────────────────────────────────────────────────────
function KpiCards({ kpis, rangeLabel, loading }: { kpis?: DashboardKpis; rangeLabel: string; loading: boolean }) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonKpi key={i} />)}
      </div>
    );
  }
  const cards = [
    { label: "Total Bookings", value: kpis.bookings.toLocaleString("en-BD"), icon: CalendarDays, color: "#1B75BC", bg: "#EEF2FF", raw: rangeLabel },
    { label: "Revenue", value: formatAmountShort(kpis.revenue), icon: Wallet, color: "#0E7C66", bg: "#ECFDF5", raw: formatAmount(kpis.revenue) },
    { label: "Pending Dues", value: formatAmountShort(kpis.pendingDues), icon: AlertTriangle, color: "#DC2626", bg: "#FEF2F2", raw: kpis.overdueCount > 0 ? `${kpis.overdueCount} overdue` : "none overdue" },
    { label: "New Leads", value: kpis.newLeads.toLocaleString("en-BD"), icon: TrendingUp, color: "#F15A24", bg: "#FFF9E6", raw: `${kpis.qualifiedLeads} qualified · ${kpis.wonLeads} won` },
    { label: "Active Agents", value: kpis.activeAgents.toLocaleString("en-BD"), icon: Briefcase, color: "#7C3AED", bg: "#F5F3FF", raw: "currently active" },
    { label: "Upcoming Departures", value: kpis.upcomingDepartures.toLocaleString("en-BD"), icon: Plane, color: "#2563EB", bg: "#EFF6FF", raw: `${kpis.upcomingPilgrims.toLocaleString("en-BD")} pilgrims` },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((k) => {
        const Icon = k.icon;
        return (
          <Card key={k.label} className="p-4 hover:shadow-md transition-shadow cursor-default">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: k.bg }}>
                <Icon size={17} style={{ color: k.color }} />
              </div>
            </div>
            <div className="font-mono text-[20px] font-bold text-[#111827] leading-tight mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {k.value}
            </div>
            <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">{k.label}</div>
            <div className="text-[10px] text-[#9CA3AF] mt-0.5 truncate">{k.raw}</div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Revenue trend ──────────────────────────────────────────────────────────────
function RevenueChart({ data, rangeLabel }: { data: MonthlyPoint[]; rangeLabel: string }) {
  const [mode, setMode] = useState<"revenue" | "bookings">("revenue");
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const fmt = (v: number) => (mode === "revenue" ? `৳${(v / 1_000_000).toFixed(1)}M` : String(v));
  return (
    <Card>
      <SectionHeader
        title="Revenue Trend"
        sub={`Monthly performance · ${rangeLabel}`}
        action={
          <div className="flex bg-[#F3F4F6] rounded-[8px] p-0.5">
            {(["revenue", "bookings"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={cn("px-2.5 py-1 rounded-[6px] text-[11px] font-medium capitalize transition-all cursor-pointer",
                  mode === m ? "bg-white text-[#1B75BC] shadow-sm" : "text-[#9CA3AF] hover:text-[#374151]")}>
                {m}
              </button>
            ))}
          </div>
        }
      />
      {data.length === 0 ? (
        <EmptyState variant="no-data" compact title="No revenue yet" desc="Issued invoices and bookings will chart here as they are recorded." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B75BC" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B75BC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                formatter={(v: number) => [mode === "revenue" ? formatAmount(v) : v, mode === "revenue" ? "Revenue" : "Bookings"]}
              />
              <Area type="monotone" dataKey={mode} stroke="#1B75BC" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F3F4F6]">
            <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
              <div className="w-3 h-0.5 bg-[#1B75BC] rounded" /> Revenue (baseAmount, BDT)
            </div>
            <div className="ml-auto text-[10px] text-[#9CA3AF]">
              {rangeLabel} Revenue: <span className="font-bold text-[#111827]">{formatAmount(total)}</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Service breakdown donut ────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>;
}
function ServiceBreakdown({ data }: { data: ServiceSlice[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  // % is share of BOOKINGS (matches the section title + count-sized slices),
  // not revenue share — the donut is sized by count.
  const pctOf = (c: number) => (total > 0 ? (c / total) * 100 : 0);
  const rows = data.map((d) => ({ ...d, color: SERVICE_COLOR[d.service] ?? "#6B7280" }));
  return (
    <Card>
      <SectionHeader title="Bookings by Service" sub={total > 0 ? `${total.toLocaleString("en-BD")} bookings` : "No bookings yet"} />
      {total === 0 ? (
        <EmptyState variant="no-data" compact title="No bookings yet" desc="Confirmed bookings will break down by service here." />
      ) : (
        <>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={rows} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" labelLine={false} label={CustomLabel}>
                  {rows.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }}
                  formatter={(v: number, _n, p: any) => [`${v} bookings (${pctOf(v).toFixed(1)}%)`, p?.payload?.label]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-1">
            {rows.map((d) => (
              <div key={d.service} className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6B7280] flex-1">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.count}</span>
                <span className="text-[10px] text-[#9CA3AF] w-10 text-right">{pctOf(d.count).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Branch performance (relative to the strongest branch — no fabricated target) ─
const BAR_COLORS = ["#1B75BC", "#2563EB", "#0E7C66", "#F15A24", "#7C3AED"];
function BranchPerformance({ data }: { data: BranchRow[] }) {
  const max = data.reduce((m, b) => Math.max(m, b.revenue), 0) || 1;
  return (
    <Card>
      <SectionHeader title="Branch Performance" sub="Revenue by branch · applied period" action={viewAll} />
      {data.length === 0 ? (
        <EmptyState variant="no-data" compact title="No branch activity" desc="Branch revenue appears here once bookings are placed." />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((b, i) => {
            const pct = Math.round((b.revenue / max) * 100);
            const color = BAR_COLORS[i % BAR_COLORS.length];
            return (
              <div key={b.branchId} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[9px] font-black text-white" style={{ backgroundColor: color }}>
                  {i + 1}
                </div>
                <div className="w-24 flex-shrink-0">
                  <div className="text-[11px] font-medium text-[#374151] truncate">{b.branchName}</div>
                  <div className="text-[10px] text-[#9CA3AF]">{b.bookings} bkgs</div>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
                <div className="w-16 text-right flex-shrink-0">
                  <div className="text-[11px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatAmountShort(b.revenue)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Lead funnel ─────────────────────────────────────────────────────────────────
const FUNNEL_FILL = ["#1B75BC", "#1e4d9b", "#2563EB", "#F15A24", "#0E7C66"];
function LeadFunnel({ data }: { data: FunnelStage[] }) {
  const totalLeads = data.reduce((s, d) => s + d.count, 0);
  const won = data.find((d) => d.stage === "WON")?.count ?? 0;
  const conv = totalLeads > 0 ? (won / totalLeads) * 100 : 0;
  const chartData = data.map((d, i) => ({ ...d, fill: FUNNEL_FILL[i % FUNNEL_FILL.length] }));
  return (
    <Card>
      <SectionHeader title="Lead Funnel" sub="Sales pipeline · current leads by stage" />
      {totalLeads === 0 ? (
        <EmptyState variant="no-data" compact title="No leads yet" desc="New leads and their pipeline stages will show here." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={75} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }} formatter={(v: number) => [v, "Leads"]} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
                {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-5 gap-1 mt-3 pt-3 border-t border-[#F3F4F6]">
            {data.map((d) => (
              <div key={d.stage} className="text-center">
                <div className="text-[14px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.count}</div>
                <div className="text-[8px] text-[#9CA3AF] leading-tight">{d.label.split(" ")[0]}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[10px] text-[#9CA3AF]">
            <span>Won share of pipeline</span>
            <span className="font-bold text-[#0E7C66]">{conv.toFixed(1)}%</span>
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Activity feed ───────────────────────────────────────────────────────────────
const MODULE_ICON: Record<string, LucideIcon> = {
  bookings: CalendarDays, invoices: Wallet, crm: TrendingUp, documents: User,
};
const MODULE_COLOR: Record<string, { color: string; bg: string }> = {
  bookings: { color: "#1B75BC", bg: "#EEF2FF" },
  invoices: { color: "#0E7C66", bg: "#ECFDF5" },
  crm:      { color: "#F15A24", bg: "#FFF9E6" },
  documents:{ color: "#7C3AED", bg: "#F5F3FF" },
};
function ActivityFeed({ data }: { data: DashboardActivity[] }) {
  return (
    <Card className="flex flex-col h-full">
      <SectionHeader title="Activity Feed" sub="Recent system events" action={data.length > 0 ? viewAll : undefined} />
      {data.length === 0 ? (
        <EmptyState variant="no-data" compact title="No activity yet" desc="Actions across the ERP will stream here." />
      ) : (
        <div className="flex flex-col gap-0 relative">
          <div className="absolute left-4 top-4 bottom-0 w-px bg-[#F3F4F6]" />
          {data.map((item) => {
            const Icon = (item.module && MODULE_ICON[item.module]) || RefreshCw;
            const cfg = (item.module && MODULE_COLOR[item.module]) || { color: "#6B7280", bg: "#F3F4F6" };
            return (
              <div key={item.id} className="flex gap-3 pb-4 relative">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ring-2 ring-white" style={{ backgroundColor: cfg.bg }}>
                  <Icon size={13} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 pt-1 min-w-0">
                  <p className="text-[11px] text-[#374151] leading-snug">
                    {item.actor && <span className="font-semibold">{item.actor} </span>}
                    <span className="text-[#9CA3AF]">{item.action.toLowerCase().replace(/_/g, " ")}</span>
                    {item.target && <span className="font-medium text-[#111827]"> · {item.target}</span>}
                  </p>
                  <p className="text-[9px] text-[#9CA3AF] mt-0.5">{relAge(item.createdAt)} ago</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Bookings table ──────────────────────────────────────────────────────────────
function BookingsTable({ data }: { data: DashboardBooking[] }) {
  return (
    <Card>
      <SectionHeader title="Latest Bookings" sub={`${data.length} most recent`} action={data.length > 0 ? viewAll : undefined} />
      {data.length === 0 ? (
        <EmptyState variant="no-data" title="No bookings yet" desc="New bookings will appear here as your team creates them." />
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-[#F3F4F6]">
                {["Booking", "Customer", "Service", "Package", "Agent", "Departure", "Amount", "Status"].map((h) => (
                  <th key={h} className="text-left pb-2 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="border-b border-[#F7F8FA] hover:bg-[#F7F8FA] transition-colors group">
                  <td className="py-3 pr-4">
                    <span className="text-[11px] font-bold text-[#1B75BC]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.bookingNo ?? "—"}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1B75BC]/10 flex items-center justify-center text-[9px] font-black text-[#1B75BC]">
                        {(b.customerName ?? "?")[0]}
                      </div>
                      <span className="text-[11px] font-medium text-[#111827] whitespace-nowrap">{b.customerName ?? "—"}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap" style={{ backgroundColor: SERVICE_COLOR[b.serviceType] || "#6B7280" }}>
                      {SERVICE_LABEL[b.serviceType] ?? b.serviceType}
                    </span>
                  </td>
                  <td className="py-3 pr-4"><span className="text-[11px] text-[#6B7280] whitespace-nowrap">{b.packageName ?? "—"}</span></td>
                  <td className="py-3 pr-4"><span className="text-[11px] text-[#6B7280] whitespace-nowrap">{b.agentName ?? "Direct"}</span></td>
                  <td className="py-3 pr-4"><span className="text-[11px] text-[#374151]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.departureDate ?? "—"}</span></td>
                  <td className="py-3 pr-4"><span className="text-[11px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatAmount(b.amount, b.currency as "BDT")}</span></td>
                  <td className="py-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── My tasks (read-only in Phase 1 — task management lives in CRM/Ops) ──────────
function TasksPanel({ data }: { data: DashboardTask[] }) {
  return (
    <Card>
      <SectionHeader title="My Tasks" sub={`${data.length} open`} />
      {data.length === 0 ? (
        <EmptyState variant="no-data" compact title="No open tasks" desc="Tasks assigned to you will appear here." />
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((t) => {
            const pr = PRIORITY_CFG[t.priority] ?? PRIORITY_CFG.MEDIUM;
            return (
              <div key={t.id} className="flex items-start gap-2.5 p-2.5 rounded-[8px] hover:bg-[#F7F8FA] transition-colors">
                <div className="mt-0.5 w-4 h-4 rounded border-2 border-[#D1D5DB] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] leading-snug text-[#374151]">{t.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${pr.color}15`, color: pr.color }}>{pr.label}</span>
                    {t.category && <span className="text-[9px] px-1.5 py-0.5 bg-[#F3F4F6] rounded-full text-[#6B7280]">{t.category}</span>}
                    {t.dueAt && (
                      <span className="text-[9px] font-medium ml-auto flex items-center gap-0.5 text-[#9CA3AF]">
                        <Clock size={9} /> {t.dueAt.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Quick actions (navigation shortcuts) ────────────────────────────────────────
function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: Plus, label: "New Booking", color: "#1B75BC", bg: "#EEF2FF", to: "/erp/bookings" },
    { icon: Users, label: "Add Lead", color: "#F15A24", bg: "#FFF9E6", to: "/erp/crm" },
    { icon: Receipt, label: "Create Invoice", color: "#0E7C66", bg: "#ECFDF5", to: "/erp/invoices" },
    { icon: BarChart3, label: "Run Report", color: "#2563EB", bg: "#EFF6FF", to: "/erp/reports" },
    { icon: Send, label: "Communications", color: "#7C3AED", bg: "#F5F3FF", to: "/erp/communications" },
    { icon: Download, label: "Documents", color: "#6B7280", bg: "#F3F4F6", to: "/erp/documents" },
  ];
  return (
    <Card>
      <SectionHeader title="Quick Actions" />
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => navigate(a.to)}
              className="flex flex-col items-center gap-2 p-3 rounded-[10px] border border-[#E5E7EB] hover:border-[#1B75BC]/30 hover:shadow-sm transition-all cursor-pointer group">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: a.bg }}>
                <Icon size={17} style={{ color: a.color }} />
              </div>
              <span className="text-[10px] font-semibold text-[#374151] group-hover:text-[#1B75BC] transition-colors text-center leading-tight">{a.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Page header ─────────────────────────────────────────────────────────────────
function PageHeader({
  branchLabel, rangeLabel, updatedAt, onRefresh, refreshing,
}: { branchLabel: string; rangeLabel: string; updatedAt?: number; onRefresh: () => void; refreshing: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-[20px] font-black text-[#111827] leading-tight">Dashboard</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-[#9CA3AF]">{branchLabel}</span>
          <span className="text-[#E5E7EB]">·</span>
          <span className="text-[11px] text-[#9CA3AF]">{rangeLabel}</span>
          {updatedAt && (
            <>
              <span className="text-[#E5E7EB]">·</span>
              <span className="text-[11px] text-[#9CA3AF]">Updated {relAge(new Date(updatedAt).toISOString())} ago</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#0E7C66]" />
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh} disabled={refreshing}
          className="flex items-center gap-1.5 h-9 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:border-[#1B75BC]/30 transition-colors cursor-pointer disabled:opacity-50">
          <RefreshCw size={13} className={cn("text-[#9CA3AF]", refreshing && "animate-spin")} /> Refresh
        </button>
        <button onClick={() => navigate("/erp/bookings")}
          className="flex items-center gap-1.5 h-9 px-3 bg-[#1B75BC] rounded-[8px] text-[12px] font-semibold text-white hover:bg-[#14588F] transition-colors cursor-pointer">
          <Plus size={13} /> New Booking
        </button>
      </div>
    </div>
  );
}

// ─── Main dashboard ──────────────────────────────────────────────────────────────
export function SuperAdminDashboard() {
  const { branchId, branchLabel, dateRange } = useOutletContext<OutletCtx>();
  const q = useDashboardSummary({ branchId, dateRange });
  const data: DashboardSummary | undefined = q.data;
  const rangeLabel = data?.applied.label ?? dateRange;

  return (
    <div className="p-5 md:p-7 min-h-screen">
      <PageHeader
        branchLabel={branchLabel}
        rangeLabel={rangeLabel}
        updatedAt={q.dataUpdatedAt || undefined}
        onRefresh={() => q.refetch()}
        refreshing={q.isFetching}
      />

      {q.isError && (
        <div className="mb-4">
          <ErrorBanner message={q.error instanceof Error ? q.error.message : "Failed to load the dashboard."} onRetry={() => q.refetch()} />
        </div>
      )}

      <KpiCards kpis={data?.kpis} rangeLabel={rangeLabel} loading={q.isLoading} />

      {data && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
            <div className="xl:col-span-2"><RevenueChart data={data.revenueTrend} rangeLabel={rangeLabel} /></div>
            <ServiceBreakdown data={data.serviceBreakdown} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
            <BranchPerformance data={data.branchPerformance} />
            <LeadFunnel data={data.leadFunnel} />
          </div>

          <div className="mb-4"><BookingsTable data={data.recentBookings} /></div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <ActivityFeed data={data.activity} />
            <TasksPanel data={data.myTasks} />
            <QuickActions />
          </div>
        </>
      )}

      {q.isLoading && !data && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 h-64 bg-white border border-[#E5E7EB] rounded-[14px] animate-pulse" />
          <div className="h-64 bg-white border border-[#E5E7EB] rounded-[14px] animate-pulse" />
        </div>
      )}
    </div>
  );
}
