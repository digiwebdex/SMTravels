/**
 * Wasender WhatsApp gateway — ADMIN-CONFIGURABLE.
 *
 * The API key/base-url/enabled flag live in the Setting table (group
 * "integration") so they can be set from the admin UI and take effect
 * immediately (config is read at send time — no restart, no redeploy).
 * Environment variables act as a fallback. When nothing is configured the
 * message is logged only (simulated) — the app never crashes on a missing key.
 */
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { env } from "../lib/env";

const GROUP = "integration";
const K_ENABLED = "wasender.enabled";
const K_BASEURL = "wasender.baseUrl";
const K_APIKEY = "wasender.apiKey";
const DEFAULT_BASE = "https://wasenderapi.com/api";

async function companyId(): Promise<string> {
  const c = await prisma.company.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  return c?.id ?? "default";
}

export interface WasenderConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  hasApiKey: boolean;
}

/** Safe shape for the admin UI — never returns the raw key. */
export interface WasenderPublicConfig {
  enabled: boolean;
  baseUrl: string;
  hasApiKey: boolean;
  apiKeyMasked: string;
  configured: boolean;
}

export async function getWasenderConfig(): Promise<WasenderConfig> {
  const cid = await companyId();
  const rows = await prisma.setting.findMany({
    where: { companyId: cid, group: GROUP, key: { in: [K_ENABLED, K_BASEURL, K_APIKEY] } },
  });
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value ?? "";
  const apiKey = m[K_APIKEY] || env.WASENDER_API_TOKEN || "";
  const baseUrl = (m[K_BASEURL] || env.WASENDER_API_URL || DEFAULT_BASE).replace(/\/+$/, "");
  return { enabled: (m[K_ENABLED] ?? "") === "true", baseUrl, apiKey, hasApiKey: !!apiKey };
}

export async function getWasenderPublicConfig(): Promise<WasenderPublicConfig> {
  const c = await getWasenderConfig();
  const masked = c.apiKey ? "••••••" + c.apiKey.slice(-4) : "";
  return { enabled: c.enabled, baseUrl: c.baseUrl, hasApiKey: c.hasApiKey, apiKeyMasked: masked, configured: c.enabled && c.hasApiKey };
}

export async function isWasenderConfigured(): Promise<boolean> {
  const c = await getWasenderConfig();
  return c.enabled && !!c.apiKey;
}

export async function setWasenderConfig(input: { enabled?: boolean; baseUrl?: string; apiKey?: string }): Promise<WasenderPublicConfig> {
  const cid = await companyId();
  const put = (key: string, value: string) =>
    prisma.setting.upsert({
      where: { companyId_key: { companyId: cid, key } },
      update: { value },
      create: { companyId: cid, key, value, group: GROUP },
    });
  const ops = [];
  if (input.enabled !== undefined) ops.push(put(K_ENABLED, input.enabled ? "true" : "false"));
  if (input.baseUrl !== undefined) ops.push(put(K_BASEURL, input.baseUrl.trim()));
  // Only overwrite the key when a new non-empty one is supplied (blank = keep existing).
  if (input.apiKey !== undefined && input.apiKey.trim() !== "") ops.push(put(K_APIKEY, input.apiKey.trim()));
  if (ops.length) await prisma.$transaction(ops);
  return getWasenderPublicConfig();
}

export interface WasenderSendResult {
  ok: boolean;
  simulated?: boolean;
  providerId?: string;
  error?: string;
}

/** Send one WhatsApp message via Wasender. Simulated (log-only) when unconfigured. */
export async function sendViaWasender(to: string, text: string): Promise<WasenderSendResult> {
  const cfg = await getWasenderConfig();
  if (!cfg.enabled || !cfg.apiKey) {
    logger.info({ to, channel: "whatsapp" }, "wasender not configured — logged only (simulated)");
    return { ok: true, simulated: true };
  }
  try {
    const res = await fetch(`${cfg.baseUrl}/send-message`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to, text }),
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string; id?: string; data?: { id?: string; msgId?: string } };
    if (!res.ok) {
      logger.warn({ to, status: res.status }, "wasender send failed");
      return { ok: false, error: body?.message || `HTTP ${res.status}` };
    }
    return { ok: true, providerId: body?.data?.msgId ?? body?.data?.id ?? body?.id };
  } catch (e) {
    logger.error({ err: (e as Error).message, to }, "wasender send error");
    return { ok: false, error: (e as Error).message };
  }
}
