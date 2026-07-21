import { Prisma, type ServiceType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import type { ServiceCreateInput, ServiceUpdateInput, ServiceDto, ServiceListResponse } from "../contracts/catalog.contract";

// Services are catalog config — company-wide, RBAC only (no branch scoping).
type SvcRow = Prisma.ServiceGetPayload<{ include: { _count: { select: { packages: true } } } }>;
function toDto(s: SvcRow): ServiceDto {
  return {
    id: s.id, key: s.key, type: s.type as ServiceDto["type"], name: s.name, category: s.category, description: s.description,
    icon: s.icon, color: s.color, refPrefix: s.refPrefix, maxGroupSize: s.maxGroupSize, minLeadTimeDays: s.minLeadTimeDays,
    showOnWebsite: s.showOnWebsite, allowDirectBooking: s.allowDirectBooking, requireApproval: s.requireApproval,
    enableAgentCommission: s.enableAgentCommission, active: s.active, featured: s.featured, packagesCount: s._count.packages,
  };
}

export async function listServices(_auth: AuthCtx): Promise<ServiceListResponse> {
  const rows = await prisma.service.findMany({ where: { deletedAt: null }, include: { _count: { select: { packages: true } } }, orderBy: { createdAt: "asc" } });
  return { data: rows.map(toDto) };
}

export async function getService(_auth: AuthCtx, id: string): Promise<ServiceDto> {
  const s = await prisma.service.findFirst({ where: { OR: [{ id }, { key: id }], deletedAt: null }, include: { _count: { select: { packages: true } } } });
  if (!s) throw new HttpError(404, "NotFound");
  return toDto(s);
}

export async function updateService(auth: AuthCtx, id: string, input: ServiceUpdateInput): Promise<ServiceDto> {
  const existing = await prisma.service.findFirst({ where: { OR: [{ id }, { key: id }], deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  const data: Prisma.ServiceUpdateInput = {};
  for (const k of ["name", "category", "description", "icon", "color", "refPrefix", "maxGroupSize", "minLeadTimeDays", "showOnWebsite", "allowDirectBooking", "requireApproval", "enableAgentCommission", "active", "featured"] as const) {
    if (input[k] !== undefined) (data as Record<string, unknown>)[k] = input[k];
  }
  if (input.type !== undefined) data.type = input.type as ServiceType;
  await prisma.service.update({ where: { id: existing.id }, data });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "SERVICE_UPDATED", target: existing.id, module: "packages" } });
  return getService(auth, existing.id);
}

export async function createService(auth: AuthCtx, input: ServiceCreateInput): Promise<ServiceDto> {
  let id: string;
  try {
    const s = await prisma.service.create({
      data: {
        key: input.key, type: input.type as ServiceType, name: input.name, category: input.category, description: input.description,
        icon: input.icon, color: input.color, refPrefix: input.refPrefix, maxGroupSize: input.maxGroupSize, minLeadTimeDays: input.minLeadTimeDays,
        showOnWebsite: input.showOnWebsite ?? true, allowDirectBooking: input.allowDirectBooking ?? true, requireApproval: input.requireApproval ?? false,
        enableAgentCommission: input.enableAgentCommission ?? true, active: input.active ?? true, featured: input.featured ?? false,
      },
    });
    id = s.id;
  } catch (err) { mapUniqueError(err); }
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "SERVICE_CREATED", target: id!, module: "packages" } });
  return getService(auth, id!);
}
