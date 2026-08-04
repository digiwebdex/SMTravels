import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, Calendar, Wallet, BarChart3, FileText,
  MessageCircle, User, LogOut, ChevronRight, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Plus, Search, Filter, Download, Eye,
  Check, X, Clock, AlertCircle, CheckCircle, ArrowUpRight,
  ArrowDownLeft, Banknote, CreditCard, Star, Phone, Mail,
  MapPin, Globe, Shield, Edit2, Copy, Send, Paperclip,
  Bell, Settings, MoreHorizontal, Award, Target, Zap,
  UserPlus, Briefcase, PieChart, ArrowRight, Layers,
  RefreshCw, Info, Package, Building2, CircleDollarSign, FolderOpen,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAgentMe, useAgentDashboard, useAgentWallet, useAgentTeam, useAgentLeads, useAgentCommissions,
  useAgentBookings, useAgentCustomers, useCreateLead,
  useAgentDocuments, useAgentPayments, useAgentTickets, useAgentTicket,
  useCreateAgentTicket, useAddAgentTicketMessage,
} from "../hooks/portals";
import { useMyNotifications, useMarkAllNotificationsRead } from "../hooks/notifications";
import { useAuth } from "../auth/AuthContext";
import { PortalShell, type PortalNavItem } from "../design-system";

const fmtBDT2 = (n: number) => "৳ " + Number(n || 0).toLocaleString("en-BD");
const iso2date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");
function PLoad({ q, children }: { q: { isLoading: boolean; isError: boolean; error?: unknown }; children: React.ReactNode }) {
  const { t } = useTranslation("portalAgent");
  if (q.isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>;
  if (q.isError) return <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 text-center">{(q.error as Error)?.message || t("portalCommon:empty.failed")}</div>;
  return <>{children}</>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type AgentView =
  | "dashboard" | "leads" | "customers" | "bookings"
  | "commissions" | "wallet" | "statements" | "documents" | "payments"
  | "team" | "analytics"
  | "support" | "notifications" | "profile";

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard"     as AgentView, icon: LayoutDashboard,  labelKey: "portalCommon:nav.dashboard"        },
  { id: "leads"         as AgentView, icon: UserPlus,         labelKey: "portalAgent:nav.leadManagement"    },
  { id: "customers"     as AgentView, icon: Users,            labelKey: "portalCommon:nav.customers"        },
  { id: "bookings"      as AgentView, icon: Briefcase,        labelKey: "portalCommon:nav.bookings"         },
  { id: "commissions"   as AgentView, icon: CircleDollarSign, labelKey: "portalAgent:nav.commissionReports" },
  { id: "wallet"        as AgentView, icon: Wallet,           labelKey: "portalAgent:nav.walletPayments"    },
  { id: "statements"    as AgentView, icon: FileText,         labelKey: "portalCommon:nav.statements"       },
  { id: "documents"     as AgentView, icon: FolderOpen,       labelKey: "portalCommon:nav.documents"        },
  { id: "payments"      as AgentView, icon: CreditCard,       labelKey: "portalCommon:nav.payments"         },
  { id: "team"          as AgentView, icon: Building2,        labelKey: "portalAgent:nav.myTeam"            },
  { id: "analytics"     as AgentView, icon: BarChart3,        labelKey: "portalAgent:nav.analytics"         },
  { id: "support"       as AgentView, icon: MessageCircle,    labelKey: "portalCommon:nav.support"          },
  { id: "notifications" as AgentView, icon: Bell,             labelKey: "portalCommon:nav.notifications"    },
  { id: "profile"       as AgentView, icon: User,             labelKey: "portalAgent:nav.profileSettings"   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtBDT = (n: number) =>
  n >= 100000
    ? "৳ " + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + "L"
    : "৳ " + n.toLocaleString("en-BD");
const fmtFull = (n: number) => "৳ " + n.toLocaleString("en-BD");

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const LEAD_STATUS: Record<string,{ labelKey:string; cls:string }> = {
  NEW:         { labelKey:"portalAgent:leadStatus.new",         cls:"bg-blue-50 text-blue-600 border-blue-200"      },
  QUALIFIED:   { labelKey:"portalAgent:leadStatus.qualified",   cls:"bg-purple-50 text-purple-600 border-purple-200"},
  PROPOSAL:    { labelKey:"portalAgent:leadStatus.proposal",    cls:"bg-amber-50 text-amber-600 border-amber-200"   },
  NEGOTIATION: { labelKey:"portalAgent:leadStatus.negotiation", cls:"bg-orange-50 text-orange-600 border-orange-200"},
  WON:         { labelKey:"portalAgent:leadStatus.won",         cls:"bg-emerald-50 text-emerald-700 border-emerald-200" },
  LOST:        { labelKey:"portalAgent:leadStatus.lost",        cls:"bg-red-50 text-red-500 border-red-200"         },
};

const BOOKING_STATUS: Record<string,{ labelKey:string; cls:string }> = {
  confirmed: { labelKey:"portalCommon:status.confirmed", cls:"bg-[#1B75BC]/10 text-[#1B75BC] border-[#1B75BC]/20" },
  completed: { labelKey:"portalCommon:status.completed", cls:"bg-emerald-50 text-emerald-700 border-emerald-200"  },
  pending:   { labelKey:"portalCommon:status.pending",   cls:"bg-amber-50 text-amber-600 border-amber-200"        },
  cancelled: { labelKey:"portalCommon:status.cancelled", cls:"bg-red-50 text-red-500 border-red-200"              },
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
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
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
  const { t } = useTranslation("portalAgent");
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
                <p className="text-white/70 text-xs mb-1">{t("shell.agentPortal")}</p>
                <h2 className="text-2xl font-bold" data-portal-name>{t("dashboard.greeting", { name: d.agentName.split(" ")[0] })}</h2>
                <p className="text-white/70 text-sm mt-1 capitalize">{t("dashboard.tierLabel", { tier: d.tier.toLowerCase() })}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#F15A24] text-white px-3 py-1.5 rounded-xl text-xs font-bold capitalize">
                <Star size={12} className="fill-white"/> {d.tier.toLowerCase()}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label:t("dashboard.walletBalance"), val:fmtBDT2(d.walletBalance), hi:true },
                { label:t("dashboard.earned"), val:fmtBDT2(d.commissionEarned) },
                { label:t("portalCommon:status.pending"), val:fmtBDT2(d.commissionPending) },
              ].map(s=>(
                <div key={s.label} className={cn("rounded-xl p-3", s.hi?"bg-[#F15A24]/20 border border-[#F15A24]/40":"bg-[var(--color-surface)]/10")}>
                  <p className="text-lg font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
                  <p className="text-xs text-white/70 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[var(--color-surface)]/5"/>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label={t("portalCommon:nav.leads")} value={String(d.counts.leads)} sub={t("dashboard.assignedToMe")} icon={UserPlus} iconBg="bg-blue-500" />
          <StatCard label={t("portalCommon:nav.bookings")} value={String(d.counts.bookings)} sub={t("dashboard.mine")} icon={Briefcase} iconBg="bg-[#1B75BC]" />
          <StatCard label={t("portalCommon:nav.customers")} value={String(d.counts.customers)} sub={t("dashboard.mine")} icon={Users} iconBg="bg-purple-500" />
          <StatCard label={t("portalCommon:nav.team")} value={String(d.counts.teamSize)} sub={t("dashboard.subAgents")} icon={Building2} iconBg="bg-amber-500" />
        </div>

        <div className="bg-gradient-to-br from-[#0E7C66] to-[#0a5c4c] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Wallet size={18} className="text-white/80"/><p className="font-bold">{t("dashboard.commissionWallet")}</p></div>
            <button onClick={()=>onGo("wallet")} className="text-xs text-white/70 hover:text-white flex items-center gap-1 whitespace-nowrap">{t("portalCommon:labels.details")} <ChevronRight size={12}/></button>
          </div>
          <p className="text-3xl font-black mb-1" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(d.walletBalance)}</p>
          <p className="text-white/60 text-xs mb-4">{t("dashboard.availableBalanceLedger")}</p>
          <button onClick={()=>onGo("commissions")} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-surface)]/15 text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-surface)]/25 transition-colors whitespace-nowrap"><FileText size={15}/> {t("dashboard.commissionReport")}</button>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-slate-800">{t("dashboard.recentLeads")}</p>
            <button onClick={()=>onGo("leads")} className="text-xs text-[#1B75BC] hover:underline font-medium whitespace-nowrap">{t("common:actions.viewAll")}</button>
          </div>
          <div className="space-y-2.5">
            {d.recentLeads.length === 0 && <p className="text-sm text-slate-400 py-2">{t("leads.noLeads")}</p>}
            {d.recentLeads.map(l=>(
              <div key={l.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1B75BC]/10 flex items-center justify-center text-[#1B75BC] text-xs font-bold flex-shrink-0">{l.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p><p className="text-xs text-slate-400 truncate">{l.serviceInterest || "—"}</p></div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{t(`leadStatus.${l.stage.toLowerCase()}`, { defaultValue: l.stage.toLowerCase() })}</span>
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
  const { t } = useTranslation("portalAgent");
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
          <h2 className="text-xl font-bold text-slate-800">{t("nav.leadManagement")}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{t("leads.subtitle")}</p>
        </div>
        <button onClick={()=>setAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1B75BC] text-white text-sm font-semibold rounded-xl hover:bg-[#14588F] whitespace-nowrap">
          <Plus size={14}/> {t("leads.addButton")}
        </button>
      </div>

      <PLoad q={q}>
      {/* Pipeline summary */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Object.entries(LEAD_STATUS).map(([k,v])=>(
          <button key={k} onClick={()=>setFilter(k===filter?"all":k)}
            className={cn("p-2.5 rounded-xl border text-center transition-all",
              filter===k?"border-[#1B75BC] bg-[#1B75BC]/5":"border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[#1B75BC]/30")}>
            <p className="text-lg font-black text-slate-800">{leads.filter(l=>l.stage===k).length}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{t(v.labelKey)}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder={t("leads.searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
      </div>

      {/* Leads list */}
      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-6">{t("leads.noLeads")}</p>}
        {filtered.map(l=>{
          const st = LEAD_STATUS[l.stage] ?? { labelKey:"", cls:"bg-slate-100 text-slate-500 border-[var(--color-border)]" };
          const stLabel = st.labelKey ? t(st.labelKey) : l.stage;
          return (
          <div key={l.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B75BC]/10 flex items-center justify-center text-[#1B75BC] text-sm font-bold flex-shrink-0">
                {l.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-bold text-slate-800">{l.name}</p>
                  <Chip label={stLabel} cls={st.cls}/>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{l.phone}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Package size={11}/>{serviceLabel(l.serviceInterest)}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",INTEREST_CLS[l.interest])}>{t(`interest.${l.interest.toLowerCase()}`, { defaultValue: l.interest.toLowerCase() })}</span>
                  <span className="text-xs text-slate-400">{iso2date(l.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
              <a href={`tel:${l.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-[var(--color-border)] rounded-lg text-slate-600 hover:bg-[var(--color-bg)] whitespace-nowrap">
                <Phone size={12}/> {t("leads.call")}
              </a>
              <button disabled title={t("leads.managedByStaff")} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-[var(--color-border)] rounded-lg text-slate-400 opacity-50 cursor-not-allowed whitespace-nowrap">
                <Mail size={12}/> {t("portalCommon:labels.email")}
              </button>
              <button disabled title={t("leads.managedByStaff")} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-[#1B75BC] text-white rounded-lg opacity-50 cursor-not-allowed whitespace-nowrap">
                <Edit2 size={12}/> {t("leads.update")}
              </button>
            </div>
          </div>
        );})}
      </div>
      </PLoad>

      {/* Add Lead modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">{t("leads.addModalTitle")}</h3>
              <button onClick={()=>setAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
            </div>
            {([[t("leads.fullName"),"text","name"],[t("leads.phoneNumber"),"tel","phone"],[t("portalCommon:labels.email"),"email","email"]] as const).map(([labelText,inputType,k])=>(
              <div key={k}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{labelText}</label>
                <input type={inputType} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="w-full px-3.5 py-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t("leads.serviceInterest")}</label>
              <select value={form.serviceInterest} onChange={e=>setForm(f=>({...f,serviceInterest:e.target.value as ServiceType}))} className="w-full px-3.5 py-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none">
                {SERVICE_TYPES.map(s=>(
                  <option key={s} value={s}>{SERVICE_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t("leads.notes")}</label>
              <textarea rows={2} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} className="w-full px-3.5 py-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none resize-none"/>
            </div>
            <button onClick={submitLead}
              disabled={createLead.isPending || form.name.trim().length < 2 || form.phone.trim().length < 3}
              className="w-full py-3 bg-[#1B75BC] text-white font-semibold text-sm rounded-xl hover:bg-[#14588F] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
              {createLead.isPending ? t("leads.saving") : t("leads.saveButton")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
function CustomersView() {
  const { t } = useTranslation("portalAgent");
  const q = useAgentCustomers();
  const customers = q.data ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.customers")}</h2>
      </div>
      <PLoad q={q}>
      <div className="space-y-3">
        {customers.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t("portalCommon:empty.none")}</p>
        ) : customers.map((c) => (
          <div key={c.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
                c.status === "vip" ? "bg-[#F15A24]/20 text-[#D64A12]" : "bg-[#1B75BC]/10 text-[#1B75BC]")}>
                {c.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">{c.name}</p>
                  {c.status === "vip" && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-[#F15A24]/15 text-[#D64A12] rounded-full font-bold">
                      <Star size={10} className="fill-[#F15A24]"/> {t("customers.vip")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[[t("portalCommon:nav.bookings"), c.bookingsCount], [t("customers.totalValue"), fmtBDT(c.totalValue)], [t("customers.lastBooking"), c.lastBookingAt ? iso2date(c.lastBookingAt) : "—"]].map(([k, v]) => (
                <div key={k as string} className="bg-[var(--color-bg)] rounded-xl p-2.5 text-center">
                  <p className="text-sm font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{v}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{k}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      </PLoad>
    </div>
  );
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
function AgentBookings() {
  const { t } = useTranslation("portalAgent");
  const q = useAgentBookings();
  const commQ = useAgentCommissions();
  const bookings = q.data ?? [];
  const commRows = commQ.data ?? [];
  const commEarned = commRows.filter(r=>r.status==="PAID").reduce((s,r)=>s+r.amount,0);
  const commPending = commRows.filter(r=>r.status!=="PAID").reduce((s,r)=>s+r.amount,0);
  return (
    <div className="space-y-4" data-portal="bookings">
      <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.myBookings")}</h2>
      <PLoad q={q}>
      {/* Commission summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:t("bookings.totalBookings"),    val:String(bookings.length), color:"text-[#1B75BC]" },
          { label:t("bookings.commissionEarned"), val:fmtBDT2(commEarned),     color:"text-emerald-600" },
          { label:t("bookings.commissionPending"),val:fmtBDT2(commPending),    color:"text-amber-600"  },
        ].map(s=>(
          <div key={s.label} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-3 text-center">
            <p className={cn("text-base font-black",s.color)} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      {bookings.length === 0 && <p className="text-sm text-slate-400 text-center py-6">{t("bookings.noBookings")}</p>}
      {bookings.map(b=>{
        const stCfg = BOOKING_STATUS[b.status.toLowerCase()];
        const st = { label: stCfg ? t(stCfg.labelKey) : b.status, cls: stCfg?.cls ?? "bg-slate-100 text-slate-500 border-[var(--color-border)]" };
        return (
        <div key={b.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-mono mb-0.5">{b.bookingNo || "—"}</p>
                <p className="font-bold text-slate-800">{serviceLabel(b.serviceType)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t("bookings.customerPrefix")}: {b.customerName || "—"} · {iso2date(b.createdAt)}</p>
              </div>
              <Chip label={st.label} cls={st.cls}/>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{t("bookings.bookingValue")}</p>
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
  const { t } = useTranslation("portalAgent");
  const q = useAgentCommissions();
  const rows = q.data ?? [];
  const totalEarned = rows.filter(r=>r.status==="PAID").reduce((s,r)=>s+r.amount,0);
  const totalPending = rows.filter(r=>r.status!=="PAID").reduce((s,r)=>s+r.amount,0);
  return (
    <div className="space-y-5" data-portal="commissions">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.commissionReports")}</h2>
      <PLoad q={q}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:t("commissions.totalEarned"), val:totalEarned, color:"bg-emerald-500", sub:t("portalCommon:status.paid") },
            { label:t("commissions.pendingPayout"), val:totalPending, color:"bg-amber-500", sub:t("commissions.awaitingTransfer") },
          ].map(s=>(
            <div key={s.label} className={cn("rounded-2xl p-5 text-white",s.color)}>
              <p className="text-2xl font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(s.val)}</p>
              <p className="text-sm font-semibold mt-0.5 text-white/90">{s.label}</p>
              <p className="text-xs text-white/70">{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="font-semibold text-slate-700 text-sm">{t("commissions.byPeriod")}</p>
          {rows.length === 0 && <p className="text-sm text-slate-400 py-2">{t("commissions.noCommissions")}</p>}
          {rows.map(r=>(
            <div key={r.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-bold text-slate-800">{r.period || "—"}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t("commissions.grossRate", { gross: fmtBDT2(r.grossAmount), rate: r.rate })}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-600" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(r.amount)}</p>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", r.status==="PAID"?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600")}>{t(`portalCommon:status.${r.status.toLowerCase()}`, { defaultValue: r.status.toLowerCase() })}</span>
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
  const { t } = useTranslation("portalAgent");
  const q = useAgentWallet();
  const d = q.data;
  return (
    <div className="space-y-5" data-portal="wallet">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.walletPayments")}</h2>
      <PLoad q={q}>
        {d && (<>
          <div className="relative rounded-2xl overflow-hidden" style={{ background:"linear-gradient(135deg,#0E7C66 0%,#0a5c4c 100%)" }}>
            <div className="p-6 text-white relative z-10">
              <div className="flex items-center gap-2 mb-2"><Wallet size={18} className="text-white/80"/><p className="text-sm text-white/80 font-medium">{t("wallet.agentBalance")}</p></div>
              <p className="text-4xl font-black" data-wallet-balance style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(d.balance)}</p>
              <p className="text-white/60 text-xs mt-1">{t("wallet.ledgerNote")}</p>
              <div className="mt-4 flex items-center gap-2 bg-[var(--color-surface)]/10 rounded-xl px-3 py-2 text-xs text-white/80">
                <Shield size={13}/> {t("wallet.withdrawalNote")}
              </div>
            </div>
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[var(--color-surface)]/5"/>
          </div>

          <div>
            <p className="font-semibold text-slate-700 text-sm mb-3">{t("wallet.transactionHistory")}</p>
            <div className="space-y-2.5">
              {d.transactions.length === 0 && <p className="text-sm text-slate-400 py-2">{t("wallet.noTransactions")}</p>}
              {d.transactions.map(tx=>{
                const credit = tx.type === "CREDIT";
                return (
                  <div key={tx.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", credit?"bg-emerald-50":"bg-red-50")}>
                      {credit ? <ArrowDownLeft size={16} className="text-emerald-600"/> : <ArrowUpRight size={16} className="text-red-500"/>}
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{tx.description || tx.type}</p><p className="text-xs text-slate-400 mt-0.5">{iso2date(tx.postedAt)}{tx.reversed?" · "+t("wallet.reversed"):""}</p></div>
                    <p className={cn("font-black text-base",tx.reversed?"text-slate-400 line-through":credit?"text-emerald-600":"text-red-500")} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{credit?"+":"-"}{fmtBDT2(tx.amount)}</p>
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
  const { t } = useTranslation("portalAgent");
  const q = useAgentTeam();
  const team = q.data ?? [];
  const teamTotalComm = team.reduce((s,m)=>s+m.commission,0);
  return (
    <div className="space-y-5" data-portal="team">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.myTeam")}</h2>
      <PLoad q={q}>
        <div className="bg-gradient-to-r from-[#1B75BC] to-[#1a4a8a] rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs mb-3">{t("team.downlineNote")}</p>
          <div className="grid grid-cols-3 gap-3">
            {[[t("team.subAgents"),String(team.length)],[t("team.teamBookings"),String(team.reduce((s,m)=>s+m.bookings,0))],[t("team.teamCommission"),fmtBDT2(teamTotalComm)]].map(([l,v])=>(
              <div key={l} className="bg-[var(--color-surface)]/10 rounded-xl p-3 text-center"><p className="text-lg font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{v}</p><p className="text-xs text-white/70 mt-0.5">{l}</p></div>
            ))}
          </div>
        </div>
        {team.length === 0 && <p className="text-sm text-slate-400 text-center py-6">{t("team.noSubAgents")}</p>}
        <div className="space-y-3">
          {team.map(m=>(
            <div key={m.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold bg-[#1B75BC]/10 text-[#1B75BC] flex-shrink-0">{m.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800" data-subagent>{m.name}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", m.status==="active"?"bg-emerald-50 text-emerald-600":"bg-slate-100 text-slate-400")}>{t(`portalCommon:status.${m.status}`, { defaultValue: m.status })}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{m.agentCode} · <span className="capitalize">{m.tier.toLowerCase()}</span></p>
                </div>
                <div className="text-right"><p className="font-black text-emerald-600" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(m.commission)}</p><p className="text-xs text-slate-400">{t("team.commissionCaption")}</p></div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-[var(--color-bg)] rounded-xl p-2.5 text-center"><p className="text-sm font-bold text-slate-800">{m.bookings}</p><p className="text-xs text-slate-400">{t("portalCommon:nav.bookings")}</p></div>
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
  const { t } = useTranslation("portalAgent");
  const dashQ = useAgentDashboard();
  const commQ = useAgentCommissions();
  const d = dashQ.data;
  const commissions = commQ.data ?? [];
  const totalComm = commissions.reduce((s, c) => s + c.amount, 0);
  const paidComm = commissions.filter(c => c.status === "PAID" || c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const pendingComm = commissions.filter(c => c.status === "PENDING" || c.status === "pending").reduce((s, c) => s + c.amount, 0);
  const conversion = d && d.counts.leads > 0 ? Math.round((d.counts.bookings / d.counts.leads) * 100) : 0;
  const avgTicket = d && d.counts.bookings > 0 ? d.commissionEarned / d.counts.bookings : 0;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.analytics")}</h2>

      <PLoad q={dashQ}>
        {d && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t("analytics.conversionRate")} value={`${conversion}%`} sub={t("analytics.leadsToBookings")} icon={Target} iconBg="bg-purple-500"/>
            <StatCard label={t("analytics.avgTicket")} value={fmtBDT2(avgTicket)} sub={t("analytics.perBooking")} icon={Briefcase} iconBg="bg-[#1B75BC]"/>
            <StatCard label={t("portalCommon:nav.bookings")} value={String(d.counts.bookings)} sub={t("dashboard.mine")} icon={RefreshCw} iconBg="bg-[#0E7C66]"/>
            <StatCard label={t("portalCommon:nav.leads")} value={String(d.counts.leads)} sub={t("dashboard.assignedToMe")} icon={Zap} iconBg="bg-amber-500"/>
          </div>
        )}
      </PLoad>

      <PLoad q={commQ}>
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-slate-800">{t("analytics.commissionTrend")}</p>
            <span className="text-xs text-slate-400">৳ (BDT)</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[var(--color-bg)] rounded-xl p-3 text-center">
              <p className="text-lg font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(totalComm)}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-emerald-600" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(paidComm)}</p>
              <p className="text-xs text-slate-400">Paid</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-amber-600" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(pendingComm)}</p>
              <p className="text-xs text-slate-400">{t("portalCommon:status.pending")}</p>
            </div>
          </div>
          {commissions.length === 0 && <p className="text-sm text-slate-400 text-center py-4">{t("portalCommon:empty.nothing")}</p>}
          <div className="space-y-2">
            {commissions.slice(0, 8).map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{c.period ?? "—"} · {c.rate}%</span>
                <span className="font-bold text-slate-800 font-mono">{fmtBDT2(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </PLoad>

      <PLoad q={dashQ}>
        {d && (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <p className="font-bold text-slate-800 mb-4">{t("analytics.bookingsTrend")}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1B75BC]/5 rounded-xl p-4">
                <p className="text-2xl font-black text-[#1B75BC]" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(d.commissionEarned)}</p>
                <p className="text-xs text-slate-500">{t("dashboard.earned")}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-2xl font-black text-amber-600" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(d.commissionPending)}</p>
                <p className="text-xs text-slate-500">{t("portalCommon:status.pending")}</p>
              </div>
            </div>
          </div>
        )}
      </PLoad>
    </div>
  );
}

// ─── STATEMENTS (CSV from commissions + wallet) ───────────────────────────────
function StatementsView() {
  const { t } = useTranslation("portalAgent");
  const commQ = useAgentCommissions();
  const walletQ = useAgentWallet();
  const commissions = commQ.data ?? [];
  const wallet = walletQ.data;
  const loading = { isLoading: commQ.isLoading || walletQ.isLoading, isError: commQ.isError || walletQ.isError, error: commQ.error || walletQ.error };

  const exportCommissions = () => {
    downloadCsv(
      `agent-commissions-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Period", "Gross", "Rate %", "Amount", "Status"],
      commissions.map((r) => [r.period ?? "", r.grossAmount, r.rate, r.amount, r.status]),
    );
    toast.success(t("statements.exportedCommissions"));
  };
  const exportWallet = () => {
    const txns = wallet?.transactions ?? [];
    downloadCsv(
      `agent-wallet-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Type", "Description", "Amount", "Reference", "Reversed"],
      txns.map((tx) => [tx.postedAt, tx.type, tx.description ?? "", tx.amount, tx.reference ?? "", tx.reversed ? "yes" : "no"]),
    );
    toast.success(t("statements.exportedWallet"));
  };

  return (
    <div className="space-y-5" data-portal="statements">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.statements")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("statements.subtitle")}</p>
      </div>
      <PLoad q={loading}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <p className="font-bold text-slate-800 mb-1">{t("nav.commissionReports")}</p>
            <p className="text-xs text-slate-400 mb-4">{t("statements.commissionRows", { count: commissions.length })}</p>
            <button type="button" onClick={exportCommissions} disabled={commissions.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1B75BC] text-white text-sm font-semibold rounded-xl hover:bg-[#14588F] disabled:opacity-50">
              <Download size={14}/> {t("statements.downloadCsv")}
            </button>
          </div>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <p className="font-bold text-slate-800 mb-1">{t("portalCommon:nav.wallet")}</p>
            <p className="text-xs text-slate-400 mb-4">{t("statements.walletRows", { count: wallet?.transactions.length ?? 0 })} · {fmtBDT2(wallet?.balance ?? 0)}</p>
            <button type="button" onClick={exportWallet} disabled={!wallet?.transactions.length}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0E7C66] text-white text-sm font-semibold rounded-xl hover:bg-[#0a5c4c] disabled:opacity-50">
              <Download size={14}/> {t("statements.downloadCsv")}
            </button>
          </div>
        </div>
      </PLoad>
    </div>
  );
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
function AgentDocumentsView() {
  const { t } = useTranslation("portalAgent");
  const q = useAgentDocuments();
  const rows = q.data ?? [];
  return (
    <div className="space-y-4" data-portal="documents">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.documents")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("documents.subtitle")}</p>
      </div>
      <PLoad q={q}>
        {rows.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t("portalCommon:empty.nothing")}</p>}
        <div className="space-y-3">
          {rows.map((d) => (
            <div key={d.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0"><FolderOpen size={18} className="text-slate-400"/></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{d.name}</p>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">{d.type.toLowerCase().replace(/_/g, " ")}{d.bookingNo ? ` · ${d.bookingNo}` : ""} · {iso2date(d.createdAt)}</p>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                d.status === "VERIFIED" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>{d.status.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
function AgentPaymentsView() {
  const { t } = useTranslation("portalAgent");
  const q = useAgentPayments();
  const rows = q.data ?? [];
  const total = rows.filter((p) => !p.reversed).reduce((s, p) => s + p.amount, 0);
  return (
    <div className="space-y-4" data-portal="payments">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.payments")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("payments.subtitle")}</p>
      </div>
      <PLoad q={q}>
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 text-center mb-1">
          <p className="text-xs text-slate-400">{t("payments.totalCollected")}</p>
          <p className="text-2xl font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(total)}</p>
        </div>
        {rows.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t("portalCommon:empty.nothing")}</p>}
        <div className="space-y-3">
          {rows.map((p) => (
            <div key={p.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", p.reversed ? "bg-red-50" : "bg-emerald-50")}>
                <CheckCircle size={18} className={p.reversed ? "text-red-500" : "text-emerald-600"}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.customerName || p.invoiceNo || p.receiptNo || t("payments.payment")}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.method.replace(/_/g, " ")} · {iso2date(p.paidAt)}</p>
              </div>
              <p className={cn("font-black", p.reversed ? "text-slate-400 line-through" : "text-slate-800")} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(p.amount)}</p>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
function AgentNotificationsView() {
  const { t } = useTranslation("portalAgent");
  const q = useMyNotifications();
  const rows = q.data ?? [];
  const markAll = useMarkAllNotificationsRead();
  return (
    <div className="space-y-4" data-portal="notifications">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.notifications")}</h2>
        <button type="button" onClick={() => markAll.mutate()} disabled={markAll.isPending}
          className="text-sm text-[#1B75BC] hover:underline font-medium disabled:opacity-50 whitespace-nowrap">{t("notifications.markAllRead")}</button>
      </div>
      <PLoad q={q}>
        {rows.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t("portalCommon:empty.nothing")}</p>}
        <div className="space-y-3">
          {rows.map((n) => (
            <div key={n.id} className={cn("flex items-start gap-3 p-4 rounded-2xl border transition-all",
              n.read ? "bg-[var(--color-surface)] border-[var(--color-border)]" : "bg-[#1B75BC]/4 border-[#1B75BC]/15")}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: (n.color || "#1B75BC") + "20" }}>
                <div className="w-3 h-3 rounded-full" style={{ background: n.color || "#1B75BC" }}/>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">{n.title}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[#1B75BC] flex-shrink-0"/>}
                </div>
                {n.body && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>}
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap mt-0.5">{iso2date(n.createdAt)}</span>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── SUPPORT ─────────────────────────────────────────────────────────────────
function AgentTicketThread({ id, onBack }: { id: string; onBack: () => void }) {
  const { t } = useTranslation("portalAgent");
  const q = useAgentTicket(id);
  const tk = q.data;
  const [msg, setMsg] = useState("");
  const add = useAddAgentTicketMessage(id);
  const send = () => { const b = msg.trim(); if (!b) return; setMsg(""); add.mutate(b); };
  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
          <ChevronRight size={16} className="rotate-180"/>
        </button>
        <div>
          <p className="font-bold text-slate-800">{tk?.subject}</p>
          <p className="text-xs text-slate-400 font-mono">{tk?.ticketNo} · <span className="capitalize">{tk?.status ? t(`support.status.${tk.status.toLowerCase()}`, { defaultValue: tk.status.toLowerCase() }) : ""}</span></p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        <PLoad q={q}>
          {(tk?.messages ?? []).map((m) => (
            <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
              {!m.mine && <div className="w-8 h-8 rounded-full bg-[#1B75BC] flex items-center justify-center text-white text-xs font-bold mr-2 self-end flex-shrink-0">BD</div>}
              <div className={cn("max-w-xs px-4 py-2.5 rounded-2xl text-sm", m.mine ? "bg-[#1B75BC] text-white rounded-br-sm" : "bg-slate-100 text-slate-700 rounded-bl-sm")}>
                {m.body}
                <p className={cn("text-xs mt-1", m.mine ? "text-white/60" : "text-slate-400")}>{iso2date(m.createdAt)}</p>
              </div>
            </div>
          ))}
        </PLoad>
      </div>
      <div className="flex items-center gap-2">
        <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("support.messagePlaceholder")}
          className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm focus:outline-none"/>
        <button type="button" onClick={send} disabled={add.isPending} className="p-2.5 bg-[#1B75BC] text-white rounded-xl disabled:opacity-50">
          {add.isPending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
        </button>
      </div>
    </div>
  );
}

function AgentSupport() {
  const { t } = useTranslation("portalAgent");
  const q = useAgentTickets();
  const rows = q.data ?? [];
  const [active, setActive] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const create = useCreateAgentTicket();

  const submit = async () => {
    if (subject.trim().length < 3 || !message.trim()) return;
    const tk = await create.mutateAsync({ subject: subject.trim(), message: message.trim() });
    setCreating(false); setSubject(""); setMessage(""); setActive(tk.id);
  };

  if (active) return <AgentTicketThread id={active} onBack={() => setActive(null)}/>;

  return (
    <div className="space-y-4" data-portal="support">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.support")}</h2>
        <button type="button" onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B75BC] text-white text-sm font-semibold rounded-xl whitespace-nowrap">
          <Plus size={14}/> {t("support.newTicket")}
        </button>
      </div>
      <div className="bg-[#1B75BC]/5 border border-[#1B75BC]/15 rounded-2xl p-4 flex items-center gap-3">
        <Phone size={16} className="text-[#1B75BC]"/>
        <div>
          <p className="text-sm font-semibold text-slate-800">{t("support.agentHotline")}</p>
          <p className="text-xs text-slate-500">{t("support.prioritySupport")}: <span className="text-[#1B75BC] font-bold">+880 31 123 4568</span></p>
        </div>
      </div>
      {creating && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[#1B75BC]/30 p-4 space-y-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("support.subject", { defaultValue: "Subject" })}
            className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder={t("support.messagePlaceholder")}
            className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none resize-none"/>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-xl text-slate-600">{t("common:actions.cancel", { defaultValue: "Cancel" })}</button>
            <button type="button" onClick={() => void submit()} disabled={create.isPending || subject.trim().length < 3 || !message.trim()}
              className="px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5">
              {create.isPending && <Loader2 size={13} className="animate-spin"/>}{t("support.create", { defaultValue: "Create" })}
            </button>
          </div>
        </div>
      )}
      <PLoad q={q}>
        {rows.length === 0 && !creating && <p className="text-sm text-slate-400 text-center py-6">{t("portalCommon:empty.nothing")}</p>}
        {rows.map((tk) => (
          <div key={tk.id} onClick={() => setActive(tk.id)}
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 pr-3">
                <p className="text-xs text-slate-400 font-mono mb-1">{tk.ticketNo}</p>
                <p className="font-semibold text-slate-800">{tk.subject}</p>
              </div>
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border flex-shrink-0",
                tk.status === "OPEN" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")}>
                {t(`support.status.${tk.status.toLowerCase()}`, { defaultValue: tk.status.toLowerCase() })}
              </span>
            </div>
            {tk.lastMessage && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{tk.lastMessage}</p>}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><MessageCircle size={11}/>{t("support.messagesCount", { count: tk.messageCount })}</span>
              <span>{iso2date(tk.createdAt)}</span>
            </div>
          </div>
        ))}
      </PLoad>
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function AgentProfile() {
  const { t } = useTranslation("portalAgent");
  const q = useAgentMe();
  const me = q.data;
  const initials = (me?.name ?? "").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="space-y-5" data-portal="profile">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.profileSettings")}</h2>
      <PLoad q={q}>
        {me && (<>
          <div className="bg-gradient-to-br from-[#1B75BC] to-[#0E4D7A] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)]/15 border-2 border-[#F15A24] flex items-center justify-center text-2xl font-black">{initials}</div>
              <div>
                <p className="text-xl font-bold" data-portal-name>{me.name}</p>
                <p className="text-white/70 text-sm mt-0.5 font-mono">{me.agentCode}</p>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F15A24] rounded-full mt-1.5 w-fit"><Star size={10} className="fill-white text-white"/><span className="text-xs font-bold text-white capitalize">{t("dashboard.tierLabel", { tier: me.tier.toLowerCase() })}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">{t("profile.personalInfo")}</p>
            {[
              { field:"Full Name",    label:t("profile.fullName"),         val:me.name },
              { field:"Phone",        label:t("portalCommon:labels.phone"),val:me.phone ?? "—" },
              { field:"Email",        label:t("portalCommon:labels.email"),val:me.email ?? "—" },
              { field:"NID Number",   label:t("profile.nid"),              val:me.nid ?? "—" },
              { field:"Trade License",label:t("profile.tradeLicense"),     val:me.tradeLicense ?? "—" },
            ].map(f=>(
              <div key={f.field}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
                <input value={f.val} disabled data-field={f.field} className="w-full px-3 py-2.5 text-sm rounded-xl border border-transparent bg-[var(--color-bg)] text-slate-700"/>
              </div>
            ))}
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">{t("profile.bankDetails")}</p>
            {[[t("profile.bankName"),me.bankName ?? "—"],[t("profile.accountNo"),me.accountNo ?? "—"],[t("profile.bkashNo"),me.bkashNo ?? "—"],[t("profile.nagadNo"),me.nagadNo ?? "—"]].map(([l,v])=>(
              <div key={l}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
                <div className="px-3 py-2.5 bg-[var(--color-bg)] rounded-xl"><span className="text-sm text-slate-700">{v}</span></div>
              </div>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50 whitespace-nowrap"><LogOut size={16}/> {t("common.signOut")}</button>
        </>)}
      </PLoad>
    </div>
  );
}

// ─── PORTAL SHELL ─────────────────────────────────────────────────────────────
export function AgentPortal() {
  const { t } = useTranslation("portalAgent");
  const { logout } = useAuth();
  const [view, setView] = useState<AgentView>("dashboard");
  const { data: me } = useAgentMe();
  const { data: dash } = useAgentDashboard();
  const { data: notifs } = useMyNotifications();
  const unreadNotif = (notifs ?? []).filter((n) => !n.read).length;
  const name = me?.name ?? t("common.agentFallback");
  const walletStr = fmtBDT2(dash?.walletBalance ?? 0);

  const go = (v: AgentView) => setView(v);

  const navItems: PortalNavItem[] = NAV.map((item) => ({ id: item.id, label: t(item.labelKey), icon: item.icon }));

  const headerExtra = (
    <div className="flex items-center gap-1 mr-1">
      <button
        type="button"
        onClick={() => go("wallet")}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl text-xs font-bold text-[var(--color-accent)] cursor-pointer hover:bg-[var(--color-accent)]/15 transition-colors"
      >
        <Wallet size={12}/> {walletStr}
      </button>
      <button
        type="button"
        onClick={() => go("notifications")}
        aria-label={t("portalCommon:nav.notifications")}
        className="relative p-2 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
      >
        <Bell size={18}/>
        {unreadNotif > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--color-danger)] text-white text-[10px] flex items-center justify-center rounded-full font-bold">
            {unreadNotif > 9 ? "9+" : unreadNotif}
          </span>
        )}
      </button>
    </div>
  );

  const renderView = () => {
    switch(view) {
      case "dashboard":     return <AgentDashboard onGo={go}/>;
      case "leads":         return <LeadsView/>;
      case "customers":     return <CustomersView/>;
      case "bookings":      return <AgentBookings/>;
      case "commissions":   return <CommissionsView/>;
      case "wallet":        return <WalletView/>;
      case "statements":    return <StatementsView/>;
      case "documents":     return <AgentDocumentsView/>;
      case "payments":      return <AgentPaymentsView/>;
      case "team":          return <TeamView/>;
      case "analytics":     return <AnalyticsView/>;
      case "support":       return <AgentSupport/>;
      case "notifications": return <AgentNotificationsView/>;
      case "profile":       return <AgentProfile/>;
    }
  };

  return (
    <PortalShell
      title={t("shell.agentPortal")}
      navItems={navItems}
      activeId={view}
      onNav={(id) => go(id as AgentView)}
      onLogout={() => void logout()}
      userName={name}
      headerExtra={headerExtra}
    >
      <div className="max-w-2xl mx-auto">
        {renderView()}
      </div>
    </PortalShell>
  );
}

export default AgentPortal;
