import { Prisma, type ServiceType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";
import type {
  PublicPackageItem,
  PublicPackageDetail,
  PublicPackageListQuery,
  PublicPackageListResponse,
  PublicBlogPostItem,
  PublicBlogPostDetail,
  PublicBlogListQuery,
  PublicBlogListResponse,
  PublicFaqListResponse,
  PublicTestimonialListResponse,
  PublicGalleryListResponse,
} from "../contracts/cms.contract";

const num = (v: Prisma.Decimal | number | null | undefined): number =>
  v == null ? 0 : typeof v === "number" ? v : Number(v);

const TYPE_LABEL: Record<ServiceType, string> = {
  HAJJ: "Hajj",
  UMRAH: "Umrah",
  TOUR: "Tour",
  VISA: "Visa",
  MANPOWER: "Manpower",
  HOTEL: "Hotel",
  AIR_TICKET: "Air Ticket",
};

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function readTime(body: string | null | undefined): string {
  const words = (body ?? "").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min`;
}

type HotelEntry = { name?: string; city?: string };
type FlightEntry = { carrier?: string; flightNo?: string };

function firstHotel(hotels: unknown): string {
  const list = Array.isArray(hotels) ? (hotels as HotelEntry[]) : [];
  const h = list[0];
  if (!h) return "";
  return [h.name, h.city].filter(Boolean).join(", ") || "";
}

function firstFlight(flights: unknown): string {
  const list = Array.isArray(flights) ? (flights as FlightEntry[]) : [];
  const f = list[0];
  if (!f) return "";
  return [f.carrier, f.flightNo].filter(Boolean).join(" ") || "";
}

const pkgInclude = {
  inclusions: { where: { kind: "include" }, orderBy: { sortOrder: "asc" }, take: 5 },
} satisfies Prisma.PackageInclude;

const pkgDetailInclude = {
  itinerary: { orderBy: { day: "asc" } },
  inclusions: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.PackageInclude;

type PkgRow = Prisma.PackageGetPayload<{ include: typeof pkgInclude }>;
type PkgDetailRow = Prisma.PackageGetPayload<{ include: typeof pkgDetailInclude }>;

function toPublicPackage(p: PkgRow): PublicPackageItem {
  const highlights = p.inclusions.length
    ? p.inclusions.map((i) => i.text)
    : (p.shortDesc ?? "").split(/[,;|]/).map((s) => s.trim()).filter(Boolean).slice(0, 5);

  return {
    id: p.id,
    slug: p.slug,
    title: p.name,
    type: TYPE_LABEL[p.type as ServiceType] ?? p.type,
    price: num(p.basePrice),
    originalPrice: p.originalPrice == null ? null : num(p.originalPrice),
    duration: p.duration ?? "",
    departure: p.departure ?? "",
    hotel: firstHotel(p.hotels),
    flight: firstFlight(p.flights),
    rating: p.rating == null ? 0 : num(p.rating),
    reviews: p.bookingsCount,
    seats: p.availableSeats,
    badge: p.featured ? "Featured" : null,
    image: p.image,
    highlights,
    featured: p.featured,
  };
}

function toPublicPackageDetail(p: PkgDetailRow): PublicPackageDetail {
  const base = toPublicPackage(p as unknown as PkgRow);
  return {
    ...base,
    includes: p.inclusions.filter((i) => i.kind === "include").map((i) => i.text),
    excludes: p.inclusions.filter((i) => i.kind === "exclude").map((i) => i.text),
    itinerary: p.itinerary.map((d) => ({
      day: d.day <= 1 ? `Day ${d.day}` : `Day ${d.day}`,
      title: d.title,
      desc: d.description ?? "",
    })),
    longDesc: p.longDesc,
  };
}

export async function listPublishedPackages(q: PublicPackageListQuery): Promise<PublicPackageListResponse> {
  const where: Prisma.PackageWhereInput = {
    deletedAt: null,
    status: "ACTIVE",
  };
  if (q.featured) where.featured = true;
  if (q.type) where.type = q.type.toUpperCase() as ServiceType;
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { slug: { contains: q.q, mode: "insensitive" } },
      { shortDesc: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.package.findMany({
      where,
      include: pkgInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: q.limit,
    }),
    prisma.package.count({ where }),
  ]);

  return { data: rows.map(toPublicPackage), total };
}

export async function getPublishedPackage(slugOrId: string): Promise<PublicPackageDetail> {
  const p = await prisma.package.findFirst({
    where: {
      OR: [{ id: slugOrId }, { slug: slugOrId }],
      deletedAt: null,
      status: "ACTIVE",
    },
    include: pkgDetailInclude,
  });
  if (!p) throw new HttpError(404, "NotFound");
  return toPublicPackageDetail(p);
}

type BlogRow = Prisma.BlogPostGetPayload<{ include: { category: true } }>;

function toPublicBlog(p: BlogRow): PublicBlogPostItem {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category?.name ?? "General",
    date: formatDate(p.publishedAt ?? p.createdAt),
    author: p.authorName ?? "SMTravel",
    readTime: readTime(p.body),
    excerpt: p.excerpt ?? (p.body ?? "").slice(0, 200),
    image: p.featImg,
    tags: p.tags,
    featured: p.featured,
  };
}

export async function listPublishedBlogPosts(q: PublicBlogListQuery): Promise<PublicBlogListResponse> {
  const where: Prisma.BlogPostWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
  };
  if (q.featured) where.featured = true;
  if (q.category) where.category = { name: { equals: q.category, mode: "insensitive" } };
  if (q.q) {
    where.OR = [
      { title: { contains: q.q, mode: "insensitive" } },
      { excerpt: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: { category: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: q.limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { data: rows.map(toPublicBlog), total };
}

export async function getPublishedBlogPost(slug: string): Promise<PublicBlogPostDetail> {
  const p = await prisma.blogPost.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      deletedAt: null,
      status: "PUBLISHED",
    },
    include: { category: true },
  });
  if (!p) throw new HttpError(404, "NotFound");

  void prisma.blogPost.update({ where: { id: p.id }, data: { views: { increment: 1 } } }).catch(() => undefined);

  return { ...toPublicBlog(p), body: p.body };
}

export async function listPublicFaqs(): Promise<PublicFaqListResponse> {
  const rows = await prisma.faq.findMany({
    where: { deletedAt: null, published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return {
    data: rows.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category ?? "General",
      sortOrder: f.sortOrder,
    })),
  };
}

export async function listPublicTestimonials(): Promise<PublicTestimonialListResponse> {
  const rows = await prisma.testimonial.findMany({
    where: { deletedAt: null, approved: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: rows.map((t) => ({
      id: t.id,
      name: t.name,
      city: t.location ?? "",
      initial: t.name.trim()[0]?.toUpperCase() ?? "?",
      package: t.packageName ?? "",
      stars: t.rating,
      text: t.text,
    })),
  };
}

export async function listPublicGallery(): Promise<PublicGalleryListResponse> {
  const rows = await prisma.mediaAsset.findMany({
    where: { deletedAt: null, type: "IMAGE" },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: rows.map((m) => ({
      id: m.id,
      title: m.name,
      category: "Gallery",
      image: m.filePath,
      type: m.type,
    })),
  };
}
