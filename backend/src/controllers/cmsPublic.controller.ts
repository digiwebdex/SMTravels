import type { Request, Response } from "express";
import {
  publicPackageListQuerySchema,
  publicBlogListQuerySchema,
  publicBannerListQuerySchema,
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

export async function getPublicCmsPageHandler(req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.getPublishedCmsPage(req.params.slug));
}

export async function getPublicMenuHandler(req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.getPublicMenu(req.params.location));
}

export async function listPublicBannersHandler(req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.listPublicBanners(publicBannerListQuerySchema.parse(req.query)));
}

export async function listPublicSettingsHandler(req: Request, res: Response): Promise<void> {
  const group = typeof req.query.group === "string" ? req.query.group : undefined;
  res.json(await cmsPublic.listPublicSettings(group));
}

export async function listPublicStatisticsHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.listPublicStatistics());
}

export async function listPublicServicesHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.listPublicServices());
}

export async function getPublicHeroHandler(req: Request, res: Response): Promise<void> {
  const key = typeof req.query.key === "string" ? req.query.key : undefined;
  res.json(await cmsPublic.getPublicHero(key));
}

export async function listPublicHomeSectionsHandler(_req: Request, res: Response): Promise<void> {
  res.json(await cmsPublic.listPublicHomeSections());
}

// ── SiteContent (public marketing site content) ─────────────────────────────
import * as siteContent from "../services/siteContent.service";

export async function listPublicSiteContentHandler(_req: Request, res: Response): Promise<void> {
  const rows = await siteContent.listSiteContent();
  // Return as a { key: data } map for easy consumption by the website.
  const map: Record<string, unknown> = {};
  for (const r of rows) map[r.key] = r.data;
  res.json({ content: map });
}

export async function getPublicSiteContentHandler(req: Request, res: Response): Promise<void> {
  const row = await siteContent.getSiteContent(req.params.key);
  res.json({ key: req.params.key, data: row ? row.data : null });
}
