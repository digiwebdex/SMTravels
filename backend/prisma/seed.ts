/**
 * Idempotent seed — safe to run repeatedly (upserts on stable keys, never
 * createMany). Seeds: company, 4 branches, module permissions, 12 roles (one per
 * UserRole enum) with a permission matrix, one demo user per role, commission
 * tiers, services, sample packages, and a demo customer (PII auto-encrypted).
 *
 * Run: npm run prisma:seed   (uses the PII-encrypting Prisma client)
 */
import { createHash, scryptSync } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import {
  UserRole,
  ServiceType,
  PackageStatus,
  AgentTier,
  CustomerType,
  ContentStatus,
} from "@prisma/client";

// deterministic password hash so re-seeding doesn't churn the column
function hashPw(pw: string, email: string): string {
  const salt = createHash("sha256").update(email).digest().subarray(0, 16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, 64).toString("hex")}`;
}
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
    const roleId = roleByKey[role];
    if (roleId) {
      await prisma.userRoleLink.upsert({
        where: { userId_roleId: { userId: u.id, roleId } },
        create: { userId: u.id, roleId },
        update: {},
      });
    }
  }

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

  // 9) Demo customer — PII (nid/passport) is auto-encrypted by the Prisma extension
  await prisma.customer.upsert({
    where: { id: "cus_demo" },
    create: {
      id: "cus_demo", branchId: "brn_dhaka", type: CustomerType.INDIVIDUAL,
      name: "Md. Karim Ullah", phone: "+880 1712-000001", email: "karim.demo@example.com",
      nid: "1990123456789", passportNo: "BX0912345", district: "Dhaka", division: "Dhaka",
    },
    update: { name: "Md. Karim Ullah" },
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
