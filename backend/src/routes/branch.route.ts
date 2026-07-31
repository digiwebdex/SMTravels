import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { listBranchesHandler, listBranchOptionsHandler, updateBranchHandler } from "../controllers/branch.controller";

export const branchRouter = Router();
const manage = requirePermission("settings", "manage");

// Filter dropdown — any authenticated user
branchRouter.get("/branches", requireAuth, asyncHandler(listBranchOptionsHandler));

// Settings admin — full branch list + update
branchRouter.get("/admin/branches", requireAuth, requirePermission("settings", "view"), asyncHandler(listBranchesHandler));
branchRouter.patch("/admin/branches/:id", requireAuth, manage, asyncHandler(updateBranchHandler));
