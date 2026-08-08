-- Phase 2.2D — Homepage Section Manager + JSON renderer foundation. ADDITIVE only, non-destructive.
CREATE TABLE IF NOT EXISTS "HomeSection" (
  "id"         TEXT PRIMARY KEY,
  "key"        TEXT NOT NULL,
  "type"       TEXT NOT NULL,
  "eyebrow"    TEXT,
  "eyebrowBn"  TEXT,
  "title"      TEXT,
  "titleBn"    TEXT,
  "subtitle"   TEXT,
  "subtitleBn" TEXT,
  "config"     JSONB,
  "sortOrder"  INTEGER NOT NULL DEFAULT 0,
  "visible"    BOOLEAN NOT NULL DEFAULT true,
  "published"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deletedAt"  TIMESTAMPTZ(6)
);
CREATE UNIQUE INDEX IF NOT EXISTS "HomeSection_key_key" ON "HomeSection"("key");
