/**
 * Outbound messaging (email + SMS + WhatsApp) behind tiny interfaces.
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
import { env } from "./env";
import { logger } from "./logger";
import { isSmtpConfigured, sendEmail } from "../services/email.service";

// ── email ────────────────────────────────────────────────────────────────────
export interface EmailSender {
  send(to: string, subject: string, text: string): Promise<void>;
}

class SmtpEmailSender implements EmailSender {
  async send(to: string, subject: string, text: string): Promise<void> {
    await sendEmail({ to, subject, text });
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

/** BulkSMSBD — HTTPS gateway (api key must not travel over cleartext HTTP). */
class BulkSmsBdSender implements SmsSender {
  async send(phone: string, message: string): Promise<void> {
    const res = await fetch("https://bulksmsbd.net/api/smsapi", {
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

// ── whatsapp ─────────────────────────────────────────────────────────────────
export interface WhatsAppSender {
  send(phone: string, message: string): Promise<void>;
}

/** Wasender — POST {to,text} to /api/send-message with Bearer token. */
class WasenderWhatsAppSender implements WhatsAppSender {
  async send(phone: string, message: string): Promise<void> {
    const base = env.WASENDER_API_URL!.replace(/\/$/, "");
    const res = await fetch(`${base}/api/send-message`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WASENDER_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        text: message,
        ...(env.WASENDER_PHONE_NUMBER_ID ? { phone_number_id: env.WASENDER_PHONE_NUMBER_ID } : {}),
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      throw new Error(`Wasender rejected the message: HTTP ${res.status} ${body.slice(0, 200)}`);
    }
    let parsed: { success?: boolean };
    try {
      parsed = JSON.parse(body) as { success?: boolean };
    } catch {
      parsed = {};
    }
    if (parsed.success === false) {
      throw new Error(`Wasender rejected the message: ${body.slice(0, 200)}`);
    }
    logger.info({ phone }, "whatsapp sent");
  }
}

/** No Wasender credentials — log the intent (never the body). */
class LogWhatsAppSender implements WhatsAppSender {
  async send(phone: string): Promise<void> {
    logger.info({ phone }, "whatsapp NOT sent (Wasender not configured) — logged only");
  }
}

// ── singletons, chosen once at boot ──────────────────────────────────────────
export const emailSender: EmailSender = isSmtpConfigured()
  ? new SmtpEmailSender()
  : new LogEmailSender();
export const smsSender: SmsSender =
  env.BULKSMSBD_API_KEY && env.BULKSMSBD_SENDER_ID ? new BulkSmsBdSender() : new LogSmsSender();
export const whatsappSender: WhatsAppSender =
  env.WASENDER_API_URL && env.WASENDER_API_TOKEN && env.WASENDER_PHONE_NUMBER_ID
    ? new WasenderWhatsAppSender()
    : new LogWhatsAppSender();

/** Fire-and-forget wrapper — messaging failures never reach the request path. */
export function notifySafe(label: string, p: Promise<unknown>): void {
  void p.catch((err) => logger.error({ err, label }, "outbound notification failed"));
}
