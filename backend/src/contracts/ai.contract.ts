/**
 * AI chat contract — shared between public website widget and ERP assistant.
 */
import { z } from "zod";
import { serviceTypeSchema } from "./booking.contract";

export const aiChatRoleSchema = z.enum(["user", "assistant"]);
export type AiChatRoleDto = z.infer<typeof aiChatRoleSchema>;

export const aiChatMessageSchema = z.object({
  role: aiChatRoleSchema,
  content: z.string().trim().min(1).max(4000),
});
export type AiChatMessageDto = z.infer<typeof aiChatMessageSchema>;

export const aiCreateLeadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(32),
  service: serviceTypeSchema.optional(),
});
export type AiCreateLeadInput = z.infer<typeof aiCreateLeadSchema>;

/** Multi-turn ERP/public chat OR simple `{ message }` for POST /api/ai/chat. */
export const aiChatSchema = z
  .object({
    message: z.string().trim().min(1).max(4000).optional(),
    messages: z.array(aiChatMessageSchema).min(1).max(30).optional(),
    createLead: aiCreateLeadSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.message && (!val.messages || val.messages.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either message or messages",
        path: ["message"],
      });
    }
  });
export type AiChatInput = z.infer<typeof aiChatSchema>;

export interface AiBookingIntent {
  type: "book";
  service?: string;
  summary?: string;
}

export interface AiChatResult {
  reply: string;
  intent: AiBookingIntent | null;
  leadCreated: boolean;
}
