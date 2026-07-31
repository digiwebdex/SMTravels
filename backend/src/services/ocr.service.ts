/**
 * Document OCR for passport / identity documents.
 * Uses googleVision.service (Service Account + official Vision SDK).
 * Extracted PII is stored on the Document row (ocrPassportNo encrypted at rest).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { absoluteStorePath } from "../lib/uploads";
import { AuthCtx, branchWhere, isGlobalRole } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";
import type { DocumentOcrResultDto } from "../contracts/document.contract";
import {
  extractTextFromFile,
  parsePassportFields,
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

export interface ParsedOcrFields {
  passportNo: string | null;
  name: string | null;
  dob: Date | null;
  expiry: Date | null;
  nationality: string | null;
  confidence: number;
}

/** Heuristic passport-field extraction from Vision OCR plain text. */
export function parsePassportLikeText(raw: string): ParsedOcrFields {
  const p = parsePassportFields(raw);
  return {
    passportNo: p.passportNo,
    name: p.name,
    dob: p.dob,
    expiry: p.expiry,
    nationality: p.nationality,
    confidence: p.confidence,
  };
}

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

  logger.info({ documentId, confidence: parsed.confidence, fieldCount: [
    parsed.passportNo, parsed.name, parsed.dob, parsed.expiry, parsed.nationality,
  ].filter(Boolean).length }, "OCR completed");

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
      status: "PENDING",
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
  };
}
