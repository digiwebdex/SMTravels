import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { uploadSingleFile } from "../lib/uploads";
import { uploadRateLimiter } from "../middleware/rateLimit";
import {
  dashboardHandler,
  listDepartmentsHandler, createDepartmentHandler, updateDepartmentHandler, deleteDepartmentHandler,
  listSectionsHandler, createSectionHandler, updateSectionHandler, deleteSectionHandler,
  listTeamsHandler, createTeamHandler, updateTeamHandler, deleteTeamHandler,
  listDesignationsHandler, createDesignationHandler, updateDesignationHandler, deleteDesignationHandler,
  listEmployeesHandler, getEmployeeHandler, createEmployeeHandler, updateEmployeeHandler, deleteEmployeeHandler,
  setEmployeeStatusHandler, employeeTimelineHandler,
  listEmployeeDocumentsHandler, createEmployeeDocumentHandler, replaceEmployeeDocumentHandler,
  deleteEmployeeDocumentHandler, employeeDocumentFileHandler,
  listLeaveTypesHandler, createLeaveTypeHandler, updateLeaveTypeHandler, leaveBalancesHandler,
  listLeaveRequestsHandler, createLeaveRequestHandler, submitLeaveRequestHandler,
  managerApproveLeaveHandler, hrApproveLeaveHandler, rejectLeaveRequestHandler, cancelLeaveRequestHandler,
  listHolidaysHandler, createHolidayHandler, updateHolidayHandler, deleteHolidayHandler,
  listAttendanceHandler, upsertAttendanceHandler, clockInHandler, clockOutHandler,
  listAttendanceCorrectionsHandler, createAttendanceCorrectionHandler,
  managerApproveCorrectionHandler, hrApproveCorrectionHandler, rejectCorrectionHandler,
  exportHandler,
  meHandler, updateMeHandler, myLeaveRequestsHandler, createMyLeaveRequestHandler, myAttendanceHandler,
  createMyAttendanceCorrectionHandler,
} from "../controllers/hr.controller";

// HR module — branch-scoped via branchWhere() in the service. Admin/back-office
// routes require the "hr" RBAC module; the "/hr/me*" portal routes only need a
// valid session (ownership is resolved server-side from req.auth.userId).
export const hrRouter = Router();
const view = requirePermission("hr", "view");
const manage = requirePermission("hr", "manage");

// ── Dashboard ───────────────────────────────────────────────────────────────
hrRouter.get("/hr/dashboard", requireAuth, view, asyncHandler(dashboardHandler));

// ── Org structure ───────────────────────────────────────────────────────────
hrRouter.get("/hr/departments", requireAuth, view, asyncHandler(listDepartmentsHandler));
hrRouter.post("/hr/departments", requireAuth, manage, asyncHandler(createDepartmentHandler));
hrRouter.patch("/hr/departments/:id", requireAuth, manage, asyncHandler(updateDepartmentHandler));
hrRouter.delete("/hr/departments/:id", requireAuth, manage, asyncHandler(deleteDepartmentHandler));

hrRouter.get("/hr/sections", requireAuth, view, asyncHandler(listSectionsHandler));
hrRouter.post("/hr/sections", requireAuth, manage, asyncHandler(createSectionHandler));
hrRouter.patch("/hr/sections/:id", requireAuth, manage, asyncHandler(updateSectionHandler));
hrRouter.delete("/hr/sections/:id", requireAuth, manage, asyncHandler(deleteSectionHandler));

hrRouter.get("/hr/teams", requireAuth, view, asyncHandler(listTeamsHandler));
hrRouter.post("/hr/teams", requireAuth, manage, asyncHandler(createTeamHandler));
hrRouter.patch("/hr/teams/:id", requireAuth, manage, asyncHandler(updateTeamHandler));
hrRouter.delete("/hr/teams/:id", requireAuth, manage, asyncHandler(deleteTeamHandler));

hrRouter.get("/hr/designations", requireAuth, view, asyncHandler(listDesignationsHandler));
hrRouter.post("/hr/designations", requireAuth, manage, asyncHandler(createDesignationHandler));
hrRouter.patch("/hr/designations/:id", requireAuth, manage, asyncHandler(updateDesignationHandler));
hrRouter.delete("/hr/designations/:id", requireAuth, manage, asyncHandler(deleteDesignationHandler));

// ── Employees ────────────────────────────────────────────────────────────────
hrRouter.get("/hr/employees", requireAuth, view, asyncHandler(listEmployeesHandler));
hrRouter.post("/hr/employees", requireAuth, manage, asyncHandler(createEmployeeHandler));
hrRouter.get("/hr/employees/:id", requireAuth, view, asyncHandler(getEmployeeHandler));
hrRouter.patch("/hr/employees/:id", requireAuth, manage, asyncHandler(updateEmployeeHandler));
hrRouter.delete("/hr/employees/:id", requireAuth, manage, asyncHandler(deleteEmployeeHandler));
hrRouter.get("/hr/employees/:id/timeline", requireAuth, view, asyncHandler(employeeTimelineHandler));
hrRouter.patch("/hr/employees/:id/status", requireAuth, manage, asyncHandler(setEmployeeStatusHandler));

// ── Employee documents ───────────────────────────────────────────────────────
hrRouter.get("/hr/employees/:id/documents", requireAuth, view, asyncHandler(listEmployeeDocumentsHandler));
hrRouter.post("/hr/employees/:id/documents", requireAuth, manage, uploadRateLimiter, uploadSingleFile, asyncHandler(createEmployeeDocumentHandler));
hrRouter.get("/hr/employees/:id/documents/:docId/file", requireAuth, view, asyncHandler(employeeDocumentFileHandler));
hrRouter.post("/hr/employees/:id/documents/:docId/replace", requireAuth, manage, uploadRateLimiter, uploadSingleFile, asyncHandler(replaceEmployeeDocumentHandler));
hrRouter.patch("/hr/employees/:id/documents/:docId", requireAuth, manage, asyncHandler(deleteEmployeeDocumentHandler));

// ── Leave ────────────────────────────────────────────────────────────────────
hrRouter.get("/hr/leave/types", requireAuth, view, asyncHandler(listLeaveTypesHandler));
hrRouter.post("/hr/leave/types", requireAuth, manage, asyncHandler(createLeaveTypeHandler));
hrRouter.patch("/hr/leave/types/:id", requireAuth, manage, asyncHandler(updateLeaveTypeHandler));
hrRouter.get("/hr/leave/balances", requireAuth, view, asyncHandler(leaveBalancesHandler));
hrRouter.get("/hr/leave/requests", requireAuth, view, asyncHandler(listLeaveRequestsHandler));
hrRouter.post("/hr/leave/requests", requireAuth, manage, asyncHandler(createLeaveRequestHandler));
hrRouter.post("/hr/leave/requests/:id/submit", requireAuth, asyncHandler(submitLeaveRequestHandler));
// Manager-step approval: authorized inside the service (hr.manage OR the employee's manager),
// so it intentionally only needs a valid session — a plain manager rarely holds the hr RBAC grant.
hrRouter.post("/hr/leave/requests/:id/manager-approve", requireAuth, asyncHandler(managerApproveLeaveHandler));
hrRouter.post("/hr/leave/requests/:id/hr-approve", requireAuth, manage, asyncHandler(hrApproveLeaveHandler));
hrRouter.post("/hr/leave/requests/:id/reject", requireAuth, asyncHandler(rejectLeaveRequestHandler));
hrRouter.post("/hr/leave/requests/:id/cancel", requireAuth, asyncHandler(cancelLeaveRequestHandler));

// ── Holidays ─────────────────────────────────────────────────────────────────
hrRouter.get("/hr/holidays", requireAuth, view, asyncHandler(listHolidaysHandler));
hrRouter.post("/hr/holidays", requireAuth, manage, asyncHandler(createHolidayHandler));
hrRouter.patch("/hr/holidays/:id", requireAuth, manage, asyncHandler(updateHolidayHandler));
hrRouter.delete("/hr/holidays/:id", requireAuth, manage, asyncHandler(deleteHolidayHandler));

// ── Attendance ───────────────────────────────────────────────────────────────
hrRouter.get("/hr/attendance", requireAuth, view, asyncHandler(listAttendanceHandler));
hrRouter.post("/hr/attendance", requireAuth, manage, asyncHandler(upsertAttendanceHandler));
hrRouter.get("/hr/attendance/corrections", requireAuth, view, asyncHandler(listAttendanceCorrectionsHandler));
hrRouter.post("/hr/attendance/corrections", requireAuth, asyncHandler(createAttendanceCorrectionHandler));
hrRouter.post("/hr/attendance/corrections/:id/manager-approve", requireAuth, asyncHandler(managerApproveCorrectionHandler));
hrRouter.post("/hr/attendance/corrections/:id/hr-approve", requireAuth, manage, asyncHandler(hrApproveCorrectionHandler));
hrRouter.post("/hr/attendance/corrections/:id/reject", requireAuth, asyncHandler(rejectCorrectionHandler));

// ── Reports ──────────────────────────────────────────────────────────────────
hrRouter.get("/hr/reports/export", requireAuth, view, asyncHandler(exportHandler));

// ── Portal self-service ("/hr/me*") ─────────────────────────────────────────
// Ownership is resolved server-side (Employee.userId === req.auth.userId) —
// no hr RBAC grant required, matching the CUSTOMER/AGENT/SUPPLIER portal pattern.
hrRouter.get("/hr/me", requireAuth, asyncHandler(meHandler));
hrRouter.patch("/hr/me", requireAuth, asyncHandler(updateMeHandler));
hrRouter.get("/hr/me/leave", requireAuth, asyncHandler(myLeaveRequestsHandler));
hrRouter.post("/hr/me/leave", requireAuth, asyncHandler(createMyLeaveRequestHandler));
hrRouter.get("/hr/me/attendance", requireAuth, asyncHandler(myAttendanceHandler));
hrRouter.post("/hr/me/attendance/clock-in", requireAuth, asyncHandler(clockInHandler));
hrRouter.post("/hr/me/attendance/clock-out", requireAuth, asyncHandler(clockOutHandler));
hrRouter.post("/hr/me/attendance/corrections", requireAuth, asyncHandler(createMyAttendanceCorrectionHandler));
