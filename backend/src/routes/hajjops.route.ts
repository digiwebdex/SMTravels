import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listQuotasHandler, createQuotaHandler, updateQuotaHandler, deleteQuotaHandler,
  listBatchesHandler, getBatchHandler, createBatchHandler, updateBatchHandler, deleteBatchHandler,
  assignCapacityHandler,
  listRegistrationsHandler, getRegistrationHandler, createRegistrationHandler, updateRegistrationHandler, deleteRegistrationHandler,
  passportAlertsHandler,
} from "../controllers/hajjops.controller";

// Hajj/Umrah operations — quota, group-departure batches, pilgrim government
// registration, and passport-expiry alerts. Branch-scoped in the service.
// Gated on the "ops" module (view for reads, manage=full for writes).
export const hajjOpsRouter = Router();
const view = requirePermission("ops", "view");
const manage = requirePermission("ops", "manage");

// quota
hajjOpsRouter.get("/ops/quotas", requireAuth, view, asyncHandler(listQuotasHandler));
hajjOpsRouter.post("/ops/quotas", requireAuth, manage, asyncHandler(createQuotaHandler));
hajjOpsRouter.patch("/ops/quotas/:id", requireAuth, manage, asyncHandler(updateQuotaHandler));
hajjOpsRouter.delete("/ops/quotas/:id", requireAuth, manage, asyncHandler(deleteQuotaHandler));

// batches
hajjOpsRouter.get("/ops/batches", requireAuth, view, asyncHandler(listBatchesHandler));
hajjOpsRouter.get("/ops/batches/:id", requireAuth, view, asyncHandler(getBatchHandler));
hajjOpsRouter.post("/ops/batches", requireAuth, manage, asyncHandler(createBatchHandler));
hajjOpsRouter.patch("/ops/batches/:id", requireAuth, manage, asyncHandler(updateBatchHandler));
hajjOpsRouter.delete("/ops/batches/:id", requireAuth, manage, asyncHandler(deleteBatchHandler));

// assign booking → capacity
hajjOpsRouter.post("/ops/assign", requireAuth, manage, asyncHandler(assignCapacityHandler));

// pilgrim registration
hajjOpsRouter.get("/ops/registrations", requireAuth, view, asyncHandler(listRegistrationsHandler));
hajjOpsRouter.get("/ops/registrations/:id", requireAuth, view, asyncHandler(getRegistrationHandler));
hajjOpsRouter.post("/ops/registrations", requireAuth, manage, asyncHandler(createRegistrationHandler));
hajjOpsRouter.patch("/ops/registrations/:id", requireAuth, manage, asyncHandler(updateRegistrationHandler));
hajjOpsRouter.delete("/ops/registrations/:id", requireAuth, manage, asyncHandler(deleteRegistrationHandler));

// passport-expiry alerts
hajjOpsRouter.get("/ops/passport-alerts", requireAuth, view, asyncHandler(passportAlertsHandler));
