/**
 * Google Cloud Vision OCR — singleton ImageAnnotatorClient (Service Account).
 *
 * Auth: Application Default Credentials via GOOGLE_APPLICATION_CREDENTIALS
 * (path to service-account JSON). Never use API-key auth for Vision.
 *
 * Designed for reusable document OCR across the ERP:
 *   passport | visa | nid | flight_ticket | hotel_voucher | medical_certificate
 */
import fs from "node:fs";
import path from "node:path";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { HttpError } from "../middleware/errorHandler";

export type OcrDocumentKind =
  | "passport"
  | "visa"
  | "nid"
  | "flight_ticket"
  | "hotel_voucher"
  | "medical_certificate";

export interface VisionStatus {
  status: "connected" | "disconnected";
  provider: "Google Cloud Vision";
  authentication: "Service Account";
  detail?: string;
}

export interface PassportOcrResult {
  fullText: string;
  passportNumber: string | null;
  fullName: string | null;
  nationality: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  dateOfIssue: string | null;
  dateOfExpiry: string | null;
  placeOfBirth: string | null;
  mrz: string | null;
  confidence: number;
}

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

let client: ImageAnnotatorClient | null = null;
let initError: string | null = null;

function credentialsPath(): string | null {
  const p = env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  return p || null;
}

/** True when a readable service-account credentials file is configured. */
export function isVisionConfigured(): boolean {
  const p = credentialsPath();
  if (!p) return false;
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/** Initialize once; subsequent calls return the same client. */
export function getVisionClient(): ImageAnnotatorClient {
  if (client) return client;
  if (!isVisionConfigured()) {
    throw new HttpError(503, "OcrNotConfigured", {
      detail:
        "Google Cloud Vision is not configured. Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path.",
    });
  }
  const keyFile = credentialsPath()!;
  // Ensure ADC env is set for the SDK (systemd may already inject it).
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFile;
  }
  try {
    client = new ImageAnnotatorClient({ keyFilename: keyFile });
    initError = null;
    return client;
  } catch (err) {
    initError = err instanceof Error ? err.message : "Vision client init failed";
    logger.warn({ err: initError }, "Google Cloud Vision client failed to initialize");
    throw new HttpError(503, "OcrNotConfigured", {
      detail: "Google Cloud Vision client could not be initialized.",
    });
  }
}

/** Non-throwing health probe for status APIs and startup verification. */
export async function checkVisionHealth(): Promise<VisionStatus> {
  const base = {
    provider: "Google Cloud Vision" as const,
    authentication: "Service Account" as const,
  };
  if (!isVisionConfigured()) {
    return {
      ...base,
      status: "disconnected",
      detail: "GOOGLE_APPLICATION_CREDENTIALS missing or file not found",
    };
  }
  try {
    getVisionClient();
    // Lightweight credential / project check — list operations is not required;
    // constructing the client + reading the key file is enough for "connected".
    const keyFile = credentialsPath()!;
    const raw = fs.readFileSync(keyFile, "utf8");
    const parsed = JSON.parse(raw) as { type?: string; client_email?: string };
    if (parsed.type !== "service_account" || !parsed.client_email) {
      return { ...base, status: "disconnected", detail: "Credentials JSON is not a service account" };
    }
    return { ...base, status: "connected" };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Vision health check failed";
    return { ...base, status: "disconnected", detail: detail.slice(0, 200) };
  }
}

/**
 * Run document text detection on an image or PDF buffer / file path.
 * PDFs use `batchAnnotateFiles`; images use `textDetection` / `documentTextDetection`.
 */
export async function extractTextFromFile(
  absPath: string,
  mimeType?: string,
): Promise<string> {
  const vision = getVisionClient();
  const ext = path.extname(absPath).toLowerCase();
  const isPdf = mimeType === "application/pdf" || ext === ".pdf";
  const content = fs.readFileSync(absPath);

  try {
    if (isPdf) {
      const [result] = await vision.batchAnnotateFiles({
        requests: [
          {
            inputConfig: { content, mimeType: "application/pdf" },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            pages: [1],
          },
        ],
      });
      const pageResp = result.responses?.[0]?.responses?.[0];
      if (pageResp?.error?.message) {
        logger.warn({ providerMessage: pageResp.error.message.slice(0, 120) }, "Vision PDF OCR error");
        throw new HttpError(502, "OcrProviderError", { detail: "Could not read text from this PDF." });
      }
      const text =
        pageResp?.fullTextAnnotation?.text ??
        pageResp?.textAnnotations?.[0]?.description ??
        "";
      if (!text.trim()) {
        throw new HttpError(422, "OcrNoText", { detail: "No readable text found in this document." });
      }
      return text;
    }

    const [result] = await vision.documentTextDetection({ image: { content } });
    if (result.error?.message) {
      logger.warn({ providerMessage: result.error.message.slice(0, 120) }, "Vision OCR error");
      throw new HttpError(502, "OcrProviderError", { detail: "Could not read text from this document." });
    }
    const text =
      result.fullTextAnnotation?.text ??
      result.textAnnotations?.[0]?.description ??
      "";
    if (!text.trim()) {
      throw new HttpError(422, "OcrNoText", { detail: "No readable text found in this document." });
    }
    return text;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.warn({ err: err instanceof Error ? err.message : "unknown" }, "Vision OCR request failed");
    throw new HttpError(502, "OcrProviderError", {
      detail: "OCR provider returned an error. Try again later.",
    });
  }
}

function toIsoDate(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function parseHumanDate(s: string): Date | null {
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
}

function parseMrzDate(yyMMdd: string): Date | null {
  if (!/^\d{6}$/.test(yyMMdd)) return null;
  const yy = Number(yyMMdd.slice(0, 2));
  const mm = Number(yyMMdd.slice(2, 4)) - 1;
  const dd = Number(yyMMdd.slice(4, 6));
  const year = yy >= 50 ? 1900 + yy : 2000 + yy;
  if (mm < 0 || mm > 11 || dd < 1 || dd > 31) return null;
  return new Date(Date.UTC(year, mm, dd));
}

/** Heuristic passport-field extraction (MRZ-aware). Shared by document OCR + passport API. */
export function parsePassportFields(raw: string): {
  passportNo: string | null;
  name: string | null;
  dob: Date | null;
  expiry: Date | null;
  issue: Date | null;
  nationality: string | null;
  gender: string | null;
  placeOfBirth: string | null;
  mrz: string | null;
  confidence: number;
} {
  const text = raw.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const upper = text.toUpperCase();

  let passportNo: string | null = null;
  let name: string | null = null;
  let dob: Date | null = null;
  let expiry: Date | null = null;
  let issue: Date | null = null;
  let nationality: string | null = null;
  let gender: string | null = null;
  let placeOfBirth: string | null = null;
  let mrz: string | null = null;
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
        try {
          const keyRe = new RegExp(re.source.replace(/\(.+\)$/, "").replace(/\\s\*\[:\\.\]\?\\s\*/, ""), "i");
          if (keyRe.test(lines[i]) && !re.exec(lines[i])?.[1]) {
            const next = lines[i + 1]?.trim();
            if (next && next.length >= 2) return next;
          }
        } catch {
          /* skip */
        }
      }
    }
    return null;
  };

  passportNo =
    labelValue([
      /(?:passport\s*(?:no\.?|number|#)|\bno\.?\s*[:.]?\s*)([A-Z0-9][A-Z0-9\s]{5,11})/i,
    ]) ?? null;

  const surname = labelValue([/(?:surname|last\s*name)\s*[:.]?\s*(.+)$/i]);
  const given = labelValue([/(?:given\s*names?|first\s*name)\s*[:.]?\s*(.+)$/i]);
  if (surname || given) name = [given, surname].filter(Boolean).join(" ").trim() || null;

  nationality =
    labelValue([/(?:nationality|country\s*code)\s*[:.]?\s*([A-Za-z\s]{3,40})/i]) ??
    (() => {
      const m = upper.match(/\b(BANGLADESHI|BANGLADESH|BD)\b/);
      return m ? "BANGLADESHI" : null;
    })();

  gender =
    labelValue([/(?:sex|gender)\s*[:.]?\s*([MF]|MALE|FEMALE)\b/i]) ??
    null;
  if (gender) {
    const g = gender.toUpperCase();
    gender = g.startsWith("F") ? "F" : g.startsWith("M") ? "M" : g.slice(0, 1);
  }

  placeOfBirth = labelValue([
    /(?:place\s*of\s*birth|birth\s*place|pob)\s*[:.]?\s*(.+)$/i,
  ]);

  const dobStr = labelValue([/(?:date\s*of\s*birth|dob|birth\s*date)\s*[:.]?\s*(.+)$/i]);
  if (dobStr) dob = parseHumanDate(dobStr);

  const expStr = labelValue([
    /(?:date\s*of\s*expir(?:y|ation)|expir(?:y|es)|valid\s*until)\s*[:.]?\s*(.+)$/i,
  ]);
  if (expStr) expiry = parseHumanDate(expStr);

  const issueStr = labelValue([
    /(?:date\s*of\s*issue|issued?\s*(?:on|date)?|issue\s*date)\s*[:.]?\s*(.+)$/i,
  ]);
  if (issueStr) issue = parseHumanDate(issueStr);

  const mrzLines = lines.filter((l) => {
    const c = l.replace(/\s/g, "");
    return c.length >= 28 && /^[A-Z0-9<]+$/.test(c);
  });
  if (mrzLines.length >= 2) {
    mrz = mrzLines.slice(-2).map((l) => l.replace(/\s/g, "")).join("\n");
  } else if (mrzLines.length === 1) {
    mrz = mrzLines[0]!.replace(/\s/g, "");
  }

  const mrz1 = mrzLines.find((l) => /^P<[A-Z]{3}/.test(l.replace(/\s/g, "")));
  if (mrz1) {
    const compact = mrz1.replace(/\s/g, "");
    if (!name) {
      const parts = compact.slice(5).split("<<");
      const sn = parts[0]?.replace(/</g, " ").trim();
      const gn = parts[1]?.replace(/</g, " ").trim();
      if (sn || gn) name = [gn, sn].filter(Boolean).join(" ").trim() || null;
    }
    if (!nationality && compact.length >= 5) {
      nationality = compact.slice(2, 5);
    }
  }

  const mrz2 = mrzLines.find((l) => {
    const c = l.replace(/\s/g, "");
    return c.length >= 28 && /^\d/.test(c) && c.includes("<");
  });
  if (mrz2) {
    const c = mrz2.replace(/\s/g, "");
    if (!passportNo) {
      const pn = c.slice(0, 9).replace(/</g, "").trim();
      if (pn.length >= 6) passportNo = pn;
    }
    if (!nationality && c.length >= 13) nationality = c.slice(10, 13).replace(/</g, "") || null;
    if (!dob) dob = parseMrzDate(c.slice(13, 19));
    if (!gender && c.length > 20) {
      const sex = c[20];
      if (sex === "M" || sex === "F") gender = sex;
    }
    if (!expiry) expiry = parseMrzDate(c.slice(21, 27));
  }

  if (!passportNo) {
    const mrzAny = lines.find(
      (l) => l.replace(/\s/g, "").length >= 30 && /^[A-Z0-9<]+$/.test(l.replace(/\s/g, "")),
    );
    if (mrzAny) {
      const compact = mrzAny.replace(/\s/g, "");
      const candidate = compact.slice(0, 9).replace(/</g, "").trim();
      if (candidate.length >= 6) passportNo = candidate;
    }
  }

  if (passportNo) hits++;
  if (name) hits++;
  if (dob) hits++;
  if (expiry) hits++;
  if (nationality) hits++;
  if (gender) hits++;
  if (mrz) hits++;

  const confidence = Math.min(98, Math.max(35, hits * 12 + (text.length > 80 ? 10 : 0)));

  return {
    passportNo,
    name,
    dob,
    expiry,
    issue,
    nationality,
    gender,
    placeOfBirth,
    mrz,
    confidence,
  };
}

/** OCR a passport image/PDF and return structured fields for the passport API. */
export async function ocrPassport(absPath: string, mimeType?: string): Promise<PassportOcrResult> {
  const fullText = await extractTextFromFile(absPath, mimeType);
  const parsed = parsePassportFields(fullText);
  logger.info(
    {
      kind: "passport" satisfies OcrDocumentKind,
      confidence: parsed.confidence,
      fieldCount: [
        parsed.passportNo,
        parsed.name,
        parsed.dob,
        parsed.expiry,
        parsed.nationality,
        parsed.gender,
        parsed.mrz,
      ].filter(Boolean).length,
    },
    "Passport OCR completed",
  );
  return {
    fullText,
    passportNumber: parsed.passportNo,
    fullName: parsed.name,
    nationality: parsed.nationality,
    gender: parsed.gender,
    dateOfBirth: toIsoDate(parsed.dob),
    dateOfIssue: toIsoDate(parsed.issue),
    dateOfExpiry: toIsoDate(parsed.expiry),
    placeOfBirth: parsed.placeOfBirth,
    mrz: parsed.mrz,
    confidence: parsed.confidence,
  };
}

/** Heuristic field extractors for non-passport document kinds. */
export function parseByKind(kind: OcrDocumentKind, raw: string): Record<string, unknown> {
  if (kind === "passport") {
    const p = parsePassportFields(raw);
    return {
      passportNumber: p.passportNo,
      fullName: p.name,
      nationality: p.nationality,
      gender: p.gender,
      dateOfBirth: toIsoDate(p.dob),
      dateOfIssue: toIsoDate(p.issue),
      dateOfExpiry: toIsoDate(p.expiry),
      placeOfBirth: p.placeOfBirth,
      mrz: p.mrz,
      confidence: p.confidence,
    };
  }

  const text = raw.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const upper = text.toUpperCase();
  const grab = (re: RegExp): string | null => {
    for (const line of lines) {
      const m = line.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return null;
  };

  if (kind === "visa") {
    return {
      visaNumber: grab(/(?:visa\s*(?:no\.?|number|#)\s*[:.]?\s*)([A-Z0-9-]+)/i),
      fullName: grab(/(?:name|surname)\s*[:.]?\s*(.+)$/i),
      nationality: grab(/(?:nationality)\s*[:.]?\s*(.+)$/i),
      visaType: grab(/(?:visa\s*type|category)\s*[:.]?\s*(.+)$/i),
      dateOfIssue: grab(/(?:date\s*of\s*issue|issued)\s*[:.]?\s*(.+)$/i),
      dateOfExpiry: grab(/(?:valid\s*until|expir)/i) ? grab(/(?:valid\s*until|date\s*of\s*expir(?:y|ation))\s*[:.]?\s*(.+)$/i) : null,
      entries: grab(/(?:entries|number\s*of\s*entries)\s*[:.]?\s*(.+)$/i),
      confidence: Math.min(90, 40 + lines.length),
    };
  }

  if (kind === "nid") {
    return {
      nidNumber:
        grab(/(?:nid|national\s*id|스마트|ID\s*no\.?)\s*[:.]?\s*([0-9]{10,17})/i) ??
        (upper.match(/\b\d{10,17}\b/)?.[0] ?? null),
      fullName: grab(/(?:name|নাম)\s*[:.]?\s*(.+)$/i),
      dateOfBirth: grab(/(?:date\s*of\s*birth|dob|জন্ম)\s*[:.]?\s*(.+)$/i),
      bloodGroup: grab(/(?:blood\s*group)\s*[:.]?\s*([ABO][+-]?)/i),
      confidence: Math.min(90, 40 + lines.length),
    };
  }

  if (kind === "flight_ticket") {
    return {
      passengerName: grab(/(?:passenger|name\s*of\s*passenger|pax)\s*[:.]?\s*(.+)$/i),
      pnr: grab(/(?:pnr|booking\s*ref(?:erence)?)\s*[:.]?\s*([A-Z0-9]{5,8})/i),
      ticketNumber: grab(/(?:ticket\s*(?:no\.?|number))\s*[:.]?\s*([0-9-]+)/i),
      flightNumber: grab(/(?:flight\s*(?:no\.?|number)?)\s*[:.]?\s*([A-Z]{2}\s?\d{1,4})/i),
      from: grab(/(?:from|departure)\s*[:.]?\s*(.+)$/i),
      to: grab(/(?:to|arrival|destination)\s*[:.]?\s*(.+)$/i),
      departureDate: grab(/(?:departure\s*date|date)\s*[:.]?\s*(.+)$/i),
      confidence: Math.min(90, 40 + lines.length),
    };
  }

  if (kind === "hotel_voucher") {
    return {
      guestName: grab(/(?:guest|name)\s*[:.]?\s*(.+)$/i),
      hotelName: grab(/(?:hotel|property)\s*[:.]?\s*(.+)$/i),
      confirmationNo: grab(/(?:confirmation|voucher|booking)\s*(?:no\.?|number|#)?\s*[:.]?\s*([A-Z0-9-]+)/i),
      checkIn: grab(/(?:check[\s-]?in)\s*[:.]?\s*(.+)$/i),
      checkOut: grab(/(?:check[\s-]?out)\s*[:.]?\s*(.+)$/i),
      nights: grab(/(?:nights?)\s*[:.]?\s*(\d+)/i),
      confidence: Math.min(90, 40 + lines.length),
    };
  }

  // medical_certificate
  return {
    patientName: grab(/(?:patient|name)\s*[:.]?\s*(.+)$/i),
    doctorName: grab(/(?:doctor|physician|dr\.?)\s*[:.]?\s*(.+)$/i),
    clinic: grab(/(?:clinic|hospital|center)\s*[:.]?\s*(.+)$/i),
    issueDate: grab(/(?:date|issued)\s*[:.]?\s*(.+)$/i),
    fitness: /fit\s*to\s*travel/i.test(upper) ? "FIT_TO_TRAVEL" : null,
    confidence: Math.min(90, 40 + lines.length),
  };
}

/** Map OCR fields into form drafts for customer / traveler / visa / booking. */
export function mapOcrToFormDraft(
  target: "customer" | "traveler" | "visa" | "booking",
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const str = (k: string) => (typeof fields[k] === "string" ? (fields[k] as string) : null);
  if (target === "customer" || target === "traveler") {
    return {
      name: str("fullName") ?? str("passengerName") ?? str("guestName") ?? str("patientName"),
      passportNo: str("passportNumber"),
      nationality: str("nationality"),
      gender: str("gender"),
      dob: str("dateOfBirth"),
      nidNo: str("nidNumber"),
    };
  }
  if (target === "visa") {
    return {
      visaNumber: str("visaNumber"),
      fullName: str("fullName"),
      nationality: str("nationality"),
      visaType: str("visaType"),
      dateOfIssue: str("dateOfIssue"),
      dateOfExpiry: str("dateOfExpiry"),
      passportNo: str("passportNumber"),
    };
  }
  return {
    passengerName: str("passengerName") ?? str("fullName") ?? str("guestName"),
    pnr: str("pnr"),
    flightNumber: str("flightNumber"),
    hotelName: str("hotelName"),
    confirmationNo: str("confirmationNo"),
    departureDate: str("departureDate") ?? str("checkIn"),
  };
}

/** Future-ready entry point — routes by document kind. */
export async function ocrDocument(
  kind: OcrDocumentKind,
  absPath: string,
  mimeType?: string,
): Promise<{ kind: OcrDocumentKind; fullText: string; fields: Record<string, unknown> }> {
  const fullText = await extractTextFromFile(absPath, mimeType);
  const fields = parseByKind(kind, fullText);
  logger.info({ kind, fieldCount: Object.values(fields).filter(Boolean).length }, "OCR document completed");
  return { kind, fullText, fields };
}

export function visionInitError(): string | null {
  return initError;
}
