import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../lib/env";
import { REFRESH_COOKIE, REFRESH_TTL_MS } from "../lib/jwt";
import { clientIp } from "../lib/audit";
import * as auth from "../services/auth.service";

const EmailSchema = z.string().trim().toLowerCase().email();
const PasswordSchema = z.string().min(8).max(200);

const LoginSchema = z.object({ email: EmailSchema, password: z.string().min(1).max(200) });
const ForgotSchema = z.object({ email: EmailSchema });
const VerifyOtpSchema = z.object({ email: EmailSchema, otp: z.string().regex(/^\d{6}$/) });
const ResetSchema = z.object({ resetToken: z.string().min(10), password: PasswordSchema });

function ctx(req: Request) {
  return { ip: clientIp(req), ua: req.headers["user-agent"] ?? null };
}

// Refresh cookie: httpOnly + SameSite=Lax, Secure in prod (HTTPS via Cloudflare),
// scoped to /api/auth so it is only sent to refresh/logout. The access token is
// NEVER cookied and NEVER stored — it lives in the SPA's memory only.
const cookieBase = {
  httpOnly: true as const,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
};
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, { ...cookieBase, maxAge: REFRESH_TTL_MS });
}
function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, cookieBase);
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = LoginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await auth.login(email, password, ctx(req));
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const { user, accessToken, refreshToken } = await auth.refresh(req.cookies?.[REFRESH_COOKIE], ctx(req));
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  await auth.logout(req.cookies?.[REFRESH_COOKIE], ctx(req));
  clearRefreshCookie(res);
  res.json({ ok: true });
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  const result = await auth.me(req.auth!.userId);
  res.json(result);
}

export async function forgotPasswordHandler(req: Request, res: Response): Promise<void> {
  const { email } = ForgotSchema.parse(req.body);
  const otp = await auth.forgotPassword(email, ctx(req));
  // Always 200 with a generic message so callers can't probe which emails exist.
  res.json({ ok: true, message: "If the account exists, a reset code has been sent.", ...(otp ? { devOtp: otp } : {}) });
}

export async function verifyOtpHandler(req: Request, res: Response): Promise<void> {
  const { email, otp } = VerifyOtpSchema.parse(req.body);
  const { resetToken } = await auth.verifyOtp(email, otp, ctx(req));
  res.json({ resetToken });
}

export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  const { resetToken, password } = ResetSchema.parse(req.body);
  await auth.resetPassword(resetToken, password, ctx(req));
  res.json({ ok: true });
}
