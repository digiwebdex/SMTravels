import React, { useState } from "react";
import {
  LayoutDashboard, Calendar, CreditCard, Layers, FileText,
  FolderOpen, Download, MessageCircle, Bell, User, LogOut,
  ChevronRight, ChevronDown, Clock, CheckCircle, Circle,
  AlertCircle, Plane, Hotel, Globe, Star, Phone, Mail,
  Upload, Paperclip, Send, X, Plus, ArrowRight, Eye,
  MapPin, Shield, Camera, Edit2, Check, Info, Package,
  Wallet, Ticket, RefreshCw, MoreHorizontal,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Loader2 } from "lucide-react";
import { SampleBadge } from "./SampleBadge";
import {
  usePortalMe, usePortalDashboard, usePortalBookings, usePortalBooking,
  usePortalInvoices, usePortalPayments, usePortalInstallments, usePortalDocuments,
  usePortalTickets, usePortalTicket, useCreateTicket, useAddTicketMessage,
  usePortalNotifications, useMarkAllNotificationsRead,
} from "../hooks/portal";
import type { PortalBooking } from "../hooks/portal";

// ── shared query-state wrapper ────────────────────────────────────────────────
function PortalState({ query, children, empty }: {
  query: { isLoading: boolean; isError: boolean; error?: unknown };
  children: React.ReactNode; empty?: boolean;
}) {
  if (query.isLoading) return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>;
  if (query.isError) return <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-600 text-center">{(query.error as Error)?.message || "Failed to load."}</div>;
  if (empty) return <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400">Nothing here yet.</div>;
  return <>{children}</>;
}
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

// ─── Types & nav ──────────────────────────────────────────────────────────────
type PortalView =
  | "dashboard" | "bookings" | "booking-detail"
  | "payments" | "installments" | "invoices"
  | "documents" | "voucher" | "support" | "notifications" | "profile";

const NAV = [
  { id:"dashboard"     as PortalView, label:"My Dashboard",     icon:LayoutDashboard },
  { id:"bookings"      as PortalView, label:"My Bookings",      icon:Calendar        },
  { id:"payments"      as PortalView, label:"Payment History",  icon:CreditCard      },
  { id:"installments"  as PortalView, label:"Installments",     icon:Layers          },
  { id:"invoices"      as PortalView, label:"Invoices",         icon:FileText        },
  { id:"documents"     as PortalView, label:"My Documents",     icon:FolderOpen      },
  { id:"voucher"       as PortalView, label:"Download Voucher", icon:Download        },
  { id:"support"       as PortalView, label:"Support",          icon:MessageCircle   },
  { id:"notifications" as PortalView, label:"Notifications",    icon:Bell, badge:2   },
  { id:"profile"       as PortalView, label:"My Profile",       icon:User            },
];

const BOTTOM_NAV = [
  { id:"dashboard"   as PortalView, icon:LayoutDashboard, label:"Home"      },
  { id:"bookings"    as PortalView, icon:Calendar,        label:"Bookings"  },
  { id:"payments"    as PortalView, icon:CreditCard,      label:"Payments"  },
  { id:"support"     as PortalView, icon:MessageCircle,   label:"Support"   },
  { id:"profile"     as PortalView, icon:User,            label:"Profile"   },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtBDT = (n: number) => "৳ " + n.toLocaleString("en-BD");

const STATUS_CFG: Record<string,{ label:string; chip:string; dot:string }> = {
  confirmed: { label:"Confirmed",  chip:"bg-[#0E6BB8]/10 text-[#0E6BB8] border-[#0E6BB8]/20",   dot:"bg-[#0E6BB8]"  },
  completed: { label:"Completed",  chip:"bg-emerald-50 text-emerald-700 border-emerald-200",      dot:"bg-emerald-500"},
  pending:   { label:"Pending",    chip:"bg-amber-50 text-amber-700 border-amber-200",            dot:"bg-amber-400"  },
  cancelled: { label:"Cancelled",  chip:"bg-red-50 text-red-600 border-red-200",                  dot:"bg-red-500"    },
};
const DOC_STATUS_CFG: Record<string,{ label:string; cls:string; icon:React.ElementType }> = {
  verified: { label:"Verified",  cls:"text-emerald-600 bg-emerald-50 border-emerald-200", icon:CheckCircle  },
  pending:  { label:"Pending",   cls:"text-amber-600 bg-amber-50 border-amber-200",       icon:Clock        },
  missing:  { label:"Missing",   cls:"text-red-500 bg-red-50 border-red-200",             icon:AlertCircle  },
};

function StatusChip({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", c.chip)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)}/>{c.label}
    </span>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ onGo }: { onGo: (v: PortalView) => void }) {
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
          style={{ background:"linear-gradient(135deg, #0E6BB8 0%, #0E4D7A 60%, #0E7C66 100%)" }}>
          <div className="px-6 py-7 text-white relative z-10">
            <p className="text-sm text-white/70 mb-1">Welcome back,</p>
            <h2 className="text-2xl font-bold mb-1">{d.customerName}</h2>
            <p className="text-white/60 text-sm">{next ? <>Your <span className="text-[#C43A15] font-semibold">{next.serviceType.replace(/_/g, " ").toLowerCase()}</span> booking is active ✈️</> : "No active bookings"}</p>
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{d.counts.bookings}</p>
                <p className="text-xs text-white/60 mt-0.5">Bookings</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{d.counts.documents}</p>
                <p className="text-xs text-white/60 mt-0.5">Documents</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{d.counts.unpaidInvoices}</p>
                <p className="text-xs text-white/60 mt-0.5">Unpaid</p>
              </div>
            </div>
          </div>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5"/>
          <div className="absolute -bottom-6 -right-4 w-24 h-24 rounded-full bg-white/5"/>
        </div>

        {/* Next booking card */}
        {next && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Next Booking</p>
              <h3 className="font-bold text-slate-800 text-lg capitalize">{next.serviceType.replace(/_/g, " ").toLowerCase()}</h3>
              <p className="text-sm text-slate-500 mt-1 font-mono">{next.bookingNo || "—"}</p>
            </div>
            <StatusChip status={next.status.toLowerCase()}/>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Plane size={11}/>Departs {fmtDate(next.departureDate)}</span>
          </div>
        </div>
        )}

        {/* Balance due */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-800">Balance Due</p>
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl font-black text-red-500" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(d.balanceDue)}</p>
              <p className="text-xs text-slate-400 mt-0.5">across {d.counts.unpaidInvoices} unpaid invoice(s)</p>
            </div>
            <button onClick={()=>onGo("installments")}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0E6BB8] text-white text-sm font-semibold rounded-xl hover:bg-[#0B5794] transition-colors">
              View Plan <ArrowRight size={14}/>
            </button>
          </div>
          {next && next.amount > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500"><span>{fmtBDT(next.paidAmount)} paid on next booking</span><span>{paidPct}%</span></div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#0E6BB8] to-[#0E7C66] transition-all" style={{ width:`${paidPct}%` }}/>
            </div>
          </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon:FolderOpen,   label:"My Documents",  color:"bg-blue-50 text-blue-600",   v:"documents"    as PortalView },
            { icon:FileText,     label:"Invoices",       color:"bg-purple-50 text-purple-600",v:"invoices"     as PortalView },
            { icon:MessageCircle,label:"Get Support",    color:"bg-emerald-50 text-emerald-600",v:"support"    as PortalView },
            { icon:Layers,       label:"Installments",   color:"bg-amber-50 text-amber-600",  v:"installments" as PortalView },
          ].map(l=>(
            <button key={l.label} onClick={()=>onGo(l.v)}
              className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#0E6BB8]/30 hover:shadow-sm transition-all group text-left">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", l.color)}><l.icon size={18}/></div>
              <span className="text-sm font-semibold text-slate-700">{l.label}</span>
              <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-[#0E6BB8] transition-colors"/>
            </button>
          ))}
        </div>

        {/* Recent notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-800">Recent Updates</p>
            <button onClick={()=>onGo("notifications")} className="text-xs text-[#0E6BB8] hover:underline">See all</button>
          </div>
          <div className="space-y-2.5">
            {d.recentNotifications.length === 0 && <p className="text-sm text-slate-400 py-2">No updates.</p>}
            {d.recentNotifications.map(n=>(
              <div key={n.id} className={cn("flex items-start gap-3 p-3 rounded-xl transition-colors", n.read?"bg-slate-50":"bg-[#0E6BB8]/4")}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.color || "#0E6BB8" }}/>
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
  const q = usePortalBookings();
  const rows = q.data ?? [];
  return (
    <div className="space-y-4" data-portal="bookings">
      <h2 className="text-xl font-bold text-slate-800">My Bookings</h2>
      <PortalState query={q} empty={rows.length === 0}>
        {rows.map(b=>(
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={()=>onDetail(b.id)}>
            <div className="px-5 py-4 border-b border-slate-100">
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
                {[["Departure",fmtDate(b.departureDate)],["Return",fmtDate(b.returnDate)],["Currency",b.currency]].map(([k,v])=>(
                  <div key={k}><p className="text-xs text-slate-400 mb-0.5">{k}</p><p className="text-sm font-semibold text-slate-700">{v}</p></div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-slate-400">Total Amount</p><p className="font-bold text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(b.amount)}</p></div>
                {b.dueAmount > 0 ? (
                  <div className="text-right"><p className="text-xs text-red-400">Balance Due</p><p className="font-bold text-red-500" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(b.dueAmount)}</p></div>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle size={14} className="fill-emerald-100"/> Fully Paid</span>
                )}
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <span className="flex items-center gap-1 text-xs text-[#0E6BB8] font-semibold">View Details <ChevronRight size={12}/></span>
            </div>
          </div>
        ))}
      </PortalState>
    </div>
  );
}

// ─── BOOKING DETAIL ───────────────────────────────────────────────────────────
function BookingDetail({ bookingId, onBack }: { bookingId: string; onBack: () => void }) {
  const q = usePortalBooking(bookingId);
  const b = q.data;
  return (
    <div className="space-y-5" data-portal="booking-detail">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ChevronRight size={14} className="rotate-180"/> Back to bookings
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <p className="font-semibold text-slate-700 text-sm">Journey Details</p>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(b.detail).filter(([, v]) => v).map(([label, val])=>(
                <div key={label} className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0E6BB8]/8 flex items-center justify-center flex-shrink-0 mt-0.5"><Globe size={14} className="text-[#0E6BB8]"/></div>
                  <div><p className="text-xs text-slate-400">{label}</p><p className="text-sm font-semibold text-slate-700">{val}</p></div>
                </div>
              ))}
            </div>
          </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="font-semibold text-slate-700 text-sm mb-5">Booking Timeline</p>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100"/>
              <div className="space-y-6">
                {b.timeline.map((step,i)=>(
                  <div key={i} className="flex items-center gap-4 relative">
                    <div className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10",
                      step.done ? "bg-[#0E6BB8] border-[#0E6BB8]" : "bg-white border-slate-200")}>
                      {step.done ? <Check size={14} className="text-white"/> : <Circle size={10} className="text-slate-300"/>}
                    </div>
                    <div className="flex-1"><p className={cn("text-sm font-semibold", step.done?"text-slate-800":"text-slate-400")}>{step.label}</p></div>
                    <span className={cn("text-xs font-medium", step.done?"text-[#0E6BB8]":"text-slate-400")}>{fmtDate(step.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="font-semibold text-slate-700 text-sm mb-3">Payment Summary</p>
            <div className="space-y-2.5">
              {[["Total Amount",b.amount],["Amount Paid",b.paidAmount],["Balance Due",b.dueAmount]].map(([k,v],i)=>(
                <div key={i} className={cn("flex justify-between items-center",i===2&&"pt-2.5 border-t border-slate-100")}>
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
function PaymentsView() {
  const q = usePortalPayments();
  const rows = q.data ?? [];
  const totalPaid = rows.filter(p => !p.reversed).reduce((s,p)=>s+p.amount,0);
  return (
    <div className="space-y-4" data-portal="payments">
      <h2 className="text-xl font-bold text-slate-800">Payment History</h2>
      <PortalState query={q} empty={rows.length === 0}>
        <div className="grid grid-cols-2 gap-3">
          {[["Total Paid",fmtBDT(totalPaid)],["Transactions",String(rows.length)]].map(([l,v])=>(
            <div key={l} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">{l}</p>
              <p className="text-xl font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{v}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {rows.map(p=>(
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", p.reversed?"bg-red-100":"bg-emerald-100")}>
                    <CheckCircle size={18} className={p.reversed?"text-red-500":"text-emerald-600"}/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.invoiceNo || "Payment"}</p>
                    <p className="text-xs text-slate-400">{p.method.replace(/_/g," ")} · {fmtDate(p.paidAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold", p.reversed?"text-slate-400 line-through":"text-slate-800")} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(p.amount)}</p>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", p.reversed?"bg-red-50 text-red-500":"bg-emerald-50 text-emerald-600")}>{p.reversed?"Reversed":"Paid"}</span>
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
  const q = usePortalInstallments();
  const plans = q.data ?? [];
  return (
    <div className="space-y-5" data-portal="installments">
      <h2 className="text-xl font-bold text-slate-800">Installments</h2>
      <PortalState query={q} empty={plans.length === 0}>
        {plans.map(plan=>{
          const paidCount = plan.installments.filter(i=>i.status==="PAID").length;
          const total = plan.installments.length;
          const pct = total ? Math.round((paidCount/total)*100) : 0;
          return (
            <div key={plan.id} className="space-y-3">
              <div className="bg-gradient-to-br from-[#0E6BB8] to-[#0E4D7A] rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/70 text-xs mb-1 font-mono">{plan.bookingNo || "Plan"} · {fmtBDT(plan.total)}</p>
                    <p className="text-2xl font-black">{paidCount} of {total} <span className="text-sm font-normal text-white/70">paid</span></p>
                    <p className="text-white/70 text-xs mt-1">Remaining {fmtBDT(plan.remaining)}</p>
                  </div>
                  <div className="w-14 h-14 rounded-full border-4 border-white/20 flex items-center justify-center"><span className="text-lg font-black">{pct}%</span></div>
                </div>
                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-[#E8471F] rounded-full transition-all" style={{ width:`${pct}%` }}/></div>
              </div>
              <div className="space-y-3">
                {plan.installments.map((inst)=>{
                  const isPaid = inst.status === "PAID";
                  const isNext = inst.status === "DUE" || inst.status === "OVERDUE";
                  return (
                    <div key={inst.number} className={cn("bg-white rounded-2xl border p-5 transition-all", isNext?"border-[#0E6BB8]/40 shadow-md shadow-[#0E6BB8]/8":"border-slate-200")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0", isPaid?"border-emerald-500 bg-emerald-50":isNext?"border-[#E8471F] bg-amber-50":"border-slate-200 bg-slate-50")}>
                          {isPaid ? <Check size={16} className="text-emerald-600"/> : <span className="text-xs font-bold text-slate-500">{inst.number}</span>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-800">{inst.label || `Installment ${inst.number}`}</p>
                            {isNext && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold capitalize">{inst.status.toLowerCase()}</span>}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{isPaid ? `Paid on ${fmtDate(inst.paidDate)}` : `Due ${fmtDate(inst.dueDate)}`}</p>
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
  const q = usePortalInvoice(id);
  const inv = q.data;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <h3 className="font-bold text-slate-800 font-mono">{inv?.invoiceNo || "Invoice"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
        </div>
        <div className="p-6">
          <PortalState query={q}>
            {inv && (<>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="w-12 h-10 bg-[#0E6BB8] rounded-xl flex items-center justify-center text-white text-xs font-black mb-2">BDH</div>
                  <p className="font-bold text-slate-800">BDH Travels & Tourism</p>
                  <p className="text-xs text-slate-400">Agrabad, Chattogram</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-[#0E6BB8]">INVOICE</p>
                  <p className="text-xs text-slate-400 font-mono">{inv.invoiceNo}</p>
                  <p className="text-xs text-slate-400">{fmtDate(inv.issueDate)}</p>
                </div>
              </div>
              <table className="w-full mb-4">
                <thead><tr className="border-b border-slate-100"><th className="text-left text-xs text-slate-400 pb-2">Item</th><th className="text-right text-xs text-slate-400 pb-2">Amount</th></tr></thead>
                <tbody>
                  {inv.items.map((it,i)=>(
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2 text-sm text-slate-700">{it.description} <span className="text-slate-400">× {it.qty}</span></td>
                      <td className="py-2 text-sm text-right font-mono text-slate-800">{fmtBDT(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {([["Total",inv.total],["Paid",inv.paidAmount],["Balance Due",inv.dueAmount]] as [string,number][]).map(([k,v],i)=>(
                <div key={k} className={cn("flex justify-between",i===2&&"font-bold text-red-500 pt-2 border-t border-slate-100")}>
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
  const q = usePortalInvoices();
  const rows = q.data ?? [];
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="space-y-4" data-portal="invoices">
      <h2 className="text-xl font-bold text-slate-800">Invoices</h2>
      <PortalState query={q} empty={rows.length === 0}>
        {rows.map(inv=>(
          <div key={inv.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400 font-mono">{inv.invoiceNo || "DRAFT"}</p>
                <p className="text-xs text-slate-400 mt-0.5">Issued {fmtDate(inv.issueDate)} · Due {fmtDate(inv.dueDate)}</p>
              </div>
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border capitalize",
                inv.status==="PAID"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-amber-50 text-amber-700 border-amber-200")}>{inv.status.toLowerCase()}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <p className="font-black text-slate-800 text-lg" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(inv.total)}</p>
                {inv.dueAmount > 0 && <p className="text-xs text-red-500">Balance {fmtBDT(inv.dueAmount)}</p>}
              </div>
              <button onClick={()=>setPreview(inv.id)} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"><Eye size={13}/> View</button>
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
  const q = usePortalDocuments();
  const rows = q.data ?? [];
  return (
    <div className="space-y-4" data-portal="documents">
      <div>
        <h2 className="text-xl font-bold text-slate-800">My Documents</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your uploaded travel documents</p>
      </div>
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5"/>
        <p className="text-sm text-blue-700">Please ensure all required documents are uploaded at least 30 days before departure. (Uploads via the counter for now.)</p>
      </div>
      <PortalState query={q} empty={rows.length === 0}>
        <div className="space-y-3">
          {rows.map(doc=>{
            const sc = DOC_STATUS_CFG[doc.status.toLowerCase()] ?? DOC_STATUS_CFG.pending;
            const Icon = sc.icon;
            return (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0"><Shield size={18} className="text-slate-400"/></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                      {doc.required && <span className="text-xs text-red-400 font-medium">Required</span>}
                    </div>
                    <span className={cn("inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium border",sc.cls)}>
                      <Icon size={10}/>{sc.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 capitalize flex-shrink-0">{doc.type.toLowerCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </PortalState>
    </div>
  );
}

// ─── VOUCHER ────────────────────────────────────────────────────────────────
function VoucherView() {
  return (
    <div className="space-y-5">
      <SampleBadge />
      <div>
        <h2 className="text-xl font-bold text-slate-800">Download Voucher</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your official travel vouchers and confirmation letters</p>
      </div>
      {[
        { id:"BK-0892", title:"Hajj Economy 2024", type:"Booking Voucher",   ready:true,  bg:"#0E6BB8" },
        { id:"BK-0892", title:"Hajj Economy 2024", type:"Hotel Confirmation", ready:true,  bg:"#0E7C66" },
        { id:"BK-0892", title:"Hajj Economy 2024", type:"Flight Itinerary",  ready:true,  bg:"#2563EB" },
        { id:"BK-0892", title:"Hajj Economy 2024", type:"Visa Copy",         ready:true,  bg:"#E8471F" },
        { id:"BK-0892", title:"Hajj Economy 2024", type:"Group Letter",      ready:false, bg:"#7C3AED" },
      ].map((v,i)=>(
        <div key={i} className={cn("rounded-2xl p-5 flex items-center gap-4",
          v.ready?"bg-white border border-slate-200":"bg-slate-50 border border-dashed border-slate-200")}>
          <div className="w-12 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: v.ready ? v.bg : "#CBD5E1" }}>
            <FileText size={22} className="text-white"/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 mb-0.5">{v.id}</p>
            <p className="font-bold text-slate-800">{v.type}</p>
            <p className="text-xs text-slate-400">{v.title}</p>
          </div>
          {v.ready ? (
            <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0E6BB8] text-white text-sm font-semibold rounded-xl hover:bg-[#0B5794] transition-colors flex-shrink-0">
              <Download size={14}/> Download
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-200 text-slate-400 text-sm font-medium rounded-xl flex-shrink-0 cursor-not-allowed">
              <Clock size={14}/> Pending
            </span>
          )}
        </div>
      ))}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Info size={15} className="text-amber-500 flex-shrink-0 mt-0.5"/>
        <p className="text-sm text-amber-700">Vouchers will be available to download once your booking is fully confirmed and visa is approved.</p>
      </div>
    </div>
  );
}

// ─── SUPPORT ────────────────────────────────────────────────────────────────
function TicketThread({ id, onBack }: { id: string; onBack: () => void }) {
  const q = usePortalTicket(id);
  const t = q.data;
  const [msg, setMsg] = useState("");
  const add = useAddTicketMessage(id);
  const send = () => { const b = msg.trim(); if (!b) return; setMsg(""); add.mutate(b); };
  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ChevronRight size={16} className="rotate-180"/></button>
        <div>
          <p className="font-bold text-slate-800 text-base">{t?.subject}</p>
          <p className="text-xs text-slate-400 font-mono">{t?.ticketNo} · <span className="capitalize">{t?.status.toLowerCase()}</span></p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        <PortalState query={q}>
          {(t?.messages ?? []).map((m)=>(
            <div key={m.id} className={cn("flex",m.mine?"justify-end":"justify-start")}>
              {!m.mine && <div className="w-8 h-8 rounded-full bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end">BD</div>}
              <div className={cn("max-w-xs px-4 py-2.5 rounded-2xl text-sm", m.mine?"bg-[#0E6BB8] text-white rounded-br-sm":"bg-slate-100 text-slate-700 rounded-bl-sm")}>
                {m.body}
                <p className={cn("text-xs mt-1",m.mine?"text-white/60":"text-slate-400")}>{fmtDate(m.createdAt)}</p>
              </div>
            </div>
          ))}
        </PortalState>
      </div>
      <div className="flex items-center gap-2">
        <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type your message…"
          className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm focus:outline-none"/>
        <button onClick={send} disabled={add.isPending} className="p-2.5 bg-[#0E6BB8] text-white rounded-xl hover:bg-[#0B5794] disabled:opacity-50">{add.isPending?<Loader2 size={16} className="animate-spin"/>:<Send size={16}/>}</button>
      </div>
    </div>
  );
}

function SupportView() {
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
        <h2 className="text-xl font-bold text-slate-800">Support</h2>
        <button onClick={()=>setCreating(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#0E6BB8] text-white rounded-xl hover:bg-[#0B5794]"><Plus size={14}/> New Ticket</button>
      </div>
      {creating && (
        <div className="bg-white rounded-2xl border border-[#0E6BB8]/30 p-4 space-y-3">
          <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20"/>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} placeholder="How can we help?" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"/>
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setCreating(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600">Cancel</button>
            <button onClick={submit} disabled={create.isPending || subject.trim().length<3 || !message.trim()} className="px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5">{create.isPending&&<Loader2 size={13} className="animate-spin"/>}Create</button>
          </div>
        </div>
      )}
      <PortalState query={q} empty={rows.length === 0 && !creating}>
        {rows.map(t=>(
          <div key={t.id} onClick={()=>setActive(t.id)} className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 pr-3">
                <p className="text-xs text-slate-400 font-mono mb-1">{t.ticketNo}</p>
                <p className="font-semibold text-slate-800">{t.subject}</p>
              </div>
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 capitalize",
                t.status==="OPEN"?"bg-blue-50 text-blue-600 border border-blue-200":"bg-emerald-50 text-emerald-600 border border-emerald-200")}>{t.status.toLowerCase()}</span>
            </div>
            {t.lastMessage && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{t.lastMessage}</p>}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><MessageCircle size={11}/> {t.messageCount} messages</span>
              <span>{fmtDate(t.createdAt)}</span>
            </div>
          </div>
        ))}
      </PortalState>
    </div>
  );
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
function NotificationsView() {
  const q = usePortalNotifications();
  const rows = q.data ?? [];
  const markAll = useMarkAllNotificationsRead();
  return (
    <div className="space-y-4" data-portal="notifications">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
        <button onClick={()=>markAll.mutate()} disabled={markAll.isPending} className="text-sm text-[#0E6BB8] hover:underline font-medium disabled:opacity-50">Mark all read</button>
      </div>
      <PortalState query={q} empty={rows.length === 0}>
        <div className="space-y-3">
          {rows.map(n=>(
            <div key={n.id} className={cn("flex items-start gap-3 p-4 rounded-2xl border transition-all", n.read?"bg-white border-slate-200":"bg-[#0E6BB8]/4 border-[#0E6BB8]/15")}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: (n.color||"#0E6BB8")+"20" }}>
                <div className="w-3 h-3 rounded-full" style={{ background: n.color || "#0E6BB8" }}/>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">{n.title}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[#0E6BB8] flex-shrink-0"/>}
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
  const q = usePortalMe();
  const me = q.data;
  const initials = (me?.name ?? "").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="space-y-5" data-portal="profile">
      <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
      <PortalState query={q}>
        {me && (<>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0E6BB8] to-[#0E7C66] flex items-center justify-center text-white text-2xl font-black">{initials}</div>
              <div>
                <p className="font-bold text-slate-800 text-lg">{me.name}</p>
                <p className="text-sm text-slate-400">Customer · Since {new Date(me.memberSince).getFullYear()}</p>
                {me.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_,i)=><Star key={i} size={12} className="text-amber-400 fill-amber-400"/>)}
                    <span className="text-xs text-slate-400 ml-1">{me.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">Personal Information</p>
            {[
              { label:"Full Name",     val:me.name },
              { label:"Phone",         val:me.phone },
              { label:"Email",         val:me.email ?? "—" },
              { label:"Date of Birth", val:me.dob ?? "—" },
              { label:"NID Number",    val:me.nid ?? "—" },
              { label:"Passport No.",  val:me.passportNo ?? "—" },
            ].map(f=>(
              <div key={f.label}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
                <input value={f.val} disabled data-field={f.label} className="w-full px-3 py-2.5 text-sm rounded-xl border border-transparent bg-slate-50 text-slate-700 cursor-default"/>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">Address</p>
            {[["Address",me.addressLine ?? "—"],["District",me.district ?? "—"],["Division",me.division ?? "—"],["Country",me.country ?? "—"]].map(([l,v])=>(
              <div key={l}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
                <input value={v} disabled className="w-full px-3 py-2.5 text-sm rounded-xl border border-transparent bg-slate-50 text-slate-700"/>
              </div>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50 transition-colors">
            <LogOut size={16}/> Sign Out
          </button>
        </>)}
      </PortalState>
    </div>
  );
}

// ─── PORTAL SHELL ────────────────────────────────────────────────────────────
export function CustomerPortal() {
  const [view, setView] = useState<PortalView>("dashboard");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { data: me } = usePortalMe();
  const { data: dash } = usePortalDashboard();
  const unreadNotif = dash?.counts.unreadNotifications ?? 0;
  const name = me?.name ?? "Customer";
  const initials = name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();

  const go = (v: PortalView) => setView(v);
  const openBooking = (id: string) => { setBookingId(id); setView("booking-detail"); };

  const renderView = () => {
    switch(view) {
      case "dashboard":      return <Dashboard onGo={go}/>;
      case "bookings":       return <BookingsView onDetail={openBooking}/>;
      case "booking-detail": return bookingId ? <BookingDetail bookingId={bookingId} onBack={()=>go("bookings")}/> : <BookingsView onDetail={openBooking}/>;
      case "payments":       return <PaymentsView/>;
      case "installments":   return <InstallmentsView/>;
      case "invoices":       return <InvoicesView/>;
      case "documents":      return <DocumentsView/>;
      case "voucher":        return <VoucherView/>;
      case "support":        return <SupportView/>;
      case "notifications":  return <NotificationsView/>;
      case "profile":        return <ProfileView/>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop layout */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-black">BDH</div>
              <div>
                <p className="text-sm font-bold text-slate-800">BDH Travels</p>
                <p className="text-xs text-[#0E7C66] font-medium">My Portal</p>
              </div>
            </div>
          </div>
          {/* User */}
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0E6BB8] to-[#0E7C66] flex items-center justify-center text-white text-xs font-black">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate" data-portal-name>{name}</p>
                <p className="text-xs text-slate-400 truncate">My Portal</p>
              </div>
            </div>
          </div>
          {/* Nav */}
          <nav className="flex-1 py-3 px-3 overflow-y-auto no-scrollbar">
            {NAV.map(item=>(
              <button key={item.id} onClick={()=>go(item.id)}
                className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all mb-0.5",
                  view===item.id||view==="booking-detail"&&item.id==="bookings"
                    ? "bg-[#0E6BB8] text-white shadow-sm shadow-[#0E6BB8]/25"
                    : "text-slate-600 hover:bg-slate-100")}>
                <item.icon size={17} className={view===item.id?"text-white":"text-slate-400"}/>
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{item.badge}</span>
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

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-black">BDH</div>
            <span className="font-bold text-slate-800 text-sm">My Portal</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={()=>go("notifications")} className="relative p-2 hover:bg-slate-100 rounded-xl">
              <Bell size={18} className="text-slate-500"/>
              {unreadNotif>0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-bold">{unreadNotif}</span>
              )}
            </button>
            <button onClick={()=>go("profile")} className="p-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0E6BB8] to-[#0E7C66] flex items-center justify-center text-white text-xs font-black">{initials}</div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          {renderView()}
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 safe-area-pb z-30">
          <div className="flex items-center justify-around">
            {BOTTOM_NAV.map(item=>{
              const active = view===item.id||(view==="booking-detail"&&item.id==="bookings");
              return (
                <button key={item.id} onClick={()=>go(item.id)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all">
                  <item.icon size={22} className={active?"text-[#0E6BB8]":"text-slate-400"}/>
                  <span className={cn("text-xs font-medium",active?"text-[#0E6BB8]":"text-slate-400")}>{item.label}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-[#0E6BB8]"/>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerPortal;
