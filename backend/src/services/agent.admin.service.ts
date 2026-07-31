import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, resolveBranchId, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import type {
  AgentListQuery, AgentCreateInput, AgentUpdateInput,
  AgentListItem, AgentListResponse,
} from "../contracts/settings.contract";

const dIso = (d: Date): string => d.toISOString();
const num = (v: Prisma.Decimal | number | null | undefined): number => (v == null ? 0 : Number(v));

type AgentRow = Prisma.AgentGetPayload<{ include: { _count: { select: { bookings: true } } } }>;

async function branchNames(ids: (string | null)[]): Promise<Map<string, string>> {
  const uniq = [...new Set(ids.filter(Boolean) as string[])];
  if (!uniq.length) return new Map();
  const rows = await prisma.branch.findMany({ where: { id: { in: uniq } }, select: { id: true, name: true } });
  return new Map(rows.map((b) => [b.id, b.name]));
}

function toItem(a: AgentRow, branches: Map<string, string>): AgentListItem {
  return {
    id: a.id, agentCode: a.agentCode, name: a.name,
    branchId: a.branchId, branchName: a.branchId ? branches.get(a.branchId) ?? null : null,
    phone: a.phone, email: a.email, tier: a.tier, commissionRate: num(a.commissionRate),
    status: a.status, bookingsCount: a._count.bookings, createdAt: dIso(a.createdAt),
  };
}

export async function listAgents(auth: AuthCtx, q: AgentListQuery): Promise<AgentListResponse> {
  const where: Prisma.AgentWhereInput = { deletedAt: null, ...branchWhere(auth) };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.status && q.status !== "all") where.status = q.status;
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { agentCode: { contains: q.q, mode: "insensitive" } },
      { email: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      include: { _count: { select: { bookings: { where: { deletedAt: null } } } } },
      orderBy: { name: "asc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.agent.count({ where }),
  ]);

  const branches = await branchNames(rows.map((r) => r.branchId));
  return {
    data: rows.map((r) => toItem(r, branches)),
    page: q.page, pageSize: q.pageSize, total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

async function nextAgentCode(name: string): Promise<string> {
  const base = "AGT-" + name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || "NEW";
  let code = base;
  let n = 1;
  while (await prisma.agent.findFirst({ where: { agentCode: code, deletedAt: null } })) {
    code = `${base}-${++n}`;
  }
  return code;
}

export async function createAgent(auth: AuthCtx, input: AgentCreateInput): Promise<AgentListItem> {
  const branchId = resolveBranchId(auth, input.branchId ?? auth.branchId);
  const agentCode = input.agentCode?.trim() || await nextAgentCode(input.name);
  try {
    const a = await prisma.$transaction(async (tx) => {
      const agent = await tx.agent.create({
        data: {
          agentCode,
          name: input.name,
          branchId,
          phone: input.phone ?? null,
          email: input.email || null,
          tier: input.tier ?? "SILVER",
          commissionRate: input.commissionRate ?? 0,
          parentAgentId: input.parentAgentId ?? null,
          status: "active",
        },
        include: { _count: { select: { bookings: true } } },
      });
      // Every agent gets a zero-balance wallet so commission settlement can credit it.
      await tx.agentWallet.create({ data: { agentId: agent.id, balance: 0, currency: "BDT" } });
      await tx.activityLog.create({
        data: { userId: auth.userId, action: "AGENT_CREATED", target: agent.id, module: "settings" },
      });
      return agent;
    });
    const branches = await branchNames([a.branchId]);
    return toItem(a, branches);
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function updateAgent(auth: AuthCtx, id: string, input: AgentUpdateInput): Promise<AgentListItem> {
  const existing = await prisma.agent.findFirst({ where: { id, deletedAt: null, ...branchWhere(auth) } });
  if (!existing) throw new HttpError(404, "NotFound");

  const data: Prisma.AgentUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.email !== undefined) data.email = input.email || null;
  if (input.tier !== undefined) data.tier = input.tier;
  if (input.commissionRate !== undefined) data.commissionRate = input.commissionRate;
  if (input.parentAgentId !== undefined) {
    data.parentAgent = input.parentAgentId ? { connect: { id: input.parentAgentId } } : { disconnect: true };
  }
  if (input.branchId !== undefined) data.branchId = resolveBranchId(auth, input.branchId);

  try {
    const a = await prisma.agent.update({
      where: { id },
      data,
      include: { _count: { select: { bookings: { where: { deletedAt: null } } } } },
    });
    const branches = await branchNames([a.branchId]);
    return toItem(a, branches);
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function getAgent(auth: AuthCtx, id: string): Promise<AgentListItem> {
  const a = await prisma.agent.findFirst({
    where: { id, deletedAt: null, ...branchWhere(auth) },
    include: { _count: { select: { bookings: { where: { deletedAt: null } } } } },
  });
  if (!a) throw new HttpError(404, "NotFound");
  const branches = await branchNames([a.branchId]);
  return toItem(a, branches);
}
