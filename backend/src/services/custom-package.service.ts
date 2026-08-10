/**
 * Custom Package Builder (Module 7) service. Inquiry → CustomPackage(+items) → Quote
 * → Accept → Booking. All pricing is server-computed; totals are snapshots (never
 * recomputed from live exchange rates). Reuses Customer + Booking + Currency/ExchangeRate.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  InquiryCreateInput, InquiryUpdateInput, InquiryListQuery, InquiryTransitionInput, InquiryDto,
  PackageCreateInput, PackageUpdateInput, PackageListQuery, PackageTransitionInput,
  ItemCreateInput, ItemUpdateInput, CustomPackageDto, CustomPackageItemDto,
} from "../contracts/custom-package.contract";

/* eslint-disable @typescript-eslint/no-explicit-any */
const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => Number(v ?? 0);
const dstr = (d: unknown) => (d ? (d as Date).toISOString().slice(0, 10) : null);
const dnew = (s?: string) => (s ? new Date(s) : null);
const SERVICE_TYPES = ["HAJJ", "UMRAH", "VISA", "AIR_TICKET", "MANPOWER", "TOUR", "HOTEL"];

// ─── Inquiry ─────────────────────────────────────────────────────────────────
const INQUIRY_TRANSITIONS: Record<string, string[]> = {
  NEW: ["REVIEWING", "CANCELLED"], REVIEWING: ["PACKAGE_BUILDING", "CANCELLED"], PACKAGE_BUILDING: ["QUOTED", "CANCELLED"],
  QUOTED: ["APPROVED", "CANCELLED"], APPROVED: ["BOOKED", "CANCELLED"], BOOKED: [], CANCELLED: ["NEW"],
};
const INQ_STR = ["contactPhone", "contactEmail", "travelType", "destination", "preferredHotel", "roomRequirements", "flightPreference", "specialRequirements", "notes"] as const;
const INQ_INT = ["adults", "children", "infants", "hotelNights"] as const;
const INQ_BOOL = ["visaRequired", "transportRequired", "foodRequired", "ziyaratRequired", "muallimRequired"] as const;
function toInquiry(i: any): InquiryDto {
  const o: any = { id: i.id, code: i.code, customerId: i.customerId, contactName: i.contactName, status: i.status, customPackageId: i.customPackageId, createdAt: i.createdAt.toISOString(), departureDate: dstr(i.departureDate), returnDate: dstr(i.returnDate) };
  for (const k of INQ_STR) o[k] = i[k];
  for (const k of INQ_INT) o[k] = i[k];
  for (const k of INQ_BOOL) o[k] = i[k];
  return o;
}
function inqData(input: any) {
  const d: any = {};
  for (const k of INQ_STR) if (k in input) d[k] = input[k]?.trim() || null;
  for (const k of INQ_INT) if (k in input && input[k] !== undefined) d[k] = input[k];
  for (const k of INQ_BOOL) if (k in input && input[k] !== undefined) d[k] = input[k];
  if ("departureDate" in input) d.departureDate = dnew(input.departureDate);
  if ("returnDate" in input) d.returnDate = dnew(input.returnDate);
  if ("customerId" in input) d.customerId = input.customerId || null;
  return d;
}

export async function listInquiries(_auth: AuthCtx, q: InquiryListQuery) {
  const p = q.page ?? 1, ps = q.pageSize ?? 20;
  const where: Prisma.PackageInquiryWhereInput = { deletedAt: null, ...(q.status ? { status: q.status } : {}), ...(q.q ? { OR: [{ contactName: { contains: q.q, mode: "insensitive" } }, { code: { contains: q.q, mode: "insensitive" } }, { destination: { contains: q.q, mode: "insensitive" } }] } : {}) };
  const [items, total] = await prisma.$transaction([prisma.packageInquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (p - 1) * ps, take: ps }), prisma.packageInquiry.count({ where })]);
  return { items: items.map(toInquiry), total, page: p, pageSize: ps };
}
export async function createInquiry(auth: AuthCtx, input: InquiryCreateInput) {
  const i = await prisma.$transaction(async (tx) => {
    const n = await tx.packageInquiry.count();
    return tx.packageInquiry.create({ data: { code: `INQ-${String(n + 1).padStart(5, "0")}`, contactName: input.contactName.trim(), status: "NEW", createdById: auth.userId, ...inqData(input) } });
  });
  return toInquiry(i);
}
export async function updateInquiry(_auth: AuthCtx, id: string, input: InquiryUpdateInput) {
  const cur = await prisma.packageInquiry.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  const i = await prisma.packageInquiry.update({ where: { id }, data: { ...(input.contactName ? { contactName: input.contactName.trim() } : {}), ...inqData(input) } });
  return toInquiry(i);
}
export async function transitionInquiry(_auth: AuthCtx, id: string, input: InquiryTransitionInput) {
  const cur = await prisma.packageInquiry.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  if (!(INQUIRY_TRANSITIONS[cur.status] ?? []).includes(input.status)) throw new HttpError(400, "InvalidTransition", { message: `Cannot move inquiry from ${cur.status} to ${input.status}.` });
  const i = await prisma.packageInquiry.update({ where: { id }, data: { status: input.status } });
  return toInquiry(i);
}
export async function archiveInquiry(_auth: AuthCtx, id: string) {
  const cur = await prisma.packageInquiry.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  await prisma.packageInquiry.update({ where: { id }, data: { deletedAt: new Date() } });
  return { ok: true };
}

// ─── Custom Package ──────────────────────────────────────────────────────────
const PKG_EDITABLE = ["DRAFT", "QUOTED"];
const PKG_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["QUOTED"], QUOTED: ["ACCEPTED", "REJECTED", "EXPIRED", "DRAFT"], ACCEPTED: ["BOOKED", "REJECTED"],
  REJECTED: ["DRAFT"], EXPIRED: ["DRAFT"], BOOKED: [],
};
const PKG_STR = ["travelType", "terms", "notes"] as const;

function toItem(it: any): CustomPackageItemDto {
  return { id: it.id, serviceType: it.serviceType, description: it.description, quantity: it.quantity, unitPrice: String(it.unitPrice), currency: it.currency, subtotal: String(it.subtotal), supplier: it.supplier, notes: it.notes };
}
function toPackage(p: any): CustomPackageDto {
  return {
    id: p.id, code: p.code, inquiryId: p.inquiryId, customerId: p.customerId, customerName: p.customer?.name ?? null,
    name: p.name, travelType: p.travelType, departureDate: dstr(p.departureDate), returnDate: dstr(p.returnDate),
    currency: p.currency, markup: String(p.markup), discount: String(p.discount), subtotal: String(p.subtotal),
    grandTotal: String(p.grandTotal), validityDate: dstr(p.validityDate), terms: p.terms, notes: p.notes,
    status: p.status, bookingId: p.bookingId, itemCount: p._count?.items ?? p.items?.length ?? 0, createdAt: p.createdAt.toISOString(),
  };
}
const withCust = { customer: { select: { name: true } } };

async function recomputeTotals(packageId: string) {
  const pkg = await prisma.customPackage.findUnique({ where: { id: packageId }, include: { items: true } });
  if (!pkg) return;
  const subtotal = r2(pkg.items.reduce((s, it) => s + num(it.subtotal), 0));
  const grand = r2(Math.max(0, subtotal + num(pkg.markup) - num(pkg.discount)));
  await prisma.customPackage.update({ where: { id: packageId }, data: { subtotal, grandTotal: grand } });
}
async function assertEditable(packageId: string) {
  const p = await prisma.customPackage.findFirst({ where: { id: packageId, deletedAt: null } });
  if (!p) throw new HttpError(404, "NotFound");
  if (!PKG_EDITABLE.includes(p.status)) throw new HttpError(400, "Locked", { message: `Package is ${p.status} and can no longer be edited.` });
  return p;
}

export async function listPackages(_auth: AuthCtx, q: PackageListQuery) {
  const p = q.page ?? 1, ps = q.pageSize ?? 20;
  const where: Prisma.CustomPackageWhereInput = { deletedAt: null, ...(q.status ? { status: q.status } : {}), ...(q.customerId ? { customerId: q.customerId } : {}), ...(q.q ? { OR: [{ name: { contains: q.q, mode: "insensitive" } }, { code: { contains: q.q, mode: "insensitive" } }] } : {}) };
  const [items, total] = await prisma.$transaction([prisma.customPackage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (p - 1) * ps, take: ps, include: { ...withCust, _count: { select: { items: true } } } }), prisma.customPackage.count({ where })]);
  return { items: items.map(toPackage), total, page: p, pageSize: ps };
}
export async function getPackage(_auth: AuthCtx, id: string) {
  const p = await prisma.customPackage.findFirst({ where: { id, deletedAt: null }, include: { ...withCust, items: { orderBy: { createdAt: "asc" } } } });
  if (!p) throw new HttpError(404, "NotFound");
  return { ...toPackage(p), items: p.items.map(toItem) };
}
export async function createPackage(auth: AuthCtx, input: PackageCreateInput) {
  if (input.inquiryId) {
    const inq = await prisma.packageInquiry.findFirst({ where: { id: input.inquiryId, deletedAt: null } });
    if (!inq) throw new HttpError(400, "InvalidInquiry", { message: "Inquiry not found." });
    if (inq.customPackageId) throw new HttpError(409, "AlreadyConverted", { message: "This inquiry already has a package." });
  }
  const p = await prisma.$transaction(async (tx) => {
    const n = await tx.customPackage.count();
    const created = await tx.customPackage.create({
      data: {
        code: `CP-${String(n + 1).padStart(5, "0")}`, name: input.name.trim(), inquiryId: input.inquiryId || null,
        customerId: input.customerId || null, currency: input.currency ?? "BDT", markup: input.markup ?? 0, discount: input.discount ?? 0,
        validityDate: dnew(input.validityDate), departureDate: dnew(input.departureDate), returnDate: dnew(input.returnDate),
        status: "DRAFT", createdById: auth.userId, ...Object.fromEntries(PKG_STR.filter((k) => k in input).map((k) => [k, (input as any)[k]?.trim() || null])),
      },
    });
    if (input.inquiryId) await tx.packageInquiry.update({ where: { id: input.inquiryId }, data: { customPackageId: created.id, status: "PACKAGE_BUILDING" } });
    return created;
  });
  return getPackage(auth, p.id);
}
export async function updatePackage(auth: AuthCtx, id: string, input: PackageUpdateInput) {
  await assertEditable(id);
  const cur = await prisma.customPackage.findUnique({ where: { id }, include: { items: true } });
  const subtotal = num(cur!.subtotal);
  const markup = input.markup ?? num(cur!.markup);
  const discount = input.discount ?? num(cur!.discount);
  if (discount > subtotal + markup) throw new HttpError(400, "DiscountTooHigh", { message: "Discount cannot exceed subtotal + markup." });
  await prisma.customPackage.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}), ...(input.currency ? { currency: input.currency } : {}),
      ...(input.markup != null ? { markup: input.markup } : {}), ...(input.discount != null ? { discount: input.discount } : {}),
      ...("departureDate" in input ? { departureDate: dnew(input.departureDate) } : {}), ...("returnDate" in input ? { returnDate: dnew(input.returnDate) } : {}),
      ...("validityDate" in input ? { validityDate: dnew(input.validityDate) } : {}),
      ...Object.fromEntries(PKG_STR.filter((k) => k in input).map((k) => [k, (input as any)[k]?.trim() || null])),
    },
  });
  await recomputeTotals(id);
  return getPackage(auth, id);
}
export async function addItem(auth: AuthCtx, packageId: string, input: ItemCreateInput) {
  const pkg = await assertEditable(packageId);
  const subtotal = r2(input.quantity * input.unitPrice);
  await prisma.customPackageItem.create({ data: { customPackageId: packageId, serviceType: input.serviceType, description: input.description?.trim() || null, quantity: input.quantity, unitPrice: input.unitPrice, currency: input.currency ?? pkg.currency, subtotal, supplier: input.supplier?.trim() || null, notes: input.notes?.trim() || null } });
  await recomputeTotals(packageId);
  return getPackage(auth, packageId);
}
export async function updateItem(auth: AuthCtx, itemId: string, input: ItemUpdateInput) {
  const it = await prisma.customPackageItem.findUnique({ where: { id: itemId } });
  if (!it) throw new HttpError(404, "NotFound");
  await assertEditable(it.customPackageId);
  const quantity = input.quantity ?? it.quantity;
  const unitPrice = input.unitPrice ?? num(it.unitPrice);
  await prisma.customPackageItem.update({ where: { id: itemId }, data: { ...(input.serviceType ? { serviceType: input.serviceType } : {}), ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}), quantity, unitPrice, subtotal: r2(quantity * unitPrice), ...(input.currency ? { currency: input.currency } : {}), ...(input.supplier !== undefined ? { supplier: input.supplier?.trim() || null } : {}), ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}) } });
  await recomputeTotals(it.customPackageId);
  return getPackage(auth, it.customPackageId);
}
export async function removeItem(auth: AuthCtx, itemId: string) {
  const it = await prisma.customPackageItem.findUnique({ where: { id: itemId } });
  if (!it) throw new HttpError(404, "NotFound");
  await assertEditable(it.customPackageId);
  await prisma.customPackageItem.delete({ where: { id: itemId } });
  await recomputeTotals(it.customPackageId);
  return getPackage(auth, it.customPackageId);
}
export async function transitionPackage(auth: AuthCtx, id: string, input: PackageTransitionInput) {
  const cur = await prisma.customPackage.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  if (input.status === "BOOKED") throw new HttpError(400, "UseConvert", { message: "Use the convert-to-booking action to book an accepted package." });
  if (!(PKG_TRANSITIONS[cur.status] ?? []).includes(input.status)) throw new HttpError(400, "InvalidTransition", { message: `Cannot move package from ${cur.status} to ${input.status}.` });
  await prisma.customPackage.update({ where: { id }, data: { status: input.status, ...(input.status === "REJECTED" && input.reason ? { notes: input.reason } : {}) } });
  if (cur.inquiryId) {
    const inqStatus = input.status === "QUOTED" ? "QUOTED" : input.status === "ACCEPTED" ? "APPROVED" : null;
    if (inqStatus) await prisma.packageInquiry.update({ where: { id: cur.inquiryId }, data: { status: inqStatus } }).catch(() => undefined);
  }
  return getPackage(auth, id);
}
export async function convertToBooking(auth: AuthCtx, id: string) {
  const pkg = await prisma.customPackage.findFirst({ where: { id, deletedAt: null } });
  if (!pkg) throw new HttpError(404, "NotFound");
  if (pkg.status !== "ACCEPTED") throw new HttpError(400, "NotAccepted", { message: "Only ACCEPTED packages can be converted to a booking." });
  if (pkg.bookingId) throw new HttpError(409, "AlreadyBooked", { message: "This package is already booked." });
  const branchId = auth.branchId ?? (await prisma.branch.findFirst({ where: { isHq: true }, select: { id: true } }))?.id ?? (await prisma.branch.findFirst({ select: { id: true } }))?.id;
  if (!branchId) throw new HttpError(400, "NoBranch", { message: "No branch available for the booking." });
  const serviceType = SERVICE_TYPES.includes((pkg.travelType ?? "").toUpperCase()) ? (pkg.travelType as string).toUpperCase() : "TOUR";
  const rateRow = pkg.currency === "BDT" ? null : await prisma.exchangeRate.findFirst({ where: { currency: pkg.currency, active: true, deletedAt: null }, orderBy: { effectiveDate: "desc" } });
  const exchangeRate = pkg.currency === "BDT" ? 1 : rateRow ? num(rateRow.rate) : 1;
  const amount = num(pkg.grandTotal);
  const booking = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.create({
      data: {
        branchId, serviceType: serviceType as any, customerId: pkg.customerId, currency: pkg.currency, exchangeRate,
        amount, baseAmount: r2(amount * exchangeRate), status: "DRAFT",
        notes: `Custom package ${pkg.code}: ${pkg.name}`,
      } as any,
    });
    await tx.customPackage.update({ where: { id }, data: { status: "BOOKED", bookingId: b.id } });
    if (pkg.inquiryId) await tx.packageInquiry.update({ where: { id: pkg.inquiryId }, data: { status: "BOOKED" } });
    return b;
  });
  return { ...(await getPackage(auth, id)), bookingId: booking.id };
}
export async function archivePackage(_auth: AuthCtx, id: string) {
  const cur = await prisma.customPackage.findFirst({ where: { id, deletedAt: null } });
  if (!cur) throw new HttpError(404, "NotFound");
  await prisma.customPackage.update({ where: { id }, data: { deletedAt: new Date() } });
  return { ok: true };
}
