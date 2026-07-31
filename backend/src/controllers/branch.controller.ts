import type { Request, Response } from "express";
import { branchUpdateSchema } from "../contracts/settings.contract";
import * as branches from "../services/branch.service";

export async function listBranchesHandler(req: Request, res: Response): Promise<void> {
  res.json({ data: await branches.listBranches(req.auth!) });
}

export async function listBranchOptionsHandler(req: Request, res: Response): Promise<void> {
  res.json({ data: await branches.listBranchOptions(req.auth!) });
}

export async function updateBranchHandler(req: Request, res: Response): Promise<void> {
  res.json(await branches.updateBranch(req.auth!, req.params.id, branchUpdateSchema.parse(req.body)));
}
