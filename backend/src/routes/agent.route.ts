import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listAgentsHandler, createAgentHandler, updateAgentHandler, getAgentHandler,
} from "../controllers/agent.controller";

export const agentRouter = Router();
const view = requirePermission("settings", "view");
const manage = requirePermission("settings", "manage");

agentRouter.get("/agents", requireAuth, view, asyncHandler(listAgentsHandler));
agentRouter.get("/agents/:id", requireAuth, view, asyncHandler(getAgentHandler));
agentRouter.post("/agents", requireAuth, manage, asyncHandler(createAgentHandler));
agentRouter.patch("/agents/:id", requireAuth, manage, asyncHandler(updateAgentHandler));
