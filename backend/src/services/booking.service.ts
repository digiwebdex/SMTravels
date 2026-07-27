import { Prisma, type ServiceType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { money, type CurrencyCode } from "../lib/money";
import { allocateSequence, formatBookingNo } from "../lib/sequence";
import { reserveBatchSeat, reserveQuotaSlot, releaseBatchSeat, releaseQuotaSlot } from "../lib/capacity";
import { notifyBookingConfirmed } from "./notification.service";
import {
  detailSchemaFor,
  travelerSchema,
  chargeSchema,
  customerSchema,
  type BookingCreateInput,
  type BookingUpdateInput,
  type BookingListQuery,
  type BookingListItem,
  type BookingListResponse,
  type BookingDetailResponse,
} from "../contracts/booking.contract";

type Tx = Prisma.TransactionClient;

// ── small helpers ─────────────────────────────────────────────────────────────
function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const num = (v: Prisma.Decimal | number | null | undefined): number | null =>
  v == null ? null : typeof v === "number" ? v : Number(v);

/** Global roles may target any branch; everyone else is pinned to their own. */
function resolveBranchId(auth: AuthCtx, requested?: string): string {
  if (isGlobalRole(auth.role)) {
    const b = requested ?? auth.branchId;
    if (!b) throw new HttpError(400, "BranchRequired", { detail: "Specify branchId (no home branch on this account)" });
    return b;
  }
  if (!auth.branchId) throw new HttpError(403, "NoBranch");
  return auth.branchId;
}

// ── typed-detail column mapping (per service) ────────────────────────────────
function buildDetailData(serviceType: ServiceType, detail: Record<string, unknown>): Record<string, unknown> {
  const s = (k: string) => (detail[k] as string | undefined) ?? undefined;
  const n = (k: string) => (detail[k] as number | undefined) ?? undefined;
  const b = (k: string) => (detail[k] as boolean | undefined) ?? undefined;
  switch (serviceType) {
    case "HAJJ":
      return { packageTier: s("packageTier"), season: s("season"), groupAssign: s("groupAssign"), departureDate: toDate(s("departureDate")), returnDate: toDate(s("returnDate")), roomType: s("roomType"), transport: s("transport"), hotelMakkah: s("hotelMakkah"), hotelMadinah: s("hotelMadinah"), daysMakkah: n("daysMakkah"), daysMadinah: n("daysMadinah"), haramDistanceMakkah: s("haramDistanceMakkah"), haramDistanceMadinah: s("haramDistanceMadinah"), tentCategory: s("tentCategory"), maktabNo: s("maktabNo"), qurbani: b("qurbani") ?? false, mahramRequired: b("mahramRequired") ?? false, specialRequests: s("specialRequests") };
    case "UMRAH":
      return { packageTier: s("packageTier"), season: s("season"), departureDate: toDate(s("departureDate")), returnDate: toDate(s("returnDate")), roomType: s("roomType"), transport: s("transport"), hotelMakkah: s("hotelMakkah"), hotelMadinah: s("hotelMadinah"), daysMakkah: n("daysMakkah"), daysMadinah: n("daysMadinah"), haramDistanceMakkah: s("haramDistanceMakkah"), haramDistanceMadinah: s("haramDistanceMadinah"), visaIssuedAt: toDate(s("visaIssuedAt")), visaExpiry: toDate(s("visaExpiry")), mahramRequired: b("mahramRequired") ?? false, specialRequests: s("specialRequests") };
    case "VISA":
      return { destinationCountry: s("destinationCountry"), visaType: s("visaType"), processingSpeed: s("processingSpeed"), passportCount: n("passportCount") ?? 1, purpose: s("purpose"), visaNumber: s("visaNumber"), visaExpiry: toDate(s("visaExpiry")), notes: s("notes") };
    case "AIR_TICKET":
      return { airline: s("airline"), pnr: s("pnr"), journeyType: s("journeyType"), origin: s("origin"), destination: s("destination"), cabinClass: s("cabinClass"), departAt: toDate(s("departAt")), returnAt: toDate(s("returnAt")), baseFare: n("baseFare"), taxAmount: n("taxAmount"), agentMarkup: n("agentMarkup"), fareType: s("fareType"), baggage: s("baggage") };
    case "HOTEL":
      return { city: s("city"), hotelName: s("hotelName"), starRating: n("starRating"), checkIn: toDate(s("checkIn")), checkOut: toDate(s("checkOut")), roomType: s("roomType"), rooms: n("rooms"), guests: n("guests"), boardBasis: s("boardBasis"), confirmationNo: s("confirmationNo"), distanceFromHaram: s("distanceFromHaram"), specialRequests: s("specialRequests") };
    case "MANPOWER":
      return { workerCategory: s("workerCategory"), jobTitle: s("jobTitle"), destinationCountry: s("destinationCountry"), destinationCity: s("destinationCity"), employer: s("employer"), contractDuration: s("contractDuration"), monthlySalary: s("monthlySalary"), accommodation: s("accommodation") };
    case "TOUR":
      return { packageTier: s("packageTier"), tourType: s("tourType"), destinations: s("destinations"), duration: s("duration"), departureDate: toDate(s("departureDate")), returnDate: toDate(s("returnDate")), travelers: n("travelers"), hotelCategory: s("hotelCategory"), roomSharing: s("roomSharing"), mealPlan: s("mealPlan"), itineraryNote: s("itineraryNote") };
    default:
      return {};
  }
}

/** Upsert the one typed-detail row for a booking (all 7 are 1:1 on bookingId). */
async function upsertDetail(tx: Tx, serviceType: ServiceType, bookingId: string, data: Record<string, unknown>): Promise<void> {
  const create = { ...data, bookingId } as never;
  const update = data as never;
  switch (serviceType) {
    case "HAJJ": await tx.hajjBooking.upsert({ where: { bookingId }, create, update }); break;
    case "UMRAH": await tx.umrahBooking.upsert({ where: { bookingId }, create, update }); break;
    case "VISA": await tx.visaBooking.upsert({ where: { bookingId }, create, update }); break;
    case "AIR_TICKET": await tx.airTicketBooking.upsert({ where: { bookingId }, create, update }); break;
    case "HOTEL": await tx.hotelBooking.upsert({ where: { bookingId }, create, update }); break;
    case "MANPOWER": await tx.manpowerBooking.upsert({ where: { bookingId }, create, update }); break;
    case "TOUR": await tx.tourBooking.upsert({ where: { bookingId }, create, update }); break;
  }
}

/** Validate `detail` against the strict per-service schema (throws HttpError 400). */
function validateDetail(serviceType: ServiceType, detail: unknown): Record<string, unknown> {
  const parsed = detailSchemaFor[serviceType].safeParse(detail ?? {});
  if (!parsed.success) {
    throw new HttpError(400, "InvalidBookingDetail", { serviceType, issues: parsed.error.flatten() });
  }
  return parsed.data as Record<string, unknown>;
}

async function upsertCustomer(tx: Tx, branchId: string, customer?: { name: string; phone: string; email?: string }): Promise<string | null> {
  if (!customer) return null;
  const existing = await tx.customer.findFirst({ where: { branchId, phone: customer.phone, deletedAt: null }, select: { id: true } });
  if (existing) {
    await tx.customer.update({ where: { id: existing.id }, data: { name: customer.name, email: customer.email || null } });
    return existing.id;
  }
  const created = await tx.customer.create({ data: { branchId, name: customer.name, phone: customer.phone, email: customer.email || null } });
  return created.id;
}

async function syncTravelers(tx: Tx, bookingId: string, travelers?: BookingCreateInput["travelers"]): Promise<void> {
  if (!travelers) return;
  await tx.traveler.deleteMany({ where: { bookingId } });
  for (let i = 0; i < travelers.length; i++) {
    const t = travelers[i];
    await tx.traveler.create({
      data: {
        bookingId,
        name: t.name,
        dob: toDate(t.dob),
        gender: t.gender,
        nationality: t.nationality || "Bangladeshi",
        passportNo: t.passportNo || null, // PII: auto-encrypted by the prisma extension
        passportExpiry: toDate(t.passportExpiry),
        phone: t.phone || null,
        email: t.email || null,
        isPrimary: t.isPrimary ?? i === 0,
        mahramRelation: t.mahramRelation,
      },
    });
  }
}

async function syncCharges(tx: Tx, bookingId: string, charges?: BookingCreateInput["charges"]): Promise<void> {
  if (!charges) return;
  await tx.bookingCharge.deleteMany({ where: { bookingId } });
  for (const c of charges) {
    const m = money(c.amount, (c.currency as CurrencyCode) ?? "BDT", c.exchangeRate);
    await tx.bookingCharge.create({
      data: { bookingId, label: c.label, amount: m.amount, currency: m.currency, exchangeRate: m.exchangeRate, baseAmount: m.baseAmount, kind: c.kind },
    });
  }
}

async function logActivity(tx: Tx, bookingId: string, actorId: string | null, action: string, note?: string): Promise<void> {
  await tx.bookingActivity.create({ data: { bookingId, actorId, action, note } });
  await tx.activityLog.create({ data: { userId: actorId, action, target: bookingId, module: "bookings" } });
}

// ── serialization (row → DTO) ─────────────────────────────────────────────────
type BookingWithRels = Prisma.BookingGetPayload<{
  include: { branch: true; customer: true; package: true; assignedStaff: true; agent: true };
}>;

function toListItem(b: BookingWithRels): BookingListItem {
  return {
    id: b.id,
    bookingNo: b.bookingNo,
    serviceType: b.serviceType as BookingListItem["serviceType"],
    status: b.status as BookingListItem["status"],
    amount: num(b.amount) ?? 0,
    paidAmount: num(b.paidAmount) ?? 0,
    currency: b.currency as BookingListItem["currency"],
    branchId: b.branchId,
    branchName: b.branch?.name ?? null,
    customer: b.customer ? { name: b.customer.name, phone: b.customer.phone, email: b.customer.email ?? null } : null,
    packageName: b.package?.name ?? null,
    staffName: b.assignedStaff?.name ?? null,
    agentName: b.agent?.name ?? null,
    travelersCount: b.travelersCount,
    departureDate: dOnly(b.departureDate),
    createdAt: dIso(b.createdAt)!,
  };
}

function serializeDetailRow(serviceType: ServiceType, b: Record<string, unknown>): Record<string, unknown> | null {
  const pick = (key: string) => (b[key] as Record<string, unknown> | null) ?? null;
  const row =
    serviceType === "HAJJ" ? pick("hajj") :
    serviceType === "UMRAH" ? pick("umrah") :
    serviceType === "VISA" ? pick("visa") :
    serviceType === "AIR_TICKET" ? pick("airTicket") :
    serviceType === "HOTEL" ? pick("hotel") :
    serviceType === "MANPOWER" ? pick("manpower") :
    serviceType === "TOUR" ? pick("tour") : null;
  if (!row) return null;
  // normalize Decimal/Date so the wire shape is JSON-clean
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) out[k] = dOnly(v) ?? dIso(v);
    else if (v instanceof Prisma.Decimal) out[k] = Number(v);
    else out[k] = v;
  }
  return out;
}

const detailInclude = { hajj: true, umrah: true, visa: true, airTicket: true, hotel: true, manpower: true, tour: true } as const;

// ── public API ────────────────────────────────────────────────────────────────
export async function listBookings(auth: AuthCtx, q: BookingListQuery): Promise<BookingListResponse> {
  const where: Prisma.BookingWhereInput = {
    ...branchWhere(auth), // ← branch scoping: a CTG user never sees Dhaka bookings
    deletedAt: null,
  };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId; // narrower branch for admins
  if (q.status) where.status = q.status;
  if (q.serviceType) where.serviceType = q.serviceType;
  if (q.agentId) where.agentId = q.agentId;
  if (q.customerId) where.customerId = q.customerId;
  if (q.dateFrom || q.dateTo) {
    where.createdAt = {};
    if (q.dateFrom) (where.createdAt as Prisma.DateTimeFilter).gte = toDate(q.dateFrom)!;
    if (q.dateTo) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(`${q.dateTo}T23:59:59.999Z`);
  }
  if (q.q) {
    where.OR = [
      { bookingNo: { contains: q.q, mode: "insensitive" } },
      { customer: { is: { name: { contains: q.q, mode: "insensitive" } } } },
      { customer: { is: { phone: { contains: q.q } } } },
      { package: { is: { name: { contains: q.q, mode: "insensitive" } } } },
      { notes: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.BookingOrderByWithRelationInput =
    q.sort === "amount" ? { amount: q.dir } : { createdAt: q.dir };

  const [rows, total, grouped] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { branch: true, customer: true, package: true, assignedStaff: true, agent: true },
      orderBy,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({ by: ["status"], where, _count: { _all: true }, _sum: { paidAmount: true } }),
  ]);

  let confirmed = 0, inProgress = 0, revenueCollected = 0;
  const byStatus: Record<string, number> = {};
  for (const g of grouped) {
    byStatus[g.status] = g._count._all;
    if (g.status === "CONFIRMED") confirmed += g._count._all;
    if (g.status === "PENDING" || g.status === "PROCESSING") inProgress += g._count._all;
    revenueCollected += num(g._sum.paidAmount) ?? 0;
  }

  return {
    data: rows.map(toListItem),
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    stats: { total, confirmed, inProgress, revenueCollected, byStatus },
  };
}

export async function getBooking(auth: AuthCtx, id: string): Promise<BookingDetailResponse> {
  const b = await prisma.booking.findFirst({
    where: { id, ...branchWhere(auth), deletedAt: null },
    include: {
      branch: true, customer: true, package: true, assignedStaff: true, agent: true,
      ...detailInclude,
      charges: true,
      documents: { where: { deletedAt: null } },
      stageEvents: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
    },
  });
  if (!b) throw new HttpError(404, "NotFound");

  // Travelers are fetched via a DIRECT model query (not a nested include) so the
  // PII extension decrypts passportNo — query extensions don't reach into includes.
  const travelers = await prisma.traveler.findMany({
    where: { bookingId: id, deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  const base = toListItem(b as unknown as BookingWithRels);
  return {
    ...base,
    currentStep: b.currentStep,
    wizardData: (b.wizardData as Record<string, unknown> | null) ?? null,
    notes: b.notes,
    returnDate: dOnly(b.returnDate),
    discountType: b.discountType,
    discountValue: num(b.discountValue),
    detail: serializeDetailRow(b.serviceType, b as unknown as Record<string, unknown>),
    travelers: travelers.map((t) => ({
      id: t.id, name: t.name, dob: dOnly(t.dob), gender: t.gender, nationality: t.nationality,
      passportNo: t.passportNo ?? null, passportExpiry: dOnly(t.passportExpiry), phone: t.phone, email: t.email,
      isPrimary: t.isPrimary, mahramRelation: t.mahramRelation,
    })),
    charges: b.charges.map((c) => ({ id: c.id, label: c.label, amount: num(c.amount) ?? 0, currency: c.currency as BookingListItem["currency"], baseAmount: num(c.baseAmount) ?? 0, kind: c.kind })),
    documents: b.documents.map((d) => ({ id: d.id, type: d.type, name: d.name, status: d.status, required: d.required, expiryAt: dOnly(d.expiryAt) })),
    stageEvents: b.stageEvents.map((e) => ({ id: e.id, stage: e.stage, status: e.status, note: e.note, createdAt: dIso(e.createdAt)! })),
    activities: b.activities.map((a) => ({ id: a.id, action: a.action, note: a.note, actor: a.actor?.name ?? null, createdAt: dIso(a.createdAt)! })),
  };
}

export async function createBooking(auth: AuthCtx, input: BookingCreateInput): Promise<BookingDetailResponse> {
  const branchId = resolveBranchId(auth, input.branchId);
  const m = money(input.amount, input.currency as CurrencyCode, input.exchangeRate);

  const id = await prisma.$transaction(async (tx) => {
    const customerId = input.customerId ?? (await upsertCustomer(tx, branchId, input.customer));
    const booking = await tx.booking.create({
      data: {
        branchId, serviceType: input.serviceType, status: "DRAFT",
        customerId, packageId: input.packageId, agentId: input.agentId, assignedStaffId: input.assignedStaffId, source: input.source,
        amount: m.amount, currency: m.currency, exchangeRate: m.exchangeRate, baseAmount: m.baseAmount,
        paidAmount: input.paidAmount ?? 0, discountType: input.discountType, discountValue: input.discountValue,
        travelersCount: input.travelers?.length ?? 1,
        departureDate: toDate(input.departureDate), returnDate: toDate(input.returnDate), notes: input.notes,
        currentStep: input.currentStep ?? 0, wizardData: (input.wizardData ?? undefined) as Prisma.InputJsonValue | undefined,
        createdById: auth.userId,
      },
    });
    // Materialize the typed detail only if it validates strictly; otherwise it
    // stays in wizardData for the draft and is materialized at confirm.
    if (input.detail && Object.keys(input.detail).length) {
      const parsed = detailSchemaFor[input.serviceType].safeParse(input.detail);
      if (parsed.success) await upsertDetail(tx, input.serviceType, booking.id, buildDetailData(input.serviceType, parsed.data as Record<string, unknown>));
    }
    await syncTravelers(tx, booking.id, input.travelers);
    await syncCharges(tx, booking.id, input.charges);
    await logActivity(tx, booking.id, auth.userId, "Booking created", `${input.serviceType} draft`);
    return booking.id;
  });

  return getBooking(auth, id);
}

export async function updateBooking(auth: AuthCtx, id: string, input: BookingUpdateInput): Promise<BookingDetailResponse> {
  const existing = await prisma.booking.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
    throw new HttpError(409, "BookingLocked", { detail: `A ${existing.status} booking cannot be edited` });
  }

  await prisma.$transaction(async (tx) => {
    const data: Prisma.BookingUpdateInput = {};
    if (input.amount != null) {
      const m = money(input.amount, (input.currency as CurrencyCode) ?? (existing.currency as CurrencyCode), input.exchangeRate);
      data.amount = m.amount; data.currency = m.currency; data.exchangeRate = m.exchangeRate; data.baseAmount = m.baseAmount;
    }
    if (input.paidAmount != null) data.paidAmount = input.paidAmount;
    if (input.discountType !== undefined) data.discountType = input.discountType;
    if (input.discountValue !== undefined) data.discountValue = input.discountValue;
    if (input.status) data.status = input.status;
    if (input.departureDate !== undefined) data.departureDate = toDate(input.departureDate);
    if (input.returnDate !== undefined) data.returnDate = toDate(input.returnDate);
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.assignedStaffId !== undefined) data.assignedStaff = input.assignedStaffId ? { connect: { id: input.assignedStaffId } } : { disconnect: true };
    if (input.customer) { const cid = await upsertCustomer(tx, existing.branchId, input.customer); if (cid) data.customer = { connect: { id: cid } }; }
    else if (input.customerId) data.customer = { connect: { id: input.customerId } };
    if (input.travelers) data.travelersCount = input.travelers.length;
    await tx.booking.update({ where: { id }, data });

    // Release reserved Hajj/Umrah capacity when a confirmed booking is cancelled
    // (a DRAFT never reserved — no bookingNo — so nothing to release there).
    if (input.status === "CANCELLED" && existing.status !== "CANCELLED" && existing.bookingNo) {
      const seats = existing.travelersCount;
      if (existing.batchId) await releaseBatchSeat(tx, existing.batchId, seats);
      if (existing.quotaId) await releaseQuotaSlot(tx, existing.quotaId, seats);
    }

    if (input.detail && Object.keys(input.detail).length) {
      const parsed = detailSchemaFor[existing.serviceType].safeParse(input.detail);
      if (!parsed.success) throw new HttpError(400, "InvalidBookingDetail", { issues: parsed.error.flatten() });
      await upsertDetail(tx, existing.serviceType, id, buildDetailData(existing.serviceType, parsed.data as Record<string, unknown>));
    }
    await syncTravelers(tx, id, input.travelers);
    await syncCharges(tx, id, input.charges);
    await logActivity(tx, id, auth.userId, "Booking updated");
  });

  return getBooking(auth, id);
}

/** Lightweight per-step autosave for wizard resume (server-side, cross-device). */
export async function saveDraft(auth: AuthCtx, id: string, currentStep: number, wizardData: Record<string, unknown>): Promise<{ id: string; currentStep: number }> {
  const existing = await prisma.booking.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true, status: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  if (existing.status !== "DRAFT") throw new HttpError(409, "NotADraft", { detail: "Only DRAFT bookings accept wizard autosave" });
  await prisma.booking.update({ where: { id }, data: { currentStep, wizardData: wizardData as Prisma.InputJsonValue } });
  return { id, currentStep };
}

/**
 * Confirm a draft: allocate the gapless bookingNo, materialize the typed detail
 * (from wizardData if not already present) and flag CONFIRMED — ALL in one
 * transaction. If any step throws, the whole thing rolls back and the sequence
 * number is NOT consumed (allocation lives inside this same tx).
 */
export async function confirmBooking(auth: AuthCtx, id: string): Promise<BookingDetailResponse> {
  await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findFirst({
      where: { id, ...branchWhere(auth), deletedAt: null },
      include: { branch: true, ...detailInclude },
    });
    if (!b) throw new HttpError(404, "NotFound");
    if (b.bookingNo) throw new HttpError(409, "AlreadyConfirmed", { detail: `Already numbered ${b.bookingNo}` });
    if (b.status !== "DRAFT" && b.status !== "PENDING") throw new HttpError(409, "NotConfirmable", { detail: `status=${b.status}` });

    // seats/quota to reserve = number of pilgrims on this booking (updated below
    // if travelers get materialized from wizardData).
    let seats = b.travelersCount;

    // 1) allocate the gapless per-branch/year number FIRST (inside this tx)
    const year = new Date().getUTCFullYear();
    const seq = await allocateSequence(tx, "BOOKING", b.branchId, year);
    const bookingNo = formatBookingNo(b.branch.code, year, seq);

    // 2) ensure the typed detail exists — validate strictly. A failure here
    //    throws INSIDE the tx, so the sequence bump above is rolled back.
    const wizard = (b.wizardData as Record<string, unknown> | null) ?? {};
    const hasDetail = b.hajj || b.umrah || b.visa || b.airTicket || b.hotel || b.manpower || b.tour;
    if (!hasDetail) {
      const detail = validateDetail(b.serviceType, wizard.detail);
      await upsertDetail(tx, b.serviceType, id, buildDetailData(b.serviceType, detail));
    }

    // 3) materialize customer / travelers / charges from wizardData (draft path)
    //    — only when the draft never persisted them via create/update.
    if (!b.customerId && wizard.customer) {
      const c = customerSchema.safeParse(wizard.customer);
      if (c.success) {
        const cid = await upsertCustomer(tx, b.branchId, c.data);
        if (cid) await tx.booking.update({ where: { id }, data: { customerId: cid } });
      }
    }
    if (Array.isArray(wizard.travelers) && (await tx.traveler.count({ where: { bookingId: id, deletedAt: null } })) === 0) {
      const tp = travelerSchema.array().safeParse(wizard.travelers);
      if (tp.success && tp.data.length) {
        await syncTravelers(tx, id, tp.data);
        seats = tp.data.length;
        await tx.booking.update({ where: { id }, data: { travelersCount: tp.data.length } });
      }
    }
    if (Array.isArray(wizard.charges) && (await tx.bookingCharge.count({ where: { bookingId: id } })) === 0) {
      const cp = chargeSchema.array().safeParse(wizard.charges);
      if (cp.success && cp.data.length) await syncCharges(tx, id, cp.data);
    }

    // 4) resolve money (from wizardData pricing/payment if the draft never set it)
    const moneyData: Prisma.BookingUpdateInput = {};
    const currentAmount = num(b.amount) ?? 0;
    const wizTotal = Number((wizard.pricing as Record<string, unknown> | undefined)?.total ?? 0);
    const finalAmount = currentAmount > 0 ? currentAmount : wizTotal;
    if (!finalAmount || finalAmount <= 0) throw new HttpError(400, "AmountRequired", { detail: "Booking has no amount to confirm" });
    if (currentAmount <= 0) {
      const m = money(finalAmount, b.currency as CurrencyCode, num(b.exchangeRate) ?? undefined);
      moneyData.amount = m.amount; moneyData.exchangeRate = m.exchangeRate; moneyData.baseAmount = m.baseAmount;
    }
    const received = Number((wizard.payment as Record<string, unknown> | undefined)?.received ?? 0);
    if (received > 0) moneyData.paidAmount = received;

    // 4b) reserve Hajj/Umrah capacity (row-locked). If the batch/quota is full
    //     this throws INSIDE the tx → the bookingNo allocation above rolls back
    //     and no seat is consumed. Concurrent confirms on the last seat serialize
    //     on the FOR UPDATE lock; only one wins.
    if (b.batchId) await reserveBatchSeat(tx, b.batchId, seats);
    if (b.quotaId) await reserveQuotaSlot(tx, b.quotaId, seats);

    // 5) flag CONFIRMED + write activity
    await tx.booking.update({ where: { id }, data: { bookingNo, status: "CONFIRMED", ...moneyData } });
    await logActivity(tx, id, auth.userId, "Booking confirmed", `Allocated ${bookingNo}`);
  });

  // customer email/SMS/in-app — after the tx commits; failures never surface here
  notifyBookingConfirmed(id);

  return getBooking(auth, id);
}

/** Soft-delete a DRAFT only. Issued/confirmed bookings are cancelled via status. */
export async function deleteBooking(auth: AuthCtx, id: string): Promise<void> {
  const b = await prisma.booking.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true, status: true } });
  if (!b) throw new HttpError(404, "NotFound");
  if (b.status !== "DRAFT") {
    throw new HttpError(409, "CannotDelete", { detail: "Only DRAFT bookings can be deleted; confirmed/issued bookings are cancelled via status." });
  }
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { deletedAt: new Date(), status: "CANCELLED" } });
    await logActivity(tx, id, auth.userId, "Draft deleted");
  });
}
