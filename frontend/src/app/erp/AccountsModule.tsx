import React, { useState } from "react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, Search, Filter, Download, Upload, RefreshCw, ChevronRight,
  ChevronDown, Building2, CreditCard, Banknote, ArrowLeftRight,
  Calendar, CheckCircle, Clock, AlertTriangle, MoreHorizontal,
  FileText, Edit2, Trash2, X, Check, Globe, Layers, BarChart3,
  Eye, Send, Receipt,
} from "lucide-react";
import { cn, fmtPrice } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type AccountsView =
  | "chart-of-accounts" | "income" | "expense" | "journal"
  | "bank-cash" | "transfer" | "installments" | "supplier-payments"
  | "customer-payments" | "gateways";

type Currency = "BDT" | "USD" | "SAR";

// ─── Currency helpers (canonical: see src/app/lib/ds.tsx formatAmount) ────────
const CURRENCY_SYMBOL: Record<Currency, string> = { BDT: "৳", USD: "US$", SAR: "SAR" };
const fmtCurrency = (n: number, cur: Currency = "BDT") =>
  `${CURRENCY_SYMBOL[cur]} ${Math.abs(n).toLocaleString("en-BD")}`;

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: AccountsView; label: string; icon: React.ElementType; group: string }[] = [
  { id: "chart-of-accounts", label: "Chart of Accounts", icon: Layers, group: "Ledger" },
  { id: "income",            label: "Income",            icon: TrendingUp, group: "Ledger" },
  { id: "expense",           label: "Expenses",          icon: TrendingDown, group: "Ledger" },
  { id: "journal",           label: "Journal Entry",     icon: FileText, group: "Ledger" },
  { id: "bank-cash",         label: "Bank & Cash",       icon: Banknote, group: "Banking" },
  { id: "transfer",          label: "Money Transfer",    icon: ArrowLeftRight, group: "Banking" },
  { id: "installments",      label: "Installments",      icon: Calendar, group: "Payments" },
  { id: "supplier-payments", label: "Supplier Payments", icon: Building2, group: "Payments" },
  { id: "customer-payments", label: "Customer Payments", icon: CreditCard, group: "Payments" },
  { id: "gateways",          label: "Payment Gateways",  icon: Globe, group: "Settings" },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const COA_TREE = [
  {
    code: "1000", name: "Assets", type: "header", balance: 42180000,
    children: [
      { code: "1100", name: "Current Assets", type: "header", balance: 18250000,
        children: [
          { code: "1110", name: "Cash in Hand", type: "detail", balance: 850000, currency: "BDT" },
          { code: "1120", name: "Dutch-Bangla Bank – Current", type: "detail", balance: 12400000, currency: "BDT" },
          { code: "1130", name: "Islami Bank – Savings", type: "detail", balance: 5000000, currency: "BDT" },
        ],
      },
      { code: "1200", name: "Receivables", type: "header", balance: 9430000,
        children: [
          { code: "1210", name: "Customer Receivables", type: "detail", balance: 7200000, currency: "BDT" },
          { code: "1220", name: "Agent Receivables", type: "detail", balance: 2230000, currency: "BDT" },
        ],
      },
      { code: "1300", name: "Fixed Assets", type: "header", balance: 14500000,
        children: [
          { code: "1310", name: "Office Equipment", type: "detail", balance: 3200000, currency: "BDT" },
          { code: "1320", name: "Furniture & Fixtures", type: "detail", balance: 1800000, currency: "BDT" },
          { code: "1330", name: "Vehicles", type: "detail", balance: 9500000, currency: "BDT" },
        ],
      },
    ],
  },
  {
    code: "2000", name: "Liabilities", type: "header", balance: 15340000,
    children: [
      { code: "2100", name: "Current Liabilities", type: "header", balance: 8640000,
        children: [
          { code: "2110", name: "Accounts Payable", type: "detail", balance: 4500000, currency: "BDT" },
          { code: "2120", name: "Advance from Customers", type: "detail", balance: 4140000, currency: "BDT" },
        ],
      },
      { code: "2200", name: "Long-term Liabilities", type: "header", balance: 6700000,
        children: [
          { code: "2210", name: "Bank Loan – DBBL", type: "detail", balance: 6700000, currency: "BDT" },
        ],
      },
    ],
  },
  {
    code: "3000", name: "Equity", type: "header", balance: 26840000,
    children: [
      { code: "3100", name: "Owner Capital", type: "detail", balance: 20000000, currency: "BDT" },
      { code: "3200", name: "Retained Earnings", type: "detail", balance: 6840000, currency: "BDT" },
    ],
  },
  {
    code: "4000", name: "Revenue", type: "header", balance: 42100000,
    children: [
      { code: "4100", name: "Hajj Package Revenue", type: "detail", balance: 18500000, currency: "BDT" },
      { code: "4200", name: "Umrah Package Revenue", type: "detail", balance: 12300000, currency: "BDT" },
      { code: "4300", name: "Visa Service Revenue", type: "detail", balance: 4800000, currency: "BDT" },
      { code: "4400", name: "Air Ticket Revenue", type: "detail", balance: 3200000, currency: "BDT" },
      { code: "4500", name: "Other Revenue", type: "detail", balance: 3300000, currency: "BDT" },
    ],
  },
  {
    code: "5000", name: "Expenses", type: "header", balance: 28400000,
    children: [
      { code: "5100", name: "Cost of Sales", type: "header", balance: 20100000,
        children: [
          { code: "5110", name: "Hajj Permit & Maktab", type: "detail", balance: 10500000, currency: "BDT" },
          { code: "5120", name: "Airline Costs", type: "detail", balance: 6200000, currency: "BDT" },
          { code: "5130", name: "Hotel Costs", type: "detail", balance: 3400000, currency: "BDT" },
        ],
      },
      { code: "5200", name: "Operating Expenses", type: "header", balance: 8300000,
        children: [
          { code: "5210", name: "Salaries & Wages", type: "detail", balance: 4800000, currency: "BDT" },
          { code: "5220", name: "Office Rent", type: "detail", balance: 1200000, currency: "BDT" },
          { code: "5230", name: "Marketing", type: "detail", balance: 1400000, currency: "BDT" },
          { code: "5240", name: "Utilities", type: "detail", balance: 900000, currency: "BDT" },
        ],
      },
    ],
  },
];

const INCOME_DATA = [
  { date: "Jul 01", ref: "INC-0041", category: "Hajj Revenue", description: "Group BDH-2024-07", amount: 3400000, method: "Bank Transfer", status: "confirmed" },
  { date: "Jul 03", ref: "INC-0042", category: "Umrah Revenue", description: "Ramadan Umrah – 12 pax", amount: 960000, method: "bKash", status: "confirmed" },
  { date: "Jul 05", ref: "INC-0043", category: "Visa Service", description: "Saudi Visa – 8 applicants", amount: 240000, method: "Cash", status: "confirmed" },
  { date: "Jul 07", ref: "INC-0044", category: "Air Ticket", description: "CGP-DAC roundtrip × 4", amount: 88000, method: "Nagad", status: "pending" },
  { date: "Jul 10", ref: "INC-0045", category: "Tour Package", description: "Malaysia 5N – 3 pax", amount: 215000, method: "SSLCommerz", status: "confirmed" },
  { date: "Jul 12", ref: "INC-0046", category: "Hajj Revenue", description: "Individual – Karim, A.", amount: 520000, method: "Bank Transfer", status: "confirmed" },
  { date: "Jul 14", ref: "INC-0047", category: "Commission", description: "Agent referral – NMT", amount: 45000, method: "Bank Transfer", status: "pending" },
];

const EXPENSE_DATA = [
  { date: "Jul 02", ref: "EXP-0091", category: "Airline Costs", vendor: "Biman Bangladesh", amount: 1240000, method: "Bank Transfer", status: "paid" },
  { date: "Jul 04", ref: "EXP-0092", category: "Hotel Costs", vendor: "Dar Al-Tawhid Makkah", amount: 840000, method: "Bank Transfer", status: "paid" },
  { date: "Jul 06", ref: "EXP-0093", category: "Salaries", vendor: "July 2024 Payroll", amount: 480000, method: "Bank Transfer", status: "paid" },
  { date: "Jul 08", ref: "EXP-0094", category: "Office Rent", vendor: "CDA Building Owner", amount: 120000, method: "Cheque", status: "paid" },
  { date: "Jul 09", ref: "EXP-0095", category: "Marketing", vendor: "Facebook Ads", amount: 85000, method: "Card", status: "paid" },
  { date: "Jul 11", ref: "EXP-0096", category: "Utilities", vendor: "DESCO Electricity", amount: 42000, method: "bKash", status: "pending" },
  { date: "Jul 13", ref: "EXP-0097", category: "Maktab Permit", vendor: "Ministry of Religious Affairs", amount: 2400000, method: "Bank Transfer", status: "pending" },
];

const BANK_ACCOUNTS = [
  { id: "dbbl", name: "Dutch-Bangla Bank Ltd.", number: "1021 0110 0000 234", type: "Current", balance: 12400000, currency: "BDT" as Currency, branch: "Agrabad Branch", lastTx: "Today, 11:42 AM" },
  { id: "ibbl", name: "Islami Bank Bangladesh", number: "2010 0050 0000 891", type: "Savings", balance: 5000000, currency: "BDT" as Currency, branch: "CDA Avenue", lastTx: "Yesterday" },
  { id: "usd", name: "DBBL – USD Account", number: "1021 0110 0010 456", type: "Current", balance: 48200, currency: "USD" as Currency, branch: "Agrabad Branch", lastTx: "Jul 10" },
  { id: "sar", name: "Al Rajhi – SAR Account", number: "SA98 8000 0000 6080 1016 7519", type: "Current", balance: 125000, currency: "SAR" as Currency, branch: "Riyadh", lastTx: "Jul 8" },
  { id: "cash", name: "Cash in Hand", number: "—", type: "Cash", balance: 850000, currency: "BDT" as Currency, branch: "HQ Office", lastTx: "Today" },
];

const BANK_TX = [
  { date: "Jul 14", desc: "Hajj Group BDH-2024-07 – Installment 3", type: "credit", amount: 1200000, balance: 12400000, ref: "TXN-41203" },
  { date: "Jul 13", desc: "Payroll – July 2024", type: "debit", amount: 480000, balance: 11200000, ref: "TXN-41199" },
  { date: "Jul 12", desc: "Biman Bangladesh – Air tickets", type: "debit", amount: 620000, balance: 11680000, ref: "TXN-41196" },
  { date: "Jul 11", desc: "Umrah Ramadan 12 pax – advance", type: "credit", amount: 480000, balance: 12300000, ref: "TXN-41190" },
  { date: "Jul 10", desc: "Dar Al-Tawhid Hotel payment", type: "debit", amount: 840000, balance: 11820000, ref: "TXN-41185" },
  { date: "Jul 09", desc: "Malaysia tour – SSLCommerz", type: "credit", amount: 215000, balance: 12660000, ref: "TXN-41180" },
];

const INSTALLMENT_PLANS = [
  { id: "IP-2401", customer: "Md. Karim Ullah", service: "Hajj 2024 – Economy", total: 520000, paid: 312000, remaining: 208000, installments: 5, paid_n: 3, next_date: "Aug 1", status: "active" },
  { id: "IP-2402", customer: "Mrs. Fatema Begum", service: "Umrah Ramadan – VIP", total: 185000, paid: 185000, remaining: 0, installments: 3, paid_n: 3, next_date: "—", status: "completed" },
  { id: "IP-2403", customer: "Ahmed Family × 3", service: "Malaysia 5N Tour", total: 215000, paid: 43000, remaining: 172000, installments: 5, paid_n: 1, next_date: "Jul 20", status: "active" },
  { id: "IP-2404", customer: "Rahim & Sons Agency", service: "Saudi Visa × 15", total: 450000, paid: 0, remaining: 450000, installments: 3, paid_n: 0, next_date: "Jul 16", status: "overdue" },
  { id: "IP-2405", customer: "Nazrul Islam", service: "Hajj 2024 – Premium", total: 680000, paid: 204000, remaining: 476000, installments: 4, paid_n: 1, next_date: "Aug 15", status: "active" },
];

const SUPPLIER_PAYMENTS = [
  { id: "SP-0141", vendor: "Biman Bangladesh Airlines", invoice: "BG-INV-2024-0891", due: "Jul 20", amount: 2480000, paid: 1240000, remaining: 1240000, status: "partial" },
  { id: "SP-0142", vendor: "Dar Al-Tawhid Hotel, Makkah", invoice: "DAT-2024-342", due: "Jul 18", amount: 1680000, paid: 1680000, remaining: 0, status: "paid" },
  { id: "SP-0143", vendor: "Ministry of Religious Affairs", invoice: "MORA-2024-H17", due: "Jul 16", amount: 2400000, paid: 0, remaining: 2400000, status: "overdue" },
  { id: "SP-0144", vendor: "Madinah Hilton", invoice: "MH-2024-5521", due: "Aug 5", amount: 960000, paid: 0, remaining: 960000, status: "pending" },
  { id: "SP-0145", vendor: "Saudia Airlines", invoice: "SV-2024-00341", due: "Jul 25", amount: 3200000, paid: 1600000, remaining: 1600000, status: "partial" },
];

const CUSTOMER_PAYMENTS = [
  { id: "CP-3201", customer: "Md. Abdullah Al-Mamun", booking: "BK-2024-0892", amount: 520000, received: 520000, method: "Bank Transfer", date: "Jul 14", status: "confirmed" },
  { id: "CP-3202", customer: "Rabeya Khatun", booking: "BK-2024-0881", amount: 185000, received: 92500, method: "bKash", date: "Jul 12", status: "partial" },
  { id: "CP-3203", customer: "Karim & Family", booking: "BK-2024-0875", amount: 680000, received: 680000, method: "SSLCommerz", date: "Jul 10", status: "confirmed" },
  { id: "CP-3204", customer: "NMT Travels Agency", booking: "BK-2024-0867", amount: 1240000, received: 0, method: "—", date: "Jul 8", status: "pending" },
  { id: "CP-3205", customer: "Hosne Ara Begum", booking: "BK-2024-0860", amount: 215000, received: 43000, method: "Nagad", date: "Jul 6", status: "partial" },
];

const MONTHLY_CASHFLOW = [
  { month: "Feb", income: 2850000, expense: 1920000 },
  { month: "Mar", income: 3600000, expense: 2400000 },
  { month: "Apr", income: 4100000, expense: 2800000 },
  { month: "May", income: 5200000, expense: 3200000 },
  { month: "Jun", income: 7800000, expense: 4900000 },
  { month: "Jul", income: 4680000, expense: 3200000 },
];

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  active: "bg-blue-50 text-blue-700",
  partial: "bg-amber-50 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
  overdue: "bg-red-50 text-red-700",
};
function StatusChip({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_COLOR[status] ?? "bg-slate-100 text-slate-600")}>
      {status}
    </span>
  );
}

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

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Chart of Accounts ────────────────────────────────────────────────────────
type CoaNode = {
  code: string; name: string; type: string; balance: number;
  currency?: string; children?: CoaNode[];
};

function CoaRow({ node, depth = 0, expanded, onToggle }: {
  node: CoaNode; depth?: number; expanded: Set<string>;
  onToggle: (code: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.code);
  return (
    <>
      <tr
        className={cn("border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors",
          node.type === "header" ? "bg-slate-50/50" : "")}
        onClick={() => hasChildren && onToggle(node.code)}
      >
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <span className="text-slate-400">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            ) : <span className="w-[14px]" />}
            <span className={cn("text-xs font-mono text-slate-400", depth === 0 && "text-slate-600")}>{node.code}</span>
          </div>
        </td>
        <td className="py-2.5 px-4">
          <span className={cn("text-sm", node.type === "header" ? "font-semibold text-slate-700" : "text-slate-600")}>
            {node.name}
          </span>
        </td>
        <td className="py-2.5 px-4">
          <span className="text-xs text-slate-400 capitalize">{node.type}</span>
        </td>
        <td className="py-2.5 px-4 text-right">
          <span className={cn("text-sm font-medium", node.type === "header" ? "text-slate-800" : "text-slate-600")}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {fmtCurrency(node.balance)}
          </span>
        </td>
        <td className="py-2.5 px-4 text-center">
          {node.type === "detail" && (
            <button className="p-1 hover:bg-slate-100 rounded"><Edit2 size={13} className="text-slate-400" /></button>
          )}
        </td>
      </tr>
      {isExpanded && node.children?.map(child => (
        <CoaRow key={child.code} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
      ))}
    </>
  );
}

function ChartOfAccountsView() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1000", "2000", "3000", "4000", "5000"]));
  const toggle = (code: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Chart of Accounts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Double-entry bookkeeping structure</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Download size={15} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
            <Plus size={15} /> Add Account
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 w-32">Code</th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Account Name</th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 w-24">Type</th>
              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3 w-40">Balance (BDT)</th>
              <th className="text-center text-xs font-medium text-slate-500 px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {COA_TREE.map(node => (
              <CoaRow key={node.code} node={node} expanded={expanded} onToggle={toggle} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Income / Expense shared table view ───────────────────────────────────────
function LedgerTableView({ title, rows, type }: {
  title: string;
  rows: { date: string; ref: string; category: string; description: string; amount: number; method: string; status: string; vendor?: string }[];
  type: "income" | "expense";
}) {
  const total = rows.filter(r => r.status === "confirmed" || r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const pending = rows.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">July 2024</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Filter size={14} /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Download size={14} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
            <Plus size={14} /> Add {type === "income" ? "Income" : "Expense"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Confirmed" value={fmtCurrency(total)} trend={8.4}
          icon={type === "income" ? TrendingUp : TrendingDown}
          color={type === "income" ? "bg-emerald-500" : "bg-red-500"} />
        <KpiCard label="Pending" value={fmtCurrency(pending)} icon={Clock} color="bg-amber-500" />
        <KpiCard label="Transactions" value={String(rows.length)} icon={FileText} color="bg-blue-500" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Date", "Ref #", "Category", "Description", "Amount", "Method", "Status", ""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.ref} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-500">{r.date}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{r.ref}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{r.category}</span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{r.description ?? r.vendor}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtCurrency(r.amount)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.method}</td>
                <td className="px-4 py-3"><StatusChip status={r.status} /></td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-slate-100 rounded"><MoreHorizontal size={14} className="text-slate-400" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Journal Entry ────────────────────────────────────────────────────────────
type JournalLine = { account: string; debit: string; credit: string; narration: string };
function JournalEntryView() {
  const [lines, setLines] = useState<JournalLine[]>([
    { account: "", debit: "", credit: "", narration: "" },
    { account: "", debit: "", credit: "", narration: "" },
  ]);
  const [date, setDate] = useState("2024-07-14");
  const [ref, setRef] = useState("JE-" + String(Math.floor(Math.random() * 900) + 100));

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const updateLine = (i: number, field: keyof JournalLine, val: string) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const RECENT_JE = [
    { ref: "JE-021", date: "Jul 13", desc: "July payroll posting", debit: 480000, status: "posted" },
    { ref: "JE-020", date: "Jul 11", desc: "Hajj advance receipt", debit: 1200000, status: "posted" },
    { ref: "JE-019", date: "Jul 10", desc: "Hotel payment – Makkah", debit: 840000, status: "posted" },
    { ref: "JE-018", date: "Jul 08", desc: "Biman ticket prepayment", debit: 620000, status: "posted" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Journal Entry</h2>
          <p className="text-sm text-slate-500 mt-0.5">Double-entry — debits must equal credits</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reference #</label>
                <input value={ref} onChange={e => setRef(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option>BDT – Bangladeshi Taka</option>
                  <option>USD – US Dollar</option>
                  <option>SAR – Saudi Riyal</option>
                </select>
              </div>
            </div>
            <table className="w-full mb-3">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 pb-2">Account</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-2 w-32">Debit</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-2 w-32">Credit</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-2">Narration</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 pr-3">
                      <select value={line.account} onChange={e => updateLine(i, "account", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none">
                        <option value="">Select account…</option>
                        <option value="1120">1120 – Dutch-Bangla Bank</option>
                        <option value="1210">1210 – Customer Receivables</option>
                        <option value="4100">4100 – Hajj Package Revenue</option>
                        <option value="4200">4200 – Umrah Revenue</option>
                        <option value="5110">5110 – Hajj Permit & Maktab</option>
                        <option value="5210">5210 – Salaries & Wages</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" placeholder="0.00" value={line.debit}
                        onChange={e => updateLine(i, "debit", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right font-mono focus:outline-none" />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" placeholder="0.00" value={line.credit}
                        onChange={e => updateLine(i, "credit", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right font-mono focus:outline-none" />
                    </td>
                    <td className="py-2 pr-3">
                      <input placeholder="Narration…" value={line.narration}
                        onChange={e => updateLine(i, "narration", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none" />
                    </td>
                    <td className="py-2">
                      {lines.length > 2 && (
                        <button onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td className="px-2 py-2 text-xs font-semibold text-slate-600">Totals</td>
                  <td className="px-2 py-2 text-right text-sm font-bold font-mono text-slate-800">
                    {fmtCurrency(totalDebit)}
                  </td>
                  <td className="px-2 py-2 text-right text-sm font-bold font-mono text-slate-800">
                    {fmtCurrency(totalCredit)}
                  </td>
                  <td colSpan={2} className="px-2 py-2">
                    {balanced
                      ? <span className="flex items-center gap-1 text-xs text-emerald-600"><Check size={13} /> Balanced</span>
                      : <span className="flex items-center gap-1 text-xs text-red-500"><AlertTriangle size={13} /> Out of balance by {fmtCurrency(Math.abs(totalDebit - totalCredit))}</span>}
                  </td>
                </tr>
              </tfoot>
            </table>
            <button onClick={() => setLines(prev => [...prev, { account: "", debit: "", credit: "", narration: "" }])}
              className="text-sm text-[#0E6BB8] hover:underline flex items-center gap-1">
              <Plus size={13} /> Add line
            </button>
            <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-slate-100">
              <button className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Save Draft</button>
              <button disabled={!balanced} className={cn("px-5 py-2 text-sm rounded-lg text-white", balanced ? "bg-[#0E6BB8] hover:bg-[#0B5794]" : "bg-slate-300 cursor-not-allowed")}>
                Post Entry
              </button>
            </div>
          </div>
        </div>
        <div>
          <Section title="Recent Journal Entries">
            <div className="space-y-3">
              {RECENT_JE.map(je => (
                <div key={je.ref} className="flex items-start justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div>
                    <p className="text-xs font-mono text-slate-400">{je.ref} · {je.date}</p>
                    <p className="text-sm text-slate-700 mt-0.5">{je.desc}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmtCurrency(je.debit)}
                    </p>
                  </div>
                  <StatusChip status={je.status} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Bank & Cash ──────────────────────────────────────────────────────────────
function BankCashView() {
  const [selectedAccount, setSelectedAccount] = useState("dbbl");
  const account = BANK_ACCOUNTS.find(a => a.id === selectedAccount)!;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bank & Cash Accounts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage all bank and cash positions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
          <Plus size={15} /> Add Account
        </button>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {BANK_ACCOUNTS.map(acc => (
          <button key={acc.id} onClick={() => setSelectedAccount(acc.id)}
            className={cn("text-left p-4 rounded-xl border transition-all",
              selectedAccount === acc.id
                ? "border-[#0E6BB8] bg-[#0E6BB8]/5 ring-1 ring-[#0E6BB8]/20"
                : "border-slate-200 bg-white hover:border-slate-300")}>
            <div className="flex items-center gap-2 mb-2">
              {acc.type === "Cash" ? <Banknote size={16} className="text-emerald-600" /> : <Building2 size={16} className="text-[#0E6BB8]" />}
              <span className="text-xs font-medium text-slate-500">{acc.type}</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-tight">{acc.name}</p>
            <p className="text-sm font-bold text-slate-800 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtCurrency(acc.balance, acc.currency)}
            </p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Section title={`${account.name} – Transactions`} actions={
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <Download size={12} /> Statement
              </button>
            </div>
          }>
            <table className="w-full min-w-[680px] md:min-w-0">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Date", "Description", "Type", "Amount", "Balance", "Ref"].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BANK_TX.map(tx => (
                  <tr key={tx.ref} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 pr-4 text-sm text-slate-500">{tx.date}</td>
                    <td className="py-3 pr-4 text-sm text-slate-700">{tx.desc}</td>
                    <td className="py-3 pr-4">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                        tx.type === "credit" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}>
                        {tx.type === "credit" ? "CR" : "DR"}
                      </span>
                    </td>
                    <td className={cn("py-3 pr-4 text-sm font-semibold", tx.type === "credit" ? "text-emerald-600" : "text-red-500")}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {tx.type === "credit" ? "+" : "−"}{fmtCurrency(tx.amount)}
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700 font-mono">{fmtCurrency(tx.balance)}</td>
                    <td className="py-3 text-xs font-mono text-slate-400">{tx.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Account Details">
            <div className="space-y-3">
              {[
                ["Account Number", account.number],
                ["Branch", account.branch],
                ["Account Type", account.type],
                ["Currency", account.currency],
                ["Last Transaction", account.lastTx],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-700 font-medium font-mono text-xs">{val}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtCurrency(account.balance, account.currency)}
                </p>
              </div>
            </div>
          </Section>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1 py-2.5 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
              <Upload size={14} /> Deposit
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 py-2.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
              <Download size={14} /> Withdraw
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Money Transfer ───────────────────────────────────────────────────────────
function TransferView() {
  const [fromAcc, setFromAcc] = useState("dbbl");
  const [toAcc, setToAcc] = useState("ibbl");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("BDT");

  const RECENT_TRANSFERS = [
    { date: "Jul 12", from: "DBBL Current", to: "IBBL Savings", amount: 1000000, currency: "BDT" as Currency, status: "completed" },
    { date: "Jul 08", from: "DBBL Current", to: "DBBL USD", amount: 5000, currency: "USD" as Currency, status: "completed" },
    { date: "Jul 05", from: "IBBL Savings", to: "Al Rajhi SAR", amount: 20000, currency: "SAR" as Currency, status: "pending" },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Money Transfer</h2>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-5">New Transfer</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">From Account</label>
              <select value={fromAcc} onChange={e => setFromAcc(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {BANK_ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.name} ({fmtCurrency(a.balance, a.currency)})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">To Account</label>
              <select value={toAcc} onChange={e => setToAcc(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {BANK_ACCOUNTS.filter(a => a.id !== fromAcc).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-mono">{CURRENCY_SYMBOL[currency]}</span>
                <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value as Currency)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="BDT">BDT – Bangladeshi Taka</option>
                <option value="USD">USD – US Dollar</option>
                <option value="SAR">SAR – Saudi Riyal</option>
              </select>
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-600 mb-1">Narration / Reference</label>
            <input placeholder="Transfer narration…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6BB8]/20" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
            <button className="px-5 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794] flex items-center gap-2">
              <Send size={14} /> Submit Transfer
            </button>
          </div>
        </div>
        <Section title="Recent Transfers">
          <div className="space-y-4">
            {RECENT_TRANSFERS.map((t, i) => (
              <div key={i} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <StatusChip status={t.status} />
                  <span className="text-xs text-slate-400">{t.date}</span>
                </div>
                <p className="text-xs text-slate-500">{t.from} → {t.to}</p>
                <p className="text-sm font-bold text-slate-800 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtCurrency(t.amount, t.currency)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── Installments ─────────────────────────────────────────────────────────────
function InstallmentsView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Installment Plans</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track all active payment schedules</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
          <Plus size={15} /> New Plan
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Active Plans" value="23" trend={5} icon={Calendar} color="bg-blue-500" />
        <KpiCard label="Collected This Month" value={fmtCurrency(4180000)} trend={12} icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard label="Overdue" value={fmtCurrency(2400000)} trend={-3} icon={AlertTriangle} color="bg-red-500" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Plan ID", "Customer", "Service", "Progress", "Total", "Paid", "Remaining", "Next Due", "Status", ""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INSTALLMENT_PLANS.map(plan => {
              const pct = Math.round((plan.paid / plan.total) * 100);
              return (
                <tr key={plan.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{plan.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{plan.customer}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{plan.service}</td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", plan.status === "completed" ? "bg-emerald-500" : plan.status === "overdue" ? "bg-red-400" : "bg-[#0E6BB8]")}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{pct}%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{plan.paid_n}/{plan.installments} installments</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">{fmtCurrency(plan.total)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-emerald-600">{fmtCurrency(plan.paid)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-red-500">{plan.remaining > 0 ? fmtCurrency(plan.remaining) : "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{plan.next_date}</td>
                  <td className="px-4 py-3"><StatusChip status={plan.status} /></td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-[#0E6BB8] hover:underline">Collect</button>
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

// ─── Supplier Payments ────────────────────────────────────────────────────────
function SupplierPaymentsView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Supplier Payments</h2>
          <p className="text-sm text-slate-500 mt-0.5">Payables to vendors and partners</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
          <Plus size={15} /> Record Payment
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Outstanding" value={fmtCurrency(6200000)} trend={-8} icon={Building2} color="bg-red-500" />
        <KpiCard label="Paid This Month" value={fmtCurrency(3920000)} icon={CheckCircle} color="bg-emerald-500" />
        <KpiCard label="Overdue Invoices" value="2" icon={AlertTriangle} color="bg-amber-500" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Ref", "Vendor", "Invoice #", "Due Date", "Total", "Paid", "Outstanding", "Status", ""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUPPLIER_PAYMENTS.map(sp => (
              <tr key={sp.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{sp.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{sp.vendor}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{sp.invoice}</td>
                <td className={cn("px-4 py-3 text-sm", sp.status === "overdue" ? "text-red-600 font-medium" : "text-slate-500")}>{sp.due}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{fmtCurrency(sp.amount)}</td>
                <td className="px-4 py-3 text-sm font-mono text-emerald-600">{fmtCurrency(sp.paid)}</td>
                <td className="px-4 py-3 text-sm font-mono text-red-500">{sp.remaining > 0 ? fmtCurrency(sp.remaining) : "—"}</td>
                <td className="px-4 py-3"><StatusChip status={sp.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="text-xs text-[#0E6BB8] hover:underline">Pay</button>
                    <span className="text-slate-300">·</span>
                    <button className="text-xs text-slate-400 hover:underline">View</button>
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

// ─── Customer Payments ────────────────────────────────────────────────────────
function CustomerPaymentsView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Customer Payments</h2>
          <p className="text-sm text-slate-500 mt-0.5">Receivables from customers and agencies</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
          <Plus size={15} /> Collect Payment
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Received" value={fmtCurrency(1440000)} trend={14} icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard label="Outstanding" value={fmtCurrency(1283000)} trend={-5} icon={Clock} color="bg-amber-500" />
        <KpiCard label="Transactions" value={String(CUSTOMER_PAYMENTS.length)} icon={Receipt} color="bg-blue-500" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Ref", "Customer", "Booking", "Total", "Received", "Method", "Date", "Status", ""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CUSTOMER_PAYMENTS.map(cp => (
              <tr key={cp.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{cp.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{cp.customer}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{cp.booking}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{fmtCurrency(cp.amount)}</td>
                <td className="px-4 py-3 text-sm font-mono text-emerald-600">{fmtCurrency(cp.received)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{cp.method}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{cp.date}</td>
                <td className="px-4 py-3"><StatusChip status={cp.status} /></td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-slate-100 rounded"><Eye size={13} className="text-slate-400" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payment Gateways ─────────────────────────────────────────────────────────
type GatewayStatus = "active" | "sandbox" | "inactive";
type GatewayCfg = { id: string; name: string; logo: string; status: GatewayStatus; txFee: string; settlement: string; monthlyVol: number; txCount: number; color: string };
const GATEWAYS: GatewayCfg[] = [
  { id: "bkash", name: "bKash", logo: "bK", status: "active", txFee: "1.5%", settlement: "T+1", monthlyVol: 3200000, txCount: 148, color: "#E2136E" },
  { id: "nagad", name: "Nagad", logo: "Na", status: "active", txFee: "1.0%", settlement: "T+0", monthlyVol: 1850000, txCount: 97, color: "#F05A28" },
  { id: "ssl", name: "SSLCommerz", logo: "SSL", status: "active", txFee: "2.5%", settlement: "T+3", monthlyVol: 2100000, txCount: 62, color: "#0065BD" },
  { id: "card", name: "Visa / Mastercard", logo: "V|M", status: "sandbox", txFee: "2.0% + ৳10", settlement: "T+3", monthlyVol: 0, txCount: 0, color: "#1A1F71" },
];

const GATEWAY_STATUS_COLOR: Record<GatewayStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  sandbox: "bg-amber-50 text-amber-700",
  inactive: "bg-slate-100 text-slate-500",
};

function PaymentGatewaysView() {
  const [selected, setSelected] = useState("bkash");
  const gw = GATEWAYS.find(g => g.id === selected)!;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Payment Gateways</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage MFS and card gateway integrations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          <Plus size={14} /> Add Gateway
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {GATEWAYS.map(g => (
          <button key={g.id} onClick={() => setSelected(g.id)}
            className={cn("text-left p-5 rounded-xl border transition-all bg-white",
              selected === g.id ? "border-[#0E6BB8] ring-1 ring-[#0E6BB8]/20" : "border-slate-200 hover:border-slate-300")}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: g.color }}>{g.logo}</div>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", GATEWAY_STATUS_COLOR[g.status])}>{g.status}</span>
            </div>
            <p className="font-semibold text-slate-800">{g.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">Fee: {g.txFee}</p>
            <p className="text-sm font-bold text-slate-800 mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtCurrency(g.monthlyVol)}
            </p>
            <p className="text-xs text-slate-400">{g.txCount} transactions this month</p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: gw.color }}>{gw.logo}</div>
            <div>
              <h3 className="font-semibold text-slate-800">{gw.name} Configuration</h3>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", GATEWAY_STATUS_COLOR[gw.status])}>{gw.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Merchant ID", "BDH-MCHT-00421"],
              ["API Key", "sk_live_••••••••••••••••"],
              ["Webhook URL", "https://api.bdh-travels.com/webhook/payment"],
              ["Settlement Account", "DBBL Current – 1021...234"],
              ["Transaction Fee", gw.txFee],
              ["Settlement Cycle", gw.settlement],
            ].map(([label, val]) => (
              <div key={label}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                <input defaultValue={val} readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-700 font-mono focus:outline-none" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
            <button className="px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">Save Changes</button>
            <button className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Test Connection</button>
            {gw.status === "sandbox" && (
              <button className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 ml-auto">Go Live</button>
            )}
          </div>
        </div>
        <Section title="Quick Stats">
          <div className="space-y-4">
            {[
              ["Monthly Volume", fmtCurrency(gw.monthlyVol)],
              ["Transactions", String(gw.txCount)],
              ["Success Rate", "98.4%"],
              ["Avg. Settlement", gw.settlement],
              ["Disputes", "0"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-800 font-mono">{val}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── Overview / Summary ───────────────────────────────────────────────────────
function AccountsOverview() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Revenue (Jul)" value={fmtCurrency(4680000)} trend={12.4} icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard label="Total Expenses (Jul)" value={fmtCurrency(3200000)} trend={5.2} icon={TrendingDown} color="bg-red-500" />
        <KpiCard label="Net Profit" value={fmtCurrency(1480000)} trend={21.8} icon={BarChart3} color="bg-[#0E6BB8]" />
        <KpiCard label="Receivables Due" value={fmtCurrency(9430000)} trend={-3.1} icon={AlertTriangle} color="bg-amber-500" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Section title="Cash Flow – Last 6 Months">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHLY_CASHFLOW} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0E7C66" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0E7C66" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `৳${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => [fmtCurrency(v), ""]} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#0E7C66" strokeWidth={2} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#EF4444" strokeWidth={2} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Section>
        </div>
        <Section title="Quick Ledger">
          <div className="space-y-3">
            {[
              { label: "Cash & Bank", value: 18250000, color: "text-emerald-600" },
              { label: "Receivables", value: 9430000, color: "text-amber-600" },
              { label: "Payables", value: 8640000, color: "text-red-500" },
              { label: "Revenue (YTD)", value: 42100000, color: "text-emerald-600" },
              { label: "Expenses (YTD)", value: 28400000, color: "text-red-500" },
              { label: "Net Equity", value: 26840000, color: "text-[#0E6BB8]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-600">{label}</span>
                <span className={cn("text-sm font-bold", color)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtCurrency(value)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── Main AccountsModule ──────────────────────────────────────────────────────
export function AccountsModule() {
  const [view, setView] = useState<AccountsView>("chart-of-accounts");
  const groups = [...new Set(NAV_ITEMS.map(n => n.group))];

  const renderView = () => {
    switch (view) {
      case "chart-of-accounts": return <ChartOfAccountsView />;
      case "income": return <LedgerTableView title="Income Ledger" rows={INCOME_DATA} type="income" />;
      case "expense": return <LedgerTableView title="Expense Ledger" rows={EXPENSE_DATA.map(e => ({ ...e, description: e.vendor }))} type="expense" />;
      case "journal": return <JournalEntryView />;
      case "bank-cash": return <BankCashView />;
      case "transfer": return <TransferView />;
      case "installments": return <InstallmentsView />;
      case "supplier-payments": return <SupplierPaymentsView />;
      case "customer-payments": return <CustomerPaymentsView />;
      case "gateways": return <PaymentGatewaysView />;
      default: return <AccountsOverview />;
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      {/* Sub-nav sidebar */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accounts</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
          {groups.map(group => (
            <div key={group} className="mb-1">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{group}</p>
              {NAV_ITEMS.filter(n => n.group === group).map(item => (
                <button key={item.id} onClick={() => setView(item.id)}
                  className={cn("w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                    view === item.id
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
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {renderView()}
        </div>
      </div>
    </div>
  );
}
