import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { dashboardFor, isAllowed, type Role } from "./roles";
import { SkeletonPage } from "../lib/ds";

/**
 * Gate a route subtree.
 *  - still bootstrapping  → app skeleton (no flicker to /login on refresh)
 *  - anonymous            → /login (remembering where they were headed)
 *  - wrong role           → bounced to their own dashboard
 */
export function ProtectedRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <SkeletonPage />;
  if (status === "anon" || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isAllowed(user.role, allow)) {
    return <Navigate to={dashboardFor(user.role)} replace />;
  }
  return <>{children}</>;
}
