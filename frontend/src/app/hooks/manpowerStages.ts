import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  MedicalListResponse, MedicalDto, MedicalCreateInput, MedicalUpdateInput,
  BmetListResponse, BmetDto, BmetCreateInput, BmetUpdateInput,
} from "@contracts/manpower-stages.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");
const qs = <T extends object>(f: T) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== "" && v !== "all") s.set(k, String(v));
  return s.toString();
};
export interface StageFilters { q?: string; status?: string; jobOrderId?: string; employerId?: string; pageSize?: number }

// ─── Medical ─────────────────────────────────────────────────────────────────
export const useMedicalList = (f: StageFilters = {}) =>
  useQuery({ queryKey: ["medical", "list", f], queryFn: () => apiFetch<MedicalListResponse>(`/manpower/medical?${qs(f)}`), staleTime: 20_000 });
export function useCreateMedical() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: MedicalCreateInput) => apiFetch<MedicalDto>("/manpower/medical", { method: "POST", body: JSON.stringify(input) }), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["medical"] }); toast.success(`${d.code} added`); }, onError: err });
}
export function useUpdateMedical() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: MedicalUpdateInput }) => apiFetch<MedicalDto>(`/manpower/medical/${id}`, { method: "PATCH", body: JSON.stringify(input) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["medical"] }); toast.success("Medical updated"); }, onError: err });
}
export function useArchiveMedical() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/manpower/medical/${id}`, { method: "DELETE" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["medical"] }); toast.success("Medical archived"); }, onError: err });
}

// ─── BMET ────────────────────────────────────────────────────────────────────
export const useBmetList = (f: StageFilters = {}) =>
  useQuery({ queryKey: ["bmet", "list", f], queryFn: () => apiFetch<BmetListResponse>(`/manpower/bmet?${qs(f)}`), staleTime: 20_000 });
export function useCreateBmet() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: BmetCreateInput) => apiFetch<BmetDto>("/manpower/bmet", { method: "POST", body: JSON.stringify(input) }), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["bmet"] }); toast.success(`${d.code} added`); }, onError: err });
}
export function useUpdateBmet() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: BmetUpdateInput }) => apiFetch<BmetDto>(`/manpower/bmet/${id}`, { method: "PATCH", body: JSON.stringify(input) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["bmet"] }); toast.success("BMET updated"); }, onError: err });
}
export function useArchiveBmet() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/manpower/bmet/${id}`, { method: "DELETE" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["bmet"] }); toast.success("BMET archived"); }, onError: err });
}
