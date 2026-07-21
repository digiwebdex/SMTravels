import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, resolveBranchId, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { mapJournalError } from "../lib/prismaErrors";
import { allocateSequence, formatDocNo } from "../lib/sequence";
import type {
  JournalCreateInput, JournalListQuery, JournalListItem, JournalListResponse, JournalDetail,
} from "../contracts/finance.contract";

// Branch-scoped IMMUTABLE ledger: create + post + reverse only. No update/delete.
type Tx = Prisma.TransactionClient;
const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const num = (v: Prisma.Decimal | number | null | undefined): number => (v == null ? 0 : typeof v === "number" ? v : Number(v));
const round4 = (n: number): number => Math.round((n + Number.EPSILON) * 10000) / 10000;
function toDate(s: string): Date {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s;
  return new Date(iso);
}

/** Service-layer balance pre-check (friendly 400). The DB trigger is the backstop. */
function checkBalanced(lines: JournalCreateInput["lines"]): { debit: number; credit: number } {
  let debit = 0, credit = 0;
  for (const l of lines) {
    const d = l.debit ?? 0, c = l.credit ?? 0;
    if (d > 0 && c > 0) throw new HttpError(400, "InvalidJournalLine", { detail: "A line cannot have both a debit and a credit." });
    if (d === 0 && c === 0) throw new HttpError(400, "InvalidJournalLine", { detail: "Each line needs a debit or a credit amount." });
    debit += d; credit += c;
  }
  if (round4(debit) !== round4(credit)) {
    throw new HttpError(400, "UnbalancedJournalEntry", { detail: `Entry is unbalanced: debit ${round4(debit)} ≠ credit ${round4(credit)}.` });
  }
  return { debit: round4(debit), credit: round4(credit) };
}

// JournalEntry has no `branch` relation in the schema — resolve names separately.
async function branchNameMap(ids: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(ids)];
  if (!uniq.length) return new Map();
  const rows = await prisma.branch.findMany({ where: { id: { in: uniq } }, select: { id: true, name: true } });
  return new Map(rows.map((b) => [b.id, b.name]));
}

type EntryRow = Prisma.JournalEntryGetPayload<{ include: { lines: true } }>;
function toListItem(e: EntryRow, branchName: string | null): JournalListItem {
  const totalDebit = e.lines.reduce((s, l) => s + num(l.debit), 0);
  const totalCredit = e.lines.reduce((s, l) => s + num(l.credit), 0);
  return {
    id: e.id, ref: e.ref, fiscalYear: e.fiscalYear, branchId: e.branchId, branchName, date: dOnly(e.date)!,
    description: e.description, currency: e.currency as JournalListItem["currency"], status: e.status,
    totalDebit: round4(totalDebit), totalCredit: round4(totalCredit),
    isReversed: e.isReversed, reversalOfId: e.reversalOfId, reversedById: e.reversedById, postedAt: dIso(e.postedAt), createdAt: dIso(e.createdAt)!,
  };
}

export async function listJournal(auth: AuthCtx, q: JournalListQuery): Promise<JournalListResponse> {
  const where: Prisma.JournalEntryWhereInput = { ...branchWhere(auth) };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.status) where.status = q.status;
  if (q.dateFrom || q.dateTo) {
    where.date = {};
    if (q.dateFrom) (where.date as Prisma.DateTimeFilter).gte = toDate(q.dateFrom);
    if (q.dateTo) (where.date as Prisma.DateTimeFilter).lte = toDate(q.dateTo);
  }
  if (q.q) where.OR = [{ ref: { contains: q.q, mode: "insensitive" } }, { description: { contains: q.q, mode: "insensitive" } }];
  // Stable ordering: a secondary createdAt tiebreaker so same-date entries have a
  // deterministic order and the most-recently-created entry surfaces first.
  const orderBy: Prisma.JournalEntryOrderByWithRelationInput[] =
    q.sort === "ref" ? [{ ref: q.dir }] : [{ date: q.dir }, { createdAt: q.dir }];

  const [rows, total, grouped] = await Promise.all([
    prisma.journalEntry.findMany({ where, include: { lines: true }, orderBy, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.journalEntry.count({ where }),
    prisma.journalEntry.groupBy({ by: ["status"], where, _count: { _all: true } }),
  ]);
  const bmap = await branchNameMap(rows.map((r) => r.branchId));
  let posted = 0, drafts = 0;
  for (const g of grouped) { if (g.status === "POSTED") posted = g._count._all; if (g.status === "DRAFT") drafts = g._count._all; }
  return { data: rows.map((r) => toListItem(r, bmap.get(r.branchId) ?? null)), page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)), stats: { total, posted, drafts } };
}

export async function getJournal(auth: AuthCtx, id: string): Promise<JournalDetail> {
  const e = await prisma.journalEntry.findFirst({
    where: { id, ...branchWhere(auth) },
    include: { lines: { include: { account: { select: { code: true, name: true } } } } },
  });
  if (!e) throw new HttpError(404, "NotFound");
  const branchName = (await branchNameMap([e.branchId])).get(e.branchId) ?? null;
  return {
    ...toListItem(e as unknown as EntryRow, branchName),
    relatedType: e.relatedType, relatedId: e.relatedId,
    lines: e.lines.map((l) => ({ id: l.id, accountId: l.accountId, accountCode: l.account.code, accountName: l.account.name, debit: num(l.debit), credit: num(l.credit), narration: l.narration })),
  };
}

async function insertLines(tx: Tx, entryId: string, lines: JournalCreateInput["lines"]): Promise<void> {
  for (const l of lines) {
    await tx.journalLine.create({ data: { entryId, accountId: l.accountId, debit: l.debit ?? 0, credit: l.credit ?? 0, narration: l.narration } });
  }
}

export async function createJournal(auth: AuthCtx, input: JournalCreateInput): Promise<JournalDetail> {
  const branchId = resolveBranchId(auth, input.branchId);
  const posting = (input.status ?? "DRAFT") === "POSTED";
  if (posting) checkBalanced(input.lines); // friendly pre-check before we touch the DB

  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } });
  const year = toDate(input.date).getUTCFullYear();

  let id: string;
  try {
    id = await prisma.$transaction(async (tx) => {
      const seq = await allocateSequence(tx, "JOURNAL", branchId, year); // gapless ref, inside the tx
      const entry = await tx.journalEntry.create({
        data: {
          ref: formatDocNo("JV", branch.code, year, seq), fiscalYear: year, branchId, date: toDate(input.date),
          description: input.description, currency: input.currency ?? "BDT", status: posting ? "POSTED" : "DRAFT",
          relatedType: input.relatedType, relatedId: input.relatedId,
          postedById: posting ? auth.userId : null, postedAt: posting ? new Date() : null,
        },
      });
      await insertLines(tx, entry.id, input.lines);
      await tx.activityLog.create({ data: { userId: auth.userId, action: posting ? "JOURNAL_POSTED" : "JOURNAL_CREATED", target: entry.id, module: "accounts" } });
      return entry.id;
      // if POSTED and (somehow) unbalanced, the DEFERRED trigger rejects at COMMIT → mapJournalError
    });
  } catch (err) { mapJournalError(err); }
  return getJournal(auth, id!);
}

/** DRAFT → POSTED. Pre-check balance; the DB trigger backstops at commit. */
export async function postJournal(auth: AuthCtx, id: string): Promise<JournalDetail> {
  const e = await prisma.journalEntry.findFirst({ where: { id, ...branchWhere(auth) }, include: { lines: true } });
  if (!e) throw new HttpError(404, "NotFound");
  if (e.status === "POSTED") throw new HttpError(409, "AlreadyPosted");
  checkBalanced(e.lines.map((l) => ({ accountId: l.accountId, debit: num(l.debit), credit: num(l.credit) })));
  try {
    await prisma.$transaction(async (tx) => {
      await tx.journalEntry.update({ where: { id }, data: { status: "POSTED", postedById: auth.userId, postedAt: new Date() } });
      await tx.activityLog.create({ data: { userId: auth.userId, action: "JOURNAL_POSTED", target: id, module: "accounts" } });
    });
  } catch (err) { mapJournalError(err); }
  return getJournal(auth, id);
}

/**
 * Reverse a POSTED entry: create a mirror entry (debit↔credit swapped, POSTED),
 * link it via reversalOfId, and flag the original isReversed/reversedById. Net
 * ledger effect is zero. The original is NEVER updated in value or deleted.
 */
export async function reverseJournal(auth: AuthCtx, id: string): Promise<JournalDetail> {
  const original = await prisma.journalEntry.findFirst({ where: { id, ...branchWhere(auth) }, include: { lines: true } });
  if (!original) throw new HttpError(404, "NotFound");
  if (original.status !== "POSTED") throw new HttpError(409, "NotPosted", { detail: "Only a posted entry can be reversed." });
  if (original.isReversed) throw new HttpError(409, "AlreadyReversed", { detail: `Already reversed by entry ${original.reversedById}.` });

  const year = original.fiscalYear;
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: original.branchId }, select: { code: true } });
  let mirrorId: string;
  try {
    mirrorId = await prisma.$transaction(async (tx) => {
      const seq = await allocateSequence(tx, "JOURNAL", original.branchId, year);
      const mirror = await tx.journalEntry.create({
        data: {
          ref: formatDocNo("JV", branch.code, year, seq), fiscalYear: year, branchId: original.branchId,
          date: new Date(), description: `Reversal of ${original.ref}`, currency: original.currency, status: "POSTED",
          relatedType: "REVERSAL", relatedId: original.id, reversalOfId: original.id, postedById: auth.userId, postedAt: new Date(),
        },
      });
      // swap debit ↔ credit
      for (const l of original.lines) {
        await tx.journalLine.create({ data: { entryId: mirror.id, accountId: l.accountId, debit: num(l.credit), credit: num(l.debit), narration: `Reversal: ${l.narration ?? ""}`.trim() } });
      }
      await tx.journalEntry.update({ where: { id: original.id }, data: { isReversed: true, reversedById: mirror.id } });
      await tx.activityLog.create({ data: { userId: auth.userId, action: "JOURNAL_REVERSED", target: original.id, module: "accounts" } });
      return mirror.id;
    });
  } catch (err) { mapJournalError(err); }
  return getJournal(auth, mirrorId!);
}
