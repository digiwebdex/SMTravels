import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import {
  listPublicPackagesHandler,
  getPublicPackageHandler,
  listPublicBlogHandler,
  getPublicBlogHandler,
  listPublicFaqsHandler,
  listPublicTestimonialsHandler,
  listPublicGalleryHandler,
  getPublicCmsPageHandler,
  getPublicMenuHandler,
  listPublicBannersHandler,
  listPublicSettingsHandler,
  listPublicStatisticsHandler,
  listPublicServicesHandler,
  getPublicHeroHandler,
  listPublicHomeSectionsHandler,
  listPublicSiteContentHandler,
  getPublicSiteContentHandler,
} from "../controllers/cmsPublic.controller";

/** Short CDN-friendly cache for anonymous marketing content. */
function publicCache(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }
  next();
}

/** Public website content — no auth required. */
export const cmsPublicRouter = Router();
cmsPublicRouter.use(publicCache);

cmsPublicRouter.get("/public/packages", asyncHandler(listPublicPackagesHandler));
cmsPublicRouter.get("/public/packages/:slugOrId", asyncHandler(getPublicPackageHandler));
cmsPublicRouter.get("/public/blog", asyncHandler(listPublicBlogHandler));
cmsPublicRouter.get("/public/blog/:slug", asyncHandler(getPublicBlogHandler));
cmsPublicRouter.get("/public/faqs", asyncHandler(listPublicFaqsHandler));
cmsPublicRouter.get("/public/testimonials", asyncHandler(listPublicTestimonialsHandler));
cmsPublicRouter.get("/public/gallery", asyncHandler(listPublicGalleryHandler));
cmsPublicRouter.get("/public/pages/:slug", asyncHandler(getPublicCmsPageHandler));
cmsPublicRouter.get("/public/menus/:location", asyncHandler(getPublicMenuHandler));
cmsPublicRouter.get("/public/banners", asyncHandler(listPublicBannersHandler));
cmsPublicRouter.get("/public/settings", asyncHandler(listPublicSettingsHandler));
cmsPublicRouter.get("/public/statistics", asyncHandler(listPublicStatisticsHandler));
cmsPublicRouter.get("/public/services", asyncHandler(listPublicServicesHandler));
cmsPublicRouter.get("/public/hero", asyncHandler(getPublicHeroHandler));
cmsPublicRouter.get("/public/home-sections", asyncHandler(listPublicHomeSectionsHandler));
cmsPublicRouter.get("/public/site-content", asyncHandler(listPublicSiteContentHandler));
cmsPublicRouter.get("/public/site-content/:key", asyncHandler(getPublicSiteContentHandler));
