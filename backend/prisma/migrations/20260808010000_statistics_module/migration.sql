-- Phase 2.2 — Statistics CMS module. ADDITIVE (CREATE TABLE only), non-destructive.
CREATE TABLE IF NOT EXISTS "Statistic" (
  "id"        TEXT PRIMARY KEY,
  "title"     TEXT NOT NULL,
  "value"     INTEGER NOT NULL,
  "suffix"    TEXT,
  "icon"      TEXT,
  "color"     TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "visible"   BOOLEAN NOT NULL DEFAULT true,
  "homepage"  BOOLEAN NOT NULL DEFAULT true,
  "animation" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMPTZ(6)
);
