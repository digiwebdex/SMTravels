import type { Request, Response } from "express";
import { z } from "zod";
import fs from "node:fs";
import {
  ocrDocument,
  mapOcrToFormDraft,
  type OcrDocumentKind,
} from "../services/googleVision.service";
import * as ocrService from "../services/ocr.service";
import { HttpError } from "../middleware/errorHandler";

const kinds = [
  "passport",
  "visa",
  "nid",
  "flight_ticket",
  "hotel_voucher",
  "medical_certificate",
] as const;

/** Existing document-row OCR (persists fields on Document). */
export async function runDocumentOcrHandler(req: Request, res: Response): Promise<void> {
  res.json(await ocrService.runOcrOnDocument(req.auth!, String(req.params.id), req.ip));
}

export async function ocrKindHandler(req: Request, res: Response): Promise<void> {
  const kind = String(req.params.kind) as OcrDocumentKind;
  if (!kinds.includes(kind as (typeof kinds)[number])) {
    throw new HttpError(400, "ValidationError", { detail: `Unsupported OCR kind: ${kind}` });
  }
  const file = req.file;
  if (!file?.path) {
    throw new HttpError(400, "ValidationError", { detail: "Multipart field 'file' is required." });
  }
  try {
    const result = await ocrDocument(kind, file.path, file.mimetype);
    res.json(result);
  } finally {
    try {
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch {
      /* ignore */
    }
  }
}

const applySchema = z.object({
  target: z.enum(["customer", "traveler", "visa", "booking"]),
  fields: z.record(z.unknown()),
});

export async function ocrApplyHandler(req: Request, res: Response): Promise<void> {
  const input = applySchema.parse(req.body);
  res.json({ draft: mapOcrToFormDraft(input.target, input.fields) });
}
