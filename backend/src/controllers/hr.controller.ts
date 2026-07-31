import type { Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler";
import {
  hrListQuerySchema,
  orgUnitCreateSchema,
  employeeCreateSchema,
  employeeUpdateSchema,
  employeeStatusSchema,
  hrDocMetaSchema,
  leaveTypeCreateSchema,
  leaveRequestCreateSchema,
  leaveDecisionSchema,
  holidayCreateSchema,
  attendanceUpsertSchema,
  attendanceCorrectionSchema,
  hrExportQuerySchema,
} from "../contracts/hr.contract";
import * as hr from "../services/hr.service";

const orgUnitUpdateSchema = orgUnitCreateSchema.partial();
const leaveTypeUpdateSchema = leaveTypeCreateSchema.partial();
const holidayUpdateSchema = holidayCreateSchema.partial();
const hrDocMetaUpdateSchema = hrDocMetaSchema.partial();

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function dashboardHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.getDashboard(req.auth!));
}

// ─── Org: Departments ───────────────────────────────────────────────────────

export async function listDepartmentsHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.listDepartments(req.auth!, hrListQuerySchema.parse(req.query)));
}
export async function createDepartmentHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.createDepartment(req.auth!, orgUnitCreateSchema.parse(req.body)));
}
export async function updateDepartmentHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.updateDepartment(req.auth!, req.params.id, orgUnitUpdateSchema.parse(req.body)));
}
export async function deleteDepartmentHandler(req: Request, res: Response): Promise<void> {
  await hr.deleteDepartment(req.auth!, req.params.id);
  res.json({ ok: true });
}

// ─── Org: Sections ──────────────────────────────────────────────────────────

export async function listSectionsHandler(req: Request, res: Response): Promise<void> {
  const q = hrListQuerySchema.parse(req.query);
  res.json(await hr.listSections(req.auth!, { ...q, departmentId: (req.query.departmentId as string) || undefined }));
}
export async function createSectionHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.createSection(req.auth!, orgUnitCreateSchema.parse(req.body)));
}
export async function updateSectionHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.updateSection(req.auth!, req.params.id, orgUnitUpdateSchema.parse(req.body)));
}
export async function deleteSectionHandler(req: Request, res: Response): Promise<void> {
  await hr.deleteSection(req.auth!, req.params.id);
  res.json({ ok: true });
}

// ─── Org: Teams ─────────────────────────────────────────────────────────────

export async function listTeamsHandler(req: Request, res: Response): Promise<void> {
  const q = hrListQuerySchema.parse(req.query);
  res.json(await hr.listTeams(req.auth!, { ...q, sectionId: (req.query.sectionId as string) || undefined }));
}
export async function createTeamHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.createTeam(req.auth!, orgUnitCreateSchema.parse(req.body)));
}
export async function updateTeamHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.updateTeam(req.auth!, req.params.id, orgUnitUpdateSchema.parse(req.body)));
}
export async function deleteTeamHandler(req: Request, res: Response): Promise<void> {
  await hr.deleteTeam(req.auth!, req.params.id);
  res.json({ ok: true });
}

// ─── Org: Designations ──────────────────────────────────────────────────────

export async function listDesignationsHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.listDesignations(req.auth!, hrListQuerySchema.parse(req.query)));
}
export async function createDesignationHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.createDesignation(req.auth!, orgUnitCreateSchema.parse(req.body)));
}
export async function updateDesignationHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.updateDesignation(req.auth!, req.params.id, orgUnitUpdateSchema.parse(req.body)));
}
export async function deleteDesignationHandler(req: Request, res: Response): Promise<void> {
  await hr.deleteDesignation(req.auth!, req.params.id);
  res.json({ ok: true });
}

// ─── Employees ──────────────────────────────────────────────────────────────

export async function listEmployeesHandler(req: Request, res: Response): Promise<void> {
  const q = hrListQuerySchema.parse(req.query);
  res.json(await hr.listEmployees(req.auth!, {
    ...q,
    status: (req.query.status as string) || undefined,
    departmentId: (req.query.departmentId as string) || undefined,
  }));
}
export async function getEmployeeHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.getEmployee(req.auth!, req.params.id));
}
export async function createEmployeeHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.createEmployee(req.auth!, employeeCreateSchema.parse(req.body)));
}
export async function updateEmployeeHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.updateEmployee(req.auth!, req.params.id, employeeUpdateSchema.parse(req.body)));
}
export async function deleteEmployeeHandler(req: Request, res: Response): Promise<void> {
  await hr.deleteEmployee(req.auth!, req.params.id);
  res.json({ ok: true });
}
export async function setEmployeeStatusHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.setEmployeeStatus(req.auth!, req.params.id, employeeStatusSchema.parse(req.body)));
}
export async function employeeTimelineHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.getEmployeeTimeline(req.auth!, req.params.id));
}

// ─── Employee documents ─────────────────────────────────────────────────────

export async function listEmployeeDocumentsHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.listEmployeeDocuments(req.auth!, req.params.id));
}
export async function createEmployeeDocumentHandler(req: Request, res: Response): Promise<void> {
  if (!req.file) throw new HttpError(400, "FileRequired", { detail: "Attach the file in the \"file\" field." });
  res.status(201).json(await hr.createEmployeeDocument(req.auth!, req.params.id, req.file, hrDocMetaSchema.parse(req.body)));
}
export async function replaceEmployeeDocumentHandler(req: Request, res: Response): Promise<void> {
  if (!req.file) throw new HttpError(400, "FileRequired", { detail: "Attach the file in the \"file\" field." });
  res.json(await hr.replaceEmployeeDocument(req.auth!, req.params.id, req.params.docId, req.file, hrDocMetaUpdateSchema.parse(req.body)));
}
export async function deleteEmployeeDocumentHandler(req: Request, res: Response): Promise<void> {
  await hr.deleteEmployeeDocument(req.auth!, req.params.id, req.params.docId);
  res.json({ ok: true });
}
export async function employeeDocumentFileHandler(req: Request, res: Response): Promise<void> {
  const f = await hr.getEmployeeDocumentFile(req.auth!, req.params.id, req.params.docId);
  res.setHeader("Content-Type", f.mimeType);
  res.setHeader("Cache-Control", "private, no-store");
  res.download(f.absPath, f.name);
}

// ─── Leave ──────────────────────────────────────────────────────────────────

export async function listLeaveTypesHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.listLeaveTypes(req.auth!));
}
export async function createLeaveTypeHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.createLeaveType(req.auth!, leaveTypeCreateSchema.parse(req.body)));
}
export async function updateLeaveTypeHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.updateLeaveType(req.auth!, req.params.id, leaveTypeUpdateSchema.parse(req.body)));
}
export async function leaveBalancesHandler(req: Request, res: Response): Promise<void> {
  const employeeId = req.query.employeeId as string | undefined;
  const year = req.query.year ? Number(req.query.year) : new Date().getUTCFullYear();
  if (!employeeId) throw new HttpError(400, "ValidationError", { detail: "employeeId is required." });
  res.json(await hr.getBalances(req.auth!, employeeId, year));
}
export async function listLeaveRequestsHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.listLeaveRequests(req.auth!, {
    employeeId: (req.query.employeeId as string) || undefined,
    status: (req.query.status as string) || undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  }));
}
export async function createLeaveRequestHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.createLeaveRequest(req.auth!, leaveRequestCreateSchema.parse(req.body)));
}
export async function submitLeaveRequestHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.submitLeaveRequest(req.auth!, req.params.id));
}
export async function managerApproveLeaveHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.managerApproveLeave(req.auth!, req.params.id, leaveDecisionSchema.parse(req.body ?? {})));
}
export async function hrApproveLeaveHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.hrApproveLeave(req.auth!, req.params.id, leaveDecisionSchema.parse(req.body ?? {})));
}
export async function rejectLeaveRequestHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.rejectLeaveRequest(req.auth!, req.params.id, leaveDecisionSchema.parse(req.body ?? {})));
}
export async function cancelLeaveRequestHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.cancelLeaveRequest(req.auth!, req.params.id));
}

// ─── Holidays ───────────────────────────────────────────────────────────────

export async function listHolidaysHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.listHolidays(req.auth!, {
    year: req.query.year ? Number(req.query.year) : undefined,
    branchId: (req.query.branchId as string) || undefined,
  }));
}
export async function createHolidayHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.createHoliday(req.auth!, holidayCreateSchema.parse(req.body)));
}
export async function updateHolidayHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.updateHoliday(req.auth!, req.params.id, holidayUpdateSchema.parse(req.body)));
}
export async function deleteHolidayHandler(req: Request, res: Response): Promise<void> {
  await hr.deleteHoliday(req.auth!, req.params.id);
  res.json({ ok: true });
}

// ─── Attendance ─────────────────────────────────────────────────────────────

export async function listAttendanceHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.listAttendance(req.auth!, {
    employeeId: (req.query.employeeId as string) || undefined,
    from: (req.query.from as string) || undefined,
    to: (req.query.to as string) || undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  }));
}
export async function upsertAttendanceHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.upsertAttendance(req.auth!, attendanceUpsertSchema.parse(req.body)));
}
export async function myAttendanceHandler(req: Request, res: Response): Promise<void> {
  const me = await hr.getMyEmployee(req.auth!);
  res.json(await hr.listAttendance(req.auth!, {
    employeeId: me.id,
    from: (req.query.from as string) || undefined,
    to: (req.query.to as string) || undefined,
  }));
}
export async function clockInHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.clockIn(req.auth!));
}
export async function clockOutHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.clockOut(req.auth!));
}
export async function listAttendanceCorrectionsHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.listAttendanceCorrections(req.auth!, {
    employeeId: (req.query.employeeId as string) || undefined,
    status: (req.query.status as string) || undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  }));
}
export async function createAttendanceCorrectionHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.createAttendanceCorrection(req.auth!, attendanceCorrectionSchema.parse(req.body)));
}
export async function managerApproveCorrectionHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.managerApproveCorrection(req.auth!, req.params.id, req.body?.note));
}
export async function hrApproveCorrectionHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.hrApproveCorrection(req.auth!, req.params.id, req.body?.note));
}
export async function rejectCorrectionHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.rejectCorrection(req.auth!, req.params.id, req.body?.note));
}

// ─── Reports ────────────────────────────────────────────────────────────────

export async function exportHandler(req: Request, res: Response): Promise<void> {
  const q = hrExportQuerySchema.parse(req.query);
  const { headers, rows } = await hr.buildTable(req.auth!, q);
  const stamp = new Date().toISOString().slice(0, 10);

  if (q.format === "xlsx") {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(q.report);
    ws.addRow(headers);
    for (const row of rows) ws.addRow(row);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="hr-${q.report}-${stamp}.xlsx"`);
    res.send(buf);
    return;
  }

  if (q.format === "pdf") {
    const PDFDocument = (await import("pdfkit")).default;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="hr-${q.report}-${stamp}.pdf"`);
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);
    doc.fontSize(14).text(`SM Travels — HR ${q.report.toUpperCase()} Report`, { underline: true });
    doc.moveDown();
    doc.fontSize(9).text(headers.join(" | "));
    doc.moveDown(0.5);
    for (const row of rows.slice(0, 200)) doc.text(row.join(" | "));
    if (rows.length > 200) doc.text(`… and ${rows.length - 200} more rows`);
    doc.end();
    return;
  }

  const csvCell = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="hr-${q.report}-${stamp}.csv"`);
  res.send(csv);
}

// ─── Me (portal self-service) ───────────────────────────────────────────────

export async function meHandler(req: Request, res: Response): Promise<void> {
  const me = await hr.getMyEmployee(req.auth!);
  res.json(await hr.getEmployee(req.auth!, me.id));
}
export async function updateMeHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.updateMyProfile(req.auth!, employeeUpdateSchema.parse(req.body)));
}
export async function myLeaveTypesHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.listMyLeaveTypes(req.auth!));
}
export async function myDocumentFileHandler(req: Request, res: Response): Promise<void> {
  const f = await hr.getMyDocumentFile(req.auth!, req.params.docId);
  res.setHeader("Content-Type", f.mimeType);
  res.setHeader("Cache-Control", "private, no-store");
  res.download(f.absPath, f.name);
}
export async function myApprovalsHandler(req: Request, res: Response): Promise<void> {
  res.json(await hr.listMyManagerApprovals(req.auth!));
}
export async function myLeaveRequestsHandler(req: Request, res: Response): Promise<void> {
  const me = await hr.getMyEmployee(req.auth!);
  res.json(await hr.listLeaveRequests(req.auth!, { employeeId: me.id }));
}
export async function createMyLeaveRequestHandler(req: Request, res: Response): Promise<void> {
  const input = leaveRequestCreateSchema.parse(req.body);
  res.status(201).json(await hr.createLeaveRequest(req.auth!, { ...input, employeeId: undefined }));
}
export async function createMyAttendanceCorrectionHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await hr.createAttendanceCorrection(req.auth!, attendanceCorrectionSchema.parse(req.body)));
}
