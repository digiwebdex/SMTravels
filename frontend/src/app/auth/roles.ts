/**
 * Role → landing dashboard + per-route allow-lists. Shared by ProtectedRoute
 * (guards) and Auth.tsx (post-login redirect) so they can never disagree.
 * Role strings match the backend UserRole enum.
 */
export type Role =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "BRANCH_MANAGER"
  | "STAFF"
  | "ACCOUNTANT"
  | "SALES_EXECUTIVE"
  | "VISA_EXECUTIVE"
  | "HAJJ_EXECUTIVE"
  | "UMRAH_EXECUTIVE"
  | "AGENT"
  | "SUPPLIER"
  | "CUSTOMER";

// Global admins may enter any protected route.
const GLOBAL: Role[] = ["SUPER_ADMIN", "COMPANY_ADMIN"];

// Internal back-office roles that live in the ERP shell.
export const ERP_ROLES: Role[] = [
  "BRANCH_MANAGER",
  "STAFF",
  "ACCOUNTANT",
  "SALES_EXECUTIVE",
  "VISA_EXECUTIVE",
  "HAJJ_EXECUTIVE",
  "UMRAH_EXECUTIVE",
];

/** Where each role lands after login / when redirected off a forbidden route. */
export function dashboardFor(role: string): string {
  switch (role) {
    case "CUSTOMER":
      return "/portal";
    case "AGENT":
      return "/agent";
    case "SUPPLIER":
      return "/supplier";
    case "STAFF":
      return "/staff";
    case "ACCOUNTANT":
      return "/accountant";
    default:
      return "/erp"; // admins, branch managers, executives
  }
}

/** True if `role` may enter a route whose allow-list is `allow`. */
export function isAllowed(role: string, allow: Role[]): boolean {
  return GLOBAL.includes(role as Role) || allow.includes(role as Role);
}
