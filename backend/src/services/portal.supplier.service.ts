/**
 * Supplier Portal service. Scoped by the caller's OWN supplierId (resolveOwner).
 * Every query pins to supplierId; fetch-by-id 404s cross-supplier.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthCtx, requireSupplierId } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  SupplierProfile, SupplierRequest, SupplierServiceRow, SupplierInvoiceRow,
  SupplierPayableRow, SupplierPaymentRow, SupplierDashboard, RequestStatusInput,
} from "../contracts/portal.contract";

const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : Number(d));
const iso = (d: Date): string => d.toISOString();
const dOnly = (d: Date | null | undefined): string | null => (d ? d.toISOString().slice(0, 10) : null);

export async function getProfile(auth: AuthCtx): Promise<SupplierProfile> {
  const supplierId = await requireSupplierId(auth);
  const s = await prisma.supplier.findUniqueOrThrow({ where: { id: supplierId } });
  return {
    id: s.id, supplierCode: s.supplierCode, name: s.name, category: s.category, contactPerson: s.contactPerson,
    phone: s.phone, email: s.email, website: s.website, tradeLicense: s.tradeLicense, tin: s.tin, address: s.address,
    bankName: s.bankName, accountNo: s.accountNo, rating: s.rating == null ? null : num(s.rating), status: s.status, memberSince: iso(s.createdAt),
  };
}

const toRequest = (r: { id: string; requestNo: string; serviceLabel: string | null; clientLabel: string | null; amount: Prisma.Decimal; currency: string; status: string; createdAt: Date; deadline: Date | null }): SupplierRequest => ({
  id: r.id, requestNo: r.requestNo, serviceLabel: r.serviceLabel, clientLabel: r.clientLabel, amount: num(r.amount), currency: r.currency, status: r.status, createdAt: iso(r.createdAt), deadline: r.deadline ? iso(r.deadline) : null,
});

export async function listRequests(auth: AuthCtx): Promise<SupplierRequest[]> {
  const supplierId = await requireSupplierId(auth);
  const rows = await prisma.bookingRequest.findMany({ where: { supplierId, deletedAt: null }, orderBy: { createdAt: "desc" } });
  return rows.map(toRequest);
}

export async function getRequest(auth: AuthCtx, id: string): Promise<SupplierRequest> {
  const supplierId = await requireSupplierId(auth);
  const r = await prisma.bookingRequest.findFirst({ where: { id, supplierId, deletedAt: null } });
  if (!r) throw new HttpError(404, "NotFound", { detail: "Request not found." });
  return toRequest(r);
}

/** Accept/decline an OWN booking request (404 if not owned). */
export async function setRequestStatus(auth: AuthCtx, id: string, input: RequestStatusInput): Promise<SupplierRequest> {
  const supplierId = await requireSupplierId(auth);
  const owned = await prisma.bookingRequest.findFirst({ where: { id, supplierId, deletedAt: null }, select: { id: true } });
  if (!owned) throw new HttpError(404, "NotFound", { detail: "Request not found." });
  const status = input.action === "accept" ? "CONFIRMED" : "CANCELLED";
  const r = await prisma.bookingRequest.update({ where: { id }, data: { status, notes: input.reason } });
  return toRequest(r);
}

export async function listServices(auth: AuthCtx): Promise<SupplierServiceRow[]> {
  const supplierId = await requireSupplierId(auth);
  const rows = await prisma.supplierService.findMany({ where: { supplierId, deletedAt: null }, orderBy: { createdAt: "desc" } });
  return rows.map((s) => ({ id: s.id, name: s.name, category: s.category, price: s.price == null ? null : num(s.price), active: s.active, bookingsCount: s.bookingsCount, rating: s.rating == null ? null : num(s.rating) }));
}

export async function listInvoices(auth: AuthCtx): Promise<SupplierInvoiceRow[]> {
  const supplierId = await requireSupplierId(auth);
  const rows = await prisma.supplierInvoice.findMany({ where: { supplierId, deletedAt: null }, orderBy: { issueDate: "desc" } });
  return rows.map((v) => ({ id: v.id, invoiceNo: v.invoiceNo, description: v.description, amount: num(v.amount), currency: v.currency, status: v.status, issueDate: dOnly(v.issueDate), dueDate: dOnly(v.dueDate) }));
}

export async function getInvoice(auth: AuthCtx, id: string): Promise<SupplierInvoiceRow> {
  const supplierId = await requireSupplierId(auth);
  const v = await prisma.supplierInvoice.findFirst({ where: { id, supplierId, deletedAt: null } });
  if (!v) throw new HttpError(404, "NotFound", { detail: "Invoice not found." });
  return { id: v.id, invoiceNo: v.invoiceNo, description: v.description, amount: num(v.amount), currency: v.currency, status: v.status, issueDate: dOnly(v.issueDate), dueDate: dOnly(v.dueDate) };
}

export async function listPayables(auth: AuthCtx): Promise<SupplierPayableRow[]> {
  const supplierId = await requireSupplierId(auth);
  const rows = await prisma.supplierPayable.findMany({ where: { supplierId, deletedAt: null }, orderBy: { dueDate: "asc" } });
  return rows.map((p) => { const amt = num(p.amount), paid = num(p.paidAmount); return { id: p.id, amount: amt, paidAmount: paid, dueAmount: Math.max(0, amt - paid), status: p.status, dueDate: dOnly(p.dueDate) }; });
}

export async function listPayments(auth: AuthCtx): Promise<SupplierPaymentRow[]> {
  const supplierId = await requireSupplierId(auth);
  const rows = await prisma.payment.findMany({ where: { supplierId, direction: "OUT" }, include: { receipt: { select: { receiptNo: true } } }, orderBy: { paidAt: "desc" } });
  return rows.map((p) => ({ id: p.id, receiptNo: p.receipt?.receiptNo ?? p.paymentNo, amount: num(p.amount), method: p.method, paidAt: iso(p.paidAt), status: p.status }));
}

export async function getDashboard(auth: AuthCtx): Promise<SupplierDashboard> {
  const supplierId = await requireSupplierId(auth);
  const [s, requests, serviceCount, invoices, payables] = await Promise.all([
    prisma.supplier.findUniqueOrThrow({ where: { id: supplierId }, select: { name: true, status: true, rating: true } }),
    prisma.bookingRequest.findMany({ where: { supplierId, deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.supplierService.count({ where: { supplierId, deletedAt: null } }),
    prisma.supplierInvoice.findMany({ where: { supplierId, deletedAt: null }, select: { amount: true, status: true } }),
    prisma.supplierPayable.findMany({ where: { supplierId, deletedAt: null }, select: { amount: true, paidAmount: true } }),
  ]);
  const outstanding = payables.reduce((sum, p) => sum + Math.max(0, num(p.amount) - num(p.paidAmount)), 0);
  return {
    supplierName: s.name, status: s.status, rating: s.rating == null ? null : num(s.rating),
    counts: { pendingRequests: requests.filter((r) => r.status === "PENDING").length, services: serviceCount, unpaidInvoices: invoices.filter((i) => i.status !== "paid").length },
    outstanding, totalInvoiced: invoices.reduce((sum, i) => sum + num(i.amount), 0),
    recentRequests: requests.slice(0, 4).map(toRequest),
  };
}
