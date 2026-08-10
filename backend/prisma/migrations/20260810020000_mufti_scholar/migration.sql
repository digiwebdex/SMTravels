-- Module 4: Business Network — Mufti / Scholar Network (additive, non-destructive).
CREATE TABLE IF NOT EXISTS "MuftiScholar" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "organization" TEXT,
    "specialization" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "location" TEXT,
    "availability" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "MuftiScholar_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MuftiScholar_code_key" ON "MuftiScholar"("code");
CREATE INDEX IF NOT EXISTS "MuftiScholar_status_idx" ON "MuftiScholar"("status");
