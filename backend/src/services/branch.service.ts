import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { isGlobalRole, canAccessBranch, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type { BranchUpdateInput, BranchListItem } from "../contracts/settings.contract";

export async function listBranches(auth: AuthCtx): Promise<BranchListItem[]> {
  const where = isGlobalRole(auth.role) ? { deletedAt: null } : { id: auth.branchId ?? "__none__", deletedAt: null };
  const branches = await prisma.branch.findMany({
    where,
    include: {
      manager: { select: { name: true } },
      _count: { select: { users: { where: { deletedAt: null } } } },
    },
    orderBy: [{ isHq: "desc" }, { name: "asc" }],
  });
  return branches.map((b) => ({
    id: b.id, code: b.code, name: b.name, city: b.city, isHq: b.isHq,
    address: b.address, phone: b.phone, email: b.email, status: b.status,
    managerId: b.managerId, managerName: b.manager?.name ?? null,
    staffCount: b._count.users,
  }));
}

export async function updateBranch(auth: AuthCtx, id: string, input: BranchUpdateInput): Promise<BranchListItem> {
  const existing = await prisma.branch.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  if (!canAccessBranch(auth, id)) throw new HttpError(403, "Forbidden");

  const data: Prisma.BranchUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.city !== undefined) data.city = input.city;
  if (input.address !== undefined) data.address = input.address;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.mobile !== undefined) data.mobile = input.mobile;
  if (input.email !== undefined) data.email = input.email;
  if (input.hours !== undefined) data.hours = input.hours;
  if (input.mapUrl !== undefined) data.mapUrl = input.mapUrl;
  if (input.status !== undefined) data.status = input.status;
  if (input.isHq !== undefined) data.isHq = input.isHq;
  if (input.managerId !== undefined) {
    data.manager = input.managerId ? { connect: { id: input.managerId } } : { disconnect: true };
  }

  const b = await prisma.branch.update({
    where: { id },
    data,
    include: {
      manager: { select: { name: true } },
      _count: { select: { users: { where: { deletedAt: null } } } },
    },
  });
  return {
    id: b.id, code: b.code, name: b.name, city: b.city, isHq: b.isHq,
    address: b.address, phone: b.phone, email: b.email, status: b.status,
    managerId: b.managerId, managerName: b.manager?.name ?? null,
    staffCount: b._count.users,
  };
}

/** Minimal branch list for filter dropdowns (legacy shape). */
export async function listBranchOptions(auth: AuthCtx) {
  const where = isGlobalRole(auth.role) ? {} : { id: auth.branchId ?? "__none__" };
  return prisma.branch.findMany({
    where,
    select: { id: true, code: true, name: true, city: true, isHq: true },
    orderBy: [{ isHq: "desc" }, { name: "asc" }],
  });
}
