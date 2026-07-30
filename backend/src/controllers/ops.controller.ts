import type { Request, Response } from "express";
import {
  announcementCreateSchema,
  opsTaskCreateSchema,
  opsTaskUpdateSchema,
  taskListQuerySchema,
} from "../contracts/ops.contract";
import * as ops from "../services/ops.service";

export async function listTasksHandler(req: Request, res: Response): Promise<void> {
  res.json(await ops.listTasks(req.auth!, taskListQuerySchema.parse(req.query)));
}

export async function createTaskHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await ops.createTask(req.auth!, opsTaskCreateSchema.parse(req.body)));
}

export async function updateTaskHandler(req: Request, res: Response): Promise<void> {
  res.json(await ops.updateTask(req.auth!, req.params.id, opsTaskUpdateSchema.parse(req.body)));
}

export async function listAnnouncementsHandler(req: Request, res: Response): Promise<void> {
  res.json(await ops.listAnnouncements(req.auth!));
}

export async function createAnnouncementHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await ops.createAnnouncement(req.auth!, announcementCreateSchema.parse(req.body)));
}

export async function listAuditLogsHandler(_req: Request, res: Response): Promise<void> {
  res.json(await ops.listAuditLogs());
}
