import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, resolveBranchId, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import type {
  LeadCreateInput, LeadUpdateInput, LeadListQuery,
  LeadListItem, LeadListResponse, LeadDetail,
} from "../contracts/crm.contract";

type Tx = Prisma.TransactionClient;

const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);
function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function logLeadActivity(tx: Tx, leadId: string, actorId: string | null, type: string, note?: string): Promise<void> {
  await tx.leadActivity.create({ data: { leadId, actorId, type, note } });
  await tx.activityLog.create({ data: { userId: actorId, action: type, target: leadId, module: "crm" } });
}

type LeadRow = Prisma.LeadGetPayload<{
  include: {
    branch: true; assignedTo: true;
    activities: { select: { createdAt: true } };
    callLogs: { select: { createdAt: true } };
    followUps: { select: { dueAt: true } };
  };
}>;

function toListItem(l: LeadRow): LeadListItem {
  const contacts = [l.activities[0]?.createdAt, l.callLogs[0]?.createdAt].filter(Boolean) as Date[];
  const lastContactAt = contacts.length ? new Date(Math.max(...contacts.map((d) => d.getTime()))) : null;
  return {
    id: l.id, name: l.name, phone: l.phone, email: l.email, source: l.source,
    serviceInterest: l.serviceInterest as LeadListItem["serviceInterest"], interest: l.interest, stage: l.stage,
    assignedToId: l.assignedToId, assignedToName: l.assignedTo?.name ?? null,
    branchId: l.branchId, branchName: l.branch?.name ?? null,
    converted: !!l.customerId,
    lastContactAt: dIso(lastContactAt),
    nextFollowUpAt: dIso(l.followUps[0]?.dueAt ?? null),
    createdAt: dIso(l.createdAt)!,
  };
}

export async function listLeads(auth: AuthCtx, q: LeadListQuery): Promise<LeadListResponse> {
  const where: Prisma.LeadWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.stage) where.stage = q.stage;
  if (q.source) where.source = q.source;
  if (q.serviceInterest) where.serviceInterest = q.serviceInterest;
  if (q.assignedToId) where.assignedToId = q.assignedToId;
  if (q.dateFrom || q.dateTo) {
    where.createdAt = {};
    if (q.dateFrom) (where.createdAt as Prisma.DateTimeFilter).gte = toDate(q.dateFrom)!;
    if (q.dateTo) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(`${q.dateTo}T23:59:59.999Z`);
  }
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { phone: { contains: q.q } },
      { email: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.LeadOrderByWithRelationInput =
    q.sort === "name" ? { name: q.dir } : q.sort === "stage" ? { stage: q.dir } : { createdAt: q.dir };

  const include = {
    branch: true, assignedTo: true,
    activities: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    callLogs: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    followUps: { where: { done: false }, orderBy: { dueAt: "asc" }, take: 1, select: { dueAt: true } },
  } satisfies Prisma.LeadInclude;

  const [rows, total, grouped] = await Promise.all([
    prisma.lead.findMany({ where, include, orderBy, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.lead.count({ where }),
    prisma.lead.groupBy({ by: ["stage"], where, _count: { _all: true } }),
  ]);

  const byStage: Record<string, number> = {};
  let won = 0, open = 0;
  for (const g of grouped) {
    byStage[g.stage] = g._count._all;
    if (g.stage === "WON") won += g._count._all;
    if (g.stage !== "WON" && g.stage !== "LOST") open += g._count._all;
  }

  return {
    data: rows.map(toListItem),
    page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    stats: { total, won, open, byStage },
  };
}

export async function getLead(auth: AuthCtx, id: string): Promise<LeadDetail> {
  const l = await prisma.lead.findFirst({
    where: { id, ...branchWhere(auth), deletedAt: null },
    include: {
      branch: true, assignedTo: true,
      activities: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
      callLogs: { orderBy: { createdAt: "desc" }, include: { by: { select: { name: true } } } },
      followUps: { where: { deletedAt: null }, orderBy: { dueAt: "asc" }, include: { assignedTo: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "desc" } },
      tasks: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, include: { assignee: { select: { name: true } } } },
    },
  });
  if (!l) throw new HttpError(404, "NotFound");

  const base = toListItem(l as unknown as LeadRow);
  // authorship names for notes
  const authorIds = [...new Set(l.notes.map((n) => n.authorId).filter(Boolean))] as string[];
  const authors = authorIds.length ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } }) : [];
  const authorName = (id: string | null) => (id ? authors.find((a) => a.id === id)?.name ?? null : null);

  return {
    ...base,
    quantity: l.quantity, agentId: l.agentId, customerId: l.customerId,
    activities: l.activities.map((a) => ({ id: a.id, type: a.type, note: a.note, actor: a.actor?.name ?? null, createdAt: dIso(a.createdAt)! })),
    followUps: l.followUps.map((f) => ({ id: f.id, dueAt: dIso(f.dueAt)!, note: f.note, done: f.done, assignedTo: f.assignedTo?.name ?? null, createdAt: dIso(f.createdAt)! })),
    callLogs: l.callLogs.map((c) => ({ id: c.id, direction: c.direction, durationSec: c.durationSec, note: c.note, by: c.by?.name ?? null, createdAt: dIso(c.createdAt)! })),
    notes: l.notes.map((n) => ({ id: n.id, body: n.body, author: authorName(n.authorId), createdAt: dIso(n.createdAt)! })),
    tasks: l.tasks.map((t) => ({ id: t.id, title: t.title, description: t.description, priority: t.priority, status: t.status, dueAt: dIso(t.dueAt), assignee: t.assignee?.name ?? null, createdAt: dIso(t.createdAt)! })),
  };
}

export async function createLead(auth: AuthCtx, input: LeadCreateInput): Promise<LeadDetail> {
  const branchId = resolveBranchId(auth, input.branchId);
  // friendly pre-check (the partial unique index is the race-safe backstop)
  const dup = await prisma.lead.findFirst({ where: { branchId, phone: input.phone, deletedAt: null }, select: { id: true } });
  if (dup) throw new HttpError(409, "DuplicatePhone", { detail: "A lead with this phone number already exists in this branch." });

  const id = await prisma.$transaction(async (tx) => {
    try {
      const lead = await tx.lead.create({
        data: {
          branchId, name: input.name, phone: input.phone, email: input.email || null, source: input.source,
          serviceInterest: input.serviceInterest, quantity: input.quantity, interest: input.interest ?? "MEDIUM",
          stage: input.stage ?? "NEW", assignedToId: input.assignedToId || null, agentId: input.agentId || null,
          createdById: auth.userId,
        },
      });
      await logLeadActivity(tx, lead.id, auth.userId, "CREATED", `Lead created (${input.stage ?? "NEW"})`);
      return lead.id;
    } catch (err) {
      mapUniqueError(err); // → friendly 409 on the unique index, else rethrow
    }
  });
  return getLead(auth, id!);
}

export async function updateLead(auth: AuthCtx, id: string, input: LeadUpdateInput): Promise<LeadDetail> {
  const existing = await prisma.lead.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");

  await prisma.$transaction(async (tx) => {
    const data: Prisma.LeadUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.email !== undefined) data.email = input.email || null;
    if (input.source !== undefined) data.source = input.source;
    if (input.serviceInterest !== undefined) data.serviceInterest = input.serviceInterest;
    if (input.quantity !== undefined) data.quantity = input.quantity;
    if (input.interest !== undefined) data.interest = input.interest;
    if (input.assignedToId !== undefined) data.assignedTo = input.assignedToId ? { connect: { id: input.assignedToId } } : { disconnect: true };
    if (input.stage !== undefined && input.stage !== existing.stage) {
      data.stage = input.stage;
      await logLeadActivity(tx, id, auth.userId, "STAGE_CHANGE", `${existing.stage} → ${input.stage}`);
    }
    try {
      await tx.lead.update({ where: { id }, data });
    } catch (err) {
      mapUniqueError(err);
    }
    await logLeadActivity(tx, id, auth.userId, "UPDATED");
  });
  return getLead(auth, id);
}

/** Dedicated stage move (kanban) — always logs the transition to LeadActivity. */
export async function changeStage(auth: AuthCtx, id: string, stage: LeadListItem["stage"], note?: string): Promise<LeadDetail> {
  const existing = await prisma.lead.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  if (existing.stage !== stage) {
    await prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { stage } });
      await logLeadActivity(tx, id, auth.userId, "STAGE_CHANGE", `${existing.stage} → ${stage}${note ? ` — ${note}` : ""}`);
    });
  }
  return getLead(auth, id);
}

/**
 * Convert a lead into a Customer in ONE transaction:
 *  - creates the Customer from the lead's contact info,
 *  - links Lead.customerId and marks the lead WON,
 *  - carries the lead's notes over to the customer (keeps them on the lead too),
 *  - records a CONVERTED LeadActivity (history is preserved).
 * If any step fails (e.g. a duplicate customer phone), the whole thing rolls
 * back and the lead is left unconverted.
 */
export async function convertLead(auth: AuthCtx, id: string): Promise<{ customerId: string; leadId: string }> {
  const lead = await prisma.lead.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!lead) throw new HttpError(404, "NotFound");
  if (lead.customerId) throw new HttpError(409, "AlreadyConverted", { detail: `Lead is already linked to customer ${lead.customerId}` });

  try {
    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          branchId: lead.branchId, type: "INDIVIDUAL", name: lead.name, phone: lead.phone,
          email: lead.email || null, createdById: auth.userId,
        },
      });
      await tx.lead.update({ where: { id }, data: { customerId: customer.id, stage: "WON" } });
      // carry the lead's notes onto the customer (also visible on the lead)
      await tx.note.updateMany({ where: { leadId: id, customerId: null }, data: { customerId: customer.id } });
      await logLeadActivity(tx, id, auth.userId, "CONVERTED", `Converted to customer ${customer.id}`);
      await tx.activityLog.create({ data: { userId: auth.userId, action: "LEAD_CONVERTED", target: customer.id, module: "crm" } });
      return { customerId: customer.id, leadId: id };
    });
  } catch (err) {
    mapUniqueError(err); // duplicate phone/email → friendly 409, lead stays unconverted
  }
}

export async function deleteLead(auth: AuthCtx, id: string): Promise<void> {
  const lead = await prisma.lead.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true } });
  if (!lead) throw new HttpError(404, "NotFound");
  await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id }, data: { deletedAt: new Date() } });
    await logLeadActivity(tx, id, auth.userId, "DELETED");
  });
}

// ── lead sub-resources (detail tabs) ──────────────────────────────────────────
async function assertLead(auth: AuthCtx, id: string): Promise<void> {
  const l = await prisma.lead.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true } });
  if (!l) throw new HttpError(404, "NotFound");
}

export async function addNote(auth: AuthCtx, id: string, body: string): Promise<LeadDetail> {
  await assertLead(auth, id);
  await prisma.$transaction(async (tx) => {
    await tx.note.create({ data: { leadId: id, body, authorId: auth.userId } });
    await logLeadActivity(tx, id, auth.userId, "NOTE", body.slice(0, 120));
  });
  return getLead(auth, id);
}

export async function addFollowUp(auth: AuthCtx, id: string, dueAt: string, note?: string, assignedToId?: string): Promise<LeadDetail> {
  await assertLead(auth, id);
  await prisma.$transaction(async (tx) => {
    await tx.followUp.create({ data: { leadId: id, dueAt: toDate(dueAt)!, note, assignedToId: assignedToId || auth.userId, createdById: auth.userId } });
    await logLeadActivity(tx, id, auth.userId, "FOLLOWUP", `Follow-up set for ${dueAt}`);
  });
  return getLead(auth, id);
}

export async function toggleFollowUp(auth: AuthCtx, id: string, followUpId: string, done: boolean): Promise<LeadDetail> {
  await assertLead(auth, id);
  await prisma.followUp.updateMany({ where: { id: followUpId, leadId: id }, data: { done } });
  return getLead(auth, id);
}

export async function addCall(auth: AuthCtx, id: string, direction: string, durationSec?: number, note?: string): Promise<LeadDetail> {
  await assertLead(auth, id);
  await prisma.$transaction(async (tx) => {
    await tx.callLog.create({ data: { leadId: id, direction, durationSec, note, byId: auth.userId } });
    await logLeadActivity(tx, id, auth.userId, "CALL", `${direction} call${durationSec ? ` (${durationSec}s)` : ""}`);
  });
  return getLead(auth, id);
}

export async function addTask(auth: AuthCtx, id: string, input: { title: string; description?: string; priority?: "HIGH" | "MEDIUM" | "LOW"; dueAt?: string; assigneeId?: string }): Promise<LeadDetail> {
  await assertLead(auth, id);
  await prisma.$transaction(async (tx) => {
    await tx.task.create({ data: { title: input.title, description: input.description, priority: input.priority ?? "MEDIUM", dueAt: toDate(input.dueAt), assigneeId: input.assigneeId || null, relatedLeadId: id, createdById: auth.userId } });
    await logLeadActivity(tx, id, auth.userId, "TASK", input.title);
  });
  return getLead(auth, id);
}
