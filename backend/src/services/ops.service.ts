import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthCtx } from "../middleware/auth";
import { resolveBranchId } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  AnnouncementCreateInput,
  OpsAnnouncementDto,
  OpsAuditLogDto,
  OpsTaskCreateInput,
  OpsTaskDto,
  OpsTaskUpdateInput,
  TaskListQuery,
} from "../contracts/ops.contract";

const iso = (d: Date): string => d.toISOString();
const toDate = (s?: string | null): Date | null => (s ? new Date(s) : null);

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  category: string | null;
  assigneeId: string | null;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee: { name: string } | null;
};

function toTaskDto(t: TaskRow): OpsTaskDto {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    category: t.category,
    assigneeId: t.assigneeId,
    assigneeName: t.assignee?.name ?? null,
    dueAt: t.dueAt ? iso(t.dueAt) : null,
    createdAt: iso(t.createdAt),
    updatedAt: iso(t.updatedAt),
  };
}

export async function listTasks(_auth: AuthCtx, q: TaskListQuery): Promise<{ data: OpsTaskDto[] }> {
  const where: Prisma.TaskWhereInput = { deletedAt: null };
  if (q.status) where.status = q.status;
  if (q.q) {
    where.OR = [
      { title: { contains: q.q, mode: "insensitive" } },
      { description: { contains: q.q, mode: "insensitive" } },
      { category: { contains: q.q, mode: "insensitive" } },
    ];
  }
  const rows = await prisma.task.findMany({
    where,
    include: { assignee: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 500,
  });
  return { data: rows.map(toTaskDto) };
}

export async function createTask(auth: AuthCtx, input: OpsTaskCreateInput): Promise<OpsTaskDto> {
  const t = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "MEDIUM",
      status: input.status ?? "TODO",
      category: input.category ?? null,
      assigneeId: input.assigneeId ?? null,
      dueAt: toDate(input.dueAt),
      createdById: auth.userId,
    },
    include: { assignee: { select: { name: true } } },
  });
  return toTaskDto(t);
}

export async function updateTask(_auth: AuthCtx, id: string, input: OpsTaskUpdateInput): Promise<OpsTaskDto> {
  const existing = await prisma.task.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound", { detail: "Task not found." });
  const t = await prisma.task.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
      ...(input.dueAt !== undefined ? { dueAt: toDate(input.dueAt) } : {}),
    },
    include: { assignee: { select: { name: true } } },
  });
  return toTaskDto(t);
}

export async function listAnnouncements(_auth: AuthCtx): Promise<{ data: OpsAnnouncementDto[] }> {
  const rows = await prisma.announcement.findMany({
    where: { deletedAt: null },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  const authorIds = [...new Set(rows.map((a) => a.authorId).filter(Boolean))] as string[];
  const authors = authorIds.length
    ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } })
    : [];
  const authorMap = new Map(authors.map((u) => [u.id, u.name]));
  return {
    data: rows.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      audience: a.audience,
      pinned: a.pinned,
      branchId: a.branchId,
      authorId: a.authorId,
      authorName: a.authorId ? authorMap.get(a.authorId) ?? null : null,
      createdAt: iso(a.createdAt),
    })),
  };
}

export async function createAnnouncement(auth: AuthCtx, input: AnnouncementCreateInput): Promise<OpsAnnouncementDto> {
  const branchId = input.branchId ? resolveBranchId(auth, input.branchId) : auth.branchId;
  const a = await prisma.announcement.create({
    data: {
      title: input.title,
      body: input.body,
      audience: input.audience ?? "All Staff",
      pinned: input.pinned ?? false,
      branchId: branchId ?? null,
      authorId: auth.userId,
    },
  });
  const author = await prisma.user.findUnique({ where: { id: auth.userId }, select: { name: true } });
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    audience: a.audience,
    pinned: a.pinned,
    branchId: a.branchId,
    authorId: a.authorId,
    authorName: author?.name ?? null,
    createdAt: iso(a.createdAt),
  };
}

export async function listAuditLogs(): Promise<{ data: OpsAuditLogDto[] }> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : [];
  const nameMap = new Map(users.map((u) => [u.id, u.name]));
  return {
    data: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userId ? nameMap.get(r.userId) ?? null : null,
      ip: r.ip,
      event: r.event,
      resource: r.resource,
      severity: r.severity,
      detail: r.detail,
      createdAt: iso(r.createdAt),
    })),
  };
}
