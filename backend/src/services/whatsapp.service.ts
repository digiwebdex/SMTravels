/**
 * WhatsApp delivery — routes through the admin-configurable Wasender gateway
 * (see wasender.service.ts). Missing/disabled config → logged only (simulated).
 * Does not crash the app when credentials are absent.
 */
import { sendViaWasender, isWasenderConfigured } from "./wasender.service";

/** Reflects the admin-configured Wasender key (DB), with env fallback. Async. */
export async function isWhatsAppEnabled(): Promise<boolean> {
  return isWasenderConfigured();
}

export async function sendWhatsApp(
  to: string,
  message: string,
): Promise<{ providerId?: string; simulated?: boolean; error?: string }> {
  const r = await sendViaWasender(to, message);
  return { providerId: r.providerId, simulated: r.simulated, error: r.error };
}
