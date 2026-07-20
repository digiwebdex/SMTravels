import type { Request, Response, NextFunction, RequestHandler } from "express";

/** Wrap an async route handler so rejected promises reach the error handler
 *  (Express 4 does not forward async throws automatically). */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
