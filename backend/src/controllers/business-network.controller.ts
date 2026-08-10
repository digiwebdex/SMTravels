import type { Request, Response } from "express";
import * as bn from "../services/business-network.service";
import {
  businessPartnerListQuerySchema, businessPartnerCreateSchema, businessPartnerUpdateSchema,
} from "../contracts/business-network.contract";

// Business Network (Module 3) — Companies We Work With.
export async function listBusinessPartnersHandler(req: Request, res: Response) {
  res.json(await bn.listBusinessPartners(req.auth!, businessPartnerListQuerySchema.parse(req.query)));
}
export async function getBusinessPartnerHandler(req: Request, res: Response) {
  res.json(await bn.getBusinessPartner(req.auth!, req.params.id));
}
export async function createBusinessPartnerHandler(req: Request, res: Response) {
  res.status(201).json(await bn.createBusinessPartner(req.auth!, businessPartnerCreateSchema.parse(req.body)));
}
export async function updateBusinessPartnerHandler(req: Request, res: Response) {
  res.json(await bn.updateBusinessPartner(req.auth!, req.params.id, businessPartnerUpdateSchema.parse(req.body)));
}
export async function archiveBusinessPartnerHandler(req: Request, res: Response) {
  res.json(await bn.archiveBusinessPartner(req.auth!, req.params.id));
}
