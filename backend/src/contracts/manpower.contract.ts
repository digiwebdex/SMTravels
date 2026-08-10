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
