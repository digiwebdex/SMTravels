/**
 * Shared CRM contract (Leads, Customers, Corporate Clients). Same rules as the
 * Bookings contract: zod schemas + inferred DTO types, depends only on `zod`
 * (no @prisma import) so the frontend can import the types.
 */
import { z } from "zod";
import { serviceTypeSchema, type ServiceTypeDto } from "./booking.contract";

// ── enums (mirror prisma/schema.prisma) ──────────────────────────────────────
export const LEAD_STAGES = ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
export const leadStageSchema = z.enum(LEAD_STAGES);
export type LeadStageDto = z.infer<typeof leadStageSchema>;

export const leadInterestSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const taskPrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]);
export const customerTypeSchema = z.enum(["INDIVIDUAL", "CORPORATE"]);

const optStr = z.string().trim().optional();
const emailField = z.string().trim().email().optional().or(z.literal(""));

// ── Lead ──────────────────────────────────────────────────────────────────────
export const leadCreateSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: emailField,
  source: optStr,
  serviceInterest: serviceTypeSchema.optional(),
  quantity: z.coerce.number().int().min(1).optional(),
  interest: leadInterestSchema.optional(),
  stage: leadStageSchema.optional(),
  assignedToId: optStr,
  agentId: optStr,
  branchId: optStr,
});
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export const leadUpdateSchema = leadCreateSchema.partial().omit({ branchId: true });
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

export const leadStageChangeSchema = z.object({ stage: leadStageSchema, note: optStr });

export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(10),
  sort: z.enum(["name", "date", "stage"]).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  q: optStr,
  stage: leadStageSchema.optional(),
  source: optStr,
  serviceInterest: serviceTypeSchema.optional(),
  assignedToId: optStr,
  branchId: optStr,
  dateFrom: optStr,
  dateTo: optStr,
});
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;

// lead sub-resources (populate the detail tabs)
export const noteCreateSchema = z.object({ body: z.string().trim().min(1) });
export const followUpCreateSchema = z.object({ dueAt: z.string().min(1), note: optStr, assignedToId: optStr });
export const callCreateSchema = z.object({ direction: z.enum(["inbound", "outbound"]), durationSec: z.coerce.number().int().min(0).optional(), note: optStr });
export const taskCreateSchema = z.object({ title: z.string().trim().min(1), description: optStr, priority: taskPrioritySchema.optional(), dueAt: optStr, assigneeId: optStr });

// ── Customer ────────────────────────────────────────────────────────────────
export const customerCreateSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: emailField,
  type: customerTypeSchema.optional(),
  dob: optStr,
  addressLine: optStr,
  district: optStr,
  division: optStr,
  country: optStr,
  rating: optStr,
  nid: optStr,
  passportNo: optStr,
  branchId: optStr,
});
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

export const customerUpdateSchema = customerCreateSchema.partial().omit({ branchId: true });
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(10),
  sort: z.enum(["name", "date"]).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  q: optStr,
  branchId: optStr,
  type: customerTypeSchema.optional(),
});
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;

// ── Corporate client (creates the underlying Customer too) ──────────────────
export const corporateCreateSchema = z.object({
  companyName: z.string().trim().min(1),
  contactPerson: optStr,
  tradeLicense: optStr,
  tin: optStr,
  address: optStr,
  // primary contact → the backing Customer row
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: emailField,
  branchId: optStr,
});
export type CorporateCreateInput = z.infer<typeof corporateCreateSchema>;

export const corporateUpdateSchema = z.object({
  companyName: optStr,
  contactPerson: optStr,
  tradeLicense: optStr,
  tin: optStr,
  address: optStr,
  name: optStr,
  phone: optStr,
  email: emailField,
});
export type CorporateUpdateInput = z.infer<typeof corporateUpdateSchema>;

export const corporateListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(10),
  sort: z.enum(["name", "date"]).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  q: optStr,
  branchId: optStr,
});
export type CorporateListQuery = z.infer<typeof corporateListQuerySchema>;

// ── response DTOs ───────────────────────────────────────────────────────────
export interface LeadListItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string | null;
  serviceInterest: ServiceTypeDto | null;
  interest: string;
  stage: LeadStageDto;
  assignedToId: string | null;
  assignedToName: string | null;
  branchId: string;
  branchName: string | null;
  converted: boolean;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
}

export interface LeadActivityDto { id: string; type: string; note: string | null; actor: string | null; createdAt: string }
export interface FollowUpDto { id: string; dueAt: string; note: string | null; done: boolean; assignedTo: string | null; createdAt: string }
export interface CallLogDto { id: string; direction: string; durationSec: number | null; note: string | null; by: string | null; createdAt: string }
export interface NoteDto { id: string; body: string; author: string | null; createdAt: string }
export interface TaskDto { id: string; title: string; description: string | null; priority: string; status: string; dueAt: string | null; assignee: string | null; createdAt: string }

export interface LeadDetail extends LeadListItem {
  quantity: number | null;
  agentId: string | null;
  customerId: string | null;
  activities: LeadActivityDto[];
  followUps: FollowUpDto[];
  callLogs: CallLogDto[];
  notes: NoteDto[];
  tasks: TaskDto[];
}

export interface LeadListResponse {
  data: LeadListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  stats: { total: number; won: number; open: number; byStage: Record<string, number> };
}

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  type: string;
  district: string | null;
  division: string | null;
  rating: string | null;
  branchId: string;
  branchName: string | null;
  bookingsCount: number;
  createdAt: string;
}

export interface CustomerProfile extends CustomerListItem {
  addressLine: string | null;
  country: string | null;
  dob: string | null;
  nid: string | null;
  passportNo: string | null;
  isCorporate: boolean;
  bookings: { id: string; bookingNo: string | null; serviceType: string; status: string; amount: number; createdAt: string }[];
  notes: NoteDto[];
  activity: { id: string; action: string; createdAt: string }[];
}

export interface CustomerListResponse {
  data: CustomerListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  stats: { total: number; individual: number; corporate: number };
}

export interface CorporateListItem {
  id: string;
  companyName: string;
  contactPerson: string | null;
  tradeLicense: string | null;
  tin: string | null;
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  branchId: string;
  branchName: string | null;
  createdAt: string;
}

export interface CorporateProfile extends CorporateListItem {
  address: string | null;
  bookingsCount: number;
  bookings: { id: string; bookingNo: string | null; serviceType: string; status: string; amount: number; createdAt: string }[];
}

export interface CorporateListResponse {
  data: CorporateListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
