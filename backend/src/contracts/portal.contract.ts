/**
 * Customer Portal contract. READ-mostly views over the customer's OWN records.
 * Ownership is enforced server-side (resolveOwner / requireCustomerId) — every
 * query is pinned to the caller's customerId, so a client-supplied id can never
 * widen scope. Fetch-by-id on a non-owned record returns 404.
 */
import { z } from "zod";

export const ticketCreateSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z.string().trim().max(60).optional(),
  message: z.string().trim().min(1).max(4000),
});
export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

export const ticketMessageSchema = z.object({ body: z.string().trim().min(1).max(4000) });
export type TicketMessageInput = z.infer<typeof ticketMessageSchema>;

// ── DTOs ──────────────────────────────────────────────────────────────────────
export interface PortalProfile {
  id: string; name: string; phone: string; email: string | null;
  nid: string | null; passportNo: string | null;              // decrypted for the OWNER only
  dob: string | null; addressLine: string | null; district: string | null;
  division: string | null; country: string | null; type: string; rating: string | null;
  memberSince: string;
}

export interface PortalBooking {
  id: string; bookingNo: string | null; serviceType: string; status: string;
  amount: number; paidAmount: number; dueAmount: number; currency: string;
  departureDate: string | null; returnDate: string | null; createdAt: string;
}
export interface PortalTimelineStep { label: string; date: string | null; done: boolean }
export interface PortalBookingDetail extends PortalBooking {
  travelersCount: number;
  detail: Record<string, string | null>;   // service-specific (hotel/visa/etc.)
  timeline: PortalTimelineStep[];
  invoiceNo: string | null;
}

export interface PortalInvoice {
  id: string; invoiceNo: string | null; status: string; issueDate: string | null; dueDate: string | null;
  total: number; paidAmount: number; dueAmount: number; currency: string;
}
export interface PortalInvoiceItem { description: string; qty: number; unitPrice: number; amount: number }
export interface PortalInvoiceDetail extends PortalInvoice {
  items: PortalInvoiceItem[];
  payments: { receiptNo: string | null; amount: number; method: string; paidAt: string; reversed: boolean }[];
}

export interface PortalPayment {
  id: string; receiptNo: string | null; invoiceNo: string | null;
  amount: number; currency: string; method: string; paidAt: string; status: string; reversed: boolean;
}

export interface PortalInstallment { number: number; label: string | null; amountDue: number; dueDate: string; paidDate: string | null; paidAmount: number; status: string }
export interface PortalInstallmentPlan {
  id: string; bookingNo: string | null; total: number; downAmount: number; paid: number; remaining: number; status: string;
  installments: PortalInstallment[];
}

export interface PortalDocument { id: string; name: string; type: string; status: string; required: boolean; expiryAt: string | null; createdAt: string }

export interface PortalTicket { id: string; ticketNo: string; subject: string; status: string; category: string | null; messageCount: number; lastMessage: string | null; createdAt: string }
export interface PortalTicketMessage { id: string; fromLabel: string | null; mine: boolean; body: string; createdAt: string }
export interface PortalTicketDetail extends PortalTicket { messages: PortalTicketMessage[] }

export interface PortalNotification { id: string; title: string; body: string | null; color: string | null; read: boolean; createdAt: string }

export interface PortalDashboard {
  customerName: string;
  nextBooking: PortalBooking | null;
  balanceDue: number;
  counts: { bookings: number; unpaidInvoices: number; documents: number; openTickets: number; unreadNotifications: number };
  recentNotifications: PortalNotification[];
}
