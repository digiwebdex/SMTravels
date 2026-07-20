import { createCipheriv, createDecipheriv, randomBytes, createHmac } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

/**
 * PII encryption at rest (AES-256-GCM) + HMAC blind index for exact-match lookup.
 *
 * Keys come from env and this module FAILS LOUDLY at import if they're missing —
 * an app that boots with no key and silently writes plaintext into "encrypted"
 * columns is worse than no encryption.
 *
 *   PII_KEK_CURRENT_ID  the active key version (int)
 *   PII_KEK_<id>        base64 32-byte AES key for that version (e.g. PII_KEK_1)
 *   PII_INDEX_KEY       base64 key for the deterministic blind index (HMAC-SHA256)
 *
 * Rotation plan: add PII_KEK_2 and bump PII_KEK_CURRENT_ID=2. New writes use v2;
 * old rows still decrypt via the keyId embedded in their ciphertext (and the
 * `piiKeyId` column). A re-encrypt job walks rows WHERE piiKeyId < current,
 * decrypts with the old key, and re-writes with the current key.
 */
function loadKeys() {
  const currentId = Number(process.env.PII_KEK_CURRENT_ID);
  const keys = new Map<number, Buffer>();
  for (const [name, val] of Object.entries(process.env)) {
    const m = /^PII_KEK_(\d+)$/.exec(name);
    if (m && val) keys.set(Number(m[1]), Buffer.from(val, "base64"));
  }
  const current = keys.get(currentId);
  if (!currentId || !current || current.length !== 32) {
    throw new Error(
      "FATAL: PII encryption not configured. Set PII_KEK_CURRENT_ID and PII_KEK_<id> " +
        "(base64, 32 bytes). Refusing to start — will not write plaintext PII.",
    );
  }
  const indexRaw = process.env.PII_INDEX_KEY;
  if (!indexRaw) {
    throw new Error("FATAL: PII_INDEX_KEY (base64) is required for the blind index. Refusing to start.");
  }
  return { currentId, keys, indexKey: Buffer.from(indexRaw, "base64") };
}

const CFG = loadKeys(); // throws at import time if misconfigured

export const PII_KEY_ID = CFG.currentId;

/** ciphertext format: "<keyId>:<iv b64>:<tag b64>:<ct b64>" */
export function encryptPII(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", CFG.keys.get(CFG.currentId)!, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${CFG.currentId}:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptPII(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4) return payload; // not our format (e.g. legacy plaintext) — return as-is
  const [idStr, ivB64, tagB64, ctB64] = parts;
  const key = CFG.keys.get(Number(idStr));
  if (!key) throw new Error(`No PII key for version ${idStr}`);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}

/** deterministic, non-reversible index for exact-match lookup by encrypted value */
export function blindIndex(plain: string): string {
  return createHmac("sha256", CFG.indexKey).update(plain.trim()).digest("hex");
}

// ─── Which columns are encrypted, and their companion blind-index column ─────
const PII_FIELDS: Record<string, { enc: string; hash?: string }[]> = {
  Customer: [
    { enc: "nid", hash: "nidHash" },
    { enc: "passportNo", hash: "passportHash" },
  ],
  Traveler: [{ enc: "passportNo", hash: "passportHash" }],
  Agent: [{ enc: "nid", hash: "nidHash" }],
  User: [{ enc: "nid", hash: "nidHash" }],
  Document: [{ enc: "ocrPassportNo", hash: "ocrPassportHash" }],
};

type AnyData = Record<string, unknown>;

function sealInto(data: AnyData, fields: { enc: string; hash?: string }[]) {
  let touched = false;
  for (const f of fields) {
    const v = data[f.enc];
    if (typeof v === "string" && v.length > 0 && v.split(":").length !== 4) {
      data[f.enc] = encryptPII(v);
      if (f.hash) data[f.hash] = blindIndex(v);
      touched = true;
    }
  }
  if (touched) data.piiKeyId = PII_KEY_ID;
}

function openRow(row: AnyData, fields: { enc: string; hash?: string }[]) {
  for (const f of fields) {
    const v = row[f.enc];
    if (typeof v === "string" && v.split(":").length === 4) {
      try {
        row[f.enc] = decryptPII(v);
      } catch {
        /* leave as-is if it can't be decrypted */
      }
    }
  }
}

/** Wraps a PrismaClient so registered PII fields are encrypted on write and
 *  decrypted on read transparently. */
export function withPiiEncryption<T extends PrismaClient>(client: T) {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const fields = PII_FIELDS[model];
          const a = args as AnyData;
          if (fields) {
            if ((operation === "create" || operation === "update") && a.data) {
              sealInto(a.data as AnyData, fields);
            } else if (operation === "upsert") {
              if (a.create) sealInto(a.create as AnyData, fields);
              if (a.update) sealInto(a.update as AnyData, fields);
            }
          }
          const result = await query(args);
          if (fields && result && typeof result === "object") {
            if (Array.isArray(result)) result.forEach((r) => openRow(r as AnyData, fields));
            else openRow(result as AnyData, fields);
          }
          return result;
        },
      },
    },
  }) as unknown as T;
}
