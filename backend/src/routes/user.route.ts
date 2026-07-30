import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listStaffOptionsHandler, listUsersHandler, createUserHandler, updateUserHandler, listRolesHandler,
} from "../controllers/user.controller";

export const userRouter = Router();
const view = requirePermission("settings", "view");
const manage = requirePermission("settings", "manage");
const crmView = requirePermission("crm", "view");

// CRM assignee dropdown — minimal active staff list
userRouter.get("/users", requireAuth, crmView, asyncHandler(listStaffOptionsHandler));

// Settings admin — full user management
userRouter.get("/admin/users", requireAuth, view, asyncHandler(listUsersHandler));
userRouter.post("/admin/users", requireAuth, manage, asyncHandler(createUserHandler));
userRouter.patch("/admin/users/:id", requireAuth, manage, asyncHandler(updateUserHandler));

userRouter.get("/roles", requireAuth, view, asyncHandler(listRolesHandler));
