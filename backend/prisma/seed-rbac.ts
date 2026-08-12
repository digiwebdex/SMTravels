/**
 * Production-safe RBAC reconciliation. Ensures every module permission exists and
 * every role has its designed grant, matching backend/prisma/seed.ts MODULES + MATRIX.
 *
 * Idempotent + ADDITIVE: it upserts the Permission/Role rows and CREATES ONLY the
 * RolePermission rows that are missing — it never downgrades or removes an existing
 * grant. Touches no company/branch/service/demo data. Safe to run on production.
 *   Run:  npm run seed:rbac
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// Canonical module list — mirrors seed.ts MODULES.
const MODULES = [
  "dashboard", "bookings", "crm", "packages", "accounts",
  "invoices", "reports", "documents", "cms", "ops", "settings", "hr",
  "partners", "suppliers", "operations_team", "sales", "communication",
  "manpower", "payroll", "currency", "business_network",
] as const;

const FULL = MODULES.reduce((a, m) => ({ ...a, [m]: "full" }), {} as Record<string, string>);

// Mirrors seed.ts MATRIX (the intended access per role).
const MATRIX: Partial<Record<UserRole, Record<string, string>>> = {
  SUPER_ADMIN: FULL,
  COMPANY_ADMIN: FULL,
  BRANCH_MANAGER: { dashboard: "full", bookings: "full", crm: "full", packages: "full", documents: "full", ops: "full", partners: "full", suppliers: "full", operations_team: "full", sales: "full", communication: "full", hr: "full", accounts: "view", invoices: "view", reports: "view", manpower: "full", business_network: "full", payroll: "full", currency: "view" },
  ACCOUNTANT: { dashboard: "full", accounts: "full", invoices: "full", reports: "full", bookings: "view", documents: "view", hr: "view", manpower: "view", payroll: "full", currency: "full" },
  STAFF: { dashboard: "full", bookings: "full", crm: "full", documents: "full", ops: "full", packages: "view", reports: "view", hr: "view", manpower: "full" },
  SALES_EXECUTIVE: { dashboard: "full", crm: "full", bookings: "full", packages: "view", documents: "view", partners: "view", suppliers: "view", operations_team: "view", sales: "full", communication: "full", manpower: "full", business_network: "view" },
  VISA_EXECUTIVE: { dashboard: "full", bookings: "full", documents: "full", crm: "view", packages: "view", manpower: "full" },
  HAJJ_EXECUTIVE: { dashboard: "full", bookings: "full", documents: "full", ops: "full", crm: "view", packages: "view", manpower: "full" },
  UMRAH_EXECUTIVE: { dashboard: "full", bookings: "full", documents: "full", ops: "full", crm: "view", packages: "view", manpower: "full" },
  AGENT: { dashboard: "view", crm: "full", bookings: "full", packages: "view", manpower: "full" },
  SUPPLIER: { dashboard: "view", documents: "view" },
  CUSTOMER: { dashboard: "view" },
};

async function main() {
  // 1) ensure a Permission row per module
  for (const m of MODULES) {
    await prisma.permission.upsert({
      where: { key: m },
      create: { key: m, module: m, action: "access", description: `Access the ${m} module` },
      update: { module: m },
    });
  }
  const perms = await prisma.permission.findMany();

  // 2) ensure each role has its MATRIX grant — CREATE MISSING ONLY (never downgrade)
  let created = 0, present = 0;
  for (const role of Object.values(UserRole)) {
    const r = await prisma.role.upsert({
      where: { key: role },
      create: { key: role, name: role.replace(/_/g, " "), isSystem: true, description: `Default role for ${role}` },
      update: {},
    });
    const access = MATRIX[role] ?? {};
    for (const p of perms) {
      const has = await prisma.rolePermission.findUnique({ where: { roleId_permissionId: { roleId: r.id, permissionId: p.id } } });
      if (has) { present++; continue; }
      await prisma.rolePermission.create({ data: { roleId: r.id, permissionId: p.id, access: access[p.module] ?? "none" } });
      created++;
    }
  }
  console.log(`RBAC reconcile: ${perms.length} modules, ${created} grants created, ${present} already present (create-missing-only, no downgrades).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
