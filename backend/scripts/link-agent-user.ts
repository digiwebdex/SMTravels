/** Link Agent.userId + ensure wallet. Usage: npx tsx scripts/link-agent-user.ts <agentId> <userId> */
import { PrismaClient } from "@prisma/client";

const agentId = process.argv[2];
const userId = process.argv[3];
if (!agentId || !userId) {
  console.error("Usage: npx tsx scripts/link-agent-user.ts <agentId> <userId>");
  process.exit(1);
}

const prisma = new PrismaClient();
async function main() {
  await prisma.agent.update({ where: { id: agentId }, data: { userId } });
  await prisma.agentWallet.upsert({
    where: { agentId },
    create: { agentId, balance: 0, currency: "BDT" },
    update: {},
  });
  console.log("linked", agentId, "→", userId);
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
