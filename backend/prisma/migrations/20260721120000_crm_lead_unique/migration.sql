-- Raw SQL (Prisma cannot express partial indexes in-schema). See DEPLOYMENT.md.
-- A lead's phone is unique among NON-soft-deleted leads WITHIN a branch, so the
-- same prospect can't be entered twice in one branch. Different branches may
-- independently track the same phone; a soft-deleted lead frees the number.
CREATE UNIQUE INDEX "lead_branch_phone_active_uq" ON "Lead"("branchId", "phone") WHERE "deletedAt" IS NULL;
