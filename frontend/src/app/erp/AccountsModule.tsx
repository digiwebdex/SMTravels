import React, { useState } from "react";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, Search, Filter, Download, RefreshCw, ChevronRight,
  ChevronDown, Building2, CreditCard, Banknote, ArrowLeftRight,
  Calendar, CheckCircle, Clock, AlertTriangle, MoreHorizontal,
  FileText, Edit2, Trash2, X, Check, Globe, Layers, BarChart3,
  Eye, Send, Receipt,
} from "lucide-react";
import { cn, fmtPrice } from "../lib/utils";
import { SkeletonTable, ErrorBanner, EmptyState } from "../lib/ds";
import {
  useAccounts, buildCoaTree, useBankAccounts, useIncome, useExpenses,
  useJournal, useCreateJournal, useReverseJournal, usePostJournal,
  useInstallmentPlans, usePayments,
  useCreateIncome, useCreateExpense, useCreateAccount, useUpdateAccount,
} from "../hooks/finance";
import { Loader2 } from "lucide-react";
import { AiInsightCard } from "../design-system";
import { Drawer, Field } from "./crm/ui";
import { exportCsv } from "../lib/csv";
import type { AccountDto } from "@contracts/finance.contract";

const fieldCls = "w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)]";

// ── Add Income / Expense form ─────────────────────────────────────────────────
const PAY_METHODS = ["CASH", "BANK_TRANSFER", "BKASH", "NAGAD", "ROCKET", "CHEQUE", "CARD", "SSLCOMMERZ"] as const;
function LedgerFormDrawer({ type, onClose }: { type: "income" | "expense"; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ category: "", amount: "", date: today, description: "", party: "", method: "CASH" });
  const createIncome = useCreateIncome();
  const createExpense = useCreateExpense();
  const busy = createIncome.isPending || createExpense.isPending;
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.category.trim() || !(Number(f.amount) > 0) || !f.date) { return; }
    const base = { category: f.category.trim(), amount: Number(f.amount), date: f.date, description: f.description.trim() || undefined, method: f.method as (typeof PAY_METHODS)[number] };
    const done = { onSuccess: onClose };
    if (type === "income") createIncome.mutate({ ...base, payerName: f.party.trim() || undefined }, done);
    else createExpense.mutate({ ...base, vendorName: f.party.trim() || undefined }, done);
  };
  return (
    <Drawer open onClose={onClose} title={type === "income" ? "Add Income" : "Add Expense"} subtitle="Record a ledger entry"
      footer={<div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg text-slate-600">Cancel</button><button onClick={submit} disabled={busy} className="px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg font-semibold disabled:opacity-50">{busy ? "Saving…" : "Save"}</button></div>}>
      <div className="flex flex-col gap-3">
        <Field label="Category" required><input className={fieldCls} value={f.category} onChange={(e) => set("category", e.target.value)} placeholder={type === "income" ? "e.g. Package sale" : "e.g. Office rent"} /></Field>
        <Field label="Amount (৳)" required><input type="number" min="0" className={fieldCls} value={f.amount} onChange={(e) => set("amount", e.target.value)} /></Field>
        <Field label="Date" required><input type="date" className={fieldCls} value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label={type === "income" ? "Payer name" : "Vendor name"}><input className={fieldCls} value={f.party} onChange={(e) => set("party", e.target.value)} /></Field>
        <Field label="Method"><select className={fieldCls} value={f.method} onChange={(e) => set("method", e.target.value)}>{PAY_METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}</select></Field>
        <Field label="Description"><input className={fieldCls} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
      </div>
    </Drawer>
  );
}

// ── Add Account (chart of accounts) form ──────────────────────────────────────
const ACCOUNT_CLASSES = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] as const;
function AccountFormDrawer({ accounts, account, onClose }: { accounts: AccountDto[]; account?: AccountDto; onClose: () => void }) {
  const editing = !!account;
  const [f, setF] = useState({
    code: account?.code ?? "", name: account?.name ?? "",
    accountClass: account?.accountClass ?? "ASSET", parentId: account?.parentId ?? "", role: account?.role ?? "DETAIL",
  });
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const busy = create.isPending || update.isPending;
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.code.trim() || !f.name.trim()) { return; }
    const common = {
      name: f.name.trim(),
      accountClass: f.accountClass as (typeof ACCOUNT_CLASSES)[number],
      role: f.role as "HEADER" | "DETAIL",
      parentId: f.parentId || undefined,
    };
    if (editing) update.mutate({ id: account!.id, input: common }, { onSuccess: onClose });
    else create.mutate({ code: f.code.trim(), ...common }, { onSuccess: onClose });
  };
  const headers = accounts.filter((a) => a.role === "HEADER" && a.id !== account?.id);
  return (
    <Drawer open onClose={onClose} title={editing ? "Edit Account" : "Add Account"} subtitle={editing ? "Update chart-of-accounts entry" : "New chart-of-accounts entry"}
      footer={<div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg text-slate-600">Cancel</button><button onClick={submit} disabled={busy} className="px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg font-semibold disabled:opacity-50">{busy ? "Saving…" : "Save"}</button></div>}>
      <div className="flex flex-col gap-3">
        <Field label="Code" required><input className={fieldCls} value={f.code} disabled={editing} onChange={(e) => set("code", e.target.value)} placeholder="e.g. 1210" /></Field>
        <Field label="Account name" required><input className={fieldCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Class" required><select className={fieldCls} value={f.accountClass} onChange={(e) => set("accountClass", e.target.value)}>{ACCOUNT_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        <Field label="Type"><select className={fieldCls} value={f.role} onChange={(e) => set("role", e.target.value)}><option value="DETAIL">Detail</option><option value="HEADER">Header</option></select></Field>
        <Field label="Parent account"><select className={fieldCls} value={f.parentId} onChange={(e) => set("parentId", e.target.value)}><option value="">— none —</option>{headers.map((h) => <option key={h.id} value={h.id}>{h.code} · {h.name}</option>)}</select></Field>
      </div>
    </Drawer>
  );
}

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

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  active: "bg-blue-50 text-blue-700",
  partial: "bg-amber-50 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
  overdue: "bg-red-50 text-red-700",
  posted: "bg-emerald-50 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  reversed: "bg-red-50 text-red-700",
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

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
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
  id: string; code: string; name: string; type: string; balance: number;
  currency?: string; children?: CoaNode[];
};

function CoaRow({ node, depth = 0, expanded, onToggle, onEdit }: {
  node: CoaNode; depth?: number; expanded: Set<string>;
  onToggle: (code: string) => void; onEdit: (id: string) => void;
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
            <button onClick={(e) => { e.stopPropagation(); onEdit(node.id); }} title="Edit account"
              className="p-1 rounded hover:bg-slate-100 cursor-pointer"><Edit2 size={13} className="text-slate-500" /></button>
          )}
        </td>
      </tr>
      {isExpanded && node.children?.map(child => (
        <CoaRow key={child.code} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} onEdit={onEdit} />
      ))}
    </>
  );
}

function ChartOfAccountsView() {
  const { data: accounts, isLoading, isError, error, refetch } = useAccounts();
  const tree = buildCoaTree(accounts ?? []);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1000", "2000", "3000", "4000", "5000"]));
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const toggle = (code: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };
  const detailCount = (accounts ?? []).filter((a) => a.role !== "HEADER").length;
  return (
    <div className="space-y-5">
      <AiInsightCard title="AI Finance Tips" collapsedByDefault>
        <ul className="text-xs space-y-1.5 list-disc pl-4">
          <li>{detailCount} active detail account{detailCount === 1 ? "" : "s"} in the chart of accounts.</li>
          <li>Reconcile bank and cash accounts regularly to keep balances accurate.</li>
        </ul>
      </AiInsightCard>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Chart of Accounts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Double-entry bookkeeping structure</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCsv("chart-of-accounts.csv", (accounts ?? []).map((a) => ({ Code: a.code, Name: a.name, Class: a.accountClass, Role: a.role, Balance: a.balance })))}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg font-semibold hover:bg-[#14588F] cursor-pointer">
            <Plus size={15} /> Add Account
          </button>
        </div>
      </div>
      {addOpen && <AccountFormDrawer accounts={accounts ?? []} onClose={() => setAddOpen(false)} />}
      {editId && <AccountFormDrawer accounts={accounts ?? []} account={(accounts ?? []).find((a) => a.id === editId)} onClose={() => setEditId(null)} />}
      {isError ? (
        <div className="p-2"><ErrorBanner message={(error as Error)?.message || "Failed to load accounts."} onRetry={() => refetch()} /></div>
      ) : isLoading ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4"><SkeletonTable rows={8} cols={4} /></div>
      ) : (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 w-32">Code</th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Account Name</th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 w-24">Type</th>
              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3 w-40">Balance (BDT)</th>
              <th className="text-center text-xs font-medium text-slate-500 px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {tree.map(node => (
              <CoaRow key={node.code} node={node} expanded={expanded} onToggle={toggle} onEdit={setEditId} />
            ))}
          </tbody>
        </table>
        {tree.length === 0 && <EmptyState variant="no-data" title="No accounts yet" desc="Add accounts to build your chart of accounts." />}
      </div>
      )}
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
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{rows.length} entries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCsv(`${type}.csv`, rows)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
            <Download size={14} /> Export
          </button>
          <button onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg font-semibold hover:bg-[#14588F] cursor-pointer">
            <Plus size={14} /> Add {type === "income" ? "Income" : "Expense"}
          </button>
        </div>
      </div>
      {formOpen && <LedgerFormDrawer type={type} onClose={() => setFormOpen(false)} />}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Confirmed" value={fmtCurrency(total)}
          icon={type === "income" ? TrendingUp : TrendingDown}
          color={type === "income" ? "bg-emerald-500" : "bg-red-500"} />
        <KpiCard label="Pending" value={fmtCurrency(pending)} icon={Clock} color="bg-amber-500" />
        <KpiCard label="Transactions" value={String(rows.length)} icon={FileText} color="bg-blue-500" />
      </div>
      {rows.length === 0 ? (
        <EmptyState variant="no-data" title={`No ${type === "income" ? "income" : "expense"} entries`} desc={`${type === "income" ? "Income" : "Expense"} entries will appear here once recorded.`} />
      ) : (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
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
                  <button disabled title="More actions are not available in this build"
                    className="p-1 rounded opacity-60 cursor-not-allowed"><MoreHorizontal size={14} className="text-[#9CA3AF]" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [ref, setRef] = useState("");

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const { data: accounts } = useAccounts();
  const detailAccounts = (accounts ?? []).filter(a => a.role === "DETAIL");
  const create = useCreateJournal();
  const reverse = useReverseJournal();
  const post = usePostJournal();
  const { data: recent } = useJournal({ pageSize: 6 });

  const submit = async (status: "DRAFT" | "POSTED") => {
    const payload = {
      date, status,
      lines: lines.filter(l => l.account).map(l => ({ accountId: l.account, debit: l.debit ? Number(l.debit) : undefined, credit: l.credit ? Number(l.credit) : undefined, narration: l.narration || undefined })),
    };
    try { await create.mutateAsync(payload); setLines([{ account: "", debit: "", credit: "", narration: "" }, { account: "", debit: "", credit: "", narration: "" }]); } catch { /* toast */ }
  };

  const updateLine = (i: number, field: keyof JournalLine, val: string) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

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
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reference #</label>
                <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Auto-generated on save"
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
                <select className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
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
                        className="w-full border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none">
                        <option value="">Select account…</option>
                        {detailAccounts.map(a => (
                          <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" placeholder="0.00" value={line.debit}
                        onChange={e => updateLine(i, "debit", e.target.value)}
                        className="w-full border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm text-right font-mono focus:outline-none" />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" placeholder="0.00" value={line.credit}
                        onChange={e => updateLine(i, "credit", e.target.value)}
                        className="w-full border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm text-right font-mono focus:outline-none" />
                    </td>
                    <td className="py-2 pr-3">
                      <input placeholder="Narration…" value={line.narration}
                        onChange={e => updateLine(i, "narration", e.target.value)}
                        className="w-full border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none" />
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
              className="text-sm text-[#1B75BC] hover:underline flex items-center gap-1">
              <Plus size={13} /> Add line
            </button>
            <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-slate-100">
              <button onClick={() => submit("DRAFT")} disabled={create.isPending}
                className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50">Save Draft</button>
              <button onClick={() => submit("POSTED")} disabled={!balanced || create.isPending}
                className={cn("px-5 py-2 text-sm rounded-lg text-white flex items-center gap-2", balanced && !create.isPending ? "bg-[#1B75BC] hover:bg-[#14588F]" : "bg-slate-300 cursor-not-allowed")}>
                {create.isPending && <Loader2 size={14} className="animate-spin" />} Post Entry
              </button>
            </div>
          </div>
        </div>
        <div>
          <Section title="Recent Journal Entries">
            <div className="space-y-3">
              {(recent?.data ?? []).length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">No journal entries yet.</p>
              )}
              {(recent?.data ?? []).map(je => {
                const canReverse = je.status === "POSTED" && !je.isReversed && !je.reversalOfId;
                return (
                  <div key={je.id} className="flex items-start justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-slate-400">{je.ref} · {je.date}</p>
                      <p className="text-sm text-slate-700 mt-0.5 truncate">{je.description || "—"}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmtCurrency(je.totalDebit)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 pl-2">
                      <StatusChip status={je.isReversed ? "reversed" : je.status.toLowerCase()} />
                      {canReverse && (
                        <button onClick={() => reverse.mutate(je.id)} disabled={reverse.isPending}
                          className="text-[10px] text-red-500 hover:underline disabled:opacity-50">Reverse</button>
                      )}
                      {je.status === "DRAFT" && !je.isReversed && (
                        <button onClick={() => post.mutate(je.id)} disabled={post.isPending}
                          className="text-[10px] text-[#1B75BC] hover:underline disabled:opacity-50">Post</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Bank & Cash ──────────────────────────────────────────────────────────────
function BankCashView() {
  const { data: banks, isLoading, error } = useBankAccounts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const accounts = banks ?? [];
  const account = accounts.find(a => a.id === selectedId) ?? accounts[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bank & Cash Accounts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage all bank and cash positions</p>
        </div>
        <button disabled title="Add Account is not available in this build"
          className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-200 text-[#9CA3AF] rounded-lg opacity-60 cursor-not-allowed">
          <Plus size={15} /> Add Account
        </button>
      </div>

      {isLoading && <SkeletonTable rows={3} />}
      {error && <ErrorBanner message={(error as Error).message} />}
      {!isLoading && !error && accounts.length === 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-10 text-center text-sm text-slate-400">No bank or cash accounts yet.</div>
      )}

      {account && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {accounts.map(acc => {
              const isCash = acc.type.toUpperCase() === "CASH";
              return (
                <button key={acc.id} onClick={() => setSelectedId(acc.id)}
                  className={cn("text-left p-4 rounded-xl border transition-all",
                    account.id === acc.id
                      ? "border-[#1B75BC] bg-[#1B75BC]/5 ring-1 ring-[#1B75BC]/20"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-slate-300")}>
                  <div className="flex items-center gap-2 mb-2">
                    {isCash ? <Banknote size={16} className="text-emerald-600" /> : <Building2 size={16} className="text-[#1B75BC]" />}
                    <span className="text-xs font-medium text-slate-500 capitalize">{acc.type.toLowerCase()}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-tight">{acc.name}</p>
                  <p className="text-sm font-bold text-slate-800 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtCurrency(acc.balance, acc.currency)}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <Section title={`${account.name} – Transactions`}>
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-400">Account transaction feed is derived from posted journal lines.</p>
                  <p className="text-xs text-slate-400 mt-1">Post entries against this account to see movements here.</p>
                </div>
              </Section>
            </div>
            <div className="space-y-4">
              <Section title="Account Details">
                <div className="space-y-3">
                  {([
                    ["Account Number", account.accountNumber ?? "—"],
                    ["Bank", account.bankName ?? "—"],
                    ["Branch", account.branchName ?? "—"],
                    ["Account Type", account.type],
                    ["Currency", String(account.currency)],
                    ["Status", account.active ? "Active" : "Inactive"],
                  ] as [string, string][]).map(([label, val]) => (
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Money Transfer ───────────────────────────────────────────────────────────
function TransferView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Money Transfer</h2>
        <p className="text-sm text-slate-500 mt-0.5">Move funds between bank and cash accounts</p>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState
          variant="coming-soon"
          title="Inter-account transfers"
          desc="Recording transfers between bank and cash accounts is planned for a later release. Until then, post a manual journal entry to move funds between accounts."
        />
      </div>
    </div>
  );
}

// ─── Installments ─────────────────────────────────────────────────────────────
function InstallmentsView() {
  const { data, isLoading, isError, error, refetch } = useInstallmentPlans({ pageSize: 100 });

  const plans = (data?.data ?? []).map(p => {
    const paid = p.installments.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const paidN = p.installments.filter(i => (i.status || "").toUpperCase() === "PAID" || (i.paidAmount || 0) >= (i.amountDue || 0)).length;
    const nextDue = p.installments
      .filter(i => (i.status || "").toUpperCase() !== "PAID" && (i.paidAmount || 0) < (i.amountDue || 0))
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))[0];
    return {
      id: p.id,
      customer: p.customerName ?? "—",
      reference: p.invoiceId ? "Invoice" : p.bookingId ? "Booking" : "—",
      total: p.total,
      paid,
      remaining: Math.max(0, p.total - paid),
      installments: p.installments.length,
      paidN,
      nextDate: nextDue?.dueDate ? nextDue.dueDate.slice(0, 10) : "—",
      status: (p.status || "").toLowerCase(),
    };
  });

  const activeCount = plans.filter(p => p.status !== "completed" && p.status !== "cancelled").length;
  const totalCollected = plans.reduce((s, p) => s + p.paid, 0);
  const totalOutstanding = plans.reduce((s, p) => s + p.remaining, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Installment Plans</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track all active payment schedules</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Active Plans" value={String(activeCount)} icon={Calendar} color="bg-blue-500" />
        <KpiCard label="Total Collected" value={fmtCurrency(totalCollected)} icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard label="Outstanding" value={fmtCurrency(totalOutstanding)} icon={AlertTriangle} color="bg-red-500" />
      </div>
      {isError ? (
        <ErrorBanner message={(error as Error)?.message || "Failed to load installment plans."} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4"><SkeletonTable rows={6} cols={8} /></div>
      ) : plans.length === 0 ? (
        <EmptyState variant="no-data" title="No installment plans" desc="Installment plans will appear here once created for invoices or bookings." />
      ) : (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
              {["Plan ID", "Customer", "Reference", "Progress", "Total", "Paid", "Remaining", "Next Due", "Status"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map(plan => {
              const pct = plan.total > 0 ? Math.round((plan.paid / plan.total) * 100) : 0;
              return (
                <tr key={plan.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{plan.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{plan.customer}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{plan.reference}</td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", plan.status === "completed" ? "bg-emerald-500" : plan.status === "overdue" ? "bg-red-400" : "bg-[#1B75BC]")}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{pct}%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{plan.paidN}/{plan.installments} installments</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">{fmtCurrency(plan.total)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-emerald-600">{fmtCurrency(plan.paid)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-red-500">{plan.remaining > 0 ? fmtCurrency(plan.remaining) : "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{plan.nextDate}</td>
                  <td className="px-4 py-3"><StatusChip status={plan.status} /></td>
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

// ─── Supplier Payments ────────────────────────────────────────────────────────
// No ERP payables/supplier-payment ledger endpoint exists (only /suppliers CRUD),
// so there is nothing to wire — honest "coming soon" rather than fabricated data.
function SupplierPaymentsView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Supplier Payments</h2>
        <p className="text-sm text-slate-500 mt-0.5">Payables to vendors and partners</p>
      </div>
      <EmptyState
        variant="coming-soon"
        title="Supplier payments"
        desc="A payables ledger for vendors and partners is planned for a later release. Supplier records are available under the Suppliers module."
      />
    </div>
  );
}

// ─── Customer Payments ────────────────────────────────────────────────────────
function CustomerPaymentsView() {
  const { data, isLoading, isError, error, refetch } = usePayments({ direction: "IN", pageSize: 100 });

  const rows = (data?.data ?? []).map(p => ({
    id: p.id,
    ref: p.paymentNo ?? p.receiptNo ?? p.id.slice(0, 8),
    customer: p.customerName ?? "—",
    invoice: p.invoiceNo ?? "—",
    amount: p.amount,
    method: p.method || "—",
    date: (p.paidAt || p.createdAt || "").slice(0, 10),
    status: p.isReversed ? "reversed" : (p.status || "").toLowerCase(),
  }));

  const totalReceived = data?.stats?.totalIn ?? rows.reduce((s, r) => s + r.amount, 0);
  const reversedCount = (data?.data ?? []).filter(p => p.isReversed).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Customer Payments</h2>
        <p className="text-sm text-slate-500 mt-0.5">Receivables from customers and agencies</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Received" value={fmtCurrency(totalReceived)} icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard label="Transactions" value={String(data?.total ?? rows.length)} icon={Receipt} color="bg-blue-500" />
        <KpiCard label="Reversed" value={String(reversedCount)} icon={Clock} color="bg-amber-500" />
      </div>
      {isError ? (
        <ErrorBanner message={(error as Error)?.message || "Failed to load customer payments."} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4"><SkeletonTable rows={6} cols={7} /></div>
      ) : rows.length === 0 ? (
        <EmptyState variant="no-data" title="No customer payments" desc="Incoming payments recorded against invoices will appear here." />
      ) : (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
              {["Ref", "Customer", "Invoice", "Amount", "Method", "Date", "Status"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(cp => (
              <tr key={cp.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{cp.ref}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{cp.customer}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{cp.invoice}</td>
                <td className="px-4 py-3 text-sm font-mono text-emerald-600">{fmtCurrency(cp.amount)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{cp.method}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{cp.date}</td>
                <td className="px-4 py-3"><StatusChip status={cp.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

// ─── Payment Gateways ─────────────────────────────────────────────────────────
function PaymentGatewaysView() {
  return (
    <div className="space-y-5">
      <EmptyState
        variant="coming-soon"
        title="Online payment gateways"
        desc="Payments are recorded manually with a reference number in the Finance module. Live gateway integration (bKash/Nagad/SSLCommerz) is planned for a later release."
      />
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
        <KpiCard label="Net Profit" value={fmtCurrency(1480000)} trend={21.8} icon={BarChart3} color="bg-[#1B75BC]" />
        <KpiCard label="Receivables Due" value={fmtCurrency(9430000)} trend={-3.1} icon={AlertTriangle} color="bg-amber-500" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Section title="Cash Flow – Last 6 Months">
            <EmptyState variant="no-data" title="No cash flow data" desc="Cash flow trends will appear here once income and expense entries are recorded." />
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
              { label: "Net Equity", value: 26840000, color: "text-[#1B75BC]" },
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
// Real income/expense ledgers → the existing LedgerTableView.
function IncomeLedgerView() {
  const { data, isLoading, isError, error, refetch } = useIncome({ pageSize: 100 });
  if (isError) return <ErrorBanner message={(error as Error)?.message || "Failed to load income."} onRetry={() => refetch()} />;
  if (isLoading) return <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4"><SkeletonTable rows={8} cols={6} /></div>;
  const rows = (data?.data ?? []).map(r => ({ date: (r.date || "").slice(0, 10), ref: r.ref ?? "—", category: r.category, description: r.description ?? r.party ?? "", amount: r.amount, method: r.method ?? "—", status: (r.status || "").toLowerCase() }));
  return <LedgerTableView title="Income Ledger" rows={rows} type="income" />;
}
function ExpenseLedgerView() {
  const { data, isLoading, isError, error, refetch } = useExpenses({ pageSize: 100 });
  if (isError) return <ErrorBanner message={(error as Error)?.message || "Failed to load expenses."} onRetry={() => refetch()} />;
  if (isLoading) return <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4"><SkeletonTable rows={8} cols={6} /></div>;
  const rows = (data?.data ?? []).map(r => ({ date: (r.date || "").slice(0, 10), ref: r.ref ?? "—", category: r.category, description: r.description ?? "", vendor: r.party ?? "", amount: r.amount, method: r.method ?? "—", status: (r.status || "").toLowerCase() }));
  return <LedgerTableView title="Expense Ledger" rows={rows} type="expense" />;
}

export function AccountsModule() {
  const [view, setView] = useState<AccountsView>("chart-of-accounts");
  const groups = [...new Set(NAV_ITEMS.map(n => n.group))];

  const renderView = () => {
    switch (view) {
      case "chart-of-accounts": return <ChartOfAccountsView />;
      case "income": return <IncomeLedgerView />;
      case "expense": return <ExpenseLedgerView />;
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
      <div className="w-56 flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
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
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {renderView()}
        </div>
      </div>
    </div>
  );
}
