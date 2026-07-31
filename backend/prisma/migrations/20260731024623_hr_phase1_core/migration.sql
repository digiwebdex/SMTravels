-- CreateEnum
CREATE TYPE "EmployeeLifecycle" AS ENUM ('DRAFT', 'OFFERED', 'JOINED', 'PROBATION', 'CONFIRMED', 'TRANSFERRED', 'RESIGNED', 'TERMINATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "HrDocType" AS ENUM ('OFFER_LETTER', 'APPOINTMENT_LETTER', 'CONTRACT', 'PASSPORT', 'NATIONAL_ID', 'CERTIFICATE', 'RESUME', 'MEDICAL', 'DRIVING_LICENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "HrLeaveRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'HR_APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HrHolidayScope" AS ENUM ('NATIONAL', 'COMPANY', 'BRANCH', 'DEPARTMENT', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "HrAttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'EARLY_LEAVE', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "HrCorrectionStatus" AS ENUM ('SUBMITTED', 'MANAGER_APPROVED', 'HR_APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "HrDepartment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "branchId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "HrDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrSection" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "HrSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrTeam" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "HrTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrDesignation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "level" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "HrDesignation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "userId" TEXT,
    "branchId" TEXT NOT NULL,
    "departmentId" TEXT,
    "sectionId" TEXT,
    "teamId" TEXT,
    "designationId" TEXT,
    "managerId" TEXT,
    "photoUrl" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "gender" TEXT,
    "dateOfBirth" DATE,
    "bloodGroup" TEXT,
    "nationality" TEXT,
    "religion" TEXT,
    "maritalStatus" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "permanentAddress" TEXT,
    "presentAddress" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "joiningDate" DATE,
    "probationMonths" INTEGER,
    "confirmationDate" DATE,
    "status" "EmployeeLifecycle" NOT NULL DEFAULT 'DRAFT',
    "workLocation" TEXT,
    "salaryStructureRef" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "skills" TEXT,
    "languages" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTimelineEvent" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrEmployeeDocument" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "HrDocType" NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "expiryDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "HrEmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrLeaveType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT true,
    "openingBalance" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "maxPerYear" DECIMAL(8,2),
    "carryForward" BOOLEAN NOT NULL DEFAULT false,
    "maxCarryForward" DECIMAL(8,2),
    "allowNegativeBalance" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "HrLeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrLeaveBalance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "opening" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "accrued" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "used" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "carried" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "HrLeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrLeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "fromDate" DATE NOT NULL,
    "toDate" DATE NOT NULL,
    "days" DECIMAL(8,2) NOT NULL,
    "reason" TEXT,
    "status" "HrLeaveRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "managerId" TEXT,
    "managerNote" TEXT,
    "managerAt" TIMESTAMPTZ(6),
    "hrApproverId" TEXT,
    "hrNote" TEXT,
    "hrAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "HrLeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrHoliday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "scope" "HrHolidayScope" NOT NULL DEFAULT 'COMPANY',
    "branchId" TEXT,
    "departmentId" TEXT,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "HrHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrAttendanceRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clockIn" TIMESTAMPTZ(6),
    "clockOut" TIMESTAMPTZ(6),
    "status" "HrAttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "HrAttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrAttendanceCorrection" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "requestedClockIn" TIMESTAMPTZ(6),
    "requestedClockOut" TIMESTAMPTZ(6),
    "requestedStatus" "HrAttendanceStatus",
    "reason" TEXT,
    "status" "HrCorrectionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "managerId" TEXT,
    "managerNote" TEXT,
    "managerAt" TIMESTAMPTZ(6),
    "hrApproverId" TEXT,
    "hrNote" TEXT,
    "hrAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "HrAttendanceCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HrDepartment_branchId_idx" ON "HrDepartment"("branchId");

-- CreateIndex
CREATE INDEX "HrDepartment_deletedAt_idx" ON "HrDepartment"("deletedAt");

-- CreateIndex
CREATE INDEX "HrSection_departmentId_idx" ON "HrSection"("departmentId");

-- CreateIndex
CREATE INDEX "HrSection_deletedAt_idx" ON "HrSection"("deletedAt");

-- CreateIndex
CREATE INDEX "HrTeam_sectionId_idx" ON "HrTeam"("sectionId");

-- CreateIndex
CREATE INDEX "HrTeam_deletedAt_idx" ON "HrTeam"("deletedAt");

-- CreateIndex
CREATE INDEX "HrDesignation_deletedAt_idx" ON "HrDesignation"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_branchId_idx" ON "Employee"("branchId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "Employee_deletedAt_idx" ON "Employee"("deletedAt");

-- CreateIndex
CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");

-- CreateIndex
CREATE INDEX "Employee_joiningDate_idx" ON "Employee"("joiningDate");

-- CreateIndex
CREATE INDEX "EmployeeTimelineEvent_employeeId_occurredAt_idx" ON "EmployeeTimelineEvent"("employeeId", "occurredAt");

-- CreateIndex
CREATE INDEX "HrEmployeeDocument_employeeId_idx" ON "HrEmployeeDocument"("employeeId");

-- CreateIndex
CREATE INDEX "HrEmployeeDocument_type_idx" ON "HrEmployeeDocument"("type");

-- CreateIndex
CREATE INDEX "HrEmployeeDocument_expiryDate_idx" ON "HrEmployeeDocument"("expiryDate");

-- CreateIndex
CREATE INDEX "HrEmployeeDocument_deletedAt_idx" ON "HrEmployeeDocument"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HrLeaveType_code_key" ON "HrLeaveType"("code");

-- CreateIndex
CREATE INDEX "HrLeaveType_deletedAt_idx" ON "HrLeaveType"("deletedAt");

-- CreateIndex
CREATE INDEX "HrLeaveBalance_employeeId_idx" ON "HrLeaveBalance"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "HrLeaveBalance_employeeId_leaveTypeId_year_key" ON "HrLeaveBalance"("employeeId", "leaveTypeId", "year");

-- CreateIndex
CREATE INDEX "HrLeaveRequest_employeeId_idx" ON "HrLeaveRequest"("employeeId");

-- CreateIndex
CREATE INDEX "HrLeaveRequest_status_idx" ON "HrLeaveRequest"("status");

-- CreateIndex
CREATE INDEX "HrLeaveRequest_fromDate_toDate_idx" ON "HrLeaveRequest"("fromDate", "toDate");

-- CreateIndex
CREATE INDEX "HrLeaveRequest_deletedAt_idx" ON "HrLeaveRequest"("deletedAt");

-- CreateIndex
CREATE INDEX "HrHoliday_date_idx" ON "HrHoliday"("date");

-- CreateIndex
CREATE INDEX "HrHoliday_branchId_idx" ON "HrHoliday"("branchId");

-- CreateIndex
CREATE INDEX "HrHoliday_deletedAt_idx" ON "HrHoliday"("deletedAt");

-- CreateIndex
CREATE INDEX "HrAttendanceRecord_date_idx" ON "HrAttendanceRecord"("date");

-- CreateIndex
CREATE INDEX "HrAttendanceRecord_status_idx" ON "HrAttendanceRecord"("status");

-- CreateIndex
CREATE INDEX "HrAttendanceRecord_deletedAt_idx" ON "HrAttendanceRecord"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HrAttendanceRecord_employeeId_date_key" ON "HrAttendanceRecord"("employeeId", "date");

-- CreateIndex
CREATE INDEX "HrAttendanceCorrection_employeeId_idx" ON "HrAttendanceCorrection"("employeeId");

-- CreateIndex
CREATE INDEX "HrAttendanceCorrection_status_idx" ON "HrAttendanceCorrection"("status");

-- CreateIndex
CREATE INDEX "HrAttendanceCorrection_deletedAt_idx" ON "HrAttendanceCorrection"("deletedAt");

-- AddForeignKey
ALTER TABLE "HrSection" ADD CONSTRAINT "HrSection_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "HrDepartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrTeam" ADD CONSTRAINT "HrTeam_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HrSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "HrDepartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HrSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HrTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "HrDesignation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTimelineEvent" ADD CONSTRAINT "EmployeeTimelineEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrEmployeeDocument" ADD CONSTRAINT "HrEmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrLeaveBalance" ADD CONSTRAINT "HrLeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrLeaveBalance" ADD CONSTRAINT "HrLeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrLeaveRequest" ADD CONSTRAINT "HrLeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrLeaveRequest" ADD CONSTRAINT "HrLeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrHoliday" ADD CONSTRAINT "HrHoliday_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrHoliday" ADD CONSTRAINT "HrHoliday_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "HrDepartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrAttendanceRecord" ADD CONSTRAINT "HrAttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrAttendanceCorrection" ADD CONSTRAINT "HrAttendanceCorrection_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "HrAttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrAttendanceCorrection" ADD CONSTRAINT "HrAttendanceCorrection_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
