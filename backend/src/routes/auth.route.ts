import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { loginRateLimiter, forgotPasswordRateLimiter, otpRateLimiter, refreshRateLimiter } from "../middleware/rateLimit";
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
  forgotPasswordHandler,
  verifyOtpHandler,
  resetPasswordHandler,
  changePasswordHandler,
} from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/auth/login", loginRateLimiter, asyncHandler(loginHandler));
authRouter.post("/auth/refresh", refreshRateLimiter, asyncHandler(refreshHandler));
authRouter.post("/auth/logout", asyncHandler(logoutHandler));
authRouter.get("/auth/me", requireAuth, asyncHandler(meHandler));
authRouter.post("/auth/change-password", requireAuth, asyncHandler(changePasswordHandler));

authRouter.post("/auth/forgot-password", forgotPasswordRateLimiter, asyncHandler(forgotPasswordHandler));
authRouter.post("/auth/verify-otp", otpRateLimiter, asyncHandler(verifyOtpHandler));
authRouter.post("/auth/reset-password", otpRateLimiter, asyncHandler(resetPasswordHandler));
