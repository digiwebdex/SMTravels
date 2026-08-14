import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  integrationsStatusHandler,
  integrationTestHandler,
  getWasenderHandler,
  saveWasenderHandler,
  testWasenderHandler,
} from "../controllers/integrations.controller";

export const integrationsRouter = Router();
const viewSettings = requirePermission("settings", "view");
const manageSettings = requirePermission("settings", "manage");

integrationsRouter.get("/integrations/status", requireAuth, viewSettings, asyncHandler(integrationsStatusHandler));
integrationsRouter.post("/integrations/test", requireAuth, manageSettings, asyncHandler(integrationTestHandler));

// Wasender WhatsApp gateway config (admin-settable)
integrationsRouter.get("/integrations/wasender", requireAuth, viewSettings, asyncHandler(getWasenderHandler));
integrationsRouter.patch("/integrations/wasender", requireAuth, manageSettings, asyncHandler(saveWasenderHandler));
integrationsRouter.post("/integrations/wasender/test", requireAuth, manageSettings, asyncHandler(testWasenderHandler));
