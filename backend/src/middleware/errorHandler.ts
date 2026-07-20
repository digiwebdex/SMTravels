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

/** 404 for anything not matched by a router. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: "NotFound", path: req.originalUrl, requestId: req.id });
}

/** Centralized error handler — must be registered LAST (4 args). */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = (req as Request).id;

  if (err instanceof ZodError) {
    res.status(400).json({ error: "ValidationError", issues: err.flatten(), requestId });
    return;
  }

  if (err instanceof HttpError) {
    if (err.statusCode >= 500) logger.error({ err, requestId }, err.message);
    res.status(err.statusCode).json({ error: err.message, details: err.details, requestId });
    return;
  }

  logger.error({ err, requestId }, "Unhandled error");
  const isProd = process.env.NODE_ENV === "production";
  res.status(500).json({
    error: "InternalServerError",
    message: isProd ? undefined : (err as Error | undefined)?.message,
    requestId,
  });
};
