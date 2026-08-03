import type { Request, Response } from "express";
import { z } from "zod";
import fs from "node:fs";
import { HttpError } from "../middleware/errorHandler";
import { passportOcr } from "../lib/ocr";
import { removeQuietly } from "../lib/uploads";
import * as ocrService from "../services/ocr.service";
import {
  ocrDocument,
  mapOcrToFormDraft,
  type OcrDocumentKind,
} from "../services/googleVision.service";

const kinds = [
  "passport",
  "visa",
  "nid",
  "flight_ticket",
  "hotel_voucher",
  "medical_certificate",
] as const;

/** Extract passport fields from an uploaded image to PRE-FILL an editable form.
 *  The scan is not persisted and the result is never written to a record here.
 *  (Production /ocr/passport endpoint — stateless.) */
export async function scanPassportHandler(req: Request, res: Response): Promise<void> {
  if (!req.file) throw new HttpError(400, "FileRequired", { detail: 'Attach the passport image in the "file" field.' });
  try {
    const result = await passportOcr.extract({
      path: req.file.path,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
    });
    res.json(result);
  } finally {
    removeQuietly(req.file.path); // OCR is stateless — the scan image is discarded
  }
}

/** Run OCR on a STORED document by id (persists fields on Document) — branch feature. */
export async function runDocumentOcrHandler(req: Request, res: Response): Promise<void> {
  res.json(await ocrService.runOcrOnDocument(req.auth!, String(req.params.id), req.ip));
}

/** Google-Vision multi-kind OCR (passport/visa/nid/…) — branch feature. */
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

/** Map extracted OCR fields to an editable form draft — branch feature. */
export async function ocrApplyHandler(req: Request, res: Response): Promise<void> {
  const input = applySchema.parse(req.body);
  res.json({ draft: mapOcrToFormDraft(input.target, input.fields) });
}
