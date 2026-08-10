/**
 * Manpower downstream stages service (Module 6B-2): Medical + BMET. One record per
 * candidate, linked to Candidate/JobOrder/Employer (snapshots). Server-validated
 * status transitions + candidate stage-gating + terminal-state field requirements.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import {
  shouldAdvanceStatus, canTransition,
  MED_TRANSITIONS, BMET_TRANSITIONS, VISA_TRANSITIONS, DEPLOY_TRANSITIONS,
} from "./business-rules";
import type {
  MedicalCreateInput, MedicalUpdateInput, MedicalListQuery, MedicalDto,
  BmetCreateInput, BmetUpdateInput, BmetListQuery, BmetDto,
  VisaCreateInput, VisaUpdateInput, VisaListQuery, ManpowerVisaDto,
  DeploymentCreateInput, DeploymentUpdateInput, DeploymentListQuery, ManpowerDeploymentDto,
} from "../contracts/manpower-stages.contract";

/* eslint-disable @typescript-eslint/no-explicit-any */
const dstr = (d: unknown) => (d ? (d as Date).toISOString().slice(0, 10) : null);

// Candidate auto-advances as stages progress (forward-only; REJECTED never advances).
// STAGE_ORDER + shouldAdvanceStatus live in ./business-rules.
async function advanceCandidate(candidateId: string, to: string) {
  const c = await prisma.candidate.findFirst({ where: { id: candidateId, deletedAt: null } });
  if (!c || c.status === "REJECTED") return;
  if (shouldAdvanceStatus(c.status, to)) {
    await prisma.candidate.update({ where: { id: candidateId }, data: { status: to } });
  }
}
const dset = (input: any, keys: readonly string[]) => {
  const d: Record<string, Date | null> = {};
  for (const k of keys) if (k in input && input[k] !== undefined) d[k] = input[k] ? new Date(input[k]) : null;
  return d;
};
const sset = (input: any, keys: readonly string[]) => {
  const d: Record<string, string | null> = {};
  for (const k of keys) if (k in input && input[k] !== undefined) d[k] = input[k]?.trim() || null;
  return d;
};
const withCand = { candidate: { select: { fullName: true, code: true, status: true, jobOrder: { select: { jobTitle: true } }, employer: { select: { name: true } } } } };

async function loadCandidate(candidateId: string) {
  const c = await prisma.candidate.findFirst({ where: { id: candidateId, deletedAt: null } });
  if (!c) throw new HttpError(400, "InvalidCandidate", { message: "Candidate not found or archived." });
  return c;
}

// ─── Medical ─────────────────────────────────────────────────────────────────
const MED_CAND_OK = ["CONTRACTED", "MEDICAL", "BMET", "VISA", "TICKETED", "DEPLOYED"];
const MED_STR = ["medicalCenter", "documentRef", "remarks"] as const;
const MED_DATE = ["appointmentDate", "medicalDate", "resultDate", "expiryDate"] as const;
function toMedical(m: any): MedicalDto {
  return {
    id: m.id, code: m.code, candidateId: m.candidateId, candidateName: m.candidate?.fullName ?? "", candidateCode: m.candidate?.code ?? "",
    jobOrderId: m.jobOrderId, jobTitle: m.candidate?.jobOrder?.jobTitle ?? "", employerName: m.candidate?.employer?.name ?? "",
    medicalCenter: m.medicalCenter, appointmentDate: dstr(m.appointmentDate), medicalDate: dstr(m.medicalDate),
    resultDate: dstr(m.resultDate), expiryDate: dstr(m.expiryDate), status: m.status, documentRef: m.documentRef,
    remarks: m.remarks, createdAt: m.createdAt.toISOString(),
  };
}

export async function listMedical(_auth: AuthCtx, q: MedicalListQuery) {
  const page = q.page ?? 1, pageSize = q.pageSize ?? 20;
  const where: Prisma.MedicalProcessingWhereInput = {
    deletedAt: null, ...(q.status ? { status: q.status } : {}), ...(q.jobOrderId ? { jobOrderId: q.jobOrderId } : {}), ...(q.employerId ? { employerId: q.employerId } : {}),
    ...(q.q ? { OR: [{ code: { contains: q.q, mode: "insensitive" } }, { medicalCenter: { contains: q.q, mode: "insensitive" } }, { candidate: { fullName: { contains: q.q, mode: "insensitive" } } }] } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.medicalProcessing.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: withCand }),
    prisma.medicalProcessing.count({ where }),
  ]);
  return { items: items.map(toMedical), total, page, pageSize };
}

export async function createMedical(auth: AuthCtx, input: MedicalCreateInput) {
  const c = await loadCandidate(input.candidateId);
  if (!MED_CAND_OK.includes(c.status)) throw new HttpError(400, "InvalidStage", { message: `Candidate must be CONTRACTED or later to enter Medical (is ${c.status}).` });
  if (await prisma.medicalProcessing.findFirst({ where: { candidateId: c.id, deletedAt: null } })) throw new HttpError(409, "Exists", { message: "A medical record already exists for this candidate." });
  const m = await prisma.$transaction(async (tx) => {
    const n = await tx.medicalProcessing.count();
    return tx.medicalProcessing.create({ data: { code: `MED-${String(n + 1).padStart(5, "0")}`, candidateId: c.id, jobOrderId: c.jobOrderId, employerId: c.employerId, status: "PENDING", createdById: auth.userId, ...sset(input, MED_STR), ...dset(input, MED_DATE) }, include: withCand });
  });
  await advanceCandidate(c.id, "MEDICAL");
  return toMedical(m);
}

export async function updateMedical(_auth: AuthCtx, id: string, input: MedicalUpdateInput) {
  const cur = await prisma.medicalProcessing.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  const data: Record<string, unknown> = { ...sset(input, MED_STR), ...dset(input, MED_DATE) };
  if (input.status && input.status !== cur.status) {
    if (!canTransition(MED_TRANSITIONS, cur.status, input.status)) throw new HttpError(400, "InvalidTransition", { message: `Cannot move medical from ${cur.status} to ${input.status}.` });
    if (input.status === "FIT" && !(input.resultDate || cur.resultDate)) throw new HttpError(400, "MissingResultDate", { message: "FIT requires a result date." });
    if (input.status === "UNFIT" && !(input.remarks || cur.remarks)) throw new HttpError(400, "MissingRemarks", { message: "UNFIT requires remarks/reason." });
    data.status = input.status;
  }
  const m = await prisma.medicalProcessing.update({ where: { id }, data, include: withCand });
  return toMedical(m);
}

export async function archiveMedical(_auth: AuthCtx, id: string) {
  const cur = await prisma.medicalProcessing.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  await prisma.medicalProcessing.update({ where: { id }, data: { deletedAt: new Date() } });
  return { ok: true };
}

// ─── BMET ────────────────────────────────────────────────────────────────────
const BMET_CAND_OK = ["MEDICAL", "BMET", "VISA", "TICKETED", "DEPLOYED"];
const BMET_STR = ["registrationNo", "clearanceNo", "documentRef", "remarks"] as const;
const BMET_DATE = ["registrationDate", "clearanceDate", "expiryDate"] as const;
function toBmet(b: any): BmetDto {
  return {
    id: b.id, code: b.code, candidateId: b.candidateId, candidateName: b.candidate?.fullName ?? "", candidateCode: b.candidate?.code ?? "",
    jobOrderId: b.jobOrderId, jobTitle: b.candidate?.jobOrder?.jobTitle ?? "", employerName: b.candidate?.employer?.name ?? "",
    registrationNo: b.registrationNo, registrationDate: dstr(b.registrationDate), clearanceNo: b.clearanceNo,
    clearanceDate: dstr(b.clearanceDate), expiryDate: dstr(b.expiryDate), status: b.status, documentRef: b.documentRef,
    remarks: b.remarks, createdAt: b.createdAt.toISOString(),
  };
}

export async function listBmet(_auth: AuthCtx, q: BmetListQuery) {
  const page = q.page ?? 1, pageSize = q.pageSize ?? 20;
  const where: Prisma.BmetClearanceWhereInput = {
    deletedAt: null, ...(q.status ? { status: q.status } : {}), ...(q.jobOrderId ? { jobOrderId: q.jobOrderId } : {}), ...(q.employerId ? { employerId: q.employerId } : {}),
    ...(q.q ? { OR: [{ code: { contains: q.q, mode: "insensitive" } }, { registrationNo: { contains: q.q, mode: "insensitive" } }, { candidate: { fullName: { contains: q.q, mode: "insensitive" } } }] } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.bmetClearance.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: withCand }),
    prisma.bmetClearance.count({ where }),
  ]);
  return { items: items.map(toBmet), total, page, pageSize };
}

export async function createBmet(auth: AuthCtx, input: BmetCreateInput) {
  const c = await loadCandidate(input.candidateId);
  if (!BMET_CAND_OK.includes(c.status)) throw new HttpError(400, "InvalidStage", { message: `Candidate must have reached MEDICAL to enter BMET (is ${c.status}).` });
  if (await prisma.bmetClearance.findFirst({ where: { candidateId: c.id, deletedAt: null } })) throw new HttpError(409, "Exists", { message: "A BMET record already exists for this candidate." });
  const b = await prisma.$transaction(async (tx) => {
    const n = await tx.bmetClearance.count();
    return tx.bmetClearance.create({ data: { code: `BMET-${String(n + 1).padStart(5, "0")}`, candidateId: c.id, jobOrderId: c.jobOrderId, employerId: c.employerId, status: "PENDING", createdById: auth.userId, ...sset(input, BMET_STR), ...dset(input, BMET_DATE) }, include: withCand });
  });
  await advanceCandidate(c.id, "BMET");
  return toBmet(b);
}

export async function updateBmet(_auth: AuthCtx, id: string, input: BmetUpdateInput) {
  const cur = await prisma.bmetClearance.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  const data: Record<string, unknown> = { ...sset(input, BMET_STR), ...dset(input, BMET_DATE) };
  if (input.status && input.status !== cur.status) {
    if (!canTransition(BMET_TRANSITIONS, cur.status, input.status)) throw new HttpError(400, "InvalidTransition", { message: `Cannot move BMET from ${cur.status} to ${input.status}.` });
    if (input.status === "CLEARED" && !((input.registrationNo || cur.registrationNo) && (input.clearanceNo || cur.clearanceNo))) throw new HttpError(400, "MissingClearanceInfo", { message: "CLEARED requires registration + clearance numbers." });
    if (input.status === "REJECTED" && !(input.remarks || cur.remarks)) throw new HttpError(400, "MissingRemarks", { message: "REJECTED requires remarks/reason." });
    data.status = input.status;
  }
  const b = await prisma.bmetClearance.update({ where: { id }, data, include: withCand });
  return toBmet(b);
}

export async function archiveBmet(_auth: AuthCtx, id: string) {
  const cur = await prisma.bmetClearance.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  await prisma.bmetClearance.update({ where: { id }, data: { deletedAt: new Date() } });
  return { ok: true };
}

// ─── Manpower Visa (Module 6B-3) ─────────────────────────────────────────────
const VISA_CAND_OK = ["BMET", "VISA", "TICKETED", "DEPLOYED"];
const VISA_STR = ["visaNumber", "visaType", "sponsor", "documentRef", "remarks"] as const;
const VISA_DATE = ["issueDate", "expiryDate"] as const;
function toVisa(v: any): ManpowerVisaDto {
  return {
    id: v.id, code: v.code, candidateId: v.candidateId, candidateName: v.candidate?.fullName ?? "", candidateCode: v.candidate?.code ?? "",
    jobOrderId: v.jobOrderId, jobTitle: v.candidate?.jobOrder?.jobTitle ?? "", employerName: v.candidate?.employer?.name ?? "",
    visaNumber: v.visaNumber, visaType: v.visaType, sponsor: v.sponsor, issueDate: dstr(v.issueDate), expiryDate: dstr(v.expiryDate),
    status: v.status, documentRef: v.documentRef, remarks: v.remarks, createdAt: v.createdAt.toISOString(),
  };
}
export async function listVisa(_auth: AuthCtx, q: VisaListQuery) {
  const page = q.page ?? 1, pageSize = q.pageSize ?? 20;
  const where: Prisma.ManpowerVisaWhereInput = {
    deletedAt: null, ...(q.status ? { status: q.status } : {}), ...(q.jobOrderId ? { jobOrderId: q.jobOrderId } : {}), ...(q.employerId ? { employerId: q.employerId } : {}),
    ...(q.q ? { OR: [{ code: { contains: q.q, mode: "insensitive" } }, { visaNumber: { contains: q.q, mode: "insensitive" } }, { candidate: { fullName: { contains: q.q, mode: "insensitive" } } }] } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.manpowerVisa.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: withCand }),
    prisma.manpowerVisa.count({ where }),
  ]);
  return { items: items.map(toVisa), total, page, pageSize };
}
export async function createVisa(auth: AuthCtx, input: VisaCreateInput) {
  const c = await loadCandidate(input.candidateId);
  if (!VISA_CAND_OK.includes(c.status)) throw new HttpError(400, "InvalidStage", { message: `Candidate must have reached BMET to enter Visa (is ${c.status}).` });
  if (await prisma.manpowerVisa.findFirst({ where: { candidateId: c.id, deletedAt: null } })) throw new HttpError(409, "Exists", { message: "A visa record already exists for this candidate." });
  const v = await prisma.$transaction(async (tx) => {
    const n = await tx.manpowerVisa.count();
    return tx.manpowerVisa.create({ data: { code: `VISA-${String(n + 1).padStart(5, "0")}`, candidateId: c.id, jobOrderId: c.jobOrderId, employerId: c.employerId, status: "PENDING", createdById: auth.userId, ...sset(input, VISA_STR), ...dset(input, VISA_DATE) }, include: withCand });
  });
  await advanceCandidate(c.id, "VISA");
  return toVisa(v);
}
export async function updateVisa(_auth: AuthCtx, id: string, input: VisaUpdateInput) {
  const cur = await prisma.manpowerVisa.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  const data: Record<string, unknown> = { ...sset(input, VISA_STR), ...dset(input, VISA_DATE) };
  if (input.status && input.status !== cur.status) {
    if (!canTransition(VISA_TRANSITIONS, cur.status, input.status)) throw new HttpError(400, "InvalidTransition", { message: `Cannot move visa from ${cur.status} to ${input.status}.` });
    if (input.status === "APPROVED" && !((input.visaNumber || cur.visaNumber) && (input.issueDate || cur.issueDate))) throw new HttpError(400, "MissingVisaInfo", { message: "APPROVED requires visa number + issue date." });
    if (input.status === "REJECTED" && !(input.remarks || cur.remarks)) throw new HttpError(400, "MissingRemarks", { message: "REJECTED requires remarks/reason." });
    data.status = input.status;
  }
  const v = await prisma.manpowerVisa.update({ where: { id }, data, include: withCand });
  if (data.status === "APPROVED") await advanceCandidate(cur.candidateId, "VISA");
  return toVisa(v);
}
export async function archiveVisa(_auth: AuthCtx, id: string) {
  const cur = await prisma.manpowerVisa.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  await prisma.manpowerVisa.update({ where: { id }, data: { deletedAt: new Date() } });
  return { ok: true };
}

// ─── Manpower Deployment (Module 6B-3) ───────────────────────────────────────
const DEP_STR = ["ticketRef", "flightNo", "departureAirport", "destination", "remarks"] as const;
const DEP_DATE = ["departureDate", "arrivalDate"] as const;
function toDeployment(d: any): ManpowerDeploymentDto {
  return {
    id: d.id, code: d.code, candidateId: d.candidateId, candidateName: d.candidate?.fullName ?? "", candidateCode: d.candidate?.code ?? "",
    jobOrderId: d.jobOrderId, jobTitle: d.candidate?.jobOrder?.jobTitle ?? "", employerName: d.candidate?.employer?.name ?? "",
    ticketRef: d.ticketRef, flightNo: d.flightNo, departureAirport: d.departureAirport, destination: d.destination,
    departureDate: dstr(d.departureDate), arrivalDate: dstr(d.arrivalDate), status: d.status, remarks: d.remarks, createdAt: d.createdAt.toISOString(),
  };
}
export async function listDeployment(_auth: AuthCtx, q: DeploymentListQuery) {
  const page = q.page ?? 1, pageSize = q.pageSize ?? 20;
  const where: Prisma.ManpowerDeploymentWhereInput = {
    deletedAt: null, ...(q.status ? { status: q.status } : {}), ...(q.jobOrderId ? { jobOrderId: q.jobOrderId } : {}), ...(q.employerId ? { employerId: q.employerId } : {}),
    ...(q.q ? { OR: [{ code: { contains: q.q, mode: "insensitive" } }, { ticketRef: { contains: q.q, mode: "insensitive" } }, { candidate: { fullName: { contains: q.q, mode: "insensitive" } } }] } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.manpowerDeployment.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: withCand }),
    prisma.manpowerDeployment.count({ where }),
  ]);
  return { items: items.map(toDeployment), total, page, pageSize };
}
export async function createDeployment(auth: AuthCtx, input: DeploymentCreateInput) {
  const c = await loadCandidate(input.candidateId);
  const visa = await prisma.manpowerVisa.findFirst({ where: { candidateId: c.id, deletedAt: null } });
  if (!visa || visa.status !== "APPROVED") throw new HttpError(400, "NoApprovedVisa", { message: "Candidate needs an APPROVED visa before deployment." });
  if (await prisma.manpowerDeployment.findFirst({ where: { candidateId: c.id, deletedAt: null } })) throw new HttpError(409, "Exists", { message: "Candidate is already in deployment (cannot deploy twice)." });
  const d = await prisma.$transaction(async (tx) => {
    const n = await tx.manpowerDeployment.count();
    return tx.manpowerDeployment.create({ data: { code: `DEP-${String(n + 1).padStart(5, "0")}`, candidateId: c.id, jobOrderId: c.jobOrderId, employerId: c.employerId, status: "PENDING", createdById: auth.userId, ...sset(input, DEP_STR), ...dset(input, DEP_DATE) }, include: withCand });
  });
  return toDeployment(d);
}
export async function updateDeployment(_auth: AuthCtx, id: string, input: DeploymentUpdateInput) {
  const cur = await prisma.manpowerDeployment.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  const data: Record<string, unknown> = { ...sset(input, DEP_STR), ...dset(input, DEP_DATE) };
  if (input.status && input.status !== cur.status) {
    if (!canTransition(DEPLOY_TRANSITIONS, cur.status, input.status)) throw new HttpError(400, "InvalidTransition", { message: `Cannot move deployment from ${cur.status} to ${input.status}.` });
    if ((input.status === "TICKETED" || input.status === "READY") && !(input.ticketRef || cur.ticketRef)) throw new HttpError(400, "MissingTicket", { message: "A ticket/reference is required before TICKETED/READY." });
    if (input.status === "DEPLOYED" && !(input.departureDate || cur.departureDate || input.departureAirport || cur.departureAirport)) throw new HttpError(400, "MissingDeparture", { message: "DEPLOYED requires departure information." });
    if (input.status === "CANCELLED" && !(input.remarks || cur.remarks)) throw new HttpError(400, "MissingRemarks", { message: "CANCELLED requires a reason." });
    data.status = input.status;
  }
  const d = await prisma.manpowerDeployment.update({ where: { id }, data, include: withCand });
  if (data.status === "TICKETED") await advanceCandidate(cur.candidateId, "TICKETED");
  if (data.status === "DEPLOYED") await advanceCandidate(cur.candidateId, "DEPLOYED");
  return toDeployment(d);
}
export async function archiveDeployment(_auth: AuthCtx, id: string) {
  const cur = await prisma.manpowerDeployment.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  await prisma.manpowerDeployment.update({ where: { id }, data: { deletedAt: new Date() } });
  return { ok: true };
}
