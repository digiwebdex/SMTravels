import type { Request, Response, NextFunction } from "express";
import { UserRole, AuditSeverity } from "@prisma/client";
import { verifyAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { audit, clientIp } from "../lib/audit";
import { HttpError } from "./errorHandler";

export interface AuthCtx {
  userId: string;
  role: UserRole;
  branchId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by requireAuth once a valid access token is presented. */
      auth?: AuthCtx;
    }
  }
}

/** Roles that see every branch. RBAC is the fine-grained source of truth; this
 *  list only decides branch-scope visibility. */
const GLOBAL_ROLES: readonly UserRole[] = [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN];
export function isGlobalRole(role: UserRole): boolean {
  return GLOBAL_ROLES.includes(role);
}

/** Verify the Bearer access token and attach req.auth. 401 on missing/invalid/expired. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "Missing bearer token", requestId: req.id });
    return;
  }
  try {
    const claims = verifyAccessToken(token);
    req.auth = { userId: claims.sub, role: claims.role, branchId: claims.branchId };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token", requestId: req.id });
  }
}

/** Coarse gate on the token's role hint (fast, no DB). Use for route-family
 *  guards like "/erp/* needs a staff role"; use requirePermission for fine grain. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized", requestId: req.id });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      void audit({
        event: "PERMISSION_DENIED",
        userId: req.auth.userId,
        ip: clientIp(req),
        resource: "role",
        severity: AuditSeverity.WARNING,
        detail: `need one of [${roles.join(",")}], had ${req.auth.role}`,
      });
      res.status(403).json({ error: "Forbidden", requestId: req.id });
      return;
    }
    next();
  };
}

/** Fine-grained gate that reads the RBAC tables (the authorization source of
 *  truth). `action:"view"` passes on access view|full; `action:"manage"` needs full. */
export function requirePermission(module: string, action: "view" | "manage" = "view") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        res.status(401).json({ error: "Unauthorized", requestId: req.id });
        return;
      }
      const grants = await prisma.rolePermission.findMany({
        where: { role: { users: { some: { userId: req.auth.userId } } }, permission: { module } },
        select: { access: true },
      });
      const ok = grants.some((g) =>
        action === "view" ? g.access === "view" || g.access === "full" : g.access === "full",
      );
      if (!ok) {
        void audit({
          event: "PERMISSION_DENIED",
          userId: req.auth.userId,
          ip: clientIp(req),
          resource: module,
          severity: AuditSeverity.WARNING,
          detail: `${module}.${action}`,
        });
        res.status(403).json({ error: "Forbidden", message: `Missing ${module}.${action}`, requestId: req.id });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── Branch scoping ─────────────────────────────────────────────────────────
// The reusable helper every future list query applies. Global roles see all
// branches; everyone else is pinned to their own branch. Because the filter
// lives in the WHERE clause, a scoped user cannot fetch another branch's row
// even by guessing its id — the query simply returns nothing (→ 404).

/** WHERE fragment scoping a query to the caller's branch. Spread into `where`. */
export function branchWhere(auth: AuthCtx): { branchId?: string } {
  if (isGlobalRole(auth.role)) return {};
  // Non-global user with no branch matches nothing (sentinel id never exists).
  return { branchId: auth.branchId ?? "__no_branch__" };
}

/** Guard for a record already in hand — true if the caller may see this branch. */
export function canAccessBranch(auth: AuthCtx, branchId: string | null): boolean {
  return isGlobalRole(auth.role) || auth.branchId === branchId;
}

/** Resolve the branch a write targets: global roles may pass one (else their own);
 *  everyone else is forced onto their own branch regardless of what they send. */
export function resolveBranchId(auth: AuthCtx, requested?: string | null): string {
  if (isGlobalRole(auth.role)) {
    const b = requested || auth.branchId;
    if (!b) throw new HttpError(400, "BranchRequired", { detail: "Specify branchId (no home branch on this account)" });
    return b;
  }
  if (!auth.branchId) throw new HttpError(403, "NoBranch");
  return auth.branchId;
}

// ─── Ownership scoping (portal users see ONLY their own records) ─────────────
// A tighter scope than branchWhere(): portal roles (CUSTOMER/AGENT/SUPPLIER) are
// pinned to the Customer/Agent/Supplier record their User is linked to. The owner
// id is resolved SERVER-SIDE from the session — never from a client-supplied id —
// and lives in the WHERE clause, so a portal user cannot read another owner's row
// even by guessing its id: the query returns nothing (→ 404). Same guarantee as
// branch scoping, one level tighter.

export interface OwnerScope {
  role: UserRole;
  customerId: string | null;
  agentId: string | null;
  supplierId: string | null;
}

/** Resolve the portal owner behind the session (one DB lookup). Throws 403 if the
 *  role is not a portal role, or the account has no linked owner profile. */
export async function resolveOwner(auth: AuthCtx): Promise<OwnerScope> {
  const base: OwnerScope = { role: auth.role, customerId: null, agentId: null, supplierId: null };
  switch (auth.role) {
    case UserRole.CUSTOMER: {
      const c = await prisma.customer.findFirst({ where: { userId: auth.userId, deletedAt: null }, select: { id: true } });
      if (!c) throw new HttpError(403, "NoCustomerProfile", { detail: "This account is not linked to a customer profile." });
      return { ...base, customerId: c.id };
    }
    case UserRole.AGENT: {
      const a = await prisma.agent.findFirst({ where: { userId: auth.userId, deletedAt: null }, select: { id: true } });
      if (!a) throw new HttpError(403, "NoAgentProfile", { detail: "This account is not linked to an agent profile." });
      return { ...base, agentId: a.id };
    }
    case UserRole.SUPPLIER: {
      const s = await prisma.supplier.findFirst({ where: { userId: auth.userId, deletedAt: null }, select: { id: true } });
      if (!s) throw new HttpError(403, "NoSupplierProfile", { detail: "This account is not linked to a supplier profile." });
      return { ...base, supplierId: s.id };
    }
    default:
      throw new HttpError(403, "NotAPortalUser", { detail: "This endpoint is for portal (customer/agent/supplier) accounts." });
  }
}

/** Convenience: the caller's own customer id, or 403 if not a linked customer. */
export async function requireCustomerId(auth: AuthCtx): Promise<string> {
  const owner = await resolveOwner(auth);
  if (!owner.customerId) throw new HttpError(403, "NotACustomer", { detail: "This endpoint is for customer portal accounts." });
  return owner.customerId;
}

/** Convenience: the caller's own agent id, or 403 if not a linked agent. */
export async function requireAgentId(auth: AuthCtx): Promise<string> {
  const owner = await resolveOwner(auth);
  if (!owner.agentId) throw new HttpError(403, "NotAnAgent", { detail: "This endpoint is for agent portal accounts." });
  return owner.agentId;
}

/** Convenience: the caller's own supplier id, or 403 if not a linked supplier. */
export async function requireSupplierId(auth: AuthCtx): Promise<string> {
  const owner = await resolveOwner(auth);
  if (!owner.supplierId) throw new HttpError(403, "NotASupplier", { detail: "This endpoint is for supplier portal accounts." });
  return owner.supplierId;
}
