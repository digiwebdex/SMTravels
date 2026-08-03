import React, { useState } from "react";
import {
  LayoutDashboard, Inbox, Package, FileText, CreditCard,
  BookOpen, BarChart3, MessageSquare, LifeBuoy, User,
  LogOut, ChevronRight, ChevronDown, ChevronUp, Search,
  Filter, Download, Eye, Check, X, Clock, AlertCircle,
  CheckCircle, Plus, Send, Paperclip, Bell, Copy,
  ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown,
  Calendar, MapPin, Phone, Mail, Globe, Building2, Star,
  MoreHorizontal, Layers, Shield, Info, RefreshCw,
  CircleDollarSign, Banknote, Upload, ExternalLink, Hash,
} from "lucide-react";
import { cn } from "../lib/utils";
import { EmptyState } from "../lib/ds";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSupplierMe, useSupplierDashboard, useSupplierInvoices, useSupplierPayables, useSupplierPayments, useSupplierRequests, useSupplierServices, useSetRequestStatus } from "../hooks/portals";

const fmtBDT2 = (n: number) => "৳ " + Number(n || 0).toLocaleString("en-BD");
const iso2date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
function PLoad({ q, children }: { q: { isLoading: boolean; isError: boolean; error?: unknown }; children: React.ReactNode }) {
  const { t } = useTranslation("portalSupplier");
  if (q.isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>;
  if (q.isError) return <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 text-center">{(q.error as Error)?.message || t("portalCommon:empty.failed")}</div>;
  return <>{children}</>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type SupView =
  | "dashboard" | "requests" | "services" | "invoices"
  | "payments" | "statements" | "reports" | "messages"
  | "support" | "profile";

// ─── Nav ─────────────────────────────────────────────────────────────────────
const NAV: { id: SupView; icon: React.ElementType; label: string; badge?: number }[] = [
  { id: "dashboard",  icon: LayoutDashboard, label: "portalCommon:nav.dashboard"           },
  { id: "requests",   icon: Inbox,           label: "portalSupplier:nav.bookingRequests"   },
  { id: "services",   icon: Package,         label: "portalSupplier:nav.myServices"        },
  { id: "invoices",   icon: FileText,        label: "portalCommon:nav.invoices"            },
  { id: "payments",   icon: CreditCard,      label: "portalCommon:nav.payments"            },
  { id: "statements", icon: BookOpen,        label: "portalCommon:nav.statements"          },
  { id: "reports",    icon: BarChart3,       label: "portalCommon:nav.reports"             },
  { id: "messages",   icon: MessageSquare,   label: "portalSupplier:nav.messages" },
  { id: "support",    icon: LifeBuoy,        label: "portalCommon:nav.support"             },
  { id: "profile",    icon: User,            label: "portalSupplier:nav.profileSettings"   },
];

const BOTTOM_NAV: { id: SupView; icon: React.ElementType; label: string }[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "portalSupplier:bottomNav.home" },
  { id: "requests",  icon: Inbox,           label: "portalCommon:nav.requests"     },
  { id: "invoices",  icon: FileText,        label: "portalCommon:nav.invoices"     },
  { id: "payments",  icon: CreditCard,      label: "portalCommon:nav.payments"     },
  { id: "profile",   icon: User,            label: "portalCommon:nav.profile"      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtBDT  = (n: number) => "৳ " + n.toLocaleString("en-BD");
const fmtShort = (n: number) =>
  n >= 100000 ? "৳" + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + "L" : "৳" + n.toLocaleString();

const REQ_STATUS: Record<string, { label: string; chip: string; dot: string }> = {
  pending:   { label: "Pending",   chip: "bg-amber-50 text-amber-700 border-amber-200",      dot: "bg-amber-400"  },
  confirmed: { label: "Confirmed", chip: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500"   },
  completed: { label: "Completed", chip: "bg-emerald-50 text-emerald-700 border-emerald-200",dot: "bg-emerald-500"},
  cancelled: { label: "Cancelled", chip: "bg-red-50 text-red-600 border-red-200",            dot: "bg-red-400"    },
};

const INV_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Unpaid",  cls: "bg-amber-50 text-amber-700 border-amber-200"      },
  paid:    { label: "Paid",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue: { label: "Overdue", cls: "bg-red-50 text-red-600 border-red-200"            },
};

function SChip({ status, map }: { status: string; map: Record<string,{ label:string; chip:string }|{ label:string; cls:string }> }) {
  const { t } = useTranslation("portalCommon");
  const s = map[status] as any;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", s?.chip ?? s?.cls)}>
      {t(`status.${status}`, { defaultValue: s?.label ?? status })}
    </span>
  );
}

function KpiCard({ label, value, sub, icon: Icon, accent, delta, up }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent: string; delta?: string; up?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accent)}>
          <Icon size={16} className="text-white" />
        </div>
        {delta && (
          <span className={cn("text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md",
            up ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50")}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{delta}
          </span>
        )}
      </div>
      <p className="text-xl font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{value}</p>
      <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function SupDashboard({ onGo }: { onGo: (v: SupView) => void }) {
  const { t } = useTranslation("portalSupplier");
  const q = useSupplierDashboard();
  const d = q.data;
  return (
    <PLoad q={q}>
      {d && (
      <div className="space-y-5" data-portal="dashboard">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">{t("dashboard.eyebrow")}</p>
              <h2 className="text-xl font-bold text-slate-800" data-portal-name>{d.supplierName}</h2>
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 capitalize"><CheckCircle size={10} /> {t(`portalCommon:status.${d.status.toLowerCase()}`, { defaultValue: d.status.toLowerCase() })}</span>
              </p>
            </div>
            <span className="text-xs text-slate-400">{t("dashboard.rating")}: <span className="text-amber-500 font-bold">{d.rating ?? "—"} ★</span></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KpiCard label={t("dashboard.kpi.pendingRequests")} value={String(d.counts.pendingRequests)} sub={t("dashboard.kpi.pendingRequestsSub")} icon={Inbox} accent="bg-amber-500" />
          <KpiCard label={t("dashboard.kpi.myServices")} value={String(d.counts.services)} sub={t("dashboard.kpi.myServicesSub")} icon={CheckCircle} accent="bg-blue-600" />
          <KpiCard label={t("dashboard.kpi.unpaidInvoices")} value={String(d.counts.unpaidInvoices)} sub={t("dashboard.kpi.unpaidInvoicesSub")} icon={FileText} accent="bg-red-500" />
          <KpiCard label={t("dashboard.kpi.outstanding")} value={fmtShort(d.outstanding)} sub={t("dashboard.kpi.outstandingSub")} icon={CircleDollarSign} accent="bg-emerald-600" />
        </div>

        {d.recentRequests.filter(r => r.status === "PENDING").length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><AlertCircle size={16} className="text-amber-500" /><p className="font-semibold text-amber-800 text-sm">{t("dashboard.actionRequired")}</p></div>
              <button onClick={() => onGo("requests")} className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1">{t("common:actions.viewAll")} <ChevronRight size={12} /></button>
            </div>
            {d.recentRequests.filter(r => r.status === "PENDING").map(r => (
              <div key={r.id} className="flex items-center justify-between py-2.5 border-t border-amber-200 first:border-0">
                <div><p className="text-sm font-semibold text-slate-800">{r.clientLabel || r.serviceLabel}</p><p className="text-xs text-slate-500">{r.requestNo} · {fmtBDT2(r.amount)}</p></div>
                <button onClick={() => onGo("requests")} className="px-3 py-1.5 bg-[#1B75BC] text-white text-xs font-semibold rounded-lg hover:bg-[#14588F]">{t("dashboard.review")}</button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="font-bold text-slate-800 mb-3">{t("labels.totalInvoiced")}</p>
          <p className="text-3xl font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(d.totalInvoiced)}</p>
          <p className="text-xs text-slate-400 mt-1">{t("dashboard.outstandingPayables", { amount: fmtBDT2(d.outstanding) })}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Inbox, label: "portalCommon:nav.requests", color: "bg-amber-50 text-amber-600", v: "requests" as SupView },
            { icon: FileText, label: "portalCommon:nav.invoices", color: "bg-[#1B75BC]/10 text-[#1B75BC]", v: "invoices" as SupView },
          ].map(l => (
            <button key={l.label} onClick={() => onGo(l.v)} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#1B75BC]/30 hover:shadow-sm transition-all group text-left">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", l.color)}><l.icon size={16} /></div>
              <span className="text-sm font-semibold text-slate-700">{t(l.label)}</span>
              <ChevronRight size={13} className="ml-auto text-slate-300 group-hover:text-[#1B75BC]" />
            </button>
          ))}
        </div>
      </div>
      )}
    </PLoad>
  );
}

// ─── BOOKING REQUESTS ─────────────────────────────────────────────────────────
function RequestsView() {
  const { t } = useTranslation("portalSupplier");
  const q = useSupplierRequests();
  const rows = q.data ?? [];
  const mut = useSetRequestStatus();
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: string; requestNo: string; action: "accept" | "reject" } | null>(null);
  const [reason, setReason] = useState("");

  const shown = rows.filter(r => filter === "all" || r.status.toLowerCase() === filter);
  const counts: Record<string, number> = {};
  rows.forEach(r => { const k = r.status.toLowerCase(); counts[k] = (counts[k] ?? 0) + 1; });

  const detailReq = rows.find(r => r.id === detail);

  const closeModal = () => { setConfirmModal(null); setReason(""); };
  const submit = () => {
    if (!confirmModal || mut.isPending) return;
    mut.mutate({ id: confirmModal.id, action: confirmModal.action, reason: confirmModal.action === "reject" && reason.trim() ? reason.trim() : undefined });
    closeModal();
    setDetail(null);
  };

  const modal = confirmModal && (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto",
          confirmModal.action === "accept" ? "bg-emerald-100" : "bg-red-100")}>
          {confirmModal.action === "accept"
            ? <Check size={28} className="text-emerald-600" />
            : <X size={28} className="text-red-500" />}
        </div>
        <div className="text-center">
          <h3 className="font-bold text-slate-800 text-lg">
            {confirmModal.action === "accept" ? t("requests.acceptTitle") : t("requests.declineTitle")}
          </h3>
          <p className="text-sm text-slate-500 mt-1">{confirmModal.requestNo}</p>
        </div>
        {confirmModal.action === "reject" && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("requests.reasonLabel")}</label>
            <textarea rows={3} placeholder={t("requests.reasonPlaceholder")}
              value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={closeModal}
            className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-600 text-sm font-medium hover:bg-slate-50">
            {t("common:actions.cancel")}
          </button>
          <button onClick={submit} disabled={mut.isPending}
            className={cn("flex-1 py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-60",
              confirmModal.action === "accept" ? "bg-[#1B75BC] hover:bg-[#14588F]" : "bg-red-500 hover:bg-red-600")}>
            {confirmModal.action === "accept" ? t("requests.confirm") : t("requests.decline")}
          </button>
        </div>
      </div>
    </div>
  );

  if (detailReq) return (
    <div className="space-y-5">
      <button onClick={() => setDetail(null)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ChevronRight size={14} className="rotate-180" /> {t("requests.back")}
      </button>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-mono">{detailReq.requestNo}</p>
          <h2 className="text-xl font-bold text-slate-800 mt-0.5">{detailReq.serviceLabel ?? t("requests.bookingRequest")}</h2>
        </div>
        <SChip status={detailReq.status.toLowerCase()} map={REQ_STATUS as any} />
      </div>

      {/* Detail grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <p className="font-semibold text-slate-700 text-sm">{t("requests.detailsTitle")}</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: t("requests.requestNo"), val: detailReq.requestNo             },
            { label: t("requests.client"),    val: detailReq.clientLabel ?? "—"    },
            { label: t("requests.service"),   val: detailReq.serviceLabel ?? "—"   },
            { label: t("requests.received"),  val: iso2date(detailReq.createdAt)   },
          ].map(f => (
            <div key={f.label}>
              <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
              <p className="text-sm font-semibold text-slate-800">{f.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">{t("requests.serviceAmount")}</p>
            <p className="text-3xl font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT(detailReq.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{t("requests.responseDeadline")}</p>
            <p className="text-sm font-bold text-red-500">{iso2date(detailReq.deadline)}</p>
          </div>
        </div>
      </div>

      {detailReq.status === "PENDING" && (
        <div className="flex gap-3">
          <button onClick={() => setConfirmModal({ id: detailReq.id, requestNo: detailReq.requestNo, action: "reject" })}
            className="flex-1 py-3.5 border-2 border-red-200 text-red-500 font-bold text-sm rounded-2xl hover:bg-red-50 flex items-center justify-center gap-2 whitespace-nowrap">
            <X size={16} /> {t("requests.decline")}
          </button>
          <button onClick={() => setConfirmModal({ id: detailReq.id, requestNo: detailReq.requestNo, action: "accept" })}
            className="flex-1 py-3.5 bg-[#1B75BC] text-white font-bold text-sm rounded-2xl hover:bg-[#14588F] flex items-center justify-center gap-2 whitespace-nowrap">
            <Check size={16} /> {t("requests.acceptConfirm")}
          </button>
        </div>
      )}

      {modal}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.bookingRequests")}</h2>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[["all", t("filters.all")], ["pending", t("portalCommon:status.pending")], ["confirmed", t("portalCommon:status.confirmed")], ["completed", t("portalCommon:status.completed")], ["cancelled", t("portalCommon:status.cancelled")]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0",
              filter === k ? "bg-[#1B75BC] text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-[#1B75BC]/30")}>
            {l}
            {k !== "all" && counts[k] ? (
              <span className={cn("w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold",
                filter === k ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                {counts[k]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Request cards */}
      <PLoad q={q}>
        <div className="space-y-3">
          {shown.length === 0 && <p className="text-sm text-slate-400 text-center py-4">{t("portalCommon:empty.nothing")}</p>}
          {shown.map(r => (
            <div key={r.id} className={cn("bg-white rounded-2xl border overflow-hidden transition-all",
              r.status === "PENDING" ? "border-amber-300 shadow-sm shadow-amber-100" : "border-slate-200")}>
              {r.status === "PENDING" && r.deadline && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
                  <Clock size={12} className="text-amber-500" />
                  <p className="text-xs font-semibold text-amber-700">{t("requests.responseNeededBy", { date: iso2date(r.deadline) })}</p>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs text-slate-400 font-mono mb-0.5">{r.requestNo}</p>
                    <p className="font-bold text-slate-800">{r.clientLabel || r.serviceLabel || t("requests.bookingRequest")}</p>
                    {r.clientLabel && r.serviceLabel && <p className="text-xs text-slate-500 mt-0.5">{r.serviceLabel}</p>}
                  </div>
                  <SChip status={r.status.toLowerCase()} map={REQ_STATUS as any} />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: t("requests.received"), val: iso2date(r.createdAt) },
                    { label: t("requests.deadline"), val: iso2date(r.deadline)  },
                    { label: t("portalCommon:labels.amount"), val: fmtShort(r.amount) },
                  ].map(f => (
                    <div key={f.label} className="bg-slate-50 rounded-xl p-2.5">
                      <p className="text-xs text-slate-400">{f.label}</p>
                      <p className="text-sm font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{f.val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDetail(r.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 whitespace-nowrap">
                    <Eye size={12} /> {t("common:actions.viewDetails")}
                  </button>
                  {r.status === "PENDING" && (
                    <>
                      <button onClick={() => setConfirmModal({ id: r.id, requestNo: r.requestNo, action: "reject" })}
                        className="py-2 px-3 text-xs font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 whitespace-nowrap">
                        {t("requests.decline")}
                      </button>
                      <button onClick={() => setConfirmModal({ id: r.id, requestNo: r.requestNo, action: "accept" })}
                        className="py-2 px-3 text-xs font-semibold bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] whitespace-nowrap">
                        {t("requests.accept")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PLoad>

      {modal}
    </div>
  );
}

// ─── MY SERVICES ──────────────────────────────────────────────────────────────
function ServicesView() {
  const { t } = useTranslation("portalSupplier");
  const q = useSupplierServices();
  const rows = q.data ?? [];

  return (
    <div className="space-y-4" data-portal="services">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.myServices")}</h2>

      <PLoad q={q}>
        <div className="space-y-3">
          {rows.length === 0 && <p className="text-sm text-slate-400 text-center py-4">{t("portalCommon:empty.nothing")}</p>}
          {rows.map(svc => (
            <div key={svc.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B75BC]/8 flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-[#1B75BC]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 leading-tight">{svc.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{svc.category ?? "—"}</p>
                    </div>
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0",
                      svc.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200")}>
                      {svc.active ? t("portalCommon:status.active") : t("portalCommon:status.inactive")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-lg">{svc.price != null ? fmtBDT(svc.price) : "—"}</span>
                    <span className="text-xs text-slate-500">{t("services.bookingsCount", { count: svc.bookingsCount })}</span>
                    {svc.rating != null && (
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                        <Star size={11} className="fill-amber-400" />{svc.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────
function InvoicesView() {
  const { t } = useTranslation("portalSupplier");
  const q = useSupplierInvoices();
  const rows = q.data ?? [];
  return (
    <div className="space-y-4" data-portal="invoices">
      <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.invoices")}</h2>
      <PLoad q={q}>
        <div className="grid grid-cols-3 gap-3">
          {[[t("labels.totalInvoiced"), fmtBDT2(rows.reduce((s,i)=>s+i.amount,0)), "text-slate-800"],[t("portalCommon:labels.paid"), fmtBDT2(rows.filter(i=>i.status==="paid").reduce((s,i)=>s+i.amount,0)), "text-emerald-600"],[t("labels.outstanding"), fmtBDT2(rows.filter(i=>i.status!=="paid").reduce((s,i)=>s+i.amount,0)), "text-red-500"]].map(([l,v,c])=>(
            <div key={l} className="bg-white border border-slate-200 rounded-2xl p-3 text-center"><p className={cn("text-base font-black", c)} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{v}</p><p className="text-xs text-slate-400 mt-0.5">{l}</p></div>
          ))}
        </div>
        <div className="space-y-3">
          {rows.length===0 && <p className="text-sm text-slate-400 text-center py-4">{t("portalCommon:empty.nothing")}</p>}
          {rows.map(inv=>(
            <div key={inv.id} className={cn("bg-white rounded-2xl border overflow-hidden", inv.status!=="paid" ? "border-amber-300" : "border-slate-200")}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
                <div><p className="text-xs text-slate-400 font-mono mb-0.5">{inv.invoiceNo}</p><p className="font-bold text-slate-800">{inv.description || t("labels.invoice")}</p></div>
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border capitalize", inv.status==="paid"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-amber-50 text-amber-700 border-amber-200")}>{t(`portalCommon:status.${inv.status}`, { defaultValue: inv.status })}</span>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div><p className="text-xs text-slate-400">{t("portalCommon:labels.amount")}</p><p className="text-xl font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(inv.amount)}</p></div>
                <div className="text-right"><p className="text-xs text-slate-400">{t("labels.issuedDue")}</p><p className="text-sm font-semibold text-slate-600">{inv.issueDate ? iso2date(inv.issueDate) : "—"} → {inv.dueDate ? iso2date(inv.dueDate) : "—"}</p></div>
              </div>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
function PaymentsView() {
  const { t } = useTranslation("portalSupplier");
  const q = useSupplierPayments();
  const rows = q.data ?? [];
  return (
    <div className="space-y-4" data-portal="payments">
      <h2 className="text-xl font-bold text-slate-800">{t("payments.title")}</h2>
      <PLoad q={q}>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">{t("labels.totalReceived")}</p>
          <p className="text-2xl font-black text-emerald-600" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(rows.reduce((s,p)=>s+p.amount,0))}</p>
        </div>
        <div className="space-y-2.5">
          {rows.length===0 && <p className="text-sm text-slate-400 text-center py-4">{t("portalCommon:empty.nothing")}</p>}
          {rows.map(p=>(
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div><p className="text-sm font-semibold text-slate-800 font-mono">{p.receiptNo || "—"}</p><p className="text-xs text-slate-400 mt-0.5">{p.method.replace(/_/g," ")} · {iso2date(p.paidAt)}</p></div>
              <p className="font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(p.amount)}</p>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── STATEMENTS ───────────────────────────────────────────────────────────────
function StatementsView() {
  const { t } = useTranslation("portalSupplier");
  const iq = useSupplierInvoices();
  const pq = useSupplierPayables();
  const invoiced = (iq.data ?? []).reduce((s,i)=>s+i.amount,0);
  const paidInv = (iq.data ?? []).filter(i=>i.status==="paid").reduce((s,i)=>s+i.amount,0);
  const owedToUs = (pq.data ?? []).reduce((s,p)=>s+p.dueAmount,0);
  return (
    <div className="space-y-4" data-portal="statements">
      <h2 className="text-xl font-bold text-slate-800">{t("statements.title")}</h2>
      <PLoad q={{ isLoading: iq.isLoading||pq.isLoading, isError: iq.isError||pq.isError, error: iq.error||pq.error }}>
        <div className="grid grid-cols-3 gap-3">
          {[[t("labels.totalInvoiced"), fmtBDT2(invoiced), "text-slate-800"],[t("statements.paidToYou"), fmtBDT2(paidInv), "text-emerald-600"],[t("statements.outstandingPayables"), fmtBDT2(owedToUs), "text-red-500"]].map(([l,v,c])=>(
            <div key={l} className="bg-white border border-slate-200 rounded-2xl p-4 text-center"><p className={cn("text-base font-black", c)} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{v}</p><p className="text-xs text-slate-400 mt-0.5">{l}</p></div>
          ))}
        </div>
        <p className="font-semibold text-slate-700 text-sm">{t("statements.outstandingPayables")}</p>
        <div className="space-y-2.5">
          {(pq.data ?? []).length===0 && <p className="text-sm text-slate-400">{t("portalCommon:empty.nothing")}</p>}
          {(pq.data ?? []).map(p=>(
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div><p className="text-sm font-semibold text-slate-800">{t("statements.dueAmount", { amount: fmtBDT2(p.dueAmount) })}</p><p className="text-xs text-slate-400 mt-0.5">{t("statements.ofAmount", { amount: fmtBDT2(p.amount) })} · {p.dueDate ? iso2date(p.dueDate) : "—"}</p></div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-amber-50 text-amber-600">{t(`portalCommon:status.${p.status.toLowerCase()}`, { defaultValue: p.status.toLowerCase() })}</span>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function ReportsView() {
  const { t } = useTranslation("portalSupplier");
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.reports")}</h2>
      <div className="bg-white rounded-2xl border border-slate-200">
        <EmptyState variant="no-data" title="Reports" desc="Your performance reports will appear here once you have activity." />
      </div>
    </div>
  );
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
function MessagesView() {
  const { t } = useTranslation("portalSupplier");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.messages")}</h2>
      <div className="bg-white rounded-2xl border border-slate-200">
        <EmptyState variant="coming-soon" title="Messages" desc="Direct messaging with the SM Travels team is planned for a later release." />
      </div>
    </div>
  );
}

// ─── SUPPORT ──────────────────────────────────────────────────────────────────
function SupportView() {
  const { t } = useTranslation("portalSupplier");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.support")}</h2>
      <div className="bg-white rounded-2xl border border-slate-200">
        <EmptyState variant="no-data" title="Support" desc="Your support tickets will appear here." />
      </div>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileView() {
  const { t } = useTranslation("portalSupplier");
  const q = useSupplierMe();
  const me = q.data;
  const initials = (me?.name ?? "").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="space-y-5" data-portal="profile">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.profileSettings")}</h2>
      <PLoad q={q}>
        {me && (<>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1B75BC]/10 flex items-center justify-center text-[#1B75BC] text-xl font-black flex-shrink-0">{initials}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-bold text-slate-800" data-portal-name>{me.name}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 capitalize"><CheckCircle size={10} /> {t(`portalCommon:status.${me.status.toLowerCase()}`, { defaultValue: me.status.toLowerCase() })}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{me.supplierCode}</p>
                {me.rating != null && <span className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1"><Star size={11} className="fill-amber-400" />{me.rating} {t("dashboard.rating")}</span>}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">{t("profile.companyInfo")}</p>
            {[
              [t("profile.companyName"), me.name],
              [t("profile.contactPerson"), me.contactPerson ?? "—"],
              [t("portalCommon:labels.phone"), me.phone ?? "—"],
              [t("portalCommon:labels.email"), me.email ?? "—"],
              [t("profile.category"), me.category ?? "—"],
              [t("profile.tradeLicense"), me.tradeLicense ?? "—"],
              [t("profile.tin"), me.tin ?? "—"],
              [t("profile.address"), me.address ?? "—"],
            ].map(([l,v])=>(
              <div key={l}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
                <input value={v} disabled data-field={l} className="w-full px-3 py-2.5 text-sm rounded-xl border border-transparent bg-slate-50 text-slate-700"/>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">{t("profile.bankDetails")}</p>
            {[[t("profile.bankName"), me.bankName ?? "—"],[t("profile.accountNo"), me.accountNo ?? "—"]].map(([l,v])=>(
              <div key={l}><label className="block text-xs font-medium text-slate-400 mb-1">{l}</label><div className="px-3 py-2.5 bg-slate-50 rounded-xl text-sm text-slate-700">{v}</div></div>
            ))}
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50 transition-colors"><LogOut size={16} /> {t("portalCommon:nav.logout")}</button>
        </>)}
      </PLoad>
    </div>
  );
}

// ─── PORTAL SHELL ─────────────────────────────────────────────────────────────
export function SupplierPortal() {
  const { t } = useTranslation("portalSupplier");
  const [view, setView] = useState<SupView>("dashboard");
  const { data: me } = useSupplierMe();
  const { data: reqs } = useSupplierRequests();
  const pendingReqs = (reqs ?? []).filter(r => r.status === "PENDING").length;
  const name = me?.name ?? "Supplier";
  const initials = name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const unread = 0;

  const go = (v: SupView) => setView(v);

  const render = () => {
    switch (view) {
      case "dashboard":  return <SupDashboard onGo={go} />;
      case "requests":   return <RequestsView />;
      case "services":   return <ServicesView />;
      case "invoices":   return <InvoicesView />;
      case "payments":   return <PaymentsView />;
      case "statements": return <StatementsView />;
      case "reports":    return <ReportsView />;
      case "messages":   return <MessagesView />;
      case "support":    return <SupportView />;
      case "profile":    return <ProfileView />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#F4F6F9" }}>
      {/* Desktop layout */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar */}
        <div className="w-60 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1B75BC] flex items-center justify-center text-white text-xs font-black">SM</div>
              <div>
                <p className="text-sm font-bold text-slate-800">SM Travels International</p>
                <p className="text-xs text-slate-400 font-medium">{t("brand.portal")}</p>
              </div>
            </div>
          </div>
          {/* Supplier identity */}
          <div className="px-4 py-3.5 border-b border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-3">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#1B75BC]/12 flex items-center justify-center text-[#1B75BC] text-xs font-black">{initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate" data-portal-name>{name}</p>
                  <p className="text-xs text-slate-400 font-mono">{me?.supplierCode ?? ""}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              </div>
              {/* Pending badge */}
              {pendingReqs > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={12} className="text-amber-500" />
                  <p className="text-xs text-amber-700 font-semibold">
                    {t("pending.badge", { count: pendingReqs })}
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Nav */}
          <nav className="flex-1 py-3 px-3 overflow-y-auto no-scrollbar space-y-0.5">
            {NAV.map(item => (
              <button key={item.id} onClick={() => go(item.id)}
                className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all",
                  view === item.id
                    ? "bg-[#1B75BC] text-white shadow-sm shadow-[#1B75BC]/25"
                    : "text-slate-600 hover:bg-slate-100")}>
                <item.icon size={16} className={view === item.id ? "text-white" : "text-slate-400"} />
                <span className="font-medium flex-1 text-left">{t(item.label)}</span>
                {item.badge ? (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{item.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>
          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 w-full px-2 py-1.5 rounded-xl hover:bg-red-50 transition-colors">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {/* Top bar */}
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-8 py-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600 capitalize">
              {t(NAV.find(n => n.id === view)?.label ?? "")}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => go("messages")} className="relative p-2 hover:bg-slate-100 rounded-xl">
                <MessageSquare size={17} className="text-slate-500" />
                {unread > 0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold">{unread}</span>}
              </button>
              <button className="relative p-2 hover:bg-slate-100 rounded-xl">
                <Bell size={17} className="text-slate-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
              </button>
              <div className="w-7 h-7 rounded-full bg-[#1B75BC]/15 flex items-center justify-center text-[#1B75BC] text-xs font-bold ml-1">AI</div>
            </div>
          </div>
          <div className="max-w-2xl mx-auto px-8 py-7">
            {render()}
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1B75BC] flex items-center justify-center text-white text-xs font-black">SM</div>
            <div>
              <p className="text-sm font-bold text-slate-800">{t("brand.portal")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {pendingReqs > 0 && (
              <button onClick={() => go("requests")}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700 whitespace-nowrap">
                <AlertCircle size={11} />
                {t("pending.short", { count: pendingReqs })}
              </button>
            )}
            <button onClick={() => go("messages")} className="relative p-2 hover:bg-slate-100 rounded-xl">
              <MessageSquare size={18} className="text-slate-500" />
              {unread > 0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold">{unread}</span>}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          {render()}
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-30">
          <div className="flex items-center justify-around">
            {BOTTOM_NAV.map(item => {
              const active = view === item.id;
              return (
                <button key={item.id} onClick={() => go(item.id)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all">
                  <item.icon size={22} className={active ? "text-[#1B75BC]" : "text-slate-400"} />
                  <span className={cn("text-xs font-medium", active ? "text-[#1B75BC]" : "text-slate-400")}>{t(item.label)}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-[#1B75BC]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierPortal;
