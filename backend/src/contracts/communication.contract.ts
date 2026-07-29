/**
 * Communication Center (SMS) contract. Admin UI over the EXISTING safe sender
 * (lib/notify smsSender) — a send with no BulkSMSBD credentials logs-only and
 * never crashes, exactly like the booking notifications. Templates reuse the
 * existing MessageTemplate model; every send is recorded in MessageLog (audit).
 */
import { z } from "zod";

export const templateChannelSchema = z.enum(["EMAIL", "SMS", "WHATSAPP"]);
export const messageStatusSchema = z.enum(["SENT", "LOGGED", "FAILED"]);
const optStr = z.string().trim().max(500).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

// ── templates (reuse MessageTemplate) ────────────────────────────────────────
export const templateCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  content: z.string().trim().min(1).max(2000),
  channel: templateChannelSchema.default("SMS"),
  category: optStr,
  event: optStr,
  status: z.enum(["active", "archived"]).optional(),
});
export type TemplateCreateInput = z.infer<typeof templateCreateSchema>;
export const templateUpdateSchema = templateCreateSchema.partial();
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;

// ── send / broadcast ──────────────────────────────────────────────────────────
export const sendSchema = z.object({
  mode: z.enum(["manual", "customer", "lead", "batch"]),
  phones: z.array(z.string().trim().min(3)).optional(),   // manual
  customerId: z.string().trim().optional(),                // customer
  leadStage: z.string().trim().optional(),                 // lead segment
  leadService: z.string().trim().optional(),
  batchId: z.string().trim().optional(),                   // pilgrims of a batch
  templateId: z.string().trim().optional(),                // template body …
  body: z.string().trim().max(2000).optional(),            // … or raw body
  branchId: z.string().trim().optional(),                  // global roles + manual mode
}).refine((v) => v.templateId || v.body, { message: "Provide a template or a message body", path: ["body"] });
export type SendInput = z.infer<typeof sendSchema>;

export const logListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: messageStatusSchema.optional(),
  branchId: z.string().trim().optional(),
});
export type LogListQuery = z.infer<typeof logListQuerySchema>;

// ── DTOs ──────────────────────────────────────────────────────────────────────
export interface MessageTemplateDto {
  id: string; channel: string; name: string; event: string | null;
  content: string | null; category: string | null; status: string;
  createdAt: string; updatedAt: string;
}
export interface MessageLogDto {
  id: string; branchId: string; branchName: string | null; channel: string;
  recipient: string; recipientName: string | null; body: string;
  templateId: string | null; status: string; error: string | null;
  sentById: string | null; sentByName: string | null; createdAt: string;
}
export interface MessageLogResponse {
  data: MessageLogDto[];
  stats: { total: number; sent: number; logged: number; failed: number };
}
export interface SendResult {
  total: number; sent: number; logged: number; failed: number;
  smsConfigured: boolean; // false = log-only mode (no BulkSMSBD credentials)
}
