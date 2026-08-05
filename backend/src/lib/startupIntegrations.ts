/**
 * Startup verification for production integrations.
 * Failures are logged clearly; the API process never crashes because of them.
 */
import { logger } from "./logger";
import { checkVisionHealth } from "../services/googleVision.service";
import { checkGeminiHealth } from "../services/gemini.service";
import { checkSmtpHealth } from "../services/email.service";

export async function verifyIntegrationsOnStartup(): Promise<void> {
  logger.info("Verifying production integrations…");

  const [vision, gemini, smtp] = await Promise.all([
    checkVisionHealth().catch((err) => ({
      status: "disconnected" as const,
      provider: "Google Cloud Vision" as const,
      authentication: "Service Account" as const,
      detail: err instanceof Error ? err.message : "check failed",
    })),
    checkGeminiHealth().catch((err) => ({
      status: "disconnected" as const,
      provider: "Google Gemini" as const,
      model: "unknown",
      detail: err instanceof Error ? err.message : "check failed",
    })),
    checkSmtpHealth().catch((err) => ({
      status: "disconnected" as const,
      provider: "Gmail SMTP" as const,
      detail: err instanceof Error ? err.message : "check failed",
    })),
  ]);

  if (vision.status === "connected") {
    logger.info("✓ Google Cloud Vision Connected (Service Account)");
  } else {
    logger.warn({ detail: vision.detail }, "✗ Google Cloud Vision NOT connected");
  }

  if (gemini.status === "connected") {
    logger.info(`✓ Google Gemini Connected (model=${gemini.model})`);
  } else {
    logger.warn({ detail: gemini.detail, model: gemini.model }, "✗ Google Gemini NOT connected");
  }

  if (smtp.status === "connected") {
    logger.info("✓ Gmail SMTP Connected");
  } else {
    logger.warn({ detail: smtp.detail }, "✗ Gmail SMTP NOT connected");
  }
}
