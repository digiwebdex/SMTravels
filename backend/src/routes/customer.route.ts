import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listCustomersHandler, getCustomerHandler, createCustomerHandler, updateCustomerHandler, deleteCustomerHandler,
} from "../controllers/customer.controller";

// requireAuth → requirePermission("crm", …) → service applies branchWhere().
export const customerRouter = Router();
const view = requirePermission("crm", "view");
const manage = requirePermission("crm", "manage");

customerRouter.get("/customers", requireAuth, view, asyncHandler(listCustomersHandler));
customerRouter.get("/customers/:id", requireAuth, view, asyncHandler(getCustomerHandler));
customerRouter.post("/customers", requireAuth, manage, asyncHandler(createCustomerHandler));
customerRouter.patch("/customers/:id", requireAuth, manage, asyncHandler(updateCustomerHandler));
customerRouter.delete("/customers/:id", requireAuth, manage, asyncHandler(deleteCustomerHandler));
