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

/** Admin-set Wasender WhatsApp config. apiKey blank = keep the existing one. */
export const wasenderConfigSchema = z.object({
  enabled: z.boolean().optional(),
  baseUrl: z.string().trim().url().optional().or(z.literal("")),
  apiKey: z.string().trim().max(400).optional(),
});
export type WasenderConfigInput = z.infer<typeof wasenderConfigSchema>;

export const wasenderTestSchema = z.object({ to: z.string().trim().min(6).max(32) });
export type WasenderTestInput = z.infer<typeof wasenderTestSchema>;

export interface WasenderPublicConfigDto {
  enabled: boolean;
  baseUrl: string;
  hasApiKey: boolean;
  apiKeyMasked: string;
  configured: boolean;
}
