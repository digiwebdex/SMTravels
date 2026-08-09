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
  PublicCmsPageDto,
  PublicMenuDto,
  PublicMenuItemDto,
  PublicBannerDto,
  PublicBannerListQuery,
  PublicBannerListResponse,
  MenuLocationDto,
  PublicStatisticDto,
  PublicServiceDto,
  PublicHeroDto,
  PublicHeroBadgeDto,
  PublicHomeSectionDto,
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
    take: 300,
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
    take: 100,
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
    take: 200,
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

// ── Public CmsPage / Menu / Banner ────────────────────────────────────────────

export async function getPublishedCmsPage(slug: string): Promise<PublicCmsPageDto> {
  const p = await prisma.cmsPage.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      deletedAt: null,
      status: "PUBLISHED",
      visibility: "public",
    },
  });
  if (!p) throw new HttpError(404, "NotFound");

  void prisma.cmsPage.update({ where: { id: p.id }, data: { views: { increment: 1 } } }).catch(() => undefined);

  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    body: p.body,
    metaTitle: p.metaTitle,
    metaDesc: p.metaDesc,
    template: p.template,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  };
}

type MenuItemRow = {
  id: string; parentId: string | null; label: string; url: string; sortOrder: number;
  icon: string | null; openNewTab: boolean; megaMenu: boolean; visible: boolean; published: boolean;
};

function buildPublicMenuTree(items: MenuItemRow[], parentId: string | null = null): PublicMenuItemDto[] {
  return items
    .filter((i) => i.parentId === parentId && i.visible && i.published)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => ({
      id: i.id,
      label: i.label,
      url: i.url,
      sortOrder: i.sortOrder,
      icon: i.icon,
      openNewTab: i.openNewTab,
      megaMenu: i.megaMenu,
      children: buildPublicMenuTree(items, i.id),
    }));
}

const MENU_LOCATIONS = ["MAIN_NAV", "FOOTER_NAV", "MOBILE_NAV", "TOP_NAV", "QUICK_LINKS", "LEGAL_NAV"] as const;

export async function getPublicMenu(location: string): Promise<PublicMenuDto> {
  const loc = location.toUpperCase().replace(/-/g, "_");
  if (!(MENU_LOCATIONS as readonly string[]).includes(loc)) throw new HttpError(404, "NotFound");

  const m = await prisma.menu.findUnique({
    where: { location: loc as (typeof MENU_LOCATIONS)[number] },
    include: { items: true },
  });
  if (!m) throw new HttpError(404, "NotFound");

  return {
    id: m.id,
    location: m.location as MenuLocationDto,
    name: m.name,
    items: buildPublicMenuTree(m.items as MenuItemRow[]),
  };
}

/** Only these Setting groups may be read anonymously — never expose the whole key/value table. */
const PUBLIC_SETTING_GROUPS = ["company", "footer", "social", "newsletter", "announcement", "stats"];

/** Public site settings for an allow-listed group (company/footer/social/…) as a key→value map. */
export async function listPublicSettings(group?: string): Promise<{ settings: Record<string, string> }> {
  const groups = group
    ? (PUBLIC_SETTING_GROUPS.includes(group) ? [group] : [])
    : PUBLIC_SETTING_GROUPS;
  if (groups.length === 0) return { settings: {} };
  const rows = await prisma.setting.findMany({
    where: { group: { in: groups } },
    select: { key: true, value: true },
    take: 500,
  });
  const settings: Record<string, string> = {};
  for (const r of rows) if (r.value != null) settings[r.key] = r.value;
  return { settings };
}

/** Public homepage statistics (visible + homepage), ordered. */
export async function listPublicStatistics(): Promise<{ data: PublicStatisticDto[] }> {
  const rows = await prisma.statistic.findMany({
    where: { deletedAt: null, visible: true, homepage: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 100,
  });
  return {
    data: rows.map((s) => ({
      id: s.id, title: s.title, value: s.value, suffix: s.suffix,
      icon: s.icon, color: s.color, animation: s.animation,
    })),
  };
}

/** Public homepage service cards (visible + homepage + published), ordered. */
export async function listPublicServices(): Promise<{ data: PublicServiceDto[] }> {
  const rows = await prisma.homeService.findMany({
    where: { deletedAt: null, visible: true, homepage: true, published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 100,
  });
  return {
    data: rows.map((s) => ({
      id: s.id, title: s.title, shortDesc: s.shortDesc, icon: s.icon,
      image: s.image, buttonText: s.buttonText, buttonUrl: s.buttonUrl, color: s.color,
    })),
  };
}

/** Public homepage sections (published), ordered — Section Manager + JSON renderer foundation. */
export async function listPublicHomeSections(): Promise<{ data: PublicHomeSectionDto[] }> {
  const rows = await prisma.homeSection.findMany({
    where: { deletedAt: null, published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 50,
  });
  return {
    data: rows.map((s) => ({
      key: s.key, type: s.type,
      eyebrow: s.eyebrow, eyebrowBn: s.eyebrowBn,
      title: s.title, titleBn: s.titleBn,
      subtitle: s.subtitle, subtitleBn: s.subtitleBn,
      config: s.config, sortOrder: s.sortOrder, visible: s.visible,
    })),
  };
}

/** Public hero for a page (default "home"); null if none is published. */
export async function getPublicHero(key = "home"): Promise<PublicHeroDto | null> {
  const h = await prisma.hero.findFirst({
    where: { deletedAt: null, visible: true, published: true, key },
    orderBy: { sortOrder: "asc" },
  });
  if (!h) return null;
  const badges: PublicHeroBadgeDto[] = Array.isArray(h.badges)
    ? (h.badges as unknown as PublicHeroBadgeDto[])
    : [];
  return {
    id: h.id, key: h.key,
    eyebrow: h.eyebrow, eyebrowBn: h.eyebrowBn,
    title: h.title, titleBn: h.titleBn,
    highlight: h.highlight, highlightBn: h.highlightBn,
    subtitle: h.subtitle, subtitleBn: h.subtitleBn,
    primaryLabel: h.primaryLabel, primaryLabelBn: h.primaryLabelBn, primaryUrl: h.primaryUrl,
    secondaryLabel: h.secondaryLabel, secondaryLabelBn: h.secondaryLabelBn, secondaryUrl: h.secondaryUrl,
    backgroundImage: h.backgroundImage, mobileImage: h.mobileImage,
    backgroundVideo: h.backgroundVideo, overlay: h.overlay,
    badges,
  };
}

export async function listPublicBanners(q: PublicBannerListQuery): Promise<PublicBannerListResponse> {
  const now = new Date();
  const where: Prisma.BannerWhereInput = {
    deletedAt: null,
    active: true,
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
  };
  if (q.type) where.type = q.type;

  const rows = await prisma.banner.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return {
    data: rows.map(
      (b): PublicBannerDto => ({
        id: b.id,
        title: b.title,
        position: b.position,
        type: b.type as PublicBannerDto["type"],
        image: b.image,
        linkUrl: b.linkUrl,
        expiresAt: b.expiresAt ? b.expiresAt.toISOString().slice(0, 10) : null,
      }),
    ),
  };
}
