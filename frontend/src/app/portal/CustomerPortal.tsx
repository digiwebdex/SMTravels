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

// ─── Mock data ────────────────────────────────────────────────────────────────
const BOOKINGS = [
  {
    id:"BK-0892", service:"Hajj Economy 2024", status:"confirmed",
    departure:"Aug 5, 2024", return:"Sep 12, 2024",
    destination:"Makkah & Madinah, Saudi Arabia",
    amount:520000, paid:390000, balance:130000,
    group:"42 pilgrims", flight:"BG-301 · Dhaka → Jeddah",
    hotel:"Dar Al-Tawhid, Makkah (5★)",
    visa:"SA-2024-KA8823991", passengers:1,
    timeline:[
      { label:"Booking Confirmed",   date:"Jun 12",  done:true  },
      { label:"Documents Submitted", date:"Jun 20",  done:true  },
      { label:"Visa Approved",       date:"Jul 1",   done:true  },
      { label:"Pre-departure Brief", date:"Aug 1",   done:false },
      { label:"Departure",           date:"Aug 5",   done:false },
      { label:"Return",              date:"Sep 12",  done:false },
    ],
  },
  {
    id:"BK-0741", service:"Malaysia Tour 5D/4N", status:"completed",
    departure:"May 10, 2024", return:"May 14, 2024",
    destination:"Kuala Lumpur & Genting, Malaysia",
    amount:215000, paid:215000, balance:0,
    group:"Family (3 pax)", flight:"AK-714 · Dhaka → KL",
    hotel:"Marriott KL (4★)",
    visa:"MY-2024-0082", passengers:3,
    timeline:[
      { label:"Booking Confirmed",   date:"Apr 5",  done:true },
      { label:"Documents Submitted", date:"Apr 12", done:true },
      { label:"Visa Approved",       date:"Apr 22", done:true },
      { label:"Departure",           date:"May 10", done:true },
      { label:"Return",              date:"May 14", done:true },
    ],
  },
];

const INSTALLMENTS = [
  { id:1, label:"1st Installment",  amount:130000, due:"Apr 30",  paid:true,  paidDate:"Apr 28" },
  { id:2, label:"2nd Installment",  amount:130000, due:"May 31",  paid:true,  paidDate:"May 30" },
  { id:3, label:"3rd Installment",  amount:130000, due:"Jun 30",  paid:true,  paidDate:"Jun 29" },
  { id:4, label:"4th Installment",  amount:130000, due:"Jul 31",  paid:false, paidDate:""       },
];

const PAYMENTS = [
  { id:"TXN-1092", desc:"3rd Installment — BK-0892",  amount:130000, method:"bKash",  date:"Jun 29",  status:"success" },
  { id:"TXN-0981", desc:"2nd Installment — BK-0892",  amount:130000, method:"Nagad",  date:"May 30",  status:"success" },
  { id:"TXN-0874", desc:"1st Installment — BK-0892",  amount:130000, method:"bKash",  date:"Apr 28",  status:"success" },
  { id:"TXN-0712", desc:"Malaysia Tour full payment",  amount:215000, method:"Bank",   date:"Apr 5",   status:"success" },
];

const DOCS_LIST = [
  { id:1, name:"Passport",            file:"passport-scan.jpg", status:"verified",  icon:Shield,  required:true  },
  { id:2, name:"Passport Photo",      file:"photo.jpg",          status:"verified",  icon:Camera,  required:true  },
  { id:3, name:"Saudi Visa",          file:"visa-SA.pdf",        status:"verified",  icon:Globe,   required:true  },
  { id:4, name:"Medical Certificate", file:"medical.pdf",         status:"pending",   icon:Shield,  required:true  },
  { id:5, name:"Vaccination Card",    file:"vaccination.pdf",     status:"missing",   icon:Shield,  required:false },
];

const TICKETS = [
  { id:"SUP-041", subject:"Visa delay update request",   status:"open",     date:"Jul 10", msgs:3, lastMsg:"Our visa team is processing your application. ETA 3–5 business days." },
  { id:"SUP-038", subject:"Hotel change request for Madinah", status:"resolved", date:"Jun 28", msgs:5, lastMsg:"Your hotel has been updated to Anwar Madinah. Confirmation sent to email." },
];

const NOTIFS = [
  { id:1, title:"Visa Approved! 🎉",            body:"Your Saudi Arabia visa has been approved. Download from Documents.", time:"Jul 1",   read:false, color:"#0E7C66" },
  { id:2, title:"Installment Reminder",          body:"Your 4th installment of ৳1,30,000 is due on Jul 31, 2024.",         time:"Jul 12",  read:false, color:"#C9A227" },
  { id:3, title:"Pre-departure brief added",     body:"Your group briefing is scheduled for Aug 1 at 3:00 PM.",             time:"Jul 8",   read:true,  color:"#14356B" },
  { id:4, title:"Payment confirmed",             body:"৳1,30,000 received for BK-0892. Thank you!",                        time:"Jun 29",  read:true,  color:"#0E7C66" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtBDT = (n: number) => "৳ " + n.toLocaleString("en-BD");

const STATUS_CFG: Record<string,{ label:string; chip:string; dot:string }> = {
  confirmed: { label:"Confirmed",  chip:"bg-[#14356B]/10 text-[#14356B] border-[#14356B]/20",   dot:"bg-[#14356B]"  },
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
  const next = BOOKINGS[0];
  const paidPct = Math.round((next.paid / next.amount) * 100);

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(135deg, #14356B 0%, #0E4D7A 60%, #0E7C66 100%)" }}>
        <div className="px-6 py-7 text-white relative z-10">
          <p className="text-sm text-white/70 mb-1">Welcome back,</p>
          <h2 className="text-2xl font-bold mb-1">Md. Karim Ullah</h2>
          <p className="text-white/60 text-sm">Your Hajj journey is <span className="text-[#C9A227] font-semibold">18 days away</span> ✈️</p>
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-bold" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{paidPct}%</p>
              <p className="text-xs text-white/60 mt-0.5">Paid</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-bold" style={{ fontFamily:"'JetBrains Mono',monospace" }}>42</p>
              <p className="text-xs text-white/60 mt-0.5">Group Size</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-bold" style={{ fontFamily:"'JetBrains Mono',monospace" }}>38</p>
              <p className="text-xs text-white/60 mt-0.5">Days Trip</p>
            </div>
          </div>
        </div>
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5"/>
        <div className="absolute -bottom-6 -right-4 w-24 h-24 rounded-full bg-white/5"/>
      </div>

      {/* Next departure card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Next Departure</p>
            <h3 className="font-bold text-slate-800 text-lg">{next.service}</h3>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
              <MapPin size={13}/>{next.destination}
            </div>
          </div>
          <div className="bg-[#C9A227] text-white px-3 py-1.5 rounded-xl text-xs font-bold">Aug 5</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Plane size={11}/>{next.flight.split("·")[0]}</span>
          <span className="flex items-center gap-1"><Hotel size={11}/>{next.hotel.split(",")[0]}</span>
        </div>
      </div>

      {/* Balance due */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-slate-800">Balance Due</p>
          <StatusChip status="confirmed"/>
        </div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-3xl font-black text-red-500" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(next.balance)}</p>
            <p className="text-xs text-slate-400 mt-0.5">of {fmtBDT(next.amount)} total · Due Jul 31</p>
          </div>
          <button onClick={()=>onGo("installments")}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#14356B] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2a56] transition-colors">
            Pay Now <ArrowRight size={14}/>
          </button>
        </div>
        {/* progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{fmtBDT(next.paid)} paid</span><span>{paidPct}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#14356B] to-[#0E7C66] transition-all"
              style={{ width:`${paidPct}%` }}/>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon:FolderOpen,   label:"My Documents",  color:"bg-blue-50 text-blue-600",   v:"documents"    as PortalView },
          { icon:Download,     label:"Voucher",        color:"bg-purple-50 text-purple-600",v:"voucher"      as PortalView },
          { icon:MessageCircle,label:"Get Support",    color:"bg-emerald-50 text-emerald-600",v:"support"    as PortalView },
          { icon:Layers,       label:"Installments",   color:"bg-amber-50 text-amber-600",  v:"installments" as PortalView },
        ].map(q=>(
          <button key={q.label} onClick={()=>onGo(q.v)}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#14356B]/30 hover:shadow-sm transition-all group text-left">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", q.color)}>
              <q.icon size={18}/>
            </div>
            <span className="text-sm font-semibold text-slate-700">{q.label}</span>
            <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-[#14356B] transition-colors"/>
          </button>
        ))}
      </div>

      {/* Recent notifications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-slate-800">Recent Updates</p>
          <button onClick={()=>onGo("notifications")} className="text-xs text-[#14356B] hover:underline">See all</button>
        </div>
        <div className="space-y-2.5">
          {NOTIFS.slice(0,3).map(n=>(
            <div key={n.id} className={cn("flex items-start gap-3 p-3 rounded-xl transition-colors", n.read?"bg-slate-50":"bg-[#14356B]/4")}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.color }}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.body}</p>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MY BOOKINGS ─────────────────────────────────────────────────────────────
function BookingsView({ onDetail }: { onDetail: () => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">My Bookings</h2>
      {BOOKINGS.map(b=>(
        <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={onDetail}>
          {/* Service header */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-mono mb-1">{b.id}</p>
                <h3 className="font-bold text-slate-800 text-base">{b.service}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin size={11}/>{b.destination}
                </div>
              </div>
              <StatusChip status={b.status}/>
            </div>
          </div>
          {/* Details */}
          <div className="px-5 py-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[["Departure",b.departure],["Return",b.return],["Group",b.group]].map(([k,v])=>(
                <div key={k}>
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-slate-700">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Amount</p>
                <p className="font-bold text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(b.amount)}</p>
              </div>
              {b.balance > 0 ? (
                <div className="text-right">
                  <p className="text-xs text-red-400">Balance Due</p>
                  <p className="font-bold text-red-500" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(b.balance)}</p>
                </div>
              ) : (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle size={14} className="fill-emerald-100"/> Fully Paid</span>
              )}
            </div>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1"><Plane size={11}/>{b.flight}</span>
            <span className="flex items-center gap-1 text-xs text-[#14356B] font-semibold">View Details <ChevronRight size={12}/></span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BOOKING DETAIL ───────────────────────────────────────────────────────────
function BookingDetail({ onBack }: { onBack: () => void }) {
  const b = BOOKINGS[0];
  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ChevronRight size={14} className="rotate-180"/> Back to bookings
        </button>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 font-mono">{b.id}</p>
            <h2 className="text-xl font-bold text-slate-800">{b.service}</h2>
          </div>
          <StatusChip status={b.status}/>
        </div>
      </div>

      {/* Journey card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <p className="font-semibold text-slate-700 text-sm">Journey Details</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon:Plane,   label:"Flight",       val:b.flight          },
            { icon:Hotel,   label:"Hotel",        val:b.hotel           },
            { icon:Globe,   label:"Destination",  val:b.destination     },
            { icon:Globe,   label:"Visa No.",     val:b.visa            },
          ].map(r=>(
            <div key={r.label} className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#14356B]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                <r.icon size={14} className="text-[#14356B]"/>
              </div>
              <div>
                <p className="text-xs text-slate-400">{r.label}</p>
                <p className="text-sm font-semibold text-slate-700">{r.val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="font-semibold text-slate-700 text-sm mb-5">Booking Timeline</p>
        <div className="relative">
          {/* spine */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100"/>
          <div className="space-y-6">
            {b.timeline.map((step,i)=>(
              <div key={i} className="flex items-center gap-4 relative">
                <div className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10",
                  step.done
                    ? "bg-[#14356B] border-[#14356B]"
                    : i === b.timeline.findIndex(s=>!s.done)
                      ? "bg-amber-400 border-amber-400"
                      : "bg-white border-slate-200")}>
                  {step.done
                    ? <Check size={14} className="text-white"/>
                    : i === b.timeline.findIndex(s=>!s.done)
                      ? <Clock size={12} className="text-white"/>
                      : <Circle size={10} className="text-slate-300"/>}
                </div>
                <div className="flex-1">
                  <p className={cn("text-sm font-semibold", step.done?"text-slate-800":"text-slate-400")}>{step.label}</p>
                </div>
                <span className={cn("text-xs font-medium", step.done?"text-[#14356B]":"text-slate-400")}>{step.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="font-semibold text-slate-700 text-sm mb-3">Payment Summary</p>
        <div className="space-y-2.5">
          {[["Total Amount",b.amount],["Amount Paid",b.paid],["Balance Due",b.balance]].map(([k,v],i)=>(
            <div key={i} className={cn("flex justify-between items-center",i===2&&"pt-2.5 border-t border-slate-100")}>
              <span className={cn("text-sm",i===2?"font-bold text-red-500":"text-slate-600")}>{k}</span>
              <span className={cn("font-bold",i===2?"text-red-500":"text-slate-800")}
                style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(v as number)}</span>
            </div>
          ))}
        </div>
        {b.balance > 0 && (
          <button className="w-full mt-4 py-3 bg-[#14356B] text-white font-semibold text-sm rounded-xl hover:bg-[#0f2a56] transition-colors flex items-center justify-center gap-2">
            <Wallet size={16}/> Pay ৳{(b.balance/1000).toFixed(0)}K Now
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PAYMENT HISTORY ─────────────────────────────────────────────────────────
function PaymentsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Payment History</h2>
      <div className="grid grid-cols-2 gap-3">
        {[["Total Paid",PAYMENTS.reduce((s,p)=>s+p.amount,0)],["Transactions",PAYMENTS.length]].map(([l,v])=>(
          <div key={l as string} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">{l}</p>
            <p className="text-xl font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>
              {typeof v==="number"&&v>100?fmtBDT(v):v}
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {PAYMENTS.map(p=>(
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={18} className="text-emerald-600"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.desc}</p>
                  <p className="text-xs text-slate-400">{p.method} · {p.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(p.amount)}</p>
                <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">Paid</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-mono">{p.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INSTALLMENTS ────────────────────────────────────────────────────────────
function InstallmentsView() {
  const paid = INSTALLMENTS.filter(i=>i.paid).length;
  const total = INSTALLMENTS.length;
  const [paying, setPaying] = useState(false);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Installments</h2>
      {/* Progress ring (simple bar) */}
      <div className="bg-gradient-to-br from-[#14356B] to-[#0E4D7A] rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs mb-1">BK-0892 — Hajj Economy 2024</p>
            <p className="text-2xl font-black">{paid} of {total} <span className="text-sm font-normal text-white/70">installments paid</span></p>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-white/20 flex items-center justify-center">
            <span className="text-lg font-black">{Math.round((paid/total)*100)}%</span>
          </div>
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-[#C9A227] rounded-full transition-all" style={{ width:`${(paid/total)*100}%` }}/>
        </div>
      </div>

      {/* Installment cards */}
      <div className="space-y-3">
        {INSTALLMENTS.map((inst,i)=>{
          const isNext = !inst.paid && INSTALLMENTS.filter(x=>!x.paid)[0]?.id === inst.id;
          return (
            <div key={inst.id} className={cn("bg-white rounded-2xl border p-5 transition-all",
              isNext?"border-[#14356B]/40 shadow-md shadow-[#14356B]/8":"border-slate-200")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  inst.paid?"border-emerald-500 bg-emerald-50":isNext?"border-[#C9A227] bg-amber-50":"border-slate-200 bg-slate-50")}>
                  {inst.paid
                    ? <Check size={16} className="text-emerald-600"/>
                    : <span className="text-xs font-bold text-slate-500">{i+1}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{inst.label}</p>
                    {isNext && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">Next Due</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {inst.paid ? `Paid on ${inst.paidDate}` : `Due ${inst.due}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("font-black text-base", inst.paid?"text-emerald-600":"text-slate-800")}
                    style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(inst.amount)}</p>
                  {!inst.paid && isNext && (
                    <button onClick={()=>setPaying(true)}
                      className="mt-1 px-3 py-1.5 bg-[#14356B] text-white text-xs font-semibold rounded-lg hover:bg-[#0f2a56] transition-colors">
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pay now modal */}
      {paying && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Pay Installment</h3>
              <button onClick={()=>setPaying(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs text-slate-400 mb-1">Amount to Pay</p>
              <p className="text-3xl font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(130000)}</p>
              <p className="text-xs text-slate-400 mt-1">4th Installment · BK-0892</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Select Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {[["bKash","#E2136E"],["Nagad","#F7941D"],["DBBL Card","#1A1F71"],["Bank Transfer","#64748B"]].map(([name,color])=>(
                  <button key={name}
                    className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-xl hover:border-[#14356B] transition-colors text-sm font-medium text-slate-700 hover:text-[#14356B]">
                    <div className="w-5 h-5 rounded-md" style={{ background: color }}/>
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={()=>setPaying(false)}
              className="w-full py-3.5 bg-[#14356B] text-white font-bold rounded-2xl hover:bg-[#0f2a56] transition-colors flex items-center justify-center gap-2">
              <Wallet size={18}/> Confirm & Pay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INVOICES ────────────────────────────────────────────────────────────────
function InvoicesView() {
  const [preview, setPreview] = useState(false);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Invoices</h2>
      {[
        { id:"INV-2024-0247", booking:"BK-0892", service:"Hajj Economy 2024", date:"Jun 12, 2024", amount:520000, status:"partial" },
        { id:"INV-2024-0108", booking:"BK-0741", service:"Malaysia Tour 5D/4N",date:"Apr 5, 2024",  amount:215000, status:"paid"    },
      ].map(inv=>(
        <div key={inv.id} className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-slate-400 font-mono">{inv.id}</p>
              <p className="font-bold text-slate-800">{inv.service}</p>
              <p className="text-xs text-slate-400 mt-0.5">{inv.booking} · {inv.date}</p>
            </div>
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border",
              inv.status==="paid"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-amber-50 text-amber-700 border-amber-200")}>
              {inv.status==="paid"?"Paid":"Partial"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="font-black text-slate-800 text-lg" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(inv.amount)}</p>
            <div className="flex gap-2">
              <button onClick={()=>setPreview(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"><Eye size={13}/> View</button>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#14356B] text-white rounded-xl hover:bg-[#0f2a56]"><Download size={13}/> PDF</button>
            </div>
          </div>
        </div>
      ))}

      {/* Invoice preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="font-bold text-slate-800">INV-2024-0247</h3>
              <button onClick={()=>setPreview(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
            </div>
            <div className="p-6">
              {/* Invoice header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="w-12 h-10 bg-[#14356B] rounded-xl flex items-center justify-center text-white text-xs font-black mb-2">BDH</div>
                  <p className="font-bold text-slate-800">BDH Travels & Tourism</p>
                  <p className="text-xs text-slate-400">Agrabad, Chattogram</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-[#14356B]">INVOICE</p>
                  <p className="text-xs text-slate-400 font-mono">INV-2024-0247</p>
                  <p className="text-xs text-slate-400">Jun 12, 2024</p>
                </div>
              </div>
              <div className="border-t border-b border-slate-100 py-3 mb-4">
                <p className="text-xs text-slate-400 mb-1">Billed To</p>
                <p className="font-semibold text-slate-800">Md. Karim Ullah</p>
                <p className="text-xs text-slate-400">karim@email.com · +880 1XXXXXXXXX</p>
              </div>
              <table className="w-full mb-4">
                <thead><tr className="border-b border-slate-100"><th className="text-left text-xs text-slate-400 pb-2">Item</th><th className="text-right text-xs text-slate-400 pb-2">Amount</th></tr></thead>
                <tbody>
                  {[["Hajj Economy Package 2024","৳5,00,000"],["Visa Processing Fee","৳8,000"],["Airport Tax & Surcharges","৳12,000"]].map(([item,amt])=>(
                    <tr key={item} className="border-b border-slate-50">
                      <td className="py-2 text-sm text-slate-700">{item}</td>
                      <td className="py-2 text-sm text-right font-mono text-slate-800">{amt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {[["Subtotal","৳5,20,000"],["Paid","৳3,90,000"],["Balance Due","৳1,30,000"]].map(([k,v],i)=>(
                <div key={k} className={cn("flex justify-between",i===2&&"font-bold text-red-500 pt-2 border-t border-slate-100")}>
                  <span className="text-sm">{k}</span><span className="text-sm font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
function DocumentsView() {
  const [uploading, setUploading] = useState<number|null>(null);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">My Documents</h2>
        <p className="text-sm text-slate-500 mt-0.5">Upload and view your travel documents</p>
      </div>
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5"/>
        <p className="text-sm text-blue-700">Please ensure all required documents are uploaded at least 30 days before departure.</p>
      </div>
      <div className="space-y-3">
        {DOCS_LIST.map(doc=>{
          const sc = DOC_STATUS_CFG[doc.status];
          const Icon = sc.icon;
          return (
            <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <doc.icon size={18} className="text-slate-400"/>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                    {doc.required && <span className="text-xs text-red-400 font-medium">Required</span>}
                  </div>
                  <span className={cn("inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium border",sc.cls)}>
                    <Icon size={10}/>{sc.label}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {doc.status!=="missing" ? (
                    <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><Eye size={15}/></button>
                  ) : null}
                  {doc.status==="missing" ? (
                    <button onClick={()=>setUploading(doc.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#14356B] text-white rounded-xl hover:bg-[#0f2a56]">
                      <Upload size={12}/> Upload
                    </button>
                  ) : (
                    <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><Download size={15}/></button>
                  )}
                </div>
              </div>
              {/* Upload zone */}
              {uploading===doc.id && (
                <div className="mt-3 border-2 border-dashed border-[#14356B]/30 rounded-xl p-4 bg-[#14356B]/3 text-center">
                  <Upload size={22} className="text-[#14356B]/50 mx-auto mb-2"/>
                  <p className="text-sm text-slate-500">Tap to select file or drag here</p>
                  <p className="text-xs text-slate-400">JPG, PNG, PDF · max 10 MB</p>
                  <div className="flex gap-2 mt-3 justify-center">
                    <button className="px-4 py-2 bg-[#14356B] text-white text-xs font-semibold rounded-lg">Choose File</button>
                    <button onClick={()=>setUploading(null)} className="px-4 py-2 border border-slate-200 text-xs rounded-lg text-slate-500">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── VOUCHER ────────────────────────────────────────────────────────────────
function VoucherView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Download Voucher</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your official travel vouchers and confirmation letters</p>
      </div>
      {[
        { id:"BK-0892", title:"Hajj Economy 2024", type:"Booking Voucher",   ready:true,  bg:"#14356B" },
        { id:"BK-0892", title:"Hajj Economy 2024", type:"Hotel Confirmation", ready:true,  bg:"#0E7C66" },
        { id:"BK-0892", title:"Hajj Economy 2024", type:"Flight Itinerary",  ready:true,  bg:"#2563EB" },
        { id:"BK-0892", title:"Hajj Economy 2024", type:"Visa Copy",         ready:true,  bg:"#C9A227" },
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
            <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#14356B] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2a56] transition-colors flex-shrink-0">
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
function SupportView() {
  const [active, setActive] = useState<string|null>(null);
  const [msg, setMsg] = useState("");
  const ticket = TICKETS[0];
  const MOCK_MSGS = [
    { from:"Me",      text:"Hi, can you give me an update on my visa application?",      time:"Jul 10 09:00", mine:true  },
    { from:"Support", text:"Hello Md. Karim! We're following up with the Saudi embassy.", time:"Jul 10 09:15", mine:false },
    { from:"Me",      text:"Thank you. How many more days approximately?",               time:"Jul 10 09:20", mine:true  },
    { from:"Support", text:ticket.lastMsg, time:"Jul 10 10:05", mine:false },
  ];

  if(active) return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={()=>setActive(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
          <ChevronRight size={16} className="rotate-180"/>
        </button>
        <div>
          <p className="font-bold text-slate-800 text-base">{TICKETS.find(t=>t.id===active)?.subject}</p>
          <p className="text-xs text-slate-400">{active} · Open</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {MOCK_MSGS.map((m,i)=>(
          <div key={i} className={cn("flex",m.mine?"justify-end":"justify-start")}>
            {!m.mine && (
              <div className="w-8 h-8 rounded-full bg-[#14356B] flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end">BD</div>
            )}
            <div className={cn("max-w-xs px-4 py-2.5 rounded-2xl text-sm",
              m.mine?"bg-[#14356B] text-white rounded-br-sm":"bg-slate-100 text-slate-700 rounded-bl-sm")}>
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
        <button className="p-2.5 bg-[#14356B] text-white rounded-xl hover:bg-[#0f2a56]"><Send size={16}/></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Support</h2>
        <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#14356B] text-white rounded-xl hover:bg-[#0f2a56]">
          <Plus size={14}/> New Ticket
        </button>
      </div>
      <div className="bg-gradient-to-r from-[#14356B]/5 to-[#0E7C66]/5 border border-[#14356B]/15 rounded-2xl p-4 flex items-center gap-3">
        <Phone size={18} className="text-[#14356B]"/>
        <div>
          <p className="text-sm font-semibold text-slate-800">Need urgent help?</p>
          <p className="text-xs text-slate-500">Call us: <a href="tel:+8801800000000" className="text-[#14356B] font-semibold">+880 31 123 4567</a></p>
        </div>
      </div>
      {TICKETS.map(t=>(
        <div key={t.id} onClick={()=>setActive(t.id)}
          className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-3">
              <p className="text-xs text-slate-400 font-mono mb-1">{t.id}</p>
              <p className="font-semibold text-slate-800">{t.subject}</p>
            </div>
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0",
              t.status==="open"?"bg-blue-50 text-blue-600 border border-blue-200":"bg-emerald-50 text-emerald-600 border border-emerald-200")}>
              {t.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{t.lastMsg}</p>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1"><MessageCircle size={11}/> {t.msgs} messages</span>
            <span>{t.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
function NotificationsView() {
  const [notifs, setNotifs] = useState(NOTIFS);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
        <button onClick={()=>setNotifs(n=>n.map(x=>({...x,read:true})))}
          className="text-sm text-[#14356B] hover:underline font-medium">Mark all read</button>
      </div>
      <div className="space-y-3">
        {notifs.map(n=>(
          <div key={n.id} onClick={()=>setNotifs(ns=>ns.map(x=>x.id===n.id?{...x,read:true}:x))}
            className={cn("flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
              n.read?"bg-white border-slate-200":"bg-[#14356B]/4 border-[#14356B]/15")}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: n.color+"20" }}>
              <div className="w-3 h-3 rounded-full" style={{ background: n.color }}/>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-800">{n.title}</p>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[#14356B] flex-shrink-0"/>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap mt-0.5">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROFILE ────────────────────────────────────────────────────────────────
function ProfileView() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setEditing(false); setTimeout(()=>setSaved(false),2000); };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-18 h-18 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14356B] to-[#0E7C66] flex items-center justify-center text-white text-2xl font-black">
              MK
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#14356B] rounded-full flex items-center justify-center text-white shadow-lg">
              <Camera size={11}/>
            </button>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-lg">Md. Karim Ullah</p>
            <p className="text-sm text-slate-400">Customer · Since 2022</p>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_,i)=><Star key={i} size={12} className="text-amber-400 fill-amber-400"/>)}
              <span className="text-xs text-slate-400 ml-1">Trusted Client</span>
            </div>
          </div>
          <button onClick={()=>setEditing(v=>!v)} className="ml-auto p-2.5 hover:bg-slate-100 rounded-xl text-slate-400">
            <Edit2 size={16}/>
          </button>
        </div>
        {saved && <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle size={16} className="fill-emerald-100"/> Profile saved successfully</div>}
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-semibold text-slate-700 text-sm">Personal Information</p>
        {[
          { label:"Full Name",     val:"Md. Karim Ullah",           type:"text"  },
          { label:"Phone",         val:"+880 1XXXXXXXXX",            type:"tel"   },
          { label:"Email",         val:"karim.ullah@gmail.com",      type:"email" },
          { label:"Date of Birth", val:"1975-04-12",                 type:"date"  },
          { label:"NID Number",    val:"19751234567890",              type:"text"  },
          { label:"Passport No.",  val:"KA8823991",                  type:"text"  },
        ].map(f=>(
          <div key={f.label}>
            <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
            <input type={f.type} defaultValue={f.val} disabled={!editing}
              className={cn("w-full px-3 py-2.5 text-sm rounded-xl border transition-colors",
                editing?"border-[#14356B]/40 bg-white focus:outline-none focus:ring-2 focus:ring-[#14356B]/20":"border-transparent bg-slate-50 text-slate-700 cursor-default")}/>
          </div>
        ))}
        {editing && (
          <div className="flex gap-3 pt-2">
            <button onClick={save} className="flex-1 py-3 bg-[#14356B] text-white font-semibold text-sm rounded-xl hover:bg-[#0f2a56] flex items-center justify-center gap-2">
              <Check size={15}/> Save Changes
            </button>
            <button onClick={()=>setEditing(false)} className="px-5 py-3 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50">Cancel</button>
          </div>
        )}
      </div>

      {/* Address */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-semibold text-slate-700 text-sm">Address</p>
        {[["Village/Road","House 12, Block C"],["District","Chattogram"],["Division","Chattogram"],["Country","Bangladesh"]].map(([l,v])=>(
          <div key={l}>
            <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
            <input defaultValue={v} disabled={!editing}
              className={cn("w-full px-3 py-2.5 text-sm rounded-xl border",
                editing?"border-[#14356B]/40 bg-white focus:outline-none":"border-transparent bg-slate-50 text-slate-700")}/>
          </div>
        ))}
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-semibold text-slate-700 text-sm">Security</p>
        <button className="flex items-center justify-between w-full p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
          <span className="text-sm font-medium text-slate-700">Change Password</span>
          <ChevronRight size={16} className="text-slate-400"/>
        </button>
        <button className="flex items-center justify-between w-full p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
          <span className="text-sm font-medium text-slate-700">Two-Factor Authentication</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Off</span>
            <ChevronRight size={16} className="text-slate-400"/>
          </div>
        </button>
      </div>

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50 transition-colors">
        <LogOut size={16}/> Sign Out
      </button>
    </div>
  );
}

// ─── PORTAL SHELL ────────────────────────────────────────────────────────────
export function CustomerPortal() {
  const [view, setView] = useState<PortalView>("dashboard");
  const unreadNotif = NOTIFS.filter(n=>!n.read).length;

  const go = (v: PortalView) => setView(v);

  const renderView = () => {
    switch(view) {
      case "dashboard":      return <Dashboard onGo={go}/>;
      case "bookings":       return <BookingsView onDetail={()=>go("booking-detail")}/>;
      case "booking-detail": return <BookingDetail onBack={()=>go("bookings")}/>;
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
              <div className="w-9 h-9 rounded-xl bg-[#14356B] flex items-center justify-center text-white text-xs font-black">BDH</div>
              <div>
                <p className="text-sm font-bold text-slate-800">BDH Travels</p>
                <p className="text-xs text-[#0E7C66] font-medium">My Portal</p>
              </div>
            </div>
          </div>
          {/* User */}
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14356B] to-[#0E7C66] flex items-center justify-center text-white text-xs font-black">MK</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">Md. Karim Ullah</p>
                <p className="text-xs text-slate-400 truncate">BK-0892 · Hajj 2024</p>
              </div>
            </div>
          </div>
          {/* Nav */}
          <nav className="flex-1 py-3 px-3 overflow-y-auto no-scrollbar">
            {NAV.map(item=>(
              <button key={item.id} onClick={()=>go(item.id)}
                className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all mb-0.5",
                  view===item.id||view==="booking-detail"&&item.id==="bookings"
                    ? "bg-[#14356B] text-white shadow-sm shadow-[#14356B]/25"
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
            <div className="w-8 h-8 rounded-lg bg-[#14356B] flex items-center justify-center text-white text-xs font-black">BDH</div>
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#14356B] to-[#0E7C66] flex items-center justify-center text-white text-xs font-black">MK</div>
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

export default CustomerPortal;
