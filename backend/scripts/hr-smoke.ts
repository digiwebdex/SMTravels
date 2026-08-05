/**
 * HR Phase 1 smoke tests — run: npx tsx scripts/hr-smoke.ts
 * Requires DATABASE_URL (smtravels_dev) and applied migrations + seeded demo users.
 */
import { PrismaClient, UserRole } from "@prisma/client";
import * as hr from "../src/services/hr.service";
import type { AuthCtx } from "../src/middleware/auth";

const prisma = new PrismaClient();

function auth(userId: string, role: UserRole, branchId: string | null): AuthCtx {
  return { userId, role, branchId };
}

async function main() {
  let failed = 0;
  const assert = (cond: boolean, msg: string) => {
    if (!cond) { console.error("FAIL:", msg); failed++; }
    else console.log("OK:", msg);
  };

  const dhaka = await prisma.branch.findFirst({ where: { id: "brn_dhaka" } });
  const ctg = await prisma.branch.findFirst({ where: { id: "brn_ctg" } });
  assert(!!dhaka && !!ctg, "seed branches exist");

  const adminUser = await prisma.user.findFirst({ where: { role: UserRole.SUPER_ADMIN, deletedAt: null } });
  const branchMgr = await prisma.user.findFirst({ where: { role: UserRole.BRANCH_MANAGER, branchId: "brn_ctg", deletedAt: null } });
  assert(!!adminUser, "super admin user exists (run demo seed if missing)");
  assert(!!branchMgr, "CTG branch manager exists");

  if (!adminUser || !branchMgr || !dhaka || !ctg) {
    await prisma.$disconnect();
    process.exit(1);
  }

  const admin = auth(adminUser.id, UserRole.SUPER_ADMIN, adminUser.branchId);
  const ctgAuth = auth(branchMgr.id, UserRole.BRANCH_MANAGER, "brn_ctg");

  const e1 = await hr.createEmployee(admin, {
    firstName: "Smoke", lastName: "Dhaka", branchId: "brn_dhaka", status: "JOINED",
  });
  const e2 = await hr.createEmployee(admin, {
    firstName: "Smoke", lastName: "Ctg", branchId: "brn_ctg", status: "JOINED",
  });
  assert(!!e1.id && String(e1.employeeCode).startsWith("EMP-"), "employee code auto-generated");
  assert(e1.branchId === "brn_dhaka" && e2.branchId === "brn_ctg", "employees on correct branches");

  const ctgList = await hr.listEmployees(ctgAuth, { page: 1, pageSize: 100, dir: "desc" });
  const seesDhaka = ctgList.data.some((r) => r.id === e1.id);
  const seesCtg = ctgList.data.some((r) => r.id === e2.id);
  assert(!seesDhaka, "branch manager cannot see other-branch employee");
  assert(seesCtg, "branch manager sees own-branch employee");

  const adminList = await hr.listEmployees(admin, { page: 1, pageSize: 100, dir: "desc", q: "Smoke" });
  assert(adminList.data.length >= 2, "global admin lists both smoke employees");

  const annual = await prisma.hrLeaveType.findFirst({ where: { code: "ANNUAL", deletedAt: null } });
  assert(!!annual, "ANNUAL leave type seeded");
  if (annual) {
    const req = await hr.createLeaveRequest(admin, {
      employeeId: e2.id,
      leaveTypeId: annual.id,
      fromDate: "2026-08-10",
      toDate: "2026-08-11",
      reason: "smoke",
      submit: true,
    });
    assert(req.status === "SUBMITTED", "leave submitted");
    await prisma.hrLeaveRequest.update({ where: { id: req.id }, data: { status: "MANAGER_APPROVED" } });
    const approved = await hr.hrApproveLeave(admin, req.id, { note: "ok" });
    assert(approved.status === "HR_APPROVED", "HR approved leave");
  }

  const dash = await hr.getDashboard(admin);
  assert(typeof dash.employeesCount === "number" && dash.employeesCount >= 2, "dashboard employeesCount");

  const table = await hr.buildTable(admin, { report: "employees", format: "csv" });
  assert(table.headers.length > 0, "employees report builds");

  await hr.deleteEmployee(admin, e1.id);
  await hr.deleteEmployee(admin, e2.id);
  const gone = await prisma.employee.findFirst({ where: { id: e1.id, deletedAt: null } });
  assert(!gone, "soft-deleted employee hidden");

  const perm = await prisma.permission.findFirst({ where: { key: "hr" } });
  assert(!!perm, "hr permission seeded");

  const rolePerm = await prisma.rolePermission.findFirst({
    where: { permission: { key: "hr" }, role: { key: "SUPER_ADMIN" }, access: "full" },
  });
  assert(!!rolePerm, "SUPER_ADMIN has hr full");

  await prisma.$disconnect();
  if (failed) {
    console.error(`\n${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log("\nAll HR smoke tests passed.");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
