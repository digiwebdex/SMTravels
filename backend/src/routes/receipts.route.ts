import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { paymentReceiptPrintHandler } from "../controllers/print.controller";

/** Printable money receipts — HTML for window.print(), branch-scoped. */
export const receiptsRouter = Router();
const view = requirePermission("invoices", "view");

receiptsRouter.get("/receipts/:paymentId/print", requireAuth, view, asyncHandler(paymentReceiptPrintHandler));
