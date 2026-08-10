import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  InquiryListResponse, InquiryDto, InquiryCreateInput, InquiryUpdateInput, InquiryTransitionInput,
  CustomPackageListResponse, CustomPackageDto, CustomPackageDetailDto,
  PackageCreateInput, PackageUpdateInput, PackageTransitionInput, ItemCreateInput, ItemUpdateInput,
} from "@contracts/custom-package.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");
const qs = <T extends object>(f: T) => { const s = new URLSearchParams(); for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== "" && v !== "all") s.set(k, String(v)); return s.toString(); };

// ─── Inquiries ───────────────────────────────────────────────────────────────
export interface InquiryFilters { q?: string; status?: string; pageSize?: number }
export const useInquiries = (f: InquiryFilters = {}) =>
  useQuery({ queryKey: ["pkg-inquiries", "list", f], queryFn: () => apiFetch<InquiryListResponse>(`/package-inquiries?${qs(f)}`), staleTime: 20_000 });
const invInq = (qc: ReturnType<typeof useQueryClient>) => { qc.invalidateQueries({ queryKey: ["pkg-inquiries"] }); qc.invalidateQueries({ queryKey: ["custom-packages"] }); };
export function useCreateInquiry() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: InquiryCreateInput) => apiFetch<InquiryDto>("/package-inquiries", { method: "POST", body: JSON.stringify(i) }), onSuccess: (d) => { invInq(qc); toast.success(`${d.code} added`); }, onError: err }); }
export function useUpdateInquiry() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: InquiryUpdateInput }) => apiFetch<InquiryDto>(`/package-inquiries/${id}`, { method: "PATCH", body: JSON.stringify(input) }), onSuccess: () => { invInq(qc); toast.success("Inquiry updated"); }, onError: err }); }
export function useTransitionInquiry() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: InquiryTransitionInput }) => apiFetch<InquiryDto>(`/package-inquiries/${id}/transition`, { method: "POST", body: JSON.stringify(input) }), onSuccess: (d) => { invInq(qc); toast.success(`Moved to ${d.status}`); }, onError: err }); }
export function useArchiveInquiry() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/package-inquiries/${id}`, { method: "DELETE" }), onSuccess: () => { invInq(qc); toast.success("Inquiry archived"); }, onError: err }); }

// ─── Custom Packages ─────────────────────────────────────────────────────────
export interface PackageFilters { q?: string; status?: string; customerId?: string; pageSize?: number }
export const usePackages = (f: PackageFilters = {}) =>
  useQuery({ queryKey: ["custom-packages", "list", f], queryFn: () => apiFetch<CustomPackageListResponse>(`/custom-packages?${qs(f)}`), staleTime: 20_000 });
export const usePackage = (id: string | null) =>
  useQuery({ queryKey: ["custom-packages", "detail", id ?? ""], queryFn: () => apiFetch<CustomPackageDetailDto>(`/custom-packages/${id}`), enabled: !!id });
const invPkg = (qc: ReturnType<typeof useQueryClient>, id?: string) => { qc.invalidateQueries({ queryKey: ["custom-packages"] }); if (id) qc.invalidateQueries({ queryKey: ["custom-packages", "detail", id] }); qc.invalidateQueries({ queryKey: ["pkg-inquiries"] }); };
export function useCreatePackage() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: PackageCreateInput) => apiFetch<CustomPackageDetailDto>("/custom-packages", { method: "POST", body: JSON.stringify(i) }), onSuccess: (d) => { invPkg(qc, d.id); toast.success(`${d.code} created`); }, onError: err }); }
export function useUpdatePackage() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: PackageUpdateInput }) => apiFetch<CustomPackageDetailDto>(`/custom-packages/${id}`, { method: "PATCH", body: JSON.stringify(input) }), onSuccess: (d) => { invPkg(qc, d.id); toast.success("Package updated"); }, onError: err }); }
export function useTransitionPackage() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: PackageTransitionInput }) => apiFetch<CustomPackageDetailDto>(`/custom-packages/${id}/transition`, { method: "POST", body: JSON.stringify(input) }), onSuccess: (d) => { invPkg(qc, d.id); toast.success(`Moved to ${d.status}`); }, onError: err }); }
export function useConvertPackage() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => apiFetch<CustomPackageDetailDto>(`/custom-packages/${id}/convert`, { method: "POST" }), onSuccess: (d) => { invPkg(qc, d.id); qc.invalidateQueries({ queryKey: ["bookings"] }); toast.success("Booking created"); }, onError: err }); }
export function useArchivePackage() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/custom-packages/${id}`, { method: "DELETE" }), onSuccess: () => { invPkg(qc); toast.success("Package archived"); }, onError: err }); }
export function useAddItem() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: ItemCreateInput }) => apiFetch<CustomPackageDetailDto>(`/custom-packages/${id}/items`, { method: "POST", body: JSON.stringify(input) }), onSuccess: (d) => { invPkg(qc, d.id); }, onError: err }); }
export function useUpdateItem() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ itemId, input }: { itemId: string; input: ItemUpdateInput }) => apiFetch<CustomPackageDetailDto>(`/custom-packages/items/${itemId}`, { method: "PATCH", body: JSON.stringify(input) }), onSuccess: (d) => { invPkg(qc, d.id); }, onError: err }); }
export function useRemoveItem() { const qc = useQueryClient(); return useMutation({ mutationFn: (itemId: string) => apiFetch<CustomPackageDetailDto>(`/custom-packages/items/${itemId}`, { method: "DELETE" }), onSuccess: (d) => { invPkg(qc, d.id); }, onError: err }); }
