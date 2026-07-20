import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { listCustomersHandler, getCustomerHandler } from "../controllers/customer.controller";

// Demo of the full stack a real resource uses:
//   requireAuth  → valid access token
//   requirePermission("crm", …) → RBAC gate (a CUSTOMER role has no crm access → 403)
//   branchWhere(auth) inside the service → row-level branch scoping
export const customerRouter = Router();

customerRouter.get("/customers", requireAuth, requirePermission("crm", "view"), asyncHandler(listCustomersHandler));
customerRouter.get("/customers/:id", requireAuth, requirePermission("crm", "view"), asyncHandler(getCustomerHandler));
