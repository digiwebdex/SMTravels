import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listEmployersHandler, createEmployerHandler, updateEmployerHandler, archiveEmployerHandler,
  listJobOrdersHandler, createJobOrderHandler, updateJobOrderHandler, archiveJobOrderHandler,
} from "../controllers/manpower.controller";

// Manpower / Overseas Employment (Module 6). Gated on the existing "bookings" module
// (matches the manpower nav gate) — a dedicated "manpower" permission is added in the
// RBAC finalization pass (Module 8), updating nav + API together.
export const manpowerRouter = Router();
const view = requirePermission("bookings", "view");
const manage = requirePermission("bookings", "manage");

// Employers
manpowerRouter.get("/manpower/employers", requireAuth, view, asyncHandler(listEmployersHandler));
manpowerRouter.post("/manpower/employers", requireAuth, manage, asyncHandler(createEmployerHandler));
manpowerRouter.patch("/manpower/employers/:id", requireAuth, manage, asyncHandler(updateEmployerHandler));
manpowerRouter.delete("/manpower/employers/:id", requireAuth, manage, asyncHandler(archiveEmployerHandler));

// Job Orders
manpowerRouter.get("/manpower/job-orders", requireAuth, view, asyncHandler(listJobOrdersHandler));
manpowerRouter.post("/manpower/job-orders", requireAuth, manage, asyncHandler(createJobOrderHandler));
manpowerRouter.patch("/manpower/job-orders/:id", requireAuth, manage, asyncHandler(updateJobOrderHandler));
manpowerRouter.delete("/manpower/job-orders/:id", requireAuth, manage, asyncHandler(archiveJobOrderHandler));
