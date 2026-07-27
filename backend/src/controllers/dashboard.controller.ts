import type { Request, Response } from "express";
import * as dashboard from "../services/dashboard.service";
import { dashboardQuerySchema } from "../contracts/dashboard.contract";

/** GET /dashboard/summary — the ERP admin overview, branch-scoped. */
export async function dashboardSummaryHandler(req: Request, res: Response) {
  res.json(await dashboard.getSummary(req.auth!, dashboardQuerySchema.parse(req.query)));
}
