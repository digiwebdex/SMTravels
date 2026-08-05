import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Calendar, CreditCard, Layers, FileText,
  FolderOpen, Download, MessageCircle, Bell, User, LogOut,
  ChevronRight, ChevronDown, Clock, CheckCircle, Circle,
  AlertCircle, Plane, Hotel, Globe, Star, Phone, Mail,
  Upload, Paperclip, Send, X, Plus, ArrowRight, Eye,
  MapPin, Shield, Camera, Edit2, Check, Info, Package,
  Wallet, Ticket, RefreshCw, MoreHorizontal, Bot, Stamp,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Loader2 } from "lucide-react";
import { openPrintPage } from "../lib/api";
import { toast } from "sonner";
import {
  usePortalMe, usePortalDashboard, usePortalBookings, usePortalBooking,
  usePortalVisas, usePortalDownloads,
  usePortalInvoices, usePortalInvoice, usePortalPayments, usePortalInstallments, usePortalDocuments,
  usePortalTickets, usePortalTicket, useCreateTicket, useAddTicketMessage,
  usePortalNotifications, useMarkAllNotificationsRead,
  useUploadPortalDocument, downloadPortalDocument,
} from "../hooks/portal";
import { usePortalAiChat } from "../hooks/ai";
import { usePortalBankAccounts, useSubmitPaymentProof } from "../hooks/payments";
import { DOCUMENT_TYPES } from "../lib/documentTypes"; // runtime value — NEVER from @contracts (type-only imports erase; values would drag backend code into the bundle)
import type { DocumentTypeDto } from "@contracts/document.contract";
import type { PortalBooking } from "../hooks/portal";
import { useAuth } from "../auth/AuthContext";
import { PortalShell, type PortalNavItem } from "../design-system";

// ── shared query-state wrapper ────────────────────────────────────────────────
function PortalState({ query, children, empty }: {
  query: { isLoading: boolean; isError: boolean; error?: unknown };
  children: React.ReactNode; empty?: boolean;
}) {
  const { t } = useTranslation("portalCustomer");
  if (query.isLoading) return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>;
  if (query.isError) return <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-600 text-center">{(query.error as Error)?.message || t("portalCommon:empty.failed")}</div>;
  if (empty) return <div className="bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-2xl p-10 text-center text-sm text-slate-400">{t("portalCommon:empty.nothing")}</div>;
  return <>{children}</>;
}
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

// ─── Types & nav ──────────────────────────────────────────────────────────────
type PortalView =
  | "dashboard" | "bookings" | "booking-detail"
  | "payments" | "installments" | "invoices"
  | "visas" | "documents" | "downloads" | "voucher"
  | "ai" | "support" | "notifications" | "profile";

const NAV = [
  { id:"dashboard"     as PortalView, labelKey:"portalCommon:nav.myDashboard",   icon:LayoutDashboard },
  { id:"bookings"      as PortalView, labelKey:"portalCommon:nav.myBookings",    icon:Calendar        },
  { id:"visas"         as PortalView, labelKey:"portalCommon:nav.visaStatus",    icon:Stamp           },
  { id:"payments"      as PortalView, labelKey:"portalCommon:nav.paymentHistory",icon:CreditCard      },
  { id:"installments"  as PortalView, labelKey:"portalCommon:nav.installments",  icon:Layers          },
  { id:"invoices"      as PortalView, labelKey:"portalCommon:nav.invoices",      icon:FileText        },
  { id:"documents"     as PortalView, labelKey:"portalCommon:nav.myDocuments",   icon:FolderOpen      },
  { id:"downloads"     as PortalView, labelKey:"portalCommon:nav.downloads",     icon:Download        },
  { id:"voucher"       as PortalView, labelKey:"portalCommon:nav.voucher",       icon:Ticket          },
  { id:"ai"            as PortalView, labelKey:"portalCommon:nav.aiAssistant",   icon:Bot             },
  { id:"support"       as PortalView, labelKey:"portalCommon:nav.support",       icon:MessageCircle   },
  { id:"notifications" as PortalView, labelKey:"portalCommon:nav.notifications", icon:Bell            },
  { id:"profile"       as PortalView, labelKey:"portalCommon:nav.myProfile",     icon:User            },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtBDT = (n: number) => "৳ " + n.toLocaleString("en-BD");

const STATUS_CFG: Record<string,{ label:string; chip:string; dot:string }> = {
  confirmed: { label:"Confirmed",  chip:"bg-[#1B75BC]/10 text-[#1B75BC] border-[#1B75BC]/20",   dot:"bg-[#1B75BC]"  },
  completed: { label:"Completed",  chip:"bg-emerald-50 text-emerald-700 border-emerald-200",      dot:"bg-emerald-500"},
  pending:   { label:"Pending",    chip:"bg-amber-50 text-amber-700 border-amber-200",            dot:"bg-amber-400"  },
  cancelled: { label:"Cancelled",  chip:"bg-red-50 text-red-600 border-red-200",                  dot:"bg-red-500"    },
};
const DOC_STATUS_CFG: Record<string,{ labelKey:string; cls:string; icon:React.ElementType }> = {
  verified: { labelKey:"portalCustomer:docStatus.verified", cls:"text-emerald-600 bg-emerald-50 border-emerald-200", icon:CheckCircle  },
  uploaded: { labelKey:"portalCustomer:docStatus.uploaded", cls:"text-blue-600 bg-blue-50 border-blue-200",          icon:CheckCircle  },
  pending:  { labelKey:"portalCommon:status.pending",       cls:"text-amber-600 bg-amber-50 border-amber-200",       icon:Clock        },
  missing:  { labelKey:"portalCustomer:docStatus.missing",  cls:"text-red-500 bg-red-50 border-red-200",             icon:AlertCircle  },
};

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation("portalCustomer");
  const c = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const key = STATUS_CFG[status] ? status : "pending";
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", c.chip)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)}/>{t(`portalCommon:status.${key}`)}
    </span>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ onGo }: { onGo: (v: PortalView) => void }) {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalDashboard();
  const d = q.data;
  const next = d?.nextBooking ?? null;
  const paidPct = next && next.amount > 0 ? Math.round((next.paidAmount / next.amount) * 100) : 0;

  return (
    <PortalState query={q}>
      {d && (
      <div className="space-y-5" data-portal="dashboard">
        {/* Welcome banner */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(135deg, #1B75BC 0%, #0E4D7A 60%, #0E7C66 100%)" }}>
          <div className="px-6 py-7 text-white relative z-10">
            <p className="text-sm text-white/70 mb-1">{t("portalCommon:labels.welcomeBack")},</p>
            <h2 className="text-2xl font-bold mb-1">{d.customerName}</h2>
            <p className="text-white/60 text-sm">{next ? <>{t("dashboard.bookingPrefix")} <span className="text-[#D64A12] font-semibold">{next.serviceType.replace(/_/g, " ").toLowerCase()}</span> {t("dashboard.bookingActive")}</> : t("dashboard.noActiveBookings")}</p>
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 bg-[var(--color-surface)]/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{d.counts.bookings}</p>
                <p className="text-xs text-white/60 mt-0.5">{t("portalCommon:nav.bookings")}</p>
              </div>
              <div className="flex-1 bg-[var(--color-surface)]/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{d.counts.documents}</p>
                <p className="text-xs text-white/60 mt-0.5">{t("portalCommon:nav.documents")}</p>
              </div>
              <div className="flex-1 bg-[var(--color-surface)]/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{d.counts.unpaidInvoices}</p>
                <p className="text-xs text-white/60 mt-0.5">{t("portalCommon:status.unpaid")}</p>
              </div>
            </div>
          </div>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[var(--color-surface)]/5"/>
          <div className="absolute -bottom-6 -right-4 w-24 h-24 rounded-full bg-[var(--color-surface)]/5"/>
        </div>

        {/* Next booking card */}
        {next && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">{t("dashboard.nextBooking")}</p>
              <h3 className="font-bold text-slate-800 text-lg capitalize">{next.serviceType.replace(/_/g, " ").toLowerCase()}</h3>
              <p className="text-sm text-slate-500 mt-1 font-mono">{next.bookingNo || "—"}</p>
            </div>
            <StatusChip status={next.status.toLowerCase()}/>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Plane size={11}/>{t("dashboard.departs", { date: fmtDate(next.departureDate) })}</span>
          </div>
        </div>
        )}

        {/* Balance due */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-800">{t("labels.balanceDue")}</p>
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl font-black text-red-500" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(d.balanceDue)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("dashboard.acrossUnpaid", { count: d.counts.unpaidInvoices })}</p>
            </div>
            <button onClick={()=>onGo("installments")}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1B75BC] text-white text-sm font-semibold rounded-xl hover:bg-[#14588F] transition-colors whitespace-nowrap">
              {t("dashboard.viewPlan")} <ArrowRight size={14}/>
            </button>
          </div>
          {next && next.amount > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500"><span>{fmtBDT(next.paidAmount)} {t("dashboard.paidOnNext")}</span><span>{paidPct}%</span></div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#1B75BC] to-[#0E7C66] transition-all" style={{ width:`${paidPct}%` }}/>
            </div>
          </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon:FolderOpen,   label:t("portalCommon:nav.myDocuments"), color:"bg-blue-50 text-blue-600",   v:"documents"    as PortalView },
            { icon:FileText,     label:t("portalCommon:nav.invoices"),    color:"bg-purple-50 text-purple-600",v:"invoices"     as PortalView },
            { icon:MessageCircle,label:t("dashboard.getSupport"),         color:"bg-emerald-50 text-emerald-600",v:"support"    as PortalView },
            { icon:Layers,       label:t("portalCommon:nav.installments"),color:"bg-amber-50 text-amber-600",  v:"installments" as PortalView },
          ].map(l=>(
            <button key={l.label} onClick={()=>onGo(l.v)}
              className="flex items-center gap-3 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-[#1B75BC]/30 hover:shadow-sm transition-all group text-left">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", l.color)}><l.icon size={18}/></div>
              <span className="text-sm font-semibold text-slate-700">{l.label}</span>
              <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-[#1B75BC] transition-colors"/>
            </button>
          ))}
        </div>

        {/* Recent notifications */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-800">{t("dashboard.recentUpdates")}</p>
            <button onClick={()=>onGo("notifications")} className="text-xs text-[#1B75BC] hover:underline">{t("dashboard.seeAll")}</button>
          </div>
          <div className="space-y-2.5">
            {d.recentNotifications.length === 0 && <p className="text-sm text-slate-400 py-2">{t("dashboard.noUpdates")}</p>}
            {d.recentNotifications.map(n=>(
              <div key={n.id} className={cn("flex items-start gap-3 p-3 rounded-xl transition-colors", n.read?"bg-[var(--color-bg)]":"bg-[#1B75BC]/4")}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.color || "#1B75BC" }}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.body}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{fmtDate(n.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </PortalState>
  );
}

// ─── MY BOOKINGS ─────────────────────────────────────────────────────────────
function BookingsView({ onDetail }: { onDetail: (id: string) => void }) {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalBookings();
  const rows = q.data ?? [];
  return (
    <div className="space-y-4" data-portal="bookings">
      <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.myBookings")}</h2>
      <PortalState query={q} empty={rows.length === 0}>
        {rows.map(b=>(
          <div key={b.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={()=>onDetail(b.id)}>
            <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-mono mb-1">{b.bookingNo || "—"}</p>
                  <h3 className="font-bold text-slate-800 text-base capitalize">{b.serviceType.replace(/_/g, " ").toLowerCase()}</h3>
                </div>
                <StatusChip status={b.status.toLowerCase()}/>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[[t("bookings.departure"),fmtDate(b.departureDate)],[t("bookings.return"),fmtDate(b.returnDate)],[t("bookings.currency"),b.currency]].map(([k,v])=>(
                  <div key={k}><p className="text-xs text-slate-400 mb-0.5">{k}</p><p className="text-sm font-semibold text-slate-700">{v}</p></div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-slate-400">{t("labels.totalAmount")}</p><p className="font-bold text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(b.amount)}</p></div>
                {b.dueAmount > 0 ? (
                  <div className="text-right"><p className="text-xs text-red-400">{t("labels.balanceDue")}</p><p className="font-bold text-red-500" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(b.dueAmount)}</p></div>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle size={14} className="fill-emerald-100"/> {t("labels.fullyPaid")}</span>
                )}
              </div>
            </div>
            <div className="px-5 py-3 bg-[var(--color-bg)] border-t border-[var(--color-border-subtle)] flex items-center justify-end">
              <span className="flex items-center gap-1 text-xs text-[#1B75BC] font-semibold whitespace-nowrap">{t("common:actions.viewDetails")} <ChevronRight size={12}/></span>
            </div>
          </div>
        ))}
      </PortalState>
    </div>
  );
}

// ─── BOOKING DETAIL ───────────────────────────────────────────────────────────
function BookingDetail({ bookingId, onBack }: { bookingId: string; onBack: () => void }) {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalBooking(bookingId);
  const b = q.data;
  return (
    <div className="space-y-5" data-portal="booking-detail">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 whitespace-nowrap">
          <ChevronRight size={14} className="rotate-180"/> {t("bookingDetail.back")}
        </button>
      </div>
      <PortalState query={q}>
        {b && (<>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 font-mono">{b.bookingNo || "—"}</p>
              <h2 className="text-xl font-bold text-slate-800 capitalize">{b.serviceType.replace(/_/g, " ").toLowerCase()}</h2>
            </div>
            <StatusChip status={b.status.toLowerCase()}/>
          </div>

          {Object.keys(b.detail).length > 0 && (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 space-y-4">
            <p className="font-semibold text-slate-700 text-sm">{t("bookingDetail.journeyDetails")}</p>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(b.detail).filter(([, v]) => v).map(([label, val])=>(
                <div key={label} className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1B75BC]/8 flex items-center justify-center flex-shrink-0 mt-0.5"><Globe size={14} className="text-[#1B75BC]"/></div>
                  <div><p className="text-xs text-slate-400">{label}</p><p className="text-sm font-semibold text-slate-700">{val}</p></div>
                </div>
              ))}
            </div>
          </div>
          )}

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <p className="font-semibold text-slate-700 text-sm mb-5">{t("bookingDetail.timeline")}</p>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100"/>
              <div className="space-y-6">
                {b.timeline.map((step,i)=>(
                  <div key={i} className="flex items-center gap-4 relative">
                    <div className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10",
                      step.done ? "bg-[#1B75BC] border-[#1B75BC]" : "bg-[var(--color-surface)] border-[var(--color-border)]")}>
                      {step.done ? <Check size={14} className="text-white"/> : <Circle size={10} className="text-slate-300"/>}
                    </div>
                    <div className="flex-1"><p className={cn("text-sm font-semibold", step.done?"text-slate-800":"text-slate-400")}>{step.label}</p></div>
                    <span className={cn("text-xs font-medium", step.done?"text-[#1B75BC]":"text-slate-400")}>{fmtDate(step.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <p className="font-semibold text-slate-700 text-sm mb-3">{t("bookingDetail.paymentSummary")}</p>
            <div className="space-y-2.5">
              {[[t("labels.totalAmount"),b.amount],[t("labels.amountPaid"),b.paidAmount],[t("labels.balanceDue"),b.dueAmount]].map(([k,v],i)=>(
                <div key={i} className={cn("flex justify-between items-center",i===2&&"pt-2.5 border-t border-[var(--color-border-subtle)]")}>
                  <span className={cn("text-sm",i===2?"font-bold text-red-500":"text-slate-600")}>{k}</span>
                  <span className={cn("font-bold",i===2?"text-red-500":"text-slate-800")} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(v as number)}</span>
                </div>
              ))}
            </div>
          </div>
        </>)}
      </PortalState>
    </div>
  );
}

// ─── PAYMENT HISTORY ─────────────────────────────────────────────────────────
function NpsbPayForm() {
  const { t } = useTranslation("portalCustomer");
  const banksQ = usePortalBankAccounts();
  const invoicesQ = usePortalInvoices();
  const submit = useSubmitPaymentProof();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const unpaid = (invoicesQ.data ?? []).filter((i) => i.dueAmount > 0);

  const onSubmit = () => {
    const amt = Number(amount);
    if (!(amt > 0) || !reference.trim() || !file) return;
    submit.mutate(
      { amount: amt, reference: reference.trim(), invoiceId: invoiceId || undefined, file },
      {
        onSuccess: () => {
          setAmount(""); setReference(""); setInvoiceId(""); setFile(null);
          if (fileRef.current) fileRef.current.value = "";
        },
      },
    );
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[#1B75BC]/25 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-[#1B75BC]/10 flex items-center justify-center"><Wallet size={18} className="text-[#1B75BC]"/></div>
        <div>
          <p className="font-bold text-slate-800">{t("payments.npsbTitle", { defaultValue: "Pay via NPSB Bank Transfer" })}</p>
          <p className="text-xs text-slate-500">{t("payments.npsbHint", { defaultValue: "Transfer to a company account, then submit your proof below." })}</p>
        </div>
      </div>

      {banksQ.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-2"><Loader2 size={16} className="animate-spin"/> Loading bank accounts…</div>
      ) : (banksQ.data ?? []).length === 0 ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">Bank account details are not published yet. Contact support for payment instructions.</p>
      ) : (
        <div className="space-y-2">
          {(banksQ.data ?? []).map((b) => (
            <div key={b.id} className="p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border-subtle)] text-sm">
              <p className="font-semibold text-slate-800">{b.name}</p>
              {b.bankName && <p className="text-xs text-slate-500">{b.bankName}{b.branchName ? ` · ${b.branchName}` : ""}</p>}
              <div className="flex flex-wrap gap-3 mt-1.5 font-mono text-xs text-slate-700">
                {b.accountNumber && <span>A/C: {b.accountNumber}</span>}
                {b.iban && <span>IBAN: {b.iban}</span>}
                <span className="text-[#1B75BC] font-sans font-semibold">{b.currency}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t("portalCommon:labels.amount")}</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
            className="w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 font-mono"/>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t("payments.npsbRef", { defaultValue: "NPSB Reference" })}</label>
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Txn / reference no."
            className="w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 font-mono"/>
        </div>
      </div>

      {unpaid.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t("payments.linkInvoice", { defaultValue: "Link to invoice (optional)" })}</label>
          <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none">
            <option value="">{t("payments.noInvoice", { defaultValue: "General payment" })}</option>
            {unpaid.map((i) => (
              <option key={i.id} value={i.id}>{i.invoiceNo || "Draft"} — {fmtBDT(i.dueAmount)} due</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{t("payments.proofFile", { defaultValue: "Payment proof (screenshot / receipt)" })}</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-xl text-slate-600 hover:bg-[var(--color-bg)]">
            <Paperclip size={14}/> {file ? file.name : t("payments.chooseFile", { defaultValue: "Choose file" })}
          </button>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}/>
        </div>
      </div>

      <button onClick={onSubmit} disabled={submit.isPending || !(Number(amount) > 0) || !reference.trim() || !file}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[#F15A24] text-white text-sm font-semibold rounded-xl hover:bg-[#D64A12] disabled:opacity-50">
        {submit.isPending ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>}
        {t("payments.submitProof", { defaultValue: "Submit payment proof" })}
      </button>
    </div>
  );
}

function PaymentsView() {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalPayments();
  const rows = q.data ?? [];
  const totalPaid = rows.filter(p => !p.reversed).reduce((s,p)=>s+p.amount,0);
  return (
    <div className="space-y-4" data-portal="payments">
      <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.paymentHistory")}</h2>
      <NpsbPayForm/>
      <PortalState query={q} empty={rows.length === 0}>
        <div className="grid grid-cols-2 gap-3">
          {[[t("payments.totalPaid"),fmtBDT(totalPaid)],[t("payments.transactions"),String(rows.length)]].map(([l,v])=>(
            <div key={l} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">{l}</p>
              <p className="text-xl font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{v}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {rows.map(p=>(
            <div key={p.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", p.reversed?"bg-red-100":"bg-emerald-100")}>
                    <CheckCircle size={18} className={p.reversed?"text-red-500":"text-emerald-600"}/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.invoiceNo || t("payments.payment")}</p>
                    <p className="text-xs text-slate-400">{p.method.replace(/_/g," ")} · {fmtDate(p.paidAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold", p.reversed?"text-slate-400 line-through":"text-slate-800")} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(p.amount)}</p>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", p.reversed?"bg-red-50 text-red-500":"bg-emerald-50 text-emerald-600")}>{p.reversed?t("payments.reversed"):t("portalCommon:status.paid")}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono">{p.receiptNo}</p>
            </div>
          ))}
        </div>
      </PortalState>
    </div>
  );
}

// ─── INSTALLMENTS ────────────────────────────────────────────────────────────
function InstallmentsView() {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalInstallments();
  const plans = q.data ?? [];
  return (
    <div className="space-y-5" data-portal="installments">
      <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.installments")}</h2>
      <PortalState query={q} empty={plans.length === 0}>
        {plans.map(plan=>{
          const paidCount = plan.installments.filter(i=>i.status==="PAID").length;
          const total = plan.installments.length;
          const pct = total ? Math.round((paidCount/total)*100) : 0;
          return (
            <div key={plan.id} className="space-y-3">
              <div className="bg-gradient-to-br from-[#1B75BC] to-[#0E4D7A] rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/70 text-xs mb-1 font-mono">{plan.bookingNo || t("installments.plan")} · {fmtBDT(plan.total)}</p>
                    <p className="text-2xl font-black">{t("installments.countPaid", { paid: paidCount, total })} <span className="text-sm font-normal text-white/70">{t("installments.paidLabel")}</span></p>
                    <p className="text-white/70 text-xs mt-1">{t("installments.remaining", { amount: fmtBDT(plan.remaining) })}</p>
                  </div>
                  <div className="w-14 h-14 rounded-full border-4 border-white/20 flex items-center justify-center"><span className="text-lg font-black">{pct}%</span></div>
                </div>
                <div className="h-2.5 bg-[var(--color-surface)]/20 rounded-full overflow-hidden"><div className="h-full bg-[#F15A24] rounded-full transition-all" style={{ width:`${pct}%` }}/></div>
              </div>
              <div className="space-y-3">
                {plan.installments.map((inst)=>{
                  const isPaid = inst.status === "PAID";
                  const isNext = inst.status === "DUE" || inst.status === "OVERDUE";
                  return (
                    <div key={inst.number} className={cn("bg-[var(--color-surface)] rounded-2xl border p-5 transition-all", isNext?"border-[#1B75BC]/40 shadow-md shadow-[#1B75BC]/8":"border-[var(--color-border)]")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0", isPaid?"border-emerald-500 bg-emerald-50":isNext?"border-[#F15A24] bg-amber-50":"border-[var(--color-border)] bg-[var(--color-bg)]")}>
                          {isPaid ? <Check size={16} className="text-emerald-600"/> : <span className="text-xs font-bold text-slate-500">{inst.number}</span>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-800">{inst.label || t("installments.installmentN", { number: inst.number })}</p>
                            {isNext && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">{inst.status === "OVERDUE" ? t("portalCommon:status.overdue") : t("installments.due")}</span>}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{isPaid ? t("installments.paidOn", { date: fmtDate(inst.paidDate) }) : t("installments.dueOn", { date: fmtDate(inst.dueDate) })}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("font-black text-base", isPaid?"text-emerald-600":"text-slate-800")} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(inst.amountDue)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </PortalState>
    </div>
  );
}

// ─── INVOICES ────────────────────────────────────────────────────────────────
function InvoicePreview({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalInvoice(id);
  const inv = q.data;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--color-surface)] rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] sticky top-0 bg-[var(--color-surface)] rounded-t-3xl z-10">
          <h3 className="font-bold text-slate-800 font-mono">{inv?.invoiceNo || t("invoices.invoice")}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
        </div>
        <div className="p-6">
          <PortalState query={q}>
            {inv && (<>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="w-12 h-10 bg-[#1B75BC] rounded-xl flex items-center justify-center text-white text-xs font-black mb-2">SM</div>
                  <p className="font-bold text-slate-800">SM Travels International</p>
                  <p className="text-xs text-slate-400">Agrabad, Chattogram</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-[#1B75BC]">{t("invoices.invoiceHeading")}</p>
                  <p className="text-xs text-slate-400 font-mono">{inv.invoiceNo}</p>
                  <p className="text-xs text-slate-400">{fmtDate(inv.issueDate)}</p>
                </div>
              </div>
              <table className="w-full mb-4">
                <thead><tr className="border-b border-[var(--color-border-subtle)]"><th className="text-left text-xs text-slate-400 pb-2">{t("invoices.item")}</th><th className="text-right text-xs text-slate-400 pb-2">{t("portalCommon:labels.amount")}</th></tr></thead>
                <tbody>
                  {inv.items.map((it,i)=>(
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2 text-sm text-slate-700">{it.description} <span className="text-slate-400">× {it.qty}</span></td>
                      <td className="py-2 text-sm text-right font-mono text-slate-800">{fmtBDT(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {([[t("portalCommon:labels.total"),inv.total],[t("portalCommon:labels.paid"),inv.paidAmount],[t("labels.balanceDue"),inv.dueAmount]] as [string,number][]).map(([k,v],i)=>(
                <div key={k} className={cn("flex justify-between",i===2&&"font-bold text-red-500 pt-2 border-t border-[var(--color-border-subtle)]")}>
                  <span className="text-sm">{k}</span><span className="text-sm font-mono">{fmtBDT(v)}</span>
                </div>
              ))}
            </>)}
          </PortalState>
        </div>
      </div>
    </div>
  );
}

function InvoicesView() {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalInvoices();
  const rows = q.data ?? [];
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="space-y-4" data-portal="invoices">
      <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.invoices")}</h2>
      <PortalState query={q} empty={rows.length === 0}>
        {rows.map(inv=>(
          <div key={inv.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400 font-mono">{inv.invoiceNo || t("invoices.draft")}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t("invoices.issued", { date: fmtDate(inv.issueDate) })} · {t("invoices.due", { date: fmtDate(inv.dueDate) })}</p>
              </div>
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border",
                inv.status==="PAID"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-amber-50 text-amber-700 border-amber-200")}>{t(`portalCommon:status.${inv.status.toLowerCase()}`)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
              <div>
                <p className="font-black text-slate-800 text-lg" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(inv.total)}</p>
                {inv.dueAmount > 0 && <p className="text-xs text-red-500">{t("invoices.balanceShort", { amount: fmtBDT(inv.dueAmount) })}</p>}
              </div>
              <button onClick={()=>setPreview(inv.id)} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-xl text-slate-600 hover:bg-[var(--color-bg)] whitespace-nowrap"><Eye size={13}/> {t("common.view")}</button>
            </div>
          </div>
        ))}
      </PortalState>
      {preview && <InvoicePreview id={preview} onClose={()=>setPreview(null)}/>}
    </div>
  );
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
function DocumentsView() {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalDocuments();
  const upload = useUploadPortalDocument();
  const [docType, setDocType] = useState<DocumentTypeDto>("PASSPORT");
  const fileInput = React.useRef<HTMLInputElement>(null);
  const rows = q.data ?? [];

  const pick = (file: File | null) => {
    if (!file || upload.isPending) return;
    upload.mutate({ file, type: docType, name: file.name });
  };

  return (
    <div className="space-y-4" data-portal="documents">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.myDocuments")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t("documents.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={docType} onChange={e=>setDocType(e.target.value as DocumentTypeDto)}
            className="border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none">
            {DOCUMENT_TYPES.map(t=>(
              <option key={t} value={t}>{t.replace(/_/g," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())}</option>
            ))}
          </select>
          <button onClick={()=>fileInput.current?.click()} disabled={upload.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1B75BC] text-white text-sm rounded-xl hover:bg-[#14588F] disabled:opacity-60 cursor-pointer whitespace-nowrap">
            {upload.isPending ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
            {upload.isPending ? t("documents.uploading") : t("documents.upload")}
          </button>
          <input ref={fileInput} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
            onChange={e=>{ pick(e.target.files?.[0] ?? null); e.target.value=""; }}/>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5"/>
        <p className="text-sm text-blue-700">{t("documents.uploadHint")}</p>
      </div>
      <PortalState query={q} empty={rows.length === 0}>
        <div className="space-y-3">
          {rows.map(doc=>{
            const sc = DOC_STATUS_CFG[doc.status.toLowerCase()] ?? DOC_STATUS_CFG.pending;
            const Icon = sc.icon;
            return (
              <div key={doc.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0"><Shield size={18} className="text-slate-400"/></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                      {doc.required && <span className="text-xs text-red-400 font-medium">{t("documents.required")}</span>}
                    </div>
                    <span className={cn("inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium border",sc.cls)}>
                      <Icon size={10}/>{t(sc.labelKey)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 capitalize flex-shrink-0">{doc.type.toLowerCase()}</span>
                  {doc.hasFile && (
                    <button onClick={()=>void downloadPortalDocument(doc)} title={t("common:actions.download")}
                      className="p-2 rounded-xl border border-[var(--color-border)] text-slate-500 hover:bg-[var(--color-bg)] cursor-pointer flex-shrink-0">
                      <Download size={14}/>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PortalState>
    </div>
  );
}

// ─── VISA STATUS ─────────────────────────────────────────────────────────────
const STAGE_CFG: Record<string,{ labelKey:string; cls:string }> = {
  PENDING:       { labelKey:"visas.stage.pending",      cls:"bg-amber-50 text-amber-700 border-amber-200" },
  IN_PROGRESS:   { labelKey:"visas.stage.inProgress",   cls:"bg-blue-50 text-blue-700 border-blue-200" },
  DONE:          { labelKey:"visas.stage.done",         cls:"bg-emerald-50 text-emerald-700 border-emerald-200" },
  NOT_APPLICABLE:{ labelKey:"visas.stage.notApplicable",cls:"bg-[var(--color-bg)] text-slate-500 border-[var(--color-border)]" },
};

function VisaStatusView({ onDetail }: { onDetail: (id: string) => void }) {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalVisas();
  const rows = q.data ?? [];
  return (
    <div className="space-y-4" data-portal="visas">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.visaStatus")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("visas.subtitle")}</p>
      </div>
      <PortalState query={q} empty={rows.length === 0}>
        {rows.map((v) => {
          const stage = STAGE_CFG[v.stageStatus ?? ""] ?? STAGE_CFG.PENDING;
          return (
            <div key={v.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onDetail(v.id)}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-slate-400 font-mono mb-1">{v.bookingNo || "—"}</p>
                  <h3 className="font-bold text-slate-800">{v.destinationCountry || t("visas.visaApplication")}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{v.visaType || "—"}{v.visaNumber ? ` · ${v.visaNumber}` : ""}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusChip status={v.status.toLowerCase()}/>
                  <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-semibold border", stage.cls)}>{t(stage.labelKey)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-[var(--color-border-subtle)]">
                <span>{t("visas.depart", { date: fmtDate(v.departureDate) })}</span>
                <span className="flex items-center gap-1 text-[#1B75BC] font-semibold">{t("common:actions.viewDetails")} <ChevronRight size={12}/></span>
              </div>
            </div>
          );
        })}
      </PortalState>
    </div>
  );
}

// ─── DOWNLOADS HUB ───────────────────────────────────────────────────────────
const CAT_LABEL: Record<string, string> = {
  ticket: "downloads.categories.ticket",
  visa: "downloads.categories.visa",
  voucher: "downloads.categories.voucher",
  invoice: "downloads.categories.invoice",
};

function DownloadsView() {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalDownloads();
  const rows = q.data ?? [];
  const [filter, setFilter] = useState<"all" | "ticket" | "visa" | "voucher" | "invoice">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const filtered = filter === "all" ? rows : rows.filter((r) => r.category === filter);

  const act = async (item: (typeof rows)[number]) => {
    if (item.kind === "invoice") {
      setInvoicePreview(item.id);
      return;
    }
    setBusy(item.id);
    try {
      if (item.kind === "document") {
        await downloadPortalDocument({ id: item.id, name: item.name });
      } else if (item.kind === "voucher" && item.bookingId) {
        await openPrintPage(`/portal/bookings/${item.bookingId}/voucher`);
      }
    } catch (e) {
      toast.error((e as Error).message || t("downloads.failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4" data-portal="downloads">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.downloads")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("downloads.subtitle")}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(["all", "ticket", "visa", "voucher", "invoice"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
              filter === f ? "bg-[#1B75BC] text-white border-[#1B75BC]" : "bg-[var(--color-surface)] text-slate-600 border-[var(--color-border)] hover:border-[#1B75BC]/40")}>
            {f === "all" ? t("downloads.all") : t(CAT_LABEL[f])}
          </button>
        ))}
      </div>
      <PortalState query={q} empty={filtered.length === 0}>
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B75BC]/10 flex items-center justify-center flex-shrink-0">
                {item.category === "ticket" ? <Ticket size={18} className="text-[#1B75BC]"/> :
                 item.category === "visa" ? <Stamp size={18} className="text-[#1B75BC]"/> :
                 item.category === "invoice" ? <FileText size={18} className="text-[#1B75BC]"/> :
                 <Download size={18} className="text-[#1B75BC]"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t(CAT_LABEL[item.category])} · {fmtDate(item.createdAt)}</p>
              </div>
              <button
                type="button"
                disabled={!item.hasFile || busy === item.id}
                onClick={() => void act(item)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1B75BC] text-white rounded-xl hover:bg-[#14588F] disabled:opacity-50 whitespace-nowrap">
                {busy === item.id ? <Loader2 size={14} className="animate-spin"/> : item.kind === "document" ? <Download size={14}/> : <Eye size={14}/>}
                {item.kind === "voucher" ? t("voucher.print", { defaultValue: "Print" }) : item.kind === "invoice" ? t("common.view") : t("common:actions.download")}
              </button>
            </div>
          ))}
        </div>
      </PortalState>
      {invoicePreview && <InvoicePreview id={invoicePreview} onClose={() => setInvoicePreview(null)}/>}
    </div>
  );
}

// ─── AI ASSISTANT ────────────────────────────────────────────────────────────
function AiAssistantView() {
  const { t } = useTranslation("portalCustomer");
  const chat = usePortalAiChat();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messages.length === 0) setMessages([{ role: "assistant", content: t("ai.greeting") }]);
  }, [messages.length, t]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const send = () => {
    const text = input.trim();
    if (!text || chat.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    chat.mutate(text, {
      onSuccess: (r) => setMessages((prev) => [...prev, { role: "assistant", content: r.reply }]),
      onError: () => setMessages((prev) => [...prev, { role: "assistant", content: t("ai.error") }]),
    });
  };

  return (
    <div className="space-y-4" data-portal="ai">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.aiAssistant")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("ai.subtitle")}</p>
      </div>
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] flex flex-col overflow-hidden" style={{ height: "min(70vh, 560px)" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#1B75BC] flex items-center justify-center text-white mr-2 flex-shrink-0 self-end">
                  <Bot size={14}/>
                </div>
              )}
              <div className={cn("max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                m.role === "user" ? "bg-[#1B75BC] text-white rounded-br-sm" : "bg-slate-100 text-slate-700 rounded-bl-sm")}>
                {m.content}
              </div>
            </div>
          ))}
          {chat.isPending && (
            <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
              <Loader2 size={14} className="animate-spin"/> {t("ai.typing")}
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        <div className="p-3 border-t border-[var(--color-border-subtle)] flex items-center gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder={t("ai.placeholder")}
            className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm focus:outline-none"/>
          <button type="button" onClick={send} disabled={!input.trim() || chat.isPending}
            className="p-2.5 bg-[#1B75BC] text-white rounded-xl hover:bg-[#14588F] disabled:opacity-50">
            <Send size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VOUCHER ────────────────────────────────────────────────────────────────
const VOUCHER_READY = new Set(["CONFIRMED", "PROCESSING", "COMPLETED"]);

function VoucherView() {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalBookings();
  const rows = q.data ?? [];
  const [printingId, setPrintingId] = useState<string | null>(null);

  const printVoucher = async (bookingId: string) => {
    setPrintingId(bookingId);
    try {
      await openPrintPage(`/portal/bookings/${bookingId}/voucher`);
    } catch (e) {
      toast.error((e as Error).message || t("voucher.printFailed", { defaultValue: "Could not open voucher." }));
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.voucher")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("voucher.subtitle")}</p>
      </div>
      <PortalState query={q} empty={rows.length === 0}>
        {rows.map((b) => {
          const ready = VOUCHER_READY.has(b.status);
          const service = b.serviceType.replace(/_/g, " ").toLowerCase();
          return (
            <div key={b.id} className={cn("rounded-2xl p-5 flex items-center gap-4",
              ready ? "bg-[var(--color-surface)] border border-[var(--color-border)]" : "bg-[var(--color-bg)] border border-dashed border-[var(--color-border)]")}>
              <div className="w-12 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: ready ? "#1B75BC" : "#CBD5E1" }}>
                <FileText size={22} className="text-white"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-0.5 font-mono">{b.bookingNo ?? b.id.slice(0, 8)}</p>
                <p className="font-bold text-slate-800">{t("voucher.types.booking")}</p>
        <p className="text-xs text-slate-400 capitalize">{service} · {b.travelersCount} {t("voucher.travelers", { defaultValue: "traveler(s)" })}</p>
              </div>
              {ready ? (
                <button
                  type="button"
                  onClick={() => void printVoucher(b.id)}
                  disabled={printingId === b.id}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1B75BC] text-white text-sm font-semibold rounded-xl hover:bg-[#14588F] transition-colors flex-shrink-0 whitespace-nowrap disabled:opacity-60">
                  {printingId === b.id ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                  {t("voucher.print", { defaultValue: "Print voucher" })}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-200 text-slate-400 text-sm font-medium rounded-xl flex-shrink-0 cursor-not-allowed whitespace-nowrap">
                  <Clock size={14}/> {t("portalCommon:status.pending")}
                </span>
              )}
            </div>
          );
        })}
      </PortalState>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Info size={15} className="text-amber-500 flex-shrink-0 mt-0.5"/>
        <p className="text-sm text-amber-700">{t("voucher.hint")}</p>
      </div>
    </div>
  );
}

// ─── SUPPORT ────────────────────────────────────────────────────────────────
function TicketThread({ id, onBack }: { id: string; onBack: () => void }) {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalTicket(id);
  const tk = q.data;
  const [msg, setMsg] = useState("");
  const add = useAddTicketMessage(id);
  const send = () => { const b = msg.trim(); if (!b) return; setMsg(""); add.mutate(b); };
  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ChevronRight size={16} className="rotate-180"/></button>
        <div>
          <p className="font-bold text-slate-800 text-base">{tk?.subject}</p>
          <p className="text-xs text-slate-400 font-mono">{tk?.ticketNo} · <span className="capitalize">{tk?.status ? t(`support.status.${tk.status.toLowerCase()}`, { defaultValue: tk.status.toLowerCase() }) : ""}</span></p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        <PortalState query={q}>
          {(tk?.messages ?? []).map((m)=>(
            <div key={m.id} className={cn("flex",m.mine?"justify-end":"justify-start")}>
              {!m.mine && <div className="w-8 h-8 rounded-full bg-[#1B75BC] flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end">BD</div>}
              <div className={cn("max-w-xs px-4 py-2.5 rounded-2xl text-sm", m.mine?"bg-[#1B75BC] text-white rounded-br-sm":"bg-slate-100 text-slate-700 rounded-bl-sm")}>
                {m.body}
                <p className={cn("text-xs mt-1",m.mine?"text-white/60":"text-slate-400")}>{fmtDate(m.createdAt)}</p>
              </div>
            </div>
          ))}
        </PortalState>
      </div>
      <div className="flex items-center gap-2">
        <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={t("support.messagePlaceholder")}
          className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm focus:outline-none"/>
        <button onClick={send} disabled={add.isPending} className="p-2.5 bg-[#1B75BC] text-white rounded-xl hover:bg-[#14588F] disabled:opacity-50">{add.isPending?<Loader2 size={16} className="animate-spin"/>:<Send size={16}/>}</button>
      </div>
    </div>
  );
}

function SupportView() {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalTickets();
  const rows = q.data ?? [];
  const [active, setActive] = useState<string|null>(null);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const create = useCreateTicket();
  const submit = async () => {
    if (subject.trim().length < 3 || !message.trim()) return;
    const t = await create.mutateAsync({ subject: subject.trim(), message: message.trim() });
    setCreating(false); setSubject(""); setMessage(""); setActive(t.id);
  };

  if (active) return <TicketThread id={active} onBack={()=>setActive(null)}/>;

  return (
    <div className="space-y-4" data-portal="support">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.support")}</h2>
        <button onClick={()=>setCreating(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#1B75BC] text-white rounded-xl hover:bg-[#14588F] whitespace-nowrap"><Plus size={14}/> {t("support.newTicket")}</button>
      </div>
      {creating && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[#1B75BC]/30 p-4 space-y-3">
          <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder={t("support.subject")} className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} placeholder={t("support.helpPlaceholder")} className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none resize-none"/>
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setCreating(false)} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-xl text-slate-600 whitespace-nowrap">{t("common:actions.cancel")}</button>
            <button onClick={submit} disabled={create.isPending || subject.trim().length<3 || !message.trim()} className="px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap">{create.isPending&&<Loader2 size={13} className="animate-spin"/>}{t("support.create")}</button>
          </div>
        </div>
      )}
      <PortalState query={q} empty={rows.length === 0 && !creating}>
        {rows.map(tk=>(
          <div key={tk.id} onClick={()=>setActive(tk.id)} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 pr-3">
                <p className="text-xs text-slate-400 font-mono mb-1">{tk.ticketNo}</p>
                <p className="font-semibold text-slate-800">{tk.subject}</p>
              </div>
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0",
                tk.status==="OPEN"?"bg-blue-50 text-blue-600 border border-blue-200":"bg-emerald-50 text-emerald-600 border border-emerald-200")}>{t(`support.status.${tk.status.toLowerCase()}`, { defaultValue: tk.status.toLowerCase() })}</span>
            </div>
            {tk.lastMessage && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{tk.lastMessage}</p>}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><MessageCircle size={11}/> {t("support.messagesCount", { count: tk.messageCount })}</span>
              <span>{fmtDate(tk.createdAt)}</span>
            </div>
          </div>
        ))}
      </PortalState>
    </div>
  );
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
function NotificationsView() {
  const { t } = useTranslation("portalCustomer");
  const q = usePortalNotifications();
  const rows = q.data ?? [];
  const markAll = useMarkAllNotificationsRead();
  return (
    <div className="space-y-4" data-portal="notifications">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.notifications")}</h2>
        <button onClick={()=>markAll.mutate()} disabled={markAll.isPending} className="text-sm text-[#1B75BC] hover:underline font-medium disabled:opacity-50 whitespace-nowrap">{t("notifications.markAllRead")}</button>
      </div>
      <PortalState query={q} empty={rows.length === 0}>
        <div className="space-y-3">
          {rows.map(n=>(
            <div key={n.id} className={cn("flex items-start gap-3 p-4 rounded-2xl border transition-all", n.read?"bg-[var(--color-surface)] border-[var(--color-border)]":"bg-[#1B75BC]/4 border-[#1B75BC]/15")}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: (n.color||"#1B75BC")+"20" }}>
                <div className="w-3 h-3 rounded-full" style={{ background: n.color || "#1B75BC" }}/>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">{n.title}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[#1B75BC] flex-shrink-0"/>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap mt-0.5">{fmtDate(n.createdAt)}</span>
            </div>
          ))}
        </div>
      </PortalState>
    </div>
  );
}

// ─── PROFILE ────────────────────────────────────────────────────────────────
function ProfileView() {
  const { t } = useTranslation("portalCustomer");
  const { logout } = useAuth();
  const q = usePortalMe();
  const me = q.data;
  const initials = (me?.name ?? "").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="space-y-5" data-portal="profile">
      <h2 className="text-xl font-bold text-slate-800">{t("portalCommon:nav.myProfile")}</h2>
      <PortalState query={q}>
        {me && (<>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1B75BC] to-[#0E7C66] flex items-center justify-center text-white text-2xl font-black">{initials}</div>
              <div>
                <p className="font-bold text-slate-800 text-lg">{me.name}</p>
                <p className="text-sm text-slate-400">{t("profile.customer")} · {t("profile.since", { year: new Date(me.memberSince).getFullYear() })}</p>
                {me.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_,i)=><Star key={i} size={12} className="text-amber-400 fill-amber-400"/>)}
                    <span className="text-xs text-slate-400 ml-1">{me.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">{t("profile.personalInfo")}</p>
            {[
              { field:"Full Name",     label:t("profile.fullName"),        val:me.name },
              { field:"Phone",         label:t("portalCommon:labels.phone"),val:me.phone },
              { field:"Email",         label:t("portalCommon:labels.email"),val:me.email ?? "—" },
              { field:"Date of Birth", label:t("profile.dob"),             val:me.dob ?? "—" },
              { field:"NID Number",    label:t("profile.nid"),             val:me.nid ?? "—" },
              { field:"Passport No.",  label:t("profile.passportNo"),      val:me.passportNo ?? "—" },
            ].map(f=>(
              <div key={f.field}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
                <input value={f.val} disabled data-field={f.field} className="w-full px-3 py-2.5 text-sm rounded-xl border border-transparent bg-[var(--color-bg)] text-slate-700 cursor-default"/>
              </div>
            ))}
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">{t("profile.addressSection")}</p>
            {[[t("profile.address"),me.addressLine ?? "—"],[t("profile.district"),me.district ?? "—"],[t("profile.division"),me.division ?? "—"],[t("profile.country"),me.country ?? "—"]].map(([l,v])=>(
              <div key={l}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
                <input value={v} disabled className="w-full px-3 py-2.5 text-sm rounded-xl border border-transparent bg-[var(--color-bg)] text-slate-700"/>
              </div>
            ))}
          </div>

          <button onClick={() => void logout()} className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50 transition-colors whitespace-nowrap">
            <LogOut size={16}/> {t("common.signOut")}
          </button>
        </>)}
      </PortalState>
    </div>
  );
}

// ─── PORTAL SHELL ────────────────────────────────────────────────────────────
export function CustomerPortal() {
  const { t } = useTranslation("portalCustomer");
  const { logout } = useAuth();
  const [view, setView] = useState<PortalView>("dashboard");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { data: me } = usePortalMe();
  const { data: dash } = usePortalDashboard();
  const unreadNotif = dash?.counts.unreadNotifications ?? 0;
  const name = me?.name ?? t("common.customerFallback");

  const go = (v: PortalView) => setView(v);
  const openBooking = (id: string) => { setBookingId(id); setView("booking-detail"); };

  const navItems: PortalNavItem[] = NAV.map((item) => ({ id: item.id, label: t(item.labelKey), icon: item.icon }));
  const activeId = view === "booking-detail" ? "bookings" : view;

  const headerExtra = (
    <button
      type="button"
      onClick={() => go("notifications")}
      aria-label={t("portalCommon:nav.notifications")}
      className="relative p-2 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] transition-colors mr-1 cursor-pointer"
    >
      <Bell size={18}/>
      {unreadNotif > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--color-danger)] text-white text-[10px] flex items-center justify-center rounded-full font-bold">
          {unreadNotif > 9 ? "9+" : unreadNotif}
        </span>
      )}
    </button>
  );

  const renderView = () => {
    switch(view) {
      case "dashboard":      return <Dashboard onGo={go}/>;
      case "bookings":       return <BookingsView onDetail={openBooking}/>;
      case "booking-detail": return bookingId ? <BookingDetail bookingId={bookingId} onBack={()=>go("bookings")}/> : <BookingsView onDetail={openBooking}/>;
      case "visas":          return <VisaStatusView onDetail={openBooking}/>;
      case "payments":       return <PaymentsView/>;
      case "installments":   return <InstallmentsView/>;
      case "invoices":       return <InvoicesView/>;
      case "documents":      return <DocumentsView/>;
      case "downloads":      return <DownloadsView/>;
      case "voucher":        return <VoucherView/>;
      case "ai":             return <AiAssistantView/>;
      case "support":        return <SupportView/>;
      case "notifications":  return <NotificationsView/>;
      case "profile":        return <ProfileView/>;
    }
  };

  return (
    <PortalShell
      title={t("shell.myPortal")}
      navItems={navItems}
      activeId={activeId}
      onNav={(id) => go(id as PortalView)}
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

export default CustomerPortal;
