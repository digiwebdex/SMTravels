import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { uploadSingleFile } from "../lib/uploads";
import {
  listDocumentsHandler, uploadDocumentHandler, documentFileHandler, updateDocumentStatusHandler,
} from "../controllers/document.controller";
import { runDocumentOcrHandler } from "../controllers/ocr.controller";

// ERP Documents — branch-scoped via the owner relations (see document.service).
// Files are NEVER served statically; this router is the only read path.
// Multer runs AFTER auth+permission so anonymous requests never touch disk.
export const documentRouter = Router();
const view = requirePermission("documents", "view");
const manage = requirePermission("documents", "manage");

documentRouter.get("/documents", requireAuth, view, asyncHandler(listDocumentsHandler));
documentRouter.post("/documents", requireAuth, manage, uploadSingleFile, asyncHandler(uploadDocumentHandler));
documentRouter.patch("/documents/:id/status", requireAuth, manage, asyncHandler(updateDocumentStatusHandler));
documentRouter.get("/documents/:id/file", requireAuth, view, asyncHandler(documentFileHandler));
documentRouter.post("/documents/:id/ocr", requireAuth, manage, asyncHandler(runDocumentOcrHandler));
