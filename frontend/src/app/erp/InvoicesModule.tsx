import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  FileText, Plus, Search, Filter, Download, Eye, Send, Printer,
  CheckCircle, Clock, AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight,
  CreditCard, Calendar, Users, Wallet, MoreHorizontal, ChevronRight,
  RefreshCw, Receipt, ArrowLeft, Building2, Phone, Mail, Globe,
  TrendingUp, TrendingDown, RotateCcw, Tag, Banknote,
} from "lucide-react";
import { cn, img, fmtPrice } from "../lib/utils";
import { SkeletonTable, ErrorBanner, EmptyState } from "../lib/ds";
import { Drawer, Field, inputCls, selectCls, PrimaryBtn } from "./crm/ui";
import {
  useInvoices, useInvoice, useCreateInvoice, useIssueInvoice, useCancelInvoice, useRecordPayment,
  usePayments, useRefunds, useInstallmentPlans, useCreateInstallmentPlan,
} from "../hooks/finance";
import { usePendingVerifyPayments, useVerifyPayment } from "../hooks/payments";
import { downloadViaApi } from "../lib/api";
import { useCustomers } from "../hooks/crm";
import { Loader2 } from "lucide-react";
import type { InvoiceDetail as InvoiceDetailDto, InvoiceListItem, PendingPaymentDto, InstallmentPlanDto } from "@contracts/finance.contract";
import { AiInsightCard } from "../design-system";

const st2vm = (s: string): InvoiceStatus => s.toLowerCase() as InvoiceStatus;

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

// ─── Aging buckets ─────────────────────────────────────────────────────────────────

const AGING_BUCKETS = [
  { range: "0–30 days", min: 0, max: 30, color: "#F59E0B" },
  { range: "31–60 days", min: 31, max: 60, color: "#F97316" },
  { range: "61–90 days", min: 61, max: 90, color: "#EF4444" },
  { range: "90+ days", min: 91, max: Infinity, color: "#991B1B" },
] as const;

function daysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
}

function agingBucket(days: number): (typeof AGING_BUCKETS)[number] {
  return AGING_BUCKETS.find(b => days >= b.min && days <= b.max) ?? AGING_BUCKETS[0];
}

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
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
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

// ─── Pending NPSB verification ────────────────────────────────────────────────
function PendingNpsbPanel({ compact }: { compact?: boolean }) {
  const { data, isLoading, isError, error, refetch } = usePendingVerifyPayments();
  const verify = useVerifyPayment();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const rows: PendingPaymentDto[] = data?.data ?? [];

  const approve = (id: string) => verify.mutate({ id, approve: true });
  const reject = (id: string) => {
    verify.mutate({ id, approve: false, note: rejectNote.trim() || undefined }, {
      onSuccess: () => { setRejectId(null); setRejectNote(""); },
    });
  };

  if (isLoading) {
    return (
      <div className={cn("bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5", compact && "mb-5")}>
        <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={16} className="animate-spin"/> Loading pending NPSB…</div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className={cn(compact && "mb-5")}>
        <ErrorBanner message={(error as Error)?.message || "Failed to load pending NPSB payments."} onRetry={() => refetch()} />
      </div>
    );
  }
  if (rows.length === 0 && compact) return null;

  return (
    <div className={cn("bg-[var(--color-surface)] rounded-xl border border-[#F15A24]/30 overflow-hidden", compact && "mb-5")}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#F15A24]/5">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#F15A24]"/>
          <h3 className="font-semibold text-slate-800 text-sm">Pending NPSB verification</h3>
          {rows.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F15A24] text-white font-bold">{rows.length}</span>
          )}
        </div>
        <button onClick={() => refetch()} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><RefreshCw size={14}/></button>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">No customer payment proofs awaiting verification.</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {rows.map((p) => (
            <div key={p.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-slate-400">{p.paymentNo || p.id.slice(0, 8)}</p>
                  <p className="text-sm font-semibold text-slate-800">{p.customerName || "Customer"}</p>
                  {p.invoiceNo && <p className="text-xs text-slate-500 mt-0.5">Invoice {p.invoiceNo}</p>}
                  <p className="text-lg font-black text-slate-800 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtC(p.amount, p.currency as Currency)}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Ref: {p.reference || "—"} · {p.paidAt?.slice(0, 10)}</p>
                  {p.proofDocumentName && (
                    <button
                      onClick={() => p.proofDocumentId && void downloadViaApi(`/documents/${p.proofDocumentId}/file`, p.proofDocumentName!)}
                      disabled={!p.proofDocumentId}
                      className="mt-2 flex items-center gap-1 text-xs text-[#1B75BC] hover:underline disabled:opacity-40">
                      <Download size={11}/> {p.proofDocumentName}
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => approve(p.id)} disabled={verify.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap">
                    <CheckCircle size={12}/> Approve
                  </button>
                  <button onClick={() => setRejectId(rejectId === p.id ? null : p.id)} disabled={verify.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 whitespace-nowrap">
                    <XCircle size={12}/> Reject
                  </button>
                </div>
              </div>
              {rejectId === p.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  <input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Rejection note (optional)"
                    className="flex-1 px-3 py-2 text-xs border border-[var(--color-border)] rounded-lg focus:outline-none"/>
                  <button onClick={() => reject(p.id)} disabled={verify.isPending}
                    className="px-3 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">Confirm reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Invoice List ─────────────────────────────────────────────────────────────
function InvoiceListView({ onView, onNew }: { onView: (id: string) => void; onNew: () => void }) {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [page, setPage] = useState(1);
  React.useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const { data, isLoading, isError, error, refetch } = useInvoices({ page, pageSize: 10, q: q || undefined, status: statusFilter !== "all" ? statusFilter.toUpperCase() : undefined });
  const rows: InvoiceListItem[] = data?.data ?? [];
  const stats = data?.stats ?? { total: 0, totalBilled: 0, totalPaid: 0, totalDue: 0, overdue: 0 };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Invoices</h2>
          <p className="text-sm text-slate-500 mt-0.5">{data?.total ?? 0} invoices · manage all customer invoices</p>
        </div>
        <div className="flex gap-2">
          <button disabled title="Export is not available in this build"
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg text-[#9CA3AF] opacity-60 cursor-not-allowed">
            <Download size={14} /> Export
          </button>
          <button onClick={onNew} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
            <Plus size={14} /> New Invoice
          </button>
        </div>
      </div>
      <AiInsightCard title="AI Finance Tips" collapsedByDefault>
        <ul className="text-xs space-y-1.5 list-disc pl-4">
          <li>{stats.overdue > 0 ? `${stats.overdue} invoice${stats.overdue === 1 ? "" : "s"} overdue — prioritize follow-up calls.` : "No overdue invoices — collections are on track."}</li>
          <li>Outstanding balance: {fmtC(stats.totalDue)} across {stats.total} invoice{stats.total === 1 ? "" : "s"}.</li>
        </ul>
      </AiInsightCard>
      <PendingNpsbPanel compact/>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Billed" value={fmtC(stats.totalBilled)} icon={FileText} color="bg-[#1B75BC]" />
        <KpiCard label="Collected" value={fmtC(stats.totalPaid)} icon={CheckCircle} color="bg-emerald-500" />
        <KpiCard label="Outstanding" value={fmtC(stats.totalDue)} icon={Clock} color="bg-amber-500" />
        <KpiCard label="Overdue" value={String(stats.overdue)} icon={AlertTriangle} color="bg-red-500" />
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as InvoiceStatus | "all"); setPage(1); }}
            className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none">
            <option value="all">All Statuses</option>
            {(Object.keys(INV_STATUS_CFG) as InvoiceStatus[]).map(s => (
              <option key={s} value={s}>{INV_STATUS_CFG[s].label}</option>
            ))}
          </select>
        </div>
        {isError ? (
          <div className="p-6"><ErrorBanner message={(error as Error)?.message || "Failed to load invoices."} onRetry={() => refetch()} /></div>
        ) : isLoading ? (
          <div className="p-4"><SkeletonTable rows={8} cols={9} /></div>
        ) : (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
              {["Invoice #", "Issued", "Due Date", "Customer", "Amount", "Paid", "Balance", "Status", ""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(inv => (
              <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onView(inv.id)}>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{inv.invoiceNo || <span className="text-amber-600">DRAFT</span>}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{inv.issueDate || "—"}</td>
                <td className={cn("px-4 py-3 text-sm", inv.status === "OVERDUE" ? "text-red-600 font-medium" : "text-slate-500")}>{inv.dueDate || "—"}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{inv.customerName || "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(inv.total, inv.currency as Currency)}</td>
                <td className="px-4 py-3 text-sm font-mono text-emerald-600">{fmtC(inv.paidAmount, inv.currency as Currency)}</td>
                <td className="px-4 py-3 text-sm font-mono text-red-500">{inv.dueAmount > 0 ? fmtC(inv.dueAmount, inv.currency as Currency) : "—"}</td>
                <td className="px-4 py-3"><InvStatusChip status={st2vm(inv.status)} /></td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <button onClick={() => onView(inv.id)} className="p-1.5 hover:bg-slate-100 rounded" title="View"><Eye size={13} className="text-slate-400" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="py-16 text-center text-slate-400"><FileText size={32} className="mx-auto mb-3 text-slate-200" /><p className="text-sm">No invoices yet</p></div>}
        </div>
        )}
      </div>
    </div>
  );
}

// ─── Invoice Detail ───────────────────────────────────────────────────────────
function RecordPaymentDrawer({ invoice, onClose }: { invoice: InvoiceDetailDto; onClose: () => void }) {
  const record = useRecordPayment();
  const [amount, setAmount] = useState(String(invoice.dueAmount));
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const submit = async () => {
    try { await record.mutateAsync({ invoiceId: invoice.id, amount: Number(amount), method: method as never, reference: reference || undefined }); onClose(); } catch { /* toast */ }
  };
  return (
    <Drawer open onClose={onClose} title="Record Payment" subtitle={`${invoice.invoiceNo} · due ${fmtC(invoice.dueAmount, invoice.currency as Currency)}`}
      footer={<><button onClick={onClose} className="h-9 px-4 border border-[var(--color-border)] rounded-[8px] text-[12px] font-medium text-[#374151]">Cancel</button><PrimaryBtn onClick={submit} disabled={record.isPending || !(Number(amount) > 0)}>{record.isPending && <Loader2 size={13} className="animate-spin" />} Record Payment</PrimaryBtn></>}>
      <div className="flex flex-col gap-4">
        <Field label="Amount" required><input type="number" className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} /></Field>
        <Field label="Method" required>
          <select className={selectCls} value={method} onChange={e => setMethod(e.target.value)}>
            {["CASH", "BANK_TRANSFER", "BKASH", "NAGAD", "ROCKET", "CHEQUE", "CARD", "SSLCOMMERZ"].map(m => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
          </select>
        </Field>
        <Field label="Reference"><input className={inputCls} placeholder="Txn / cheque no." value={reference} onChange={e => setReference(e.target.value)} /></Field>
        <p className="text-[11px] text-slate-400">A receipt is generated automatically. Gateways (bKash/Nagad/SSLCommerz) are recorded manually for now.</p>
      </div>
    </Drawer>
  );
}

function InvoiceDetailView({ invoiceId, onBack, onPrint }: { invoiceId: string; onBack: () => void; onPrint: () => void }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useInvoice(invoiceId);
  const issue = useIssueInvoice();
  const cancel = useCancelInvoice();
  const [payOpen, setPayOpen] = useState(false);
  if (isLoading) return <div className="p-6"><SkeletonTable rows={6} cols={4} /></div>;
  if (isError || !data) return <div className="p-6"><ErrorBanner message={(error as Error)?.message || "Invoice not found."} onRetry={() => refetch()} /><button onClick={onBack} className="mt-3 text-sm text-[#1B75BC]">← Back</button></div>;
  const inv = {
    id: data.invoiceNo || "DRAFT", cuid: data.id, date: data.issueDate || "—", dueDate: data.dueDate || "—",
    customer: data.customerName || "—", email: data.customerEmail || "", phone: data.customerPhone || "",
    service: data.items[0]?.description || "—", currency: data.currency as Currency, amount: data.total, paid: data.paidAmount,
    status: st2vm(data.status), notes: data.notes,
    items: data.items.map(it => ({ desc: it.description, qty: it.qty, rate: it.unitPrice, total: it.amount })),
  };
  const subtotal = data.subtotal, tax = data.taxAmount, total = data.total;
  const canPay = data.status !== "DRAFT" && data.status !== "PAID" && data.status !== "CANCELLED";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Back
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-800">{inv.id}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => navigate("/erp/communications")}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
            <Send size={14} /> Send to Customer
          </button>
          <button onClick={onPrint} className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
            <Printer size={14} /> Print / PDF
          </button>
          {data.status === "DRAFT" && (
            <button onClick={() => issue.mutate(data.id)} disabled={issue.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] disabled:opacity-60">
              {issue.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Issue Invoice
            </button>
          )}
          {canPay && (
            <button onClick={() => setPayOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <CreditCard size={14} /> Record Payment
            </button>
          )}
        </div>
      </div>
      {payOpen && <RecordPaymentDrawer invoice={data} onClose={() => setPayOpen(false)} />}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{inv.id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <InvStatusChip status={inv.status} />
                  <span className="text-sm text-slate-400">Issued {inv.date} · Due {inv.dueDate}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-600">SM Travels International</p>
                <p className="text-xs text-slate-400">smtravelsinternational.com</p>
                <p className="text-xs text-slate-400">Govt. Licensed Hajj &amp; Umrah Operator</p>
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
                <tr className="border-b border-[var(--color-border)]">
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
                <div className="flex justify-between text-sm font-bold border-t border-[var(--color-border)] pt-2">
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
                  <div className="flex justify-between text-sm font-bold text-red-600 border-t border-[var(--color-border)] pt-2">
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
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
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
                <p className="text-xs text-slate-400 mt-1">{Math.round((inv.paid / (inv.amount || 1)) * 100)}% of {fmtC(inv.amount, inv.currency)}</p>
              </div>
            </div>
          </div>
          {/* Payment history for this invoice */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
            <h4 className="font-semibold text-slate-800 mb-3">Payments</h4>
            <div className="space-y-2">
              {data.payments.length === 0 && <p className="text-xs text-slate-400">No payments yet.</p>}
              {data.payments.map(p => (
                <div key={p.id} className={cn("flex items-center justify-between p-2.5 rounded-lg border", p.isReversed ? "border-red-100 bg-red-50/40" : "border-slate-100")}>
                  <div>
                    <div className="text-xs font-mono text-slate-600">{p.receiptNo || p.paymentNo}</div>
                    <div className="text-[10px] text-slate-400">{p.method.replace(/_/g, " ")} · {p.paidAt.slice(0, 10)}{p.isReversed ? " · reversed" : ""}</div>
                  </div>
                  <span className={cn("text-sm font-mono", p.isReversed ? "text-slate-400 line-through" : "text-emerald-600")}>{fmtC(p.amount, inv.currency)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
            <h4 className="font-semibold text-slate-800 mb-3">Actions</h4>
            <div className="space-y-2">
              {canPay && <button onClick={() => setPayOpen(true)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg bg-[#1B75BC] text-white hover:bg-[#14588F]"><CreditCard size={14} /> Record Payment</button>}
              <button onClick={onPrint} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg border border-[var(--color-border)] text-slate-600 hover:bg-slate-50"><Download size={14} /> Print / PDF</button>
              {data.status !== "CANCELLED" && data.paidAmount === 0 && (
                <button onClick={() => cancel.mutate(data.id)} disabled={cancel.isPending} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-60"><XCircle size={14} /> Cancel Invoice</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Printable Invoice ────────────────────────────────────────────────────────
function PrintableInvoiceView({ invoiceId, onBack }: { invoiceId: string; onBack: () => void }) {
  const { data, isLoading, isError, error, refetch } = useInvoice(invoiceId);
  if (isLoading) return <div className="p-6"><SkeletonTable rows={8} cols={4} /></div>;
  if (isError || !data) {
    return (
      <div className="p-6">
        <ErrorBanner message={(error as Error)?.message || "Invoice not found."} onRetry={() => refetch()} />
        <button onClick={onBack} className="mt-3 text-sm text-[#1B75BC]">← Back</button>
      </div>
    );
  }
  const inv = {
    id: data.invoiceNo || "DRAFT",
    date: data.issueDate || "—",
    dueDate: data.dueDate || "—",
    customer: data.customerName || "—",
    email: data.customerEmail || "",
    phone: data.customerPhone || "",
    service: data.items[0]?.description || "—",
    currency: data.currency as Currency,
    notes: data.notes,
    status: st2vm(data.status),
    items: data.items.map((it) => ({ desc: it.description, qty: it.qty, rate: it.unitPrice, total: it.amount })),
  };
  const subtotal = data.subtotal;
  const tax = data.taxAmount;
  const total = data.total;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 no-print">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => window.print()} className="ml-auto flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
          <Printer size={14} /> Print
        </button>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] max-w-3xl mx-auto" style={{ minHeight: "297mm" }}>
        <div className="h-2 rounded-t-xl" style={{ background: "linear-gradient(90deg, #1B75BC 0%, #F15A24 100%)" }} />
        <div className="p-10">
          <div className="flex items-start justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#1B75BC] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">SM</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1B75BC]">SM Travels International</h1>
                  <p className="text-xs text-slate-500">Govt. Registered Hajj &amp; Umrah Operator</p>
                </div>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5 mt-2">
                <p>smtravelsinternational.com</p>
                <p>Email: info@smtravelsinternational.com</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-800/10 mb-2">INVOICE</div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-slate-500">Invoice #</span>
                  <span className="font-bold text-[#1B75BC] font-mono">{inv.id}</span>
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

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
              <p className="font-bold text-slate-800">{inv.customer}</p>
              <p className="text-sm text-slate-600">{inv.email}</p>
              <p className="text-sm text-slate-600">{inv.phone}</p>
            </div>
            <div className="p-4 bg-[#1B75BC]/5 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Service Details</p>
              <p className="font-bold text-slate-800">{inv.service}</p>
              <p className="text-sm text-slate-600">Currency: {inv.currency}</p>
              {inv.notes && <p className="text-xs text-slate-500 mt-1">{inv.notes}</p>}
            </div>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr style={{ background: "#1B75BC" }}>
                <th className="text-left text-xs font-semibold text-white px-4 py-3 rounded-tl-lg">Description</th>
                <th className="text-right text-xs font-semibold text-white px-4 py-3 w-16">Qty</th>
                <th className="text-right text-xs font-semibold text-white px-4 py-3 w-32">Unit Price</th>
                <th className="text-right text-xs font-semibold text-white px-4 py-3 w-36 rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-slate-50"}>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.desc}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 text-right">{item.qty}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 text-right font-mono">{fmtC(item.rate, inv.currency)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right font-mono">{fmtC(item.total, inv.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-mono text-slate-700">{fmtC(subtotal, inv.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="font-mono text-slate-700">{fmtC(tax, inv.currency)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-300 pt-2">
                <span className="text-slate-800">Total</span>
                <span className="text-[#1B75BC] font-mono text-lg">{fmtC(total, inv.currency)}</span>
              </div>
              {data.paidAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Amount Paid</span>
                  <span className="font-mono">−{fmtC(data.paidAmount, inv.currency)}</span>
                </div>
              )}
              {data.dueAmount > 0 && (
                <div className="flex justify-between font-bold text-red-600 border-t border-red-200 pt-2">
                  <span>Balance Due</span>
                  <span className="font-mono">{fmtC(data.dueAmount, inv.currency)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Thank you for choosing SM Travels International</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Receipts ─────────────────────────────────────────────────────────────────
function ReceiptsView() {
  const { data, isLoading, isError, error, refetch } = usePayments({ pageSize: 100 });
  const receipts = (data?.data ?? []).filter(p => p.status === "CONFIRMED" && p.receiptNo);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <ErrorBanner message={(error as Error)?.message || "Failed to load receipts."} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Receipts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Issued payment receipts</p>
        </div>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
              {["Receipt #", "Invoice", "Customer", "Amount", "Method", "Date", ""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No receipts issued yet.</td>
              </tr>
            ) : receipts.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{p.receiptNo}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.invoiceNo ?? "—"}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{p.customerName ?? "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">{fmtC(p.amount, p.currency as Currency)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.method.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{new Date(p.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="px-4 py-3">
                  <button onClick={() => window.print()} className="flex items-center gap-1 text-xs text-[#1B75BC] hover:underline">
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
const COLLECTION_METHODS: Record<string, string> = {
  bank: "BANK_TRANSFER",
  bkash: "BKASH",
  nagad: "NAGAD",
  ssl: "SSLCOMMERZ",
};

function PaymentCollectionView() {
  const { data, isLoading, isError, error, refetch } = useInvoices({ pageSize: 200 });
  const record = useRecordPayment();
  const [selectedInv, setSelectedInv] = useState("");
  const [method, setMethod] = useState("bank");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));

  const pending = (data?.data ?? []).filter(
    inv => inv.dueAmount > 0 && !["DRAFT", "PAID", "CANCELLED"].includes(inv.status),
  );
  const selected = pending.find(i => i.id === selectedInv);

  const onSelectInvoice = (id: string) => {
    setSelectedInv(id);
    const inv = pending.find(i => i.id === id);
    if (inv) setAmount(String(inv.dueAmount));
  };

  const submit = () => {
    if (!selected || !(Number(amount) > 0)) return;
    record.mutate(
      {
        invoiceId: selected.id,
        amount: Number(amount),
        method: COLLECTION_METHODS[method] as never,
        reference: reference.trim() || undefined,
        paidAt: paidAt || undefined,
      },
      {
        onSuccess: () => {
          setSelectedInv("");
          setAmount("");
          setReference("");
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Payment Collection</h2>
      <PendingNpsbPanel/>
      {isError && <ErrorBanner message={(error as Error)?.message || "Failed to load invoices."} onRetry={() => refetch()} />}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Collect Payment</h3>
          {isLoading ? (
            <div className="flex justify-center py-12 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
          ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Invoice / Booking</label>
              <select value={selectedInv} onChange={e => onSelectInvoice(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="">Select invoice…</option>
                {pending.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.invoiceNo ?? i.id.slice(0, 8)} – {i.customerName ?? "Customer"} ({fmtC(i.dueAmount, i.currency as Currency)} due)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "bank", label: "Bank Transfer", icon: Building2, disabled: false },
                  { id: "bkash", label: "bKash", icon: Phone, disabled: true },
                  { id: "nagad", label: "Nagad", icon: Banknote, disabled: true },
                  { id: "ssl", label: "SSLCommerz", icon: Globe, disabled: true },
                ].map(({ id, label, icon: Icon, disabled }) => (
                  <button key={id} type="button" onClick={() => !disabled && setMethod(id)} disabled={disabled}
                    className={cn("flex flex-col items-center gap-1 p-3 border rounded-lg text-xs transition-all",
                      disabled ? "border-slate-100 text-slate-300 cursor-not-allowed opacity-50" :
                      method === id ? "border-[#1B75BC] bg-[#1B75BC]/5 text-[#1B75BC]" : "border-[var(--color-border)] text-slate-600 hover:border-slate-300")}>
                    <Icon size={16} />
                    {label}
                    {disabled && <span className="text-[10px] text-slate-300">Soon</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reference / Transaction ID</label>
              <input placeholder="TXN ID or cheque number…" value={reference} onChange={e => setReference(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
              <textarea rows={2} placeholder="Optional remarks…"
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => { setSelectedInv(""); setAmount(""); setReference(""); }}
                className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
              <button type="button" onClick={submit} disabled={record.isPending || !selected || !(Number(amount) > 0)}
                className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50">
                {record.isPending && <Loader2 size={14} className="animate-spin" />}
                <CheckCircle size={14} /> Record Payment
              </button>
            </div>
          </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
            <h4 className="font-semibold text-slate-800 mb-3">Pending Collections</h4>
            {isLoading ? (
              <div className="flex justify-center py-8 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
            ) : pending.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No outstanding invoices.</p>
            ) : (
            <div className="space-y-3">
              {pending.map(inv => (
                <div key={inv.id} className="pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-mono text-slate-400">{inv.invoiceNo ?? inv.id.slice(0, 8)}</p>
                      <p className="text-sm font-medium text-slate-700">{inv.customerName ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-500 font-mono">{fmtC(inv.dueAmount, inv.currency as Currency)}</p>
                      <InvStatusChip status={st2vm(inv.status)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Installment Plan Builder ─────────────────────────────────────────────────
function planProgress(plan: InstallmentPlanDto) {
  const paid = plan.downAmount + plan.installments.reduce((s, i) => s + i.paidAmount, 0);
  const paidCount = plan.installments.filter(i => i.status === "PAID" || i.paidAmount >= i.amountDue).length;
  const next = plan.installments.find(i => i.status !== "PAID" && i.paidAmount < i.amountDue);
  const isOverdue = plan.installments.some(i => i.status === "OVERDUE");
  return { paid, paidCount, next, isOverdue };
}

function InstallmentBuilderView() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [totalAmount, setTotalAmount] = useState("520000");
  const [installments, setInstallments] = useState(4);
  const [downPct, setDownPct] = useState(20);

  const { data: invData } = useInvoices({ pageSize: 50 });
  const { data: plansData, isLoading: plansLoading } = useInstallmentPlans({ pageSize: 20 });
  const createPlan = useCreateInstallmentPlan();

  const invoiceOptions = invData?.data ?? [];
  const selectedInv = invoiceOptions.find(i => i.id === selectedInvoiceId);

  const total = parseFloat(totalAmount) || 0;
  const down = Math.round(total * (downPct / 100));
  const remaining = total - down;
  const each = installments > 0 ? Math.round(remaining / installments) : 0;

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const buildInstallmentRows = () =>
    Array.from({ length: installments }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + i + 1);
      return {
        label: `Installment ${i + 1}`,
        amountDue: each,
        dueDate: d.toISOString().slice(0, 10),
        monthLabel: `${monthLabels[d.getMonth()]} ${d.getDate()}`,
      };
    });

  const handleCreatePlan = () => {
    if (!selectedInv) return;
    createPlan.mutate({
      invoiceId: selectedInv.id,
      customerId: selectedInv.customerId,
      currency: selectedInv.currency,
      downAmount: down,
      installments: buildInstallmentRows().map(({ label, amountDue, dueDate }) => ({ label, amountDue, dueDate })),
    });
  };

  const activePlans = plansData?.data ?? [];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Installment Plan Builder</h2>
      <div className="grid grid-cols-3 gap-5">
        {/* Builder */}
        <div className="col-span-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Create New Plan</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer / Booking</label>
              <select
                value={selectedInvoiceId}
                onChange={e => {
                  const id = e.target.value;
                  setSelectedInvoiceId(id);
                  const inv = invoiceOptions.find(i => i.id === id);
                  if (inv) setTotalAmount(String(inv.dueAmount || inv.total));
                }}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Select invoice…</option>
                {invoiceOptions.map(i => (
                  <option key={i.id} value={i.id}>{i.invoiceNo ?? i.id} – {i.customerName ?? "Customer"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Total Amount (BDT)</label>
              <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Down Payment: {downPct}%</label>
              <input type="range" min={0} max={60} step={5} value={downPct} onChange={e => setDownPct(+e.target.value)}
                className="w-full accent-[#1B75BC]" />
              <p className="text-xs text-slate-500 mt-1">Down: <span className="font-mono font-medium">{fmtC(down)}</span></p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Installments: {installments}</label>
              <input type="range" min={1} max={12} value={installments} onChange={e => setInstallments(+e.target.value)}
                className="w-full accent-[#1B75BC]" />
              <p className="text-xs text-slate-500 mt-1">Each: <span className="font-mono font-medium">{fmtC(each)}</span></p>
            </div>
          </div>
          {/* Preview schedule */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Schedule Preview</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F15A24] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">0</div>
                <div className="flex-1 flex justify-between text-sm">
                  <span className="text-slate-600">Down Payment (Today)</span>
                  <span className="font-mono font-semibold text-slate-800">{fmtC(down)}</span>
                </div>
              </div>
              {buildInstallmentRows().map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1B75BC] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <div className="flex-1 flex justify-between text-sm">
                    <span className="text-slate-600">Installment {i + 1} – {row.monthLabel}</span>
                    <span className="font-mono font-semibold text-slate-800">{fmtC(row.amountDue)}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-[var(--color-border)] text-sm font-bold">
                <span className="text-slate-800">Total</span>
                <span className="font-mono text-[#1B75BC]">{fmtC(down + each * installments)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleCreatePlan}
              disabled={!selectedInv || createPlan.isPending}
              className="px-5 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] disabled:opacity-50 flex items-center gap-2"
            >
              {createPlan.isPending && <Loader2 size={14} className="animate-spin" />}
              Create Plan
            </button>
          </div>
        </div>
        {/* Active plans tracker */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h4 className="font-semibold text-slate-800 mb-4">Active Plans</h4>
          {plansLoading ? (
            <div className="flex justify-center py-8 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
          ) : activePlans.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No installment plans yet.</p>
          ) : (
            <div className="space-y-4">
              {activePlans.map(plan => {
                const { paid, paidCount, next, isOverdue } = planProgress(plan);
                const pct = plan.total > 0 ? Math.round((paid / plan.total) * 100) : 0;
                return (
                  <div key={plan.id} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-slate-400">{plan.id.slice(0, 8).toUpperCase()}</span>
                      <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full",
                        isOverdue ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700")}>
                        {isOverdue ? "overdue" : plan.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{plan.customerName ?? "Customer"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", isOverdue ? "bg-red-400" : "bg-[#1B75BC]")}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{pct}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>{paidCount}/{plan.installments.length} paid</span>
                      <span>Next: {next ? new Date(next.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Due Management ───────────────────────────────────────────────────────────
function DueManagementView() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useInvoices({ pageSize: 500 });
  const stats = data?.stats ?? { total: 0, totalBilled: 0, totalPaid: 0, totalDue: 0, overdue: 0 };
  const outstanding = (data?.data ?? []).filter(inv => inv.dueAmount > 0 && inv.status !== "CANCELLED" && inv.status !== "DRAFT");

  const agingData = AGING_BUCKETS.map(b => ({
    range: b.range,
    color: b.color,
    amount: 0,
    count: 0,
  }));
  for (const inv of outstanding) {
    const days = daysOverdue(inv.dueDate);
    const bucket = agingBucket(days);
    const idx = AGING_BUCKETS.indexOf(bucket);
    agingData[idx].amount += inv.dueAmount;
    agingData[idx].count += 1;
  }

  const overdue30Plus = outstanding
    .filter(inv => daysOverdue(inv.dueDate) > 30)
    .reduce((s, inv) => s + inv.dueAmount, 0);
  const avgDays = outstanding.length
    ? Math.round(outstanding.reduce((s, inv) => s + daysOverdue(inv.dueDate), 0) / outstanding.length)
    : 0;

  const dueRows = [...outstanding].sort((a, b) => daysOverdue(b.dueDate) - daysOverdue(a.dueDate));

  if (isLoading) {
    return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Due Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Aging analysis and follow-up</p>
        </div>
        <button onClick={() => navigate("/erp/communications")}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
          <Send size={14} /> Send All Reminders
        </button>
      </div>
      {isError && <ErrorBanner message={(error as Error)?.message || "Failed to load invoices."} onRetry={() => refetch()} />}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Outstanding" value={fmtC(stats.totalDue)} icon={Wallet} color="bg-amber-500" />
        <KpiCard label="Overdue (30+ days)" value={fmtC(overdue30Plus)} icon={AlertTriangle} color="bg-red-500" />
        <KpiCard label="Invoices Due" value={String(outstanding.length)} icon={FileText} color="bg-[#1B75BC]" />
        <KpiCard label="Avg. Days Outstanding" value={outstanding.length ? `${avgDays} days` : "—"} icon={Clock} color="bg-slate-500" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Aging Analysis</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agingData} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmtC(v), "Amount"]} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {agingData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h4 className="font-semibold text-slate-800 mb-4">Aging Summary</h4>
          <div className="space-y-3">
            {agingData.map(d => (
              <div key={d.range} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-sm text-slate-600">{d.range}</span>
                  <span className="text-xs text-slate-400">({d.count})</span>
                </div>
                <span className="text-sm font-semibold text-slate-800 font-mono">{fmtC(d.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] font-bold">
              <span className="text-sm text-slate-800">Total</span>
              <span className="text-sm text-slate-800 font-mono">{fmtC(stats.totalDue)}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Overdue invoices */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Overdue & Pending Invoices</h3>
        </div>
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
              {["Invoice", "Customer", "Due Date", "Outstanding", "Days Overdue", "Status", "Action"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dueRows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No outstanding invoices.</td></tr>
            ) : dueRows.map(inv => {
              const days = daysOverdue(inv.dueDate);
              return (
                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{inv.invoiceNo ?? inv.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{inv.customerName ?? "—"}</td>
                  <td className={cn("px-4 py-3 text-sm", days > 0 ? "text-red-600 font-medium" : "text-slate-500")}>{inv.dueDate ?? "—"}</td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-red-500">{fmtC(inv.dueAmount, inv.currency as Currency)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{days > 0 ? `${days} days` : "—"}</td>
                  <td className="px-4 py-3"><InvStatusChip status={st2vm(inv.status)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => navigate("/erp/communications")} className="text-xs text-[#1B75BC] hover:underline">Remind</button>
                      <span className="text-slate-300">·</span>
                      <button onClick={() => navigate("/erp/communications")} className="text-xs text-emerald-600 hover:underline">Collect</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payment History ──────────────────────────────────────────────────────────
function PaymentHistoryView() {
  const payQ = usePayments({ pageSize: 100 });
  const rows = payQ.data?.data ?? [];
  const stats = payQ.data?.stats;
  const confirmed = rows.filter((p) => p.status === "CONFIRMED" && !p.isReversed);
  const failed = rows.filter((p) => p.status === "FAILED");
  const totalReceived = stats?.totalIn ?? confirmed.reduce((s, p) => s + p.amount, 0);

  if (payQ.isLoading) {
    return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin"/></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Payment History</h2>
          <p className="text-sm text-slate-500 mt-0.5">All payment transactions</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Received" value={fmtC(totalReceived)} icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard label="Transactions" value={String(rows.length)} icon={Receipt} color="bg-blue-500" />
        <KpiCard label="Failed" value={String(failed.length)} icon={XCircle} color="bg-red-500" />
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
              {["Txn ID", "Invoice", "Customer", "Amount", "Method", "Date", "Status"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-sm text-slate-400 text-center">No payments recorded yet.</td></tr>
            ) : rows.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{p.paymentNo ?? p.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.invoiceNo ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{p.customerName ?? "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">{fmtC(p.amount)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.method.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{new Date(p.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                    p.status === "CONFIRMED" && !p.isReversed ? PAY_STATUS_CFG.confirmed :
                    p.status === "FAILED" ? PAY_STATUS_CFG.failed :
                    p.isReversed ? PAY_STATUS_CFG.refunded : PAY_STATUS_CFG.pending)}>
                    {p.isReversed ? "reversed" : p.status.toLowerCase()}
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
      <EmptyState
        variant="coming-soon"
        title="Online payments"
        desc="Payments are recorded manually in the Payments tab. Online gateway collection is planned for a later release."
      />
    </div>
  );
}

// ─── Refunds ──────────────────────────────────────────────────────────────────
function RefundsView() {
  const refundQ = useRefunds({ pageSize: 100 });
  const rows = refundQ.data?.data ?? [];
  const totalRefunded = rows.filter((r) => r.status === "PROCESSED" || r.status === "APPROVED").reduce((s, r) => s + r.amount, 0);
  const pending = rows.filter((r) => r.status === "PENDING").length;
  const processed = rows.filter((r) => r.status === "PROCESSED").length;

  if (refundQ.isLoading) {
    return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin"/></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Refunds</h2>
          <p className="text-sm text-slate-500 mt-0.5">Process and track customer refunds</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Refunded" value={fmtC(totalRefunded)} icon={RotateCcw} color="bg-red-500" />
        <KpiCard label="Pending Approval" value={String(pending)} icon={Clock} color="bg-amber-500" />
        <KpiCard label="Processed" value={String(processed)} icon={CheckCircle} color="bg-emerald-500" />
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
              {["Ref ID", "Invoice", "Customer", "Reason", "Amount", "Method", "Date", "Status"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-sm text-slate-400 text-center">No refunds recorded yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{r.refundNo ?? r.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.invoiceNo ?? "—"}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{r.customerName ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.reason ?? "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">{fmtC(r.amount)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.method?.replace(/_/g, " ") ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                    r.status === "PROCESSED" ? "bg-emerald-50 text-emerald-700" :
                    r.status === "APPROVED" ? "bg-blue-50 text-blue-700" :
                    r.status === "REJECTED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700")}>
                    {r.status.toLowerCase()}
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

// ─── Vouchers ─────────────────────────────────────────────────────────────────
function VouchersView() {
  return (
    <div className="space-y-5">
      <EmptyState
        variant="no-data"
        title="No vouchers yet"
        desc="Booking vouchers will appear here once issued."
      />
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────
function CreateInvoiceDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const create = useCreateInvoice();
  const { data: customers } = useCustomers({ pageSize: 200 });
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState([{ description: "", qty: 1, unitPrice: 0 }]);
  const setItem = (i: number, patch: Partial<{ description: string; qty: number; unitPrice: number }>) => setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const total = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
  const submit = async () => {
    try {
      const inv = await create.mutateAsync({ customerId, dueDate: dueDate || undefined, items: items.filter(it => it.description.trim()).map(it => ({ description: it.description, qty: Number(it.qty) || 1, unitPrice: Number(it.unitPrice) || 0 })) });
      onCreated(inv.id);
    } catch { /* toast */ }
  };
  return (
    <Drawer open onClose={onClose} title="New Invoice" subtitle="Draft — a number is allocated on issue" width="max-w-[620px]"
      footer={<><button onClick={onClose} className="h-9 px-4 border border-[var(--color-border)] rounded-[8px] text-[12px] font-medium text-[#374151]">Cancel</button><PrimaryBtn onClick={submit} disabled={create.isPending || !customerId || total <= 0}>{create.isPending && <Loader2 size={13} className="animate-spin" />} Create Draft</PrimaryBtn></>}>
      <div className="flex flex-col gap-4">
        <Field label="Customer" required>
          <select className={selectCls} value={customerId} onChange={e => setCustomerId(e.target.value)}>
            <option value="">Select customer…</option>
            {(customers?.data ?? []).map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
          </select>
        </Field>
        <Field label="Due Date"><input type="date" className={inputCls} value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Line Items</div>
        {items.map((it, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label="Description"><input className={inputCls} value={it.description} onChange={e => setItem(i, { description: e.target.value })} /></Field>
            <div className="w-16"><Field label="Qty"><input type="number" className={inputCls} value={it.qty} onChange={e => setItem(i, { qty: Number(e.target.value) })} /></Field></div>
            <div className="w-28"><Field label="Unit Price"><input type="number" className={inputCls} value={it.unitPrice || ""} onChange={e => setItem(i, { unitPrice: Number(e.target.value) })} /></Field></div>
            {items.length > 1 && <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="h-[42px] px-2 text-red-400">✕</button>}
          </div>
        ))}
        <button onClick={() => setItems([...items, { description: "", qty: 1, unitPrice: 0 }])} className="text-[12px] text-[#1B75BC] font-semibold text-left">+ Add line</button>
        <div className="flex justify-between text-sm font-bold border-t border-slate-100 pt-3"><span>Total</span><span className="font-mono">{fmtC(total)}</span></div>
      </div>
    </Drawer>
  );
}

export function InvoicesModule() {
  const [view, setView] = useState<InvoicesView>("list");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);

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
      case "list": return <InvoiceListView onView={handleViewInvoice} onNew={() => setCreateOpen(true)} />;
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
      <div className="w-56 flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
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
                      ? "bg-[#1B75BC]/8 text-[#1B75BC] font-medium"
                      : "text-slate-600 hover:bg-slate-50")}>
                  <item.icon size={15} className={view === item.id ? "text-[#1B75BC]" : "text-slate-400"} />
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
      {createOpen && <CreateInvoiceDrawer onClose={() => setCreateOpen(false)} onCreated={(id) => { setCreateOpen(false); handleViewInvoice(id); }} />}
    </div>
  );
}
