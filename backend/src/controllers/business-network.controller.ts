import type { Request, Response } from "express";
import * as bn from "../services/business-network.service";
import {
  businessPartnerListQuerySchema, businessPartnerCreateSchema, businessPartnerUpdateSchema,
  muftiScholarListQuerySchema, muftiScholarCreateSchema, muftiScholarUpdateSchema,
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

// Mufti / Scholar Network (Module 4).
export async function listMuftiScholarsHandler(req: Request, res: Response) {
  res.json(await bn.listMuftiScholars(req.auth!, muftiScholarListQuerySchema.parse(req.query)));
}
export async function getMuftiScholarHandler(req: Request, res: Response) {
  res.json(await bn.getMuftiScholar(req.auth!, req.params.id));
}
export async function createMuftiScholarHandler(req: Request, res: Response) {
  res.status(201).json(await bn.createMuftiScholar(req.auth!, muftiScholarCreateSchema.parse(req.body)));
}
export async function updateMuftiScholarHandler(req: Request, res: Response) {
  res.json(await bn.updateMuftiScholar(req.auth!, req.params.id, muftiScholarUpdateSchema.parse(req.body)));
}
export async function archiveMuftiScholarHandler(req: Request, res: Response) {
  res.json(await bn.archiveMuftiScholar(req.auth!, req.params.id));
}
