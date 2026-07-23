/**
 * Customer Portal service. Every function resolves the caller's OWN customerId
 * via requireCustomerId(auth) and pins the query to it. Fetch-by-id uses
 * findFirst({ where: { id, customerId } }) → a non-owned id returns null → 404.
 * The client-supplied id is only ever an ADDITIONAL filter, never the scope.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthCtx, requireCustomerId } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { allocateSequence, formatDocNo } from "../lib/sequence";
import { moveIntoStore, removeQuietly, absoluteStorePath } from "../lib/uploads";
import type {
  PortalProfile, PortalBooking, PortalBookingDetail, PortalTimelineStep,
  PortalInvoice, PortalInvoiceDetail, PortalPayment, PortalInstallmentPlan,
  PortalDocument, PortalTicket, PortalTicketDetail, PortalNotification, PortalDashboard,
  TicketCreateInput,
} from "../contracts/portal.contract";
import type { PortalDocumentUploadInput } from "../contracts/document.contract";

const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : Number(d));
const dOnly = (d: Date | null | undefined): string | null => (d ? d.toISOString().slice(0, 10) : null);
const iso = (d: Date): string => d.toISOString();

// ── profile (decrypted PII, OWNER only) ───────────────────────────────────────
export async function getProfile(auth: AuthCtx): Promise<PortalProfile> {
  const customerId = await requireCustomerId(auth);
  // Query Customer DIRECTLY so the PII extension decrypts nid/passportNo.
  const c = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    select: { id: true, name: true, phone: true, email: true, nid: true, passportNo: true, dob: true, addressLine: true, district: true, division: true, country: true, type: true, rating: true, createdAt: true },
  });
  return {
    id: c.id, name: c.name, phone: c.phone, email: c.email, nid: c.nid, passportNo: c.passportNo,
    dob: dOnly(c.dob), addressLine: c.addressLine, district: c.district, division: c.division,
    country: c.country, type: c.type, rating: c.rating, memberSince: iso(c.createdAt),
  };
}

// ── bookings ───────────────────────────────────────────────────────────────────
const toBooking = (b: { id: string; bookingNo: string | null; serviceType: string; status: string; amount: Prisma.Decimal; paidAmount: Prisma.Decimal; currency: string; departureDate: Date | null; returnDate: Date | null; createdAt: Date }): PortalBooking => {
  const amount = num(b.amount), paid = num(b.paidAmount);
  return { id: b.id, bookingNo: b.bookingNo, serviceType: b.serviceType, status: b.status, amount, paidAmount: paid, dueAmount: Math.max(0, amount - paid), currency: b.currency, departureDate: dOnly(b.departureDate), returnDate: dOnly(b.returnDate), createdAt: iso(b.createdAt) };
};

export async function listBookings(auth: AuthCtx): Promise<PortalBooking[]> {
  const customerId = await requireCustomerId(auth);
  const rows = await prisma.booking.findMany({ where: { customerId, deletedAt: null }, orderBy: { createdAt: "desc" } });
  return rows.map(toBooking);
}

function buildTimeline(status: string, createdAt: Date, departureDate: Date | null, returnDate: Date | null): PortalTimelineStep[] {
  const now = new Date();
  const confirmed = ["CONFIRMED", "PROCESSING", "COMPLETED"].includes(status);
  return [
    { label: "Booking Placed", date: dOnly(createdAt), done: true },
    { label: "Booking Confirmed", date: null, done: confirmed || status === "COMPLETED" },
    { label: "Departure", date: dOnly(departureDate), done: !!departureDate && departureDate < now },
    { label: "Return", date: dOnly(returnDate), done: !!returnDate && returnDate < now },
  ];
}

export async function getBooking(auth: AuthCtx, id: string): Promise<PortalBookingDetail> {
  const customerId = await requireCustomerId(auth);
  const b = await prisma.booking.findFirst({
    where: { id, customerId, deletedAt: null },
    include: { hajj: true, umrah: true, visa: true, invoices: { select: { invoiceNo: true }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!b) throw new HttpError(404, "NotFound", { detail: "Booking not found." });
  const detail: Record<string, string | null> = {};
  if (b.hajj) { detail["Hotel (Makkah)"] = b.hajj.hotelMakkah; detail["Hotel (Madinah)"] = b.hajj.hotelMadinah; detail["Package Tier"] = b.hajj.packageTier; }
  if (b.umrah) { detail["Hotel (Makkah)"] = b.umrah.hotelMakkah; detail["Hotel (Madinah)"] = b.umrah.hotelMadinah; detail["Package Tier"] = b.umrah.packageTier; }
  if (b.visa) { detail["Destination"] = b.visa.destinationCountry; detail["Visa Type"] = b.visa.visaType; detail["Visa No."] = b.visa.visaNumber; }
  return {
    ...toBooking(b), travelersCount: b.travelersCount, detail,
    timeline: buildTimeline(b.status, b.createdAt, b.departureDate, b.returnDate),
    invoiceNo: b.invoices[0]?.invoiceNo ?? null,
  };
}

// ── invoices ───────────────────────────────────────────────────────────────────
const toInvoice = (i: { id: string; invoiceNo: string | null; status: string; issueDate: Date | null; dueDate: Date | null; total: Prisma.Decimal; paidAmount: Prisma.Decimal; currency: string }): PortalInvoice => {
  const total = num(i.total), paid = num(i.paidAmount);
  return { id: i.id, invoiceNo: i.invoiceNo, status: i.status, issueDate: dOnly(i.issueDate), dueDate: dOnly(i.dueDate), total, paidAmount: paid, dueAmount: Math.max(0, total - paid), currency: i.currency };
};

export async function listInvoices(auth: AuthCtx): Promise<PortalInvoice[]> {
  const customerId = await requireCustomerId(auth);
  const rows = await prisma.invoice.findMany({ where: { customerId, deletedAt: null, status: { not: "DRAFT" } }, orderBy: { issueDate: "desc" } });
  return rows.map(toInvoice);
}

export async function getInvoice(auth: AuthCtx, id: string): Promise<PortalInvoiceDetail> {
  const customerId = await requireCustomerId(auth);
  const inv = await prisma.invoice.findFirst({
    where: { id, customerId, deletedAt: null },
    include: { items: { orderBy: { sortOrder: "asc" } }, payments: { include: { receipt: { select: { receiptNo: true } } }, orderBy: { paidAt: "desc" } } },
  });
  if (!inv) throw new HttpError(404, "NotFound", { detail: "Invoice not found." });
  return {
    ...toInvoice(inv),
    items: inv.items.map((it) => ({ description: it.description, qty: it.qty, unitPrice: num(it.unitPrice), amount: num(it.amount) })),
    payments: inv.payments.map((p) => ({ receiptNo: p.receipt?.receiptNo ?? p.paymentNo, amount: num(p.amount), method: p.method, paidAt: iso(p.paidAt), reversed: p.isReversed })),
  };
}

// ── payments (own — via customerId or the customer's invoices) ─────────────────
export async function listPayments(auth: AuthCtx): Promise<PortalPayment[]> {
  const customerId = await requireCustomerId(auth);
  const rows = await prisma.payment.findMany({
    where: { OR: [{ customerId }, { invoice: { customerId } }] },
    include: { receipt: { select: { receiptNo: true } }, invoice: { select: { invoiceNo: true } } },
    orderBy: { paidAt: "desc" },
  });
  return rows.map((p) => ({ id: p.id, receiptNo: p.receipt?.receiptNo ?? p.paymentNo, invoiceNo: p.invoice?.invoiceNo ?? null, amount: num(p.amount), currency: p.currency, method: p.method, paidAt: iso(p.paidAt), status: p.status, reversed: p.isReversed }));
}

// ── installments ───────────────────────────────────────────────────────────────
export async function listInstallmentPlans(auth: AuthCtx): Promise<PortalInstallmentPlan[]> {
  const customerId = await requireCustomerId(auth);
  const plans = await prisma.installmentPlan.findMany({
    where: { customerId, deletedAt: null },
    include: { installments: { orderBy: { number: "asc" } }, booking: { select: { bookingNo: true } } },
    orderBy: { createdAt: "desc" },
  });
  return plans.map((p) => {
    const paid = p.installments.reduce((s, i) => s + num(i.paidAmount), 0);
    const total = num(p.total);
    return {
      id: p.id, bookingNo: p.booking?.bookingNo ?? null, total, downAmount: num(p.downAmount), paid, remaining: Math.max(0, total - paid), status: p.status,
      installments: p.installments.map((i) => ({ number: i.number, label: i.label, amountDue: num(i.amountDue), dueDate: dOnly(i.dueDate)!, paidDate: dOnly(i.paidDate), paidAmount: num(i.paidAmount), status: i.status })),
    };
  });
}

// ── documents (own — direct or via own booking) ────────────────────────────────
const docWhere = (customerId: string): Prisma.DocumentWhereInput => ({ deletedAt: null, OR: [{ customerId }, { booking: { customerId } }] });

const toDocument = (d: { id: string; name: string; type: string; status: string; required: boolean; filePath: string | null; expiryAt: Date | null; createdAt: Date }): PortalDocument =>
  ({ id: d.id, name: d.name, type: d.type, status: d.status, required: d.required, hasFile: !!d.filePath, expiryAt: dOnly(d.expiryAt), createdAt: iso(d.createdAt) });

export async function listDocuments(auth: AuthCtx): Promise<PortalDocument[]> {
  const customerId = await requireCustomerId(auth);
  const rows = await prisma.document.findMany({ where: docWhere(customerId), orderBy: { createdAt: "desc" } });
  return rows.map(toDocument);
}

export async function getDocument(auth: AuthCtx, id: string): Promise<PortalDocument> {
  const customerId = await requireCustomerId(auth);
  const d = await prisma.document.findFirst({ where: { id, ...docWhere(customerId) } });
  if (!d) throw new HttpError(404, "NotFound", { detail: "Document not found." });
  return toDocument(d);
}

/** Upload one of the customer's own documents. The owner is ALWAYS the
 *  session's customer; a bookingId is honoured only if that booking belongs to
 *  them (else 404 — same shape as a bad id). */
export async function uploadDocument(
  auth: AuthCtx,
  file: Express.Multer.File,
  input: PortalDocumentUploadInput,
): Promise<PortalDocument> {
  try {
    const customerId = await requireCustomerId(auth);
    if (input.bookingId) {
      const b = await prisma.booking.findFirst({ where: { id: input.bookingId, customerId, deletedAt: null }, select: { id: true } });
      if (!b) throw new HttpError(404, "NotFound", { detail: "Booking not found." });
    }
    const filePath = moveIntoStore(file.path, file.mimetype);
    const d = await prisma.document.create({
      data: {
        ownerType: input.bookingId ? "BOOKING" : "CUSTOMER",
        bookingId: input.bookingId ?? null,
        customerId: input.bookingId ? null : customerId,
        type: input.type,
        name: input.name ?? file.originalname,
        filePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        status: "UPLOADED",
        expiryAt: input.expiryAt ?? null,
        uploadedById: auth.userId,
      },
    });
    return toDocument(d);
  } catch (err) {
    removeQuietly(file.path);
    throw err;
  }
}

/** Stream handle for one of the customer's OWN document files. Non-owned id →
 *  404 (the ownership filter lives in the WHERE clause). */
export async function getDocumentFile(auth: AuthCtx, id: string): Promise<{ absPath: string; mimeType: string; name: string }> {
  const customerId = await requireCustomerId(auth);
  const d = await prisma.document.findFirst({ where: { id, ...docWhere(customerId) }, select: { filePath: true, mimeType: true, name: true } });
  if (!d || !d.filePath) throw new HttpError(404, "NotFound", { detail: "Document file not found." });
  return { absPath: absoluteStorePath(d.filePath), mimeType: d.mimeType ?? "application/octet-stream", name: d.name };
}

// ── support tickets ─────────────────────────────────────────────────────────────
const toTicket = (t: { id: string; ticketNo: string; subject: string; status: string; category: string | null; createdAt: Date; messages: { body: string }[] }): PortalTicket => ({
  id: t.id, ticketNo: t.ticketNo, subject: t.subject, status: t.status, category: t.category,
  messageCount: t.messages.length, lastMessage: t.messages[t.messages.length - 1]?.body ?? null, createdAt: iso(t.createdAt),
});

export async function listTickets(auth: AuthCtx): Promise<PortalTicket[]> {
  const customerId = await requireCustomerId(auth);
  const rows = await prisma.supportTicket.findMany({ where: { requesterType: "customer", requesterId: customerId, deletedAt: null }, include: { messages: { select: { body: true } } }, orderBy: { createdAt: "desc" } });
  return rows.map(toTicket);
}

export async function getTicket(auth: AuthCtx, id: string): Promise<PortalTicketDetail> {
  const customerId = await requireCustomerId(auth);
  const t = await prisma.supportTicket.findFirst({ where: { id, requesterType: "customer", requesterId: customerId, deletedAt: null }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!t) throw new HttpError(404, "NotFound", { detail: "Ticket not found." });
  return {
    ...toTicket({ ...t, messages: t.messages }),
    messages: t.messages.map((m) => ({ id: m.id, fromLabel: m.fromLabel, mine: m.fromId === auth.userId, body: m.body, createdAt: iso(m.createdAt) })),
  };
}

export async function createTicket(auth: AuthCtx, input: TicketCreateInput): Promise<PortalTicketDetail> {
  const customerId = await requireCustomerId(auth);
  const c = await prisma.customer.findUniqueOrThrow({ where: { id: customerId }, select: { branchId: true, branch: { select: { code: true } } } });
  const year = new Date().getUTCFullYear();
  const id = await prisma.$transaction(async (tx) => {
    const seq = await allocateSequence(tx, "BOOKING", c.branchId, year); // reuse a per-branch counter namespace
    const ticket = await tx.supportTicket.create({
      data: { ticketNo: formatDocNo("SUP", c.branch.code, year, seq), subject: input.subject, category: input.category, requesterType: "customer", requesterId: customerId, branchId: c.branchId, status: "OPEN" },
    });
    await tx.ticketMessage.create({ data: { ticketId: ticket.id, fromId: auth.userId, fromLabel: "Me", body: input.message } });
    return ticket.id;
  });
  return getTicket(auth, id);
}

export async function addTicketMessage(auth: AuthCtx, ticketId: string, body: string): Promise<PortalTicketDetail> {
  const customerId = await requireCustomerId(auth);
  // ownership check FIRST — a non-owned ticket 404s before any write.
  const owned = await prisma.supportTicket.findFirst({ where: { id: ticketId, requesterType: "customer", requesterId: customerId, deletedAt: null }, select: { id: true } });
  if (!owned) throw new HttpError(404, "NotFound", { detail: "Ticket not found." });
  await prisma.ticketMessage.create({ data: { ticketId, fromId: auth.userId, fromLabel: "Me", body } });
  return getTicket(auth, ticketId);
}

// ── notifications (own — by userId) ─────────────────────────────────────────────
export async function listNotifications(auth: AuthCtx): Promise<PortalNotification[]> {
  await requireCustomerId(auth); // gate: portal customer only
  const rows = await prisma.notification.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: "desc" }, take: 50 });
  return rows.map((n) => ({ id: n.id, title: n.title, body: n.body, color: n.color, read: n.read, createdAt: iso(n.createdAt) }));
}

export async function markAllNotificationsRead(auth: AuthCtx): Promise<{ ok: boolean }> {
  await requireCustomerId(auth);
  await prisma.notification.updateMany({ where: { userId: auth.userId, read: false }, data: { read: true } });
  return { ok: true };
}

// ── dashboard (composed from the caller's own records) ─────────────────────────
export async function getDashboard(auth: AuthCtx): Promise<PortalDashboard> {
  const customerId = await requireCustomerId(auth);
  const [customer, bookings, invoices, docCount, openTickets, unread, recent] = await Promise.all([
    prisma.customer.findUniqueOrThrow({ where: { id: customerId }, select: { name: true } }),
    prisma.booking.findMany({ where: { customerId, deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({ where: { customerId, deletedAt: null, status: { not: "DRAFT" } }, select: { total: true, paidAmount: true, status: true } }),
    prisma.document.count({ where: docWhere(customerId) }),
    prisma.supportTicket.count({ where: { requesterType: "customer", requesterId: customerId, status: { in: ["OPEN", "PENDING"] }, deletedAt: null } }),
    prisma.notification.count({ where: { userId: auth.userId, read: false } }),
    prisma.notification.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const bookingDtos = bookings.map(toBooking);
  const upcoming = bookingDtos.filter((b) => b.status !== "CANCELLED" && b.status !== "COMPLETED");
  const balanceDue = invoices.reduce((s, i) => s + Math.max(0, num(i.total) - num(i.paidAmount)), 0);
  const unpaidInvoices = invoices.filter((i) => num(i.total) - num(i.paidAmount) > 0.001).length;
  return {
    customerName: customer.name,
    nextBooking: upcoming[0] ?? bookingDtos[0] ?? null,
    balanceDue,
    counts: { bookings: bookingDtos.length, unpaidInvoices, documents: docCount, openTickets, unreadNotifications: unread },
    recentNotifications: recent.map((n) => ({ id: n.id, title: n.title, body: n.body, color: n.color, read: n.read, createdAt: iso(n.createdAt) })),
  };
}
