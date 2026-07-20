import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, resolveBranchId, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import type {
  CorporateCreateInput, CorporateUpdateInput, CorporateListQuery,
  CorporateListItem, CorporateListResponse, CorporateProfile,
} from "../contracts/crm.contract";

const dIso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const num = (v: Prisma.Decimal | number | null | undefined): number => (v == null ? 0 : typeof v === "number" ? v : Number(v));

type CorpRow = Prisma.CorporateClientGetPayload<{ include: { customer: { include: { branch: true } } } }>;

function toListItem(c: CorpRow): CorporateListItem {
  return {
    id: c.id, companyName: c.companyName, contactPerson: c.contactPerson, tradeLicense: c.tradeLicense, tin: c.tin,
    customerId: c.customerId, name: c.customer.name, phone: c.customer.phone, email: c.customer.email,
    branchId: c.customer.branchId, branchName: c.customer.branch?.name ?? null, createdAt: dIso(c.createdAt)!,
  };
}

// Branch scoping for corporate clients is applied through the linked customer.
export async function listCorporate(auth: AuthCtx, q: CorporateListQuery): Promise<CorporateListResponse> {
  const customerWhere: Prisma.CustomerWhereInput = { ...branchWhere(auth), deletedAt: null };
  if (q.branchId) customerWhere.branchId = q.branchId;
  const where: Prisma.CorporateClientWhereInput = { deletedAt: null, customer: { is: customerWhere } };
  if (q.q) {
    where.OR = [
      { companyName: { contains: q.q, mode: "insensitive" } },
      { customer: { is: { name: { contains: q.q, mode: "insensitive" } } } },
      { customer: { is: { phone: { contains: q.q } } } },
    ];
  }
  const orderBy: Prisma.CorporateClientOrderByWithRelationInput = q.sort === "name" ? { companyName: q.dir } : { createdAt: q.dir };

  const [rows, total] = await Promise.all([
    prisma.corporateClient.findMany({ where, include: { customer: { include: { branch: true } } }, orderBy, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.corporateClient.count({ where }),
  ]);
  return { data: rows.map(toListItem), page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) };
}

export async function getCorporate(auth: AuthCtx, id: string): Promise<CorporateProfile> {
  const c = await prisma.corporateClient.findFirst({
    where: { id, deletedAt: null, customer: { is: { ...branchWhere(auth), deletedAt: null } } },
    include: {
      customer: {
        include: {
          branch: true, _count: { select: { bookings: true } },
          bookings: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, bookingNo: true, serviceType: true, status: true, amount: true, createdAt: true } },
        },
      },
    },
  });
  if (!c) throw new HttpError(404, "NotFound");
  return {
    ...toListItem(c as unknown as CorpRow),
    address: c.address,
    bookingsCount: c.customer._count.bookings,
    bookings: c.customer.bookings.map((b) => ({ id: b.id, bookingNo: b.bookingNo, serviceType: b.serviceType, status: b.status, amount: num(b.amount), createdAt: dIso(b.createdAt)! })),
  };
}

export async function createCorporate(auth: AuthCtx, input: CorporateCreateInput): Promise<CorporateProfile> {
  const branchId = resolveBranchId(auth, input.branchId);
  const dup = await prisma.customer.findFirst({ where: { phone: input.phone, deletedAt: null }, select: { id: true } });
  if (dup) throw new HttpError(409, "DuplicatePhone", { detail: "A customer with this phone number already exists." });

  let id: string;
  try {
    id = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: { branchId, type: "CORPORATE", name: input.name, phone: input.phone, email: input.email || null, createdById: auth.userId },
      });
      const corp = await tx.corporateClient.create({
        data: { customerId: customer.id, companyName: input.companyName, contactPerson: input.contactPerson, tradeLicense: input.tradeLicense, tin: input.tin, address: input.address },
      });
      await tx.activityLog.create({ data: { userId: auth.userId, action: "CORPORATE_CREATED", target: customer.id, module: "crm" } });
      return corp.id;
    });
  } catch (err) {
    mapUniqueError(err);
  }
  return getCorporate(auth, id!);
}

export async function updateCorporate(auth: AuthCtx, id: string, input: CorporateUpdateInput): Promise<CorporateProfile> {
  const existing = await prisma.corporateClient.findFirst({
    where: { id, deletedAt: null, customer: { is: { ...branchWhere(auth), deletedAt: null } } },
    select: { id: true, customerId: true },
  });
  if (!existing) throw new HttpError(404, "NotFound");

  await prisma.$transaction(async (tx) => {
    const corpData: Prisma.CorporateClientUpdateInput = {};
    if (input.companyName !== undefined) corpData.companyName = input.companyName;
    if (input.contactPerson !== undefined) corpData.contactPerson = input.contactPerson;
    if (input.tradeLicense !== undefined) corpData.tradeLicense = input.tradeLicense;
    if (input.tin !== undefined) corpData.tin = input.tin;
    if (input.address !== undefined) corpData.address = input.address;
    await tx.corporateClient.update({ where: { id }, data: corpData });

    const custData: Prisma.CustomerUpdateInput = {};
    if (input.name !== undefined) custData.name = input.name;
    if (input.phone !== undefined) custData.phone = input.phone;
    if (input.email !== undefined) custData.email = input.email || null;
    if (Object.keys(custData).length) {
      try {
        await tx.customer.update({ where: { id: existing.customerId }, data: custData });
      } catch (err) {
        mapUniqueError(err);
      }
    }
  });
  return getCorporate(auth, id);
}

export async function deleteCorporate(auth: AuthCtx, id: string): Promise<void> {
  const c = await prisma.corporateClient.findFirst({
    where: { id, deletedAt: null, customer: { is: { ...branchWhere(auth), deletedAt: null } } },
    select: { id: true, customerId: true, customer: { select: { _count: { select: { bookings: true } } } } },
  });
  if (!c) throw new HttpError(404, "NotFound");
  if (c.customer._count.bookings > 0) throw new HttpError(409, "CustomerHasBookings", { detail: "Cannot delete a corporate client with bookings." });
  await prisma.$transaction(async (tx) => {
    await tx.corporateClient.update({ where: { id }, data: { deletedAt: new Date() } });
    await tx.customer.update({ where: { id: c.customerId }, data: { deletedAt: new Date() } });
  });
}
