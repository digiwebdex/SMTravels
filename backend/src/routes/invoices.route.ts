import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listInvoicesHandler, getInvoiceHandler, createInvoiceHandler, updateInvoiceHandler,
  issueInvoiceHandler, cancelInvoiceHandler, deleteInvoiceHandler,
  listPaymentsHandler, recordPaymentHandler, reversePaymentHandler,
  listRefundsHandler, createRefundHandler, updateRefundHandler,
  listPlansHandler, createPlanHandler,
} from "../controllers/invoices.controller";

// Invoices & Payments module — all BRANCH-SCOPED (branchWhere in the services).
export const invoicesRouter = Router();
const view = requirePermission("invoices", "view");
const manage = requirePermission("invoices", "manage");

// invoices — lifecycle: create(DRAFT) → issue(SENT+number) → cancel; delete DRAFT only
invoicesRouter.get("/invoices", requireAuth, view, asyncHandler(listInvoicesHandler));
invoicesRouter.get("/invoices/:id", requireAuth, view, asyncHandler(getInvoiceHandler));
invoicesRouter.post("/invoices", requireAuth, manage, asyncHandler(createInvoiceHandler));
invoicesRouter.post("/invoices/:id/issue", requireAuth, manage, asyncHandler(issueInvoiceHandler));
invoicesRouter.post("/invoices/:id/cancel", requireAuth, manage, asyncHandler(cancelInvoiceHandler));
invoicesRouter.patch("/invoices/:id", requireAuth, manage, asyncHandler(updateInvoiceHandler));
invoicesRouter.delete("/invoices/:id", requireAuth, manage, asyncHandler(deleteInvoiceHandler));

// payments — immutable: record + reverse only, NO update/delete
invoicesRouter.get("/payments", requireAuth, view, asyncHandler(listPaymentsHandler));
invoicesRouter.post("/payments", requireAuth, manage, asyncHandler(recordPaymentHandler));
invoicesRouter.post("/payments/:id/reverse", requireAuth, manage, asyncHandler(reversePaymentHandler));

// refunds
invoicesRouter.get("/refunds", requireAuth, view, asyncHandler(listRefundsHandler));
invoicesRouter.post("/refunds", requireAuth, manage, asyncHandler(createRefundHandler));
invoicesRouter.patch("/refunds/:id/status", requireAuth, manage, asyncHandler(updateRefundHandler));

// installment plans
invoicesRouter.get("/installment-plans", requireAuth, view, asyncHandler(listPlansHandler));
invoicesRouter.post("/installment-plans", requireAuth, manage, asyncHandler(createPlanHandler));
