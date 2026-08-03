import { createApp } from "./app";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { verifyIntegrationsOnStartup } from "./lib/startupIntegrations";
import { startNotificationWorker, stopNotificationWorker } from "./services/notificationWorker";

// Ensure Vision ADC path is visible to the Google client library.
if (env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = env.GOOGLE_APPLICATION_CREDENTIALS;
}

const app = createApp();

// Bind explicitly to HOST (127.0.0.1) — NEVER 0.0.0.0. nginx proxies to this.
const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`SM Travels API listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
  void verifyIntegrationsOnStartup();
  startNotificationWorker();
});

// ── Graceful shutdown (systemd sends SIGTERM on restart/stop) ─────────────────
let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received — shutting down gracefully`);

  const force = setTimeout(() => {
    logger.error("Forced shutdown after 10s timeout");
    process.exit(1);
  }, 10_000);
  force.unref();

  server.close(async (err) => {
    if (err) logger.error({ err }, "Error closing HTTP server");
    stopNotificationWorker();
    try {
      await prisma.$disconnect();
    } catch (e) {
      logger.error({ err: e }, "Error disconnecting Prisma");
    }
    logger.info("Shutdown complete");
    process.exit(err ? 1 : 0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});
