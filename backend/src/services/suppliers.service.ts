/**
 * Suppliers (vendor) ADMIN service. Admin view + CRUD over the existing Supplier
 * models. Supplier / service / invoice are GLOBAL master data; PAYABLES are
 * branch-scoped via SupplierPayable.branchId — so a branch user sees every
 * supplier but only their own branch's outstanding.
 *
 * Writes: supplier + service master data only. The payable schedule is READ-ONLY
 * (no paidAmount/payment writes) — payments run through payment.service (Finance).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { branchWhere, isGlobalRole, type AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { allocateSequence } from "../lib/sequence";
import type {
  SupplierListQuery, SupplierCreateInput, SupplierUpdateInput,
  SupplierServiceCreateInput, SupplierServiceUpdateInput,
  SupplierListItem, SupplierListResponse, SupplierDetail,
} from "../contracts/suppliers.contract";

const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : Number(d));
const round2 = (n: number) => Math.round(n * 100) / 100;
const dIso = (d: Date | null): string => (d ? d.toISOString() : "");
const dOnly = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);

/** Which branch the payable figures are scoped to. Global roles → the requested
 *  branch or all; scoped roles → their own branch (bare scalar on SupplierPayable). */
function payableWhere(auth: AuthCtx, requestedBranch?: string): Prisma.SupplierPayableWhereInput {
  const w: Prisma.SupplierPayableWhereInput = { deletedAt: null, ...branchWhere(auth) };
  if (requestedBranch && requestedBranch !== "all" && isGlobalRole(auth.role)) w.branchId = requestedBranch;
  return w;
}
function branchScopeLabel(auth: AuthCtx, requestedBranch?: string): string | null {
  if (!isGlobalRole(auth.role)) return auth.branchId ?? null;
  return requestedBranch && requestedBranch !== "all" ? requestedBranch : null;
}

const SUPPLIER_SELECT = {
  id: true, supplierCode: true, name: true, category: true, contactPerson: true,
  phone: true, email: true, status: true, rating: true, createdAt: true,
} satisfies Prisma.SupplierSelect;

export async function listSuppliers(auth: AuthCtx, q: SupplierListQuery): Promise<SupplierListResponse> {
  const where: Prisma.SupplierWhereInput = { deletedAt: null };
  if (q.status) where.status = q.status;
  if (q.category) where.category = { contains: q.category, mode: "insensitive" };
  if (q.q) where.OR = [
    { name: { contains: q.q, mode: "insensitive" } },
    { supplierCode: { contains: q.q, mode: "insensitive" } },
    { contactPerson: { contains: q.q, mode: "insensitive" } },
    { phone: { contains: q.q } },
    { email: { contains: q.q, mode: "insensitive" } },
  ];

  const suppliers = await prisma.supplier.findMany({ where, select: SUPPLIER_SELECT, orderBy: { createdAt: "desc" } });
  const ids = suppliers.map((s) => s.id);

  const [serviceCounts, invoiceAgg, payables] = await Promise.all([
    prisma.supplierService.groupBy({ by: ["supplierId"], where: { supplierId: { in: ids }, deletedAt: null }, _count: { _all: true } }),
    prisma.supplierInvoice.groupBy({ by: ["supplierId"], where: { supplierId: { in: ids }, deletedAt: null }, _sum: { amount: true }, _count: { _all: true } }),
    // branch-scoped payables — per-row floor to match the Finance/portal outstanding formula
    prisma.supplierPayable.findMany({ where: { supplierId: { in: ids }, ...payableWhere(auth, q.branchId) }, select: { supplierId: true, amount: true, paidAmount: true } }),
  ]);

  const svcBy = new Map(serviceCounts.map((s) => [s.supplierId, s._count._all]));
  const invCountBy = new Map(invoiceAgg.map((i) => [i.supplierId, i._count._all]));
  const invSumBy = new Map(invoiceAgg.map((i) => [i.supplierId, num(i._sum.amount)]));
  const outBy = new Map<string, number>(), payCountBy = new Map<string, number>();
  for (const p of payables) {
    outBy.set(p.supplierId, (outBy.get(p.supplierId) ?? 0) + Math.max(0, num(p.amount) - num(p.paidAmount)));
    payCountBy.set(p.supplierId, (payCountBy.get(p.supplierId) ?? 0) + 1);
  }

  const data: SupplierListItem[] = suppliers.map((s) => ({
    id: s.id, supplierCode: s.supplierCode, name: s.name, category: s.category,
    contactPerson: s.contactPerson, phone: s.phone, email: s.email, status: s.status,
    rating: s.rating == null ? null : num(s.rating),
    servicesCount: svcBy.get(s.id) ?? 0,
    invoicesCount: invCountBy.get(s.id) ?? 0,
    totalInvoiced: round2(invSumBy.get(s.id) ?? 0),
    payablesCount: payCountBy.get(s.id) ?? 0,
    outstanding: round2(outBy.get(s.id) ?? 0),
    createdAt: dIso(s.createdAt),
  }));

  const byStatus: Record<string, number> = {};
  for (const s of suppliers) byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
  return {
    data,
    branchScope: branchScopeLabel(auth, q.branchId),
    stats: {
      total: suppliers.length,
      byStatus,
      totalOutstanding: round2(data.reduce((a, s) => a + s.outstanding, 0)),
      totalInvoiced: round2(data.reduce((a, s) => a + s.totalInvoiced, 0)),
    },
  };
}

export async function getSupplier(auth: AuthCtx, id: string, requestedBranch?: string): Promise<SupplierDetail> {
  const s = await prisma.supplier.findFirst({ where: { id, deletedAt: null } });
  if (!s) throw new HttpError(404, "NotFound");

  const [services, invoices, payables] = await Promise.all([
    prisma.supplierService.findMany({ where: { supplierId: id, deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.supplierInvoice.findMany({ where: { supplierId: id, deletedAt: null }, orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }] }),
    prisma.supplierPayable.findMany({ where: { supplierId: id, ...payableWhere(auth, requestedBranch) }, orderBy: { dueDate: "asc" } }),
  ]);

  const outstanding = payables.reduce((a, p) => a + Math.max(0, num(p.amount) - num(p.paidAmount)), 0);
  const totalInvoiced = invoices.reduce((a, v) => a + num(v.amount), 0);

  return {
    id: s.id, supplierCode: s.supplierCode, name: s.name, category: s.category,
    contactPerson: s.contactPerson, phone: s.phone, email: s.email, status: s.status,
    rating: s.rating == null ? null : num(s.rating),
    servicesCount: services.length, invoicesCount: invoices.length,
    totalInvoiced: round2(totalInvoiced), payablesCount: payables.length,
    outstanding: round2(outstanding), createdAt: dIso(s.createdAt),
    website: s.website, tradeLicense: s.tradeLicense, tin: s.tin, address: s.address,
    bankName: s.bankName, accountNo: s.accountNo, routingNo: s.routingNo,
    services: services.map((v) => ({ id: v.id, name: v.name, category: v.category, price: v.price == null ? null : num(v.price), currency: v.currency, priceLabel: v.priceLabel, active: v.active, bookingsCount: v.bookingsCount, rating: v.rating == null ? null : num(v.rating) })),
    invoices: invoices.map((v) => ({ id: v.id, invoiceNo: v.invoiceNo, description: v.description, amount: num(v.amount), currency: v.currency, status: v.status, issueDate: dOnly(v.issueDate), dueDate: dOnly(v.dueDate) })),
    payables: payables.map((p) => ({ id: p.id, branchId: p.branchId, supplierInvoiceId: p.supplierInvoiceId, amount: num(p.amount), paidAmount: num(p.paidAmount), dueAmount: round2(Math.max(0, num(p.amount) - num(p.paidAmount))), currency: p.currency, status: p.status, dueDate: dOnly(p.dueDate), createdAt: dIso(p.createdAt) })),
  };
}

// ── supplier master CRUD ────────────────────────────────────────────────────
export async function createSupplier(auth: AuthCtx, input: SupplierCreateInput): Promise<SupplierDetail> {
  const id = await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "SUPPLIER", "GLOBAL", 0);
    const s = await tx.supplier.create({
      data: {
        supplierCode: `SUP-${String(seq).padStart(4, "0")}`,
        name: input.name, category: input.category ?? null, contactPerson: input.contactPerson ?? null,
        phone: input.phone ?? null, email: input.email ?? null, website: input.website ?? null,
        tradeLicense: input.tradeLicense ?? null, tin: input.tin ?? null, address: input.address ?? null,
        bankName: input.bankName ?? null, accountNo: input.accountNo ?? null, routingNo: input.routingNo ?? null,
        rating: input.rating ?? null, status: input.status ?? "PENDING",
      },
    });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "SUPPLIER_CREATED", target: s.id, module: "suppliers" } });
    return s.id;
  });
  return getSupplier(auth, id);
}

export async function updateSupplier(auth: AuthCtx, id: string, input: SupplierUpdateInput): Promise<SupplierDetail> {
  const existing = await prisma.supplier.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.$transaction(async (tx) => {
    await tx.supplier.update({
      where: { id },
      data: {
        name: input.name, category: input.category, contactPerson: input.contactPerson,
        phone: input.phone, email: input.email, website: input.website,
        tradeLicense: input.tradeLicense, tin: input.tin, address: input.address,
        bankName: input.bankName, accountNo: input.accountNo, routingNo: input.routingNo,
        rating: input.rating, status: input.status,
      },
    });
    await tx.activityLog.create({ data: { userId: auth.userId, action: "SUPPLIER_UPDATED", target: id, module: "suppliers" } });
  });
  return getSupplier(auth, id);
}

// ── service master CRUD ──────────────────────────────────────────────────────
export async function createSupplierService(auth: AuthCtx, supplierId: string, input: SupplierServiceCreateInput): Promise<SupplierDetail> {
  const sup = await prisma.supplier.findFirst({ where: { id: supplierId, deletedAt: null }, select: { id: true } });
  if (!sup) throw new HttpError(404, "NotFound");
  await prisma.supplierService.create({
    data: { supplierId, name: input.name, category: input.category ?? null, price: input.price ?? null, currency: input.currency ?? "BDT", priceLabel: input.priceLabel ?? null, active: input.active ?? true },
  });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "SUPPLIER_SERVICE_CREATED", target: supplierId, module: "suppliers" } });
  return getSupplier(auth, supplierId);
}

export async function updateSupplierService(auth: AuthCtx, serviceId: string, input: SupplierServiceUpdateInput): Promise<SupplierDetail> {
  const svc = await prisma.supplierService.findFirst({ where: { id: serviceId, deletedAt: null }, select: { supplierId: true } });
  if (!svc) throw new HttpError(404, "NotFound");
  await prisma.supplierService.update({
    where: { id: serviceId },
    data: { name: input.name, category: input.category, price: input.price, currency: input.currency, priceLabel: input.priceLabel, active: input.active },
  });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "SUPPLIER_SERVICE_UPDATED", target: serviceId, module: "suppliers" } });
  return getSupplier(auth, svc.supplierId);
}

/** Soft-delete a service (deletedAt) — editing a supplier's service list. */
export async function deleteSupplierService(auth: AuthCtx, serviceId: string): Promise<SupplierDetail> {
  const svc = await prisma.supplierService.findFirst({ where: { id: serviceId, deletedAt: null }, select: { supplierId: true } });
  if (!svc) throw new HttpError(404, "NotFound");
  await prisma.supplierService.update({ where: { id: serviceId }, data: { deletedAt: new Date() } });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "SUPPLIER_SERVICE_DELETED", target: serviceId, module: "suppliers" } });
  return getSupplier(auth, svc.supplierId);
}
