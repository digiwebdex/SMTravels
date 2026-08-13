-- Website content store (additive) — keyed JSON blobs edited by the CMS and read
-- by the public marketing site. No FKs, no impact on existing tables.
CREATE TABLE IF NOT EXISTS "site_content" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "site_content_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "site_content_key_key" ON "site_content"("key");
