/**
 * HR service — org structure, employee lifecycle, documents, leave, holidays,
 * attendance, dashboard and reports. Follows the house patterns from
 * customer.service.ts: AuthCtx + branchWhere() for scoping, HttpError for
 * failures, allocateSequence()/formatDocNo() for the employee code, and soft
 * deletes (deletedAt/deletedById) everywhere instead of hard deletes.
 */
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { branchWhere, resolveBranchId, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import { allocateSequence, formatDocNo } from "../lib/sequence";
import { moveIntoStore, removeQuietly, absoluteStorePath } from "../lib/uploads";
import { notifyHrUsers, type HrNotificationEvent } from "./hr.notification";
import {
  orgUnitCreateSchema,
  employeeStatusSchema,
  hrDocMetaSchema,
  leaveTypeCreateSchema,
  leaveRequestCreateSchema,
  leaveDecisionSchema,
  holidayCreateSchema,
  attendanceUpsertSchema,
  attendanceCorrectionSchema,
  hrExportQuerySchema,
  type HrListQuery,
  type EmployeeCreateInput,
  type EmployeeUpdateInput,
} from "../contracts/hr.contract";

// ─── Shared helpers ─────────────────────────────────────────────────────────

const dIso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);
const dOnly = (d: Date | null | undefined): string | null => (d ? d.toISOString().slice(0, 10) : null);
const num = (v: Prisma.Decimal | number | null | undefined): number => (v == null ? 0 : typeof v === "number" ? v : Number(v));

/** Parse "YYYY-MM-DD" (or any ISO string) into a UTC Date; null on empty/invalid input. */
function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + months);
  return r;
}

/** Inclusive calendar-day span, e.g. Mon→Mon = 1 day, Mon→Tue = 2 days. */
function daysBetweenInclusive(from: Date, to: Date): number {
  const ms = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
    - Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return Math.floor(ms / 86_400_000) + 1;
}

type OrgUnitInput = z.infer<typeof orgUnitCreateSchema>;
type EmployeeStatusInput = z.infer<typeof employeeStatusSchema>;
type HrDocMetaInput = z.infer<typeof hrDocMetaSchema>;
type LeaveTypeInput = z.infer<typeof leaveTypeCreateSchema>;
type LeaveRequestInput = z.infer<typeof leaveRequestCreateSchema>;
type LeaveDecisionInput = z.infer<typeof leaveDecisionSchema>;
type HolidayInput = z.infer<typeof holidayCreateSchema>;
type AttendanceUpsertInput = z.infer<typeof attendanceUpsertSchema>;
type AttendanceCorrectionInput = z.infer<typeof attendanceCorrectionSchema>;
type HrExportQuery = z.infer<typeof hrExportQuerySchema>;

/** Fine-grained "hr" module RBAC check (mirrors middleware/auth.ts requirePermission,
 *  but usable inside services for rules that don't map cleanly onto a route guard —
 *  e.g. "manager OR hr manage" approvals). */
async function hasHrAccess(auth: AuthCtx, action: "view" | "manage"): Promise<boolean> {
  const grants = await prisma.rolePermission.findMany({
    where: { role: { users: { some: { userId: auth.userId } } }, permission: { module: "hr" } },
    select: { access: true },
  });
  return grants.some((g) => (action === "view" ? g.access === "view" || g.access === "full" : g.access === "full"));
}

async function requireHrManage(auth: AuthCtx): Promise<void> {
  if (!(await hasHrAccess(auth, "manage"))) throw new HttpError(403, "Forbidden", { detail: "Requires HR manage permission." });
}

/** Ping every user holding hr.manage (HR staff / admins). */
async function notifyHrManagers(
  event: HrNotificationEvent,
  n: { title: string; body?: string; type?: string; color?: string },
): Promise<void> {
  const rows = await prisma.rolePermission.findMany({
    where: { access: "full", permission: { module: "hr" } },
    select: { role: { select: { users: { select: { userId: true } } } } },
  });
  const userIds = Array.from(new Set(rows.flatMap((r) => r.role.users.map((u) => u.userId))));
  await notifyHrUsers(userIds, event, n);
}

/** Resolve the caller's own Employee row (portal "/hr/me" endpoints). */
export async function getMyEmployee(auth: AuthCtx) {
  const emp = await prisma.employee.findFirst({
    where: { userId: auth.userId, deletedAt: null },
    include: {
      branch: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      designation: { select: { id: true, name: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!emp) throw new HttpError(403, "NoEmployeeProfile", { detail: "This account is not linked to an employee profile." });
  return emp;
}

// ─── Org: Departments ───────────────────────────────────────────────────────

export async function listDepartments(auth: AuthCtx, q: HrListQuery) {
  const where: Prisma.HrDepartmentWhereInput = { deletedAt: null };
  if (!isGlobalRole(auth.role)) where.OR = [{ branchId: null }, { branchId: auth.branchId ?? "__no_branch__" }];
  else if (q.branchId) where.branchId = q.branchId;
  if (q.q) where.name = { contains: q.q, mode: "insensitive" };
  const rows = await prisma.hrDepartment.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { employees: { where: { deletedAt: null } }, sections: { where: { deletedAt: null } } } } },
  });
  return rows.map((d) => ({
    id: d.id, name: d.name, code: d.code, branchId: d.branchId, description: d.description,
    employeesCount: d._count.employees, sectionsCount: d._count.sections, createdAt: dIso(d.createdAt)!,
  }));
}

export async function createDepartment(auth: AuthCtx, input: OrgUnitInput) {
  const branchId = isGlobalRole(auth.role) ? (input.branchId ?? null) : (auth.branchId ?? null);
  try {
    return await prisma.hrDepartment.create({
      data: { name: input.name, code: input.code ?? null, branchId, description: input.description ?? null, createdById: auth.userId },
    });
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function updateDepartment(auth: AuthCtx, id: string, input: Partial<OrgUnitInput>) {
  const existing = await prisma.hrDepartment.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  if (!isGlobalRole(auth.role) && existing.branchId && existing.branchId !== auth.branchId) throw new HttpError(403, "Forbidden");
  const data: Prisma.HrDepartmentUncheckedUpdateInput = { updatedById: auth.userId };
  if (input.name !== undefined) data.name = input.name;
  if (input.code !== undefined) data.code = input.code ?? null;
  if (input.description !== undefined) data.description = input.description ?? null;
  if (input.branchId !== undefined && isGlobalRole(auth.role)) data.branchId = input.branchId ?? null;
  return prisma.hrDepartment.update({ where: { id }, data });
}

export async function deleteDepartment(auth: AuthCtx, id: string): Promise<void> {
  const existing = await prisma.hrDepartment.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.hrDepartment.update({ where: { id }, data: { deletedAt: new Date(), deletedById: auth.userId } });
}

// ─── Org: Sections ──────────────────────────────────────────────────────────

export async function listSections(_auth: AuthCtx, q: HrListQuery & { departmentId?: string }) {
  const where: Prisma.HrSectionWhereInput = { deletedAt: null };
  if (q.departmentId) where.departmentId = q.departmentId;
  if (q.q) where.name = { contains: q.q, mode: "insensitive" };
  const rows = await prisma.hrSection.findMany({
    where,
    orderBy: { name: "asc" },
    include: { department: { select: { name: true } }, _count: { select: { employees: { where: { deletedAt: null } }, teams: { where: { deletedAt: null } } } } },
  });
  return rows.map((s) => ({
    id: s.id, name: s.name, code: s.code, departmentId: s.departmentId, departmentName: s.department.name,
    employeesCount: s._count.employees, teamsCount: s._count.teams, createdAt: dIso(s.createdAt)!,
  }));
}

export async function createSection(auth: AuthCtx, input: OrgUnitInput) {
  if (!input.departmentId) throw new HttpError(400, "ValidationError", { detail: "departmentId is required." });
  const dept = await prisma.hrDepartment.findFirst({ where: { id: input.departmentId, deletedAt: null } });
  if (!dept) throw new HttpError(404, "NotFound", { detail: "Department not found." });
  return prisma.hrSection.create({
    data: { departmentId: input.departmentId, name: input.name, code: input.code ?? null, createdById: auth.userId },
  });
}

export async function updateSection(auth: AuthCtx, id: string, input: Partial<OrgUnitInput>) {
  const existing = await prisma.hrSection.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  const data: Prisma.HrSectionUncheckedUpdateInput = { updatedById: auth.userId };
  if (input.name !== undefined) data.name = input.name;
  if (input.code !== undefined) data.code = input.code ?? null;
  if (input.departmentId !== undefined) data.departmentId = input.departmentId;
  return prisma.hrSection.update({ where: { id }, data });
}

export async function deleteSection(auth: AuthCtx, id: string): Promise<void> {
  const existing = await prisma.hrSection.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.hrSection.update({ where: { id }, data: { deletedAt: new Date(), deletedById: auth.userId } });
}

// ─── Org: Teams ─────────────────────────────────────────────────────────────

export async function listTeams(_auth: AuthCtx, q: HrListQuery & { sectionId?: string }) {
  const where: Prisma.HrTeamWhereInput = { deletedAt: null };
  if (q.sectionId) where.sectionId = q.sectionId;
  if (q.q) where.name = { contains: q.q, mode: "insensitive" };
  const rows = await prisma.hrTeam.findMany({
    where,
    orderBy: { name: "asc" },
    include: { section: { select: { name: true } }, _count: { select: { employees: { where: { deletedAt: null } } } } },
  });
  return rows.map((t) => ({
    id: t.id, name: t.name, code: t.code, sectionId: t.sectionId, sectionName: t.section.name,
    employeesCount: t._count.employees, createdAt: dIso(t.createdAt)!,
  }));
}

export async function createTeam(auth: AuthCtx, input: OrgUnitInput) {
  if (!input.sectionId) throw new HttpError(400, "ValidationError", { detail: "sectionId is required." });
  const section = await prisma.hrSection.findFirst({ where: { id: input.sectionId, deletedAt: null } });
  if (!section) throw new HttpError(404, "NotFound", { detail: "Section not found." });
  return prisma.hrTeam.create({
    data: { sectionId: input.sectionId, name: input.name, code: input.code ?? null, createdById: auth.userId },
  });
}

export async function updateTeam(auth: AuthCtx, id: string, input: Partial<OrgUnitInput>) {
  const existing = await prisma.hrTeam.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  const data: Prisma.HrTeamUncheckedUpdateInput = { updatedById: auth.userId };
  if (input.name !== undefined) data.name = input.name;
  if (input.code !== undefined) data.code = input.code ?? null;
  if (input.sectionId !== undefined) data.sectionId = input.sectionId;
  return prisma.hrTeam.update({ where: { id }, data });
}

export async function deleteTeam(auth: AuthCtx, id: string): Promise<void> {
  const existing = await prisma.hrTeam.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.hrTeam.update({ where: { id }, data: { deletedAt: new Date(), deletedById: auth.userId } });
}

// ─── Org: Designations ──────────────────────────────────────────────────────

export async function listDesignations(_auth: AuthCtx, q: HrListQuery) {
  const where: Prisma.HrDesignationWhereInput = { deletedAt: null };
  if (q.q) where.name = { contains: q.q, mode: "insensitive" };
  const rows = await prisma.hrDesignation.findMany({
    where,
    orderBy: [{ level: "asc" }, { name: "asc" }],
    include: { _count: { select: { employees: { where: { deletedAt: null } } } } },
  });
  return rows.map((d) => ({
    id: d.id, name: d.name, code: d.code, level: d.level, employeesCount: d._count.employees, createdAt: dIso(d.createdAt)!,
  }));
}

export async function createDesignation(auth: AuthCtx, input: OrgUnitInput) {
  return prisma.hrDesignation.create({
    data: { name: input.name, code: input.code ?? null, level: input.level ?? null, createdById: auth.userId },
  });
}

export async function updateDesignation(auth: AuthCtx, id: string, input: Partial<OrgUnitInput>) {
  const existing = await prisma.hrDesignation.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  const data: Prisma.HrDesignationUncheckedUpdateInput = { updatedById: auth.userId };
  if (input.name !== undefined) data.name = input.name;
  if (input.code !== undefined) data.code = input.code ?? null;
  if (input.level !== undefined) data.level = input.level ?? null;
  return prisma.hrDesignation.update({ where: { id }, data });
}

export async function deleteDesignation(auth: AuthCtx, id: string): Promise<void> {
  const existing = await prisma.hrDesignation.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.hrDesignation.update({ where: { id }, data: { deletedAt: new Date(), deletedById: auth.userId } });
}

// ─── Employees ──────────────────────────────────────────────────────────────

const employeeInclude = {
  branch: { select: { id: true, name: true, code: true } },
  department: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  designation: { select: { id: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true } },
  user: { select: { id: true, email: true, status: true } },
  _count: { select: { documents: { where: { deletedAt: null } }, reports: { where: { deletedAt: null } } } },
} satisfies Prisma.EmployeeInclude;

type EmployeeRow = Prisma.EmployeeGetPayload<{ include: typeof employeeInclude }>;

function toEmployeeListItem(e: EmployeeRow) {
  return {
    id: e.id, employeeCode: e.employeeCode, firstName: e.firstName, lastName: e.lastName,
    fullName: `${e.firstName} ${e.lastName}`, photoUrl: e.photoUrl, phone: e.phone, email: e.email,
    branchId: e.branchId, branchName: e.branch.name,
    departmentId: e.departmentId, departmentName: e.department?.name ?? null,
    sectionId: e.sectionId, sectionName: e.section?.name ?? null,
    teamId: e.teamId, teamName: e.team?.name ?? null,
    designationId: e.designationId, designationName: e.designation?.name ?? null,
    managerId: e.managerId, managerName: e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : null,
    employmentType: e.employmentType, status: e.status,
    joiningDate: dOnly(e.joiningDate), confirmationDate: dOnly(e.confirmationDate),
    documentsCount: e._count.documents, reportsCount: e._count.reports,
    createdAt: dIso(e.createdAt)!,
  };
}

export interface EmployeeListQuery extends HrListQuery {
  status?: string;
  departmentId?: string;
}

export async function listEmployees(auth: AuthCtx, q: EmployeeListQuery) {
  const where: Prisma.EmployeeWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.status) where.status = q.status as never;
  if (q.departmentId) where.departmentId = q.departmentId;
  if (q.q) {
    where.OR = [
      { firstName: { contains: q.q, mode: "insensitive" } },
      { lastName: { contains: q.q, mode: "insensitive" } },
      { employeeCode: { contains: q.q, mode: "insensitive" } },
      { phone: { contains: q.q } },
      { email: { contains: q.q, mode: "insensitive" } },
    ];
  }
  const orderBy: Prisma.EmployeeOrderByWithRelationInput =
    q.sort === "name" ? { firstName: q.dir } : q.sort === "joiningDate" ? { joiningDate: q.dir } : { createdAt: q.dir };

  const [rows, total] = await Promise.all([
    prisma.employee.findMany({ where, include: employeeInclude, orderBy, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.employee.count({ where }),
  ]);
  return {
    data: rows.map(toEmployeeListItem),
    page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

export async function getEmployee(auth: AuthCtx, id: string) {
  const e = await prisma.employee.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, include: employeeInclude });
  if (!e) throw new HttpError(404, "NotFound");
  const year = new Date().getUTCFullYear();
  await ensureBalances(id, year);
  const [documents, timeline, balances] = await Promise.all([
    prisma.hrEmployeeDocument.findMany({ where: { employeeId: id, deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.employeeTimelineEvent.findMany({ where: { employeeId: id }, orderBy: { occurredAt: "desc" }, take: 30 }),
    prisma.hrLeaveBalance.findMany({ where: { employeeId: id, year }, include: { leaveType: { select: { name: true, code: true } } } }),
  ]);
  return {
    ...toEmployeeListItem(e),
    preferredName: e.preferredName, gender: e.gender, dateOfBirth: dOnly(e.dateOfBirth), bloodGroup: e.bloodGroup,
    nationality: e.nationality, religion: e.religion, maritalStatus: e.maritalStatus,
    emergencyContactName: e.emergencyContactName, emergencyContactPhone: e.emergencyContactPhone,
    permanentAddress: e.permanentAddress, presentAddress: e.presentAddress,
    probationMonths: e.probationMonths, workLocation: e.workLocation, salaryStructureRef: e.salaryStructureRef,
    education: e.education, experience: e.experience, skills: e.skills, languages: e.languages, notes: e.notes,
    userId: e.userId, userEmail: e.user?.email ?? null,
    documents: documents.map((d) => ({
      id: d.id, type: d.type, title: d.title, mimeType: d.mimeType, sizeBytes: d.sizeBytes, version: d.version,
      expiryDate: dOnly(d.expiryDate), notes: d.notes, createdAt: dIso(d.createdAt)!,
    })),
    timeline: timeline.map((t) => ({ id: t.id, eventType: t.eventType, title: t.title, detail: t.detail, occurredAt: dIso(t.occurredAt)! })),
    leaveBalances: balances.map((b) => ({
      leaveTypeId: b.leaveTypeId, leaveTypeName: b.leaveType.name, leaveTypeCode: b.leaveType.code,
      opening: num(b.opening), accrued: num(b.accrued), used: num(b.used), carried: num(b.carried),
      available: num(b.opening) + num(b.accrued) + num(b.carried) - num(b.used),
    })),
  };
}

async function addTimelineEvent(employeeId: string, eventType: string, title: string, detail: string | null, createdById: string): Promise<void> {
  await prisma.employeeTimelineEvent.create({ data: { employeeId, eventType, title, detail, createdById } });
}

export async function createEmployee(auth: AuthCtx, input: EmployeeCreateInput) {
  const branchId = resolveBranchId(auth, input.branchId);
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } });

  if (input.userId) {
    const dup = await prisma.employee.findFirst({ where: { userId: input.userId, deletedAt: null }, select: { id: true } });
    if (dup) throw new HttpError(409, "UserAlreadyLinked", { detail: "This user account is already linked to an employee." });
  }

  const year = new Date().getUTCFullYear();
  let employeeId: string;
  try {
    employeeId = await prisma.$transaction(async (tx) => {
      const seq = await allocateSequence(tx, "EMPLOYEE", branchId, year);
      const employeeCode = formatDocNo("EMP", branch.code, year, seq);
      const created = await tx.employee.create({
        data: {
          employeeCode, branchId,
          firstName: input.firstName, lastName: input.lastName, preferredName: input.preferredName ?? null,
          gender: input.gender ?? null, dateOfBirth: toDate(input.dateOfBirth), bloodGroup: input.bloodGroup ?? null,
          nationality: input.nationality ?? null, religion: input.religion ?? null, maritalStatus: input.maritalStatus ?? null,
          phone: input.phone ?? null, email: input.email || null,
          emergencyContactName: input.emergencyContactName ?? null, emergencyContactPhone: input.emergencyContactPhone ?? null,
          permanentAddress: input.permanentAddress ?? null, presentAddress: input.presentAddress ?? null,
          departmentId: input.departmentId ?? null, sectionId: input.sectionId ?? null, teamId: input.teamId ?? null,
          designationId: input.designationId ?? null, managerId: input.managerId ?? null,
          employmentType: input.employmentType ?? "FULL_TIME",
          joiningDate: toDate(input.joiningDate), probationMonths: input.probationMonths ?? null,
          confirmationDate: toDate(input.confirmationDate), status: input.status ?? "DRAFT",
          workLocation: input.workLocation ?? null, salaryStructureRef: input.salaryStructureRef ?? null,
          education: input.education ?? null, experience: input.experience ?? null, skills: input.skills ?? null,
          languages: input.languages ?? null, notes: input.notes ?? null,
          userId: input.userId ?? null, photoUrl: input.photoUrl ?? null,
          createdById: auth.userId,
        },
      });
      return created.id;
    });
  } catch (err) {
    mapUniqueError(err);
  }

  await addTimelineEvent(employeeId, "CREATED", "Employee record created", null, auth.userId);

  if (input.userId) {
    await notifyHrUsers([input.userId], "new_employee", {
      title: "Welcome to SM Travels",
      body: "Your employee profile has been created. You can view your HR portal now.",
      type: "hr",
    });
  }
  await notifyHrManagers("new_employee", { title: "New employee added", body: `${input.firstName} ${input.lastName} was added to HR.`, type: "hr" });

  return getEmployee(auth, employeeId);
}

export async function updateEmployee(auth: AuthCtx, id: string, input: EmployeeUpdateInput) {
  const existing = await prisma.employee.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");

  const data: Prisma.EmployeeUncheckedUpdateInput = { updatedById: auth.userId };
  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;
  if (input.preferredName !== undefined) data.preferredName = input.preferredName ?? null;
  if (input.gender !== undefined) data.gender = input.gender ?? null;
  if (input.dateOfBirth !== undefined) data.dateOfBirth = toDate(input.dateOfBirth);
  if (input.bloodGroup !== undefined) data.bloodGroup = input.bloodGroup ?? null;
  if (input.nationality !== undefined) data.nationality = input.nationality ?? null;
  if (input.religion !== undefined) data.religion = input.religion ?? null;
  if (input.maritalStatus !== undefined) data.maritalStatus = input.maritalStatus ?? null;
  if (input.phone !== undefined) data.phone = input.phone ?? null;
  if (input.email !== undefined) data.email = input.email || null;
  if (input.emergencyContactName !== undefined) data.emergencyContactName = input.emergencyContactName ?? null;
  if (input.emergencyContactPhone !== undefined) data.emergencyContactPhone = input.emergencyContactPhone ?? null;
  if (input.permanentAddress !== undefined) data.permanentAddress = input.permanentAddress ?? null;
  if (input.presentAddress !== undefined) data.presentAddress = input.presentAddress ?? null;
  if (input.departmentId !== undefined) data.departmentId = input.departmentId ?? null;
  if (input.sectionId !== undefined) data.sectionId = input.sectionId ?? null;
  if (input.teamId !== undefined) data.teamId = input.teamId ?? null;
  if (input.designationId !== undefined) data.designationId = input.designationId ?? null;
  if (input.managerId !== undefined) data.managerId = input.managerId ?? null;
  if (input.employmentType !== undefined) data.employmentType = input.employmentType;
  if (input.joiningDate !== undefined) data.joiningDate = toDate(input.joiningDate);
  if (input.probationMonths !== undefined) data.probationMonths = input.probationMonths ?? null;
  if (input.confirmationDate !== undefined) data.confirmationDate = toDate(input.confirmationDate);
  if (input.workLocation !== undefined) data.workLocation = input.workLocation ?? null;
  if (input.salaryStructureRef !== undefined) data.salaryStructureRef = input.salaryStructureRef ?? null;
  if (input.education !== undefined) data.education = input.education ?? null;
  if (input.experience !== undefined) data.experience = input.experience ?? null;
  if (input.skills !== undefined) data.skills = input.skills ?? null;
  if (input.languages !== undefined) data.languages = input.languages ?? null;
  if (input.notes !== undefined) data.notes = input.notes ?? null;
  if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl ?? null;
  if (input.userId !== undefined) {
    if (input.userId) {
      const dup = await prisma.employee.findFirst({ where: { userId: input.userId, deletedAt: null, NOT: { id } }, select: { id: true } });
      if (dup) throw new HttpError(409, "Conflict", { detail: "That user is already linked to another employee." });
    }
    data.userId = input.userId ?? null;
  }

  const statusChanged = input.status !== undefined && input.status !== existing.status;
  if (input.status !== undefined) data.status = input.status;

  try {
    await prisma.employee.update({ where: { id }, data });
  } catch (err) {
    mapUniqueError(err);
  }
  if (statusChanged) {
    await addTimelineEvent(id, "STATUS_CHANGE", `Status changed to ${input.status}`, null, auth.userId);
  }
  await addTimelineEvent(id, "UPDATED", "Employee record updated", null, auth.userId);
  return getEmployee(auth, id);
}

export async function deleteEmployee(auth: AuthCtx, id: string): Promise<void> {
  const existing = await prisma.employee.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.employee.update({ where: { id }, data: { deletedAt: new Date(), deletedById: auth.userId } });
}

export async function setEmployeeStatus(auth: AuthCtx, id: string, input: EmployeeStatusInput) {
  const existing = await prisma.employee.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.employee.update({ where: { id }, data: { status: input.status, updatedById: auth.userId } });
  await addTimelineEvent(id, "STATUS_CHANGE", `Status changed to ${input.status}`, input.note ?? null, auth.userId);
  return getEmployee(auth, id);
}

export async function getEmployeeTimeline(auth: AuthCtx, id: string) {
  const existing = await prisma.employee.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  const rows = await prisma.employeeTimelineEvent.findMany({ where: { employeeId: id }, orderBy: { occurredAt: "desc" } });
  return rows.map((t) => ({ id: t.id, eventType: t.eventType, title: t.title, detail: t.detail, occurredAt: dIso(t.occurredAt)! }));
}

// ─── Employee documents ─────────────────────────────────────────────────────

async function findEmployeeOrThrow(auth: AuthCtx, employeeId: string) {
  const emp = await prisma.employee.findFirst({ where: { id: employeeId, ...branchWhere(auth), deletedAt: null }, select: { id: true, branchId: true } });
  if (!emp) throw new HttpError(404, "NotFound", { detail: "Employee not found." });
  return emp;
}

export async function listEmployeeDocuments(auth: AuthCtx, employeeId: string) {
  await findEmployeeOrThrow(auth, employeeId);
  const rows = await prisma.hrEmployeeDocument.findMany({ where: { employeeId, deletedAt: null }, orderBy: { createdAt: "desc" } });
  return rows.map((d) => ({
    id: d.id, employeeId: d.employeeId, type: d.type, title: d.title, mimeType: d.mimeType, sizeBytes: d.sizeBytes,
    version: d.version, expiryDate: dOnly(d.expiryDate), notes: d.notes, createdAt: dIso(d.createdAt)!,
  }));
}

export async function createEmployeeDocument(auth: AuthCtx, employeeId: string, file: Express.Multer.File, input: HrDocMetaInput) {
  await findEmployeeOrThrow(auth, employeeId);
  try {
    const filePath = moveIntoStore(file.path, file.mimetype);
    const doc = await prisma.hrEmployeeDocument.create({
      data: {
        employeeId, type: input.type, title: input.title, filePath, mimeType: file.mimetype, sizeBytes: file.size,
        expiryDate: toDate(input.expiryDate), notes: input.notes ?? null, createdById: auth.userId,
      },
    });
    await addTimelineEvent(employeeId, "DOCUMENT_ADDED", `Document added: ${input.title}`, null, auth.userId);
    return doc;
  } catch (err) {
    removeQuietly(file.path);
    throw err;
  }
}

export async function replaceEmployeeDocument(
  auth: AuthCtx, employeeId: string, docId: string, file: Express.Multer.File, input: Partial<HrDocMetaInput>,
) {
  await findEmployeeOrThrow(auth, employeeId);
  const existing = await prisma.hrEmployeeDocument.findFirst({ where: { id: docId, employeeId, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound", { detail: "Document not found." });
  try {
    const filePath = moveIntoStore(file.path, file.mimetype);
    const updated = await prisma.hrEmployeeDocument.update({
      where: { id: docId },
      data: {
        filePath, mimeType: file.mimetype, sizeBytes: file.size, version: { increment: 1 },
        title: input.title ?? existing.title,
        type: input.type ?? existing.type,
        expiryDate: input.expiryDate !== undefined ? toDate(input.expiryDate) : existing.expiryDate,
        notes: input.notes !== undefined ? (input.notes ?? null) : existing.notes,
        updatedById: auth.userId,
      },
    });
    await addTimelineEvent(employeeId, "DOCUMENT_REPLACED", `Document replaced: ${updated.title} (v${updated.version})`, null, auth.userId);
    return updated;
  } catch (err) {
    removeQuietly(file.path);
    throw err;
  }
}

export async function deleteEmployeeDocument(auth: AuthCtx, employeeId: string, docId: string): Promise<void> {
  await findEmployeeOrThrow(auth, employeeId);
  const existing = await prisma.hrEmployeeDocument.findFirst({ where: { id: docId, employeeId, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound", { detail: "Document not found." });
  await prisma.hrEmployeeDocument.update({ where: { id: docId }, data: { deletedAt: new Date(), deletedById: auth.userId } });
}

export async function getEmployeeDocumentFile(auth: AuthCtx, employeeId: string, docId: string) {
  await findEmployeeOrThrow(auth, employeeId);
  const d = await prisma.hrEmployeeDocument.findFirst({ where: { id: docId, employeeId, deletedAt: null } });
  if (!d) throw new HttpError(404, "NotFound", { detail: "Document not found." });
  return { absPath: absoluteStorePath(d.filePath), mimeType: d.mimeType ?? "application/octet-stream", name: d.title };
}

/** Portal owner-only document download (no hr.view required). */
export async function getMyDocumentFile(auth: AuthCtx, docId: string) {
  const me = await getMyEmployee(auth);
  const d = await prisma.hrEmployeeDocument.findFirst({ where: { id: docId, employeeId: me.id, deletedAt: null } });
  if (!d) throw new HttpError(404, "NotFound", { detail: "Document not found." });
  return { absPath: absoluteStorePath(d.filePath), mimeType: d.mimeType ?? "application/octet-stream", name: d.title };
}

/** Active leave types for portal leave requests (auth-only, no hr.view). */
export async function listMyLeaveTypes(_auth: AuthCtx) {
  const rows = await prisma.hrLeaveType.findMany({ where: { deletedAt: null, active: true }, orderBy: { name: "asc" } });
  return rows.map((t) => ({
    id: t.id, name: t.name, code: t.code, paid: t.paid, openingBalance: num(t.openingBalance),
    maxPerYear: t.maxPerYear == null ? null : num(t.maxPerYear), carryForward: t.carryForward,
    maxCarryForward: t.maxCarryForward == null ? null : num(t.maxCarryForward),
    allowNegativeBalance: t.allowNegativeBalance, active: t.active,
  }));
}

// ─── Leave ──────────────────────────────────────────────────────────────────

export async function listLeaveTypes(_auth: AuthCtx) {
  const rows = await prisma.hrLeaveType.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  return rows.map((t) => ({
    id: t.id, name: t.name, code: t.code, paid: t.paid, openingBalance: num(t.openingBalance),
    maxPerYear: t.maxPerYear == null ? null : num(t.maxPerYear), carryForward: t.carryForward,
    maxCarryForward: t.maxCarryForward == null ? null : num(t.maxCarryForward),
    allowNegativeBalance: t.allowNegativeBalance, active: t.active,
  }));
}

export async function createLeaveType(auth: AuthCtx, input: LeaveTypeInput) {
  try {
    return await prisma.hrLeaveType.create({
      data: {
        name: input.name, code: input.code, paid: input.paid ?? true, openingBalance: input.openingBalance ?? 0,
        maxPerYear: input.maxPerYear ?? null, carryForward: input.carryForward ?? false,
        maxCarryForward: input.maxCarryForward ?? null, allowNegativeBalance: input.allowNegativeBalance ?? false,
        active: input.active ?? true, createdById: auth.userId,
      },
    });
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function updateLeaveType(auth: AuthCtx, id: string, input: Partial<LeaveTypeInput>) {
  const existing = await prisma.hrLeaveType.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  const data: Prisma.HrLeaveTypeUncheckedUpdateInput = { updatedById: auth.userId };
  if (input.name !== undefined) data.name = input.name;
  if (input.code !== undefined) data.code = input.code;
  if (input.paid !== undefined) data.paid = input.paid;
  if (input.openingBalance !== undefined) data.openingBalance = input.openingBalance;
  if (input.maxPerYear !== undefined) data.maxPerYear = input.maxPerYear ?? null;
  if (input.carryForward !== undefined) data.carryForward = input.carryForward;
  if (input.maxCarryForward !== undefined) data.maxCarryForward = input.maxCarryForward ?? null;
  if (input.allowNegativeBalance !== undefined) data.allowNegativeBalance = input.allowNegativeBalance;
  if (input.active !== undefined) data.active = input.active;
  try {
    return await prisma.hrLeaveType.update({ where: { id }, data });
  } catch (err) {
    mapUniqueError(err);
  }
}

/** Idempotently ensure every active leave type has a balance row for (employee, year). */
export async function ensureBalances(employeeId: string, year: number): Promise<void> {
  const types = await prisma.hrLeaveType.findMany({ where: { deletedAt: null, active: true }, select: { id: true, openingBalance: true } });
  for (const t of types) {
    await prisma.hrLeaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: t.id, year } },
      create: { employeeId, leaveTypeId: t.id, year, opening: t.openingBalance },
      update: {},
    });
  }
}

export async function getBalances(auth: AuthCtx, employeeId: string, year: number) {
  await findEmployeeOrThrow(auth, employeeId);
  await ensureBalances(employeeId, year);
  const rows = await prisma.hrLeaveBalance.findMany({
    where: { employeeId, year },
    include: { leaveType: { select: { name: true, code: true, paid: true } } },
    orderBy: { leaveType: { name: "asc" } },
  });
  return rows.map((b) => ({
    leaveTypeId: b.leaveTypeId, leaveTypeName: b.leaveType.name, leaveTypeCode: b.leaveType.code, paid: b.leaveType.paid,
    year: b.year, opening: num(b.opening), accrued: num(b.accrued), used: num(b.used), carried: num(b.carried),
    available: num(b.opening) + num(b.accrued) + num(b.carried) - num(b.used),
  }));
}

const leaveRequestInclude = {
  employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, branchId: true, userId: true, managerId: true, manager: { select: { userId: true } } } },
  leaveType: { select: { name: true, code: true } },
} satisfies Prisma.HrLeaveRequestInclude;

type LeaveRequestRow = Prisma.HrLeaveRequestGetPayload<{ include: typeof leaveRequestInclude }>;

function toLeaveRequestDto(r: LeaveRequestRow) {
  return {
    id: r.id, employeeId: r.employeeId, employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
    employeeCode: r.employee.employeeCode, leaveTypeId: r.leaveTypeId, leaveTypeName: r.leaveType.name,
    fromDate: dOnly(r.fromDate)!, toDate: dOnly(r.toDate)!, days: num(r.days), reason: r.reason, status: r.status,
    managerNote: r.managerNote, managerAt: dIso(r.managerAt), hrNote: r.hrNote, hrAt: dIso(r.hrAt),
    createdAt: dIso(r.createdAt)!,
  };
}

export interface LeaveRequestListQuery { employeeId?: string; status?: string; page?: number; pageSize?: number }

export async function listLeaveRequests(auth: AuthCtx, q: LeaveRequestListQuery) {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 20;
  const where: Prisma.HrLeaveRequestWhereInput = {
    deletedAt: null,
    employee: { ...branchWhere(auth), deletedAt: null },
  };
  if (q.employeeId) where.employeeId = q.employeeId;
  if (q.status) where.status = q.status as never;
  const [rows, total] = await Promise.all([
    prisma.hrLeaveRequest.findMany({
      where, include: leaveRequestInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
    }),
    prisma.hrLeaveRequest.count({ where }),
  ]);
  return { data: rows.map(toLeaveRequestDto), page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Resolve the effective employeeId for a leave/attendance write: the caller's own
 *  employee unless they hold hr.manage and explicitly named someone else. */
async function resolveActingEmployeeId(auth: AuthCtx, requestedEmployeeId?: string | null): Promise<string> {
  if (requestedEmployeeId) {
    if (await hasHrAccess(auth, "manage")) return requestedEmployeeId;
    const mine = await getMyEmployee(auth);
    if (mine.id !== requestedEmployeeId) throw new HttpError(403, "Forbidden", { detail: "Cannot act on another employee's record." });
    return mine.id;
  }
  const mine = await getMyEmployee(auth);
  return mine.id;
}

export async function createLeaveRequest(auth: AuthCtx, input: LeaveRequestInput) {
  const employeeId = await resolveActingEmployeeId(auth, input.employeeId);
  const exists = await prisma.employee.findFirst({ where: { id: employeeId, deletedAt: null }, select: { id: true } });
  if (!exists) throw new HttpError(404, "NotFound", { detail: "Employee not found." });

  const from = toDate(input.fromDate);
  const to = toDate(input.toDate);
  if (!from || !to) throw new HttpError(400, "ValidationError", { detail: "fromDate/toDate must be valid dates." });
  if (to.getTime() < from.getTime()) throw new HttpError(400, "ValidationError", { detail: "toDate must be on or after fromDate." });
  const days = daysBetweenInclusive(from, to);

  const leaveType = await prisma.hrLeaveType.findFirst({ where: { id: input.leaveTypeId, deletedAt: null, active: true } });
  if (!leaveType) throw new HttpError(404, "NotFound", { detail: "Leave type not found." });

  await ensureBalances(employeeId, from.getUTCFullYear());

  const status = input.submit ? "SUBMITTED" : "DRAFT";
  const created = await prisma.hrLeaveRequest.create({
    data: {
      employeeId, leaveTypeId: input.leaveTypeId, fromDate: from, toDate: to, days,
      reason: input.reason ?? null, status, createdById: auth.userId,
    },
    include: leaveRequestInclude,
  });

  if (status === "SUBMITTED") {
    await notifyHrManagers("leave_submitted", { title: "Leave request submitted", body: `${created.employee.firstName} ${created.employee.lastName} requested ${days} day(s) of ${leaveType.name}.`, type: "hr" });
    if (created.employee.manager?.userId) {
      await notifyHrUsers([created.employee.manager.userId], "leave_submitted", { title: "Leave request awaiting your approval", body: `${created.employee.firstName} ${created.employee.lastName} requested ${days} day(s) of ${leaveType.name}.`, type: "hr" });
    }
  }
  return toLeaveRequestDto(created);
}

async function loadLeaveRequestOrThrow(id: string) {
  const r = await prisma.hrLeaveRequest.findFirst({ where: { id, deletedAt: null }, include: leaveRequestInclude });
  if (!r) throw new HttpError(404, "NotFound");
  return r;
}

export async function submitLeaveRequest(auth: AuthCtx, id: string) {
  const r = await loadLeaveRequestOrThrow(id);
  const isOwner = r.employee.userId === auth.userId;
  if (!isOwner && !(await hasHrAccess(auth, "manage"))) throw new HttpError(403, "Forbidden");
  if (r.status !== "DRAFT") throw new HttpError(409, "InvalidTransition", { detail: `Cannot submit a request in ${r.status} status.` });
  const updated = await prisma.hrLeaveRequest.update({ where: { id }, data: { status: "SUBMITTED", updatedById: auth.userId }, include: leaveRequestInclude });
  await notifyHrManagers("leave_submitted", { title: "Leave request submitted", body: `${updated.employee.firstName} ${updated.employee.lastName} submitted a leave request.`, type: "hr" });
  if (updated.employee.manager?.userId) {
    await notifyHrUsers([updated.employee.manager.userId], "leave_submitted", { title: "Leave request awaiting your approval", body: `${updated.employee.firstName} ${updated.employee.lastName} submitted a leave request.`, type: "hr" });
  }
  return toLeaveRequestDto(updated);
}

/** Any user with hr.manage OR the linked user of employee.managerId may act as the manager. */
async function assertManagerOrHr(auth: AuthCtx, employee: { managerId: string | null; manager: { userId: string | null } | null }): Promise<void> {
  if (await hasHrAccess(auth, "manage")) return;
  if (employee.manager?.userId && employee.manager.userId === auth.userId) return;
  throw new HttpError(403, "Forbidden", { detail: "Requires HR manage permission or being the employee's manager." });
}

export async function managerApproveLeave(auth: AuthCtx, id: string, input: LeaveDecisionInput) {
  const r = await loadLeaveRequestOrThrow(id);
  await assertManagerOrHr(auth, r.employee);
  if (r.status !== "SUBMITTED") throw new HttpError(409, "InvalidTransition", { detail: `Cannot manager-approve a request in ${r.status} status.` });
  const updated = await prisma.hrLeaveRequest.update({
    where: { id },
    data: { status: "MANAGER_APPROVED", managerId: auth.userId, managerNote: input.note ?? null, managerAt: new Date(), updatedById: auth.userId },
    include: leaveRequestInclude,
  });
  await notifyHrManagers("leave_approved", { title: "Leave approved by manager", body: `${updated.employee.firstName} ${updated.employee.lastName}'s leave was manager-approved; HR approval pending.`, type: "hr" });
  if (updated.employee.userId) {
    await notifyHrUsers([updated.employee.userId], "leave_approved", { title: "Leave approved by manager", body: "Your leave request was approved by your manager and is now awaiting HR approval.", type: "hr" });
  }
  return toLeaveRequestDto(updated);
}

export async function hrApproveLeave(auth: AuthCtx, id: string, input: LeaveDecisionInput) {
  await requireHrManage(auth);
  const r = await loadLeaveRequestOrThrow(id);
  if (r.status !== "SUBMITTED" && r.status !== "MANAGER_APPROVED") {
    throw new HttpError(409, "InvalidTransition", { detail: `Cannot HR-approve a request in ${r.status} status.` });
  }
  const year = r.fromDate.getUTCFullYear();
  await ensureBalances(r.employeeId, year);
  const leaveType = await prisma.hrLeaveType.findFirst({ where: { id: r.leaveTypeId, deletedAt: null } });
  if (!leaveType) throw new HttpError(404, "NotFound", { detail: "Leave type not found." });
  const bal = await prisma.hrLeaveBalance.findUnique({
    where: { employeeId_leaveTypeId_year: { employeeId: r.employeeId, leaveTypeId: r.leaveTypeId, year } },
  });
  const available = bal ? num(bal.opening) + num(bal.accrued) + num(bal.carried) - num(bal.used) : 0;
  const daysNeeded = num(r.days);
  if (!leaveType.allowNegativeBalance && available < daysNeeded) {
    throw new HttpError(409, "InsufficientBalance", {
      detail: `Available balance is ${available} day(s); request needs ${daysNeeded}.`,
    });
  }
  if (leaveType.maxPerYear != null && num(bal?.used ?? 0) + daysNeeded > num(leaveType.maxPerYear)) {
    throw new HttpError(409, "MaxPerYearExceeded", {
      detail: `Approving would exceed the max of ${num(leaveType.maxPerYear)} day(s) per year for ${leaveType.name}.`,
    });
  }
  const updated = await prisma.$transaction(async (tx) => {
    await tx.hrLeaveBalance.update({
      where: { employeeId_leaveTypeId_year: { employeeId: r.employeeId, leaveTypeId: r.leaveTypeId, year } },
      data: { used: { increment: r.days } },
    });
    return tx.hrLeaveRequest.update({
      where: { id },
      data: { status: "HR_APPROVED", hrApproverId: auth.userId, hrNote: input.note ?? null, hrAt: new Date(), updatedById: auth.userId },
      include: leaveRequestInclude,
    });
  });
  if (updated.employee.userId) {
    await notifyHrUsers([updated.employee.userId], "leave_approved", { title: "Leave approved", body: `Your ${updated.leaveType.name} request (${dOnly(updated.fromDate)} → ${dOnly(updated.toDate)}) has been approved.`, type: "hr" });
  }
  return toLeaveRequestDto(updated);
}

export async function rejectLeaveRequest(auth: AuthCtx, id: string, input: LeaveDecisionInput) {
  const r = await loadLeaveRequestOrThrow(id);
  await assertManagerOrHr(auth, r.employee);
  if (r.status !== "SUBMITTED" && r.status !== "MANAGER_APPROVED") {
    throw new HttpError(409, "InvalidTransition", { detail: `Cannot reject a request in ${r.status} status.` });
  }
  const isHr = await hasHrAccess(auth, "manage");
  const updated = await prisma.hrLeaveRequest.update({
    where: { id },
    data: isHr
      ? { status: "REJECTED", hrApproverId: auth.userId, hrNote: input.note ?? null, hrAt: new Date(), updatedById: auth.userId }
      : { status: "REJECTED", managerId: auth.userId, managerNote: input.note ?? null, managerAt: new Date(), updatedById: auth.userId },
    include: leaveRequestInclude,
  });
  if (updated.employee.userId) {
    await notifyHrUsers([updated.employee.userId], "leave_rejected", { title: "Leave request rejected", body: input.note ?? "Your leave request was rejected.", type: "hr" });
  }
  return toLeaveRequestDto(updated);
}

export async function cancelLeaveRequest(auth: AuthCtx, id: string) {
  const r = await loadLeaveRequestOrThrow(id);
  const isOwner = r.employee.userId === auth.userId;
  if (!isOwner && !(await hasHrAccess(auth, "manage"))) throw new HttpError(403, "Forbidden");
  if (r.status === "HR_APPROVED" || r.status === "CANCELLED") {
    throw new HttpError(409, "InvalidTransition", { detail: `Cannot cancel a request in ${r.status} status.` });
  }
  const updated = await prisma.hrLeaveRequest.update({ where: { id }, data: { status: "CANCELLED", updatedById: auth.userId }, include: leaveRequestInclude });
  return toLeaveRequestDto(updated);
}

// ─── Holidays ───────────────────────────────────────────────────────────────

export async function listHolidays(auth: AuthCtx, q: { year?: number; branchId?: string }) {
  const where: Prisma.HrHolidayWhereInput = { deletedAt: null };
  if (!isGlobalRole(auth.role)) where.OR = [{ branchId: null }, { branchId: auth.branchId ?? "__no_branch__" }];
  else if (q.branchId) where.branchId = q.branchId;
  if (q.year) where.date = { gte: new Date(Date.UTC(q.year, 0, 1)), lt: new Date(Date.UTC(q.year + 1, 0, 1)) };
  const rows = await prisma.hrHoliday.findMany({ where, orderBy: { date: "asc" } });
  return rows.map((h) => ({
    id: h.id, name: h.name, date: dOnly(h.date)!, scope: h.scope, branchId: h.branchId, departmentId: h.departmentId, optional: h.optional,
  }));
}

export async function createHoliday(auth: AuthCtx, input: HolidayInput) {
  const date = toDate(input.date);
  if (!date) throw new HttpError(400, "ValidationError", { detail: "date is required." });
  return prisma.hrHoliday.create({
    data: {
      name: input.name, date, scope: input.scope ?? "COMPANY", branchId: input.branchId ?? null,
      departmentId: input.departmentId ?? null, optional: input.optional ?? false, createdById: auth.userId,
    },
  });
}

export async function updateHoliday(auth: AuthCtx, id: string, input: Partial<HolidayInput>) {
  const existing = await prisma.hrHoliday.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  const data: Prisma.HrHolidayUncheckedUpdateInput = { updatedById: auth.userId };
  if (input.name !== undefined) data.name = input.name;
  if (input.date !== undefined) data.date = toDate(input.date) ?? existing.date;
  if (input.scope !== undefined) data.scope = input.scope;
  if (input.branchId !== undefined) data.branchId = input.branchId ?? null;
  if (input.departmentId !== undefined) data.departmentId = input.departmentId ?? null;
  if (input.optional !== undefined) data.optional = input.optional;
  return prisma.hrHoliday.update({ where: { id }, data });
}

export async function deleteHoliday(auth: AuthCtx, id: string): Promise<void> {
  const existing = await prisma.hrHoliday.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.hrHoliday.update({ where: { id }, data: { deletedAt: new Date(), deletedById: auth.userId } });
}

// ─── Attendance ─────────────────────────────────────────────────────────────

const attendanceInclude = {
  employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, branchId: true, userId: true } },
} satisfies Prisma.HrAttendanceRecordInclude;

type AttendanceRow = Prisma.HrAttendanceRecordGetPayload<{ include: typeof attendanceInclude }>;

function toAttendanceDto(a: AttendanceRow) {
  return {
    id: a.id, employeeId: a.employeeId, employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
    employeeCode: a.employee.employeeCode, date: dOnly(a.date)!, clockIn: dIso(a.clockIn), clockOut: dIso(a.clockOut),
    status: a.status, note: a.note,
  };
}

export interface AttendanceListQuery { employeeId?: string; from?: string; to?: string; page?: number; pageSize?: number }

export async function listAttendance(auth: AuthCtx, q: AttendanceListQuery) {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 31;
  const where: Prisma.HrAttendanceRecordWhereInput = { deletedAt: null, employee: { ...branchWhere(auth), deletedAt: null } };
  if (q.employeeId) where.employeeId = q.employeeId;
  const from = toDate(q.from);
  const to = toDate(q.to);
  if (from || to) where.date = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  const [rows, total] = await Promise.all([
    prisma.hrAttendanceRecord.findMany({ where, include: attendanceInclude, orderBy: { date: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.hrAttendanceRecord.count({ where }),
  ]);
  return { data: rows.map(toAttendanceDto), page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function upsertAttendance(auth: AuthCtx, input: AttendanceUpsertInput) {
  await requireHrManage(auth);
  await findEmployeeOrThrow(auth, input.employeeId);
  const date = toDate(input.date);
  if (!date) throw new HttpError(400, "ValidationError", { detail: "date is required." });
  const record = await prisma.hrAttendanceRecord.upsert({
    where: { employeeId_date: { employeeId: input.employeeId, date } },
    create: {
      employeeId: input.employeeId, date, clockIn: input.clockIn ? new Date(input.clockIn) : null,
      clockOut: input.clockOut ? new Date(input.clockOut) : null, status: input.status ?? "PRESENT",
      note: input.note ?? null, createdById: auth.userId,
    },
    update: {
      clockIn: input.clockIn !== undefined ? (input.clockIn ? new Date(input.clockIn) : null) : undefined,
      clockOut: input.clockOut !== undefined ? (input.clockOut ? new Date(input.clockOut) : null) : undefined,
      status: input.status, note: input.note !== undefined ? (input.note ?? null) : undefined, updatedById: auth.userId,
    },
    include: attendanceInclude,
  });
  return toAttendanceDto(record);
}

function todayDateOnly(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

export async function clockIn(auth: AuthCtx) {
  const me = await getMyEmployee(auth);
  const date = todayDateOnly();
  const existing = await prisma.hrAttendanceRecord.findFirst({ where: { employeeId: me.id, date } });
  if (existing?.clockIn) throw new HttpError(409, "AlreadyClockedIn", { detail: "You have already clocked in today." });
  const record = existing
    ? await prisma.hrAttendanceRecord.update({ where: { id: existing.id }, data: { clockIn: new Date(), updatedById: auth.userId }, include: attendanceInclude })
    : await prisma.hrAttendanceRecord.create({ data: { employeeId: me.id, date, clockIn: new Date(), createdById: auth.userId }, include: attendanceInclude });
  return toAttendanceDto(record);
}

export async function clockOut(auth: AuthCtx) {
  const me = await getMyEmployee(auth);
  const date = todayDateOnly();
  const existing = await prisma.hrAttendanceRecord.findFirst({ where: { employeeId: me.id, date } });
  if (!existing || !existing.clockIn) throw new HttpError(409, "NotClockedIn", { detail: "You have not clocked in today." });
  if (existing.clockOut) throw new HttpError(409, "AlreadyClockedOut", { detail: "You have already clocked out today." });
  const record = await prisma.hrAttendanceRecord.update({ where: { id: existing.id }, data: { clockOut: new Date(), updatedById: auth.userId }, include: attendanceInclude });
  return toAttendanceDto(record);
}

const correctionInclude = {
  employee: { select: { id: true, firstName: true, lastName: true, userId: true, managerId: true, manager: { select: { userId: true } } } },
  attendance: { select: { id: true, date: true, clockIn: true, clockOut: true, status: true } },
} satisfies Prisma.HrAttendanceCorrectionInclude;

type CorrectionRow = Prisma.HrAttendanceCorrectionGetPayload<{ include: typeof correctionInclude }>;

function toCorrectionDto(c: CorrectionRow) {
  return {
    id: c.id, attendanceId: c.attendanceId, employeeId: c.employeeId, employeeName: `${c.employee.firstName} ${c.employee.lastName}`,
    date: dOnly(c.attendance.date)!, requestedClockIn: dIso(c.requestedClockIn), requestedClockOut: dIso(c.requestedClockOut),
    requestedStatus: c.requestedStatus, reason: c.reason, status: c.status, managerNote: c.managerNote, hrNote: c.hrNote,
    createdAt: dIso(c.createdAt)!,
  };
}

export interface CorrectionListQuery { employeeId?: string; status?: string; page?: number; pageSize?: number }

export async function listAttendanceCorrections(auth: AuthCtx, q: CorrectionListQuery) {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 20;
  const where: Prisma.HrAttendanceCorrectionWhereInput = { deletedAt: null, employee: { ...branchWhere(auth), deletedAt: null } };
  if (q.employeeId) where.employeeId = q.employeeId;
  if (q.status) where.status = q.status as never;
  const [rows, total] = await Promise.all([
    prisma.hrAttendanceCorrection.findMany({ where, include: correctionInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.hrAttendanceCorrection.count({ where }),
  ]);
  return { data: rows.map(toCorrectionDto), page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function createAttendanceCorrection(auth: AuthCtx, input: AttendanceCorrectionInput) {
  const attendance = await prisma.hrAttendanceRecord.findFirst({
    where: { id: input.attendanceId, deletedAt: null, employee: { ...branchWhere(auth), deletedAt: null } },
    include: { employee: { select: { id: true, userId: true, firstName: true, lastName: true } } },
  });
  if (!attendance) throw new HttpError(404, "NotFound", { detail: "Attendance record not found." });
  const isOwner = attendance.employee.userId === auth.userId;
  if (!isOwner && !(await hasHrAccess(auth, "manage"))) throw new HttpError(403, "Forbidden");

  const created = await prisma.hrAttendanceCorrection.create({
    data: {
      attendanceId: input.attendanceId, employeeId: attendance.employeeId,
      requestedClockIn: input.requestedClockIn ? new Date(input.requestedClockIn) : null,
      requestedClockOut: input.requestedClockOut ? new Date(input.requestedClockOut) : null,
      requestedStatus: input.requestedStatus ?? null, reason: input.reason ?? null, createdById: auth.userId,
    },
    include: correctionInclude,
  });
  await notifyHrManagers("attendance_correction", { title: "Attendance correction submitted", body: `${created.employee.firstName} ${created.employee.lastName} requested an attendance correction.`, type: "hr" });
  if (created.employee.manager?.userId) {
    await notifyHrUsers([created.employee.manager.userId], "attendance_correction", { title: "Attendance correction awaiting your approval", body: `${created.employee.firstName} ${created.employee.lastName} requested an attendance correction.`, type: "hr" });
  }
  return toCorrectionDto(created);
}

async function loadCorrectionOrThrow(id: string) {
  const c = await prisma.hrAttendanceCorrection.findFirst({ where: { id, deletedAt: null }, include: correctionInclude });
  if (!c) throw new HttpError(404, "NotFound");
  return c;
}

export async function managerApproveCorrection(auth: AuthCtx, id: string, note?: string | null) {
  const c = await loadCorrectionOrThrow(id);
  await assertManagerOrHr(auth, c.employee);
  if (c.status !== "SUBMITTED") throw new HttpError(409, "InvalidTransition", { detail: `Cannot manager-approve a correction in ${c.status} status.` });
  const updated = await prisma.hrAttendanceCorrection.update({
    where: { id },
    data: { status: "MANAGER_APPROVED", managerId: auth.userId, managerNote: note ?? null, managerAt: new Date(), updatedById: auth.userId },
    include: correctionInclude,
  });
  return toCorrectionDto(updated);
}

export async function hrApproveCorrection(auth: AuthCtx, id: string, note?: string | null) {
  await requireHrManage(auth);
  const c = await loadCorrectionOrThrow(id);
  if (c.status !== "SUBMITTED" && c.status !== "MANAGER_APPROVED") {
    throw new HttpError(409, "InvalidTransition", { detail: `Cannot HR-approve a correction in ${c.status} status.` });
  }
  const updated = await prisma.$transaction(async (tx) => {
    await tx.hrAttendanceRecord.update({
      where: { id: c.attendanceId },
      data: {
        clockIn: c.requestedClockIn ?? undefined,
        clockOut: c.requestedClockOut ?? undefined,
        status: c.requestedStatus ?? undefined,
        updatedById: auth.userId,
      },
    });
    return tx.hrAttendanceCorrection.update({
      where: { id },
      data: { status: "HR_APPROVED", hrApproverId: auth.userId, hrNote: note ?? null, hrAt: new Date(), updatedById: auth.userId },
      include: correctionInclude,
    });
  });
  if (updated.employee.userId) {
    await notifyHrUsers([updated.employee.userId], "attendance_correction", { title: "Attendance correction approved", body: "Your attendance correction request was approved.", type: "hr" });
  }
  return toCorrectionDto(updated);
}

export async function rejectCorrection(auth: AuthCtx, id: string, note?: string | null) {
  const c = await loadCorrectionOrThrow(id);
  await assertManagerOrHr(auth, c.employee);
  if (c.status !== "SUBMITTED" && c.status !== "MANAGER_APPROVED") {
    throw new HttpError(409, "InvalidTransition", { detail: `Cannot reject a correction in ${c.status} status.` });
  }
  const isHr = await hasHrAccess(auth, "manage");
  const updated = await prisma.hrAttendanceCorrection.update({
    where: { id },
    data: isHr
      ? { status: "REJECTED", hrApproverId: auth.userId, hrNote: note ?? null, hrAt: new Date(), updatedById: auth.userId }
      : { status: "REJECTED", managerId: auth.userId, managerNote: note ?? null, managerAt: new Date(), updatedById: auth.userId },
    include: correctionInclude,
  });
  if (updated.employee.userId) {
    await notifyHrUsers([updated.employee.userId], "attendance_correction", { title: "Attendance correction rejected", body: note ?? "Your attendance correction request was rejected.", type: "hr" });
  }
  return toCorrectionDto(updated);
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function getDashboard(auth: AuthCtx) {
  const bw = branchWhere(auth);
  const empWhere: Prisma.EmployeeWhereInput = { ...bw, deletedAt: null };
  const today = todayDateOnly();
  const in30 = addDays(today, 30);

  const [
    employeesCount, departmentsCount, attendanceToday, pendingLeave,
    activeEmployees, allDocs, recentJoiners,
  ] = await Promise.all([
    prisma.employee.count({ where: empWhere }),
    prisma.hrDepartment.count({ where: { deletedAt: null, ...(isGlobalRole(auth.role) ? {} : { OR: [{ branchId: null }, { branchId: auth.branchId ?? "__no_branch__" }] }) } }),
    prisma.hrAttendanceRecord.count({ where: { deletedAt: null, date: today, employee: empWhere } }),
    prisma.hrLeaveRequest.count({ where: { deletedAt: null, status: { in: ["SUBMITTED", "MANAGER_APPROVED"] }, employee: empWhere } }),
    prisma.employee.findMany({
      where: { ...empWhere, status: { notIn: ["RESIGNED", "TERMINATED", "ARCHIVED"] } },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true, joiningDate: true, probationMonths: true, status: true },
    }),
    prisma.hrEmployeeDocument.findMany({
      where: { deletedAt: null, expiryDate: { gte: today, lte: in30 }, employee: empWhere },
      select: { id: true, title: true, type: true, expiryDate: true, employee: { select: { firstName: true, lastName: true } } },
      orderBy: { expiryDate: "asc" },
    }),
    prisma.employee.findMany({
      where: { ...empWhere, joiningDate: { gte: addDays(today, -30), lte: today } },
      select: { id: true, firstName: true, lastName: true, joiningDate: true, department: { select: { name: true } } },
      orderBy: { joiningDate: "desc" },
      take: 10,
    }),
  ]);

  const leaveToday = await prisma.hrLeaveRequest.count({
    where: { deletedAt: null, status: "HR_APPROVED", fromDate: { lte: today }, toDate: { gte: today }, employee: empWhere },
  });

  const upcomingBirthdays = activeEmployees
    .filter((e) => e.dateOfBirth)
    .map((e) => {
      const dob = e.dateOfBirth!;
      let next = new Date(Date.UTC(today.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()));
      if (next.getTime() < today.getTime()) next = new Date(Date.UTC(today.getUTCFullYear() + 1, dob.getUTCMonth(), dob.getUTCDate()));
      const daysAway = Math.round((next.getTime() - today.getTime()) / 86_400_000);
      return { id: e.id, name: `${e.firstName} ${e.lastName}`, date: dOnly(dob)!, daysAway };
    })
    .filter((e) => e.daysAway <= 30)
    .sort((a, b) => a.daysAway - b.daysAway);

  const upcomingConfirmations = activeEmployees
    .filter((e) => e.status === "PROBATION" && e.joiningDate && e.probationMonths != null)
    .map((e) => {
      const due = addMonths(e.joiningDate!, e.probationMonths!);
      const daysAway = Math.round((due.getTime() - today.getTime()) / 86_400_000);
      return { id: e.id, name: `${e.firstName} ${e.lastName}`, dueDate: dOnly(due)!, daysAway };
    })
    .filter((e) => e.daysAway <= 30)
    .sort((a, b) => a.daysAway - b.daysAway);

  return {
    employeesCount, departmentsCount, attendanceToday, leaveToday, pendingLeave,
    upcomingBirthdays, upcomingConfirmations,
    expiringDocuments: allDocs.map((d) => ({
      id: d.id, title: d.title, type: d.type, expiryDate: dOnly(d.expiryDate), employeeName: `${d.employee.firstName} ${d.employee.lastName}`,
    })),
    recentJoiners: recentJoiners.map((e) => ({
      id: e.id, name: `${e.firstName} ${e.lastName}`, joiningDate: dOnly(e.joiningDate), departmentName: e.department?.name ?? null,
    })),
  };
}

// ─── Reports ────────────────────────────────────────────────────────────────

export interface ReportTable { headers: string[]; rows: string[][] }

export async function buildTable(auth: AuthCtx, query: HrExportQuery): Promise<ReportTable> {
  const bw = branchWhere(auth);
  const empWhere: Prisma.EmployeeWhereInput = { ...bw, deletedAt: null };
  if (query.branchId && isGlobalRole(auth.role)) empWhere.branchId = query.branchId;
  const year = query.year ?? new Date().getUTCFullYear();

  switch (query.report) {
    case "employees": {
      const rows = await prisma.employee.findMany({
        where: empWhere,
        include: { department: { select: { name: true } }, designation: { select: { name: true } }, branch: { select: { name: true } } },
        orderBy: { employeeCode: "asc" },
      });
      return {
        headers: ["Employee Code", "Name", "Department", "Designation", "Branch", "Status", "Joining Date"],
        rows: rows.map((e) => [
          e.employeeCode, `${e.firstName} ${e.lastName}`, e.department?.name ?? "", e.designation?.name ?? "",
          e.branch.name, e.status, dOnly(e.joiningDate) ?? "",
        ]),
      };
    }
    case "joining": {
      const rows = await prisma.employee.findMany({
        where: { ...empWhere, joiningDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
        include: { department: { select: { name: true } } },
        orderBy: { joiningDate: "asc" },
      });
      return {
        headers: ["Employee Code", "Name", "Department", "Joining Date"],
        rows: rows.map((e) => [e.employeeCode, `${e.firstName} ${e.lastName}`, e.department?.name ?? "", dOnly(e.joiningDate) ?? ""]),
      };
    }
    case "department": {
      const rows = await prisma.hrDepartment.findMany({
        where: { deletedAt: null },
        include: { _count: { select: { employees: { where: { ...empWhere } } } } },
        orderBy: { name: "asc" },
      });
      return { headers: ["Department", "Employees"], rows: rows.map((d) => [d.name, String(d._count.employees)]) };
    }
    case "attendance": {
      const from = new Date(Date.UTC(year, (query.month ?? 1) - 1, 1));
      const to = query.month ? new Date(Date.UTC(year, query.month, 1)) : new Date(Date.UTC(year + 1, 0, 1));
      const rows = await prisma.hrAttendanceRecord.findMany({
        where: { deletedAt: null, date: { gte: from, lt: to }, employee: empWhere },
        include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
        orderBy: { date: "asc" },
      });
      return {
        headers: ["Date", "Employee Code", "Employee", "Status", "Clock In", "Clock Out"],
        rows: rows.map((a) => [
          dOnly(a.date) ?? "", a.employee.employeeCode, `${a.employee.firstName} ${a.employee.lastName}`, a.status,
          a.clockIn ? a.clockIn.toISOString() : "", a.clockOut ? a.clockOut.toISOString() : "",
        ]),
      };
    }
    case "leave": {
      const rows = await prisma.hrLeaveRequest.findMany({
        where: { deletedAt: null, fromDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) }, employee: empWhere },
        include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } }, leaveType: { select: { name: true } } },
        orderBy: { fromDate: "asc" },
      });
      return {
        headers: ["Employee Code", "Employee", "Leave Type", "From", "To", "Days", "Status"],
        rows: rows.map((r) => [
          r.employee.employeeCode, `${r.employee.firstName} ${r.employee.lastName}`, r.leaveType.name,
          dOnly(r.fromDate) ?? "", dOnly(r.toDate) ?? "", String(num(r.days)), r.status,
        ]),
      };
    }
    case "confirmation": {
      const rows = await prisma.employee.findMany({
        where: { ...empWhere, status: "PROBATION", joiningDate: { not: null }, probationMonths: { not: null } },
        orderBy: { joiningDate: "asc" },
      });
      return {
        headers: ["Employee Code", "Name", "Joining Date", "Confirmation Due"],
        rows: rows.map((e) => [
          e.employeeCode, `${e.firstName} ${e.lastName}`, dOnly(e.joiningDate) ?? "",
          e.joiningDate && e.probationMonths != null ? dOnly(addMonths(e.joiningDate, e.probationMonths)) ?? "" : "",
        ]),
      };
    }
    case "birthday": {
      const rows = await prisma.employee.findMany({ where: { ...empWhere, dateOfBirth: { not: null } }, orderBy: { firstName: "asc" } });
      const filtered = query.month != null ? rows.filter((e) => (e.dateOfBirth!.getUTCMonth() + 1) === query.month) : rows;
      return {
        headers: ["Employee Code", "Name", "Date of Birth"],
        rows: filtered.map((e) => [e.employeeCode, `${e.firstName} ${e.lastName}`, dOnly(e.dateOfBirth) ?? ""]),
      };
    }
    case "document-expiry": {
      const from = new Date(Date.UTC(year, 0, 1));
      const to = new Date(Date.UTC(year + 1, 0, 1));
      const rows = await prisma.hrEmployeeDocument.findMany({
        where: { deletedAt: null, expiryDate: { gte: from, lt: to }, employee: empWhere },
        include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
        orderBy: { expiryDate: "asc" },
      });
      return {
        headers: ["Employee Code", "Employee", "Document Type", "Title", "Expiry Date"],
        rows: rows.map((d) => [d.employee.employeeCode, `${d.employee.firstName} ${d.employee.lastName}`, d.type, d.title, dOnly(d.expiryDate) ?? ""]),
      };
    }
    default:
      return { headers: [], rows: [] };
  }
}

// ─── Me (portal self-service) ───────────────────────────────────────────────

export async function updateMyProfile(auth: AuthCtx, input: EmployeeUpdateInput) {
  const me = await getMyEmployee(auth);
  const data: Prisma.EmployeeUncheckedUpdateInput = { updatedById: auth.userId };
  if (input.phone !== undefined) data.phone = input.phone ?? null;
  if (input.email !== undefined) data.email = input.email || null;
  if (input.emergencyContactName !== undefined) data.emergencyContactName = input.emergencyContactName ?? null;
  if (input.emergencyContactPhone !== undefined) data.emergencyContactPhone = input.emergencyContactPhone ?? null;
  if (input.permanentAddress !== undefined) data.permanentAddress = input.permanentAddress ?? null;
  if (input.presentAddress !== undefined) data.presentAddress = input.presentAddress ?? null;
  if (input.bloodGroup !== undefined) data.bloodGroup = input.bloodGroup ?? null;
  if (input.maritalStatus !== undefined) data.maritalStatus = input.maritalStatus ?? null;
  if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl ?? null;
  await prisma.employee.update({ where: { id: me.id }, data });
  return getEmployee(auth, me.id);
}

/** Leave / attendance corrections awaiting this user as the direct manager. */
export async function listMyManagerApprovals(auth: AuthCtx) {
  const me = await getMyEmployee(auth);
  const [leave, corrections] = await Promise.all([
    prisma.hrLeaveRequest.findMany({
      where: { deletedAt: null, status: "SUBMITTED", employee: { managerId: me.id, deletedAt: null } },
      include: leaveRequestInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.hrAttendanceCorrection.findMany({
      where: { deletedAt: null, status: "SUBMITTED", employee: { managerId: me.id, deletedAt: null } },
      include: correctionInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return {
    leave: leave.map(toLeaveRequestDto),
    corrections: corrections.map(toCorrectionDto),
  };
}

/**
 * Daily HR lifecycle reminders (document expiry, birthdays, confirmations).
 * Dedupes against in-app notifications created in the last 6 days for the same title.
 */
export async function processHrLifecycleReminders(): Promise<number> {
  const today = todayDateOnly();
  const in30 = addDays(today, 30);
  const since = addDays(today, -6);
  let sent = 0;

  async function notifyOnce(userIds: string[], event: HrNotificationEvent, n: { title: string; body?: string; type?: string }) {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    for (const userId of unique) {
      const dup = await prisma.notification.findFirst({
        where: { userId, type: "hr", title: n.title, createdAt: { gte: since } },
        select: { id: true },
      });
      if (dup) continue;
      await notifyHrUsers([userId], event, { ...n, type: n.type ?? "hr" });
      sent += 1;
    }
  }

  const docs = await prisma.hrEmployeeDocument.findMany({
    where: { deletedAt: null, expiryDate: { gte: today, lte: in30 }, employee: { deletedAt: null } },
    select: {
      id: true, title: true, type: true, expiryDate: true,
      employee: { select: { userId: true, firstName: true, lastName: true } },
    },
  });
  for (const d of docs) {
    const expiry = dOnly(d.expiryDate) ?? "";
    const title = `Document expiring: ${d.title}`;
    const body = `${d.employee.firstName} ${d.employee.lastName}'s ${d.type.replace(/_/g, " ").toLowerCase()} (${d.title}) expires on ${expiry}.`;
    if (d.employee.userId) {
      await notifyOnce([d.employee.userId], "document_expiring", { title, body });
    }
    const hrRows = await prisma.rolePermission.findMany({
      where: { access: "full", permission: { module: "hr" } },
      select: { role: { select: { users: { select: { userId: true } } } } },
    });
    const hrIds = Array.from(new Set(hrRows.flatMap((r) => r.role.users.map((u) => u.userId))));
    await notifyOnce(hrIds, "document_expiring", { title, body });
  }

  const active = await prisma.employee.findMany({
    where: { deletedAt: null, status: { notIn: ["RESIGNED", "TERMINATED", "ARCHIVED"] } },
    select: { id: true, firstName: true, lastName: true, dateOfBirth: true, joiningDate: true, probationMonths: true, status: true, userId: true, manager: { select: { userId: true } } },
  });

  for (const e of active) {
    if (e.dateOfBirth) {
      const dob = e.dateOfBirth;
      let next = new Date(Date.UTC(today.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()));
      if (next.getTime() < today.getTime()) next = new Date(Date.UTC(today.getUTCFullYear() + 1, dob.getUTCMonth(), dob.getUTCDate()));
      const daysAway = Math.round((next.getTime() - today.getTime()) / 86_400_000);
      if (daysAway <= 7) {
        const title = `Birthday reminder: ${e.firstName} ${e.lastName}`;
        const body = daysAway === 0
          ? `${e.firstName} ${e.lastName}'s birthday is today.`
          : `${e.firstName} ${e.lastName}'s birthday is in ${daysAway} day(s).`;
        const targets = [e.userId, e.manager?.userId].filter(Boolean) as string[];
        await notifyOnce(targets, "birthday_reminder", { title, body });
      }
    }
    if (e.status === "PROBATION" && e.joiningDate && e.probationMonths != null) {
      const due = addMonths(e.joiningDate, e.probationMonths);
      const daysAway = Math.round((due.getTime() - today.getTime()) / 86_400_000);
      if (daysAway >= 0 && daysAway <= 14) {
        const title = `Confirmation due: ${e.firstName} ${e.lastName}`;
        const body = `Probation confirmation for ${e.firstName} ${e.lastName} is due on ${dOnly(due)} (${daysAway} day(s)).`;
        const hrRows = await prisma.rolePermission.findMany({
          where: { access: "full", permission: { module: "hr" } },
          select: { role: { select: { users: { select: { userId: true } } } } },
        });
        const hrIds = Array.from(new Set(hrRows.flatMap((r) => r.role.users.map((u) => u.userId))));
        await notifyOnce(hrIds, "confirmation_reminder", { title, body });
      }
    }
  }

  return sent;
}
