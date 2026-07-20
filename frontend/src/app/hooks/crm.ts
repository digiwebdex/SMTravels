import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { useBranches } from "./bookings";
import type {
  LeadListResponse, LeadDetail, LeadListItem, LeadCreateInput, LeadUpdateInput, LeadStageDto,
  CustomerListResponse, CustomerProfile, CustomerCreateInput, CustomerUpdateInput,
  CorporateListResponse, CorporateProfile, CorporateCreateInput, CorporateUpdateInput,
} from "@contracts/crm.contract";

export { useBranches };

// ── stage display metadata (list badges + kanban columns) ─────────────────────
export const STAGE_ORDER: LeadStageDto[] = ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
export const STAGE_META: Record<LeadStageDto, { label: string; color: string; bg: string }> = {
  NEW:         { label: "New",         color: "#1D4ED8", bg: "#DBEAFE" },
  QUALIFIED:   { label: "Qualified",   color: "#0E7490", bg: "#CFFAFE" },
  PROPOSAL:    { label: "Proposal",    color: "#92400E", bg: "#FEF3C7" },
  NEGOTIATION: { label: "Negotiation", color: "#7C3AED", bg: "#F5F3FF" },
  WON:         { label: "Won",         color: "#065F46", bg: "#D1FAE5" },
  LOST:        { label: "Lost",        color: "#991B1B", bg: "#FEE2E2" },
};
export const INTEREST_META: Record<string, { color: string; bg: string }> = {
  HIGH:   { color: "#065F46", bg: "#D1FAE5" },
  MEDIUM: { color: "#92400E", bg: "#FEF3C7" },
  LOW:    { color: "#6B7280", bg: "#F3F4F6" },
};

function qstr(p: Record<string, string | number | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "" && v !== "All") s.set(k, String(v));
  return s.toString();
}

const err = (e: Error) => toast.error(e.message || "Something went wrong");

// ── query keys ────────────────────────────────────────────────────────────────
export const crmKeys = {
  leads: (p: unknown) => ["crm", "leads", p] as const,
  lead: (id: string) => ["crm", "lead", id] as const,
  customers: (p: unknown) => ["crm", "customers", p] as const,
  customer: (id: string) => ["crm", "customer", id] as const,
  corporate: (p: unknown) => ["crm", "corporate", p] as const,
  corporateOne: (id: string) => ["crm", "corporateOne", id] as const,
  users: ["crm", "users"] as const,
};

// ── users (assignee dropdown) ─────────────────────────────────────────────────
export interface StaffOption { id: string; name: string; role: string; branchId: string | null }
export function useUsers() {
  return useQuery({
    queryKey: crmKeys.users,
    queryFn: () => apiFetch<{ data: StaffOption[] }>("/users").then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

// ── Leads ─────────────────────────────────────────────────────────────────────
export interface LeadListParams {
  page?: number; pageSize?: number; sort?: string; dir?: string;
  q?: string; stage?: string; source?: string; serviceInterest?: string; assignedToId?: string; branchId?: string;
}
export function useLeads(params: LeadListParams) {
  return useQuery({
    queryKey: crmKeys.leads(params),
    queryFn: () => apiFetch<LeadListResponse>(`/leads?${qstr(params as Record<string, string | number | undefined>)}`),
    placeholderData: (p) => p,
  });
}
export function useLead(id: string | null) {
  return useQuery({ queryKey: crmKeys.lead(id ?? ""), queryFn: () => apiFetch<LeadDetail>(`/leads/${id}`), enabled: !!id });
}
function invalidateLeads(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["crm", "leads"] });
}
export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadCreateInput) => apiFetch<LeadDetail>("/leads", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { invalidateLeads(qc); toast.success("Lead created"); },
    onError: err,
  });
}
export function useUpdateLead(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadUpdateInput) => apiFetch<LeadDetail>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { invalidateLeads(qc); qc.invalidateQueries({ queryKey: crmKeys.lead(id) }); toast.success("Lead updated"); },
    onError: err,
  });
}
export function useLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, note }: { id: string; stage: LeadStageDto; note?: string }) =>
      apiFetch<LeadDetail>(`/leads/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage, note }) }),
    onSuccess: (d) => { invalidateLeads(qc); qc.invalidateQueries({ queryKey: crmKeys.lead(d.id) }); },
    onError: err,
  });
}
export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ customerId: string; leadId: string }>(`/leads/${id}/convert`, { method: "POST" }),
    onSuccess: (r) => {
      invalidateLeads(qc); qc.invalidateQueries({ queryKey: crmKeys.lead(r.leadId) });
      qc.invalidateQueries({ queryKey: ["crm", "customers"] });
      toast.success("Lead converted to customer");
    },
    onError: err,
  });
}
export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/leads/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidateLeads(qc); toast.success("Lead deleted"); },
    onError: err,
  });
}
// lead sub-resources (return the refreshed lead)
function leadSub<T>(path: (id: string) => string, method = "POST") {
  return function useSub() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: T }) =>
        apiFetch<LeadDetail>(path(id), { method, body: JSON.stringify(body) }),
      onSuccess: (d) => { qc.invalidateQueries({ queryKey: crmKeys.lead(d.id) }); invalidateLeads(qc); },
      onError: err,
    });
  };
}
export const useAddNote = leadSub<{ body: string }>((id) => `/leads/${id}/notes`);
export const useAddFollowUp = leadSub<{ dueAt: string; note?: string; assignedToId?: string }>((id) => `/leads/${id}/followups`);
export const useAddCall = leadSub<{ direction: string; durationSec?: number; note?: string }>((id) => `/leads/${id}/calls`);
export const useAddTask = leadSub<{ title: string; description?: string; priority?: string; dueAt?: string }>((id) => `/leads/${id}/tasks`);

// ── Customers ─────────────────────────────────────────────────────────────────
export interface CustomerListParams { page?: number; pageSize?: number; sort?: string; dir?: string; q?: string; type?: string; branchId?: string }
export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: crmKeys.customers(params),
    queryFn: () => apiFetch<CustomerListResponse>(`/customers?${qstr(params as Record<string, string | number | undefined>)}`),
    placeholderData: (p) => p,
  });
}
export function useCustomer(id: string | null) {
  return useQuery({ queryKey: crmKeys.customer(id ?? ""), queryFn: () => apiFetch<CustomerProfile>(`/customers/${id}`), enabled: !!id });
}
export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerCreateInput) => apiFetch<CustomerProfile>("/customers", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", "customers"] }); toast.success("Customer created"); },
    onError: err,
  });
}
export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerUpdateInput) => apiFetch<CustomerProfile>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", "customers"] }); qc.invalidateQueries({ queryKey: crmKeys.customer(id) }); toast.success("Customer updated"); },
    onError: err,
  });
}

// ── Corporate ─────────────────────────────────────────────────────────────────
export interface CorporateListParams { page?: number; pageSize?: number; sort?: string; dir?: string; q?: string; branchId?: string }
export function useCorporateList(params: CorporateListParams) {
  return useQuery({
    queryKey: crmKeys.corporate(params),
    queryFn: () => apiFetch<CorporateListResponse>(`/corporate-clients?${qstr(params as Record<string, string | number | undefined>)}`),
    placeholderData: (p) => p,
  });
}
export function useCorporate(id: string | null) {
  return useQuery({ queryKey: crmKeys.corporateOne(id ?? ""), queryFn: () => apiFetch<CorporateProfile>(`/corporate-clients/${id}`), enabled: !!id });
}
export function useCreateCorporate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CorporateCreateInput) => apiFetch<CorporateProfile>("/corporate-clients", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", "corporate"] }); toast.success("Corporate client created"); },
    onError: err,
  });
}
export function useUpdateCorporate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CorporateUpdateInput) => apiFetch<CorporateProfile>(`/corporate-clients/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", "corporate"] }); qc.invalidateQueries({ queryKey: crmKeys.corporateOne(id) }); toast.success("Corporate client updated"); },
    onError: err,
  });
}

export type { LeadListItem, LeadDetail, CustomerProfile, CorporateProfile };
