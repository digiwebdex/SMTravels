import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  SupplierListItem, SupplierListResponse, SupplierDetail,
  SupplierCreateInput, SupplierUpdateInput,
  SupplierServiceCreateInput, SupplierServiceUpdateInput,
} from "@contracts/suppliers.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export interface SupplierFilters { q?: string; category?: string; status?: string; branchId?: string }

const qs = (f: SupplierFilters) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v && v !== "all") s.set(k, v);
  return s.toString();
};

export const supplierKeys = {
  list: (f: SupplierFilters) => ["suppliers", "list", f] as const,
  detail: (id: string) => ["suppliers", "detail", id] as const,
};

export const useSuppliers = (f: SupplierFilters = {}) =>
  useQuery({ queryKey: supplierKeys.list(f), queryFn: () => apiFetch<SupplierListResponse>(`/suppliers?${qs(f)}`), staleTime: 30_000 });

export const useSupplier = (id: string | null) =>
  useQuery({ queryKey: supplierKeys.detail(id ?? ""), queryFn: () => apiFetch<SupplierDetail>(`/suppliers/${id}`), enabled: !!id });

const invalidate = (qc: ReturnType<typeof useQueryClient>, d?: SupplierDetail) => {
  qc.invalidateQueries({ queryKey: ["suppliers"] });
  if (d) qc.setQueryData(supplierKeys.detail(d.id), d);
};

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SupplierCreateInput) => apiFetch<SupplierDetail>("/suppliers", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (d) => { invalidate(qc, d); toast.success(`Supplier ${d.supplierCode} created`); },
    onError: err,
  });
}
export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SupplierUpdateInput }) => apiFetch<SupplierDetail>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (d) => { invalidate(qc, d); toast.success("Supplier updated"); },
    onError: err,
  });
}
export function useCreateSupplierService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SupplierServiceCreateInput }) => apiFetch<SupplierDetail>(`/suppliers/${id}/services`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (d) => { invalidate(qc, d); toast.success("Service added"); },
    onError: err,
  });
}
export function useUpdateSupplierService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, input }: { serviceId: string; input: SupplierServiceUpdateInput }) => apiFetch<SupplierDetail>(`/suppliers/services/${serviceId}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (d) => { invalidate(qc, d); toast.success("Service updated"); },
    onError: err,
  });
}
export function useDeleteSupplierService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => apiFetch<SupplierDetail>(`/suppliers/services/${serviceId}`, { method: "DELETE" }),
    onSuccess: (d) => { invalidate(qc, d); toast.success("Service removed"); },
    onError: err,
  });
}

export type { SupplierListItem, SupplierListResponse, SupplierDetail, SupplierCreateInput, SupplierUpdateInput, SupplierServiceCreateInput };
