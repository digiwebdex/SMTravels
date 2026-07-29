/**
 * Communication Center (SMS) service.
 *
 * Sending REUSES the existing safe sender singleton (lib/notify `smsSender`): when
 * BulkSMSBD credentials are absent it is a LogSmsSender that logs-only and never
 * throws — the same fallback the booking notifications use. We `await` it per
 * recipient purely to record the audit status in MessageLog; the whole delivery is
 * wrapped so a failing send is recorded as FAILED, never crashing the request.
 * No new sending path is introduced.
 */
import { Prisma, type MessageStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { smsSender, smsConfigured } from "../lib/notify";
import type {
  TemplateCreateInput, TemplateUpdateInput, SendInput, LogListQuery,
  MessageTemplateDto, MessageLogDto, MessageLogResponse, SendResult,
} from "../contracts/communication.contract";

const dIso = (d: Date | null): string => (d ? d.toISOString() : "");

let branchNameCache: Map<string, string> | null = null;
async function branchNames(): Promise<Map<string, string>> {
  if (!branchNameCache) {
    const rows = await prisma.branch.findMany({ select: { id: true, name: true } });
    branchNameCache = new Map(rows.map((b) => [b.id, b.name]));
  }
  return branchNameCache;
}

// ── templates (reuse the existing MessageTemplate model) ─────────────────────
const toTemplate = (t: { id: string; channel: string; name: string; event: string | null; content: string | null; category: string | null; status: string; createdAt: Date; updatedAt: Date }): MessageTemplateDto => ({
  id: t.id, channel: t.channel, name: t.name, event: t.event, content: t.content, category: t.category, status: t.status, createdAt: dIso(t.createdAt), updatedAt: dIso(t.updatedAt),
});

export async function listTemplates(_auth: AuthCtx, channel = "SMS"): Promise<{ data: MessageTemplateDto[] }> {
  const rows = await prisma.messageTemplate.findMany({ where: { channel: channel as never, status: { not: "archived" } }, orderBy: { updatedAt: "desc" } });
  return { data: rows.map(toTemplate) };
}
export async function createTemplate(auth: AuthCtx, input: TemplateCreateInput): Promise<MessageTemplateDto> {
  const t = await prisma.messageTemplate.create({ data: { name: input.name, content: input.content, channel: (input.channel ?? "SMS") as never, category: input.category ?? null, event: input.event ?? null, status: input.status ?? "active" } });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "SMS_TEMPLATE_CREATED", target: t.id, module: "communication" } });
  return toTemplate(t);
}
export async function updateTemplate(auth: AuthCtx, id: string, input: TemplateUpdateInput): Promise<MessageTemplateDto> {
  const existing = await prisma.messageTemplate.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  const t = await prisma.messageTemplate.update({ where: { id }, data: { name: input.name, content: input.content, channel: input.channel as never, category: input.category, event: input.event, status: input.status } });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "SMS_TEMPLATE_UPDATED", target: id, module: "communication" } });
  return toTemplate(t);
}
export async function deleteTemplate(auth: AuthCtx, id: string): Promise<{ ok: true }> {
  const existing = await prisma.messageTemplate.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.messageTemplate.update({ where: { id }, data: { status: "archived" } }); // soft-archive (logs keep the id)
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "SMS_TEMPLATE_DELETED", target: id, module: "communication" } });
  return { ok: true };
}

// ── message log (branch-scoped audit trail) ──────────────────────────────────
export async function listLogs(auth: AuthCtx, q: LogListQuery): Promise<MessageLogResponse> {
  const where: Prisma.MessageLogWhereInput = { ...branchWhere(auth) };
  if (q.branchId && q.branchId !== "all" && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.status) where.status = q.status as never;
  if (q.q) where.OR = [{ recipient: { contains: q.q } }, { recipientName: { contains: q.q, mode: "insensitive" } }, { body: { contains: q.q, mode: "insensitive" } }];

  const rows = await prisma.messageLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  const names = await branchNames();
  const senderIds = [...new Set(rows.map((r) => r.sentById).filter(Boolean) as string[])];
  const senders = senderIds.length ? new Map((await prisma.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true } })).map((u) => [u.id, u.name])) : new Map();

  const data: MessageLogDto[] = rows.map((r) => ({
    id: r.id, branchId: r.branchId, branchName: names.get(r.branchId) ?? null, channel: r.channel,
    recipient: r.recipient, recipientName: r.recipientName, body: r.body, templateId: r.templateId,
    status: r.status, error: r.error, sentById: r.sentById, sentByName: r.sentById ? senders.get(r.sentById) ?? null : null,
    createdAt: dIso(r.createdAt),
  }));
  const count = (s: string) => data.filter((d) => d.status === s).length;
  return { data, stats: { total: data.length, sent: count("SENT"), logged: count("LOGGED"), failed: count("FAILED") } };
}

// ── send / broadcast ──────────────────────────────────────────────────────────
interface Recipient { phone: string; name: string | null; branchId: string }

async function resolveTargets(auth: AuthCtx, input: SendInput): Promise<Recipient[]> {
  const scopedBranch = isGlobalRole(auth.role) ? null : (auth.branchId ?? "__no_branch__");
  if (input.mode === "manual") {
    const branchId = scopedBranch ?? input.branchId ?? null;
    if (!branchId) throw new HttpError(400, "BranchRequired", { detail: "Pick a branch for a manual send" });
    return (input.phones ?? []).filter((p) => p.trim()).map((p) => ({ phone: p.trim(), name: null, branchId }));
  }
  if (input.mode === "customer") {
    if (!input.customerId) throw new HttpError(400, "CustomerRequired");
    const c = await prisma.customer.findFirst({ where: { id: input.customerId, ...branchWhere(auth), deletedAt: null }, select: { phone: true, name: true, branchId: true } });
    if (!c) throw new HttpError(404, "NotFound");
    return c.phone ? [{ phone: c.phone, name: c.name, branchId: c.branchId }] : [];
  }
  if (input.mode === "lead") {
    const where: Prisma.LeadWhereInput = { ...branchWhere(auth), deletedAt: null };
    if (input.leadStage) where.stage = input.leadStage as never;
    if (input.leadService) where.serviceInterest = input.leadService as never;
    const leads = await prisma.lead.findMany({ where, select: { phone: true, name: true, branchId: true } });
    return leads.filter((l) => l.phone).map((l) => ({ phone: l.phone, name: l.name, branchId: l.branchId }));
  }
  // batch: pilgrims (customers) of bookings assigned to a departure batch
  if (!input.batchId) throw new HttpError(400, "BatchRequired");
  const batch = await prisma.departureBatch.findFirst({ where: { id: input.batchId, ...branchWhere(auth), deletedAt: null }, select: { branchId: true } });
  if (!batch) throw new HttpError(404, "NotFound");
  const bookings = await prisma.booking.findMany({ where: { batchId: input.batchId, deletedAt: null }, select: { customer: { select: { phone: true, name: true } } } });
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const b of bookings) {
    const ph = b.customer?.phone;
    if (ph && !seen.has(ph)) { seen.add(ph); out.push({ phone: ph, name: b.customer?.name ?? null, branchId: batch.branchId }); }
  }
  return out;
}

async function deliver(sentById: string, r: Recipient, body: string, templateId: string | null): Promise<MessageStatus> {
  let status: MessageStatus = smsConfigured ? "SENT" : "LOGGED";
  let error: string | null = null;
  try {
    await smsSender.send(r.phone, body); // safe singleton — log-only when unconfigured, never a new path
  } catch (e) {
    status = "FAILED";
    error = (e instanceof Error ? e.message : "send failed").slice(0, 300);
  }
  await prisma.messageLog.create({ data: { branchId: r.branchId, channel: "SMS", recipient: r.phone, recipientName: r.name, body, templateId, status, error, sentById } });
  return status;
}

export async function sendMessage(auth: AuthCtx, input: SendInput): Promise<SendResult> {
  let body = input.body ?? "";
  if (input.templateId) {
    const tpl = await prisma.messageTemplate.findUnique({ where: { id: input.templateId }, select: { content: true } });
    if (!tpl?.content) throw new HttpError(400, "InvalidTemplate", { detail: "Template has no content" });
    body = tpl.content;
  }
  if (!body.trim()) throw new HttpError(400, "EmptyBody");

  const recipients = await resolveTargets(auth, input);
  if (recipients.length === 0) throw new HttpError(400, "NoRecipients", { detail: "No recipients matched this target" });

  const results = await Promise.all(recipients.map((r) => deliver(auth.userId, r, body, input.templateId ?? null)));
  const c = (s: MessageStatus) => results.filter((x) => x === s).length;
  return { total: recipients.length, sent: c("SENT"), logged: c("LOGGED"), failed: c("FAILED"), smsConfigured };
}
