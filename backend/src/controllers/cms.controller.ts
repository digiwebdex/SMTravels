import type { Request, Response } from "express";
import {
  blogPostCreateSchema,
  blogPostUpdateSchema,
  blogPostListQuerySchema,
  faqCreateSchema,
  faqUpdateSchema,
  faqListQuerySchema,
  testimonialCreateSchema,
  testimonialUpdateSchema,
  testimonialListQuerySchema,
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
