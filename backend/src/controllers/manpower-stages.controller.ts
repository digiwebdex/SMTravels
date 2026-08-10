import type { Request, Response } from "express";
import * as st from "../services/manpower-stages.service";
import {
  medicalListQuerySchema, medicalCreateSchema, medicalUpdateSchema,
  bmetListQuerySchema, bmetCreateSchema, bmetUpdateSchema,
  visaListQuerySchema, visaCreateSchema, visaUpdateSchema,
  deploymentListQuerySchema, deploymentCreateSchema, deploymentUpdateSchema,
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

// Visa (Module 6B-3)
export async function listVisaHandler(req: Request, res: Response) {
  res.json(await st.listVisa(req.auth!, visaListQuerySchema.parse(req.query)));
}
export async function createVisaHandler(req: Request, res: Response) {
  res.status(201).json(await st.createVisa(req.auth!, visaCreateSchema.parse(req.body)));
}
export async function updateVisaHandler(req: Request, res: Response) {
  res.json(await st.updateVisa(req.auth!, req.params.id, visaUpdateSchema.parse(req.body)));
}
export async function archiveVisaHandler(req: Request, res: Response) {
  res.json(await st.archiveVisa(req.auth!, req.params.id));
}

// Deployment (Module 6B-3)
export async function listDeploymentHandler(req: Request, res: Response) {
  res.json(await st.listDeployment(req.auth!, deploymentListQuerySchema.parse(req.query)));
}
export async function createDeploymentHandler(req: Request, res: Response) {
  res.status(201).json(await st.createDeployment(req.auth!, deploymentCreateSchema.parse(req.body)));
}
export async function updateDeploymentHandler(req: Request, res: Response) {
  res.json(await st.updateDeployment(req.auth!, req.params.id, deploymentUpdateSchema.parse(req.body)));
}
export async function archiveDeploymentHandler(req: Request, res: Response) {
  res.json(await st.archiveDeployment(req.auth!, req.params.id));
}
