import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireAnyPermission } from "../middleware/auth";
import {
  createAnnouncementHandler,
  createTaskHandler,
  listAnnouncementsHandler,
  listAuditLogsHandler,
  listTasksHandler,
  updateTaskHandler,
} from "../controllers/ops.controller";

/** ERP operations — tasks, announcements, audit logs. */
export const opsRouter = Router();
const opsView = requireAnyPermission(["ops", "crm"], "view");
const opsManage = requireAnyPermission(["ops", "crm"], "manage");
const auditView = requireAnyPermission(["settings", "ops"], "view");

opsRouter.get("/tasks", requireAuth, opsView, asyncHandler(listTasksHandler));
opsRouter.post("/tasks", requireAuth, opsManage, asyncHandler(createTaskHandler));
opsRouter.patch("/tasks/:id", requireAuth, opsManage, asyncHandler(updateTaskHandler));

opsRouter.get("/announcements", requireAuth, opsView, asyncHandler(listAnnouncementsHandler));
opsRouter.post("/announcements", requireAuth, opsManage, asyncHandler(createAnnouncementHandler));

opsRouter.get("/audit-logs", requireAuth, auditView, asyncHandler(listAuditLogsHandler));
