import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listPackagesHandler, getPackageHandler, createPackageHandler, updatePackageHandler, deletePackageHandler,
  listServicesHandler, getServiceHandler, createServiceHandler, updateServiceHandler,
} from "../controllers/catalog.controller";

// Catalog (packages + services) — company-wide data: requireAuth →
// requirePermission("packages", …). No branchWhere() (no branchId in schema).
export const catalogRouter = Router();
const view = requirePermission("packages", "view");
const manage = requirePermission("packages", "manage");

catalogRouter.get("/packages", requireAuth, view, asyncHandler(listPackagesHandler));
catalogRouter.get("/packages/:id", requireAuth, view, asyncHandler(getPackageHandler));
catalogRouter.post("/packages", requireAuth, manage, asyncHandler(createPackageHandler));
catalogRouter.patch("/packages/:id", requireAuth, manage, asyncHandler(updatePackageHandler));
catalogRouter.delete("/packages/:id", requireAuth, manage, asyncHandler(deletePackageHandler));

catalogRouter.get("/services", requireAuth, view, asyncHandler(listServicesHandler));
catalogRouter.get("/services/:id", requireAuth, view, asyncHandler(getServiceHandler));
catalogRouter.post("/services", requireAuth, manage, asyncHandler(createServiceHandler));
catalogRouter.patch("/services/:id", requireAuth, manage, asyncHandler(updateServiceHandler));
