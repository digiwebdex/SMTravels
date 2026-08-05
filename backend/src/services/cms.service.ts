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
  CmsPageCreateInput,
  CmsPageUpdateInput,
  CmsPageListQuery,
  CmsPageDto,
  CmsPageListResponse,
  MenuCreateInput,
  MenuUpdateInput,
  MenuItemCreateInput,
  MenuItemUpdateInput,
  MenuDto,
  MenuItemDto,
  MenuListResponse,
  BannerCreateInput,
  BannerUpdateInput,
  BannerListQuery,
  BannerDto,
  BannerListResponse,
  MediaAssetCreateInput,
  MediaAssetUpdateInput,
  MediaAssetListQuery,
  MediaAssetDto,
  MediaAssetListResponse,
} from "../contracts/cms.contract";

const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const dDate = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);

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

// ── CmsPage ───────────────────────────────────────────────────────────────────

function toCmsPageDto(p: Prisma.CmsPageGetPayload<object>): CmsPageDto {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    body: p.body,
    status: p.status as CmsPageDto["status"],
    metaTitle: p.metaTitle,
    metaDesc: p.metaDesc,
    template: p.template,
    parentPageId: p.parentPageId,
    visibility: p.visibility,
    authorId: p.authorId,
    views: p.views,
    publishedAt: dIso(p.publishedAt),
    createdAt: dIso(p.createdAt)!,
    updatedAt: dIso(p.updatedAt)!,
  };
}

async function uniquePageSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let n = 0;
  for (;;) {
    const candidate = n ? `${slug}-${n}` : slug;
    const existing = await prisma.cmsPage.findFirst({
      where: { slug: candidate, deletedAt: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    if (!existing) return candidate;
    n += 1;
  }
}

export async function listCmsPages(q: CmsPageListQuery): Promise<CmsPageListResponse> {
  const where: Prisma.CmsPageWhereInput = { deletedAt: null };
  if (q.status) where.status = q.status;
  if (q.q) {
    where.OR = [
      { title: { contains: q.q, mode: "insensitive" } },
      { slug: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.cmsPage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.cmsPage.count({ where }),
  ]);

  return { data: rows.map(toCmsPageDto), total };
}

export async function getCmsPage(id: string): Promise<CmsPageDto> {
  const p = await prisma.cmsPage.findFirst({ where: { id, deletedAt: null } });
  if (!p) throw new HttpError(404, "NotFound");
  return toCmsPageDto(p);
}

export async function createCmsPage(input: CmsPageCreateInput): Promise<CmsPageDto> {
  const slug = input.slug ?? (await uniquePageSlug(input.title));
  const status = input.status ?? "DRAFT";
  const publishedAt = input.publishedAt
    ? toDate(input.publishedAt)
    : status === "PUBLISHED"
      ? new Date()
      : null;

  try {
    const p = await prisma.cmsPage.create({
      data: {
        title: input.title,
        slug,
        body: input.body,
        status,
        metaTitle: input.metaTitle,
        metaDesc: input.metaDesc,
        template: input.template,
        parentPageId: input.parentPageId || null,
        visibility: input.visibility ?? "public",
        publishedAt,
      },
    });
    return toCmsPageDto(p);
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function updateCmsPage(id: string, input: CmsPageUpdateInput): Promise<CmsPageDto> {
  const existing = await prisma.cmsPage.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");

  let publishedAt = input.publishedAt !== undefined ? toDate(input.publishedAt) : existing.publishedAt;
  if ((input.status ?? existing.status) === "PUBLISHED" && !publishedAt) publishedAt = new Date();

  const slug = input.slug
    ? await uniquePageSlug(input.slug, id)
    : input.title && input.title !== existing.title
      ? await uniquePageSlug(input.title, id)
      : undefined;

  try {
    const p = await prisma.cmsPage.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle } : {}),
        ...(input.metaDesc !== undefined ? { metaDesc: input.metaDesc } : {}),
        ...(input.template !== undefined ? { template: input.template } : {}),
        ...(input.parentPageId !== undefined ? { parentPageId: input.parentPageId || null } : {}),
        ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
        ...(input.publishedAt !== undefined || input.status !== undefined ? { publishedAt } : {}),
      },
    });
    return toCmsPageDto(p);
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function deleteCmsPage(id: string): Promise<void> {
  const existing = await prisma.cmsPage.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.cmsPage.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ── Menu ──────────────────────────────────────────────────────────────────────

type MenuItemRow = Prisma.MenuItemGetPayload<object>;

function buildMenuTree(items: MenuItemRow[], parentId: string | null = null): MenuItemDto[] {
  return items
    .filter((i) => i.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => ({
      id: i.id,
      menuId: i.menuId,
      parentId: i.parentId,
      label: i.label,
      url: i.url,
      sortOrder: i.sortOrder,
      children: buildMenuTree(items, i.id),
    }));
}

function toMenuDto(m: Prisma.MenuGetPayload<{ include: { items: true } }>): MenuDto {
  return {
    id: m.id,
    location: m.location as MenuDto["location"],
    name: m.name,
    items: buildMenuTree(m.items),
    createdAt: dIso(m.createdAt)!,
    updatedAt: dIso(m.updatedAt)!,
  };
}

const menuInclude = { items: true } satisfies Prisma.MenuInclude;

export async function listMenus(): Promise<MenuListResponse> {
  const rows = await prisma.menu.findMany({
    include: menuInclude,
    orderBy: { location: "asc" },
  });
  return { data: rows.map(toMenuDto) };
}

export async function getMenu(id: string): Promise<MenuDto> {
  const m = await prisma.menu.findUnique({ where: { id }, include: menuInclude });
  if (!m) throw new HttpError(404, "NotFound");
  return toMenuDto(m);
}

export async function createMenu(input: MenuCreateInput): Promise<MenuDto> {
  try {
    const m = await prisma.menu.create({
      data: { location: input.location, name: input.name },
      include: menuInclude,
    });
    return toMenuDto(m);
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function updateMenu(id: string, input: MenuUpdateInput): Promise<MenuDto> {
  const existing = await prisma.menu.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "NotFound");
  try {
    const m = await prisma.menu.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
      },
      include: menuInclude,
    });
    return toMenuDto(m);
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function deleteMenu(id: string): Promise<void> {
  const existing = await prisma.menu.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.menu.delete({ where: { id } });
}

export async function createMenuItem(menuId: string, input: MenuItemCreateInput): Promise<MenuItemDto> {
  const menu = await prisma.menu.findUnique({ where: { id: menuId } });
  if (!menu) throw new HttpError(404, "NotFound");

  if (input.parentId) {
    const parent = await prisma.menuItem.findFirst({ where: { id: input.parentId, menuId } });
    if (!parent) throw new HttpError(400, "InvalidParent");
  }

  const item = await prisma.menuItem.create({
    data: {
      menuId,
      label: input.label,
      url: input.url,
      parentId: input.parentId || null,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  return {
    id: item.id,
    menuId: item.menuId,
    parentId: item.parentId,
    label: item.label,
    url: item.url,
    sortOrder: item.sortOrder,
    children: [],
  };
}

export async function updateMenuItem(
  menuId: string,
  itemId: string,
  input: MenuItemUpdateInput,
): Promise<MenuItemDto> {
  const existing = await prisma.menuItem.findFirst({ where: { id: itemId, menuId } });
  if (!existing) throw new HttpError(404, "NotFound");

  if (input.parentId) {
    if (input.parentId === itemId) throw new HttpError(400, "InvalidParent");
    const parent = await prisma.menuItem.findFirst({ where: { id: input.parentId, menuId } });
    if (!parent) throw new HttpError(400, "InvalidParent");
  }

  const item = await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId || null } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });

  return {
    id: item.id,
    menuId: item.menuId,
    parentId: item.parentId,
    label: item.label,
    url: item.url,
    sortOrder: item.sortOrder,
    children: [],
  };
}

export async function deleteMenuItem(menuId: string, itemId: string): Promise<void> {
  const existing = await prisma.menuItem.findFirst({ where: { id: itemId, menuId } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.menuItem.delete({ where: { id: itemId } });
}

// ── Banner ────────────────────────────────────────────────────────────────────

function toBannerDto(b: Prisma.BannerGetPayload<object>): BannerDto {
  return {
    id: b.id,
    title: b.title,
    position: b.position,
    type: b.type as BannerDto["type"],
    image: b.image,
    linkUrl: b.linkUrl,
    active: b.active,
    expiresAt: dDate(b.expiresAt),
    createdAt: dIso(b.createdAt)!,
    updatedAt: dIso(b.updatedAt)!,
  };
}

export async function listBanners(q: BannerListQuery): Promise<BannerListResponse> {
  const where: Prisma.BannerWhereInput = { deletedAt: null };
  if (q.type) where.type = q.type;
  if (q.active !== undefined) where.active = q.active;
  if (q.q) {
    where.OR = [
      { title: { contains: q.q, mode: "insensitive" } },
      { position: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.banner.count({ where }),
  ]);

  return { data: rows.map(toBannerDto), total };
}

export async function getBanner(id: string): Promise<BannerDto> {
  const b = await prisma.banner.findFirst({ where: { id, deletedAt: null } });
  if (!b) throw new HttpError(404, "NotFound");
  return toBannerDto(b);
}

export async function createBanner(input: BannerCreateInput): Promise<BannerDto> {
  const b = await prisma.banner.create({
    data: {
      title: input.title,
      position: input.position,
      type: input.type ?? "PROMO",
      image: input.image,
      linkUrl: input.linkUrl,
      active: input.active ?? true,
      expiresAt: toDate(input.expiresAt),
    },
  });
  return toBannerDto(b);
}

export async function updateBanner(id: string, input: BannerUpdateInput): Promise<BannerDto> {
  const existing = await prisma.banner.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");

  const b = await prisma.banner.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
      ...(input.linkUrl !== undefined ? { linkUrl: input.linkUrl } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: toDate(input.expiresAt) } : {}),
    },
  });
  return toBannerDto(b);
}

export async function deleteBanner(id: string): Promise<void> {
  const existing = await prisma.banner.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.banner.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ── MediaAsset ────────────────────────────────────────────────────────────────

function toMediaDto(m: Prisma.MediaAssetGetPayload<object>): MediaAssetDto {
  return {
    id: m.id,
    name: m.name,
    type: m.type as MediaAssetDto["type"],
    filePath: m.filePath,
    sizeBytes: m.sizeBytes,
    dimensions: m.dimensions,
    uploadedById: m.uploadedById,
    createdAt: dIso(m.createdAt)!,
  };
}

export async function listMediaAssets(q: MediaAssetListQuery): Promise<MediaAssetListResponse> {
  const where: Prisma.MediaAssetWhereInput = { deletedAt: null };
  if (q.type) where.type = q.type;
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { filePath: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.mediaAsset.count({ where }),
  ]);

  return { data: rows.map(toMediaDto), total };
}

export async function getMediaAsset(id: string): Promise<MediaAssetDto> {
  const m = await prisma.mediaAsset.findFirst({ where: { id, deletedAt: null } });
  if (!m) throw new HttpError(404, "NotFound");
  return toMediaDto(m);
}

export async function createMediaAsset(
  input: MediaAssetCreateInput,
  uploadedById?: string,
): Promise<MediaAssetDto> {
  const m = await prisma.mediaAsset.create({
    data: {
      name: input.name,
      type: input.type ?? "IMAGE",
      filePath: input.filePath,
      sizeBytes: input.sizeBytes,
      dimensions: input.dimensions,
      uploadedById: uploadedById ?? null,
    },
  });
  return toMediaDto(m);
}

export async function updateMediaAsset(id: string, input: MediaAssetUpdateInput): Promise<MediaAssetDto> {
  const existing = await prisma.mediaAsset.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");

  const m = await prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.filePath !== undefined ? { filePath: input.filePath } : {}),
      ...(input.sizeBytes !== undefined ? { sizeBytes: input.sizeBytes } : {}),
      ...(input.dimensions !== undefined ? { dimensions: input.dimensions } : {}),
    },
  });
  return toMediaDto(m);
}

export async function deleteMediaAsset(id: string): Promise<void> {
  const existing = await prisma.mediaAsset.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.mediaAsset.update({ where: { id }, data: { deletedAt: new Date() } });
}
