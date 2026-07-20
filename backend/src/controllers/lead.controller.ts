import type { Request, Response } from "express";
import { z } from "zod";
import {
  leadCreateSchema, leadUpdateSchema, leadStageChangeSchema, leadListQuerySchema,
  noteCreateSchema, followUpCreateSchema, callCreateSchema, taskCreateSchema,
} from "../contracts/crm.contract";
import * as leads from "../services/lead.service";

export async function listLeadsHandler(req: Request, res: Response): Promise<void> {
  res.json(await leads.listLeads(req.auth!, leadListQuerySchema.parse(req.query)));
}
export async function getLeadHandler(req: Request, res: Response): Promise<void> {
  res.json(await leads.getLead(req.auth!, req.params.id));
}
export async function createLeadHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await leads.createLead(req.auth!, leadCreateSchema.parse(req.body)));
}
export async function updateLeadHandler(req: Request, res: Response): Promise<void> {
  res.json(await leads.updateLead(req.auth!, req.params.id, leadUpdateSchema.parse(req.body)));
}
export async function changeStageHandler(req: Request, res: Response): Promise<void> {
  const { stage, note } = leadStageChangeSchema.parse(req.body);
  res.json(await leads.changeStage(req.auth!, req.params.id, stage, note));
}
export async function convertLeadHandler(req: Request, res: Response): Promise<void> {
  res.json(await leads.convertLead(req.auth!, req.params.id));
}
export async function deleteLeadHandler(req: Request, res: Response): Promise<void> {
  await leads.deleteLead(req.auth!, req.params.id);
  res.json({ ok: true });
}

// ── sub-resources ─────────────────────────────────────────────────────────────
export async function addNoteHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await leads.addNote(req.auth!, req.params.id, noteCreateSchema.parse(req.body).body));
}
export async function addFollowUpHandler(req: Request, res: Response): Promise<void> {
  const { dueAt, note, assignedToId } = followUpCreateSchema.parse(req.body);
  res.status(201).json(await leads.addFollowUp(req.auth!, req.params.id, dueAt, note, assignedToId));
}
export async function toggleFollowUpHandler(req: Request, res: Response): Promise<void> {
  const { done } = z.object({ done: z.boolean() }).parse(req.body);
  res.json(await leads.toggleFollowUp(req.auth!, req.params.id, req.params.fid, done));
}
export async function addCallHandler(req: Request, res: Response): Promise<void> {
  const { direction, durationSec, note } = callCreateSchema.parse(req.body);
  res.status(201).json(await leads.addCall(req.auth!, req.params.id, direction, durationSec, note));
}
export async function addTaskHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await leads.addTask(req.auth!, req.params.id, taskCreateSchema.parse(req.body)));
}
