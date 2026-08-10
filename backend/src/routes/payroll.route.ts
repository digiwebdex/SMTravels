import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listPayrollRunsHandler, getPayrollRunHandler, createPayrollRunHandler, calculatePayrollRunHandler,
  updatePayslipHandler, approvePayrollRunHandler, markPayrollRunPaidHandler, closePayrollRunHandler,
} from "../controllers/payroll.controller";

// Payroll (Module 5). Gated on the existing "settings" module (sensitive HR/finance
// data — same gate as the HR admin surface). view = read, manage = write/transition.
export const payrollRouter = Router();
const view = requirePermission("payroll", "view");
const manage = requirePermission("payroll", "manage");

payrollRouter.get("/payroll/runs", requireAuth, view, asyncHandler(listPayrollRunsHandler));
payrollRouter.get("/payroll/runs/:id", requireAuth, view, asyncHandler(getPayrollRunHandler));
payrollRouter.post("/payroll/runs", requireAuth, manage, asyncHandler(createPayrollRunHandler));
payrollRouter.post("/payroll/runs/:id/calculate", requireAuth, manage, asyncHandler(calculatePayrollRunHandler));
payrollRouter.post("/payroll/runs/:id/approve", requireAuth, manage, asyncHandler(approvePayrollRunHandler));
payrollRouter.post("/payroll/runs/:id/pay", requireAuth, manage, asyncHandler(markPayrollRunPaidHandler));
payrollRouter.post("/payroll/runs/:id/close", requireAuth, manage, asyncHandler(closePayrollRunHandler));
payrollRouter.patch("/payroll/payslips/:id", requireAuth, manage, asyncHandler(updatePayslipHandler));
