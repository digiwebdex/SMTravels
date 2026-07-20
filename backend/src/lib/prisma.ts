import { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { withPiiEncryption } from "./pii";

/**
 * Single PrismaClient for the process, wrapped with transparent PII encryption.
 * Importing this module FAILS LOUDLY (via ./pii) if the PII KEK is not configured.
 * Lazy — no DB connection is opened until the first query.
 */
const base = new PrismaClient({
  log: env.NODE_ENV === "production" ? ["warn", "error"] : ["warn", "error"],
});

export const prisma = withPiiEncryption(base);
