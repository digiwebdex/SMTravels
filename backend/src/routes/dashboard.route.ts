import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { dashboardSummaryHandler } from "../controllers/dashboard.controller";

// ERP admin dashboard — READ-ONLY aggregation. Branch scoping is applied inside
// the service (branchWhere semantics): a branch user only ever sees their branch.
//
// Gated on the "dashboard" module at "manage" (RBAC access "full") — every
// internal staff role has it; portal roles (customer/agent/supplier) only have
// "view", so they cannot reach these company/branch aggregates.
export const dashboardRouter = Router();
const manage = requirePermission("dashboard", "manage");

dashboardRouter.get("/dashboard/summary", requireAuth, manage, asyncHandler(dashboardSummaryHandler));
