import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, resolveBranchId, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import type {
  CustomerCreateInput, CustomerUpdateInput, CustomerListQuery,
  CustomerListItem, CustomerListResponse, CustomerProfile,
} from "../contracts/crm.contract";

const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const num = (v: Prisma.Decimal | number | null | undefined): number => (v == null ? 0 : typeof v === "number" ? v : Number(v));
function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

type CustomerRow = Prisma.CustomerGetPayload<{
  include: {
    branch: { select: { name: true } };
    corporate: { select: { id: true } };
    _count: { select: { bookings: true } };
  };
}>;

function toListItem(c: CustomerRow): CustomerListItem {
  return {
    id: c.id, name: c.name, phone: c.phone, email: c.email,
    type: c.corporate ? "CORPORATE" : c.type,
    district: c.district, division: c.division, rating: c.rating,
    branchId: c.branchId, branchName: c.branch?.name ?? null,
    bookingsCount: c._count.bookings, createdAt: dIso(c.createdAt)!,
  };
}

export async function listCustomers(auth: AuthCtx, q: CustomerListQuery): Promise<CustomerListResponse> {
  const where: Prisma.CustomerWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (q.branchId && isGlobalRole(auth.role)) where.branchId = q.branchId;
  if (q.type === "CORPORATE") where.corporate = { isNot: null };
  if (q.type === "INDIVIDUAL") where.corporate = { is: null };
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { phone: { contains: q.q } },
      { email: { contains: q.q, mode: "insensitive" } },
    ];
  }
  const orderBy: Prisma.CustomerOrderByWithRelationInput = q.sort === "name" ? { name: q.dir } : { createdAt: q.dir };

  const listInclude = {
    branch: { select: { name: true } },
    corporate: { select: { id: true } },
    _count: { select: { bookings: true } },
  } as const;

  const [rows, total, corporate] = await Promise.all([
    prisma.customer.findMany({ where, include: listInclude, orderBy, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.customer.count({ where }),
    prisma.customer.count({ where: { ...where, corporate: { isNot: null } } }),
  ]);

  return {
    data: rows.map(toListItem),
    page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    stats: { total, individual: total - corporate, corporate },
  };
}

export async function getCustomer(auth: AuthCtx, id: string): Promise<CustomerProfile> {
  // direct model query → PII (nid/passportNo) is decrypted by the prisma extension
  const c = await prisma.customer.findFirst({
    where: { id, ...branchWhere(auth), deletedAt: null },
    include: {
      branch: true, corporate: true, _count: { select: { bookings: true } },
      bookings: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, bookingNo: true, serviceType: true, status: true, amount: true, createdAt: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!c) throw new HttpError(404, "NotFound");

  const activity = await prisma.activityLog.findMany({ where: { target: id }, orderBy: { createdAt: "desc" }, take: 30 });

  return {
    ...toListItem(c as unknown as CustomerRow),
    addressLine: c.addressLine, country: c.country, dob: dOnly(c.dob),
    nid: c.nid ?? null, passportNo: c.passportNo ?? null,
    isCorporate: !!c.corporate,
    bookings: c.bookings.map((b) => ({ id: b.id, bookingNo: b.bookingNo, serviceType: b.serviceType, status: b.status, amount: num(b.amount), createdAt: dIso(b.createdAt)! })),
    notes: c.notes.map((n) => ({ id: n.id, body: n.body, author: n.author?.name ?? null, createdAt: dIso(n.createdAt)! })),
    activity: activity.map((a) => ({ id: a.id, action: a.action, createdAt: dIso(a.createdAt)! })),
  };
}

export async function createCustomer(auth: AuthCtx, input: CustomerCreateInput): Promise<CustomerProfile> {
  const branchId = resolveBranchId(auth, input.branchId);
  const dup = await prisma.customer.findFirst({ where: { phone: input.phone, deletedAt: null }, select: { id: true } });
  if (dup) throw new HttpError(409, "DuplicatePhone", { detail: "A customer with this phone number already exists." });

  let id: string;
  try {
    const c = await prisma.customer.create({
      data: {
        branchId, type: input.type ?? "INDIVIDUAL", name: input.name, phone: input.phone, email: input.email || null,
        dob: toDate(input.dob), addressLine: input.addressLine, district: input.district, division: input.division,
        country: input.country || "Bangladesh", rating: input.rating,
        nid: input.nid || null, passportNo: input.passportNo || null, // PII: auto-encrypted
        createdById: auth.userId,
      },
    });
    id = c.id;
  } catch (err) {
    mapUniqueError(err);
  }
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "CUSTOMER_CREATED", target: id!, module: "crm" } });
  return getCustomer(auth, id!);
}

export async function updateCustomer(auth: AuthCtx, id: string, input: CustomerUpdateInput): Promise<CustomerProfile> {
  const existing = await prisma.customer.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  const data: Prisma.CustomerUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.email !== undefined) data.email = input.email || null;
  if (input.type !== undefined) data.type = input.type;
  if (input.dob !== undefined) data.dob = toDate(input.dob);
  if (input.addressLine !== undefined) data.addressLine = input.addressLine;
  if (input.district !== undefined) data.district = input.district;
  if (input.division !== undefined) data.division = input.division;
  if (input.country !== undefined) data.country = input.country;
  if (input.rating !== undefined) data.rating = input.rating;
  if (input.nid !== undefined) data.nid = input.nid || null;
  if (input.passportNo !== undefined) data.passportNo = input.passportNo || null;
  try {
    await prisma.customer.update({ where: { id }, data });
  } catch (err) {
    mapUniqueError(err);
  }
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "CUSTOMER_UPDATED", target: id, module: "crm" } });
  return getCustomer(auth, id);
}

export async function deleteCustomer(auth: AuthCtx, id: string): Promise<void> {
  const c = await prisma.customer.findFirst({ where: { id, ...branchWhere(auth), deletedAt: null }, select: { id: true, _count: { select: { bookings: true } } } });
  if (!c) throw new HttpError(404, "NotFound");
  if (c._count.bookings > 0) throw new HttpError(409, "CustomerHasBookings", { detail: "Cannot delete a customer with bookings." });
  await prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
}
