/**
 * Agent Portal service. Scoped by the caller's OWN agentId (resolveOwner). The
 * one novelty vs Customer: the TEAM/downline scope is a TREE — an agent may see
 * their own sub-agents (the parentAgentId subtree) but NEVER an unrelated agent's
 * downline. downlineIds() resolves only the descendants of the caller's own
 * agent, so the whole agent table is never exposed.
 *
 * The wallet is an IMMUTABLE LEDGER (WalletTransaction, append-only, reversal
 * only). This portal is READ-ONLY on the wallet — there is NO mutating endpoint.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthCtx, requireAgentId } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  AgentProfile, AgentLead, AgentBooking, AgentCommissionRow, AgentWalletView,
  AgentTeamMember, AgentDashboard, AgentCustomer, LeadCreateInput,
  AgentDocument, AgentPayment,
  PortalTicket, PortalTicketDetail, TicketCreateInput,
} from "../contracts/portal.contract";
import { allocateSequence, formatDocNo } from "../lib/sequence";

const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : Number(d));
const iso = (d: Date): string => d.toISOString();

/** Descendant agent ids of `rootId` (the caller's downline), bounded depth. Only
 *  ever returns rows below the caller — never siblings or unrelated agents. */
async function downlineIds(rootId: string): Promise<string[]> {
  const out: string[] = [];
  let frontier = [rootId];
  for (let depth = 0; depth < 8 && frontier.length; depth++) {
    const kids = await prisma.agent.findMany({ where: { parentAgentId: { in: frontier }, deletedAt: null }, select: { id: true } });
    const ids = kids.map((k) => k.id).filter((id) => !out.includes(id) && id !== rootId);
    if (!ids.length) break;
    out.push(...ids); frontier = ids;
  }
  return out;
}

export async function getProfile(auth: AuthCtx): Promise<AgentProfile> {
  const agentId = await requireAgentId(auth);
  const a = await prisma.agent.findUniqueOrThrow({ where: { id: agentId } }); // direct query → PII (nid) decrypts
  return {
    id: a.id, agentCode: a.agentCode, name: a.name, phone: a.phone, email: a.email, nid: a.nid,
    tradeLicense: a.tradeLicense, tier: a.tier, commissionRate: num(a.commissionRate), status: a.status,
    bankName: a.bankName, accountNo: a.accountNo, bkashNo: a.bkashNo, nagadNo: a.nagadNo, memberSince: iso(a.createdAt),
  };
}

export async function listLeads(auth: AuthCtx): Promise<AgentLead[]> {
  const agentId = await requireAgentId(auth);
  const rows = await prisma.lead.findMany({ where: { agentId, deletedAt: null }, orderBy: { createdAt: "desc" } });
  return rows.map((l) => ({ id: l.id, name: l.name, phone: l.phone, serviceInterest: l.serviceInterest, stage: l.stage, interest: l.interest, createdAt: iso(l.createdAt) }));
}

export async function createLead(auth: AuthCtx, input: LeadCreateInput): Promise<AgentLead> {
  const agentId = await requireAgentId(auth);
  const branch = await prisma.agent.findUniqueOrThrow({ where: { id: agentId }, select: { branchId: true } });
  const l = await prisma.lead.create({
    data: { agentId, branchId: branch.branchId ?? "brn_dhaka", name: input.name, phone: input.phone, email: input.email, serviceInterest: input.serviceInterest, stage: "NEW", interest: "MEDIUM", source: "agent-portal" },
  });
  return { id: l.id, name: l.name, phone: l.phone, serviceInterest: l.serviceInterest, stage: l.stage, interest: l.interest, createdAt: iso(l.createdAt) };
}

export async function listBookings(auth: AuthCtx): Promise<AgentBooking[]> {
  const agentId = await requireAgentId(auth);
  const rows = await prisma.booking.findMany({ where: { agentId, deletedAt: null }, include: { customer: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  return rows.map((b) => ({ id: b.id, bookingNo: b.bookingNo, customerName: b.customer?.name ?? null, serviceType: b.serviceType, status: b.status, baseAmount: num(b.baseAmount), createdAt: iso(b.createdAt) }));
}

/** Distinct customers from the agent's bookings (aggregated). */
export async function listCustomers(auth: AuthCtx): Promise<AgentCustomer[]> {
  const agentId = await requireAgentId(auth);
  const bookings = await prisma.booking.findMany({
    where: { agentId, deletedAt: null, customerId: { not: null } },
    include: { customer: { select: { id: true, name: true, phone: true, rating: true } } },
    orderBy: { createdAt: "desc" },
  });
  const byCustomer = new Map<string, { id: string; name: string; phone: string; status: string; bookingsCount: number; totalValue: number; lastBookingAt: Date }>();
  for (const b of bookings) {
    if (!b.customer) continue;
    const cur = byCustomer.get(b.customer.id) ?? {
      id: b.customer.id, name: b.customer.name, phone: b.customer.phone,
      status: b.customer.rating?.toLowerCase().includes("vip") ? "vip" : "active",
      bookingsCount: 0, totalValue: 0, lastBookingAt: b.createdAt,
    };
    cur.bookingsCount += 1;
    cur.totalValue += num(b.baseAmount);
    if (b.createdAt > cur.lastBookingAt) cur.lastBookingAt = b.createdAt;
    byCustomer.set(b.customer.id, cur);
  }
  return [...byCustomer.values()].map((c) => ({
    id: c.id, name: c.name, phone: c.phone, bookingsCount: c.bookingsCount,
    totalValue: c.totalValue, lastBookingAt: iso(c.lastBookingAt), status: c.status,
  }));
}

export async function listCommissions(auth: AuthCtx): Promise<AgentCommissionRow[]> {
  const agentId = await requireAgentId(auth);
  const rows = await prisma.agentCommission.findMany({ where: { agentId, deletedAt: null }, orderBy: { period: "desc" } });
  return rows.map((c) => ({ id: c.id, period: c.period, grossAmount: num(c.grossAmount), rate: num(c.rate), amount: num(c.amount), status: c.status }));
}

/** READ-ONLY wallet ledger. No mutation path exists — withdrawals go through the
 *  back-office (reversal-only ledger integrity is preserved). */
export async function getWallet(auth: AuthCtx): Promise<AgentWalletView> {
  const agentId = await requireAgentId(auth);
  const wallet = await prisma.agentWallet.findUnique({ where: { agentId }, include: { transactions: { orderBy: { postedAt: "desc" }, take: 100 } } });
  if (!wallet) return { balance: 0, currency: "BDT", transactions: [] };
  return {
    balance: num(wallet.balance), currency: wallet.currency,
    transactions: wallet.transactions.map((t) => ({ id: t.id, type: t.type, description: t.description, amount: num(t.amount), reference: t.reference, reversed: t.isReversed, postedAt: iso(t.postedAt) })),
  };
}

export async function listTeam(auth: AuthCtx): Promise<AgentTeamMember[]> {
  const agentId = await requireAgentId(auth);
  const ids = await downlineIds(agentId);
  if (!ids.length) return [];
  const [subs, commAgg, bookAgg] = await Promise.all([
    prisma.agent.findMany({ where: { id: { in: ids } } }),
    prisma.agentCommission.groupBy({ by: ["agentId"], where: { agentId: { in: ids } }, _sum: { baseAmount: true } }),
    prisma.booking.groupBy({ by: ["agentId"], where: { agentId: { in: ids }, deletedAt: null }, _count: { _all: true } }),
  ]);
  const comm = new Map(commAgg.map((c) => [c.agentId, num(c._sum.baseAmount)]));
  const book = new Map(bookAgg.map((b) => [b.agentId!, b._count._all]));
  return subs.map((s) => ({ id: s.id, agentCode: s.agentCode, name: s.name, tier: s.tier, status: s.status, bookings: book.get(s.id) ?? 0, commission: comm.get(s.id) ?? 0 }));
}

/** Per-sub-agent detail — 404 unless the sub-agent is in the caller's downline. */
export async function getTeamMember(auth: AuthCtx, subAgentId: string): Promise<AgentTeamMember> {
  const agentId = await requireAgentId(auth);
  const ids = await downlineIds(agentId);
  if (!ids.includes(subAgentId)) throw new HttpError(404, "NotFound", { detail: "Sub-agent not in your downline." });
  const s = await prisma.agent.findUniqueOrThrow({ where: { id: subAgentId } });
  const commAgg = await prisma.agentCommission.aggregate({ where: { agentId: subAgentId }, _sum: { baseAmount: true } });
  const bookings = await prisma.booking.count({ where: { agentId: subAgentId, deletedAt: null } });
  return { id: s.id, agentCode: s.agentCode, name: s.name, tier: s.tier, status: s.status, bookings, commission: num(commAgg._sum.baseAmount) };
}

export async function getDashboard(auth: AuthCtx): Promise<AgentDashboard> {
  const agentId = await requireAgentId(auth);
  const [agent, wallet, comm, leads, bookingCount, customerCount, teamIds] = await Promise.all([
    prisma.agent.findUniqueOrThrow({ where: { id: agentId }, select: { name: true, tier: true } }),
    prisma.agentWallet.findUnique({ where: { agentId }, select: { balance: true } }),
    prisma.agentCommission.findMany({ where: { agentId, deletedAt: null }, select: { amount: true, status: true } }),
    prisma.lead.findMany({ where: { agentId, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.booking.count({ where: { agentId, deletedAt: null } }),
    prisma.customer.count({ where: { agentId, deletedAt: null } }),
    downlineIds(agentId),
  ]);
  const earned = comm.filter((c) => c.status === "PAID").reduce((s, c) => s + num(c.amount), 0);
  const pending = comm.filter((c) => c.status !== "PAID").reduce((s, c) => s + num(c.amount), 0);
  return {
    agentName: agent.name, tier: agent.tier, walletBalance: num(wallet?.balance),
    counts: { leads: leads.length, bookings: bookingCount, customers: customerCount, teamSize: teamIds.length },
    commissionEarned: earned, commissionPending: pending,
    recentLeads: leads.map((l) => ({ id: l.id, name: l.name, phone: l.phone, serviceInterest: l.serviceInterest, stage: l.stage, interest: l.interest, createdAt: iso(l.createdAt) })),
  };
}

// ── documents on the agent's bookings / customers ─────────────────────────────
export async function listDocuments(auth: AuthCtx): Promise<AgentDocument[]> {
  const agentId = await requireAgentId(auth);
  const rows = await prisma.document.findMany({
    where: {
      deletedAt: null,
      OR: [{ booking: { agentId, deletedAt: null } }, { customer: { agentId, deletedAt: null } }],
    },
    include: { booking: { select: { bookingNo: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map((d) => ({
    id: d.id, name: d.name, type: d.type, status: d.status, hasFile: !!d.filePath,
    bookingNo: d.booking?.bookingNo ?? null, createdAt: iso(d.createdAt),
  }));
}

/** Payments for the agent's customers or bookings. */
export async function listPayments(auth: AuthCtx): Promise<AgentPayment[]> {
  const agentId = await requireAgentId(auth);
  const [custIds, bookIds] = await Promise.all([
    prisma.customer.findMany({ where: { agentId, deletedAt: null }, select: { id: true } }).then((r) => r.map((c) => c.id)),
    prisma.booking.findMany({ where: { agentId, deletedAt: null }, select: { id: true } }).then((r) => r.map((b) => b.id)),
  ]);
  if (!custIds.length && !bookIds.length) return [];
  const rows = await prisma.payment.findMany({
    where: {
      OR: [
        ...(custIds.length ? [{ customerId: { in: custIds } }] : []),
        ...(bookIds.length ? [{ bookingId: { in: bookIds } }] : []),
        ...(custIds.length ? [{ invoice: { customerId: { in: custIds } } }] : []),
      ],
    },
    include: {
      receipt: { select: { receiptNo: true } },
      invoice: { select: { invoiceNo: true, customer: { select: { name: true } } } },
    },
    orderBy: { paidAt: "desc" },
    take: 200,
  });
  return rows.map((p) => ({
    id: p.id,
    receiptNo: p.receipt?.receiptNo ?? p.paymentNo,
    invoiceNo: p.invoice?.invoiceNo ?? null,
    customerName: p.invoice?.customer?.name ?? null,
    amount: num(p.amount),
    currency: p.currency,
    method: p.method,
    paidAt: iso(p.paidAt),
    status: p.status,
    reversed: p.isReversed,
  }));
}

// ── support tickets (requesterType=agent, requesterId=agentId) ─────────────────
const toTicket = (t: { id: string; ticketNo: string; subject: string; status: string; category: string | null; createdAt: Date; messages: { body: string }[] }): PortalTicket => ({
  id: t.id, ticketNo: t.ticketNo, subject: t.subject, status: t.status, category: t.category,
  messageCount: t.messages.length, lastMessage: t.messages[t.messages.length - 1]?.body ?? null, createdAt: iso(t.createdAt),
});

export async function listTickets(auth: AuthCtx): Promise<PortalTicket[]> {
  const agentId = await requireAgentId(auth);
  const rows = await prisma.supportTicket.findMany({
    where: { requesterType: "agent", requesterId: agentId, deletedAt: null },
    include: { messages: { select: { body: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toTicket);
}

export async function getTicket(auth: AuthCtx, id: string): Promise<PortalTicketDetail> {
  const agentId = await requireAgentId(auth);
  const t = await prisma.supportTicket.findFirst({
    where: { id, requesterType: "agent", requesterId: agentId, deletedAt: null },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!t) throw new HttpError(404, "NotFound", { detail: "Ticket not found." });
  return {
    ...toTicket({ ...t, messages: t.messages }),
    messages: t.messages.map((m) => ({ id: m.id, fromLabel: m.fromLabel, mine: m.fromId === auth.userId, body: m.body, createdAt: iso(m.createdAt) })),
  };
}

export async function createTicket(auth: AuthCtx, input: TicketCreateInput): Promise<PortalTicketDetail> {
  const agentId = await requireAgentId(auth);
  const a = await prisma.agent.findUniqueOrThrow({ where: { id: agentId }, select: { branchId: true } });
  const branchId = a.branchId ?? "brn_dhaka";
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } });
  const year = new Date().getUTCFullYear();
  const id = await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "BOOKING", branchId, year);
    const ticket = await tx.supportTicket.create({
      data: {
        ticketNo: formatDocNo("SUP", branch.code, year, seq),
        subject: input.subject,
        category: input.category,
        requesterType: "agent",
        requesterId: agentId,
        branchId,
        status: "OPEN",
      },
    });
    await tx.ticketMessage.create({ data: { ticketId: ticket.id, fromId: auth.userId, fromLabel: "Me", body: input.message } });
    return ticket.id;
  });
  return getTicket(auth, id);
}

export async function addTicketMessage(auth: AuthCtx, ticketId: string, body: string): Promise<PortalTicketDetail> {
  const agentId = await requireAgentId(auth);
  const owned = await prisma.supportTicket.findFirst({
    where: { id: ticketId, requesterType: "agent", requesterId: agentId, deletedAt: null },
    select: { id: true },
  });
  if (!owned) throw new HttpError(404, "NotFound", { detail: "Ticket not found." });
  await prisma.ticketMessage.create({ data: { ticketId, fromId: auth.userId, fromLabel: "Me", body } });
  return getTicket(auth, ticketId);
}
