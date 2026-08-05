import type { Request, Response } from "express";
import {
  messageTemplateCreateSchema,
  messageTemplateUpdateSchema,
  messageTemplateListQuerySchema,
  sendMessageSchema,
  bulkSendSchema,
} from "../contracts/communications.contract";
import * as comms from "../services/communications.service";
import { clientIp } from "../lib/audit";

export async function listTemplatesHandler(req: Request, res: Response): Promise<void> {
  res.json(await comms.listTemplates(messageTemplateListQuerySchema.parse(req.query)));
}

export async function getTemplateHandler(req: Request, res: Response): Promise<void> {
  res.json(await comms.getTemplate(req.params.id));
}

export async function createTemplateHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await comms.createTemplate(messageTemplateCreateSchema.parse(req.body)));
}

export async function updateTemplateHandler(req: Request, res: Response): Promise<void> {
  res.json(await comms.updateTemplate(req.params.id, messageTemplateUpdateSchema.parse(req.body)));
}

export async function deleteTemplateHandler(req: Request, res: Response): Promise<void> {
  await comms.deleteTemplate(req.params.id);
  res.json({ ok: true });
}

export async function sendMessageHandler(req: Request, res: Response): Promise<void> {
  res.json(await comms.sendMessage(req.auth!, sendMessageSchema.parse(req.body), clientIp(req)));
}

export async function bulkSendHandler(req: Request, res: Response): Promise<void> {
  res.json(await comms.bulkSend(req.auth!, bulkSendSchema.parse(req.body), clientIp(req)));
}

export async function listOutboundLogHandler(_req: Request, res: Response): Promise<void> {
  res.json(await comms.listOutboundLog());
}
