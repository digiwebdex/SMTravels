/**
 * Passport / document OCR — extract (Vision), correct, apply to entities.
 * Apply is authoritative persistence (Customer / Traveler / Document), not draft-only.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { absoluteStorePath } from "../lib/uploads";
import { AuthCtx, branchWhere, isGlobalRole, resolveBranchId } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";
import { blindIndex } from "../lib/pii";
import type { DocumentOcrDetailDto, DocumentOcrResultDto, OcrApplyInput, OcrApplyResult, OcrCorrectInput } from "../contracts/ocr.contract";
import {
  extractTextFromFile,
  parsePassportFields,
  mapOcrToFormDraft,
} from "./googleVision.service";

function scopedWhere(auth: AuthCtx): Prisma.DocumentWhereInput {
  if (isGlobalRole(auth.role)) return { deletedAt: null };
  const bw = branchWhere(auth);
  return {
    deletedAt: null,
    OR: [
      { booking: { ...bw, deletedAt: null } },
      { traveler: { booking: { ...bw, deletedAt: null } } },
      { customer: { ...bw, deletedAt: null } },
      { supplier: { deletedAt: null } },
    ],
  };
}

const dOnly = (d: Date | null | undefined): string | null =>
  d ? d.toISOString().slice(0, 10) : null;

function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function pickField(fields: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = str(fields[k]);
    if (v) return v;
  }
  return null;
}

function normalizeGender(g: string | null): "MALE" | "FEMALE" | null {
  if (!g) return null;
  const u = g.toUpperCase();
  if (u.startsWith("F") || u === "FEMALE") return "FEMALE";
  if (u.startsWith("M") || u === "MALE") return "MALE";
  return null;
}

function confidenceInt(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v > 0 && v <= 1) return Math.round(v * 100);
    return Math.max(0, Math.min(100, Math.round(v)));
  }
  return 0;
}

export interface ParsedOcrFields {
  passportNo: string | null;
  name: string | null;
  dob: Date | null;
  expiry: Date | null;
  issue: Date | null;
  nationality: string | null;
  gender: string | null;
  issueCountry: string | null;
  mrz: string | null;
  confidence: number;
}

export function parsePassportLikeText(raw: string): ParsedOcrFields {
  const p = parsePassportFields(raw);
  return {
    passportNo: p.passportNo,
    name: p.name,
    dob: p.dob,
    expiry: p.expiry,
    issue: p.issue,
    nationality: p.nationality,
    gender: p.gender,
    issueCountry: p.nationality, // MRZ issuing state often matches nationality code
    mrz: p.mrz,
    confidence: p.confidence,
  };
}

function originalSnapshot(parsed: ParsedOcrFields): Record<string, unknown> {
  return {
    fullName: parsed.name,
    passportNumber: parsed.passportNo,
    dateOfBirth: dOnly(parsed.dob),
    dateOfExpiry: dOnly(parsed.expiry),
    dateOfIssue: dOnly(parsed.issue),
    nationality: parsed.nationality,
    gender: parsed.gender,
    issueCountry: parsed.issueCountry,
    mrz: parsed.mrz,
    confidence: parsed.confidence,
  };
}

function toOcrDetail(d: {
  id: string;
  name: string;
  type: string;
  status: string;
  filePath: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  bookingId: string | null;
  travelerId: string | null;
  customerId: string | null;
  uploadedById: string | null;
  ocrStatus: string | null;
  ocrConfidence: number | null;
  ocrName: string | null;
  ocrPassportNo: string | null;
  ocrDob: Date | null;
  ocrExpiry: Date | null;
  ocrNationality: string | null;
  ocrGender: string | null;
  ocrIssueCountry: string | null;
  ocrMrz: string | null;
  ocrOriginalFields: Prisma.JsonValue | null;
  ocrCorrectedFields: Prisma.JsonValue | null;
  ocrReviewedById: string | null;
  ocrReviewedAt: Date | null;
  ocrAppliedAt: Date | null;
  createdAt: Date;
  booking?: { bookingNo: string | null } | null;
  customer?: { name: string } | null;
  traveler?: { name: string } | null;
}): DocumentOcrDetailDto {
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    status: d.status,
    hasFile: !!d.filePath,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    bookingId: d.bookingId,
    bookingNo: d.booking?.bookingNo ?? null,
    travelerId: d.travelerId,
    travelerName: d.traveler?.name ?? null,
    customerId: d.customerId,
    customerName: d.customer?.name ?? null,
    uploadedById: d.uploadedById,
    ocrStatus: d.ocrStatus,
    ocrConfidence: d.ocrConfidence,
    ocrName: d.ocrName,
    ocrPassportNo: d.ocrPassportNo,
    ocrDob: dOnly(d.ocrDob),
    ocrExpiry: dOnly(d.ocrExpiry),
    ocrNationality: d.ocrNationality,
    ocrGender: d.ocrGender,
    ocrIssueCountry: d.ocrIssueCountry,
    ocrMrz: d.ocrMrz,
    ocrOriginalFields: (d.ocrOriginalFields as Record<string, unknown> | null) ?? null,
    ocrCorrectedFields: (d.ocrCorrectedFields as Record<string, { original: string | null; corrected: string }>) ?? null,
    ocrReviewedById: d.ocrReviewedById,
    ocrReviewedAt: d.ocrReviewedAt ? d.ocrReviewedAt.toISOString() : null,
    ocrAppliedAt: d.ocrAppliedAt ? d.ocrAppliedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  };
}

const detailSelect = {
  id: true,
  name: true,
  type: true,
  status: true,
  filePath: true,
  mimeType: true,
  sizeBytes: true,
  bookingId: true,
  travelerId: true,
  customerId: true,
  uploadedById: true,
  ocrStatus: true,
  ocrConfidence: true,
  ocrName: true,
  ocrPassportNo: true,
  ocrDob: true,
  ocrExpiry: true,
  ocrNationality: true,
  ocrGender: true,
  ocrIssueCountry: true,
  ocrMrz: true,
  ocrOriginalFields: true,
  ocrCorrectedFields: true,
  ocrReviewedById: true,
  ocrReviewedAt: true,
  ocrAppliedAt: true,
  createdAt: true,
  booking: { select: { bookingNo: true } },
  customer: { select: { name: true } },
  traveler: { select: { name: true } },
} as const;

export async function runOcrOnDocument(
  auth: AuthCtx,
  documentId: string,
  ip?: string | null,
): Promise<DocumentOcrResultDto> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, ...scopedWhere(auth) },
    select: { id: true, filePath: true, mimeType: true, name: true },
  });
  if (!doc?.filePath) {
    throw new HttpError(404, "NotFound", { detail: "Document file not found." });
  }

  const absPath = absoluteStorePath(doc.filePath);
  const mimeType = doc.mimeType ?? "application/octet-stream";
  const text = await extractTextFromFile(absPath, mimeType);
  const parsed = parsePassportLikeText(text);
  const snap = originalSnapshot(parsed);

  logger.info({
    documentId,
    confidence: parsed.confidence,
    fieldCount: [parsed.passportNo, parsed.name, parsed.dob, parsed.expiry, parsed.nationality, parsed.mrz].filter(Boolean).length,
  }, "OCR completed");

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      ocrStatus: "COMPLETED",
      ocrConfidence: parsed.confidence,
      ocrName: parsed.name,
      ocrPassportNo: parsed.passportNo,
      ocrDob: parsed.dob,
      ocrExpiry: parsed.expiry,
      ocrNationality: parsed.nationality,
      ocrGender: parsed.gender,
      ocrIssueCountry: parsed.issueCountry,
      ocrMrz: parsed.mrz,
      ocrOriginalFields: snap as Prisma.InputJsonValue,
      ocrCorrectedFields: Prisma.JsonNull,
      ocrReviewedById: null,
      ocrReviewedAt: null,
      ocrAppliedAt: null,
      status: "PENDING",
      expiryAt: parsed.expiry ?? undefined,
    },
    select: {
      id: true,
      name: true,
      ocrStatus: true,
      ocrConfidence: true,
      ocrName: true,
      ocrPassportNo: true,
      ocrDob: true,
      ocrExpiry: true,
      ocrNationality: true,
      ocrGender: true,
      ocrIssueCountry: true,
      ocrMrz: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: auth.userId,
      action: "DOCUMENT_OCR_RUN",
      target: documentId,
      module: "documents",
    },
  });

  void audit({
    event: "DOCUMENT_OCR_RUN",
    userId: auth.userId,
    ip: ip ?? null,
    resource: "documents",
    detail: `document=${documentId} confidence=${parsed.confidence}`,
  });

  return {
    id: updated.id,
    name: updated.name,
    ocrStatus: updated.ocrStatus,
    ocrConfidence: updated.ocrConfidence,
    ocrName: updated.ocrName,
    ocrPassportNo: updated.ocrPassportNo,
    ocrDob: dOnly(updated.ocrDob),
    ocrExpiry: dOnly(updated.ocrExpiry),
    ocrNationality: updated.ocrNationality,
    ocrGender: updated.ocrGender,
    ocrIssueCountry: updated.ocrIssueCountry,
    ocrMrz: updated.ocrMrz,
  };
}

export async function getDocumentOcr(auth: AuthCtx, documentId: string): Promise<DocumentOcrDetailDto> {
  const d = await prisma.document.findFirst({
    where: { id: documentId, ...scopedWhere(auth) },
    select: detailSelect,
  });
  if (!d) throw new HttpError(404, "NotFound");
  return toOcrDetail(d);
}

export async function listOcrPending(auth: AuthCtx, page = 1, pageSize = 20): Promise<{ data: DocumentOcrDetailDto[]; total: number }> {
  const where: Prisma.DocumentWhereInput = {
    ...scopedWhere(auth),
    ocrStatus: { in: ["COMPLETED", "CORRECTED", "APPLIED"] },
  };
  const [total, rows] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      select: detailSelect,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { data: rows.map(toOcrDetail), total };
}

export async function listOcrHistory(auth: AuthCtx, page = 1, pageSize = 30): Promise<{
  data: { id: string; action: string; target: string | null; userId: string | null; createdAt: string }[];
  total: number;
}> {
  void auth; // company-wide audit trail (permission-gated at route)
  const where: Prisma.ActivityLogWhereInput = {
    module: "documents",
    action: { in: ["DOCUMENT_OCR_RUN", "OCR_CORRECTED", "OCR_APPLIED", "OCR_APPROVED", "OCR_REJECTED"] },
  };
  const [total, rows] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, action: true, target: true, userId: true, createdAt: true },
    }),
  ]);
  return {
    data: rows.map((r) => ({
      id: r.id,
      action: r.action,
      target: r.target,
      userId: r.userId,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}

/** Save reviewer corrections on a document's OCR fields. */
export async function correctDocumentOcr(
  auth: AuthCtx,
  documentId: string,
  input: OcrCorrectInput,
  ip?: string | null,
): Promise<DocumentOcrDetailDto> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, ...scopedWhere(auth) },
    select: {
      id: true,
      ocrName: true,
      ocrPassportNo: true,
      ocrDob: true,
      ocrExpiry: true,
      ocrNationality: true,
      ocrGender: true,
      ocrIssueCountry: true,
      ocrMrz: true,
      ocrOriginalFields: true,
      ocrCorrectedFields: true,
    },
  });
  if (!doc) throw new HttpError(404, "NotFound");

  const corrections: Record<string, { original: string | null; corrected: string }> =
    (doc.ocrCorrectedFields as Record<string, { original: string | null; corrected: string }> | null) ?? {};

  const data: Prisma.DocumentUpdateInput = {
    ocrStatus: "CORRECTED",
    ocrReviewedById: auth.userId,
    ocrReviewedAt: new Date(),
  };

  const setCorrection = (key: string, original: string | null, corrected: string) => {
    if (original === corrected) return;
    corrections[key] = { original, corrected };
  };

  if (input.fields.fullName !== undefined) {
    const v = str(input.fields.fullName) ?? "";
    setCorrection("fullName", doc.ocrName, v);
    data.ocrName = v || null;
  }
  if (input.fields.passportNumber !== undefined || input.fields.passportNo !== undefined) {
    const v = str(input.fields.passportNumber) ?? str(input.fields.passportNo) ?? "";
    setCorrection("passportNumber", doc.ocrPassportNo, v);
    data.ocrPassportNo = v || null;
  }
  if (input.fields.dateOfBirth !== undefined) {
    const v = str(input.fields.dateOfBirth);
    setCorrection("dateOfBirth", dOnly(doc.ocrDob), v ?? "");
    data.ocrDob = toDate(v);
  }
  if (input.fields.dateOfExpiry !== undefined || input.fields.expiryDate !== undefined) {
    const v = str(input.fields.dateOfExpiry) ?? str(input.fields.expiryDate);
    setCorrection("dateOfExpiry", dOnly(doc.ocrExpiry), v ?? "");
    data.ocrExpiry = toDate(v);
    data.expiryAt = toDate(v);
  }
  if (input.fields.nationality !== undefined) {
    const v = str(input.fields.nationality) ?? "";
    setCorrection("nationality", doc.ocrNationality, v);
    data.ocrNationality = v || null;
  }
  if (input.fields.gender !== undefined) {
    const v = normalizeGender(str(input.fields.gender)) ?? str(input.fields.gender) ?? "";
    setCorrection("gender", doc.ocrGender, v);
    data.ocrGender = v || null;
  }
  if (input.fields.issueCountry !== undefined) {
    const v = str(input.fields.issueCountry) ?? "";
    setCorrection("issueCountry", doc.ocrIssueCountry, v);
    data.ocrIssueCountry = v || null;
  }
  if (input.fields.mrz !== undefined) {
    const v = str(input.fields.mrz) ?? "";
    setCorrection("mrz", doc.ocrMrz, v);
    data.ocrMrz = v || null;
  }

  data.ocrCorrectedFields = corrections as Prisma.InputJsonValue;

  await prisma.document.update({ where: { id: documentId }, data });
  await prisma.activityLog.create({
    data: {
      userId: auth.userId,
      action: "OCR_CORRECTED",
      target: documentId,
      module: "documents",
    },
  });
  void audit({
    event: "OCR_CORRECTED",
    userId: auth.userId,
    ip: ip ?? null,
    resource: "documents",
    detail: `document=${documentId} fields=${Object.keys(corrections).join(",")}`,
  });

  return getDocumentOcr(auth, documentId);
}

/**
 * Persist OCR fields onto Customer / Traveler / Document.
 * Dedupes customers by passport blind-index. Links document to owner.
 */
export async function applyOcr(
  auth: AuthCtx,
  input: OcrApplyInput,
  ip?: string | null,
): Promise<OcrApplyResult> {
  const fields = { ...input.fields };
  if (input.correctedFields) {
    for (const [k, v] of Object.entries(input.correctedFields)) {
      if (v != null && String(v).trim()) fields[k] = String(v).trim();
    }
  }

  const draft = mapOcrToFormDraft(input.target, fields);
  const name = pickField(fields, "fullName", "name", "passengerName", "guestName") ?? str(draft.name);
  const passportNo = pickField(fields, "passportNumber", "passportNo") ?? str(draft.passportNo);
  const dob = pickField(fields, "dateOfBirth", "dob") ?? str(draft.dob);
  const expiry = pickField(fields, "dateOfExpiry", "expiryDate", "passportExpiry");
  const nationality = pickField(fields, "nationality") ?? str(draft.nationality);
  const gender = normalizeGender(pickField(fields, "gender") ?? str(draft.gender));
  const issueCountry = pickField(fields, "issueCountry", "issuingCountry", "placeOfBirth");
  const mrz = pickField(fields, "mrz");
  const confidence = confidenceInt(fields.confidence);

  let customerId = input.customerId ?? null;
  let travelerId = input.travelerId ?? null;
  let bookingId = input.bookingId ?? null;
  let documentId = input.documentId ?? null;
  let createdCustomer = false;
  let updatedCustomer = false;
  let updatedTraveler = false;

  // Resolve document links
  if (documentId) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, ...scopedWhere(auth) },
      select: { id: true, customerId: true, travelerId: true, bookingId: true, ocrConfidence: true },
    });
    if (!doc) throw new HttpError(404, "DocumentNotFound");
    customerId = customerId ?? doc.customerId;
    travelerId = travelerId ?? doc.travelerId;
    bookingId = bookingId ?? doc.bookingId;
  }

  if (input.target === "customer" || input.target === "traveler" || input.createCustomer) {
    // Dedupe by passport hash
    if (!customerId && passportNo) {
      const hash = blindIndex(passportNo);
      const existing = await prisma.customer.findFirst({
        where: { passportHash: hash, deletedAt: null, ...branchWhere(auth) },
        select: { id: true },
      });
      if (existing) customerId = existing.id;
    }

    if (customerId) {
      const existing = await prisma.customer.findFirst({
        where: { id: customerId, deletedAt: null, ...branchWhere(auth) },
        select: { id: true },
      });
      if (!existing) throw new HttpError(404, "CustomerNotFound");
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          ...(name ? { name } : {}),
          ...(passportNo ? { passportNo } : {}),
          ...(dob ? { dob: toDate(dob) } : {}),
          ...(expiry ? { passportExpiry: toDate(expiry) } : {}),
          ...(nationality ? { nationality, country: nationality } : {}),
        },
      });
      updatedCustomer = true;
    } else if (input.createCustomer !== false && (input.target === "customer" || input.createCustomer)) {
      const phone = str(input.phone);
      if (!phone) throw new HttpError(400, "PhoneRequired", { detail: "phone is required to create a customer from OCR." });
      if (!name) throw new HttpError(400, "NameRequired", { detail: "OCR did not extract a name; correct it before Apply." });
      const branchId = resolveBranchId(auth, input.branchId);
      const dupPhone = await prisma.customer.findFirst({ where: { phone, deletedAt: null }, select: { id: true } });
      if (dupPhone) {
        customerId = dupPhone.id;
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            name,
            ...(passportNo ? { passportNo } : {}),
            ...(dob ? { dob: toDate(dob) } : {}),
            ...(expiry ? { passportExpiry: toDate(expiry) } : {}),
            ...(nationality ? { nationality, country: nationality } : {}),
          },
        });
        updatedCustomer = true;
      } else {
        const c = await prisma.customer.create({
          data: {
            branchId,
            name,
            phone,
            passportNo: passportNo || null,
            dob: toDate(dob),
            passportExpiry: toDate(expiry),
            nationality: nationality || null,
            country: nationality || "Bangladesh",
            createdById: auth.userId,
          },
        });
        customerId = c.id;
        createdCustomer = true;
      }
    }
  }

  if (input.target === "traveler" || travelerId) {
    if (!travelerId) throw new HttpError(400, "TravelerRequired", { detail: "travelerId is required to apply OCR to a traveler." });
    const t = await prisma.traveler.findFirst({
      where: { id: travelerId, deletedAt: null },
      include: { booking: { select: { id: true, branchId: true, deletedAt: true } } },
    });
    if (!t || t.booking.deletedAt) throw new HttpError(404, "TravelerNotFound");
    if (!isGlobalRole(auth.role) && auth.branchId && t.booking.branchId !== auth.branchId) {
      throw new HttpError(404, "TravelerNotFound");
    }
    await prisma.traveler.update({
      where: { id: travelerId },
      data: {
        ...(name ? { name } : {}),
        ...(passportNo ? { passportNo } : {}),
        ...(dob ? { dob: toDate(dob) } : {}),
        ...(expiry ? { passportExpiry: toDate(expiry) } : {}),
        ...(nationality ? { nationality } : {}),
        ...(gender ? { gender } : {}),
      },
    });
    updatedTraveler = true;
    bookingId = bookingId ?? t.bookingId;
  }

  // Booking autofill: update primary traveler when bookingId given without travelerId
  if (input.target === "booking" && bookingId && !travelerId) {
    const primary = await prisma.traveler.findFirst({
      where: { bookingId, deletedAt: null },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    if (primary) {
      await prisma.traveler.update({
        where: { id: primary.id },
        data: {
          ...(name ? { name } : {}),
          ...(passportNo ? { passportNo } : {}),
          ...(dob ? { dob: toDate(dob) } : {}),
          ...(expiry ? { passportExpiry: toDate(expiry) } : {}),
          ...(nationality ? { nationality } : {}),
          ...(gender ? { gender } : {}),
        },
      });
      travelerId = primary.id;
      updatedTraveler = true;
    }
  }

  if (documentId) {
    const corrections: Record<string, { original: string | null; corrected: string }> = {};
    if (input.correctedFields) {
      for (const [k, v] of Object.entries(input.correctedFields)) {
        if (v != null) corrections[k] = { original: str(input.fields[k]), corrected: String(v) };
      }
    }
    await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrStatus: "APPLIED",
        ocrConfidence: confidence || undefined,
        ocrName: name,
        ocrPassportNo: passportNo,
        ocrDob: toDate(dob),
        ocrExpiry: toDate(expiry),
        ocrNationality: nationality,
        ocrGender: gender,
        ocrIssueCountry: issueCountry,
        ocrMrz: mrz,
        ...(Object.keys(corrections).length
          ? { ocrCorrectedFields: corrections as Prisma.InputJsonValue }
          : {}),
        ocrReviewedById: auth.userId,
        ocrReviewedAt: new Date(),
        ocrAppliedAt: new Date(),
        expiryAt: toDate(expiry),
        status: "VERIFIED",
        verifiedById: auth.userId,
        ...(customerId ? { customerId, ownerType: "CUSTOMER" as const } : {}),
        ...(travelerId && !customerId ? { travelerId } : {}),
        ...(bookingId && !customerId && !travelerId ? { bookingId } : {}),
        // Prefer linking all available FKs without changing ownerType incorrectly:
        ...(customerId
          ? { customerId }
          : travelerId
            ? { travelerId, ...(bookingId ? { bookingId } : {}) }
            : bookingId
              ? { bookingId }
              : {}),
      },
    });

    // If both customer and booking/traveler — keep FKs for Document Center links
    if (customerId || travelerId || bookingId) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          ...(customerId ? { customerId } : {}),
          ...(travelerId ? { travelerId } : {}),
          ...(bookingId ? { bookingId } : {}),
          ownerType: customerId ? "CUSTOMER" : travelerId ? "TRAVELER" : "BOOKING",
        },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      userId: auth.userId,
      action: "OCR_APPLIED",
      target: documentId ?? customerId ?? travelerId ?? bookingId ?? "ocr",
      module: "documents",
    },
  });
  void audit({
    event: "OCR_APPLIED",
    userId: auth.userId,
    ip: ip ?? null,
    resource: "documents",
    detail: `target=${input.target} customer=${customerId ?? "-"} traveler=${travelerId ?? "-"} doc=${documentId ?? "-"} confidence=${confidence}`,
  });

  return {
    draft,
    persisted: true,
    createdCustomer,
    updatedCustomer,
    updatedTraveler,
    customerId,
    travelerId,
    bookingId,
    documentId,
    confidence,
    fields: {
      name,
      passportNo,
      dateOfBirth: dob,
      dateOfExpiry: expiry,
      nationality,
      gender,
      issueCountry,
      mrz,
    },
  };
}
