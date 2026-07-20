import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listLeadsHandler, getLeadHandler, createLeadHandler, updateLeadHandler,
  changeStageHandler, convertLeadHandler, deleteLeadHandler,
  addNoteHandler, addFollowUpHandler, toggleFollowUpHandler, addCallHandler, addTaskHandler,
} from "../controllers/lead.controller";

export const leadRouter = Router();
const view = requirePermission("crm", "view");
const manage = requirePermission("crm", "manage");

leadRouter.get("/leads", requireAuth, view, asyncHandler(listLeadsHandler));
leadRouter.get("/leads/:id", requireAuth, view, asyncHandler(getLeadHandler));
leadRouter.post("/leads", requireAuth, manage, asyncHandler(createLeadHandler));
leadRouter.post("/leads/:id/convert", requireAuth, manage, asyncHandler(convertLeadHandler));
leadRouter.patch("/leads/:id/stage", requireAuth, manage, asyncHandler(changeStageHandler));
leadRouter.patch("/leads/:id", requireAuth, manage, asyncHandler(updateLeadHandler));
leadRouter.delete("/leads/:id", requireAuth, manage, asyncHandler(deleteLeadHandler));

leadRouter.post("/leads/:id/notes", requireAuth, manage, asyncHandler(addNoteHandler));
leadRouter.post("/leads/:id/followups", requireAuth, manage, asyncHandler(addFollowUpHandler));
leadRouter.patch("/leads/:id/followups/:fid", requireAuth, manage, asyncHandler(toggleFollowUpHandler));
leadRouter.post("/leads/:id/calls", requireAuth, manage, asyncHandler(addCallHandler));
leadRouter.post("/leads/:id/tasks", requireAuth, manage, asyncHandler(addTaskHandler));
