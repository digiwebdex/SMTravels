-- Module 2: Currency — date-effective exchange rates (additive, non-destructive).
-- Reuses the existing "Currency" enum. Does NOT touch any financial table; posted
-- transactions keep their own currency/exchangeRate/baseAmount unchanged.
CREATE TABLE IF NOT EXISTS "ExchangeRate" (
    "id" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "baseCurrency" "Currency" NOT NULL DEFAULT 'BDT',
    "rate" DECIMAL(18,8) NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "source" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ExchangeRate_currency_effectiveDate_idx" ON "ExchangeRate"("currency", "effectiveDate");
CREATE INDEX IF NOT EXISTS "ExchangeRate_active_idx" ON "ExchangeRate"("active");
