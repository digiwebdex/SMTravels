import type { Request, Response } from "express";
import {
  blogPostCreateSchema,
  blogPostUpdateSchema,
  blogPostListQuerySchema,
  faqCreateSchema,
  faqUpdateSchema,
  faqListQuerySchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  statisticCreateSchema,
  statisticUpdateSchema,
  homeServiceCreateSchema,
  homeServiceUpdateSchema,
  homeSectionUpdateSchema,
  testimonialCreateSchema,
  testimonialUpdateSchema,
  testimonialListQuerySchema,
  cmsPageCreateSchema,
  cmsPageUpdateSchema,
  cmsPageListQuerySchema,
  menuCreateSchema,
  menuUpdateSchema,
  menuItemCreateSchema,
  menuItemUpdateSchema,
  bannerCreateSchema,
  bannerUpdateSchema,
  bannerListQuerySchema,
  mediaAssetCreateSchema,
  mediaAssetUpdateSchema,
  mediaAssetListQuerySchema,
} from "../contracts/cms.contract";
import * as cms from "../services/cms.service";

// ── BlogPost ──────────────────────────────────────────────────────────────────

export async function listBlogPostsHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.listBlogPosts(blogPostListQuerySchema.parse(req.query)));
}

export async function getBlogPostHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.getBlogPost(req.params.id));
}

export async function createBlogPostHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await cms.createBlogPost(blogPostCreateSchema.parse(req.body)));
}

export async function updateBlogPostHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateBlogPost(req.params.id, blogPostUpdateSchema.parse(req.body)));
}

export async function deleteBlogPostHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteBlogPost(req.params.id);
  res.json({ ok: true });
}

// ── Faq ───────────────────────────────────────────────────────────────────────

export async function listFaqsHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.listFaqs(faqListQuerySchema.parse(req.query)));
}

export async function getFaqHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.getFaq(req.params.id));
}

export async function createFaqHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await cms.createFaq(faqCreateSchema.parse(req.body)));
}

export async function updateFaqHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateFaq(req.params.id, faqUpdateSchema.parse(req.body)));
}

export async function deleteFaqHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteFaq(req.params.id);
  res.json({ ok: true });
}
export async function listCategoriesHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cms.listCategories());
}
export async function createCategoryHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await cms.createCategory(categoryCreateSchema.parse(req.body)));
}
export async function updateCategoryHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateCategory(req.params.id, categoryUpdateSchema.parse(req.body)));
}
export async function deleteCategoryHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteCategory(req.params.id);
  res.json({ ok: true });
}
export async function listStatisticsHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cms.listStatistics());
}
export async function createStatisticHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await cms.createStatistic(statisticCreateSchema.parse(req.body)));
}
export async function updateStatisticHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateStatistic(req.params.id, statisticUpdateSchema.parse(req.body)));
}
export async function deleteStatisticHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteStatistic(req.params.id);
  res.json({ ok: true });
}
export async function listHomeServicesHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cms.listHomeServices());
}
export async function createHomeServiceHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await cms.createHomeService(homeServiceCreateSchema.parse(req.body)));
}
export async function updateHomeServiceHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateHomeService(req.params.id, homeServiceUpdateSchema.parse(req.body)));
}
export async function deleteHomeServiceHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteHomeService(req.params.id);
  res.json({ ok: true });
}
export async function listHomeSectionsHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cms.listHomeSections());
}
export async function updateHomeSectionHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateHomeSection(req.params.id, homeSectionUpdateSchema.parse(req.body)));
}

// ── Testimonial ─────────────────────────────────────────────────────────────────

export async function listTestimonialsHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.listTestimonials(testimonialListQuerySchema.parse(req.query)));
}

export async function getTestimonialHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.getTestimonial(req.params.id));
}

export async function createTestimonialHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await cms.createTestimonial(testimonialCreateSchema.parse(req.body)));
}

export async function updateTestimonialHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateTestimonial(req.params.id, testimonialUpdateSchema.parse(req.body)));
}

export async function deleteTestimonialHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteTestimonial(req.params.id);
  res.json({ ok: true });
}

// ── CmsPage ───────────────────────────────────────────────────────────────────

export async function listCmsPagesHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.listCmsPages(cmsPageListQuerySchema.parse(req.query)));
}

export async function getCmsPageHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.getCmsPage(req.params.id));
}

export async function createCmsPageHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await cms.createCmsPage(cmsPageCreateSchema.parse(req.body)));
}

export async function updateCmsPageHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateCmsPage(req.params.id, cmsPageUpdateSchema.parse(req.body)));
}

export async function deleteCmsPageHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteCmsPage(req.params.id);
  res.json({ ok: true });
}

// ── Menu ──────────────────────────────────────────────────────────────────────

export async function listMenusHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cms.listMenus());
}

export async function getMenuHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.getMenu(req.params.id));
}

export async function createMenuHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await cms.createMenu(menuCreateSchema.parse(req.body)));
}

export async function updateMenuHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateMenu(req.params.id, menuUpdateSchema.parse(req.body)));
}

export async function deleteMenuHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteMenu(req.params.id);
  res.json({ ok: true });
}

export async function createMenuItemHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await cms.createMenuItem(req.params.id, menuItemCreateSchema.parse(req.body)));
}

export async function updateMenuItemHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateMenuItem(req.params.id, req.params.itemId, menuItemUpdateSchema.parse(req.body)));
}

export async function deleteMenuItemHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteMenuItem(req.params.id, req.params.itemId);
  res.json({ ok: true });
}

// ── Banner ────────────────────────────────────────────────────────────────────

export async function listBannersHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.listBanners(bannerListQuerySchema.parse(req.query)));
}

export async function getBannerHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.getBanner(req.params.id));
}

export async function createBannerHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await cms.createBanner(bannerCreateSchema.parse(req.body)));
}

export async function updateBannerHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateBanner(req.params.id, bannerUpdateSchema.parse(req.body)));
}

export async function deleteBannerHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteBanner(req.params.id);
  res.json({ ok: true });
}

// ── MediaAsset ────────────────────────────────────────────────────────────────

export async function listMediaAssetsHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.listMediaAssets(mediaAssetListQuerySchema.parse(req.query)));
}

export async function getMediaAssetHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.getMediaAsset(req.params.id));
}

export async function createMediaAssetHandler(req: Request, res: Response): Promise<void> {
  const userId = (req as Request & { user?: { id?: string } }).user?.id;
  res.status(201).json(await cms.createMediaAsset(mediaAssetCreateSchema.parse(req.body), userId));
}

export async function updateMediaAssetHandler(req: Request, res: Response): Promise<void> {
  res.json(await cms.updateMediaAsset(req.params.id, mediaAssetUpdateSchema.parse(req.body)));
}

export async function deleteMediaAssetHandler(req: Request, res: Response): Promise<void> {
  await cms.deleteMediaAsset(req.params.id);
  res.json({ ok: true });
}
