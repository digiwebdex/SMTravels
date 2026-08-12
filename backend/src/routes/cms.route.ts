import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listBlogPostsHandler,
  getBlogPostHandler,
  createBlogPostHandler,
  updateBlogPostHandler,
  deleteBlogPostHandler,
  listFaqsHandler,
  getFaqHandler,
  createFaqHandler,
  updateFaqHandler,
  deleteFaqHandler,
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  listStatisticsHandler,
  createStatisticHandler,
  updateStatisticHandler,
  deleteStatisticHandler,
  listHomeServicesHandler,
  createHomeServiceHandler,
  updateHomeServiceHandler,
  deleteHomeServiceHandler,
  listTestimonialsHandler,
  getTestimonialHandler,
  createTestimonialHandler,
  updateTestimonialHandler,
  deleteTestimonialHandler,
  listCmsPagesHandler,
  getCmsPageHandler,
  createCmsPageHandler,
  updateCmsPageHandler,
  deleteCmsPageHandler,
  listMenusHandler,
  getMenuHandler,
  createMenuHandler,
  updateMenuHandler,
  deleteMenuHandler,
  createMenuItemHandler,
  updateMenuItemHandler,
  deleteMenuItemHandler,
  listBannersHandler,
  getBannerHandler,
  createBannerHandler,
  updateBannerHandler,
  deleteBannerHandler,
  listMediaAssetsHandler,
  getMediaAssetHandler,
  createMediaAssetHandler,
  updateMediaAssetHandler,
  deleteMediaAssetHandler,
} from "../controllers/cms.controller";

/** ERP CMS admin — requireAuth + cms permission. */
export const cmsRouter = Router();
const view = requirePermission("cms", "view");
const manage = requirePermission("cms", "manage");

cmsRouter.get("/cms/blog", requireAuth, view, asyncHandler(listBlogPostsHandler));
cmsRouter.get("/cms/blog/:id", requireAuth, view, asyncHandler(getBlogPostHandler));
cmsRouter.post("/cms/blog", requireAuth, manage, asyncHandler(createBlogPostHandler));
cmsRouter.patch("/cms/blog/:id", requireAuth, manage, asyncHandler(updateBlogPostHandler));
cmsRouter.delete("/cms/blog/:id", requireAuth, manage, asyncHandler(deleteBlogPostHandler));

cmsRouter.get("/cms/faqs", requireAuth, view, asyncHandler(listFaqsHandler));
cmsRouter.get("/cms/faqs/:id", requireAuth, view, asyncHandler(getFaqHandler));
cmsRouter.post("/cms/faqs", requireAuth, manage, asyncHandler(createFaqHandler));
cmsRouter.patch("/cms/faqs/:id", requireAuth, manage, asyncHandler(updateFaqHandler));
cmsRouter.delete("/cms/faqs/:id", requireAuth, manage, asyncHandler(deleteFaqHandler));
cmsRouter.get("/cms/categories", requireAuth, view, asyncHandler(listCategoriesHandler));
cmsRouter.post("/cms/categories", requireAuth, manage, asyncHandler(createCategoryHandler));
cmsRouter.patch("/cms/categories/:id", requireAuth, manage, asyncHandler(updateCategoryHandler));
cmsRouter.delete("/cms/categories/:id", requireAuth, manage, asyncHandler(deleteCategoryHandler));
cmsRouter.get("/cms/statistics", requireAuth, view, asyncHandler(listStatisticsHandler));
cmsRouter.post("/cms/statistics", requireAuth, manage, asyncHandler(createStatisticHandler));
cmsRouter.patch("/cms/statistics/:id", requireAuth, manage, asyncHandler(updateStatisticHandler));
cmsRouter.delete("/cms/statistics/:id", requireAuth, manage, asyncHandler(deleteStatisticHandler));
cmsRouter.get("/cms/home-services", requireAuth, view, asyncHandler(listHomeServicesHandler));
cmsRouter.post("/cms/home-services", requireAuth, manage, asyncHandler(createHomeServiceHandler));
cmsRouter.patch("/cms/home-services/:id", requireAuth, manage, asyncHandler(updateHomeServiceHandler));
cmsRouter.delete("/cms/home-services/:id", requireAuth, manage, asyncHandler(deleteHomeServiceHandler));

cmsRouter.get("/cms/testimonials", requireAuth, view, asyncHandler(listTestimonialsHandler));
cmsRouter.get("/cms/testimonials/:id", requireAuth, view, asyncHandler(getTestimonialHandler));
cmsRouter.post("/cms/testimonials", requireAuth, manage, asyncHandler(createTestimonialHandler));
cmsRouter.patch("/cms/testimonials/:id", requireAuth, manage, asyncHandler(updateTestimonialHandler));
cmsRouter.delete("/cms/testimonials/:id", requireAuth, manage, asyncHandler(deleteTestimonialHandler));

cmsRouter.get("/cms/pages", requireAuth, view, asyncHandler(listCmsPagesHandler));
cmsRouter.get("/cms/pages/:id", requireAuth, view, asyncHandler(getCmsPageHandler));
cmsRouter.post("/cms/pages", requireAuth, manage, asyncHandler(createCmsPageHandler));
cmsRouter.patch("/cms/pages/:id", requireAuth, manage, asyncHandler(updateCmsPageHandler));
cmsRouter.delete("/cms/pages/:id", requireAuth, manage, asyncHandler(deleteCmsPageHandler));

cmsRouter.get("/cms/menus", requireAuth, view, asyncHandler(listMenusHandler));
cmsRouter.get("/cms/menus/:id", requireAuth, view, asyncHandler(getMenuHandler));
cmsRouter.post("/cms/menus", requireAuth, manage, asyncHandler(createMenuHandler));
cmsRouter.patch("/cms/menus/:id", requireAuth, manage, asyncHandler(updateMenuHandler));
cmsRouter.delete("/cms/menus/:id", requireAuth, manage, asyncHandler(deleteMenuHandler));
cmsRouter.post("/cms/menus/:id/items", requireAuth, manage, asyncHandler(createMenuItemHandler));
cmsRouter.patch("/cms/menus/:id/items/:itemId", requireAuth, manage, asyncHandler(updateMenuItemHandler));
cmsRouter.delete("/cms/menus/:id/items/:itemId", requireAuth, manage, asyncHandler(deleteMenuItemHandler));

cmsRouter.get("/cms/banners", requireAuth, view, asyncHandler(listBannersHandler));
cmsRouter.get("/cms/banners/:id", requireAuth, view, asyncHandler(getBannerHandler));
cmsRouter.post("/cms/banners", requireAuth, manage, asyncHandler(createBannerHandler));
cmsRouter.patch("/cms/banners/:id", requireAuth, manage, asyncHandler(updateBannerHandler));
cmsRouter.delete("/cms/banners/:id", requireAuth, manage, asyncHandler(deleteBannerHandler));

cmsRouter.get("/cms/media", requireAuth, view, asyncHandler(listMediaAssetsHandler));
cmsRouter.get("/cms/media/:id", requireAuth, view, asyncHandler(getMediaAssetHandler));
cmsRouter.post("/cms/media", requireAuth, manage, asyncHandler(createMediaAssetHandler));
cmsRouter.patch("/cms/media/:id", requireAuth, manage, asyncHandler(updateMediaAssetHandler));
cmsRouter.delete("/cms/media/:id", requireAuth, manage, asyncHandler(deleteMediaAssetHandler));
