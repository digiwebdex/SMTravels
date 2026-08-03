import { UserRole, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { branchWhere, resolveBranchId, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import type {
  UserListQuery, UserCreateInput, UserUpdateInput as UserAdminUpdate,
  UserListItem, UserListResponse,
  RoleDto,
} from "../contracts/settings.contract";

const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);

/** Minimal staff directory for CRM assignee dropdowns. */
export async function listStaffOptions(auth: AuthCtx): Promise<{ id: string; name: string; role: string; branchId: string | null }[]> {
  const where = {
    status: "active",
    deletedAt: null,
    role: { notIn: [UserRole.CUSTOMER, UserRole.AGENT, UserRole.SUPPLIER] },
    ...(isGlobalRole(auth.role) ? {} : { branchId: auth.branchId ?? "__none__" }),
  };
  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, role: true, branchId: true },
    orderBy: { name: "asc" },
  });
  return users;
}

export async function listUsers(auth: AuthCtx, q: UserListQuery): Promise<UserListResponse> {
  const where: Prisma.UserWhereInput = { deletedAt: null, ...branchWhere(auth) };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.role) where.role = q.role;
  if (q.status !== "all") where.status = q.status;
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { email: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { branch: { select: { name: true } } },
      orderBy: { name: "asc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const data: UserListItem[] = rows.map((u) => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone,
    role: u.role, branchId: u.branchId, branchName: u.branch?.name ?? null,
    status: u.status, lastActiveAt: dIso(u.lastActiveAt), createdAt: dIso(u.createdAt)!,
  }));

  return { data, page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) };
}

/** Replace all RBAC links so demotion cannot leave a privileged role attached. */
async function replaceRbacRole(userId: string, roleKey: string): Promise<void> {
  const role = await prisma.role.findUnique({ where: { key: roleKey } });
  if (!role) return;
  await prisma.$transaction([
    prisma.userRoleLink.deleteMany({ where: { userId } }),
    prisma.userRoleLink.create({ data: { userId, roleId: role.id } }),
  ]);
}

async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Only SUPER_ADMIN may create/assign SUPER_ADMIN or COMPANY_ADMIN. */
function assertCanAssignRole(auth: AuthCtx, targetRole: UserRole): void {
  const privileged: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN];
  if (privileged.includes(targetRole) && auth.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, "Forbidden", { detail: "Only SUPER_ADMIN may assign this role" });
  }
}

export async function createUser(auth: AuthCtx, input: UserCreateInput): Promise<UserListItem> {
  const targetRole = input.role as UserRole;
  assertCanAssignRole(auth, targetRole);
  const branchId = input.branchId ? resolveBranchId(auth, input.branchId) : (auth.branchId ?? null);
  const globalRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN];
  if (!branchId && !globalRoles.includes(targetRole)) {
    throw new HttpError(400, "BranchRequired", { detail: "branchId is required for this role" });
  }
  try {
    const u = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: hashPassword(input.password),
        role: targetRole,
        branchId,
        phone: input.phone ?? null,
        status: "active",
      },
      include: { branch: { select: { name: true } } },
    });
    await replaceRbacRole(u.id, input.role);
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone,
      role: u.role, branchId: u.branchId, branchName: u.branch?.name ?? null,
      status: u.status, lastActiveAt: null, createdAt: dIso(u.createdAt)!,
    };
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function updateUser(auth: AuthCtx, id: string, input: UserAdminUpdate): Promise<UserListItem> {
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null, ...branchWhere(auth) } });
  if (!existing) throw new HttpError(404, "NotFound");

  if (input.role !== undefined) assertCanAssignRole(auth, input.role as UserRole);

  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.status !== undefined) data.status = input.status;
  if (input.role !== undefined) data.role = input.role as UserRole;
  if (input.branchId !== undefined) {
    data.branch = input.branchId ? { connect: { id: resolveBranchId(auth, input.branchId) } } : { disconnect: true };
  }

  const roleOrStatusChanged =
    (input.role !== undefined && input.role !== existing.role) ||
    (input.status !== undefined && input.status !== existing.status);

  try {
    const u = await prisma.user.update({
      where: { id },
      data,
      include: { branch: { select: { name: true } } },
    });
    if (input.role) await replaceRbacRole(u.id, input.role);
    if (roleOrStatusChanged) await revokeAllRefreshTokens(u.id);
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone,
      role: u.role, branchId: u.branchId, branchName: u.branch?.name ?? null,
      status: u.status, lastActiveAt: dIso(u.lastActiveAt), createdAt: dIso(u.createdAt)!,
    };
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function listRoles(): Promise<RoleDto[]> {
  const [roles, userCounts, perms] = await Promise.all([
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.userRoleLink.groupBy({ by: ["roleId"], _count: { _all: true } }),
    prisma.rolePermission.findMany({ include: { permission: { select: { module: true } } } }),
  ]);
  const counts = new Map(userCounts.map((c) => [c.roleId, c._count._all]));
  const permMap = new Map<string, RoleDto["permissions"]>();
  for (const rp of perms) {
    const list = permMap.get(rp.roleId) ?? [];
    list.push({ module: rp.permission.module, access: rp.access });
    permMap.set(rp.roleId, list);
  }
  return roles.map((r) => ({
    id: r.id, key: r.key, name: r.name, description: r.description,
    isSystem: r.isSystem, userCount: counts.get(r.id) ?? 0,
    permissions: permMap.get(r.id) ?? [],
  }));
}
