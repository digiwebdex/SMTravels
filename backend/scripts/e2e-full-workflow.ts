/**
 * Full business workflow E2E (HTTP against local API).
 *
 * Flow: login → agent (+ portal user) → customer → booking DRAFT → confirm
 *       → invoice from booking → payment → verify accounts/income
 *
 * Usage (from backend/, with DATABASE_URL + API up):
 *   npx tsx scripts/e2e-full-workflow.ts
 *
 * Env:
 *   API_BASE   default http://127.0.0.1:4030/api
 *   E2E_EMAIL  default e2e_workflow@smtravel.com.bd
 *   E2E_PASS   default E2eWorkflow!2026
 */
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const API = (process.env.API_BASE || "http://127.0.0.1:4030/api").replace(/\/$/, "");
const E2E_EMAIL = (process.env.E2E_EMAIL || "e2e_workflow@smtravel.com.bd").toLowerCase();
const E2E_PASS = process.env.E2E_PASS || "E2eWorkflow!2026";
const AGENT_EMAIL = `agent.e2e.${Date.now()}@smtravel.com.bd`;
const AGENT_PASS = "AgentE2e!2026";

const prisma = new PrismaClient();

type Json = Record<string, unknown>;

let failures = 0;
function ok(label: string, detail?: unknown) {
  console.log(`✓ ${label}${detail !== undefined ? ` — ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
}
function fail(label: string, detail?: unknown): never {
  failures += 1;
  console.error(`✗ ${label}${detail !== undefined ? ` — ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
  throw new Error(label);
}

async function api<T = Json>(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; expect?: number | number[] } = {},
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data: T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    data = { raw: text } as T;
  }
  const expect = opts.expect ?? [200, 201];
  const allowed = Array.isArray(expect) ? expect : [expect];
  if (!allowed.includes(res.status)) {
    fail(`${method} ${path} → ${res.status}`, data);
  }
  return { status: res.status, data };
}

async function ensureAdmin(): Promise<void> {
  const role = await prisma.role.findUnique({ where: { key: UserRole.SUPER_ADMIN } });
  if (!role) {
    fail("SUPER_ADMIN role missing — run structural seed first (SEED_STRUCTURAL_ONLY=1 npm run prisma:seed)");
  }
  const branch = await prisma.branch.findFirst({ where: { deletedAt: null } });
  if (!branch) {
    fail("No branches — run structural seed first");
  }

  const passwordHash = hashPassword(E2E_PASS);
  const existing = await prisma.user.findFirst({ where: { email: E2E_EMAIL, deletedAt: null } });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: "E2E Workflow Admin",
          role: UserRole.SUPER_ADMIN,
          passwordHash,
          status: "active",
          branchId: existing.branchId ?? branch!.id,
        },
      })
    : await prisma.user.create({
        data: {
          email: E2E_EMAIL,
          name: "E2E Workflow Admin",
          role: UserRole.SUPER_ADMIN,
          passwordHash,
          status: "active",
          branchId: branch!.id,
        },
      });

  await prisma.userRoleLink.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role!.id } },
    create: { userId: user.id, roleId: role!.id },
    update: {},
  });
  ok("E2E admin ready", { email: E2E_EMAIL, userId: user.id, branchId: user.branchId });
}

async function main() {
  console.log(`\n=== SM Travels full workflow E2E ===\nAPI: ${API}\n`);

  // Health
  const health = await api("GET", "/health", { expect: 200 });
  ok("API health", (health.data as Json).status);

  await ensureAdmin();

  // Login
  const login = await api<{ accessToken: string; user: { id: string; role: string } }>(
    "POST",
    "/auth/login",
    { body: { email: E2E_EMAIL, password: E2E_PASS }, expect: 200 },
  );
  const token = login.data.accessToken;
  if (!token) fail("Login missing accessToken", login.data);
  ok("Admin login", { role: login.data.user?.role });

  // Branches
  const branches = await api<{ data: { id: string; name: string }[] }>("GET", "/branches", { token });
  const branchId = branches.data.data?.[0]?.id
    ?? (await prisma.branch.findFirst({ where: { deletedAt: null } }))?.id;
  if (!branchId) fail("No branch available");
  ok("Branch", branchId);

  // Create agent
  const agentRes = await api<{ id: string; agentCode: string; name: string }>(
    "POST",
    "/agents",
    {
      token,
      body: {
        name: `E2E Agent ${Date.now().toString(36)}`,
        branchId,
        phone: `017${String(Date.now()).slice(-8)}`,
        email: AGENT_EMAIL,
        tier: "GOLD",
        commissionRate: 5,
      },
      expect: [200, 201],
    },
  );
  const agentId = agentRes.data.id;
  ok("Create agent", { id: agentId, code: agentRes.data.agentCode });

  // Create agent portal login user
  const agentUser = await api<{ id: string }>(
    "POST",
    "/admin/users",
    {
      token,
      body: {
        name: "E2E Agent Portal",
        email: AGENT_EMAIL,
        password: AGENT_PASS,
        role: "AGENT",
        branchId,
      },
      expect: [200, 201],
    },
  );
  ok("Create agent user", agentUser.data.id);

  // Link agent.userId if update endpoint allows; else prisma
  try {
    await prisma.agent.update({
      where: { id: agentId },
      data: { userId: agentUser.data.id },
    });
    ok("Link agent ↔ user");
  } catch (e) {
    console.warn("! agent.userId link skipped", (e as Error).message);
  }

  // Agent login
  const agentLogin = await api<{ accessToken: string }>(
    "POST",
    "/auth/login",
    { body: { email: AGENT_EMAIL, password: AGENT_PASS }, expect: 200 },
  );
  ok("Agent login");

  // Create customer (unique NID/passport each run)
  const stamp = Date.now().toString().slice(-10);
  const customer = await api<{ id: string; name: string }>(
    "POST",
    "/customers",
    {
      token,
      body: {
        name: `E2E Customer ${stamp}`,
        phone: `018${stamp.slice(-8)}`,
        email: `cust.e2e.${stamp}@example.com`,
        type: "INDIVIDUAL",
        branchId,
        nid: `19${stamp.padStart(11, "0").slice(0, 11)}`,
        passportNo: `BX${stamp.slice(-7)}`,
      },
      expect: [200, 201],
    },
  );
  const customerId = customer.data.id;
  ok("Create customer", customerId);

  // Optional package
  let packageId: string | undefined;
  try {
    const pkgs = await api<{ data: { id: string }[] }>("GET", "/packages?pageSize=5&type=HAJJ", { token, expect: [200] });
    packageId = pkgs.data.data?.[0]?.id;
  } catch {
    /* packages optional */
  }

  // Create booking DRAFT
  const booking = await api<{ id: string; status: string; amount: number }>(
    "POST",
    "/bookings",
    {
      token,
      body: {
        serviceType: "HAJJ",
        amount: 295000,
        currency: "BDT",
        customerId,
        agentId,
        branchId,
        packageId,
        travelers: [
          { name: "Md. E2E Pilgrim", isPrimary: true, passportNo: "BX0912345", gender: "MALE" },
        ],
        detail: {
          packageTier: "Economy",
          season: "2026",
          departureDate: "2026-06-01",
          returnDate: "2026-07-10",
          roomType: "Quad",
          transport: "Group Bus",
          hotelMakkah: "Makkah Hotel",
          hotelMadinah: "Madinah Hotel",
          daysMakkah: 20,
          daysMadinah: 10,
        },
      },
      expect: [200, 201],
    },
  );
  const bookingId = booking.data.id;
  if (booking.data.status !== "DRAFT" && booking.data.status !== "PENDING") {
    fail("Booking should start DRAFT/PENDING", booking.data);
  }
  ok("Create booking", { id: bookingId, status: booking.data.status });

  // Draft autosave
  await api("PATCH", `/bookings/${bookingId}/draft`, {
    token,
    body: { currentStep: 3, wizardData: { step: "travelers", note: "e2e" } },
    expect: [200],
  });
  ok("Draft autosave");

  // Admin confirm / accept
  const confirmed = await api<{ id: string; status: string; bookingNo: string }>(
    "POST",
    `/bookings/${bookingId}/confirm`,
    { token, expect: [200] },
  );
  if (confirmed.data.status !== "CONFIRMED") fail("Confirm did not set CONFIRMED", confirmed.data);
  if (!confirmed.data.bookingNo) fail("Missing bookingNo after confirm", confirmed.data);
  ok("Admin confirm booking", { bookingNo: confirmed.data.bookingNo, status: confirmed.data.status });

  // Invoice from booking
  const invoice = await api<{ id: string; status: string; invoiceNo?: string; total?: number; grandTotal?: number }>(
    "POST",
    `/invoices/from-booking/${bookingId}`,
    { token, body: { issue: true }, expect: [200, 201] },
  );
  const invoiceId = invoice.data.id;
  ok("Invoice from booking", {
    id: invoiceId,
    status: invoice.data.status,
    no: invoice.data.invoiceNo,
  });

  // Partial payment
  const pay1 = await api<{
    payment: { id: string; paymentNo?: string; receiptNo?: string; amount: number };
    invoiceStatus?: string;
  }>(
    "POST",
    "/payments",
    {
      token,
      body: {
        invoiceId,
        bookingId,
        amount: 100000,
        method: "BANK_TRANSFER",
        reference: `E2E-NPSB-${Date.now()}`,
      },
      expect: [200, 201],
    },
  );
  ok("Partial payment", {
    paymentId: pay1.data.payment?.id,
    receiptNo: pay1.data.payment?.receiptNo,
    invoiceStatus: pay1.data.invoiceStatus,
  });

  // Remaining payment
  const pay2 = await api<{
    payment: { id: string; receiptNo?: string };
    invoiceStatus?: string;
  }>(
    "POST",
    "/payments",
    {
      token,
      body: {
        invoiceId,
        bookingId,
        amount: 195000,
        method: "CASH",
        reference: `E2E-CASH-${Date.now()}`,
      },
      expect: [200, 201],
    },
  );
  ok("Final payment", {
    paymentId: pay2.data.payment?.id,
    invoiceStatus: pay2.data.invoiceStatus,
  });

  // Verify booking paidAmount
  const bookingAfter = await api<{ id: string; paidAmount: number; status: string; amount: number }>(
    "GET",
    `/bookings/${bookingId}`,
    { token, expect: 200 },
  );
  const paid = Number(bookingAfter.data.paidAmount);
  const amount = Number(bookingAfter.data.amount);
  if (Math.abs(paid - amount) > 0.01) {
    fail("Booking paidAmount mismatch", { paid, amount });
  }
  ok("Booking paidAmount synced", { paid, amount });

  // Accounts / CoA list
  const accounts = await api<{ data: unknown[] }>("GET", "/accounts?pageSize=20", { token, expect: 200 });
  ok("Chart of accounts", { count: accounts.data.data?.length ?? (accounts.data as unknown as unknown[]) });

  // Income ledger should have entries
  try {
    const income = await api<{ data: unknown[] }>("GET", "/income?pageSize=10", { token, expect: 200 });
    ok("Income ledger", { count: Array.isArray(income.data.data) ? income.data.data.length : "ok" });
  } catch (e) {
    console.warn("! income list", (e as Error).message);
  }

  // Expenses endpoint smoke
  try {
    await api("GET", "/expenses?pageSize=5", { token, expect: 200 });
    ok("Expenses list");
  } catch (e) {
    console.warn("! expenses list", (e as Error).message);
  }

  // Bank accounts
  try {
    await api("GET", "/bank-accounts", { token, expect: 200 });
    ok("Bank accounts");
  } catch (e) {
    console.warn("! bank accounts", (e as Error).message);
  }

  // Agent wallet / commission check
  try {
    const wallet = await prisma.agentWallet.findUnique({ where: { agentId } });
    ok("Agent wallet", wallet ? { balance: Number(wallet.balance), currency: wallet.currency } : "missing");
  } catch (e) {
    console.warn("! wallet", (e as Error).message);
  }

  // Agent portal with AGENT token (not admin)
  const agentTok = agentLogin.data.accessToken;
  try {
    const dash = await api("GET", "/portal/agent/dashboard", {
      token: agentTok,
      expect: [200],
    });
    ok("Agent portal dashboard", Object.keys(dash.data as object).slice(0, 6));
  } catch (e) {
    console.warn("! agent portal dashboard", (e as Error).message);
  }

  // Extra service flows: UMRAH + VISA (confirm → invoice → pay)
  for (const flow of [
    {
      label: "UMRAH",
      serviceType: "UMRAH",
      amount: 145000,
      detail: {
        packageTier: "Gold",
        season: "2026",
        departureDate: "2026-09-01",
        returnDate: "2026-09-14",
        roomType: "Double",
        transport: "Private Car",
        hotelMakkah: "Haram View",
        hotelMadinah: "Nabawi View",
      },
    },
    {
      label: "VISA",
      serviceType: "VISA",
      amount: 8500,
      detail: {
        destinationCountry: "Saudi Arabia",
        visaType: "Visit",
        processingSpeed: "Standard",
        passportCount: 1,
        purpose: "Umrah",
      },
    },
  ] as const) {
    const b = await api<{ id: string }>("POST", "/bookings", {
      token,
      body: {
        serviceType: flow.serviceType,
        amount: flow.amount,
        currency: "BDT",
        customerId,
        agentId,
        branchId,
        travelers: [{ name: `E2E ${flow.label}`, isPrimary: true, passportNo: "BX0999999" }],
        detail: flow.detail,
      },
      expect: [200, 201],
    });
    await api("POST", `/bookings/${b.data.id}/confirm`, { token, expect: 200 });
    const inv = await api<{ id: string }>("POST", `/invoices/from-booking/${b.data.id}`, {
      token,
      body: { issue: true },
      expect: [200, 201],
    });
    await api("POST", "/payments", {
      token,
      body: {
        invoiceId: inv.data.id,
        bookingId: b.data.id,
        amount: flow.amount,
        method: "CASH",
        reference: `E2E-${flow.label}-${Date.now()}`,
      },
      expect: [200, 201],
    });
    ok(`${flow.label} booking → invoice → paid`);
  }

  // Invoice detail
  const invDetail = await api<Json>("GET", `/invoices/${invoiceId}`, { token, expect: 200 });
  ok("Invoice detail", {
    status: invDetail.data.status,
    paid: invDetail.data.paidAmount ?? invDetail.data.amountPaid,
  });

  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({
    admin: E2E_EMAIL,
    agentId,
    agentEmail: AGENT_EMAIL,
    customerId,
    bookingId,
    bookingNo: confirmed.data.bookingNo,
    invoiceId,
    invoiceNo: invoice.data.invoiceNo,
    payments: [pay1.data.payment?.id, pay2.data.payment?.id],
  }, null, 2));
  console.log("\nAll critical workflow steps passed.\n");
}

main()
  .catch((e) => {
    console.error("\nE2E FAILED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
