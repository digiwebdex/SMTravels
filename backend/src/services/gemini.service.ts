/**
 * Google Gemini AI — singleton GenerativeModel client.
 *
 * Auth: GEMINI_API_KEY from env (never hardcode). Model: GEMINI_MODEL.
 * Reusable role helpers for Customer / Office / Sales / Finance / Ops / Reports AI.
 */
import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { HttpError } from "../middleware/errorHandler";

export interface GeminiStatus {
  status: "connected" | "disconnected";
  provider: "Google Gemini";
  model: string;
  detail?: string;
}

export type GeminiRole =
  | "customer_chatbot"
  | "customer_faq"
  | "customer_package_recommendation"
  | "office_email"
  | "office_whatsapp"
  | "office_sms"
  | "sales_lead_analysis"
  | "sales_package_recommendation"
  | "sales_upsell"
  | "finance_revenue"
  | "finance_expense"
  | "finance_profit"
  | "ops_booking_summary"
  | "ops_visa_delay"
  | "ops_missing_document"
  | "reports_monthly"
  | "reports_branch"
  | "reports_insights";

const ROLE_PROMPTS: Record<GeminiRole, string> = {
  customer_chatbot:
    "You are the SM Travels International customer chatbot. Be warm, concise, and accurate. Never invent prices.",
  customer_faq:
    "You answer FAQs for SM Travels International (Hajj, Umrah, visa, tickets, tours). Be clear and brief.",
  customer_package_recommendation:
    "Recommend travel packages for SM Travels International based on the customer's needs. Never invent availability.",
  office_email:
    "Write professional business emails for SM Travels International staff. Clear subject-ready body only.",
  office_whatsapp:
    "Draft concise WhatsApp replies for SM Travels International office staff. Friendly and short.",
  office_sms:
    "Write short SMS messages (≤160 chars when possible) for SM Travels International.",
  sales_lead_analysis:
    "Analyze sales leads for SM Travels International. Summarize intent, urgency, and next actions.",
  sales_package_recommendation:
    "Suggest suitable packages for a sales lead. Do not invent prices or stock.",
  sales_upsell:
    "Suggest ethical upsell opportunities (insurance, hotel upgrade, extra nights) for SM Travels bookings.",
  finance_revenue:
    "Summarize revenue figures and trends for SM Travels International finance. Be precise; flag unknowns.",
  finance_expense:
    "Analyze expense data for SM Travels International. Highlight anomalies briefly.",
  finance_profit:
    "Analyze profit margins for SM Travels International. Be factual and concise.",
  ops_booking_summary:
    "Summarize booking/operations status for SM Travels International ops teams.",
  ops_visa_delay:
    "Detect and explain possible visa delay risks from the provided booking/document context.",
  ops_missing_document:
    "Identify missing documents from the provided traveler/booking checklist context.",
  reports_monthly:
    "Produce a monthly business summary for SM Travels International leadership.",
  reports_branch:
    "Compare or analyze branch performance for SM Travels International.",
  reports_insights:
    "Provide actionable business insights for SM Travels International from the given data.",
};

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

export function isGeminiConfigured(): boolean {
  return !!env.GEMINI_API_KEY?.trim();
}

export function getGeminiModelName(): string {
  return env.GEMINI_MODEL || "gemini-2.5-flash";
}

/** Initialize once and reuse. */
export function getGeminiClient(): GoogleGenerativeAI {
  if (genAI) return genAI;
  if (!isGeminiConfigured()) {
    throw new HttpError(503, "AiNotConfigured", {
      detail: "AI assistant is not configured. Set GEMINI_API_KEY.",
    });
  }
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  return genAI;
}

export function getGeminiModel(systemInstruction?: string): GenerativeModel {
  const client = getGeminiClient();
  if (systemInstruction) {
    return client.getGenerativeModel({
      model: getGeminiModelName(),
      systemInstruction,
    });
  }
  if (!model) {
    model = client.getGenerativeModel({ model: getGeminiModelName() });
  }
  return model;
}

export async function checkGeminiHealth(): Promise<GeminiStatus> {
  const modelName = getGeminiModelName();
  const base = { provider: "Google Gemini" as const, model: modelName };
  if (!isGeminiConfigured()) {
    return { ...base, status: "disconnected", detail: "GEMINI_API_KEY missing" };
  }
  try {
    getGeminiClient();
    return { ...base, status: "connected" };
  } catch (err) {
    return {
      ...base,
      status: "disconnected",
      detail: (err instanceof Error ? err.message : "Gemini init failed").slice(0, 200),
    };
  }
}

export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/** Low-level generate — reusable everywhere in the ERP. */
export async function generateText(
  prompt: string,
  opts?: GenerateOptions,
): Promise<string> {
  const m = getGeminiModel(opts?.systemInstruction);
  try {
    const result = await m.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt.slice(0, 12000) }] }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.4,
        maxOutputTokens: opts?.maxOutputTokens ?? 1024,
      },
    });
    const text = result.response.text()?.trim() ?? "";
    if (!text) {
      throw new HttpError(502, "AiProviderError", { detail: "Assistant returned an empty reply." });
    }
    return text;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    const msg = err instanceof Error ? err.message : "unknown";
    logger.warn({ err: msg.slice(0, 200) }, "Gemini generate failed");
    const detail = /429|credits? are depleted|quota/i.test(msg)
      ? "Gemini quota/billing exhausted. Top up credits in Google AI Studio."
      : /401|403|API[_ ]?key/i.test(msg)
        ? "Gemini rejected the API key. Check GEMINI_API_KEY."
        : "Assistant is temporarily unavailable.";
    throw new HttpError(502, "AiProviderError", { detail });
  }
}

/** Multi-turn chat with optional system prompt. */
export async function chatCompletion(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  opts?: GenerateOptions,
): Promise<string> {
  const m = getGeminiModel(opts?.systemInstruction);
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content.slice(0, 4000) }],
  }));
  try {
    const result = await m.generateContent({
      contents,
      generationConfig: {
        temperature: opts?.temperature ?? 0.4,
        maxOutputTokens: opts?.maxOutputTokens ?? 1024,
      },
    });
    const text = result.response.text()?.trim() ?? "";
    if (!text) {
      throw new HttpError(502, "AiProviderError", { detail: "Assistant returned an empty reply." });
    }
    return text;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    const msg = err instanceof Error ? err.message : "unknown";
    logger.warn({ err: msg.slice(0, 200), messageCount: messages.length }, "Gemini chat failed");
    const detail = /429|credits? are depleted|quota/i.test(msg)
      ? "Gemini quota/billing exhausted. Top up credits in Google AI Studio."
      : /401|403|API[_ ]?key/i.test(msg)
        ? "Gemini rejected the API key. Check GEMINI_API_KEY."
        : "Assistant is temporarily unavailable.";
    throw new HttpError(502, "AiProviderError", { detail });
  }
}

/** Role-scoped generation for Customer / Office / Sales / Finance / Ops / Reports. */
export async function generateForRole(role: GeminiRole, input: string): Promise<string> {
  return generateText(input, {
    systemInstruction: ROLE_PROMPTS[role],
    temperature: 0.35,
    maxOutputTokens: 1536,
  });
}

// ── Convenience APIs (callable from any ERP module) ──────────────────────────

export const customerAi = {
  chatbot: (message: string) => generateForRole("customer_chatbot", message),
  faq: (question: string) => generateForRole("customer_faq", question),
  packageRecommendation: (context: string) =>
    generateForRole("customer_package_recommendation", context),
};

export const officeAi = {
  emailWriter: (brief: string) => generateForRole("office_email", brief),
  whatsappReply: (context: string) => generateForRole("office_whatsapp", context),
  smsWriter: (brief: string) => generateForRole("office_sms", brief),
};

export const salesAi = {
  leadAnalysis: (leadContext: string) => generateForRole("sales_lead_analysis", leadContext),
  packageRecommendation: (context: string) =>
    generateForRole("sales_package_recommendation", context),
  upsellSuggestions: (bookingContext: string) => generateForRole("sales_upsell", bookingContext),
};

export const financeAi = {
  revenueSummary: (data: string) => generateForRole("finance_revenue", data),
  expenseAnalysis: (data: string) => generateForRole("finance_expense", data),
  profitAnalysis: (data: string) => generateForRole("finance_profit", data),
};

export const operationsAi = {
  bookingSummary: (data: string) => generateForRole("ops_booking_summary", data),
  visaDelayDetection: (data: string) => generateForRole("ops_visa_delay", data),
  missingDocumentDetection: (data: string) => generateForRole("ops_missing_document", data),
};

export const reportsAi = {
  monthlySummary: (data: string) => generateForRole("reports_monthly", data),
  branchAnalysis: (data: string) => generateForRole("reports_branch", data),
  businessInsights: (data: string) => generateForRole("reports_insights", data),
};
