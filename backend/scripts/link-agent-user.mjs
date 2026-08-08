/** Link Agent.userId + ensure wallet. Usage: node scripts/link-agent-user.mjs <agentId> <userId> */
import { PrismaClient } from "@prisma/client";

const agentId = process.argv[2];
const userId = process.argv[3];
if (!agentId || !userId) {
  console.error("Usage: node scripts/link-agent-user.mjs <agentId> <userId>");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  await prisma.agent.update({ where: { id: agentId }, data: { userId } });
  await prisma.agentWallet.upsert({
    where: { agentId },
    create: { agentId, balance: 0, currency: "BDT" },
    update: {},
  });
  console.log("linked", agentId, "→", userId);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
