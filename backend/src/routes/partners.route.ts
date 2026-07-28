import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { listPartnersHandler, getPartnerHandler, updatePartnerHandler } from "../controllers/partners.controller";

// Partners (B2B / sub-agents) admin — list with downline/commission/wallet summary,
// agent detail, and tier/status management. Branch-scoped in the service. Gated on
// the dedicated "partners" module (view for reads, manage=full for tier/status).
// There is NO wallet-mutating route: the ledger is immutable (append + reverse only).
export const partnersRouter = Router();
const view = requirePermission("partners", "view");
const manage = requirePermission("partners", "manage");

partnersRouter.get("/partners", requireAuth, view, asyncHandler(listPartnersHandler));
partnersRouter.get("/partners/:id", requireAuth, view, asyncHandler(getPartnerHandler));
partnersRouter.patch("/partners/:id", requireAuth, manage, asyncHandler(updatePartnerHandler));
