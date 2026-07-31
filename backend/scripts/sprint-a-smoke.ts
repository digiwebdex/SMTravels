/**
 * Sprint A smoke — mount verification + auth'd module probes.
 * Run: DATABASE_URL=... npx tsx scripts/sprint-a-smoke.ts
 */
import { PrismaClient, UserRole } from "@prisma/client";

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:4030/api";
const prisma = new PrismaClient();

async function login(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await res.json()) as Record<string, unknown>;
  const token =
    (body.accessToken as string) ||
    (body.token as string) ||
    ((body.data as Record<string, unknown> | undefined)?.accessToken as string) ||
    null;
  return token;
}

async function get(path: string, token?: string): Promise<number> {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  return res.status;
}

async function main() {
  let failed = 0;
  const ok = (cond: boolean, msg: string) => {
    if (!cond) {
      console.error("FAIL:", msg);
      failed++;
    } else console.log("OK:", msg);
  };

  ok((await get("/health")) === 200, "GET /health → 200");

  // Mounted routes must not 404 when unauthenticated (401/403 OK)
  for (const path of ["/dashboard/summary", "/partners", "/hr/dashboard"]) {
    const s = await get(path);
    ok(s === 401 || s === 403, `${path} mounted (got ${s}, not 404)`);
  }

  // Orphan APIs must stay gone
  for (const path of ["/ops/quotas", "/quotations", "/operations-team", "/sms/templates"]) {
    const s = await get(path);
    ok(s === 404, `${path} absent (got ${s})`);
  }

  const admin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN, deletedAt: null },
    select: { email: true },
  });
  ok(!!admin?.email, `super admin exists (${admin?.email ?? "none"})`);

  const candidates = ["Password123!", process.env.SMOKE_PASSWORD].filter(Boolean) as string[];
  let token: string | null = null;
  if (admin?.email) {
    for (const pw of candidates) {
      token = await login(admin.email, pw);
      if (token) {
        console.log("OK: login succeeded");
        break;
      }
    }
  }
  if (!token) {
    console.log("SKIP: authenticated probes (no known password — set SMOKE_PASSWORD)");
  } else {
    for (const path of ["/auth/me", "/dashboard/summary", "/partners", "/hr/dashboard", "/customers?page=1&pageSize=5", "/bookings?page=1&pageSize=5", "/invoices?page=1&pageSize=5", "/reports/overview", "/cms/pages?page=1&pageSize=5"]) {
      const s = await get(path, token);
      ok(s >= 200 && s < 300, `auth GET ${path} → ${s}`);
    }
    for (const path of ["/portal/me", "/system/smtp/status", "/system/gemini/status", "/system/google-vision/status"]) {
      const s = await get(path, token);
      ok(s >= 200 && s < 500, `auth GET ${path} → ${s}`);
    }
  }

  // DB integrity: HR tables + permissions
  const hrPerm = await prisma.permission.findFirst({ where: { module: "hr" } });
  const partnersPerm = await prisma.permission.findFirst({ where: { module: "partners" } });
  ok(!!hrPerm, "hr permission seeded");
  ok(!!partnersPerm, "partners permission seeded");
  ok((await prisma.hrLeaveType.count()) > 0, "leave types present");

  await prisma.$disconnect();
  if (failed) {
    console.error(`\n${failed} smoke check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll Sprint A smoke checks passed.");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
