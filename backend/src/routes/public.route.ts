import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { publicIntakeRateLimiter } from "../middleware/rateLimit";
import { bookingRequestHandler, contactHandler, publicBankAccountsHandler } from "../controllers/public.controller";

// Public website intake — the ONLY unauthenticated write surface. Tightly
// rate-limited; responses are a bare {ok:true} (no ids, no enumeration).
export const publicRouter = Router();

publicRouter.post("/public/booking-request", publicIntakeRateLimiter, asyncHandler(bookingRequestHandler));
publicRouter.post("/public/contact", publicIntakeRateLimiter, asyncHandler(contactHandler));
publicRouter.get("/public/bank-accounts", asyncHandler(publicBankAccountsHandler));
