import type { Request, Response } from "express";
import { documentUploadSchema, documentListQuerySchema } from "../contracts/document.contract";
import { HttpError } from "../middleware/errorHandler";
import * as documents from "../services/document.service";

export async function listDocumentsHandler(req: Request, res: Response): Promise<void> {
  res.json(await documents.listDocuments(req.auth!, documentListQuerySchema.parse(req.query)));
}

export async function uploadDocumentHandler(req: Request, res: Response): Promise<void> {
  if (!req.file) throw new HttpError(400, "FileRequired", { detail: "Attach the file in the \"file\" field." });
  res.status(201).json(await documents.createDocument(req.auth!, req.file, documentUploadSchema.parse(req.body)));
}

/** Authenticated download — the ONLY read path for stored files. */
export async function documentFileHandler(req: Request, res: Response): Promise<void> {
  const f = await documents.getDocumentFile(req.auth!, req.params.id);
  res.setHeader("Content-Type", f.mimeType);
  res.setHeader("Cache-Control", "private, no-store");
  res.download(f.absPath, f.name);
}
