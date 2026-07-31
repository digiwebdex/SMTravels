/**
 * In-process outbound notification worker.
 * Failures are logged; the API process never crashes.
 */
import { logger } from "../lib/logger";
import { processOutboundQueue } from "./unifiedNotification.service";

const INTERVAL_MS = 15_000;
const HR_REMINDER_INTERVAL_MS = 60 * 60 * 1000; // hourly scan; service dedupes within 6 days
let timer: NodeJS.Timeout | null = null;
let running = false;
let lastHrReminderAt = 0;

export function startNotificationWorker(): void {
  if (timer) return;
  logger.info("Notification worker started (interval 15s)");
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const n = await processOutboundQueue(25);
      if (n > 0) logger.info({ processed: n }, "notification worker batch");
      if (Date.now() - lastHrReminderAt >= HR_REMINDER_INTERVAL_MS) {
        lastHrReminderAt = Date.now();
        // Dynamic import avoids any circular load with hr.service.
        const { processHrLifecycleReminders } = await import("./hr.service");
        const hrN = await processHrLifecycleReminders();
        if (hrN > 0) logger.info({ sent: hrN }, "hr lifecycle reminders");
      }
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
