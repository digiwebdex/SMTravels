/**
 * Notifications: in-app + queued multi-channel events via unifiedNotification.
 * Public helpers keep stable names for existing callers.
 */
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { notifySafe } from "../lib/notify";
import type { AuthCtx } from "../middleware/auth";
import { enqueueNotification } from "./unifiedNotification.service";

const fmtBDT = (n: number): string => `BDT ${n.toLocaleString("en-US")}`;

export interface InAppInput {
  title: string;
  body?: string;
  type?: string;
  color?: string;
}

export async function inApp(userIds: string[], n: InAppInput): Promise<void> {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: n.title,
      body: n.body ?? null,
      type: n.type ?? null,
      color: n.color ?? null,
    })),
  });
}

export async function listMine(
  auth: AuthCtx,
): Promise<
  { id: string; title: string; body: string | null; type: string | null; color: string | null; read: boolean; createdAt: string }[]
> {
  const rows = await prisma.notification.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type,
    color: n.color,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function markAllMineRead(auth: AuthCtx): Promise<{ ok: true }> {
  await prisma.notification.updateMany({ where: { userId: auth.userId, read: false }, data: { read: true } });
  return { ok: true };
}

export async function notifyStaffNewLead(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { name: true, serviceInterest: true, branchId: true },
  });
  if (!lead) return;
  const staff = await prisma.user.findMany({
    where: {
      deletedAt: null,
      status: "active",
      OR: [
        { role: { in: [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN] } },
        { role: UserRole.BRANCH_MANAGER, branchId: lead.branchId },
      ],
    },
    select: { id: true },
  });
  await inApp(
    staff.map((u) => u.id),
    {
      title: "New website lead",
      body: `${lead.name}${lead.serviceInterest ? ` — ${lead.serviceInterest}` : ""} (via website form)`,
      type: "lead",
      color: "#0E6BB8",
    },
  );
}

export function notifyBookingConfirmed(bookingId: string): void {
  notifySafe(
    "booking-confirmation",
    (async () => {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          bookingNo: true,
          serviceType: true,
          departureDate: true,
          customer: { select: { name: true, phone: true, email: true, userId: true } },
        },
      });
      if (!b?.bookingNo || !b.customer) return;
      const service = b.serviceType.replace(/_/g, " ");
      const dep = b.departureDate ? ` Departure: ${b.departureDate.toISOString().slice(0, 10)}.` : "";
      await enqueueNotification(
        "booking_created",
        ["EMAIL", "SMS", "WHATSAPP", "IN_APP"],
        {
          name: b.customer.name,
          email: b.customer.email,
          phone: b.customer.phone,
          userId: b.customer.userId,
        },
        { bookingNo: b.bookingNo, service, departure: dep },
      );
    })(),
  );
}

export function notifyBookingUpdated(bookingId: string): void {
  notifySafe(
    "booking-updated",
    (async () => {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          bookingNo: true,
          customer: { select: { name: true, phone: true, email: true, userId: true } },
        },
      });
      if (!b?.bookingNo || !b.customer) return;
      await enqueueNotification(
        "booking_updated",
        ["EMAIL", "SMS", "WHATSAPP", "IN_APP"],
        {
          name: b.customer.name,
          email: b.customer.email,
          phone: b.customer.phone,
          userId: b.customer.userId,
        },
        { bookingNo: b.bookingNo },
      );
    })(),
  );
}

export function notifyBookingCancelled(bookingId: string): void {
  notifySafe(
    "booking-cancelled",
    (async () => {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          bookingNo: true,
          customer: { select: { name: true, phone: true, email: true, userId: true } },
        },
      });
      if (!b?.bookingNo || !b.customer) return;
      await enqueueNotification(
        "booking_cancelled",
        ["EMAIL", "SMS", "WHATSAPP", "IN_APP"],
        {
          name: b.customer.name,
          email: b.customer.email,
          phone: b.customer.phone,
          userId: b.customer.userId,
        },
        { bookingNo: b.bookingNo },
      );
    })(),
  );
}

export function notifyVisaStatus(
  bookingId: string,
  status: "submitted" | "approved" | "rejected",
): void {
  const event =
    status === "submitted" ? "visa_submitted" : status === "approved" ? "visa_approved" : "visa_rejected";
  notifySafe(
    event,
    (async () => {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          bookingNo: true,
          customer: { select: { name: true, phone: true, email: true, userId: true } },
        },
      });
      if (!b?.bookingNo || !b.customer) return;
      await enqueueNotification(
        event,
        ["EMAIL", "SMS", "WHATSAPP", "IN_APP"],
        {
          name: b.customer.name,
          email: b.customer.email,
          phone: b.customer.phone,
          userId: b.customer.userId,
        },
        { bookingNo: b.bookingNo },
      );
    })(),
  );
}

export function notifyPassportReady(customerId: string, bookingNo?: string): void {
  notifySafe(
    "passport-ready",
    (async () => {
      const c = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { name: true, phone: true, email: true, userId: true },
      });
      if (!c) return;
      await enqueueNotification(
        "passport_ready",
        ["EMAIL", "SMS", "WHATSAPP", "IN_APP"],
        { name: c.name, email: c.email, phone: c.phone, userId: c.userId },
        { ref: bookingNo ? ` (ref ${bookingNo})` : "" },
      );
    })(),
  );
}

export function notifyPaymentRecorded(paymentId: string): void {
  notifySafe(
    "payment-receipt",
    (async () => {
      const p = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: {
          paymentNo: true,
          baseAmount: true,
          customerId: true,
          invoice: {
            select: {
              invoiceNo: true,
              customer: { select: { name: true, phone: true, email: true, userId: true } },
            },
          },
        },
      });
      if (!p) return;
      const c =
        p.invoice?.customer ??
        (p.customerId
          ? await prisma.customer.findUnique({
              where: { id: p.customerId },
              select: { name: true, phone: true, email: true, userId: true },
            })
          : null);
      if (!c) return;
      const amount = fmtBDT(Number(p.baseAmount));
      const invoiceRef = p.invoice?.invoiceNo ? ` against invoice ${p.invoice.invoiceNo}` : "";
      const paymentNo = p.paymentNo ?? "(pending)";
      await enqueueNotification(
        "payment_received",
        ["EMAIL", "SMS", "WHATSAPP", "IN_APP"],
        { name: c.name, email: c.email, phone: c.phone, userId: c.userId },
        { amount, invoiceRef, paymentNo },
      );
    })(),
  );
}

export function notifyInvoiceGenerated(invoiceId: string): void {
  notifySafe(
    "invoice-generated",
    (async () => {
      const inv = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: {
          invoiceNo: true,
          total: true,
          dueDate: true,
          customer: { select: { name: true, phone: true, email: true, userId: true } },
        },
      });
      if (!inv?.customer) return;
      await enqueueNotification(
        "invoice_generated",
        ["EMAIL", "SMS", "WHATSAPP", "IN_APP"],
        {
          name: inv.customer.name,
          email: inv.customer.email,
          phone: inv.customer.phone,
          userId: inv.customer.userId,
        },
        {
          invoiceNo: inv.invoiceNo ?? "",
          amount: fmtBDT(Number(inv.total)),
          dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : "—",
        },
      );
    })(),
  );
}

export function sendPasswordResetOtp(email: string, otp: string): void {
  // Send OTP directly via email — never persist the plaintext code in the outbound queue.
  notifySafe(
    "password-reset-otp",
    (async () => {
      const { sendEmail } = await import("./email.service");
      const { prisma: db } = await import("../lib/prisma");
      const { OutboundChannel, OutboundStatus } = await import("@prisma/client");
      const subject = "SM Travels — password reset code";
      const body = `Your password reset code is ${otp}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.`;
      await sendEmail({ to: email, subject, text: body });
      await db.outboundNotification.create({
        data: {
          channel: OutboundChannel.EMAIL,
          event: "password_reset",
          to: email,
          subject,
          body: "Password reset OTP delivered (code redacted from storage).",
          status: OutboundStatus.SENT,
          sentAt: new Date(),
          attempts: 1,
          maxAttempts: 1,
          payload: { redacted: true },
        },
      });
    })(),
  );
}

export function notifyWelcome(userId: string, email: string | null, name: string, phone?: string | null): void {
  notifySafe(
    "welcome",
    enqueueNotification(
      "welcome",
      ["EMAIL", "SMS", "WHATSAPP", "IN_APP"],
      { email, phone, userId, name },
      { details: "You can sign in to your portal anytime." },
    ),
  );
}

export function notifyCustomerRegistration(
  email: string | null,
  phone: string | null,
  name: string,
  userId?: string | null,
): void {
  notifySafe(
    "customer-registration",
    enqueueNotification(
      "customer_registration",
      ["EMAIL", "SMS", "WHATSAPP", "IN_APP"],
      { email, phone, userId, name },
      {},
    ),
  );
}
