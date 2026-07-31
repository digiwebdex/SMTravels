/**
 * Idempotent seed — safe to run repeatedly (upserts on stable keys, never
 * createMany). Seeds: company, 4 branches, module permissions, 12 roles (one per
 * UserRole enum) with a permission matrix, one demo user per role, commission
 * tiers, services, sample packages, and a demo customer (PII auto-encrypted).
 *
 * Run: npm run prisma:seed   (uses the PII-encrypting Prisma client)
 *
 * Phases:
 *   seedStructural() — always runs; safe on production (upserts only, no demo users).
 *   seedDemo()       — skipped when NODE_ENV=production or SEED_STRUCTURAL_ONLY=1.
 *
 * Structural-only on any environment:
 *   SEED_STRUCTURAL_ONLY=1 npx tsx prisma/seed.ts
 *   # or: npm run prisma:seed  (production auto-skips demo)
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
  "partners", "hr",
] as const;

// access matrix: role -> module -> full | view | none (default none)
const FULL = MODULES.reduce((a, m) => ({ ...a, [m]: "full" }), {} as Record<string, string>);
const MATRIX: Partial<Record<UserRole, Record<string, string>>> = {
  SUPER_ADMIN: FULL,
  COMPANY_ADMIN: FULL,
  BRANCH_MANAGER: { dashboard: "full", bookings: "full", crm: "full", packages: "full", documents: "full", ops: "full", accounts: "view", invoices: "view", reports: "view", partners: "full", hr: "full" },
  ACCOUNTANT: { dashboard: "full", accounts: "full", invoices: "full", reports: "full", bookings: "view", documents: "view", hr: "view" },
  STAFF: { dashboard: "full", bookings: "full", crm: "full", documents: "full", packages: "view", reports: "view" },
  SALES_EXECUTIVE: { dashboard: "full", crm: "full", bookings: "full", packages: "view", documents: "view" },
  VISA_EXECUTIVE: { dashboard: "full", bookings: "full", documents: "full", crm: "view", packages: "view" },
  HAJJ_EXECUTIVE: { dashboard: "full", bookings: "full", documents: "full", crm: "view", packages: "view" },
  UMRAH_EXECUTIVE: { dashboard: "full", bookings: "full", documents: "full", crm: "view", packages: "view" },
  // Portal roles must not inherit ERP module grants (portal APIs use requireRole).
  AGENT: {},
  SUPPLIER: {},
  CUSTOMER: {},
};

const BRANCHES = [
  { id: "brn_dhaka", code: "DHK", name: "Head Office — Dhaka", city: "Dhaka", isHq: true, address: "32 Motijheel C/A, Dhaka-1000", phone: "+880 2 9553421", email: "dhaka@smtravel.com.bd" },
  { id: "brn_ctg", code: "CTG", name: "Chittagong Branch", city: "Chittagong", isHq: false, address: "15 Agrabad C/A, Chittagong-4100", phone: "+880 31 714532", email: "ctg@smtravel.com.bd" },
  { id: "brn_syl", code: "SYL", name: "Sylhet Branch", city: "Sylhet", isHq: false, address: "Zindabazar Main Road, Sylhet-3100", phone: "+880 821 716234", email: "sylhet@smtravel.com.bd" },
  { id: "brn_khl", code: "KHL", name: "Khulna Branch", city: "Khulna", isHq: false, address: "KDA Avenue, Khulna-9100", phone: "+880 41 720145", email: "khulna@smtravel.com.bd" },
];


// ── shared helper: link a user to an RBAC role (used by both phases) ─────────
let _roleByKey: Record<string, string> | null = null;
async function linkRole(userId: string, roleKey: string): Promise<void> {
  _roleByKey ??= Object.fromEntries((await prisma.role.findMany()).map((r) => [r.key, r.id]));
  const roleId = _roleByKey[roleKey];
  if (roleId) {
    await prisma.userRoleLink.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });
  }
}

/**
 * STRUCTURAL seed — the only phase production runs. Master/reference data a
 * fresh install needs to operate: company, branches, RBAC, commission tiers,
 * services, chart of accounts, bank accounts. Idempotent (stable-id upserts).
 * NO users, NO sample transactions, NO demo credentials.
 */
async function seedStructural() {
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

  // 4b) Default HR leave types
  const leaveTypes = [
    { id: "hrlt_annual", name: "Annual", code: "ANNUAL", paid: true, openingBalance: 20, maxPerYear: 20, carryForward: true, maxCarryForward: 5 },
    { id: "hrlt_casual", name: "Casual", code: "CASUAL", paid: true, openingBalance: 10, maxPerYear: 10, carryForward: false },
    { id: "hrlt_sick", name: "Sick", code: "SICK", paid: true, openingBalance: 14, maxPerYear: 14, carryForward: false },
    { id: "hrlt_maternity", name: "Maternity", code: "MATERNITY", paid: true, openingBalance: 0, maxPerYear: 112, carryForward: false },
    { id: "hrlt_paternity", name: "Paternity", code: "PATERNITY", paid: true, openingBalance: 0, maxPerYear: 7, carryForward: false },
    { id: "hrlt_unpaid", name: "Unpaid", code: "UNPAID", paid: false, openingBalance: 0, allowNegativeBalance: true },
    { id: "hrlt_special", name: "Special", code: "SPECIAL", paid: true, openingBalance: 0, maxPerYear: 5, carryForward: false },
  ];
  for (const lt of leaveTypes) {
    await prisma.hrLeaveType.upsert({
      where: { code: lt.code },
      create: {
        id: lt.id,
        name: lt.name,
        code: lt.code,
        paid: lt.paid,
        openingBalance: lt.openingBalance,
        maxPerYear: lt.maxPerYear ?? null,
        carryForward: lt.carryForward ?? false,
        maxCarryForward: lt.maxCarryForward ?? null,
        allowNegativeBalance: lt.allowNegativeBalance ?? false,
      },
      update: { name: lt.name, paid: lt.paid, active: true },
    });
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

  // 11) Chart of Accounts (company-wide) — headers + detail accounts by code.
  const COA: { code: string; name: string; parent?: string; cls: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"; role: "HEADER" | "DETAIL" }[] = [
    { code: "1000", name: "Assets", cls: "ASSET", role: "HEADER" },
    { code: "1100", name: "Current Assets", parent: "1000", cls: "ASSET", role: "HEADER" },
    { code: "1110", name: "Cash in Hand", parent: "1100", cls: "ASSET", role: "DETAIL" },
    { code: "1120", name: "Dutch-Bangla Bank – Current (NPSB receiving account)", parent: "1100", cls: "ASSET", role: "DETAIL" },
    { code: "1121", name: "Islami Bank Bangladesh – Current (NPSB receiving account)", parent: "1100", cls: "ASSET", role: "DETAIL" },
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
  for (const a of COA) {
    const row = await prisma.account.upsert({
      where: { code: a.code },
      create: { code: a.code, name: a.name, accountClass: a.cls, role: a.role, normalBalance: normalBalanceFor(a.cls), parentId: a.parent ? acctIdByCode[a.parent] : null },
      update: { name: a.name, parentId: a.parent ? acctIdByCode[a.parent] : null },
    });
    acctIdByCode[a.code] = row.id;
  }
  // 12) Bank accounts linked to COA — NPSB receiving accounts for client payments.
  await prisma.bankAccount.upsert({
    where: { id: "bank_dbbl" },
    create: {
      id: "bank_dbbl", name: "DBBL – NPSB receiving account", bankName: "Dutch-Bangla Bank Ltd. (DBBL)",
      type: "CURRENT", accountNumber: "1021 0110 0000 234", branchName: "Motijheel", currency: "BDT",
      coaAccountId: acctIdByCode["1120"], balance: 12400000, active: true,
    },
    update: {
      name: "DBBL – NPSB receiving account", bankName: "Dutch-Bangla Bank Ltd. (DBBL)",
      accountNumber: "1021 0110 0000 234", branchName: "Motijheel", active: true,
    },
  });
  await prisma.bankAccount.upsert({
    where: { id: "bank_ibbl" },
    create: {
      id: "bank_ibbl", name: "Islami Bank – NPSB receiving account", bankName: "Islami Bank Bangladesh Ltd. (IBBL)",
      type: "CURRENT", accountNumber: "2051 0210 0000 567", branchName: "Gulshan", currency: "BDT",
      coaAccountId: acctIdByCode["1121"], balance: 8750000, active: true,
    },
    update: {
      name: "Islami Bank – NPSB receiving account", bankName: "Islami Bank Bangladesh Ltd. (IBBL)",
      accountNumber: "2051 0210 0000 567", branchName: "Gulshan", active: true,
    },
  });
  await prisma.bankAccount.upsert({
    where: { id: "bank_cash" },
    create: { id: "bank_cash", name: "Cash in Hand", type: "CASH", currency: "BDT", coaAccountId: acctIdByCode["1110"], balance: 850000, active: true },
    update: { name: "Cash in Hand", active: true },
  });

  // ── Default notification templates (idempotent by stable id) ───────────────
  const tplSeed: Array<{ id: string; channel: "EMAIL" | "SMS" | "WHATSAPP"; event: string; name: string; content: string }> = [
    { id: "tpl_email_booking_created", channel: "EMAIL", event: "booking_created", name: "Booking Created (Email)", content: "Dear {name},\n\nYour {service} booking is confirmed. Booking No: {bookingNo}.{departure}\n\nSM Travels International" },
    { id: "tpl_sms_booking_created", channel: "SMS", event: "booking_created", name: "Booking Created (SMS)", content: "SM Travels: your {service} booking {bookingNo} is confirmed." },
    { id: "tpl_wa_booking_created", channel: "WHATSAPP", event: "booking_created", name: "Booking Created (WhatsApp)", content: "SM Travels: your {service} booking {bookingNo} is confirmed. We will contact you shortly." },
    { id: "tpl_email_payment_received", channel: "EMAIL", event: "payment_received", name: "Payment Received (Email)", content: "Dear {name},\n\nWe received your payment of {amount}{invoiceRef}. Reference: {paymentNo}.\n\nThank you.\n\nSM Travels International" },
    { id: "tpl_sms_payment_received", channel: "SMS", event: "payment_received", name: "Payment Received (SMS)", content: "SM Travels: payment of {amount} received. Ref {paymentNo}." },
    { id: "tpl_wa_payment_received", channel: "WHATSAPP", event: "payment_received", name: "Payment Received (WhatsApp)", content: "SM Travels: payment of {amount} received. Ref {paymentNo}. Thank you." },
    { id: "tpl_email_password_reset", channel: "EMAIL", event: "password_reset", name: "Password Reset OTP", content: "Your one-time code is: {otp}\n\nIt expires in 10 minutes." },
    { id: "tpl_email_visa_approved", channel: "EMAIL", event: "visa_approved", name: "Visa Approved", content: "Dear {name},\n\nYour visa for {bookingNo} has been approved.\n\nSM Travels International" },
    { id: "tpl_sms_visa_approved", channel: "SMS", event: "visa_approved", name: "Visa Approved (SMS)", content: "SM Travels: visa approved for {bookingNo}." },
    { id: "tpl_wa_passport_ready", channel: "WHATSAPP", event: "passport_ready", name: "Passport Ready", content: "SM Travels: your passport is ready for collection{ref}." },
    { id: "tpl_email_welcome", channel: "EMAIL", event: "welcome", name: "Welcome", content: "Dear {name},\n\nWelcome to SM Travels International.\n\n{details}" },
    { id: "tpl_email_invoice", channel: "EMAIL", event: "invoice_generated", name: "Invoice Generated", content: "Dear {name},\n\nInvoice {invoiceNo} for {amount} has been generated. Due: {dueDate}." },
  ];
  for (const t of tplSeed) {
    await prisma.messageTemplate.upsert({
      where: { id: t.id },
      create: { id: t.id, channel: t.channel, event: t.event, name: t.name, content: t.content, category: "system", status: "active" },
      update: { content: t.content, name: t.name, status: "active" },
    });
  }

  // ── Structural CMS pages (idempotent by stable id) ──────────────────────────
  const cmsPages: Array<{
    id: string; slug: string; title: string; metaTitle: string; metaDesc: string; body: string;
  }> = [
    {
      id: "page_privacy",
      slug: "privacy",
      title: "Privacy Policy / গোপনীয়তা নীতি",
      metaTitle: "Privacy Policy | SM Travels",
      metaDesc: "How SM Travels International collects, uses, and protects your personal information.",
      body: `## Privacy Policy / গোপনীয়তা নীতি

**Last updated / সর্বশেষ আপডেট:** July 2026

SM Travels International ("we", "us") respects your privacy. This policy explains what personal data we collect when you book Hajj, Umrah, visa, tickets, tours, or other services, and how we use it.

### Information we collect / আমরা যে তথ্য সংগ্রহ করি
- Identity details: name, NID/passport number, date of birth, photos
- Contact details: phone, email, address
- Booking & payment records needed to deliver travel services
- Website usage data (cookies, analytics) when you visit smtravel.com.bd

### How we use your data / তথ্যের ব্যবহার
We use your data to process bookings, obtain visas, arrange flights and hotels, send itinerary updates, comply with Saudi/Bangladeshi regulations, and improve our services. We do not sell your personal data.

### Sharing / তথ্য শেয়ার
We share data only with airlines, hotels, embassies, Saudi authorities, payment processors, and licensed partners when required to fulfil your booking — under confidentiality obligations.

### Your rights / আপনার অধিকার
You may request access, correction, or deletion of your data (subject to legal retention for travel/visa records) by emailing privacy@smtravel.com.bd or contacting any branch office.

### Contact
Head Office — 32 Motijheel C/A, Dhaka-1000 | +880 2 9553421 | info@smtravel.com.bd`,
    },
    {
      id: "page_terms",
      slug: "terms",
      title: "Terms of Use / ব্যবহারের শর্তাবলী",
      metaTitle: "Terms of Use | SM Travels",
      metaDesc: "Terms and conditions for booking travel services with SM Travels International.",
      body: `## Terms of Use / ব্যবহারের শর্তাবলী

By booking with SM Travels International or using our website, you agree to these terms.

### Bookings / বুকিং
All packages are subject to availability. A booking is confirmed only after the required deposit is received and a booking reference is issued. Prices are in BDT unless stated otherwise and may change until full payment.

### Documents / কাগজপত্র
You are responsible for providing accurate passport, NID, photos, medical, and vaccination documents on time. Delays or errors may cause visa rejection or extra fees for which SM Travels is not liable.

### Changes by suppliers
Airlines, hotels, and Saudi authorities may change schedules, hotels, or transport. We will notify you promptly and offer reasonable alternatives where possible.

### Liability / দায়বদ্ধতা
We act as an agent for transport and accommodation providers. Our liability is limited to the service fees charged by SM Travels, except where prohibited by law.

### Governing law
These terms are governed by the laws of Bangladesh. Disputes shall first be addressed through our Dhaka head office customer care team.`,
    },
    {
      id: "page_refund",
      slug: "refund",
      title: "Refund Policy / ফেরত নীতি",
      metaTitle: "Refund Policy | SM Travels",
      metaDesc: "Cancellation and refund rules for Hajj, Umrah, tours, visas, and tickets.",
      body: `## Refund & Cancellation Policy / ফেরত ও বাতিলকরণ নীতি

### Package tours (Hajj / Umrah / Tour)
- **60+ days** before departure: 10% cancellation fee on package price
- **30–59 days**: 25% fee
- **15–29 days**: 50% fee
- **Less than 15 days**: no refund of package price

Airline and hotel cancellation rules also apply and may be non-refundable.

### Visas / ভিসা
Embassy/government visa fees are **non-refundable**. If a visa is refused due to embassy policy despite correct documents, we re-apply at no extra service charge (government fees still apply).

### Air tickets / এয়ার টিকেট
Refunds follow the airline fare rules. We assist with the claim process; SM Travels service charges are non-refundable.

### How to request a refund
Email refunds@smtravel.com.bd with your booking number, or visit your branch. Approved refunds are processed within 14–21 working days to the original payment method where possible.

যোগাযোগ: +880 1712-345678 | Dhaka Head Office`,
    },
    {
      id: "page_career",
      slug: "career",
      title: "Careers / ক্যারিয়ার",
      metaTitle: "Careers at SM Travels",
      metaDesc: "Join SM Travels International — careers in travel, Hajj/Umrah operations, and customer service.",
      body: `## Careers at SM Travels / এসএম ট্রাভেলসে ক্যারিয়ার

SM Travels International is hiring passionate people who care about pilgrims and travellers.

### Why join us / কেন আমাদের সাথে যোগ দেবেন
- 25+ years serving Bangladeshi travellers
- Branches in Dhaka, Chittagong, Sylhet, and Khulna
- Training on Hajj/Umrah operations, visas, and GDS ticketing
- Competitive salary, festival bonuses, and travel discounts

### Open roles (apply anytime)
1. **Sales Executive** — Hajj/Umrah & tour packages (Dhaka / CTG)
2. **Visa Processing Officer** — document checks & embassy follow-up
3. **Customer Care Officer** — Bengali/English phone & WhatsApp support
4. **Accounts Assistant** — invoices, collections, NPSB reconciliations

### How to apply / আবেদন
Send your CV and a short cover note to **hr@smtravel.com.bd** with the role in the subject line. We review applications on a rolling basis and only contact shortlisted candidates.

সমতা: We welcome applications regardless of gender, religion, or disability status.`,
    },
    {
      id: "page_about",
      slug: "about",
      title: "About Us / আমাদের সম্পর্কে",
      metaTitle: "About SM Travels International",
      metaDesc: "Trusted Hajj, Umrah, visa and tour partner since 1998 — SM Travels International.",
      body: `## About SM Travels International / আমাদের সম্পর্কে

Founded in 1998 in Motijheel, Dhaka, SM Travels International helps Bangladeshi Muslims and families travel for Hajj, Umrah, tours, visas, tickets, hotels, and overseas manpower — under one roof.

### Our mission / আমাদের লক্ষ্য
Make sacred and leisure travel **accessible, affordable, and stress-free** with honest guidance and licensed operations.

### At a glance
- **25+ years** in the industry
- **10,000+** pilgrims served
- **4 branches** — Dhaka, Chittagong, Sylhet, Khulna
- Licensed for Hajj (Ministry of Religious Affairs), ATAB member, IATA accredited, ISO 9001:2015

### Services
Hajj & Umrah packages · Visa assistance · Air tickets · Manpower · World tours · Hotel booking

Visit any branch or call **+880 1712-345678** to speak with our team.`,
    },
    {
      id: "page_branches",
      slug: "branches",
      title: "Our Branches / আমাদের শাখাসমূহ",
      metaTitle: "Branch Offices | SM Travels",
      metaDesc: "Find SM Travels offices in Dhaka, Chittagong, Sylhet, and Khulna.",
      body: `## Our Branches / আমাদের শাখাসমূহ

Visit us for bookings, payments, passport collection, and counselling.

### Head Office — Dhaka
32 Motijheel C/A, Dhaka-1000  
Phone: +880 2 9553421 · Mobile: +880 1712-345678  
Email: dhaka@smtravel.com.bd  
Hours: Sun–Thu 9:00 AM – 6:00 PM

### Chittagong Branch
15 Agrabad C/A, Chittagong-4100  
Phone: +880 31 714532 · Email: ctg@smtravel.com.bd  
Hours: Sun–Thu 9:00 AM – 5:30 PM

### Sylhet Branch
Zindabazar Main Road, Sylhet-3100  
Phone: +880 821 716234 · Email: sylhet@smtravel.com.bd  
Hours: Sun–Thu 9:00 AM – 5:30 PM

### Khulna Branch
KDA Avenue, Khulna-9100  
Phone: +880 41 720145 · Email: khulna@smtravel.com.bd  
Hours: Sun–Thu 9:00 AM – 5:00 PM

WhatsApp support: +880 1712-345678`,
    },
    {
      id: "page_hotels",
      slug: "hotels",
      title: "Hotel Booking / হোটেল বুকিং",
      metaTitle: "Hotel Booking | SM Travels",
      metaDesc: "Competitive hotel rates in Makkah, Madinah, Dubai, Malaysia, and worldwide.",
      body: `## Hotel Booking / হোটেল বুকিং

SM Travels partners with hotels worldwide — especially Makkah & Madinah for pilgrims, plus Dubai, Malaysia, Thailand, Turkey, and domestic Bangladesh stays.

### What we offer / আমাদের সেবা
- Haram-view and walking-distance hotels in Makkah & Madinah
- Family rooms, triple/quad options for groups
- Corporate rates and flexible cancellation where available
- Combined hotel + ticket + visa packages

### How to book
1. Tell us city, dates, room type, and budget  
2. We send 2–3 options with inclusions  
3. Confirm with a deposit; vouchers are issued after payment  

Call **+880 1712-345678** or email **hotels@smtravel.com.bd**.  
হোটেল বুকিংয়ের জন্য যেকোনো শাখায় যোগাযোগ করুন।`,
    },
    {
      id: "page_transport",
      slug: "transport",
      title: "Transport Services / পরিবহন সেবা",
      metaTitle: "Transport Services | SM Travels",
      metaDesc: "Airport transfers, Ziyarah transport, and group coaches for Hajj, Umrah and tours.",
      body: `## Transport Services / পরিবহন সেবা

Reliable ground transport for pilgrims and tour groups in Bangladesh and the Kingdom.

### Services / সেবাসমূহ
- **Airport transfers** — Dhaka / CTG / SYL / KHL and Jeddah / Madinah airports
- **Ziyarah coaches** — Makkah & Madinah holy sites with licensed guides
- **Intercity coaches** — for large Hajj/Umrah groups
- **Private cars / vans** — family and VIP transfers

### Booking notes
Transport is included in many package itineraries. Standalone transfers can be booked 48+ hours in advance. Share flight numbers and passenger count for accurate quotes.

যোগাযোগ: ops@smtravel.com.bd | +880 1712-345678`,
    },
  ];

  for (const p of cmsPages) {
    await prisma.cmsPage.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        title: p.title,
        slug: p.slug,
        body: p.body,
        status: ContentStatus.PUBLISHED,
        metaTitle: p.metaTitle,
        metaDesc: p.metaDesc,
        visibility: "public",
        publishedAt: new Date(),
      },
      update: {
        title: p.title,
        slug: p.slug,
        body: p.body,
        status: ContentStatus.PUBLISHED,
        metaTitle: p.metaTitle,
        metaDesc: p.metaDesc,
        visibility: "public",
      },
    });
  }

  console.log("[seed] structural done.");
}

// Demo-data date helper (moved to module scope in the structural/demo split).
// Mixed-currency demo rows carry real exchangeRates (USD→120, SAR→32) so
// baseAmount aggregation is actually exercised. Idempotent.
const dt = (s: string) => new Date(`${s}T00:00:00.000Z`);

// CoA code → id map. Filled by seedStructural (section 11); seedDemo's journal
// section reloads it from the DB if empty (defensive — main() always runs
// structural first).
const acctIdByCode: Record<string, string> = {};
async function ensureAcctMap(): Promise<void> {
  if (Object.keys(acctIdByCode).length > 0) return;
  for (const a of await prisma.account.findMany({ select: { id: true, code: true } })) acctIdByCode[a.code] = a.id;
}

/**
 * DEMO seed — sample users/bookings/invoices/leads for dev & staging ONLY.
 * Every account here uses the shared DEMO_PW; that must never exist on a
 * public URL, so this phase HARD-REFUSES to run in production.
 */
async function seedDemo() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "seedDemo() refused: NODE_ENV=production. Demo users (shared password) must never be seeded on production. " +
      "Production runs seedStructural() only; create the real admin with prisma/create-admin.ts.",
    );
  }
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
  await ensureAcctMap();
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

  // ══════════════════════════════════════════════════════════════════════════
  // PORTAL DATA — link customer USERS to customer RECORDS (ownership scoping) and
  // give each portal user their own bookings/invoices/docs/tickets so ownership
  // isolation can be proven (customer A must NOT reach customer B's data).
  // ══════════════════════════════════════════════════════════════════════════

  // 19a) Link the demo customer user → cus_demo (Md. Karim Ullah, Dhaka).
  await prisma.customer.update({ where: { id: "cus_demo" }, data: { userId: "usr_customer" } });

  // 19b) A SECOND customer user → cus_ctg (Fatima Begum, CTG) so cross-owner
  //      isolation is testable with two real portal accounts.
  const cust2Email = "customer2@smtravel.com.bd";
  await prisma.user.upsert({
    where: { id: "usr_customer2" },
    create: { id: "usr_customer2", email: cust2Email, name: "Demo Customer Two", role: UserRole.CUSTOMER, passwordHash: hashPw(DEMO_PW, cust2Email), branchId: "brn_ctg", status: "active" },
    update: { name: "Demo Customer Two", role: UserRole.CUSTOMER, branchId: "brn_ctg" },
  });
  await linkRole("usr_customer2", UserRole.CUSTOMER);
  await prisma.customer.update({ where: { id: "cus_ctg" }, data: { userId: "usr_customer2" } });

  // 19c) Documents owned by each customer (cross-owner fetch must 404).
  const DOCS = [
    { id: "doc_demo_passport", customerId: "cus_demo", type: "PASSPORT", name: "Passport", status: "VERIFIED", required: true },
    { id: "doc_demo_visa", customerId: "cus_demo", type: "VISA", name: "Saudi Visa", status: "VERIFIED", required: true },
    { id: "doc_demo_medical", customerId: "cus_demo", type: "MEDICAL", name: "Medical Certificate", status: "PENDING", required: true },
    { id: "doc_ctg_passport", customerId: "cus_ctg", type: "PASSPORT", name: "Passport", status: "VERIFIED", required: true },
  ];
  for (const d of DOCS) {
    await prisma.document.upsert({
      where: { id: d.id },
      create: { id: d.id, ownerType: "CUSTOMER", customerId: d.customerId, type: d.type as never, name: d.name, status: d.status as never, required: d.required, filePath: `/uploads/${d.id}.pdf`, tags: [] },
      update: { name: d.name, status: d.status as never },
    });
  }

  // 19d) Payments on cus_demo's issued invoices (Payment History screen).
  const PAYMENTS = [
    { id: "pay_demo_1", invoiceId: "inv_s2", amount: 150000, method: "BANK_TRANSFER", date: "2026-06-16", no: "RCP-SEED-01" },
    { id: "pay_demo_2", invoiceId: "inv_s3", amount: 24000, method: "BKASH", date: "2026-07-03", no: "RCP-SEED-02" },
  ];
  for (const p of PAYMENTS) {
    await prisma.payment.upsert({
      where: { id: p.id },
      create: { id: p.id, paymentNo: p.no, direction: "IN", branchId: "brn_dhaka", invoiceId: p.invoiceId, customerId: "cus_demo", amount: p.amount, baseAmount: p.amount, method: p.method as never, status: "CONFIRMED", paidAt: dt(p.date) },
      update: { amount: p.amount, baseAmount: p.amount },
    });
  }

  // 19e) An installment plan for cus_demo (Installments screen).
  await prisma.installmentPlan.upsert({
    where: { id: "pln_demo" },
    create: { id: "pln_demo", branchId: "brn_dhaka", bookingId: "bkg_s1", customerId: "cus_demo", total: 200000, baseAmount: 200000, downAmount: 50000, status: "active" },
    update: { total: 200000, baseAmount: 200000 },
  });
  const INSTALLMENTS = [
    { n: 1, label: "1st Installment", amt: 50000, due: "2026-05-01", paidDate: "2026-04-28", status: "PAID" },
    { n: 2, label: "2nd Installment", amt: 50000, due: "2026-06-01", paidDate: "2026-05-30", status: "PAID" },
    { n: 3, label: "3rd Installment", amt: 50000, due: "2026-07-01", paidDate: null, status: "DUE" },
    { n: 4, label: "4th Installment", amt: 50000, due: "2026-08-01", paidDate: null, status: "UPCOMING" },
  ];
  for (const it of INSTALLMENTS) {
    await prisma.installment.upsert({
      where: { planId_number: { planId: "pln_demo", number: it.n } },
      create: { planId: "pln_demo", number: it.n, label: it.label, amountDue: it.amt, baseAmount: it.amt, dueDate: dt(it.due), paidDate: it.paidDate ? dt(it.paidDate) : null, paidAmount: it.status === "PAID" ? it.amt : 0, status: it.status as never },
      update: { status: it.status as never, paidAmount: it.status === "PAID" ? it.amt : 0 },
    });
  }

  // 19f) Support tickets (requesterType="customer", requesterId=customerId).
  const TICKETS = [
    { id: "tkt_demo", no: "SUP-SEED-01", customerId: "cus_demo", subject: "Visa delay update request", status: "OPEN", msg: "Our visa team is processing your application. ETA 3–5 business days." },
    { id: "tkt_ctg", no: "SUP-SEED-02", customerId: "cus_ctg", subject: "Hotel change request", status: "RESOLVED", msg: "Your hotel has been updated. Confirmation sent to email." },
  ];
  for (const t of TICKETS) {
    await prisma.supportTicket.upsert({
      where: { id: t.id },
      create: { id: t.id, ticketNo: t.no, subject: t.subject, requesterType: "customer", requesterId: t.customerId, status: t.status as never, branchId: t.customerId === "cus_ctg" ? "brn_ctg" : "brn_dhaka" },
      update: { subject: t.subject, status: t.status as never },
    });
    await prisma.ticketMessage.upsert({
      where: { id: `${t.id}_m1` },
      create: { id: `${t.id}_m1`, ticketId: t.id, fromLabel: "Support", body: t.msg },
      update: { body: t.msg },
    });
  }

  // 19g) Notifications for the demo customer user.
  const NOTIFS = [
    { id: "ntf_demo_1", title: "Visa Approved", body: "Your Saudi Arabia visa has been approved.", color: "#0E7C66", read: false },
    { id: "ntf_demo_2", title: "Installment Reminder", body: "Your 3rd installment of ৳50,000 is due.", color: "#E8471F", read: false },
    { id: "ntf_demo_3", title: "Payment confirmed", body: "৳150,000 received. Thank you!", color: "#0E7C66", read: true },
  ];
  for (const n of NOTIFS) {
    await prisma.notification.upsert({
      where: { id: n.id },
      create: { id: n.id, userId: "usr_customer", title: n.title, body: n.body, color: n.color, read: n.read },
      update: { title: n.title, body: n.body, read: n.read },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PORTAL DATA (Agent / Supplier / Staff / Accountant) — link each portal user
  // to its owner record + give two of each so cross-account isolation is
  // testable. Idempotent (stable ids). PII (nid) set so profile decryption is
  // provable per role.
  // ══════════════════════════════════════════════════════════════════════════

  // 20a) AGENTS — link agt_rahim→usr_agent, add a 2nd agent user for agt_nmt,
  //      give each a sub-agent (downline tree), a wallet + ledger, PII.
  await prisma.user.upsert({
    where: { id: "usr_agent2" },
    create: { id: "usr_agent2", email: "agent2@smtravel.com.bd", name: "Demo Agent Two", role: UserRole.AGENT, passwordHash: hashPw(DEMO_PW, "agent2@smtravel.com.bd"), branchId: "brn_dhaka", status: "active" },
    update: { name: "Demo Agent Two", role: UserRole.AGENT },
  });
  await linkRole("usr_agent2", UserRole.AGENT);
  await prisma.agent.update({ where: { id: "agt_rahim" }, data: { userId: "usr_agent", nid: "1985111122223", tradeLicense: "TL-RAHIM-2024" } });
  await prisma.agent.update({ where: { id: "agt_nmt" }, data: { userId: "usr_agent2", nid: "1986222233334" } });
  // sub-agents (downline) — agt_rahim_s1 under rahim, agt_nmt_s1 under nmt
  const SUBAGENTS = [
    { id: "agt_rahim_s1", code: "AGT-RAHIM-S1", name: "Rahim Sub-Agent", parent: "agt_rahim" },
    { id: "agt_nmt_s1", code: "AGT-NMT-S1", name: "NMT Sub-Agent", parent: "agt_nmt" },
  ];
  for (const s of SUBAGENTS) {
    await prisma.agent.upsert({
      where: { id: s.id },
      create: { id: s.id, agentCode: s.code, name: s.name, parentAgentId: s.parent, tier: "SILVER", commissionRate: 3, branchId: "brn_dhaka", status: "active" },
      update: { name: s.name, parentAgentId: s.parent },
    });
  }
  // wallets + immutable ledger txns
  const WALLETS = [
    { id: "wallet_rahim", agentId: "agt_rahim", balance: 46850 },
    { id: "wallet_nmt", agentId: "agt_nmt", balance: 12000 },
  ];
  for (const w of WALLETS) {
    await prisma.agentWallet.upsert({ where: { id: w.id }, create: { id: w.id, agentId: w.agentId, balance: w.balance }, update: { balance: w.balance } });
  }
  const WALLET_TXNS = [
    { id: "wtx_rahim_1", wallet: "wallet_rahim", type: "CREDIT", desc: "Commission — June", amount: 21850, date: "2026-06-30" },
    { id: "wtx_rahim_2", wallet: "wallet_rahim", type: "CREDIT", desc: "Commission — July", amount: 30000, date: "2026-07-15" },
    { id: "wtx_rahim_3", wallet: "wallet_rahim", type: "DEBIT", desc: "Withdrawal to bKash", amount: 5000, date: "2026-07-18" },
    { id: "wtx_nmt_1", wallet: "wallet_nmt", type: "CREDIT", desc: "Commission — June", amount: 12000, date: "2026-06-30" },
  ];
  for (const t of WALLET_TXNS) {
    await prisma.walletTransaction.upsert({
      where: { id: t.id },
      create: { id: t.id, walletId: t.wallet, type: t.type as never, description: t.desc, amount: t.amount, baseAmount: t.amount, postedAt: dt(t.date) },
      update: { description: t.desc, amount: t.amount, baseAmount: t.amount },
    });
  }
  // a commission for the sub-agent so the downline rollup has data
  await prisma.agentCommission.upsert({
    where: { id: "cmm_rahim_s1_07" },
    create: { id: "cmm_rahim_s1_07", agentId: "agt_rahim_s1", period: "2026-07", grossAmount: 50000, rate: 3, amount: 1500, baseAmount: 1500, status: "PENDING" },
    update: { amount: 1500, baseAmount: 1500 },
  });
  // agent leads (scoped by agentId)
  const AGENT_LEADS = [
    { id: "lead_ag_1", agentId: "agt_rahim", name: "Prospective Hajji", phone: "+8801733000001", stage: "NEW", interest: "HIGH", svc: "HAJJ" },
    { id: "lead_ag_2", agentId: "agt_rahim", name: "Umrah Family Group", phone: "+8801733000002", stage: "QUALIFIED", interest: "MEDIUM", svc: "UMRAH" },
    { id: "lead_ag_3", agentId: "agt_nmt", name: "NMT Corporate Lead", phone: "+8801733000003", stage: "PROPOSAL", interest: "HIGH", svc: "VISA" },
  ];
  for (const l of AGENT_LEADS) {
    await prisma.lead.upsert({
      where: { id: l.id },
      create: { id: l.id, branchId: "brn_dhaka", agentId: l.agentId, name: l.name, phone: l.phone, stage: l.stage as never, interest: l.interest as never, serviceInterest: l.svc as never },
      update: { name: l.name, stage: l.stage as never, agentId: l.agentId },
    });
  }

  // 20b) SUPPLIERS — sup_alamin→usr_supplier, add a 2nd supplier user for sup_dar.
  await prisma.user.upsert({
    where: { id: "usr_supplier2" },
    create: { id: "usr_supplier2", email: "supplier2@smtravel.com.bd", name: "Demo Supplier Two", role: UserRole.SUPPLIER, passwordHash: hashPw(DEMO_PW, "supplier2@smtravel.com.bd"), branchId: "brn_dhaka", status: "active" },
    update: { name: "Demo Supplier Two", role: UserRole.SUPPLIER },
  });
  await linkRole("usr_supplier2", UserRole.SUPPLIER);
  const SUPPLIERS = [
    { id: "sup_alamin", code: "SUP-0014", user: "usr_supplier", name: "Al-Amin Hotels & Tourism", category: "Hotel", status: "VERIFIED" },
    { id: "sup_dar", code: "SUP-0015", user: "usr_supplier2", name: "Dar Al-Tawhid Makkah", category: "Hotel", status: "VERIFIED" },
  ];
  for (const s of SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      create: { id: s.id, supplierCode: s.code, userId: s.user, name: s.name, category: s.category, contactPerson: "Manager", phone: "+8802000000", email: `${s.id}@example.com`, status: s.status as never, rating: 4.8 },
      update: { name: s.name, userId: s.user, status: s.status as never },
    });
  }
  const SUP_SERVICES = [
    { id: "svc_alamin_1", sup: "sup_alamin", name: "Makkah Hotel — Deluxe Room", cat: "Hotel", price: 3500 },
    { id: "svc_alamin_2", sup: "sup_alamin", name: "Madinah Hotel — Standard", cat: "Hotel", price: 2800 },
    { id: "svc_dar_1", sup: "sup_dar", name: "Dar Al-Tawhid — Haram View", cat: "Hotel", price: 9500 },
  ];
  for (const s of SUP_SERVICES) {
    await prisma.supplierService.upsert({ where: { id: s.id }, create: { id: s.id, supplierId: s.sup, name: s.name, category: s.cat, price: s.price, bookingsCount: 12, rating: 4.7 }, update: { name: s.name, price: s.price } });
  }
  const SUP_REQUESTS = [
    { id: "sreq_alamin_1", no: "REQ-AL-01", sup: "sup_alamin", service: "Makkah Deluxe × 20 rooms", client: "Hajj Group 07", amount: 700000, status: "PENDING" },
    { id: "sreq_alamin_2", no: "REQ-AL-02", sup: "sup_alamin", service: "Madinah Standard × 15", client: "Umrah Ramadan", amount: 420000, status: "CONFIRMED" },
    { id: "sreq_dar_1", no: "REQ-DR-01", sup: "sup_dar", service: "Haram View × 5", client: "VIP Group", amount: 475000, status: "PENDING" },
  ];
  for (const r of SUP_REQUESTS) {
    await prisma.bookingRequest.upsert({
      where: { id: r.id },
      create: { id: r.id, requestNo: r.no, supplierId: r.sup, branchId: "brn_dhaka", serviceLabel: r.service, clientLabel: r.client, amount: r.amount, baseAmount: r.amount, status: r.status as never },
      update: { serviceLabel: r.service, amount: r.amount, baseAmount: r.amount, status: r.status as never },
    });
  }
  const SUP_INVOICES = [
    { id: "sinv_alamin_1", no: "AL-INV-01", sup: "sup_alamin", desc: "Makkah rooms — June", amount: 240000, status: "pending", date: "2026-06-20" },
    { id: "sinv_alamin_2", no: "AL-INV-02", sup: "sup_alamin", desc: "Madinah rooms — May", amount: 180000, status: "paid", date: "2026-05-18" },
    { id: "sinv_dar_1", no: "DR-INV-01", sup: "sup_dar", desc: "Haram view — July", amount: 475000, status: "pending", date: "2026-07-05" },
  ];
  for (const v of SUP_INVOICES) {
    await prisma.supplierInvoice.upsert({
      where: { id: v.id },
      create: { id: v.id, supplierId: v.sup, invoiceNo: v.no, description: v.desc, amount: v.amount, baseAmount: v.amount, status: v.status, issueDate: dt(v.date), dueDate: dt(v.date) },
      update: { description: v.desc, amount: v.amount, baseAmount: v.amount, status: v.status },
    });
  }
  await prisma.supplierPayable.upsert({
    where: { id: "spay_alamin_1" },
    create: { id: "spay_alamin_1", branchId: "brn_dhaka", supplierId: "sup_alamin", supplierInvoiceId: "sinv_alamin_1", amount: 240000, baseAmount: 240000, paidAmount: 60000, status: "PARTIAL", dueDate: dt("2026-07-30") },
    update: { paidAmount: 60000, status: "PARTIAL" },
  });
  await prisma.payment.upsert({
    where: { id: "pay_sup_1" },
    create: { id: "pay_sup_1", paymentNo: "PMT-SUP-01", direction: "OUT", branchId: "brn_dhaka", supplierId: "sup_alamin", amount: 180000, baseAmount: 180000, method: "BANK_TRANSFER", status: "CONFIRMED", paidAt: dt("2026-05-20") },
    update: { amount: 180000, baseAmount: 180000 },
  });

  // 20c) STAFF — set PII on usr_staff, add a 2nd staff in CTG (branch isolation),
  //      tasks assigned-to-me, assigned bookings, announcements.
  await prisma.user.update({ where: { id: "usr_staff" }, data: { nid: "1990333344445", employeeId: "EMP-0047", department: "Bookings" } });
  await prisma.user.upsert({
    where: { id: "usr_staff2" },
    create: { id: "usr_staff2", email: "staff2@smtravel.com.bd", name: "Demo Staff Two", role: UserRole.STAFF, passwordHash: hashPw(DEMO_PW, "staff2@smtravel.com.bd"), branchId: "brn_ctg", status: "active", employeeId: "EMP-0088" },
    update: { name: "Demo Staff Two", role: UserRole.STAFF, branchId: "brn_ctg" },
  });
  await linkRole("usr_staff2", UserRole.STAFF);
  const TASKS = [
    { id: "task_staff_1", assignee: "usr_staff", title: "Verify passports for Hajj Group 07", priority: "HIGH", status: "TODO", cat: "Documents" },
    { id: "task_staff_2", assignee: "usr_staff", title: "Call Umrah Ramadan customers", priority: "MEDIUM", status: "DONE", cat: "Follow-up" },
    { id: "task_staff_3", assignee: "usr_staff", title: "Prepare visa file — Saudi", priority: "HIGH", status: "IN_PROGRESS", cat: "Visa" },
    { id: "task_staff2_1", assignee: "usr_staff2", title: "CTG branch daily reconciliation", priority: "MEDIUM", status: "TODO", cat: "Ops" },
  ];
  for (const t of TASKS) {
    await prisma.task.upsert({
      where: { id: t.id },
      create: { id: t.id, assigneeId: t.assignee, title: t.title, priority: t.priority as never, status: t.status as never, category: t.cat, dueAt: dt("2026-07-25") },
      update: { title: t.title, status: t.status as never, assigneeId: t.assignee },
    });
  }
  // assign some Dhaka bookings to usr_staff
  await prisma.booking.updateMany({ where: { id: { in: ["bkg_s1", "bkg_s2"] } }, data: { assignedStaffId: "usr_staff" } });
  const ANNOUNCEMENTS = [
    { id: "ann_1", title: "Hajj 2026 briefing schedule", body: "Pre-departure briefings begin next week for all confirmed pilgrims.", branchId: "brn_dhaka", pinned: true },
    { id: "ann_global", title: "System maintenance Saturday", body: "The ERP will be briefly unavailable 2–4 AM Saturday.", branchId: null, pinned: false },
  ];
  for (const a of ANNOUNCEMENTS) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      create: { id: a.id, title: a.title, body: a.body, branchId: a.branchId, pinned: a.pinned, audience: "staff" },
      update: { title: a.title, body: a.body, pinned: a.pinned },
    });
  }

  // 20d) ACCOUNTANT — PII on usr_accountant (reuses finance/reports endpoints).
  await prisma.user.update({ where: { id: "usr_accountant" }, data: { nid: "1988555566667", employeeId: "EMP-0012", department: "Finance" } });

  // eslint-disable-next-line no-console
  console.log("[seed] demo done.");
}

async function main() {
  await seedStructural();
  if (process.env.SEED_STRUCTURAL_ONLY === "1" || process.env.SEED_STRUCTURAL_ONLY === "true") {
    console.log("[seed] SEED_STRUCTURAL_ONLY set -> demo phase SKIPPED.");
    return;
  }
  if (process.env.NODE_ENV === "production") {
    console.log("[seed] NODE_ENV=production -> demo phase SKIPPED (structural only).");
    return;
  }
  await seedDemo();
}

main()
  .catch((e) => {
    console.error("[seed] failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
