import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  OpsMemberListItem, OpsMemberListResponse, OpsMemberDetail,
  OpsMemberCreateInput, OpsMemberUpdateInput,
} from "@contracts/operations.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export interface OpsFilters { q?: string; roleType?: string; status?: string; branchId?: string }

const qs = (f: OpsFilters) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v && v !== "all") s.set(k, v);
  return s.toString();
};

export const opsTeamKeys = {
  list: (f: OpsFilters) => ["ops-team", "list", f] as const,
  detail: (id: string) => ["ops-team", "detail", id] as const,
};

export const useOpsMembers = (f: OpsFilters = {}) =>
  useQuery({ queryKey: opsTeamKeys.list(f), queryFn: () => apiFetch<OpsMemberListResponse>(`/operations-team?${qs(f)}`), staleTime: 30_000 });

export const useOpsMember = (id: string | null) =>
  useQuery({ queryKey: opsTeamKeys.detail(id ?? ""), queryFn: () => apiFetch<OpsMemberDetail>(`/operations-team/${id}`), enabled: !!id });

/** MUALLIM roster options for the batch muallim picker (own + global crew). */
export const useMuallimOptions = () =>
  useQuery({ queryKey: ["ops-team", "muallims"], queryFn: () => apiFetch<OpsMemberListResponse>(`/operations-team?roleType=MUALLIM`).then((r) => r.data), staleTime: 60_000 });

const invalidate = (qc: ReturnType<typeof useQueryClient>, d?: OpsMemberDetail) => {
  qc.invalidateQueries({ queryKey: ["ops-team"] });
  if (d) qc.setQueryData(opsTeamKeys.detail(d.id), d);
};

export function useCreateOpsMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OpsMemberCreateInput) => apiFetch<OpsMemberDetail>("/operations-team", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (d) => { invalidate(qc, d); toast.success(`${d.memberCode} added`); },
    onError: err,
  });
}
export function useUpdateOpsMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: OpsMemberUpdateInput }) => apiFetch<OpsMemberDetail>(`/operations-team/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (d) => { invalidate(qc, d); toast.success("Member updated"); },
    onError: err,
  });
}
export function useDeleteOpsMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: true }>(`/operations-team/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(qc); toast.success("Member removed"); },
    onError: err,
  });
}

export type { OpsMemberListItem, OpsMemberListResponse, OpsMemberDetail, OpsMemberCreateInput };
