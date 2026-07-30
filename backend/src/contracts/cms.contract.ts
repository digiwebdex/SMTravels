/**
 * CMS contract — public website content + admin CRUD for BlogPost, Faq,
 * Testimonial. zod-only (no @prisma) so the frontend can import types.
 */
import { z } from "zod";

export const CONTENT_STATUSES = ["PUBLISHED", "DRAFT", "SCHEDULED", "ARCHIVED"] as const;
export const contentStatusSchema = z.enum(CONTENT_STATUSES);
export type ContentStatusDto = z.infer<typeof contentStatusSchema>;

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
