import type { Request, Response } from "express";
import * as payroll from "../services/payroll.service";
import { payrollRunListQuerySchema, payrollRunCreateSchema, payslipUpdateSchema } from "../contracts/payroll.contract";

// Payroll (Module 5) — runs + payslips + workflow transitions.
export async function listPayrollRunsHandler(req: Request, res: Response) {
  res.json(await payroll.listPayrollRuns(req.auth!, payrollRunListQuerySchema.parse(req.query)));
}
export async function getPayrollRunHandler(req: Request, res: Response) {
  res.json(await payroll.getPayrollRun(req.auth!, req.params.id));
}
export async function createPayrollRunHandler(req: Request, res: Response) {
  res.status(201).json(await payroll.createPayrollRun(req.auth!, payrollRunCreateSchema.parse(req.body)));
}
export async function calculatePayrollRunHandler(req: Request, res: Response) {
  res.json(await payroll.calculatePayrollRun(req.auth!, req.params.id));
}
export async function updatePayslipHandler(req: Request, res: Response) {
  res.json(await payroll.updatePayslip(req.auth!, req.params.id, payslipUpdateSchema.parse(req.body)));
}
export async function approvePayrollRunHandler(req: Request, res: Response) {
  res.json(await payroll.approvePayrollRun(req.auth!, req.params.id));
}
export async function markPayrollRunPaidHandler(req: Request, res: Response) {
  res.json(await payroll.markPayrollRunPaid(req.auth!, req.params.id));
}
export async function closePayrollRunHandler(req: Request, res: Response) {
  res.json(await payroll.closePayrollRun(req.auth!, req.params.id));
}
