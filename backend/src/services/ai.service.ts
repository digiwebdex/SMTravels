/**
 * Gemini-powered chat for the public website and authenticated ERP users.
 * Uses the singleton gemini.service (official @google/generative-ai SDK).
 * Never logs full message bodies or lead PII — only counts and intent flags.
 */
import { HttpError } from "../middleware/errorHandler";
import { logger } from "../lib/logger";
import { createWebsiteLead } from "./publicIntake.service";
import { serviceTypeSchema } from "../contracts/booking.contract";
import type { AiChatInput, AiChatResult, AiChatMessageDto } from "../contracts/ai.contract";
import { chatCompletion, isGeminiConfigured } from "./gemini.service";

const SYSTEM_PROMPT = `You are the SM Travels International assistant — a helpful, concise guide for Hajj, Umrah, visa, air tickets, tours, and related travel services in Bangladesh.

Rules:
- Answer in the same language the user writes (Bangla or English).
- NEVER invent prices, package availability, or policy details you do not know.
- For pricing or custom quotes, direct users to book online at /book or contact via WhatsApp.
- Keep replies short (2–4 sentences unless the user asks for detail).
- You cannot process payments or access personal booking records.

When the user clearly wants to book or request a callback, append a single JSON line at the very end of your reply (after a blank line) in this exact format:
{"intent":"book","service":"HAJJ|UMRAH|VISA|AIR_TICKET|MANPOWER|TOUR|HOTEL|null","summary":"one line"}
Only include this JSON when booking intent is clear. Otherwise do not include JSON.`;

function normalizeMessages(input: AiChatInput): AiChatMessageDto[] {
  if (input.messages?.length) return input.messages;
  if (input.message) return [{ role: "user", content: input.message }];
  return [];
}

function parseIntent(text: string): { reply: string; intent: AiChatResult["intent"] } {
  const jsonMatch = text.match(/\n?\s*(\{"intent"\s*:\s*"book"[^}]+\})\s*$/);
  if (!jsonMatch) return { reply: text.trim(), intent: null };
  try {
    const raw = JSON.parse(jsonMatch[1]) as { intent?: string; service?: string; summary?: string };
    if (raw.intent !== "book") return { reply: text.replace(jsonMatch[0], "").trim(), intent: null };
    const service = raw.service && raw.service !== "null" ? raw.service : undefined;
    return {
      reply: text.replace(jsonMatch[0], "").trim(),
      intent: { type: "book", service, summary: raw.summary ?? undefined },
    };
  } catch {
    return { reply: text.trim(), intent: null };
  }
}

export async function chat(
  input: AiChatInput,
  opts?: { authenticated?: boolean; allowLeadCreation?: boolean },
): Promise<AiChatResult> {
  if (!isGeminiConfigured()) {
    throw new HttpError(503, "AiNotConfigured", {
      detail: "AI assistant is not configured. Please use /book or WhatsApp instead.",
    });
  }

  const messages = normalizeMessages(input);
  const rawText = await chatCompletion(messages, {
    systemInstruction: SYSTEM_PROMPT,
    temperature: 0.4,
    maxOutputTokens: 1024,
  });

  const { reply, intent } = parseIntent(rawText);

  logger.info({
    messageCount: messages.length,
    authenticated: !!opts?.authenticated,
    hasIntent: !!intent,
    createLead: !!input.createLead,
  }, "AI chat completed");

  let leadCreated = false;
  if (opts?.allowLeadCreation && input.createLead?.name && input.createLead.phone) {
    const intentService = intent?.service ? serviceTypeSchema.safeParse(intent.service).data : undefined;
    const noteLines = [
      "Website AI chat lead",
      intent?.summary && `Intent: ${intent.summary}`,
      (intentService ?? intent?.service) && `Service: ${intentService ?? intent?.service}`,
      `Last user message length: ${messages.filter((m) => m.role === "user").at(-1)?.content.length ?? 0} chars`,
    ].filter(Boolean);
    await createWebsiteLead({
      name: input.createLead.name,
      phone: input.createLead.phone,
      email: null,
      serviceInterest: input.createLead.service ?? intentService ?? null,
      quantity: null,
      note: noteLines.join("\n"),
    });
    leadCreated = true;
  }

  return { reply, intent, leadCreated };
}
