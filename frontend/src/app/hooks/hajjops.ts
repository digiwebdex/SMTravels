import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  QuotaDto, BatchDto, BatchDetail, RegistrationDto, PassportAlertDto,
  QuotaCreateInput, BatchCreateInput, RegistrationCreateInput, AssignCapacityInput,
} from "@contracts/hajjops.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export interface OpsFilters { serviceType?: string; season?: string; status?: string; branchId?: string; q?: string }

const qs = (p: OpsFilters) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v && v !== "all") s.set(k, v);
  return s.toString();
};

export const opsKeys = {
  quotas: (f: OpsFilters) => ["ops", "quotas", f] as const,
  batches: (f: OpsFilters) => ["ops", "batches", f] as const,
  batch: (id: string) => ["ops", "batch", id] as const,
  registrations: (f: OpsFilters) => ["ops", "registrations", f] as const,
  passportAlerts: (f: OpsFilters) => ["ops", "passport-alerts", f] as const,
};
const opts = { staleTime: 30_000 };

// ── queries ─────────────────────────────────────────────────────────────────
export const useQuotas = (f: OpsFilters = {}) =>
  useQuery({ queryKey: opsKeys.quotas(f), queryFn: () => apiFetch<{ data: QuotaDto[] }>(`/ops/quotas?${qs(f)}`).then((r) => r.data), ...opts });
export const useBatches = (f: OpsFilters = {}) =>
  useQuery({ queryKey: opsKeys.batches(f), queryFn: () => apiFetch<{ data: BatchDto[] }>(`/ops/batches?${qs(f)}`).then((r) => r.data), ...opts });
export const useBatch = (id: string | null) =>
  useQuery({ queryKey: opsKeys.batch(id ?? ""), queryFn: () => apiFetch<BatchDetail>(`/ops/batches/${id}`), enabled: !!id });
export const useRegistrations = (f: OpsFilters = {}) =>
  useQuery({ queryKey: opsKeys.registrations(f), queryFn: () => apiFetch<{ data: RegistrationDto[] }>(`/ops/registrations?${qs(f)}`).then((r) => r.data), ...opts });
export const usePassportAlerts = (f: OpsFilters = {}) =>
  useQuery({ queryKey: opsKeys.passportAlerts(f), queryFn: () => apiFetch<{ data: PassportAlertDto[] }>(`/ops/passport-alerts?${qs(f)}`).then((r) => r.data), ...opts });

// ── mutations ────────────────────────────────────────────────────────────────
export function useCreateQuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuotaCreateInput) => apiFetch<QuotaDto>("/ops/quotas", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops", "quotas"] }); toast.success("Quota created"); },
    onError: err,
  });
}
export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BatchCreateInput) => apiFetch<BatchDto>("/ops/batches", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (b) => { qc.invalidateQueries({ queryKey: ["ops", "batches"] }); toast.success(`Batch ${b.code} created`); },
    onError: err,
  });
}
export function useCreateRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegistrationCreateInput) => apiFetch<RegistrationDto>("/ops/registrations", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops", "registrations"] }); toast.success("Pilgrim registered"); },
    onError: err,
  });
}
export function useAssignCapacity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignCapacityInput) => apiFetch<{ ok: boolean }>("/ops/assign", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops"] }); toast.success("Booking assigned"); },
    onError: err,
  });
}

export type { QuotaDto, BatchDto, BatchDetail, RegistrationDto, PassportAlertDto };
