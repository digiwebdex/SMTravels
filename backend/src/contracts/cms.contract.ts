/**
 * CMS contract — public website content + admin CRUD for BlogPost, Faq,
 * Testimonial, CmsPage, Menu, Banner, MediaAsset. zod-only (no @prisma)
 * so the frontend can import types.
 */
import { z } from "zod";

export const CONTENT_STATUSES = ["PUBLISHED", "DRAFT", "SCHEDULED", "ARCHIVED"] as const;
export const contentStatusSchema = z.enum(CONTENT_STATUSES);
export type ContentStatusDto = z.infer<typeof contentStatusSchema>;

export const BANNER_TYPES = ["PROMO", "HERO", "SIDEBAR", "CTA"] as const;
export const bannerTypeSchema = z.enum(BANNER_TYPES);
export type BannerTypeDto = z.infer<typeof bannerTypeSchema>;

export const MENU_LOCATIONS = ["MAIN_NAV", "FOOTER_NAV", "MOBILE_NAV", "TOP_NAV", "QUICK_LINKS", "LEGAL_NAV"] as const;
export const menuLocationSchema = z.enum(MENU_LOCATIONS);
export type MenuLocationDto = z.infer<typeof menuLocationSchema>;

export const MEDIA_TYPES = ["IMAGE", "PDF", "DOC"] as const;
export const mediaTypeSchema = z.enum(MEDIA_TYPES);
export type MediaTypeDto = z.infer<typeof mediaTypeSchema>;

const optStr = z.string().trim().optional();
const trimmed = (max: number) => z.string().trim().min(1).max(max);

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "item";
}

// ── public read DTOs ──────────────────────────────────────────────────────────

export interface PublicPackageItem {
  id: string;
  slug: string;
  title: string;
  type: string;
  price: number;
  originalPrice: number | null;
  duration: string;
  departure: string;
  hotel: string;
  flight: string;
  rating: number;
  reviews: number;
  seats: number;
  badge: string | null;
  image: string | null;
  highlights: string[];
  featured: boolean;
}

export interface PublicPackageDetail extends PublicPackageItem {
  includes: string[];
  excludes: string[];
  itinerary: { day: string; title: string; desc: string }[];
  longDesc: string | null;
}

export interface PublicBlogPostItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  excerpt: string;
  image: string | null;
  tags: string[];
  featured: boolean;
}

export interface PublicBlogPostDetail extends PublicBlogPostItem {
  body: string | null;
}

export interface PublicFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

export interface PublicTestimonialItem {
  id: string;
  name: string;
  city: string;
  initial: string;
  package: string;
  stars: number;
  text: string;
}

export interface PublicGalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  type: string;
}

export interface PublicPackageListResponse {
  data: PublicPackageItem[];
  total: number;
}

export interface PublicBlogListResponse {
  data: PublicBlogPostItem[];
  total: number;
}

export interface PublicFaqListResponse {
  data: PublicFaqItem[];
}

export interface PublicTestimonialListResponse {
  data: PublicTestimonialItem[];
}

export interface PublicGalleryListResponse {
  data: PublicGalleryItem[];
}

export const publicPackageListQuerySchema = z.object({
  featured: z.coerce.boolean().optional(),
  type: optStr,
  q: optStr,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type PublicPackageListQuery = z.infer<typeof publicPackageListQuerySchema>;

export const publicBlogListQuerySchema = z.object({
  category: optStr,
  featured: z.coerce.boolean().optional(),
  q: optStr,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type PublicBlogListQuery = z.infer<typeof publicBlogListQuerySchema>;

// ── admin BlogPost ────────────────────────────────────────────────────────────

export const blogPostCreateSchema = z.object({
  title: trimmed(200),
  slug: optStr.transform((s) => (s ? slugify(s) : undefined)),
  categoryId: optStr,
  body: optStr,
  excerpt: optStr,
  featImg: optStr,
  status: contentStatusSchema.optional(),
  authorName: optStr,
  tags: z.array(z.string()).optional(),
  metaTitle: optStr,
  metaDesc: optStr,
  featured: z.boolean().optional(),
  publishedAt: optStr,
});
export type BlogPostCreateInput = z.infer<typeof blogPostCreateSchema>;

export const blogPostUpdateSchema = blogPostCreateSchema.partial();
export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;

export interface BlogPostDto {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  categoryName: string | null;
  body: string | null;
  excerpt: string | null;
  featImg: string | null;
  status: ContentStatusDto;
  authorName: string | null;
  tags: string[];
  metaTitle: string | null;
  metaDesc: string | null;
  views: number;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostListResponse {
  data: BlogPostDto[];
  total: number;
}

export const blogPostListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  status: contentStatusSchema.optional(),
  q: optStr,
});
export type BlogPostListQuery = z.infer<typeof blogPostListQuerySchema>;

// ── admin Faq ─────────────────────────────────────────────────────────────────

export const faqCreateSchema = z.object({
  question: trimmed(500),
  answer: trimmed(5000),
  category: optStr,
  sortOrder: z.coerce.number().int().optional(),
  published: z.boolean().optional(),
});
export type FaqCreateInput = z.infer<typeof faqCreateSchema>;

export const faqUpdateSchema = faqCreateSchema.partial();
export type FaqUpdateInput = z.infer<typeof faqUpdateSchema>;

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FaqListResponse {
  data: FaqDto[];
  total: number;
}

export const faqListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  category: optStr,
  published: z.coerce.boolean().optional(),
  q: optStr,
});
export type FaqListQuery = z.infer<typeof faqListQuerySchema>;

// ── admin Testimonial ─────────────────────────────────────────────────────────

export const testimonialCreateSchema = z.object({
  name: trimmed(120),
  location: optStr,
  packageName: optStr,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  text: trimmed(2000),
  approved: z.boolean().optional(),
});
export type TestimonialCreateInput = z.infer<typeof testimonialCreateSchema>;

export const testimonialUpdateSchema = testimonialCreateSchema.partial();
export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>;

export interface TestimonialDto {
  id: string;
  name: string;
  location: string | null;
  packageName: string | null;
  rating: number;
  text: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestimonialListResponse {
  data: TestimonialDto[];
  total: number;
}

export const testimonialListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  approved: z.coerce.boolean().optional(),
  q: optStr,
});
export type TestimonialListQuery = z.infer<typeof testimonialListQuerySchema>;

// ── public CmsPage / Menu / Banner ────────────────────────────────────────────

export interface PublicCmsPageDto {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  template: string | null;
  publishedAt: string | null;
}

export interface PublicMenuItemDto {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
  icon: string | null;
  openNewTab: boolean;
  megaMenu: boolean;
  children: PublicMenuItemDto[];
}

export interface PublicMenuDto {
  id: string;
  location: MenuLocationDto;
  name: string;
  items: PublicMenuItemDto[];
}

/** Public site settings (company info, socials, copyright, etc.) as a flat key→value map. */
export interface PublicSettingsDto {
  settings: Record<string, string>;
}

/** Public homepage statistic (animated counter). */
export interface PublicStatisticDto {
  id: string;
  title: string;
  value: number;
  suffix: string | null;
  icon: string | null;
  color: string | null;
  animation: boolean;
}

/** Public homepage service card. */
export interface PublicServiceDto {
  id: string;
  title: string;
  shortDesc: string | null;
  icon: string | null;
  image: string | null;
  buttonText: string | null;
  buttonUrl: string;
  color: string | null;
}

/** Public homepage section (Section Manager + JSON renderer foundation). */
export interface PublicHomeSectionDto {
  key: string;
  type: string;
  eyebrow: string | null;
  eyebrowBn: string | null;
  title: string | null;
  titleBn: string | null;
  subtitle: string | null;
  subtitleBn: string | null;
  config: unknown;
  sortOrder: number;
  visible: boolean;
}

/** Public hero trust badge. */
export interface PublicHeroBadgeDto {
  icon: string | null;
  label: string;
  labelBn: string | null;
}

/** Public homepage hero (bilingual, reusable across pages via `key`). */
export interface PublicHeroDto {
  id: string;
  key: string;
  eyebrow: string | null;
  eyebrowBn: string | null;
  title: string;
  titleBn: string | null;
  highlight: string | null;
  highlightBn: string | null;
  subtitle: string | null;
  subtitleBn: string | null;
  primaryLabel: string | null;
  primaryLabelBn: string | null;
  primaryUrl: string | null;
  secondaryLabel: string | null;
  secondaryLabelBn: string | null;
  secondaryUrl: string | null;
  backgroundImage: string | null;
  mobileImage: string | null;
  backgroundVideo: string | null;
  overlay: string | null;
  badges: PublicHeroBadgeDto[];
}

export interface PublicBannerDto {
  id: string;
  title: string;
  position: string;
  type: BannerTypeDto;
  image: string | null;
  linkUrl: string | null;
  expiresAt: string | null;
}

export interface PublicBannerListResponse {
  data: PublicBannerDto[];
}

export const publicBannerListQuerySchema = z.object({
  type: bannerTypeSchema.optional(),
});
export type PublicBannerListQuery = z.infer<typeof publicBannerListQuerySchema>;

// ── admin CmsPage ─────────────────────────────────────────────────────────────

export const cmsPageCreateSchema = z.object({
  title: trimmed(200),
  slug: optStr.transform((s) => (s ? slugify(s) : undefined)),
  body: optStr,
  status: contentStatusSchema.optional(),
  metaTitle: optStr,
  metaDesc: optStr,
  template: optStr,
  parentPageId: optStr,
  visibility: optStr,
  publishedAt: optStr,
});
export type CmsPageCreateInput = z.infer<typeof cmsPageCreateSchema>;

export const cmsPageUpdateSchema = cmsPageCreateSchema.partial();
export type CmsPageUpdateInput = z.infer<typeof cmsPageUpdateSchema>;

export interface CmsPageDto {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  status: ContentStatusDto;
  metaTitle: string | null;
  metaDesc: string | null;
  template: string | null;
  parentPageId: string | null;
  visibility: string;
  authorId: string | null;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsPageListResponse {
  data: CmsPageDto[];
  total: number;
}

export const cmsPageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  status: contentStatusSchema.optional(),
  q: optStr,
});
export type CmsPageListQuery = z.infer<typeof cmsPageListQuerySchema>;

// ── admin Menu + MenuItem ─────────────────────────────────────────────────────

export const menuCreateSchema = z.object({
  location: menuLocationSchema,
  name: trimmed(120),
});
export type MenuCreateInput = z.infer<typeof menuCreateSchema>;

export const menuUpdateSchema = z.object({
  name: trimmed(120).optional(),
  location: menuLocationSchema.optional(),
});
export type MenuUpdateInput = z.infer<typeof menuUpdateSchema>;

export const menuItemCreateSchema = z.object({
  label: trimmed(120),
  url: trimmed(500),
  parentId: optStr,
  sortOrder: z.coerce.number().int().optional(),
});
export type MenuItemCreateInput = z.infer<typeof menuItemCreateSchema>;

export const menuItemUpdateSchema = menuItemCreateSchema.partial();
export type MenuItemUpdateInput = z.infer<typeof menuItemUpdateSchema>;

export interface MenuItemDto {
  id: string;
  menuId: string;
  parentId: string | null;
  label: string;
  url: string;
  sortOrder: number;
  children: MenuItemDto[];
}

export interface MenuDto {
  id: string;
  location: MenuLocationDto;
  name: string;
  items: MenuItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuListResponse {
  data: MenuDto[];
}

// ── admin Banner ──────────────────────────────────────────────────────────────

export const bannerCreateSchema = z.object({
  title: trimmed(200),
  position: trimmed(120),
  type: bannerTypeSchema.optional(),
  image: optStr,
  linkUrl: optStr,
  active: z.boolean().optional(),
  expiresAt: optStr,
});
export type BannerCreateInput = z.infer<typeof bannerCreateSchema>;

export const bannerUpdateSchema = bannerCreateSchema.partial();
export type BannerUpdateInput = z.infer<typeof bannerUpdateSchema>;

export interface BannerDto {
  id: string;
  title: string;
  position: string;
  type: BannerTypeDto;
  image: string | null;
  linkUrl: string | null;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BannerListResponse {
  data: BannerDto[];
  total: number;
}

export const bannerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  type: bannerTypeSchema.optional(),
  active: z.coerce.boolean().optional(),
  q: optStr,
});
export type BannerListQuery = z.infer<typeof bannerListQuerySchema>;

// ── admin MediaAsset ──────────────────────────────────────────────────────────

export const mediaAssetCreateSchema = z.object({
  name: trimmed(200),
  type: mediaTypeSchema.optional(),
  filePath: trimmed(1000),
  sizeBytes: z.coerce.number().int().min(0).optional(),
  dimensions: optStr,
});
export type MediaAssetCreateInput = z.infer<typeof mediaAssetCreateSchema>;

export const mediaAssetUpdateSchema = mediaAssetCreateSchema.partial();
export type MediaAssetUpdateInput = z.infer<typeof mediaAssetUpdateSchema>;

export interface MediaAssetDto {
  id: string;
  name: string;
  type: MediaTypeDto;
  filePath: string;
  sizeBytes: number | null;
  dimensions: string | null;
  uploadedById: string | null;
  createdAt: string;
}

export interface MediaAssetListResponse {
  data: MediaAssetDto[];
  total: number;
}

export const mediaAssetListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  type: mediaTypeSchema.optional(),
  q: optStr,
});
export type MediaAssetListQuery = z.infer<typeof mediaAssetListQuerySchema>;
