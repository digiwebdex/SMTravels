import React, { useState } from "react";
import {
  LayoutDashboard, TrendingUp, Building2, BookOpen, FileText,
  BarChart3, Shield, ClipboardList, User, LogOut,
  ChevronRight, ChevronDown, ChevronUp, Search, Plus, Eye,
  Check, X, Clock, AlertCircle, CheckCircle, Download, Filter,
  ArrowDownLeft, ArrowUpRight, TrendingDown, Edit2, Copy,
  Calendar, Banknote, CreditCard, Wallet, CircleDollarSign,
  Hash, Layers, RefreshCw, Info, FileCheck, AlertTriangle,
  PieChart, Activity, Zap, MoreHorizontal,
} from "lucide-react";
import { cn } from "../lib/utils";
import { MobileDrawer, MobileBottomNav, ScrollTable } from "../lib/responsive";
import { EmptyState } from "../lib/ds";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAccountantMe, useAccountantDashboard } from "../hooks/portals";
import { useIncome, useExpenses, useInvoices, usePayments, useJournal, useBankAccounts } from "../hooks/finance";
import { useOverview, usePnlReport } from "../hooks/reports";
import { useAuditLogs } from "../hooks/ops";
const iso2date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");

const fmtBDT2 = (n: number) => "৳ " + Number(n || 0).toLocaleString("en-BD");
function PLoad({ q, children }: { q: { isLoading: boolean; isError: boolean; error?: unknown }; children: React.ReactNode }) {
  const { t } = useTranslation("portalAccountant");
  if (q.isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>;
  if (q.isError) return <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 text-center">{(q.error as Error)?.message || t("portalCommon:empty.failed")}</div>;
  return <>{children}</>;
}

type AccView =
  | "dashboard" | "income-expense" | "bank-cash" | "journal"
  | "invoices-payments" | "reports" | "tax" | "audit" | "profile";

const NAV: { id: AccView; icon: React.ElementType; label: string; badge?: number }[] = [
  { id: "dashboard",        icon: LayoutDashboard, label: "portalAccountant:nav.financialDashboard" },
  { id: "income-expense",   icon: TrendingUp,      label: "portalAccountant:nav.incomeExpense"   },
  { id: "bank-cash",        icon: Building2,       label: "portalAccountant:nav.bankCash"        },
  { id: "journal",          icon: BookOpen,        label: "portalAccountant:nav.journalEntries"  },
  { id: "invoices-payments",icon: FileText,        label: "portalAccountant:nav.invoicesPayments"},
  { id: "reports",          icon: BarChart3,       label: "portalAccountant:nav.financialReports"},
  { id: "tax",              icon: Shield,          label: "portalAccountant:nav.taxReports"      },
  { id: "audit",            icon: ClipboardList,   label: "portalAccountant:nav.auditLogs",  badge: 3 },
  { id: "profile",          icon: User,            label: "portalCommon:nav.profile"             },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtBDT  = (n: number) => "৳ " + n.toLocaleString("en-BD");
const fmtShort = (n: number) => n >= 100000 ? "৳" + (n/100000).toFixed(n%100000===0?0:1)+"L" : "৳"+n.toLocaleString();

const sevNorm = (s: string) => s.toLowerCase();
const fmtAuditTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const SEV_CFG: Record<string, { dot:string; row:string; badge:string }> = {
  info:     { dot:"bg-slate-400",  row:"",              badge:"bg-slate-100 text-slate-600 border-slate-200"        },
  warning:  { dot:"bg-amber-400",  row:"bg-amber-50/40",badge:"bg-amber-50 text-amber-700 border-amber-200"         },
  critical: { dot:"bg-red-500",    row:"bg-red-50/50",  badge:"bg-red-50 text-red-600 border-red-200"              },
};

const INV_STATUS_CFG: Record<string, string> = {
  paid:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  unpaid:  "bg-red-50 text-red-600 border-red-200",
};

function Chip({ label, cls }: { label: string; cls: string }) {
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", cls)}>{label}</span>;
}

function AmountBig({ val, color }: { val: number; color?: string }) {
  return (
    <span className={cn("font-black", color ?? "text-slate-800")}
      style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(val)}</span>
  );
}

// ─── FINANCIAL DASHBOARD ──────────────────────────────────────────────────────
function FinDashboard({ onGo }: { onGo: (v: AccView) => void }) {
  const { t } = useTranslation("portalAccountant");
  const q = useAccountantDashboard();
  const d = q.data;
  return (
    <PLoad q={q}>
      {d && (
      <div className="space-y-5" data-portal="dashboard">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t("dashboard.eyebrow")}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5" data-portal-name>{t("dashboard.title")}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{d.accountantName} · {d.branchName ?? "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:t("dashboard.kpi.revenue"), val:fmtBDT2(d.revenue), color:"text-emerald-600", bg:"bg-emerald-500", Icon:TrendingUp },
            { label:t("dashboard.kpi.expenses"), val:fmtBDT2(d.expense), color:"text-red-500", bg:"bg-red-500", Icon:TrendingDown },
            { label:t("dashboard.kpi.netProfit"), val:fmtBDT2(d.netProfit), color:"text-[#1B75BC]", bg:"bg-[#1B75BC]", Icon:CircleDollarSign },
            { label:t("dashboard.kpi.postedJournals"), val:String(d.postedJournalCount), color:"text-purple-600", bg:"bg-purple-500", Icon:Building2 },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white mb-3", k.bg)}><k.Icon size={16} /></div>
              <p className={cn("text-xl font-black", k.color)} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{k.val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="font-bold text-slate-800 mb-4">{t("dashboard.invoicesYtd")}</p>
          <div className="grid grid-cols-3 gap-3">
            {[[t("dashboard.billed"),d.invoices.billed],[t("dashboard.collected"),d.invoices.collected],[t("dashboard.outstanding"),d.invoices.outstanding]].map(([l,v])=>(
              <div key={l} className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-sm font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(v as number)}</p><p className="text-xs text-slate-400 mt-0.5">{l}</p></div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[["income-expense",t("nav.incomeExpense")],["journal",t("labels.journal")],["invoices-payments",t("portalCommon:nav.invoices")]].map(([v,label])=>(
            <button key={v} onClick={()=>onGo(v as AccView)} className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#1B75BC]/30 text-sm font-semibold text-slate-700 text-left">{label} <span className="text-slate-300">→</span></button>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center">{t("dashboard.ledgerNote")}</p>
      </div>
      )}
    </PLoad>
  );
}

// ─── INCOME & EXPENSE ─────────────────────────────────────────────────────────
function IncomeExpenseView() {
  const { t } = useTranslation("portalAccountant");
  const [tab, setTab] = useState("income");
  const incQ = useIncome({ range: "ytd", pageSize: 100 });
  const expQ = useExpenses({ range: "ytd", pageSize: 100 });
  const q = tab==="income" ? incQ : expQ;
  const rows = q.data?.data ?? [];
  return (
    <div className="space-y-5" data-portal="income-expense">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.incomeExpense")}</h2>
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
        {["income","expense"].map(tb=>(
          <button key={tb} onClick={()=>setTab(tb)} className={cn("px-4 py-2 text-sm font-semibold rounded-xl capitalize whitespace-nowrap", tab===tb?"bg-white text-slate-800 shadow-sm":"text-slate-500")}>{t(`tabs.${tb}`)}</button>
        ))}
      </div>
      <PLoad q={q}>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1 capitalize">{t("incomeExpense.total", { type: t(`tabs.${tab}`) })}</p>
          {/* Sum baseAmount from the rows — the ledger endpoint's stats.totalAmount sums raw
              `amount` across currencies (a mixed-currency bug); baseAmount is the correct aggregate. */}
          <p className={cn("text-2xl font-black", tab==="income"?"text-emerald-600":"text-red-500")} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(rows.reduce((s,r)=>s+r.baseAmount,0))}</p>
        </div>
        <div className="space-y-2.5">
          {rows.length===0 && <p className="text-sm text-slate-400 text-center py-4">{t("portalCommon:empty.nothing")}</p>}
          {rows.map(r=>(
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div><p className="text-sm font-semibold text-slate-800">{r.category}</p><p className="text-xs text-slate-400 mt-0.5">{r.party || r.description || "—"} · {r.date}</p></div>
              <div className="text-right"><p className={cn("font-black", tab==="income"?"text-emerald-600":"text-red-500")} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(r.baseAmount)}</p><span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-slate-100 text-slate-600">{t(`portalCommon:status.${r.status.toLowerCase()}`, { defaultValue: r.status.toLowerCase() })}</span></div>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── BANK & CASH ──────────────────────────────────────────────────────────────
function BankCashView() {
  const { t } = useTranslation("portalAccountant");
  const { data: banks, isLoading, isError } = useBankAccounts();
  const accounts = (banks ?? []).filter(a => a.active);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("nav.bankCash")}</h2>
        <button className="flex items-center gap-1.5 text-sm text-[#1B75BC] font-semibold border border-[#1B75BC]/30 px-3 py-1.5 rounded-xl hover:bg-[#1B75BC]/5 whitespace-nowrap">
          <Download size={14}/> {t("portalCommon:nav.statements")}
        </button>
      </div>

      {isLoading && <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin"/></div>}
      {isError && <p className="text-sm text-red-500 text-center py-8">Failed to load bank accounts.</p>}

      {!isLoading && !isError && accounts.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">{t("portalCommon:empty.nothing")}</p>
      )}

      {accounts.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {accounts.map((a, i) => (
              <div key={a.id} className={cn("rounded-2xl p-5", i === 0 ? "bg-gradient-to-br from-[#1B75BC] to-[#0a2a52] text-white" : "bg-white border border-slate-200")}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={cn("text-xs font-medium capitalize", i === 0 ? "text-white/70" : "text-slate-400")}>{a.type.toLowerCase().replace("_", " ")}</p>
                    <p className={cn("font-bold mt-0.5", i === 0 ? "text-white" : "text-slate-800")}>{a.bankName ?? a.name}</p>
                  </div>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", i === 0 ? "bg-white/15" : "bg-[#1B75BC]/8")}>
                    <Building2 size={14} className={i === 0 ? "text-white" : "text-[#1B75BC]"} />
                  </div>
                </div>
                <p className={cn("text-2xl font-black", i === 0 ? "text-white" : "text-slate-800")} style={{ fontFamily:"'JetBrains Mono',monospace" }}>
                  {fmtShort(Number(a.balance))}
                </p>
                <p className={cn("text-xs mt-1 font-mono", i === 0 ? "text-white/50" : "text-slate-400")}>{a.accountNumber ?? "—"}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">{t("bankCash.recentTransactions")}</p>
            <p className="text-xs text-slate-400 mt-1">Transaction history is derived from posted journal entries in the ERP.</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── JOURNAL ENTRIES ──────────────────────────────────────────────────────────
function JournalView() {
  const { t } = useTranslation("portalAccountant");
  const q = useJournal({ range: "ytd", pageSize: 100 });
  const rows = q.data?.data ?? [];
  return (
    <div className="space-y-5" data-portal="journal">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.journalEntries")}</h2>
      <PLoad q={q}>
        <div className="grid grid-cols-3 gap-3">
          {[[t("journal.entries"), q.data?.stats.total ?? 0],[t("journal.posted"), q.data?.stats.posted ?? 0],[t("journal.drafts"), q.data?.stats.drafts ?? 0]].map(([l,v])=>(
            <div key={l} className="bg-white border border-slate-200 rounded-2xl p-3 text-center"><p className="text-lg font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{v}</p><p className="text-xs text-slate-400 mt-0.5">{l}</p></div>
          ))}
        </div>
        <div className="space-y-2.5">
          {rows.length===0 && <p className="text-sm text-slate-400 text-center py-4">{t("portalCommon:empty.nothing")}</p>}
          {rows.map(j=>(
            <div key={j.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div><p className="text-sm font-semibold text-slate-800 font-mono">{j.ref}</p><p className="text-xs text-slate-400 mt-0.5">{j.description || "—"} · {j.date}</p></div>
              <div className="text-right"><p className="font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(j.totalDebit)}</p><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", j.isReversed?"bg-red-50 text-red-500":j.status==="POSTED"?"bg-emerald-50 text-emerald-600":"bg-slate-100 text-slate-500")}>{j.isReversed ? t("journal.reversed") : t(`journal.status.${j.status.toLowerCase()}`, { defaultValue: j.status.toLowerCase() })}</span></div>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── INVOICES & PAYMENTS ──────────────────────────────────────────────────────
function InvPayView() {
  const { t } = useTranslation("portalAccountant");
  const [tab, setTab] = useState("invoices");
  const invQ = useInvoices({ range: "ytd", pageSize: 100 });
  const payQ = usePayments({ range: "ytd", pageSize: 100 });
  const invoices = invQ.data?.data ?? [];
  const payments = payQ.data?.data ?? [];
  return (
    <div className="space-y-5" data-portal="invpay">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.invoicesPayments")}</h2>
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
        {["invoices","payments"].map(tb=>(
          <button key={tb} onClick={()=>setTab(tb)} className={cn("px-4 py-2 text-sm font-semibold rounded-xl capitalize whitespace-nowrap", tab===tb?"bg-white text-slate-800 shadow-sm":"text-slate-500")}>{t(`tabs.${tb}`)}</button>
        ))}
      </div>
      {tab==="invoices" ? (
        <PLoad q={invQ}>
          <div className="grid grid-cols-3 gap-3">
            {[[t("dashboard.billed"), invQ.data?.stats.totalBilled ?? 0],[t("dashboard.collected"), invQ.data?.stats.totalPaid ?? 0],[t("dashboard.outstanding"), invQ.data?.stats.totalDue ?? 0]].map(([l,v])=>(
              <div key={l} className="bg-white border border-slate-200 rounded-2xl p-3 text-center"><p className="text-base font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(v as number)}</p><p className="text-xs text-slate-400 mt-0.5">{l}</p></div>
            ))}
          </div>
          <div className="space-y-2.5">
            {invoices.length===0 && <p className="text-sm text-slate-400 text-center py-4">{t("portalCommon:empty.nothing")}</p>}
            {invoices.map(i=>(
              <div key={i.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                <div><p className="text-sm font-semibold text-slate-800 font-mono">{i.invoiceNo || t("invPay.draft")}</p><p className="text-xs text-slate-400 mt-0.5">{i.customerName || "—"} · {i.issueDate || "—"}</p></div>
                <div className="text-right"><p className="font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(i.total)}</p><span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-slate-100 text-slate-600">{t(`portalCommon:status.${i.status.toLowerCase()}`, { defaultValue: i.status.toLowerCase() })}</span></div>
              </div>
            ))}
          </div>
        </PLoad>
      ) : (
        <PLoad q={payQ}>
          <div className="space-y-2.5">
            {payments.length===0 && <p className="text-sm text-slate-400 text-center py-4">{t("portalCommon:empty.nothing")}</p>}
            {payments.map(p=>(
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                <div><p className="text-sm font-semibold text-slate-800 font-mono">{p.receiptNo || p.paymentNo}</p><p className="text-xs text-slate-400 mt-0.5">{p.customerName || p.invoiceNo || "—"} · {p.method.replace(/_/g," ")}</p></div>
                <p className={cn("font-black", p.isReversed?"text-slate-400 line-through":p.direction==="IN"?"text-emerald-600":"text-red-500")} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(p.amount)}</p>
              </div>
            ))}
          </div>
        </PLoad>
      )}
    </div>
  );
}

// ─── FINANCIAL REPORTS ────────────────────────────────────────────────────────
function FinReportsView() {
  const { t } = useTranslation("portalAccountant");
  const filters = { range: "ytd" as const };
  const overviewQ = useOverview(filters);
  const pnlQ = usePnlReport(filters);
  const overview = overviewQ.data;
  const pnl = pnlQ.data;
  const loading = overviewQ.isLoading || pnlQ.isLoading;
  const failed = overviewQ.isError || pnlQ.isError;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("nav.financialReports")}</h2>
      </div>

      {loading && <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin"/></div>}
      {failed && !loading && <p className="text-sm text-red-500 text-center py-8">{t("portalCommon:empty.failed")}</p>}

      {overview && pnl && !loading && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("reports.grossRevenue"), val: fmtShort(overview.kpis.revenue), color: "text-emerald-600" },
              { label: t("reports.totalExpenses"), val: fmtShort(overview.kpis.expenses), color: "text-red-500" },
              { label: t("reports.netProfit"), val: fmtShort(overview.kpis.netProfit), color: "text-[#1B75BC]" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className={cn("text-xl font-black", s.color)} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{s.val}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="font-semibold text-slate-800 text-sm">P&amp;L — {pnl.applied.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">Net profit {fmtBDT(pnl.netProfit)} ({pnl.netMargin.toFixed(1)}% margin)</p>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Category", "Amount"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td colSpan={2} className="px-5 py-2 text-xs font-semibold text-emerald-600 uppercase">Revenue</td></tr>
                {pnl.revenueLines.map((line) => (
                  <tr key={line.code} className="hover:bg-slate-50">
                    <td className="px-5 py-2 text-sm text-slate-700">{line.name}</td>
                    <td className="px-5 py-2 text-sm font-mono font-semibold text-slate-800">{fmtBDT(line.amount)}</td>
                  </tr>
                ))}
                <tr><td colSpan={2} className="px-5 py-2 text-xs font-semibold text-red-500 uppercase">Expenses</td></tr>
                {pnl.expenseLines.map((line) => (
                  <tr key={line.code} className="hover:bg-slate-50">
                    <td className="px-5 py-2 text-sm text-slate-700">{line.name}</td>
                    <td className="px-5 py-2 text-sm font-mono font-semibold text-slate-800">{fmtBDT(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAX REPORTS ─────────────────────────────────────────────────────────────
function TaxView() {
  const { t } = useTranslation("portalAccountant");
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">{t("nav.taxReports")}</h2>
      <div className="bg-white rounded-2xl border border-slate-200">
        <EmptyState variant="coming-soon" title="Tax reports" desc="VAT and income-tax reporting is planned for a later release." />
      </div>
    </div>
  );
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
function AuditView() {
  const { t } = useTranslation("portalAccountant");
  const [filter, setFilter] = useState("all");
  const [textFilter, setTextFilter] = useState("");
  const auditQ = useAuditLogs();
  const logs = auditQ.data ?? [];
  const shown = logs.filter((l) => {
    if (filter !== "all" && sevNorm(l.severity) !== filter) return false;
    if (!textFilter.trim()) return true;
    const q = textFilter.toLowerCase();
    return [l.event, l.resource, l.userName, l.id].some((v) => (v ?? "").toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t("nav.auditLogs")}</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => auditQ.refetch()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <RefreshCw size={14} className={auditQ.isFetching ? "animate-spin" : ""} />
          </button>
          <button className="flex items-center gap-1.5 text-sm text-[#1B75BC] font-semibold border border-[#1B75BC]/30 px-3 py-1.5 rounded-xl hover:bg-[#1B75BC]/5 whitespace-nowrap">
            <Download size={14}/> {t("audit.export")}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            placeholder={t("portalCommon:actions.search", { defaultValue: "Search…" })}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {["all","info","warning","critical"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap flex-shrink-0",
                filter===f ? "bg-[#1B75BC] text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-[#1B75BC]/30")}>
              {t(`audit.filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {auditQ.isLoading ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : auditQ.isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 text-center">{(auditQ.error as Error)?.message || t("portalCommon:empty.failed")}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["portalAccountant:audit.cols.logId","portalAccountant:audit.cols.action","portalAccountant:audit.cols.entity","portalAccountant:audit.cols.user","portalAccountant:audit.cols.time","portalAccountant:audit.cols.severity"].map((h,hi) => (
                  <th key={hi} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-sm text-slate-400 text-center">{t("portalCommon:empty.nothing")}</td></tr>
              )}
              {shown.map(log => {
                const sev = sevNorm(log.severity);
                const s = SEV_CFG[sev] ?? SEV_CFG.info;
                return (
                  <tr key={log.id} className={cn("hover:bg-slate-50 transition-colors", s.row)}>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{log.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{log.event}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{log.resource ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{log.userName ?? t("audit.unknownUser", { defaultValue: "Unknown" })}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtAuditTime(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border", s.badge)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                        {t(`audit.severity.${sev}`, { defaultValue: sev })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function AccProfile() {
  const { t } = useTranslation("portalAccountant");
  const q = useAccountantMe();
  const me = q.data;
  const initials = (me?.name ?? "").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="space-y-5" data-portal="profile">
      <h2 className="text-xl font-bold text-slate-800">{t("profile.title")}</h2>
      <PLoad q={q}>
        {me && (<>
          <div className="bg-gradient-to-br from-[#1B75BC] to-[#1a4a8a] rounded-2xl p-5 text-white flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-black">{initials}</div>
            <div>
              <p className="text-xl font-bold" data-portal-name>{me.name}</p>
              <p className="text-white/70 text-sm mt-0.5">{me.department ?? t("roles.finance")} · {me.branchName ?? "—"}</p>
              <p className="text-white/50 text-xs mt-1 font-mono">{me.employeeId ?? ""}</p>
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

// ─── Sidebar inner ────────────────────────────────────────────────────────────
function AccSidebar({ view, go, onClose }: { view: AccView; go: (v: AccView) => void; onClose?: () => void }) {
  const { t } = useTranslation("portalAccountant");
  const { data: me } = useAccountantMe();
  const aName = me?.name ?? "Accountant";
  const aInit = aName.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
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
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{aInit}</div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate" data-portal-name>{aName}</p>
            <p className="text-white/50 text-xs truncate">{me?.department ?? t("roles.finance")}</p>
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
            <span className="flex-1 text-left text-xs">{t(item.label)}</span>
            {item.badge ? (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{item.badge}</span>
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

// Mobile bottom nav
const ACC_BOTTOM_NAV = [
  { id: "dashboard"        as AccView, icon: LayoutDashboard, label: "portalAccountant:bottomNav.home"    },
  { id: "income-expense"   as AccView, icon: TrendingUp,      label: "portalAccountant:bottomNav.pl"     },
  { id: "bank-cash"        as AccView, icon: Building2,       label: "portalAccountant:bottomNav.bank"    },
  { id: "invoices-payments"as AccView, icon: FileText,        label: "portalCommon:nav.invoices"},
  { id: "audit"            as AccView, icon: ClipboardList,   label: "portalAccountant:bottomNav.audit", badge: 3 },
];

// ─── SHELL ────────────────────────────────────────────────────────────────────
export function AccountantPortal() {
  const { t } = useTranslation("portalAccountant");
  const [view, setView] = useState<AccView>("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const go = (v: AccView) => setView(v);

  const render = () => {
    switch (view) {
      case "dashboard":         return <FinDashboard onGo={go} />;
      case "income-expense":    return <IncomeExpenseView />;
      case "bank-cash":         return <BankCashView />;
      case "journal":           return <JournalView />;
      case "invoices-payments": return <InvPayView />;
      case "reports":           return <FinReportsView />;
      case "tax":               return <TaxView />;
      case "audit":             return <AuditView />;
      case "profile":           return <AccProfile />;
    }
  };

  const currentLabel = t(NAV.find(n => n.id === view)?.label ?? "");

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* ── Desktop ── */}
      <div className="hidden md:flex h-screen overflow-hidden">
        <AccSidebar view={view} go={go} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0 h-14">
            <p className="text-sm font-semibold text-slate-600">{currentLabel}</p>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-400">
                {t("fy")}: <span className="font-semibold text-slate-700">2024</span>
              </div>
              <button onClick={() => go("profile")}
                className="w-7 h-7 rounded-full bg-[#1B75BC]/15 flex items-center justify-center text-[#1B75BC] text-xs font-bold">
                FA
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">{render()}</div>
          </main>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="md:hidden flex flex-col min-h-screen">
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="w-56">
          <AccSidebar view={view} go={go} onClose={() => setDrawerOpen(false)} />
        </MobileDrawer>

        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ minWidth: 44, minHeight: 44 }}
              className="flex items-center justify-center"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1B75BC] flex items-center justify-center text-white text-xs font-black">SM</div>
            </button>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[160px]">{currentLabel}</p>
              <p className="text-xs text-slate-400">Ferdous Ahmed · Accountant</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-mono">{t("fy")} 2024</span>
            <button onClick={() => go("profile")}
              className="w-8 h-8 rounded-full bg-[#1B75BC]/15 flex items-center justify-center text-[#1B75BC] text-xs font-bold ml-1">
              FA
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          {render()}
        </main>

        <MobileBottomNav
          items={ACC_BOTTOM_NAV.map(i => ({ ...i, label: t(i.label) }))}
          active={view}
          onChange={go}
        />
      </div>
    </div>
  );
}

export default AccountantPortal;
