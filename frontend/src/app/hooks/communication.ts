import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  MessageTemplateDto, MessageLogDto, MessageLogResponse, SendResult,
  TemplateCreateInput, TemplateUpdateInput, SendInput,
} from "@contracts/communication.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export interface LogFilters { q?: string; status?: string; branchId?: string }
const qs = (f: LogFilters) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v && v !== "all") s.set(k, v);
  return s.toString();
};

export const commKeys = {
  templates: () => ["comm", "templates"] as const,
  logs: (f: LogFilters) => ["comm", "logs", f] as const,
};

export const useSmsTemplates = () =>
  useQuery({ queryKey: commKeys.templates(), queryFn: () => apiFetch<{ data: MessageTemplateDto[] }>("/sms/templates").then((r) => r.data), staleTime: 30_000 });

export const useSmsLogs = (f: LogFilters = {}) =>
  useQuery({ queryKey: commKeys.logs(f), queryFn: () => apiFetch<MessageLogResponse>(`/sms/logs?${qs(f)}`), staleTime: 15_000 });

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TemplateCreateInput) => apiFetch<MessageTemplateDto>("/sms/templates", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: commKeys.templates() }); toast.success("Template saved"); },
    onError: err,
  });
}
export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TemplateUpdateInput }) => apiFetch<MessageTemplateDto>(`/sms/templates/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: commKeys.templates() }); toast.success("Template updated"); },
    onError: err,
  });
}
export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: true }>(`/sms/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: commKeys.templates() }); toast.success("Template removed"); },
    onError: err,
  });
}
export function useSendSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendInput) => apiFetch<SendResult>("/sms/send", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["comm", "logs"] });
      const mode = r.smsConfigured ? `${r.sent} sent` : `${r.logged} logged (SMS not configured)`;
      toast.success(`${r.total} recipient(s): ${mode}${r.failed ? `, ${r.failed} failed` : ""}`);
    },
    onError: err,
  });
}

export type { MessageTemplateDto, MessageLogDto, SendResult };
