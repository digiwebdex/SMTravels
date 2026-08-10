import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  EmployerListResponse, EmployerDto, EmployerCreateInput, EmployerUpdateInput,
  JobOrderListResponse, JobOrderDto, JobOrderCreateInput, JobOrderUpdateInput,
  CandidateListResponse, CandidateDto, CandidateCreateInput, CandidateUpdateInput,
  CandidateTransitionInput, JobOrderPipelineDto,
} from "@contracts/manpower.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");
const qs = <T extends object>(f: T) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== "" && v !== "all") s.set(k, String(v));
  return s.toString();
};

// ─── Employers ───────────────────────────────────────────────────────────────
export interface EmployerFilters { q?: string; status?: string; pageSize?: number }
export const useEmployers = (f: EmployerFilters = {}) =>
  useQuery({ queryKey: ["employers", "list", f], queryFn: () => apiFetch<EmployerListResponse>(`/manpower/employers?${qs(f)}`), staleTime: 30_000 });
export const useEmployerOptions = () =>
  useQuery({ queryKey: ["employers", "options"], queryFn: () => apiFetch<EmployerListResponse>(`/manpower/employers?pageSize=100&status=ACTIVE`).then((r) => r.items), staleTime: 60_000 });

export function useCreateEmployer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployerCreateInput) => apiFetch<EmployerDto>("/manpower/employers", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["employers"] }); toast.success(`${d.code} added`); },
    onError: err,
  });
}
export function useUpdateEmployer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EmployerUpdateInput }) => apiFetch<EmployerDto>(`/manpower/employers/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employers"] }); toast.success("Employer updated"); },
    onError: err,
  });
}
export function useArchiveEmployer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/manpower/employers/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employers"] }); toast.success("Employer archived"); },
    onError: err,
  });
}

// ─── Job Orders ──────────────────────────────────────────────────────────────
export interface JobOrderFilters { q?: string; status?: string; employerId?: string; pageSize?: number }
export const useJobOrders = (f: JobOrderFilters = {}) =>
  useQuery({ queryKey: ["job-orders", "list", f], queryFn: () => apiFetch<JobOrderListResponse>(`/manpower/job-orders?${qs(f)}`), staleTime: 30_000 });

export function useCreateJobOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: JobOrderCreateInput) => apiFetch<JobOrderDto>("/manpower/job-orders", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["job-orders"] }); qc.invalidateQueries({ queryKey: ["employers"] }); toast.success(`${d.code} created`); },
    onError: err,
  });
}
export function useUpdateJobOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: JobOrderUpdateInput }) => apiFetch<JobOrderDto>(`/manpower/job-orders/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job-orders"] }); toast.success("Job order updated"); },
    onError: err,
  });
}
export function useArchiveJobOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/manpower/job-orders/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job-orders"] }); toast.success("Job order cancelled"); },
    onError: err,
  });
}

// ─── Candidates + Recruitment ────────────────────────────────────────────────
export interface CandidateFilters { q?: string; status?: string; jobOrderId?: string; employerId?: string; pageSize?: number }
export const useCandidates = (f: CandidateFilters = {}) =>
  useQuery({ queryKey: ["candidates", "list", f], queryFn: () => apiFetch<CandidateListResponse>(`/manpower/candidates?${qs(f)}`), staleTime: 20_000 });

export const useJobOrderPipeline = (jobOrderId: string | null) =>
  useQuery({ queryKey: ["job-order-pipeline", jobOrderId ?? ""], queryFn: () => apiFetch<JobOrderPipelineDto>(`/manpower/job-orders/${jobOrderId}/pipeline`), enabled: !!jobOrderId });

const invCand = (qc: ReturnType<typeof useQueryClient>) => { qc.invalidateQueries({ queryKey: ["candidates"] }); qc.invalidateQueries({ queryKey: ["job-order-pipeline"] }); qc.invalidateQueries({ queryKey: ["job-orders"] }); };

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CandidateCreateInput) => apiFetch<CandidateDto>("/manpower/candidates", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (d) => { invCand(qc); toast.success(`${d.code} added`); },
    onError: err,
  });
}
export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CandidateUpdateInput }) => apiFetch<CandidateDto>(`/manpower/candidates/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { invCand(qc); toast.success("Candidate updated"); },
    onError: err,
  });
}
export function useTransitionCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CandidateTransitionInput }) => apiFetch<CandidateDto>(`/manpower/candidates/${id}/transition`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (d) => { invCand(qc); toast.success(`Moved to ${d.status}`); },
    onError: err,
  });
}
export function useArchiveCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/manpower/candidates/${id}`, { method: "DELETE" }),
    onSuccess: () => { invCand(qc); toast.success("Candidate archived"); },
    onError: err,
  });
}
