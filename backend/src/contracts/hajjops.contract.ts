/**
 * Shared Hajj/Umrah Operations contract (Phase 2). zod schemas + inferred DTO
 * types; depends only on `zod` so the frontend can import the types.
 *
 * Covers government quota, group-departure batches (seat inventory), pilgrim
 * government registration (encrypted identifiers), booking→capacity assignment,
 * and passport-expiry alerts. Branch scoping + capacity concurrency are enforced
 * in the service layer.
 */
import { z } from "zod";

const optStr = z.string().trim().optional();
export const serviceTypeSchema = z.enum(["HAJJ", "UMRAH"]);
export const quotaTypeSchema = z.enum(["GOVT", "PRIVATE"]);
export const batchStatusSchema = z.enum(["OPEN", "CLOSED", "DEPARTED", "CANCELLED"]);
export const registrationStatusSchema = z.enum(["PENDING", "PRE_REGISTERED", "REGISTERED", "CONFIRMED", "CANCELLED"]);

// ── Quota ───────────────────────────────────────────────────────────────────
export const quotaCreateSchema = z.object({
  serviceType: serviceTypeSchema.default("HAJJ"),
  season: z.string().trim().min(1),
  label: z.string().trim().min(1),
  quotaType: quotaTypeSchema.default("GOVT"),
  allotted: z.coerce.number().int().min(0),
  branchId: optStr, // global roles may target a branch; null = company-wide
  notes: optStr,
});
export type QuotaCreateInput = z.infer<typeof quotaCreateSchema>;
export const quotaUpdateSchema = z.object({
  label: optStr,
  allotted: z.coerce.number().int().min(0).optional(),
  quotaType: quotaTypeSchema.optional(),
  notes: optStr,
});
export type QuotaUpdateInput = z.infer<typeof quotaUpdateSchema>;
export const quotaListQuerySchema = z.object({
  serviceType: serviceTypeSchema.optional(),
  season: optStr,
  branchId: optStr,
});

// ── Departure batch ─────────────────────────────────────────────────────────
export const batchCreateSchema = z.object({
  serviceType: serviceTypeSchema.default("HAJJ"),
  name: z.string().trim().min(1),
  season: optStr,
  packageId: optStr,
  departureDate: optStr,
  returnDate: optStr,
  totalSeats: z.coerce.number().int().min(0),
  muallimId: optStr, // link to an ops-roster MUALLIM; snapshots name/no onto the batch
  muallimName: optStr,
  muallimNo: optStr,
  maktab: optStr,
  transport: optStr,
  branchId: optStr,
  notes: optStr,
});
export type BatchCreateInput = z.infer<typeof batchCreateSchema>;
export const batchUpdateSchema = z.object({
  name: optStr,
  season: optStr,
  packageId: optStr,
  departureDate: optStr,
  returnDate: optStr,
  totalSeats: z.coerce.number().int().min(0).optional(),
  muallimId: optStr, // set = link to a roster MUALLIM (snapshots name/no); "" = clear the link
  muallimName: optStr,
  muallimNo: optStr,
  maktab: optStr,
  transport: optStr,
  status: batchStatusSchema.optional(),
  notes: optStr,
});
export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>;
export const batchListQuerySchema = z.object({
  serviceType: serviceTypeSchema.optional(),
  season: optStr,
  status: batchStatusSchema.optional(),
  branchId: optStr,
});

// ── Booking → capacity assignment ───────────────────────────────────────────
export const assignCapacitySchema = z.object({
  bookingId: z.string().min(1),
  batchId: z.string().nullable().optional(),   // null clears, undefined leaves unchanged
  quotaId: z.string().nullable().optional(),
});
export type AssignCapacityInput = z.infer<typeof assignCapacitySchema>;

// ── Pilgrim government registration ─────────────────────────────────────────
export const registrationCreateSchema = z.object({
  pilgrimName: z.string().trim().min(1),
  serviceType: serviceTypeSchema.default("HAJJ"),
  season: z.string().trim().min(1),
  quotaType: quotaTypeSchema.default("GOVT"),
  bookingId: optStr,
  travelerId: optStr,
  customerId: optStr,
  preRegSerial: optStr, // encrypted at rest, searchable via blind index
  pid: optStr,
  trackingNo: optStr,
  status: registrationStatusSchema.default("PENDING"),
  registeredAt: optStr,
  branchId: optStr,
  notes: optStr,
});
export type RegistrationCreateInput = z.infer<typeof registrationCreateSchema>;
export const registrationUpdateSchema = registrationCreateSchema.partial().omit({ branchId: true });
export type RegistrationUpdateInput = z.infer<typeof registrationUpdateSchema>;
export const registrationListQuerySchema = z.object({
  q: optStr, // exact match on preRegSerial / PID / trackingNo (blind index) OR name contains
  serviceType: serviceTypeSchema.optional(),
  season: optStr,
  status: registrationStatusSchema.optional(),
  branchId: optStr,
});

// ── Response DTOs ───────────────────────────────────────────────────────────
export interface QuotaDto {
  id: string; branchId: string | null; branchName: string | null;
  serviceType: string; season: string; label: string; quotaType: string;
  allotted: number; filled: number; remaining: number; notes: string | null; createdAt: string;
}
export interface BatchBookingDto {
  id: string; bookingNo: string | null; customerName: string | null; travelersCount: number; status: string;
}
export interface BatchDto {
  id: string; branchId: string; branchName: string | null; code: string; serviceType: string;
  season: string | null; packageId: string | null; name: string;
  departureDate: string | null; returnDate: string | null;
  totalSeats: number; filledSeats: number; remainingSeats: number;
  muallimId: string | null; muallimName: string | null; muallimNo: string | null; maktab: string | null; transport: string | null;
  status: string; notes: string | null; createdAt: string;
}
export interface BatchDetail extends BatchDto { bookings: BatchBookingDto[] }
export interface RegistrationDto {
  id: string; branchId: string; branchName: string | null; pilgrimName: string;
  serviceType: string; season: string; quotaType: string;
  bookingId: string | null; bookingNo: string | null; travelerId: string | null; customerId: string | null;
  preRegSerial: string | null; pid: string | null; trackingNo: string | null;
  status: string; registeredAt: string | null; notes: string | null; createdAt: string;
}
export interface PassportAlertDto {
  bookingId: string; bookingNo: string | null; branchName: string | null; serviceType: string;
  departureDate: string | null;
  travelerId: string; travelerName: string; passportNo: string | null; passportExpiry: string | null;
  daysToExpiry: number | null;      // from today
  monthsValidAtDeparture: number | null; // passport validity margin at departure (< 6 = alert)
  severity: "expired" | "critical" | "warning"; // expired now / invalid at departure / expiring soon
}
export interface OpsListResponse<T> { data: T[] }
