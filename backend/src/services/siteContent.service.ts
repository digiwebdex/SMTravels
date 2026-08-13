/**
 * SiteContent — keyed JSON content the public marketing site reads and the CMS
 * edits. One row per content group (packages, services, about, siteConfig, ...).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";

export interface SiteContentDto {
  key: string;
  data: unknown;
  updatedAt: Date;
}

/** All content groups, keyed — used by the CMS list view and public bulk fetch. */
export async function listSiteContent(): Promise<SiteContentDto[]> {
  const rows = await prisma.siteContent.findMany({ orderBy: { key: "asc" } });
  return rows.map((r) => ({ key: r.key, data: r.data, updatedAt: r.updatedAt }));
}

/** One content group by key. Returns null when absent (public site falls back
 *  to its bundled defaults; the CMS treats null as "not seeded yet"). */
export async function getSiteContent(key: string): Promise<SiteContentDto | null> {
  const row = await prisma.siteContent.findUnique({ where: { key } });
  return row ? { key: row.key, data: row.data, updatedAt: row.updatedAt } : null;
}

/** Create-or-update the JSON for a key (CMS save). */
export async function upsertSiteContent(key: string, data: unknown): Promise<SiteContentDto> {
  if (!key || !/^[a-zA-Z0-9_-]{1,64}$/.test(key)) {
    throw new HttpError(400, "Invalid content key");
  }
  if (data === undefined || data === null) {
    throw new HttpError(400, "Content data is required");
  }
  const value = data as Prisma.InputJsonValue;
  const row = await prisma.siteContent.upsert({
    where: { key },
    create: { key, data: value },
    update: { data: value },
  });
  return { key: row.key, data: row.data, updatedAt: row.updatedAt };
}
