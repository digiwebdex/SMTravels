import type { Request, Response } from "express";
import fs from "node:fs";
import {
  ocrDocument,
  type OcrDocumentKind,
} from "../services/googleVision.service";
import * as ocrService from "../services/ocr.service";
import { ocrApplySchema, ocrCorrectSchema } from "../contracts/ocr.contract";
import { HttpError } from "../middleware/errorHandler";
import { clientIp } from "../lib/audit";

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
  res.json(await ocrService.runOcrOnDocument(req.auth!, String(req.params.id), clientIp(req)));
}

export async function getDocumentOcrHandler(req: Request, res: Response): Promise<void> {
  res.json(await ocrService.getDocumentOcr(req.auth!, String(req.params.id)));
}

export async function listOcrPendingHandler(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1) || 1;
  const pageSize = Math.min(100, Number(req.query.pageSize ?? 20) || 20);
  res.json(await ocrService.listOcrPending(req.auth!, page, pageSize));
}

export async function listOcrHistoryHandler(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1) || 1;
  const pageSize = Math.min(100, Number(req.query.pageSize ?? 30) || 30);
  res.json(await ocrService.listOcrHistory(req.auth!, page, pageSize));
}

export async function correctDocumentOcrHandler(req: Request, res: Response): Promise<void> {
  const input = ocrCorrectSchema.parse(req.body);
  res.json(await ocrService.correctDocumentOcr(req.auth!, String(req.params.id), input, clientIp(req)));
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

export async function ocrApplyHandler(req: Request, res: Response): Promise<void> {
  const input = ocrApplySchema.parse(req.body);
  // persist=false keeps legacy draft-only behavior for callers that only want field mapping
  if (input.persist === false) {
    const { mapOcrToFormDraft } = await import("../services/googleVision.service");
    res.json({ draft: mapOcrToFormDraft(input.target, input.fields), persisted: false });
    return;
  }
  res.json(await ocrService.applyOcr(req.auth!, input, clientIp(req)));
}
