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
import { Loader2 } from "lucide-react";
import { useAccountantMe, useAccountantDashboard } from "../hooks/portals";
import { useIncome, useExpenses, useInvoices, usePayments, useJournal } from "../hooks/finance";
import { SampleBadge } from "./SampleBadge";
const iso2date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");

const fmtBDT2 = (n: number) => "৳ " + Number(n || 0).toLocaleString("en-BD");
function PLoad({ q, children }: { q: { isLoading: boolean; isError: boolean; error?: unknown }; children: React.ReactNode }) {
  if (q.isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>;
  if (q.isError) return <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 text-center">{(q.error as Error)?.message || "Failed to load."}</div>;
  return <>{children}</>;
}

type AccView =
  | "dashboard" | "income-expense" | "bank-cash" | "journal"
  | "invoices-payments" | "reports" | "tax" | "audit" | "profile";

const NAV: { id: AccView; icon: React.ElementType; label: string; badge?: number }[] = [
  { id: "dashboard",        icon: LayoutDashboard, label: "Financial Dashboard" },
  { id: "income-expense",   icon: TrendingUp,      label: "Income & Expense"   },
  { id: "bank-cash",        icon: Building2,       label: "Bank & Cash"        },
  { id: "journal",          icon: BookOpen,        label: "Journal Entries"    },
  { id: "invoices-payments",icon: FileText,        label: "Invoices & Payments"},
  { id: "reports",          icon: BarChart3,       label: "Financial Reports"  },
  { id: "tax",              icon: Shield,          label: "Tax Reports"        },
  { id: "audit",            icon: ClipboardList,   label: "Audit Logs",  badge: 3 },
  { id: "profile",          icon: User,            label: "Profile"            },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];
const INCOME_DATA  = [820000,940000,1050000,1240000,1080000,1540000,1380000];
const EXPENSE_DATA = [540000,620000,690000,780000,690000,920000,850000];

const INCOME_ROWS = [
  { category:"Package Sales",        amount:980000,  pct:71, color:"#0E6BB8" },
  { category:"Visa Services",        amount:145000,  pct:10, color:"#0E7C66" },
  { category:"Air Ticket Commission",amount:138000,  pct:10, color:"#E8471F" },
  { category:"Hotel Bookings",       amount:82000,   pct:6,  color:"#7C3AED" },
  { category:"Tour Packages",        amount:35000,   pct:3,  color:"#2563EB" },
];

const EXPENSE_ROWS = [
  { category:"Supplier Payments",  amount:590000, pct:69, color:"#EF4444" },
  { category:"Salaries",           amount:120000, pct:14, color:"#F97316" },
  { category:"Office Rent",        amount:45000,  pct:5,  color:"#EAB308" },
  { category:"Marketing",          amount:42000,  pct:5,  color:"#8B5CF6" },
  { category:"Utilities & Others", amount:53000,  pct:7,  color:"#94A3B8" },
];

const BANK_ACCOUNTS = [
  { id:"ACC-01", bank:"Dutch-Bangla Bank",  type:"Current",  acct:"XXXXXXXXX001", balance:2840000, currency:"BDT" },
  { id:"ACC-02", bank:"Islami Bank BD",     type:"Current",  acct:"XXXXXXXXX002", balance:1560000, currency:"BDT" },
  { id:"ACC-03", bank:"BRAC Bank",          type:"Savings",  acct:"XXXXXXXXX003", balance:3200000, currency:"BDT" },
  { id:"ACC-04", bank:"Cash in Hand",       type:"Petty Cash",acct:"—",           balance:45000,   currency:"BDT" },
];

const JOURNAL_ENTRIES = [
  { id:"JNL-0741", date:"Jul 15", desc:"Commission income — July batch",         debit:"Commission Receivable", credit:"Income — Commission", amount:55000,  ref:"BK-0892",  status:"posted"  },
  { id:"JNL-0740", date:"Jul 14", desc:"Supplier payment — Dar Al-Tawhid Hotel", debit:"Supplier Payable",      credit:"Bank — DBBL",          amount:2940000,ref:"INV-SUP-0241",status:"posted"  },
  { id:"JNL-0739", date:"Jul 12", desc:"Salary disbursement — July 2024",        debit:"Salary Expense",         credit:"Bank — IBBL",          amount:120000, ref:"HR-JUL-24", status:"posted"  },
  { id:"JNL-0738", date:"Jul 10", desc:"Client payment received — BK-0892",      debit:"Bank — DBBL",            credit:"Customer Deposits",    amount:130000, ref:"TXN-1092",  status:"posted"  },
  { id:"JNL-0737", date:"Jul 8",  desc:"Office rent — July 2024",               debit:"Rent Expense",            credit:"Bank — BRAC",          amount:45000,  ref:"RENT-JUL",  status:"draft"   },
];

const INVOICES_DATA = [
  { id:"INV-2024-0247", customer:"Md. Karim Ullah",  type:"customer", amount:520000, paid:390000, balance:130000, due:"Jul 31", status:"partial" },
  { id:"INV-2024-0108", customer:"Shahana Parvin",   type:"customer", amount:215000, paid:215000, balance:0,      due:"Apr 30", status:"paid"    },
  { id:"INV-SUP-0241",  customer:"Al-Amin Hotels",   type:"supplier", amount:2940000,paid:0,      balance:2940000,due:"Aug 1",  status:"unpaid"  },
  { id:"INV-SUP-0238",  customer:"Al-Amin Hotels",   type:"supplier", amount:420000, paid:420000, balance:0,      due:"Jun 25", status:"paid"    },
];

const PAYMENTS_DATA = [
  { id:"PAY-1044", type:"received", from:"Md. Karim Ullah", amount:130000, method:"bKash",       date:"Jun 29",  ref:"TXN-1092"     },
  { id:"PAY-1043", type:"paid",     to:"Al-Amin Hotels",    amount:420000, method:"Bank Transfer",date:"Jun 27",  ref:"DBBL-TXN-XXX" },
  { id:"PAY-1042", type:"received", from:"Shahana Parvin",  amount:215000, method:"Bank Transfer",date:"May 2",   ref:"BRAC-TXN-XXX" },
  { id:"PAY-1041", type:"paid",     to:"Al-Amin Hotels",    amount:64000,  method:"Bank Transfer",date:"Jun 1",   ref:"DBBL-TXN-XXX" },
];

const AUDIT_LOG = [
  { id:"AUD-5221", action:"Invoice created",     entity:"INV-2024-0247",  user:"Accountant",  time:"Jul 16 10:00", severity:"info"     },
  { id:"AUD-5220", action:"Journal entry posted",entity:"JNL-0740",       user:"Accountant",  time:"Jul 14 14:30", severity:"info"     },
  { id:"AUD-5219", action:"Payment recorded",    entity:"PAY-1044",       user:"Accountant",  time:"Jun 29 11:00", severity:"info"     },
  { id:"AUD-5218", action:"Unauthorized access attempt",entity:"Reports", user:"Unknown",    time:"Jun 28 02:14", severity:"critical" },
  { id:"AUD-5217", action:"Large payment flagged",entity:"INV-SUP-0241",  user:"System",      time:"Jul 14 14:31", severity:"warning"  },
  { id:"AUD-5216", action:"Account balance reconciled",entity:"ACC-01",   user:"Accountant",  time:"Jun 30 17:00", severity:"info"     },
];

const TAX_DATA = [
  { quarter:"Q1 (Jan–Mar)", income:2810000, vat:422000, tax:56200, filed:true,  deadline:"Apr 30" },
  { quarter:"Q2 (Apr–Jun)", income:3860000, vat:579000, tax:77200, filed:true,  deadline:"Jul 31" },
  { quarter:"Q3 (Jul–Sep)", income:null,    vat:null,   tax:null,  filed:false, deadline:"Oct 31" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtBDT  = (n: number) => "৳ " + n.toLocaleString("en-BD");
const fmtShort = (n: number) => n >= 100000 ? "৳" + (n/100000).toFixed(n%100000===0?0:1)+"L" : "৳"+n.toLocaleString();

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
  const q = useAccountantDashboard();
  const d = q.data;
  return (
    <PLoad q={q}>
      {d && (
      <div className="space-y-5" data-portal="dashboard">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Accountant Dashboard</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5" data-portal-name>Financial Overview</h1>
            <p className="text-sm text-slate-500 mt-0.5">{d.accountantName} · {d.branchName ?? "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Revenue (YTD)", val:fmtBDT2(d.revenue), color:"text-emerald-600", bg:"bg-emerald-500", Icon:TrendingUp },
            { label:"Expenses (YTD)", val:fmtBDT2(d.expense), color:"text-red-500", bg:"bg-red-500", Icon:TrendingDown },
            { label:"Net Profit", val:fmtBDT2(d.netProfit), color:"text-[#0E6BB8]", bg:"bg-[#0E6BB8]", Icon:CircleDollarSign },
            { label:"Posted Journals", val:String(d.postedJournalCount), color:"text-purple-600", bg:"bg-purple-500", Icon:Building2 },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white mb-3", k.bg)}><k.Icon size={16} /></div>
              <p className={cn("text-xl font-black", k.color)} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{k.val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="font-bold text-slate-800 mb-4">Invoices (YTD)</p>
          <div className="grid grid-cols-3 gap-3">
            {[["Billed",d.invoices.billed],["Collected",d.invoices.collected],["Outstanding",d.invoices.outstanding]].map(([l,v])=>(
              <div key={l} className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-sm font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT2(v)}</p><p className="text-xs text-slate-400 mt-0.5">{l}</p></div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[["income-expense","Income & Expense"],["journal","Journal"],["invoices-payments","Invoices"]].map(([v,label])=>(
            <button key={v} onClick={()=>onGo(v as AccView)} className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#0E6BB8]/30 text-sm font-semibold text-slate-700 text-left">{label} <span className="text-slate-300">→</span></button>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center">Detailed ledgers below reuse the branch-scoped finance &amp; report endpoints.</p>
      </div>
      )}
    </PLoad>
  );
}

// ─── INCOME & EXPENSE ─────────────────────────────────────────────────────────
function IncomeExpenseView() {
  const [tab, setTab] = useState("income");
  const incQ = useIncome({ range: "ytd", pageSize: 100 });
  const expQ = useExpenses({ range: "ytd", pageSize: 100 });
  const q = tab==="income" ? incQ : expQ;
  const rows = q.data?.data ?? [];
  return (
    <div className="space-y-5" data-portal="income-expense">
      <h2 className="text-xl font-bold text-slate-800">Income & Expense</h2>
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
        {["income","expense"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={cn("px-4 py-2 text-sm font-semibold rounded-xl capitalize", tab===t?"bg-white text-slate-800 shadow-sm":"text-slate-500")}>{t}</button>
        ))}
      </div>
      <PLoad q={q}>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1 capitalize">Total {tab} (baseAmount, BDT)</p>
          {/* Sum baseAmount from the rows — the ledger endpoint's stats.totalAmount sums raw
              `amount` across currencies (a mixed-currency bug); baseAmount is the correct aggregate. */}
          <p className={cn("text-2xl font-black", tab==="income"?"text-emerald-600":"text-red-500")} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(rows.reduce((s,r)=>s+r.baseAmount,0))}</p>
        </div>
        <div className="space-y-2.5">
          {rows.length===0 && <p className="text-sm text-slate-400 text-center py-4">No {tab} records.</p>}
          {rows.map(r=>(
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div><p className="text-sm font-semibold text-slate-800">{r.category}</p><p className="text-xs text-slate-400 mt-0.5">{r.party || r.description || "—"} · {r.date}</p></div>
              <div className="text-right"><p className={cn("font-black", tab==="income"?"text-emerald-600":"text-red-500")} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(r.baseAmount)}</p><span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-slate-100 text-slate-600">{r.status.toLowerCase()}</span></div>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── BANK & CASH ──────────────────────────────────────────────────────────────
function BankCashView() {
  const TRANSACTIONS = [
    { date:"Jul 15", desc:"Client payment — BK-0892",      account:"DBBL", type:"credit", amount:130000  },
    { date:"Jul 14", desc:"Supplier payment — Dar Al-Tawhid", account:"DBBL", type:"debit",  amount:2940000 },
    { date:"Jul 12", desc:"Salary disbursement — Jul 24",  account:"IBBL", type:"debit",  amount:120000  },
    { date:"Jul 10", desc:"Client payment — BK-0892",      account:"DBBL", type:"credit", amount:130000  },
    { date:"Jun 27", desc:"Supplier settlement — Al-Amin", account:"DBBL", type:"debit",  amount:420000  },
    { date:"Jun 25", desc:"Tour package revenue — BK-0881",account:"BRAC", type:"credit", amount:215000  },
  ];

  return (
    <div className="space-y-5">
      <SampleBadge />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Bank & Cash</h2>
        <button className="flex items-center gap-1.5 text-sm text-[#0E6BB8] font-semibold border border-[#0E6BB8]/30 px-3 py-1.5 rounded-xl hover:bg-[#0E6BB8]/5">
          <Download size={14}/> Statement
        </button>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-2 gap-3">
        {BANK_ACCOUNTS.map((a,i) => (
          <div key={a.id} className={cn("rounded-2xl p-5", i===0?"bg-gradient-to-br from-[#0E6BB8] to-[#0a2a52] text-white":"bg-white border border-slate-200")}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className={cn("text-xs font-medium", i===0?"text-white/70":"text-slate-400")}>{a.type}</p>
                <p className={cn("font-bold mt-0.5", i===0?"text-white":"text-slate-800")}>{a.bank}</p>
              </div>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", i===0?"bg-white/15":"bg-[#0E6BB8]/8")}>
                <Building2 size={14} className={i===0?"text-white":"text-[#0E6BB8]"} />
              </div>
            </div>
            <p className={cn("text-2xl font-black", i===0?"text-white":"text-slate-800")} style={{ fontFamily:"'JetBrains Mono',monospace" }}>
              {fmtShort(a.balance)}
            </p>
            <p className={cn("text-xs mt-1 font-mono", i===0?"text-white/50":"text-slate-400")}>{a.acct}</p>
          </div>
        ))}
      </div>

      {/* Transaction ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="font-bold text-slate-800">Recent Transactions</p>
          <div className="flex items-center gap-2">
            <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-600">
              <option>All Accounts</option>
              {BANK_ACCOUNTS.map(a=><option key={a.id}>{a.bank}</option>)}
            </select>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Date","Description","Account","Type","Amount"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TRANSACTIONS.map((t,i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{t.date}</td>
                <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">{t.desc}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-mono">{t.account}</span></td>
                <td className="px-4 py-3">
                  <span className={cn("flex items-center gap-1 text-xs font-semibold w-fit",
                    t.type==="credit"?"text-emerald-600":"text-red-500")}>
                    {t.type==="credit"?<ArrowDownLeft size={12}/>:<ArrowUpRight size={12}/>}
                    {t.type}
                  </span>
                </td>
                <td className={cn("px-4 py-3 text-sm font-black font-mono",t.type==="credit"?"text-emerald-600":"text-red-500")}>
                  {t.type==="credit"?"+":"-"}{fmtShort(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── JOURNAL ENTRIES ──────────────────────────────────────────────────────────
function JournalView() {
  const q = useJournal({ range: "ytd", pageSize: 100 });
  const rows = q.data?.data ?? [];
  return (
    <div className="space-y-5" data-portal="journal">
      <h2 className="text-xl font-bold text-slate-800">Journal Entries</h2>
      <PLoad q={q}>
        <div className="grid grid-cols-3 gap-3">
          {[["Entries", q.data?.stats.total ?? 0],["Posted", q.data?.stats.posted ?? 0],["Drafts", q.data?.stats.drafts ?? 0]].map(([l,v])=>(
            <div key={l} className="bg-white border border-slate-200 rounded-2xl p-3 text-center"><p className="text-lg font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{v}</p><p className="text-xs text-slate-400 mt-0.5">{l}</p></div>
          ))}
        </div>
        <div className="space-y-2.5">
          {rows.length===0 && <p className="text-sm text-slate-400 text-center py-4">No journal entries.</p>}
          {rows.map(j=>(
            <div key={j.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div><p className="text-sm font-semibold text-slate-800 font-mono">{j.ref}</p><p className="text-xs text-slate-400 mt-0.5">{j.description || "—"} · {j.date}</p></div>
              <div className="text-right"><p className="font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(j.totalDebit)}</p><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", j.isReversed?"bg-red-50 text-red-500":j.status==="POSTED"?"bg-emerald-50 text-emerald-600":"bg-slate-100 text-slate-500")}>{j.isReversed?"reversed":j.status.toLowerCase()}</span></div>
            </div>
          ))}
        </div>
      </PLoad>
    </div>
  );
}

// ─── INVOICES & PAYMENTS ──────────────────────────────────────────────────────
function InvPayView() {
  const [tab, setTab] = useState("invoices");
  const invQ = useInvoices({ range: "ytd", pageSize: 100 });
  const payQ = usePayments({ range: "ytd", pageSize: 100 });
  const invoices = invQ.data?.data ?? [];
  const payments = payQ.data?.data ?? [];
  return (
    <div className="space-y-5" data-portal="invpay">
      <h2 className="text-xl font-bold text-slate-800">Invoices & Payments</h2>
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
        {["invoices","payments"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={cn("px-4 py-2 text-sm font-semibold rounded-xl capitalize", tab===t?"bg-white text-slate-800 shadow-sm":"text-slate-500")}>{t}</button>
        ))}
      </div>
      {tab==="invoices" ? (
        <PLoad q={invQ}>
          <div className="grid grid-cols-3 gap-3">
            {[["Billed", invQ.data?.stats.totalBilled ?? 0],["Collected", invQ.data?.stats.totalPaid ?? 0],["Outstanding", invQ.data?.stats.totalDue ?? 0]].map(([l,v])=>(
              <div key={l} className="bg-white border border-slate-200 rounded-2xl p-3 text-center"><p className="text-base font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(v)}</p><p className="text-xs text-slate-400 mt-0.5">{l}</p></div>
            ))}
          </div>
          <div className="space-y-2.5">
            {invoices.length===0 && <p className="text-sm text-slate-400 text-center py-4">No invoices.</p>}
            {invoices.map(i=>(
              <div key={i.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                <div><p className="text-sm font-semibold text-slate-800 font-mono">{i.invoiceNo || "DRAFT"}</p><p className="text-xs text-slate-400 mt-0.5">{i.customerName || "—"} · {i.issueDate || "—"}</p></div>
                <div className="text-right"><p className="font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmtBDT2(i.total)}</p><span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-slate-100 text-slate-600">{i.status.toLowerCase()}</span></div>
              </div>
            ))}
          </div>
        </PLoad>
      ) : (
        <PLoad q={payQ}>
          <div className="space-y-2.5">
            {payments.length===0 && <p className="text-sm text-slate-400 text-center py-4">No payments.</p>}
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
  const REPORTS_LIST = [
    { name:"Profit & Loss Statement — Jul 2024",  type:"P&L",           date:"Jul 20" },
    { name:"Balance Sheet — Q2 2024",            type:"Balance Sheet",  date:"Jun 30" },
    { name:"Cash Flow Statement — Q2 2024",      type:"Cash Flow",      date:"Jun 30" },
    { name:"Accounts Receivable Aging",          type:"AR Aging",       date:"Jul 18" },
    { name:"Accounts Payable Summary",           type:"AP Summary",     date:"Jul 18" },
    { name:"Budget vs Actual — H1 2024",         type:"Variance",       date:"Jun 30" },
  ];

  return (
    <div className="space-y-5">
      <SampleBadge />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Financial Reports</h2>
        <button className="flex items-center gap-1.5 text-sm text-[#0E6BB8] font-semibold border border-[#0E6BB8]/30 px-3.5 py-2 rounded-xl hover:bg-[#0E6BB8]/5">
          <Plus size={14}/> Custom Report
        </button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Gross Revenue YTD",  val:fmtShort(INCOME_DATA.reduce((s,v)=>s+v,0)),   color:"text-emerald-600" },
          { label:"Total Expenses YTD", val:fmtShort(EXPENSE_DATA.reduce((s,v)=>s+v,0)),  color:"text-red-500"     },
          { label:"Net Profit YTD",     val:fmtShort(INCOME_DATA.reduce((s,v)=>s+v,0)-EXPENSE_DATA.reduce((s,v)=>s+v,0)), color:"text-[#0E6BB8]" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className={cn("text-xl font-black", s.color)} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Report","Type","Generated",""].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {REPORTS_LIST.map((r,i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-9 bg-[#0E6BB8]/10 border border-[#0E6BB8]/20 rounded-lg flex items-center justify-center text-[#0E6BB8] text-xs font-bold">PDF</div>
                    <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">{r.type}</span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-400">{r.date}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 text-xs text-[#0E6BB8] font-semibold hover:underline"><Eye size={12}/> View</button>
                    <button className="flex items-center gap-1 text-xs text-slate-500 font-semibold hover:underline"><Download size={12}/> PDF</button>
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

// ─── TAX REPORTS ─────────────────────────────────────────────────────────────
function TaxView() {
  return (
    <div className="space-y-5">
      <SampleBadge />
      <h2 className="text-xl font-bold text-slate-800">Tax Reports</h2>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"VAT Collected YTD",  val:"৳10,01,000", color:"bg-[#0E6BB8]"  },
          { label:"Income Tax (est.)",  val:"৳1,33,400",  color:"bg-purple-500" },
          { label:"Next Filing",        val:"Oct 31",     color:"bg-amber-500"  },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl p-5 text-white", s.color)}>
            <p className="text-2xl font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
            <p className="text-white/80 text-sm mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* VAT rates info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Bangladesh VAT Rates</p>
          <p className="text-xs text-blue-600 mt-0.5">Standard rate: 15% · Tourism services: 15% VAT + 5% SD applies on international tour packages.</p>
        </div>
      </div>

      {/* Quarterly breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-800">Quarterly VAT Summary — 2024</p>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Quarter","Taxable Income","VAT Collected","Income Tax","Status","Due Date",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TAX_DATA.map(q => (
              <tr key={q.quarter} className="hover:bg-slate-50">
                <td className="px-4 py-4 text-sm font-semibold text-slate-800 whitespace-nowrap">{q.quarter}</td>
                <td className="px-4 py-4 text-sm font-mono font-bold text-slate-800">{q.income ? fmtShort(q.income) : "—"}</td>
                <td className="px-4 py-4 text-sm font-mono text-purple-600">{q.vat ? fmtShort(q.vat) : "—"}</td>
                <td className="px-4 py-4 text-sm font-mono text-[#0E6BB8]">{q.tax ? fmtShort(q.tax) : "—"}</td>
                <td className="px-4 py-4">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border",
                    q.filed
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200")}>
                    {q.filed ? "Filed" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">{q.deadline}</td>
                <td className="px-4 py-4">
                  {q.filed
                    ? <button className="flex items-center gap-1 text-xs text-[#0E6BB8] font-semibold hover:underline"><Download size={12}/> Return</button>
                    : <button className="text-xs bg-[#0E6BB8] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#0B5794]">Prepare</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tax documents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="font-bold text-slate-800 mb-3">Tax Documents</p>
        <div className="space-y-2">
          {["VAT Return Q1 2024","VAT Return Q2 2024","TIN Certificate","Trade License 2024"].map(doc => (
            <div key={doc} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-700">{doc}</span>
              <button className="flex items-center gap-1 text-xs text-[#0E6BB8] font-semibold hover:underline">
                <Download size={12}/> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
function AuditView() {
  const [filter, setFilter] = useState("all");
  const shown = AUDIT_LOG.filter(l => filter==="all" || l.severity===filter);

  return (
    <div className="space-y-4">
      <SampleBadge />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Audit Logs</h2>
        <button className="flex items-center gap-1.5 text-sm text-[#0E6BB8] font-semibold border border-[#0E6BB8]/30 px-3 py-1.5 rounded-xl hover:bg-[#0E6BB8]/5">
          <Download size={14}/> Export
        </button>
      </div>

      <div className="flex gap-2">
        {["all","info","warning","critical"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all",
              filter===f ? "bg-[#0E6BB8] text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-[#0E6BB8]/30")}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Log ID","Action","Entity","User","Time","Severity"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map(log => {
              const s = SEV_CFG[log.severity];
              return (
                <tr key={log.id} className={cn("hover:bg-slate-50 transition-colors", s.row)}>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{log.id}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{log.action}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{log.entity}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{log.user}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{log.time}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border", s.badge)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                      {log.severity}
                    </span>
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

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function AccProfile() {
  const q = useAccountantMe();
  const me = q.data;
  const initials = (me?.name ?? "").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="space-y-5" data-portal="profile">
      <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>
      <PLoad q={q}>
        {me && (<>
          <div className="bg-gradient-to-br from-[#0E6BB8] to-[#1a4a8a] rounded-2xl p-5 text-white flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-black">{initials}</div>
            <div>
              <p className="text-xl font-bold" data-portal-name>{me.name}</p>
              <p className="text-white/70 text-sm mt-0.5">{me.department ?? "Finance"} · {me.branchName ?? "—"}</p>
              <p className="text-white/50 text-xs mt-1 font-mono">{me.employeeId ?? ""}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">Personal Information</p>
            {[
              ["Full Name",me.name],["Employee ID",me.employeeId ?? "—"],["Department",me.department ?? "—"],
              ["Branch",me.branchName ?? "—"],["Phone",me.phone ?? "—"],["Email",me.email],["NID Number",me.nid ?? "—"],
            ].map(([l,v]) => (
              <div key={l}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
                <input value={v} disabled data-field={l} className="w-full px-3 py-2.5 text-sm rounded-xl border border-transparent bg-slate-50 text-slate-700"/>
              </div>
            ))}
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50"><LogOut size={16}/> Sign Out</button>
        </>)}
      </PLoad>
    </div>
  );
}

// ─── Sidebar inner ────────────────────────────────────────────────────────────
function AccSidebar({ view, go, onClose }: { view: AccView; go: (v: AccView) => void; onClose?: () => void }) {
  const { data: me } = useAccountantMe();
  const aName = me?.name ?? "Accountant";
  const aInit = aName.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <aside className="w-56 bg-[#17456B] flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-black">BDH</div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">BDH Travels</p>
            <p className="text-white/50 text-xs">Accounts Portal</p>
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
            <p className="text-white/50 text-xs truncate">{me?.department ?? "Finance"}</p>
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
            <span className="flex-1 text-left text-xs">{item.label}</span>
            {item.badge ? (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{item.badge}</span>
            ) : null}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 w-full px-3 py-2 rounded-xl hover:bg-white/5"
          style={{ minHeight: 44 }}>
          <LogOut size={14}/> Sign Out
        </button>
      </div>
    </aside>
  );
}

// Mobile bottom nav
const ACC_BOTTOM_NAV = [
  { id: "dashboard"        as AccView, icon: LayoutDashboard, label: "Home"    },
  { id: "income-expense"   as AccView, icon: TrendingUp,      label: "P&L"     },
  { id: "bank-cash"        as AccView, icon: Building2,       label: "Bank"    },
  { id: "invoices-payments"as AccView, icon: FileText,        label: "Invoices"},
  { id: "audit"            as AccView, icon: ClipboardList,   label: "Audit", badge: 3 },
];

// ─── SHELL ────────────────────────────────────────────────────────────────────
export function AccountantPortal() {
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

  const currentLabel = NAV.find(n => n.id === view)?.label ?? "";

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
                FY: <span className="font-semibold text-slate-700">2024</span>
              </div>
              <button onClick={() => go("profile")}
                className="w-7 h-7 rounded-full bg-[#0E6BB8]/15 flex items-center justify-center text-[#0E6BB8] text-xs font-bold">
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
              <div className="w-8 h-8 rounded-lg bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-black">BDH</div>
            </button>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[160px]">{currentLabel}</p>
              <p className="text-xs text-slate-400">Ferdous Ahmed · Accountant</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-mono">FY 2024</span>
            <button onClick={() => go("profile")}
              className="w-8 h-8 rounded-full bg-[#0E6BB8]/15 flex items-center justify-center text-[#0E6BB8] text-xs font-bold ml-1">
              FA
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          {render()}
        </main>

        <MobileBottomNav
          items={ACC_BOTTOM_NAV}
          active={view}
          onChange={go}
        />
      </div>
    </div>
  );
}

export default AccountantPortal;
