import type { Request, Response } from "express";
import { APP_VERSION } from "../lib/version";

const startedAt = Date.now();

/** GET /api/health — liveness probe used by the deploy script. */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    version: APP_VERSION,
    uptime: Number(process.uptime().toFixed(3)),
    startedAt: new Date(startedAt).toISOString(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV ?? "development",
  });
}
