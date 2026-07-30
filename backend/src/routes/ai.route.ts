import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { aiPublicChatRateLimiter, aiAuthChatRateLimiter } from "../middleware/rateLimit";
import { aiChatHandler } from "../controllers/ai.controller";

export const aiRouter = Router();

/** Public website chat widget — optional auth, heavily rate-limited. */
aiRouter.post("/public/ai/chat", aiPublicChatRateLimiter, optionalAuth, asyncHandler(aiChatHandler));

/** Authenticated ERP assistant — same handler, higher rate limit. */
aiRouter.post("/ai/chat", requireAuth, aiAuthChatRateLimiter, asyncHandler(aiChatHandler));
