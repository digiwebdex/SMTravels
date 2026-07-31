import { env } from "./env";
import { isVisionConfigured } from "../services/googleVision.service";
import { isGeminiConfigured } from "../services/gemini.service";
import { isSmtpConfigured } from "../services/email.service";

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
    email: isSmtpConfigured() || !!env.SMTP_HOST,
    sms: !!(env.BULKSMSBD_API_KEY && env.BULKSMSBD_SENDER_ID),
    whatsapp: !!(env.WASENDER_API_URL && env.WASENDER_API_TOKEN && env.WASENDER_PHONE_NUMBER_ID),
    gemini: isGeminiConfigured(),
    vision: isVisionConfigured() || !!env.GOOGLE_VISION_API_KEY,
  };
}
