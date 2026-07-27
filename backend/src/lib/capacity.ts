import type { Prisma } from "@prisma/client";
import { HttpError } from "../middleware/errorHandler";

/**
 * Concurrency-safe capacity reservation for Hajj/Umrah group-departure seats and
 * government quota slots.
 *
 * Each reserve takes a `SELECT … FOR UPDATE` row lock on the batch/quota row, so
 * concurrent confirms competing for the SAME batch/quota serialize: a second
 * waiter blocks until the first commits, then reads the ALREADY-incremented
 * counter, sees no room left, and is rejected — two staff can never both claim
 * the last seat/slot. The DB CHECK constraints (`filled <= allotted`,
 * `filledSeats <= totalSeats`) are the final backstop for any path that bypasses
 * this helper.
 *
 * MUST be called inside the caller's interactive transaction: the lock is held
 * to commit, and a rollback (e.g. a failed confirm) frees the reservation.
 * Same discipline as the gapless sequence allocator (lib/sequence.ts).
 */
type Tx = Prisma.TransactionClient;

export async function reserveBatchSeat(tx: Tx, batchId: string, seats: number): Promise<void> {
  if (seats <= 0) return;
  const rows = await tx.$queryRaw<{ totalSeats: number; filledSeats: number; status: string }[]>`
    SELECT "totalSeats", "filledSeats", "status"
    FROM "DepartureBatch"
    WHERE "id" = ${batchId} AND "deletedAt" IS NULL
    FOR UPDATE`;
  const b = rows[0];
  if (!b) throw new HttpError(404, "BatchNotFound", { detail: "Departure batch not found" });
  if (b.status !== "OPEN") throw new HttpError(409, "BatchClosed", { detail: `This batch is ${b.status.toLowerCase()} and cannot take more seats` });
  const remaining = b.totalSeats - b.filledSeats;
  if (seats > remaining) throw new HttpError(409, "BatchFull", { detail: `Only ${remaining} seat(s) left in this batch (needed ${seats})` });
  await tx.$executeRaw`UPDATE "DepartureBatch" SET "filledSeats" = "filledSeats" + ${seats}, "updatedAt" = now() WHERE "id" = ${batchId}`;
}

export async function releaseBatchSeat(tx: Tx, batchId: string, seats: number): Promise<void> {
  if (seats <= 0) return;
  await tx.$executeRaw`UPDATE "DepartureBatch" SET "filledSeats" = GREATEST(0, "filledSeats" - ${seats}), "updatedAt" = now() WHERE "id" = ${batchId} AND "deletedAt" IS NULL`;
}

export async function reserveQuotaSlot(tx: Tx, quotaId: string, slots: number): Promise<void> {
  if (slots <= 0) return;
  const rows = await tx.$queryRaw<{ allotted: number; filled: number }[]>`
    SELECT "allotted", "filled"
    FROM "HajjQuota"
    WHERE "id" = ${quotaId} AND "deletedAt" IS NULL
    FOR UPDATE`;
  const q = rows[0];
  if (!q) throw new HttpError(404, "QuotaNotFound", { detail: "Quota not found" });
  const remaining = q.allotted - q.filled;
  if (slots > remaining) throw new HttpError(409, "QuotaExceeded", { detail: `Only ${remaining} quota slot(s) left (needed ${slots})` });
  await tx.$executeRaw`UPDATE "HajjQuota" SET "filled" = "filled" + ${slots}, "updatedAt" = now() WHERE "id" = ${quotaId}`;
}

export async function releaseQuotaSlot(tx: Tx, quotaId: string, slots: number): Promise<void> {
  if (slots <= 0) return;
  await tx.$executeRaw`UPDATE "HajjQuota" SET "filled" = GREATEST(0, "filled" - ${slots}), "updatedAt" = now() WHERE "id" = ${quotaId} AND "deletedAt" IS NULL`;
}
