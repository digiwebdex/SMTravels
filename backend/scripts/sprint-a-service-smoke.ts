import { PrismaClient, UserRole } from "@prisma/client";
import * as dash from "../src/services/dashboard.service";
import * as partners from "../src/services/partners.service";
import * as hr from "../src/services/hr.service";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: UserRole.SUPER_ADMIN, deletedAt: null } });
  if (!admin) throw new Error("no admin");
  const auth = { userId: admin.id, role: admin.role, branchId: admin.branchId };
  const summary = await dash.getSummary(auth, { range: "this-month" } as never);
  console.log("OK dashboard keys", Object.keys(summary).slice(0, 10).join(","));
  const plist = await partners.listPartners(auth, {} as never);
  console.log("OK partners", "total" in plist ? (plist as { total: number }).total : (plist as { data: unknown[] }).data.length);
  const hd = await hr.getDashboard(auth);
  console.log("OK hr employeesCount", hd.employeesCount);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
