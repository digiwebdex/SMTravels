import type { Request, Response } from "express";
import { integrationTestSchema, wasenderConfigSchema, wasenderTestSchema } from "../contracts/integrations.contract";
import * as integrations from "../services/integrations.service";

export async function integrationsStatusHandler(_req: Request, res: Response) {
  res.json(await integrations.getIntegrationsStatus());
}

export async function integrationTestHandler(req: Request, res: Response) {
  res.json(await integrations.sendIntegrationTest(integrationTestSchema.parse(req.body)));
}

// ── Wasender WhatsApp config ─────────────────────────────────────────────────
export async function getWasenderHandler(_req: Request, res: Response) {
  res.json(await integrations.getWasender());
}

export async function saveWasenderHandler(req: Request, res: Response) {
  res.json(await integrations.saveWasender(wasenderConfigSchema.parse(req.body)));
}

export async function testWasenderHandler(req: Request, res: Response) {
  res.json(await integrations.testWasender(wasenderTestSchema.parse(req.body).to));
}
