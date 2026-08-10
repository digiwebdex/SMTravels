/**
 * Payroll (Module 5) contract. Runs + payslips over the existing Employee/HR data
 * (no duplicate employee records). Workflow DRAFT→CALCULATED→APPROVED→PAID→CLOSED.
 */
import { z } from "zod";

export const PAYROLL_STATUSES = ["DRAFT", "CALCULATED", "APPROVED", "PAID", "CLOSED"] as const;

export const payrollRunListQuerySchema = z.object({
  status: z.string().trim().optional(),
  year: z.coerce.number().int().optional(),
});
export type PayrollRunListQuery = z.infer<typeof payrollRunListQuerySchema>;

export const payrollRunCreateSchema = z.object({
  periodMonth: z.coerce.number().int().min(1).max(12),
  periodYear: z.coerce.number().int().min(2000).max(2100),
  label: z.string().trim().max(120).optional(),
  branchId: z.string().trim().optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type PayrollRunCreateInput = z.infer<typeof payrollRunCreateSchema>;

export const payslipUpdateSchema = z.object({
  basic: z.coerce.number().min(0).optional(),
  allowances: z.coerce.number().min(0).optional(),
  bonus: z.coerce.number().min(0).optional(),
  overtime: z.coerce.number().min(0).optional(),
  deductions: z.coerce.number().min(0).optional(),
  advance: z.coerce.number().min(0).optional(),
  loan: z.coerce.number().min(0).optional(),
  remarks: z.string().trim().max(500).optional(),
});
export type PayslipUpdateInput = z.infer<typeof payslipUpdateSchema>;

export interface PayslipDto {
  id: string; employeeId: string; employeeCode: string | null; employeeName: string;
  basic: string; allowances: string; bonus: string; overtime: string;
  deductions: string; advance: string; loan: string; gross: string; net: string;
  paymentStatus: string; remarks: string | null;
}
export interface PayrollRunDto {
  id: string; code: string; periodMonth: number; periodYear: number; label: string | null;
  branchId: string | null; status: string; grossTotal: string; deductionTotal: string; netTotal: string;
  approvedAt: string | null; paidAt: string | null; notes: string | null; payslipCount: number; createdAt: string;
}
export interface PayrollRunDetailDto extends PayrollRunDto { payslips: PayslipDto[] }
export interface PayrollRunListResponse { runs: PayrollRunDto[] }
