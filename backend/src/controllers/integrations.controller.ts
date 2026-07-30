import type { Request, Response } from "express";
import { integrationTestSchema } from "../contracts/integrations.contract";
import * as integrations from "../services/integrations.service";

export async function integrationsStatusHandler(_req: Request, res: Response) {
  res.json(integrations.getIntegrationsStatus());
}

export async function integrationTestHandler(req: Request, res: Response) {
  res.json(await integrations.sendIntegrationTest(integrationTestSchema.parse(req.body)));
}
