import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listBusinessPartnersHandler, getBusinessPartnerHandler, createBusinessPartnerHandler,
  updateBusinessPartnerHandler, archiveBusinessPartnerHandler,
  listMuftiScholarsHandler, getMuftiScholarHandler, createMuftiScholarHandler,
  updateMuftiScholarHandler, archiveMuftiScholarHandler,
} from "../controllers/business-network.controller";

// Business Network (Module 3) — Companies We Work With. Gated on the existing
// "partners" module (view reads, manage writes) — no new permission key.
export const businessNetworkRouter = Router();
const view = requirePermission("business_network", "view");
const manage = requirePermission("business_network", "manage");

businessNetworkRouter.get("/business-partners", requireAuth, view, asyncHandler(listBusinessPartnersHandler));
businessNetworkRouter.get("/business-partners/:id", requireAuth, view, asyncHandler(getBusinessPartnerHandler));
businessNetworkRouter.post("/business-partners", requireAuth, manage, asyncHandler(createBusinessPartnerHandler));
businessNetworkRouter.patch("/business-partners/:id", requireAuth, manage, asyncHandler(updateBusinessPartnerHandler));
businessNetworkRouter.delete("/business-partners/:id", requireAuth, manage, asyncHandler(archiveBusinessPartnerHandler));

// Mufti / Scholar Network (Module 4) — same "partners" module gate.
businessNetworkRouter.get("/mufti-scholars", requireAuth, view, asyncHandler(listMuftiScholarsHandler));
businessNetworkRouter.get("/mufti-scholars/:id", requireAuth, view, asyncHandler(getMuftiScholarHandler));
businessNetworkRouter.post("/mufti-scholars", requireAuth, manage, asyncHandler(createMuftiScholarHandler));
businessNetworkRouter.patch("/mufti-scholars/:id", requireAuth, manage, asyncHandler(updateMuftiScholarHandler));
businessNetworkRouter.delete("/mufti-scholars/:id", requireAuth, manage, asyncHandler(archiveMuftiScholarHandler));
