import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  PartnerListItem, PartnerListResponse, PartnerDetail, PartnerUpdateInput,
} from "@contracts/partners.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export interface PartnerFilters { q?: string; tier?: string; status?: string; branchId?: string }

const qs = (f: PartnerFilters) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v && v !== "all") s.set(k, v);
  return s.toString();
};

export const partnerKeys = {
  list: (f: PartnerFilters) => ["partners", "list", f] as const,
  detail: (id: string) => ["partners", "detail", id] as const,
};

export const usePartners = (f: PartnerFilters = {}) =>
  useQuery({ queryKey: partnerKeys.list(f), queryFn: () => apiFetch<PartnerListResponse>(`/partners?${qs(f)}`), staleTime: 30_000 });

export const usePartner = (id: string | null) =>
  useQuery({ queryKey: partnerKeys.detail(id ?? ""), queryFn: () => apiFetch<PartnerDetail>(`/partners/${id}`), enabled: !!id });

/** The only write: commission-tier assignment + status. The wallet ledger is
 *  immutable and has no mutating endpoint — corrections are back-office reversals. */
export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PartnerUpdateInput }) =>
      apiFetch<PartnerDetail>(`/partners/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.setQueryData(partnerKeys.detail(p.id), p);
    },
    onError: err,
  });
}

export type { PartnerListItem, PartnerListResponse, PartnerDetail, PartnerUpdateInput };
