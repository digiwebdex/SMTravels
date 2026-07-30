import type { Request, Response } from "express";
import {
  publicPackageListQuerySchema,
  publicBlogListQuerySchema,
} from "../contracts/cms.contract";
import * as cmsPublic from "../services/cmsPublic.service";

export async function listPublicPackagesHandler(req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.listPublishedPackages(publicPackageListQuerySchema.parse(req.query)));
}

export async function getPublicPackageHandler(req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.getPublishedPackage(req.params.slugOrId));
}

export async function listPublicBlogHandler(req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.listPublishedBlogPosts(publicBlogListQuerySchema.parse(req.query)));
}

export async function getPublicBlogHandler(req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.getPublishedBlogPost(req.params.slug));
}

export async function listPublicFaqsHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.listPublicFaqs());
}

export async function listPublicTestimonialsHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.listPublicTestimonials());
}

export async function listPublicGalleryHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.listPublicGallery());
}
