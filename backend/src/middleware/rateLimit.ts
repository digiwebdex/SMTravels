import rateLimit from "express-rate-limit";

/** Coarse per-IP limiter for the whole /api surface. Tighten per-route later. */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // requests per IP per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "TooManyRequests", message: "Rate limit exceeded, try again later." },
});

const strict = {
  standardHeaders: "draft-7" as const,
  legacyHeaders: false,
  message: { error: "TooManyRequests", message: "Too many attempts, slow down and try again later." },
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
