/**
 * OCR contracts — passport scan review draft + Apply persistence.
 * Type-only safe for frontend imports (no Prisma).
 */
import { z } from "zod";

export interface PassportFields {
  fullName: string | null;
  passportNo: string | null;
  dateOfBirth: string | null; // yyyy-mm-dd
  expiryDate: string | null;  // yyyy-mm-dd
  dateOfIssue: string | null;
  nationality: string | null;
  gender: "MALE" | "FEMALE" | null;
  issueCountry: string | null;
  mrz: string | null;
}

export interface OcrResult {
  provider: "mock" | "cloud";
  confidence: number;         // 0..1
  fields: PassportFields;
  warning: string | null;
  /** Flat aliases (legacy / debugging) */
  fullText?: string;
  passportNumber?: string | null;
  fullName?: string | null;
  nationality?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  dateOfIssue?: string | null;
  dateOfExpiry?: string | null;
  placeOfBirth?: string | null;
  mrz?: string | null;
  issueCountry?: string | null;
}

export const ocrApplySchema = z.object({
  target: z.enum(["customer", "traveler", "visa", "booking"]),
  fields: z.record(z.unknown()),
  correctedFields: z.record(z.string()).optional(),
  documentId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  travelerId: z.string().min(1).optional(),
  bookingId: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
  phone: z.string().min(5).optional(),
  /** Default true for target=customer. Set false to only return draft. */
  createCustomer: z.boolean().optional(),
  persist: z.boolean().optional().default(true),
});
export type OcrApplyInput = z.infer<typeof ocrApplySchema>;

export const ocrCorrectSchema = z.object({
  fields: z.record(z.unknown()),
});
export type OcrCorrectInput = z.infer<typeof ocrCorrectSchema>;

export interface OcrApplyResult {
  draft: Record<string, unknown>;
  persisted: boolean;
  createdCustomer: boolean;
  updatedCustomer: boolean;
  updatedTraveler: boolean;
  customerId: string | null;
  travelerId: string | null;
  bookingId: string | null;
  documentId: string | null;
  confidence: number;
  fields: {
    name: string | null;
    passportNo: string | null;
    dateOfBirth: string | null;
    dateOfExpiry: string | null;
    nationality: string | null;
    gender: string | null;
    issueCountry: string | null;
    mrz: string | null;
  };
}

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
  ocrGender?: string | null;
  ocrIssueCountry?: string | null;
  ocrMrz?: string | null;
}

export interface DocumentOcrDetailDto extends DocumentOcrResultDto {
  type: string;
  status: string;
  hasFile: boolean;
  mimeType: string | null;
  sizeBytes: number | null;
  bookingId: string | null;
  bookingNo: string | null;
  travelerId: string | null;
  travelerName: string | null;
  customerId: string | null;
  customerName: string | null;
  uploadedById: string | null;
  ocrOriginalFields: Record<string, unknown> | null;
  ocrCorrectedFields: Record<string, { original: string | null; corrected: string }> | null;
  ocrReviewedById: string | null;
  ocrReviewedAt: string | null;
  ocrAppliedAt: string | null;
  createdAt: string;
}
