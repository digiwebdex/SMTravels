/**
 * BulkSMSBD — feature-flagged. Missing env → disabled (log-only).
 */
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { smsSender } from "../lib/notify";

export function isSmsEnabled(): boolean {
  return !!(env.BULKSMSBD_API_KEY && env.BULKSMSBD_SENDER_ID);
}

export async function sendSms(to: string, message: string): Promise<{ providerId?: string }> {
  await smsSender.send(to, message);
  if (!isSmsEnabled()) {
    logger.info({ to, channel: "sms" }, "sms queued as log-only (credentials missing)");
  }
  return {};
}
