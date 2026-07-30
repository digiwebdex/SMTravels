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
  listTestimonialsHandler,
  getTestimonialHandler,
  createTestimonialHandler,
  updateTestimonialHandler,
  deleteTestimonialHandler,
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

cmsRouter.get("/cms/testimonials", requireAuth, view, asyncHandler(listTestimonialsHandler));
cmsRouter.get("/cms/testimonials/:id", requireAuth, view, asyncHandler(getTestimonialHandler));
cmsRouter.post("/cms/testimonials", requireAuth, manage, asyncHandler(createTestimonialHandler));
cmsRouter.patch("/cms/testimonials/:id", requireAuth, manage, asyncHandler(updateTestimonialHandler));
cmsRouter.delete("/cms/testimonials/:id", requireAuth, manage, asyncHandler(deleteTestimonialHandler));
