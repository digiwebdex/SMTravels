import type { Request, Response } from "express";
import * as accountant from "../services/portal.accountant.service";

export async function accountantMe(req: Request, res: Response) { res.json(await accountant.getProfile(req.auth!)); }
export async function accountantDashboard(req: Request, res: Response) { res.json(await accountant.getDashboard(req.auth!)); }
