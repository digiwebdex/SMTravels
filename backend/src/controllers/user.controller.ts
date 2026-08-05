import type { Request, Response } from "express";
import { userListQuerySchema, userCreateSchema, userUpdateSchema } from "../contracts/settings.contract";
import * as users from "../services/user.admin.service";

export async function listStaffOptionsHandler(req: Request, res: Response): Promise<void> {
  res.json({ data: await users.listStaffOptions(req.auth!) });
}

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  res.json(await users.listUsers(req.auth!, userListQuerySchema.parse(req.query)));
}

export async function createUserHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await users.createUser(req.auth!, userCreateSchema.parse(req.body)));
}

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  res.json(await users.updateUser(req.auth!, req.params.id, userUpdateSchema.parse(req.body)));
}

export async function listRolesHandler(_req: Request, res: Response): Promise<void> {
  res.json({ data: await users.listRoles() });
}
