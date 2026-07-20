import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  LayoutDashboard, Plane, Hotel, TrendingUp, DollarSign, Users,
  BarChart3, Star, Activity, Zap, Target, Award, RefreshCw,
  Download, Printer, Filter, Calendar, Building2, Search,
  ChevronRight, Plus, X, GripVertical, Eye, Check,
  ArrowUpRight, ArrowDownRight, Clock, AlertTriangle, Cpu,
  FileText, Sliders, Globe, Layers, CheckCircle,
} from "lucide-react";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type BiView =
  | "realtime" | "visa" | "tickets" | "hotels"
  | "sales" | "financial" | "agents" | "staff" | "custom";

const fmtC = (n: number) => "৳ " + n.toLocaleString("en-BD");
const fmtM = (n: number) => "৳" + (n / 1000000).toFixed(2) + "M";

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

// ─── Mock data ────────────────────────────────────────────────────────────────
const MONTHLY = [
  { month:"Jan", revenue:3200000, expense:2100000, bookings:198, target:3000000 },
  { month:"Feb", revenue:2850000, expense:1900000, bookings:171, target:3000000 },
  { month:"Mar", revenue:3600000, expense:2300000, bookings:224, target:3200000 },
  { month:"Apr", revenue:4100000, expense:2600000, bookings:256, target:3500000 },
  { month:"May", revenue:5200000, expense:3100000, bookings:318, target:4800000 },
  { month:"Jun", revenue:7800000, expense:4800000, bookings:487, target:7000000 },
  { month:"Jul", revenue:9400000, expense:5600000, bookings:592, target:8500000 },
];

const REALTIME_METRICS = [
  { label:"Live Sessions", value:"142", delta:"+12 vs yesterday", up:true, icon:Activity  },
  { label:"Bookings Today", value:"38",  delta:"+8 vs avg",       up:true, icon:Calendar  },
  { label:"Revenue Today", value:fmtC(1840000), delta:"+22%",     up:true, icon:DollarSign},
  { label:"Pending Actions", value:"7", delta:"3 urgent",          up:false,icon:AlertTriangle},
];

const HOURLY = Array.from({ length: 24 }, (_, h) => ({
  hour: h.toString().padStart(2,"0")+":00",
  sessions: Math.floor(Math.random() * 30 + (h >= 9 && h <= 18 ? 50 : 10)),
  bookings: Math.floor(Math.random() * 6 + (h >= 9 && h <= 18 ? 8 : 1)),
}));

const VISA_DATA = [
  { country:"Saudi Arabia", applied:540, approved:498, rejected:42, pending:0,  rate:92 },
  { country:"UAE",           applied:210, approved:188, rejected:12, pending:10, rate:90 },
  { country:"Malaysia",      applied:148, approved:132, rejected:8,  pending:8,  rate:89 },
  { country:"Qatar",         applied:92,  approved:79,  rejected:7,  pending:6,  rate:86 },
  { country:"Kuwait",        applied:71,  approved:64,  rejected:4,  pending:3,  rate:90 },
];

const TICKET_DATA = [
  { route:"DAC–JED", carrier:"Biman", tickets:210, revenue:12600000, avgFare:60000, load:94 },
  { route:"DAC–DXB", carrier:"Emirates", tickets:98, revenue:7840000, avgFare:80000, load:87 },
  { route:"CGP–JED", carrier:"Saudia",  tickets:148, revenue:9620000, avgFare:65000, load:91 },
  { route:"DAC–KUL", carrier:"AirAsia", tickets:72,  revenue:2880000, avgFare:40000, load:82 },
  { route:"DAC–DOH", carrier:"Qatar Airways", tickets:54, revenue:4860000, avgFare:90000, load:78 },
];

const HOTEL_DATA = [
  { city:"Makkah",  hotel:"Dar Al-Tawhid",     nights:3240, revenue:16200000, occ:94, rating:4.8 },
  { city:"Madinah", hotel:"Anwar Madinah",      nights:2160, revenue:8640000,  occ:89, rating:4.6 },
  { city:"Jeddah",  hotel:"Hilton Corniche",    nights:420,  revenue:2940000,  occ:72, rating:4.4 },
  { city:"Kuala Lumpur", hotel:"Marriott KL",   nights:360,  revenue:1800000,  occ:81, rating:4.5 },
  { city:"Dubai",   hotel:"Rotana Creek",       nights:196,  revenue:1960000,  occ:78, rating:4.3 },
];

const AGENTS = [
  { name:"Rahim & Sons",      bookings:142, revenue:6800000, target:6000000, commission:340000, csat:94, growth:18 },
  { name:"NMT Travels",       bookings:118, revenue:5400000, target:5000000, commission:270000, csat:91, growth:12 },
  { name:"Al-Madina Agency",  bookings:97,  revenue:4200000, target:4500000, commission:210000, csat:88, growth:8  },
  { name:"Haji Travels",      bookings:84,  revenue:3800000, target:4000000, commission:190000, csat:92, growth:5  },
  { name:"Green Umrah",       bookings:63,  revenue:2900000, target:3500000, commission:145000, csat:85, growth:-2 },
  { name:"Bismillah Int'l",   bookings:51,  revenue:2200000, target:2500000, commission:110000, csat:87, growth:22 },
];

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
    <div className="bg-white rounded-xl border border-slate-200 p-5">
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
    <div className={cn("bg-white rounded-xl border border-slate-200", className)}>
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
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
function FilterBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"><RefreshCw size={14} /></button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Printer size={14} /> PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[
          { icon:Calendar, opts:["This Month","Last Month","Q2 2024","YTD","Custom…"] },
          { icon:Building2, opts:["All Branches","Chattogram HQ","Dhaka","Sylhet","Cox's Bazar"] },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
            <f.icon size={14} className="text-slate-400" />
            <select className="bg-transparent focus:outline-none cursor-pointer">
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── REAL-TIME DASHBOARD ──────────────────────────────────────────────────────
function RealtimeView() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const liveBookings = 38 + (tick % 3);
  const liveRevenue = 1840000 + tick * 12500;
  const liveSessions = 142 + (tick % 5) - 2;

  return (
    <div className="space-y-5">
      {/* Live badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Real-time Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Live data — auto-refreshes every 30 seconds</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-red-600">LIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Active Sessions"  value={String(liveSessions)}     delta="+12 vs yesterday" up icon={Activity}       color="bg-[#0E6BB8]" pulse />
        <KpiCard label="Bookings Today"   value={String(liveBookings)}     delta="+8 vs avg"        up icon={Calendar}       color="bg-emerald-500" />
        <KpiCard label="Revenue Today"    value={fmtC(liveRevenue)}        delta="+22%"             up icon={DollarSign}     color="bg-amber-500" />
        <KpiCard label="Pending Actions"  value="7"                        delta="3 urgent"         up={false} icon={AlertTriangle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Section title="Sessions — Today (Hourly)" className="col-span-2">
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={HOURLY.filter((_,i) => i >= 7 && i <= 20)} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0E6BB8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0E6BB8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#0E6BB8" strokeWidth={2} fill="url(#sessGrad)" />
              <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#E8471F" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Live Activity Feed">
          <div className="space-y-2">
            {[
              { action:"New booking",   desc:"Hajj Economy – Karim U.", time:"just now",  color:"bg-emerald-500" },
              { action:"Payment rcvd",  desc:"৳92,500 – bKash #0892",   time:"2 min ago", color:"bg-blue-500"    },
              { action:"Doc uploaded",  desc:"Passport – Rabeya K.",     time:"4 min ago", color:"bg-purple-500"  },
              { action:"Visa approved", desc:"Saudi – Ahmed F. batch",   time:"8 min ago", color:"bg-[#E8471F]"   },
              { action:"Chat message",  desc:"NMT Travels – quota query",time:"12 min ago",color:"bg-slate-400"   },
              { action:"New booking",   desc:"Malaysia Tour × 3",        time:"15 min ago",color:"bg-emerald-500" },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1.5">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", e.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{e.action}</p>
                  <p className="text-xs text-slate-400 truncate">{e.desc}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{e.time}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Section title="Revenue — This Month vs Last Month">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY.slice(-4)} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                tickFormatter={v => `৳${(v/1000000).toFixed(0)}M`} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#0E6BB8" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section title="System Health">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"API Response", value:"142ms", status:"good", icon:Cpu      },
              { label:"DB Queries",   value:"38/s",  status:"good", icon:Layers   },
              { label:"Storage",      value:"34%",   status:"good", icon:FileText },
              { label:"Active Users", value:"142",   status:"live", icon:Users    },
            ].map(({ label, value, status, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                  status === "good" ? "bg-emerald-100" : "bg-blue-100")}>
                  <Icon size={15} className={status === "good" ? "text-emerald-600" : "text-blue-600"} />
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
    </div>
  );
}

// ─── VISA REPORTS ─────────────────────────────────────────────────────────────
function VisaReport() {
  return (
    <div className="space-y-5">
      <FilterBar title="Visa Reports" subtitle="Visa applications, approvals, and processing metrics" />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Total Applications", value:"1,061", delta:"+18%", up:true,  icon:FileText,      color:"bg-[#0E6BB8]" },
          { label:"Approved",           value:"961",   delta:"+15%", up:true,  icon:CheckCircle,   color:"bg-emerald-500" },
          { label:"Approval Rate",      value:"90.6%", delta:"+2%",  up:true,  icon:TrendingUp,    color:"bg-blue-500" },
          { label:"Avg Processing",     value:"4.2 d", delta:"-0.8", up:true,  icon:Clock,         color:"bg-amber-500" },
        ].map(p => <KpiCard key={p.label} {...p} />)}
      </div>
      <div className="grid grid-cols-3 gap-5">
        <Section title="Applications by Country" className="col-span-2">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Country","Applied","Approved","Rejected","Pending","Rate"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VISA_DATA.map(r => (
                <tr key={r.country} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4 text-sm font-medium text-slate-700">{r.country}</td>
                  <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{r.applied}</td>
                  <td className="py-3 pr-4 text-sm text-emerald-600 font-mono">{r.approved}</td>
                  <td className="py-3 pr-4 text-sm text-red-500 font-mono">{r.rejected}</td>
                  <td className="py-3 pr-4 text-sm text-amber-600 font-mono">{r.pending}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.rate}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">{r.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section title="Monthly Trend">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MONTHLY} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                tickFormatter={v => `${Math.round(v / 30)}`} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="bookings" name="Visas" stroke="#0E6BB8" strokeWidth={2.5} dot={{ r: 3, fill: "#0E6BB8" }} />
            </LineChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}

// ─── TICKET REPORTS ───────────────────────────────────────────────────────────
function TicketReport() {
  return (
    <div className="space-y-5">
      <FilterBar title="Air Ticket Reports" subtitle="Flight bookings, revenue, and load factor analysis" />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Tickets Issued",  value:"582",          delta:"+9%",  up:true, icon:Plane,     color:"bg-[#0E6BB8]"  },
          { label:"Ticket Revenue",  value:fmtM(39700000), delta:"+11%", up:true, icon:DollarSign,color:"bg-emerald-500"},
          { label:"Avg Load Factor", value:"86.4%",        delta:"+4%",  up:true, icon:Target,    color:"bg-blue-500"   },
          { label:"Avg Fare",        value:fmtC(68213),    delta:"+2%",  up:true, icon:TrendingUp, color:"bg-amber-500" },
        ].map(p => <KpiCard key={p.label} {...p} />)}
      </div>
      <Section title="Route Performance">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {["Route","Carrier","Tickets","Revenue","Avg Fare","Load Factor"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TICKET_DATA.map(r => (
              <tr key={r.route} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 pr-4 text-sm font-bold text-slate-800 font-mono">{r.route}</td>
                <td className="py-3 pr-4 text-sm text-slate-500">{r.carrier}</td>
                <td className="py-3 pr-4 text-sm text-slate-700 font-mono">{r.tickets}</td>
                <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtC(r.revenue)}
                </td>
                <td className="py-3 pr-4 text-sm text-slate-600 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtC(r.avgFare)}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", r.load >= 90 ? "bg-emerald-500" : r.load >= 75 ? "bg-amber-400" : "bg-red-400")}
                        style={{ width: `${r.load}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{r.load}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <td colSpan={2} className="py-3 pr-4 text-xs font-bold text-slate-800">Total</td>
              <td className="py-3 pr-4 text-sm font-bold text-slate-800 font-mono">{TICKET_DATA.reduce((s,r)=>s+r.tickets,0)}</td>
              <td className="py-3 pr-4 text-sm font-bold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtC(TICKET_DATA.reduce((s,r)=>s+r.revenue,0))}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </Section>
    </div>
  );
}

// ─── HOTEL REPORTS ────────────────────────────────────────────────────────────
function HotelReport() {
  return (
    <div className="space-y-5">
      <FilterBar title="Hotel Reports" subtitle="Accommodation bookings, occupancy, and revenue" />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Total Room Nights",    value:"6,376",        delta:"+14%", up:true, icon:Hotel,     color:"bg-[#0E6BB8]"  },
          { label:"Hotel Revenue",        value:fmtM(31540000), delta:"+18%", up:true, icon:DollarSign,color:"bg-emerald-500"},
          { label:"Avg Occupancy",        value:"82.8%",        delta:"+4%",  up:true, icon:Target,    color:"bg-blue-500"   },
          { label:"Avg Rating",           value:"4.52 ★",       delta:"+0.1", up:true, icon:Star,      color:"bg-amber-500"  },
        ].map(p => <KpiCard key={p.label} {...p} />)}
      </div>
      <div className="grid grid-cols-3 gap-5">
        <Section title="Hotel Performance" className="col-span-2">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["City","Hotel","Room Nights","Revenue","Occupancy","Rating"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOTEL_DATA.map(r => (
                <tr key={r.hotel} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4 text-sm text-slate-500">{r.city}</td>
                  <td className="py-3 pr-4 text-sm font-medium text-slate-700">{r.hotel}</td>
                  <td className="py-3 pr-4 text-sm text-slate-600 font-mono">{r.nights.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(r.revenue)}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#0E6BB8]" style={{ width: `${r.occ}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{r.occ}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm font-semibold text-amber-600">{"★".repeat(Math.round(r.rating))} {r.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section title="Revenue by City">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={HOTEL_DATA} dataKey="revenue" nameKey="city"
                cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {HOTEL_DATA.map((_, i) => (
                  <Cell key={i} fill={["#0E6BB8","#E8471F","#0E7C66","#2563EB","#7C3AED"][i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [fmtC(v), ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {HOTEL_DATA.map((h, i) => (
              <div key={h.city} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: ["#0E6BB8","#E8471F","#0E7C66","#2563EB","#7C3AED"][i] }} />
                  <span className="text-slate-600">{h.city}</span>
                </div>
                <span className="font-medium text-slate-700 font-mono">{fmtC(h.revenue)}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── SALES REPORTS ────────────────────────────────────────────────────────────
function SalesReport() {
  return (
    <div className="space-y-5">
      <FilterBar title="Sales Reports" subtitle="Revenue performance vs targets by service and branch" />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Total Revenue (YTD)", value:fmtM(42100000), delta:"+14.4%", up:true, icon:TrendingUp,  color:"bg-[#0E6BB8]"  },
          { label:"Target Achievement",  value:"110.3%",        delta:"+10.3%", up:true, icon:Target,      color:"bg-emerald-500"},
          { label:"Total Bookings",      value:"2,288",         delta:"+11.8%", up:true, icon:Calendar,    color:"bg-amber-500"  },
          { label:"Avg Booking Value",   value:fmtC(18406),     delta:"+7.2%",  up:true, icon:DollarSign,  color:"bg-blue-500"   },
        ].map(p => <KpiCard key={p.label} {...p} />)}
      </div>
      <Section title="Revenue vs Target — Monthly">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MONTHLY} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0E6BB8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0E6BB8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
              tickFormatter={v => `৳${(v/1000000).toFixed(0)}M`} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0E6BB8" strokeWidth={2.5} fill="url(#revGrad2)" />
            <Line type="monotone" dataKey="target" name="Target" stroke="#E8471F" strokeWidth={2} strokeDasharray="5 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

// ─── FINANCIAL REPORTS ────────────────────────────────────────────────────────
function FinancialReport() {
  return (
    <div className="space-y-5">
      <FilterBar title="Financial Reports" subtitle="P&L, cash flow, and financial health overview" />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Net Revenue (YTD)",  value:fmtM(42100000), delta:"+14%", up:true, icon:TrendingUp, color:"bg-emerald-500" },
          { label:"Total Expenses",     value:fmtM(37000000), delta:"+8%",  up:false,icon:TrendingDown,color:"bg-red-500"    },
          { label:"Net Profit",         value:fmtM(5100000),  delta:"+24%", up:true, icon:DollarSign, color:"bg-[#0E6BB8]"  },
          { label:"Net Margin",         value:"12.1%",         delta:"+2%",  up:true, icon:Target,     color:"bg-amber-500"  },
        ].map(p => <KpiCard key={p.label} {...p} />)}
      </div>
      <Section title="Revenue vs Expense vs Net Profit">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MONTHLY} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
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
      </Section>
    </div>
  );
}

// ─── AGENT PERFORMANCE ────────────────────────────────────────────────────────
function AgentReport() {
  return (
    <div className="space-y-5">
      <FilterBar title="Agent Performance" subtitle="Bookings, revenue, commission, and CSAT by agent" />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Active Agents",       value:"24",            delta:"+4",   up:true, icon:Users,     color:"bg-[#0E6BB8]"  },
          { label:"Agent Revenue Share", value:"24.3%",         delta:"+2%",  up:true, icon:TrendingUp,color:"bg-emerald-500"},
          { label:"Total Commission",    value:fmtC(1265000),   delta:"+14%", up:true, icon:DollarSign,color:"bg-amber-500"  },
          { label:"Avg CSAT",            value:"91%",           delta:"+3%",  up:true, icon:Star,      color:"bg-blue-500"   },
        ].map(p => <KpiCard key={p.label} {...p} />)}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100"><p className="font-semibold text-slate-800 text-sm">Agent Leaderboard</p></div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["#","Agent","Bookings","Revenue","vs Target","Commission","CSAT","Growth"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((a, i) => {
              const pct = Math.round((a.revenue / a.target) * 100);
              return (
                <tr key={a.name} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-500")}>
                      {i + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{a.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">{a.bookings}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(a.revenue)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : pct >= 80 ? "bg-amber-400" : "bg-red-400")}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className={cn("text-xs font-semibold", pct >= 100 ? "text-emerald-600" : pct >= 80 ? "text-amber-600" : "text-red-600")}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-amber-600 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(a.commission)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm font-bold", a.csat >= 92 ? "text-emerald-600" : a.csat >= 85 ? "text-amber-600" : "text-red-500")}>
                      {a.csat}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("flex items-center gap-0.5 text-xs font-medium",
                      a.growth > 0 ? "text-emerald-600" : "text-red-500")}>
                      {a.growth > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {Math.abs(a.growth)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── STAFF KPI ────────────────────────────────────────────────────────────────
function StaffKpi() {
  const [selected, setSelected] = useState(0);
  const emp = STAFF[selected];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Staff KPI Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Individual performance tracking — July 2024</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Printer size={14} /> PDF Report
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Avg KPI Score",   value:"90%",   delta:"+4%", up:true, icon:Award,      color:"bg-[#0E6BB8]"  },
          { label:"Tasks Completed", value:"260/273",delta:"+8%", up:true, icon:CheckCircle,color:"bg-emerald-500"},
          { label:"Avg CSAT",        value:"91.8%",  delta:"+3%", up:true, icon:Star,       color:"bg-amber-500"  },
          { label:"Avg Hours",       value:"170h",   delta:"",    up:true, icon:Clock,      color:"bg-blue-500"   },
        ].map(p => <KpiCard key={p.label} {...p} />)}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Staff list */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Team Members</p>
          </div>
          <div>
            {STAFF.map((s, i) => (
              <button key={i} onClick={() => setSelected(i)}
                className={cn("w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 transition-colors",
                  selected === i ? "bg-[#0E6BB8]/5 border-l-2 border-[#0E6BB8]" : "")}>
                <div className="w-8 h-8 rounded-full bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
          <div className="bg-white rounded-xl border border-slate-200 p-5">
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
                { label:"Tasks Done", value:`${emp.done}/${emp.tasks}`, color:"text-[#0E6BB8]" },
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
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-800 mb-3">Performance Radar</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius={75}>
                <PolarGrid stroke="#F1F5F9" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#CBD5E1" }} tickCount={4} />
                <Radar name="This Period" dataKey="A" stroke="#0E6BB8" fill="#0E6BB8" fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Department Avg" dataKey="B" stroke="#E8471F" fill="#E8471F" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Custom Report Builder</h2>
          <p className="text-sm text-slate-500 mt-0.5">Drag-select fields · configure · preview · export</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(v => !v)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all",
              preview ? "bg-[#0E6BB8] text-white border-[#0E6BB8]" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
            <Eye size={14} /> {preview ? "Hide Preview" : "Preview"}
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Printer size={14} /> PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Field selector */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
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
                          ? "bg-[#0E6BB8] text-white border-[#0E6BB8]"
                          : "border-slate-200 text-slate-600 hover:border-[#0E6BB8] hover:text-[#0E6BB8]")}>
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
                    <div key={id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0E6BB8]/10 border border-[#0E6BB8]/20 rounded-lg text-xs text-[#0E6BB8]">
                      <GripVertical size={11} className="text-[#0E6BB8]/40 cursor-grab" />
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
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Report Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Report Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date Range</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  {["This Month","Last Month","Q2 2024","YTD 2024","Custom…"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Group By</label>
                <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  {["none","service","branch","agent","month","status"].map(o => <option key={o} value={o}>{o === "none" ? "No grouping" : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sort By</label>
                <div className="flex gap-2">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    {selected.map(id => <option key={id} value={id}>{ALL_FIELDS.find(f=>f.id===id)?.label}</option>)}
                  </select>
                  <select className="border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none">
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
                  <select key={f.label} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-1.5 focus:outline-none">
                    {f.opts.map(o => <option key={o}>{o === "All" ? `${f.label}: All` : o}</option>)}
                  </select>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">Run Report</button>
                <button className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Save</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">Saved Templates</p>
            {["Monthly Agent Summary","Hajj Season Overview","Overdue Payments"].map(t => (
              <button key={t} className="w-full text-left text-xs text-[#0E6BB8] hover:underline py-1 flex items-center gap-1.5">
                <ChevronRight size={10} /> {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview table */}
      {preview && (
        <div className="bg-white rounded-xl border border-[#0E6BB8]/20 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#0E6BB8]/5 border-b border-[#0E6BB8]/10">
            <p className="text-sm font-semibold text-[#0E6BB8]">Report Preview — {name}</p>
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
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
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

  const render = () => {
    switch (view) {
      case "realtime":  return <RealtimeView />;
      case "visa":      return <VisaReport />;
      case "tickets":   return <TicketReport />;
      case "hotels":    return <HotelReport />;
      case "sales":     return <SalesReport />;
      case "financial": return <FinancialReport />;
      case "agents":    return <AgentReport />;
      case "staff":     return <StaffKpi />;
      case "custom":    return <CustomBuilder />;
      default:          return null;
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reports & BI</h2>
        </div>
        <nav className="flex-1 py-2 no-scrollbar overflow-y-auto">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={cn("w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                view === item.id ? "bg-[#0E6BB8]/8 text-[#0E6BB8] font-medium" : "text-slate-600 hover:bg-slate-50")}>
              <item.icon size={15} className={view === item.id ? "text-[#0E6BB8]" : "text-slate-400"} />
              {item.label}
              {item.id === "realtime" && (
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 space-y-1.5">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
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
