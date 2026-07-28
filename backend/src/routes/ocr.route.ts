import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { uploadSingleFile } from "../lib/uploads";
import { scanPassportHandler } from "../controllers/ocr.controller";

// Passport OCR — extracts fields to PRE-FILL an editable form. The image is not
// persisted; the output is never authoritative (staff verify + correct + save).
export const ocrRouter = Router();

ocrRouter.post(
  "/ocr/passport",
  requireAuth,
  requirePermission("bookings", "manage"),
  uploadSingleFile,
  asyncHandler(scanPassportHandler),
);
