import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  BusinessPartnerListResponse, BusinessPartnerDto,
  BusinessPartnerCreateInput, BusinessPartnerUpdateInput,
} from "@contracts/business-network.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export interface PartnerFilters { q?: string; type?: string; status?: string; page?: number; pageSize?: number }

const qs = (f: PartnerFilters) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== "" && v !== "all") s.set(k, String(v));
  return s.toString();
};

export const useBusinessPartners = (f: PartnerFilters = {}) =>
  useQuery({
    queryKey: ["business-partners", "list", f],
    queryFn: () => apiFetch<BusinessPartnerListResponse>(`/business-partners?${qs(f)}`),
    staleTime: 30_000,
  });

export function useCreateBusinessPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BusinessPartnerCreateInput) => apiFetch<BusinessPartnerDto>("/business-partners", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["business-partners"] }); toast.success(`${d.code} added`); },
    onError: err,
  });
}

export function useUpdateBusinessPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BusinessPartnerUpdateInput }) =>
      apiFetch<BusinessPartnerDto>(`/business-partners/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["business-partners"] }); toast.success("Company updated"); },
    onError: err,
  });
}

export function useArchiveBusinessPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/business-partners/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["business-partners"] }); toast.success("Company archived"); },
    onError: err,
  });
}
