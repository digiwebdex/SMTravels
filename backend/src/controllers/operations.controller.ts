import type { Request, Response } from "express";
import * as ops from "../services/operations.service";
import { opsListQuerySchema, opsMemberCreateSchema, opsMemberUpdateSchema } from "../contracts/operations.contract";

// Operations Team roster admin. Nullable-branch scoping in the service; passportNo
// is PII (encrypted at rest, decrypted only on the authorized detail read).
export async function listMembersHandler(req: Request, res: Response) {
  res.json(await ops.listMembers(req.auth!, opsListQuerySchema.parse(req.query)));
}
export async function getMemberHandler(req: Request, res: Response) {
  res.json(await ops.getMember(req.auth!, req.params.id));
}
export async function createMemberHandler(req: Request, res: Response) {
  res.status(201).json(await ops.createMember(req.auth!, opsMemberCreateSchema.parse(req.body)));
}
export async function updateMemberHandler(req: Request, res: Response) {
  res.json(await ops.updateMember(req.auth!, req.params.id, opsMemberUpdateSchema.parse(req.body)));
}
export async function deleteMemberHandler(req: Request, res: Response) {
  res.json(await ops.deleteMember(req.auth!, req.params.id));
}
