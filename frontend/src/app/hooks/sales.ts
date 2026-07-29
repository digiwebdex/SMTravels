import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  QuotationListItem, QuotationListResponse, QuotationDetail,
  QuotationCreateInput, QuotationUpdateInput, ConvertResult,
} from "@contracts/sales.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export interface SalesFilters { q?: string; status?: string; serviceType?: string; branchId?: string }

const qs = (f: SalesFilters) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v && v !== "all") s.set(k, v);
  return s.toString();
};

export const salesKeys = {
  list: (f: SalesFilters) => ["sales", "list", f] as const,
  detail: (id: string) => ["sales", "detail", id] as const,
};

export const useQuotations = (f: SalesFilters = {}) =>
  useQuery({ queryKey: salesKeys.list(f), queryFn: () => apiFetch<QuotationListResponse>(`/quotations?${qs(f)}`), staleTime: 20_000 });

export const useQuotation = (id: string | null) =>
  useQuery({ queryKey: salesKeys.detail(id ?? ""), queryFn: () => apiFetch<QuotationDetail>(`/quotations/${id}`), enabled: !!id });

const invalidate = (qc: ReturnType<typeof useQueryClient>, d?: QuotationDetail) => {
  qc.invalidateQueries({ queryKey: ["sales"] });
  if (d) qc.setQueryData(salesKeys.detail(d.id), d);
};

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuotationCreateInput) => apiFetch<QuotationDetail>("/quotations", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (d) => { invalidate(qc, d); toast.success(`Quotation ${d.quoteNo} created`); },
    onError: err,
  });
}
export function useUpdateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: QuotationUpdateInput }) => apiFetch<QuotationDetail>(`/quotations/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (d) => { invalidate(qc, d); toast.success("Quotation updated"); },
    onError: err,
  });
}
export function useConvertQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<ConvertResult>(`/quotations/${id}/convert`, { method: "POST" }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["sales"] }); qc.invalidateQueries({ queryKey: ["bookings"] }); toast.success(r.convertedLead ? "Converted — lead → customer → draft booking" : "Converted to a draft booking"); },
    onError: err,
  });
}
export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: true }>(`/quotations/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(qc); toast.success("Quotation deleted"); },
    onError: err,
  });
}

export type { QuotationListItem, QuotationDetail, QuotationCreateInput, ConvertResult };
