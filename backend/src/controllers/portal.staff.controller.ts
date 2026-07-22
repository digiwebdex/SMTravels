import type { Request, Response } from "express";
import { taskCreateSchema, taskStatusSchema } from "../contracts/portal.contract";
import * as staff from "../services/portal.staff.service";

export async function staffMe(req: Request, res: Response) { res.json(await staff.getProfile(req.auth!)); }
export async function staffDashboard(req: Request, res: Response) { res.json(await staff.getDashboard(req.auth!)); }
export async function staffTasks(req: Request, res: Response) { res.json({ data: await staff.listTasks(req.auth!) }); }
export async function staffCreateTask(req: Request, res: Response) { res.status(201).json(await staff.createTask(req.auth!, taskCreateSchema.parse(req.body))); }
export async function staffTaskStatus(req: Request, res: Response) { res.json(await staff.setTaskStatus(req.auth!, req.params.id, taskStatusSchema.parse(req.body).status)); }
export async function staffBookings(req: Request, res: Response) { res.json({ data: await staff.listBookings(req.auth!) }); }
export async function staffCustomers(req: Request, res: Response) { res.json({ data: await staff.listCustomers(req.auth!) }); }
export async function staffDocuments(req: Request, res: Response) { res.json({ data: await staff.listDocuments(req.auth!) }); }
export async function staffAnnouncements(req: Request, res: Response) { res.json({ data: await staff.listAnnouncements(req.auth!) }); }
