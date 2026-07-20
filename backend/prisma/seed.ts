/**
 * Prisma seed. No models yet, so there is nothing to seed.
 * Run with: npm run prisma:seed
 */
async function main(): Promise<void> {
  console.log("[seed] no models yet — nothing to seed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
