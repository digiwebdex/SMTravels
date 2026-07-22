import React, { useState } from "react";
import {
  LayoutDashboard, Inbox, Package, FileText, CreditCard,
  BookOpen, BarChart3, MessageSquare, LifeBuoy, User,
  LogOut, ChevronRight, ChevronDown, ChevronUp, Search,
  Filter, Download, Eye, Check, X, Clock, AlertCircle,
  CheckCircle, Plus, Send, Paperclip, Bell, Copy, Edit2,
  ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown,
  Calendar, MapPin, Phone, Mail, Globe, Building2, Star,
  MoreHorizontal, Layers, Shield, Info, RefreshCw,
  CircleDollarSign, Banknote, Upload, ExternalLink, Hash,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Loader2 } from "lucide-react";
import { useSupplierMe, useSupplierDashboard, useSupplierRequests, useSupplierInvoices } from "../hooks/portals";

const fmtBDT2 = (n: number) => "৳ " + Number(n || 0).toLocaleString("en-BD");
const iso2date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
function PLoad({ q, children }: { q: { isLoading: boolean; isError: boolean; error?: unknown }; children: React.ReactNode }) {
  if (q.isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>;
  if (q.isError) return <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 text-center">{(q.error as Error)?.message || "Failed to load."}</div>;
  return <>{children}</>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type SupView =
  | "dashboard" | "requests" | "services" | "invoices"
  | "payments" | "statements" | "reports" | "messages"
  | "support" | "profile";

// ─── Nav ─────────────────────────────────────────────────────────────────────
const NAV: { id: SupView; icon: React.ElementType; label: string; badge?: number }[] = [
  { id: "dashboard",  icon: LayoutDashboard, label: "Dashboard"          },
  { id: "requests",   icon: Inbox,           label: "Booking Requests", badge: 5 },
  { id: "services",   icon: Package,         label: "My Services"        },
  { id: "invoices",   icon: FileText,        label: "Invoices"           },
  { id: "payments",   icon: CreditCard,      label: "Payments"           },
  { id: "statements", icon: BookOpen,        label: "Statements"         },
  { id: "reports",    icon: BarChart3,       label: "Reports"            },
  { id: "messages",   icon: MessageSquare,   label: "Messages",  badge: 2 },
  { id: "support",    icon: LifeBuoy,        label: "Support"            },
  { id: "profile",    icon: User,            label: "Profile Settings"   },
];

const BOTTOM_NAV: { id: SupView; icon: React.ElementType; label: string }[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home"     },
  { id: "requests",  icon: Inbox,           label: "Requests" },
  { id: "invoices",  icon: FileText,        label: "Invoices" },
  { id: "payments",  icon: CreditCard,      label: "Payments" },
  { id: "profile",   icon: User,            label: "Profile"  },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const REQUESTS = [
  {
    id: "REQ-2024-0841", bdh: "BK-0892", service: "Hotel Accommodation",
    client: "Hajj Group — 42 Pax", dates: "Aug 5 – Sep 12, 2024",
    property: "Dar Al-Tawhid, Makkah", rooms: 21, nights: 38,
    amount: 2940000, status: "pending", received: "Jul 15",
    deadline: "Jul 22", notes: "Requires adjacent rooms on same floor.",
  },
  {
    id: "REQ-2024-0830", bdh: "BK-0881", service: "Hotel Accommodation",
    client: "Malaysia Tour — 3 Pax", dates: "May 10–14, 2024",
    property: "Marriott KL", rooms: 2, nights: 4,
    amount: 64000, status: "confirmed", received: "Apr 20",
    deadline: "Apr 27", notes: "",
  },
  {
    id: "REQ-2024-0818", bdh: "BK-0876", service: "Umrah Hotel",
    client: "Umrah Group — 12 Pax", dates: "Jun 2–9, 2024",
    property: "Anwar Madinah", rooms: 6, nights: 7,
    amount: 420000, status: "confirmed", received: "May 12",
    deadline: "May 19", notes: "Hafiz meal plan required.",
  },
  {
    id: "REQ-2024-0801", bdh: "BK-0865", service: "Visa Processing",
    client: "Individual — 1 Pax", dates: "—",
    property: "Saudi e-Visa", rooms: 0, nights: 0,
    amount: 6500, status: "completed", received: "Mar 1",
    deadline: "Mar 8", notes: "",
  },
  {
    id: "REQ-2024-0799", bdh: "BK-0861", service: "Hotel Accommodation",
    client: "Dubai Tour — 5 Pax", dates: "Feb 20–25, 2024",
    property: "Rove City Centre, Dubai", rooms: 3, nights: 5,
    amount: 135000, status: "cancelled", received: "Feb 1",
    deadline: "Feb 8", notes: "Cancelled by client.",
  },
];

const SERVICES_LIST = [
  { id: "SVC-01", name: "Hotel Accommodation — Makkah",  category: "Hotel",   price: "From ৳3,500/night/room", active: true,  bookings: 38, rating: 4.9 },
  { id: "SVC-02", name: "Hotel Accommodation — Madinah", category: "Hotel",   price: "From ৳2,800/night/room", active: true,  bookings: 22, rating: 4.7 },
  { id: "SVC-03", name: "Saudi Visa Processing",         category: "Visa",    price: "৳6,500 / pax",           active: true,  bookings: 61, rating: 4.8 },
  { id: "SVC-04", name: "Malaysia Hotel Package",        category: "Hotel",   price: "From ৳1,200/night/room", active: false, bookings: 14, rating: 4.5 },
];

const INVOICES = [
  { id: "INV-SUP-0241", req: "REQ-2024-0830", desc: "Marriott KL · 2 Rooms × 4 Nights",   amount: 64000,   issued: "May 15",  due: "May 30",  status: "paid"    },
  { id: "INV-SUP-0238", req: "REQ-2024-0818", desc: "Anwar Madinah · 6 Rooms × 7 Nights", amount: 420000,  issued: "Jun 10",  due: "Jun 25",  status: "paid"    },
  { id: "INV-SUP-0235", req: "REQ-2024-0841", desc: "Dar Al-Tawhid · 21 Rooms × 38 Nights",amount:2940000, issued: "Jul 16",  due: "Aug 1",   status: "pending" },
  { id: "INV-SUP-0229", req: "REQ-2024-0801", desc: "Saudi e-Visa Processing — 1 Pax",     amount: 6500,   issued: "Mar 10",  due: "Mar 25",  status: "paid"    },
];

const PAYMENTS = [
  { id: "PAY-1044", inv: "INV-SUP-0238", desc: "Anwar Madinah settlement", amount: 420000, date: "Jun 27",  method: "Bank Transfer", ref: "DBBL-TXN-XXXXX", status: "completed" },
  { id: "PAY-1041", inv: "INV-SUP-0230", desc: "Marriott KL settlement",   amount: 64000,  date: "Jun 1",   method: "Bank Transfer", ref: "DBBL-TXN-XXXXX", status: "completed" },
  { id: "PAY-1038", inv: "INV-SUP-0229", desc: "Saudi e-Visa fee",         amount: 6500,   date: "Mar 26",  method: "bKash",         ref: "BK-XXXXXD",      status: "completed" },
];

const MESSAGES = [
  {
    id: "MSG-001", from: "BDH Procurement", subject: "Room allocation — REQ-2024-0841",
    preview: "Hi, could you confirm adjacent rooms on the same floor for the 42-pax group?",
    time: "Jul 15", unread: true,
    thread: [
      { from: "BDH Procurement", text: "Hi, could you confirm adjacent rooms on the same floor for the 42-pax group arriving Aug 5?", time: "Jul 15 09:00", mine: false },
      { from: "Me",              text: "Hello! Yes, floors 4–6 are fully available. I'll block them now.", time: "Jul 15 10:30", mine: true  },
      { from: "BDH Procurement", text: "Perfect. Please send room confirmation document when ready.", time: "Jul 15 11:00", mine: false },
    ],
  },
  {
    id: "MSG-002", from: "BDH Accounts", subject: "Payment for INV-SUP-0241 scheduled",
    preview: "Payment of ৳29,40,000 has been scheduled for Aug 1, 2024 via bank transfer.",
    time: "Jul 16", unread: true,
    thread: [
      { from: "BDH Accounts", text: "Payment of ৳29,40,000 for INV-SUP-0241 has been scheduled for Aug 1, 2024.", time: "Jul 16 14:00", mine: false },
    ],
  },
  {
    id: "MSG-003", from: "BDH Operations", subject: "Meal plan update — REQ-2024-0818",
    preview: "Please note the meal plan change from half-board to full-board for Umrah group.",
    time: "Jun 1", unread: false,
    thread: [
      { from: "BDH Operations", text: "Please note the Umrah group requires full-board instead of half-board for all 12 pax.", time: "Jun 1 08:30", mine: false },
      { from: "Me",             text: "Noted and updated. Revised invoice will be sent shortly.", time: "Jun 1 09:00", mine: true },
    ],
  },
];

const SUP_TICKETS = [
  { id: "ST-041", subject: "Invoice payment delay — INV-SUP-0241", status: "open",     date: "Jul 16", msgs: 2 },
  { id: "ST-038", subject: "Service listing update request",        status: "resolved", date: "Jun 20", msgs: 3 },
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
  const s = map[status] as any;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", s?.chip ?? s?.cls)}>
      {s?.label ?? status}
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
  const q = useSupplierDashboard();
  const d = q.data;
  return (
    <PLoad q={q}>
      {d && (
      <div className="space-y-5" data-portal="dashboard">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Supplier Dashboard</p>
              <h2 className="text-xl font-bold text-slate-800" data-portal-name>{d.supplierName}</h2>
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 capitalize"><CheckCircle size={10} /> {d.status.toLowerCase()}</span>
              </p>
            </div>
            <span className="text-xs text-slate-400">Rating: <span className="text-amber-500 font-bold">{d.rating ?? "—"} ★</span></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Pending Requests" value={String(d.counts.pendingRequests)} sub="Require action" icon={Inbox} accent="bg-amber-500" />
          <KpiCard label="My Services" value={String(d.counts.services)} sub="Listed" icon={CheckCircle} accent="bg-blue-600" />
          <KpiCard label="Unpaid Invoices" value={String(d.counts.unpaidInvoices)} sub="Outstanding" icon={FileText} accent="bg-red-500" />
          <KpiCard label="Outstanding" value={fmtShort(d.outstanding)} sub="Payables" icon={CircleDollarSign} accent="bg-emerald-600" />
        </div>

        {d.recentRequests.filter(r => r.status === "PENDING").length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><AlertCircle size={16} className="text-amber-500" /><p className="font-semibold text-amber-800 text-sm">Action Required</p></div>
              <button onClick={() => onGo("requests")} className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1">View all <ChevronRight size={12} /></button>
            </div>
            {d.recentRequests.filter(r => r.status === "PENDING").map(r => (
              <div key={r.id} className="flex items-center justify-between py-2.5 border-t border-amber-200 first:border-0">
                <div><p className="text-sm font-semibold text-slate-800">{r.clientLabel || r.serviceLabel}</p><p className="text-xs text-slate-500">{r.requestNo} · {fmtBDT2(r.amount)}</p></div>
                <button onClick={() => onGo("requests")} className="px-3 py-1.5 bg-[#0E6BB8] text-white text-xs font-semibold rounded-lg hover:bg-[#0B5794]">Review</button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="font-bold text-slate-800 mb-3">Total Invoiced</p>
          <p className="text-3xl font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(d.totalInvoiced)}</p>
          <p className="text-xs text-slate-400 mt-1">Outstanding payables {fmtBDT2(d.outstanding)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Inbox, label: "Requests", color: "bg-amber-50 text-amber-600", v: "requests" as SupView },
            { icon: FileText, label: "Invoices", color: "bg-[#0E6BB8]/10 text-[#0E6BB8]", v: "invoices" as SupView },
          ].map(l => (
            <button key={l.label} onClick={() => onGo(l.v)} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#0E6BB8]/30 hover:shadow-sm transition-all group text-left">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", l.color)}><l.icon size={16} /></div>
              <span className="text-sm font-semibold text-slate-700">{l.label}</span>
              <ChevronRight size={13} className="ml-auto text-slate-300 group-hover:text-[#0E6BB8]" />
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
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: "accept" | "reject" } | null>(null);

  const shown = REQUESTS.filter(r => filter === "all" || r.status === filter);
  const counts: Record<string, number> = {};
  REQUESTS.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1; });

  const detailReq = REQUESTS.find(r => r.id === detail);

  if (detailReq) return (
    <div className="space-y-5">
      <button onClick={() => setDetail(null)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ChevronRight size={14} className="rotate-180" /> Back to requests
      </button>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-mono">{detailReq.id}</p>
          <h2 className="text-xl font-bold text-slate-800 mt-0.5">{detailReq.service}</h2>
        </div>
        <SChip status={detailReq.status} map={REQ_STATUS as any} />
      </div>

      {/* Detail grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <p className="font-semibold text-slate-700 text-sm">Request Details</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "BDH Booking Ref", val: detailReq.bdh           },
            { label: "Client Group",    val: detailReq.client         },
            { label: "Property",        val: detailReq.property       },
            { label: "Dates",           val: detailReq.dates          },
            { label: "Rooms / Pax",     val: detailReq.rooms > 0 ? `${detailReq.rooms} rooms` : "1 pax" },
            { label: "Nights",          val: detailReq.nights > 0 ? `${detailReq.nights} nights` : "—"  },
          ].map(f => (
            <div key={f.label}>
              <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
              <p className="text-sm font-semibold text-slate-800">{f.val}</p>
            </div>
          ))}
        </div>
        {detailReq.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-semibold mb-1">Special Notes</p>
            <p className="text-sm text-amber-800">{detailReq.notes}</p>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Service Amount</p>
            <p className="text-3xl font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT(detailReq.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Response Deadline</p>
            <p className="text-sm font-bold text-red-500">{detailReq.deadline}</p>
          </div>
        </div>
      </div>

      {detailReq.status === "pending" && (
        <div className="flex gap-3">
          <button onClick={() => setConfirmModal({ id: detailReq.id, action: "reject" })}
            className="flex-1 py-3.5 border-2 border-red-200 text-red-500 font-bold text-sm rounded-2xl hover:bg-red-50 flex items-center justify-center gap-2">
            <X size={16} /> Decline
          </button>
          <button onClick={() => setConfirmModal({ id: detailReq.id, action: "accept" })}
            className="flex-1 py-3.5 bg-[#0E6BB8] text-white font-bold text-sm rounded-2xl hover:bg-[#0B5794] flex items-center justify-center gap-2">
            <Check size={16} /> Accept & Confirm
          </button>
        </div>
      )}

      {/* Confirm modal */}
      {confirmModal && (
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
                {confirmModal.action === "accept" ? "Accept Request?" : "Decline Request?"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{confirmModal.id}</p>
            </div>
            {confirmModal.action === "reject" && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Reason for declining</label>
                <textarea rows={3} placeholder="e.g., No availability for requested dates…"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-600 text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => { setConfirmModal(null); setDetail(null); }}
                className={cn("flex-1 py-3 rounded-2xl text-white font-bold text-sm",
                  confirmModal.action === "accept" ? "bg-[#0E6BB8] hover:bg-[#0B5794]" : "bg-red-500 hover:bg-red-600")}>
                {confirmModal.action === "accept" ? "Confirm" : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Booking Requests</h2>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[["all", "All"], ["pending", "Pending"], ["confirmed", "Confirmed"], ["completed", "Completed"], ["cancelled", "Cancelled"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0",
              filter === k ? "bg-[#0E6BB8] text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-[#0E6BB8]/30")}>
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
      <div className="space-y-3">
        {shown.map(r => (
          <div key={r.id} className={cn("bg-white rounded-2xl border overflow-hidden transition-all",
            r.status === "pending" ? "border-amber-300 shadow-sm shadow-amber-100" : "border-slate-200")}>
            {r.status === "pending" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
                <Clock size={12} className="text-amber-500" />
                <p className="text-xs font-semibold text-amber-700">Response needed by {r.deadline}</p>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-xs text-slate-400 font-mono mb-0.5">{r.id} · {r.bdh}</p>
                  <p className="font-bold text-slate-800">{r.client}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.service} · {r.property}</p>
                </div>
                <SChip status={r.status} map={REQ_STATUS as any} />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Dates",   val: r.dates.split("–")[0] + (r.dates.includes("–") ? "–" : "")  },
                  { label: r.rooms > 0 ? "Rooms" : "Pax", val: r.rooms > 0 ? `${r.rooms} rooms` : "1 pax" },
                  { label: "Amount",  val: fmtShort(r.amount) },
                ].map(f => (
                  <div key={f.label} className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-xs text-slate-400">{f.label}</p>
                    <p className="text-sm font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{f.val}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDetail(r.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                  <Eye size={12} /> View Details
                </button>
                {r.status === "pending" && (
                  <>
                    <button onClick={() => setConfirmModal({ id: r.id, action: "reject" })}
                      className="py-2 px-3 text-xs font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                      Decline
                    </button>
                    <button onClick={() => setConfirmModal({ id: r.id, action: "accept" })}
                      className="py-2 px-3 text-xs font-semibold bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
                      Accept
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MY SERVICES ──────────────────────────────────────────────────────────────
function ServicesView() {
  const [addModal, setAddModal] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(SERVICES_LIST.map(s => [s.id, s.active]))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">My Services</h2>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0E6BB8] text-white text-sm font-semibold rounded-xl hover:bg-[#0B5794]">
          <Plus size={14} /> Add Service
        </button>
      </div>

      <div className="space-y-3">
        {SERVICES_LIST.map(svc => (
          <div key={svc.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0E6BB8]/8 flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-[#0E6BB8]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 leading-tight">{svc.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{svc.id} · {svc.category}</p>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => setToggles(t => ({ ...t, [svc.id]: !t[svc.id] }))}
                    className={cn("relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                      toggles[svc.id] ? "bg-[#0E7C66]" : "bg-slate-200")}>
                    <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                      toggles[svc.id] ? "left-5" : "left-0.5")} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-lg">{svc.price}</span>
                  <span className="text-xs text-slate-500">{svc.bookings} bookings</span>
                  <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                    <Star size={11} className="fill-amber-400" />{svc.rating}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                <Edit2 size={12} /> Edit
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                <Eye size={12} /> View Bookings
              </button>
            </div>
          </div>
        ))}
      </div>

      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Add New Service</h3>
              <button onClick={() => setAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
            </div>
            {[["Service Name", "text"], ["Category", "text"], ["Base Price (BDT)", "number"]].map(([l, t]) => (
              <div key={l}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{l}</label>
                <input type={t}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <textarea rows={3} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={() => setAddModal(false)}
              className="w-full py-3 bg-[#0E6BB8] text-white font-semibold text-sm rounded-xl hover:bg-[#0B5794]">
              Submit for Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────
function InvoicesView() {
  const [raiseModal, setRaiseModal] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Invoices</h2>
        <button onClick={() => setRaiseModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0E6BB8] text-white text-sm font-semibold rounded-xl hover:bg-[#0B5794]">
          <Plus size={14} /> Raise Invoice
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Invoiced",  val: fmtShort(INVOICES.reduce((s,i)=>s+i.amount,0)), cls: "text-slate-800"   },
          { label: "Paid",            val: fmtShort(INVOICES.filter(i=>i.status==="paid").reduce((s,i)=>s+i.amount,0)), cls: "text-emerald-600" },
          { label: "Outstanding",     val: fmtShort(INVOICES.filter(i=>i.status==="pending").reduce((s,i)=>s+i.amount,0)), cls: "text-red-500" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
            <p className={cn("text-base font-black", s.cls)} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {INVOICES.map(inv => (
          <div key={inv.id} className={cn("bg-white rounded-2xl border overflow-hidden",
            inv.status === "pending" ? "border-amber-300" : "border-slate-200")}>
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-mono mb-0.5">{inv.id}</p>
                  <p className="font-bold text-slate-800">{inv.desc}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Ref: {inv.req}</p>
                </div>
                <SChip status={inv.status} map={INV_STATUS} />
              </div>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Amount</p>
                <p className="text-xl font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT(inv.amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Issued / Due</p>
                <p className="text-sm font-semibold text-slate-600">{inv.issued} → {inv.due}</p>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button onClick={() => setPreview(inv.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 bg-white hover:bg-slate-50">
                <Eye size={12} /> View
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 bg-white hover:bg-slate-50">
                <Download size={12} /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Raise invoice modal */}
      {raiseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Raise Invoice</h3>
              <button onClick={() => setRaiseModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Booking Request Reference</label>
              <select className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none">
                {REQUESTS.filter(r=>r.status==="confirmed").map(r=>(
                  <option key={r.id}>{r.id} — {r.client}</option>
                ))}
              </select>
            </div>
            {[["Service Description","text"],["Amount (BDT)","number"],["Invoice Date","date"],["Due Date","date"]].map(([l,t])=>(
              <div key={l}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{l}</label>
                <input type={t} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
              <textarea rows={2} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
              <Upload size={20} className="text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs text-slate-400">Attach supporting document (PDF)</p>
            </div>
            <button onClick={() => setRaiseModal(false)}
              className="w-full py-3.5 bg-[#0E6BB8] text-white font-bold text-sm rounded-xl hover:bg-[#0B5794]">
              Submit Invoice
            </button>
          </div>
        </div>
      )}

      {/* Invoice preview modal */}
      {preview && (() => {
        const inv = INVOICES.find(i => i.id === preview)!;
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
                <h3 className="font-bold text-slate-800">{inv.id}</h3>
                <button onClick={() => setPreview(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="w-10 h-9 bg-[#0E6BB8] rounded-xl flex items-center justify-center text-white text-xs font-black mb-2">AL</div>
                    <p className="font-bold text-slate-800">Al-Amin Hotels & Tourism</p>
                    <p className="text-xs text-slate-400">Agrabad, Chattogram</p>
                    <p className="text-xs text-slate-400">SUP-0014</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl text-[#0E6BB8]">TAX INVOICE</p>
                    <p className="text-xs text-slate-400 font-mono">{inv.id}</p>
                    <p className="text-xs text-slate-400">Issued: {inv.issued}</p>
                    <p className="text-xs text-red-400 font-semibold">Due: {inv.due}</p>
                  </div>
                </div>
                <div className="border-t border-b border-slate-100 py-3 mb-4">
                  <p className="text-xs text-slate-400 mb-1">Billed To</p>
                  <p className="font-semibold text-slate-800">BDH Travels & Tourism</p>
                  <p className="text-xs text-slate-400">accounts@bdhtravels.com · {inv.req}</p>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-600">{inv.desc}</span>
                    <span className="text-sm font-mono font-bold text-slate-800">{fmtBDT(inv.amount)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-slate-200">
                  <span>Total Due</span>
                  <span className="font-mono text-[#0E6BB8]">{fmtBDT(inv.amount)}</span>
                </div>
                <button className="w-full mt-5 py-3 bg-[#0E6BB8] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                  <Download size={15} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
function PaymentsView() {
  const total = PAYMENTS.reduce((s, p) => s + p.amount, 0);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Payments Received</h2>

      <div className="bg-gradient-to-br from-[#0E6BB8] to-[#0a2a52] rounded-2xl p-5 text-white">
        <p className="text-white/70 text-xs mb-1">Total Received (2024)</p>
        <p className="text-3xl font-black" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT(total)}</p>
        <div className="flex items-center gap-3 mt-3 text-sm text-white/70">
          <span>{PAYMENTS.length} transactions</span>
          <span>·</span>
          <span>Last: Jun 27</span>
        </div>
      </div>

      <div className="space-y-3">
        {PAYMENTS.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <ArrowDownLeft size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{p.desc}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.method} · {p.date}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Ref: {p.ref}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-emerald-600 text-lg" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                  +{fmtBDT(p.amount)}
                </p>
                <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium border border-emerald-200">
                  Received
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-mono">{p.id} · {p.inv}</p>
              <button className="flex items-center gap-1 text-xs text-[#0E6BB8] font-semibold hover:underline">
                <Download size={11} /> Receipt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STATEMENTS ───────────────────────────────────────────────────────────────
function StatementsView() {
  const [openMonth, setOpenMonth] = useState<number | null>(0);
  const months = [
    { label: "July 2024",  invoiced: 2940000, received: 0,       outstanding: 2940000 },
    { label: "June 2024",  invoiced: 420000,  received: 420000,  outstanding: 0       },
    { label: "May 2024",   invoiced: 64000,   received: 64000,   outstanding: 0       },
    { label: "March 2024", invoiced: 6500,    received: 6500,    outstanding: 0       },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Statements</h2>
        <button className="flex items-center gap-1.5 text-sm text-[#0E6BB8] font-semibold border border-[#0E6BB8]/30 px-3.5 py-2 rounded-xl hover:bg-[#0E6BB8]/5">
          <Download size={14} /> Export All
        </button>
      </div>

      {/* Account summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Invoiced",  val: fmtBDT(months.reduce((s,m)=>s+m.invoiced,0)),    cls:"text-slate-800"   },
          { label: "Total Received",  val: fmtBDT(months.reduce((s,m)=>s+m.received,0)),   cls:"text-emerald-600" },
          { label: "Outstanding",     val: fmtBDT(months.reduce((s,m)=>s+m.outstanding,0)),cls:"text-red-500"     },
          { label: "Credit Balance",  val: "৳ 0",                                           cls:"text-slate-600"   },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className={cn("text-lg font-black", s.cls)} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly statement accordion */}
      <div className="space-y-2.5">
        {months.map((m, i) => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4" onClick={() => setOpenMonth(openMonth === i ? null : i)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0E6BB8]/8 flex items-center justify-center">
                  <BookOpen size={15} className="text-[#0E6BB8]" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">{m.label}</p>
                  <p className="text-xs text-slate-400">{fmtBDT(m.invoiced)} invoiced</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.outstanding > 0 && (
                  <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-semibold">
                    Outstanding
                  </span>
                )}
                {openMonth === i ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </button>
            {openMonth === i && (
              <div className="px-4 pb-4 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-3 mt-3 mb-3">
                  {[["Invoiced",fmtBDT(m.invoiced)],["Received",fmtBDT(m.received)],["Outstanding",fmtBDT(m.outstanding)]].map(([k,v])=>(
                    <div key={k} className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-sm font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{v}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <Download size={14} /> Download Statement PDF
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function ReportsView() {
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const values = [6500, 135000, 420000, 64000, 0, 2940000];
  const maxV = Math.max(...values);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Reports</h2>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Total Requests" value="5"  sub="YTD"         icon={Inbox}    accent="bg-[#0E6BB8]"  delta="+40%" up />
        <KpiCard label="Acceptance Rate"value="80%" sub="Confirmed"  icon={Check}    accent="bg-emerald-600"             />
        <KpiCard label="Avg. Turnaround"value="3.2d"sub="Days to confirm" icon={Clock} accent="bg-amber-500"            />
        <KpiCard label="Client Rating"  value="4.8★"sub="Overall"   icon={Star}     accent="bg-purple-500"              />
      </div>

      {/* Revenue by month */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-slate-800">Revenue by Month</p>
          <button className="text-xs text-[#0E6BB8] flex items-center gap-1 font-semibold hover:underline"><Download size={12}/> CSV</button>
        </div>
        <div className="flex items-end gap-2 h-32">
          {values.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg transition-all"
                style={{ height: v > 0 ? `${Math.max((v / maxV) * 100, 4)}%` : "4%", background: i === months.length - 1 ? "#0E6BB8" : "#0E6BB833" }} />
              <p className="text-xs text-slate-400">{months[i]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Service breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="font-bold text-slate-800 mb-4">Revenue by Service</p>
        <div className="space-y-3">
          {[
            { label: "Hotel — Makkah",  pct: 83, val: 2940000, color: "#0E6BB8" },
            { label: "Hotel — Madinah", pct: 12, val: 420000,  color: "#0E7C66" },
            { label: "Hotel — Malaysia",pct: 2,  val: 64000,   color: "#E8471F" },
            { label: "Visa Processing", pct: 0,  val: 6500,    color: "#7C3AED" },
          ].map(s => (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{s.label}</span>
                <span className="font-bold text-slate-700" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT(s.val)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(s.pct, 1)}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download reports */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="font-bold text-slate-800 mb-3">Download Reports</p>
        <div className="space-y-2">
          {["Annual Summary 2024", "Q2 Report (Apr–Jun)", "Service Performance Report", "Payment Reconciliation"].map(r => (
            <div key={r} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-700 font-medium">{r}</span>
              <button className="flex items-center gap-1.5 text-xs text-[#0E6BB8] font-semibold hover:underline">
                <Download size={12} /> PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
function MessagesView() {
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState(MESSAGES);
  const [input, setInput] = useState("");

  const thread = msgs.find(m => m.id === active);

  if (thread) return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setActive(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
          <ChevronRight size={16} className="rotate-180" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm leading-tight">{thread.subject}</p>
          <p className="text-xs text-slate-400">{thread.from}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {thread.thread.map((m, i) => (
          <div key={i} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
            {!m.mine && (
              <div className="w-8 h-8 rounded-full bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-bold mr-2 self-end flex-shrink-0">BD</div>
            )}
            <div className={cn("max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm",
              m.mine ? "bg-[#0E6BB8] text-white rounded-br-sm" : "bg-slate-100 text-slate-700 rounded-bl-sm")}>
              {m.text}
              <p className={cn("text-xs mt-1", m.mine ? "text-white/60" : "text-slate-400")}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400"><Paperclip size={16} /></button>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a reply…"
          className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm focus:outline-none" />
        <button className="p-2.5 bg-[#0E6BB8] text-white rounded-xl hover:bg-[#0B5794]"><Send size={16} /></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Messages</h2>
      <div className="space-y-2.5">
        {msgs.map(m => (
          <div key={m.id} onClick={() => { setActive(m.id); setMsgs(ms => ms.map(x => x.id === m.id ? { ...x, unread: false } : x)); }}
            className={cn("bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-sm transition-all",
              m.unread ? "border-[#0E6BB8]/25 bg-[#0E6BB8]/3" : "border-slate-200")}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                BD
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">{m.from}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{m.time}</span>
                    {m.unread && <div className="w-2 h-2 rounded-full bg-[#0E6BB8]" />}
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">{m.subject}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{m.preview}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SUPPORT ──────────────────────────────────────────────────────────────────
function SupportView() {
  const [active, setActive] = useState<string | null>(null);
  const ticket = SUP_TICKETS[0];
  const TMSG = [
    { from: "Me",           text: "The payment for INV-SUP-0241 is still showing as pending. Could you provide an update?", time: "Jul 16 10:00", mine: true  },
    { from: "BDH Support",  text: "Hi! We've escalated this to accounts. Payment is scheduled for Aug 1 as per the invoice terms.", time: "Jul 16 14:30", mine: false },
  ];

  if (active) return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setActive(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
          <ChevronRight size={16} className="rotate-180" />
        </button>
        <div>
          <p className="font-bold text-slate-800 text-sm">{ticket.subject}</p>
          <p className="text-xs text-slate-400">{active} · Open</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {TMSG.map((m, i) => (
          <div key={i} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
            {!m.mine && <div className="w-8 h-8 rounded-full bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-bold mr-2 self-end flex-shrink-0">BD</div>}
            <div className={cn("max-w-xs px-4 py-2.5 rounded-2xl text-sm",
              m.mine ? "bg-[#0E6BB8] text-white rounded-br-sm" : "bg-slate-100 text-slate-700 rounded-bl-sm")}>
              {m.text}
              <p className={cn("text-xs mt-1", m.mine ? "text-white/60" : "text-slate-400")}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400"><Paperclip size={16} /></button>
        <input placeholder="Type your message…" className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm focus:outline-none" />
        <button className="p-2.5 bg-[#0E6BB8] text-white rounded-xl"><Send size={16} /></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Support</h2>
        <button className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0E6BB8] text-white text-sm font-semibold rounded-xl hover:bg-[#0B5794]">
          <Plus size={14} /> New Ticket
        </button>
      </div>
      <div className="bg-[#0E6BB8]/5 border border-[#0E6BB8]/15 rounded-2xl p-4">
        <p className="text-sm font-semibold text-slate-800">Supplier Support Line</p>
        <p className="text-xs text-slate-500 mt-0.5">Priority: <span className="text-[#0E6BB8] font-bold">+880 31 123 4569</span> · Mon–Sat 9am–6pm</p>
      </div>
      {SUP_TICKETS.map(t => (
        <div key={t.id} onClick={() => setActive(t.id)}
          className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-3">
              <p className="text-xs font-mono text-slate-400 mb-1">{t.id}</p>
              <p className="font-semibold text-slate-800">{t.subject}</p>
            </div>
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border flex-shrink-0",
              t.status === "open" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")}>
              {t.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1"><MessageSquare size={11} />{t.msgs} messages</span>
            <span>{t.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileView() {
  const q = useSupplierMe();
  const me = q.data;
  const initials = (me?.name ?? "").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="space-y-5" data-portal="profile">
      <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>
      <PLoad q={q}>
        {me && (<>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0E6BB8]/10 flex items-center justify-center text-[#0E6BB8] text-xl font-black flex-shrink-0">{initials}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-bold text-slate-800" data-portal-name>{me.name}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 capitalize"><CheckCircle size={10} /> {me.status.toLowerCase()}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{me.supplierCode}</p>
                {me.rating != null && <span className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1"><Star size={11} className="fill-amber-400" />{me.rating} Rating</span>}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">Company Information</p>
            {[
              ["Company Name", me.name],
              ["Contact Person", me.contactPerson ?? "—"],
              ["Phone", me.phone ?? "—"],
              ["Email", me.email ?? "—"],
              ["Category", me.category ?? "—"],
              ["Trade License", me.tradeLicense ?? "—"],
              ["TIN", me.tin ?? "—"],
              ["Address", me.address ?? "—"],
            ].map(([l,v])=>(
              <div key={l}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
                <input value={v} disabled data-field={l} className="w-full px-3 py-2.5 text-sm rounded-xl border border-transparent bg-slate-50 text-slate-700"/>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">Bank Details</p>
            {[["Bank Name", me.bankName ?? "—"],["Account No.", me.accountNo ?? "—"]].map(([l,v])=>(
              <div key={l}><label className="block text-xs font-medium text-slate-400 mb-1">{l}</label><div className="px-3 py-2.5 bg-slate-50 rounded-xl text-sm text-slate-700">{v}</div></div>
            ))}
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50 transition-colors"><LogOut size={16} /> Sign Out</button>
        </>)}
      </PLoad>
    </div>
  );
}

// ─── PORTAL SHELL ─────────────────────────────────────────────────────────────
export function SupplierPortal() {
  const [view, setView] = useState<SupView>("dashboard");
  const { data: me } = useSupplierMe();
  const name = me?.name ?? "Supplier";
  const initials = name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const unread = MESSAGES.filter(m => m.unread).length;

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
              <div className="w-9 h-9 rounded-xl bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-black">BDH</div>
              <div>
                <p className="text-sm font-bold text-slate-800">BDH Travels</p>
                <p className="text-xs text-slate-400 font-medium">Supplier Portal</p>
              </div>
            </div>
          </div>
          {/* Supplier identity */}
          <div className="px-4 py-3.5 border-b border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-3">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#0E6BB8]/12 flex items-center justify-center text-[#0E6BB8] text-xs font-black">{initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate" data-portal-name>{name}</p>
                  <p className="text-xs text-slate-400 font-mono">{me?.supplierCode ?? ""}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              </div>
              {/* Pending badge */}
              {REQUESTS.filter(r => r.status === "pending").length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={12} className="text-amber-500" />
                  <p className="text-xs text-amber-700 font-semibold">
                    {REQUESTS.filter(r => r.status === "pending").length} pending request{REQUESTS.filter(r => r.status === "pending").length > 1 ? "s" : ""}
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
                    ? "bg-[#0E6BB8] text-white shadow-sm shadow-[#0E6BB8]/25"
                    : "text-slate-600 hover:bg-slate-100")}>
                <item.icon size={16} className={view === item.id ? "text-white" : "text-slate-400"} />
                <span className="font-medium flex-1 text-left">{item.label}</span>
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
              {NAV.find(n => n.id === view)?.label}
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
              <div className="w-7 h-7 rounded-full bg-[#0E6BB8]/15 flex items-center justify-center text-[#0E6BB8] text-xs font-bold ml-1">AI</div>
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
            <div className="w-8 h-8 rounded-lg bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-black">BDH</div>
            <div>
              <p className="text-sm font-bold text-slate-800">Supplier Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {REQUESTS.filter(r => r.status === "pending").length > 0 && (
              <button onClick={() => go("requests")}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700">
                <AlertCircle size={11} />
                {REQUESTS.filter(r => r.status === "pending").length} pending
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
                  <item.icon size={22} className={active ? "text-[#0E6BB8]" : "text-slate-400"} />
                  <span className={cn("text-xs font-medium", active ? "text-[#0E6BB8]" : "text-slate-400")}>{item.label}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-[#0E6BB8]" />}
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
