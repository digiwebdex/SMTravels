import { randomUUID, createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "./env";

const ISS = "smtravels";
export const ACCESS_TTL = "15m";
export const REFRESH_TTL_DAYS = 7;
export const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE = "smt_rt";

export interface AccessClaims {
  sub: string; // userId
  role: UserRole;
  branchId: string | null;
}

export function signAccessToken(c: AccessClaims): string {
  return jwt.sign({ ...c, typ: "access" }, env.JWT_SECRET, { expiresIn: ACCESS_TTL, issuer: ISS });
}

export function verifyAccessToken(token: string): AccessClaims {
  const p = jwt.verify(token, env.JWT_SECRET, { issuer: ISS }) as jwt.JwtPayload;
  if (p.typ !== "access") throw new Error("not an access token");
  return { sub: String(p.sub), role: p.role as UserRole, branchId: (p.branchId as string | null) ?? null };
}

/** Short-lived (10 min) single-purpose token issued after OTP verification,
 *  the only credential `resetPassword` accepts. `typ` guard stops it being
 *  replayed as an access token even though both use JWT_SECRET. */
export function signResetToken(userId: string): string {
  return jwt.sign({ typ: "pwreset" }, env.JWT_SECRET, { subject: userId, expiresIn: "10m", issuer: ISS });
}

export function verifyResetToken(token: string): string {
  const p = jwt.verify(token, env.JWT_SECRET, { issuer: ISS }) as jwt.JwtPayload;
  if (p.typ !== "pwreset") throw new Error("not a reset token");
  return String(p.sub);
}

/** Refresh token is a JWT with a random jti; its sha256 is stored server-side
 *  (RefreshToken.tokenHash) so it can be rotated and revoked. */
export function signRefreshToken(userId: string): { token: string; hash: string } {
  const token = jwt.sign({ jti: randomUUID() }, env.JWT_REFRESH_SECRET, {
    subject: userId,
    expiresIn: `${REFRESH_TTL_DAYS}d`,
    issuer: ISS,
  });
  return { token, hash: hashToken(token) };
}

export function verifyRefreshToken(token: string): { sub: string; jti: string } {
  const p = jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: ISS }) as jwt.JwtPayload;
  return { sub: String(p.sub), jti: String(p.jti) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
