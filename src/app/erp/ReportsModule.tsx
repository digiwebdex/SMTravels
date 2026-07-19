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

// ─── Shared mock data ─────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const MONTHLY_REVENUE = [
  { month:"Jan", revenue:3200000, target:3000000, bookings:198, expense:2100000 },
  { month:"Feb", revenue:2850000, target:3000000, bookings:171, expense:1900000 },
  { month:"Mar", revenue:3600000, target:3200000, bookings:224, expense:2300000 },
  { month:"Apr", revenue:4100000, target:3500000, bookings:256, expense:2600000 },
  { month:"May", revenue:5200000, target:4800000, bookings:318, expense:3100000 },
  { month:"Jun", revenue:7800000, target:7000000, bookings:487, expense:4800000 },
  { month:"Jul", revenue:9400000, target:8500000, bookings:592, expense:5600000 },
];

const SERVICE_BREAKDOWN = [
  { name:"Hajj", value:38, color:"#C9A227", revenue:15960000 },
  { name:"Umrah", value:27, color:"#14356B", revenue:11340000 },
  { name:"Visa", value:14, color:"#0E7C66", revenue:5880000 },
  { name:"Air Ticket", value:10, color:"#2563EB", revenue:4200000 },
  { name:"Manpower", value:7, color:"#7C3AED", revenue:2940000 },
  { name:"Tour", value:4, color:"#EA580C", revenue:1680000 },
];

const BRANCH_DATA = [
  { branch:"Chattogram HQ", bookings:892, revenue:18200000, target:85 },
  { branch:"Dhaka Office",  bookings:641, revenue:13100000, target:92 },
  { branch:"Sylhet Branch", bookings:312, revenue:6400000,  target:74 },
  { branch:"Cox's Bazar",   bookings:198, revenue:4050000,  target:68 },
  { branch:"Khulna",        bookings:147, revenue:3010000,  target:61 },
  { branch:"Rajshahi",      bookings:98,  revenue:2010000,  target:55 },
];

const AGENT_DATA = [
  { name:"Rahim & Sons", bookings:142, revenue:6800000, commission:340000, rate:"5%", status:"active" },
  { name:"NMT Travels",  bookings:118, revenue:5400000, commission:270000, rate:"5%", status:"active" },
  { name:"Al-Madina Agency", bookings:97, revenue:4200000, commission:210000, rate:"5%", status:"active" },
  { name:"Haji Travels", bookings:84,  revenue:3800000, commission:190000, rate:"5%", status:"active" },
  { name:"Green Umrah",  bookings:63,  revenue:2900000, commission:145000, rate:"5%", status:"inactive" },
  { name:"Bismillah Int'l", bookings:51, revenue:2200000, commission:110000, rate:"5%", status:"active" },
];

const HAJJ_DATA = [
  { month:"Jan", applications:24,  approved:20, departed:0,  revenue:1680000 },
  { month:"Feb", applications:31,  approved:28, departed:0,  revenue:2184000 },
  { month:"Mar", applications:48,  approved:42, departed:0,  revenue:3276000 },
  { month:"Apr", applications:92,  approved:80, departed:24, revenue:6240000 },
  { month:"May", applications:180, approved:165, departed:80, revenue:12870000 },
  { month:"Jun", applications:240, approved:220, departed:210, revenue:17160000 },
  { month:"Jul", applications:62,  approved:55, departed:40, revenue:4290000 },
];

const VISA_FUNNEL = [
  { name:"Inquiries",   value:1240, fill:"#14356B" },
  { name:"Applied",     value:890,  fill:"#1d4ed8" },
  { name:"Submitted",   value:720,  fill:"#0E7C66" },
  { name:"Approved",    value:580,  fill:"#059669" },
  { name:"Collected",   value:540,  fill:"#C9A227" },
];

const PNL_DATA = [
  { category:"Revenue",            q1:9650000,  q2:17100000, ytd:42100000,  prev:36800000,  type:"revenue" },
  { category:"  Hajj Packages",    q1:4100000,  q2:7200000,  ytd:18500000,  prev:15200000,  type:"revenue-sub" },
  { category:"  Umrah Packages",   q1:2900000,  q2:5100000,  ytd:12300000,  prev:10800000,  type:"revenue-sub" },
  { category:"  Visa Services",    q1:1250000,  q2:2400000,  ytd:4800000,   prev:4200000,   type:"revenue-sub" },
  { category:"  Air Tickets",      q1:800000,   q2:1600000,  ytd:3200000,   prev:3100000,   type:"revenue-sub" },
  { category:"  Other",            q1:600000,   q2:800000,   ytd:3300000,   prev:3500000,   type:"revenue-sub" },
  { category:"Cost of Sales",      q1:6800000,  q2:12100000, ytd:29800000,  prev:25900000,  type:"expense" },
  { category:"Gross Profit",       q1:2850000,  q2:5000000,  ytd:12300000,  prev:10900000,  type:"total" },
  { category:"Operating Expenses", q1:1400000,  q2:2600000,  ytd:7200000,   prev:6800000,   type:"expense" },
  { category:"  Salaries",         q1:800000,   q2:1600000,  ytd:4800000,   prev:4200000,   type:"expense-sub" },
  { category:"  Rent & Utilities", q1:280000,   q2:560000,   ytd:1320000,   prev:1400000,   type:"expense-sub" },
  { category:"  Marketing",        q1:320000,   q2:440000,   ytd:1080000,   prev:1200000,   type:"expense-sub" },
  { category:"EBIT",               q1:1450000,  q2:2400000,  ytd:5100000,   prev:4100000,   type:"total" },
  { category:"Tax (15%)",          q1:217500,   q2:360000,   ytd:765000,    prev:615000,    type:"expense" },
  { category:"Net Profit",         q1:1232500,  q2:2040000,  ytd:4335000,   prev:3485000,   type:"grand-total" },
];

const CASHFLOW_DATA = [
  { month:"Jan", operating:1100000,  investing:-420000, financing:200000  },
  { month:"Feb", operating:950000,   investing:-180000, financing:-300000 },
  { month:"Mar", operating:1300000,  investing:-600000, financing:0       },
  { month:"Apr", operating:1500000,  investing:-240000, financing:500000  },
  { month:"May", operating:2100000,  investing:-900000, financing:-200000 },
  { month:"Jun", operating:2900000,  investing:-500000, financing:1000000 },
  { month:"Jul", operating:3800000,  investing:-1200000,financing:-400000 },
];

const BALANCE_SHEET = {
  assets: [
    { name:"Cash & Bank",       current:18250000, prior:14200000 },
    { name:"Accounts Receivable",current:9430000,  prior:7800000  },
    { name:"Prepaid Expenses",  current:1200000,  prior:980000   },
    { name:"Inventory/Deposits",current:3400000,  prior:2900000  },
    { name:"Fixed Assets (net)",current:14500000, prior:16200000 },
    { name:"Other Assets",      current:800000,   prior:620000   },
  ],
  liabilities: [
    { name:"Accounts Payable",  current:8640000,  prior:7100000  },
    { name:"Advance Receipts",  current:4140000,  prior:3200000  },
    { name:"Bank Loan (DBBL)",  current:6700000,  prior:9400000  },
    { name:"Tax Payable",       current:765000,   prior:615000   },
    { name:"Other Liabilities", current:480000,   prior:380000   },
  ],
  equity: [
    { name:"Owner Capital",     current:20000000, prior:20000000 },
    { name:"Retained Earnings", current:6840000,  prior:2505000  },
  ],
};

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
  filters, onChange, onExport, onRefresh, title, subtitle,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onExport: (type: "pdf" | "excel") => void;
  onRefresh: () => void;
  title: string;
  subtitle?: string;
}) {
  const [exportOpen, setExportOpen] = useState(false);
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
            <option value="this-month">This Month (Jul 2024)</option>
            <option value="last-month">Last Month (Jun 2024)</option>
            <option value="q1">Q1 2024</option>
            <option value="q2">Q2 2024</option>
            <option value="ytd">Year to Date</option>
            <option value="last-year">Last Year (2023)</option>
            <option value="custom">Custom Range…</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
          <Building2 size={14} className="text-slate-400" />
          <select value={filters.branch} onChange={e => onChange({ branch: e.target.value })}
            className="bg-transparent focus:outline-none cursor-pointer">
            <option value="all">All Branches</option>
            <option value="ctg">Chattogram HQ</option>
            <option value="dhaka">Dhaka Office</option>
            <option value="sylhet">Sylhet Branch</option>
            <option value="cox">Cox's Bazar</option>
            <option value="khulna">Khulna</option>
            <option value="rajshahi">Rajshahi</option>
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
function OverviewReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;

  const totalRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
  const totalBookings = MONTHLY_REVENUE.reduce((s, m) => s + m.bookings, 0);
  const totalExpense = MONTHLY_REVENUE.reduce((s, m) => s + m.expense, 0);
  const netProfit = totalRevenue - totalExpense;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Revenue (YTD)" value={fmtM(totalRevenue)} trend={14.2} icon={TrendingUp} color="bg-[#14356B]" />
        <KpiCard label="Total Bookings" value={totalBookings.toLocaleString()} trend={11.8} icon={Calendar} color="bg-emerald-500" />
        <KpiCard label="Total Expenses" value={fmtM(totalExpense)} trend={8.4} icon={TrendingDown} color="bg-red-500" />
        <KpiCard label="Net Profit (YTD)" value={fmtM(netProfit)} trend={21.3} icon={DollarSign} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Revenue vs Target */}
        <Section title="Revenue vs Target — 2024" className="col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14356B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14356B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                tickFormatter={v => `৳${(v / 1000000).toFixed(0)}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#14356B" strokeWidth={2.5} fill="url(#revGrad)" />
              <Line type="monotone" dataKey="target" name="Target" stroke="#C9A227" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        {/* Service mix donut */}
        <Section title="Revenue by Service">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={SERVICE_BREAKDOWN} dataKey="value" cx="50%" cy="50%"
                innerRadius={48} outerRadius={72} paddingAngle={3}>
                {SERVICE_BREAKDOWN.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {SERVICE_BREAKDOWN.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-slate-600">{s.name}</span>
                </div>
                <span className="font-medium text-slate-700">{s.value}%</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Branch performance */}
        <Section title="Revenue by Branch">
          <div className="space-y-3">
            {BRANCH_DATA.map((b, i) => (
              <div key={b.branch}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">{b.branch}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{b.bookings} bkgs</span>
                    <span className="font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmtM(b.revenue)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(b.revenue / BRANCH_DATA[0].revenue) * 100}%`,
                      background: i === 0 ? "#14356B" : i === 1 ? "#C9A227" : "#0E7C66",
                    }} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Monthly bookings bar */}
        <Section title="Monthly Bookings — 2024">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="bookings" name="Bookings" fill="#14356B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}

// ─── BOOKING REPORT ───────────────────────────────────────────────────────────
const BOOKING_ROWS = [
  { id:"BK-0892", date:"Jul 14", customer:"Md. Abdullah Al-Mamun", service:"Hajj – Economy", branch:"Chattogram HQ", agent:"Direct", amount:520000, status:"confirmed" },
  { id:"BK-0891", date:"Jul 13", customer:"Rabeya Khatun",         service:"Umrah – VIP",   branch:"Dhaka Office",   agent:"NMT Travels", amount:185000, status:"confirmed" },
  { id:"BK-0890", date:"Jul 12", customer:"Ahmed Family × 3",      service:"Malaysia Tour",  branch:"Chattogram HQ", agent:"Direct", amount:215000, status:"pending" },
  { id:"BK-0889", date:"Jul 11", customer:"NMT Agency × 15",       service:"Saudi Visa",     branch:"Dhaka Office",   agent:"NMT Travels", amount:450000, status:"overdue" },
  { id:"BK-0888", date:"Jul 10", customer:"Hosne Ara Begum",        service:"Hajj – Premium", branch:"Sylhet Branch",  agent:"Al-Madina", amount:680000, status:"confirmed" },
  { id:"BK-0887", date:"Jul 9",  customer:"Rahman Brothers",        service:"Air Ticket × 4", branch:"Chattogram HQ", agent:"Direct", amount:88000,  status:"confirmed" },
  { id:"BK-0886", date:"Jul 8",  customer:"Karim Family",           service:"Umrah – Standard",branch:"Cox's Bazar",  agent:"Haji Travels", amount:140000, status:"pending" },
];

const STATUS_CHK: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending:   "bg-amber-50 text-amber-700",
  cancelled: "bg-slate-100 text-slate-500",
  overdue:   "bg-red-50 text-red-600",
};

function BookingReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;
  if (loadState === "empty") return <EmptyState report="booking" />;
  const total = BOOKING_ROWS.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Bookings" value="592" trend={21.4} icon={Calendar} color="bg-[#14356B]" />
        <KpiCard label="Confirmed" value="471" trend={18.2} icon={CheckCircle} color="bg-emerald-500" />
        <KpiCard label="Pending" value="89" icon={Clock} color="bg-amber-500" />
        <KpiCard label="Cancelled" value="32" trend={-5} icon={AlertTriangle} color="bg-red-500" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <Section title="Bookings by Service" className="col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SERVICE_BREAKDOWN.map(s => ({ name: s.name, bookings: Math.round(592 * s.value / 100) }))}
              margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="bookings" name="Bookings" radius={[3, 3, 0, 0]}>
                {SERVICE_BREAKDOWN.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Status Breakdown">
          <div className="space-y-3">
            {[
              { label:"Confirmed", count:471, pct:80, color:"#0E7C66" },
              { label:"Pending",   count:89,  pct:15, color:"#F59E0B" },
              { label:"Cancelled", count:32,  pct:5,  color:"#EF4444" },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{s.label}</span>
                  <span className="font-semibold text-slate-800">{s.count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <Section title="Booking Transactions" actions={
        <button className="text-xs text-[#14356B] hover:underline flex items-center gap-1"><Eye size={12} /> View All</button>
      }>
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="border-b border-slate-100">
              {["Booking ID","Date","Customer","Service","Branch","Agent","Amount","Status"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BOOKING_ROWS.map(r => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 pr-4 text-xs font-mono text-slate-400">{r.id}</td>
                <td className="py-3 pr-4 text-sm text-slate-500">{r.date}</td>
                <td className="py-3 pr-4 text-sm font-medium text-slate-700">{r.customer}</td>
                <td className="py-3 pr-4 text-sm text-slate-500">{r.service}</td>
                <td className="py-3 pr-4 text-sm text-slate-500">{r.branch}</td>
                <td className="py-3 pr-4 text-sm text-slate-500">{r.agent}</td>
                <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtC(r.amount)}
                </td>
                <td className="py-3">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", STATUS_CHK[r.status])}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <td colSpan={6} className="px-0 py-3 text-xs font-semibold text-slate-600">Total (shown)</td>
              <td className="py-3 text-sm font-bold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtC(total)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </Section>
    </div>
  );
}

// ─── SALES REPORT ─────────────────────────────────────────────────────────────
function SalesReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;
  if (loadState === "empty") return <EmptyState report="sales" />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Sales (Jul)" value={fmtC(9400000)} trend={20.5} icon={TrendingUp} color="bg-[#14356B]" />
        <KpiCard label="vs Target" value="110.6%" trend={10.6} icon={Star} color="bg-emerald-500" />
        <KpiCard label="Avg. Booking Value" value={fmtC(15878)} trend={7.2} icon={DollarSign} color="bg-amber-500" />
        <KpiCard label="Conversion Rate" value="34.2%" trend={3.1} icon={TrendingUp} color="bg-blue-500" />
      </div>
      <Section title="Revenue Trend — Monthly">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14356B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#14356B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
              tickFormatter={v => `৳${(v / 1000000).toFixed(0)}M`} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#14356B" strokeWidth={2.5} fill="url(#salesGrad)" />
            <Area type="monotone" dataKey="expense" name="Expense" stroke="#EF4444" strokeWidth={2} fill="url(#expGrad)" />
            <Line type="monotone" dataKey="target" name="Target" stroke="#C9A227" strokeWidth={2} strokeDasharray="5 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>
      <Section title="Sales by Service — YTD">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="border-b border-slate-100">
              {["Service","Bookings","Revenue","% of Total","Avg Value","Growth"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SERVICE_BREAKDOWN.map((s, i) => {
              const bookings = Math.round(2288 * s.value / 100);
              const growth = [14.2, 11.8, 8.4, 5.2, 22.1, 3.8][i];
              return (
                <tr key={s.name} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-sm font-medium text-slate-700">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{bookings.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(s.revenue)}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.color }} />
                      </div>
                      <span className="text-xs text-slate-500">{s.value}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-600 font-mono"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(Math.round(s.revenue / bookings))}
                  </td>
                  <td className="py-3">
                    <span className={cn("flex items-center gap-0.5 text-xs font-medium", growth > 0 ? "text-emerald-600" : "text-red-500")}>
                      {growth > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {Math.abs(growth)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <td className="py-3 pr-4 text-xs font-bold text-slate-700">Total</td>
              <td className="py-3 pr-4 text-sm font-bold text-slate-700 font-mono">2,288</td>
              <td className="py-3 pr-4 text-sm font-bold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtC(SERVICE_BREAKDOWN.reduce((s, r) => s + r.revenue, 0))}
              </td>
              <td className="py-3 pr-4 text-xs font-bold text-slate-600">100%</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </Section>
    </div>
  );
}

// ─── HAJJ REPORT ──────────────────────────────────────────────────────────────
function HajjReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Applicants" value="677" trend={8.2} icon={Users} color="bg-[#14356B]" />
        <KpiCard label="Approved (Govt.)" value="610" trend={6.1} icon={CheckCircle} color="bg-emerald-500" />
        <KpiCard label="Departed" value="354" icon={Plane} color="bg-amber-500" />
        <KpiCard label="Hajj Revenue (YTD)" value={fmtM(47520000)} trend={14.4} icon={DollarSign} color="bg-purple-500" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <Section title="Applications Pipeline — 2024" className="col-span-2">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={HAJJ_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="applications" name="Applications" fill="#14356B" radius={[2, 2, 0, 0]} />
              <Bar dataKey="approved" name="Approved" fill="#C9A227" radius={[2, 2, 0, 0]} />
              <Bar dataKey="departed" name="Departed" fill="#0E7C66" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Package Mix">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={[
                { name:"Economy", value:42, fill:"#14356B" },
                { name:"Standard", value:35, fill:"#C9A227" },
                { name:"Premium", value:23, fill:"#0E7C66" },
              ]} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3}>
                {[1,2,3].map((_, i) => <Cell key={i} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5">
            {[
              { name:"Economy", pct:42, color:"#14356B" },
              { name:"Standard", pct:35, color:"#C9A227" },
              { name:"Premium", pct:23, color:"#0E7C66" },
            ].map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-slate-600">{p.name}</span>
                </div>
                <span className="font-medium text-slate-700">{p.pct}%</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <Section title="Monthly Hajj Summary">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="border-b border-slate-100">
              {["Month","Applications","Approved","Approval %","Departed","Revenue"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HAJJ_DATA.map(r => (
              <tr key={r.month} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 pr-4 text-sm font-medium text-slate-700">{r.month} 2024</td>
                <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{r.applications}</td>
                <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{r.approved}</td>
                <td className="py-3 pr-4 text-sm text-slate-600">
                  <span className={cn("font-medium", r.approved / r.applications > 0.9 ? "text-emerald-600" : "text-amber-600")}>
                    {Math.round(r.approved / r.applications * 100)}%
                  </span>
                </td>
                <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{r.departed}</td>
                <td className="py-3 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtC(r.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <td className="py-3 pr-4 text-xs font-bold text-slate-700">Total</td>
              <td className="py-3 pr-4 text-sm font-bold text-slate-700 font-mono">{HAJJ_DATA.reduce((s,r)=>s+r.applications,0)}</td>
              <td className="py-3 pr-4 text-sm font-bold text-slate-700 font-mono">{HAJJ_DATA.reduce((s,r)=>s+r.approved,0)}</td>
              <td className="py-3 pr-4 text-sm font-bold text-emerald-600">90%</td>
              <td className="py-3 pr-4 text-sm font-bold text-slate-700 font-mono">{HAJJ_DATA.reduce((s,r)=>s+r.departed,0)}</td>
              <td className="py-3 text-sm font-bold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtC(HAJJ_DATA.reduce((s,r)=>s+r.revenue,0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </Section>
    </div>
  );
}

// ─── UMRAH REPORT ─────────────────────────────────────────────────────────────
function UmrahReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;
  const UMRAH_MONTHLY = MONTHLY_REVENUE.map(m => ({
    ...m,
    pilgrims: Math.round(m.bookings * 0.27),
    revenue: Math.round(m.revenue * 0.27),
  }));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Umrah Pilgrims (YTD)" value="618" trend={12.4} icon={Users} color="bg-[#14356B]" />
        <KpiCard label="Groups Operated" value="42" trend={9.8} icon={Globe} color="bg-emerald-500" />
        <KpiCard label="Avg Package Value" value={fmtC(198000)} trend={6.1} icon={DollarSign} color="bg-amber-500" />
        <KpiCard label="Revenue (YTD)" value={fmtM(12300000)} trend={14.1} icon={TrendingUp} color="bg-purple-500" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Section title="Pilgrims by Month">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={UMRAH_MONTHLY} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="pilgrims" name="Pilgrims" fill="#14356B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Package Type Distribution">
          <div className="space-y-4 pt-2">
            {[
              { label:"Economy (7N/8D)", count:224, pct:36, price:95000 },
              { label:"Standard (10N/11D)", count:198, pct:32, price:140000 },
              { label:"VIP (14N/15D)", count:124, pct:20, price:195000 },
              { label:"Ramadan Special", count:72, pct:12, price:320000 },
            ].map(p => (
              <div key={p.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{p.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{p.count} pax</span>
                    <span className="text-xs font-mono text-slate-600">{fmtC(p.price)}</span>
                    <span className="font-semibold text-slate-800 w-8 text-right">{p.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#14356B] rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── VISA REPORT ──────────────────────────────────────────────────────────────
function VisaReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;
  if (loadState === "empty") return <EmptyState report="visa" />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Applications" value="1,240" trend={18.4} icon={FileText} color="bg-[#14356B]" />
        <KpiCard label="Approved" value="980" trend={15.2} icon={CheckCircle} color="bg-emerald-500" />
        <KpiCard label="Approval Rate" value="79.0%" trend={2.4} icon={TrendingUp} color="bg-blue-500" />
        <KpiCard label="Visa Revenue (YTD)" value={fmtM(4800000)} trend={8.4} icon={DollarSign} color="bg-amber-500" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <Section title="Application Funnel" className="col-span-2">
          <div className="space-y-3 py-2">
            {VISA_FUNNEL.map((stage, i) => {
              const pct = Math.round(stage.value / VISA_FUNNEL[0].value * 100);
              const dropoff = i > 0 ? VISA_FUNNEL[i-1].value - stage.value : 0;
              return (
                <div key={stage.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{stage.name}</span>
                    <div className="flex items-center gap-4">
                      {dropoff > 0 && (
                        <span className="text-xs text-red-400">−{dropoff} dropped</span>
                      )}
                      <span className="font-semibold text-slate-800 font-mono w-12 text-right">{stage.value.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-5 bg-slate-100 rounded-md overflow-hidden">
                    <div className="h-full rounded-md transition-all flex items-center justify-end pr-2"
                      style={{ width: `${pct}%`, background: stage.fill }}>
                      {pct > 20 && <span className="text-white text-xs font-semibold">{pct}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
        <Section title="By Country">
          <div className="space-y-2.5">
            {[
              { country:"Saudi Arabia", count:540, flag:"🇸🇦" },
              { country:"UAE", count:210, flag:"🇦🇪" },
              { country:"Malaysia", count:148, flag:"🇲🇾" },
              { country:"Qatar", count:92, flag:"🇶🇦" },
              { country:"Kuwait", count:71, flag:"🇰🇼" },
              { country:"Others", count:179, flag:"🌐" },
            ].map(c => (
              <div key={c.country} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">{c.flag}</span>
                  <span className="text-slate-600">{c.country}</span>
                </div>
                <span className="font-semibold text-slate-800 font-mono">{c.count}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── MANPOWER REPORT ──────────────────────────────────────────────────────────
function ManpowerReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Workers Placed (YTD)" value="342" trend={22.1} icon={Users} color="bg-[#14356B]" />
        <KpiCard label="Active Orders" value="28" icon={Briefcase} color="bg-emerald-500" />
        <KpiCard label="Avg Placement Fee" value={fmtC(85000)} trend={5.2} icon={DollarSign} color="bg-amber-500" />
        <KpiCard label="Revenue (YTD)" value={fmtM(2940000)} trend={22.1} icon={TrendingUp} color="bg-purple-500" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Section title="Placements by Country">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 70 }}
              data={[
                { country:"Saudi Arabia", workers:142 },
                { country:"UAE", workers:98 },
                { country:"Qatar", workers:52 },
                { country:"Kuwait", workers:28 },
                { country:"Bahrain", workers:22 },
              ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="workers" name="Workers" fill="#14356B" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="By Category">
          <div className="space-y-3">
            {[
              { cat:"Domestic Workers", count:124, pct:36, color:"#14356B" },
              { cat:"Construction", count:98, pct:29, color:"#C9A227" },
              { cat:"Hospitality", count:72, pct:21, color:"#0E7C66" },
              { cat:"Healthcare", count:48, pct:14, color:"#7C3AED" },
            ].map(c => (
              <div key={c.cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{c.cat}</span>
                  <span className="font-semibold text-slate-800">{c.count} ({c.pct}%)</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── AGENT REPORT ─────────────────────────────────────────────────────────────
function AgentReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Active Agents" value="24" trend={4} icon={Users} color="bg-[#14356B]" />
        <KpiCard label="Agent Bookings (YTD)" value="555" trend={18} icon={Calendar} color="bg-emerald-500" />
        <KpiCard label="Total Commission" value={fmtC(1265000)} trend={14.2} icon={DollarSign} color="bg-amber-500" />
        <KpiCard label="Agent Revenue Share" value="24.3%" trend={2.1} icon={TrendingUp} color="bg-blue-500" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <Section title="Top Agents — Revenue" className="col-span-2">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={AGENT_DATA.slice(0,5)} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                tickFormatter={v => `৳${(v/1000000).toFixed(1)}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#14356B" radius={[3, 3, 0, 0]} />
              <Bar dataKey="commission" name="Commission" fill="#C9A227" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Performance Summary">
          <div className="space-y-3">
            {AGENT_DATA.map((a, i) => (
              <div key={a.name} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#14356B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.bookings} bookings</p>
                </div>
                <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full",
                  a.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <Section title="Agent Detail Report">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="border-b border-slate-100">
              {["Agent","Bookings","Revenue","Commission","Rate","Status"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGENT_DATA.map(a => (
              <tr key={a.name} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 pr-4 text-sm font-medium text-slate-700">{a.name}</td>
                <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{a.bookings}</td>
                <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtC(a.revenue)}
                </td>
                <td className="py-3 pr-4 text-sm text-amber-600 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtC(a.commission)}
                </td>
                <td className="py-3 pr-4 text-sm text-slate-600">{a.rate}</td>
                <td className="py-3">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                    a.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <td className="py-3 pr-4 text-xs font-bold text-slate-700">Total</td>
              <td className="py-3 pr-4 text-sm font-bold text-slate-700 font-mono">{AGENT_DATA.reduce((s,a)=>s+a.bookings,0)}</td>
              <td className="py-3 pr-4 text-sm font-bold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtC(AGENT_DATA.reduce((s,a)=>s+a.revenue,0))}
              </td>
              <td className="py-3 pr-4 text-sm font-bold text-amber-600 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtC(AGENT_DATA.reduce((s,a)=>s+a.commission,0))}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </Section>
    </div>
  );
}

// ─── P&L ─────────────────────────────────────────────────────────────────────
const PNL_ROW_STYLE: Record<string, string> = {
  "revenue":      "font-semibold text-slate-800",
  "revenue-sub":  "text-slate-600 pl-4",
  "expense":      "font-semibold text-slate-800",
  "expense-sub":  "text-slate-600 pl-4",
  "total":        "font-bold text-slate-800 bg-blue-50/50",
  "grand-total":  "font-bold text-[#14356B] bg-[#14356B]/5",
};
const PNL_AMOUNT_COLOR: Record<string, string> = {
  "revenue": "text-emerald-700", "revenue-sub": "text-emerald-600",
  "expense": "text-red-600", "expense-sub": "text-red-500",
  "total": "text-slate-800", "grand-total": "text-[#14356B]",
};

function PnlReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;
  const netProfit = 4335000;
  const revenue = 42100000;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Revenue (YTD)" value={fmtC(revenue)} trend={14.4} icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard label="Total Expenses (YTD)" value={fmtC(37000000)} trend={8.1} icon={TrendingDown} color="bg-red-500" />
        <KpiCard label="Net Profit (YTD)" value={fmtC(netProfit)} trend={24.4} icon={DollarSign} color="bg-[#14356B]" />
        <KpiCard label="Net Margin" value="10.3%" trend={2.1} icon={BarChart3} color="bg-amber-500" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <Section title="Revenue vs Expense — Monthly" className="col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                tickFormatter={v => `৳${(v/1000000).toFixed(0)}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#0E7C66" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Profit Margin">
          <div className="pt-2 space-y-4">
            {[
              { label:"Gross Margin", value:29.2, color:"#0E7C66" },
              { label:"EBIT Margin", value:12.1, color:"#14356B" },
              { label:"Net Margin", value:10.3, color:"#C9A227" },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{m.label}</span>
                  <span className="font-bold" style={{ color: m.color }}>{m.value}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${m.value * 3}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <Section title="Profit & Loss Statement — Year to Date 2024">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Account</th>
              <th className="text-right text-xs font-medium text-slate-500 pb-3 pr-4">Q1 2024</th>
              <th className="text-right text-xs font-medium text-slate-500 pb-3 pr-4">Q2 2024</th>
              <th className="text-right text-xs font-medium text-slate-500 pb-3 pr-4">YTD 2024</th>
              <th className="text-right text-xs font-medium text-slate-500 pb-3 pr-4">YTD 2023</th>
              <th className="text-right text-xs font-medium text-slate-500 pb-3">Change</th>
            </tr>
          </thead>
          <tbody>
            {PNL_DATA.map((row, i) => {
              const change = ((row.ytd - row.prev) / row.prev * 100).toFixed(1);
              const isPos = parseFloat(change) >= 0;
              const isRevenue = row.type.startsWith("revenue");
              return (
                <tr key={i} className={cn("border-b border-slate-50 hover:bg-slate-50/50", PNL_ROW_STYLE[row.type])}>
                  <td className={cn("py-2.5 pr-4 text-sm", row.type.includes("sub") ? "pl-6 text-slate-600" : "text-slate-800")}>
                    {row.category}
                  </td>
                  <td className={cn("py-2.5 pr-4 text-sm text-right font-mono", PNL_AMOUNT_COLOR[row.type])}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(row.q1)}
                  </td>
                  <td className={cn("py-2.5 pr-4 text-sm text-right font-mono", PNL_AMOUNT_COLOR[row.type])}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(row.q2)}
                  </td>
                  <td className={cn("py-2.5 pr-4 text-sm text-right font-bold font-mono", PNL_AMOUNT_COLOR[row.type])}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(row.ytd)}
                  </td>
                  <td className="py-2.5 pr-4 text-sm text-right text-slate-400 font-mono"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(row.prev)}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={cn("text-xs font-medium flex items-center justify-end gap-0.5",
                      (isPos && isRevenue) || (!isPos && !isRevenue) ? "text-emerald-600" : "text-red-500")}>
                      {isPos ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {Math.abs(parseFloat(change))}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

// ─── BALANCE SHEET ────────────────────────────────────────────────────────────
function BalanceSheetReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;
  const totalAssets = BALANCE_SHEET.assets.reduce((s, a) => s + a.current, 0);
  const totalLiabilities = BALANCE_SHEET.liabilities.reduce((s, l) => s + l.current, 0);
  const totalEquity = BALANCE_SHEET.equity.reduce((s, e) => s + e.current, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Assets" value={fmtC(totalAssets)} icon={Layers} color="bg-[#14356B]" />
        <KpiCard label="Total Liabilities" value={fmtC(totalLiabilities)} icon={AlertTriangle} color="bg-red-500" />
        <KpiCard label="Total Equity" value={fmtC(totalEquity)} trend={74.2} icon={TrendingUp} color="bg-emerald-500" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        {/* Asset composition */}
        <Section title="Asset Composition">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={BALANCE_SHEET.assets} dataKey="current" nameKey="name"
                cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {BALANCE_SHEET.assets.map((_, i) => (
                  <Cell key={i} fill={["#14356B","#1d4ed8","#0E7C66","#C9A227","#7C3AED","#94A3B8"][i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [fmtC(v), ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {BALANCE_SHEET.assets.map((a, i) => (
              <div key={a.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: ["#14356B","#1d4ed8","#0E7C66","#C9A227","#7C3AED","#94A3B8"][i] }} />
                <span className="text-slate-500 truncate">{a.name}</span>
              </div>
            ))}
          </div>
        </Section>
        {/* Funding structure */}
        <Section title="Funding Structure">
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex mb-3">
            <div className="h-full bg-red-400 rounded-l-full" style={{ width: `${(totalLiabilities / totalAssets * 100).toFixed(0)}%` }} />
            <div className="h-full bg-[#14356B] rounded-r-full flex-1" />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mb-5">
            <span>Liabilities {(totalLiabilities / totalAssets * 100).toFixed(0)}%</span>
            <span>Equity {(totalEquity / totalAssets * 100).toFixed(0)}%</span>
          </div>
          <div className="space-y-2">
            {[
              { label:"Debt-to-Equity", value:(totalLiabilities/totalEquity).toFixed(2) },
              { label:"Current Ratio", value:"1.84" },
              { label:"Asset Turnover", value:"1.23×" },
              { label:"Return on Equity", value:"21.7%" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm py-1.5 border-b border-slate-50">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-800 font-mono">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {/* Assets */}
        <Section title="Assets">
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 pb-2">Item</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Current</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Prior</th>
              </tr>
            </thead>
            <tbody>
              {BALANCE_SHEET.assets.map(a => (
                <tr key={a.name} className="border-b border-slate-50">
                  <td className="py-2 text-xs text-slate-600">{a.name}</td>
                  <td className="py-2 text-xs text-right font-mono text-slate-800">{fmtC(a.current)}</td>
                  <td className="py-2 text-xs text-right font-mono text-slate-400">{fmtC(a.prior)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="py-2 text-xs font-bold text-slate-800">Total Assets</td>
                <td className="py-2 text-xs font-bold text-right font-mono text-[#14356B]">{fmtC(totalAssets)}</td>
                <td className="py-2 text-xs font-bold text-right font-mono text-slate-400">
                  {fmtC(BALANCE_SHEET.assets.reduce((s,a)=>s+a.prior,0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </Section>
        {/* Liabilities */}
        <Section title="Liabilities">
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 pb-2">Item</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Current</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Prior</th>
              </tr>
            </thead>
            <tbody>
              {BALANCE_SHEET.liabilities.map(l => (
                <tr key={l.name} className="border-b border-slate-50">
                  <td className="py-2 text-xs text-slate-600">{l.name}</td>
                  <td className="py-2 text-xs text-right font-mono text-slate-800">{fmtC(l.current)}</td>
                  <td className="py-2 text-xs text-right font-mono text-slate-400">{fmtC(l.prior)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="py-2 text-xs font-bold text-slate-800">Total Liabilities</td>
                <td className="py-2 text-xs font-bold text-right font-mono text-red-600">{fmtC(totalLiabilities)}</td>
                <td className="py-2 text-xs font-bold text-right font-mono text-slate-400">
                  {fmtC(BALANCE_SHEET.liabilities.reduce((s,l)=>s+l.prior,0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </Section>
        {/* Equity */}
        <Section title="Equity">
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 pb-2">Item</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Current</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Prior</th>
              </tr>
            </thead>
            <tbody>
              {BALANCE_SHEET.equity.map(e => (
                <tr key={e.name} className="border-b border-slate-50">
                  <td className="py-2 text-xs text-slate-600">{e.name}</td>
                  <td className="py-2 text-xs text-right font-mono text-slate-800">{fmtC(e.current)}</td>
                  <td className="py-2 text-xs text-right font-mono text-slate-400">{fmtC(e.prior)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="py-2 text-xs font-bold text-slate-800">Total Equity</td>
                <td className="py-2 text-xs font-bold text-right font-mono text-emerald-700">{fmtC(totalEquity)}</td>
                <td className="py-2 text-xs font-bold text-right font-mono text-slate-400">
                  {fmtC(BALANCE_SHEET.equity.reduce((s,e)=>s+e.prior,0))}
                </td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-4 pt-4 border-t-2 border-slate-300">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-800">Liabilities + Equity</span>
              <span className="font-mono text-[#14356B]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtC(totalLiabilities + totalEquity)}
              </span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── CASH FLOW ────────────────────────────────────────────────────────────────
function CashFlowReport({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
  if (loadState === "loading") return <LoadingSkeleton />;
  const totalOp = CASHFLOW_DATA.reduce((s,m)=>s+m.operating,0);
  const totalInv = CASHFLOW_DATA.reduce((s,m)=>s+m.investing,0);
  const totalFin = CASHFLOW_DATA.reduce((s,m)=>s+m.financing,0);
  const netChange = totalOp + totalInv + totalFin;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Operating Cash Flow" value={fmtC(totalOp)} trend={18.4} icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard label="Investing Cash Flow" value={fmtC(Math.abs(totalInv))} icon={TrendingDown} color="bg-red-500" />
        <KpiCard label="Financing Cash Flow" value={fmtC(Math.abs(totalFin))} icon={DollarSign} color="bg-amber-500" />
        <KpiCard label="Net Cash Change" value={fmtC(netChange)} trend={12.1} icon={BarChart3} color="bg-[#14356B]" />
      </div>
      <Section title="Cash Flow by Category — Monthly">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={CASHFLOW_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
              tickFormatter={v => `৳${(v/1000000).toFixed(1)}M`} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="operating" name="Operating" fill="#0E7C66" radius={[3,3,0,0]} />
            <Bar dataKey="investing" name="Investing" fill="#EF4444" radius={[3,3,0,0]} />
            <Bar dataKey="financing" name="Financing" fill="#C9A227" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>
      <Section title="Cash Flow Statement — Year to Date">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Month</th>
              {["Operating","Investing","Financing","Net Change","Running Balance"].map(h => (
                <th key={h} className="text-right text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CASHFLOW_DATA.reduce((acc: any[], m, i) => {
              const net = m.operating + m.investing + m.financing;
              const prev = acc[i - 1]?.balance ?? 14200000;
              return [...acc, { ...m, net, balance: prev + net }];
            }, []).map(row => (
              <tr key={row.month} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 pr-4 text-sm font-medium text-slate-700">{row.month} 2024</td>
                <td className={cn("py-3 pr-4 text-sm text-right font-mono", row.operating > 0 ? "text-emerald-600" : "text-red-500")}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {row.operating > 0 ? "+" : ""}{fmtC(row.operating)}
                </td>
                <td className="py-3 pr-4 text-sm text-right font-mono text-red-500"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtC(row.investing)}
                </td>
                <td className={cn("py-3 pr-4 text-sm text-right font-mono", row.financing > 0 ? "text-emerald-600" : "text-amber-600")}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {row.financing > 0 ? "+" : ""}{fmtC(row.financing)}
                </td>
                <td className={cn("py-3 pr-4 text-sm text-right font-bold font-mono", row.net > 0 ? "text-emerald-700" : "text-red-600")}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {row.net > 0 ? "+" : ""}{fmtC(row.net)}
                </td>
                <td className="py-3 text-sm text-right font-mono font-semibold text-slate-800"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtC(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td className="py-3 pr-4 text-xs font-bold text-slate-800">YTD Total</td>
              <td className="py-3 pr-4 text-sm font-bold text-right font-mono text-emerald-700">{fmtC(totalOp)}</td>
              <td className="py-3 pr-4 text-sm font-bold text-right font-mono text-red-600">{fmtC(totalInv)}</td>
              <td className="py-3 pr-4 text-sm font-bold text-right font-mono text-amber-600">{fmtC(totalFin)}</td>
              <td className="py-3 pr-4 text-sm font-bold text-right font-mono text-[#14356B]">{fmtC(netChange)}</td>
              <td className="py-3 text-sm font-bold text-right font-mono text-[#14356B]">{fmtC(18250000)}</td>
            </tr>
          </tfoot>
        </table>
      </Section>
    </div>
  );
}

// ─── CUSTOM REPORTS ───────────────────────────────────────────────────────────
const SAVED_REPORTS = [
  { name:"Monthly Agent Commission Summary", schedule:"1st of each month", lastRun:"Jul 1", format:"Excel" },
  { name:"Hajj Season Occupancy Report", schedule:"Weekly (Mon)", lastRun:"Jul 8", format:"PDF" },
  { name:"Branch Revenue Comparison", schedule:"Monthly", lastRun:"Jul 1", format:"Excel" },
  { name:"Overdue Payments Alert", schedule:"Daily", lastRun:"Jul 14", format:"Email" },
];

function CustomReports({ filters, loadState }: { filters: Filters; loadState: LoadState }) {
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
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14356B]/20" />
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
                  <span key={f} className="flex items-center gap-1 px-2 py-1 bg-[#14356B] text-white text-xs rounded-md">
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
                    className="px-2 py-1 border border-slate-200 text-xs text-slate-600 rounded-md hover:border-[#14356B] hover:text-[#14356B] transition-colors">
                    + {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button className="flex-1 py-2 text-sm bg-[#14356B] text-white rounded-lg hover:bg-[#0f2a56]">
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
                    <button className="text-xs text-[#14356B] hover:underline">Run</button>
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
export function ReportsModule() {
  const [view, setView] = useState<ReportView>("overview");
  const [loadState, setLoadState] = useState<LoadState>("loaded");
  const [filters, setFilters] = useState<Filters>({
    dateRange: "ytd",
    branch: "all",
    service: "all",
    agent: "all",
  });

  const updateFilters = (partial: Partial<Filters>) => {
    setLoadState("loading");
    setFilters(prev => ({ ...prev, ...partial }));
    setTimeout(() => setLoadState("loaded"), 900);
  };

  const handleViewChange = (v: ReportView) => {
    setLoadState("loading");
    setView(v);
    setTimeout(() => setLoadState("loaded"), 700);
  };

  const handleExport = (type: "pdf" | "excel") => {
    // UI-only: would trigger download
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
    const props = { filters, loadState };
    switch (view) {
      case "overview":        return <OverviewReport {...props} />;
      case "bookings":        return <BookingReport {...props} />;
      case "sales":           return <SalesReport {...props} />;
      case "hajj":            return <HajjReport {...props} />;
      case "umrah":           return <UmrahReport {...props} />;
      case "visa":            return <VisaReport {...props} />;
      case "manpower":        return <ManpowerReport {...props} />;
      case "agents":          return <AgentReport {...props} />;
      case "pnl":             return <PnlReport {...props} />;
      case "balance-sheet":   return <BalanceSheetReport {...props} />;
      case "cashflow":        return <CashFlowReport {...props} />;
      case "custom":          return <CustomReports {...props} />;
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
                      ? "bg-[#14356B]/8 text-[#14356B] font-medium"
                      : "text-slate-600 hover:bg-slate-50")}>
                  <item.icon size={15} className={view === item.id ? "text-[#14356B]" : "text-slate-400"} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Quick export strip */}
        <div className="p-3 border-t border-slate-100 space-y-1.5">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Printer size={12} /> Export current as PDF
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
            <Download size={12} /> Export as Excel
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <FilterBar
            filters={filters}
            onChange={updateFilters}
            onExport={handleExport}
            onRefresh={() => updateFilters({})}
            title={title}
            subtitle={subtitle}
          />
          {renderReport()}
        </div>
      </div>
    </div>
  );
}
