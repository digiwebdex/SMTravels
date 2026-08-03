/**
 * Wasender WhatsApp — feature-flagged. Missing env → disabled (log-only).
 * Does not crash the app when credentials are absent.
 */
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { whatsappSender } from "../lib/notify";

export function isWhatsAppEnabled(): boolean {
  return !!(env.WASENDER_API_URL && env.WASENDER_API_TOKEN && env.WASENDER_PHONE_NUMBER_ID);
}

export async function sendWhatsApp(to: string, message: string): Promise<{ providerId?: string }> {
  await whatsappSender.send(to, message);
  if (!isWhatsAppEnabled()) {
    logger.info({ to, channel: "whatsapp" }, "whatsapp queued as log-only (credentials missing)");
  }
  return {};
}
