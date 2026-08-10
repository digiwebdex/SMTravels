import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listBusinessPartnersHandler, getBusinessPartnerHandler, createBusinessPartnerHandler,
  updateBusinessPartnerHandler, archiveBusinessPartnerHandler,
} from "../controllers/business-network.controller";

// Business Network (Module 3) — Companies We Work With. Gated on the existing
// "partners" module (view reads, manage writes) — no new permission key.
export const businessNetworkRouter = Router();
const view = requirePermission("partners", "view");
const manage = requirePermission("partners", "manage");

businessNetworkRouter.get("/business-partners", requireAuth, view, asyncHandler(listBusinessPartnersHandler));
businessNetworkRouter.get("/business-partners/:id", requireAuth, view, asyncHandler(getBusinessPartnerHandler));
businessNetworkRouter.post("/business-partners", requireAuth, manage, asyncHandler(createBusinessPartnerHandler));
businessNetworkRouter.patch("/business-partners/:id", requireAuth, manage, asyncHandler(updateBusinessPartnerHandler));
businessNetworkRouter.delete("/business-partners/:id", requireAuth, manage, asyncHandler(archiveBusinessPartnerHandler));
