/**
 * Sales (Quotations → Sales Orders) contract.
 *
 * A quotation is a DRAFT price OFFER — it NEVER posts to the ledger. "Sales order"
 * is the ACCEPTED status (no separate model). Conversion creates a DRAFT Booking
 * through the existing revenue flow (no bookingNo / seat / quota until the existing
 * confirm step). Discounts reuse the existing PromoCode master. Money invariant
 * mirrors Invoice: total = subtotal − discountAmount, baseAmount = total × rate,
 * BDT ⇒ rate 1.
 */
import { z } from "zod";

export const quotationStatusSchema = z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"]);
export const serviceTypeSchema = z.enum(["HAJJ", "UMRAH", "VISA", "AIR_TICKET", "MANPOWER", "TOUR", "HOTEL"]);
const currencySchema = z.enum(["BDT", "USD", "SAR"]);
const optStr = z.string().trim().max(500).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

export const quotationLineSchema = z.object({
  description: z.string().trim().min(1).max(300),
  serviceType: serviceTypeSchema.optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
});
export type QuotationLineInput = z.infer<typeof quotationLineSchema>;

export const quotationCreateSchema = z.object({
  customerId: z.string().trim().optional(),
  leadId: z.string().trim().optional(),
  serviceType: serviceTypeSchema,
  validUntil: optStr,
  currency: currencySchema.default("BDT"),
  exchangeRate: z.coerce.number().positive().optional(),
  promoCodeId: z.string().trim().optional(),   // reuse PromoCode; drives the discount
  discountAmount: z.coerce.number().min(0).optional(), // manual discount when no promo
  notes: optStr,
  lines: z.array(quotationLineSchema).min(1),
}).refine((v) => v.customerId || v.leadId, { message: "A quotation needs a customer or a lead", path: ["customerId"] });
export type QuotationCreateInput = z.infer<typeof quotationCreateSchema>;

export const quotationUpdateSchema = z.object({
  serviceType: serviceTypeSchema.optional(),
  validUntil: optStr,
  currency: currencySchema.optional(),
  exchangeRate: z.coerce.number().positive().optional(),
  promoCodeId: z.string().trim().optional().or(z.literal("")), // "" clears the promo
  discountAmount: z.coerce.number().min(0).optional(),
  notes: optStr,
  status: quotationStatusSchema.optional(),   // DRAFT↔SENT↔ACCEPTED↔REJECTED/EXPIRED (never CONVERTED here)
  lines: z.array(quotationLineSchema).min(1).optional(),
});
export type QuotationUpdateInput = z.infer<typeof quotationUpdateSchema>;

export const quotationListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: quotationStatusSchema.optional(),
  serviceType: serviceTypeSchema.optional(),
  branchId: z.string().trim().optional(),
});
export type QuotationListQuery = z.infer<typeof quotationListQuerySchema>;

// ── DTOs ──────────────────────────────────────────────────────────────────────
export interface QuotationLineDto {
  id: string; description: string; serviceType: string | null;
  quantity: number; unitPrice: number; amount: number;
}
export interface QuotationListItem {
  id: string;
  quoteNo: string;
  branchId: string;
  branchName: string | null;
  customerId: string | null;
  leadId: string | null;
  recipientName: string | null; // resolved customer or lead name
  recipientType: "customer" | "lead" | null;
  serviceType: string;
  status: string;
  validUntil: string | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  currency: string;
  exchangeRate: number;
  baseAmount: number;
  linesCount: number;
  bookingId: string | null;
  createdAt: string;
}
export interface QuotationListResponse {
  data: QuotationListItem[];
  stats: { total: number; byStatus: Record<string, number>; totalValue: number };
}
export interface QuotationDetail extends QuotationListItem {
  promoCodeId: string | null;
  promoCode: string | null;
  notes: string | null;
  lines: QuotationLineDto[];
}
export interface ConvertResult {
  quotationId: string;
  bookingId: string;
  customerId: string;
  convertedLead: boolean; // true if a lead was converted to a customer in the same tx
}
