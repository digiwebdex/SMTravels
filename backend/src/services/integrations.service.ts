import { emailSender, smsSender } from "../lib/notify";
import { integrationsConfigured } from "../lib/integrations";
import { HttpError } from "../middleware/errorHandler";
import type { IntegrationTestInput, IntegrationsStatusDto } from "../contracts/integrations.contract";
import {
  getWasenderPublicConfig,
  setWasenderConfig,
  sendViaWasender,
  isWasenderConfigured,
  type WasenderPublicConfig,
} from "./wasender.service";

export async function getIntegrationsStatus(): Promise<IntegrationsStatusDto> {
  const base = integrationsConfigured();
  // WhatsApp reflects the admin-configured Wasender key (DB), not just env.
  return { ...base, whatsapp: await isWasenderConfigured() };
}

// ── Wasender WhatsApp config (admin-settable) ────────────────────────────────
export async function getWasender(): Promise<WasenderPublicConfig> {
  return getWasenderPublicConfig();
}

export async function saveWasender(input: { enabled?: boolean; baseUrl?: string; apiKey?: string }): Promise<WasenderPublicConfig> {
  return setWasenderConfig(input);
}

export async function testWasender(to: string): Promise<{ ok: boolean; simulated?: boolean; error?: string }> {
  const r = await sendViaWasender(to, `SM Travels — WhatsApp test at ${new Date().toISOString()}`);
  if (r.simulated) throw new HttpError(503, "WhatsAppNotConfigured", { detail: "Wasender is not configured — save an API key and enable it first." });
  if (!r.ok) throw new HttpError(502, "WhatsAppSendFailed", { detail: r.error ?? "Wasender send failed." });
  return { ok: true };
}

export async function sendIntegrationTest(input: IntegrationTestInput): Promise<{ ok: true; channel: string }> {
  const status = integrationsConfigured();
  const label = `SM Travels integration test (${input.channel}) at ${new Date().toISOString()}`;

  switch (input.channel) {
    case "email":
      if (!status.email) throw new HttpError(503, "EmailNotConfigured", { detail: "SMTP is not configured." });
      await emailSender.send(input.to, "SM Travels — test email", label);
      break;
    case "sms":
      if (!status.sms) throw new HttpError(503, "SmsNotConfigured", { detail: "BulkSMSBD is not configured." });
      await smsSender.send(input.to, label);
      break;
    case "whatsapp": {
      const r = await sendViaWasender(input.to, label);
      if (r.simulated) throw new HttpError(503, "WhatsAppNotConfigured", { detail: "Wasender is not configured." });
      if (!r.ok) throw new HttpError(502, "WhatsAppSendFailed", { detail: r.error ?? "Wasender send failed." });
      break;
    }
  }

  return { ok: true, channel: input.channel };
}
