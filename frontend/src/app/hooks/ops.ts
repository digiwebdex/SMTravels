import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  AnnouncementCreateInput,
  OpsAnnouncementDto,
  OpsAuditLogDto,
  OpsTaskCreateInput,
  OpsTaskDto,
  OpsTaskUpdateInput,
} from "@contracts/ops.contract";

function qstr(p: Record<string, string | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "") s.set(k, v);
  return s.toString();
}

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export const opsKeys = {
  tasks: (p: unknown) => ["ops", "tasks", p] as const,
  announcements: ["ops", "announcements"] as const,
  auditLogs: ["ops", "auditLogs"] as const,
};

/** Map API enum to UI kebab-case (IN_PROGRESS → in-progress). */
export function statusUi(s: string): string {
  return s.toLowerCase().replace(/_/g, "-");
}

/** Map UI kebab-case to API enum (in-progress → IN_PROGRESS). */
export function statusApi(s: string): string {
  return s.toUpperCase().replace(/-/g, "_");
}

export function priUi(p: string): string {
  return p.toLowerCase();
}

export function priApi(p: string): string {
  return p.toUpperCase();
}

export function fmtDue(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export interface TaskListParams {
  status?: string;
  q?: string;
}

export function useTasks(params: TaskListParams = {}) {
  const apiParams: Record<string, string | undefined> = {};
  if (params.status && params.status !== "All") apiParams.status = statusApi(params.status);
  if (params.q) apiParams.q = params.q;
  return useQuery({
    queryKey: opsKeys.tasks(params),
    queryFn: () => apiFetch<{ data: OpsTaskDto[] }>(`/tasks?${qstr(apiParams)}`).then((r) => r.data),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OpsTaskCreateInput) =>
      apiFetch<OpsTaskDto>("/tasks", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ops", "tasks"] });
      toast.success("Task created");
    },
    onError: err,
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: OpsTaskUpdateInput & { id: string }) =>
      apiFetch<OpsTaskDto>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["ops", "tasks"] }),
    onError: err,
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: opsKeys.announcements,
    queryFn: () => apiFetch<{ data: OpsAnnouncementDto[] }>("/announcements").then((r) => r.data),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnnouncementCreateInput) =>
      apiFetch<OpsAnnouncementDto>("/announcements", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: opsKeys.announcements });
      toast.success("Announcement posted");
    },
    onError: err,
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: opsKeys.auditLogs,
    queryFn: () => apiFetch<{ data: OpsAuditLogDto[] }>("/audit-logs").then((r) => r.data),
  });
}

export const TASK_STATUSES = ["todo", "in-progress", "blocked", "done"] as const;
