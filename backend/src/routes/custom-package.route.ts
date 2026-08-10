import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listInquiriesHandler, createInquiryHandler, updateInquiryHandler, transitionInquiryHandler, archiveInquiryHandler,
  listPackagesHandler, getPackageHandler, createPackageHandler, updatePackageHandler, transitionPackageHandler,
  convertPackageHandler, archivePackageHandler, addItemHandler, updateItemHandler, removeItemHandler,
} from "../controllers/custom-package.controller";

// Custom Package Builder (Module 7). Gated on the existing "packages" module — no new key.
export const customPackageRouter = Router();
const view = requirePermission("packages", "view");
const manage = requirePermission("packages", "manage");

// Inquiries
customPackageRouter.get("/package-inquiries", requireAuth, view, asyncHandler(listInquiriesHandler));
customPackageRouter.post("/package-inquiries", requireAuth, manage, asyncHandler(createInquiryHandler));
customPackageRouter.patch("/package-inquiries/:id", requireAuth, manage, asyncHandler(updateInquiryHandler));
customPackageRouter.post("/package-inquiries/:id/transition", requireAuth, manage, asyncHandler(transitionInquiryHandler));
customPackageRouter.delete("/package-inquiries/:id", requireAuth, manage, asyncHandler(archiveInquiryHandler));

// Custom packages
customPackageRouter.get("/custom-packages", requireAuth, view, asyncHandler(listPackagesHandler));
customPackageRouter.get("/custom-packages/:id", requireAuth, view, asyncHandler(getPackageHandler));
customPackageRouter.post("/custom-packages", requireAuth, manage, asyncHandler(createPackageHandler));
customPackageRouter.patch("/custom-packages/:id", requireAuth, manage, asyncHandler(updatePackageHandler));
customPackageRouter.post("/custom-packages/:id/transition", requireAuth, manage, asyncHandler(transitionPackageHandler));
customPackageRouter.post("/custom-packages/:id/convert", requireAuth, manage, asyncHandler(convertPackageHandler));
customPackageRouter.delete("/custom-packages/:id", requireAuth, manage, asyncHandler(archivePackageHandler));

// Package items
customPackageRouter.post("/custom-packages/:id/items", requireAuth, manage, asyncHandler(addItemHandler));
customPackageRouter.patch("/custom-packages/items/:itemId", requireAuth, manage, asyncHandler(updateItemHandler));
customPackageRouter.delete("/custom-packages/items/:itemId", requireAuth, manage, asyncHandler(removeItemHandler));
