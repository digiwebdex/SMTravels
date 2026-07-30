import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import type {
  BlogPostCreateInput,
  BlogPostUpdateInput,
  BlogPostListQuery,
  BlogPostDto,
  BlogPostListResponse,
  FaqCreateInput,
  FaqUpdateInput,
  FaqListQuery,
  FaqDto,
  FaqListResponse,
  TestimonialCreateInput,
  TestimonialUpdateInput,
  TestimonialListQuery,
  TestimonialDto,
  TestimonialListResponse,
} from "../contracts/cms.contract";

const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "post";
}

function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

type BlogRow = Prisma.BlogPostGetPayload<{ include: { category: true } }>;

function toBlogDto(p: BlogRow): BlogPostDto {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    body: p.body,
    excerpt: p.excerpt,
    featImg: p.featImg,
    status: p.status as BlogPostDto["status"],
    authorName: p.authorName,
    tags: p.tags,
    metaTitle: p.metaTitle,
    metaDesc: p.metaDesc,
    views: p.views,
    featured: p.featured,
    publishedAt: dIso(p.publishedAt),
    createdAt: dIso(p.createdAt)!,
    updatedAt: dIso(p.updatedAt)!,
  };
}

async function uniqueBlogSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let n = 0;
  for (;;) {
    const candidate = n ? `${slug}-${n}` : slug;
    const existing = await prisma.blogPost.findFirst({
      where: { slug: candidate, deletedAt: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    if (!existing) return candidate;
    n += 1;
  }
}

// ── BlogPost ──────────────────────────────────────────────────────────────────

export async function listBlogPosts(q: BlogPostListQuery): Promise<BlogPostListResponse> {
  const where: Prisma.BlogPostWhereInput = { deletedAt: null };
  if (q.status) where.status = q.status;
  if (q.q) {
    where.OR = [
      { title: { contains: q.q, mode: "insensitive" } },
      { slug: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: { category: true },
      orderBy: { updatedAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { data: rows.map(toBlogDto), total };
}

export async function getBlogPost(id: string): Promise<BlogPostDto> {
  const p = await prisma.blogPost.findFirst({
    where: { id, deletedAt: null },
    include: { category: true },
  });
  if (!p) throw new HttpError(404, "NotFound");
  return toBlogDto(p);
}

export async function createBlogPost(input: BlogPostCreateInput): Promise<BlogPostDto> {
  const slug = input.slug ?? (await uniqueBlogSlug(input.title));
  const status = input.status ?? "DRAFT";
  const publishedAt = input.publishedAt
    ? toDate(input.publishedAt)
    : status === "PUBLISHED"
      ? new Date()
      : null;

  try {
    const p = await prisma.blogPost.create({
      data: {
        title: input.title,
        slug,
        categoryId: input.categoryId || null,
        body: input.body,
        excerpt: input.excerpt,
        featImg: input.featImg,
        status,
        authorName: input.authorName,
        tags: input.tags ?? [],
        metaTitle: input.metaTitle,
        metaDesc: input.metaDesc,
        featured: input.featured ?? false,
        publishedAt,
      },
      include: { category: true },
    });
    return toBlogDto(p);
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function updateBlogPost(id: string, input: BlogPostUpdateInput): Promise<BlogPostDto> {
  const existing = await prisma.blogPost.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");

  let publishedAt = input.publishedAt !== undefined ? toDate(input.publishedAt) : existing.publishedAt;
  if ((input.status ?? existing.status) === "PUBLISHED" && !publishedAt) publishedAt = new Date();

  const slug = input.slug
    ? await uniqueBlogSlug(input.slug, id)
    : input.title && input.title !== existing.title
      ? await uniqueBlogSlug(input.title, id)
      : undefined;

  try {
    const p = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId || null } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
        ...(input.featImg !== undefined ? { featImg: input.featImg } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.authorName !== undefined ? { authorName: input.authorName } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle } : {}),
        ...(input.metaDesc !== undefined ? { metaDesc: input.metaDesc } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.publishedAt !== undefined || input.status !== undefined ? { publishedAt } : {}),
      },
      include: { category: true },
    });
    return toBlogDto(p);
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function deleteBlogPost(id: string): Promise<void> {
  const existing = await prisma.blogPost.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.blogPost.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ── Faq ───────────────────────────────────────────────────────────────────────

function toFaqDto(f: Prisma.FaqGetPayload<object>): FaqDto {
  return {
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
    sortOrder: f.sortOrder,
    published: f.published,
    createdAt: dIso(f.createdAt)!,
    updatedAt: dIso(f.updatedAt)!,
  };
}

export async function listFaqs(q: FaqListQuery): Promise<FaqListResponse> {
  const where: Prisma.FaqWhereInput = { deletedAt: null };
  if (q.category) where.category = q.category;
  if (q.published !== undefined) where.published = q.published;
  if (q.q) {
    where.OR = [
      { question: { contains: q.q, mode: "insensitive" } },
      { answer: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.faq.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.faq.count({ where }),
  ]);

  return { data: rows.map(toFaqDto), total };
}

export async function getFaq(id: string): Promise<FaqDto> {
  const f = await prisma.faq.findFirst({ where: { id, deletedAt: null } });
  if (!f) throw new HttpError(404, "NotFound");
  return toFaqDto(f);
}

export async function createFaq(input: FaqCreateInput): Promise<FaqDto> {
  const f = await prisma.faq.create({
    data: {
      question: input.question,
      answer: input.answer,
      category: input.category,
      sortOrder: input.sortOrder ?? 0,
      published: input.published ?? true,
    },
  });
  return toFaqDto(f);
}

export async function updateFaq(id: string, input: FaqUpdateInput): Promise<FaqDto> {
  const existing = await prisma.faq.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");

  const f = await prisma.faq.update({
    where: { id },
    data: {
      ...(input.question !== undefined ? { question: input.question } : {}),
      ...(input.answer !== undefined ? { answer: input.answer } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
    },
  });
  return toFaqDto(f);
}

export async function deleteFaq(id: string): Promise<void> {
  const existing = await prisma.faq.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.faq.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ── Testimonial ───────────────────────────────────────────────────────────────

function toTestimonialDto(t: Prisma.TestimonialGetPayload<object>): TestimonialDto {
  return {
    id: t.id,
    name: t.name,
    location: t.location,
    packageName: t.packageName,
    rating: t.rating,
    text: t.text,
    approved: t.approved,
    createdAt: dIso(t.createdAt)!,
    updatedAt: dIso(t.updatedAt)!,
  };
}

export async function listTestimonials(q: TestimonialListQuery): Promise<TestimonialListResponse> {
  const where: Prisma.TestimonialWhereInput = { deletedAt: null };
  if (q.approved !== undefined) where.approved = q.approved;
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { text: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return { data: rows.map(toTestimonialDto), total };
}

export async function getTestimonial(id: string): Promise<TestimonialDto> {
  const t = await prisma.testimonial.findFirst({ where: { id, deletedAt: null } });
  if (!t) throw new HttpError(404, "NotFound");
  return toTestimonialDto(t);
}

export async function createTestimonial(input: TestimonialCreateInput): Promise<TestimonialDto> {
  const t = await prisma.testimonial.create({
    data: {
      name: input.name,
      location: input.location,
      packageName: input.packageName,
      rating: input.rating ?? 5,
      text: input.text,
      approved: input.approved ?? false,
    },
  });
  return toTestimonialDto(t);
}

export async function updateTestimonial(id: string, input: TestimonialUpdateInput): Promise<TestimonialDto> {
  const existing = await prisma.testimonial.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");

  const t = await prisma.testimonial.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.packageName !== undefined ? { packageName: input.packageName } : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.text !== undefined ? { text: input.text } : {}),
      ...(input.approved !== undefined ? { approved: input.approved } : {}),
    },
  });
  return toTestimonialDto(t);
}

export async function deleteTestimonial(id: string): Promise<void> {
  const existing = await prisma.testimonial.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.testimonial.update({ where: { id }, data: { deletedAt: new Date() } });
}
