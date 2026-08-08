-- Phase 2.2B — Homepage Services CMS module. ADDITIVE (CREATE TABLE only), non-destructive.
CREATE TABLE IF NOT EXISTS "HomeService" (
  "id"         TEXT PRIMARY KEY,
  "title"      TEXT NOT NULL,
  "shortDesc"  TEXT,
  "icon"       TEXT,
  "image"      TEXT,
  "buttonText" TEXT,
  "buttonUrl"  TEXT NOT NULL,
  "color"      TEXT,
  "sortOrder"  INTEGER NOT NULL DEFAULT 0,
  "homepage"   BOOLEAN NOT NULL DEFAULT true,
  "visible"    BOOLEAN NOT NULL DEFAULT true,
  "published"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deletedAt"  TIMESTAMPTZ(6)
);
