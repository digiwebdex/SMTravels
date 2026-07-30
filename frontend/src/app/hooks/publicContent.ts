import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import {
  PACKAGES,
  BLOGS,
  TESTIMONIALS,
  FAQS,
  type Package,
  type BlogPost,
} from "../lib/data";
import type {
  PublicPackageItem,
  PublicPackageDetail,
  PublicPackageListResponse,
  PublicBlogPostItem,
  PublicBlogPostDetail,
  PublicBlogListResponse,
  PublicFaqListResponse,
  PublicTestimonialListResponse,
} from "@contracts/cms.contract";

const publicFetch = <T>(path: string) => apiFetch<T>(path, {}, { auth: false, retry: false });

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") s.set(k, String(v));
  }
  const q = s.toString();
  return q ? `?${q}` : "";
}

// ── mappers: API DTO → existing page view-models ─────────────────────────────

export function mapPublicPackage(p: PublicPackageItem): Package {
  return {
    id: p.id as unknown as number,
    slug: p.slug,
    title: p.title,
    type: p.type,
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    duration: p.duration,
    departure: p.departure,
    hotel: p.hotel,
    flight: p.flight,
    rating: p.rating,
    reviews: p.reviews,
    seats: p.seats,
    badge: p.badge ?? undefined,
    image: p.image ?? "",
    highlights: p.highlights,
    includes: [],
    excludes: [],
    itinerary: [],
  };
}

export function mapPublicPackageDetail(p: PublicPackageDetail): Package {
  return {
    ...mapPublicPackage(p),
    includes: p.includes,
    excludes: p.excludes,
    itinerary: p.itinerary,
  };
}

export function mapPublicBlog(b: PublicBlogPostItem): BlogPost {
  return {
    id: b.id as unknown as number,
    slug: b.slug,
    title: b.title,
    category: b.category,
    date: b.date,
    author: b.author,
    readTime: b.readTime,
    excerpt: b.excerpt,
    image: b.image ?? "",
    tags: b.tags,
  };
}

export type PublicTestimonial = (typeof TESTIMONIALS)[number];

export function mapPublicTestimonial(t: PublicTestimonialListResponse["data"][number]): PublicTestimonial {
  return {
    name: t.name,
    city: t.city,
    initial: t.initial,
    package: t.package,
    stars: t.stars,
    text: t.text,
  };
}

export function faqsToRecord(items: PublicFaqListResponse["data"]): Record<string, { q: string; a: string }[]> {
  const out: Record<string, { q: string; a: string }[]> = {};
  for (const f of items) {
    const cat = f.category || "General";
    if (!out[cat]) out[cat] = [];
    out[cat].push({ q: f.question, a: f.answer });
  }
  return out;
}

function withFallback<T>(api: T[] | undefined, isError: boolean, fallback: T[]): T[] {
  if (!isError && api && api.length > 0) return api;
  return fallback;
}

// ── query keys ────────────────────────────────────────────────────────────────

export const publicContentKeys = {
  packages: (p: unknown) => ["public", "packages", p] as const,
  package: (id: string) => ["public", "package", id] as const,
  blog: (p: unknown) => ["public", "blog", p] as const,
  blogPost: (slug: string) => ["public", "blogPost", slug] as const,
  faqs: ["public", "faqs"] as const,
  testimonials: ["public", "testimonials"] as const,
  gallery: ["public", "gallery"] as const,
};

// ── hooks ─────────────────────────────────────────────────────────────────────

export interface PublicPackagesParams {
  featured?: boolean;
  type?: string;
  q?: string;
  limit?: number;
}

export function usePublicPackages(params: PublicPackagesParams = {}) {
  const query = useQuery({
    queryKey: publicContentKeys.packages(params),
    queryFn: () => publicFetch<PublicPackageListResponse>(`/public/packages${qs(params)}`),
    staleTime: 60_000,
  });

  const mapped = query.data?.data.map(mapPublicPackage);
  const packages = withFallback(mapped, query.isError, PACKAGES);

  return { ...query, packages, fromApi: !!mapped?.length && !query.isError };
}

export function usePublicPackage(slugOrId: string | undefined) {
  const query = useQuery({
    queryKey: publicContentKeys.package(slugOrId ?? ""),
    queryFn: () => publicFetch<PublicPackageDetail>(`/public/packages/${slugOrId}`),
    enabled: !!slugOrId,
    staleTime: 60_000,
    retry: false,
  });

  const fallback = PACKAGES.find((p) => String(p.id) === slugOrId || p.slug === slugOrId);
  const pkg = !query.isError && query.data
    ? mapPublicPackageDetail(query.data)
    : fallback;

  return { ...query, package: pkg, fromApi: !!query.data && !query.isError };
}

export interface PublicBlogParams {
  category?: string;
  featured?: boolean;
  q?: string;
  limit?: number;
}

export function usePublicBlogPosts(params: PublicBlogParams = {}) {
  const query = useQuery({
    queryKey: publicContentKeys.blog(params),
    queryFn: () => publicFetch<PublicBlogListResponse>(`/public/blog${qs(params)}`),
    staleTime: 60_000,
  });

  const mapped = query.data?.data.map(mapPublicBlog);
  const posts = withFallback(mapped, query.isError, BLOGS);

  return { ...query, posts, fromApi: !!mapped?.length && !query.isError };
}

export function usePublicBlogPost(slug: string | undefined) {
  const query = useQuery({
    queryKey: publicContentKeys.blogPost(slug ?? ""),
    queryFn: () => publicFetch<PublicBlogPostDetail>(`/public/blog/${slug}`),
    enabled: !!slug,
    staleTime: 60_000,
    retry: false,
  });

  const fallback = BLOGS.find((b) => String(b.id) === slug || b.slug === slug);
  const post = !query.isError && query.data ? mapPublicBlog(query.data) : fallback;
  const body = !query.isError && query.data?.body ? query.data.body : null;

  return { ...query, post, body, fromApi: !!query.data && !query.isError };
}

export function usePublicFaqs() {
  const query = useQuery({
    queryKey: publicContentKeys.faqs,
    queryFn: () => publicFetch<PublicFaqListResponse>("/public/faqs"),
    staleTime: 60_000,
  });

  const apiRecord = query.data?.data ? faqsToRecord(query.data.data) : undefined;
  const hasApi = !query.isError && apiRecord && Object.keys(apiRecord).length > 0;
  const faqs = hasApi ? apiRecord : FAQS;

  return { ...query, faqs, fromApi: hasApi };
}

export function usePublicTestimonials() {
  const query = useQuery({
    queryKey: publicContentKeys.testimonials,
    queryFn: () => publicFetch<PublicTestimonialListResponse>("/public/testimonials"),
    staleTime: 60_000,
  });

  const mapped = query.data?.data.map(mapPublicTestimonial);
  const testimonials = withFallback(mapped, query.isError, TESTIMONIALS);

  return { ...query, testimonials, fromApi: !!mapped?.length && !query.isError };
}

/** Resolve a stable route key for packages/blog (prefer slug when from API). */
export function contentLinkKey(item: { id: number | string; slug?: string }, fromApi?: boolean): string {
  if (fromApi && item.slug) return item.slug;
  return String(item.id);
}
