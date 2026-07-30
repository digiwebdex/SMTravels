import { env } from "./env";

export interface IntegrationsStatus {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  gemini: boolean;
  vision: boolean;
}

/** Which outbound integrations have credentials configured (never exposes secrets). */
export function integrationsConfigured(): IntegrationsStatus {
  return {
    email: !!env.SMTP_HOST,
    sms: !!(env.BULKSMSBD_API_KEY && env.BULKSMSBD_SENDER_ID),
    whatsapp: !!(env.WASENDER_API_URL && env.WASENDER_API_TOKEN && env.WASENDER_PHONE_NUMBER_ID),
    gemini: !!env.GEMINI_API_KEY,
    vision: !!env.GOOGLE_VISION_API_KEY,
  };
}
