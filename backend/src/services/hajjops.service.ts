/**
 * Hajj/Umrah Operations service (Phase 2). Read/write, branch-scoped.
 *
 *  - Quota + group-departure batches carry the capacity counters that bookings
 *    reserve at confirm-time (see lib/capacity — SELECT … FOR UPDATE + DB CHECK).
 *  - Pilgrim government registration stores encrypted identifiers (pre-reg serial,
 *    PID, tracking no.) via the PII prisma extension; search is by HMAC blind index.
 *  - Passport-expiry alerts enforce the operational 6-month-before-departure rule.
 */
import { Prisma, type ServiceType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { allocateSequence, formatDocNo } from "../lib/sequence";
import { blindIndex } from "../lib/pii";
import { reserveBatchSeat, reserveQuotaSlot, releaseBatchSeat, releaseQuotaSlot } from "../lib/capacity";
import type {
  QuotaCreateInput, QuotaUpdateInput, BatchCreateInput, BatchUpdateInput,
  AssignCapacityInput, RegistrationCreateInput, RegistrationUpdateInput,
  QuotaDto, BatchDto, BatchDetail, RegistrationDto, PassportAlertDto,
} from "../contracts/hajjops.contract";

const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);
function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/** Branch a write targets: global roles may pass one; scoped users forced to own. */
function writeBranch(auth: AuthCtx, requested?: string): string {
  if (isGlobalRole(auth.role)) {
    const b = requested ?? auth.branchId;
    if (!b) throw new HttpError(400, "BranchRequired", { detail: "Specify branchId" });
    return b;
  }
  if (!auth.branchId) throw new HttpError(403, "NoBranch");
  return auth.branchId;
}

let branchCache: Map<string, { name: string; code: string }> | null = null;
async function branches(): Promise<Map<string, { name: string; code: string }>> {
  if (!branchCache) {
    const rows = await prisma.branch.findMany({ select: { id: true, name: true, code: true } });
    branchCache = new Map(rows.map((b) => [b.id, { name: b.name, code: b.code }]));
  }
  return branchCache;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTA
// ═══════════════════════════════════════════════════════════════════════════
async function toQuotaDto(q: { id: string; branchId: string | null; serviceType: string; season: string; label: string; quotaType: string; allotted: number; filled: number; notes: string | null; createdAt: Date }): Promise<QuotaDto> {
  const bn = q.branchId ? (await branches()).get(q.branchId)?.name ?? null : null;
  return {
    id: q.id, branchId: q.branchId, branchName: bn, serviceType: q.serviceType, season: q.season,
    label: q.label, quotaType: q.quotaType, allotted: q.allotted, filled: q.filled,
    remaining: Math.max(0, q.allotted - q.filled), notes: q.notes, createdAt: dIso(q.createdAt)!,
  };
}

export async function listQuotas(auth: AuthCtx, q: { serviceType?: string; season?: string; branchId?: string }): Promise<{ data: QuotaDto[] }> {
  const where: Prisma.HajjQuotaWhereInput = { deletedAt: null };
  if (!isGlobalRole(auth.role)) {
    // a branch user sees their branch's quotas + company-wide (null) allotments
    where.OR = [{ branchId: auth.branchId ?? "__none__" }, { branchId: null }];
  } else if (q.branchId && q.branchId !== "all") {
    where.branchId = q.branchId;
  }
  if (q.serviceType) where.serviceType = q.serviceType as ServiceType;
  if (q.season) where.season = q.season;
  const rows = await prisma.hajjQuota.findMany({ where, orderBy: [{ season: "desc" }, { label: "asc" }] });
  return { data: await Promise.all(rows.map(toQuotaDto)) };
}

export async function createQuota(auth: AuthCtx, input: QuotaCreateInput): Promise<QuotaDto> {
  // company-wide quota allowed only for global roles (branchId omitted); scoped → own branch
  const branchId = isGlobalRole(auth.role) ? (input.branchId ?? null) : (auth.branchId ?? null);
  const row = await prisma.hajjQuota.create({
    data: { branchId, serviceType: input.serviceType as ServiceType, season: input.season, label: input.label, quotaType: input.quotaType, allotted: input.allotted, notes: input.notes ?? null },
  }).catch(mapDup("A quota with this season + label already exists"));
  return toQuotaDto(row);
}

export async function updateQuota(auth: AuthCtx, id: string, input: QuotaUpdateInput): Promise<QuotaDto> {
  const q = await findQuotaScoped(auth, id);
  if (input.allotted != null && input.allotted < q.filled) {
    throw new HttpError(409, "AllottedBelowFilled", { detail: `Cannot set allotment (${input.allotted}) below the ${q.filled} already reserved` });
  }
  const row = await prisma.hajjQuota.update({
    where: { id },
    data: { label: input.label ?? undefined, allotted: input.allotted ?? undefined, quotaType: input.quotaType ?? undefined, notes: input.notes ?? undefined },
  });
  return toQuotaDto(row);
}

export async function deleteQuota(auth: AuthCtx, id: string): Promise<void> {
  const q = await findQuotaScoped(auth, id);
  if (q.filled > 0) throw new HttpError(409, "QuotaInUse", { detail: `${q.filled} slot(s) are reserved; reassign those bookings first` });
  await prisma.hajjQuota.update({ where: { id }, data: { deletedAt: new Date() } });
}

async function findQuotaScoped(auth: AuthCtx, id: string) {
  const q = await prisma.hajjQuota.findFirst({ where: { id, deletedAt: null } });
  if (!q) throw new HttpError(404, "NotFound");
  if (!isGlobalRole(auth.role) && q.branchId != null && q.branchId !== auth.branchId) throw new HttpError(404, "NotFound");
  return q;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPARTURE BATCH
// ═══════════════════════════════════════════════════════════════════════════
async function toBatchDto(b: Prisma.DepartureBatchGetPayload<object>): Promise<BatchDto> {
  const bn = (await branches()).get(b.branchId)?.name ?? null;
  return {
    id: b.id, branchId: b.branchId, branchName: bn, code: b.code, serviceType: b.serviceType,
    season: b.season, packageId: b.packageId, name: b.name,
    departureDate: dOnly(b.departureDate), returnDate: dOnly(b.returnDate),
    totalSeats: b.totalSeats, filledSeats: b.filledSeats, remainingSeats: Math.max(0, b.totalSeats - b.filledSeats),
    muallimName: b.muallimName, muallimNo: b.muallimNo, maktab: b.maktab, transport: b.transport,
    status: b.status, notes: b.notes, createdAt: dIso(b.createdAt)!,
  };
}

export async function listBatches(auth: AuthCtx, q: { serviceType?: string; season?: string; status?: string; branchId?: string }): Promise<{ data: BatchDto[] }> {
  const where: Prisma.DepartureBatchWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (q.branchId && q.branchId !== "all" && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.serviceType) where.serviceType = q.serviceType as ServiceType;
  if (q.season) where.season = q.season;
  if (q.status) where.status = q.status as never;
  const rows = await prisma.departureBatch.findMany({ where, orderBy: [{ createdAt: "desc" }] });
  return { data: await Promise.all(rows.map(toBatchDto)) };
}

export async function getBatch(auth: AuthCtx, id: string): Promise<BatchDetail> {
  const b = await prisma.departureBatch.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!b) throw new HttpError(404, "NotFound");
  const bookings = await prisma.booking.findMany({
    where: { batchId: id, deletedAt: null },
    select: { id: true, bookingNo: true, travelersCount: true, status: true, customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return {
    ...(await toBatchDto(b)),
    bookings: bookings.map((x) => ({ id: x.id, bookingNo: x.bookingNo, customerName: x.customer?.name ?? null, travelersCount: x.travelersCount, status: x.status })),
  };
}

export async function createBatch(auth: AuthCtx, input: BatchCreateInput): Promise<BatchDto> {
  const branchId = writeBranch(auth, input.branchId);
  const br = (await branches()).get(branchId);
  if (!br) throw new HttpError(400, "BranchRequired", { detail: "Unknown branch" });
  const year = new Date().getUTCFullYear();
  const row = await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "BATCH", branchId, year);
    return tx.departureBatch.create({
      data: {
        branchId, code: formatDocNo("BATCH", br.code, year, seq), serviceType: input.serviceType as ServiceType,
        name: input.name, season: input.season ?? null, packageId: input.packageId ?? null,
        departureDate: toDate(input.departureDate), returnDate: toDate(input.returnDate),
        totalSeats: input.totalSeats, muallimName: input.muallimName ?? null, muallimNo: input.muallimNo ?? null,
        maktab: input.maktab ?? null, transport: input.transport ?? null, notes: input.notes ?? null,
      },
    });
  });
  branchCache = null; // (cheap safety if branches changed; harmless)
  return toBatchDto(row);
}

export async function updateBatch(auth: AuthCtx, id: string, input: BatchUpdateInput): Promise<BatchDto> {
  const b = await prisma.departureBatch.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!b) throw new HttpError(404, "NotFound");
  if (input.totalSeats != null && input.totalSeats < b.filledSeats) {
    throw new HttpError(409, "SeatsBelowFilled", { detail: `Cannot set capacity (${input.totalSeats}) below the ${b.filledSeats} seats already filled` });
  }
  const row = await prisma.departureBatch.update({
    where: { id },
    data: {
      name: input.name ?? undefined, season: input.season ?? undefined, packageId: input.packageId ?? undefined,
      departureDate: input.departureDate !== undefined ? toDate(input.departureDate) : undefined,
      returnDate: input.returnDate !== undefined ? toDate(input.returnDate) : undefined,
      totalSeats: input.totalSeats ?? undefined, muallimName: input.muallimName ?? undefined,
      muallimNo: input.muallimNo ?? undefined, maktab: input.maktab ?? undefined, transport: input.transport ?? undefined,
      status: input.status ?? undefined, notes: input.notes ?? undefined,
    },
  });
  return toBatchDto(row);
}

export async function deleteBatch(auth: AuthCtx, id: string): Promise<void> {
  const b = await prisma.departureBatch.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!b) throw new HttpError(404, "NotFound");
  if (b.filledSeats > 0) throw new HttpError(409, "BatchInUse", { detail: `${b.filledSeats} seat(s) are filled; reassign those bookings first` });
  await prisma.departureBatch.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSIGN booking → batch/quota (concurrency-safe move for confirmed bookings)
// ═══════════════════════════════════════════════════════════════════════════
export async function assignBookingCapacity(auth: AuthCtx, input: AssignCapacityInput): Promise<{ ok: true }> {
  const booking = await prisma.booking.findFirst({ where: { id: input.bookingId, ...branchWhere(auth), deletedAt: null } });
  if (!booking) throw new HttpError(404, "NotFound", { detail: "Booking not found" });

  // validate targets (branch + serviceType) before touching counters
  if (input.batchId) {
    const t = await prisma.departureBatch.findFirst({ where: { id: input.batchId, deletedAt: null } });
    if (!t) throw new HttpError(404, "BatchNotFound");
    if (t.branchId !== booking.branchId) throw new HttpError(409, "BranchMismatch", { detail: "Batch belongs to another branch" });
    if (t.serviceType !== booking.serviceType) throw new HttpError(409, "ServiceMismatch", { detail: "Batch service type differs from the booking" });
  }
  if (input.quotaId) {
    const t = await prisma.hajjQuota.findFirst({ where: { id: input.quotaId, deletedAt: null } });
    if (!t) throw new HttpError(404, "QuotaNotFound");
    if (t.branchId != null && t.branchId !== booking.branchId) throw new HttpError(409, "BranchMismatch", { detail: "Quota belongs to another branch" });
    if (t.serviceType !== booking.serviceType) throw new HttpError(409, "ServiceMismatch", { detail: "Quota service type differs from the booking" });
  }

  const reserved = !!booking.bookingNo && booking.status !== "CANCELLED";
  const seats = booking.travelersCount;

  if (!reserved) {
    // reservation happens later at confirm — just record the assignment
    await prisma.booking.update({
      where: { id: booking.id },
      data: { batchId: input.batchId === undefined ? undefined : input.batchId, quotaId: input.quotaId === undefined ? undefined : input.quotaId },
    });
    return { ok: true };
  }

  // Already reserved → moving means release-old + reserve-new atomically (row-locked).
  await prisma.$transaction(async (tx) => {
    if (input.batchId !== undefined && input.batchId !== booking.batchId) {
      if (booking.batchId) await releaseBatchSeat(tx, booking.batchId, seats);
      if (input.batchId) await reserveBatchSeat(tx, input.batchId, seats);
      await tx.booking.update({ where: { id: booking.id }, data: { batchId: input.batchId } });
    }
    if (input.quotaId !== undefined && input.quotaId !== booking.quotaId) {
      if (booking.quotaId) await releaseQuotaSlot(tx, booking.quotaId, seats);
      if (input.quotaId) await reserveQuotaSlot(tx, input.quotaId, seats);
      await tx.booking.update({ where: { id: booking.id }, data: { quotaId: input.quotaId } });
    }
  });
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// PILGRIM GOVERNMENT REGISTRATION (encrypted identifiers, blind-index search)
// ═══════════════════════════════════════════════════════════════════════════
async function toRegistrationDto(r: Prisma.PilgrimRegistrationGetPayload<object>): Promise<RegistrationDto> {
  const bn = (await branches()).get(r.branchId)?.name ?? null;
  let bookingNo: string | null = null;
  if (r.bookingId) bookingNo = (await prisma.booking.findUnique({ where: { id: r.bookingId }, select: { bookingNo: true } }))?.bookingNo ?? null;
  return {
    id: r.id, branchId: r.branchId, branchName: bn, pilgrimName: r.pilgrimName,
    serviceType: r.serviceType, season: r.season, quotaType: r.quotaType,
    bookingId: r.bookingId, bookingNo, travelerId: r.travelerId, customerId: r.customerId,
    // decrypted by the PII prisma extension (direct model query, not an include)
    preRegSerial: r.preRegSerial, pid: r.pid, trackingNo: r.trackingNo,
    status: r.status, registeredAt: dOnly(r.registeredAt), notes: r.notes, createdAt: dIso(r.createdAt)!,
  };
}

export async function listRegistrations(auth: AuthCtx, q: { q?: string; serviceType?: string; season?: string; status?: string; branchId?: string }): Promise<{ data: RegistrationDto[] }> {
  const where: Prisma.PilgrimRegistrationWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (q.branchId && q.branchId !== "all" && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.serviceType) where.serviceType = q.serviceType as ServiceType;
  if (q.season) where.season = q.season;
  if (q.status) where.status = q.status as never;
  if (q.q) {
    // exact match on any encrypted identifier via its blind index, or a name contains
    const h = blindIndex(q.q);
    where.OR = [
      { preRegSerialHash: h }, { pidHash: h }, { trackingNoHash: h },
      { pilgrimName: { contains: q.q, mode: "insensitive" } },
    ];
  }
  const rows = await prisma.pilgrimRegistration.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  return { data: await Promise.all(rows.map(toRegistrationDto)) };
}

export async function getRegistration(auth: AuthCtx, id: string): Promise<RegistrationDto> {
  const r = await prisma.pilgrimRegistration.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null } });
  if (!r) throw new HttpError(404, "NotFound");
  return toRegistrationDto(r);
}

export async function createRegistration(auth: AuthCtx, input: RegistrationCreateInput): Promise<RegistrationDto> {
  const branchId = writeBranch(auth, input.branchId);
  const r = await prisma.pilgrimRegistration.create({
    data: {
      branchId, pilgrimName: input.pilgrimName, serviceType: input.serviceType as ServiceType, season: input.season, quotaType: input.quotaType,
      bookingId: input.bookingId ?? null, travelerId: input.travelerId ?? null, customerId: input.customerId ?? null,
      // plaintext here — the PII prisma extension encrypts + sets the *Hash blind index on write
      preRegSerial: input.preRegSerial ?? null, pid: input.pid ?? null, trackingNo: input.trackingNo ?? null,
      status: input.status, registeredAt: toDate(input.registeredAt), notes: input.notes ?? null,
    },
  });
  return toRegistrationDto(r);
}

export async function updateRegistration(auth: AuthCtx, id: string, input: RegistrationUpdateInput): Promise<RegistrationDto> {
  const existing = await prisma.pilgrimRegistration.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  const r = await prisma.pilgrimRegistration.update({
    where: { id },
    data: {
      pilgrimName: input.pilgrimName ?? undefined, season: input.season ?? undefined, quotaType: input.quotaType ?? undefined,
      bookingId: input.bookingId ?? undefined, travelerId: input.travelerId ?? undefined, customerId: input.customerId ?? undefined,
      preRegSerial: input.preRegSerial ?? undefined, pid: input.pid ?? undefined, trackingNo: input.trackingNo ?? undefined,
      status: input.status ?? undefined, registeredAt: input.registeredAt !== undefined ? toDate(input.registeredAt) : undefined,
      notes: input.notes ?? undefined,
    },
  });
  return toRegistrationDto(r);
}

export async function deleteRegistration(auth: AuthCtx, id: string): Promise<void> {
  const existing = await prisma.pilgrimRegistration.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.pilgrimRegistration.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ═══════════════════════════════════════════════════════════════════════════
// PASSPORT-EXPIRY ALERTS — the 6-month-before-departure rule
// ═══════════════════════════════════════════════════════════════════════════
const MS_DAY = 86_400_000;

export async function passportAlerts(auth: AuthCtx, opts: { branchId?: string; windowMonths?: number }): Promise<{ data: PassportAlertDto[] }> {
  const marginDays = Math.round((opts.windowMonths ?? 6) * 30.4375);
  const bWhere: Prisma.BookingWhereInput = { ...branchWhere(auth), deletedAt: null, status: { notIn: ["CANCELLED"] } };
  if (opts.branchId && opts.branchId !== "all" && isGlobalRole(auth.role)) bWhere.branchId = opts.branchId;

  // Travelers are queried DIRECTLY (not via include) so passportNo/expiry decrypt.
  const bookings = await prisma.booking.findMany({
    where: bWhere,
    select: { id: true, bookingNo: true, branchId: true, serviceType: true, departureDate: true },
  });
  const byId = new Map(bookings.map((b) => [b.id, b]));
  if (byId.size === 0) return { data: [] };

  const travelers = await prisma.traveler.findMany({
    where: { bookingId: { in: [...byId.keys()] }, deletedAt: null, passportExpiry: { not: null } },
    select: { id: true, name: true, bookingId: true, passportNo: true, passportExpiry: true },
  });

  const bmap = await branches();
  const today = new Date();
  const startToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const alerts: PassportAlertDto[] = [];

  for (const t of travelers) {
    const b = byId.get(t.bookingId!);
    if (!b || !t.passportExpiry) continue;
    const exp = t.passportExpiry;
    const daysToExpiry = Math.floor((exp.getTime() - startToday.getTime()) / MS_DAY);

    // validity margin AT DEPARTURE: passport must be valid ≥ marginDays beyond departure.
    let monthsValidAtDeparture: number | null = null;
    let flagged = false;
    let severity: PassportAlertDto["severity"] = "warning";
    if (daysToExpiry < 0) { flagged = true; severity = "expired"; }
    if (b.departureDate) {
      const marginAtDep = Math.floor((exp.getTime() - b.departureDate.getTime()) / MS_DAY);
      monthsValidAtDeparture = Math.round((marginAtDep / 30.4375) * 10) / 10;
      if (marginAtDep < marginDays) { flagged = true; if (severity !== "expired") severity = marginAtDep < 0 ? "critical" : "warning"; }
    } else {
      // no departure date yet → flag only if the passport is already inside the margin window
      if (daysToExpiry < marginDays) flagged = true;
    }
    if (!flagged) continue;

    alerts.push({
      bookingId: b.id, bookingNo: b.bookingNo, branchName: bmap.get(b.branchId)?.name ?? null, serviceType: b.serviceType,
      departureDate: dOnly(b.departureDate),
      travelerId: t.id, travelerName: t.name, passportNo: t.passportNo ?? null, passportExpiry: dOnly(exp),
      daysToExpiry, monthsValidAtDeparture, severity,
    });
  }
  // most urgent first: expired, then soonest expiry
  const rank = { expired: 0, critical: 1, warning: 2 };
  alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || (a.daysToExpiry ?? 0) - (b.daysToExpiry ?? 0));
  return { data: alerts };
}

// ── shared: friendly duplicate-key error ─────────────────────────────────────
function mapDup(detail: string) {
  return (e: unknown): never => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "Duplicate", { detail });
    throw e;
  };
}
