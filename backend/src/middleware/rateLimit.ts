import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

function tooManyHandler(_req: Request, res: Response): void {
  const requestId = (_req as Request & { id?: string }).id;
  res.status(429).json({
    error: "TooManyRequests",
    message: "Too many attempts, slow down and try again later.",
    requestId,
  });
}

/** Local harness (npm run test:demo / test:api) hits 127.0.0.1:4030 directly.
 *  Real clients go through nginx with trust-proxy, so their IP is never loopback.
 *  Skipping loopback avoids burning the global 300/15m bucket during back-to-back suites. */
function isLoopback(req: Request): boolean {
  const ip = String(req.ip || "").replace(/^::ffff:/, "");
  return ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
}

const skipLoopback = (req: Request) => isLoopback(req);

/** Coarse per-IP limiter for the whole /api surface. Tighten per-route later. */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // requests per IP per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyHandler,
  skip: skipLoopback,
});

const strict = {
  standardHeaders: "draft-7" as const,
  legacyHeaders: false,
  handler: tooManyHandler,
  skip: skipLoopback,
};

/** Login is brute-force bait — tighter than the global limiter, but this is the
 *  per-IP DoS guard, NOT the brute-force guard. Targeted brute force is stopped
 *  by the per-ACCOUNT lockout (5 attempts → 15-min lock) in auth.service. Kept
 *  generous enough that a shared-NAT office IP isn't throttled in normal use. */
export const loginRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, ...strict });

/** OTP request (forgot-password) — a handful per hour per IP. */
export const forgotPasswordRateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, ...strict });

/** OTP verification attempts. */
export const otpRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, ...strict });

/** Public website forms (booking-request / contact) — the only anonymous
 *  write surface. A human sends a handful; bots get cut off fast. */
export const publicIntakeRateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, ...strict });

/** Public AI chat widget — heavy limit; authenticated ERP chat uses aiAuthChatRateLimiter. */
export const aiPublicChatRateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 15, ...strict });

/** Authenticated ERP AI assistant — more headroom for staff. */
export const aiAuthChatRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, ...strict });

/** Refresh-token rotation — prevent cookie hammering. */
export const refreshRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, ...strict });

/** Authenticated uploads (documents / payment proof / OCR). */
export const uploadRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, ...strict });
