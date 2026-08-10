import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listEmployersHandler, createEmployerHandler, updateEmployerHandler, archiveEmployerHandler,
  listJobOrdersHandler, createJobOrderHandler, updateJobOrderHandler, archiveJobOrderHandler,
  listCandidatesHandler, createCandidateHandler, updateCandidateHandler, transitionCandidateHandler,
  archiveCandidateHandler, jobOrderPipelineHandler,
} from "../controllers/manpower.controller";
import {
  listMedicalHandler, createMedicalHandler, updateMedicalHandler, archiveMedicalHandler,
  listBmetHandler, createBmetHandler, updateBmetHandler, archiveBmetHandler,
  listVisaHandler, createVisaHandler, updateVisaHandler, archiveVisaHandler,
  listDeploymentHandler, createDeploymentHandler, updateDeploymentHandler, archiveDeploymentHandler,
} from "../controllers/manpower-stages.controller";

// Manpower / Overseas Employment (Module 6). Gated on the existing "bookings" module
// (matches the manpower nav gate) — a dedicated "manpower" permission is added in the
// RBAC finalization pass (Module 8), updating nav + API together.
export const manpowerRouter = Router();
const view = requirePermission("manpower", "view");
const manage = requirePermission("manpower", "manage");

// Employers
manpowerRouter.get("/manpower/employers", requireAuth, view, asyncHandler(listEmployersHandler));
manpowerRouter.post("/manpower/employers", requireAuth, manage, asyncHandler(createEmployerHandler));
manpowerRouter.patch("/manpower/employers/:id", requireAuth, manage, asyncHandler(updateEmployerHandler));
manpowerRouter.delete("/manpower/employers/:id", requireAuth, manage, asyncHandler(archiveEmployerHandler));

// Job Orders
manpowerRouter.get("/manpower/job-orders", requireAuth, view, asyncHandler(listJobOrdersHandler));
manpowerRouter.post("/manpower/job-orders", requireAuth, manage, asyncHandler(createJobOrderHandler));
manpowerRouter.patch("/manpower/job-orders/:id", requireAuth, manage, asyncHandler(updateJobOrderHandler));
manpowerRouter.delete("/manpower/job-orders/:id", requireAuth, manage, asyncHandler(archiveJobOrderHandler));
manpowerRouter.get("/manpower/job-orders/:id/pipeline", requireAuth, view, asyncHandler(jobOrderPipelineHandler));

// Candidates + Recruitment
manpowerRouter.get("/manpower/candidates", requireAuth, view, asyncHandler(listCandidatesHandler));
manpowerRouter.post("/manpower/candidates", requireAuth, manage, asyncHandler(createCandidateHandler));
manpowerRouter.patch("/manpower/candidates/:id", requireAuth, manage, asyncHandler(updateCandidateHandler));
manpowerRouter.post("/manpower/candidates/:id/transition", requireAuth, manage, asyncHandler(transitionCandidateHandler));
manpowerRouter.delete("/manpower/candidates/:id", requireAuth, manage, asyncHandler(archiveCandidateHandler));

// Medical (Module 6B-2)
manpowerRouter.get("/manpower/medical", requireAuth, view, asyncHandler(listMedicalHandler));
manpowerRouter.post("/manpower/medical", requireAuth, manage, asyncHandler(createMedicalHandler));
manpowerRouter.patch("/manpower/medical/:id", requireAuth, manage, asyncHandler(updateMedicalHandler));
manpowerRouter.delete("/manpower/medical/:id", requireAuth, manage, asyncHandler(archiveMedicalHandler));

// BMET (Module 6B-2)
manpowerRouter.get("/manpower/bmet", requireAuth, view, asyncHandler(listBmetHandler));
manpowerRouter.post("/manpower/bmet", requireAuth, manage, asyncHandler(createBmetHandler));
manpowerRouter.patch("/manpower/bmet/:id", requireAuth, manage, asyncHandler(updateBmetHandler));
manpowerRouter.delete("/manpower/bmet/:id", requireAuth, manage, asyncHandler(archiveBmetHandler));

// Visa (Module 6B-3)
manpowerRouter.get("/manpower/visa", requireAuth, view, asyncHandler(listVisaHandler));
manpowerRouter.post("/manpower/visa", requireAuth, manage, asyncHandler(createVisaHandler));
manpowerRouter.patch("/manpower/visa/:id", requireAuth, manage, asyncHandler(updateVisaHandler));
manpowerRouter.delete("/manpower/visa/:id", requireAuth, manage, asyncHandler(archiveVisaHandler));

// Deployment (Module 6B-3)
manpowerRouter.get("/manpower/deployment", requireAuth, view, asyncHandler(listDeploymentHandler));
manpowerRouter.post("/manpower/deployment", requireAuth, manage, asyncHandler(createDeploymentHandler));
manpowerRouter.patch("/manpower/deployment/:id", requireAuth, manage, asyncHandler(updateDeploymentHandler));
manpowerRouter.delete("/manpower/deployment/:id", requireAuth, manage, asyncHandler(archiveDeploymentHandler));
