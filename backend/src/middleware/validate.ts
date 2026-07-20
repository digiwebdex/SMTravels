import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

type Part = "body" | "query" | "params";

/**
 * Zod request validation. On failure, forwards the ZodError to the central
 * error handler (which returns 400). Usage:
 *   router.post("/x", validate(BodySchema), handler)
 */
export function validate(schema: ZodSchema, part: Part = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(result.error);
      return;
    }
    if (part === "body") req.body = result.data;
    next();
  };
}
