/**
 * One-time production admin bootstrap.
 *
 *   npx tsx prisma/create-admin.ts <email> [name]
 *
 * Creates (or resets) ONE SUPER_ADMIN with a cryptographically random password,
 * printed ONCE to stdout — save it immediately; it is stored only as a hash.
 * Never seeds demo credentials; safe to run with NODE_ENV=production.
 */
import { randomBytes } from "node:crypto";
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();
  const name = process.argv[3]?.trim() || "System Administrator";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("Usage: npx tsx prisma/create-admin.ts <email> [name]");
    process.exit(1);
  }

  // 24 random bytes -> base64url ≈ 32 chars: upper+lower+digits, no ambiguity.
  const password = randomBytes(24).toString("base64url");
  const passwordHash = hashPassword(password);

  // email uniqueness lives in a raw-SQL partial index (WHERE deletedAt IS NULL),
  // not the Prisma model — so no upsert-by-email; find-then-write instead.
  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null }, select: { id: true } });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { name, role: UserRole.SUPER_ADMIN, passwordHash, status: "active" },
      })
    : await prisma.user.create({
        data: { email, name, role: UserRole.SUPER_ADMIN, passwordHash, status: "active", branchId: null },
      });

  // Link the RBAC role (full access matrix comes from the structural seed).
  const role = await prisma.role.findUnique({ where: { key: UserRole.SUPER_ADMIN } });
  if (!role) throw new Error("SUPER_ADMIN role missing — run the structural seed first.");
  await prisma.userRoleLink.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    create: { userId: user.id, roleId: role.id },
    update: {},
  });

  console.log("──────────────────────────────────────────────────");
  console.log("SUPER_ADMIN ready:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log("Shown ONCE — save it now. Only the hash is stored.");
  console.log("──────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("[create-admin] failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
