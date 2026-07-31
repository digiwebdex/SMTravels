import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { useBranches } from "./bookings";
import type {
  AccountDto, BankAccountDto,
  JournalListResponse, JournalDetail, JournalCreateInput,
  InvoiceListResponse, InvoiceDetail, InvoiceCreateInput,
  PaymentListResponse, PaymentDto, PaymentRecordInput,
  RefundListResponse, RefundCreateInput,
  InstallmentPlanListResponse, InstallmentPlanCreateInput, InstallmentPlanDto,
  LedgerListResponse, ExpenseCreateInput, IncomeCreateInput,
} from "@contracts/finance.contract";

export { useBranches };
const err = (e: Error) => toast.error(e.message || "Something went wrong");
function qs(p: Record<string, string | number | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "" && v !== "all" && v !== "All") s.set(k, String(v));
  return s.toString();
}
export const finKeys = {
  accounts: ["fin", "accounts"] as const,
  banks: ["fin", "banks"] as const,
  journal: (p: unknown) => ["fin", "journal", p] as const,
  journalOne: (id: string) => ["fin", "journalOne", id] as const,
  invoices: (p: unknown) => ["fin", "invoices", p] as const,
  invoice: (id: string) => ["fin", "invoice", id] as const,
  payments: (p: unknown) => ["fin", "payments", p] as const,
  refunds: (p: unknown) => ["fin", "refunds", p] as const,
  plans: (p: unknown) => ["fin", "plans", p] as const,
  income: (p: unknown) => ["fin", "income", p] as const,
  expenses: (p: unknown) => ["fin", "expenses", p] as const,
};

// ── Chart of accounts ─────────────────────────────────────────────────────────
export function useAccounts() {
  return useQuery({ queryKey: finKeys.accounts, queryFn: () => apiFetch<{ data: AccountDto[] }>("/accounts").then((r) => r.data) });
}
/** Build the COA tree the UI renders from the flat account list. */
export interface CoaNode { id: string; code: string; name: string; type: "header" | "detail"; balance: number; currency: string; children: CoaNode[] }
export function buildCoaTree(accounts: AccountDto[]): CoaNode[] {
  const byId = new Map<string, CoaNode>();
  accounts.forEach((a) => byId.set(a.id, { id: a.id, code: a.code, name: a.name, type: a.role === "HEADER" ? "header" : "detail", balance: a.balance, currency: a.currency, children: [] }));
  const roots: CoaNode[] = [];
  accounts.forEach((a) => {
    const node = byId.get(a.id)!;
    if (a.parentId && byId.has(a.parentId)) byId.get(a.parentId)!.children.push(node);
    else roots.push(node);
  });
  const sort = (ns: CoaNode[]) => { ns.sort((x, y) => x.code.localeCompare(y.code)); ns.forEach((n) => sort(n.children)); };
  sort(roots);
  return roots;
}
export function useBankAccounts() {
  return useQuery({ queryKey: finKeys.banks, queryFn: () => apiFetch<{ data: BankAccountDto[] }>("/bank-accounts").then((r) => r.data) });
}

// ── Journal (immutable ledger) ────────────────────────────────────────────────
export function useJournal(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: finKeys.journal(params), queryFn: () => apiFetch<JournalListResponse>(`/journal?${qs(params)}`), placeholderData: (p) => p });
}
export function useJournalEntry(id: string | null) {
  return useQuery({ queryKey: finKeys.journalOne(id ?? ""), queryFn: () => apiFetch<JournalDetail>(`/journal/${id}`), enabled: !!id });
}
export function useCreateJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: JournalCreateInput) => apiFetch<JournalDetail>("/journal", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (j) => { qc.invalidateQueries({ queryKey: ["fin", "journal"] }); toast.success(`Journal ${j.ref} ${j.status === "POSTED" ? "posted" : "saved"}`); },
    onError: err,
  });
}
export function usePostJournal() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiFetch<JournalDetail>(`/journal/${id}/post`, { method: "POST" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin", "journal"] }); toast.success("Entry posted"); }, onError: err });
}
export function useReverseJournal() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiFetch<JournalDetail>(`/journal/${id}/reverse`, { method: "POST" }), onSuccess: (m) => { qc.invalidateQueries({ queryKey: ["fin", "journal"] }); toast.success(`Reversed — mirror ${m.ref} created`); }, onError: err });
}

// ── Invoices ──────────────────────────────────────────────────────────────────
export function useInvoices(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: finKeys.invoices(params), queryFn: () => apiFetch<InvoiceListResponse>(`/invoices?${qs(params)}`), placeholderData: (p) => p });
}
export function useInvoice(id: string | null) {
  return useQuery({ queryKey: finKeys.invoice(id ?? ""), queryFn: () => apiFetch<InvoiceDetail>(`/invoices/${id}`), enabled: !!id });
}
export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: InvoiceCreateInput) => apiFetch<InvoiceDetail>("/invoices", { method: "POST", body: JSON.stringify(input) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin", "invoices"] }); toast.success("Draft invoice created"); }, onError: err });
}
export function useCreateInvoiceFromBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      apiFetch<InvoiceDetail>(`/invoices/from-booking/${bookingId}`, { method: "POST", body: JSON.stringify({ issue: true }) }),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ["fin", "invoices"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(inv.invoiceNo ? `Invoice ${inv.invoiceNo} issued` : "Invoice created");
    },
    onError: err,
  });
}
export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiFetch<InvoiceDetail>(`/invoices/${id}/issue`, { method: "POST" }), onSuccess: (inv) => { qc.invalidateQueries({ queryKey: ["fin", "invoices"] }); qc.invalidateQueries({ queryKey: finKeys.invoice(inv.id) }); toast.success(`Issued ${inv.invoiceNo}`); }, onError: err });
}
export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiFetch<InvoiceDetail>(`/invoices/${id}/cancel`, { method: "POST" }), onSuccess: (inv) => { qc.invalidateQueries({ queryKey: ["fin", "invoices"] }); qc.invalidateQueries({ queryKey: finKeys.invoice(inv.id) }); toast.success("Invoice cancelled"); }, onError: err });
}
export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/invoices/${id}`, { method: "DELETE" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin", "invoices"] }); toast.success("Draft deleted"); }, onError: err });
}

// ── Payments ──────────────────────────────────────────────────────────────────
export function usePayments(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: finKeys.payments(params), queryFn: () => apiFetch<PaymentListResponse>(`/payments?${qs(params)}`), placeholderData: (p) => p });
}
export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentRecordInput) => apiFetch<{ payment: PaymentDto; invoiceStatus: string | null }>("/payments", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["fin", "invoices"] });
      qc.invalidateQueries({ queryKey: ["fin", "invoice"] });
      qc.invalidateQueries({ queryKey: ["fin", "payments"] });
      qc.invalidateQueries({ queryKey: ["fin", "refunds"] });
      qc.invalidateQueries({ queryKey: ["fin", "plans"] });
      qc.invalidateQueries({ queryKey: ["fin", "income"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success(`Payment recorded — receipt ${r.payment.receiptNo}`);
    },
    onError: err,
  });
}
export function useReversePayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiFetch<PaymentDto>(`/payments/${id}/reverse`, { method: "POST" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin", "invoices"] }); qc.invalidateQueries({ queryKey: ["fin", "invoice"] }); qc.invalidateQueries({ queryKey: ["fin", "payments"] }); toast.success("Payment reversed"); }, onError: err });
}

// ── Refunds ───────────────────────────────────────────────────────────────────
export function useRefunds(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: finKeys.refunds(params), queryFn: () => apiFetch<RefundListResponse>(`/refunds?${qs(params)}`), placeholderData: (p) => p });
}
export function useCreateRefund() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: RefundCreateInput) => apiFetch("/refunds", { method: "POST", body: JSON.stringify(input) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin", "refunds"] }); toast.success("Refund requested"); }, onError: err });
}
export function useUpdateRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/refunds/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin", "refunds"] });
      qc.invalidateQueries({ queryKey: ["fin", "invoices"] });
      qc.invalidateQueries({ queryKey: ["fin", "payments"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Refund updated");
    },
    onError: err,
  });
}

// ── Installment plans ─────────────────────────────────────────────────────────
export function useInstallmentPlans(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: finKeys.plans(params), queryFn: () => apiFetch<InstallmentPlanListResponse>(`/installment-plans?${qs(params)}`), placeholderData: (p) => p });
}
export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: InstallmentPlanCreateInput) => apiFetch<InstallmentPlanDto>("/installment-plans", { method: "POST", body: JSON.stringify(input) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin", "plans"] }); toast.success("Installment plan created"); }, onError: err });
}

// ── Income / Expense ──────────────────────────────────────────────────────────
export function useIncome(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: finKeys.income(params), queryFn: () => apiFetch<LedgerListResponse>(`/income?${qs(params)}`), placeholderData: (p) => p });
}
export function useExpenses(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: finKeys.expenses(params), queryFn: () => apiFetch<LedgerListResponse>(`/expenses?${qs(params)}`), placeholderData: (p) => p });
}
export function useCreateIncome() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: IncomeCreateInput) => apiFetch("/income", { method: "POST", body: JSON.stringify(input) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin", "income"] }); toast.success("Income recorded"); }, onError: err });
}
export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: ExpenseCreateInput) => apiFetch("/expenses", { method: "POST", body: JSON.stringify(input) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin", "expenses"] }); toast.success("Expense recorded"); }, onError: err });
}

export type { InvoiceDetail, JournalDetail, AccountDto, BankAccountDto };
