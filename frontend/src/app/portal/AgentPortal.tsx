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
import { Loader2 } from "lucide-react";
import {
  useAgentMe, useAgentDashboard, useAgentWallet, useAgentTeam, useAgentLeads, useAgentCommissions,
  useAgentBookings, useCreateLead,
} from "../hooks/portals";
import { SampleBadge } from "./SampleBadge";

const fmtBDT2 = (n: number) => "৳ " + Number(n || 0).toLocaleString("en-BD");
const iso2date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");
function PLoad({ q, children }: { q: { isLoading: boolean; isError: boolean; error?: unknown }; children: React.ReactNode }) {
  if (q.isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>;
  if (q.isError) return <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 text-center">{(q.error as Error)?.message || "Failed to load."}</div>;
  return <>{children}</>;
}

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
const CUSTOMERS = [
  { id:"CU-0214", name:"Mizanur Rahman",  phone:"+880 1711 XXXXXX", bookings:2, totalVal:820000, lastBooking:"Jul 2024",  status:"vip"    },
  { id:"CU-0201", name:"Shahana Parvin",  phone:"+880 1811 XXXXXX", bookings:1, totalVal:215000, lastBooking:"May 2024",  status:"active" },
  { id:"CU-0189", name:"Kamal Hossain",   phone:"+880 1911 XXXXXX", bookings:3, totalVal:980000, lastBooking:"Mar 2024",  status:"vip"    },
  { id:"CU-0177", name:"Rokeyea Sultana", phone:"+880 1611 XXXXXX", bookings:1, totalVal:135000, lastBooking:"Jan 2024",  status:"active" },
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
  NEW:         { label:"New",         cls:"bg-blue-50 text-blue-600 border-blue-200"      },
  QUALIFIED:   { label:"Qualified",   cls:"bg-purple-50 text-purple-600 border-purple-200"},
  PROPOSAL:    { label:"Proposal",    cls:"bg-amber-50 text-amber-600 border-amber-200"   },
  NEGOTIATION: { label:"Negotiation", cls:"bg-orange-50 text-orange-600 border-orange-200"},
  WON:         { label:"Won",         cls:"bg-emerald-50 text-emerald-700 border-emerald-200" },
  LOST:        { label:"Lost",        cls:"bg-red-50 text-red-500 border-red-200"         },
};

const BOOKING_STATUS: Record<string,{ label:string; cls:string }> = {
  confirmed: { label:"Confirmed", cls:"bg-[#1B75BC]/10 text-[#1B75BC] border-[#1B75BC]/20" },
  completed: { label:"Completed", cls:"bg-emerald-50 text-emerald-700 border-emerald-200"  },
  pending:   { label:"Pending",   cls:"bg-amber-50 text-amber-600 border-amber-200"        },
  cancelled: { label:"Cancelled", cls:"bg-red-50 text-red-500 border-red-200"              },
};

const INTEREST_CLS: Record<string,string> = {
  HIGH:   "text-emerald-600 bg-emerald-50",
  MEDIUM: "text-amber-600 bg-amber-50",
  LOW:    "text-red-500 bg-red-50",
};

const SERVICE_TYPES = ["HAJJ","UMRAH","VISA","AIR_TICKET","MANPOWER","TOUR","HOTEL"] as const;
type ServiceType = typeof SERVICE_TYPES[number];
const SERVICE_LABEL: Record<ServiceType,string> = {
  HAJJ:"Hajj", UMRAH:"Umrah", VISA:"Visa", AIR_TICKET:"Air Ticket", MANPOWER:"Manpower", TOUR:"Tour", HOTEL:"Hotel",
};
const serviceLabel = (s: string | null) => (s ? (SERVICE_LABEL[s as ServiceType] ?? s) : "—");

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
  const q = useAgentDashboard();
  const d = q.data;
  return (
    <PLoad q={q}>
      {d && (
      <div className="space-y-5" data-portal="dashboard">
        <div className="relative rounded-2xl overflow-hidden" style={{ background:"linear-gradient(135deg,#1B75BC 0%,#1a4a8a 50%,#F15A24 100%)" }}>
          <div className="px-6 py-6 text-white relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs mb-1">Agent Portal</p>
                <h2 className="text-2xl font-bold" data-portal-name>Salam, {d.agentName.split(" ")[0]}!</h2>
                <p className="text-white/70 text-sm mt-1 capitalize">{d.tier.toLowerCase()} Tier</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#F15A24] text-white px-3 py-1.5 rounded-xl text-xs font-bold capitalize">
                <Star size={12} className="fill-white"/> {d.tier.toLowerCase()}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label:"Wallet Balance", val:fmtBDT2(d.walletBalance), hi:true },
                { label:"Earned", val:fmtBDT2(d.commissionEarned) },
                { label:"Pending", val:fmtBDT2(d.commissionPending) },
              ].map(s=>(
                <div key={s.label} className={cn("rounded-xl p-3", s.hi?"bg-[#F15A24]/20 border border-[#F15A24]/40":"bg-white/10")}>
                  <p className="text-lg font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
                  <p className="text-xs text-white/70 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5"/>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Leads" value={String(d.counts.leads)} sub="Assigned to me" icon={UserPlus} iconBg="bg-blue-500" />
          <StatCard label="Bookings" value={String(d.counts.bookings)} sub="Mine" icon={Briefcase} iconBg="bg-[#1B75BC]" />
          <StatCard label="Customers" value={String(d.counts.customers)} sub="Mine" icon={Users} iconBg="bg-purple-500" />
          <StatCard label="Team" value={String(d.counts.teamSize)} sub="Sub-agents" icon={Building2} iconBg="bg-amber-500" />
        </div>

        <div className="bg-gradient-to-br from-[#0E7C66] to-[#0a5c4c] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Wallet size={18} className="text-white/80"/><p className="font-bold">Commission Wallet</p></div>
            <button onClick={()=>onGo("wallet")} className="text-xs text-white/70 hover:text-white flex items-center gap-1">Details <ChevronRight size={12}/></button>
          </div>
          <p className="text-3xl font-black mb-1" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(d.walletBalance)}</p>
          <p className="text-white/60 text-xs mb-4">Available balance (read-only ledger)</p>
          <button onClick={()=>onGo("commissions")} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/15 text-white text-sm font-semibold rounded-xl hover:bg-white/25 transition-colors"><FileText size={15}/> Commission Report</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-slate-800">Recent Leads</p>
            <button onClick={()=>onGo("leads")} className="text-xs text-[#1B75BC] hover:underline font-medium">View all</button>
          </div>
          <div className="space-y-2.5">
            {d.recentLeads.length === 0 && <p className="text-sm text-slate-400 py-2">No leads yet.</p>}
            {d.recentLeads.map(l=>(
              <div key={l.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1B75BC]/10 flex items-center justify-center text-[#1B75BC] text-xs font-bold flex-shrink-0">{l.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p><p className="text-xs text-slate-400 truncate">{l.serviceInterest || "—"}</p></div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{l.stage.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </PLoad>
  );
}

// ─── LEAD MANAGEMENT ─────────────────────────────────────────────────────────
const EMPTY_LEAD_FORM = { name:"", phone:"", email:"", serviceInterest:"HAJJ" as ServiceType, note:"" };

function LeadsView() {
  const q = useAgentLeads();
  const leads = q.data ?? [];
  const createLead = useCreateLead();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_LEAD_FORM);
  const filtered = leads.filter(l =>
    (filter==="all" || l.stage===filter) &&
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const submitLead = () => {
    createLead.mutate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      serviceInterest: form.serviceInterest,
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    }, { onSuccess: () => { setAddModal(false); setForm(EMPTY_LEAD_FORM); } });
  };

  return (
    <div className="space-y-4" data-portal="leads">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lead Management</h2>
          <p className="text-sm text-slate-400 mt-0.5">Track and convert your prospects</p>
        </div>
        <button onClick={()=>setAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1B75BC] text-white text-sm font-semibold rounded-xl hover:bg-[#14588F]">
          <Plus size={14}/> Add Lead
        </button>
      </div>

      <PLoad q={q}>
      {/* Pipeline summary */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Object.entries(LEAD_STATUS).map(([k,v])=>(
          <button key={k} onClick={()=>setFilter(k===filter?"all":k)}
            className={cn("p-2.5 rounded-xl border text-center transition-all",
              filter===k?"border-[#1B75BC] bg-[#1B75BC]/5":"border-slate-200 bg-white hover:border-[#1B75BC]/30")}>
            <p className="text-lg font-black text-slate-800">{leads.filter(l=>l.stage===k).length}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{v.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search leads…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
      </div>

      {/* Leads list */}
      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No leads yet.</p>}
        {filtered.map(l=>{
          const st = LEAD_STATUS[l.stage] ?? { label:l.stage, cls:"bg-slate-100 text-slate-500 border-slate-200" };
          return (
          <div key={l.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B75BC]/10 flex items-center justify-center text-[#1B75BC] text-sm font-bold flex-shrink-0">
                {l.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-bold text-slate-800">{l.name}</p>
                  <Chip label={st.label} cls={st.cls}/>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{l.phone}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Package size={11}/>{serviceLabel(l.serviceInterest)}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize",INTEREST_CLS[l.interest])}>{l.interest.toLowerCase()} Interest</span>
                  <span className="text-xs text-slate-400">{iso2date(l.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <a href={`tel:${l.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                <Phone size={12}/> Call
              </a>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                <Mail size={12}/> Email
              </button>
              <button disabled title="Managed by staff" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-[#1B75BC] text-white rounded-lg opacity-50 cursor-not-allowed">
                <Edit2 size={12}/> Update
              </button>
            </div>
          </div>
        );})}
      </div>
      </PLoad>

      {/* Add Lead modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Add New Lead</h3>
              <button onClick={()=>setAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
            </div>
            {([["Full Name","text","name"],["Phone Number","tel","phone"],["Email","email","email"]] as const).map(([l,t,k])=>(
              <div key={l}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{l}</label>
                <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Service Interest</label>
              <select value={form.serviceInterest} onChange={e=>setForm(f=>({...f,serviceInterest:e.target.value as ServiceType}))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none">
                {SERVICE_TYPES.map(s=>(
                  <option key={s} value={s}>{SERVICE_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
              <textarea rows={2} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"/>
            </div>
            <button onClick={submitLead}
              disabled={createLead.isPending || form.name.trim().length < 2 || form.phone.trim().length < 3}
              className="w-full py-3 bg-[#1B75BC] text-white font-semibold text-sm rounded-xl hover:bg-[#14588F] disabled:opacity-50 disabled:cursor-not-allowed">
              {createLead.isPending ? "Saving…" : "Save Lead"}
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
      <SampleBadge />
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
                c.status==="vip"?"bg-[#F15A24]/20 text-[#D64A12]":"bg-[#1B75BC]/10 text-[#1B75BC]")}>
                {c.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">{c.name}</p>
                  {c.status==="vip" && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-[#F15A24]/15 text-[#D64A12] rounded-full font-bold">
                      <Star size={10} className="fill-[#F15A24]"/> VIP
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
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
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
  const q = useAgentBookings();
  const commQ = useAgentCommissions();
  const bookings = q.data ?? [];
  const commRows = commQ.data ?? [];
  const commEarned = commRows.filter(r=>r.status==="PAID").reduce((s,r)=>s+r.amount,0);
  const commPending = commRows.filter(r=>r.status!=="PAID").reduce((s,r)=>s+r.amount,0);
  return (
    <div className="space-y-4" data-portal="bookings">
      <h2 className="text-xl font-bold text-slate-800">My Bookings</h2>
      <PLoad q={q}>
      {/* Commission summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total Bookings",    val:String(bookings.length), color:"text-[#1B75BC]" },
          { label:"Commission Earned", val:fmtBDT2(commEarned),     color:"text-emerald-600" },
          { label:"Commission Pending",val:fmtBDT2(commPending),    color:"text-amber-600"  },
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-3 text-center">
            <p className={cn("text-base font-black",s.color)} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      {bookings.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No bookings yet.</p>}
      {bookings.map(b=>{
        const st = BOOKING_STATUS[b.status.toLowerCase()] ?? { label:b.status, cls:"bg-slate-100 text-slate-500 border-slate-200" };
        return (
        <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-mono mb-0.5">{b.bookingNo || "—"}</p>
                <p className="font-bold text-slate-800">{serviceLabel(b.serviceType)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Customer: {b.customerName || "—"} · {iso2date(b.createdAt)}</p>
              </div>
              <Chip label={st.label} cls={st.cls}/>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Booking Value</p>
                <p className="font-bold text-slate-800 text-base" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtFull(b.baseAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      );})}
      </PLoad>
    </div>
  );
}

// ─── COMMISSION REPORTS ───────────────────────────────────────────────────────
function CommissionsView() {
  const q = useAgentCommissions();
  const rows = q.data ?? [];
  const totalEarned = rows.filter(r=>r.status==="PAID").reduce((s,r)=>s+r.amount,0);
  const totalPending = rows.filter(r=>r.status!=="PAID").reduce((s,r)=>s+r.amount,0);
  return (
    <div className="space-y-5" data-portal="commissions">
      <h2 className="text-xl font-bold text-slate-800">Commission Reports</h2>
      <PLoad q={q}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:"Total Earned", val:totalEarned, color:"bg-emerald-500", sub:"Paid" },
            { label:"Pending Payout", val:totalPending, color:"bg-amber-500", sub:"Awaiting transfer" },
          ].map(s=>(
            <div key={s.label} className={cn("rounded-2xl p-5 text-white",s.color)}>
              <p className="text-2xl font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(s.val)}</p>
              <p className="text-sm font-semibold mt-0.5 text-white/90">{s.label}</p>
              <p className="text-xs text-white/70">{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="font-semibold text-slate-700 text-sm">Commission by Period</p>
          {rows.length === 0 && <p className="text-sm text-slate-400 py-2">No commissions yet.</p>}
          {rows.map(r=>(
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-bold text-slate-800">{r.period || "—"}</p>
                <p className="text-xs text-slate-400 mt-0.5">Gross {fmtBDT2(r.grossAmount)} · rate {r.rate}%</p>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-600" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(r.amount)}</p>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", r.status==="PAID"?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600")}>{r.status.toLowerCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── WALLET & PAYMENTS ────────────────────────────────────────────────────────
function WalletView() {
  const q = useAgentWallet();
  const d = q.data;
  return (
    <div className="space-y-5" data-portal="wallet">
      <h2 className="text-xl font-bold text-slate-800">Wallet & Payments</h2>
      <PLoad q={q}>
        {d && (<>
          <div className="relative rounded-2xl overflow-hidden" style={{ background:"linear-gradient(135deg,#0E7C66 0%,#0a5c4c 100%)" }}>
            <div className="p-6 text-white relative z-10">
              <div className="flex items-center gap-2 mb-2"><Wallet size={18} className="text-white/80"/><p className="text-sm text-white/80 font-medium">Agent Wallet Balance</p></div>
              <p className="text-4xl font-black" data-wallet-balance style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(d.balance)}</p>
              <p className="text-white/60 text-xs mt-1">Immutable commission ledger — read-only</p>
              <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-xs text-white/80">
                <Shield size={13}/> Withdrawals are processed by the back office. This ledger is append-only.
              </div>
            </div>
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5"/>
          </div>

          <div>
            <p className="font-semibold text-slate-700 text-sm mb-3">Transaction History</p>
            <div className="space-y-2.5">
              {d.transactions.length === 0 && <p className="text-sm text-slate-400 py-2">No transactions.</p>}
              {d.transactions.map(t=>{
                const credit = t.type === "CREDIT";
                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", credit?"bg-emerald-50":"bg-red-50")}>
                      {credit ? <ArrowDownLeft size={16} className="text-emerald-600"/> : <ArrowUpRight size={16} className="text-red-500"/>}
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{t.description || t.type}</p><p className="text-xs text-slate-400 mt-0.5">{iso2date(t.postedAt)}{t.reversed?" · reversed":""}</p></div>
                    <p className={cn("font-black text-base",t.reversed?"text-slate-400 line-through":credit?"text-emerald-600":"text-red-500")} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{credit?"+":"-"}{fmtBDT2(t.amount)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>)}
      </PLoad>
    </div>
  );
}

// ─── MY TEAM ─────────────────────────────────────────────────────────────────
function TeamView() {
  const q = useAgentTeam();
  const team = q.data ?? [];
  const teamTotalComm = team.reduce((s,t)=>s+t.commission,0);
  return (
    <div className="space-y-5" data-portal="team">
      <h2 className="text-xl font-bold text-slate-800">My Team</h2>
      <PLoad q={q}>
        <div className="bg-gradient-to-r from-[#1B75BC] to-[#1a4a8a] rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs mb-3">Your downline (sub-agents you introduced)</p>
          <div className="grid grid-cols-3 gap-3">
            {[["Sub-agents",String(team.length)],["Team Bookings",String(team.reduce((s,t)=>s+t.bookings,0))],["Team Commission",fmtBDT2(teamTotalComm)]].map(([l,v])=>(
              <div key={l} className="bg-white/10 rounded-xl p-3 text-center"><p className="text-lg font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{v}</p><p className="text-xs text-white/70 mt-0.5">{l}</p></div>
            ))}
          </div>
        </div>
        {team.length === 0 && <p className="text-sm text-slate-400 text-center py-6">You have no sub-agents.</p>}
        <div className="space-y-3">
          {team.map(m=>(
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold bg-[#1B75BC]/10 text-[#1B75BC] flex-shrink-0">{m.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800" data-subagent>{m.name}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", m.status==="active"?"bg-emerald-50 text-emerald-600":"bg-slate-100 text-slate-400")}>{m.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{m.agentCode} · <span className="capitalize">{m.tier.toLowerCase()}</span></p>
                </div>
                <div className="text-right"><p className="font-black text-emerald-600" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(m.commission)}</p><p className="text-xs text-slate-400">commission</p></div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-slate-50 rounded-xl p-2.5 text-center"><p className="text-sm font-bold text-slate-800">{m.bookings}</p><p className="text-xs text-slate-400">Bookings</p></div>
              </div>
            </div>
          ))}
        </div>
      </PLoad>
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
      <SampleBadge />
      <h2 className="text-xl font-bold text-slate-800">Analytics</h2>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Conversion Rate" value="58%"  sub="Leads to bookings" icon={Target}     iconBg="bg-purple-500" delta="+8%" deltaUp/>
        <StatCard label="Avg. Ticket"     value="৳2.4L" sub="Per booking"       icon={Briefcase}  iconBg="bg-[#1B75BC]"  delta="+12%" deltaUp/>
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
                style={{ height:`${(v/maxB)*100}%`, background: i===months.length-1?"#1B75BC":"#1B75BC33" }}/>
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
            { label:"Hajj Packages",  pct:42, color:"#1B75BC" },
            { label:"Umrah",          pct:28, color:"#0E7C66" },
            { label:"Tour Packages",  pct:18, color:"#F15A24" },
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
            {!m.mine && <div className="w-8 h-8 rounded-full bg-[#1B75BC] flex items-center justify-center text-white text-xs font-bold mr-2 self-end flex-shrink-0">BD</div>}
            <div className={cn("max-w-xs px-4 py-2.5 rounded-2xl text-sm",m.mine?"bg-[#1B75BC] text-white rounded-br-sm":"bg-slate-100 text-slate-700 rounded-bl-sm")}>
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
        <button className="p-2.5 bg-[#1B75BC] text-white rounded-xl"><Send size={16}/></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <SampleBadge />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Support</h2>
        <button className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B75BC] text-white text-sm font-semibold rounded-xl">
          <Plus size={14}/> New Ticket
        </button>
      </div>
      <div className="bg-[#1B75BC]/5 border border-[#1B75BC]/15 rounded-2xl p-4 flex items-center gap-3">
        <Phone size={16} className="text-[#1B75BC]"/>
        <div>
          <p className="text-sm font-semibold text-slate-800">Agent Hotline</p>
          <p className="text-xs text-slate-500">Priority support: <span className="text-[#1B75BC] font-bold">+880 31 123 4568</span></p>
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
  const q = useAgentMe();
  const me = q.data;
  const initials = (me?.name ?? "").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="space-y-5" data-portal="profile">
      <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>
      <PLoad q={q}>
        {me && (<>
          <div className="bg-gradient-to-br from-[#1B75BC] to-[#0E4D7A] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 border-2 border-[#F15A24] flex items-center justify-center text-2xl font-black">{initials}</div>
              <div>
                <p className="text-xl font-bold" data-portal-name>{me.name}</p>
                <p className="text-white/70 text-sm mt-0.5 font-mono">{me.agentCode}</p>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F15A24] rounded-full mt-1.5 w-fit"><Star size={10} className="fill-white text-white"/><span className="text-xs font-bold text-white capitalize">{me.tier.toLowerCase()} Tier</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">Personal Information</p>
            {[
              { label:"Full Name",    val:me.name },
              { label:"Phone",        val:me.phone ?? "—" },
              { label:"Email",        val:me.email ?? "—" },
              { label:"NID Number",   val:me.nid ?? "—" },
              { label:"Trade License",val:me.tradeLicense ?? "—" },
            ].map(f=>(
              <div key={f.label}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
                <input value={f.val} disabled data-field={f.label} className="w-full px-3 py-2.5 text-sm rounded-xl border border-transparent bg-slate-50 text-slate-700"/>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">Bank & Payment Details</p>
            {[["Bank Name",me.bankName ?? "—"],["Account No.",me.accountNo ?? "—"],["bKash No.",me.bkashNo ?? "—"],["Nagad No.",me.nagadNo ?? "—"]].map(([l,v])=>(
              <div key={l}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
                <div className="px-3 py-2.5 bg-slate-50 rounded-xl"><span className="text-sm text-slate-700">{v}</span></div>
              </div>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50"><LogOut size={16}/> Sign Out</button>
        </>)}
      </PLoad>
    </div>
  );
}

// ─── PORTAL SHELL ─────────────────────────────────────────────────────────────
export function AgentPortal() {
  const [view, setView] = useState<AgentView>("dashboard");
  const { data: me } = useAgentMe();
  const { data: dash } = useAgentDashboard();
  const name = me?.name ?? "Agent";
  const initials = name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const walletStr = fmtBDT2(dash?.walletBalance ?? 0);

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
              <div className="w-9 h-9 rounded-xl bg-[#1B75BC] flex items-center justify-center text-white text-xs font-black">BDH</div>
              <div>
                <p className="text-sm font-bold text-slate-800">BDH Travels</p>
                <p className="text-xs text-[#D64A12] font-semibold">Agent Portal</p>
              </div>
            </div>
          </div>
          {/* Agent card */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#1B75BC]/5 to-[#F15A24]/5 rounded-2xl border border-[#1B75BC]/10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B75BC] to-[#F15A24] flex items-center justify-center text-white text-xs font-black">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate" data-portal-name>{name}</p>
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-[#D64A12] fill-[#F15A24]"/>
                  <p className="text-xs text-[#D64A12] font-semibold capitalize">{(me?.tier ?? "").toLowerCase()} Agent</p>
                </div>
              </div>
            </div>
            {/* Wallet preview */}
            <div onClick={()=>go("wallet")} className="flex items-center justify-between mt-3 px-3 py-2.5 bg-[#0E7C66]/10 rounded-xl border border-[#0E7C66]/20 cursor-pointer hover:bg-[#0E7C66]/15 transition-colors">
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-[#0E7C66]"/>
                <span className="text-xs font-semibold text-slate-600">Wallet</span>
              </div>
              <span className="text-xs font-black text-[#0E7C66]" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{walletStr}</span>
            </div>
          </div>
          {/* Nav */}
          <nav className="flex-1 py-3 px-3 overflow-y-auto no-scrollbar space-y-0.5">
            {NAV.map(item=>(
              <button key={item.id} onClick={()=>go(item.id)}
                className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all",
                  view===item.id
                    ? "bg-[#1B75BC] text-white shadow-sm shadow-[#1B75BC]/25"
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
            <div className="w-8 h-8 rounded-lg bg-[#1B75BC] flex items-center justify-center text-white text-xs font-black">BDH</div>
            <div>
              <span className="font-bold text-slate-800 text-sm">Agent Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>go("wallet")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0E7C66]/10 border border-[#0E7C66]/20 rounded-xl text-xs font-bold text-[#0E7C66]">
              <Wallet size={12}/> {walletStr}
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
                  <item.icon size={22} className={active?"text-[#1B75BC]":"text-slate-400"}/>
                  <span className={cn("text-xs font-medium",active?"text-[#1B75BC]":"text-slate-400")}>{item.label}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-[#1B75BC]"/>}
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
