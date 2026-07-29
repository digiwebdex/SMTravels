import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listTemplatesHandler, createTemplateHandler, updateTemplateHandler, deleteTemplateHandler,
  listLogsHandler, sendHandler,
} from "../controllers/communication.controller";

// Communication Center (SMS) — message log, reusable templates, and send/broadcast.
// Branch-scoped log in the service. Gated on the dedicated "communication" module
// (view reads, manage=full for template writes + sending). Sending reuses the safe
// smsSender singleton — no credentials → log-only, never crashes.
export const communicationRouter = Router();
const view = requirePermission("communication", "view");
const manage = requirePermission("communication", "manage");

communicationRouter.get("/sms/templates", requireAuth, view, asyncHandler(listTemplatesHandler));
communicationRouter.post("/sms/templates", requireAuth, manage, asyncHandler(createTemplateHandler));
communicationRouter.patch("/sms/templates/:id", requireAuth, manage, asyncHandler(updateTemplateHandler));
communicationRouter.delete("/sms/templates/:id", requireAuth, manage, asyncHandler(deleteTemplateHandler));
communicationRouter.get("/sms/logs", requireAuth, view, asyncHandler(listLogsHandler));
communicationRouter.post("/sms/send", requireAuth, manage, asyncHandler(sendHandler));
