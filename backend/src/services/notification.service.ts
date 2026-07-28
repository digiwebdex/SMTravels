/**
 * Notifications: in-app rows + email/SMS templates for the three business
 * events (booking confirmation, payment receipt, password reset) and staff
 * alerts on new website leads.
 *
 * Every outbound send goes through notifySafe() — a dead SMTP relay or SMS
 * gateway can never fail the business operation that triggered it.
 */
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { emailSender, smsSender, whatsappSender, notifySafe } from "../lib/notify";
import type { AuthCtx } from "../middleware/auth";

const fmtBDT = (n: number): string => `BDT ${n.toLocaleString("en-US")}`;

// ── in-app ───────────────────────────────────────────────────────────────────
export interface InAppInput {
  title: string;
  body?: string;
  type?: string;
  color?: string;
}

export async function inApp(userIds: string[], n: InAppInput): Promise<void> {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, title: n.title, body: n.body ?? null, type: n.type ?? null, color: n.color ?? null })),
  });
}

/** My notifications (any authenticated user — customer portal has its own gate). */
export async function listMine(auth: AuthCtx): Promise<{ id: string; title: string; body: string | null; type: string | null; color: string | null; read: boolean; createdAt: string }[]> {
  const rows = await prisma.notification.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: "desc" }, take: 50 });
  return rows.map((n) => ({ id: n.id, title: n.title, body: n.body, type: n.type, color: n.color, read: n.read, createdAt: n.createdAt.toISOString() }));
}

export async function markAllMineRead(auth: AuthCtx): Promise<{ ok: true }> {
  await prisma.notification.updateMany({ where: { userId: auth.userId, read: false }, data: { read: true } });
  return { ok: true };
}

// ── staff alert: new website lead ────────────────────────────────────────────
/** Global admins + the lead branch's managers get an in-app notification. */
export async function notifyStaffNewLead(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { name: true, serviceInterest: true, branchId: true } });
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
  await inApp(staff.map((u) => u.id), {
    title: "New website lead",
    body: `${lead.name}${lead.serviceInterest ? ` — ${lead.serviceInterest}` : ""} (via website form)`,
    type: "lead",
    color: "#0E6BB8",
  });
}

// ── customer messaging: booking confirmation / payment receipt ───────────────
export function notifyBookingConfirmed(bookingId: string): void {
  notifySafe(
    "booking-confirmation",
    (async () => {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          bookingNo: true, serviceType: true, departureDate: true,
          customer: { select: { name: true, phone: true, email: true, userId: true } },
        },
      });
      if (!b?.bookingNo || !b.customer) return;
      const { name, phone, email, userId } = b.customer;
      const service = b.serviceType.replace(/_/g, " ");
      const dep = b.departureDate ? ` Departure: ${b.departureDate.toISOString().slice(0, 10)}.` : "";
      const text =
        `Dear ${name},\n\nYour ${service} booking is confirmed. Booking No: ${b.bookingNo}.${dep}\n\n` +
        `Our team will contact you with the next steps.\n\nSM Travels International`;
      if (email) notifySafe("booking-email", emailSender.send(email, `Booking confirmed — ${b.bookingNo}`, text));
      if (phone) notifySafe("booking-sms", smsSender.send(phone, `SM Travels: your ${service} booking ${b.bookingNo} is confirmed. We will contact you shortly.`));
      if (phone) notifySafe("booking-whatsapp", whatsappSender.send(phone, `SM Travels International: your ${service} booking ${b.bookingNo} is confirmed.${dep} Our team will contact you shortly.`));
      if (userId) await inApp([userId], { title: "Booking confirmed", body: `${service} — ${b.bookingNo}`, type: "booking", color: "#0E7C66" });
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
          paymentNo: true, baseAmount: true, method: true, customerId: true,
          invoice: { select: { invoiceNo: true, customer: { select: { name: true, phone: true, email: true, userId: true } } } },
        },
      });
      if (!p) return;
      const c =
        p.invoice?.customer ??
        (p.customerId
          ? await prisma.customer.findUnique({ where: { id: p.customerId }, select: { name: true, phone: true, email: true, userId: true } })
          : null);
      if (!c) return;
      const amount = fmtBDT(Number(p.baseAmount));
      const ref = p.invoice?.invoiceNo ? ` against invoice ${p.invoice.invoiceNo}` : "";
      const pno = p.paymentNo ?? "(pending)";
      const text =
        `Dear ${c.name},\n\nWe received your payment of ${amount}${ref}. Reference: ${pno}.\n\n` +
        `Thank you.\n\nSM Travels International`;
      if (c.email) notifySafe("payment-email", emailSender.send(c.email, `Payment received — ${pno}`, text));
      if (c.phone) notifySafe("payment-sms", smsSender.send(c.phone, `SM Travels: payment of ${amount} received${ref}. Ref ${pno}. Thank you.`));
      if (c.userId) await inApp([c.userId], { title: "Payment received", body: `${amount} — ${pno}`, type: "payment", color: "#0E7C66" });
    })(),
  );
}

// ── auth: password-reset OTP delivery ────────────────────────────────────────
export function sendPasswordResetOtp(email: string, otp: string): void {
  notifySafe(
    "password-reset-otp",
    emailSender.send(
      email,
      "Your SM Travels password reset code",
      `Your one-time code is: ${otp}\n\nIt expires in 10 minutes. If you didn't request this, ignore this email.`,
    ),
  );
}
