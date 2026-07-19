import React, { useState } from "react";
import {
  LayoutDashboard, Users, Calendar, Wallet, BarChart3, FileText,
  MessageCircle, User, LogOut, ChevronRight, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Plus, Search, Filter, Download, Eye,
  Check, X, Clock, AlertCircle, CheckCircle, ArrowUpRight,
  ArrowDownLeft, Banknote, CreditCard, Star, Phone, Mail,
  MapPin, Globe, Shield, Edit2, Copy, Send, Paperclip,
  Bell, Settings, MoreHorizontal, Award, Target, Zap,
  UserPlus, Briefcase, PieChart, ArrowRight, Layers,
  RefreshCw, Info, Package, Building2, CircleDollarSign,
} from "lucide-react";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type AgentView =
  | "dashboard" | "leads" | "customers" | "bookings"
  | "commissions" | "wallet" | "team" | "analytics"
  | "support" | "profile";

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard"   as AgentView, icon: LayoutDashboard,    label: "Dashboard"          },
  { id: "leads"       as AgentView, icon: UserPlus,           label: "Lead Management", badge: 7 },
  { id: "customers"   as AgentView, icon: Users,              label: "Customers"          },
  { id: "bookings"    as AgentView, icon: Briefcase,          label: "Bookings"           },
  { id: "commissions" as AgentView, icon: CircleDollarSign,   label: "Commission Reports" },
  { id: "wallet"      as AgentView, icon: Wallet,             label: "Wallet & Payments"  },
  { id: "team"        as AgentView, icon: Building2,          label: "My Team"            },
  { id: "analytics"   as AgentView, icon: BarChart3,          label: "Analytics"          },
  { id: "support"     as AgentView, icon: MessageCircle,      label: "Support"            },
  { id: "profile"     as AgentView, icon: User,               label: "Profile Settings"   },
];

const BOTTOM_NAV = [
  { id: "dashboard"   as AgentView, icon: LayoutDashboard, label: "Home"       },
  { id: "leads"       as AgentView, icon: UserPlus,        label: "Leads"      },
  { id: "wallet"      as AgentView, icon: Wallet,          label: "Wallet"     },
  { id: "commissions" as AgentView, icon: CircleDollarSign,label: "Commission" },
  { id: "profile"     as AgentView, icon: User,            label: "Profile"    },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const LEADS = [
  { id:"LD-0481", name:"Rafiqul Islam",     phone:"+880 1711 XXXXXX", service:"Hajj Economy",    interest:"High",   date:"Jul 18", status:"new",        assigned:"Self" },
  { id:"LD-0480", name:"Nasrin Begum",      phone:"+880 1912 XXXXXX", service:"Umrah Standard",  interest:"Medium", date:"Jul 17", status:"contacted",   assigned:"Self" },
  { id:"LD-0479", name:"Abdul Karim",       phone:"+880 1811 XXXXXX", service:"Malaysia Tour",   interest:"High",   date:"Jul 16", status:"follow-up",   assigned:"Amir" },
  { id:"LD-0478", name:"Tahmina Khatun",    phone:"+880 1611 XXXXXX", service:"Saudi Visa",      interest:"Low",    date:"Jul 15", status:"negotiating", assigned:"Self" },
  { id:"LD-0477", name:"Mizanur Rahman",    phone:"+880 1711 XXXXXX", service:"Hajj Premium",   interest:"High",   date:"Jul 14", status:"converted",   assigned:"Self" },
  { id:"LD-0476", name:"Farzana Akter",     phone:"+880 1511 XXXXXX", service:"Dubai Tour",      interest:"Medium", date:"Jul 12", status:"lost",        assigned:"Self" },
];

const CUSTOMERS = [
  { id:"CU-0214", name:"Mizanur Rahman",  phone:"+880 1711 XXXXXX", bookings:2, totalVal:820000, lastBooking:"Jul 2024",  status:"vip"    },
  { id:"CU-0201", name:"Shahana Parvin",  phone:"+880 1811 XXXXXX", bookings:1, totalVal:215000, lastBooking:"May 2024",  status:"active" },
  { id:"CU-0189", name:"Kamal Hossain",   phone:"+880 1911 XXXXXX", bookings:3, totalVal:980000, lastBooking:"Mar 2024",  status:"vip"    },
  { id:"CU-0177", name:"Rokeyea Sultana", phone:"+880 1611 XXXXXX", bookings:1, totalVal:135000, lastBooking:"Jan 2024",  status:"active" },
];

const BOOKINGS = [
  { id:"BK-0892", customer:"Mizanur Rahman",  service:"Hajj Economy 2024",   amount:520000, commission:26000, status:"confirmed", date:"Jun 12" },
  { id:"BK-0881", customer:"Shahana Parvin",  service:"Malaysia Tour 5D/4N", amount:215000, commission:10750, status:"completed", date:"May 2"  },
  { id:"BK-0876", customer:"Kamal Hossain",   service:"Umrah Standard",      amount:185000, commission:9250,  status:"confirmed", date:"Apr 18" },
  { id:"BK-0865", customer:"Rokeyea Sultana", service:"Saudi Visa",          amount:8500,   commission:850,   status:"completed", date:"Mar 5"  },
];

const COMMISSION_ROWS = [
  { month:"Jul 2024", bookings:4, gross:1100000, rate:"5%",  earned:55000,  pending:26000, paid:29000  },
  { month:"Jun 2024", bookings:6, gross:1540000, rate:"5%",  earned:77000,  pending:0,     paid:77000  },
  { month:"May 2024", bookings:5, gross:940000,  rate:"4.5%",earned:42300,  pending:0,     paid:42300  },
  { month:"Apr 2024", bookings:3, gross:640000,  rate:"4.5%",earned:28800,  pending:0,     paid:28800  },
];

const WALLET_TXN = [
  { id:"WT-1041", type:"credit", desc:"Commission — BK-0881", amount:10750, date:"May 20",  method:"Auto-credit", ref:"SYS" },
  { id:"WT-1039", type:"credit", desc:"Commission — BK-0876", amount:9250,  date:"May 5",   method:"Auto-credit", ref:"SYS" },
  { id:"WT-1037", type:"debit",  desc:"Withdrawal to bKash",  amount:30000, date:"Apr 28",  method:"bKash",       ref:"BK-XXXXXD" },
  { id:"WT-1034", type:"credit", desc:"Commission — BK-0865", amount:850,   date:"Mar 10",  method:"Auto-credit", ref:"SYS" },
  { id:"WT-1030", type:"debit",  desc:"Withdrawal to Bank",   amount:50000, date:"Feb 25",  method:"Bank Transfer",ref:"TXN-XXXXXX" },
];

const TEAM = [
  { id:"TM-01", name:"Amir Hossain",    role:"Sub-agent", leads:12, bookings:8,  commission:38000, status:"active"   },
  { id:"TM-02", name:"Sumaiya Islam",   role:"Sub-agent", leads:7,  bookings:4,  commission:18500, status:"active"   },
  { id:"TM-03", name:"Foysal Ahmed",    role:"Sub-agent", leads:3,  bookings:1,  commission:4200,  status:"inactive" },
];

const SUPPORT_TICKETS = [
  { id:"SUP-092", subject:"Commission not credited for BK-0892",   status:"open",     date:"Jul 15", msgs:2  },
  { id:"SUP-078", subject:"Client visa application status query",   status:"resolved", date:"Jun 30", msgs:4  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtBDT = (n: number) =>
  n >= 100000
    ? "৳ " + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + "L"
    : "৳ " + n.toLocaleString("en-BD");
const fmtFull = (n: number) => "৳ " + n.toLocaleString("en-BD");

const LEAD_STATUS: Record<string,{ label:string; cls:string }> = {
  new:         { label:"New",         cls:"bg-blue-50 text-blue-600 border-blue-200"      },
  contacted:   { label:"Contacted",   cls:"bg-purple-50 text-purple-600 border-purple-200"},
  "follow-up": { label:"Follow Up",   cls:"bg-amber-50 text-amber-600 border-amber-200"   },
  negotiating: { label:"Negotiating", cls:"bg-orange-50 text-orange-600 border-orange-200"},
  converted:   { label:"Converted",   cls:"bg-emerald-50 text-emerald-700 border-emerald-200" },
  lost:        { label:"Lost",        cls:"bg-red-50 text-red-500 border-red-200"         },
};

const BOOKING_STATUS: Record<string,{ label:string; cls:string }> = {
  confirmed: { label:"Confirmed", cls:"bg-[#14356B]/10 text-[#14356B] border-[#14356B]/20" },
  completed: { label:"Completed", cls:"bg-emerald-50 text-emerald-700 border-emerald-200"  },
  pending:   { label:"Pending",   cls:"bg-amber-50 text-amber-600 border-amber-200"        },
  cancelled: { label:"Cancelled", cls:"bg-red-50 text-red-500 border-red-200"              },
};

const INTEREST_CLS: Record<string,string> = {
  High:   "text-emerald-600 bg-emerald-50",
  Medium: "text-amber-600 bg-amber-50",
  Low:    "text-red-500 bg-red-50",
};

function Chip({ label, cls }: { label:string; cls:string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", cls)}>
      {label}
    </span>
  );
}

function StatCard({
  label, value, sub, icon: Icon, iconBg, delta, deltaUp,
}: {
  label:string; value:string; sub?:string; icon:React.ElementType;
  iconBg:string; delta?:string; deltaUp?:boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon size={18} className="text-white"/>
        </div>
        {delta && (
          <div className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
            deltaUp ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50")}>
            {deltaUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {delta}
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{value}</p>
      <p className="text-sm font-semibold text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function AgentDashboard({ onGo }: { onGo:(v:AgentView)=>void }) {
  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(135deg,#14356B 0%,#1a4a8a 50%,#C9A227 100%)" }}>
        <div className="px-6 py-6 text-white relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs mb-1">Agent Portal</p>
              <h2 className="text-2xl font-bold">Salam, Rashidul!</h2>
              <p className="text-white/70 text-sm mt-1">Agent ID: <span className="font-mono text-white">AG-0047</span> · Gold Tier</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#C9A227] text-white px-3 py-1.5 rounded-xl text-xs font-bold">
              <Star size={12} className="fill-white"/> Gold Agent
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label:"Wallet Balance", val:"৳ 46,850", hi:true },
              { label:"This Month",     val:"৳ 55,000"          },
              { label:"Total Earned",   val:"৳ 2.03L"           },
            ].map(s=>(
              <div key={s.label} className={cn("rounded-xl p-3", s.hi?"bg-[#C9A227]/20 border border-[#C9A227]/40":"bg-white/10")}>
                <p className="text-xl font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
                <p className="text-xs text-white/70 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5"/>
        <div className="absolute -bottom-6 -right-4 w-28 h-28 rounded-full bg-white/5"/>
      </div>

      {/* Quick action strip */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { icon:UserPlus,         label:"Add Lead",   color:"bg-blue-500",    v:"leads"       as AgentView },
          { icon:ArrowUpRight,     label:"Withdraw",   color:"bg-emerald-500", v:"wallet"      as AgentView },
          { icon:Briefcase,        label:"Bookings",   color:"bg-[#14356B]",   v:"bookings"    as AgentView },
          { icon:BarChart3,        label:"Reports",    color:"bg-purple-500",  v:"analytics"   as AgentView },
        ].map(q=>(
          <button key={q.label} onClick={()=>onGo(q.v)}
            className="flex flex-col items-center gap-1.5 p-3 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-all">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white", q.color)}>
              <q.icon size={16}/>
            </div>
            <span className="text-xs font-semibold text-slate-600">{q.label}</span>
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="New Leads"       value="7"     sub="This week"           icon={UserPlus}         iconBg="bg-blue-500"     delta="+3" deltaUp />
        <StatCard label="Conversions"     value="4"     sub="This month"          icon={Target}           iconBg="bg-purple-500"   delta="+1" deltaUp />
        <StatCard label="Active Bookings" value="12"    sub="In progress"         icon={Briefcase}        iconBg="bg-[#14356B]"    delta="+2" deltaUp />
        <StatCard label="Team Members"    value="3"     sub="Sub-agents"          icon={Building2}        iconBg="bg-amber-500"             />
      </div>

      {/* Commission & wallet highlight */}
      <div className="bg-gradient-to-br from-[#0E7C66] to-[#0a5c4c] rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-white/80"/>
            <p className="font-bold">Commission Wallet</p>
          </div>
          <button onClick={()=>onGo("wallet")} className="text-xs text-white/70 hover:text-white flex items-center gap-1">
            Details <ChevronRight size={12}/>
          </button>
        </div>
        <p className="text-3xl font-black mb-1" style={{ fontFamily:"'JetBrains Mono',monospace" }}>৳ 46,850</p>
        <p className="text-white/60 text-xs mb-4">Available balance · Last credited Jul 12</p>
        <div className="flex gap-3">
          <button onClick={()=>onGo("wallet")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-[#0E7C66] text-sm font-bold rounded-xl hover:bg-white/90 transition-colors">
            <ArrowUpRight size={15}/> Withdraw
          </button>
          <button onClick={()=>onGo("commissions")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/15 text-white text-sm font-semibold rounded-xl hover:bg-white/25 transition-colors">
            <FileText size={15}/> Report
          </button>
        </div>
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-slate-800">Recent Leads</p>
          <button onClick={()=>onGo("leads")} className="text-xs text-[#14356B] hover:underline font-medium">View all</button>
        </div>
        <div className="space-y-2.5">
          {LEADS.slice(0,4).map(l=>(
            <div key={l.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#14356B]/10 flex items-center justify-center text-[#14356B] text-xs font-bold flex-shrink-0">
                {l.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p>
                <p className="text-xs text-slate-400 truncate">{l.service}</p>
              </div>
              <Chip label={LEAD_STATUS[l.status].label} cls={LEAD_STATUS[l.status].cls}/>
            </div>
          ))}
        </div>
      </div>

      {/* Performance ring */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="font-bold text-slate-800 mb-4">Monthly Target</p>
        <div className="flex items-center gap-5">
          {/* Simple progress bars */}
          <div className="flex-1 space-y-3">
            {[
              { label:"Bookings",  val:12, target:15, color:"#14356B" },
              { label:"Revenue",   val:73, target:100, color:"#0E7C66" },
              { label:"Leads",     val:7,  target:10,  color:"#C9A227" },
            ].map(m=>(
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">{m.label}</span>
                  <span className="font-semibold text-slate-700">{m.val}/{m.target}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width:`${(m.val/m.target)*100}%`, background:m.color }}/>
                </div>
              </div>
            ))}
          </div>
          <div className="w-20 text-center">
            <div className="w-20 h-20 rounded-full border-4 border-[#14356B]/20 flex items-center justify-center relative mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#14356B]"
                style={{ clipPath:"polygon(50% 0%, 50% 0%, 50% 50%)", transform:"rotate(-90deg)" }}/>
              <span className="text-lg font-black text-[#14356B]">73%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Overall</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LEAD MANAGEMENT ─────────────────────────────────────────────────────────
function LeadsView() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [addModal, setAddModal] = useState(false);
  const filtered = LEADS.filter(l =>
    (filter==="all" || l.status===filter) &&
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lead Management</h2>
          <p className="text-sm text-slate-400 mt-0.5">Track and convert your prospects</p>
        </div>
        <button onClick={()=>setAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#14356B] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2a56]">
          <Plus size={14}/> Add Lead
        </button>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Object.entries(LEAD_STATUS).map(([k,v])=>(
          <button key={k} onClick={()=>setFilter(k===filter?"all":k)}
            className={cn("p-2.5 rounded-xl border text-center transition-all",
              filter===k?"border-[#14356B] bg-[#14356B]/5":"border-slate-200 bg-white hover:border-[#14356B]/30")}>
            <p className="text-lg font-black text-slate-800">{LEADS.filter(l=>l.status===k).length}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{v.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search leads…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14356B]/20"/>
      </div>

      {/* Leads list */}
      <div className="space-y-3">
        {filtered.map(l=>(
          <div key={l.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14356B]/10 flex items-center justify-center text-[#14356B] text-sm font-bold flex-shrink-0">
                {l.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-bold text-slate-800">{l.name}</p>
                  <Chip label={LEAD_STATUS[l.status].label} cls={LEAD_STATUS[l.status].cls}/>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{l.phone}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Package size={11}/>{l.service}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",INTEREST_CLS[l.interest])}>{l.interest} Interest</span>
                  <span className="text-xs text-slate-400">{l.date}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                <Phone size={12}/> Call
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                <Mail size={12}/> Email
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-[#14356B] text-white rounded-lg hover:bg-[#0f2a56]">
                <Edit2 size={12}/> Update
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Lead modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Add New Lead</h3>
              <button onClick={()=>setAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
            </div>
            {[["Full Name","text"],["Phone Number","tel"],["Email","email"]].map(([l,t])=>(
              <div key={l}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{l}</label>
                <input type={t} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14356B]/20"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Service Interest</label>
              <select className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none">
                {["Hajj Economy","Hajj Premium","Umrah Standard","Malaysia Tour","Dubai Tour","Saudi Visa","Air Ticket"].map(s=>(
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
              <textarea rows={2} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"/>
            </div>
            <button onClick={()=>setAddModal(false)}
              className="w-full py-3 bg-[#14356B] text-white font-semibold text-sm rounded-xl hover:bg-[#0f2a56]">
              Save Lead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
function CustomersView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Customers</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input placeholder="Search…" className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none w-36"/>
        </div>
      </div>
      <div className="space-y-3">
        {CUSTOMERS.map(c=>(
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
                c.status==="vip"?"bg-[#C9A227]/20 text-[#C9A227]":"bg-[#14356B]/10 text-[#14356B]")}>
                {c.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">{c.name}</p>
                  {c.status==="vip" && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-[#C9A227]/15 text-[#C9A227] rounded-full font-bold">
                      <Star size={10} className="fill-[#C9A227]"/> VIP
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{c.phone} · {c.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[["Bookings",c.bookings],["Total Value",fmtBDT(c.totalVal)],["Last Booking",c.lastBooking]].map(([k,v])=>(
                <div key={k as string} className="bg-slate-50 rounded-xl p-2.5 text-center">
                  <p className="text-sm font-bold text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{v}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{k}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                <Eye size={12}/> View History
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-[#14356B] text-white rounded-lg hover:bg-[#0f2a56]">
                <Briefcase size={12}/> New Booking
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
function AgentBookings() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">My Bookings</h2>
      {/* Commission summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total Bookings",    val:"4",       color:"text-[#14356B]" },
          { label:"Commission Earned", val:"৳46,850", color:"text-emerald-600" },
          { label:"Commission Pending",val:"৳26,000", color:"text-amber-600"  },
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-3 text-center">
            <p className={cn("text-base font-black",s.color)} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      {BOOKINGS.map(b=>(
        <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-mono mb-0.5">{b.id}</p>
                <p className="font-bold text-slate-800">{b.service}</p>
                <p className="text-xs text-slate-500 mt-0.5">Customer: {b.customer} · {b.date}</p>
              </div>
              <Chip label={BOOKING_STATUS[b.status].label} cls={BOOKING_STATUS[b.status].cls}/>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Booking Value</p>
                <p className="font-bold text-slate-800 text-base" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtFull(b.amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Your Commission</p>
                <p className="font-black text-emerald-600 text-xl" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtFull(b.commission)}</p>
                <p className="text-xs text-emerald-500">5% rate</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── COMMISSION REPORTS ───────────────────────────────────────────────────────
function CommissionsView() {
  const [open, setOpen] = useState<number|null>(0);
  const totalEarned = COMMISSION_ROWS.reduce((s,r)=>s+r.earned,0);
  const totalPending = COMMISSION_ROWS.reduce((s,r)=>s+r.pending,0);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Commission Reports</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label:"Total Earned",    val:totalEarned,  color:"bg-emerald-500", sub:"All time"          },
          { label:"Pending Payout",  val:totalPending, color:"bg-amber-500",   sub:"Awaiting transfer" },
        ].map(s=>(
          <div key={s.label} className={cn("rounded-2xl p-5 text-white",s.color)}>
            <p className="text-2xl font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(s.val)}</p>
            <p className="text-sm font-semibold mt-0.5 text-white/90">{s.label}</p>
            <p className="text-xs text-white/70">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Rate tier info */}
      <div className="bg-gradient-to-r from-[#14356B]/5 to-[#C9A227]/5 border border-[#14356B]/15 rounded-2xl p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <Award size={18} className="text-[#C9A227]"/>
          <p className="font-bold text-slate-800">Your Commission Tier — Gold</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { tier:"Silver", rate:"3%",   range:"< 10 bookings/mo", active:false },
            { tier:"Gold",   rate:"5%",   range:"10–19/mo",          active:true  },
            { tier:"Platinum",rate:"7%",  range:"20+ bookings/mo",   active:false },
          ].map(t=>(
            <div key={t.tier} className={cn("rounded-xl p-2.5 text-center border",
              t.active?"bg-[#C9A227] border-[#C9A227] text-white":"bg-white border-slate-200 text-slate-600")}>
              <p className="text-lg font-black">{t.rate}</p>
              <p className="text-xs font-bold mt-0.5">{t.tier}</p>
              <p className={cn("text-xs mt-0.5",t.active?"text-white/80":"text-slate-400")}>{t.range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-700 text-sm">Monthly Breakdown</p>
        {COMMISSION_ROWS.map((r,i)=>(
          <div key={r.month} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button className="w-full flex items-center gap-3 p-4" onClick={()=>setOpen(open===i?null:i)}>
              <div className="flex-1 text-left">
                <p className="font-bold text-slate-800">{r.month}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.bookings} bookings · rate {r.rate}</p>
              </div>
              <div className="text-right mr-3">
                <p className="font-black text-emerald-600" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtFull(r.earned)}</p>
                <p className="text-xs text-slate-400">earned</p>
              </div>
              {open===i?<ChevronUp size={16} className="text-slate-400"/>:<ChevronDown size={16} className="text-slate-400"/>}
            </button>
            {open===i && (
              <div className="px-4 pb-4 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[["Gross Revenue",fmtFull(r.gross)],["Commission Earned",fmtFull(r.earned)],["Pending",fmtFull(r.pending)]].map(([k,v])=>(
                    <div key={k} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-sm font-bold text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{v}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle size={12}/> {fmtFull(r.paid)} paid
                  </span>
                  <button className="flex items-center gap-1.5 text-xs text-[#14356B] font-semibold hover:underline">
                    <Download size={12}/> Export
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WALLET & PAYMENTS ────────────────────────────────────────────────────────
function WalletView() {
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [step, setStep] = useState(0);
  const balance = 46850;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Wallet & Payments</h2>

      {/* Wallet card */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(135deg,#0E7C66 0%,#0a5c4c 100%)" }}>
        <div className="p-6 text-white relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} className="text-white/80"/>
            <p className="text-sm text-white/80 font-medium">Agent Wallet Balance</p>
          </div>
          <p className="text-4xl font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>
            {fmtFull(balance)}
          </p>
          <p className="text-white/60 text-xs mt-1">Agent ID: AG-0047 · Last updated: Jul 18, 2024</p>
          <div className="flex gap-3 mt-5">
            <button onClick={()=>setWithdrawModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-[#0E7C66] font-bold text-sm rounded-xl hover:bg-white/90">
              <ArrowUpRight size={16}/> Withdraw
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/15 text-white font-semibold text-sm rounded-xl hover:bg-white/25">
              <Download size={16}/> Statement
            </button>
          </div>
        </div>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5"/>
        <div className="absolute -bottom-6 right-10 w-28 h-28 rounded-full bg-white/5"/>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Credited (Jul)",  val:"৳55,000", icon:ArrowDownLeft, cls:"text-emerald-500 bg-emerald-50"   },
          { label:"Withdrawn",       val:"৳80,000", icon:ArrowUpRight,  cls:"text-red-500 bg-red-50"           },
          { label:"Pending",         val:"৳26,000", icon:Clock,         cls:"text-amber-500 bg-amber-50"        },
        ].map(s=>(
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5",s.cls)}>
              <s.icon size={14}/>
            </div>
            <p className="text-sm font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <div>
        <p className="font-semibold text-slate-700 text-sm mb-3">Transaction History</p>
        <div className="space-y-2.5">
          {WALLET_TXN.map(t=>(
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                t.type==="credit"?"bg-emerald-50":"bg-red-50")}>
                {t.type==="credit"
                  ? <ArrowDownLeft size={16} className="text-emerald-600"/>
                  : <ArrowUpRight  size={16} className="text-red-500"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{t.desc}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.method} · {t.date}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn("font-black text-base",t.type==="credit"?"text-emerald-600":"text-red-500")}
                  style={{ fontFamily:"'JetBrains Mono',monospace" }}>
                  {t.type==="credit"?"+":"-"}{fmtFull(t.amount)}
                </p>
                <p className="text-xs text-slate-400 font-mono">{t.id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw modal */}
      {withdrawModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Withdraw Funds</h3>
              <button onClick={()=>{setWithdrawModal(false);setStep(0);}} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
            </div>
            {step===0 ? (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">Available Balance</p>
                  <p className="text-3xl font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtFull(balance)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Amount to Withdraw</label>
                  <input type="number" placeholder="Enter amount" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/25 font-mono text-lg"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Withdrawal Method</label>
                  <div className="space-y-2">
                    {[["bKash","#E2136E","Mobile banking"],["Nagad","#F7941D","Mobile banking"],["Bank Transfer","#14356B","1–3 business days"]].map(([name,color,sub])=>(
                      <label key={name} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-[#0E7C66] transition-colors">
                        <input type="radio" name="method" className="accent-[#0E7C66]"/>
                        <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ background:color }}/>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{name}</p>
                          <p className="text-xs text-slate-400">{sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={()=>setStep(1)} className="w-full py-3.5 bg-[#0E7C66] text-white font-bold rounded-2xl hover:bg-[#0a5c4c]">
                  Continue
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <CheckCircle size={36} className="text-emerald-500 mx-auto mb-2"/>
                  <p className="font-bold text-slate-800">Confirm Withdrawal</p>
                  <p className="text-3xl font-black text-emerald-600 mt-1" style={{ fontFamily:"'JetBrains Mono',monospace" }}>৳ 20,000</p>
                  <p className="text-xs text-slate-400 mt-1">via bKash · +880 1XXXXXXXXX</p>
                </div>
                <p className="text-xs text-slate-400 text-center">Funds will be credited within 1–2 hours</p>
                <div className="flex gap-3">
                  <button onClick={()=>setStep(0)} className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-600 text-sm font-medium">Back</button>
                  <button onClick={()=>{setWithdrawModal(false);setStep(0);}}
                    className="flex-1 py-3 bg-[#0E7C66] text-white font-bold rounded-2xl text-sm hover:bg-[#0a5c4c]">
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MY TEAM ─────────────────────────────────────────────────────────────────
function TeamView() {
  const teamTotalComm = TEAM.reduce((s,t)=>s+t.commission,0);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">My Team</h2>
        <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#14356B] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2a56]">
          <Plus size={14}/> Invite Sub-agent
        </button>
      </div>

      {/* Team summary */}
      <div className="bg-gradient-to-r from-[#14356B] to-[#1a4a8a] rounded-2xl p-5 text-white">
        <p className="text-white/70 text-xs mb-3">Team Performance — July 2024</p>
        <div className="grid grid-cols-3 gap-3">
          {[["Sub-agents","3"],["Team Bookings","13"],["Team Commission",fmtBDT(teamTotalComm)]].map(([l,v])=>(
            <div key={l} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{v}</p>
              <p className="text-xs text-white/70 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team leaderboard */}
      <div className="space-y-3">
        {TEAM.map((m,i)=>(
          <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-shrink-0">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold",
                  i===0?"bg-[#C9A227]/20 text-[#C9A227]":"bg-[#14356B]/10 text-[#14356B]")}>
                  {m.name.split(" ").map(n=>n[0]).join("")}
                </div>
                {i===0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#C9A227] rounded-full flex items-center justify-center">
                    <Star size={8} className="text-white fill-white"/>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">{m.name}</p>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                    m.status==="active"?"bg-emerald-50 text-emerald-600":"bg-slate-100 text-slate-400")}>
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{m.role} · {m.id}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-600" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtFull(m.commission)}</p>
                <p className="text-xs text-slate-400">commission</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[["Leads",m.leads],["Bookings",m.bookings]].map(([k,v])=>(
                <div key={k as string} className="bg-slate-50 rounded-xl p-2.5 text-center">
                  <p className="text-sm font-bold text-slate-800">{v}</p>
                  <p className="text-xs text-slate-400">{k}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Override commission info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Info size={15} className="text-amber-500 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-sm font-semibold text-amber-800">Override Commission</p>
          <p className="text-xs text-amber-600 mt-0.5">You earn 1% override on all bookings made by your sub-agents. This is credited automatically to your wallet.</p>
        </div>
      </div>
    </div>
  );
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
function AnalyticsView() {
  const months = ["Feb","Mar","Apr","May","Jun","Jul"];
  const booking = [4,7,5,6,8,12];
  const commiss  = [18000,31000,22000,27000,36000,55000];
  const maxB = Math.max(...booking);
  const maxC = Math.max(...commiss);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Analytics</h2>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Conversion Rate" value="58%"  sub="Leads to bookings" icon={Target}     iconBg="bg-purple-500" delta="+8%" deltaUp/>
        <StatCard label="Avg. Ticket"     value="৳2.4L" sub="Per booking"       icon={Briefcase}  iconBg="bg-[#14356B]"  delta="+12%" deltaUp/>
        <StatCard label="Return Clients"  value="62%"  sub="Repeat bookings"   icon={RefreshCw}  iconBg="bg-[#0E7C66]"  delta="+5%" deltaUp/>
        <StatCard label="Response Time"   value="1.4h" sub="Avg. lead response" icon={Zap}        iconBg="bg-amber-500"  delta="-18%" deltaUp/>
      </div>

      {/* Booking trend chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-slate-800">Bookings Trend</p>
          <span className="text-xs text-slate-400">Last 6 months</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {booking.map((v,i)=>(
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg transition-all"
                style={{ height:`${(v/maxB)*100}%`, background: i===months.length-1?"#14356B":"#14356B33" }}/>
              <p className="text-xs text-slate-400">{months[i]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Commission trend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-slate-800">Commission Trend</p>
          <span className="text-xs text-slate-400">৳ (BDT)</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {commiss.map((v,i)=>(
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg transition-all"
                style={{ height:`${(v/maxC)*100}%`, background: i===months.length-1?"#0E7C66":"#0E7C6633" }}/>
              <p className="text-xs text-slate-400">{months[i]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Service breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="font-bold text-slate-800 mb-4">Bookings by Service</p>
        <div className="space-y-3">
          {[
            { label:"Hajj Packages",  pct:42, color:"#14356B" },
            { label:"Umrah",          pct:28, color:"#0E7C66" },
            { label:"Tour Packages",  pct:18, color:"#C9A227" },
            { label:"Visa Services",  pct:12, color:"#7C3AED" },
          ].map(s=>(
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{s.label}</span>
                <span className="font-bold text-slate-800">{s.pct}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width:`${s.pct}%`, background:s.color }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SUPPORT ─────────────────────────────────────────────────────────────────
function AgentSupport() {
  const [active, setActive] = useState<string|null>(null);
  const [msg, setMsg] = useState("");
  const MSGS = [
    { from:"Me",      text:"Commission for BK-0892 hasn't been credited yet. Could you check?", time:"Jul 15 10:00", mine:true  },
    { from:"Support", text:"Thank you for reaching out. We're looking into it now.",             time:"Jul 15 10:20", mine:false },
  ];

  if(active) return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={()=>setActive(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
          <ChevronRight size={16} className="rotate-180"/>
        </button>
        <div>
          <p className="font-bold text-slate-800">{SUPPORT_TICKETS.find(t=>t.id===active)?.subject}</p>
          <p className="text-xs text-slate-400">{active} · Open</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {MSGS.map((m,i)=>(
          <div key={i} className={cn("flex",m.mine?"justify-end":"justify-start")}>
            {!m.mine && <div className="w-8 h-8 rounded-full bg-[#14356B] flex items-center justify-center text-white text-xs font-bold mr-2 self-end flex-shrink-0">BD</div>}
            <div className={cn("max-w-xs px-4 py-2.5 rounded-2xl text-sm",m.mine?"bg-[#14356B] text-white rounded-br-sm":"bg-slate-100 text-slate-700 rounded-bl-sm")}>
              {m.text}
              <p className={cn("text-xs mt-1",m.mine?"text-white/60":"text-slate-400")}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400"><Paperclip size={16}/></button>
        <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Type your message…"
          className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm focus:outline-none"/>
        <button className="p-2.5 bg-[#14356B] text-white rounded-xl"><Send size={16}/></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Support</h2>
        <button className="flex items-center gap-1.5 px-3.5 py-2 bg-[#14356B] text-white text-sm font-semibold rounded-xl">
          <Plus size={14}/> New Ticket
        </button>
      </div>
      <div className="bg-[#14356B]/5 border border-[#14356B]/15 rounded-2xl p-4 flex items-center gap-3">
        <Phone size={16} className="text-[#14356B]"/>
        <div>
          <p className="text-sm font-semibold text-slate-800">Agent Hotline</p>
          <p className="text-xs text-slate-500">Priority support: <span className="text-[#14356B] font-bold">+880 31 123 4568</span></p>
        </div>
      </div>
      {SUPPORT_TICKETS.map(t=>(
        <div key={t.id} onClick={()=>setActive(t.id)}
          className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-3">
              <p className="text-xs text-slate-400 font-mono mb-1">{t.id}</p>
              <p className="font-semibold text-slate-800">{t.subject}</p>
            </div>
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border flex-shrink-0",
              t.status==="open"?"bg-blue-50 text-blue-600 border-blue-200":"bg-emerald-50 text-emerald-600 border-emerald-200")}>
              {t.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1"><MessageCircle size={11}/>{t.msgs} messages</span>
            <span>{t.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function AgentProfile() {
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>

      {/* Profile card */}
      <div className="bg-gradient-to-br from-[#14356B] to-[#0E4D7A] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 border-2 border-[#C9A227] flex items-center justify-center text-2xl font-black">
            RI
          </div>
          <div>
            <p className="text-xl font-bold">Rashidul Islam</p>
            <p className="text-white/70 text-sm mt-0.5">Agent ID: AG-0047</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#C9A227] rounded-full">
                <Star size={10} className="fill-white text-white"/>
                <span className="text-xs font-bold text-white">Gold Tier</span>
              </div>
              <span className="text-xs text-white/60">Since 2020</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[["Total Bookings","47"],["Customers","28"],["Commission","৳2.03L"]].map(([l,v])=>(
            <div key={l} className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{v}</p>
              <p className="text-xs text-white/60 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-700 text-sm">Personal Information</p>
          <button onClick={()=>setEditing(v=>!v)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
            <Edit2 size={15}/>
          </button>
        </div>
        {[
          { label:"Full Name",    val:"Rashidul Islam"       },
          { label:"Phone",        val:"+880 1712 XXXXXX"     },
          { label:"Email",        val:"rashid@agent.com"     },
          { label:"NID Number",   val:"19851234567890"        },
          { label:"Trade License",val:"CTGCC-2020-XXXXX"     },
          { label:"Address",      val:"Agrabad, Chattogram"   },
        ].map(f=>(
          <div key={f.label}>
            <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
            <input defaultValue={f.val} disabled={!editing}
              className={cn("w-full px-3 py-2.5 text-sm rounded-xl border transition-colors",
                editing?"border-[#14356B]/40 bg-white focus:outline-none":"border-transparent bg-slate-50 text-slate-700")}/>
          </div>
        ))}
        {editing && (
          <button onClick={()=>setEditing(false)}
            className="w-full py-3 bg-[#14356B] text-white font-semibold text-sm rounded-xl hover:bg-[#0f2a56] flex items-center justify-center gap-2">
            <Check size={15}/> Save Changes
          </button>
        )}
      </div>

      {/* Bank details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-semibold text-slate-700 text-sm">Bank & Payment Details</p>
        {[
          { label:"Bank Name",    val:"Dutch-Bangla Bank Ltd."  },
          { label:"Account No.",  val:"XXXXXXXXXXXXXX"          },
          { label:"Branch",       val:"Agrabad, Chattogram"     },
          { label:"bKash No.",    val:"+880 1712 XXXXXX"        },
          { label:"Nagad No.",    val:"+880 1712 XXXXXX"        },
        ].map(f=>(
          <div key={f.label}>
            <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-700 flex-1">{f.val}</span>
              <button className="text-slate-400 hover:text-[#14356B]"><Copy size={13}/></button>
            </div>
          </div>
        ))}
        <button className="w-full py-2.5 border border-[#14356B] text-[#14356B] text-sm font-semibold rounded-xl hover:bg-[#14356B]/5">
          Update Payment Details
        </button>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-semibold text-slate-700 text-sm">Security</p>
        {["Change Password","Two-Factor Authentication","Active Sessions"].map(item=>(
          <button key={item} className="flex items-center justify-between w-full p-3 bg-slate-50 rounded-xl hover:bg-slate-100">
            <span className="text-sm font-medium text-slate-700">{item}</span>
            <ChevronRight size={15} className="text-slate-400"/>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50">
        <LogOut size={16}/> Sign Out
      </button>
    </div>
  );
}

// ─── PORTAL SHELL ─────────────────────────────────────────────────────────────
export function AgentPortal() {
  const [view, setView] = useState<AgentView>("dashboard");

  const go = (v: AgentView) => setView(v);

  const renderView = () => {
    switch(view) {
      case "dashboard":   return <AgentDashboard onGo={go}/>;
      case "leads":       return <LeadsView/>;
      case "customers":   return <CustomersView/>;
      case "bookings":    return <AgentBookings/>;
      case "commissions": return <CommissionsView/>;
      case "wallet":      return <WalletView/>;
      case "team":        return <TeamView/>;
      case "analytics":   return <AnalyticsView/>;
      case "support":     return <AgentSupport/>;
      case "profile":     return <AgentProfile/>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#14356B] flex items-center justify-center text-white text-xs font-black">BDH</div>
              <div>
                <p className="text-sm font-bold text-slate-800">BDH Travels</p>
                <p className="text-xs text-[#C9A227] font-semibold">Agent Portal</p>
              </div>
            </div>
          </div>
          {/* Agent card */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#14356B]/5 to-[#C9A227]/5 rounded-2xl border border-[#14356B]/10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14356B] to-[#C9A227] flex items-center justify-center text-white text-xs font-black">RI</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">Rashidul Islam</p>
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-[#C9A227] fill-[#C9A227]"/>
                  <p className="text-xs text-[#C9A227] font-semibold">Gold Agent</p>
                </div>
              </div>
            </div>
            {/* Wallet preview */}
            <div onClick={()=>go("wallet")} className="flex items-center justify-between mt-3 px-3 py-2.5 bg-[#0E7C66]/10 rounded-xl border border-[#0E7C66]/20 cursor-pointer hover:bg-[#0E7C66]/15 transition-colors">
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-[#0E7C66]"/>
                <span className="text-xs font-semibold text-slate-600">Wallet</span>
              </div>
              <span className="text-xs font-black text-[#0E7C66]" style={{ fontFamily:"'JetBrains Mono',monospace" }}>৳46,850</span>
            </div>
          </div>
          {/* Nav */}
          <nav className="flex-1 py-3 px-3 overflow-y-auto no-scrollbar space-y-0.5">
            {NAV.map(item=>(
              <button key={item.id} onClick={()=>go(item.id)}
                className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all",
                  view===item.id
                    ? "bg-[#14356B] text-white shadow-sm shadow-[#14356B]/25"
                    : "text-slate-600 hover:bg-slate-100")}>
                <item.icon size={17} className={view===item.id?"text-white":"text-slate-400"}/>
                <span className="font-medium flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>
          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <button className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-red-500 w-full px-2 py-1.5 rounded-xl hover:bg-red-50 transition-colors">
              <LogOut size={15}/> Sign Out
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-8">
            {renderView()}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#14356B] flex items-center justify-center text-white text-xs font-black">BDH</div>
            <div>
              <span className="font-bold text-slate-800 text-sm">Agent Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>go("wallet")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0E7C66]/10 border border-[#0E7C66]/20 rounded-xl text-xs font-bold text-[#0E7C66]">
              <Wallet size={12}/> ৳46,850
            </button>
            <button className="relative p-2 hover:bg-slate-100 rounded-xl">
              <Bell size={18} className="text-slate-500"/>
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold">3</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          {renderView()}
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-30">
          <div className="flex items-center justify-around">
            {BOTTOM_NAV.map(item=>{
              const active = view===item.id;
              return (
                <button key={item.id} onClick={()=>go(item.id)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all">
                  <item.icon size={22} className={active?"text-[#14356B]":"text-slate-400"}/>
                  <span className={cn("text-xs font-medium",active?"text-[#14356B]":"text-slate-400")}>{item.label}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-[#14356B]"/>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentPortal;
