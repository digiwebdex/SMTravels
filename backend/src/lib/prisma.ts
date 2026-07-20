import { PrismaClient } from "@prisma/client";
import { env } from "./env";

/**
 * Single PrismaClient for the process. Lazy — it does not open a connection
 * until the first query, so importing this is safe even without a DB.
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === "production" ? ["warn", "error"] : ["warn", "error"],
});
