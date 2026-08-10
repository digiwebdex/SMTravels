import type { Request, Response } from "express";
import * as mp from "../services/manpower.service";
import {
  employerListQuerySchema, employerCreateSchema, employerUpdateSchema,
  jobOrderListQuerySchema, jobOrderCreateSchema, jobOrderUpdateSchema,
  candidateListQuerySchema, candidateCreateSchema, candidateUpdateSchema, candidateTransitionSchema,
} from "../contracts/manpower.contract";

// Employers (Module 6A)
export async function listEmployersHandler(req: Request, res: Response) {
  res.json(await mp.listEmployers(req.auth!, employerListQuerySchema.parse(req.query)));
}
export async function createEmployerHandler(req: Request, res: Response) {
  res.status(201).json(await mp.createEmployer(req.auth!, employerCreateSchema.parse(req.body)));
}
export async function updateEmployerHandler(req: Request, res: Response) {
  res.json(await mp.updateEmployer(req.auth!, req.params.id, employerUpdateSchema.parse(req.body)));
}
export async function archiveEmployerHandler(req: Request, res: Response) {
  res.json(await mp.archiveEmployer(req.auth!, req.params.id));
}

// Job Orders (Module 6A)
export async function listJobOrdersHandler(req: Request, res: Response) {
  res.json(await mp.listJobOrders(req.auth!, jobOrderListQuerySchema.parse(req.query)));
}
export async function createJobOrderHandler(req: Request, res: Response) {
  res.status(201).json(await mp.createJobOrder(req.auth!, jobOrderCreateSchema.parse(req.body)));
}
export async function updateJobOrderHandler(req: Request, res: Response) {
  res.json(await mp.updateJobOrder(req.auth!, req.params.id, jobOrderUpdateSchema.parse(req.body)));
}
export async function archiveJobOrderHandler(req: Request, res: Response) {
  res.json(await mp.archiveJobOrder(req.auth!, req.params.id));
}

// Candidates + Recruitment (Module 6B)
export async function listCandidatesHandler(req: Request, res: Response) {
  res.json(await mp.listCandidates(req.auth!, candidateListQuerySchema.parse(req.query)));
}
export async function createCandidateHandler(req: Request, res: Response) {
  res.status(201).json(await mp.createCandidate(req.auth!, candidateCreateSchema.parse(req.body)));
}
export async function updateCandidateHandler(req: Request, res: Response) {
  res.json(await mp.updateCandidate(req.auth!, req.params.id, candidateUpdateSchema.parse(req.body)));
}
export async function transitionCandidateHandler(req: Request, res: Response) {
  res.json(await mp.transitionCandidate(req.auth!, req.params.id, candidateTransitionSchema.parse(req.body)));
}
export async function archiveCandidateHandler(req: Request, res: Response) {
  res.json(await mp.archiveCandidate(req.auth!, req.params.id));
}
export async function jobOrderPipelineHandler(req: Request, res: Response) {
  res.json(await mp.getJobOrderPipeline(req.auth!, req.params.id));
}
