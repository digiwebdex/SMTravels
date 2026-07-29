import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listQuotationsHandler, getQuotationHandler, createQuotationHandler,
  updateQuotationHandler, convertQuotationHandler, deleteQuotationHandler,
} from "../controllers/sales.controller";

// Sales — Quotations (→ Sales Orders). Branch-scoped in the service. Gated on the
// dedicated "sales" module (view reads, manage=full writes). A quotation never
// posts to the ledger; conversion creates a DRAFT booking through the existing flow.
export const salesRouter = Router();
const view = requirePermission("sales", "view");
const manage = requirePermission("sales", "manage");

salesRouter.get("/quotations", requireAuth, view, asyncHandler(listQuotationsHandler));
salesRouter.get("/quotations/:id", requireAuth, view, asyncHandler(getQuotationHandler));
salesRouter.post("/quotations", requireAuth, manage, asyncHandler(createQuotationHandler));
salesRouter.patch("/quotations/:id", requireAuth, manage, asyncHandler(updateQuotationHandler));
salesRouter.post("/quotations/:id/convert", requireAuth, manage, asyncHandler(convertQuotationHandler));
salesRouter.delete("/quotations/:id", requireAuth, manage, asyncHandler(deleteQuotationHandler));
