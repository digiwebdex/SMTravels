import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  AgentProfile, AgentLead, AgentBooking, AgentCommissionRow, AgentWalletView, AgentTeamMember, AgentDashboard, AgentCustomer, LeadCreateInput,
  AgentDocument, AgentPayment,
  PortalTicket, PortalTicketDetail, TicketCreateInput,
  SupplierProfile, SupplierRequest, SupplierServiceRow, SupplierInvoiceRow, SupplierPayableRow, SupplierPaymentRow, SupplierDashboard,
  StaffProfile, StaffTask, StaffBooking, StaffCustomer, StaffDocument, StaffAnnouncement, StaffDashboard, TaskCreateInput,
  AccountantProfile, AccountantDashboard,
} from "@contracts/portal.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");
const list = <T,>(path: string) => apiFetch<{ data: T[] }>(path).then((r) => r.data);

// ── Agent ───────────────────────────────────────────────────────────────────
export const useAgentMe = () => useQuery({ queryKey: ["ag", "me"], queryFn: () => apiFetch<AgentProfile>("/portal/agent/me"), staleTime: 60_000 });
export const useAgentDashboard = () => useQuery({ queryKey: ["ag", "dash"], queryFn: () => apiFetch<AgentDashboard>("/portal/agent/dashboard") });
export const useAgentLeads = () => useQuery({ queryKey: ["ag", "leads"], queryFn: () => list<AgentLead>("/portal/agent/leads") });
export const useAgentBookings = () => useQuery({ queryKey: ["ag", "bookings"], queryFn: () => list<AgentBooking>("/portal/agent/bookings") });
export const useAgentCustomers = () => useQuery({ queryKey: ["ag", "customers"], queryFn: () => list<AgentCustomer>("/portal/agent/customers") });
export const useAgentCommissions = () => useQuery({ queryKey: ["ag", "comm"], queryFn: () => list<AgentCommissionRow>("/portal/agent/commissions") });
export const useAgentWallet = () => useQuery({ queryKey: ["ag", "wallet"], queryFn: () => apiFetch<AgentWalletView>("/portal/agent/wallet") });
export const useAgentTeam = () => useQuery({ queryKey: ["ag", "team"], queryFn: () => list<AgentTeamMember>("/portal/agent/team") });
export const useAgentDocuments = () => useQuery({ queryKey: ["ag", "docs"], queryFn: () => list<AgentDocument>("/portal/agent/documents") });
export const useAgentPayments = () => useQuery({ queryKey: ["ag", "pay"], queryFn: () => list<AgentPayment>("/portal/agent/payments") });
export const useAgentTickets = () => useQuery({ queryKey: ["ag", "tickets"], queryFn: () => list<PortalTicket>("/portal/agent/tickets") });
export const useAgentTicket = (id: string | null) => useQuery({ queryKey: ["ag", "ticket", id ?? ""], queryFn: () => apiFetch<PortalTicketDetail>(`/portal/agent/tickets/${id}`), enabled: !!id });
export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: LeadCreateInput) => apiFetch<AgentLead>("/portal/agent/leads", { method: "POST", body: JSON.stringify(input) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["ag", "leads"] }); qc.invalidateQueries({ queryKey: ["ag", "dash"] }); toast.success("Lead added"); }, onError: err });
}
export function useCreateAgentTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TicketCreateInput) => apiFetch<PortalTicketDetail>("/portal/agent/tickets", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["ag", "tickets"] }); toast.success("Ticket created"); },
    onError: err,
  });
}
export function useAddAgentTicketMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => apiFetch<PortalTicketDetail>(`/portal/agent/tickets/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["ag", "ticket", id] }); void qc.invalidateQueries({ queryKey: ["ag", "tickets"] }); },
    onError: err,
  });
}

// ── Supplier ────────────────────────────────────────────────────────────────
export const useSupplierMe = () => useQuery({ queryKey: ["su", "me"], queryFn: () => apiFetch<SupplierProfile>("/portal/supplier/me"), staleTime: 60_000 });
export const useSupplierDashboard = () => useQuery({ queryKey: ["su", "dash"], queryFn: () => apiFetch<SupplierDashboard>("/portal/supplier/dashboard") });
export const useSupplierRequests = () => useQuery({ queryKey: ["su", "requests"], queryFn: () => list<SupplierRequest>("/portal/supplier/requests") });
export const useSupplierServices = () => useQuery({ queryKey: ["su", "services"], queryFn: () => list<SupplierServiceRow>("/portal/supplier/services") });
export const useSupplierInvoices = () => useQuery({ queryKey: ["su", "invoices"], queryFn: () => list<SupplierInvoiceRow>("/portal/supplier/invoices") });
export const useSupplierPayables = () => useQuery({ queryKey: ["su", "payables"], queryFn: () => list<SupplierPayableRow>("/portal/supplier/payables") });
export const useSupplierPayments = () => useQuery({ queryKey: ["su", "payments"], queryFn: () => list<SupplierPaymentRow>("/portal/supplier/payments") });
export function useSetRequestStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, action, reason }: { id: string; action: "accept" | "reject"; reason?: string }) => apiFetch<SupplierRequest>(`/portal/supplier/requests/${id}/status`, { method: "POST", body: JSON.stringify({ action, reason }) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["su", "requests"] }); qc.invalidateQueries({ queryKey: ["su", "dash"] }); toast.success("Request updated"); }, onError: err });
}

// ── Staff ───────────────────────────────────────────────────────────────────
export const useStaffMe = () => useQuery({ queryKey: ["st", "me"], queryFn: () => apiFetch<StaffProfile>("/portal/staff/me"), staleTime: 60_000 });
export const useStaffDashboard = () => useQuery({ queryKey: ["st", "dash"], queryFn: () => apiFetch<StaffDashboard>("/portal/staff/dashboard") });
export const useStaffTasks = () => useQuery({ queryKey: ["st", "tasks"], queryFn: () => list<StaffTask>("/portal/staff/tasks") });
export const useStaffBookings = () => useQuery({ queryKey: ["st", "bookings"], queryFn: () => list<StaffBooking>("/portal/staff/bookings") });
export const useStaffCustomers = () => useQuery({ queryKey: ["st", "customers"], queryFn: () => list<StaffCustomer>("/portal/staff/customers") });
export const useStaffDocuments = () => useQuery({ queryKey: ["st", "documents"], queryFn: () => list<StaffDocument>("/portal/staff/documents") });
export const useStaffAnnouncements = () => useQuery({ queryKey: ["st", "announce"], queryFn: () => list<StaffAnnouncement>("/portal/staff/announcements") });
export function useSetTaskStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => apiFetch<StaffTask>(`/portal/staff/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["st", "tasks"] }); qc.invalidateQueries({ queryKey: ["st", "dash"] }); }, onError: err });
}
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: TaskCreateInput) => apiFetch<StaffTask>("/portal/staff/tasks", { method: "POST", body: JSON.stringify(input) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["st", "tasks"] }); qc.invalidateQueries({ queryKey: ["st", "dash"] }); toast.success("Task added"); }, onError: err });
}

// ── Accountant ──────────────────────────────────────────────────────────────
export const useAccountantMe = () => useQuery({ queryKey: ["ac", "me"], queryFn: () => apiFetch<AccountantProfile>("/portal/accountant/me"), staleTime: 60_000 });
export const useAccountantDashboard = () => useQuery({ queryKey: ["ac", "dash"], queryFn: () => apiFetch<AccountantDashboard>("/portal/accountant/dashboard") });

export type {
  AgentProfile, AgentDashboard, AgentWalletView, AgentTeamMember, AgentLead,
  AgentDocument, AgentPayment,
  SupplierProfile, SupplierDashboard, SupplierRequest, SupplierInvoiceRow,
  StaffProfile, StaffDashboard, StaffTask, StaffCustomer,
  AccountantProfile, AccountantDashboard,
};
