/**
 * Manpower downstream stages (Module 6B-2/6B-3): Medical, BMET (+ Visa, Deployment
 * in 6B-3). Each is one record per candidate, linked to Candidate/JobOrder/Employer.
 */
import { z } from "zod";

const listFields = {
  q: z.string().trim().optional(), status: z.string().trim().optional(),
  jobOrderId: z.string().trim().optional(), employerId: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(), pageSize: z.coerce.number().int().positive().max(100).optional(),
};
const dateOpt = z.string().min(8).optional();

// ─── Medical ─────────────────────────────────────────────────────────────────
export const MEDICAL_STATUSES = ["PENDING", "APPOINTMENT", "COMPLETED", "FIT", "UNFIT", "EXPIRED"] as const;
export const medicalListQuerySchema = z.object({ ...listFields });
export type MedicalListQuery = z.infer<typeof medicalListQuerySchema>;
export const medicalCreateSchema = z.object({
  candidateId: z.string().trim().min(1),
  medicalCenter: z.string().trim().max(160).optional(),
  appointmentDate: dateOpt, medicalDate: dateOpt, resultDate: dateOpt, expiryDate: dateOpt,
  documentRef: z.string().trim().max(200).optional(),
  remarks: z.string().trim().max(1000).optional(),
});
export type MedicalCreateInput = z.infer<typeof medicalCreateSchema>;
export const medicalUpdateSchema = medicalCreateSchema.omit({ candidateId: true }).partial().extend({ status: z.enum(MEDICAL_STATUSES).optional() });
export type MedicalUpdateInput = z.infer<typeof medicalUpdateSchema>;
export interface MedicalDto {
  id: string; code: string; candidateId: string; candidateName: string; candidateCode: string;
  jobOrderId: string; jobTitle: string; employerName: string; medicalCenter: string | null;
  appointmentDate: string | null; medicalDate: string | null; resultDate: string | null; expiryDate: string | null;
  status: string; documentRef: string | null; remarks: string | null; createdAt: string;
}
export interface MedicalListResponse { items: MedicalDto[]; total: number; page: number; pageSize: number }

// ─── BMET ────────────────────────────────────────────────────────────────────
export const BMET_STATUSES = ["PENDING", "REGISTERED", "PROCESSING", "CLEARED", "REJECTED", "EXPIRED"] as const;
export const bmetListQuerySchema = z.object({ ...listFields });
export type BmetListQuery = z.infer<typeof bmetListQuerySchema>;
export const bmetCreateSchema = z.object({
  candidateId: z.string().trim().min(1),
  registrationNo: z.string().trim().max(80).optional(),
  registrationDate: dateOpt, clearanceNo: z.string().trim().max(80).optional(),
  clearanceDate: dateOpt, expiryDate: dateOpt,
  documentRef: z.string().trim().max(200).optional(),
  remarks: z.string().trim().max(1000).optional(),
});
export type BmetCreateInput = z.infer<typeof bmetCreateSchema>;
export const bmetUpdateSchema = bmetCreateSchema.omit({ candidateId: true }).partial().extend({ status: z.enum(BMET_STATUSES).optional() });
export type BmetUpdateInput = z.infer<typeof bmetUpdateSchema>;
export interface BmetDto {
  id: string; code: string; candidateId: string; candidateName: string; candidateCode: string;
  jobOrderId: string; jobTitle: string; employerName: string; registrationNo: string | null;
  registrationDate: string | null; clearanceNo: string | null; clearanceDate: string | null; expiryDate: string | null;
  status: string; documentRef: string | null; remarks: string | null; createdAt: string;
}
export interface BmetListResponse { items: BmetDto[]; total: number; page: number; pageSize: number }
