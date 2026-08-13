/**
 * Seed the SiteContent store from the design's bundled content
 * (prisma/site-content-seed.json, exported from the new website's src/data).
 *
 * Non-destructive by default: only creates keys that don't exist yet, so a
 * re-run never clobbers content an editor changed in the CMS. Set
 * SEED_SITE_CONTENT_FORCE=1 to reset every key back to the design defaults.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const raw = readFileSync(join(__dirname, "site-content-seed.json"), "utf8");
  const content = JSON.parse(raw) as Record<string, unknown>;
  const force = process.env.SEED_SITE_CONTENT_FORCE === "1";

  let created = 0;
  let reset = 0;
  let kept = 0;

  for (const [key, data] of Object.entries(content)) {
    const existing = await prisma.siteContent.findUnique({ where: { key } });
    if (existing && !force) {
      kept++;
      continue;
    }
    if (existing) {
      await prisma.siteContent.update({ where: { key }, data: { data: data as Prisma.InputJsonValue } });
      reset++;
    } else {
      await prisma.siteContent.create({ data: { key, data: data as Prisma.InputJsonValue } });
      created++;
    }
  }

  console.log(
    `site-content seed: ${created} created, ${reset} reset(force), ${kept} kept — total keys ${Object.keys(content).length}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
