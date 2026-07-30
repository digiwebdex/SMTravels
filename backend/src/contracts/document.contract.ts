/**
 * Shared Documents contract. Same rules as the other contracts: zod schemas +
 * inferred DTO types, depends only on `zod` (no @prisma import) so the
 * frontend can import the types.
 *
 * Upload requests are multipart/form-data (field "file" + these metadata
 * fields), so everything arrives as strings — hence the coercions.
 */
import { z } from "zod";

// ── enums (mirror prisma/schema.prisma) ──────────────────────────────────────
// ⚠️ KEEP IN SYNC with frontend/src/app/lib/documentTypes.ts — the frontend
// must import the VALUE from there (no @contracts vite alias; only type-only
// imports of this file erase safely). Guarded by
// frontend/scripts/check-contracts-imports.mjs (pre-commit).
export const DOCUMENT_TYPES = [
  "PASSPORT", "PHOTO", "VISA", "NID", "MEDICAL", "VACCINATION",
  "AIR_TICKET", "HOTEL", "INSURANCE", "CONTRACT", "LICENSE", "MAHRAM_CERT", "OTHER",
] as const;
export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
export type DocumentTypeDto = z.infer<typeof documentTypeSchema>;

export const DOCUMENT_STATUSES = [
  "MISSING", "UPLOADED", "PENDING", "VERIFIED", "EXPIRING", "EXPIRED", "FAILED", "NOT_REQUIRED",
] as const;
export const documentStatusSchema = z.enum(DOCUMENT_STATUSES);
export type DocumentStatusDto = z.infer<typeof documentStatusSchema>;

const optStr = z.string().trim().min(1).optional();
const optDate = z.coerce.date().optional();

// ── upload (ERP) ─────────────────────────────────────────────────────────────
// Exactly ONE owner id — the service derives ownerType from which one is set.
export const documentUploadSchema = z
  .object({
    type: documentTypeSchema.default("OTHER"),
    name: optStr, // falls back to the original filename
    bookingId: optStr,
    travelerId: optStr,
    customerId: optStr,
    supplierId: optStr,
    expiryAt: optDate,
    required: z.coerce.boolean().optional(),
  })
  .refine(
    (v) => [v.bookingId, v.travelerId, v.customerId, v.supplierId].filter(Boolean).length === 1,
    { message: "Provide exactly one of bookingId, travelerId, customerId, supplierId" },
  );
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

// ── upload (customer portal) ─────────────────────────────────────────────────
// The owner is ALWAYS the session's own customer; an optional bookingId may
// attach the file to one of their own bookings (verified server-side).
export const portalDocumentUploadSchema = z.object({
  type: documentTypeSchema.default("OTHER"),
  name: optStr,
  bookingId: optStr,
  expiryAt: optDate,
});
export type PortalDocumentUploadInput = z.infer<typeof portalDocumentUploadSchema>;

// ── list (ERP) ───────────────────────────────────────────────────────────────
export const documentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  q: optStr,
  type: documentTypeSchema.optional(),
  status: documentStatusSchema.optional(),
  bookingId: optStr,
  travelerId: optStr,
  customerId: optStr,
  supplierId: optStr,
});
export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;

// ── DTOs ─────────────────────────────────────────────────────────────────────
export interface DocumentDto {
  id: string;
  name: string;
  type: DocumentTypeDto;
  status: DocumentStatusDto;
  required: boolean;
  ownerType: "BOOKING" | "TRAVELER" | "CUSTOMER" | "SUPPLIER" | "COMPANY";
  bookingId: string | null;
  bookingNo: string | null;
  travelerId: string | null;
  customerId: string | null;
  supplierId: string | null;
  ownerLabel: string | null; // booking no / traveler / customer / supplier name
  mimeType: string | null;
  sizeBytes: number | null;
  hasFile: boolean;
  expiryAt: string | null; // date-only ISO
  createdAt: string;
}

export interface DocumentListResult {
  data: DocumentDto[];
  total: number;
  page: number;
  pageSize: number;
}

// ── status update (ERP verify / reject) ──────────────────────────────────────
/** Allowed targets when transitioning from UPLOADED or PENDING. */
export const documentStatusUpdateSchema = z.object({
  status: z.enum(["VERIFIED", "FAILED"]),
});
export type DocumentStatusUpdateInput = z.infer<typeof documentStatusUpdateSchema>;

/** OCR extraction result returned by POST /documents/:id/ocr */
export interface DocumentOcrResultDto {
  id: string;
  name: string;
  ocrStatus: string | null;
  ocrConfidence: number | null;
  ocrName: string | null;
  ocrPassportNo: string | null;
  ocrDob: string | null;
  ocrExpiry: string | null;
  ocrNationality: string | null;
}
