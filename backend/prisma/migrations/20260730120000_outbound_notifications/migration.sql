-- CreateEnum
CREATE TYPE "OutboundChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "OutboundStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "OutboundNotification" (
    "id" TEXT NOT NULL,
    "channel" "OutboundChannel" NOT NULL,
    "event" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "templateId" TEXT,
    "userId" TEXT,
    "payload" JSONB,
    "status" "OutboundStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMPTZ(6),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMPTZ(6),
    "lastError" TEXT,
    "providerId" TEXT,
    "sentAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OutboundNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboundNotification_status_nextRetryAt_idx" ON "OutboundNotification"("status", "nextRetryAt");
CREATE INDEX "OutboundNotification_status_scheduledFor_idx" ON "OutboundNotification"("status", "scheduledFor");
CREATE INDEX "OutboundNotification_createdAt_idx" ON "OutboundNotification"("createdAt");
CREATE INDEX "OutboundNotification_event_channel_idx" ON "OutboundNotification"("event", "channel");
CREATE INDEX "OutboundNotification_userId_createdAt_idx" ON "OutboundNotification"("userId", "createdAt");
CREATE INDEX "MessageTemplate_event_channel_idx" ON "MessageTemplate"("event", "channel");
