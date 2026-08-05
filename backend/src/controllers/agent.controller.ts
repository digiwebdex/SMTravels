import type { Request, Response } from "express";
import { agentListQuerySchema, agentCreateSchema, agentUpdateSchema } from "../contracts/settings.contract";
import * as agents from "../services/agent.admin.service";

export async function listAgentsHandler(req: Request, res: Response): Promise<void> {
  res.json(await agents.listAgents(req.auth!, agentListQuerySchema.parse(req.query)));
}

export async function createAgentHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await agents.createAgent(req.auth!, agentCreateSchema.parse(req.body)));
}

export async function updateAgentHandler(req: Request, res: Response): Promise<void> {
  res.json(await agents.updateAgent(req.auth!, req.params.id, agentUpdateSchema.parse(req.body)));
}

export async function getAgentHandler(req: Request, res: Response): Promise<void> {
  res.json(await agents.getAgent(req.auth!, req.params.id));
}
