-- Module 7: Custom Package Builder — inquiry + custom package + items (additive).
CREATE TABLE IF NOT EXISTS "PackageInquiry" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "travelType" TEXT,
    "destination" TEXT,
    "departureDate" DATE,
    "returnDate" DATE,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "infants" INTEGER NOT NULL DEFAULT 0,
    "preferredHotel" TEXT,
    "hotelNights" INTEGER,
    "roomRequirements" TEXT,
    "flightPreference" TEXT,
    "visaRequired" BOOLEAN NOT NULL DEFAULT false,
    "transportRequired" BOOLEAN NOT NULL DEFAULT false,
    "foodRequired" BOOLEAN NOT NULL DEFAULT false,
    "ziyaratRequired" BOOLEAN NOT NULL DEFAULT false,
    "muallimRequired" BOOLEAN NOT NULL DEFAULT false,
    "specialRequirements" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "customPackageId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "PackageInquiry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PackageInquiry_code_key" ON "PackageInquiry"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "PackageInquiry_customPackageId_key" ON "PackageInquiry"("customPackageId");
CREATE INDEX IF NOT EXISTS "PackageInquiry_status_idx" ON "PackageInquiry"("status");
CREATE INDEX IF NOT EXISTS "PackageInquiry_customerId_idx" ON "PackageInquiry"("customerId");

CREATE TABLE IF NOT EXISTS "CustomPackage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "inquiryId" TEXT,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "travelType" TEXT,
    "departureDate" DATE,
    "returnDate" DATE,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "markup" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "validityDate" DATE,
    "terms" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "bookingId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "CustomPackage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomPackage_code_key" ON "CustomPackage"("code");
CREATE INDEX IF NOT EXISTS "CustomPackage_status_idx" ON "CustomPackage"("status");
CREATE INDEX IF NOT EXISTS "CustomPackage_customerId_idx" ON "CustomPackage"("customerId");

CREATE TABLE IF NOT EXISTS "CustomPackageItem" (
    "id" TEXT NOT NULL,
    "customPackageId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "CustomPackageItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CustomPackageItem_customPackageId_idx" ON "CustomPackageItem"("customPackageId");

DO $$ BEGIN
  ALTER TABLE "CustomPackageItem" ADD CONSTRAINT "CustomPackageItem_customPackageId_fkey"
    FOREIGN KEY ("customPackageId") REFERENCES "CustomPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
