import rateLimit from "express-rate-limit";

/** Coarse per-IP limiter for the whole /api surface. Tighten per-route later. */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // requests per IP per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "TooManyRequests", message: "Rate limit exceeded, try again later." },
});
