import { z } from "zod";

export interface IntegrationsStatusDto {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  gemini: boolean;
  vision: boolean;
}

export const integrationTestSchema = z.object({
  channel: z.enum(["email", "sms", "whatsapp"]),
  to: z.string().trim().min(3),
});
export type IntegrationTestInput = z.infer<typeof integrationTestSchema>;
