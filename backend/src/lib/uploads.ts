/**
 * File-upload plumbing (documents: passports/visas/etc).
 *
 * Policy (see DEPLOYMENT.md "Server paths"):
 *   - Files land under env.UPLOAD_DIR — OUTSIDE the web root. nginx never
 *     serves this directory; the ONLY read path is the authenticated
 *     /documents/:id/file endpoints, which enforce branch/ownership scoping.
 *   - Stored names are random (uuid) — never the client's filename — so a
 *     path can't be guessed and traversal input never reaches the filesystem.
 *   - Accepted types: PDF / JPG / PNG, max 10 MB (multer enforces both).
 */
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { env } from "./env";
import { HttpError } from "../middleware/errorHandler";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** mimetype → canonical stored extension. The allow-list, in one place. */
const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};
const ALLOWED_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

export const uploadRoot = path.resolve(env.UPLOAD_DIR);
const tmpDir = path.join(uploadRoot, "tmp");

// Multer writes incoming files to tmp/ under a random name; the service moves
// the file into its final YYYY/MM home only after the metadata row is valid.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(tmpDir, { recursive: true });
    cb(null, tmpDir);
  },
  filename: (_req, _file, cb) => cb(null, crypto.randomUUID()),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME[file.mimetype] || !ALLOWED_EXT.has(ext)) {
      cb(new HttpError(415, "UnsupportedFileType", { detail: "Only PDF, JPG or PNG files are accepted." }));
      return;
    }
    cb(null, true);
  },
});

/** `single("file")` with multer's own errors mapped onto the HttpError shape. */
export function uploadSingleFile(req: Request, res: Response, next: NextFunction): void {
  (upload.single("file") as RequestHandler)(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const tooBig = err.code === "LIMIT_FILE_SIZE";
      next(
        new HttpError(tooBig ? 413 : 400, tooBig ? "FileTooLarge" : "UploadError", {
          detail: tooBig ? "Maximum file size is 10 MB." : err.message,
        }),
      );
      return;
    }
    next(err ?? undefined);
  });
}

/** Move a validated tmp upload into its permanent YYYY/MM home.
 *  Returns the path RELATIVE to uploadRoot (what Document.filePath stores). */
export function moveIntoStore(tmpPath: string, mimetype: string): string {
  const ext = ALLOWED_MIME[mimetype] ?? "";
  const now = new Date();
  const rel = path.join(
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    `${crypto.randomUUID()}${ext}`,
  );
  const abs = path.join(uploadRoot, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.renameSync(tmpPath, abs);
  return rel;
}

/** Best-effort cleanup of a tmp file after a failed request. */
export function removeQuietly(p: string | undefined): void {
  if (!p) return;
  try {
    fs.unlinkSync(p);
  } catch {
    /* already gone */
  }
}

/** Absolute path for a stored relative filePath, refusing anything that would
 *  escape the upload root (defense in depth — stored paths are server-minted). */
export function absoluteStorePath(relPath: string): string {
  const abs = path.resolve(uploadRoot, relPath);
  if (!abs.startsWith(uploadRoot + path.sep)) {
    throw new HttpError(404, "NotFound", { detail: "Document file not found." });
  }
  return abs;
}
