import { scryptSync, randomBytes, timingSafeEqual, createHash } from "node:crypto";

/**
 * Password hashing — format: "scrypt$<saltHex>$<hashHex>", keylen 64.
 * This is the SINGLE source of truth used by BOTH the seed and the login path,
 * so they can never drift. `verifyPassword` reads the salt from the stored
 * string, so it works for the seed's deterministic-salt users and for
 * random-salt users created via register/reset alike.
 */
const KEYLEN = 64;

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, KEYLEN).toString("hex")}`;
}

/** Deterministic hash for the seed (idempotent re-runs); same format as above. */
export function deterministicHash(pw: string, seedKey: string): string {
  const salt = createHash("sha256").update(seedKey).digest().subarray(0, 16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, KEYLEN).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (expected.length === 0) return false;
  const actual = scryptSync(pw, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
