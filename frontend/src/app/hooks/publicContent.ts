import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type {
  PublicPackageItem, PublicPackageDetail, PublicBlogPostItem, PublicBlogPostDetail,
  PublicFaqItem, PublicTestimonialItem, PublicGalleryItem, PublicCmsPageDto,
  PublicMenuDto, PublicBannerDto, PublicStatisticDto, PublicServiceDto, PublicHeroDto, PublicHomeSectionDto,
} from "@contracts/cms.contract";
import { getDemoPackage, listDemoPackages } from "../website/demoPackages";

const pub = <T,>(path: string) => apiFetch<T>(path, {}, { auth: false });

export const publicKeys = {
  packages: (q?: string) => ["public", "packages", q ?? ""] as const,
  package: (id: string) => ["public", "package", id] as const,
  blog: (q?: string) => ["public", "blog", q ?? ""] as const,
  blogPost: (slug: string) => ["public", "blogPost", slug] as const,
  faqs: ["public", "faqs"] as const,
  testimonials: ["public", "testimonials"] as const,
  gallery: ["public", "gallery"] as const,
  page: (slug: string) => ["public", "page", slug] as const,
  menu: (loc: string) => ["public", "menu", loc] as const,
  banners: (type?: string) => ["public", "banners", type ?? ""] as const,
};

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function usePublicPackages(opts?: { featured?: boolean; type?: string; q?: string; limit?: number }) {
  const query = qs({ featured: opts?.featured, type: opts?.type, q: opts?.q, limit: opts?.limit ?? 50 });
  return useQuery({
    queryKey: publicKeys.packages(query),
    queryFn: async () => {
      try {
        const res = await pub<{ data: PublicPackageItem[]; total: number }>(`/public/packages${query}`);
        if (res.data?.length) return res;
      } catch {
        /* use demo catalog when API is down or empty */
      }
      return listDemoPackages(opts);
    },
    staleTime: 60_000,
  });
}

export function usePublicPackage(slugOrId: string | undefined) {
  return useQuery({
    queryKey: publicKeys.package(slugOrId ?? ""),
    queryFn: async () => {
      try {
        return await pub<PublicPackageDetail>(`/public/packages/${slugOrId}`);
      } catch {
        const demo = getDemoPackage(slugOrId);
        if (demo) return demo;
        throw new Error("Package not found");
      }
    },
    enabled: !!slugOrId,
    staleTime: 60_000,
  });
}

export function usePublicBlog(opts?: { category?: string; featured?: boolean; q?: string; limit?: number }) {
  const query = qs({ category: opts?.category, featured: opts?.featured, q: opts?.q, limit: opts?.limit ?? 50 });
  return useQuery({
    queryKey: publicKeys.blog(query),
    queryFn: () => pub<{ data: PublicBlogPostItem[]; total: number }>(`/public/blog${query}`),
    staleTime: 60_000,
  });
}

export function usePublicBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: publicKeys.blogPost(slug ?? ""),
    queryFn: () => pub<PublicBlogPostDetail>(`/public/blog/${slug}`),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function usePublicFaqs() {
  return useQuery({
    queryKey: publicKeys.faqs,
    queryFn: () => pub<{ data: PublicFaqItem[] }>("/public/faqs").then((r) => r.data),
    staleTime: 120_000,
  });
}

export function usePublicTestimonials() {
  return useQuery({
    queryKey: publicKeys.testimonials,
    queryFn: () => pub<{ data: PublicTestimonialItem[] }>("/public/testimonials").then((r) => r.data),
    staleTime: 120_000,
  });
}

export function usePublicGallery() {
  return useQuery({
    queryKey: publicKeys.gallery,
    queryFn: () => pub<{ data: PublicGalleryItem[] }>("/public/gallery").then((r) => r.data),
    staleTime: 120_000,
  });
}

export function usePublicPage(slug: string | undefined) {
  return useQuery({
    queryKey: publicKeys.page(slug ?? ""),
    queryFn: () => pub<PublicCmsPageDto>(`/public/pages/${slug}`),
    enabled: !!slug,
    staleTime: 120_000,
  });
}

export type MenuLocation =
  | "MAIN_NAV" | "FOOTER_NAV" | "MOBILE_NAV" | "TOP_NAV" | "QUICK_LINKS" | "LEGAL_NAV";

export function usePublicMenu(location: MenuLocation) {
  return useQuery({
    queryKey: publicKeys.menu(location),
    queryFn: () => pub<PublicMenuDto>(`/public/menus/${location}`).catch(() => null),
    staleTime: 300_000,
    retry: false,
  });
}

/** Public homepage statistics (visible + homepage), ordered. */
export function usePublicStatistics() {
  return useQuery({
    queryKey: ["public", "statistics"] as const,
    queryFn: () =>
      pub<{ data: PublicStatisticDto[] }>("/public/statistics").then((r) => r.data).catch(() => [] as PublicStatisticDto[]),
    staleTime: 300_000,
    retry: false,
  });
}

/** Public homepage sections (Section Manager + JSON renderer foundation). */
export function usePublicHomeSections() {
  return useQuery({
    queryKey: ["public", "home-sections"] as const,
    queryFn: () =>
      pub<{ data: PublicHomeSectionDto[] }>("/public/home-sections").then((r) => r.data).catch(() => [] as PublicHomeSectionDto[]),
    staleTime: 300_000,
    retry: false,
  });
}

/** Public hero for a page (default "home"); null if none published. */
export function usePublicHero(key = "home") {
  return useQuery({
    queryKey: ["public", "hero", key] as const,
    queryFn: () =>
      pub<PublicHeroDto | null>(`/public/hero?key=${key}`).catch(() => null),
    staleTime: 300_000,
    retry: false,
  });
}

/** Public homepage service cards (visible + homepage + published), ordered. */
export function usePublicServices() {
  return useQuery({
    queryKey: ["public", "services"] as const,
    queryFn: () =>
      pub<{ data: PublicServiceDto[] }>("/public/services").then((r) => r.data).catch(() => [] as PublicServiceDto[]),
    staleTime: 300_000,
    retry: false,
  });
}

/** Public site settings (company info, socials, copyright, etc.) as key→value. */
export function usePublicSettings(group?: string) {
  return useQuery({
    queryKey: ["public", "settings", group ?? ""] as const,
    queryFn: () =>
      pub<{ settings: Record<string, string> }>(`/public/settings${group ? `?group=${group}` : ""}`)
        .then((r) => r.settings)
        .catch(() => ({} as Record<string, string>)),
    staleTime: 300_000,
    retry: false,
  });
}

export function usePublicBanners(type?: "PROMO" | "HERO" | "SIDEBAR" | "CTA") {
  const query = qs({ type });
  return useQuery({
    queryKey: publicKeys.banners(type),
    queryFn: () => pub<{ data: PublicBannerDto[] }>(`/public/banners${query}`).then((r) => r.data),
    staleTime: 120_000,
  });
}

export type {
  PublicPackageItem, PublicPackageDetail, PublicBlogPostItem, PublicBlogPostDetail,
  PublicFaqItem, PublicTestimonialItem, PublicGalleryItem, PublicCmsPageDto,
};
