-- CreateEnum
CREATE TYPE "QuotaType" AS ENUM ('GOVT', 'PRIVATE');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('OPEN', 'CLOSED', 'DEPARTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'PRE_REGISTERED', 'REGISTERED', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "quotaId" TEXT;

-- AlterTable
ALTER TABLE "HajjBooking" ADD COLUMN     "haramDistanceMadinah" TEXT,
ADD COLUMN     "haramDistanceMakkah" TEXT,
ADD COLUMN     "maktabNo" TEXT,
ADD COLUMN     "qurbani" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tentCategory" TEXT;

-- AlterTable
ALTER TABLE "UmrahBooking" ADD COLUMN     "haramDistanceMadinah" TEXT,
ADD COLUMN     "haramDistanceMakkah" TEXT,
ADD COLUMN     "visaExpiry" DATE,
ADD COLUMN     "visaIssuedAt" DATE;

-- CreateTable
CREATE TABLE "HajjQuota" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'HAJJ',
    "season" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quotaType" "QuotaType" NOT NULL DEFAULT 'GOVT',
    "allotted" INTEGER NOT NULL,
    "filled" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "HajjQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartureBatch" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'HAJJ',
    "season" TEXT,
    "packageId" TEXT,
    "name" TEXT NOT NULL,
    "departureDate" DATE,
    "returnDate" DATE,
    "totalSeats" INTEGER NOT NULL DEFAULT 0,
    "filledSeats" INTEGER NOT NULL DEFAULT 0,
    "muallimName" TEXT,
    "muallimNo" TEXT,
    "maktab" TEXT,
    "transport" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "DepartureBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilgrimRegistration" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "bookingId" TEXT,
    "travelerId" TEXT,
    "customerId" TEXT,
    "pilgrimName" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'HAJJ',
    "season" TEXT NOT NULL,
    "quotaType" "QuotaType" NOT NULL DEFAULT 'GOVT',
    "preRegSerial" TEXT,
    "preRegSerialHash" TEXT,
    "pid" TEXT,
    "pidHash" TEXT,
    "trackingNo" TEXT,
    "trackingNoHash" TEXT,
    "piiKeyId" INTEGER,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "registeredAt" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "PilgrimRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HajjQuota_serviceType_season_idx" ON "HajjQuota"("serviceType", "season");

-- CreateIndex
CREATE INDEX "HajjQuota_branchId_idx" ON "HajjQuota"("branchId");

-- CreateIndex
CREATE INDEX "DepartureBatch_branchId_serviceType_season_idx" ON "DepartureBatch"("branchId", "serviceType", "season");

-- CreateIndex
CREATE INDEX "DepartureBatch_packageId_idx" ON "DepartureBatch"("packageId");

-- CreateIndex
CREATE INDEX "PilgrimRegistration_branchId_season_idx" ON "PilgrimRegistration"("branchId", "season");

-- CreateIndex
CREATE INDEX "PilgrimRegistration_bookingId_idx" ON "PilgrimRegistration"("bookingId");

-- CreateIndex
CREATE INDEX "Booking_batchId_idx" ON "Booking"("batchId");

-- CreateIndex
CREATE INDEX "Booking_quotaId_idx" ON "Booking"("quotaId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "DepartureBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "HajjQuota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Phase 2 hand-written SQL (Prisma can't express these in-schema) ──────────

-- Capacity invariants. The DB itself forbids negative or over-capacity counters,
-- so even a race that slipped past the app-level guard could never PERSIST an
-- over-booked state. Reservations additionally take a SELECT ... FOR UPDATE row
-- lock (see reserveBatchSeat / reserveQuotaSlot) to serialize concurrent confirms.
ALTER TABLE "HajjQuota"
  ADD CONSTRAINT "hajj_quota_capacity_chk"
  CHECK ("allotted" >= 0 AND "filled" >= 0 AND "filled" <= "allotted");
ALTER TABLE "DepartureBatch"
  ADD CONSTRAINT "departure_batch_capacity_chk"
  CHECK ("totalSeats" >= 0 AND "filledSeats" >= 0 AND "filledSeats" <= "totalSeats");

-- Natural keys as partial unique indexes (soft-deleted rows must not block re-use).
CREATE UNIQUE INDEX "departure_batch_code_active_uq"
  ON "DepartureBatch"("branchId", "code") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "hajj_quota_active_uq"
  ON "HajjQuota"("serviceType", "season", "label", (COALESCE("branchId", ''))) WHERE "deletedAt" IS NULL;

-- Blind indexes on the HMAC hash columns so encrypted govt identifiers stay searchable
-- by exact match (query on the *Hash column with blindIndex(value)), never on ciphertext.
CREATE INDEX "pilgrim_reg_prereg_hash_idx"
  ON "PilgrimRegistration"("preRegSerialHash") WHERE "deletedAt" IS NULL AND "preRegSerialHash" IS NOT NULL;
CREATE INDEX "pilgrim_reg_pid_hash_idx"
  ON "PilgrimRegistration"("pidHash") WHERE "deletedAt" IS NULL AND "pidHash" IS NOT NULL;
CREATE INDEX "pilgrim_reg_tracking_hash_idx"
  ON "PilgrimRegistration"("trackingNoHash") WHERE "deletedAt" IS NULL AND "trackingNoHash" IS NOT NULL;
