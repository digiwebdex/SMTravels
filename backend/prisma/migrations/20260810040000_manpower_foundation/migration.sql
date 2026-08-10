-- Module 6A: Manpower — Employers + Job Orders (additive, non-destructive).
CREATE TABLE IF NOT EXISTS "Employer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "industry" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Employer_code_key" ON "Employer"("code");
CREATE INDEX IF NOT EXISTS "Employer_status_idx" ON "Employer"("status");

CREATE TABLE IF NOT EXISTS "JobOrder" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "category" TEXT,
    "country" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "salary" DECIMAL(18,2),
    "currency" "Currency" NOT NULL DEFAULT 'SAR',
    "accommodation" TEXT,
    "food" TEXT,
    "workingHours" TEXT,
    "contractDuration" TEXT,
    "requirements" TEXT,
    "deadline" DATE,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "JobOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "JobOrder_code_key" ON "JobOrder"("code");
CREATE INDEX IF NOT EXISTS "JobOrder_employerId_idx" ON "JobOrder"("employerId");
CREATE INDEX IF NOT EXISTS "JobOrder_status_idx" ON "JobOrder"("status");

DO $$ BEGIN
  ALTER TABLE "JobOrder" ADD CONSTRAINT "JobOrder_employerId_fkey"
    FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
