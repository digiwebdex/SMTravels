-- Module 6B: Manpower — Candidate + Recruitment pipeline (additive, non-destructive).
CREATE TABLE IF NOT EXISTS "Candidate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "dob" DATE,
    "gender" TEXT,
    "nationality" TEXT,
    "passportNo" TEXT,
    "passportIssueDate" DATE,
    "passportExpiry" DATE,
    "nid" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "skills" TEXT,
    "customerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "screeningNotes" TEXT,
    "interviewDate" DATE,
    "interviewer" TEXT,
    "interviewResult" TEXT,
    "interviewRemarks" TEXT,
    "rejectionReason" TEXT,
    "contractStatus" TEXT,
    "contractDate" DATE,
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Candidate_code_key" ON "Candidate"("code");
CREATE INDEX IF NOT EXISTS "Candidate_jobOrderId_idx" ON "Candidate"("jobOrderId");
CREATE INDEX IF NOT EXISTS "Candidate_employerId_idx" ON "Candidate"("employerId");
CREATE INDEX IF NOT EXISTS "Candidate_status_idx" ON "Candidate"("status");

DO $$ BEGIN
  ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jobOrderId_fkey"
    FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_employerId_fkey"
    FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
