/**
 * In-process outbound notification worker.
 * Failures are logged; the API process never crashes.
 */
import { logger } from "../lib/logger";
import { processOutboundQueue } from "./unifiedNotification.service";

const INTERVAL_MS = 15_000;
let timer: NodeJS.Timeout | null = null;
let running = false;

export function startNotificationWorker(): void {
  if (timer) return;
  logger.info("Notification worker started (interval 15s)");
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const n = await processOutboundQueue(25);
      if (n > 0) logger.info({ processed: n }, "notification worker batch");
    } catch (err) {
      logger.warn({ err }, "notification worker tick failed");
    } finally {
      running = false;
    }
  };
  void tick();
  timer = setInterval(() => void tick(), INTERVAL_MS);
  timer.unref();
}

export function stopNotificationWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
