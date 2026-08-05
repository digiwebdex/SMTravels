import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listSuppliersHandler, createSupplierHandler, updateSupplierHandler,
} from "../controllers/supplier.controller";

export const supplierRouter = Router();
const view = requirePermission("settings", "view");
const manage = requirePermission("settings", "manage");

supplierRouter.get("/suppliers", requireAuth, view, asyncHandler(listSuppliersHandler));
supplierRouter.post("/suppliers", requireAuth, manage, asyncHandler(createSupplierHandler));
supplierRouter.patch("/suppliers/:id", requireAuth, manage, asyncHandler(updateSupplierHandler));
