import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import type { AuthCtx } from "../middleware/auth";
import type {
  SupplierListQuery, SupplierCreateInput, SupplierUpdateInput,
  SupplierListItem, SupplierListResponse,
} from "../contracts/settings.contract";

const dIso = (d: Date): string => d.toISOString();

function toItem(
  s: Prisma.SupplierGetPayload<{ include: { _count: { select: { services: true } } } }>,
): SupplierListItem {
  return {
    id: s.id, supplierCode: s.supplierCode, name: s.name, category: s.category,
    contactPerson: s.contactPerson, phone: s.phone, email: s.email,
    status: s.status, servicesCount: s._count.services, createdAt: dIso(s.createdAt),
  };
}

/** Suppliers are company-wide (no branchId on model); RBAC gates access. */
export async function listSuppliers(_auth: AuthCtx, q: SupplierListQuery): Promise<SupplierListResponse> {
  const where: Prisma.SupplierWhereInput = { deletedAt: null };
  if (q.status && q.status !== "all") where.status = q.status as Prisma.EnumSupplierStatusFilter["equals"];
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { supplierCode: { contains: q.q, mode: "insensitive" } },
      { category: { contains: q.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: { _count: { select: { services: { where: { deletedAt: null } } } } },
      orderBy: { name: "asc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return {
    data: rows.map(toItem),
    page: q.page, pageSize: q.pageSize, total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

async function nextSupplierCode(name: string): Promise<string> {
  const base = "SUP-" + name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || "NEW";
  let code = base;
  let n = 1;
  while (await prisma.supplier.findFirst({ where: { supplierCode: code, deletedAt: null } })) {
    code = `${base}-${++n}`;
  }
  return code;
}

export async function createSupplier(_auth: AuthCtx, input: SupplierCreateInput): Promise<SupplierListItem> {
  const supplierCode = input.supplierCode?.trim() || await nextSupplierCode(input.name);
  try {
    const s = await prisma.supplier.create({
      data: {
        supplierCode,
        name: input.name,
        category: input.category ?? null,
        contactPerson: input.contactPerson ?? null,
        phone: input.phone ?? null,
        email: input.email || null,
        website: input.website ?? null,
        address: input.address ?? null,
        status: "VERIFIED",
      },
      include: { _count: { select: { services: true } } },
    });
    return toItem(s);
  } catch (err) {
    mapUniqueError(err);
  }
}

export async function updateSupplier(_auth: AuthCtx, id: string, input: SupplierUpdateInput): Promise<SupplierListItem> {
  const existing = await prisma.supplier.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");

  const data: Prisma.SupplierUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.category !== undefined) data.category = input.category;
  if (input.contactPerson !== undefined) data.contactPerson = input.contactPerson;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.email !== undefined) data.email = input.email || null;
  if (input.website !== undefined) data.website = input.website;
  if (input.address !== undefined) data.address = input.address;
  if (input.status !== undefined) data.status = input.status;

  try {
    const s = await prisma.supplier.update({
      where: { id },
      data,
      include: { _count: { select: { services: { where: { deletedAt: null } } } } },
    });
    return toItem(s);
  } catch (err) {
    mapUniqueError(err);
  }
}
