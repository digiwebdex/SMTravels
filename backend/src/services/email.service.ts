/**
 * Gmail SMTP email service — Nodemailer singleton + reusable HTML/text templates.
 *
 * Credentials: SMTP_* from env only. Missing config → log-only (never crash).
 */
import nodemailer, { type Transporter, type SendMailOptions } from "nodemailer";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { HttpError } from "../middleware/errorHandler";

export interface SmtpStatus {
  status: "connected" | "disconnected";
  provider: "Gmail SMTP";
  detail?: string;
}

export type EmailTemplateKind =
  | "booking_confirmation"
  | "invoice"
  | "payment_confirmation"
  | "visa_approved"
  | "visa_rejected"
  | "passport_ready"
  | "otp"
  | "password_reset"
  | "welcome"
  | "notification";

export interface TemplatedEmail {
  subject: string;
  text: string;
  html: string;
}

let transporter: Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

/** Initialize Nodemailer once and reuse. */
export function getEmailTransporter(): Transporter {
  if (transporter) return transporter;
  if (!isSmtpConfigured()) {
    throw new HttpError(503, "SmtpNotConfigured", {
      detail: "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.",
    });
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER!, pass: env.SMTP_PASS! },
  });
  return transporter;
}

export async function checkSmtpHealth(): Promise<SmtpStatus> {
  const base = { provider: "Gmail SMTP" as const };
  if (!isSmtpConfigured()) {
    return { ...base, status: "disconnected", detail: "SMTP credentials missing" };
  }
  try {
    const t = getEmailTransporter();
    await t.verify();
    return { ...base, status: "connected" };
  } catch (err) {
    return {
      ...base,
      status: "disconnected",
      detail: (err instanceof Error ? err.message : "SMTP verify failed").slice(0, 200),
    };
  }
}

function brandWrap(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Segoe UI,Arial,sans-serif;color:#17456B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:#1B75BC;padding:20px 28px;color:#fff;font-size:18px;font-weight:600;">SM Travels International</td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#17456B;">${escapeHtml(title)}</h1>
          ${bodyHtml}
          <p style="margin:28px 0 0;font-size:12px;color:#64748b;">This is an automated message from SM Travels International. Please do not reply with sensitive passwords.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;line-height:1.5;font-size:15px;">${escapeHtml(text)}</p>`;
}

/** Build a reusable template. Variables are plain strings (already trusted/sanitized by callers). */
export function buildEmailTemplate(
  kind: EmailTemplateKind,
  vars: Record<string, string>,
): TemplatedEmail {
  const name = vars.name ?? "Customer";
  const ref = vars.reference ?? vars.bookingRef ?? "";
  switch (kind) {
    case "booking_confirmation":
      return {
        subject: `Booking Confirmed${ref ? ` — ${ref}` : ""} | SM Travels International`,
        text: `Dear ${name},\n\nYour booking${ref ? ` ${ref}` : ""} is confirmed.\n\n${vars.details ?? ""}\n\nThank you,\nSM Travels International`,
        html: brandWrap(
          "Booking Confirmed",
          `${p(`Dear ${name},`)}${p(`Your booking${ref ? ` ${ref}` : ""} is confirmed.`)}${vars.details ? p(vars.details) : ""}${p("Thank you for choosing SM Travels International.")}`,
        ),
      };
    case "invoice":
      return {
        subject: `Invoice${ref ? ` ${ref}` : ""} | SM Travels International`,
        text: `Dear ${name},\n\nPlease find your invoice${ref ? ` ${ref}` : ""}.\nAmount: ${vars.amount ?? "—"}\nDue: ${vars.dueDate ?? "—"}\n\nSM Travels International`,
        html: brandWrap(
          "Invoice",
          `${p(`Dear ${name},`)}${p(`Invoice${ref ? ` ${ref}` : ""}.`)}${p(`Amount: ${vars.amount ?? "—"}`)}${p(`Due: ${vars.dueDate ?? "—"}`)}`,
        ),
      };
    case "payment_confirmation":
      return {
        subject: `Payment Received${ref ? ` — ${ref}` : ""} | SM Travels International`,
        text: `Dear ${name},\n\nWe received your payment${vars.amount ? ` of ${vars.amount}` : ""}${ref ? ` for ${ref}` : ""}.\n\nSM Travels International`,
        html: brandWrap(
          "Payment Confirmation",
          `${p(`Dear ${name},`)}${p(`We received your payment${vars.amount ? ` of ${vars.amount}` : ""}${ref ? ` for ${ref}` : ""}.`)}`,
        ),
      };
    case "visa_approved":
      return {
        subject: `Visa Approved${ref ? ` — ${ref}` : ""} | SM Travels International`,
        text: `Dear ${name},\n\nYour visa application${ref ? ` (${ref})` : ""} has been approved.\n\nSM Travels International`,
        html: brandWrap(
          "Visa Approved",
          `${p(`Dear ${name},`)}${p(`Your visa application${ref ? ` (${ref})` : ""} has been approved.`)}`,
        ),
      };
    case "visa_rejected":
      return {
        subject: `Visa Update${ref ? ` — ${ref}` : ""} | SM Travels International`,
        text: `Dear ${name},\n\nYour visa application${ref ? ` (${ref})` : ""} was not approved.${vars.reason ? `\nReason: ${vars.reason}` : ""}\n\nPlease contact our office for next steps.\nSM Travels International`,
        html: brandWrap(
          "Visa Update",
          `${p(`Dear ${name},`)}${p(`Your visa application${ref ? ` (${ref})` : ""} was not approved.`)}${vars.reason ? p(`Reason: ${vars.reason}`) : ""}${p("Please contact our office for next steps.")}`,
        ),
      };
    case "passport_ready":
      return {
        subject: `Passport Ready for Collection | SM Travels International`,
        text: `Dear ${name},\n\nYour passport is ready for collection${ref ? ` (ref ${ref})` : ""}.\n\nSM Travels International`,
        html: brandWrap(
          "Passport Ready",
          `${p(`Dear ${name},`)}${p(`Your passport is ready for collection${ref ? ` (ref ${ref})` : ""}.`)}`,
        ),
      };
    case "otp":
      return {
        subject: `Your verification code | SM Travels International`,
        text: `Your SM Travels verification code is ${vars.code ?? "------"}. It expires in ${vars.expiresMinutes ?? "10"} minutes. Do not share this code.`,
        html: brandWrap(
          "Verification Code",
          `${p("Your verification code is:")}<p style="font-size:28px;letter-spacing:4px;font-weight:700;color:#1B75BC;margin:8px 0 16px;">${escapeHtml(vars.code ?? "------")}</p>${p(`Expires in ${vars.expiresMinutes ?? "10"} minutes. Do not share this code.`)}`,
        ),
      };
    case "password_reset":
      return {
        subject: `Password reset | SM Travels International`,
        text: `Dear ${name},\n\nReset your password using this link (expires soon):\n${vars.resetUrl ?? ""}\n\nIf you did not request this, ignore this email.\nSM Travels International`,
        html: brandWrap(
          "Password Reset",
          `${p(`Dear ${name},`)}${p("Reset your password using the link below:")}${vars.resetUrl ? `<p><a href="${escapeHtml(vars.resetUrl)}" style="color:#1B75BC;">Reset password</a></p>` : ""}${p("If you did not request this, ignore this email.")}`,
        ),
      };
    case "welcome":
      return {
        subject: `Welcome to SM Travels International`,
        text: `Dear ${name},\n\nWelcome to SM Travels International. We're glad to have you with us.\n\n${vars.details ?? ""}`,
        html: brandWrap(
          "Welcome",
          `${p(`Dear ${name},`)}${p("Welcome to SM Travels International. We're glad to have you with us.")}${vars.details ? p(vars.details) : ""}`,
        ),
      };
    case "notification":
    default:
      return {
        subject: vars.subject ?? "Notification | SM Travels International",
        text: `Dear ${name},\n\n${vars.message ?? ""}\n\nSM Travels International`,
        html: brandWrap(
          vars.subject ?? "Notification",
          `${p(`Dear ${name},`)}${p(vars.message ?? "")}`,
        ),
      };
  }
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Send a raw email. Never logs body (may contain OTPs). */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const t = getEmailTransporter();
  const mail: SendMailOptions = {
    from: env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
  };
  await t.sendMail(mail);
  logger.info({ to: input.to, subject: input.subject }, "email sent");
}

/** Send using a named template. */
export async function sendTemplatedEmail(
  to: string,
  kind: EmailTemplateKind,
  vars: Record<string, string>,
): Promise<void> {
  const tpl = buildEmailTemplate(kind, vars);
  await sendEmail({ to, subject: tpl.subject, text: tpl.text, html: tpl.html });
}

/** SMTP connectivity test email. */
export async function sendSmtpTestEmail(to: string): Promise<void> {
  await sendTemplatedEmail(to, "notification", {
    name: "Team",
    subject: "SMTP Test — SM Travels International",
    message:
      "This is a test email from the SM Travels International ERP. Gmail SMTP is working correctly.",
  });
}
