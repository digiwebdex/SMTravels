import { z } from "zod";

const pageQ = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  branchId: z.string().optional(),
  sort: z.string().optional(),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export const hrListQuerySchema = pageQ.extend({
  status: z.string().optional(),
  departmentId: z.string().optional(),
});

export const orgUnitCreateSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().max(40).optional().nullable(),
  branchId: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  departmentId: z.string().optional(), // section
  sectionId: z.string().optional(), // team
  level: z.number().int().optional().nullable(), // designation
});

export const employeeCreateSchema = z.object({
  branchId: z.string().optional(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  preferredName: z.string().max(80).optional().nullable(),
  gender: z.string().max(30).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  bloodGroup: z.string().max(10).optional().nullable(),
  nationality: z.string().max(60).optional().nullable(),
  religion: z.string().max(60).optional().nullable(),
  maritalStatus: z.string().max(40).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  emergencyContactName: z.string().max(120).optional().nullable(),
  emergencyContactPhone: z.string().max(40).optional().nullable(),
  permanentAddress: z.string().max(500).optional().nullable(),
  presentAddress: z.string().max(500).optional().nullable(),
  departmentId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  designationId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "CONSULTANT"]).optional(),
  joiningDate: z.string().optional().nullable(),
  probationMonths: z.number().int().min(0).max(36).optional().nullable(),
  confirmationDate: z.string().optional().nullable(),
  status: z.enum([
    "DRAFT", "OFFERED", "JOINED", "PROBATION", "CONFIRMED",
    "TRANSFERRED", "RESIGNED", "TERMINATED", "ARCHIVED",
  ]).optional(),
  workLocation: z.string().max(120).optional().nullable(),
  salaryStructureRef: z.string().max(120).optional().nullable(),
  education: z.string().max(2000).optional().nullable(),
  experience: z.string().max(2000).optional().nullable(),
  skills: z.string().max(1000).optional().nullable(),
  languages: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  userId: z.string().optional().nullable(),
  photoUrl: z.string().max(500).optional().nullable(),
});

export const employeeUpdateSchema = employeeCreateSchema.partial();

export const employeeStatusSchema = z.object({
  status: z.enum([
    "DRAFT", "OFFERED", "JOINED", "PROBATION", "CONFIRMED",
    "TRANSFERRED", "RESIGNED", "TERMINATED", "ARCHIVED",
  ]),
  note: z.string().max(500).optional(),
});

export const hrDocMetaSchema = z.object({
  type: z.enum([
    "OFFER_LETTER", "APPOINTMENT_LETTER", "CONTRACT", "PASSPORT", "NATIONAL_ID",
    "CERTIFICATE", "RESUME", "MEDICAL", "DRIVING_LICENSE", "OTHER",
  ]),
  title: z.string().min(1).max(200),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const leaveTypeCreateSchema = z.object({
  name: z.string().min(1).max(80),
  code: z.string().min(1).max(40),
  paid: z.boolean().optional(),
  openingBalance: z.number().optional(),
  maxPerYear: z.number().optional().nullable(),
  carryForward: z.boolean().optional(),
  maxCarryForward: z.number().optional().nullable(),
  allowNegativeBalance: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const leaveRequestCreateSchema = z.object({
  employeeId: z.string().optional(), // portal uses self
  leaveTypeId: z.string().min(1),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  reason: z.string().max(1000).optional().nullable(),
  submit: z.boolean().optional(),
});

export const leaveDecisionSchema = z.object({
  note: z.string().max(500).optional().nullable(),
});

export const holidayCreateSchema = z.object({
  name: z.string().min(1).max(120),
  date: z.string().min(1),
  scope: z.enum(["NATIONAL", "COMPANY", "BRANCH", "DEPARTMENT", "OPTIONAL"]).optional(),
  branchId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  optional: z.boolean().optional(),
});

export const attendanceUpsertSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  clockIn: z.string().optional().nullable(),
  clockOut: z.string().optional().nullable(),
  status: z.enum(["PRESENT", "LATE", "EARLY_LEAVE", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY"]).optional(),
  note: z.string().max(500).optional().nullable(),
});

export const attendanceCorrectionSchema = z.object({
  attendanceId: z.string().min(1),
  requestedClockIn: z.string().optional().nullable(),
  requestedClockOut: z.string().optional().nullable(),
  requestedStatus: z.enum(["PRESENT", "LATE", "EARLY_LEAVE", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY"]).optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
});

export const hrExportQuerySchema = z.object({
  report: z.enum([
    "employees", "joining", "department", "attendance", "leave",
    "confirmation", "birthday", "document-expiry",
  ]),
  format: z.enum(["csv", "xlsx", "pdf"]).default("csv"),
  branchId: z.string().optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type HrListQuery = z.infer<typeof hrListQuerySchema>;
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
