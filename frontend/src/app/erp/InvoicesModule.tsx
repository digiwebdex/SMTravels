import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FileText, Plus, Search, Filter, Download, Eye, Send, Printer,
  CheckCircle, Clock, AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight,
  CreditCard, Calendar, Users, Wallet, MoreHorizontal, ChevronRight,
  RefreshCw, Receipt, ArrowLeft, Building2, Phone, Mail, Globe,
  TrendingUp, TrendingDown, RotateCcw, Tag, Banknote,
} from "lucide-react";
import { cn, img, fmtPrice } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type InvoicesView =
  | "list" | "detail" | "print"
  | "receipts" | "collection" | "installment-builder"
  | "due-management" | "online-payments" | "history"
  | "refunds" | "vouchers";

type Currency = "BDT" | "USD" | "SAR";
type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
type PayStatus = "confirmed" | "pending" | "failed" | "refunded";

const CURRENCY_SYMBOL: Record<Currency, string> = { BDT: "৳", USD: "$", SAR: "﷼" };
const fmtC = (n: number, cur: Currency = "BDT") =>
  `${CURRENCY_SYMBOL[cur]} ${n.toLocaleString("en-BD")}`;

// ─── Mock Data ────────────────────────────────────────────────────────────────
interface Invoice {
  id: string; date: string; dueDate: string;
  customer: string; email: string; phone: string;
  service: string; currency: Currency;
  amount: number; paid: number; status: InvoiceStatus;
  items: { desc: string; qty: number; rate: number; total: number }[];
  notes?: string;
}

const INVOICES: Invoice[] = [
  { id: "INV-2401", date: "Jul 1, 2024", dueDate: "Jul 15, 2024", customer: "Md. Abdullah Al-Mamun", email: "abdullah@gmail.com", phone: "+880 171-234-5678", service: "Hajj 2024 – Economy", currency: "BDT", amount: 520000, paid: 520000, status: "paid", items: [{ desc: "Hajj Package – Economy (1 person)", qty: 1, rate: 480000, total: 480000 }, { desc: "Visa Processing Fee", qty: 1, rate: 25000, total: 25000 }, { desc: "Airport Assistance", qty: 1, rate: 15000, total: 15000 }] },
  { id: "INV-2402", date: "Jul 3, 2024", dueDate: "Jul 20, 2024", customer: "Rabeya Khatun", email: "rabeya.k@yahoo.com", phone: "+880 181-345-6789", service: "Umrah Ramadan – VIP", currency: "BDT", amount: 185000, paid: 92500, status: "partial", items: [{ desc: "Umrah Package – VIP (1 person)", qty: 1, rate: 165000, total: 165000 }, { desc: "Visa Fee", qty: 1, rate: 20000, total: 20000 }], notes: "Customer agreed to 2-installment plan." },
  { id: "INV-2403", date: "Jul 5, 2024", dueDate: "Jul 12, 2024", customer: "NMT Travels Agency", email: "accounts@nmt-travels.com", phone: "+880 191-456-7890", service: "Saudi Visa × 15", currency: "BDT", amount: 450000, paid: 0, status: "overdue", items: [{ desc: "Saudi Tourist Visa", qty: 15, rate: 28000, total: 420000 }, { desc: "Handling Fee", qty: 15, rate: 2000, total: 30000 }] },
  { id: "INV-2404", date: "Jul 8, 2024", dueDate: "Aug 5, 2024", customer: "Karim & Family", email: "akarim@gmail.com", phone: "+880 171-567-8901", service: "Malaysia 5N Tour × 3", currency: "BDT", amount: 215000, paid: 43000, status: "partial", items: [{ desc: "Malaysia 5N/6D Tour Package", qty: 3, rate: 65000, total: 195000 }, { desc: "Travel Insurance", qty: 3, rate: 5000, total: 15000 }, { desc: "Airport Pickup", qty: 1, rate: 5000, total: 5000 }] },
  { id: "INV-2405", date: "Jul 10, 2024", dueDate: "Jul 25, 2024", customer: "Hosne Ara Begum", email: "hosne.a@gmail.com", phone: "+880 181-678-9012", service: "Hajj 2024 – Premium", currency: "BDT", amount: 680000, paid: 0, status: "sent", items: [{ desc: "Hajj Package – Premium (1 person)", qty: 1, rate: 620000, total: 620000 }, { desc: "Visa + Biometric", qty: 1, rate: 35000, total: 35000 }, { desc: "Pre-Hajj Training", qty: 1, rate: 25000, total: 25000 }] },
  { id: "INV-2406", date: "Jun 28, 2024", dueDate: "Jul 10, 2024", customer: "Rahman Brothers", email: "info@rahmanbrothers.com", phone: "+880 191-789-0123", service: "Air Ticket × 4", currency: "BDT", amount: 88000, paid: 88000, status: "paid", items: [{ desc: "CGP-DAC Roundtrip Ticket", qty: 4, rate: 22000, total: 88000 }] },
];

const PAYMENT_HISTORY = [
  { id: "PAY-9041", date: "Jul 14", invoice: "INV-2401", customer: "Md. Abdullah Al-Mamun", amount: 520000, method: "Bank Transfer", gateway: "DBBL", status: "confirmed" as PayStatus },
  { id: "PAY-9040", date: "Jul 12", invoice: "INV-2402", customer: "Rabeya Khatun", amount: 92500, method: "bKash", gateway: "bKash", status: "confirmed" as PayStatus },
  { id: "PAY-9039", date: "Jul 10", invoice: "INV-2404", customer: "Karim & Family", amount: 43000, method: "SSLCommerz", gateway: "SSLCommerz", status: "confirmed" as PayStatus },
  { id: "PAY-9038", date: "Jul 9", invoice: "INV-2406", customer: "Rahman Brothers", amount: 88000, method: "Nagad", gateway: "Nagad", status: "confirmed" as PayStatus },
  { id: "PAY-9037", date: "Jul 7", invoice: "INV-2403", customer: "NMT Travels Agency", amount: 150000, method: "Bank Transfer", gateway: "DBBL", status: "failed" as PayStatus },
];

const REFUNDS = [
  { id: "REF-041", date: "Jul 11", invoice: "INV-2390", customer: "Arif Hossain", reason: "Package cancelled – COVID", amount: 185000, method: "Bank Transfer", status: "approved" },
  { id: "REF-040", date: "Jul 8", invoice: "INV-2381", customer: "Salma Begum", reason: "Visa rejected", amount: 25000, method: "bKash", status: "processed" },
  { id: "REF-039", date: "Jul 5", invoice: "INV-2374", customer: "Hasan Khan", reason: "Flight cancelled", amount: 44000, method: "Nagad", status: "pending" },
];

const VOUCHERS = [
  { id: "VCH-001", code: "HAJJ100", type: "flat", value: 100, currency: "USD" as Currency, service: "Hajj Packages", used: 12, limit: 20, expires: "Aug 31", status: "active" },
  { id: "VCH-002", code: "UMRAH10", type: "percent", value: 10, currency: "BDT" as Currency, service: "Umrah Packages", used: 31, limit: 50, expires: "Jul 31", status: "active" },
  { id: "VCH-003", code: "FIRST500", type: "flat", value: 500, currency: "BDT" as Currency, service: "All Services", used: 8, limit: 100, expires: "Dec 31", status: "active" },
  { id: "VCH-004", code: "AGENT15", type: "percent", value: 15, currency: "BDT" as Currency, service: "Agent Bookings", used: 50, limit: 50, expires: "Jul 15", status: "expired" },
];

const AGING_DATA = [
  { range: "Current", amount: 1283000, count: 3, color: "#0E7C66" },
  { range: "1–30 days", amount: 450000, count: 2, color: "#F59E0B" },
  { range: "31–60 days", amount: 268000, count: 1, color: "#F97316" },
  { range: "61–90 days", amount: 120000, count: 1, color: "#EF4444" },
  { range: "90+ days", amount: 85000, count: 1, color: "#991B1B" },
];

const INV_STATUS_CFG: Record<InvoiceStatus, { label: string; cls: string }> = {
  draft:     { label: "Draft",      cls: "bg-slate-100 text-slate-500" },
  sent:      { label: "Sent",       cls: "bg-blue-50 text-blue-700" },
  paid:      { label: "Paid",       cls: "bg-emerald-50 text-emerald-700" },
  partial:   { label: "Partial",    cls: "bg-amber-50 text-amber-700" },
  overdue:   { label: "Overdue",    cls: "bg-red-50 text-red-700" },
  cancelled: { label: "Cancelled",  cls: "bg-slate-100 text-slate-400" },
};
function InvStatusChip({ status }: { status: InvoiceStatus }) {
  const cfg = INV_STATUS_CFG[status];
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", cfg.cls)}>{cfg.label}</span>;
}

const PAY_STATUS_CFG: Record<PayStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
  refunded: "bg-slate-100 text-slate-500",
};

// ─── Sub-nav ──────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { group: "Invoices", items: [
    { id: "list" as InvoicesView, label: "All Invoices", icon: FileText },
    { id: "collection" as InvoicesView, label: "Payment Collection", icon: CreditCard },
    { id: "receipts" as InvoicesView, label: "Receipts", icon: Receipt },
  ]},
  { group: "Installments", items: [
    { id: "installment-builder" as InvoicesView, label: "Plan Builder", icon: Calendar },
    { id: "due-management" as InvoicesView, label: "Due Management", icon: AlertTriangle },
  ]},
  { group: "Payments", items: [
    { id: "online-payments" as InvoicesView, label: "Online Payments", icon: Globe },
    { id: "history" as InvoicesView, label: "Payment History", icon: Clock },
    { id: "refunds" as InvoicesView, label: "Refunds", icon: RotateCcw },
  ]},
  { group: "Promotions", items: [
    { id: "vouchers" as InvoicesView, label: "Vouchers", icon: Tag },
  ]},
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, icon: Icon, color }: {
  label: string; value: string; sub?: string; trend?: number;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Invoice List ─────────────────────────────────────────────────────────────
function InvoiceListView({ onView, onPrint }: { onView: (id: string) => void; onPrint: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");

  const filtered = INVOICES.filter(inv =>
    (statusFilter === "all" || inv.status === statusFilter) &&
    (inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.id.includes(search))
  );

  const totalOutstanding = INVOICES.filter(i => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => s + (i.amount - i.paid), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Invoices</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage all customer invoices</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Download size={14} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
            <Plus size={14} /> New Invoice
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Invoiced (Jul)" value={fmtC(2138000)} trend={18} icon={FileText} color="bg-[#0E6BB8]" />
        <KpiCard label="Collected" value={fmtC(743500)} trend={12} icon={CheckCircle} color="bg-emerald-500" />
        <KpiCard label="Outstanding" value={fmtC(totalOutstanding)} icon={Clock} color="bg-amber-500" />
        <KpiCard label="Overdue" value={fmtC(450000)} trend={-5} icon={AlertTriangle} color="bg-red-500" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as InvoiceStatus | "all")}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
            <option value="all">All Statuses</option>
            {(Object.keys(INV_STATUS_CFG) as InvoiceStatus[]).map(s => (
              <option key={s} value={s}>{INV_STATUS_CFG[s].label}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Invoice #", "Date", "Due Date", "Customer", "Service", "Amount", "Paid", "Balance", "Status", ""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{inv.id}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{inv.date}</td>
                <td className={cn("px-4 py-3 text-sm", inv.status === "overdue" ? "text-red-600 font-medium" : "text-slate-500")}>{inv.dueDate}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{inv.customer}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{inv.service}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(inv.amount, inv.currency)}</td>
                <td className="px-4 py-3 text-sm font-mono text-emerald-600">{fmtC(inv.paid, inv.currency)}</td>
                <td className="px-4 py-3 text-sm font-mono text-red-500">{inv.amount - inv.paid > 0 ? fmtC(inv.amount - inv.paid, inv.currency) : "—"}</td>
                <td className="px-4 py-3"><InvStatusChip status={inv.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onView(inv.id)} className="p-1.5 hover:bg-slate-100 rounded" title="View">
                      <Eye size={13} className="text-slate-400" />
                    </button>
                    <button onClick={() => onPrint(inv.id)} className="p-1.5 hover:bg-slate-100 rounded" title="Print">
                      <Printer size={13} className="text-slate-400" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded" title="Send">
                      <Send size={13} className="text-slate-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Detail ───────────────────────────────────────────────────────────
function InvoiceDetailView({ invoiceId, onBack, onPrint }: { invoiceId: string; onBack: () => void; onPrint: () => void }) {
  const inv = INVOICES.find(i => i.id === invoiceId)!;
  if (!inv) return null;
  const subtotal = inv.items.reduce((s, i) => s + i.total, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Back
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-800">{inv.id}</span>
        <div className="ml-auto flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Send size={14} /> Send to Customer
          </button>
          <button onClick={onPrint} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Printer size={14} /> Print / PDF
          </button>
          {inv.status !== "paid" && (
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <CreditCard size={14} /> Collect Payment
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{inv.id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <InvStatusChip status={inv.status} />
                  <span className="text-sm text-slate-400">Issued {inv.date} · Due {inv.dueDate}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-600">BDH Travels & Tourism</p>
                <p className="text-xs text-slate-400">23 Agrabad C/A, Chattogram</p>
                <p className="text-xs text-slate-400">+880 31-716-4521</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5 mb-6 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bill To</p>
                <p className="font-semibold text-slate-800">{inv.customer}</p>
                <p className="text-sm text-slate-500">{inv.email}</p>
                <p className="text-sm text-slate-500">{inv.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Service</p>
                <p className="font-semibold text-slate-800">{inv.service}</p>
                <p className="text-sm text-slate-500">Currency: {inv.currency}</p>
              </div>
            </div>
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 pb-2">Description</th>
                  <th className="text-right text-xs font-semibold text-slate-500 pb-2 w-16">Qty</th>
                  <th className="text-right text-xs font-semibold text-slate-500 pb-2 w-32">Unit Price</th>
                  <th className="text-right text-xs font-semibold text-slate-500 pb-2 w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-3 text-sm text-slate-700">{item.desc}</td>
                    <td className="py-3 text-sm text-slate-500 text-right">{item.qty}</td>
                    <td className="py-3 text-sm text-slate-700 text-right font-mono">{fmtC(item.rate, inv.currency)}</td>
                    <td className="py-3 text-sm font-semibold text-slate-800 text-right font-mono">{fmtC(item.total, inv.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-700 font-mono">{fmtC(subtotal, inv.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">VAT (5%)</span>
                  <span className="text-slate-700 font-mono">{fmtC(tax, inv.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2">
                  <span className="text-slate-800">Total</span>
                  <span className="text-slate-800 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(total, inv.currency)}</span>
                </div>
                {inv.paid > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Paid</span>
                    <span className="font-mono">−{fmtC(inv.paid, inv.currency)}</span>
                  </div>
                )}
                {inv.amount - inv.paid > 0 && (
                  <div className="flex justify-between text-sm font-bold text-red-600 border-t border-slate-200 pt-2">
                    <span>Balance Due</span>
                    <span className="font-mono">{fmtC(inv.amount - inv.paid, inv.currency)}</span>
                  </div>
                )}
              </div>
            </div>
            {inv.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-600">{inv.notes}</p>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-800 mb-4">Payment Summary</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Collected</span>
                  <span className="font-medium text-emerald-600 font-mono">{fmtC(inv.paid, inv.currency)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.round((inv.paid / inv.amount) * 100)}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">{Math.round((inv.paid / inv.amount) * 100)}% of {fmtC(inv.amount, inv.currency)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-800 mb-3">Actions</h4>
            <div className="space-y-2">
              {[
                { label: "Record Payment", icon: CreditCard, cls: "bg-[#0E6BB8] text-white hover:bg-[#0B5794]" },
                { label: "Send Reminder", icon: Send, cls: "border border-slate-200 text-slate-600 hover:bg-slate-50" },
                { label: "Download PDF", icon: Download, cls: "border border-slate-200 text-slate-600 hover:bg-slate-50" },
                { label: "Cancel Invoice", icon: XCircle, cls: "border border-red-200 text-red-500 hover:bg-red-50" },
              ].map(({ label, icon: Icon, cls }) => (
                <button key={label} className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors", cls)}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Printable Invoice ────────────────────────────────────────────────────────
function PrintableInvoiceView({ invoiceId, onBack }: { invoiceId: string; onBack: () => void }) {
  const inv = INVOICES.find(i => i.id === invoiceId)!;
  if (!inv) return null;
  const subtotal = inv.items.reduce((s, i) => s + i.total, 0);
  const tax = Math.round(subtotal * 0.05);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 no-print">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Back
        </button>
        <button className="ml-auto flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
          <Printer size={14} /> Print
        </button>
      </div>
      {/* A4 invoice preview */}
      <div className="bg-white rounded-xl border border-slate-200 max-w-3xl mx-auto" style={{ minHeight: "297mm" }}>
        {/* Header stripe */}
        <div className="h-2 rounded-t-xl" style={{ background: "linear-gradient(90deg, #0E6BB8 0%, #E8471F 100%)" }} />
        <div className="p-10">
          {/* Company header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#0E6BB8] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">BDH</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#0E6BB8]">BDH Travels & Tourism</h1>
                  <p className="text-xs text-slate-500">Govt. Registered Hajj & Umrah Operator · License No. HA-2024-0421</p>
                </div>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5 mt-2">
                <p>23 Agrabad C/A, Chattogram-4100, Bangladesh</p>
                <p>Phone: +880 31-716-4521 · Email: info@bdhravels.com</p>
                <p>Web: www.bdhtravels.com · Trade Lic: CTG-2019-0081234</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-800/10 mb-2">INVOICE</div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-slate-500">Invoice #</span>
                  <span className="font-bold text-[#0E6BB8] font-mono">{inv.id}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-700">{inv.date}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-slate-500">Due</span>
                  <span className="font-medium text-red-600">{inv.dueDate}</span>
                </div>
              </div>
              <div className="mt-3"><InvStatusChip status={inv.status} /></div>
            </div>
          </div>

          {/* Bill to */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
              <p className="font-bold text-slate-800">{inv.customer}</p>
              <p className="text-sm text-slate-600">{inv.email}</p>
              <p className="text-sm text-slate-600">{inv.phone}</p>
            </div>
            <div className="p-4 bg-[#0E6BB8]/5 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Service Details</p>
              <p className="font-bold text-slate-800">{inv.service}</p>
              <p className="text-sm text-slate-600">Currency: {inv.currency}</p>
              {inv.notes && <p className="text-xs text-slate-500 mt-1">{inv.notes}</p>}
            </div>
          </div>

          {/* Items table */}
          <table className="w-full mb-6">
            <thead>
              <tr style={{ background: "#0E6BB8" }}>
                <th className="text-left text-xs font-semibold text-white px-4 py-3 rounded-tl-lg">Description</th>
                <th className="text-right text-xs font-semibold text-white px-4 py-3 w-16">Qty</th>
                <th className="text-right text-xs font-semibold text-white px-4 py-3 w-32">Unit Price</th>
                <th className="text-right text-xs font-semibold text-white px-4 py-3 w-36 rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.desc}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 text-right">{item.qty}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 text-right font-mono">{fmtC(item.rate, inv.currency)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right font-mono">{fmtC(item.total, inv.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2">
              {[
                { label: "Subtotal", value: fmtC(subtotal, inv.currency), bold: false },
                { label: "VAT (5%)", value: fmtC(tax, inv.currency), bold: false },
              ].map(({ label, value, bold }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className={cn("font-mono", bold ? "font-bold text-slate-800" : "text-slate-700")}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold border-t border-slate-300 pt-2">
                <span className="text-slate-800">Total</span>
                <span className="text-[#0E6BB8] font-mono text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtC(subtotal + tax, inv.currency)}
                </span>
              </div>
              {inv.paid > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Amount Paid</span>
                  <span className="font-mono">−{fmtC(inv.paid, inv.currency)}</span>
                </div>
              )}
              {inv.amount - inv.paid > 0 && (
                <div className="flex justify-between font-bold text-red-600 border-t border-red-200 pt-2">
                  <span>Balance Due</span>
                  <span className="font-mono">{fmtC(inv.amount - inv.paid, inv.currency)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Methods</p>
              <div className="text-xs text-slate-600 space-y-1">
                <p>Bank Transfer: DBBL A/C 1021-0110-0000-234 (Agrabad)</p>
                <p>bKash Merchant: 01712-345-678</p>
                <p>Nagad Merchant: 01812-345-678</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Terms & Conditions</p>
              <p className="text-xs text-slate-500">Payment is due by the date shown above. Late payments are subject to a 2% monthly fee. All sales are final. Refund policy applies per service agreement.</p>
            </div>
          </div>
          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Thank you for choosing BDH Travels & Tourism · Serving pilgrims since 2001</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Receipts ─────────────────────────────────────────────────────────────────
function ReceiptsView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Receipts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Issued payment receipts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
          <Plus size={14} /> Issue Receipt
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Receipt #", "Invoice", "Customer", "Amount", "Method", "Date", ""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAYMENT_HISTORY.filter(p => p.status === "confirmed").map((p, i) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-400">REC-{(9000 + i + 1).toString()}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.invoice}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{p.customer}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">{fmtC(p.amount)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.method}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.date}</td>
                <td className="px-4 py-3">
                  <button className="flex items-center gap-1 text-xs text-[#0E6BB8] hover:underline">
                    <Printer size={12} /> Print
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payment Collection ───────────────────────────────────────────────────────
function PaymentCollectionView() {
  const [selectedInv, setSelectedInv] = useState("");
  const [method, setMethod] = useState("bank");
  const [amount, setAmount] = useState("");
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Payment Collection</h2>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Collect Payment</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Invoice / Booking</label>
              <select value={selectedInv} onChange={e => setSelectedInv(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="">Select invoice…</option>
                {INVOICES.filter(i => i.status !== "paid" && i.status !== "cancelled").map(i => (
                  <option key={i.id} value={i.id}>{i.id} – {i.customer} ({fmtC(i.amount - i.paid)} due)</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input type="date" defaultValue="2024-07-14"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "bank", label: "Bank Transfer", icon: Building2 },
                  { id: "bkash", label: "bKash", icon: Phone },
                  { id: "nagad", label: "Nagad", icon: Banknote },
                  { id: "ssl", label: "SSLCommerz", icon: Globe },
                ].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setMethod(id)}
                    className={cn("flex flex-col items-center gap-1 p-3 border rounded-lg text-xs transition-all",
                      method === id ? "border-[#0E6BB8] bg-[#0E6BB8]/5 text-[#0E6BB8]" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reference / Transaction ID</label>
              <input placeholder="TXN ID or cheque number…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
              <textarea rows={2} placeholder="Optional remarks…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
              <button className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                <CheckCircle size={14} /> Record Payment
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-800 mb-3">Pending Collections</h4>
            <div className="space-y-3">
              {INVOICES.filter(i => i.status !== "paid" && i.status !== "cancelled").map(inv => (
                <div key={inv.id} className="pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-mono text-slate-400">{inv.id}</p>
                      <p className="text-sm font-medium text-slate-700">{inv.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-500 font-mono">{fmtC(inv.amount - inv.paid)}</p>
                      <InvStatusChip status={inv.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Installment Plan Builder ─────────────────────────────────────────────────
function InstallmentBuilderView() {
  const [totalAmount, setTotalAmount] = useState("520000");
  const [installments, setInstallments] = useState(4);
  const [downPct, setDownPct] = useState(20);

  const total = parseFloat(totalAmount) || 0;
  const down = Math.round(total * (downPct / 100));
  const remaining = total - down;
  const each = installments > 0 ? Math.round(remaining / installments) : 0;

  const TRACKER_PLANS = [
    { id: "IP-2401", customer: "Md. Karim Ullah", total: 520000, paid: 312000, installments: 5, paid_n: 3, next: "Aug 1", status: "active" },
    { id: "IP-2403", customer: "Ahmed Family × 3", total: 215000, paid: 43000, installments: 5, paid_n: 1, next: "Jul 20", status: "active" },
    { id: "IP-2404", customer: "Rahim & Sons Agency", total: 450000, paid: 0, installments: 3, paid_n: 0, next: "Jul 16", status: "overdue" },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Installment Plan Builder</h2>
      <div className="grid grid-cols-3 gap-5">
        {/* Builder */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Create New Plan</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer / Booking</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option>Select booking…</option>
                {INVOICES.map(i => <option key={i.id}>{i.id} – {i.customer}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Total Amount (BDT)</label>
              <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Down Payment: {downPct}%</label>
              <input type="range" min={0} max={60} step={5} value={downPct} onChange={e => setDownPct(+e.target.value)}
                className="w-full accent-[#0E6BB8]" />
              <p className="text-xs text-slate-500 mt-1">Down: <span className="font-mono font-medium">{fmtC(down)}</span></p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Installments: {installments}</label>
              <input type="range" min={1} max={12} value={installments} onChange={e => setInstallments(+e.target.value)}
                className="w-full accent-[#0E6BB8]" />
              <p className="text-xs text-slate-500 mt-1">Each: <span className="font-mono font-medium">{fmtC(each)}</span></p>
            </div>
          </div>
          {/* Preview schedule */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Schedule Preview</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#E8471F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">0</div>
                <div className="flex-1 flex justify-between text-sm">
                  <span className="text-slate-600">Down Payment (Today)</span>
                  <span className="font-mono font-semibold text-slate-800">{fmtC(down)}</span>
                </div>
              </div>
              {Array.from({ length: installments }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <div className="flex-1 flex justify-between text-sm">
                    <span className="text-slate-600">Installment {i + 1} – {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][i]} 1</span>
                    <span className="font-mono font-semibold text-slate-800">{fmtC(each)}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                <span className="text-slate-800">Total</span>
                <span className="font-mono text-[#0E6BB8]">{fmtC(down + each * installments)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Save Draft</button>
            <button className="px-5 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">Create Plan</button>
          </div>
        </div>
        {/* Active plans tracker */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-800 mb-4">Active Plans</h4>
          <div className="space-y-4">
            {TRACKER_PLANS.map(plan => {
              const pct = Math.round((plan.paid / plan.total) * 100);
              return (
                <div key={plan.id} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-slate-400">{plan.id}</span>
                    <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full",
                      plan.status === "overdue" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700")}>
                      {plan.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{plan.customer}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", plan.status === "overdue" ? "bg-red-400" : "bg-[#0E6BB8]")}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{pct}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{plan.paid_n}/{plan.installments} paid</span>
                    <span>Next: {plan.next}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Due Management ───────────────────────────────────────────────────────────
function DueManagementView() {
  const totalDue = AGING_DATA.reduce((s, d) => s + d.amount, 0);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Due Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Aging analysis and follow-up</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          <Send size={14} /> Send All Reminders
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Outstanding" value={fmtC(totalDue)} icon={Wallet} color="bg-amber-500" />
        <KpiCard label="Overdue (30+ days)" value={fmtC(473000)} trend={-5} icon={AlertTriangle} color="bg-red-500" />
        <KpiCard label="Invoices Due" value="8" icon={FileText} color="bg-[#0E6BB8]" />
        <KpiCard label="Avg. Days Outstanding" value="18 days" icon={Clock} color="bg-slate-500" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Aging Analysis</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={AGING_DATA} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmtC(v), "Amount"]} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {AGING_DATA.map((d, i) => (
                    <rect key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-800 mb-4">Aging Summary</h4>
          <div className="space-y-3">
            {AGING_DATA.map(d => (
              <div key={d.range} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-sm text-slate-600">{d.range}</span>
                  <span className="text-xs text-slate-400">({d.count})</span>
                </div>
                <span className="text-sm font-semibold text-slate-800 font-mono">{fmtC(d.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-bold">
              <span className="text-sm text-slate-800">Total</span>
              <span className="text-sm text-slate-800 font-mono">{fmtC(totalDue)}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Overdue invoices */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Overdue & Pending Invoices</h3>
        </div>
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Invoice", "Customer", "Service", "Due Date", "Outstanding", "Days Overdue", "Status", "Action"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.filter(i => i.status !== "paid" && i.status !== "cancelled").map(inv => (
              <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{inv.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{inv.customer}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{inv.service}</td>
                <td className={cn("px-4 py-3 text-sm", inv.status === "overdue" ? "text-red-600 font-medium" : "text-slate-500")}>{inv.dueDate}</td>
                <td className="px-4 py-3 text-sm font-mono font-semibold text-red-500">{fmtC(inv.amount - inv.paid)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{inv.status === "overdue" ? "2 days" : "—"}</td>
                <td className="px-4 py-3"><InvStatusChip status={inv.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="text-xs text-[#0E6BB8] hover:underline">Remind</button>
                    <span className="text-slate-300">·</span>
                    <button className="text-xs text-emerald-600 hover:underline">Collect</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payment History ──────────────────────────────────────────────────────────
function PaymentHistoryView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Payment History</h2>
          <p className="text-sm text-slate-500 mt-0.5">All payment transactions</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          <Download size={14} /> Export
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Received (Jul)" value={fmtC(743500)} trend={14} icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard label="Transactions" value={String(PAYMENT_HISTORY.length)} icon={Receipt} color="bg-blue-500" />
        <KpiCard label="Failed" value="1" icon={XCircle} color="bg-red-500" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Txn ID", "Invoice", "Customer", "Amount", "Method", "Gateway", "Date", "Status"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAYMENT_HISTORY.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{p.id}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.invoice}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{p.customer}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">{fmtC(p.amount)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.method}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.gateway}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.date}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", PAY_STATUS_CFG[p.status])}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Online Payments ──────────────────────────────────────────────────────────
function OnlinePaymentsView() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Online Payments</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: "bKash", logo: "bK", color: "#E2136E", vol: 3200000, txn: 148, rate: "98.6%" },
          { name: "Nagad", logo: "Na", color: "#F05A28", vol: 1850000, txn: 97, rate: "99.1%" },
          { name: "SSLCommerz", logo: "SSL", color: "#0065BD", vol: 2100000, txn: 62, rate: "97.8%" },
        ].map(gw => (
          <div key={gw.name} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: gw.color }}>{gw.logo}</div>
              <div>
                <p className="font-semibold text-slate-800">{gw.name}</p>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Active</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Volume</span>
                <span className="font-mono font-semibold text-slate-800">{fmtC(gw.vol)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transactions</span>
                <span className="font-mono font-semibold text-slate-800">{gw.txn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Success Rate</span>
                <span className="font-semibold text-emerald-600">{gw.rate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Recent Online Transactions</h3>
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="border-b border-slate-100">
              {["Txn ID", "Customer", "Invoice", "Gateway", "Amount", "Time", "Status"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAYMENT_HISTORY.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 pr-4 text-xs font-mono text-slate-400">{p.id}</td>
                <td className="py-3 pr-4 text-sm text-slate-700">{p.customer}</td>
                <td className="py-3 pr-4 text-xs font-mono text-slate-400">{p.invoice}</td>
                <td className="py-3 pr-4 text-sm text-slate-500">{p.gateway}</td>
                <td className="py-3 pr-4 text-sm font-mono font-semibold text-slate-800">{fmtC(p.amount)}</td>
                <td className="py-3 pr-4 text-sm text-slate-400">{p.date}, 10:41 AM</td>
                <td className="py-3">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", PAY_STATUS_CFG[p.status])}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Refunds ──────────────────────────────────────────────────────────────────
function RefundsView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Refunds</h2>
          <p className="text-sm text-slate-500 mt-0.5">Process and track customer refunds</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
          <Plus size={14} /> New Refund
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Refunded (Jul)" value={fmtC(210000)} icon={RotateCcw} color="bg-red-500" />
        <KpiCard label="Pending Approval" value="1" icon={Clock} color="bg-amber-500" />
        <KpiCard label="Processed" value="2" icon={CheckCircle} color="bg-emerald-500" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Ref ID", "Invoice", "Customer", "Reason", "Amount", "Method", "Date", "Status", ""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REFUNDS.map(r => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{r.id}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.invoice}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{r.customer}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.reason}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">{fmtC(r.amount)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.method}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.date}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                    r.status === "processed" ? "bg-emerald-50 text-emerald-700" :
                    r.status === "approved" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status === "pending" && (
                    <div className="flex gap-1">
                      <button className="text-xs text-emerald-600 hover:underline">Approve</button>
                      <span className="text-slate-300">·</span>
                      <button className="text-xs text-red-500 hover:underline">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Vouchers ─────────────────────────────────────────────────────────────────
function VouchersView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Vouchers & Promo Codes</h2>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage discount vouchers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
          <Plus size={14} /> Create Voucher
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {VOUCHERS.map(v => (
          <div key={v.id} className={cn("bg-white rounded-xl border p-5 relative overflow-hidden",
            v.status === "expired" ? "border-slate-200 opacity-60" : "border-slate-200")}>
            {v.status === "active" && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">ACTIVE</div>
            )}
            {v.status === "expired" && (
              <div className="absolute top-0 right-0 bg-slate-400 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">EXPIRED</div>
            )}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8471F]/10 flex items-center justify-center">
                <Tag size={18} className="text-[#C43A15]" />
              </div>
              <div>
                <p className="font-bold text-slate-800 font-mono text-lg">{v.code}</p>
                <p className="text-sm text-slate-500">{v.service}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <p className="text-xs text-slate-400">Discount</p>
                <p className="font-bold text-[#0E6BB8]">
                  {v.type === "flat" ? `${CURRENCY_SYMBOL[v.currency]}${v.value} off` : `${v.value}% off`}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Expires</p>
                <p className="font-semibold text-slate-700">{v.expires}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Usage: {v.used}/{v.limit}</span>
                <span>{Math.round((v.used / v.limit) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#E8471F] rounded-full" style={{ width: `${(v.used / v.limit) * 100}%` }} />
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button className="text-xs text-[#0E6BB8] hover:underline">Edit</button>
              <span className="text-slate-300">·</span>
              <button className="text-xs text-slate-400 hover:underline">View Usage</button>
              {v.status === "active" && <><span className="text-slate-300">·</span><button className="text-xs text-red-500 hover:underline">Disable</button></>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────
export function InvoicesModule() {
  const [view, setView] = useState<InvoicesView>("list");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("INV-2401");

  const handleViewInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setView("detail");
  };
  const handlePrintInvoice = (id?: string) => {
    if (id) setSelectedInvoiceId(id);
    setView("print");
  };

  const renderView = () => {
    switch (view) {
      case "list": return <InvoiceListView onView={handleViewInvoice} onPrint={handlePrintInvoice} />;
      case "detail": return <InvoiceDetailView invoiceId={selectedInvoiceId} onBack={() => setView("list")} onPrint={() => handlePrintInvoice()} />;
      case "print": return <PrintableInvoiceView invoiceId={selectedInvoiceId} onBack={() => setView("detail")} />;
      case "receipts": return <ReceiptsView />;
      case "collection": return <PaymentCollectionView />;
      case "installment-builder": return <InstallmentBuilderView />;
      case "due-management": return <DueManagementView />;
      case "online-payments": return <OnlinePaymentsView />;
      case "history": return <PaymentHistoryView />;
      case "refunds": return <RefundsView />;
      case "vouchers": return <VouchersView />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      {/* Sub-nav */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoices & Payments</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group} className="mb-1">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{group}</p>
              {items.map(item => (
                <button key={item.id} onClick={() => setView(item.id)}
                  className={cn("w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                    view === item.id || (view === "detail" && item.id === "list") || (view === "print" && item.id === "list")
                      ? "bg-[#0E6BB8]/8 text-[#0E6BB8] font-medium"
                      : "text-slate-600 hover:bg-slate-50")}>
                  <item.icon size={15} className={view === item.id ? "text-[#0E6BB8]" : "text-slate-400"} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {renderView()}
        </div>
      </div>
    </div>
  );
}
