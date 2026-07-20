import pino from "pino";
import { env } from "./env";

/**
 * Structured logger. Pretty-printed in dev; plain JSON in production
 * (journald/systemd captures stdout).
 */
export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  ...(env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
        },
      }
    : {}),
});
