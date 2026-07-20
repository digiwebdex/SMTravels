import type { Request, Response } from "express";
import { corporateCreateSchema, corporateUpdateSchema, corporateListQuerySchema } from "../contracts/crm.contract";
import * as corp from "../services/corporate.service";

export async function listCorporateHandler(req: Request, res: Response): Promise<void> {
  res.json(await corp.listCorporate(req.auth!, corporateListQuerySchema.parse(req.query)));
}
export async function getCorporateHandler(req: Request, res: Response): Promise<void> {
  res.json(await corp.getCorporate(req.auth!, req.params.id));
}
export async function createCorporateHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await corp.createCorporate(req.auth!, corporateCreateSchema.parse(req.body)));
}
export async function updateCorporateHandler(req: Request, res: Response): Promise<void> {
  res.json(await corp.updateCorporate(req.auth!, req.params.id, corporateUpdateSchema.parse(req.body)));
}
export async function deleteCorporateHandler(req: Request, res: Response): Promise<void> {
  await corp.deleteCorporate(req.auth!, req.params.id);
  res.json({ ok: true });
}
