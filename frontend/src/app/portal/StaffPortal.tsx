import React, { useState } from "react";
import {
  LayoutDashboard, CheckSquare, Briefcase, Users, BarChart3,
  FolderOpen, Megaphone, LifeBuoy, Bell, User, LogOut,
  ChevronRight, ChevronDown, ChevronUp, Search, Plus, Eye,
  Check, X, Clock, AlertCircle, CheckCircle, Circle,
  Calendar, MapPin, Phone, Mail, Star, Edit2, Send,
  Paperclip, Download, Filter, ArrowRight, Info, Package,
  TrendingUp, TrendingDown, MoreHorizontal, Pin, Hash,
  FileText, RefreshCw, MessageSquare, Layers, Target,
} from "lucide-react";
import { cn } from "../lib/utils";
import { MobileDrawer, MobileBottomNav, FilterDrawer, FilterSection, ScrollTable } from "../lib/responsive";
import { EmptyState } from "../lib/ds";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useStaffMe, useStaffDashboard, useStaffTasks, useStaffBookings, useStaffCustomers,
  useStaffDocuments, useStaffAnnouncements, useSetTaskStatus, useCreateTask,
  type StaffTask,
} from "../hooks/portals";
import { useMyNotifications, useMarkAllNotificationsRead, relAge } from "../hooks/notifications";

const iso2date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");
function PLoad({ q, children }: { q: { isLoading: boolean; isError: boolean; error?: unknown }; children: React.ReactNode }) {
  const { t } = useTranslation("portalStaff");
  if (q.isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>;
  if (q.isError) return <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 text-center">{(q.error as Error)?.message || t("portalCommon:empty.failed")}</div>;
  return <>{children}</>;
}

type StaffView =
  | "dashboard" | "tasks" | "bookings" | "customers"
  | "reports" | "documents" | "announcements" | "support"
  | "notifications" | "profile";

const NAV: { id: StaffView; icon: React.ElementType; label: string; badge?: number }[] = [
  { id: "dashboard",     icon: LayoutDashboard, label: "portalCommon:nav.dashboard"      },
  { id: "tasks",         icon: CheckSquare,     label: "portalStaff:nav.dailyTasks",  badge: 4 },
  { id: "bookings",      icon: Briefcase,       label: "portalCommon:nav.bookings"       },
  { id: "customers",     icon: Users,           label: "portalCommon:nav.customers"      },
  { id: "reports",       icon: BarChart3,       label: "portalStaff:nav.myReports"       },
  { id: "documents",     icon: FolderOpen,      label: "portalCommon:nav.documents"      },
  { id: "announcements", icon: Megaphone,       label: "portalCommon:nav.announcements"  },
  { id: "support",       icon: LifeBuoy,        label: "portalCommon:nav.support"        },
  { id: "notifications", icon: Bell,            label: "portalCommon:nav.notifications" },
  { id: "profile",       icon: User,            label: "portalCommon:nav.profile"        },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtBDT = (n: number) => "৳" + n.toLocaleString("en-BD");

const PRIORITY_CFG: Record<string, { cls: string; dot: string; label: string }> = {
  HIGH:   { cls: "text-red-600 bg-red-50 border-red-200",        dot: "bg-red-500",    label: "High"   },
  MEDIUM: { cls: "text-amber-600 bg-amber-50 border-amber-200",  dot: "bg-amber-400",  label: "Medium" },
  LOW:    { cls: "text-slate-500 bg-slate-100 border-slate-200", dot: "bg-slate-400",  label: "Low"    },
};

const BK_STATUS: Record<string, { label: string; cls: string }> = {
  CONFIRMED:  { label: "Confirmed",  cls: "bg-blue-50 text-blue-700 border-blue-200"       },
  PROCESSING: { label: "Processing", cls: "bg-amber-50 text-amber-700 border-amber-200"    },
  COMPLETED:  { label: "Completed",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED:  { label: "Cancelled",  cls: "bg-red-50 text-red-600 border-red-200"          },
};
const bkCfg = (s: string) => BK_STATUS[s] ?? { label: s, cls: "bg-slate-100 text-slate-600 border-slate-200" };

function Chip({ label, cls }: { label: string; cls: string }) {
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", cls)}>{label}</span>;
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function StaffDashboard({ onGo }: { onGo: (v: StaffView) => void }) {
  const { t } = useTranslation("portalStaff");
  const q = useStaffDashboard();
  const d = q.data;
  return (
    <PLoad q={q}>
      {d && (
      <div className="space-y-5" data-portal="dashboard">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t("dashboard.eyebrow")}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5" data-portal-name>{t("dashboard.greeting", { name: d.staffName.split(" ")[0] })}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t("dashboard.branch")}: {d.branchName ?? "—"}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1B75BC] to-[#0E7C66] flex items-center justify-center text-white font-bold">{d.staffName.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label:t("dashboard.kpi.openTasks"), val: d.counts.openTasks, color:"bg-amber-500", Icon:CheckSquare },
            { label:t("dashboard.kpi.myBookings"), val: d.counts.assignedBookings, color:"bg-[#1B75BC]", Icon:Briefcase },
            { label:t("dashboard.kpi.branchCustomers"), val: d.counts.branchCustomers, color:"bg-[#0E7C66]", Icon:Users },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white mb-2", k.color)}><k.Icon size={15} /></div>
              <p className="text-2xl font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{k.val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="font-bold text-slate-800 mb-4">{t("dashboard.tasksByStatus")}</p>
          <div className="space-y-2">
            {d.tasksByStatus.length === 0 && <p className="text-sm text-slate-400">{t("portalCommon:empty.nothing")}</p>}
            {d.tasksByStatus.map(s => (
              <div key={s.status} className="flex items-center justify-between"><span className="text-sm text-slate-600 capitalize">{t(`taskStatus.${s.status.toLowerCase()}`, { defaultValue: s.status.toLowerCase().replace("_"," ") })}</span><span className="font-bold text-slate-800">{s.count}</span></div>
            ))}
          </div>
          <button onClick={() => onGo("tasks")} className="w-full mt-3 py-2 text-sm text-[#1B75BC] font-semibold hover:underline">{t("dashboard.viewAllTasks")}</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2"><Pin size={14} className="text-[#D64A12]" /><p className="font-bold text-slate-800">{t("dashboard.pinnedAnnouncements")}</p></div>
            <button onClick={() => onGo("announcements")} className="text-xs text-[#1B75BC] font-semibold hover:underline">{t("filters.all")}</button>
          </div>
          <div className="divide-y divide-slate-100">
            {d.pinnedAnnouncements.length === 0 && <p className="px-5 py-4 text-sm text-slate-400">{t("portalCommon:empty.nothing")}</p>}
            {d.pinnedAnnouncements.map(a => (
              <div key={a.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{a.title}</p><span className="text-xs text-slate-400 whitespace-nowrap">{iso2date(a.createdAt)}</span></div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </PLoad>
  );
}

// ─── DAILY TASKS ─────────────────────────────────────────────────────────────
function TasksView() {
  const { t } = useTranslation("portalStaff");
  const q = useStaffTasks();
  const tasks = q.data ?? [];
  const [filter, setFilter] = useState<"all"|"pending"|"done">("all");
  const [addModal, setAddModal] = useState(false);
  const [nTitle, setNTitle] = useState("");
  const [nPriority, setNPriority] = useState<"HIGH"|"MEDIUM"|"LOW">("MEDIUM");
  const [nDueAt, setNDueAt] = useState("");
  const [nCategory, setNCategory] = useState("Sales");
  const setStatus = useSetTaskStatus();
  const createTask = useCreateTask();

  const isDone = (t: StaffTask) => t.status === "DONE";
  const toggle = (t: StaffTask) => setStatus.mutate({ id: t.id, status: isDone(t) ? "TODO" : "DONE" });
  const shown = tasks.filter(t => filter === "all" ? true : filter === "pending" ? !isDone(t) : isDone(t));
  const save = () => createTask.mutate(
    { title: nTitle.trim(), priority: nPriority, category: nCategory, dueAt: nDueAt || undefined },
    { onSuccess: () => { setAddModal(false); setNTitle(""); setNDueAt(""); } },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t("nav.dailyTasks")}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {t("tasks.summary", { pending: tasks.filter(x=>!isDone(x)).length, completed: tasks.filter(isDone).length })}
          </p>
        </div>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1B75BC] text-white text-sm font-semibold rounded-xl hover:bg-[#14588F] whitespace-nowrap">
          <Plus size={14} /> {t("tasks.addTask")}
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {([["all",t("filters.all")],["pending",t("portalCommon:status.pending")],["done",t("tasks.done")]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
              filter === k ? "bg-[#1B75BC] text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-[#1B75BC]/30")}>
            {l}
          </button>
        ))}
      </div>

      {/* Tasks by priority */}
      <PLoad q={q}>
        {shown.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t("portalCommon:empty.nothing")}</p>}
        {(["HIGH","MEDIUM","LOW"] as const).map(priority => {
          const group = shown.filter(x => x.priority === priority);
          if (!group.length) return null;
          const cfg = PRIORITY_CFG[priority];
          const pLabel = t(`priority.${priority.toLowerCase()}`);
          return (
            <div key={priority}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{pLabel} {t("tasks.priority")}</p>
              </div>
              <div className="space-y-2">
                {group.map(task => (
                  <div key={task.id} className={cn("flex items-start gap-3 p-4 bg-white rounded-xl border transition-all",
                    isDone(task) ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-[#1B75BC]/20")}>
                    <button onClick={() => toggle(task)}
                      className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                        isDone(task) ? "border-emerald-500 bg-emerald-500" : "border-slate-300 hover:border-[#1B75BC]")}>
                      {isDone(task) && <Check size={11} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold", isDone(task) ? "line-through text-slate-400" : "text-slate-800")}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{iso2date(task.dueAt)}</span>
                        {task.category && <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{task.category}</span>}
                      </div>
                    </div>
                    <Chip label={pLabel} cls={cfg.cls} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </PLoad>

      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">{t("tasks.addTask")}</h3>
              <button onClick={() => setAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t("tasks.description")}</label>
              <input value={nTitle} onChange={e => setNTitle(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" placeholder={t("tasks.descriptionPlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t("tasks.priority")}</label>
                <select value={nPriority} onChange={e => setNPriority(e.target.value as "HIGH"|"MEDIUM"|"LOW")} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none">
                  <option value="HIGH">{t("priority.high")}</option><option value="MEDIUM">{t("priority.medium")}</option><option value="LOW">{t("priority.low")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t("tasks.dueDateTime")}</label>
                <input type="datetime-local" value={nDueAt} onChange={e => setNDueAt(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t("tasks.category")}</label>
              <select value={nCategory} onChange={e => setNCategory(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none">
                {["Sales","Visa","Operations","Hotel","Finance","Comm","Admin"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={save} disabled={createTask.isPending || nTitle.trim().length < 2}
              className="w-full py-3 bg-[#1B75BC] text-white font-semibold text-sm rounded-xl hover:bg-[#14588F] disabled:opacity-50">
              {createTask.isPending ? t("tasks.saving") : t("tasks.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────
function StaffBookings() {
  const { t } = useTranslation("portalStaff");
  const q = useStaffBookings();
  const bookings = q.data ?? [];
  const [search, setSearch] = useState("");
  const s = search.toLowerCase();
  const shown = bookings.filter(b => (b.customerName ?? "").toLowerCase().includes(s) || (b.bookingNo ?? "").toLowerCase().includes(s));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("bookings.title")}</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("placeholders.search")}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none w-48" />
        </div>
      </div>

      <PLoad q={q}>
        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:t("portalCommon:labels.total"),     val:bookings.length,                                   color:"text-slate-800" },
            { label:t("portalCommon:status.confirmed"), val:bookings.filter(b=>b.status==="CONFIRMED").length,  color:"text-blue-600" },
            { label:t("portalCommon:status.processing"),val:bookings.filter(b=>b.status==="PROCESSING").length, color:"text-amber-600"},
            { label:t("portalCommon:status.completed"), val:bookings.filter(b=>b.status==="COMPLETED").length,  color:"text-emerald-600"},
          ].map(st => (
            <div key={st.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <p className={cn("text-xl font-black", st.color)} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{st.val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{st.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[640px] md:min-w-0">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["portalStaff:bookings.cols.bookingId","portalStaff:bookings.cols.customer","portalStaff:bookings.cols.service","portalStaff:bookings.cols.departure","portalCommon:labels.amount","portalCommon:labels.status",""].map((h,hi) => (
                  <th key={hi} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h ? t(h) : ""}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">{t("portalCommon:empty.nothing")}</td></tr>
              )}
              {shown.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 text-xs font-mono text-slate-500">{b.bookingNo ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#1B75BC]/10 flex items-center justify-center text-[#1B75BC] text-xs font-bold">
                        {(b.customerName ?? "—").split(" ").map(n=>n[0]).slice(0,2).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{b.customerName ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{b.serviceType}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{iso2date(b.departureDate)}</td>
                  <td className="px-4 py-3.5 text-sm font-mono font-bold text-slate-800">{fmtBDT(b.baseAmount)}</td>
                  <td className="px-4 py-3.5"><Chip label={t(`portalCommon:status.${b.status.toLowerCase()}`, { defaultValue: bkCfg(b.status).label })} cls={bkCfg(b.status).cls} /></td>
                  <td className="px-4 py-3.5">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PLoad>
    </div>
  );
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
function StaffCustomers() {
  const { t } = useTranslation("portalStaff");
  const q = useStaffCustomers();
  const customers = q.data ?? [];
  const [search, setSearch] = useState("");
  const s = search.toLowerCase();
  const shown = customers.filter(c => c.name.toLowerCase().includes(s) || c.phone.toLowerCase().includes(s));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.customers")}</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("placeholders.searchCustomers")} className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none w-52" />
        </div>
      </div>
      <PLoad q={q}>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[640px] md:min-w-0">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["portalStaff:customers.cols.customer","portalStaff:customers.cols.contact","portalStaff:customers.cols.since","portalCommon:nav.bookings",""].map((h,hi) => (
                  <th key={hi} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h ? t(h) : ""}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">{t("portalCommon:empty.nothing")}</td></tr>
              )}
              {shown.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold bg-[#1B75BC]/10 text-[#1B75BC]">
                        {c.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{c.phone}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{iso2date(c.createdAt)}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-slate-700">{c.bookings}</td>
                  <td className="px-4 py-3.5">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PLoad>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function StaffReports() {
  const { t } = useTranslation("portalStaff");
  const dashQ = useStaffDashboard();
  const bookingsQ = useStaffBookings();
  const d = dashQ.data;
  const bookings = bookingsQ.data ?? [];
  const completed = bookings.filter(b => b.status === "COMPLETED").length;
  const doneTasks = d?.tasksByStatus.find(s => s.status === "DONE")?.count ?? 0;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.myReports")}</h2>

      <PLoad q={dashQ}>
        {d && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("reports.kpi.bookings"), val: String(d.counts.assignedBookings) },
              { label: t("reports.kpi.tasksDone"), val: String(doneTasks) },
              { label: t("reports.kpi.customersServed"), val: String(d.counts.branchCustomers) },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-2xl font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </PLoad>

      <PLoad q={bookingsQ}>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="font-bold text-slate-800 mb-3">{t("reports.bookingsClosed")}</p>
          <p className="text-sm text-slate-600">
            {completed} of {bookings.length} assigned bookings completed.
          </p>
        </div>
      </PLoad>

      <div className="flex items-start gap-3 p-5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl">
        <Info size={18} className="text-[#2563EB] flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-sm font-semibold text-slate-800">Use ERP Reports for full analytics</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Detailed sales, branch, and financial reports are available in the main ERP under Reports. This portal view shows your personal activity summary only.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
function StaffDocuments() {
  const { t } = useTranslation("portalStaff");
  const q = useStaffDocuments();
  const docs = q.data ?? [];
  const [search, setSearch] = useState("");
  const shown = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.documents")}</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("placeholders.searchDocs")}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none w-44" />
        </div>
      </div>

      <PLoad q={q}>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[640px] md:min-w-0">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["portalStaff:documents.cols.document","portalCommon:labels.type","portalCommon:labels.status","portalStaff:documents.cols.updated",""].map((h,hi) => (
                  <th key={hi} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h ? t(h) : ""}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">{t("portalCommon:empty.nothing")}</td></tr>
              )}
              {shown.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-9 bg-red-100 border border-red-200 rounded-lg flex items-center justify-center text-red-600 text-xs font-bold"><FileText size={14}/></div>
                      <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">{d.type}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">{d.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">{iso2date(d.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <button className="flex items-center gap-1 text-xs text-[#1B75BC] font-semibold hover:underline whitespace-nowrap">
                      <Download size={12}/> {t("common:actions.download")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PLoad>
    </div>
  );
}

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
function StaffAnnouncements() {
  const { t } = useTranslation("portalStaff");
  const q = useStaffAnnouncements();
  const announcements = q.data ?? [];
  const [expanded, setExpanded] = useState<string|null>(null);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.announcements")}</h2>
      <PLoad q={q}>
        <div className="space-y-3">
          {announcements.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t("portalCommon:empty.nothing")}</p>}
          {announcements.map(a => (
            <div key={a.id} className={cn("bg-white rounded-2xl border overflow-hidden",
              a.pinned ? "border-[#F15A24]/40" : "border-slate-200")}>
              <button className="w-full flex items-start gap-3 p-5 text-left" onClick={() => setExpanded(expanded===a.id?null:a.id)}>
                {a.pinned && <Pin size={14} className="text-[#D64A12] flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-slate-800">{a.title}</p>
                    {a.pinned && <span className="text-xs px-2 py-0.5 bg-[#F15A24]/15 text-[#D64A12] rounded-full font-bold border border-[#F15A24]/30">{t("announcements.pinned")}</span>}
                  </div>
                  <p className="text-xs text-slate-400">{iso2date(a.createdAt)}</p>
                </div>
                {expanded===a.id ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
              </button>
              {expanded===a.id && (
                <div className="px-5 pb-5 border-t border-slate-100">
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">{a.body}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── SUPPORT ─────────────────────────────────────────────────────────────────
function StaffSupport() {
  const { t } = useTranslation("portalStaff");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">{t("support.title")}</h2>
      <div className="bg-white rounded-2xl border border-slate-200">
        <EmptyState variant="no-data" title="Support" desc="Your support conversations will appear here." />
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function StaffNotifications() {
  const { t } = useTranslation("portalStaff");
  const q = useMyNotifications();
  const markAll = useMarkAllNotificationsRead();
  const list = q.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.notifications")}</h2>
        <button onClick={() => markAll.mutate()} disabled={markAll.isPending || list.every(n => n.read)}
          className="text-sm text-[#1B75BC] font-semibold hover:underline whitespace-nowrap disabled:opacity-50">{t("notifications.markAllRead")}</button>
      </div>
      <PLoad q={q}>
        {list.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t("portalCommon:empty.nothing")}</p>}
        <div className="space-y-2.5">
          {list.map(n => {
            const color = n.color || "#1B75BC";
            return (
              <div key={n.id}
                className={cn("flex items-start gap-3 p-4 rounded-2xl border transition-all",
                  n.read ? "bg-white border-slate-200" : "bg-[#1B75BC]/3 border-[#1B75BC]/15")}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{n.title}</p>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-[#1B75BC] flex-shrink-0" />}
                  </div>
                  {n.body && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>}
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap mt-0.5">{relAge(n.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </PLoad>
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function StaffProfile() {
  const { t } = useTranslation("portalStaff");
  const q = useStaffMe();
  const me = q.data;
  const initials = (me?.name ?? "").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="space-y-5" data-portal="profile">
      <h2 className="text-xl font-bold text-slate-800">{t("profile.title")}</h2>
      <PLoad q={q}>
        {me && (<>
          <div className="bg-gradient-to-br from-[#1B75BC] to-[#1a4a8a] rounded-2xl p-5 text-white flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-black flex-shrink-0">{initials}</div>
            <div>
              <p className="text-xl font-bold" data-portal-name>{me.name}</p>
              <p className="text-white/70 text-sm mt-0.5">{me.department ?? t("roles.staff")} · {me.branchName ?? "—"}</p>
              <p className="text-white/60 text-xs mt-1 font-mono">{me.employeeId ?? ""}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">{t("profile.personalInfo")}</p>
            {[
              [t("profile.fullName"),me.name],[t("profile.employeeId"),me.employeeId ?? "—"],[t("profile.department"),me.department ?? "—"],
              [t("profile.branch"),me.branchName ?? "—"],[t("portalCommon:labels.phone"),me.phone ?? "—"],[t("portalCommon:labels.email"),me.email],[t("profile.nid"),me.nid ?? "—"],
            ].map(([l,v]) => (
              <div key={l}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
                <input value={v} disabled data-field={l} className="w-full px-3 py-2.5 text-sm rounded-xl border border-transparent bg-slate-50 text-slate-700"/>
              </div>
            ))}
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50"><LogOut size={16}/> {t("portalCommon:nav.logout")}</button>
        </>)}
      </PLoad>
    </div>
  );
}

// ─── Sidebar inner component (shared desktop + drawer) ───────────────────────
function StaffSidebar({ view, go, onClose, unreadNotif }: { view: StaffView; go: (v: StaffView) => void; onClose?: () => void; unreadNotif: number }) {
  const { t } = useTranslation("portalStaff");
  const { data: me } = useStaffMe();
  const sName = me?.name ?? t("roles.staff");
  const sInit = sName.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <aside className="w-56 bg-[#17456B] flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-black">SM</div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">SM Travels International</p>
            <p className="text-white/50 text-xs">{t("brand.portal")}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={16}/></button>
        )}
      </div>
      <div className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/8">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{sInit}</div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate" data-portal-name>{sName}</p>
            <p className="text-white/50 text-xs truncate">{me?.department ?? t("roles.staff")}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2 overflow-y-auto no-scrollbar space-y-0.5">
        {NAV.map(item => (
          <button key={item.id} onClick={() => { go(item.id); onClose?.(); }}
            className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
              view === item.id
                ? "bg-white/15 text-white font-semibold"
                : "text-white/60 hover:text-white hover:bg-white/8")}
            style={{ minHeight: 44 }}>
            <item.icon size={16} />
            <span className="flex-1 text-left">{t(item.label)}</span>
            {(item.id === "notifications" ? unreadNotif : item.badge) ? (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {item.id === "notifications" ? unreadNotif : item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 w-full px-3 py-2 rounded-xl hover:bg-white/5"
          style={{ minHeight: 44 }}>
          <LogOut size={14}/> {t("portalCommon:nav.logout")}
        </button>
      </div>
    </aside>
  );
}

// Mobile bottom nav items
const STAFF_BOTTOM_NAV = [
  { id: "dashboard"     as StaffView, icon: LayoutDashboard, label: "portalStaff:bottomNav.home" },
  { id: "tasks"         as StaffView, icon: CheckSquare,     label: "portalCommon:nav.tasks",  badge: 4 },
  { id: "bookings"      as StaffView, icon: Briefcase,       label: "portalCommon:nav.bookings" },
  { id: "notifications" as StaffView, icon: Bell,            label: "portalStaff:bottomNav.alerts" },
  { id: "profile"       as StaffView, icon: User,            label: "portalCommon:nav.profile"  },
];

// ─── SHELL ────────────────────────────────────────────────────────────────────
export function StaffPortal() {
  const { t } = useTranslation("portalStaff");
  const [view, setView] = useState<StaffView>("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const go = (v: StaffView) => setView(v);
  const notifQ = useMyNotifications();
  const unreadNotif = (notifQ.data ?? []).filter(n => !n.read).length;

  const render = () => {
    switch (view) {
      case "dashboard":     return <StaffDashboard onGo={go} />;
      case "tasks":         return <TasksView />;
      case "bookings":      return <StaffBookings />;
      case "customers":     return <StaffCustomers />;
      case "reports":       return <StaffReports />;
      case "documents":     return <StaffDocuments />;
      case "announcements": return <StaffAnnouncements />;
      case "support":       return <StaffSupport />;
      case "notifications": return <StaffNotifications />;
      case "profile":       return <StaffProfile />;
    }
  };

  const currentLabel = t(NAV.find(n => n.id === view)?.label ?? "");

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* ── Desktop layout ── */}
      <div className="hidden md:flex h-screen overflow-hidden">
        <StaffSidebar view={view} go={go} unreadNotif={unreadNotif} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0 h-14">
            <p className="text-sm font-semibold text-slate-600">{currentLabel}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => go("notifications")} className="relative p-2 hover:bg-slate-100 rounded-xl">
                <Bell size={17} className="text-slate-500" />
                {unreadNotif > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold">
                    {unreadNotif}
                  </span>
                )}
              </button>
              <button onClick={() => go("profile")} className="w-7 h-7 rounded-full bg-[#1B75BC]/15 flex items-center justify-center text-[#1B75BC] text-xs font-bold">
                RI
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">{render()}</div>
          </main>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile drawer */}
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="w-56">
          <StaffSidebar view={view} go={go} onClose={() => setDrawerOpen(false)} unreadNotif={unreadNotif} />
        </MobileDrawer>

        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ minWidth: 44 }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#1B75BC] flex items-center justify-center text-white text-xs font-black">SM</div>
            </button>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">{currentLabel}</p>
              <p className="text-xs text-slate-400">Rafiqul Islam · Staff</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => go("notifications")} className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100">
              <Bell size={18} className="text-slate-500" />
              {unreadNotif > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold">
                  {unreadNotif}
                </span>
              )}
            </button>
            <button onClick={() => go("profile")}
              className="w-8 h-8 rounded-full bg-[#1B75BC]/15 flex items-center justify-center text-[#1B75BC] text-xs font-bold">
              RI
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          {render()}
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav
          items={STAFF_BOTTOM_NAV.map(i => ({
            ...i,
            label: t(i.label),
            badge: i.id === "notifications" && unreadNotif > 0 ? unreadNotif : i.badge,
          }))}
          active={view}
          onChange={go}
        />
      </div>
    </div>
  );
}

export default StaffPortal;
