import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listMembersHandler, getMemberHandler, createMemberHandler, updateMemberHandler, deleteMemberHandler,
} from "../controllers/operations.controller";

// Operations Team roster admin — Muallim / guide / imam / medical / driver / crew.
// Nullable-branch scoping (own + global) in the service. Gated on the dedicated
// "operations_team" module (view reads, manage=full writes). The muallim → batch
// link is assigned through the batch (hajjops) endpoints, not here.
export const operationsRouter = Router();
const view = requirePermission("operations_team", "view");
const manage = requirePermission("operations_team", "manage");

operationsRouter.get("/operations-team", requireAuth, view, asyncHandler(listMembersHandler));
operationsRouter.get("/operations-team/:id", requireAuth, view, asyncHandler(getMemberHandler));
operationsRouter.post("/operations-team", requireAuth, manage, asyncHandler(createMemberHandler));
operationsRouter.patch("/operations-team/:id", requireAuth, manage, asyncHandler(updateMemberHandler));
operationsRouter.delete("/operations-team/:id", requireAuth, manage, asyncHandler(deleteMemberHandler));
