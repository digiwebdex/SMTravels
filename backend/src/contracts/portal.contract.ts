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
  travelersCount: number;
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

export interface PortalBankAccount {
  id: string; name: string; bankName: string | null; accountNumber: string | null;
  iban: string | null; branchName: string | null; currency: string;
}

export { paymentProofSubmitSchema, type PaymentProofSubmitInput } from "./finance.contract";
export { integrationTestSchema, type IntegrationTestInput, type IntegrationsStatusDto } from "./integrations.contract";

export interface PortalInstallment { number: number; label: string | null; amountDue: number; dueDate: string; paidDate: string | null; paidAmount: number; status: string }
export interface PortalInstallmentPlan {
  id: string; bookingNo: string | null; total: number; downAmount: number; paid: number; remaining: number; status: string;
  installments: PortalInstallment[];
}

export interface PortalDocument { id: string; name: string; type: string; status: string; required: boolean; hasFile: boolean; expiryAt: string | null; createdAt: string }

/** Visa bookings for the customer portal Visa Status view. */
export interface PortalVisa {
  id: string; bookingNo: string | null; status: string; stageStatus: string | null;
  destinationCountry: string | null; visaType: string | null; visaNumber: string | null;
  departureDate: string | null; createdAt: string;
}

/** Aggregated downloadable items (ticket / visa / voucher / invoice). */
export interface PortalDownloadItem {
  id: string;
  kind: "document" | "invoice" | "voucher";
  category: "ticket" | "visa" | "voucher" | "invoice";
  name: string;
  type: string;
  status: string;
  hasFile: boolean;
  bookingId: string | null;
  createdAt: string;
}

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

// ════════════════════════════════════════════════════════════════════════════
// AGENT PORTAL (scoped by agentId; downline scoped by the parentAgentId tree)
// ════════════════════════════════════════════════════════════════════════════
export const leadCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(160).optional(),
  serviceInterest: z.enum(["HAJJ", "UMRAH", "VISA", "AIR_TICKET", "MANPOWER", "TOUR", "HOTEL"]).optional(),
  note: z.string().trim().max(2000).optional(),
});
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export interface AgentProfile {
  id: string; agentCode: string; name: string; phone: string | null; email: string | null;
  nid: string | null; tradeLicense: string | null; tier: string; commissionRate: number; status: string;
  bankName: string | null; accountNo: string | null; bkashNo: string | null; nagadNo: string | null; memberSince: string;
}
export interface AgentLead { id: string; name: string; phone: string; serviceInterest: string | null; stage: string; interest: string; createdAt: string }
export interface AgentBooking { id: string; bookingNo: string | null; customerName: string | null; serviceType: string; status: string; baseAmount: number; createdAt: string }
export interface AgentCommissionRow { id: string; period: string | null; grossAmount: number; rate: number; amount: number; status: string }
export interface AgentWalletTxn { id: string; type: string; description: string | null; amount: number; reference: string | null; reversed: boolean; postedAt: string }
export interface AgentWalletView { balance: number; currency: string; transactions: AgentWalletTxn[] }   // READ-ONLY ledger
export interface AgentTeamMember { id: string; agentCode: string; name: string; tier: string; status: string; bookings: number; commission: number }
export interface AgentCustomer {
  id: string; name: string; phone: string; bookingsCount: number;
  totalValue: number; lastBookingAt: string | null; status: string;
}
export interface AgentDashboard {
  agentName: string; tier: string; walletBalance: number;
  counts: { leads: number; bookings: number; customers: number; teamSize: number };
  commissionEarned: number; commissionPending: number;
  recentLeads: AgentLead[];
}
export interface AgentDocument { id: string; name: string; type: string; status: string; hasFile: boolean; bookingNo: string | null; createdAt: string }
export interface AgentPayment {
  id: string; receiptNo: string | null; invoiceNo: string | null; customerName: string | null;
  amount: number; currency: string; method: string; paidAt: string; status: string; reversed: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// SUPPLIER PORTAL (scoped by supplierId)
// ════════════════════════════════════════════════════════════════════════════
export const requestStatusSchema = z.object({ action: z.enum(["accept", "reject"]), reason: z.string().trim().max(500).optional() });
export type RequestStatusInput = z.infer<typeof requestStatusSchema>;

export interface SupplierProfile {
  id: string; supplierCode: string; name: string; category: string | null; contactPerson: string | null;
  phone: string | null; email: string | null; website: string | null; tradeLicense: string | null; tin: string | null;
  address: string | null; bankName: string | null; accountNo: string | null; rating: number | null; status: string; memberSince: string;
}
export interface SupplierRequest { id: string; requestNo: string; serviceLabel: string | null; clientLabel: string | null; amount: number; currency: string; status: string; createdAt: string; deadline: string | null }
export interface SupplierServiceRow { id: string; name: string; category: string | null; price: number | null; active: boolean; bookingsCount: number; rating: number | null }
export interface SupplierInvoiceRow { id: string; invoiceNo: string; description: string | null; amount: number; currency: string; status: string; issueDate: string | null; dueDate: string | null }
export interface SupplierPayableRow { id: string; amount: number; paidAmount: number; dueAmount: number; status: string; dueDate: string | null }
export interface SupplierPaymentRow { id: string; receiptNo: string | null; amount: number; method: string; paidAt: string; status: string }
export interface SupplierDashboard {
  supplierName: string; status: string; rating: number | null;
  counts: { pendingRequests: number; services: number; unpaidInvoices: number };
  outstanding: number; totalInvoiced: number;
  recentRequests: SupplierRequest[];
}

// ════════════════════════════════════════════════════════════════════════════
// STAFF PORTAL (branchWhere + assigned-to-me; NOT owner-scoped)
// ════════════════════════════════════════════════════════════════════════════
export const taskCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  category: z.string().trim().max(60).optional(),
  dueAt: z.string().trim().optional(),
});
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export const taskStatusSchema = z.object({ status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]) });
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;

export interface StaffProfile { id: string; name: string; email: string; phone: string | null; nid: string | null; employeeId: string | null; department: string | null; role: string; branchName: string | null }
export interface StaffTask { id: string; title: string; priority: string; status: string; category: string | null; dueAt: string | null; createdAt: string }
export interface StaffBooking { id: string; bookingNo: string | null; customerName: string | null; serviceType: string; status: string; departureDate: string | null; baseAmount: number }
export interface StaffCustomer { id: string; name: string; phone: string; bookings: number; createdAt: string }
export interface StaffDocument { id: string; name: string; type: string; status: string; createdAt: string }
export interface StaffAnnouncement { id: string; title: string; body: string; pinned: boolean; createdAt: string }
export interface StaffDashboard {
  staffName: string; branchName: string | null;
  counts: { openTasks: number; assignedBookings: number; branchCustomers: number };
  tasksByStatus: { status: string; count: number }[];
  pinnedAnnouncements: StaffAnnouncement[];
}

// ════════════════════════════════════════════════════════════════════════════
// ACCOUNTANT PORTAL (branchWhere — reuses finance/reports; own profile here)
// ════════════════════════════════════════════════════════════════════════════
export interface AccountantProfile { id: string; name: string; email: string; phone: string | null; nid: string | null; employeeId: string | null; department: string | null; role: string; branchName: string | null }
export interface AccountantDashboard {
  accountantName: string; branchName: string | null;
  revenue: number; expense: number; netProfit: number;
  invoices: { billed: number; collected: number; outstanding: number };
  postedJournalCount: number;
}
