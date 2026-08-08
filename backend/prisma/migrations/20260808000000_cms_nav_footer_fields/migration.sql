-- Phase 2.1 — CMS nav/footer support. ADDITIVE & NON-DESTRUCTIVE.
-- MenuItem presentation fields (icon, open-in-new-tab, hide/show, publish, mega-menu)
-- and three new MenuLocation values (top bar, footer quick links, legal links).
-- Applied via safe DDL because the local migration history is diverged from the DB
-- (a normal `prisma migrate dev` would attempt a destructive reset).

ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "openNewTab" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "megaMenu" BOOLEAN NOT NULL DEFAULT false;

ALTER TYPE "MenuLocation" ADD VALUE IF NOT EXISTS 'TOP_NAV';
ALTER TYPE "MenuLocation" ADD VALUE IF NOT EXISTS 'QUICK_LINKS';
ALTER TYPE "MenuLocation" ADD VALUE IF NOT EXISTS 'LEGAL_NAV';
