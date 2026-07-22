/**
 * Idempotent seed — safe to run repeatedly (upserts on stable keys, never
 * createMany). Seeds: company, 4 branches, module permissions, 12 roles (one per
 * UserRole enum) with a permission matrix, one demo user per role, commission
 * tiers, services, sample packages, and a demo customer (PII auto-encrypted).
 *
 * Run: npm run prisma:seed   (uses the PII-encrypting Prisma client)
 */
import { prisma } from "../src/lib/prisma";
import { deterministicHash } from "../src/lib/password";
import {
  UserRole,
  ServiceType,
  PackageStatus,
  AgentTier,
  CustomerType,
  ContentStatus,
} from "@prisma/client";

// Password hashing is shared with the login path (src/lib/password) so seeded
// hashes and runtime verification can never drift. Deterministic salt keeps
// re-seeding from churning the column.
const hashPw = (pw: string, email: string) => deterministicHash(pw, email);
const DEMO_PW = "Password123!";

const COMPANY_ID = "cmp_smtravels";
const MODULES = [
  "dashboard", "bookings", "crm", "packages", "accounts",
  "invoices", "reports", "documents", "cms", "ops", "settings",
] as const;

// access matrix: role -> module -> full | view | none (default none)
const FULL = MODULES.reduce((a, m) => ({ ...a, [m]: "full" }), {} as Record<string, string>);
const MATRIX: Partial<Record<UserRole, Record<string, string>>> = {
  SUPER_ADMIN: FULL,
  COMPANY_ADMIN: FULL,
  BRANCH_MANAGER: { dashboard: "full", bookings: "full", crm: "full", packages: "full", documents: "full", ops: "full", accounts: "view", invoices: "view", reports: "view" },
  ACCOUNTANT: { dashboard: "full", accounts: "full", invoices: "full", reports: "full", bookings: "view", documents: "view" },
  STAFF: { dashboard: "full", bookings: "full", crm: "full", documents: "full", packages: "view", reports: "view" },
  SALES_EXECUTIVE: { dashboard: "full", crm: "full", bookings: "full", packages: "view", documents: "view" },
  VISA_EXECUTIVE: { dashboard: "full", bookings: "full", documents: "full", crm: "view", packages: "view" },
  HAJJ_EXECUTIVE: { dashboard: "full", bookings: "full", documents: "full", crm: "view", packages: "view" },
  UMRAH_EXECUTIVE: { dashboard: "full", bookings: "full", documents: "full", crm: "view", packages: "view" },
  AGENT: { dashboard: "view", crm: "full", bookings: "full", packages: "view" },
  SUPPLIER: { dashboard: "view", documents: "view" },
  CUSTOMER: { dashboard: "view" },
};

const BRANCHES = [
  { id: "brn_dhaka", code: "DHK", name: "Head Office — Dhaka", city: "Dhaka", isHq: true, address: "32 Motijheel C/A, Dhaka-1000", phone: "+880 2 9553421", email: "dhaka@smtravel.com.bd" },
  { id: "brn_ctg", code: "CTG", name: "Chittagong Branch", city: "Chittagong", isHq: false, address: "15 Agrabad C/A, Chittagong-4100", phone: "+880 31 714532", email: "ctg@smtravel.com.bd" },
  { id: "brn_syl", code: "SYL", name: "Sylhet Branch", city: "Sylhet", isHq: false, address: "Zindabazar Main Road, Sylhet-3100", phone: "+880 821 716234", email: "sylhet@smtravel.com.bd" },
  { id: "brn_khl", code: "KHL", name: "Khulna Branch", city: "Khulna", isHq: false, address: "KDA Avenue, Khulna-9100", phone: "+880 41 720145", email: "khulna@smtravel.com.bd" },
];

async function main() {
  // 1) Company (singleton)
  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    create: { id: COMPANY_ID, name: "SM Travels International", legalName: "SM Travels International Ltd.", email: "info@smtravel.com.bd", phone: "+880 1712-345678", defaultCurrency: "BDT", timezone: "Asia/Dhaka" },
    update: { name: "SM Travels International" },
  });

  // 2) Branches
  for (const b of BRANCHES) {
    await prisma.branch.upsert({
      where: { id: b.id },
      create: { ...b, companyId: COMPANY_ID },
      update: { name: b.name, city: b.city, isHq: b.isHq, code: b.code },
    });
  }

  // 3) Permissions (one per module)
  for (const m of MODULES) {
    await prisma.permission.upsert({
      where: { key: m },
      create: { key: m, module: m, action: "access", description: `Access the ${m} module` },
      update: { module: m },
    });
  }
  const perms = await prisma.permission.findMany();

  // 4) Roles (one per UserRole enum) + permission matrix
  for (const role of Object.values(UserRole)) {
    const r = await prisma.role.upsert({
      where: { key: role },
      create: { key: role, name: role.replace(/_/g, " "), isSystem: true, description: `Default role for ${role}` },
      update: { name: role.replace(/_/g, " "), isSystem: true },
    });
    const access = MATRIX[role] ?? {};
    for (const p of perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: r.id, permissionId: p.id } },
        create: { roleId: r.id, permissionId: p.id, access: access[p.module] ?? "none" },
        update: { access: access[p.module] ?? "none" },
      });
    }
  }
  const roleByKey = Object.fromEntries((await prisma.role.findMany()).map((r) => [r.key, r.id]));

  const linkRole = async (userId: string, roleKey: string) => {
    const roleId = roleByKey[roleKey];
    if (roleId) {
      await prisma.userRoleLink.upsert({
        where: { userId_roleId: { userId, roleId } },
        create: { userId, roleId },
        update: {},
      });
    }
  };

  // 5) One demo user per role, linked to the matching RBAC role
  for (const role of Object.values(UserRole)) {
    const email = `${role.toLowerCase()}@smtravel.com.bd`;
    const uid = `usr_${role.toLowerCase()}`;
    const u = await prisma.user.upsert({
      where: { id: uid },
      create: {
        id: uid, email, name: `Demo ${role.replace(/_/g, " ")}`, role,
        passwordHash: hashPw(DEMO_PW, email), branchId: "brn_dhaka", status: "active",
      },
      update: { name: `Demo ${role.replace(/_/g, " ")}`, role, branchId: "brn_dhaka" },
    });
    await linkRole(u.id, role);
  }

  // 5b) An extra BRANCH_MANAGER in Chittagong so branch scoping can be proven
  //     across two branches (Dhaka users vs this CTG user).
  const ctgEmail = "ctg.manager@smtravel.com.bd";
  const ctgUser = await prisma.user.upsert({
    where: { id: "usr_ctg_manager" },
    create: {
      id: "usr_ctg_manager", email: ctgEmail, name: "Demo CTG Manager", role: UserRole.BRANCH_MANAGER,
      passwordHash: hashPw(DEMO_PW, ctgEmail), branchId: "brn_ctg", status: "active",
    },
    update: { name: "Demo CTG Manager", role: UserRole.BRANCH_MANAGER, branchId: "brn_ctg" },
  });
  await linkRole(ctgUser.id, UserRole.BRANCH_MANAGER);

  // 6) Commission tiers (volume-driven)
  const tiers: { tier: AgentTier; rate: number; min: number; max: number | null }[] = [
    { tier: "SILVER", rate: 3, min: 0, max: 9 },
    { tier: "GOLD", rate: 5, min: 10, max: 19 },
    { tier: "PLATINUM", rate: 7, min: 20, max: null },
  ];
  for (const t of tiers) {
    await prisma.commissionTier.upsert({
      where: { tier: t.tier },
      create: { tier: t.tier, rate: t.rate, minBookings: t.min, maxBookings: t.max ?? undefined },
      update: { rate: t.rate, minBookings: t.min, maxBookings: t.max ?? undefined },
    });
  }

  // 7) Services
  const services: { key: string; type: ServiceType; name: string; prefix: string }[] = [
    { key: "hajj", type: "HAJJ", name: "Hajj Management", prefix: "HAJJ" },
    { key: "umrah", type: "UMRAH", name: "Umrah Packages", prefix: "UMR" },
    { key: "visa", type: "VISA", name: "Visa Services", prefix: "VISA" },
    { key: "air_ticket", type: "AIR_TICKET", name: "Air Tickets", prefix: "AIR" },
    { key: "manpower", type: "MANPOWER", name: "Manpower Services", prefix: "MNP" },
    { key: "tour", type: "TOUR", name: "Tour Packages", prefix: "TOUR" },
    { key: "hotel", type: "HOTEL", name: "Hotel Booking", prefix: "HTL" },
  ];
  for (const s of services) {
    await prisma.service.upsert({
      where: { key: s.key },
      create: { key: s.key, type: s.type, name: s.name, refPrefix: s.prefix, active: true },
      update: { name: s.name, type: s.type, refPrefix: s.prefix },
    });
  }

  // 8) Sample packages (BDT: exchangeRate=1, baseAmount=basePrice)
  const packages = [
    { id: "pkg_hajj_econ", code: "PKG-HAJJ-ECON", slug: "hajj-economy-2026", type: "HAJJ" as ServiceType, name: "Hajj Economy 2026", basePrice: 295000, seats: 40, tier: "Economy", days: ["Departure from Dhaka", "Madinah Ziyarah", "Hajj Rituals"] },
    { id: "pkg_umrah_gold", code: "PKG-UMR-GOLD", slug: "umrah-gold-package", type: "UMRAH" as ServiceType, name: "Umrah Gold Package", basePrice: 145000, seats: 30, tier: "Gold", days: ["Arrive Madinah", "Makkah Umrah", "Return Dhaka"] },
    { id: "pkg_visa_ksa", code: "PKG-VISA-KSA", slug: "saudi-visit-visa", type: "VISA" as ServiceType, name: "Saudi Arabia Visit Visa", basePrice: 8500, seats: 500, tier: "Standard", days: [] },
    { id: "pkg_tour_dubai", code: "PKG-TOUR-DXB", slug: "tour-dubai-5n6d", type: "TOUR" as ServiceType, name: "Tour Dubai 5N/6D", basePrice: 85000, seats: 24, tier: "Standard", days: ["Arrival Dubai", "City Tour", "Desert Safari"] },
  ];
  for (const p of packages) {
    await prisma.package.upsert({
      where: { id: p.id },
      create: {
        id: p.id, code: p.code, slug: p.slug, type: p.type, name: p.name,
        status: PackageStatus.ACTIVE, basePrice: p.basePrice, currency: "BDT",
        exchangeRate: 1, baseAmount: p.basePrice, totalSeats: p.seats, availableSeats: p.seats,
      },
      update: { name: p.name, basePrice: p.basePrice, baseAmount: p.basePrice },
    });
    await prisma.packagePricing.upsert({
      where: { id: `${p.id}_tier1` },
      create: { id: `${p.id}_tier1`, packageId: p.id, label: p.tier, price: p.basePrice, currency: "BDT", exchangeRate: 1, baseAmount: p.basePrice, seats: p.seats, occupied: 0 },
      update: { price: p.basePrice, baseAmount: p.basePrice },
    });
    for (let i = 0; i < p.days.length; i++) {
      const dayId = `${p.id}_day${i + 1}`;
      await prisma.packageItinerary.upsert({
        where: { id: dayId },
        create: { id: dayId, packageId: p.id, day: i + 1, title: p.days[i] },
        update: { title: p.days[i] },
      });
    }
  }

  // 9) Demo customers in two branches — PII (nid/passport) auto-encrypted by the
  //    Prisma extension. Two branches let branch scoping be proven end to end.
  await prisma.customer.upsert({
    where: { id: "cus_demo" },
    create: {
      id: "cus_demo", branchId: "brn_dhaka", type: CustomerType.INDIVIDUAL,
      name: "Md. Karim Ullah", phone: "+880 1712-000001", email: "karim.demo@example.com",
      nid: "1990123456789", passportNo: "BX0912345", district: "Dhaka", division: "Dhaka",
    },
    update: { name: "Md. Karim Ullah" },
  });
  await prisma.customer.upsert({
    where: { id: "cus_ctg" },
    create: {
      id: "cus_ctg", branchId: "brn_ctg", type: CustomerType.INDIVIDUAL,
      name: "Fatima Begum", phone: "+880 1812-000002", email: "fatima.demo@example.com",
      nid: "1988987654321", passportNo: "BW1122334", district: "Chittagong", division: "Chittagong",
    },
    update: { name: "Fatima Begum" },
  });

  // 10) A promo code + a menu (so CMS isn't empty)
  await prisma.promoCode.upsert({
    where: { id: "promo_hajj100" },
    create: { id: "promo_hajj100", code: "HAJJ100", type: "FLAT", value: 100, currency: "USD", scope: "Hajj Packages" },
    update: { value: 100 },
  });
  await prisma.menu.upsert({
    where: { location: "MAIN_NAV" },
    create: { location: "MAIN_NAV", name: "Primary Navigation" },
    update: { name: "Primary Navigation" },
  });

  // 11) Chart of Accounts (company-wide) — headers + detail accounts by code.
  const COA: { code: string; name: string; parent?: string; cls: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"; role: "HEADER" | "DETAIL" }[] = [
    { code: "1000", name: "Assets", cls: "ASSET", role: "HEADER" },
    { code: "1100", name: "Current Assets", parent: "1000", cls: "ASSET", role: "HEADER" },
    { code: "1110", name: "Cash in Hand", parent: "1100", cls: "ASSET", role: "DETAIL" },
    { code: "1120", name: "Dutch-Bangla Bank – Current", parent: "1100", cls: "ASSET", role: "DETAIL" },
    { code: "1200", name: "Accounts Receivable", parent: "1000", cls: "ASSET", role: "DETAIL" },
    { code: "2000", name: "Liabilities", cls: "LIABILITY", role: "HEADER" },
    { code: "2100", name: "Accounts Payable", parent: "2000", cls: "LIABILITY", role: "DETAIL" },
    { code: "2200", name: "Advance from Customers", parent: "2000", cls: "LIABILITY", role: "DETAIL" },
    { code: "3000", name: "Equity", cls: "EQUITY", role: "HEADER" },
    { code: "3100", name: "Owner Capital", parent: "3000", cls: "EQUITY", role: "DETAIL" },
    { code: "4000", name: "Revenue", cls: "REVENUE", role: "HEADER" },
    { code: "4100", name: "Hajj Package Revenue", parent: "4000", cls: "REVENUE", role: "DETAIL" },
    { code: "4200", name: "Umrah Package Revenue", parent: "4000", cls: "REVENUE", role: "DETAIL" },
    { code: "5000", name: "Expenses", cls: "EXPENSE", role: "HEADER" },
    { code: "5100", name: "Airline Costs", parent: "5000", cls: "EXPENSE", role: "DETAIL" },
    { code: "5200", name: "Salaries & Wages", parent: "5000", cls: "EXPENSE", role: "DETAIL" },
  ];
  const normalBalanceFor = (cls: string) => (cls === "ASSET" || cls === "EXPENSE" ? "DEBIT" : "CREDIT") as "DEBIT" | "CREDIT";
  const acctIdByCode: Record<string, string> = {};
  for (const a of COA) {
    const row = await prisma.account.upsert({
      where: { code: a.code },
      create: { code: a.code, name: a.name, accountClass: a.cls, role: a.role, normalBalance: normalBalanceFor(a.cls), parentId: a.parent ? acctIdByCode[a.parent] : null },
      update: { name: a.name, parentId: a.parent ? acctIdByCode[a.parent] : null },
    });
    acctIdByCode[a.code] = row.id;
  }
  // 12) A couple of bank accounts linked to COA cash/bank accounts.
  await prisma.bankAccount.upsert({
    where: { id: "bank_dbbl" },
    create: { id: "bank_dbbl", name: "Dutch-Bangla Bank Ltd.", bankName: "DBBL", type: "CURRENT", accountNumber: "1021 0110 0000 234", branchName: "Agrabad", currency: "BDT", coaAccountId: acctIdByCode["1120"], balance: 12400000 },
    update: { name: "Dutch-Bangla Bank Ltd." },
  });
  await prisma.bankAccount.upsert({
    where: { id: "bank_cash" },
    create: { id: "bank_cash", name: "Cash in Hand", type: "CASH", currency: "BDT", coaAccountId: acctIdByCode["1110"], balance: 850000 },
    update: { name: "Cash in Hand" },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // REPORT DATA — realistic distribution so the Reports module reconciles and
  // mixed-currency aggregation (baseAmount) is actually exercised. All amounts
  // in baseAmount (BDT); non-BDT rows carry a real exchangeRate. Idempotent.
  // USD→120, SAR→32 exchange rates.
  // ══════════════════════════════════════════════════════════════════════════
  const dt = (s: string) => new Date(`${s}T00:00:00.000Z`);

  // 13) Agents (for AgentCommission + agent bookings)
  const AGENTS = [
    { id: "agt_rahim", agentCode: "AGT-RAHIM", name: "Rahim & Sons", tier: "GOLD" as AgentTier, rate: 5, branchId: "brn_dhaka" },
    { id: "agt_nmt", agentCode: "AGT-NMT", name: "NMT Travels", tier: "GOLD" as AgentTier, rate: 5, branchId: "brn_dhaka" },
  ];
  for (const a of AGENTS) {
    await prisma.agent.upsert({
      where: { id: a.id },
      create: { id: a.id, agentCode: a.agentCode, name: a.name, tier: a.tier, commissionRate: a.rate, branchId: a.branchId, status: "active" },
      update: { name: a.name, tier: a.tier, commissionRate: a.rate, branchId: a.branchId },
    });
  }

  // 14) Confirmed bookings across branches / services / months. Two non-BDT rows
  //     (USD, SAR) so Bookings/Sales totals differ between baseAmount and raw amount.
  const BOOKINGS = [
    { id: "bkg_s1", no: "BK-S-01", branchId: "brn_dhaka", svc: "HAJJ" as ServiceType, amount: 295000, cur: "BDT", rate: 1, base: 295000, paid: 295000, agentId: "agt_rahim", date: "2026-03-05" },
    { id: "bkg_s2", no: "BK-S-02", branchId: "brn_dhaka", svc: "UMRAH" as ServiceType, amount: 145000, cur: "BDT", rate: 1, base: 145000, paid: 145000, agentId: "agt_nmt", date: "2026-05-12" },
    { id: "bkg_s3", no: "BK-S-03", branchId: "brn_ctg", svc: "HAJJ" as ServiceType, amount: 295000, cur: "BDT", rate: 1, base: 295000, paid: 100000, agentId: null, date: "2026-06-08" },
    { id: "bkg_s4", no: "BK-S-04", branchId: "brn_dhaka", svc: "TOUR" as ServiceType, amount: 1000, cur: "USD", rate: 120, base: 120000, paid: 120000, agentId: null, date: "2026-06-20" },
    { id: "bkg_s5", no: "BK-S-05", branchId: "brn_ctg", svc: "VISA" as ServiceType, amount: 8500, cur: "BDT", rate: 1, base: 8500, paid: 0, agentId: null, date: "2026-07-03" },
    { id: "bkg_s6", no: "BK-S-06", branchId: "brn_dhaka", svc: "MANPOWER" as ServiceType, amount: 3000, cur: "SAR", rate: 32, base: 96000, paid: 96000, agentId: null, date: "2026-07-15" },
  ];
  for (const b of BOOKINGS) {
    await prisma.booking.upsert({
      where: { id: b.id },
      create: {
        id: b.id, bookingNo: b.no, branchId: b.branchId, customerId: b.branchId === "brn_ctg" ? "cus_ctg" : "cus_demo",
        serviceType: b.svc, status: "CONFIRMED", amount: b.amount, currency: b.cur as never, exchangeRate: b.rate,
        baseAmount: b.base, paidAmount: b.paid, agentId: b.agentId, createdAt: dt(b.date), travelersCount: 1,
      },
      update: { status: "CONFIRMED", amount: b.amount, baseAmount: b.base, currency: b.cur as never, exchangeRate: b.rate, paidAmount: b.paid, agentId: b.agentId },
    });
  }

  // 15) Issued invoices (Sales report source). issueDate is the business date.
  //     One USD invoice so Sales baseAmount ≠ raw total.
  const INVOICES = [
    { id: "inv_s1", no: "INV-SEED-DHK-01", branchId: "brn_dhaka", cust: "cus_demo", booking: "bkg_s1", status: "SENT", cur: "BDT", rate: 1, total: 200000, base: 200000, paid: 0, date: "2026-04-10" },
    { id: "inv_s2", no: "INV-SEED-DHK-02", branchId: "brn_dhaka", cust: "cus_demo", booking: "bkg_s2", status: "PAID", cur: "BDT", rate: 1, total: 150000, base: 150000, paid: 150000, date: "2026-06-15" },
    { id: "inv_s3", no: "INV-SEED-DHK-03", branchId: "brn_dhaka", cust: "cus_demo", booking: "bkg_s4", status: "PARTIAL", cur: "USD", rate: 120, total: 500, base: 60000, paid: 24000, date: "2026-07-02" },
    { id: "inv_s4", no: "INV-SEED-CTG-01", branchId: "brn_ctg", cust: "cus_ctg", booking: "bkg_s3", status: "PAID", cur: "BDT", rate: 1, total: 90000, base: 90000, paid: 90000, date: "2026-05-20" },
  ];
  for (const v of INVOICES) {
    await prisma.invoice.upsert({
      where: { id: v.id },
      create: {
        id: v.id, invoiceNo: v.no, fiscalYear: 2026, branchId: v.branchId, customerId: v.cust, bookingId: v.booking,
        issueDate: dt(v.date), dueDate: dt(v.date), currency: v.cur as never, exchangeRate: v.rate,
        subtotal: v.total, taxRate: 0, taxAmount: 0, total: v.total, baseAmount: v.base, paidAmount: v.paid, status: v.status as never,
      },
      update: { status: v.status as never, total: v.total, baseAmount: v.base, paidAmount: v.paid, issueDate: dt(v.date), bookingId: v.booking },
    });
    await prisma.invoiceItem.upsert({
      where: { id: `${v.id}_it1` },
      create: { id: `${v.id}_it1`, invoiceId: v.id, description: "Seeded service", qty: 1, unitPrice: v.total, amount: v.total },
      update: { unitPrice: v.total, amount: v.total },
    });
  }

  // 16) Expenses + Income across months / categories / branches, incl non-BDT.
  const EXPENSES = [
    { id: "exp_s1", branchId: "brn_dhaka", cat: "Salaries", amount: 150000, cur: "BDT", rate: 1, base: 150000, status: "PAID", date: "2026-05-05" },
    { id: "exp_s2", branchId: "brn_dhaka", cat: "Airline Costs", amount: 2000, cur: "USD", rate: 120, base: 240000, status: "PAID", date: "2026-06-10" },
    { id: "exp_s3", branchId: "brn_ctg", cat: "Office Rent", amount: 40000, cur: "BDT", rate: 1, base: 40000, status: "PAID", date: "2026-06-01" },
    { id: "exp_s4", branchId: "brn_dhaka", cat: "Marketing", amount: 30000, cur: "BDT", rate: 1, base: 30000, status: "PENDING", date: "2026-07-08" },
    { id: "exp_s5", branchId: "brn_ctg", cat: "Hotel Costs", amount: 5000, cur: "SAR", rate: 32, base: 160000, status: "PAID", date: "2026-07-12" },
  ];
  for (const e of EXPENSES) {
    await prisma.expense.upsert({
      where: { id: e.id },
      create: { id: e.id, ref: e.id.toUpperCase(), branchId: e.branchId, category: e.cat, amount: e.amount, currency: e.cur as never, exchangeRate: e.rate, baseAmount: e.base, status: e.status as never, date: dt(e.date) },
      update: { category: e.cat, amount: e.amount, baseAmount: e.base, status: e.status as never, date: dt(e.date) },
    });
  }
  const INCOME = [
    { id: "inc_s1", branchId: "brn_dhaka", cat: "Commission", amount: 45000, cur: "BDT", rate: 1, base: 45000, status: "CONFIRMED", date: "2026-06-14" },
    { id: "inc_s2", branchId: "brn_ctg", cat: "Service Fee", amount: 20000, cur: "BDT", rate: 1, base: 20000, status: "PENDING", date: "2026-07-06" },
    { id: "inc_s3", branchId: "brn_dhaka", cat: "Refund Adjustment", amount: 300, cur: "USD", rate: 120, base: 36000, status: "CONFIRMED", date: "2026-05-20" },
  ];
  for (const i of INCOME) {
    await prisma.income.upsert({
      where: { id: i.id },
      create: { id: i.id, ref: i.id.toUpperCase(), branchId: i.branchId, category: i.cat, amount: i.amount, currency: i.cur as never, exchangeRate: i.rate, baseAmount: i.base, status: i.status as never, date: dt(i.date) },
      update: { category: i.cat, amount: i.amount, baseAmount: i.base, status: i.status as never, date: dt(i.date) },
    });
  }

  // 17) Agent commissions — 2 agents × 2 periods.
  const COMMISSIONS = [
    { id: "cmm_rahim_06", agentId: "agt_rahim", period: "2026-06", gross: 295000, rate: 5, amount: 14750, status: "PAID" },
    { id: "cmm_rahim_07", agentId: "agt_rahim", period: "2026-07", gross: 100000, rate: 5, amount: 5000, status: "PENDING" },
    { id: "cmm_nmt_06", agentId: "agt_nmt", period: "2026-06", gross: 145000, rate: 5, amount: 7250, status: "PAID" },
    { id: "cmm_nmt_07", agentId: "agt_nmt", period: "2026-07", gross: 60000, rate: 5, amount: 3000, status: "PENDING" },
  ];
  for (const c of COMMISSIONS) {
    await prisma.agentCommission.upsert({
      where: { id: c.id },
      create: { id: c.id, agentId: c.agentId, period: c.period, grossAmount: c.gross, rate: c.rate, amount: c.amount, baseAmount: c.amount, status: c.status as never },
      update: { grossAmount: c.gross, amount: c.amount, baseAmount: c.amount, status: c.status as never },
    });
  }

  // 18) POSTED journal entries (P&L source). Each entry + its balanced lines are
  //     committed in ONE transaction (the balance trigger is deferred to COMMIT).
  //     je_seed_5 is reversed by je_seed_5r → the pair nets to ZERO in P&L.
  const upsertJournal = async (o: { id: string; ref: string; branchId: string; date: string; desc: string; reversalOfId?: string; lines: { id: string; code: string; debit?: number; credit?: number }[] }) => {
    await prisma.$transaction(async (tx) => {
      await tx.journalEntry.upsert({
        where: { id: o.id },
        create: { id: o.id, ref: o.ref, fiscalYear: dt(o.date).getUTCFullYear(), branchId: o.branchId, date: dt(o.date), description: o.desc, status: "POSTED", postedAt: dt(o.date), reversalOfId: o.reversalOfId ?? null },
        update: { description: o.desc, status: "POSTED", date: dt(o.date) },
      });
      for (const l of o.lines) {
        await tx.journalLine.upsert({
          where: { id: l.id },
          create: { id: l.id, entryId: o.id, accountId: acctIdByCode[l.code], debit: l.debit ?? 0, credit: l.credit ?? 0 },
          update: { accountId: acctIdByCode[l.code], debit: l.debit ?? 0, credit: l.credit ?? 0 },
        });
      }
    });
  };
  // 1200 = AR (asset), 1110/1120 = cash/bank (asset), 4100/4200 = revenue, 5100/5200 = expense
  await upsertJournal({ id: "je_seed_1", ref: "JV-SEED-DHK-01", branchId: "brn_dhaka", date: "2026-05-10", desc: "Hajj package revenue", lines: [{ id: "jl_s1a", code: "1200", debit: 500000 }, { id: "jl_s1b", code: "4100", credit: 500000 }] });
  await upsertJournal({ id: "je_seed_2", ref: "JV-SEED-DHK-02", branchId: "brn_dhaka", date: "2026-06-12", desc: "Umrah package revenue", lines: [{ id: "jl_s2a", code: "1200", debit: 300000 }, { id: "jl_s2b", code: "4200", credit: 300000 }] });
  await upsertJournal({ id: "je_seed_3", ref: "JV-SEED-DHK-03", branchId: "brn_dhaka", date: "2026-06-15", desc: "Airline cost", lines: [{ id: "jl_s3a", code: "5100", debit: 200000 }, { id: "jl_s3b", code: "1120", credit: 200000 }] });
  await upsertJournal({ id: "je_seed_4", ref: "JV-SEED-DHK-04", branchId: "brn_dhaka", date: "2026-07-05", desc: "July salaries", lines: [{ id: "jl_s4a", code: "5200", debit: 150000 }, { id: "jl_s4b", code: "1110", credit: 150000 }] });
  // reversed pair (nets to zero in P&L)
  await upsertJournal({ id: "je_seed_5", ref: "JV-SEED-DHK-05", branchId: "brn_dhaka", date: "2026-07-10", desc: "Revenue booked in error", lines: [{ id: "jl_s5a", code: "1200", debit: 80000 }, { id: "jl_s5b", code: "4100", credit: 80000 }] });
  await upsertJournal({ id: "je_seed_5r", ref: "JV-SEED-DHK-05R", branchId: "brn_dhaka", date: "2026-07-10", desc: "Reversal of JV-SEED-DHK-05", reversalOfId: "je_seed_5", lines: [{ id: "jl_s5ra", code: "1200", credit: 80000 }, { id: "jl_s5rb", code: "4100", debit: 80000 }] });
  await prisma.journalEntry.update({ where: { id: "je_seed_5" }, data: { isReversed: true, reversedById: "je_seed_5r" } });
  // one CTG revenue entry so P&L branch-scoping differs (CTG sees only this)
  await upsertJournal({ id: "je_seed_6", ref: "JV-SEED-CTG-01", branchId: "brn_ctg", date: "2026-06-20", desc: "CTG Hajj revenue", lines: [{ id: "jl_s6a", code: "1200", debit: 100000 }, { id: "jl_s6b", code: "4100", credit: 100000 }] });

  // eslint-disable-next-line no-console
  console.log("[seed] done.");
}

main()
  .catch((e) => {
    console.error("[seed] failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
