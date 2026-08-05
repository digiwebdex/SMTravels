/**
 * HR Phase 1 notification hooks.
 * Reuses in-app Notification rows + optional OutboundNotification enqueue
 * (event allowlist only — does not rewrite the notification center).
 */
import { OutboundChannel, OutboundStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { inApp, type InAppInput } from "./notification.service";

/** Event strings registered for HR (mirrors unifiedNotification allowlist). */
export const HR_NOTIFICATION_EVENTS = [
  "leave_submitted",
  "leave_approved",
  "leave_rejected",
  "attendance_correction",
  "birthday_reminder",
  "confirmation_reminder",
  "document_expiring",
  "new_employee",
] as const;

export type HrNotificationEvent = (typeof HR_NOTIFICATION_EVENTS)[number];

async function enqueueOutbound(
  event: HrNotificationEvent,
  userId: string,
  n: InAppInput,
): Promise<void> {
  try {
    await prisma.outboundNotification.create({
      data: {
        channel: OutboundChannel.IN_APP,
        event,
        to: userId,
        subject: n.title,
        body: n.body ?? n.title,
        userId,
        status: OutboundStatus.PENDING,
        maxAttempts: 3,
        payload: { type: n.type ?? "hr", color: n.color ?? null },
      },
    });
  } catch (err) {
    logger.warn({ err, event, userId }, "hr.notification.enqueue_failed");
  }
}

/** Immediate in-app + outbound queue row for audit/worker delivery. */
export async function notifyHrUsers(
  userIds: string[],
  event: HrNotificationEvent,
  n: InAppInput,
): Promise<void> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return;
  await inApp(unique, { ...n, type: n.type ?? "hr" });
  await Promise.all(unique.map((id) => enqueueOutbound(event, id, n)));
}
