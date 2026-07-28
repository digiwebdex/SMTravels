/**
 * Suppliers (vendor) ADMIN contract. Admin view + CRUD over the existing
 * Supplier / SupplierService / SupplierInvoice / SupplierPayable models.
 *
 * Branch scope: Supplier is GLOBAL master data (shared vendors — no branchId on
 * the model). The branch-scoped figures are the PAYABLES (SupplierPayable.branchId):
 * each branch tracks what IT owes. Services + invoices have no branchId either, so
 * their counts/totals are global. This is the schema's design, not an invention.
 *
 * Writes here are SUPPLIER + SERVICE master data only (legit editable data). The
 * payable schedule is READ-ONLY — actual payments run through the Finance flow
 * (payment.service). There is NO payment/payable-mutating endpoint in this module.
 */
import { z } from "zod";

export const supplierStatusSchema = z.enum(["PENDING", "VERIFIED", "SUSPENDED"]);

export const supplierListQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  status: supplierStatusSchema.optional(),
  branchId: z.string().trim().optional(), // global roles only: scope the payable figures to one branch
});
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>;

const trimmedOpt = z.string().trim().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

export const supplierCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  category: trimmedOpt,
  contactPerson: trimmedOpt,
  phone: trimmedOpt,
  email: z.string().trim().email().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  website: trimmedOpt,
  tradeLicense: trimmedOpt,
  tin: trimmedOpt,
  address: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  bankName: trimmedOpt,
  accountNo: trimmedOpt,
  routingNo: trimmedOpt,
  rating: z.number().min(0).max(5).optional(),
  status: supplierStatusSchema.optional(),
});
export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;

export const supplierUpdateSchema = supplierCreateSchema.partial();
export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;

export const supplierServiceCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  category: trimmedOpt,
  price: z.number().min(0).optional(),
  currency: z.enum(["BDT", "USD", "SAR"]).optional(),
  priceLabel: trimmedOpt,
  active: z.boolean().optional(),
});
export type SupplierServiceCreateInput = z.infer<typeof supplierServiceCreateSchema>;

export const supplierServiceUpdateSchema = supplierServiceCreateSchema.partial();
export type SupplierServiceUpdateInput = z.infer<typeof supplierServiceUpdateSchema>;

// ── DTOs ──────────────────────────────────────────────────────────────────────
export interface SupplierListItem {
  id: string;
  supplierCode: string;
  name: string;
  category: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  rating: number | null;
  servicesCount: number;      // global
  invoicesCount: number;      // global
  totalInvoiced: number;      // global (Σ invoice amount)
  payablesCount: number;      // branch-scoped
  outstanding: number;        // branch-scoped Σ max(0, amount - paidAmount)
  createdAt: string;
}
export interface SupplierListResponse {
  data: SupplierListItem[];
  branchScope: string | null; // the branch the payable figures are scoped to (null = all)
  stats: { total: number; byStatus: Record<string, number>; totalOutstanding: number; totalInvoiced: number };
}

export interface SupplierServiceRow {
  id: string; name: string; category: string | null;
  price: number | null; currency: string; priceLabel: string | null;
  active: boolean; bookingsCount: number; rating: number | null;
}
export interface SupplierInvoiceRow {
  id: string; invoiceNo: string; description: string | null;
  amount: number; currency: string; status: string;
  issueDate: string | null; dueDate: string | null;
}
export interface SupplierPayableRow {
  id: string; branchId: string; supplierInvoiceId: string | null;
  amount: number; paidAmount: number; dueAmount: number;
  currency: string; status: string; dueDate: string | null; createdAt: string;
}

export interface SupplierDetail extends SupplierListItem {
  website: string | null;
  tradeLicense: string | null;
  tin: string | null;
  address: string | null;
  bankName: string | null;
  accountNo: string | null;
  routingNo: string | null;
  services: SupplierServiceRow[];
  invoices: SupplierInvoiceRow[];
  payables: SupplierPayableRow[]; // branch-scoped, READ-ONLY schedule
}
