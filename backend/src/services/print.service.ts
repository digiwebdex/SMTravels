/**
 * HTML print views for money receipts and booking vouchers.
 * Returned as text/html for window.print() — no PDF generation.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { escapeHtml, fmtDate, fmtMoney, printPage } from "../lib/printHtml";
import { AuthCtx, branchWhere, requireCustomerId } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";

const num = (v: Prisma.Decimal | number | null | undefined): number =>
  v == null ? 0 : typeof v === "number" ? v : Number(v);

const VOUCHER_READY = new Set(["CONFIRMED", "PROCESSING", "COMPLETED"]);

function serviceLabel(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function companyBlock(name: string, address: string | null, phone: string | null, email: string | null): string {
  return `
    <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:24px;">
      <div>
        <div class="brand">${escapeHtml(name)}</div>
        ${address ? `<p class="sub">${escapeHtml(address)}</p>` : ""}
        ${(() => {
          const contact = [phone, email].filter((x): x is string => !!x).map(escapeHtml).join(" · ");
          return contact ? `<p class="sub">${contact}</p>` : "";
        })()}
      </div>
    </div>`;
}

/** Staff-facing money receipt for a confirmed payment (requires receipt row). */
export async function getPaymentReceiptHtml(auth: AuthCtx, paymentId: string): Promise<string> {
  const p = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      ...branchWhere(auth),
      status: "CONFIRMED",
      isReversed: false,
      direction: "IN",
    },
    include: {
      receipt: true,
      invoice: { select: { invoiceNo: true, customer: { select: { name: true, phone: true } } } },
      branch: { include: { company: true } },
    },
  });
  if (!p?.receipt) {
    throw new HttpError(404, "NotFound", { detail: "Receipt not found for this payment." });
  }

  let customerName = p.invoice?.customer?.name ?? "—";
  let customerPhone = p.invoice?.customer?.phone ?? null;
  if (!p.invoice?.customer && p.customerId) {
    const c = await prisma.customer.findUnique({
      where: { id: p.customerId },
      select: { name: true, phone: true },
    });
    if (c) {
      customerName = c.name;
      customerPhone = c.phone;
    }
  }

  const company = p.branch.company;
  const npsbRef = p.gateway === "NPSB" ? p.reference : p.reference;
  const amount = num(p.amount);

  const body = `
    ${companyBlock(company.name, company.address, company.phone, company.email)}
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
      <div>
        <p class="sub" style="margin-bottom:4px;">Money Receipt</p>
        <p style="font-size:18px;font-weight:800;font-family:ui-monospace,monospace;">${escapeHtml(p.receipt.receiptNo)}</p>
      </div>
      <div class="doc-type">RECEIPT</div>
    </div>
    <p class="amount">${escapeHtml(fmtMoney(amount, p.currency))}</p>
    <div class="grid">
      <div class="box">
        <h3>Customer</h3>
        <p style="font-weight:700;">${escapeHtml(customerName)}</p>
        ${customerPhone ? `<p class="sub">${escapeHtml(customerPhone)}</p>` : ""}
      </div>
      <div class="box">
        <h3>Payment Details</h3>
        <table>
          <tr><td>Date</td><td>${escapeHtml(fmtDate(p.receipt.issuedAt))}</td></tr>
          <tr><td>Method</td><td>${escapeHtml(p.method.replace(/_/g, " "))}</td></tr>
          ${npsbRef ? `<tr><td>NPSB Ref</td><td>${escapeHtml(npsbRef)}</td></tr>` : ""}
          ${p.invoice?.invoiceNo ? `<tr><td>Invoice</td><td>${escapeHtml(p.invoice.invoiceNo)}</td></tr>` : ""}
        </table>
      </div>
    </div>
    <p class="footer">Thank you for your payment. This is a computer-generated receipt.</p>`;

  return printPage(`Receipt ${p.receipt.receiptNo}`, body);
}

/** Customer portal booking voucher — ownership-scoped. */
export async function getBookingVoucherHtml(auth: AuthCtx, bookingId: string): Promise<string> {
  const customerId = await requireCustomerId(auth);
  const b = await prisma.booking.findFirst({
    where: { id: bookingId, customerId, deletedAt: null },
    include: {
      customer: { select: { name: true, phone: true } },
      branch: { include: { company: true } },
    },
  });
  if (!b) throw new HttpError(404, "NotFound", { detail: "Booking not found." });
  if (!VOUCHER_READY.has(b.status)) {
    throw new HttpError(400, "VoucherNotReady", { detail: "Voucher is available once your booking is confirmed." });
  }

  const company = b.branch.company;
  const body = `
    ${companyBlock(company.name, company.address, company.phone, company.email)}
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
      <div>
        <p class="sub" style="margin-bottom:4px;">Booking Voucher</p>
        <p style="font-size:18px;font-weight:800;font-family:ui-monospace,monospace;">${escapeHtml(b.bookingNo ?? b.id.slice(0, 8).toUpperCase())}</p>
      </div>
      <div class="doc-type">VOUCHER</div>
    </div>
    <p><span class="status">${escapeHtml(b.status.replace(/_/g, " "))}</span></p>
    <div class="grid">
      <div class="box">
        <h3>Traveler</h3>
        <p style="font-weight:700;">${escapeHtml(b.customer?.name ?? "—")}</p>
        ${b.customer?.phone ? `<p class="sub">${escapeHtml(b.customer.phone)}</p>` : ""}
      </div>
      <div class="box">
        <h3>Booking</h3>
        <table>
          <tr><td>Service</td><td>${escapeHtml(serviceLabel(b.serviceType))}</td></tr>
          <tr><td>Travelers</td><td>${escapeHtml(String(b.travelersCount))}</td></tr>
          ${b.departureDate ? `<tr><td>Departure</td><td>${escapeHtml(fmtDate(b.departureDate))}</td></tr>` : ""}
          ${b.returnDate ? `<tr><td>Return</td><td>${escapeHtml(fmtDate(b.returnDate))}</td></tr>` : ""}
          <tr><td>Issued</td><td>${escapeHtml(fmtDate(b.createdAt))}</td></tr>
        </table>
      </div>
    </div>
    <p class="footer">Present this voucher at check-in. SM Travels International — safe travels.</p>`;

  const title = `Voucher ${b.bookingNo ?? bookingId}`;
  return printPage(title, body);
}
