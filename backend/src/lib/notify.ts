/**
 * Outbound messaging (email + SMS) behind tiny interfaces.
 *
 * Safety contract (the reason this file exists):
 *   - Missing credentials NEVER crash the app or an endpoint. Each sender
 *     falls back to a log-only implementation, so every call is safe in any
 *     environment.
 *   - Sending is fire-and-forget from business code: use notifySafe() —
 *     failures are logged, never thrown into the request path. A booking must
 *     confirm even when the SMTP relay is down.
 *   - SMS goes through BulkSMSBD (plain HTTP gateway, manual-ops scope). No
 *     other third-party API is wired — see project scope.
 */
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";
import { logger } from "./logger";

// ── email ────────────────────────────────────────────────────────────────────
export interface EmailSender {
  send(to: string, subject: string, text: string): Promise<void>;
}

class SmtpEmailSender implements EmailSender {
  private transporter: Transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  async send(to: string, subject: string, text: string): Promise<void> {
    await this.transporter.sendMail({ from: env.SMTP_FROM, to, subject, text });
    logger.info({ to, subject }, "email sent");
  }
}

/** No SMTP configured — log the intent (subject only: bodies can carry OTPs). */
class LogEmailSender implements EmailSender {
  async send(to: string, subject: string): Promise<void> {
    logger.info({ to, subject }, "email NOT sent (SMTP not configured) — logged only");
  }
}

// ── sms ──────────────────────────────────────────────────────────────────────
export interface SmsSender {
  send(phone: string, message: string): Promise<void>;
}

/** BulkSMSBD — simple HTTP GET/POST gateway (http://bulksmsbd.net/api/smsapi). */
class BulkSmsBdSender implements SmsSender {
  async send(phone: string, message: string): Promise<void> {
    const res = await fetch("http://bulksmsbd.net/api/smsapi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.BULKSMSBD_API_KEY,
        senderid: env.BULKSMSBD_SENDER_ID,
        number: phone,
        message,
      }),
    });
    const body = await res.text();
    // BulkSMSBD replies 202 with a numeric response_code; 202 in the body = queued OK.
    if (!res.ok || !/202/.test(body)) {
      throw new Error(`BulkSMSBD rejected the message: HTTP ${res.status} ${body.slice(0, 200)}`);
    }
    logger.info({ phone }, "sms sent");
  }
}

/** No SMS credentials — log the intent (never the body: it may carry OTPs). */
class LogSmsSender implements SmsSender {
  async send(phone: string): Promise<void> {
    logger.info({ phone }, "sms NOT sent (BulkSMSBD not configured) — logged only");
  }
}

// ── whatsapp ───────────────────────────────────────────────────────────────────
export interface WhatsAppSender {
  send(phone: string, message: string): Promise<void>;
}

/** WhatsApp Cloud API (Meta Graph). Env-gated; falls back to log-only. */
class CloudWhatsAppSender implements WhatsAppSender {
  async send(phone: string, message: string): Promise<void> {
    const res = await fetch(`https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: message } }),
    });
    if (!res.ok) throw new Error(`WhatsApp API rejected the message: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    logger.info({ phone }, "whatsapp sent");
  }
}

/** No WhatsApp credentials — log the intent (never the body). */
class LogWhatsAppSender implements WhatsAppSender {
  async send(phone: string): Promise<void> {
    logger.info({ phone }, "whatsapp NOT sent (WhatsApp not configured) — logged only");
  }
}

// ── singletons, chosen once at boot ──────────────────────────────────────────
export const emailSender: EmailSender = env.SMTP_HOST ? new SmtpEmailSender() : new LogEmailSender();
export const smsConfigured = !!(env.BULKSMSBD_API_KEY && env.BULKSMSBD_SENDER_ID);
export const smsSender: SmsSender = smsConfigured ? new BulkSmsBdSender() : new LogSmsSender();
export const whatsappSender: WhatsAppSender =
  env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID ? new CloudWhatsAppSender() : new LogWhatsAppSender();

/** Fire-and-forget wrapper — messaging failures never reach the request path. */
export function notifySafe(label: string, p: Promise<unknown>): void {
  void p.catch((err) => logger.error({ err, label }, "outbound notification failed"));
}
