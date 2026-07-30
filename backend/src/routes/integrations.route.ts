import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { integrationsStatusHandler, integrationTestHandler } from "../controllers/integrations.controller";

export const integrationsRouter = Router();
const viewSettings = requirePermission("settings", "view");
const manageSettings = requirePermission("settings", "manage");

integrationsRouter.get("/integrations/status", requireAuth, viewSettings, asyncHandler(integrationsStatusHandler));
integrationsRouter.post("/integrations/test", requireAuth, manageSettings, asyncHandler(integrationTestHandler));
