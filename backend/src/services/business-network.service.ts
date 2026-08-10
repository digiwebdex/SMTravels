/**
 * Business Network (Module 3) service — Companies We Work With. CRUD + search/filter/
 * pagination over BusinessPartner. Archive = soft delete (deletedAt). No financial
 * postings; this is a relationship directory.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  BusinessPartnerCreateInput, BusinessPartnerUpdateInput, BusinessPartnerListQuery, BusinessPartnerDto,
} from "../contracts/business-network.contract";

type Row = {
  id: string; code: string; name: string; type: string | null; industry: string | null;
  country: string | null; address: string | null; contactPerson: string | null;
  phone: string | null; whatsapp: string | null; email: string | null; website: string | null;
  services: string | null; contractRef: string | null; status: string; notes: string | null;
  createdAt: Date;
};

function toDto(p: Row): BusinessPartnerDto {
  return {
    id: p.id, code: p.code, name: p.name, type: p.type, industry: p.industry, country: p.country,
    address: p.address, contactPerson: p.contactPerson, phone: p.phone, whatsapp: p.whatsapp,
    email: p.email, website: p.website, services: p.services, contractRef: p.contractRef,
    status: p.status, notes: p.notes, createdAt: p.createdAt.toISOString(),
  };
}

function cleanData(input: BusinessPartnerCreateInput | BusinessPartnerUpdateInput) {
  const d: Record<string, string | null> = {};
  const keys = ["type", "industry", "country", "address", "contactPerson", "phone", "whatsapp", "email", "website", "services", "contractRef", "notes"] as const;
  for (const k of keys) if (k in input) d[k] = (input as Record<string, string | undefined>)[k]?.trim() || null;
  return d;
}

export async function listBusinessPartners(_auth: AuthCtx, q: BusinessPartnerListQuery) {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 20;
  const where: Prisma.BusinessPartnerWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status } : {}),
    ...(q.type ? { type: q.type } : {}),
    ...(q.q
      ? {
          OR: [
            { name: { contains: q.q, mode: "insensitive" } },
            { code: { contains: q.q, mode: "insensitive" } },
            { contactPerson: { contains: q.q, mode: "insensitive" } },
            { country: { contains: q.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.businessPartner.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.businessPartner.count({ where }),
  ]);
  return { items: (items as Row[]).map(toDto), total, page, pageSize };
}

export async function getBusinessPartner(_auth: AuthCtx, id: string) {
  const p = await prisma.businessPartner.findFirst({ where: { id, deletedAt: null } });
  if (!p) throw new HttpError(404, "NotFound");
  return toDto(p as Row);
}

export async function createBusinessPartner(auth: AuthCtx, input: BusinessPartnerCreateInput) {
  const p = await prisma.$transaction(async (tx) => {
    const n = await tx.businessPartner.count();
    return tx.businessPartner.create({
      data: {
        code: `BP-${String(n + 1).padStart(4, "0")}`,
        name: input.name.trim(),
        status: input.status ?? "ACTIVE",
        createdById: auth.userId,
        ...cleanData(input),
      },
    });
  });
  return toDto(p as Row);
}

export async function updateBusinessPartner(_auth: AuthCtx, id: string, input: BusinessPartnerUpdateInput) {
  const existing = await prisma.businessPartner.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  const p = await prisma.businessPartner.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...cleanData(input),
    },
  });
  return toDto(p as Row);
}

export async function archiveBusinessPartner(_auth: AuthCtx, id: string) {
  const existing = await prisma.businessPartner.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.businessPartner.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  return { ok: true };
}
