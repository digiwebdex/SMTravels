/**
 * Sales (Quotations → Sales Orders) service.
 *
 * A quotation is a DRAFT offer — creating/editing one writes ONLY Quotation +
 * QuotationLine rows. It never touches Invoice / Payment / Journal / ledger.
 * Conversion (ACCEPTED → CONVERTED) creates a DRAFT Booking through the existing
 * revenue flow in ONE transaction — NO bookingNo, NO seat/quota reserved (those
 * happen only at the existing confirm step). A lead-based quote converts the lead
 * → customer in the SAME transaction, so a later failure rolls back BOTH (no
 * orphaned customer). Discounts reuse the existing PromoCode master.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { allocateSequence, formatDocNo } from "../lib/sequence";
import { money, type CurrencyCode } from "../lib/money";
import { convertLeadTx } from "./lead.service";
import type {
  QuotationListQuery, QuotationCreateInput, QuotationUpdateInput, QuotationLineInput,
  QuotationListItem, QuotationListResponse, QuotationDetail, QuotationLineDto, ConvertResult,
} from "../contracts/sales.contract";

const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : Number(d));
const round4 = (n: number) => Math.round((n + Number.EPSILON) * 10000) / 10000;
const round2 = (n: number) => Math.round(n * 100) / 100;
const dIso = (d: Date | null): string => (d ? d.toISOString() : "");
const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const toDate = (s?: string): Date | null => (s ? new Date(s) : null);

let branchNameCache: Map<string, string> | null = null;
async function branchNames(): Promise<Map<string, string>> {
  if (!branchNameCache) {
    const rows = await prisma.branch.findMany({ select: { id: true, name: true } });
    branchNameCache = new Map(rows.map((b) => [b.id, b.name]));
  }
  return branchNameCache;
}

/** Compute the money invariant for a quotation from its lines + discount source. */
async function computeMoney(lines: QuotationLineInput[], opts: { currency: string; exchangeRate?: number; promoCodeId?: string; discountAmount?: number }) {
  const computedLines = lines.map((l) => ({ ...l, amount: round4((l.quantity ?? 1) * l.unitPrice) }));
  const subtotal = round4(computedLines.reduce((a, l) => a + l.amount, 0));

  let discountAmount = 0;
  let promoCodeId: string | null = null;
  if (opts.promoCodeId) {
    const promo = await prisma.promoCode.findFirst({ where: { id: opts.promoCodeId, deletedAt: null } });
    if (!promo) throw new HttpError(400, "InvalidPromoCode", { detail: "Promo code not found" });
    if (promo.status !== "ACTIVE") throw new HttpError(400, "PromoInactive", { detail: "Promo code is not active" });
    if (promo.expiresAt && promo.expiresAt < new Date()) throw new HttpError(400, "PromoExpired");
    discountAmount = promo.type === "PERCENT" ? round4(subtotal * (num(promo.value) / 100)) : num(promo.value);
    promoCodeId = promo.id;
  } else if (opts.discountAmount) {
    discountAmount = opts.discountAmount;
  }
  discountAmount = Math.min(round4(discountAmount), subtotal); // never exceed subtotal
  const total = round4(subtotal - discountAmount);
  const m = money(total, opts.currency as CurrencyCode, opts.exchangeRate);
  return { computedLines, subtotal, discountAmount, promoCodeId, ...m }; // m: {amount(total), currency, exchangeRate, baseAmount}
}

async function resolveRecipients(customerIds: string[], leadIds: string[]) {
  const [customers, leads] = await Promise.all([
    customerIds.length ? prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
    leadIds.length ? prisma.lead.findMany({ where: { id: { in: leadIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  return { cust: new Map(customers.map((c) => [c.id, c.name])), lead: new Map(leads.map((l) => [l.id, l.name])) };
}

type QuoteRow = Prisma.QuotationGetPayload<{ include: { lines: true } }>;
function toDto(q: QuoteRow, names: Map<string, string>, recips: { cust: Map<string, string>; lead: Map<string, string> }, promoCode?: string | null): QuotationDetail {
  const recipientName = q.customerId ? recips.cust.get(q.customerId) ?? null : q.leadId ? recips.lead.get(q.leadId) ?? null : null;
  return {
    id: q.id, quoteNo: q.quoteNo, branchId: q.branchId, branchName: names.get(q.branchId) ?? null,
    customerId: q.customerId, leadId: q.leadId, recipientName,
    recipientType: q.customerId ? "customer" : q.leadId ? "lead" : null,
    serviceType: q.serviceType, status: q.status, validUntil: dOnly(q.validUntil),
    subtotal: num(q.subtotal), discountAmount: num(q.discountAmount), total: num(q.total),
    currency: q.currency, exchangeRate: num(q.exchangeRate), baseAmount: num(q.baseAmount),
    linesCount: q.lines.length, bookingId: q.bookingId, createdAt: dIso(q.createdAt),
    promoCodeId: q.promoCodeId, promoCode: promoCode ?? null, notes: q.notes,
    lines: q.lines.map((l): QuotationLineDto => ({ id: l.id, description: l.description, serviceType: l.serviceType, quantity: l.quantity, unitPrice: num(l.unitPrice), amount: num(l.amount) })),
  };
}

export async function listQuotations(auth: AuthCtx, q: QuotationListQuery): Promise<QuotationListResponse> {
  const where: Prisma.QuotationWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (q.branchId && q.branchId !== "all" && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.status) where.status = q.status as never;
  if (q.serviceType) where.serviceType = q.serviceType as never;
  if (q.q) where.OR = [{ quoteNo: { contains: q.q, mode: "insensitive" } }, { notes: { contains: q.q, mode: "insensitive" } }];

  const rows = await prisma.quotation.findMany({ where, include: { lines: true }, orderBy: { createdAt: "desc" } });
  const names = await branchNames();
  const recips = await resolveRecipients(
    rows.filter((r) => r.customerId).map((r) => r.customerId!),
    rows.filter((r) => r.leadId).map((r) => r.leadId!),
  );
  const data: QuotationListItem[] = rows.map((r) => toDto(r, names, recips));

  const byStatus: Record<string, number> = {};
  for (const r of data) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  return { data, stats: { total: data.length, byStatus, totalValue: round2(data.reduce((a, r) => a + r.baseAmount, 0)) } };
}

export async function getQuotation(auth: AuthCtx, id: string): Promise<QuotationDetail> {
  const q = await prisma.quotation.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, include: { lines: true } });
  if (!q) throw new HttpError(404, "NotFound");
  const names = await branchNames();
  const recips = await resolveRecipients(q.customerId ? [q.customerId] : [], q.leadId ? [q.leadId] : []);
  const promo = q.promoCodeId ? await prisma.promoCode.findUnique({ where: { id: q.promoCodeId }, select: { code: true } }) : null;
  return toDto(q, names, recips, promo?.code ?? null);
}

/** A quotation belongs to its recipient's branch. Global roles inherit that
 *  branch; scoped roles may only quote a recipient in their own branch. */
async function resolveQuoteBranch(auth: AuthCtx, input: QuotationCreateInput): Promise<string> {
  let recipBranch: string | null = null;
  if (input.customerId) recipBranch = (await prisma.customer.findFirst({ where: { id: input.customerId, deletedAt: null }, select: { branchId: true } }))?.branchId ?? null;
  else if (input.leadId) recipBranch = (await prisma.lead.findFirst({ where: { id: input.leadId, deletedAt: null }, select: { branchId: true } }))?.branchId ?? null;
  if (!recipBranch) throw new HttpError(400, "RecipientNotFound", { detail: "Customer or lead not found" });
  if (isGlobalRole(auth.role)) return recipBranch;
  const own = auth.branchId ?? "__no_branch__";
  if (recipBranch !== own) throw new HttpError(403, "CrossBranch", { detail: "Recipient belongs to another branch" });
  return own;
}

export async function createQuotation(auth: AuthCtx, input: QuotationCreateInput): Promise<QuotationDetail> {
  const branchId = await resolveQuoteBranch(auth, input);
  const br = (await prisma.branch.findUnique({ where: { id: branchId }, select: { code: true } }));
  if (!br) throw new HttpError(400, "BranchRequired");
  const m = await computeMoney(input.lines, { currency: input.currency, exchangeRate: input.exchangeRate, promoCodeId: input.promoCodeId, discountAmount: input.discountAmount });
  const year = new Date().getUTCFullYear();

  const id = await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "QUOTE", branchId, year);
    const quote = await tx.quotation.create({
      data: {
        quoteNo: formatDocNo("QUO", br.code, year, seq), branchId,
        customerId: input.customerId ?? null, leadId: input.customerId ? null : (input.leadId ?? null),
        serviceType: input.serviceType as never, status: "DRAFT", validUntil: toDate(input.validUntil),
        subtotal: m.subtotal, discountAmount: m.discountAmount, total: m.amount,
        currency: m.currency, exchangeRate: m.exchangeRate, baseAmount: m.baseAmount,
        promoCodeId: m.promoCodeId, notes: input.notes ?? null, createdById: auth.userId,
        lines: { create: m.computedLines.map((l) => ({ description: l.description, serviceType: (l.serviceType as never) ?? null, quantity: l.quantity ?? 1, unitPrice: l.unitPrice, amount: l.amount })) },
      },
    });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "QUOTATION_CREATED", target: quote.id, module: "sales" } });
    return quote.id;
  });
  return getQuotation(auth, id);
}

export async function updateQuotation(auth: AuthCtx, id: string, input: QuotationUpdateInput): Promise<QuotationDetail> {
  const existing = await prisma.quotation.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  if (existing.status === "CONVERTED") throw new HttpError(409, "QuotationLocked", { detail: "A converted quotation cannot be edited" });
  if (input.status === "CONVERTED") throw new HttpError(400, "UseConvert", { detail: "Convert via the conversion endpoint, not a status edit" });

  await prisma.$transaction(async (tx) => {
    const data: Prisma.QuotationUpdateInput = {};
    if (input.serviceType) data.serviceType = input.serviceType as never;
    if (input.validUntil !== undefined) data.validUntil = toDate(input.validUntil);
    if (input.notes !== undefined) data.notes = input.notes ?? null;
    if (input.status) data.status = input.status as never;

    // recompute money if lines / discount / currency changed
    const needsMoney = input.lines || input.promoCodeId !== undefined || input.discountAmount !== undefined || input.currency || input.exchangeRate !== undefined;
    if (needsMoney) {
      const lines = input.lines ?? (await tx.quotationLine.findMany({ where: { quotationId: id }, orderBy: { createdAt: "asc" } })).map((l) => ({ description: l.description, serviceType: (l.serviceType as never) ?? undefined, quantity: l.quantity, unitPrice: num(l.unitPrice) }));
      const promoId = input.promoCodeId === "" ? undefined : (input.promoCodeId ?? existing.promoCodeId ?? undefined);
      const m = await computeMoney(lines, { currency: input.currency ?? existing.currency, exchangeRate: input.exchangeRate ?? num(existing.exchangeRate), promoCodeId: promoId, discountAmount: input.discountAmount ?? num(existing.discountAmount) });
      data.subtotal = m.subtotal; data.discountAmount = m.discountAmount; data.total = m.amount;
      data.currency = m.currency as never; data.exchangeRate = m.exchangeRate; data.baseAmount = m.baseAmount;
      data.promoCodeId = m.promoCodeId;
      if (input.lines) {
        await tx.quotationLine.deleteMany({ where: { quotationId: id } });
        await tx.quotationLine.createMany({ data: m.computedLines.map((l) => ({ quotationId: id, description: l.description, serviceType: (l.serviceType as never) ?? null, quantity: l.quantity ?? 1, unitPrice: l.unitPrice, amount: l.amount })) });
      }
    }
    await tx.quotation.update({ where: { id }, data });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "QUOTATION_UPDATED", target: id, module: "sales" } });
  });
  return getQuotation(auth, id);
}

/**
 * Convert an ACCEPTED quotation → DRAFT Booking, atomically.
 *   - lead-based: convertLeadTx (lead → customer) FIRST, in this same tx;
 *   - then a DRAFT booking (no bookingNo, no seat/quota reserved);
 *   - then mark the quote CONVERTED + link the booking.
 * If ANY step throws (e.g. the booking insert after a lead conversion), the whole
 * transaction rolls back — the lead stays a lead, no orphaned customer, quote
 * stays ACCEPTED.
 */
export async function convertQuotation(auth: AuthCtx, id: string): Promise<ConvertResult> {
  const quote = await prisma.quotation.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!quote) throw new HttpError(404, "NotFound");
  if (quote.status === "CONVERTED" || quote.bookingId) throw new HttpError(409, "AlreadyConverted", { detail: `Quotation already converted to booking ${quote.bookingId}` });
  if (quote.status !== "ACCEPTED") throw new HttpError(409, "NotAccepted", { detail: "Only an ACCEPTED quotation can be converted" });
  if (!quote.customerId && !quote.leadId) throw new HttpError(400, "NoRecipient");

  return prisma.$transaction(async (tx) => {
    let customerId = quote.customerId;
    let convertedLead = false;
    if (!customerId) {
      const lead = await tx.lead.findFirst({ where: { id: quote.leadId!, deletedAt: null } });
      if (!lead) throw new HttpError(400, "LeadNotFound");
      if (lead.customerId) customerId = lead.customerId; // already a customer → reuse
      else { customerId = await convertLeadTx(tx, auth, lead); convertedLead = true; }
    }
    // DRAFT booking — the existing revenue entry. No bookingNo / seat / quota here.
    const booking = await tx.booking.create({
      data: {
        branchId: quote.branchId, serviceType: quote.serviceType, status: "DRAFT", customerId,
        amount: quote.total, currency: quote.currency, exchangeRate: quote.exchangeRate, baseAmount: quote.baseAmount,
        discountType: quote.promoCodeId ? "PROMO" : (num(quote.discountAmount) > 0 ? "MANUAL" : null),
        discountValue: num(quote.discountAmount) > 0 ? quote.discountAmount : null,
        travelersCount: 1, source: "QUOTATION", notes: quote.notes, createdById: auth.userId,
      },
    });
    await tx.quotation.update({ where: { id }, data: { status: "CONVERTED", bookingId: booking.id } });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "QUOTATION_CONVERTED", target: booking.id, module: "sales" } });
    return { quotationId: id, bookingId: booking.id, customerId: customerId!, convertedLead };
  });
}

export async function deleteQuotation(auth: AuthCtx, id: string): Promise<{ ok: true }> {
  const existing = await prisma.quotation.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { status: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  if (existing.status === "CONVERTED") throw new HttpError(409, "QuotationLocked", { detail: "A converted quotation cannot be deleted" });
  await prisma.quotation.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "QUOTATION_DELETED", target: id, module: "sales" } });
  return { ok: true };
}
