import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listSuppliersHandler, getSupplierHandler, createSupplierHandler, updateSupplierHandler,
  createSupplierServiceHandler, updateSupplierServiceHandler, deleteSupplierServiceHandler,
} from "../controllers/suppliers.controller";

// Suppliers (vendor) admin — list with branch-scoped payable/outstanding figures,
// supplier detail (services + invoices + READ-ONLY payable schedule), and supplier
// + service master CRUD. Gated on the dedicated "suppliers" module (view reads,
// manage=full writes). There is NO payment/payable-mutating route: actual payments
// run through the Finance flow (payment.service); the payable schedule is read-only.
export const suppliersRouter = Router();
const view = requirePermission("suppliers", "view");
const manage = requirePermission("suppliers", "manage");

suppliersRouter.get("/suppliers", requireAuth, view, asyncHandler(listSuppliersHandler));
suppliersRouter.get("/suppliers/:id", requireAuth, view, asyncHandler(getSupplierHandler));
suppliersRouter.post("/suppliers", requireAuth, manage, asyncHandler(createSupplierHandler));
suppliersRouter.patch("/suppliers/:id", requireAuth, manage, asyncHandler(updateSupplierHandler));
// service master data
suppliersRouter.post("/suppliers/:id/services", requireAuth, manage, asyncHandler(createSupplierServiceHandler));
suppliersRouter.patch("/suppliers/services/:serviceId", requireAuth, manage, asyncHandler(updateSupplierServiceHandler));
suppliersRouter.delete("/suppliers/services/:serviceId", requireAuth, manage, asyncHandler(deleteSupplierServiceHandler));
