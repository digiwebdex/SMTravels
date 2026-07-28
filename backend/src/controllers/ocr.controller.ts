import type { Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler";
import { passportOcr } from "../lib/ocr";
import { removeQuietly } from "../lib/uploads";

/** Extract passport fields from an uploaded image to PRE-FILL an editable form.
 *  The scan is not persisted and the result is never written to a record here. */
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
