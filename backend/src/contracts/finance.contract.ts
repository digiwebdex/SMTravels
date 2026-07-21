/**
 * Shared Finance contract (Accounts + Invoices & Payments). zod + inferred DTOs,
 * depends only on `zod`. Scoping is split:
 *   - COMPANY-WIDE (RBAC only, no branchWhere): Account (chart of accounts),
 *     BankAccount — no branchId in the schema.
 *   - BRANCH-SCOPED: Invoice, Payment, Receipt, JournalEntry, Refund, Expense,
 *     Income, InstallmentPlan — all carry branchId.
 * Immutable ledger (Payment/JournalEntry/JournalLine/Receipt): create + reverse
 * only, never update/delete.
 */
import { z } from "zod";
import { currencySchema, type CurrencyDto } from "./booking.contract";

// ── enums ─────────────────────────────────────────────────────────────────────
export const accountClassSchema = z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);
export const accountRoleSchema = z.enum(["HEADER", "DETAIL"]);
export const normalBalanceSchema = z.enum(["DEBIT", "CREDIT"]);
export const bankAccountTypeSchema = z.enum(["CURRENT", "SAVINGS", "PETTY_CASH", "CASH"]);
export const journalStatusSchema = z.enum(["DRAFT", "POSTED"]);
export const invoiceStatusSchema = z.enum(["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]);
export const paymentMethodSchema = z.enum(["CASH", "BANK_TRANSFER", "BKASH", "NAGAD", "ROCKET", "CHEQUE", "CARD", "SSLCOMMERZ"]);
export const paymentDirectionSchema = z.enum(["IN", "OUT"]);
export const refundStatusSchema = z.enum(["PENDING", "APPROVED", "PROCESSED", "REJECTED"]);

const optStr = z.string().trim().optional();
const dateStr = z.string().min(1);
const moneyPos = z.coerce.number().nonnegative();

// ── Chart of Accounts (company-wide) ──────────────────────────────────────────
export const accountCreateSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  parentId: optStr,
  accountClass: accountClassSchema,
  role: accountRoleSchema.optional(),
  normalBalance: normalBalanceSchema.optional(),
  currency: currencySchema.optional(),
  active: z.boolean().optional(),
});
export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
export const accountUpdateSchema = accountCreateSchema.partial().omit({ code: true });
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;

// ── Bank accounts (company-wide) ──────────────────────────────────────────────
export const bankAccountCreateSchema = z.object({
  name: z.string().trim().min(1),
  bankName: optStr,
  type: bankAccountTypeSchema.optional(),
  accountNumber: optStr,
  iban: optStr,
  branchName: optStr,
  currency: currencySchema.optional(),
  coaAccountId: optStr,
  active: z.boolean().optional(),
  openingBalance: moneyPos.optional(),
});
export type BankAccountCreateInput = z.infer<typeof bankAccountCreateSchema>;
export const bankAccountUpdateSchema = bankAccountCreateSchema.partial();
export type BankAccountUpdateInput = z.infer<typeof bankAccountUpdateSchema>;

// ── Journal (branch-scoped, immutable ledger) ─────────────────────────────────
export const journalLineSchema = z.object({
  accountId: z.string().min(1),
  debit: moneyPos.optional(),
  credit: moneyPos.optional(),
  narration: optStr,
});
export const journalCreateSchema = z.object({
  branchId: optStr,
  date: dateStr,
  description: optStr,
  currency: currencySchema.optional(),
  status: journalStatusSchema.optional(), // DRAFT (default) or POSTED (post-on-create)
  relatedType: optStr,
  relatedId: optStr,
  lines: z.array(journalLineSchema).min(1),
});
export type JournalCreateInput = z.infer<typeof journalCreateSchema>;

export const journalListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(15),
  sort: z.enum(["date", "ref"]).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  q: optStr,
  status: journalStatusSchema.optional(),
  branchId: optStr,
  dateFrom: optStr,
  dateTo: optStr,
});
export type JournalListQuery = z.infer<typeof journalListQuerySchema>;

// ── Invoices (branch-scoped) ──────────────────────────────────────────────────
export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1),
  qty: z.coerce.number().int().min(1).optional(),
  unitPrice: moneyPos,
  bookingId: optStr,
});
export const invoiceCreateSchema = z.object({
  branchId: optStr,
  customerId: z.string().min(1),
  bookingId: optStr,
  dueDate: dateStr.optional(),
  currency: currencySchema.optional(),
  exchangeRate: z.coerce.number().positive().optional(),
  discountAmount: moneyPos.optional(),
  taxRate: moneyPos.optional(),
  notes: optStr,
  items: z.array(invoiceItemSchema).min(1),
});
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export const invoiceUpdateSchema = invoiceCreateSchema.partial().omit({ branchId: true, customerId: true });
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;

export const invoiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(10),
  sort: z.enum(["date", "amount", "due"]).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  q: optStr,
  status: invoiceStatusSchema.optional(),
  customerId: optStr,
  branchId: optStr,
  dateFrom: optStr,
  dateTo: optStr,
});
export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;

// ── Payments (branch-scoped, immutable ledger) ────────────────────────────────
export const paymentRecordSchema = z.object({
  invoiceId: optStr,
  bookingId: optStr,
  customerId: optStr,
  branchId: optStr,
  amount: z.coerce.number().positive(),
  currency: currencySchema.optional(),
  exchangeRate: z.coerce.number().positive().optional(),
  method: paymentMethodSchema,
  reference: optStr,
  paidAt: optStr,
  // gateway hook point: bKash/Nagad/SSLCommerz go here in the integrations phase.
  gateway: optStr,
});
export type PaymentRecordInput = z.infer<typeof paymentRecordSchema>;

export const paymentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(15),
  q: optStr,
  invoiceId: optStr,
  customerId: optStr,
  branchId: optStr,
  method: paymentMethodSchema.optional(),
});
export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;

// ── Refunds (branch-scoped) ───────────────────────────────────────────────────
export const refundCreateSchema = z.object({
  branchId: optStr,
  invoiceId: optStr,
  customerId: optStr,
  bookingId: optStr,
  reason: optStr,
  amount: z.coerce.number().positive(),
  currency: currencySchema.optional(),
  exchangeRate: z.coerce.number().positive().optional(),
  method: paymentMethodSchema.optional(),
});
export type RefundCreateInput = z.infer<typeof refundCreateSchema>;
export const refundStatusUpdateSchema = z.object({ status: refundStatusSchema });

// ── Installment plans (branch-scoped) ─────────────────────────────────────────
export const installmentPlanCreateSchema = z.object({
  branchId: optStr,
  invoiceId: optStr,
  bookingId: optStr,
  customerId: z.string().min(1),
  currency: currencySchema.optional(),
  downAmount: moneyPos.optional(),
  installments: z.array(z.object({ label: optStr, amountDue: z.coerce.number().positive(), dueDate: dateStr })).min(1),
});
export type InstallmentPlanCreateInput = z.infer<typeof installmentPlanCreateSchema>;

// ── Expense / Income (branch-scoped) ──────────────────────────────────────────
const ledgerEntryFields = {
  branchId: optStr,
  category: z.string().trim().min(1),
  description: optStr,
  accountId: optStr,
  amount: z.coerce.number().positive(),
  currency: currencySchema.optional(),
  exchangeRate: z.coerce.number().positive().optional(),
  method: paymentMethodSchema.optional(),
  date: dateStr,
};
export const expenseCreateSchema = z.object({ ...ledgerEntryFields, vendorName: optStr, supplierId: optStr });
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export const incomeCreateSchema = z.object({ ...ledgerEntryFields, payerName: optStr });
export type IncomeCreateInput = z.infer<typeof incomeCreateSchema>;

export const ledgerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(15),
  q: optStr,
  category: optStr,
  branchId: optStr,
  dateFrom: optStr,
  dateTo: optStr,
});
export type LedgerListQuery = z.infer<typeof ledgerListQuerySchema>;

// ══ response DTOs ═════════════════════════════════════════════════════════════
export interface AccountDto {
  id: string; code: string; name: string; parentId: string | null;
  accountClass: string; role: string; normalBalance: string; currency: CurrencyDto;
  balance: number; active: boolean;
}
export interface BankAccountDto {
  id: string; name: string; bankName: string | null; type: string; accountNumber: string | null;
  iban: string | null; branchName: string | null; currency: CurrencyDto; balance: number; coaAccountId: string | null; active: boolean;
}

export interface JournalLineDto { id: string; accountId: string; accountCode: string; accountName: string; debit: number; credit: number; narration: string | null }
export interface JournalListItem {
  id: string; ref: string; fiscalYear: number; branchId: string; branchName: string | null; date: string;
  description: string | null; currency: CurrencyDto; status: string; totalDebit: number; totalCredit: number;
  isReversed: boolean; reversalOfId: string | null; reversedById: string | null; postedAt: string | null; createdAt: string;
}
export interface JournalDetail extends JournalListItem { relatedType: string | null; relatedId: string | null; lines: JournalLineDto[] }
export interface JournalListResponse { data: JournalListItem[]; page: number; pageSize: number; total: number; totalPages: number; stats: { total: number; posted: number; drafts: number } }

export interface InvoiceItemDto { id: string; description: string; qty: number; unitPrice: number; amount: number }
export interface InvoiceListItem {
  id: string; invoiceNo: string | null; branchId: string; branchName: string | null;
  customerId: string; customerName: string | null; customerPhone: string | null; customerEmail: string | null;
  bookingId: string | null; issueDate: string | null; dueDate: string | null; currency: CurrencyDto;
  subtotal: number; discountAmount: number; taxAmount: number; total: number; paidAmount: number; dueAmount: number;
  status: string; createdAt: string;
}
export interface InvoiceDetail extends InvoiceListItem {
  fiscalYear: number; taxRate: number; baseAmount: number; exchangeRate: number; notes: string | null;
  items: InvoiceItemDto[];
  payments: { id: string; paymentNo: string | null; amount: number; method: string; reference: string | null; status: string; isReversed: boolean; paidAt: string; receiptNo: string | null }[];
  refunds: { id: string; refundNo: string | null; amount: number; reason: string | null; status: string; createdAt: string }[];
}
export interface InvoiceListResponse { data: InvoiceListItem[]; page: number; pageSize: number; total: number; totalPages: number; stats: { total: number; totalBilled: number; totalPaid: number; totalDue: number; overdue: number } }

export interface PaymentDto {
  id: string; paymentNo: string | null; direction: string; branchId: string; invoiceId: string | null; invoiceNo: string | null;
  customerName: string | null; amount: number; currency: CurrencyDto; baseAmount: number; method: string; gateway: string | null;
  reference: string | null; status: string; isReversed: boolean; reversalOfId: string | null; receiptNo: string | null; paidAt: string; createdAt: string;
}
export interface PaymentListResponse { data: PaymentDto[]; page: number; pageSize: number; total: number; totalPages: number; stats: { total: number; totalIn: number; totalOut: number } }

export interface ReceiptDto { id: string; receiptNo: string; paymentId: string; amount: number; currency: CurrencyDto; issuedAt: string }

export interface RefundDto { id: string; refundNo: string | null; branchId: string; invoiceId: string | null; invoiceNo: string | null; customerName: string | null; reason: string | null; amount: number; currency: CurrencyDto; method: string | null; status: string; createdAt: string }
export interface RefundListResponse { data: RefundDto[]; page: number; pageSize: number; total: number; totalPages: number }

export interface InstallmentDto { id: string; number: number; label: string | null; amountDue: number; paidAmount: number; dueDate: string; paidDate: string | null; status: string }
export interface InstallmentPlanDto { id: string; branchId: string; invoiceId: string | null; bookingId: string | null; customerId: string; customerName: string | null; total: number; currency: CurrencyDto; downAmount: number; status: string; installments: InstallmentDto[]; createdAt: string }
export interface InstallmentPlanListResponse { data: InstallmentPlanDto[]; page: number; pageSize: number; total: number; totalPages: number }

export interface LedgerEntryDto { id: string; ref: string | null; branchId: string; branchName: string | null; category: string; description: string | null; party: string | null; amount: number; currency: CurrencyDto; baseAmount: number; method: string | null; status: string; date: string; createdAt: string }
export interface LedgerListResponse { data: LedgerEntryDto[]; page: number; pageSize: number; total: number; totalPages: number; stats: { total: number; totalAmount: number } }
