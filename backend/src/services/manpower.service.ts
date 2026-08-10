/**
 * Manpower (Module 6) service. 6A: Employer + JobOrder CRUD with the Employer→JobOrder
 * relationship. Candidate lifecycle in 6B. Archive = soft delete.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  EmployerCreateInput, EmployerUpdateInput, EmployerListQuery, EmployerDto,
  JobOrderCreateInput, JobOrderUpdateInput, JobOrderListQuery, JobOrderDto,
} from "../contracts/manpower.contract";

/* eslint-disable @typescript-eslint/no-explicit-any */
function pick(input: any, keys: readonly string[]) {
  const d: Record<string, string | null> = {};
  for (const k of keys) if (k in input) d[k] = input[k]?.trim() || null;
  return d;
}

// ─── Employer ────────────────────────────────────────────────────────────────
const EMP_STR = ["country", "city", "industry", "contactPerson", "phone", "whatsapp", "email", "address", "notes"] as const;
function toEmployer(e: any): EmployerDto {
  return {
    id: e.id, code: e.code, name: e.name, country: e.country, city: e.city, industry: e.industry,
    contactPerson: e.contactPerson, phone: e.phone, whatsapp: e.whatsapp, email: e.email, address: e.address,
    status: e.status, notes: e.notes, jobOrderCount: e._count?.jobOrders ?? 0, createdAt: e.createdAt.toISOString(),
  };
}

export async function listEmployers(_auth: AuthCtx, q: EmployerListQuery) {
  const page = q.page ?? 1, pageSize = q.pageSize ?? 20;
  const where: Prisma.EmployerWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status } : {}),
    ...(q.q ? { OR: [{ name: { contains: q.q, mode: "insensitive" } }, { code: { contains: q.q, mode: "insensitive" } }, { country: { contains: q.q, mode: "insensitive" } }] } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.employer.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { _count: { select: { jobOrders: true } } } }),
    prisma.employer.count({ where }),
  ]);
  return { items: items.map(toEmployer), total, page, pageSize };
}

export async function createEmployer(auth: AuthCtx, input: EmployerCreateInput) {
  const e = await prisma.$transaction(async (tx) => {
    const n = await tx.employer.count();
    return tx.employer.create({ data: { code: `EMP-${String(n + 1).padStart(4, "0")}`, name: input.name.trim(), status: input.status ?? "ACTIVE", createdById: auth.userId, ...pick(input, EMP_STR) } });
  });
  return toEmployer(e);
}

export async function updateEmployer(_auth: AuthCtx, id: string, input: EmployerUpdateInput) {
  const existing = await prisma.employer.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  const e = await prisma.employer.update({ where: { id }, data: { ...(input.name ? { name: input.name.trim() } : {}), ...(input.status ? { status: input.status } : {}), ...pick(input, EMP_STR) }, include: { _count: { select: { jobOrders: true } } } });
  return toEmployer(e);
}

export async function archiveEmployer(_auth: AuthCtx, id: string) {
  const existing = await prisma.employer.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.employer.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  return { ok: true };
}

// ─── Job Order ───────────────────────────────────────────────────────────────
const JO_STR = ["category", "country", "accommodation", "food", "workingHours", "contractDuration", "requirements", "notes"] as const;
function toJobOrder(j: any): JobOrderDto {
  return {
    id: j.id, code: j.code, employerId: j.employerId, employerName: j.employer?.name ?? "", jobTitle: j.jobTitle,
    category: j.category, country: j.country, quantity: j.quantity, salary: j.salary != null ? String(j.salary) : null,
    currency: j.currency, accommodation: j.accommodation, food: j.food, workingHours: j.workingHours,
    contractDuration: j.contractDuration, requirements: j.requirements,
    deadline: j.deadline ? j.deadline.toISOString().slice(0, 10) : null, status: j.status, notes: j.notes,
    createdAt: j.createdAt.toISOString(),
  };
}

export async function listJobOrders(_auth: AuthCtx, q: JobOrderListQuery) {
  const page = q.page ?? 1, pageSize = q.pageSize ?? 20;
  const where: Prisma.JobOrderWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status } : {}),
    ...(q.employerId ? { employerId: q.employerId } : {}),
    ...(q.q ? { OR: [{ jobTitle: { contains: q.q, mode: "insensitive" } }, { code: { contains: q.q, mode: "insensitive" } }, { country: { contains: q.q, mode: "insensitive" } }] } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.jobOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { employer: { select: { name: true } } } }),
    prisma.jobOrder.count({ where }),
  ]);
  return { items: items.map(toJobOrder), total, page, pageSize };
}

async function assertEmployer(id: string) {
  const e = await prisma.employer.findFirst({ where: { id, deletedAt: null } });
  if (!e) throw new HttpError(400, "InvalidEmployer", { message: "Employer not found." });
}

export async function createJobOrder(auth: AuthCtx, input: JobOrderCreateInput) {
  await assertEmployer(input.employerId);
  const j = await prisma.$transaction(async (tx) => {
    const n = await tx.jobOrder.count();
    return tx.jobOrder.create({
      data: {
        code: `JO-${String(n + 1).padStart(4, "0")}`, employerId: input.employerId, jobTitle: input.jobTitle.trim(),
        quantity: input.quantity ?? 1, salary: input.salary ?? null, currency: input.currency ?? "SAR",
        deadline: input.deadline ? new Date(input.deadline) : null, status: input.status ?? "OPEN",
        createdById: auth.userId, ...pick(input, JO_STR),
      },
      include: { employer: { select: { name: true } } },
    });
  });
  return toJobOrder(j);
}

export async function updateJobOrder(_auth: AuthCtx, id: string, input: JobOrderUpdateInput) {
  const existing = await prisma.jobOrder.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  if (input.employerId) await assertEmployer(input.employerId);
  const j = await prisma.jobOrder.update({
    where: { id },
    data: {
      ...(input.employerId ? { employerId: input.employerId } : {}),
      ...(input.jobTitle ? { jobTitle: input.jobTitle.trim() } : {}),
      ...(input.quantity != null ? { quantity: input.quantity } : {}),
      ...(input.salary != null ? { salary: input.salary } : {}),
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.deadline !== undefined ? { deadline: input.deadline ? new Date(input.deadline) : null } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...pick(input, JO_STR),
    },
    include: { employer: { select: { name: true } } },
  });
  return toJobOrder(j);
}

export async function archiveJobOrder(_auth: AuthCtx, id: string) {
  const existing = await prisma.jobOrder.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.jobOrder.update({ where: { id }, data: { deletedAt: new Date(), status: "CANCELLED" } });
  return { ok: true };
}
