import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  UserListResponse, UserListItem, UserCreateInput, UserUpdateInput,
  RoleDto, BranchListItem, BranchUpdateInput,
  AgentListResponse, AgentCreateInput, AgentUpdateInput,
  SupplierListResponse, SupplierCreateInput, SupplierUpdateInput,
} from "@contracts/settings.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export const settingsKeys = {
  users: (p: unknown) => ["settings", "users", p] as const,
  roles: ["settings", "roles"] as const,
  branches: ["settings", "branches"] as const,
  agents: (p: unknown) => ["settings", "agents", p] as const,
  suppliers: (p: unknown) => ["settings", "suppliers", p] as const,
};

function qs(p: Record<string, string | number | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "" && v !== "all") s.set(k, String(v));
  return s.toString();
}

export function useAdminUsers(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: settingsKeys.users(params),
    queryFn: () => apiFetch<UserListResponse>(`/admin/users?${qs(params)}`),
    placeholderData: (p) => p,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UserCreateInput) => apiFetch<UserListItem>("/admin/users", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", "users"] }); toast.success("User created"); },
    onError: err,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UserUpdateInput & { id: string }) =>
      apiFetch<UserListItem>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", "users"] }); toast.success("User updated"); },
    onError: err,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: settingsKeys.roles,
    queryFn: () => apiFetch<{ data: RoleDto[] }>("/roles").then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useAdminBranches() {
  return useQuery({
    queryKey: settingsKeys.branches,
    queryFn: () => apiFetch<{ data: BranchListItem[] }>("/admin/branches").then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: BranchUpdateInput & { id: string }) =>
      apiFetch<BranchListItem>(`/admin/branches/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: settingsKeys.branches }); toast.success("Branch updated"); },
    onError: err,
  });
}

export function useAgents(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: settingsKeys.agents(params),
    queryFn: () => apiFetch<AgentListResponse>(`/agents?${qs(params)}`),
    placeholderData: (p) => p,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AgentCreateInput) => apiFetch("/agents", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", "agents"] }); toast.success("Agent created"); },
    onError: err,
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: AgentUpdateInput & { id: string }) =>
      apiFetch(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", "agents"] }); toast.success("Agent updated"); },
    onError: err,
  });
}

export function useSuppliers(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: settingsKeys.suppliers(params),
    queryFn: () => apiFetch<SupplierListResponse>(`/suppliers?${qs(params)}`),
    placeholderData: (p) => p,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SupplierCreateInput) => apiFetch("/suppliers", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", "suppliers"] }); toast.success("Supplier created"); },
    onError: err,
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SupplierUpdateInput & { id: string }) =>
      apiFetch(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", "suppliers"] }); toast.success("Supplier updated"); },
    onError: err,
  });
}

export type { UserListItem, RoleDto, BranchListItem };
