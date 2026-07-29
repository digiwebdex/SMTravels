import type { Request, Response } from "express";
import * as comm from "../services/communication.service";
import { templateCreateSchema, templateUpdateSchema, sendSchema, logListQuerySchema } from "../contracts/communication.contract";

// Communication Center (SMS). Sending reuses the safe smsSender singleton
// (log-only when unconfigured); every send is recorded in MessageLog.
export async function listTemplatesHandler(req: Request, res: Response) {
  const channel = typeof req.query.channel === "string" ? req.query.channel : "SMS";
  res.json(await comm.listTemplates(req.auth!, channel));
}
export async function createTemplateHandler(req: Request, res: Response) {
  res.status(201).json(await comm.createTemplate(req.auth!, templateCreateSchema.parse(req.body)));
}
export async function updateTemplateHandler(req: Request, res: Response) {
  res.json(await comm.updateTemplate(req.auth!, req.params.id, templateUpdateSchema.parse(req.body)));
}
export async function deleteTemplateHandler(req: Request, res: Response) {
  res.json(await comm.deleteTemplate(req.auth!, req.params.id));
}
export async function listLogsHandler(req: Request, res: Response) {
  res.json(await comm.listLogs(req.auth!, logListQuerySchema.parse(req.query)));
}
export async function sendHandler(req: Request, res: Response) {
  res.json(await comm.sendMessage(req.auth!, sendSchema.parse(req.body)));
}
