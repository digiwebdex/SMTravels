import React, { useState } from "react";
import { useOutletContext } from "react-router";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  CalendarDays, Wallet, Users, TrendingUp, Star, Plane,
  ArrowUpRight, ArrowDownRight, CheckCircle, Clock, AlertTriangle,
  Plus, FileText, Send, Download, RefreshCw, MoreHorizontal,
  ChevronRight, Circle, Dot, Briefcase, Receipt, BarChart3,
  User, Building2, Filter,
} from "lucide-react";
import { cn, fmtPrice } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OutletCtx { selectedBranch: string; dateRange: string; }

// ─── Data ─────────────────────────────────────────────────────────────────────
const REVENUE_DATA = [
  { month: "Jan", revenue: 3200000, target: 3000000, bookings: 198 },
  { month: "Feb", revenue: 2850000, target: 3000000, bookings: 171 },
  { month: "Mar", revenue: 3600000, target: 3200000, bookings: 224 },
  { month: "Apr", revenue: 4100000, target: 3500000, bookings: 256 },
  { month: "May", revenue: 5200000, target: 4800000, bookings: 318 },
  { month: "Jun", revenue: 7800000, target: 7000000, bookings: 487 },
  { month: "Jul", revenue: 9400000, target: 8500000, bookings: 592 },
  { month: "Aug", revenue: 4200000, target: 4000000, bookings: 263 },
  { month: "Sep", revenue: 3800000, target: 3600000, bookings: 241 },
  { month: "Oct", revenue: 4600000, target: 4200000, bookings: 294 },
  { month: "Nov", revenue: 5100000, target: 4800000, bookings: 321 },
  { month: "Dec", revenue: 6300000, target: 5800000, bookings: 397 },
];

const SERVICE_DATA = [
  { name: "Hajj",        value: 342,  color: "#0E6BB8" },
  { name: "Umrah",       value: 1124, color: "#E8471F" },
  { name: "Visa",        value: 487,  color: "#0E7C66" },
  { name: "Air Ticket",  value: 621,  color: "#2563EB" },
  { name: "Manpower",    value: 198,  color: "#7C3AED" },
  { name: "Tour",        value: 75,   color: "#EA580C" },
];

const BRANCH_DATA = [
  { branch: "Dhaka HQ",    revenue: 18400000, bookings: 1124, target: 20000000 },
  { branch: "Chittagong",  revenue: 7200000,  bookings: 432,  target: 8000000  },
  { branch: "Sylhet",      revenue: 5800000,  bookings: 347,  target: 6000000  },
  { branch: "Khulna",      revenue: 3100000,  bookings: 186,  target: 4000000  },
  { branch: "Rajshahi",    revenue: 2300000,  bookings: 138,  target: 3000000  },
];

const FUNNEL_DATA = [
  { stage: "New Leads",    count: 847, fill: "#0E6BB8" },
  { stage: "Qualified",    count: 512, fill: "#1e4d9b" },
  { stage: "Proposal",     count: 298, fill: "#2563EB" },
  { stage: "Negotiation",  count: 156, fill: "#E8471F" },
  { stage: "Won",          count: 89,  fill: "#0E7C66" },
];

const ACTIVITY_FEED = [
  { id: 1, type: "booking",  actor: "Agent Rahel Ahmed",   action: "created booking", target: "#BK-2847 — Umrah Economy", time: "2m ago",  color: "#0E6BB8", bg: "#EEF2FF"  },
  { id: 2, type: "payment",  actor: "System",              action: "received payment", target: "৳1,20,000 — Invoice INV-0391", time: "15m ago", color: "#0E7C66", bg: "#ECFDF5"  },
  { id: 3, type: "lead",     actor: "Sales Team (Dhaka)",  action: "added new lead",  target: "MD Electronics Group — Hajj ×24", time: "32m ago", color: "#E8471F", bg: "#FFF9E6"  },
  { id: 4, type: "visa",     actor: "Visa Exec Tahmina",   action: "submitted docs",  target: "KSA Visa — 3 passports (BK-2841)", time: "1h ago",  color: "#7C3AED", bg: "#F5F3FF"  },
  { id: 5, type: "booking",  actor: "Customer Portal",     action: "requested quote", target: "Umrah Premium ×6 — Dec 2025", time: "1h ago",  color: "#0E6BB8", bg: "#EEF2FF"  },
  { id: 6, type: "system",   actor: "System",              action: "generated report", target: "Monthly Revenue Report — Nov 2025", time: "2h ago",  color: "#6B7280", bg: "#F3F4F6"  },
  { id: 7, type: "payment",  actor: "Agent Karim Bros",    action: "paid outstanding", target: "৳84,500 — Agent Balance", time: "3h ago",  color: "#0E7C66", bg: "#ECFDF5"  },
];

const RECENT_BOOKINGS = [
  { id: "BK-2847", pilgrim: "Md. Harunur Rashid",  service: "Umrah",  package: "Economy Plus",  agent: "Rahel Travel", departure: "15 Dec 2025", amount: 120000,  status: "Confirmed"  },
  { id: "BK-2846", pilgrim: "Fatema Begum",         service: "Hajj",   package: "Standard",      agent: "Direct",       departure: "12 May 2026", amount: 580000,  status: "Processing" },
  { id: "BK-2845", pilgrim: "Khandakar Ali",        service: "Visa",   package: "KSA Business",  agent: "Karim Bros",   departure: "—",           amount: 12500,   status: "Pending"    },
  { id: "BK-2844", pilgrim: "Nasrin Akter",         service: "Air",    package: "DAC-JED Return", agent: "Direct",       departure: "20 Nov 2025", amount: 45000,   status: "Confirmed"  },
  { id: "BK-2843", pilgrim: "Jahangir Alam",        service: "Umrah",  package: "Premium VIP",   agent: "Al Madina T.", departure: "5 Jan 2026",  amount: 280000,  status: "Confirmed"  },
  { id: "BK-2842", pilgrim: "Shirin Sultana",       service: "Tour",   package: "Malaysia 7D",   agent: "Direct",       departure: "28 Nov 2025", amount: 95000,   status: "Cancelled"  },
  { id: "BK-2841", pilgrim: "Abdul Karim",          service: "Visa",   package: "UAE Visit",     agent: "Rahel Travel", departure: "—",           amount: 8500,    status: "Pending"    },
];

const TASKS = [
  { id: 1, title: "Confirm flight seats for BK-2847 group (48 pilgrims)",   due: "Today",      priority: "high",   cat: "Booking",  done: false },
  { id: 2, title: "Send KSA visa documents to embassy — 3 passports",       due: "Today",      priority: "high",   cat: "Visa",     done: false },
  { id: 3, title: "Review Q3 agent commission statements (6 agents)",        due: "Tomorrow",   priority: "medium", cat: "Finance",  done: false },
  { id: 4, title: "Update Umrah package pricing for Feb–Apr 2026",           due: "Overdue",    priority: "high",   cat: "Packages", done: false },
  { id: 5, title: "Onboard new agent: Al-Madina Travels (Sylhet)",           due: "This Week",  priority: "low",    cat: "CRM",      done: true  },
  { id: 6, title: "Generate November branch performance report",              due: "Fri, 29 Nov", priority: "medium", cat: "Reports",  done: false },
];

const QUICK_ACTIONS = [
  { icon: Plus,       label: "New Booking",    color: "#0E6BB8", bg: "#EEF2FF"  },
  { icon: Users,      label: "Add Lead",        color: "#E8471F", bg: "#FFF9E6"  },
  { icon: Receipt,    label: "Create Invoice",  color: "#0E7C66", bg: "#ECFDF5"  },
  { icon: BarChart3,  label: "Run Report",      color: "#2563EB", bg: "#EFF6FF"  },
  { icon: Send,       label: "Send Bulk SMS",   color: "#7C3AED", bg: "#F5F3FF"  },
  { icon: Download,   label: "Export Data",     color: "#6B7280", bg: "#F3F4F6"  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  Confirmed:  { label: "Confirmed",  color: "#065F46", bg: "#D1FAE5" },
  Processing: { label: "Processing", color: "#1D4ED8", bg: "#DBEAFE" },
  Pending:    { label: "Pending",    color: "#92400E", bg: "#FEF3C7" },
  Cancelled:  { label: "Cancelled",  color: "#991B1B", bg: "#FEE2E2" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || { label: status, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

const PRIORITY_CFG: Record<string, { color: string; label: string }> = {
  high:   { color: "#DC2626", label: "High"   },
  medium: { color: "#F59E0B", label: "Med"    },
  low:    { color: "#0E7C66", label: "Low"    },
};

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
  return (
    <div className={cn("bg-white border border-[#E5E7EB] rounded-[14px] p-5", className)}>
      {children}
    </div>
  );
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────
const KPI_CARDS = [
  {
    label: "Total Bookings",
    value: "2,847",
    delta: "+12.4%",
    deltaUp: true,
    sub: "vs last month",
    icon: CalendarDays,
    color: "#0E6BB8",
    bg: "#EEF2FF",
    raw: "2847 confirmed & pending",
  },
  {
    label: "Revenue",
    value: "৳ 4.21 Cr",
    delta: "+8.2%",
    deltaUp: true,
    sub: "vs last month",
    icon: Wallet,
    color: "#0E7C66",
    bg: "#ECFDF5",
    raw: "৳ 4,21,40,000 collected",
  },
  {
    label: "Pending Dues",
    value: "৳ 38.5L",
    delta: "5 overdue",
    deltaUp: false,
    sub: "requires action",
    icon: AlertTriangle,
    color: "#DC2626",
    bg: "#FEF2F2",
    raw: "Oldest due 42 days ago",
  },
  {
    label: "New Leads",
    value: "184",
    delta: "+24.1%",
    deltaUp: true,
    sub: "this week",
    icon: TrendingUp,
    color: "#E8471F",
    bg: "#FFF9E6",
    raw: "89 qualified · 12 won",
  },
  {
    label: "Active Agents",
    value: "63",
    delta: "+3 new",
    deltaUp: true,
    sub: "this month",
    icon: Briefcase,
    color: "#7C3AED",
    bg: "#F5F3FF",
    raw: "51 verified · 12 pending",
  },
  {
    label: "Upcoming Departures",
    value: "12",
    delta: "Next: 15 Dec",
    deltaUp: true,
    sub: "Hajj: 3 · Umrah: 9",
    icon: Plane,
    color: "#2563EB",
    bg: "#EFF6FF",
    raw: "3,847 pilgrims in pipeline",
  },
];

function KpiCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {KPI_CARDS.map(k => {
        const Icon = k.icon;
        return (
          <Card key={k.label} className="p-4 hover:shadow-md transition-shadow cursor-default">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: k.bg }}>
                <Icon size={17} style={{ color: k.color }} />
              </div>
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-bold",
                k.deltaUp ? "text-[#0E7C66]" : "text-[#DC2626]"
              )}>
                {k.deltaUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {k.delta}
              </span>
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

// ─── Revenue chart ────────────────────────────────────────────────────────────
function RevenueChart() {
  const [mode, setMode] = useState<"revenue" | "bookings">("revenue");
  const fmt = (v: number) => mode === "revenue"
    ? `৳${(v / 1000000).toFixed(1)}M`
    : v.toString();

  return (
    <Card>
      <SectionHeader
        title="Revenue Trend"
        sub="Monthly performance vs target · Jan–Dec 2025"
        action={
          <div className="flex items-center gap-1.5">
            <div className="flex bg-[#F3F4F6] rounded-[8px] p-0.5">
              {(["revenue", "bookings"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn(
                    "px-2.5 py-1 rounded-[6px] text-[11px] font-medium capitalize transition-all cursor-pointer",
                    mode === m ? "bg-white text-[#0E6BB8] shadow-sm" : "text-[#9CA3AF] hover:text-[#374151]"
                  )}>
                  {m}
                </button>
              ))}
            </div>
            <button className="p-1.5 text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-[6px] transition-colors cursor-pointer">
              <MoreHorizontal size={14} />
            </button>
          </div>
        }
      />
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0E6BB8" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#0E6BB8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="tgtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E8471F" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#E8471F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
            formatter={(v: number) => [mode === "revenue" ? fmtPrice(v) : v, mode === "revenue" ? "Revenue" : "Bookings"]}
          />
          <Area type="monotone" dataKey={mode === "revenue" ? "revenue" : "bookings"} stroke="#0E6BB8" strokeWidth={2} fill="url(#revGrad)" dot={false} />
          {mode === "revenue" && (
            <Area type="monotone" dataKey="target" stroke="#E8471F" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#tgtGrad)" dot={false} />
          )}
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F3F4F6]">
        <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
          <div className="w-3 h-0.5 bg-[#0E6BB8] rounded" /> Actual
        </div>
        {mode === "revenue" && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
            <div className="w-3 h-px bg-[#E8471F] rounded border-dashed border-t border-[#E8471F]" /> Target
          </div>
        )}
        <div className="ml-auto text-[10px] text-[#9CA3AF]">
          YTD Revenue: <span className="font-bold text-[#111827]">৳ 5.97 Cr</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Service breakdown donut ───────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>;
}

function ServiceBreakdown() {
  const total = SERVICE_DATA.reduce((s, d) => s + d.value, 0);
  return (
    <Card>
      <SectionHeader title="Bookings by Service" sub={`${total.toLocaleString()} total this month`} />
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={SERVICE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
              dataKey="value" labelLine={false} label={CustomLabel}>
              {SERVICE_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }}
              formatter={(v: number, name: string) => [`${v} bookings (${((v / total) * 100).toFixed(1)}%)`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2 mt-1">
        {SERVICE_DATA.map(d => (
          <div key={d.name} className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-[#6B7280] flex-1">{d.name}</span>
            <span className="text-[11px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.value}</span>
            <span className="text-[10px] text-[#9CA3AF] w-8 text-right">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Branch performance ───────────────────────────────────────────────────────
function BranchPerformance() {
  const fmtM = (v: number) => `৳${(v / 1000000).toFixed(1)}M`;
  return (
    <Card>
      <SectionHeader title="Branch Performance"
        sub="Revenue vs target · Current period"
        action={
          <button className="flex items-center gap-1 text-[11px] text-[#0E6BB8] font-semibold hover:underline cursor-pointer">
            View all <ChevronRight size={12} />
          </button>
        }
      />
      <div className="flex flex-col gap-3">
        {BRANCH_DATA.map((b, i) => {
          const pct = Math.round((b.revenue / b.target) * 100);
          return (
            <div key={b.branch} className="flex items-center gap-3">
              <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[9px] font-black text-white"
                style={{ backgroundColor: i === 0 ? "#0E6BB8" : i === 1 ? "#2563EB" : i === 2 ? "#0E7C66" : i === 3 ? "#E8471F" : "#7C3AED" }}>
                {i + 1}
              </div>
              <div className="w-24 flex-shrink-0">
                <div className="text-[11px] font-medium text-[#374151] truncate">{b.branch}</div>
                <div className="text-[10px] text-[#9CA3AF]">{b.bookings} bkgs</div>
              </div>
              <div className="flex-1">
                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: i === 0 ? "#0E6BB8" : i === 1 ? "#2563EB" : i === 2 ? "#0E7C66" : i === 3 ? "#E8471F" : "#7C3AED"
                    }}
                  />
                </div>
              </div>
              <div className="w-16 text-right flex-shrink-0">
                <div className="text-[11px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtM(b.revenue)}</div>
                <div className={cn("text-[9px] font-bold", pct >= 100 ? "text-[#0E7C66]" : pct >= 80 ? "text-[#C43A15]" : "text-[#DC2626]")}>
                  {pct}% target
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Lead Funnel ──────────────────────────────────────────────────────────────
function LeadFunnel() {
  return (
    <Card>
      <SectionHeader title="Lead Funnel" sub="Sales pipeline · Active leads" />
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={FUNNEL_DATA} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="stage" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={75} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }}
            formatter={(v: number) => [v, "Leads"]} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
            {FUNNEL_DATA.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-5 gap-1 mt-3 pt-3 border-t border-[#F3F4F6]">
        {FUNNEL_DATA.map(d => (
          <div key={d.stage} className="text-center">
            <div className="text-[14px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.count}</div>
            <div className="text-[8px] text-[#9CA3AF] leading-tight">{d.stage.split(" ")[0]}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[10px] text-[#9CA3AF]">
        <span>Conversion rate</span>
        <span className="font-bold text-[#0E7C66]">10.5% lead-to-won</span>
      </div>
    </Card>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed() {
  const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
    booking: CalendarDays, payment: Wallet, lead: TrendingUp,
    visa: User, system: RefreshCw,
  };
  const COLOR_MAP: Record<string, { color: string; bg: string }> = {
    booking: { color: "#0E6BB8", bg: "#EEF2FF" },
    payment: { color: "#0E7C66", bg: "#ECFDF5" },
    lead:    { color: "#E8471F", bg: "#FFF9E6" },
    visa:    { color: "#7C3AED", bg: "#F5F3FF" },
    system:  { color: "#6B7280", bg: "#F3F4F6" },
  };

  return (
    <Card className="flex flex-col h-full">
      <SectionHeader title="Activity Feed" sub="Real-time system events"
        action={
          <button className="flex items-center gap-1 text-[11px] text-[#0E6BB8] font-semibold hover:underline cursor-pointer">
            View all <ChevronRight size={12} />
          </button>
        }
      />
      <div className="flex flex-col gap-0 relative">
        <div className="absolute left-4 top-4 bottom-0 w-px bg-[#F3F4F6]" />
        {ACTIVITY_FEED.map((item, i) => {
          const Icon = ICON_MAP[item.type] || RefreshCw;
          const cfg = COLOR_MAP[item.type] || COLOR_MAP.system;
          return (
            <div key={item.id} className="flex gap-3 pb-4 relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ring-2 ring-white"
                style={{ backgroundColor: cfg.bg }}>
                <Icon size={13} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 pt-1 min-w-0">
                <p className="text-[11px] text-[#374151] leading-snug">
                  <span className="font-semibold">{item.actor}</span>{" "}
                  <span className="text-[#9CA3AF]">{item.action}</span>{" "}
                  <span className="font-medium text-[#111827]">{item.target}</span>
                </p>
                <p className="text-[9px] text-[#9CA3AF] mt-0.5">{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Bookings Table ───────────────────────────────────────────────────────────
function BookingsTable() {
  const [sortField, setSortField] = useState<string | null>(null);

  const SERVICE_COLOR: Record<string, string> = {
    Umrah: "#E8471F", Hajj: "#0E6BB8", Visa: "#7C3AED",
    Air: "#2563EB", Tour: "#EA580C",
  };

  return (
    <Card>
      <SectionHeader
        title="Latest Bookings"
        sub={`${RECENT_BOOKINGS.length} most recent · All branches`}
        action={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-[11px] text-[#374151] font-medium px-2.5 py-1.5 border border-[#E5E7EB] rounded-[7px] hover:border-[#0E6BB8]/30 transition-colors cursor-pointer">
              <Filter size={12} /> Filter
            </button>
            <button className="flex items-center gap-1 text-[11px] text-[#0E6BB8] font-semibold hover:underline cursor-pointer">
              View all <ChevronRight size={12} />
            </button>
          </div>
        }
      />
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr className="border-b border-[#F3F4F6]">
              {["Booking ID", "Pilgrim", "Service", "Package", "Agent", "Departure", "Amount", "Status"].map(h => (
                <th key={h} className="text-left pb-2 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider pr-4 cursor-pointer hover:text-[#374151] transition-colors"
                  onClick={() => setSortField(h)}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT_BOOKINGS.map((b, i) => (
              <tr key={b.id} className="border-b border-[#F7F8FA] hover:bg-[#F7F8FA] transition-colors group cursor-pointer">
                <td className="py-3 pr-4">
                  <span className="text-[11px] font-bold text-[#0E6BB8]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.id}</span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#0E6BB8]/10 flex items-center justify-center text-[9px] font-black text-[#0E6BB8]">
                      {b.pilgrim[0]}
                    </div>
                    <span className="text-[11px] font-medium text-[#111827] whitespace-nowrap">{b.pilgrim}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: SERVICE_COLOR[b.service] || "#6B7280" }}>
                    {b.service}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[11px] text-[#6B7280] whitespace-nowrap">{b.package}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[11px] text-[#6B7280] whitespace-nowrap">{b.agent}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[11px] text-[#374151]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.departure}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[11px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(b.amount)}</span>
                </td>
                <td className="py-3">
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
function TasksPanel() {
  const [tasks, setTasks] = useState(TASKS);
  const toggle = (id: number) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const pending = tasks.filter(t => !t.done).length;

  return (
    <Card>
      <SectionHeader
        title="Tasks & Reminders"
        sub={`${pending} pending · ${tasks.length - pending} done`}
        action={
          <button className="flex items-center gap-1 text-[11px] text-[#0E6BB8] font-semibold hover:underline cursor-pointer">
            <Plus size={12} /> Add task
          </button>
        }
      />
      <div className="flex flex-col gap-2">
        {tasks.map(t => {
          const pr = PRIORITY_CFG[t.priority];
          return (
            <div key={t.id}
              className={cn("flex items-start gap-2.5 p-2.5 rounded-[8px] transition-colors group cursor-pointer",
                t.done ? "opacity-50" : "hover:bg-[#F7F8FA]"
              )}>
              <button onClick={() => toggle(t.id)} className="mt-0.5 flex-shrink-0 cursor-pointer">
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                  t.done ? "bg-[#0E7C66] border-[#0E7C66]" : "border-[#D1D5DB] hover:border-[#0E6BB8]"
                )}>
                  {t.done && <CheckCircle size={11} className="text-white" />}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[11px] leading-snug", t.done ? "line-through text-[#9CA3AF]" : "text-[#374151]")}>{t.title}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: `${pr.color}15`, color: pr.color }}>
                    {pr.label}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#F3F4F6] rounded-full text-[#6B7280]">{t.cat}</span>
                  <span className={cn("text-[9px] font-medium ml-auto flex items-center gap-0.5",
                    t.due === "Overdue" ? "text-[#DC2626]" : t.due === "Today" ? "text-[#C43A15]" : "text-[#9CA3AF]"
                  )}>
                    <Clock size={9} /> {t.due}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions() {
  return (
    <Card>
      <SectionHeader title="Quick Actions" />
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label}
              className="flex flex-col items-center gap-2 p-3 rounded-[10px] border border-[#E5E7EB] hover:border-[#0E6BB8]/30 hover:shadow-sm transition-all cursor-pointer group">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors"
                style={{ backgroundColor: a.bg }}>
                <Icon size={17} style={{ color: a.color }} />
              </div>
              <span className="text-[10px] font-semibold text-[#374151] group-hover:text-[#0E6BB8] transition-colors text-center leading-tight">{a.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
function PageHeader({ branch, dateRange }: { branch: string; dateRange: string }) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-[20px] font-black text-[#111827] leading-tight">Super Admin Dashboard</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-[#9CA3AF]">
            {branch === "All Branches" ? "All 5 branches" : branch}
          </span>
          <span className="text-[#E5E7EB]">·</span>
          <span className="text-[11px] text-[#9CA3AF]">{dateRange}</span>
          <span className="text-[#E5E7EB]">·</span>
          <span className="text-[11px] text-[#9CA3AF]">Last updated: just now</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#0E7C66] animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 h-9 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:border-[#0E6BB8]/30 transition-colors cursor-pointer">
          <Download size={13} className="text-[#9CA3AF]" /> Export
        </button>
        <button className="flex items-center gap-1.5 h-9 px-3 bg-[#0E6BB8] rounded-[8px] text-[12px] font-semibold text-white hover:bg-[#0B5794] transition-colors cursor-pointer">
          <Plus size={13} /> New Booking
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function SuperAdminDashboard() {
  const { selectedBranch, dateRange } = useOutletContext<OutletCtx>();

  return (
    <div className="p-5 md:p-7 min-h-screen">
      <PageHeader branch={selectedBranch} dateRange={dateRange} />

      {/* KPI row */}
      <KpiCards />

      {/* Charts row 1: Revenue trend (2/3) + Service breakdown (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <ServiceBreakdown />
      </div>

      {/* Charts row 2: Branch performance (1/2) + Lead funnel (1/2) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <BranchPerformance />
        <LeadFunnel />
      </div>

      {/* Bottom row: Bookings table (full width) */}
      <div className="mb-4">
        <BookingsTable />
      </div>

      {/* Bottom row: Activity (1/3) + Tasks (1/3) + Quick Actions (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ActivityFeed />
        <TasksPanel />
        <QuickActions />
      </div>
    </div>
  );
}
