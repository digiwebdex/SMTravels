import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import {
  listPublicPackagesHandler,
  getPublicPackageHandler,
  listPublicBlogHandler,
  getPublicBlogHandler,
  listPublicFaqsHandler,
  listPublicTestimonialsHandler,
  listPublicGalleryHandler,
} from "../controllers/cmsPublic.controller";

/** Public website content — no auth required. */
export const cmsPublicRouter = Router();

cmsPublicRouter.get("/public/packages", asyncHandler(listPublicPackagesHandler));
cmsPublicRouter.get("/public/packages/:slugOrId", asyncHandler(getPublicPackageHandler));
cmsPublicRouter.get("/public/blog", asyncHandler(listPublicBlogHandler));
cmsPublicRouter.get("/public/blog/:slug", asyncHandler(getPublicBlogHandler));
cmsPublicRouter.get("/public/faqs", asyncHandler(listPublicFaqsHandler));
cmsPublicRouter.get("/public/testimonials", asyncHandler(listPublicTestimonialsHandler));
cmsPublicRouter.get("/public/gallery", asyncHandler(listPublicGalleryHandler));
