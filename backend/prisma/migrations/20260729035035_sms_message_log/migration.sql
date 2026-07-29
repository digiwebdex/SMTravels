-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'LOGGED', 'FAILED');

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "channel" "TemplateChannel" NOT NULL DEFAULT 'SMS',
    "recipient" TEXT NOT NULL,
    "recipientName" TEXT,
    "body" TEXT NOT NULL,
    "templateId" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'LOGGED',
    "error" TEXT,
    "sentById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageLog_branchId_createdAt_idx" ON "MessageLog"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageLog_channel_status_idx" ON "MessageLog"("channel", "status");
