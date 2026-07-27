import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";

/**
 * Gapless per-(scope, branch, year) counter allocation.
 *
 * MUST be called inside an interactive transaction (`tx`). It upserts the
 * counter row, then `SELECT … FOR UPDATE` serializes concurrent allocators on
 * that row so numbers are dense and never duplicated. Because the increment
 * lives in the caller's transaction, a rollback (e.g. a failed confirm) reverts
 * the counter — the number is NOT consumed.
 */
export type SequenceScope =
  | "BOOKING" | "INVOICE" | "RECEIPT" | "JOURNAL" | "PACKAGE"
  | "PAYMENT" | "REFUND" | "EXPENSE" | "INCOME" | "BATCH";

/** Format a document number, e.g. "INV-DHK-2026-0001". */
export function formatDocNo(prefix: string, branchCode: string, year: number, seq: number): string {
  return `${prefix}-${branchCode}-${year}-${String(seq).padStart(4, "0")}`;
}

export async function allocateSequence(
  tx: Prisma.TransactionClient,
  scope: SequenceScope,
  branchId: string,
  year: number,
): Promise<number> {
  // Ensure the counter row exists (no-op if another tx already created it).
  await tx.$executeRaw`
    INSERT INTO "DocumentSequence" ("id", "scope", "branchId", "year", "lastValue")
    VALUES (${randomUUID()}, ${scope}, ${branchId}, ${year}, 0)
    ON CONFLICT ("scope", "branchId", "year") DO NOTHING`;

  // Lock the row for the remainder of this transaction, then bump it.
  const rows = await tx.$queryRaw<{ lastValue: number }[]>`
    SELECT "lastValue" FROM "DocumentSequence"
    WHERE "scope" = ${scope} AND "branchId" = ${branchId} AND "year" = ${year}
    FOR UPDATE`;
  const next = (rows[0]?.lastValue ?? 0) + 1;

  await tx.$executeRaw`
    UPDATE "DocumentSequence" SET "lastValue" = ${next}
    WHERE "scope" = ${scope} AND "branchId" = ${branchId} AND "year" = ${year}`;

  return next;
}

/** Human-readable booking number, e.g. "DHK-2026-0001" (per branch, per year). */
export function formatBookingNo(branchCode: string, year: number, seq: number): string {
  return `${branchCode}-${year}-${String(seq).padStart(4, "0")}`;
}
