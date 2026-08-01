/**
 * Idempotent demo catalog for testing (safe in production).
 * Creates packages + ensures a named demo agent/customer exist.
 *
 *   npx tsx scripts/seed-demo-catalog.ts
 */
import { PrismaClient, PackageStatus, ServiceType, AgentTier, CustomerType } from "@prisma/client";

const prisma = new PrismaClient();

const PACKAGES = [
  {
    id: "pkg_hajj_econ",
    code: "PKG-HAJJ-ECON",
    slug: "hajj-economy-2026",
    type: "HAJJ" as ServiceType,
    name: "Hajj Economy 2026",
    basePrice: 295000,
    originalPrice: 320000,
    seats: 40,
    duration: "35 Days",
    season: "2026",
    departure: "May 2026",
    shortDesc: "Affordable Hajj with near-Haram hotels",
    image: "/packages/hajj-economy.jpg",
    featured: true,
  },
  {
    id: "pkg_hajj_prem",
    code: "PKG-HAJJ-PREM",
    slug: "hajj-premium-2026",
    type: "HAJJ" as ServiceType,
    name: "Hajj Premium 2026",
    basePrice: 385000,
    originalPrice: 420000,
    seats: 20,
    duration: "40 Days",
    season: "2026",
    departure: "May 2026",
    shortDesc: "Haram-view lodging and full board",
    image: "/packages/hajj-premium.jpg",
    featured: true,
  },
  {
    id: "pkg_hajj_vip",
    code: "PKG-HAJJ-VIP",
    slug: "hajj-vip-2026",
    type: "HAJJ" as ServiceType,
    name: "Hajj VIP 2026",
    basePrice: 525000,
    originalPrice: 560000,
    seats: 8,
    duration: "42 Days",
    season: "2026",
    departure: "May 2026",
    shortDesc: "Clock Tower lodging and private transport",
    image: "/packages/hajj-vip.jpg",
    featured: true,
  },
  {
    id: "pkg_umrah_gold",
    code: "PKG-UMR-GOLD",
    slug: "umrah-gold-package",
    type: "UMRAH" as ServiceType,
    name: "Umrah Gold Package",
    basePrice: 145000,
    originalPrice: 165000,
    seats: 30,
    duration: "14 Days",
    season: "Year-round",
    departure: "Any Month",
    shortDesc: "5-star Haram-view Umrah",
    image: "/packages/umrah-gold.jpg",
    featured: true,
  },
  {
    id: "pkg_umrah_silver",
    code: "PKG-UMR-SILVER",
    slug: "umrah-silver-package",
    type: "UMRAH" as ServiceType,
    name: "Umrah Silver Package",
    basePrice: 95000,
    seats: 40,
    duration: "10 Days",
    season: "Year-round",
    departure: "Any Month",
    shortDesc: "Value Umrah near Haram",
    image: "/packages/umrah-silver.jpg",
    featured: false,
  },
  {
    id: "pkg_umrah_ramadan",
    code: "PKG-UMR-RAM",
    slug: "umrah-ramadan-special",
    type: "UMRAH" as ServiceType,
    name: "Umrah Ramadan Special",
    basePrice: 175000,
    originalPrice: 195000,
    seats: 15,
    duration: "15 Days",
    season: "Ramadan 2026",
    departure: "Ramadan 2026",
    shortDesc: "Ramadan in the Two Holy Mosques",
    image: "/packages/umrah-ramadan.jpg",
    featured: true,
  },
  {
    id: "pkg_visa_ksa",
    code: "PKG-VISA-KSA",
    slug: "saudi-visit-visa",
    type: "VISA" as ServiceType,
    name: "Saudi Arabia Visit Visa",
    basePrice: 8500,
    seats: 500,
    duration: "5–10 Days",
    season: "Year-round",
    departure: "As needed",
    shortDesc: "Visit / Umrah visa processing",
    image: "/packages/visa-tour.jpg",
    featured: false,
  },
  {
    id: "pkg_tour_dubai",
    code: "PKG-TOUR-DXB",
    slug: "tour-dubai-5n6d",
    type: "TOUR" as ServiceType,
    name: "Tour Dubai 5N/6D",
    basePrice: 85000,
    originalPrice: 99000,
    seats: 24,
    duration: "6 Days",
    season: "Oct–Mar",
    departure: "Weekly",
    shortDesc: "Dubai city + desert safari",
    image: "/packages/tour-dubai.jpg",
    featured: true,
  },
];

async function main() {
  const branch = await prisma.branch.findFirst({ where: { deletedAt: null, isHq: true } })
    ?? await prisma.branch.findFirst({ where: { deletedAt: null } });
  if (!branch) throw new Error("No branch — run structural seed first");

  const services = await prisma.service.findMany({ where: { deletedAt: null } });
  const serviceByType = Object.fromEntries(services.map((s) => [s.type, s.id]));

  for (const p of PACKAGES) {
    await prisma.package.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        code: p.code,
        slug: p.slug,
        type: p.type,
        name: p.name,
        status: PackageStatus.ACTIVE,
        basePrice: p.basePrice,
        originalPrice: p.originalPrice ?? null,
        currency: "BDT",
        exchangeRate: 1,
        baseAmount: p.basePrice,
        totalSeats: p.seats,
        availableSeats: p.seats,
        duration: p.duration,
        season: p.season,
        departure: p.departure,
        shortDesc: p.shortDesc,
        image: p.image,
        featured: p.featured,
        serviceId: serviceByType[p.type] ?? null,
      },
      update: {
        name: p.name,
        status: PackageStatus.ACTIVE,
        basePrice: p.basePrice,
        originalPrice: p.originalPrice ?? null,
        baseAmount: p.basePrice,
        totalSeats: p.seats,
        availableSeats: p.seats,
        duration: p.duration,
        season: p.season,
        departure: p.departure,
        shortDesc: p.shortDesc,
        image: p.image,
        featured: p.featured,
        serviceId: serviceByType[p.type] ?? undefined,
        deletedAt: null,
      },
    });
    await prisma.packagePricing.upsert({
      where: { id: `${p.id}_tier1` },
      create: {
        id: `${p.id}_tier1`,
        packageId: p.id,
        label: "Standard",
        price: p.basePrice,
        currency: "BDT",
        exchangeRate: 1,
        baseAmount: p.basePrice,
        seats: p.seats,
        occupied: 0,
      },
      update: { price: p.basePrice, baseAmount: p.basePrice, seats: p.seats },
    });
    console.log("✓ package", p.code);
  }

  const agent = await prisma.agent.upsert({
    where: { id: "agt_demo_gold" },
    create: {
      id: "agt_demo_gold",
      agentCode: "AGT-DEMO-GOLD",
      name: "Demo Gold Agency",
      branchId: branch.id,
      phone: "+8801711002200",
      email: "demo.agent@smtravel.com.bd",
      tier: AgentTier.GOLD,
      commissionRate: 5,
      status: "active",
    },
    update: { status: "active", commissionRate: 5, deletedAt: null },
  });
  await prisma.agentWallet.upsert({
    where: { agentId: agent.id },
    create: { agentId: agent.id, balance: 0, currency: "BDT" },
    update: {},
  });
  console.log("✓ demo agent", agent.agentCode);

  const customer = await prisma.customer.upsert({
    where: { id: "cus_demo_pilgrim" },
    create: {
      id: "cus_demo_pilgrim",
      name: "Demo Pilgrim Karim",
      phone: "+8801711223344",
      email: "demo.customer@example.com",
      type: CustomerType.INDIVIDUAL,
      branchId: branch.id,
    },
    update: { deletedAt: null, name: "Demo Pilgrim Karim" },
  });
  console.log("✓ demo customer", customer.id);

  const pkgCount = await prisma.package.count({ where: { deletedAt: null } });
  console.log(`\nDone. Active packages: ${pkgCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
