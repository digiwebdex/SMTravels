import type { ErrorRequestHandler, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

/** Throwable HTTP error carrying a status code. */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Canonical API error body: { error, message?, details?, requestId }. */
export function sendApiError(
  res: Response,
  status: number,
  error: string,
  opts?: { message?: string; details?: unknown; requestId?: unknown; path?: string },
): void {
  res.status(status).json({
    error,
    ...(opts?.message ? { message: opts.message } : {}),
    ...(opts?.details !== undefined ? { details: opts.details } : {}),
    ...(opts?.path ? { path: opts.path } : {}),
    ...(opts?.requestId != null ? { requestId: String(opts.requestId) } : {}),
  });
}

/** 404 for anything not matched by a router. */
export function notFoundHandler(req: Request, res: Response): void {
  sendApiError(res, 404, "NotFound", { path: req.originalUrl, requestId: req.id, message: "Route not found" });
}

/** Centralized error handler — must be registered LAST (4 args). */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = (req as Request).id;

  if (err instanceof ZodError) {
    sendApiError(res, 400, "ValidationError", {
      message: "Request validation failed",
      details: { issues: err.flatten() },
      requestId,
    });
    return;
  }

  if (err instanceof HttpError) {
    if (err.statusCode >= 500) logger.error({ err, requestId }, err.message);
    sendApiError(res, err.statusCode, err.message, {
      details: err.details,
      requestId,
      message: typeof err.details === "object" && err.details && "detail" in (err.details as object)
        ? String((err.details as { detail?: unknown }).detail ?? undefined)
        : undefined,
    });
    return;
  }

  logger.error({ err, requestId }, "Unhandled error");
  const isProd = process.env.NODE_ENV === "production";
  sendApiError(res, 500, "InternalServerError", {
    message: isProd ? "An unexpected error occurred" : (err as Error | undefined)?.message,
    requestId,
  });
};
