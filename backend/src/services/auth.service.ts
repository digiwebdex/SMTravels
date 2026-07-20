import { randomInt } from "node:crypto";
import type { User } from "@prisma/client";
import { AuditSeverity } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signResetToken,
  verifyResetToken,
  hashToken,
  REFRESH_TTL_MS,
} from "../lib/jwt";
import { audit } from "../lib/audit";
import { HttpError } from "../middleware/errorHandler";

// ── Lockout policy ───────────────────────────────────────────────────────────
// 5 consecutive failed logins → account locked for 15 minutes. The counter is
// cleared the moment the lock is applied and again on any successful login; the
// lock itself simply expires when lockedUntil passes (no admin action needed).
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const LOCK_MS = LOCK_MINUTES * 60 * 1000;

// ── OTP policy ───────────────────────────────────────────────────────────────
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

type Ctx = { ip: string | null; ua: string | null };

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: User["role"];
  branchId: string | null;
  avatarUrl: string | null;
  status: string;
}

function publicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    branchId: u.branchId,
    avatarUrl: u.avatarUrl,
    status: u.status,
  };
}

async function issueTokens(user: User, ctx: Ctx): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, branchId: user.branchId });
  const { token, hash } = signRefreshToken(user.id);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      ip: ctx.ip,
      userAgent: ctx.ua,
    },
  });
  return { accessToken, refreshToken: token };
}

export async function login(
  email: string,
  password: string,
  ctx: Ctx,
): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } });
  if (!user) {
    await audit({ event: "LOGIN_FAILED", ip: ctx.ip, severity: AuditSeverity.WARNING, detail: `unknown email: ${email}` });
    throw new HttpError(401, "InvalidCredentials");
  }
  if (user.status !== "active") {
    await audit({ event: "LOGIN_BLOCKED", userId: user.id, ip: ctx.ip, severity: AuditSeverity.WARNING, detail: `status=${user.status}` });
    throw new HttpError(403, "AccountInactive");
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    await audit({ event: "LOGIN_LOCKED", userId: user.id, ip: ctx.ip, severity: AuditSeverity.WARNING, detail: `locked until ${user.lockedUntil.toISOString()}` });
    throw new HttpError(423, "AccountLocked");
  }

  if (!verifyPassword(password, user.passwordHash)) {
    const attempt = user.failedLoginCount + 1;
    const nowLocked = attempt >= MAX_FAILED;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: nowLocked ? 0 : attempt,
        lockedUntil: nowLocked ? new Date(now.getTime() + LOCK_MS) : null,
      },
    });
    if (nowLocked) {
      await audit({ event: "LOGIN_LOCKOUT", userId: user.id, ip: ctx.ip, severity: AuditSeverity.CRITICAL, detail: `locked ${LOCK_MINUTES}m after ${MAX_FAILED} failed attempts` });
      throw new HttpError(423, "AccountLocked");
    }
    await audit({ event: "LOGIN_FAILED", userId: user.id, ip: ctx.ip, severity: AuditSeverity.WARNING, detail: `bad password, attempt ${attempt}/${MAX_FAILED}` });
    throw new HttpError(401, "InvalidCredentials");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now, lastActiveAt: now },
  });
  const tokens = await issueTokens(user, ctx);
  await audit({ event: "LOGIN_SUCCESS", userId: user.id, ip: ctx.ip, severity: AuditSeverity.INFO });
  return { user: publicUser(user), ...tokens };
}

export async function refresh(
  rawToken: string | undefined,
  ctx: Ctx,
): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }> {
  if (!rawToken) throw new HttpError(401, "NoRefreshToken");
  try {
    verifyRefreshToken(rawToken);
  } catch {
    throw new HttpError(401, "InvalidRefreshToken");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!stored || stored.expiresAt < new Date() || stored.revokedAt) {
    // A revoked-but-valid token being replayed = theft signal → kill every session.
    if (stored?.revokedAt) {
      await prisma.refreshToken.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await audit({ event: "REFRESH_REUSE", userId: stored.userId, ip: ctx.ip, severity: AuditSeverity.CRITICAL, detail: "revoked refresh token replayed; all sessions revoked" });
    }
    throw new HttpError(401, "InvalidRefreshToken");
  }

  const user = await prisma.user.findFirst({ where: { id: stored.userId, deletedAt: null } });
  if (!user || user.status !== "active") throw new HttpError(401, "InvalidRefreshToken");

  // Rotate: mint a new refresh row, revoke the old one pointing at its replacement.
  const { token: newToken, hash: newHash } = signRefreshToken(user.id);
  const newRow = await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: newHash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS), ip: ctx.ip, userAgent: ctx.ua },
  });
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date(), replacedById: newRow.id } });

  const accessToken = signAccessToken({ sub: user.id, role: user.role, branchId: user.branchId });
  return { user: publicUser(user), accessToken, refreshToken: newToken };
}

export async function logout(rawToken: string | undefined, ctx: Ctx): Promise<void> {
  if (!rawToken) return;
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (stored && !stored.revokedAt) {
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    await audit({ event: "LOGOUT", userId: stored.userId, ip: ctx.ip, severity: AuditSeverity.INFO });
  }
}

const ACCESS_RANK: Record<string, number> = { none: 0, view: 1, full: 2 };

export async function me(userId: string): Promise<{ user: PublicUser; roles: string[]; permissions: Record<string, string> }> {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new HttpError(401, "Unauthorized");

  const grants = await prisma.rolePermission.findMany({
    where: { role: { users: { some: { userId } } } },
    select: { access: true, permission: { select: { module: true } } },
  });
  // module -> highest access the user's roles grant (drives sidebar visibility)
  const permissions: Record<string, string> = {};
  for (const g of grants) {
    const m = g.permission.module;
    if (!(m in permissions) || ACCESS_RANK[g.access] > ACCESS_RANK[permissions[m]]) permissions[m] = g.access;
  }
  const roles = (
    await prisma.userRoleLink.findMany({ where: { userId }, select: { role: { select: { key: true } } } })
  ).map((r) => r.role.key);

  return { user: publicUser(user), roles, permissions };
}

/** Returns the OTP in non-production so the flow can be exercised without an SMS
 *  gateway wired up; in production it always returns undefined (never leaks). */
export async function forgotPassword(email: string, ctx: Ctx): Promise<string | undefined> {
  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } });
  if (!user) return undefined; // same response whether or not the email exists

  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.authChallenge.updateMany({
    where: { userId: user.id, type: "PASSWORD_RESET_OTP", consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.authChallenge.create({
    data: { userId: user.id, type: "PASSWORD_RESET_OTP", codeHash: hashToken(`${otp}:${user.id}`), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  await audit({ event: "PASSWORD_RESET_REQUESTED", userId: user.id, ip: ctx.ip, severity: AuditSeverity.INFO });
  // TODO: deliver via SMS/email gateway. Returned only outside production.
  return env.NODE_ENV === "production" ? undefined : otp;
}

export async function verifyOtp(email: string, otp: string, ctx: Ctx): Promise<{ resetToken: string }> {
  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } });
  if (!user) throw new HttpError(400, "InvalidOtp");

  const ch = await prisma.authChallenge.findFirst({
    where: { userId: user.id, type: "PASSWORD_RESET_OTP", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!ch || ch.expiresAt < new Date()) throw new HttpError(400, "InvalidOtp");
  if (ch.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.authChallenge.update({ where: { id: ch.id }, data: { consumedAt: new Date() } });
    throw new HttpError(429, "TooManyAttempts");
  }
  if (hashToken(`${otp}:${user.id}`) !== ch.codeHash) {
    await prisma.authChallenge.update({ where: { id: ch.id }, data: { attempts: ch.attempts + 1 } });
    await audit({ event: "OTP_FAILED", userId: user.id, ip: ctx.ip, severity: AuditSeverity.WARNING, detail: `attempt ${ch.attempts + 1}/${OTP_MAX_ATTEMPTS}` });
    throw new HttpError(400, "InvalidOtp");
  }

  await prisma.authChallenge.update({ where: { id: ch.id }, data: { consumedAt: new Date() } });
  await audit({ event: "OTP_VERIFIED", userId: user.id, ip: ctx.ip, severity: AuditSeverity.INFO });
  return { resetToken: signResetToken(user.id) };
}

export async function resetPassword(resetToken: string, newPassword: string, ctx: Ctx): Promise<void> {
  let userId: string;
  try {
    userId = verifyResetToken(resetToken);
  } catch {
    throw new HttpError(400, "InvalidResetToken");
  }
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new HttpError(400, "InvalidResetToken");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword), failedLoginCount: 0, lockedUntil: null },
  });
  // Force re-login everywhere after a password change.
  await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit({ event: "PASSWORD_RESET", userId: user.id, ip: ctx.ip, severity: AuditSeverity.WARNING, detail: "password changed; all sessions revoked" });
}
