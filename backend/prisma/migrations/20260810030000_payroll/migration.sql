-- Module 5: HR Payroll — runs + payslips (additive, non-destructive).
CREATE TABLE IF NOT EXISTS "PayrollRun" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "label" TEXT,
    "branchId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "grossTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deductionTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(6),
    "paidAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PayrollRun_code_key" ON "PayrollRun"("code");
CREATE INDEX IF NOT EXISTS "PayrollRun_status_idx" ON "PayrollRun"("status");
CREATE INDEX IF NOT EXISTS "PayrollRun_periodYear_periodMonth_idx" ON "PayrollRun"("periodYear", "periodMonth");

CREATE TABLE IF NOT EXISTS "Payslip" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeCode" TEXT,
    "employeeName" TEXT NOT NULL,
    "basic" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bonus" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "overtime" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "advance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "loan" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "gross" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMPTZ(6),
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Payslip_payrollRunId_employeeId_key" ON "Payslip"("payrollRunId", "employeeId");
CREATE INDEX IF NOT EXISTS "Payslip_payrollRunId_idx" ON "Payslip"("payrollRunId");
CREATE INDEX IF NOT EXISTS "Payslip_employeeId_idx" ON "Payslip"("employeeId");

DO $$ BEGIN
  ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollRunId_fkey"
    FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
