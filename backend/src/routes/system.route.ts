import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { uploadSingleFile } from "../lib/uploads";
import {
  googleVisionStatusHandler,
  geminiStatusHandler,
  smtpStatusHandler,
  smtpTestHandler,
  passportOcrHandler,
  getCompanyHandler,
  updateCompanyHandler,
} from "../controllers/system.controller";
import { ocrKindHandler, ocrApplyHandler } from "../controllers/ocr.controller";

/**
 * System integration health + OCR utilities.
 */
export const systemRouter = Router();
const viewSettings = requirePermission("settings", "view");
const manageSettings = requirePermission("settings", "manage");
const manageDocs = requirePermission("documents", "manage");

systemRouter.get(
  "/system/google-vision/status",
  requireAuth,
  viewSettings,
  asyncHandler(googleVisionStatusHandler),
);
systemRouter.get(
  "/system/gemini/status",
  requireAuth,
  viewSettings,
  asyncHandler(geminiStatusHandler),
);
systemRouter.get(
  "/system/smtp/status",
  requireAuth,
  viewSettings,
  asyncHandler(smtpStatusHandler),
);
systemRouter.post(
  "/system/smtp/test",
  requireAuth,
  manageSettings,
  asyncHandler(smtpTestHandler),
);
systemRouter.get("/company", requireAuth, viewSettings, asyncHandler(getCompanyHandler));
systemRouter.patch("/company", requireAuth, manageSettings, asyncHandler(updateCompanyHandler));

export const ocrRouter = Router();

ocrRouter.post(
  "/ocr/passport",
  requireAuth,
  manageSettings,
  uploadSingleFile,
  asyncHandler(passportOcrHandler),
);

ocrRouter.post(
  "/ocr/apply",
  requireAuth,
  manageDocs,
  asyncHandler(ocrApplyHandler),
);

ocrRouter.post(
  "/ocr/:kind",
  requireAuth,
  manageDocs,
  uploadSingleFile,
  asyncHandler(ocrKindHandler),
);
