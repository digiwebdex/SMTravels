/**
 * Operations Team roster ADMIN service. CRUD over OperationsTeamMember with
 * nullable-branch scoping: a branch user sees their own branch's members PLUS
 * global (branchId = null) shared crew, never another branch's local staff.
 * Global roles see all.
 *
 * passportNo is PII (encrypted at rest by the prisma extension) — it is decrypted
 * transparently on an authorized detail read and NEVER selected into the list.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { allocateSequence } from "../lib/sequence";
import type {
  OpsListQuery, OpsMemberCreateInput, OpsMemberUpdateInput,
  OpsMemberListItem, OpsMemberListResponse, OpsMemberDetail,
} from "../contracts/operations.contract";

const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : Number(d));
const dIso = (d: Date | null): string => (d ? d.toISOString() : "");
const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);

let branchNameCache: Map<string, string> | null = null;
async function branchNames(): Promise<Map<string, string>> {
  if (!branchNameCache) {
    const rows = await prisma.branch.findMany({ select: { id: true, name: true } });
    branchNameCache = new Map(rows.map((b) => [b.id, b.name]));
  }
  return branchNameCache;
}

/** Visibility: branch users see own-branch members OR global (null) crew; global
 *  roles see everyone (with an optional branch filter). */
function scopeWhere(auth: AuthCtx, requestedBranch?: string): Prisma.OperationsTeamMemberWhereInput {
  if (!isGlobalRole(auth.role)) {
    return { deletedAt: null, OR: [{ branchId: auth.branchId ?? "__no_branch__" }, { branchId: null }] };
  }
  const w: Prisma.OperationsTeamMemberWhereInput = { deletedAt: null };
  if (requestedBranch === "global") w.branchId = null;
  else if (requestedBranch && requestedBranch !== "all") w.branchId = requestedBranch;
  return w;
}

// passportNo / passportHash / piiKeyId deliberately EXCLUDED — PII minimization.
const LIST_SELECT = {
  id: true, memberCode: true, name: true, roleType: true, phone: true, email: true,
  nationality: true, baseLocation: true, languages: true, licenseNo: true,
  rating: true, status: true, branchId: true, createdAt: true,
} satisfies Prisma.OperationsTeamMemberSelect;

function toListItem(m: Record<string, unknown>, names: Map<string, string>): OpsMemberListItem {
  const branchId = (m.branchId as string | null) ?? null;
  return {
    id: m.id as string, memberCode: m.memberCode as string, name: m.name as string,
    roleType: m.roleType as string, phone: (m.phone as string) ?? null, email: (m.email as string) ?? null,
    nationality: (m.nationality as string) ?? null, baseLocation: (m.baseLocation as string) ?? null,
    languages: (m.languages as string) ?? null, licenseNo: (m.licenseNo as string) ?? null,
    rating: m.rating == null ? null : num(m.rating as Prisma.Decimal), status: m.status as string,
    branchId, branchName: branchId ? names.get(branchId) ?? null : null, isGlobal: branchId === null,
    createdAt: dIso(m.createdAt as Date),
  };
}

export async function listMembers(auth: AuthCtx, q: OpsListQuery): Promise<OpsMemberListResponse> {
  const where = scopeWhere(auth, q.branchId);
  if (q.roleType) where.roleType = q.roleType as never;
  if (q.status) where.status = q.status as never;
  if (q.q) where.AND = [{ OR: [
    { name: { contains: q.q, mode: "insensitive" } },
    { memberCode: { contains: q.q, mode: "insensitive" } },
    { phone: { contains: q.q } },
    { baseLocation: { contains: q.q, mode: "insensitive" } },
  ] }];

  const rows = await prisma.operationsTeamMember.findMany({ where, select: LIST_SELECT, orderBy: { createdAt: "desc" } });
  const names = await branchNames();
  const data = rows.map((m) => toListItem(m as Record<string, unknown>, names));

  const byRole: Record<string, number> = {}, byStatus: Record<string, number> = {};
  for (const m of data) { byRole[m.roleType] = (byRole[m.roleType] ?? 0) + 1; byStatus[m.status] = (byStatus[m.status] ?? 0) + 1; }
  return {
    data,
    stats: {
      total: data.length,
      global: data.filter((m) => m.isGlobal).length,
      branchScoped: data.filter((m) => !m.isGlobal).length,
      byRole, byStatus,
    },
  };
}

export async function getMember(auth: AuthCtx, id: string): Promise<OpsMemberDetail> {
  // scope guard folded into the where — a branch user cannot fetch another branch's local member
  const scope = scopeWhere(auth);
  const m = await prisma.operationsTeamMember.findFirst({
    where: { id, ...scope },
    select: { ...LIST_SELECT, passportNo: true, notes: true }, // passportNo decrypted by the extension
  });
  if (!m) throw new HttpError(404, "NotFound");
  const names = await branchNames();

  // batches this member is the linked muallim of (branch-scoped to the caller)
  const batches = await prisma.departureBatch.findMany({
    where: { muallimId: id, deletedAt: null, ...branchWhere(auth) },
    select: { id: true, code: true, name: true, serviceType: true, departureDate: true, branchId: true },
    orderBy: { departureDate: "desc" },
  });

  return {
    ...toListItem(m as Record<string, unknown>, names),
    passportNo: (m as { passportNo: string | null }).passportNo ?? null,
    notes: (m as { notes: string | null }).notes ?? null,
    assignedBatches: batches.map((b) => ({ id: b.id, code: b.code, name: b.name, serviceType: b.serviceType, departureDate: dOnly(b.departureDate), branchId: b.branchId, branchName: names.get(b.branchId) ?? null })),
  };
}

/** branchId for a new/edited member: global roles choose (a branch id, or null for
 *  shared crew); branch-scoped roles can only create within their own branch. */
function resolveMemberBranch(auth: AuthCtx, input: { branchId?: string }): string | null {
  if (!isGlobalRole(auth.role)) return auth.branchId ?? null;
  return input.branchId && input.branchId !== "global" ? input.branchId : null;
}

export async function createMember(auth: AuthCtx, input: OpsMemberCreateInput): Promise<OpsMemberDetail> {
  const branchId = resolveMemberBranch(auth, input);
  const id = await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "OPS_MEMBER", "GLOBAL", 0);
    const m = await tx.operationsTeamMember.create({
      data: {
        memberCode: `OTM-${String(seq).padStart(4, "0")}`,
        branchId, name: input.name, roleType: input.roleType as never,
        phone: input.phone ?? null, email: input.email ?? null, nationality: input.nationality ?? null,
        baseLocation: input.baseLocation ?? null, languages: input.languages ?? null, licenseNo: input.licenseNo ?? null,
        passportNo: input.passportNo ?? null, // encrypted by the extension on write
        rating: input.rating ?? null, status: (input.status ?? "ACTIVE") as never, notes: input.notes ?? null,
      },
    });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "OPS_MEMBER_CREATED", target: m.id, module: "operations_team" } });
    return m.id;
  });
  return getMember(auth, id);
}

export async function updateMember(auth: AuthCtx, id: string, input: OpsMemberUpdateInput): Promise<OpsMemberDetail> {
  const existing = await prisma.operationsTeamMember.findFirst({ where: { id, ...scopeWhere(auth) }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  // branchId only re-assignable by global roles; branch users can't move a member out of their branch
  const branchId = isGlobalRole(auth.role) && input.branchId !== undefined ? (input.branchId && input.branchId !== "global" ? input.branchId : null) : undefined;
  await prisma.$transaction(async (tx) => {
    await tx.operationsTeamMember.update({
      where: { id },
      data: {
        name: input.name, roleType: input.roleType as never, branchId,
        phone: input.phone, email: input.email, nationality: input.nationality,
        baseLocation: input.baseLocation, languages: input.languages, licenseNo: input.licenseNo,
        passportNo: input.passportNo, // re-encrypted by the extension if changed
        rating: input.rating, status: input.status as never, notes: input.notes,
      },
    });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "OPS_MEMBER_UPDATED", target: id, module: "operations_team" } });
  });
  return getMember(auth, id);
}

export async function deleteMember(auth: AuthCtx, id: string): Promise<{ ok: true }> {
  const existing = await prisma.operationsTeamMember.findFirst({ where: { id, ...scopeWhere(auth) }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.operationsTeamMember.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "OPS_MEMBER_DELETED", target: id, module: "operations_team" } });
  return { ok: true };
}
