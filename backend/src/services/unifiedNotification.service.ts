/**
 * Unified Notification Center — single entry point for Email / WhatsApp / SMS / In-App.
 * Enqueues OutboundNotification rows; the worker delivers with retry.
 */
import {
  OutboundChannel,
  OutboundStatus,
  Prisma,
  TemplateChannel,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { HttpError } from "../middleware/errorHandler";
import { sendEmail, isSmtpConfigured } from "./email.service";
import { sendSms, isSmsEnabled } from "./sms.service";
import { sendWhatsApp, isWhatsAppEnabled } from "./whatsapp.service";

export const NOTIFICATION_EVENTS = [
  "customer_registration",
  "booking_created",
  "booking_updated",
  "booking_cancelled",
  "visa_submitted",
  "visa_approved",
  "visa_rejected",
  "passport_ready",
  "payment_received",
  "payment_due_reminder",
  "invoice_generated",
  "otp",
  "password_reset",
  "welcome",
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export type NotifyChannel = "EMAIL" | "SMS" | "WHATSAPP" | "IN_APP";

export interface Recipient {
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
  name?: string | null;
}

export interface EnqueueOpts {
  scheduleAt?: Date;
  subject?: string;
  /** Override template body (still rendered with vars). */
  bodyOverride?: string;
  maxAttempts?: number;
  payload?: Record<string, unknown>;
}

const DEFAULT_BODIES: Record<NotificationEvent, { subject: string; body: string }> = {
  customer_registration: {
    subject: "Welcome to SM Travels International",
    body: "Dear {name},\n\nYour account has been registered. Welcome aboard.\n\nSM Travels International",
  },
  booking_created: {
    subject: "Booking confirmed — {bookingNo}",
    body: "Dear {name},\n\nYour {service} booking is confirmed. Booking No: {bookingNo}.{departure}\n\nOur team will contact you with the next steps.\n\nSM Travels International",
  },
  booking_updated: {
    subject: "Booking updated — {bookingNo}",
    body: "Dear {name},\n\nYour booking {bookingNo} has been updated.\n\nSM Travels International",
  },
  booking_cancelled: {
    subject: "Booking cancelled — {bookingNo}",
    body: "Dear {name},\n\nYour booking {bookingNo} has been cancelled.\n\nSM Travels International",
  },
  visa_submitted: {
    subject: "Visa application submitted — {bookingNo}",
    body: "Dear {name},\n\nYour visa application for {bookingNo} has been submitted.\n\nSM Travels International",
  },
  visa_approved: {
    subject: "Visa approved — {bookingNo}",
    body: "Dear {name},\n\nYour visa for {bookingNo} has been approved.\n\nSM Travels International",
  },
  visa_rejected: {
    subject: "Visa update — {bookingNo}",
    body: "Dear {name},\n\nYour visa application for {bookingNo} was not approved. Please contact our office.\n\nSM Travels International",
  },
  passport_ready: {
    subject: "Passport ready for collection",
    body: "Dear {name},\n\nYour passport is ready for collection{ref}.\n\nSM Travels International",
  },
  payment_received: {
    subject: "Payment received — {paymentNo}",
    body: "Dear {name},\n\nWe received your payment of {amount}{invoiceRef}. Reference: {paymentNo}.\n\nThank you.\n\nSM Travels International",
  },
  payment_due_reminder: {
    subject: "Payment reminder — {invoiceNo}",
    body: "Dear {name},\n\nThis is a reminder that payment of {amount} is due for invoice {invoiceNo}.\n\nSM Travels International",
  },
  invoice_generated: {
    subject: "Invoice {invoiceNo}",
    body: "Dear {name},\n\nInvoice {invoiceNo} for {amount} has been generated. Due: {dueDate}.\n\nSM Travels International",
  },
  otp: {
    subject: "Your verification code",
    body: "Your SM Travels verification code is {otp}. It expires in {expiresMinutes} minutes. Do not share this code.",
  },
  password_reset: {
    subject: "Your SM Travels password reset code",
    body: "Your one-time code is: {otp}\n\nIt expires in 10 minutes. If you didn't request this, ignore this email.",
  },
  welcome: {
    subject: "Welcome to SM Travels International",
    body: "Dear {name},\n\nWelcome to SM Travels International. We're glad to have you with us.\n\n{details}",
  },
};

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

async function resolveTemplate(
  event: string,
  channel: TemplateChannel,
  vars: Record<string, string>,
  override?: string,
): Promise<{ subject: string; body: string; templateId: string | null }> {
  const defaults = DEFAULT_BODIES[event as NotificationEvent] ?? {
    subject: "SM Travels International",
    body: "Dear {name},\n\n{message}\n\nSM Travels International",
  };
  const tpl = await prisma.messageTemplate.findFirst({
    where: { event, channel, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
  const rawBody = override ?? tpl?.content ?? defaults.body;
  const subject = render(defaults.subject, vars);
  return { subject, body: render(rawBody, vars), templateId: tpl?.id ?? null };
}

export async function enqueueNotification(
  event: NotificationEvent | string,
  channels: NotifyChannel[],
  recipient: Recipient,
  vars: Record<string, string> = {},
  opts: EnqueueOpts = {},
): Promise<string[]> {
  const merged = { name: recipient.name ?? "Customer", ...vars };
  const ids: string[] = [];
  const scheduleAt = opts.scheduleAt;
  const isScheduled = scheduleAt && scheduleAt.getTime() > Date.now();

  for (const ch of channels) {
    if (ch === "IN_APP") {
      if (!recipient.userId) continue;
      const { subject, body, templateId } = await resolveTemplate(
        event,
        TemplateChannel.EMAIL,
        merged,
        opts.bodyOverride,
      );
      const row = await prisma.outboundNotification.create({
        data: {
          channel: OutboundChannel.IN_APP,
          event,
          to: recipient.userId,
          subject: opts.subject ?? subject,
          body,
          templateId,
          userId: recipient.userId,
          payload: (opts.payload ?? {}) as Prisma.InputJsonValue,
          status: isScheduled ? OutboundStatus.SCHEDULED : OutboundStatus.PENDING,
          scheduledFor: isScheduled ? scheduleAt : null,
          maxAttempts: opts.maxAttempts ?? 3,
        },
      });
      ids.push(row.id);
      continue;
    }

    if (ch === "EMAIL") {
      if (!recipient.email) continue;
      const { subject, body, templateId } = await resolveTemplate(
        event,
        TemplateChannel.EMAIL,
        merged,
        opts.bodyOverride,
      );
      const row = await prisma.outboundNotification.create({
        data: {
          channel: OutboundChannel.EMAIL,
          event,
          to: recipient.email,
          subject: opts.subject ?? subject,
          body,
          templateId,
          userId: recipient.userId ?? null,
          payload: (opts.payload ?? {}) as Prisma.InputJsonValue,
          status: isScheduled ? OutboundStatus.SCHEDULED : OutboundStatus.PENDING,
          scheduledFor: isScheduled ? scheduleAt : null,
          maxAttempts: opts.maxAttempts ?? 5,
        },
      });
      ids.push(row.id);
      continue;
    }

    if (ch === "SMS" || ch === "WHATSAPP") {
      if (!recipient.phone) continue;
      const tplChannel = ch === "SMS" ? TemplateChannel.SMS : TemplateChannel.WHATSAPP;
      const { subject, body, templateId } = await resolveTemplate(event, tplChannel, merged, opts.bodyOverride);
      const row = await prisma.outboundNotification.create({
        data: {
          channel: ch === "SMS" ? OutboundChannel.SMS : OutboundChannel.WHATSAPP,
          event,
          to: recipient.phone,
          subject: opts.subject ?? subject,
          body,
          templateId,
          userId: recipient.userId ?? null,
          payload: (opts.payload ?? {}) as Prisma.InputJsonValue,
          status: isScheduled ? OutboundStatus.SCHEDULED : OutboundStatus.PENDING,
          scheduledFor: isScheduled ? scheduleAt : null,
          maxAttempts: opts.maxAttempts ?? 5,
        },
      });
      ids.push(row.id);
    }
  }

  logger.info({ event, channels, count: ids.length }, "notifications enqueued");
  return ids;
}

/** Deliver a single outbound row. Used by the worker. */
export async function deliverOutbound(id: string): Promise<void> {
  // Atomic claim — only one worker can move PENDING/SCHEDULED/FAILED → PROCESSING.
  const now = new Date();
  const claimed = await prisma.outboundNotification.updateMany({
    where: {
      id,
      OR: [
        { status: OutboundStatus.PENDING },
        { status: OutboundStatus.SCHEDULED, scheduledFor: { lte: now } },
        { status: OutboundStatus.FAILED, nextRetryAt: { lte: now } },
        // Reclaim stuck PROCESSING older than 10 minutes (crash mid-send).
        { status: OutboundStatus.PROCESSING, updatedAt: { lte: new Date(Date.now() - 10 * 60_000) } },
      ],
    },
    data: { status: OutboundStatus.PROCESSING, attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return;

  const row = await prisma.outboundNotification.findUnique({ where: { id } });
  if (!row) return;

  try {
    if (row.channel === OutboundChannel.EMAIL) {
      if (!isSmtpConfigured()) {
        throw new Error("SMTP not configured — email not sent");
      }
      await sendEmail({ to: row.to, subject: row.subject ?? "SM Travels", text: row.body });
    } else if (row.channel === OutboundChannel.SMS) {
      if (!isSmsEnabled()) {
        await prisma.outboundNotification.update({
          where: { id },
          data: {
            status: OutboundStatus.CANCELLED,
            lastError: "SMS channel disabled (BulkSMSBD credentials missing)",
            nextRetryAt: null,
          },
        });
        return;
      }
      await sendSms(row.to, row.body);
    } else if (row.channel === OutboundChannel.WHATSAPP) {
      if (!isWhatsAppEnabled()) {
        await prisma.outboundNotification.update({
          where: { id },
          data: {
            status: OutboundStatus.CANCELLED,
            lastError: "WhatsApp channel disabled (Wasender credentials missing)",
            nextRetryAt: null,
          },
        });
        return;
      }
      await sendWhatsApp(row.to, row.body);
    } else if (row.channel === OutboundChannel.IN_APP) {
      await prisma.notification.create({
        data: {
          userId: row.to,
          title: row.subject ?? "Notification",
          body: row.body.slice(0, 500),
          type: row.event,
        },
      });
    }

    await prisma.outboundNotification.update({
      where: { id },
      data: { status: OutboundStatus.SENT, sentAt: new Date(), lastError: null, nextRetryAt: null },
    });
  } catch (err) {
    const msg = (err instanceof Error ? err.message : "send failed").slice(0, 500);
    const attempts = row.attempts; // already incremented on claim
    const giveUp = attempts >= row.maxAttempts;
    const delayMs = Math.min(60 * 60 * 1000, 30_000 * 2 ** Math.min(attempts, 6));
    await prisma.outboundNotification.update({
      where: { id },
      data: {
        status: OutboundStatus.FAILED,
        lastError: msg,
        nextRetryAt: giveUp ? null : new Date(Date.now() + delayMs),
      },
    });
    logger.warn({ id, channel: row.channel, attempts, giveUp, err: msg }, "outbound delivery failed");
  }
}

export async function retryOutbound(id: string): Promise<void> {
  const row = await prisma.outboundNotification.findUnique({ where: { id } });
  if (!row) throw new HttpError(404, "NotFound", { detail: "Outbound notification not found." });
  await prisma.outboundNotification.update({
    where: { id },
    data: {
      status: OutboundStatus.PENDING,
      nextRetryAt: null,
      scheduledFor: null,
      lastError: null,
    },
  });
  await deliverOutbound(id);
}

export interface OutboundListQuery {
  status?: OutboundStatus;
  channel?: OutboundChannel;
  event?: string;
  page?: number;
  pageSize?: number;
}

export async function listOutbound(q: OutboundListQuery) {
  const page = Math.max(1, q.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 20));
  const where: Prisma.OutboundNotificationWhereInput = {
    ...(q.status ? { status: q.status } : {}),
    ...(q.channel ? { channel: q.channel } : {}),
    ...(q.event ? { event: q.event } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.outboundNotification.count({ where }),
    prisma.outboundNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return {
    total,
    page,
    pageSize,
    items: rows.map((r) => {
      const sensitive = r.event === "password_reset" || r.event === "otp";
      return {
        id: r.id,
        channel: r.channel,
        event: r.event,
        to: sensitive ? r.to.replace(/(.).+(@.|.{3}$)/, "$1***$2") : r.to,
        subject: r.subject,
        bodyPreview: sensitive ? "[redacted]" : r.body.slice(0, 120),
        status: r.status,
        attempts: r.attempts,
        scheduledFor: r.scheduledFor?.toISOString() ?? null,
        sentAt: r.sentAt?.toISOString() ?? null,
        lastError: r.lastError,
        createdAt: r.createdAt.toISOString(),
      };
    }),
  };
}

export async function outboundDashboard() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const group = async (since: Date) => {
    const rows = await prisma.outboundNotification.groupBy({
      by: ["status", "channel"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
    return rows.map((r) => ({ status: r.status, channel: r.channel, count: r._count._all }));
  };

  const [last24h, last7d, failed, scheduled, pending] = await Promise.all([
    group(since24h),
    group(since7d),
    prisma.outboundNotification.count({
      where: { status: OutboundStatus.FAILED, nextRetryAt: null },
    }),
    prisma.outboundNotification.count({ where: { status: OutboundStatus.SCHEDULED } }),
    prisma.outboundNotification.count({ where: { status: OutboundStatus.PENDING } }),
  ]);

  return {
    flags: {
      email: isSmtpConfigured(),
      sms: isSmsEnabled(),
      whatsapp: isWhatsAppEnabled(),
    },
    pending,
    scheduled,
    failedTerminal: failed,
    last24h,
    last7d,
  };
}

/** Claim and process due queue items. */
export async function processOutboundQueue(batchSize = 20): Promise<number> {
  const now = new Date();
  const stuckBefore = new Date(Date.now() - 10 * 60_000);
  const due = await prisma.outboundNotification.findMany({
    where: {
      OR: [
        { status: OutboundStatus.PENDING },
        { status: OutboundStatus.SCHEDULED, scheduledFor: { lte: now } },
        { status: OutboundStatus.FAILED, nextRetryAt: { lte: now } },
        { status: OutboundStatus.PROCESSING, updatedAt: { lte: stuckBefore } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: batchSize,
    select: { id: true },
  });

  for (const row of due) {
    try {
      await deliverOutbound(row.id);
    } catch (err) {
      logger.warn({ err, id: row.id }, "queue item processing error");
    }
  }
  return due.length;
}
