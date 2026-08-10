-- Module 3: Business Network — Companies We Work With (additive, non-destructive).
CREATE TABLE IF NOT EXISTS "BusinessPartner" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "industry" TEXT,
    "country" TEXT,
    "address" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "services" TEXT,
    "contractRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "BusinessPartner_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessPartner_code_key" ON "BusinessPartner"("code");
CREATE INDEX IF NOT EXISTS "BusinessPartner_status_idx" ON "BusinessPartner"("status");
CREATE INDEX IF NOT EXISTS "BusinessPartner_type_idx" ON "BusinessPartner"("type");
