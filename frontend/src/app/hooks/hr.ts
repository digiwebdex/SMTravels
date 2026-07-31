/**
 * HR module — react-query hooks for /api/hr/* (admin + employee self-service).
 * Mirrors the house pattern from hooks/documents.ts: apiFetch, toast on error,
 * query-key based invalidation. Input types for employee create/update are
 * imported (type-only — no runtime @contracts alias) straight from the backend
 * zod contract so the form payload can never drift from validation.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, downloadViaApi } from "../lib/api";
import type { EmployeeCreateInput, EmployeeUpdateInput } from "@contracts/hr.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

function qstr(p: Record<string, string | number | boolean | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "" && v !== "All") s.set(k, String(v));
  return s.toString();
}

export const hrKeys = {
  dashboard: ["hr", "dashboard"] as const,
  departments: ["hr", "departments"] as const,
  sections: ["hr", "sections"] as const,
  teams: ["hr", "teams"] as const,
  designations: ["hr", "designations"] as const,
  employees: (p: unknown) => ["hr", "employees", "list", p] as const,
  employeesAll: ["hr", "employees"] as const,
  employee: (id: string) => ["hr", "employee", id] as const,
  employeeTimeline: (id: string) => ["hr", "employee", id, "timeline"] as const,
  employeeDocuments: (id: string) => ["hr", "employee", id, "documents"] as const,
  leaveTypes: ["hr", "leaveTypes"] as const,
  leaveBalances: (employeeId: string, year: number) => ["hr", "leaveBalances", employeeId, year] as const,
  leaveRequests: (p: unknown) => ["hr", "leaveRequests", p] as const,
  holidays: (p: unknown) => ["hr", "holidays", p] as const,
  attendance: (p: unknown) => ["hr", "attendance", p] as const,
  attendanceCorrections: (p: unknown) => ["hr", "attendanceCorrections", p] as const,
  me: ["hr", "me"] as const,
  myLeave: ["hr", "me", "leave"] as const,
  myLeaveTypes: ["hr", "me", "leaveTypes"] as const,
  myApprovals: ["hr", "me", "approvals"] as const,
  myAttendance: (p: unknown) => ["hr", "me", "attendance", p] as const,
};

// ─── Response DTOs (mirror backend/src/services/hr.service.ts return shapes) ──

export interface DepartmentDto {
  id: string; name: string; code: string | null; branchId: string | null; description: string | null;
  employeesCount: number; sectionsCount: number; createdAt: string;
}
export interface SectionDto {
  id: string; name: string; code: string | null; departmentId: string; departmentName: string;
  employeesCount: number; teamsCount: number; createdAt: string;
}
export interface TeamDto {
  id: string; name: string; code: string | null; sectionId: string; sectionName: string;
  employeesCount: number; createdAt: string;
}
export interface DesignationDto {
  id: string; name: string; code: string | null; level: number | null; employeesCount: number; createdAt: string;
}

export interface EmployeeListItem {
  id: string; employeeCode: string; firstName: string; lastName: string; fullName: string;
  photoUrl: string | null; phone: string | null; email: string | null;
  branchId: string; branchName: string;
  departmentId: string | null; departmentName: string | null;
  sectionId: string | null; sectionName: string | null;
  teamId: string | null; teamName: string | null;
  designationId: string | null; designationName: string | null;
  managerId: string | null; managerName: string | null;
  employmentType: string; status: string;
  joiningDate: string | null; confirmationDate: string | null;
  documentsCount: number; reportsCount: number; createdAt: string;
}
export interface EmployeeListResult {
  data: EmployeeListItem[]; page: number; pageSize: number; total: number; totalPages: number;
}

export interface EmployeeTimelineEvent {
  id: string; eventType: string; title: string; detail: string | null; occurredAt: string;
}
export interface EmployeeDocumentDto {
  id: string; employeeId?: string; type: string; title: string; mimeType: string | null;
  sizeBytes: number | null; version: number; expiryDate: string | null; notes: string | null; createdAt: string;
}
export interface EmployeeLeaveBalanceMini {
  leaveTypeId: string; leaveTypeName: string; leaveTypeCode: string; year?: number;
  opening: number; accrued: number; used: number; carried: number; available: number;
}
export interface EmployeeDetail extends EmployeeListItem {
  preferredName: string | null; gender: string | null; dateOfBirth: string | null; bloodGroup: string | null;
  nationality: string | null; religion: string | null; maritalStatus: string | null;
  emergencyContactName: string | null; emergencyContactPhone: string | null;
  permanentAddress: string | null; presentAddress: string | null;
  probationMonths: number | null; workLocation: string | null; salaryStructureRef: string | null;
  education: string | null; experience: string | null; skills: string | null; languages: string | null; notes: string | null;
  userId: string | null; userEmail: string | null;
  documents: EmployeeDocumentDto[]; timeline: EmployeeTimelineEvent[]; leaveBalances: EmployeeLeaveBalanceMini[];
}

export interface LeaveTypeDto {
  id: string; name: string; code: string; paid: boolean; openingBalance: number;
  maxPerYear: number | null; carryForward: boolean; maxCarryForward: number | null;
  allowNegativeBalance: boolean; active: boolean;
}
export interface LeaveBalanceDto {
  leaveTypeId: string; leaveTypeName: string; leaveTypeCode: string; paid: boolean; year: number;
  opening: number; accrued: number; used: number; carried: number; available: number;
}
export interface LeaveRequestDto {
  id: string; employeeId: string; employeeName: string; employeeCode: string;
  leaveTypeId: string; leaveTypeName: string; fromDate: string; toDate: string; days: number;
  reason: string | null; status: string; managerNote: string | null; managerAt: string | null;
  hrNote: string | null; hrAt: string | null; createdAt: string;
}
export interface LeaveRequestListResult {
  data: LeaveRequestDto[]; page: number; pageSize: number; total: number; totalPages: number;
}

export interface HolidayDto {
  id: string; name: string; date: string; scope: string; branchId: string | null; departmentId: string | null; optional: boolean;
}

export interface AttendanceDto {
  id: string; employeeId: string; employeeName: string; employeeCode: string; date: string;
  clockIn: string | null; clockOut: string | null; status: string; note: string | null;
}
export interface AttendanceListResult {
  data: AttendanceDto[]; page: number; pageSize: number; total: number; totalPages: number;
}
export interface AttendanceCorrectionDto {
  id: string; attendanceId: string; employeeId: string; employeeName: string; date: string;
  requestedClockIn: string | null; requestedClockOut: string | null; requestedStatus: string | null;
  reason: string | null; status: string; managerNote: string | null; hrNote: string | null; createdAt: string;
}
export interface AttendanceCorrectionListResult {
  data: AttendanceCorrectionDto[]; page: number; pageSize: number; total: number; totalPages: number;
}

export interface HrDashboardDto {
  employeesCount: number; departmentsCount: number; attendanceToday: number; leaveToday: number; pendingLeave: number;
  upcomingBirthdays: { id: string; name: string; date: string; daysAway: number }[];
  upcomingConfirmations: { id: string; name: string; dueDate: string; daysAway: number }[];
  expiringDocuments: { id: string; title: string; type: string; expiryDate: string | null; employeeName: string }[];
  recentJoiners: { id: string; name: string; joiningDate: string | null; departmentName: string | null }[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const useHrDashboard = () =>
  useQuery({ queryKey: hrKeys.dashboard, queryFn: () => apiFetch<HrDashboardDto>("/hr/dashboard") });

// ─── Org structure (Departments / Sections / Teams / Designations) ────────────
export interface OrgUnitInput {
  name: string; code?: string | null; branchId?: string | null; description?: string | null;
  departmentId?: string; sectionId?: string; level?: number | null;
}

function makeOrgCrud<T>(path: string, key: readonly unknown[], entityLabel: string) {
  const useList = (params: Record<string, string | undefined> = {}) =>
    useQuery({
      queryKey: [...key, "list", params],
      queryFn: () => apiFetch<T[]>(`/hr/${path}?${qstr(params)}`),
    });
  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (input: OrgUnitInput) => apiFetch<T>(`/hr/${path}`, { method: "POST", body: JSON.stringify(input) }),
      onSuccess: () => { void qc.invalidateQueries({ queryKey: key }); toast.success(`${entityLabel} created`); },
      onError: err,
    });
  };
  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<OrgUnitInput> }) =>
        apiFetch<T>(`/hr/${path}/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
      onSuccess: () => { void qc.invalidateQueries({ queryKey: key }); toast.success(`${entityLabel} updated`); },
      onError: err,
    });
  };
  const useDelete = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/hr/${path}/${id}`, { method: "DELETE" }),
      onSuccess: () => { void qc.invalidateQueries({ queryKey: key }); toast.success(`${entityLabel} removed`); },
      onError: err,
    });
  };
  return { useList, useCreate, useUpdate, useDelete };
}

const deptCrud = makeOrgCrud<DepartmentDto>("departments", hrKeys.departments, "Department");
export const useDepartments = deptCrud.useList;
export const useCreateDepartment = deptCrud.useCreate;
export const useUpdateDepartment = deptCrud.useUpdate;
export const useDeleteDepartment = deptCrud.useDelete;

const sectionCrud = makeOrgCrud<SectionDto>("sections", hrKeys.sections, "Section");
export const useSections = sectionCrud.useList;
export const useCreateSection = sectionCrud.useCreate;
export const useUpdateSection = sectionCrud.useUpdate;
export const useDeleteSection = sectionCrud.useDelete;

const teamCrud = makeOrgCrud<TeamDto>("teams", hrKeys.teams, "Team");
export const useTeams = teamCrud.useList;
export const useCreateTeam = teamCrud.useCreate;
export const useUpdateTeam = teamCrud.useUpdate;
export const useDeleteTeam = teamCrud.useDelete;

const designationCrud = makeOrgCrud<DesignationDto>("designations", hrKeys.designations, "Designation");
export const useDesignations = designationCrud.useList;
export const useCreateDesignation = designationCrud.useCreate;
export const useUpdateDesignation = designationCrud.useUpdate;
export const useDeleteDesignation = designationCrud.useDelete;

// ─── Employees ────────────────────────────────────────────────────────────────
export interface EmployeeListParams {
  page?: number; pageSize?: number; q?: string; status?: string; departmentId?: string; branchId?: string; sort?: string; dir?: string;
}
export const useEmployees = (params: EmployeeListParams = {}) =>
  useQuery({
    queryKey: hrKeys.employees(params),
    queryFn: () => apiFetch<EmployeeListResult>(`/hr/employees?${qstr(params as Record<string, string | number | undefined>)}`),
    placeholderData: (p) => p,
  });

export const useEmployee = (id: string | null) =>
  useQuery({
    queryKey: hrKeys.employee(id ?? ""),
    queryFn: () => apiFetch<EmployeeDetail>(`/hr/employees/${id}`),
    enabled: !!id,
  });

function invalidateEmployees(qc: ReturnType<typeof useQueryClient>, id?: string) {
  void qc.invalidateQueries({ queryKey: hrKeys.employeesAll });
  void qc.invalidateQueries({ queryKey: hrKeys.dashboard });
  if (id) void qc.invalidateQueries({ queryKey: hrKeys.employee(id) });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeCreateInput) => apiFetch<EmployeeDetail>("/hr/employees", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { invalidateEmployees(qc); toast.success("Employee created"); },
    onError: err,
  });
}
export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeUpdateInput) => apiFetch<EmployeeDetail>(`/hr/employees/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { invalidateEmployees(qc, id); toast.success("Employee updated"); },
    onError: err,
  });
}
export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/hr/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidateEmployees(qc); toast.success("Employee removed"); },
    onError: err,
  });
}
export function useSetEmployeeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      apiFetch<EmployeeDetail>(`/hr/employees/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) }),
    onSuccess: (d) => { invalidateEmployees(qc, d.id); toast.success(`Status changed to ${d.status}`); },
    onError: err,
  });
}
export const useEmployeeTimeline = (id: string | null) =>
  useQuery({
    queryKey: hrKeys.employeeTimeline(id ?? ""),
    queryFn: () => apiFetch<EmployeeTimelineEvent[]>(`/hr/employees/${id}/timeline`),
    enabled: !!id,
  });

// ─── Employee documents ─────────────────────────────────────────────────────
export const useEmployeeDocuments = (employeeId: string | null) =>
  useQuery({
    queryKey: hrKeys.employeeDocuments(employeeId ?? ""),
    queryFn: () => apiFetch<EmployeeDocumentDto[]>(`/hr/employees/${employeeId}/documents`),
    enabled: !!employeeId,
  });

export interface UploadEmployeeDocInput {
  employeeId: string; file: File; type: string; title: string; expiryDate?: string; notes?: string;
}
function toDocFormData(input: UploadEmployeeDocInput): FormData {
  const fd = new FormData();
  fd.append("file", input.file);
  fd.append("type", input.type);
  fd.append("title", input.title);
  if (input.expiryDate) fd.append("expiryDate", input.expiryDate);
  if (input.notes) fd.append("notes", input.notes);
  return fd;
}
export function useUploadEmployeeDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadEmployeeDocInput) =>
      apiFetch<EmployeeDocumentDto>(`/hr/employees/${input.employeeId}/documents`, { method: "POST", body: toDocFormData(input) }),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: hrKeys.employeeDocuments(vars.employeeId) });
      void qc.invalidateQueries({ queryKey: hrKeys.employee(vars.employeeId) });
      toast.success("Document uploaded");
    },
    onError: err,
  });
}
export function useReplaceEmployeeDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, docId, file, title, expiryDate, notes }: { employeeId: string; docId: string; file: File; title?: string; expiryDate?: string; notes?: string }) => {
      const fd = new FormData();
      fd.append("file", file);
      if (title) fd.append("title", title);
      if (expiryDate) fd.append("expiryDate", expiryDate);
      if (notes) fd.append("notes", notes);
      return apiFetch<EmployeeDocumentDto>(`/hr/employees/${employeeId}/documents/${docId}/replace`, { method: "POST", body: fd });
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: hrKeys.employeeDocuments(vars.employeeId) });
      toast.success("Document replaced");
    },
    onError: err,
  });
}
export function useDeleteEmployeeDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, docId }: { employeeId: string; docId: string }) =>
      apiFetch<{ ok: boolean }>(`/hr/employees/${employeeId}/documents/${docId}`, { method: "PATCH" }),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: hrKeys.employeeDocuments(vars.employeeId) });
      toast.success("Document removed");
    },
    onError: err,
  });
}
export const downloadEmployeeDocument = (employeeId: string, doc: Pick<EmployeeDocumentDto, "id" | "title">) =>
  downloadViaApi(`/hr/employees/${employeeId}/documents/${doc.id}/file`, doc.title).catch(err);

/** Portal self-service document download (owner-only route). */
export const downloadMyDocument = (doc: Pick<EmployeeDocumentDto, "id" | "title">) =>
  downloadViaApi(`/hr/me/documents/${doc.id}/file`, doc.title).catch(err);

// ─── Leave ──────────────────────────────────────────────────────────────────
export const useLeaveTypes = () =>
  useQuery({ queryKey: hrKeys.leaveTypes, queryFn: () => apiFetch<LeaveTypeDto[]>("/hr/leave/types") });

export interface LeaveTypeInput {
  name: string; code: string; paid?: boolean; openingBalance?: number; maxPerYear?: number | null;
  carryForward?: boolean; maxCarryForward?: number | null; allowNegativeBalance?: boolean; active?: boolean;
}
export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveTypeInput) => apiFetch<LeaveTypeDto>("/hr/leave/types", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: hrKeys.leaveTypes }); toast.success("Leave type created"); },
    onError: err,
  });
}
export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<LeaveTypeInput> }) =>
      apiFetch<LeaveTypeDto>(`/hr/leave/types/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: hrKeys.leaveTypes }); toast.success("Leave type updated"); },
    onError: err,
  });
}

export const useLeaveBalances = (employeeId: string | null, year: number) =>
  useQuery({
    queryKey: hrKeys.leaveBalances(employeeId ?? "", year),
    queryFn: () => apiFetch<LeaveBalanceDto[]>(`/hr/leave/balances?${qstr({ employeeId: employeeId ?? undefined, year })}`),
    enabled: !!employeeId,
  });

export interface LeaveRequestListParams { employeeId?: string; status?: string; page?: number; pageSize?: number }
export const useLeaveRequests = (params: LeaveRequestListParams = {}) =>
  useQuery({
    queryKey: hrKeys.leaveRequests(params),
    queryFn: () => apiFetch<LeaveRequestListResult>(`/hr/leave/requests?${qstr(params as Record<string, string | number | undefined>)}`),
    placeholderData: (p) => p,
  });

function invalidateLeaveRequests(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["hr", "leaveRequests"] });
  void qc.invalidateQueries({ queryKey: ["hr", "leaveBalances"] });
  void qc.invalidateQueries({ queryKey: ["hr", "me", "leave"] });
  void qc.invalidateQueries({ queryKey: hrKeys.dashboard });
}

export interface LeaveRequestInput { employeeId?: string; leaveTypeId: string; fromDate: string; toDate: string; reason?: string; submit?: boolean }
export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveRequestInput) => apiFetch<LeaveRequestDto>("/hr/leave/requests", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { invalidateLeaveRequests(qc); toast.success("Leave request created"); },
    onError: err,
  });
}
function leaveAction(path: (id: string) => string, successMsg: string) {
  return function useAction() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, note }: { id: string; note?: string }) =>
        apiFetch<LeaveRequestDto>(path(id), { method: "POST", body: JSON.stringify({ note }) }),
      onSuccess: () => { invalidateLeaveRequests(qc); toast.success(successMsg); },
      onError: err,
    });
  };
}
export const useSubmitLeaveRequest = leaveAction((id) => `/hr/leave/requests/${id}/submit`, "Leave request submitted");
export const useManagerApproveLeave = leaveAction((id) => `/hr/leave/requests/${id}/manager-approve`, "Approved by manager");
export const useHrApproveLeave = leaveAction((id) => `/hr/leave/requests/${id}/hr-approve`, "Leave approved");
export const useRejectLeaveRequest = leaveAction((id) => `/hr/leave/requests/${id}/reject`, "Leave rejected");
export function useCancelLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<LeaveRequestDto>(`/hr/leave/requests/${id}/cancel`, { method: "POST" }),
    onSuccess: () => { invalidateLeaveRequests(qc); toast.success("Leave request cancelled"); },
    onError: err,
  });
}

// ─── Holidays ───────────────────────────────────────────────────────────────
export interface HolidayListParams { year?: number; branchId?: string }
export const useHolidays = (params: HolidayListParams = {}) =>
  useQuery({
    queryKey: hrKeys.holidays(params),
    queryFn: () => apiFetch<HolidayDto[]>(`/hr/holidays?${qstr(params as Record<string, string | number | undefined>)}`),
  });

export interface HolidayInput { name: string; date: string; scope?: string; branchId?: string | null; departmentId?: string | null; optional?: boolean }
function invalidateHolidays(qc: ReturnType<typeof useQueryClient>) { void qc.invalidateQueries({ queryKey: ["hr", "holidays"] }); }
export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HolidayInput) => apiFetch<HolidayDto>("/hr/holidays", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { invalidateHolidays(qc); toast.success("Holiday added"); },
    onError: err,
  });
}
export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<HolidayInput> }) =>
      apiFetch<HolidayDto>(`/hr/holidays/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { invalidateHolidays(qc); toast.success("Holiday updated"); },
    onError: err,
  });
}
export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/hr/holidays/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidateHolidays(qc); toast.success("Holiday removed"); },
    onError: err,
  });
}

// ─── Attendance ─────────────────────────────────────────────────────────────
export interface AttendanceListParams { employeeId?: string; from?: string; to?: string; page?: number; pageSize?: number }
export const useAttendance = (params: AttendanceListParams = {}) =>
  useQuery({
    queryKey: hrKeys.attendance(params),
    queryFn: () => apiFetch<AttendanceListResult>(`/hr/attendance?${qstr(params as Record<string, string | number | undefined>)}`),
    placeholderData: (p) => p,
  });

export interface AttendanceUpsertInput { employeeId: string; date: string; clockIn?: string | null; clockOut?: string | null; status?: string; note?: string | null }
export function useUpsertAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceUpsertInput) => apiFetch<AttendanceDto>("/hr/attendance", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["hr", "attendance"] });
      void qc.invalidateQueries({ queryKey: hrKeys.dashboard });
      toast.success("Attendance saved");
    },
    onError: err,
  });
}

export interface CorrectionListParams { employeeId?: string; status?: string; page?: number; pageSize?: number }
export const useAttendanceCorrections = (params: CorrectionListParams = {}) =>
  useQuery({
    queryKey: hrKeys.attendanceCorrections(params),
    queryFn: () => apiFetch<AttendanceCorrectionListResult>(`/hr/attendance/corrections?${qstr(params as Record<string, string | number | undefined>)}`),
  });

function invalidateCorrections(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["hr", "attendanceCorrections"] });
  void qc.invalidateQueries({ queryKey: ["hr", "attendance"] });
}
export interface AttendanceCorrectionInput { attendanceId: string; requestedClockIn?: string | null; requestedClockOut?: string | null; requestedStatus?: string | null; reason?: string | null }
export function useCreateAttendanceCorrection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceCorrectionInput) => apiFetch<AttendanceCorrectionDto>("/hr/attendance/corrections", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { invalidateCorrections(qc); toast.success("Correction request submitted"); },
    onError: err,
  });
}
function correctionAction(path: (id: string) => string, successMsg: string) {
  return function useAction() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, note }: { id: string; note?: string }) =>
        apiFetch<AttendanceCorrectionDto>(path(id), { method: "POST", body: JSON.stringify({ note }) }),
      onSuccess: () => { invalidateCorrections(qc); toast.success(successMsg); },
      onError: err,
    });
  };
}
export const useManagerApproveCorrection = correctionAction((id) => `/hr/attendance/corrections/${id}/manager-approve`, "Approved by manager");
export const useHrApproveCorrection = correctionAction((id) => `/hr/attendance/corrections/${id}/hr-approve`, "Correction approved");
export const useRejectCorrection = correctionAction((id) => `/hr/attendance/corrections/${id}/reject`, "Correction rejected");

// ─── Reports ────────────────────────────────────────────────────────────────
export type HrReportKey = "employees" | "joining" | "department" | "attendance" | "leave" | "confirmation" | "birthday" | "document-expiry";
export type HrReportFormat = "csv" | "xlsx" | "pdf";
export function downloadHrReport(report: HrReportKey, format: HrReportFormat, extra: Record<string, string | number | undefined> = {}): Promise<void> {
  const qs = qstr({ report, format, ...extra });
  return downloadViaApi(`/hr/reports/export?${qs}`, `hr-${report}.${format}`).catch((e: Error) => { err(e); });
}

// ─── Me (portal self-service) ───────────────────────────────────────────────
export const useHrMe = () =>
  useQuery({
    queryKey: hrKeys.me,
    queryFn: () => apiFetch<EmployeeDetail>("/hr/me"),
    retry: false,
  });

export function useUpdateHrMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeUpdateInput) => apiFetch<EmployeeDetail>("/hr/me", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: hrKeys.me }); toast.success("Profile updated"); },
    onError: err,
  });
}

export const useMyLeaveTypes = () =>
  useQuery({ queryKey: hrKeys.myLeaveTypes, queryFn: () => apiFetch<LeaveTypeDto[]>("/hr/me/leave-types") });

export interface MyApprovalsDto {
  leave: LeaveRequestDto[];
  corrections: AttendanceCorrectionDto[];
}
export const useMyApprovals = () =>
  useQuery({ queryKey: hrKeys.myApprovals, queryFn: () => apiFetch<MyApprovalsDto>("/hr/me/approvals") });

export const useMyLeaveRequests = () =>
  useQuery({ queryKey: hrKeys.myLeave, queryFn: () => apiFetch<LeaveRequestListResult>("/hr/me/leave") });

export function useCreateMyLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<LeaveRequestInput, "employeeId">) => apiFetch<LeaveRequestDto>("/hr/me/leave", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrKeys.myLeave });
      void qc.invalidateQueries({ queryKey: ["hr", "leaveBalances"] });
      toast.success("Leave request submitted");
    },
    onError: err,
  });
}

export interface MyAttendanceParams { from?: string; to?: string }
export const useMyAttendance = (params: MyAttendanceParams = {}) =>
  useQuery({
    queryKey: hrKeys.myAttendance(params),
    queryFn: () => apiFetch<AttendanceListResult>(`/hr/me/attendance?${qstr(params as Record<string, string | number | undefined>)}`),
  });

function invalidateMyAttendance(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["hr", "me", "attendance"] });
}
export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<AttendanceDto>("/hr/me/attendance/clock-in", { method: "POST" }),
    onSuccess: () => { invalidateMyAttendance(qc); toast.success("Clocked in"); },
    onError: err,
  });
}
export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<AttendanceDto>("/hr/me/attendance/clock-out", { method: "POST" }),
    onSuccess: () => { invalidateMyAttendance(qc); toast.success("Clocked out"); },
    onError: err,
  });
}
export function useCreateMyAttendanceCorrection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceCorrectionInput) => apiFetch<AttendanceCorrectionDto>("/hr/me/attendance/corrections", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { invalidateMyAttendance(qc); toast.success("Correction request submitted"); },
    onError: err,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      apiFetch<{ ok: boolean }>("/auth/change-password", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => toast.success("Password changed — please sign in again"),
    onError: err,
  });
}

export type { EmployeeCreateInput, EmployeeUpdateInput };
