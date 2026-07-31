import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { optionalAuth, requireAuth, requireAnyPermission } from "../middleware/auth";
import { aiPublicChatRateLimiter, aiAuthChatRateLimiter } from "../middleware/rateLimit";
import { aiChatHandler } from "../controllers/ai.controller";
import {
  aiCustomerSummaryHandler,
  aiBookingSummaryHandler,
  aiPackageRecommendHandler,
  aiEmailWriterHandler,
  aiWhatsappWriterHandler,
  aiSmsWriterHandler,
  aiLeadAnalysisHandler,
  aiRevenueAnalysisHandler,
  aiExpenseAnalysisHandler,
  aiInsightsHandler,
  aiMonthlySummaryHandler,
} from "../controllers/ai.erp.controller";

export const aiRouter = Router();
const erpAi = requireAnyPermission(["crm", "bookings", "reports", "settings", "hr"], "view");

function allowPublicAiLeads(req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) {
  (req as import("express").Request & { allowAiLeadCreation?: boolean }).allowAiLeadCreation = true;
  next();
}

aiRouter.post("/public/ai/chat", aiPublicChatRateLimiter, allowPublicAiLeads, optionalAuth, asyncHandler(aiChatHandler));
aiRouter.post("/ai/chat", requireAuth, aiAuthChatRateLimiter, asyncHandler(aiChatHandler));

aiRouter.post("/ai/customer-summary", requireAuth, erpAi, asyncHandler(aiCustomerSummaryHandler));
aiRouter.post("/ai/booking-summary", requireAuth, erpAi, asyncHandler(aiBookingSummaryHandler));
aiRouter.post("/ai/package-recommend", requireAuth, erpAi, asyncHandler(aiPackageRecommendHandler));
aiRouter.post("/ai/email-writer", requireAuth, erpAi, asyncHandler(aiEmailWriterHandler));
aiRouter.post("/ai/whatsapp-writer", requireAuth, erpAi, asyncHandler(aiWhatsappWriterHandler));
aiRouter.post("/ai/sms-writer", requireAuth, erpAi, asyncHandler(aiSmsWriterHandler));
aiRouter.post("/ai/lead-analysis", requireAuth, erpAi, asyncHandler(aiLeadAnalysisHandler));
aiRouter.post("/ai/revenue-analysis", requireAuth, erpAi, asyncHandler(aiRevenueAnalysisHandler));
aiRouter.post("/ai/expense-analysis", requireAuth, erpAi, asyncHandler(aiExpenseAnalysisHandler));
aiRouter.post("/ai/insights", requireAuth, erpAi, asyncHandler(aiInsightsHandler));
aiRouter.post("/ai/monthly-summary", requireAuth, erpAi, asyncHandler(aiMonthlySummaryHandler));
