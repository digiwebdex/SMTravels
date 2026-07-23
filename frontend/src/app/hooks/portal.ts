import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, downloadViaApi } from "../lib/api";
import type {
  PortalProfile, PortalBooking, PortalBookingDetail, PortalInvoice, PortalInvoiceDetail,
  PortalPayment, PortalInstallmentPlan, PortalDocument, PortalTicket, PortalTicketDetail,
  PortalNotification, PortalDashboard, TicketCreateInput,
} from "@contracts/portal.contract";
import type { DocumentTypeDto } from "@contracts/document.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");
export const portalKeys = {
  me: ["portal", "me"] as const,
  dashboard: ["portal", "dashboard"] as const,
  bookings: ["portal", "bookings"] as const,
  booking: (id: string) => ["portal", "booking", id] as const,
  invoices: ["portal", "invoices"] as const,
  invoice: (id: string) => ["portal", "invoice", id] as const,
  payments: ["portal", "payments"] as const,
  installments: ["portal", "installments"] as const,
  documents: ["portal", "documents"] as const,
  tickets: ["portal", "tickets"] as const,
  ticket: (id: string) => ["portal", "ticket", id] as const,
  notifications: ["portal", "notifications"] as const,
};

export const usePortalMe = () => useQuery({ queryKey: portalKeys.me, queryFn: () => apiFetch<PortalProfile>("/portal/me"), staleTime: 60_000 });
export const usePortalDashboard = () => useQuery({ queryKey: portalKeys.dashboard, queryFn: () => apiFetch<PortalDashboard>("/portal/dashboard") });
export const usePortalBookings = () => useQuery({ queryKey: portalKeys.bookings, queryFn: () => apiFetch<{ data: PortalBooking[] }>("/portal/bookings").then((r) => r.data) });
export const usePortalBooking = (id: string | null) => useQuery({ queryKey: portalKeys.booking(id ?? ""), queryFn: () => apiFetch<PortalBookingDetail>(`/portal/bookings/${id}`), enabled: !!id });
export const usePortalInvoices = () => useQuery({ queryKey: portalKeys.invoices, queryFn: () => apiFetch<{ data: PortalInvoice[] }>("/portal/invoices").then((r) => r.data) });
export const usePortalInvoice = (id: string | null) => useQuery({ queryKey: portalKeys.invoice(id ?? ""), queryFn: () => apiFetch<PortalInvoiceDetail>(`/portal/invoices/${id}`), enabled: !!id });
export const usePortalPayments = () => useQuery({ queryKey: portalKeys.payments, queryFn: () => apiFetch<{ data: PortalPayment[] }>("/portal/payments").then((r) => r.data) });
export const usePortalInstallments = () => useQuery({ queryKey: portalKeys.installments, queryFn: () => apiFetch<{ data: PortalInstallmentPlan[] }>("/portal/installments").then((r) => r.data) });
export const usePortalDocuments = () => useQuery({ queryKey: portalKeys.documents, queryFn: () => apiFetch<{ data: PortalDocument[] }>("/portal/documents").then((r) => r.data) });
export const usePortalTickets = () => useQuery({ queryKey: portalKeys.tickets, queryFn: () => apiFetch<{ data: PortalTicket[] }>("/portal/tickets").then((r) => r.data) });
export const usePortalTicket = (id: string | null) => useQuery({ queryKey: portalKeys.ticket(id ?? ""), queryFn: () => apiFetch<PortalTicketDetail>(`/portal/tickets/${id}`), enabled: !!id });
export const usePortalNotifications = () => useQuery({ queryKey: portalKeys.notifications, queryFn: () => apiFetch<{ data: PortalNotification[] }>("/portal/notifications").then((r) => r.data) });

/** Upload one of MY documents (the backend pins ownership to the session). */
export function useUploadPortalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { file: File; type: DocumentTypeDto; name?: string; bookingId?: string }) => {
      const fd = new FormData();
      fd.append("file", input.file);
      fd.append("type", input.type);
      if (input.name) fd.append("name", input.name);
      if (input.bookingId) fd.append("bookingId", input.bookingId);
      return apiFetch<PortalDocument>("/portal/documents", { method: "POST", body: fd });
    },
    onSuccess: (d) => {
      toast.success(`"${d.name}" uploaded`);
      void qc.invalidateQueries({ queryKey: portalKeys.documents });
      void qc.invalidateQueries({ queryKey: portalKeys.dashboard });
    },
    onError: err,
  });
}

/** Download one of MY documents via the authenticated endpoint. */
export const downloadPortalDocument = (d: Pick<PortalDocument, "id" | "name">) =>
  downloadViaApi(`/portal/documents/${d.id}/file`, d.name).catch(err);

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TicketCreateInput) => apiFetch<PortalTicketDetail>("/portal/tickets", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: portalKeys.tickets }); toast.success("Ticket created"); },
    onError: err,
  });
}
export function useAddTicketMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => apiFetch<PortalTicketDetail>(`/portal/tickets/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: portalKeys.ticket(id) }); qc.invalidateQueries({ queryKey: portalKeys.tickets }); },
    onError: err,
  });
}
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ ok: boolean }>("/portal/notifications/read-all", { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: portalKeys.notifications }); qc.invalidateQueries({ queryKey: portalKeys.dashboard }); },
    onError: err,
  });
}

export type {
  PortalProfile, PortalBooking, PortalBookingDetail, PortalInvoice, PortalInvoiceDetail,
  PortalPayment, PortalInstallmentPlan, PortalDocument, PortalTicket, PortalTicketDetail, PortalNotification, PortalDashboard,
};
