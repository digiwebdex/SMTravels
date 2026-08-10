-- Module 6B-2: Manpower — Medical + BMET (additive, non-destructive).
CREATE TABLE IF NOT EXISTS "MedicalProcessing" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "medicalCenter" TEXT,
    "appointmentDate" DATE,
    "medicalDate" DATE,
    "resultDate" DATE,
    "expiryDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documentRef" TEXT,
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "MedicalProcessing_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MedicalProcessing_code_key" ON "MedicalProcessing"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "MedicalProcessing_candidateId_key" ON "MedicalProcessing"("candidateId");
CREATE INDEX IF NOT EXISTS "MedicalProcessing_status_idx" ON "MedicalProcessing"("status");
CREATE INDEX IF NOT EXISTS "MedicalProcessing_jobOrderId_idx" ON "MedicalProcessing"("jobOrderId");

CREATE TABLE IF NOT EXISTS "BmetClearance" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "registrationNo" TEXT,
    "registrationDate" DATE,
    "clearanceNo" TEXT,
    "clearanceDate" DATE,
    "expiryDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documentRef" TEXT,
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "BmetClearance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BmetClearance_code_key" ON "BmetClearance"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "BmetClearance_candidateId_key" ON "BmetClearance"("candidateId");
CREATE INDEX IF NOT EXISTS "BmetClearance_status_idx" ON "BmetClearance"("status");
CREATE INDEX IF NOT EXISTS "BmetClearance_jobOrderId_idx" ON "BmetClearance"("jobOrderId");

DO $$ BEGIN
  ALTER TABLE "MedicalProcessing" ADD CONSTRAINT "MedicalProcessing_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "BmetClearance" ADD CONSTRAINT "BmetClearance_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
