-- Raw SQL (Prisma cannot express partial indexes in-schema). See DEPLOYMENT.md.
-- Partial UNIQUE indexes: a natural key is unique only among NON-soft-deleted rows,
-- so re-registration after a soft delete does not collide.

CREATE UNIQUE INDEX "user_email_active_uq"        ON "User"("email")            WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "customer_email_active_uq"    ON "Customer"("email")        WHERE "deletedAt" IS NULL AND "email" IS NOT NULL;
CREATE UNIQUE INDEX "customer_phone_active_uq"    ON "Customer"("phone")        WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "agent_code_active_uq"        ON "Agent"("agentCode")       WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "agent_email_active_uq"       ON "Agent"("email")           WHERE "deletedAt" IS NULL AND "email" IS NOT NULL;
CREATE UNIQUE INDEX "supplier_code_active_uq"     ON "Supplier"("supplierCode") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "branch_code_active_uq"       ON "Branch"("code")           WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "package_code_active_uq"      ON "Package"("code")          WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "package_slug_active_uq"      ON "Package"("slug")          WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "promocode_code_active_uq"    ON "PromoCode"("code")        WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "booking_no_active_uq"        ON "Booking"("bookingNo")     WHERE "deletedAt" IS NULL AND "bookingNo" IS NOT NULL;
CREATE UNIQUE INDEX "invoice_no_active_uq"        ON "Invoice"("invoiceNo")     WHERE "deletedAt" IS NULL AND "invoiceNo" IS NOT NULL;
CREATE UNIQUE INDEX "cmspage_slug_active_uq"      ON "CmsPage"("slug")          WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "blogpost_slug_active_uq"     ON "BlogPost"("slug")         WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "blogcategory_slug_active_uq" ON "BlogCategory"("slug")     WHERE "deletedAt" IS NULL;

-- Blind-index lookup indexes: find a person by encrypted passport/NID via its HMAC
-- hash without decrypting. Customer NID/passport are deduped (unique); a Traveler
-- passport is NOT unique (the same person recurs across bookings).
CREATE UNIQUE INDEX "customer_nid_hash_active_uq"      ON "Customer"("nidHash")      WHERE "deletedAt" IS NULL AND "nidHash" IS NOT NULL;
CREATE UNIQUE INDEX "customer_passport_hash_active_uq" ON "Customer"("passportHash") WHERE "deletedAt" IS NULL AND "passportHash" IS NOT NULL;
CREATE UNIQUE INDEX "agent_nid_hash_active_uq"         ON "Agent"("nidHash")         WHERE "deletedAt" IS NULL AND "nidHash" IS NOT NULL;
CREATE        INDEX "traveler_passport_hash_idx"       ON "Traveler"("passportHash") WHERE "deletedAt" IS NULL AND "passportHash" IS NOT NULL;
CREATE        INDEX "user_nid_hash_idx"                ON "User"("nidHash")          WHERE "deletedAt" IS NULL AND "nidHash" IS NOT NULL;
