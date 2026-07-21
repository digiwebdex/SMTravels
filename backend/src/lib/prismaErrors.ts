import { Prisma } from "@prisma/client";
import { HttpError } from "../middleware/errorHandler";

/**
 * Translate a Postgres/Prisma unique-violation (P2002) into a friendly 409
 * instead of a 500. Works for the raw partial UNIQUE indexes too — Prisma sets
 * `meta.target` to the index name (e.g. "customer_phone_active_uq"), so we match
 * on the column word. Re-throws anything that isn't a unique violation.
 */
/**
 * Translate the DB balance-trigger failure (SQLSTATE 23514 / check_violation,
 * raised by the deferred `journal_*_balance` constraint triggers at COMMIT) into
 * a clean 400 instead of a 500. The service pre-check should catch this first;
 * this is the backstop so the DB trigger firing never leaks a stack trace.
 */
export function mapJournalError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (/is unbalanced|has no lines|check_violation|23514/i.test(msg)) {
    throw new HttpError(400, "UnbalancedJournalEntry", {
      detail: "A posted journal entry must balance (Σdebit = Σcredit) and have at least one line.",
    });
  }
  throw err;
}

export function mapUniqueError(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = String((err.meta?.target as string | string[] | undefined) ?? "");
    if (/phone/i.test(target)) throw new HttpError(409, "DuplicatePhone", { detail: "A record with this phone number already exists." });
    if (/email/i.test(target)) throw new HttpError(409, "DuplicateEmail", { detail: "A record with this email address already exists." });
    if (/nid/i.test(target)) throw new HttpError(409, "DuplicateNID", { detail: "A record with this NID already exists." });
    if (/passport/i.test(target)) throw new HttpError(409, "DuplicatePassport", { detail: "A record with this passport number already exists." });
    throw new HttpError(409, "Duplicate", { detail: "A record with these details already exists." });
  }
  throw err;
}
