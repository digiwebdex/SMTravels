/**
 * Google Cloud Vision OCR for passport / identity documents.
 * Files are read from the server upload volume; extracted PII is stored on the
 * Document row (ocrPassportNo is encrypted at rest via prisma $extends).
 */
import fs from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { absoluteStorePath } from "../lib/uploads";
import { AuthCtx, branchWhere, isGlobalRole } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";
import type { DocumentOcrResultDto } from "../contracts/document.contract";

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

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
  const text = raw.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const upper = text.toUpperCase();

  let passportNo: string | null = null;
  let name: string | null = null;
  let dob: Date | null = null;
  let expiry: Date | null = null;
  let nationality: string | null = null;
  let hits = 0;

  const labelValue = (labels: RegExp[]): string | null => {
    for (const line of lines) {
      for (const re of labels) {
        const m = line.match(re);
        if (m?.[1]) return m[1].trim();
      }
    }
    for (let i = 0; i < lines.length - 1; i++) {
      for (const re of labels) {
        const bare = re.source.replace(/^\(\?:/, "").replace(/\)\[\^\\n\]\+\$/, "").replace(/\\s\[\^\\n\]\+\$/, "");
        try {
          const keyRe = new RegExp(bare, "i");
          if (keyRe.test(lines[i])) {
            const next = lines[i + 1]?.trim();
            if (next && next.length >= 2) return next;
          }
        } catch {
          /* skip malformed fallback */
        }
      }
    }
    return null;
  };

  passportNo =
    labelValue([
      /(?:passport\s*(?:no\.?|number|#)|\bno\.?\s*[:.]?\s*)([A-Z0-9][A-Z0-9\s]{5,11})/i,
    ]) ??
    (() => {
      const mrz = lines.find((l) => l.replace(/\s/g, "").length >= 30 && /^[A-Z0-9<]+$/.test(l.replace(/\s/g, "")));
      if (!mrz) return null;
      const compact = mrz.replace(/\s/g, "");
      const candidate = compact.slice(0, 9).replace(/</g, "").trim();
      return candidate.length >= 6 ? candidate : null;
    })();

  const surname = labelValue([/(?:surname|last\s*name)\s*[:.]?\s*(.+)$/i]);
  const given = labelValue([/(?:given\s*names?|first\s*name)\s*[:.]?\s*(.+)$/i]);
  if (surname || given) name = [given, surname].filter(Boolean).join(" ").trim() || null;

  if (!name) {
    const mrzName = lines.find((l) => /^P<[A-Z]{3}/.test(l.replace(/\s/g, "")));
    if (mrzName) {
      const compact = mrzName.replace(/\s/g, "");
      const parts = compact.slice(5).split("<<");
      const sn = parts[0]?.replace(/</g, " ").trim();
      const gn = parts[1]?.replace(/</g, " ").trim();
      if (sn || gn) name = [gn, sn].filter(Boolean).join(" ").trim() || null;
    }
  }

  nationality =
    labelValue([/(?:nationality|country\s*code)\s*[:.]?\s*([A-Za-z\s]{3,20})/i]) ??
    (() => {
      const m = upper.match(/\b(BANGLADESHI|BANGLADESH|BD)\b/);
      return m ? "BANGLADESHI" : null;
    })();

  const parseHumanDate = (s: string): Date | null => {
    const m1 = s.match(/(\d{1,2})[\s/.-]([A-Za-z]{3}|\d{1,2})[\s/.-](\d{2,4})/);
    if (!m1) return null;
    const day = Number(m1[1]);
    let month: number;
    let year = Number(m1[3]);
    if (/^\d+$/.test(m1[2])) {
      month = Number(m1[2]) - 1;
    } else {
      month = MONTHS[m1[2].slice(0, 3).toUpperCase()] ?? -1;
    }
    if (year < 100) year += year >= 50 ? 1900 : 2000;
    if (month < 0 || day < 1 || day > 31) return null;
    return new Date(Date.UTC(year, month, day));
  };

  const parseMrzDate = (yyMMdd: string): Date | null => {
    if (!/^\d{6}$/.test(yyMMdd)) return null;
    const yy = Number(yyMMdd.slice(0, 2));
    const mm = Number(yyMMdd.slice(2, 4)) - 1;
    const dd = Number(yyMMdd.slice(4, 6));
    const year = yy >= 50 ? 1900 + yy : 2000 + yy;
    if (mm < 0 || mm > 11 || dd < 1 || dd > 31) return null;
    return new Date(Date.UTC(year, mm, dd));
  };

  const dobStr = labelValue([/(?:date\s*of\s*birth|dob|birth\s*date)\s*[:.]?\s*(.+)$/i]);
  if (dobStr) dob = parseHumanDate(dobStr);

  const expStr = labelValue([/(?:date\s*of\s*expir(?:y|ation)|expir(?:y|es)|valid\s*until)\s*[:.]?\s*(.+)$/i]);
  if (expStr) expiry = parseHumanDate(expStr);

  const mrz2 = lines.find((l) => {
    const c = l.replace(/\s/g, "");
    return c.length >= 28 && /^\d/.test(c) && c.includes("<");
  });
  if (mrz2) {
    const c = mrz2.replace(/\s/g, "");
    if (!dob) dob = parseMrzDate(c.slice(13, 19));
    if (!expiry) expiry = parseMrzDate(c.slice(21, 27));
    if (!passportNo) {
      const pn = c.slice(0, 9).replace(/</g, "").trim();
      if (pn.length >= 6) passportNo = pn;
    }
    if (!nationality && c.length >= 12) nationality = c.slice(10, 13).replace(/</g, "") || null;
  }

  if (passportNo) hits++;
  if (name) hits++;
  if (dob) hits++;
  if (expiry) hits++;
  if (nationality) hits++;

  const confidence = Math.min(98, Math.max(35, hits * 18 + (text.length > 80 ? 10 : 0)));

  return { passportNo, name, dob, expiry, nationality, confidence };
}

interface VisionResponse {
  responses?: Array<{
    fullTextAnnotation?: { text?: string };
    textAnnotations?: Array<{ description?: string }>;
    error?: { message?: string };
  }>;
}

async function callVisionApi(absPath: string, mimeType: string): Promise<string> {
  const key = env.GOOGLE_VISION_API_KEY;
  if (!key) {
    throw new HttpError(503, "OcrNotConfigured", {
      detail: "OCR is not configured. Set GOOGLE_VISION_API_KEY to enable document scanning.",
    });
  }

  const content = fs.readFileSync(absPath).toString("base64");
  const isPdf = mimeType === "application/pdf" || path.extname(absPath).toLowerCase() === ".pdf";

  const body = isPdf
    ? {
        requests: [{
          inputConfig: { content, mimeType: "application/pdf" },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          pages: [1],
        }],
      }
    : {
        requests: [{
          image: { content },
          features: [{ type: "TEXT_DETECTION" }],
        }],
      };

  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    logger.warn({ status: res.status }, "Google Vision OCR request failed");
    throw new HttpError(502, "OcrProviderError", { detail: "OCR provider returned an error. Try again later." });
  }

  const data = (await res.json()) as VisionResponse;
  const first = data.responses?.[0];
  if (first?.error?.message) {
    logger.warn({ providerMessage: first.error.message.slice(0, 120) }, "Google Vision OCR error");
    throw new HttpError(502, "OcrProviderError", { detail: "Could not read text from this document." });
  }

  const text = first?.fullTextAnnotation?.text ?? first?.textAnnotations?.[0]?.description ?? "";
  if (!text.trim()) {
    throw new HttpError(422, "OcrNoText", { detail: "No readable text found in this document." });
  }
  return text;
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
  const text = await callVisionApi(absPath, mimeType);
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
