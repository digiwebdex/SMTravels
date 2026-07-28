/**
 * Partners (B2B / sub-agent) ADMIN service. Read-heavy admin view over the
 * existing Agent / wallet / commission models — branch-scoped on Agent.branchId.
 *
 * The wallet ledger is IMMUTABLE (append + reverse); this service only READS it.
 * The only writes are tier + status on the agent record. PII (Agent.nid) is never
 * selected here, so it isn't decrypted or exposed in the admin list/detail.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  PartnerListQuery, PartnerUpdateInput, PartnerListItem, PartnerListResponse, PartnerDetail,
} from "../contracts/partners.contract";

const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : Number(d));
const round2 = (n: number) => Math.round(n * 100) / 100;
const dIso = (d: Date | null): string => (d ? d.toISOString() : "");

let branchNameCache: Map<string, string> | null = null;
async function branchNames(): Promise<Map<string, string>> {
  if (!branchNameCache) {
    const rows = await prisma.branch.findMany({ select: { id: true, name: true } });
    branchNameCache = new Map(rows.map((b) => [b.id, b.name]));
  }
  return branchNameCache;
}

function scopeWhere(auth: AuthCtx, requestedBranch?: string): Prisma.AgentWhereInput {
  const where: Prisma.AgentWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (requestedBranch && requestedBranch !== "all" && isGlobalRole(auth.role)) where.branchId = requestedBranch;
  return where;
}

// nid/nidHash/piiKeyId deliberately NOT selected — PII minimization, no decrypt.
const AGENT_SELECT = {
  id: true, agentCode: true, name: true, phone: true, email: true, tier: true, status: true,
  commissionRate: true, branchId: true, parentAgentId: true, createdAt: true,
} satisfies Prisma.AgentSelect;

export async function listPartners(auth: AuthCtx, q: PartnerListQuery): Promise<PartnerListResponse> {
  const where = scopeWhere(auth, q.branchId);
  if (q.tier) where.tier = q.tier as never;
  if (q.status) where.status = q.status;
  if (q.q) where.OR = [
    { name: { contains: q.q, mode: "insensitive" } },
    { agentCode: { contains: q.q, mode: "insensitive" } },
    { phone: { contains: q.q } },
    { email: { contains: q.q, mode: "insensitive" } },
  ];

  const agents = await prisma.agent.findMany({ where, select: AGENT_SELECT, orderBy: { createdAt: "desc" } });
  const ids = agents.map((a) => a.id);
  const names = await branchNames();
  const nameById = new Map(agents.map((a) => [a.id, a.name]));

  const [subCounts, commAgg, bookingCounts, wallets] = await Promise.all([
    prisma.agent.groupBy({ by: ["parentAgentId"], where: { parentAgentId: { in: ids }, deletedAt: null }, _count: { _all: true } }),
    prisma.agentCommission.groupBy({ by: ["agentId", "status"], where: { agentId: { in: ids }, deletedAt: null }, _sum: { baseAmount: true } }),
    prisma.booking.groupBy({ by: ["agentId"], where: { agentId: { in: ids }, deletedAt: null, status: { not: "DRAFT" } }, _count: { _all: true } }),
    prisma.agentWallet.findMany({ where: { agentId: { in: ids } }, select: { agentId: true, balance: true } }),
  ]);

  const subCountBy = new Map(subCounts.map((s) => [s.parentAgentId ?? "", s._count._all]));
  const bookingCountBy = new Map(bookingCounts.map((b) => [b.agentId ?? "", b._count._all]));
  const walletBy = new Map(wallets.map((w) => [w.agentId, num(w.balance)]));
  const paidBy = new Map<string, number>(), pendBy = new Map<string, number>();
  for (const c of commAgg) {
    const m = c.status === "PAID" ? paidBy : pendBy;
    m.set(c.agentId, (m.get(c.agentId) ?? 0) + num(c._sum.baseAmount));
  }

  const data: PartnerListItem[] = agents.map((a) => ({
    id: a.id, agentCode: a.agentCode, name: a.name, phone: a.phone, email: a.email,
    tier: a.tier, status: a.status, commissionRate: num(a.commissionRate),
    branchId: a.branchId, branchName: a.branchId ? names.get(a.branchId) ?? null : null,
    parentAgentId: a.parentAgentId, parentName: a.parentAgentId ? nameById.get(a.parentAgentId) ?? null : null,
    subAgentCount: subCountBy.get(a.id) ?? 0,
    bookingsCount: bookingCountBy.get(a.id) ?? 0,
    commissionEarned: round2(paidBy.get(a.id) ?? 0),
    commissionPending: round2(pendBy.get(a.id) ?? 0),
    walletBalance: round2(walletBy.get(a.id) ?? 0),
    createdAt: dIso(a.createdAt),
  }));

  const byTier: Record<string, number> = {};
  for (const a of agents) byTier[a.tier] = (byTier[a.tier] ?? 0) + 1;
  return {
    data,
    stats: {
      total: agents.length,
      active: agents.filter((a) => a.status === "active").length,
      byTier,
      totalWalletBalance: round2(data.reduce((s, a) => s + a.walletBalance, 0)),
      totalCommission: round2(data.reduce((s, a) => s + a.commissionEarned, 0)),
    },
  };
}

export async function getPartner(auth: AuthCtx, id: string): Promise<PartnerDetail> {
  const a = await prisma.agent.findFirst({
    where: { id, ...branchWhere(auth), deletedAt: null },
    select: { ...AGENT_SELECT, tradeLicense: true, bankName: true, accountNo: true, bankBranch: true, bkashNo: true, nagadNo: true },
  });
  if (!a) throw new HttpError(404, "NotFound");
  const names = await branchNames();

  const subAgents = await prisma.agent.findMany({
    where: { parentAgentId: id, deletedAt: null },
    select: { id: true, agentCode: true, name: true, tier: true, status: true },
  });
  const subIds = subAgents.map((s) => s.id);

  const [bookingsRaw, commissionsRaw, wallet, myComm, parentRow, subComm, subWallets, bookingsCount] = await Promise.all([
    prisma.booking.findMany({ where: { agentId: id, deletedAt: null }, select: { id: true, bookingNo: true, serviceType: true, status: true, amount: true, baseAmount: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.agentCommission.findMany({ where: { agentId: id, deletedAt: null }, select: { id: true, period: true, grossAmount: true, rate: true, amount: true, baseAmount: true, isOverride: true, status: true, createdAt: true, booking: { select: { bookingNo: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.agentWallet.findUnique({ where: { agentId: id }, select: { balance: true, currency: true, transactions: { select: { id: true, type: true, description: true, amount: true, baseAmount: true, currency: true, method: true, reference: true, isReversed: true, postedAt: true }, orderBy: { postedAt: "desc" }, take: 100 } } }),
    prisma.agentCommission.groupBy({ by: ["status"], where: { agentId: id, deletedAt: null }, _sum: { baseAmount: true } }),
    a.parentAgentId ? prisma.agent.findUnique({ where: { id: a.parentAgentId }, select: { name: true } }) : Promise.resolve(null),
    prisma.agentCommission.groupBy({ by: ["agentId"], where: { agentId: { in: subIds }, deletedAt: null, status: "PAID" }, _sum: { baseAmount: true } }),
    prisma.agentWallet.findMany({ where: { agentId: { in: subIds } }, select: { agentId: true, balance: true } }),
    prisma.booking.count({ where: { agentId: id, deletedAt: null, status: { not: "DRAFT" } } }),
  ]);

  const paid = num(myComm.find((c) => c.status === "PAID")?._sum.baseAmount);
  const pending = num(myComm.find((c) => c.status === "PENDING")?._sum.baseAmount);
  const subCommBy = new Map(subComm.map((c) => [c.agentId, num(c._sum.baseAmount)]));
  const subWalletBy = new Map(subWallets.map((w) => [w.agentId, num(w.balance)]));

  return {
    id: a.id, agentCode: a.agentCode, name: a.name, phone: a.phone, email: a.email,
    tier: a.tier, status: a.status, commissionRate: num(a.commissionRate),
    branchId: a.branchId, branchName: a.branchId ? names.get(a.branchId) ?? null : null,
    parentAgentId: a.parentAgentId, parentName: parentRow?.name ?? null,
    subAgentCount: subAgents.length, bookingsCount,
    commissionEarned: round2(paid), commissionPending: round2(pending),
    walletBalance: round2(num(wallet?.balance)), createdAt: dIso(a.createdAt),
    tradeLicense: a.tradeLicense, bankName: a.bankName, accountNo: a.accountNo, bankBranch: a.bankBranch, bkashNo: a.bkashNo, nagadNo: a.nagadNo,
    walletCurrency: wallet?.currency ?? "BDT",
    subAgents: subAgents.map((s) => ({ id: s.id, agentCode: s.agentCode, name: s.name, tier: s.tier, status: s.status, commissionEarned: round2(subCommBy.get(s.id) ?? 0), walletBalance: round2(subWalletBy.get(s.id) ?? 0) })),
    bookings: bookingsRaw.map((b) => ({ id: b.id, bookingNo: b.bookingNo, serviceType: b.serviceType, status: b.status, amount: num(b.amount), baseAmount: num(b.baseAmount), createdAt: dIso(b.createdAt) })),
    commissions: commissionsRaw.map((c) => ({ id: c.id, bookingNo: c.booking?.bookingNo ?? null, period: c.period, grossAmount: num(c.grossAmount), rate: num(c.rate), amount: num(c.amount), baseAmount: num(c.baseAmount), isOverride: c.isOverride, status: c.status, createdAt: dIso(c.createdAt) })),
    walletTransactions: (wallet?.transactions ?? []).map((t) => ({ id: t.id, type: t.type, description: t.description, amount: num(t.amount), baseAmount: num(t.baseAmount), currency: t.currency, method: t.method, reference: t.reference, isReversed: t.isReversed, postedAt: dIso(t.postedAt) })),
  };
}

/** The ONLY writes in this module: commission-tier assignment + status. Wallet
 *  and commission ledgers are immutable and are never mutated here. */
export async function updatePartner(auth: AuthCtx, id: string, input: PartnerUpdateInput): Promise<PartnerDetail> {
  const existing = await prisma.agent.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.$transaction(async (tx) => {
    await tx.agent.update({ where: { id }, data: { tier: input.tier ?? undefined, status: input.status ?? undefined } });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "AGENT_UPDATED", target: id, module: "partners" } });
  });
  return getPartner(auth, id);
}
