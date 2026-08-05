import { TemplateChannel } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { emailSender, smsSender, whatsappSender, notifySafe } from "../lib/notify";
import { audit } from "../lib/audit";
import { HttpError } from "../middleware/errorHandler";
import type { AuthCtx } from "../middleware/auth";
import { branchWhere } from "../middleware/auth";
import type {
  MessageTemplateCreateInput,
  MessageTemplateUpdateInput,
  MessageTemplateListQuery,
  MessageTemplateDto,
  SendMessageInput,
  BulkSendInput,
  OutboundLogItem,
  SendResult,
  OutboundChannelDto,
} from "../contracts/communications.contract";

const BULK_CAP = 100;

const iso = (d: Date): string => d.toISOString();

function toTemplateDto(t: {
  id: string;
  channel: TemplateChannel;
  name: string;
  event: string | null;
  content: string | null;
  category: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): MessageTemplateDto {
  return {
    id: t.id,
    channel: t.channel,
    name: t.name,
    event: t.event,
    content: t.content,
    category: t.category,
    status: t.status,
    createdAt: iso(t.createdAt),
    updatedAt: iso(t.updatedAt),
  };
}

async function logOutbound(
  auth: AuthCtx,
  action: string,
  target: string,
  detail: string,
  ip?: string | null,
): Promise<void> {
  await prisma.activityLog.create({
    data: { userId: auth.userId, action, target, module: "communications" },
  });
  void audit({
    event: action,
    userId: auth.userId,
    ip: ip ?? null,
    resource: "communications",
    detail: `${target}: ${detail.slice(0, 200)}`,
  });
}

function dispatch(channel: OutboundChannelDto, to: string, body: string, subject?: string): void {
  const label = `comms-${channel}`;
  if (channel === "email") {
    notifySafe(label, emailSender.send(to, subject ?? "Message from SM Travels", body));
  } else if (channel === "sms") {
    notifySafe(label, smsSender.send(to, body));
  } else {
    notifySafe(label, whatsappSender.send(to, body));
  }
}

// ── MessageTemplate CRUD ──────────────────────────────────────────────────────

export async function listTemplates(q: MessageTemplateListQuery): Promise<{ data: MessageTemplateDto[] }> {
  const rows = await prisma.messageTemplate.findMany({
    where: q.channel ? { channel: q.channel } : undefined,
    orderBy: [{ channel: "asc" }, { name: "asc" }],
  });
  return { data: rows.map(toTemplateDto) };
}

export async function getTemplate(id: string): Promise<MessageTemplateDto> {
  const row = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!row) throw new HttpError(404, "NotFound");
  return toTemplateDto(row);
}

export async function createTemplate(input: MessageTemplateCreateInput): Promise<MessageTemplateDto> {
  const row = await prisma.messageTemplate.create({
    data: {
      channel: input.channel,
      name: input.name,
      event: input.event ?? null,
      content: input.content ?? null,
      category: input.category ?? null,
      status: input.status,
    },
  });
  return toTemplateDto(row);
}

export async function updateTemplate(id: string, input: MessageTemplateUpdateInput): Promise<MessageTemplateDto> {
  const existing = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "NotFound");
  const row = await prisma.messageTemplate.update({
    where: { id },
    data: {
      ...(input.channel !== undefined ? { channel: input.channel } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.event !== undefined ? { event: input.event ?? null } : {}),
      ...(input.content !== undefined ? { content: input.content ?? null } : {}),
      ...(input.category !== undefined ? { category: input.category ?? null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
  return toTemplateDto(row);
}

export async function deleteTemplate(id: string): Promise<void> {
  const existing = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.messageTemplate.delete({ where: { id } });
}

// ── Outbound send ─────────────────────────────────────────────────────────────

export async function sendMessage(auth: AuthCtx, input: SendMessageInput, ip?: string | null): Promise<SendResult> {
  if (input.channel === "email" && !input.subject?.trim()) {
    throw new HttpError(400, "SubjectRequired", { detail: "Email requires a subject." });
  }
  await logOutbound(auth, `OUTBOUND_${input.channel.toUpperCase()}`, input.to, input.body.slice(0, 120), ip);
  dispatch(input.channel, input.to, input.body, input.subject);
  return { ok: true };
}

export async function bulkSend(auth: AuthCtx, input: BulkSendInput, ip?: string | null): Promise<SendResult> {
  const scope = branchWhere(auth);
  let recipients: { phone: string; name: string }[] = [];

  if (input.audience === "customers") {
    const rows = await prisma.customer.findMany({
      where: { deletedAt: null, phone: { not: "" }, ...scope },
      select: { phone: true, name: true },
      take: BULK_CAP,
      orderBy: { createdAt: "desc" },
    });
    recipients = rows.map((r) => ({ phone: r.phone, name: r.name }));
  } else {
    const rows = await prisma.lead.findMany({
      where: { deletedAt: null, phone: { not: "" }, ...scope },
      select: { phone: true, name: true },
      take: BULK_CAP,
      orderBy: { createdAt: "desc" },
    });
    recipients = rows.map((r) => ({ phone: r.phone, name: r.name }));
  }

  if (recipients.length === 0) {
    throw new HttpError(400, "NoRecipients", { detail: `No ${input.audience} with phone numbers found.` });
  }

  const summary = `bulk ${input.channel} → ${input.audience} (${recipients.length})`;
  await logOutbound(auth, `OUTBOUND_BULK_${input.channel.toUpperCase()}`, input.audience, summary, ip);

  for (const r of recipients) {
    const body = input.body.replace(/\{name\}/gi, r.name);
    notifySafe(`comms-bulk-${input.channel}`, input.channel === "sms" ? smsSender.send(r.phone, body) : whatsappSender.send(r.phone, body));
  }

  return { ok: true, queued: recipients.length };
}

export async function listOutboundLog(): Promise<{ data: OutboundLogItem[] }> {
  const rows = await prisma.activityLog.findMany({
    where: { module: "communications", action: { startsWith: "OUTBOUND" } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return {
    data: rows.map((r) => ({
      id: r.id,
      action: r.action,
      target: r.target,
      detail: r.target,
      createdAt: iso(r.createdAt),
    })),
  };
}