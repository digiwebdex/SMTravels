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
    res.json({
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
      confidence: result.confidence,
    });
  } finally {
    // Temp upload — remove after OCR (do not persist passport scan unless via documents API)
    try {
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch {
      /* ignore cleanup errors */
    }
  }
}
