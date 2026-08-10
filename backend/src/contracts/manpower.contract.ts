/**
 * Manpower / Overseas Employment (Module 6) contract. 6A = Employers + Job Orders
 * (the recruitment spine). Candidate lifecycle stages arrive in 6B.
 */
import { z } from "zod";

const CURRENCIES = ["BDT", "USD", "SAR"] as const;
const pageFields = { page: z.coerce.number().int().positive().optional(), pageSize: z.coerce.number().int().positive().max(100).optional() };

// ─── Employer ────────────────────────────────────────────────────────────────
export const employerStatuses = ["ACTIVE", "INACTIVE", "BLACKLISTED"] as const;
export const employerListQuerySchema = z.object({ q: z.string().trim().optional(), status: z.string().trim().optional(), ...pageFields });
export type EmployerListQuery = z.infer<typeof employerListQuerySchema>;
export const employerCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  industry: z.string().trim().max(120).optional(),
  contactPerson: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  email: z.string().trim().max(160).optional(),
  address: z.string().trim().max(500).optional(),
  status: z.enum(employerStatuses).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type EmployerCreateInput = z.infer<typeof employerCreateSchema>;
export const employerUpdateSchema = employerCreateSchema.partial();
export type EmployerUpdateInput = z.infer<typeof employerUpdateSchema>;
export interface EmployerDto {
  id: string; code: string; name: string; country: string | null; city: string | null; industry: string | null;
  contactPerson: string | null; phone: string | null; whatsapp: string | null; email: string | null;
  address: string | null; status: string; notes: string | null; jobOrderCount: number; createdAt: string;
}
export interface EmployerListResponse { items: EmployerDto[]; total: number; page: number; pageSize: number }

// ─── Job Order ───────────────────────────────────────────────────────────────
export const jobOrderStatuses = ["OPEN", "IN_PROGRESS", "FILLED", "CLOSED", "CANCELLED"] as const;
export const jobOrderListQuerySchema = z.object({ q: z.string().trim().optional(), status: z.string().trim().optional(), employerId: z.string().trim().optional(), ...pageFields });
export type JobOrderListQuery = z.infer<typeof jobOrderListQuerySchema>;
export const jobOrderCreateSchema = z.object({
  employerId: z.string().trim().min(1),
  jobTitle: z.string().trim().min(1).max(160),
  category: z.string().trim().max(120).optional(),
  country: z.string().trim().max(80).optional(),
  quantity: z.coerce.number().int().min(1).max(100000).optional(),
  salary: z.coerce.number().min(0).optional(),
  currency: z.enum(CURRENCIES).optional(),
  accommodation: z.string().trim().max(120).optional(),
  food: z.string().trim().max(120).optional(),
  workingHours: z.string().trim().max(80).optional(),
  contractDuration: z.string().trim().max(80).optional(),
  requirements: z.string().trim().max(2000).optional(),
  deadline: z.string().min(8).optional(),
  status: z.enum(jobOrderStatuses).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type JobOrderCreateInput = z.infer<typeof jobOrderCreateSchema>;
export const jobOrderUpdateSchema = jobOrderCreateSchema.partial();
export type JobOrderUpdateInput = z.infer<typeof jobOrderUpdateSchema>;
export interface JobOrderDto {
  id: string; code: string; employerId: string; employerName: string; jobTitle: string; category: string | null;
  country: string | null; quantity: number; salary: string | null; currency: string; accommodation: string | null;
  food: string | null; workingHours: string | null; contractDuration: string | null; requirements: string | null;
  deadline: string | null; status: string; notes: string | null; createdAt: string;
}
export interface JobOrderListResponse { items: JobOrderDto[]; total: number; page: number; pageSize: number }

// ─── Candidate + Recruitment (Module 6B) ─────────────────────────────────────
export const CANDIDATE_STATUSES = ["NEW", "SHORTLISTED", "SCREENING", "INTERVIEW", "SELECTED", "REJECTED", "CONTRACTED", "MEDICAL", "BMET", "VISA", "TICKETED", "DEPLOYED"] as const;
// Statuses that occupy a job-order slot (used for the selection quantity cap).
export const SLOT_STATUSES = ["SELECTED", "CONTRACTED", "MEDICAL", "BMET", "VISA", "TICKETED", "DEPLOYED"] as const;

export const candidateListQuerySchema = z.object({
  q: z.string().trim().optional(), status: z.string().trim().optional(),
  jobOrderId: z.string().trim().optional(), employerId: z.string().trim().optional(), ...pageFields,
});
export type CandidateListQuery = z.infer<typeof candidateListQuerySchema>;

export const candidateCreateSchema = z.object({
  jobOrderId: z.string().trim().min(1),
  fullName: z.string().trim().min(1).max(200),
  photoUrl: z.string().trim().max(500).optional(),
  dob: z.string().min(8).optional(),
  gender: z.string().trim().max(20).optional(),
  nationality: z.string().trim().max(80).optional(),
  passportNo: z.string().trim().max(40).optional(),
  passportIssueDate: z.string().min(8).optional(),
  passportExpiry: z.string().min(8).optional(),
  nid: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(160).optional(),
  address: z.string().trim().max(500).optional(),
  education: z.string().trim().max(500).optional(),
  experience: z.string().trim().max(1000).optional(),
  skills: z.string().trim().max(1000).optional(),
  remarks: z.string().trim().max(2000).optional(),
});
export type CandidateCreateInput = z.infer<typeof candidateCreateSchema>;

export const candidateUpdateSchema = candidateCreateSchema.omit({ jobOrderId: true }).partial().extend({
  screeningNotes: z.string().trim().max(2000).optional(),
  interviewDate: z.string().min(8).optional(),
  interviewer: z.string().trim().max(120).optional(),
  interviewResult: z.string().trim().max(40).optional(),
  interviewRemarks: z.string().trim().max(1000).optional(),
  contractStatus: z.string().trim().max(40).optional(),
  contractDate: z.string().min(8).optional(),
});
export type CandidateUpdateInput = z.infer<typeof candidateUpdateSchema>;

export const candidateTransitionSchema = z.object({
  status: z.enum(CANDIDATE_STATUSES),
  reason: z.string().trim().max(500).optional(),
});
export type CandidateTransitionInput = z.infer<typeof candidateTransitionSchema>;

export interface CandidateDto {
  id: string; code: string; jobOrderId: string; jobOrderCode: string; jobTitle: string;
  employerId: string; employerName: string; fullName: string; photoUrl: string | null;
  dob: string | null; gender: string | null; nationality: string | null; passportNo: string | null;
  passportIssueDate: string | null; passportExpiry: string | null; nid: string | null;
  phone: string | null; email: string | null; address: string | null; education: string | null;
  experience: string | null; skills: string | null; status: string;
  screeningNotes: string | null; interviewDate: string | null; interviewer: string | null;
  interviewResult: string | null; interviewRemarks: string | null; rejectionReason: string | null;
  contractStatus: string | null; contractDate: string | null; remarks: string | null; createdAt: string;
}
export interface CandidateListResponse { items: CandidateDto[]; total: number; page: number; pageSize: number }
export interface JobOrderPipelineDto {
  jobOrder: { id: string; code: string; jobTitle: string; employerName: string; quantity: number };
  required: number; selected: number; remaining: number;
  candidates: CandidateDto[];
}
