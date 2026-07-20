import type { Request } from "express";
import { AuditSeverity } from "@prisma/client";
import { prisma } from "./prisma";
import { logger } from "./logger";

/** Write an AuditLog row. Never throws — an audit failure must not break the request. */
export async function audit(params: {
  event: string;
  userId?: string | null;
  ip?: string | null;
  resource?: string;
  severity?: AuditSeverity;
  detail?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        event: params.event,
        userId: params.userId ?? null,
        ip: params.ip ?? null,
        resource: params.resource ?? "Auth",
        severity: params.severity ?? AuditSeverity.INFO,
        detail: params.detail,
      },
    });
  } catch (err) {
    logger.error({ err }, "audit write failed");
  }
}

export function clientIp(req: Request): string | null {
  return (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.ip) ?? null;
}
