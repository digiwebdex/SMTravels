import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireAnyPermission } from "../middleware/auth";
import {
  listTemplatesHandler,
  getTemplateHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  sendMessageHandler,
  bulkSendHandler,
  listOutboundLogHandler,
} from "../controllers/communications.controller";

/** ERP communications ops — requireAuth + crm OR settings permission. */
export const communicationsRouter = Router();
const view = requireAnyPermission(["crm", "settings"], "view");
const manage = requireAnyPermission(["crm", "settings"], "manage");

communicationsRouter.get("/communications/templates", requireAuth, view, asyncHandler(listTemplatesHandler));
communicationsRouter.get("/communications/templates/:id", requireAuth, view, asyncHandler(getTemplateHandler));
communicationsRouter.post("/communications/templates", requireAuth, manage, asyncHandler(createTemplateHandler));
communicationsRouter.patch("/communications/templates/:id", requireAuth, manage, asyncHandler(updateTemplateHandler));
communicationsRouter.delete("/communications/templates/:id", requireAuth, manage, asyncHandler(deleteTemplateHandler));

communicationsRouter.post("/communications/send", requireAuth, manage, asyncHandler(sendMessageHandler));
communicationsRouter.post("/communications/bulk", requireAuth, manage, asyncHandler(bulkSendHandler));
communicationsRouter.get("/communications/outbound", requireAuth, view, asyncHandler(listOutboundLogHandler));
