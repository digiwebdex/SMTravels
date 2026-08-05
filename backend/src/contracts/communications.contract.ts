/**
 * Communications contract — message templates, outbound send, bulk send, log.
 * zod-only (no @prisma) so the frontend can import types.
 */
import { z } from "zod";

export const OUTBOUND_CHANNELS = ["email", "sms", "whatsapp"] as const;
export const outboundChannelSchema = z.enum(OUTBOUND_CHANNELS);
export type OutboundChannelDto = z.infer<typeof outboundChannelSchema>;

export const TEMPLATE_CHANNELS = ["EMAIL", "SMS", "WHATSAPP"] as const;
export const templateChannelSchema = z.enum(TEMPLATE_CHANNELS);
export type TemplateChannelDto = z.infer<typeof templateChannelSchema>;

export const BULK_AUDIENCES = ["customers", "leads"] as const;
export const bulkAudienceSchema = z.enum(BULK_AUDIENCES);
export type BulkAudienceDto = z.infer<typeof bulkAudienceSchema>;

// ── MessageTemplate ───────────────────────────────────────────────────────────

export interface MessageTemplateDto {
  id: string;
  channel: TemplateChannelDto;
  name: string;
  event: string | null;
  content: string | null;
  category: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const messageTemplateCreateSchema = z.object({
  channel: templateChannelSchema,
  name: z.string().trim().min(1).max(120),
  event: z.string().trim().max(80).optional(),
  content: z.string().trim().max(4000).optional(),
  category: z.string().trim().max(80).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});
export type MessageTemplateCreateInput = z.infer<typeof messageTemplateCreateSchema>;

export const messageTemplateUpdateSchema = messageTemplateCreateSchema.partial();
export type MessageTemplateUpdateInput = z.infer<typeof messageTemplateUpdateSchema>;

export const messageTemplateListQuerySchema = z.object({
  channel: templateChannelSchema.optional(),
});
export type MessageTemplateListQuery = z.infer<typeof messageTemplateListQuerySchema>;

// ── Outbound send ─────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  channel: outboundChannelSchema,
  to: z.string().trim().min(3).max(200),
  body: z.string().trim().min(1).max(4000),
  subject: z.string().trim().max(200).optional(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const bulkSendSchema = z.object({
  channel: z.enum(["sms", "whatsapp"]),
  body: z.string().trim().min(1).max(4000),
  subject: z.string().trim().max(200).optional(),
  audience: bulkAudienceSchema,
});
export type BulkSendInput = z.infer<typeof bulkSendSchema>;

export interface OutboundLogItem {
  id: string;
  action: string;
  target: string | null;
  detail: string | null;
  createdAt: string;
}

export interface SendResult {
  ok: true;
  queued?: number;
}
