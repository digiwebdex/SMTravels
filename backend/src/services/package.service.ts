import { Prisma, type ServiceType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import { money, type CurrencyCode } from "../lib/money";
import { allocateSequence } from "../lib/sequence";
import type {
  PackageCreateInput, PackageUpdateInput, PackageListQuery,
  PackageListItem, PackageListResponse, PackageDetail,
} from "../contracts/catalog.contract";

// NOTE: Packages are catalog data — company-wide, NOT branch-scoped (no branchId
// in the schema). These queries apply RBAC only (no branchWhere).

type Tx = Prisma.TransactionClient;
const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const num = (v: Prisma.Decimal | number | null | undefined): number => (v == null ? 0 : typeof v === "number" ? v : Number(v));
function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "package";
}

type PkgRow = Prisma.PackageGetPayload<{ include: { _count: { select: { bookings: true } } } }>;
function toListItem(p: PkgRow): PackageListItem {
  return {
    id: p.id, code: p.code, slug: p.slug, type: p.type as PackageListItem["type"], name: p.name,
    season: p.season, departure: p.departure, duration: p.duration, status: p.status as PackageListItem["status"],
    basePrice: num(p.basePrice), originalPrice: p.originalPrice == null ? null : num(p.originalPrice),
    currency: p.currency as PackageListItem["currency"], totalSeats: p.totalSeats, availableSeats: p.availableSeats,
    rating: p.rating == null ? null : num(p.rating), bookingsCount: p.bookingsCount, revenue: num(p.revenue),
    image: p.image, featured: p.featured, shortDesc: p.shortDesc, createdAt: dIso(p.createdAt)!,
  };
}

// ── seat/money computation ────────────────────────────────────────────────────
function seatTotals(input: { tiers?: PackageCreateInput["tiers"]; totalSeats?: number; availableSeats?: number }) {
  const tiers = input.tiers ?? [];
  if (tiers.length) {
    const total = tiers.reduce((s, t) => s + (t.seats ?? 0), 0);
    const occupied = tiers.reduce((s, t) => s + (t.occupied ?? 0), 0);
    return { totalSeats: input.totalSeats ?? total, availableSeats: input.availableSeats ?? Math.max(0, total - occupied) };
  }
  const total = input.totalSeats ?? 0;
  return { totalSeats: total, availableSeats: input.availableSeats ?? total };
}

async function writeChildren(tx: Tx, packageId: string, input: PackageCreateInput | PackageUpdateInput, pkgTotalSeats: number): Promise<void> {
  if (input.tiers) {
    for (let i = 0; i < input.tiers.length; i++) {
      const t = input.tiers[i];
      const m = money(t.price, (t.currency as CurrencyCode) ?? "BDT", t.exchangeRate); // money invariant per tier
      await tx.packagePricing.create({
        data: { packageId, label: t.label, price: m.amount, originalPrice: t.originalPrice ?? null, currency: m.currency, exchangeRate: m.exchangeRate, baseAmount: m.baseAmount, seats: t.seats ?? 0, occupied: t.occupied ?? 0, sortOrder: t.sortOrder ?? i },
      });
    }
  }
  if (input.itinerary) {
    for (const d of input.itinerary) {
      await tx.packageItinerary.create({
        data: { packageId, day: d.day, title: d.title, description: d.description, activities: d.activities ?? [], hotel: d.hotel, breakfast: d.breakfast ?? false, lunch: d.lunch ?? false, dinner: d.dinner ?? false, transport: d.transport },
      });
    }
  }
  if (input.inclusions) {
    for (let i = 0; i < input.inclusions.length; i++) {
      const inc = input.inclusions[i];
      await tx.packageInclusion.create({ data: { packageId, kind: inc.kind, text: inc.text, sortOrder: inc.sortOrder ?? i } });
    }
  }
  if (input.availability) {
    // real per-departure seat inventory. A duplicate departureDate hits the
    // @@unique([packageId, departureDate]) constraint → the whole tx rolls back.
    for (const a of input.availability) {
      await tx.packageAvailability.create({
        data: { packageId, departureDate: toDate(a.departureDate)!, totalSeats: a.totalSeats ?? pkgTotalSeats, soldSeats: a.soldSeats ?? 0, status: a.status ?? "open" },
      });
    }
  }
}

const detailInclude = {
  pricingTiers: { orderBy: { sortOrder: "asc" } },
  itinerary: { orderBy: { day: "asc" } },
  inclusions: { orderBy: { sortOrder: "asc" } },
  availability: { orderBy: { departureDate: "asc" } },
  _count: { select: { bookings: true } },
} satisfies Prisma.PackageInclude;

// ── public API ────────────────────────────────────────────────────────────────
export async function listPackages(_auth: AuthCtx, q: PackageListQuery): Promise<PackageListResponse> {
  const where: Prisma.PackageWhereInput = { deletedAt: null };
  if (q.type) where.type = q.type;
  if (q.status) where.status = q.status;
  if (q.season) where.season = { contains: q.season, mode: "insensitive" };
  if (q.q) where.OR = [{ name: { contains: q.q, mode: "insensitive" } }, { code: { contains: q.q, mode: "insensitive" } }, { slug: { contains: q.q, mode: "insensitive" } }];

  const orderBy: Prisma.PackageOrderByWithRelationInput =
    q.sort === "name" ? { name: q.dir } : q.sort === "price" ? { basePrice: q.dir } : q.sort === "bookings" ? { bookingsCount: q.dir } : { createdAt: q.dir };

  const [rows, total, grouped, revenueAgg] = await Promise.all([
    prisma.package.findMany({ where, include: { _count: { select: { bookings: true } } }, orderBy, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.package.count({ where }),
    prisma.package.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.package.aggregate({ where, _sum: { revenue: true } }),
  ]);
  let active = 0, draft = 0;
  for (const g of grouped) { if (g.status === "ACTIVE") active = g._count._all; if (g.status === "DRAFT") draft = g._count._all; }

  return {
    data: rows.map(toListItem), page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    stats: { total, active, draft, totalRevenue: num(revenueAgg._sum.revenue) },
  };
}

export async function getPackage(_auth: AuthCtx, id: string): Promise<PackageDetail> {
  const p = await prisma.package.findFirst({ where: { OR: [{ id }, { slug: id }], deletedAt: null }, include: detailInclude });
  if (!p) throw new HttpError(404, "NotFound");
  return {
    ...toListItem(p as unknown as PkgRow),
    longDesc: p.longDesc, baseAmount: num(p.baseAmount), exchangeRate: num(p.exchangeRate), images: p.images,
    hotels: (p.hotels as Record<string, unknown>[] | null) ?? [], flights: (p.flights as Record<string, unknown>[] | null) ?? [], serviceId: p.serviceId,
    tiers: p.pricingTiers.map((t) => ({ id: t.id, label: t.label, price: num(t.price), originalPrice: t.originalPrice == null ? null : num(t.originalPrice), currency: t.currency as PackageDetail["currency"], baseAmount: num(t.baseAmount), seats: t.seats, occupied: t.occupied, sortOrder: t.sortOrder })),
    itinerary: p.itinerary.map((d) => ({ id: d.id, day: d.day, title: d.title, description: d.description, activities: d.activities, hotel: d.hotel, breakfast: d.breakfast, lunch: d.lunch, dinner: d.dinner, transport: d.transport })),
    inclusions: p.inclusions.map((i) => ({ id: i.id, kind: i.kind, text: i.text, sortOrder: i.sortOrder })),
    availability: p.availability.map((a) => ({ id: a.id, departureDate: dOnly(a.departureDate)!, totalSeats: a.totalSeats, soldSeats: a.soldSeats, availableSeats: Math.max(0, a.totalSeats - a.soldSeats), status: a.status })),
  };
}

export async function createPackage(auth: AuthCtx, input: PackageCreateInput): Promise<PackageDetail> {
  const m = money(input.basePrice, (input.currency as CurrencyCode) ?? "BDT", input.exchangeRate); // money invariant
  const seats = seatTotals(input);

  const id = await prisma.$transaction(async (tx) => {
    try {
      // gapless catalog code PKG-001, PKG-002… (allocator lives inside the tx)
      const seq = await allocateSequence(tx, "PACKAGE", "GLOBAL", 0);
      const code = input.code || `PKG-${String(seq).padStart(3, "0")}`;
      const slug = input.slug ? slugify(input.slug) : `${slugify(input.name)}-${seq}`;

      const pkg = await tx.package.create({
        data: {
          code, slug, serviceId: input.serviceId || null, type: input.type as ServiceType, name: input.name,
          season: input.season, departure: input.departure, duration: input.duration, status: input.status ?? "DRAFT",
          basePrice: m.amount, originalPrice: input.originalPrice ?? null, currency: m.currency, exchangeRate: m.exchangeRate, baseAmount: m.baseAmount,
          totalSeats: seats.totalSeats, availableSeats: seats.availableSeats, rating: input.rating ?? null,
          image: input.image, images: input.images ?? [], shortDesc: input.shortDesc, longDesc: input.longDesc, featured: input.featured ?? false,
          hotels: (input.hotels ?? undefined) as Prisma.InputJsonValue | undefined, flights: (input.flights ?? undefined) as Prisma.InputJsonValue | undefined,
          createdById: auth.userId,
        },
      });
      // package + tiers + itinerary + inclusions + availability — one transaction
      await writeChildren(tx, pkg.id, input, seats.totalSeats);
      await tx.activityLog.create({ data: { userId: auth.userId, action: "PACKAGE_CREATED", target: pkg.id, module: "packages" } });
      return pkg.id;
    } catch (err) {
      mapUniqueError(err); // duplicate code/slug → friendly 409, whole tx rolls back
    }
  });
  return getPackage(auth, id!);
}

/** Clone a package (+ its tiers/itinerary/inclusions/availability) as a new DRAFT.
 *  Rebuilds a create input from the source detail; code/slug are auto-generated. */
export async function duplicatePackage(auth: AuthCtx, id: string): Promise<PackageDetail> {
  const src = await getPackage(auth, id);
  return createPackage(auth, {
    serviceId: src.serviceId ?? undefined,
    type: src.type,
    name: `${src.name} (copy)`,
    season: src.season ?? undefined,
    departure: src.departure ?? undefined,
    duration: src.duration ?? undefined,
    status: "DRAFT",
    basePrice: src.basePrice,
    originalPrice: src.originalPrice ?? undefined,
    currency: src.currency,
    exchangeRate: src.exchangeRate,
    totalSeats: src.totalSeats,
    availableSeats: src.availableSeats,
    rating: src.rating ?? undefined,
    image: src.image ?? undefined,
    images: src.images,
    shortDesc: src.shortDesc ?? undefined,
    longDesc: src.longDesc ?? undefined,
    featured: src.featured,
    hotels: src.hotels,
    flights: src.flights,
    tiers: src.tiers.map((t) => ({ label: t.label, price: t.price, originalPrice: t.originalPrice ?? undefined, currency: t.currency, seats: t.seats, occupied: t.occupied, sortOrder: t.sortOrder })),
    itinerary: src.itinerary.map((d) => ({ day: d.day, title: d.title, description: d.description ?? undefined, activities: d.activities, hotel: d.hotel ?? undefined, breakfast: d.breakfast, lunch: d.lunch, dinner: d.dinner, transport: d.transport ?? undefined })),
    inclusions: src.inclusions.map((i) => ({ kind: i.kind as "include" | "exclude", text: i.text, sortOrder: i.sortOrder })),
    availability: src.availability.map((a) => ({ departureDate: a.departureDate, totalSeats: a.totalSeats, soldSeats: a.soldSeats, status: a.status })),
  });
}

export async function updatePackage(auth: AuthCtx, id: string, input: PackageUpdateInput): Promise<PackageDetail> {
  const existing = await prisma.package.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");

  await prisma.$transaction(async (tx) => {
    const data: Prisma.PackageUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.type !== undefined) data.type = input.type as ServiceType;
    if (input.season !== undefined) data.season = input.season;
    if (input.departure !== undefined) data.departure = input.departure;
    if (input.duration !== undefined) data.duration = input.duration;
    if (input.status !== undefined) data.status = input.status;
    if (input.shortDesc !== undefined) data.shortDesc = input.shortDesc;
    if (input.longDesc !== undefined) data.longDesc = input.longDesc;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.image !== undefined) data.image = input.image;
    if (input.images !== undefined) data.images = input.images;
    if (input.rating !== undefined) data.rating = input.rating;
    if (input.serviceId !== undefined) data.service = input.serviceId ? { connect: { id: input.serviceId } } : { disconnect: true };
    if (input.hotels !== undefined) data.hotels = (input.hotels ?? Prisma.JsonNull) as Prisma.InputJsonValue;
    if (input.flights !== undefined) data.flights = (input.flights ?? Prisma.JsonNull) as Prisma.InputJsonValue;
    if (input.basePrice !== undefined) {
      const m = money(input.basePrice, (input.currency as CurrencyCode) ?? (existing.currency as CurrencyCode), input.exchangeRate);
      data.basePrice = m.amount; data.currency = m.currency; data.exchangeRate = m.exchangeRate; data.baseAmount = m.baseAmount;
    }
    if (input.originalPrice !== undefined) data.originalPrice = input.originalPrice;
    if (input.tiers || input.totalSeats !== undefined) {
      const seats = seatTotals({ tiers: input.tiers ?? undefined, totalSeats: input.totalSeats, availableSeats: input.availableSeats });
      data.totalSeats = seats.totalSeats; data.availableSeats = seats.availableSeats;
    }
    try {
      await tx.package.update({ where: { id }, data });
    } catch (err) { mapUniqueError(err); }

    // children are replace-on-provide (edit resends the full set)
    const seats = seatTotals({ tiers: input.tiers ?? undefined, totalSeats: input.totalSeats });
    if (input.tiers) { await tx.packagePricing.deleteMany({ where: { packageId: id } }); }
    if (input.itinerary) { await tx.packageItinerary.deleteMany({ where: { packageId: id } }); }
    if (input.inclusions) { await tx.packageInclusion.deleteMany({ where: { packageId: id } }); }
    if (input.availability) { await tx.packageAvailability.deleteMany({ where: { packageId: id } }); }
    await writeChildren(tx, id, input, seats.totalSeats || existing.totalSeats);
    await tx.activityLog.create({ data: { userId: auth.userId, action: "PACKAGE_UPDATED", target: id, module: "packages" } });
  });
  return getPackage(auth, id);
}

export async function deletePackage(auth: AuthCtx, id: string): Promise<void> {
  const p = await prisma.package.findFirst({ where: { id, deletedAt: null }, select: { id: true, _count: { select: { bookings: true } } } });
  if (!p) throw new HttpError(404, "NotFound");
  if (p._count.bookings > 0) throw new HttpError(409, "PackageHasBookings", { detail: "Cannot delete a package with bookings; archive it instead." });
  await prisma.package.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "PACKAGE_DELETED", target: id, module: "packages" } });
}
