import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  overviewHandler, salesHandler, bookingsHandler, agentsHandler,
  serviceHandler, pnlHandler, balanceSheetHandler, cashFlowHandler, exportHandler,
  customersHandler, notificationsHandler,
} from "../controllers/reports.controller";

// Reports & Analytics — READ-ONLY aggregation. Branch scoping is applied inside
// the service (branchWhere semantics): a branch user only ever sees their branch.
export const reportsRouter = Router();
const view = requirePermission("reports", "view");

reportsRouter.get("/reports/overview", requireAuth, view, asyncHandler(overviewHandler));
reportsRouter.get("/reports/sales", requireAuth, view, asyncHandler(salesHandler));
reportsRouter.get("/reports/bookings", requireAuth, view, asyncHandler(bookingsHandler));
reportsRouter.get("/reports/agents", requireAuth, view, asyncHandler(agentsHandler));
reportsRouter.get("/reports/customers", requireAuth, view, asyncHandler(customersHandler));
reportsRouter.get("/reports/notifications", requireAuth, view, asyncHandler(notificationsHandler));
reportsRouter.get("/reports/service/:type", requireAuth, view, asyncHandler(serviceHandler));
reportsRouter.get("/reports/pnl", requireAuth, view, asyncHandler(pnlHandler));
reportsRouter.get("/reports/balance-sheet", requireAuth, view, asyncHandler(balanceSheetHandler));
reportsRouter.get("/reports/cashflow", requireAuth, view, asyncHandler(cashFlowHandler));
reportsRouter.get("/reports/export", requireAuth, view, asyncHandler(exportHandler));
