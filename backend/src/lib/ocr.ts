/**
 * Passport OCR behind a tiny interface — same safety contract as lib/notify.ts.
 *
 *   - No OCR provider configured NEVER breaks the flow: it falls back to a mock
 *     that returns a clearly-flagged review draft (confidence 0), so "scan
 *     passport" works in any environment.
 *   - OCR output is ALWAYS a draft for an editable form. It is never written to a
 *     record as authoritative — a passport is a legal document; staff verify and
 *     correct every field before saving.
 */
import fs from "node:fs";
import { env } from "./env";
import { logger } from "./logger";
import type { OcrResult } from "../contracts/ocr.contract";

type OcrFile = { path: string; mimetype: string; originalname: string };

export interface PassportOcr {
  extract(file: OcrFile): Promise<OcrResult>;
}

// The shape we read from a cloud OCR/MRZ provider (best-effort; keys vary).
interface ProviderResp {
  confidence?: number;
  name?: string; fullName?: string;
  passportNumber?: string; documentNumber?: string;
  dateOfBirth?: string;
  expiryDate?: string; dateOfExpiry?: string;
  nationality?: string;
  sex?: string;
}

/** Real provider — posts the image to a passport/MRZ OCR API (env-gated). */
class CloudPassportOcr implements PassportOcr {
  async extract(file: OcrFile): Promise<OcrResult> {
    const buf = fs.readFileSync(file.path);
    const res = await fetch(env.OCR_API_URL!, {
      method: "POST",
      headers: { authorization: `Bearer ${env.OCR_API_KEY}`, "content-type": file.mimetype },
      body: buf,
    });
    if (!res.ok) throw new Error(`OCR provider error: HTTP ${res.status}`);
    const j = (await res.json()) as ProviderResp;
    logger.info({ file: file.originalname }, "OCR extracted via provider");
    return {
      provider: "cloud",
      confidence: typeof j.confidence === "number" ? j.confidence : 0.5,
      fields: {
        fullName: j.name ?? j.fullName ?? null,
        passportNo: j.passportNumber ?? j.documentNumber ?? null,
        dateOfBirth: j.dateOfBirth ?? null,
        expiryDate: j.expiryDate ?? j.dateOfExpiry ?? null,
        nationality: j.nationality ?? null,
        gender: j.sex === "F" ? "FEMALE" : j.sex === "M" ? "MALE" : null,
      },
      warning: null,
    };
  }
}

/** No provider configured — a SAFE mock. Placeholder values + confidence 0 +
 *  a loud warning so the pre-fill flow works everywhere but is never trusted. */
class MockPassportOcr implements PassportOcr {
  async extract(file: OcrFile): Promise<OcrResult> {
    logger.info({ file: file.originalname }, "OCR mock — no provider configured; returning a review draft");
    return {
      provider: "mock",
      confidence: 0,
      fields: {
        fullName: "MOCK OCR — VERIFY",
        passportNo: "MOCK000000",
        dateOfBirth: "1990-01-01",
        expiryDate: "2030-01-01",
        nationality: "Bangladeshi",
        gender: "MALE",
      },
      warning: "Mock OCR (no provider configured): these are placeholder values. Verify every field against the passport before saving — OCR output is never authoritative.",
    };
  }
}

// Chosen once at boot, exactly like the notify senders.
export const passportOcr: PassportOcr =
  env.OCR_API_URL && env.OCR_API_KEY ? new CloudPassportOcr() : new MockPassportOcr();
