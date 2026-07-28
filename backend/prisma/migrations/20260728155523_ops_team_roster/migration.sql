-- CreateEnum
CREATE TYPE "OpsRoleType" AS ENUM ('MUALLIM', 'GUIDE', 'IMAM', 'MEDICAL', 'DRIVER', 'COORDINATOR', 'OTHER');

-- CreateEnum
CREATE TYPE "OpsMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE');

-- AlterTable
ALTER TABLE "DepartureBatch" ADD COLUMN     "muallimId" TEXT;

-- CreateTable
CREATE TABLE "OperationsTeamMember" (
    "id" TEXT NOT NULL,
    "memberCode" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "roleType" "OpsRoleType" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "nationality" TEXT,
    "baseLocation" TEXT,
    "languages" TEXT,
    "licenseNo" TEXT,
    "passportNo" TEXT,
    "passportHash" TEXT,
    "piiKeyId" INTEGER,
    "rating" DECIMAL(3,2),
    "status" "OpsMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "OperationsTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationsTeamMember_memberCode_key" ON "OperationsTeamMember"("memberCode");

-- CreateIndex
CREATE INDEX "OperationsTeamMember_branchId_roleType_status_idx" ON "OperationsTeamMember"("branchId", "roleType", "status");

-- CreateIndex
CREATE INDEX "OperationsTeamMember_roleType_idx" ON "OperationsTeamMember"("roleType");

-- CreateIndex
CREATE INDEX "OperationsTeamMember_passportHash_idx" ON "OperationsTeamMember"("passportHash");

-- CreateIndex
CREATE INDEX "DepartureBatch_muallimId_idx" ON "DepartureBatch"("muallimId");
