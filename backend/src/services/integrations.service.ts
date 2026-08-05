import { emailSender, smsSender, whatsappSender } from "../lib/notify";
import { integrationsConfigured } from "../lib/integrations";
import { HttpError } from "../middleware/errorHandler";
import type { IntegrationTestInput, IntegrationsStatusDto } from "../contracts/integrations.contract";

export function getIntegrationsStatus(): IntegrationsStatusDto {
  return integrationsConfigured();
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
    case "whatsapp":
      if (!status.whatsapp) throw new HttpError(503, "WhatsAppNotConfigured", { detail: "Wasender is not configured." });
      await whatsappSender.send(input.to, label);
      break;
  }

  return { ok: true, channel: input.channel };
}
