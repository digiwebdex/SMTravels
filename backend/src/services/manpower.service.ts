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
  CandidateCreateInput, CandidateUpdateInput, CandidateListQuery, CandidateDto, CandidateTransitionInput,
} from "../contracts/manpower.contract";
import { SLOT_STATUSES } from "../contracts/manpower.contract";
import { CANDIDATE_TRANSITIONS, hasQuotaRoom } from "./business-rules";

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

// ─── Candidate + Recruitment (Module 6B) ─────────────────────────────────────
const CAND_STR = ["fullName", "photoUrl", "gender", "nationality", "passportNo", "nid", "phone", "email", "address", "education", "experience", "skills", "remarks", "screeningNotes", "interviewer", "interviewResult", "interviewRemarks", "contractStatus"] as const;
const CAND_DATE = ["dob", "passportIssueDate", "passportExpiry", "interviewDate", "contractDate"] as const;
// Allowed status transitions — enforces the real lifecycle. REJECTED can only be
// explicitly un-rejected to SHORTLISTED (never accidentally SELECTED).
// CANDIDATE_TRANSITIONS (the recruitment status machine) lives in ./business-rules.
const dstr = (d: unknown) => (d ? (d as Date).toISOString().slice(0, 10) : null);

function toCandidate(c: any): CandidateDto {
  return {
    id: c.id, code: c.code, jobOrderId: c.jobOrderId, jobOrderCode: c.jobOrder?.code ?? "", jobTitle: c.jobOrder?.jobTitle ?? "",
    employerId: c.employerId, employerName: c.employer?.name ?? "", fullName: c.fullName, photoUrl: c.photoUrl,
    dob: dstr(c.dob), gender: c.gender, nationality: c.nationality, passportNo: c.passportNo,
    passportIssueDate: dstr(c.passportIssueDate), passportExpiry: dstr(c.passportExpiry), nid: c.nid,
    phone: c.phone, email: c.email, address: c.address, education: c.education, experience: c.experience, skills: c.skills,
    status: c.status, screeningNotes: c.screeningNotes, interviewDate: dstr(c.interviewDate), interviewer: c.interviewer,
    interviewResult: c.interviewResult, interviewRemarks: c.interviewRemarks, rejectionReason: c.rejectionReason,
    contractStatus: c.contractStatus, contractDate: dstr(c.contractDate), remarks: c.remarks, createdAt: c.createdAt.toISOString(),
  };
}
const withRefs = { jobOrder: { select: { code: true, jobTitle: true } }, employer: { select: { name: true } } };

function candDates(input: any) {
  const d: Record<string, Date | null> = {};
  for (const k of CAND_DATE) if (k in input && input[k] !== undefined) d[k] = input[k] ? new Date(input[k]) : null;
  return d;
}

export async function listCandidates(_auth: AuthCtx, q: CandidateListQuery) {
  const page = q.page ?? 1, pageSize = q.pageSize ?? 20;
  const where: Prisma.CandidateWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status } : {}),
    ...(q.jobOrderId ? { jobOrderId: q.jobOrderId } : {}),
    ...(q.employerId ? { employerId: q.employerId } : {}),
    ...(q.q ? { OR: [{ fullName: { contains: q.q, mode: "insensitive" } }, { code: { contains: q.q, mode: "insensitive" } }, { passportNo: { contains: q.q, mode: "insensitive" } }, { phone: { contains: q.q, mode: "insensitive" } }] } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.candidate.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: withRefs }),
    prisma.candidate.count({ where }),
  ]);
  return { items: items.map(toCandidate), total, page, pageSize };
}

export async function createCandidate(auth: AuthCtx, input: CandidateCreateInput) {
  const jo = await prisma.jobOrder.findFirst({ where: { id: input.jobOrderId, deletedAt: null } });
  if (!jo) throw new HttpError(400, "InvalidJobOrder", { message: "Job order not found." });
  const c = await prisma.$transaction(async (tx) => {
    const n = await tx.candidate.count();
    return tx.candidate.create({
      data: {
        code: `CN-${String(n + 1).padStart(5, "0")}`, jobOrderId: jo.id, employerId: jo.employerId,
        fullName: input.fullName.trim(), status: "NEW", createdById: auth.userId,
        ...pick(input, CAND_STR.filter((k) => k !== "fullName")), ...candDates(input),
      },
      include: withRefs,
    });
  });
  return toCandidate(c);
}

export async function updateCandidate(_auth: AuthCtx, id: string, input: CandidateUpdateInput) {
  const existing = await prisma.candidate.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  const c = await prisma.candidate.update({
    where: { id },
    data: { ...(input.fullName ? { fullName: input.fullName.trim() } : {}), ...pick(input, CAND_STR.filter((k) => k !== "fullName")), ...candDates(input) },
    include: withRefs,
  });
  return toCandidate(c);
}

export async function transitionCandidate(_auth: AuthCtx, id: string, input: CandidateTransitionInput) {
  const c = await prisma.candidate.findFirst({ where: { id, deletedAt: null } });
  if (!c) throw new HttpError(404, "NotFound");
  const allowed = CANDIDATE_TRANSITIONS[c.status] ?? [];
  if (c.status === input.status) throw new HttpError(400, "NoChange", { message: "Candidate already in this status." });
  if (!allowed.includes(input.status)) throw new HttpError(400, "InvalidTransition", { message: `Cannot move from ${c.status} to ${input.status}.` });

  // Selection quantity cap: SLOT statuses cannot exceed the job order's required quantity.
  if (input.status === "SELECTED") {
    const jo = await prisma.jobOrder.findUnique({ where: { id: c.jobOrderId } });
    const taken = await prisma.candidate.count({ where: { jobOrderId: c.jobOrderId, deletedAt: null, status: { in: SLOT_STATUSES as unknown as string[] } } });
    if (jo && !hasQuotaRoom(taken, jo.quantity)) throw new HttpError(400, "QuotaFull", { message: `Job order ${jo.code} already has ${taken}/${jo.quantity} selected.` });
  }
  const data: Record<string, unknown> = { status: input.status };
  if (input.status === "REJECTED") data.rejectionReason = input.reason ?? null;
  if (input.status === "SHORTLISTED" && c.status === "REJECTED") data.rejectionReason = null; // un-reject clears the reason
  if (input.status === "CONTRACTED") { data.contractStatus = "SIGNED"; data.contractDate = new Date(); }
  const updated = await prisma.candidate.update({ where: { id }, data, include: withRefs });
  return toCandidate(updated);
}

export async function archiveCandidate(_auth: AuthCtx, id: string) {
  const existing = await prisma.candidate.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.candidate.update({ where: { id }, data: { deletedAt: new Date() } });
  return { ok: true };
}

export async function getJobOrderPipeline(_auth: AuthCtx, jobOrderId: string) {
  const jo = await prisma.jobOrder.findFirst({ where: { id: jobOrderId, deletedAt: null }, include: { employer: { select: { name: true } } } });
  if (!jo) throw new HttpError(404, "NotFound");
  const candidates = await prisma.candidate.findMany({ where: { jobOrderId, deletedAt: null }, orderBy: { createdAt: "desc" }, include: withRefs });
  const selected = candidates.filter((c) => (SLOT_STATUSES as unknown as string[]).includes(c.status)).length;
  return {
    jobOrder: { id: jo.id, code: jo.code, jobTitle: jo.jobTitle, employerName: (jo as any).employer?.name ?? "", quantity: jo.quantity },
    required: jo.quantity, selected, remaining: Math.max(0, jo.quantity - selected),
    candidates: candidates.map(toCandidate),
  };
}
