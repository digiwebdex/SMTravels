import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Correlation id for this request (echoed as x-request-id). */
      id: string;
    }
  }
}

/** Assigns/propagates a request id and echoes it as the x-request-id header. */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id");
  req.id = incoming && incoming.length <= 200 ? incoming : randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
}
