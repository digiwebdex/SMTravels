/**
 * Custom Package Builder (Module 7) contract. Inquiry → CustomPackage(+items) →
 * Quote → Accept → Booking. Totals are server-computed; frontend totals are ignored.
 */
import { z } from "zod";

const page = { page: z.coerce.number().int().positive().optional(), pageSize: z.coerce.number().int().positive().max(100).optional() };
const CURR = ["BDT", "USD", "SAR"] as const;

// ─── Inquiry ─────────────────────────────────────────────────────────────────
export const INQUIRY_STATUSES = ["NEW", "REVIEWING", "PACKAGE_BUILDING", "QUOTED", "APPROVED", "BOOKED", "CANCELLED"] as const;
export const inquiryListQuerySchema = z.object({ q: z.string().trim().optional(), status: z.string().trim().optional(), ...page });
export type InquiryListQuery = z.infer<typeof inquiryListQuerySchema>;
export const inquiryCreateSchema = z.object({
  customerId: z.string().trim().optional(),
  contactName: z.string().trim().min(1).max(160),
  contactPhone: z.string().trim().max(40).optional(),
  contactEmail: z.string().trim().max(160).optional(),
  travelType: z.string().trim().max(40).optional(),
  destination: z.string().trim().max(120).optional(),
  departureDate: z.string().min(8).optional(), returnDate: z.string().min(8).optional(),
  adults: z.coerce.number().int().min(0).optional(), children: z.coerce.number().int().min(0).optional(), infants: z.coerce.number().int().min(0).optional(),
  preferredHotel: z.string().trim().max(160).optional(), hotelNights: z.coerce.number().int().min(0).optional(),
  roomRequirements: z.string().trim().max(200).optional(), flightPreference: z.string().trim().max(160).optional(),
  visaRequired: z.boolean().optional(), transportRequired: z.boolean().optional(), foodRequired: z.boolean().optional(),
  ziyaratRequired: z.boolean().optional(), muallimRequired: z.boolean().optional(),
  specialRequirements: z.string().trim().max(1000).optional(), notes: z.string().trim().max(1000).optional(),
});
export type InquiryCreateInput = z.infer<typeof inquiryCreateSchema>;
export const inquiryUpdateSchema = inquiryCreateSchema.partial();
export type InquiryUpdateInput = z.infer<typeof inquiryUpdateSchema>;
export const inquiryTransitionSchema = z.object({ status: z.enum(INQUIRY_STATUSES) });
export type InquiryTransitionInput = z.infer<typeof inquiryTransitionSchema>;
export interface InquiryDto {
  id: string; code: string; customerId: string | null; contactName: string; contactPhone: string | null; contactEmail: string | null;
  travelType: string | null; destination: string | null; departureDate: string | null; returnDate: string | null;
  adults: number; children: number; infants: number; preferredHotel: string | null; hotelNights: number | null;
  roomRequirements: string | null; flightPreference: string | null; visaRequired: boolean; transportRequired: boolean;
  foodRequired: boolean; ziyaratRequired: boolean; muallimRequired: boolean; specialRequirements: string | null; notes: string | null;
  status: string; customPackageId: string | null; createdAt: string;
}
export interface InquiryListResponse { items: InquiryDto[]; total: number; page: number; pageSize: number }

// ─── Custom Package ──────────────────────────────────────────────────────────
export const PACKAGE_STATUSES = ["DRAFT", "QUOTED", "ACCEPTED", "REJECTED", "EXPIRED", "BOOKED"] as const;
export const ITEM_SERVICE_TYPES = ["HAJJ", "UMRAH", "VISA", "AIR_TICKET", "HOTEL", "TRANSPORT", "FOOD", "ZIYARAT", "MUALLIM", "OTHER"] as const;
export const packageListQuerySchema = z.object({ q: z.string().trim().optional(), status: z.string().trim().optional(), customerId: z.string().trim().optional(), ...page });
export type PackageListQuery = z.infer<typeof packageListQuerySchema>;
export const packageCreateSchema = z.object({
  inquiryId: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
  name: z.string().trim().min(1).max(200),
  travelType: z.string().trim().max(40).optional(),
  departureDate: z.string().min(8).optional(), returnDate: z.string().min(8).optional(),
  currency: z.enum(CURR).optional(),
  markup: z.coerce.number().min(0).optional(), discount: z.coerce.number().min(0).optional(),
  validityDate: z.string().min(8).optional(), terms: z.string().trim().max(2000).optional(), notes: z.string().trim().max(2000).optional(),
});
export type PackageCreateInput = z.infer<typeof packageCreateSchema>;
export const packageUpdateSchema = packageCreateSchema.omit({ inquiryId: true }).partial();
export type PackageUpdateInput = z.infer<typeof packageUpdateSchema>;
export const packageTransitionSchema = z.object({ status: z.enum(PACKAGE_STATUSES), reason: z.string().trim().max(500).optional() });
export type PackageTransitionInput = z.infer<typeof packageTransitionSchema>;
export const itemCreateSchema = z.object({
  serviceType: z.enum(ITEM_SERVICE_TYPES),
  description: z.string().trim().max(300).optional(),
  quantity: z.coerce.number().int().positive().max(100000),
  unitPrice: z.coerce.number().min(0),
  currency: z.enum(CURR).optional(),
  supplier: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(500).optional(),
});
export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export const itemUpdateSchema = itemCreateSchema.partial();
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
export interface CustomPackageItemDto {
  id: string; serviceType: string; description: string | null; quantity: number; unitPrice: string;
  currency: string; subtotal: string; supplier: string | null; notes: string | null;
}
export interface CustomPackageDto {
  id: string; code: string; inquiryId: string | null; customerId: string | null; customerName: string | null;
  name: string; travelType: string | null; departureDate: string | null; returnDate: string | null; currency: string;
  markup: string; discount: string; subtotal: string; grandTotal: string; validityDate: string | null;
  terms: string | null; notes: string | null; status: string; bookingId: string | null; itemCount: number; createdAt: string;
}
export interface CustomPackageDetailDto extends CustomPackageDto { items: CustomPackageItemDto[] }
export interface CustomPackageListResponse { items: CustomPackageDto[]; total: number; page: number; pageSize: number }
