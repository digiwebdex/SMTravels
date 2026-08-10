import type { Request, Response } from "express";
import * as st from "../services/manpower-stages.service";
import {
  medicalListQuerySchema, medicalCreateSchema, medicalUpdateSchema,
  bmetListQuerySchema, bmetCreateSchema, bmetUpdateSchema,
} from "../contracts/manpower-stages.contract";

// Medical (Module 6B-2)
export async function listMedicalHandler(req: Request, res: Response) {
  res.json(await st.listMedical(req.auth!, medicalListQuerySchema.parse(req.query)));
}
export async function createMedicalHandler(req: Request, res: Response) {
  res.status(201).json(await st.createMedical(req.auth!, medicalCreateSchema.parse(req.body)));
}
export async function updateMedicalHandler(req: Request, res: Response) {
  res.json(await st.updateMedical(req.auth!, req.params.id, medicalUpdateSchema.parse(req.body)));
}
export async function archiveMedicalHandler(req: Request, res: Response) {
  res.json(await st.archiveMedical(req.auth!, req.params.id));
}

// BMET (Module 6B-2)
export async function listBmetHandler(req: Request, res: Response) {
  res.json(await st.listBmet(req.auth!, bmetListQuerySchema.parse(req.query)));
}
export async function createBmetHandler(req: Request, res: Response) {
  res.status(201).json(await st.createBmet(req.auth!, bmetCreateSchema.parse(req.body)));
}
export async function updateBmetHandler(req: Request, res: Response) {
  res.json(await st.updateBmet(req.auth!, req.params.id, bmetUpdateSchema.parse(req.body)));
}
export async function archiveBmetHandler(req: Request, res: Response) {
  res.json(await st.archiveBmet(req.auth!, req.params.id));
}
