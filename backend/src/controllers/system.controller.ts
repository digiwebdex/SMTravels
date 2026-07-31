import type { Request, Response } from "express";
import { z } from "zod";
import { checkVisionHealth, ocrPassport } from "../services/googleVision.service";
import { checkGeminiHealth } from "../services/gemini.service";
import { checkSmtpHealth, sendSmtpTestEmail } from "../services/email.service";
import { HttpError } from "../middleware/errorHandler";
import fs from "node:fs";

const smtpTestSchema = z.object({
  email: z.string().trim().email(),
});

export async function googleVisionStatusHandler(_req: Request, res: Response): Promise<void> {
  const health = await checkVisionHealth();
  res.json({
    status: health.status,
    provider: health.provider,
    authentication: health.authentication,
    ...(health.detail && health.status !== "connected" ? { detail: health.detail } : {}),
  });
}

export async function geminiStatusHandler(_req: Request, res: Response): Promise<void> {
  const health = await checkGeminiHealth();
  res.json({
    status: health.status,
    provider: health.provider,
    model: health.model,
    ...(health.detail && health.status !== "connected" ? { detail: health.detail } : {}),
  });
}

export async function smtpStatusHandler(_req: Request, res: Response): Promise<void> {
  const health = await checkSmtpHealth();
  res.json({
    status: health.status,
    provider: health.provider,
    ...(health.detail && health.status !== "connected" ? { detail: health.detail } : {}),
  });
}

export async function smtpTestHandler(req: Request, res: Response): Promise<void> {
  const { email } = smtpTestSchema.parse(req.body);
  await sendSmtpTestEmail(email);
  res.json({ success: true, message: "SMTP Test Email Sent Successfully" });
}

export async function passportOcrHandler(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file?.path) {
    throw new HttpError(400, "ValidationError", { detail: "Multipart field 'file' is required." });
  }
  try {
    const result = await ocrPassport(file.path, file.mimetype);
    const conf01 = Math.max(0, Math.min(1, (result.confidence ?? 0) / 100));
    const gender =
      result.gender?.toUpperCase().startsWith("F") ? "FEMALE" as const
        : result.gender?.toUpperCase().startsWith("M") ? "MALE" as const
          : null;
    res.json({
      provider: "cloud",
      confidence: conf01,
      warning: "Review and correct extracted fields before Apply. OCR is never authoritative.",
      fields: {
        fullName: result.fullName,
        passportNo: result.passportNumber,
        dateOfBirth: result.dateOfBirth,
        expiryDate: result.dateOfExpiry,
        dateOfIssue: result.dateOfIssue,
        nationality: result.nationality,
        gender,
        issueCountry: result.nationality,
        mrz: result.mrz,
      },
      // flat aliases (backward compatible)
      fullText: result.fullText,
      passportNumber: result.passportNumber,
      fullName: result.fullName,
      nationality: result.nationality,
      gender: result.gender,
      dateOfBirth: result.dateOfBirth,
      dateOfIssue: result.dateOfIssue,
      dateOfExpiry: result.dateOfExpiry,
      placeOfBirth: result.placeOfBirth,
      mrz: result.mrz,
      issueCountry: result.nationality,
    });
  } finally {
    try {
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch {
      /* ignore cleanup errors */
    }
  }
}
