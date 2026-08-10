/**
 * Phase 8 — production-safe RBAC seed. Adds the dedicated `manpower`, `payroll`,
 * `currency`, `business_network` module permissions + role grants that preserve the
 * access those areas had under the interim reuse (bookings/settings/partners).
 *
 * Idempotent + additive: only upserts these 4 permissions and their RolePermission
 * rows. Touches NO existing permission, role, or demo data. Safe to run on production.
 *   Run:  npm run seed:rbac
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// Mirrors backend/prisma/seed.ts MATRIX additions. Admins (SUPER_ADMIN/COMPANY_ADMIN)
// get full on every module; other roles keep equivalent access to what they had via
// the reused module (manpower←bookings, business_network←partners, payroll/currency←settings+finance).
const GRANTS: Record<string, Partial<Record<UserRole, string>>> = {
  manpower: { SUPER_ADMIN: "full", COMPANY_ADMIN: "full", BRANCH_MANAGER: "full", STAFF: "full", SALES_EXECUTIVE: "full", VISA_EXECUTIVE: "full", HAJJ_EXECUTIVE: "full", UMRAH_EXECUTIVE: "full", AGENT: "full", ACCOUNTANT: "view" },
  payroll: { SUPER_ADMIN: "full", COMPANY_ADMIN: "full", BRANCH_MANAGER: "full", ACCOUNTANT: "full" },
  currency: { SUPER_ADMIN: "full", COMPANY_ADMIN: "full", ACCOUNTANT: "full", BRANCH_MANAGER: "view" },
  business_network: { SUPER_ADMIN: "full", COMPANY_ADMIN: "full", BRANCH_MANAGER: "full", SALES_EXECUTIVE: "view" },
};

async function main() {
  let perms = 0, grants = 0;
  for (const module of Object.keys(GRANTS)) {
    const perm = await prisma.permission.upsert({
      where: { key: module },
      create: { key: module, module, action: "access", description: `Access the ${module} module` },
      update: { module },
    });
    perms++;
    for (const role of Object.values(UserRole)) {
      const r = await prisma.role.upsert({
        where: { key: role },
        create: { key: role, name: role.replace(/_/g, " "), isSystem: true, description: `Default role for ${role}` },
        update: {},
      });
      const access = GRANTS[module][role] ?? "none";
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: r.id, permissionId: perm.id } },
        create: { roleId: r.id, permissionId: perm.id, access },
        update: { access },
      });
      grants++;
    }
  }
  console.log(`RBAC seed complete: ${perms} module permissions, ${grants} role grants (idempotent).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
