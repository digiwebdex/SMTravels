-- Module 6B-3: Manpower — Visa + Deployment (additive, non-destructive).
CREATE TABLE IF NOT EXISTS "ManpowerVisa" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "visaNumber" TEXT,
    "visaType" TEXT,
    "sponsor" TEXT,
    "issueDate" DATE,
    "expiryDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documentRef" TEXT,
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "ManpowerVisa_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ManpowerVisa_code_key" ON "ManpowerVisa"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "ManpowerVisa_candidateId_key" ON "ManpowerVisa"("candidateId");
CREATE INDEX IF NOT EXISTS "ManpowerVisa_status_idx" ON "ManpowerVisa"("status");
CREATE INDEX IF NOT EXISTS "ManpowerVisa_jobOrderId_idx" ON "ManpowerVisa"("jobOrderId");

CREATE TABLE IF NOT EXISTS "ManpowerDeployment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "ticketRef" TEXT,
    "flightNo" TEXT,
    "departureAirport" TEXT,
    "destination" TEXT,
    "departureDate" DATE,
    "arrivalDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "ManpowerDeployment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ManpowerDeployment_code_key" ON "ManpowerDeployment"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "ManpowerDeployment_candidateId_key" ON "ManpowerDeployment"("candidateId");
CREATE INDEX IF NOT EXISTS "ManpowerDeployment_status_idx" ON "ManpowerDeployment"("status");
CREATE INDEX IF NOT EXISTS "ManpowerDeployment_jobOrderId_idx" ON "ManpowerDeployment"("jobOrderId");

DO $$ BEGIN
  ALTER TABLE "ManpowerVisa" ADD CONSTRAINT "ManpowerVisa_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ManpowerDeployment" ADD CONSTRAINT "ManpowerDeployment_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
