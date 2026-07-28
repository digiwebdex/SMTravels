import type { Request, Response } from "express";
import * as partners from "../services/partners.service";
import { partnerListQuerySchema, partnerUpdateSchema } from "../contracts/partners.contract";

// Partners (B2B / sub-agent) admin. Reads are branch-scoped in the service; the
// only write is tier/status on the agent (wallet + commission ledgers are immutable).
export async function listPartnersHandler(req: Request, res: Response) {
  res.json(await partners.listPartners(req.auth!, partnerListQuerySchema.parse(req.query)));
}
export async function getPartnerHandler(req: Request, res: Response) {
  res.json(await partners.getPartner(req.auth!, req.params.id));
}
export async function updatePartnerHandler(req: Request, res: Response) {
  res.json(await partners.updatePartner(req.auth!, req.params.id, partnerUpdateSchema.parse(req.body)));
}
