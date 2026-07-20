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
  const totalIncome  = INCOME_DATA[INCOME_DATA.length-1];
  const totalExpense = EXPENSE_DATA[EXPENSE_DATA.length-1];
  const netProfit    = totalIncome - totalExpense;
  const maxVal = Math.max(...INCOME_DATA, ...EXPENSE_DATA);
  const totalBank    = BANK_ACCOUNTS.reduce((s,a)=>s+a.balance,0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Accountant Dashboard</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Financial Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fiscal Year 2024 · As of Jul 20</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <Download size={14} /> Export
        </button>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Total Income",  val:fmtShort(totalIncome),  sub:"Jul 2024",      color:"text-emerald-600", bg:"bg-emerald-500",  Icon:TrendingUp,         delta:"+12%", up:true  },
          { label:"Total Expenses",val:fmtShort(totalExpense), sub:"Jul 2024",      color:"text-red-500",     bg:"bg-red-500",      Icon:TrendingDown,        delta:"+8%",  up:false },
          { label:"Net Profit",    val:fmtShort(netProfit),    sub:"Jul 2024",      color:"text-[#0E6BB8]",   bg:"bg-[#0E6BB8]",    Icon:CircleDollarSign,   delta:"+21%", up:true  },
          { label:"Bank Balance",  val:fmtShort(totalBank),    sub:"All accounts",  color:"text-purple-600",  bg:"bg-purple-500",   Icon:Building2,                                  },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white", k.bg)}>
                <k.Icon size={16} />
              </div>
              {k.delta && (
                <span className={cn("text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md",
                  k.up ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50")}>
                  {k.up ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}{k.delta}
                </span>
              )}
            </div>
            <p className={cn("text-xl font-black", k.color)} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{k.val}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* P&L chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-slate-800">Income vs Expense — 2024</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#0E6BB8] inline-block"/>Income</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block"/>Expense</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-36">
          {MONTHS.map((m,i) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height:"120px" }}>
                <div className="flex-1 rounded-t-sm" style={{ height:`${(INCOME_DATA[i]/maxVal)*100}%`, background:"#0E6BB8" }} />
                <div className="flex-1 rounded-t-sm" style={{ height:`${(EXPENSE_DATA[i]/maxVal)*100}%`, background:"#FCA5A5" }} />
              </div>
              <p className="text-xs text-slate-400">{m}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bank balances */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-800">Bank & Cash Balances</p>
          <button onClick={() => onGo("bank-cash")} className="text-xs text-[#0E6BB8] font-semibold hover:underline">View all</button>
        </div>
        <div className="divide-y divide-slate-100">
          {BANK_ACCOUNTS.map(a => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#0E6BB8]/8 flex items-center justify-center flex-shrink-0">
                <Building2 size={15} className="text-[#0E6BB8]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{a.bank}</p>
                <p className="text-xs text-slate-400">{a.type} · {a.acct}</p>
              </div>
              <p className="font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtShort(a.balance)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#0E6BB8]/3">
            <p className="text-sm font-bold text-slate-700">Total Available</p>
            <p className="font-black text-[#0E6BB8] text-lg" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtShort(totalBank)}</p>
          </div>
        </div>
      </div>

      {/* Pending invoices alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={15} className="text-amber-500" />
          <p className="font-semibold text-amber-800 text-sm">Pending Actions</p>
        </div>
        <div className="space-y-2">
          {[
            { label:"Unpaid supplier invoices", val: fmtShort(INVOICES_DATA.filter(i=>i.status==="unpaid").reduce((s,i)=>s+i.balance,0)), cta:"View", v:"invoices-payments" as AccView },
            { label:"Draft journal entries",    val:"2 pending",  cta:"Review",   v:"journal"            as AccView },
            { label:"Q3 tax filing due",        val:"Oct 31",     cta:"Prepare",  v:"tax"                as AccView },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100">
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-amber-600 font-mono font-bold">{item.val}</p>
              </div>
              <button onClick={() => onGo(item.v)}
                className="text-xs text-[#0E6BB8] font-bold px-3 py-1.5 bg-[#0E6BB8]/8 rounded-lg hover:bg-[#0E6BB8]/15 flex items-center gap-1">
                {item.cta} <ChevronRight size={11}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── INCOME & EXPENSE ─────────────────────────────────────────────────────────
function IncomeExpenseView() {
  const [tab, setTab] = useState<"income"|"expense">("income");
  const rows = tab === "income" ? INCOME_ROWS : EXPENSE_ROWS;
  const total = rows.reduce((s,r)=>s+r.amount,0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Income & Expense</h2>
        <button className="flex items-center gap-1.5 text-sm text-[#0E6BB8] font-semibold border border-[#0E6BB8]/30 px-3 py-1.5 rounded-xl hover:bg-[#0E6BB8]/5">
          <Download size={14}/> Export
        </button>
      </div>

      {/* Tab */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setTab("income")}
          className={cn("px-5 py-2 rounded-xl text-sm font-semibold transition-all",
            tab==="income" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
          Income
        </button>
        <button onClick={() => setTab("expense")}
          className={cn("px-5 py-2 rounded-xl text-sm font-semibold transition-all",
            tab==="expense" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
          Expense
        </button>
      </div>

      {/* Total card */}
      <div className={cn("rounded-2xl p-5 text-white", tab==="income"?"bg-gradient-to-br from-[#0E7C66] to-[#0a5c4c]":"bg-gradient-to-br from-red-500 to-red-700")}>
        <p className="text-white/70 text-xs mb-1">Total {tab==="income"?"Income":"Expense"} — Jul 2024</p>
        <p className="text-3xl font-black" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(total)}</p>
        <div className="flex items-center gap-2 mt-2 text-white/70 text-xs">
          <TrendingUp size={12}/>
          <span>+{tab==="income"?"12":"8"}% vs last month</span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="font-bold text-slate-800 mb-4">Breakdown by Category</p>
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.category}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-700">{r.category}</span>
                <span className="font-bold text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtBDT(r.amount)}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width:`${r.pct}%`, background:r.color }} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 text-right">{r.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly trend table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="font-bold text-slate-800">Monthly Trend</p>
          <span className="text-xs text-slate-400">2024</span>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Month","Income","Expense","Net Profit","Margin"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MONTHS.map((m,i) => {
              const net = INCOME_DATA[i]-EXPENSE_DATA[i];
              const margin = Math.round((net/INCOME_DATA[i])*100);
              return (
                <tr key={m} className={cn("hover:bg-slate-50 transition-colors", i===MONTHS.length-1&&"font-semibold bg-[#0E6BB8]/3")}>
                  <td className="px-4 py-3 text-sm text-slate-700">{m} 2024</td>
                  <td className="px-4 py-3 text-sm font-mono text-emerald-600">{fmtShort(INCOME_DATA[i])}</td>
                  <td className="px-4 py-3 text-sm font-mono text-red-500">{fmtShort(EXPENSE_DATA[i])}</td>
                  <td className="px-4 py-3 text-sm font-mono font-bold text-slate-800">{fmtShort(net)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-lg", margin>=35?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700")}>
                      {margin}%
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
  const [newModal, setNewModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Journal Entries</h2>
        <button onClick={() => setNewModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0E6BB8] text-white text-sm font-semibold rounded-xl hover:bg-[#0B5794]">
          <Plus size={14}/> New Entry
        </button>
      </div>

      {/* Mobile: journal cards */}
      <div className="space-y-3 md:hidden">
        {JOURNAL_ENTRIES.map(j => (
          <div key={j.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-xs font-mono text-slate-400">{j.id} · {j.date}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 leading-tight">{j.desc}</p>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold border flex-shrink-0",
                j.status==="posted"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-amber-50 text-amber-700 border-amber-200")}>
                {j.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-xs text-slate-400 mb-0.5">Dr</p>
                <p className="text-xs font-semibold text-slate-700 truncate">{j.debit}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-xs text-slate-400 mb-0.5">Cr</p>
                <p className="text-xs font-semibold text-slate-700 truncate">{j.credit}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
              <p className="text-sm font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtShort(j.amount)}</p>
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Eye size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: full table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hidden md:block">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search entries…" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <select className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none text-slate-600">
            <option>All Entries</option><option>Posted</option><option>Draft</option>
          </select>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Entry","Date","Description","Debit A/C","Credit A/C","Amount","Status",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {JOURNAL_ENTRIES.map(j => (
              <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5 text-xs font-mono text-slate-500 whitespace-nowrap">{j.id}</td>
                <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{j.date}</td>
                <td className="px-4 py-3.5 text-sm text-slate-700 max-w-[200px] truncate">{j.desc}</td>
                <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[140px] truncate">{j.debit}</td>
                <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[140px] truncate">{j.credit}</td>
                <td className="px-4 py-3.5 text-sm font-black font-mono text-slate-800 whitespace-nowrap">{fmtShort(j.amount)}</td>
                <td className="px-4 py-3.5">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold border",
                    j.status==="posted"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200")}>
                    {j.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 flex items-center gap-1.5">
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Eye size={13}/></button>
                  {j.status==="draft" && <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Edit2 size={13}/></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {newModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">New Journal Entry</h3>
              <button onClick={() => setNewModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                <input type="date" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Reference</label>
                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" placeholder="e.g., BK-0892"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none"/>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ledger Lines</p>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs text-slate-400 mb-1 block">Account</label>
                  <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none" placeholder="Debit A/C"/></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Account</label>
                  <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none" placeholder="Credit A/C"/></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Amount (৳)</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none font-mono"/></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setNewModal(false)}
                className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-600 text-sm font-medium hover:bg-slate-50">
                Save as Draft
              </button>
              <button onClick={() => setNewModal(false)}
                className="flex-1 py-3 bg-[#0E6BB8] text-white font-bold text-sm rounded-2xl hover:bg-[#0B5794]">
                Post Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INVOICES & PAYMENTS ──────────────────────────────────────────────────────
function InvPayView() {
  const [tab, setTab] = useState<"invoices"|"payments">("invoices");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Invoices & Payments</h2>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0E6BB8] text-white text-sm font-semibold rounded-xl hover:bg-[#0B5794]">
          <Plus size={14}/> New Invoice
        </button>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        {(["invoices","payments"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-5 py-2 rounded-xl text-sm font-semibold transition-all capitalize",
              tab===t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "invoices" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Summary */}
          <div className="grid grid-cols-3 border-b border-slate-200">
            {[
              { label:"Total Outstanding", val:fmtShort(INVOICES_DATA.reduce((s,i)=>s+i.balance,0)), cls:"text-red-500"     },
              { label:"Customer Invoices", val:fmtShort(INVOICES_DATA.filter(i=>i.type==="customer").reduce((s,i)=>s+i.amount,0)), cls:"text-[#0E6BB8]" },
              { label:"Supplier Invoices", val:fmtShort(INVOICES_DATA.filter(i=>i.type==="supplier").reduce((s,i)=>s+i.amount,0)), cls:"text-purple-600" },
            ].map(s => (
              <div key={s.label} className="px-5 py-4 text-center border-r border-slate-200 last:border-0">
                <p className={cn("text-xl font-black", s.cls)} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Invoice","Party","Type","Total","Paid","Balance","Due","Status",""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {INVOICES_DATA.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{inv.id}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{inv.customer}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      inv.type==="customer"?"bg-blue-50 text-blue-600":"bg-purple-50 text-purple-600")}>
                      {inv.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-bold text-slate-800">{fmtShort(inv.amount)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-emerald-600">{fmtShort(inv.paid)}</td>
                  <td className={cn("px-4 py-3 text-sm font-mono font-bold",inv.balance>0?"text-red-500":"text-emerald-600")}>{fmtShort(inv.balance)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{inv.due}</td>
                  <td className="px-4 py-3"><Chip label={inv.status} cls={INV_STATUS_CFG[inv.status]} /></td>
                  <td className="px-4 py-3"><button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Eye size={13}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "payments" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Payment ID","Party","Type","Amount","Method","Date","Ref",""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PAYMENTS_DATA.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.id}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{p.type==="received"?(p as any).from:(p as any).to}</td>
                  <td className="px-4 py-3">
                    <span className={cn("flex items-center gap-1 text-xs font-semibold",
                      p.type==="received"?"text-emerald-600":"text-red-500")}>
                      {p.type==="received"?<ArrowDownLeft size={12}/>:<ArrowUpRight size={12}/>}
                      {p.type}
                    </span>
                  </td>
                  <td className={cn("px-4 py-3 text-sm font-black font-mono",p.type==="received"?"text-emerald-600":"text-red-500")}>
                    {p.type==="received"?"+":"-"}{fmtShort(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.method}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.date}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400 max-w-[100px] truncate">{p.ref}</td>
                  <td className="px-4 py-3"><button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Download size={13}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>
      <div className="bg-gradient-to-br from-[#0E6BB8] to-[#1a4a8a] rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-black">FA</div>
        <div>
          <p className="text-xl font-bold">Ferdous Ahmed</p>
          <p className="text-white/70 text-sm mt-0.5">Senior Accountant · Agrabad HO</p>
          <p className="text-white/50 text-xs mt-1 font-mono">EMP-0012 · CA (ICAB) · Since Mar 2019</p>
        </div>
        <button onClick={() => setEditing(v=>!v)} className="ml-auto p-2 hover:bg-white/10 rounded-xl text-white/70">
          <Edit2 size={15}/>
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-semibold text-slate-700 text-sm">Account Information</p>
        {[
          ["Full Name","Ferdous Ahmed"],["Employee ID","EMP-0012"],
          ["Role","Senior Accountant"],["Qualification","CA (ICAB)"],
          ["Phone","+880 1811 XXXXXX"],["Email","ferdous@bdhtravels.com"],
        ].map(([l,v]) => (
          <div key={l}>
            <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
            <input defaultValue={v} disabled={!editing || ["Employee ID","Role"].includes(l)}
              className={cn("w-full px-3 py-2.5 text-sm rounded-xl border transition-colors",
                editing && !["Employee ID","Role"].includes(l)
                  ? "border-[#0E6BB8]/40 bg-white focus:outline-none"
                  : "border-transparent bg-slate-50 text-slate-700 cursor-default")} />
          </div>
        ))}
        {editing && (
          <button onClick={() => setEditing(false)}
            className="w-full py-3 bg-[#0E6BB8] text-white font-semibold text-sm rounded-xl hover:bg-[#0B5794] flex items-center justify-center gap-2">
            <Check size={15}/> Save Changes
          </button>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5">
        <p className="font-semibold text-slate-700 text-sm">Security & Access</p>
        {["Change Password","Two-Factor Authentication","API Keys","Data Export Permissions"].map(item => (
          <button key={item} className="flex items-center justify-between w-full p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <span className="text-sm font-medium text-slate-700">{item}</span>
            <ChevronRight size={15} className="text-slate-400"/>
          </button>
        ))}
      </div>
      <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50">
        <LogOut size={16}/> Sign Out
      </button>
    </div>
  );
}

// ─── Sidebar inner ────────────────────────────────────────────────────────────
function AccSidebar({ view, go, onClose }: { view: AccView; go: (v: AccView) => void; onClose?: () => void }) {
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
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">FA</div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">Ferdous Ahmed</p>
            <p className="text-white/50 text-xs truncate">Sr. Accountant</p>
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
