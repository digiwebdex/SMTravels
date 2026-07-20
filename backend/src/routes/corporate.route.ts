import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listCorporateHandler, getCorporateHandler, createCorporateHandler, updateCorporateHandler, deleteCorporateHandler,
} from "../controllers/corporate.controller";

export const corporateRouter = Router();
const view = requirePermission("crm", "view");
const manage = requirePermission("crm", "manage");

corporateRouter.get("/corporate-clients", requireAuth, view, asyncHandler(listCorporateHandler));
corporateRouter.get("/corporate-clients/:id", requireAuth, view, asyncHandler(getCorporateHandler));
corporateRouter.post("/corporate-clients", requireAuth, manage, asyncHandler(createCorporateHandler));
corporateRouter.patch("/corporate-clients/:id", requireAuth, manage, asyncHandler(updateCorporateHandler));
corporateRouter.delete("/corporate-clients/:id", requireAuth, manage, asyncHandler(deleteCorporateHandler));
