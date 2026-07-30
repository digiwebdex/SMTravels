import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  MessageTemplateDto,
  MessageTemplateCreateInput,
  MessageTemplateUpdateInput,
  SendMessageInput,
  BulkSendInput,
  OutboundLogItem,
  TemplateChannelDto,
} from "@contracts/communications.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export const commsKeys = {
  templates: (channel?: TemplateChannelDto) => ["communications", "templates", channel ?? "all"] as const,
  outbound: ["communications", "outbound"] as const,
};

export function useMessageTemplates(channel?: TemplateChannelDto) {
  const qs = channel ? `?channel=${channel}` : "";
  return useQuery({
    queryKey: commsKeys.templates(channel),
    queryFn: () => apiFetch<{ data: MessageTemplateDto[] }>(`/communications/templates${qs}`).then((r) => r.data),
  });
}

export function useOutboundLog() {
  return useQuery({
    queryKey: commsKeys.outbound,
    queryFn: () => apiFetch<{ data: OutboundLogItem[] }>("/communications/outbound").then((r) => r.data),
    staleTime: 15_000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      apiFetch<{ ok: true }>("/communications/send", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      toast.success("Message queued for delivery");
      void qc.invalidateQueries({ queryKey: commsKeys.outbound });
    },
    onError: err,
  });
}

export function useBulkSend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkSendInput) =>
      apiFetch<{ ok: true; queued?: number }>("/communications/bulk", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (r) => {
      toast.success(`Bulk send queued (${r.queued ?? 0} recipients)`);
      void qc.invalidateQueries({ queryKey: commsKeys.outbound });
    },
    onError: err,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MessageTemplateCreateInput) =>
      apiFetch<MessageTemplateDto>("/communications/templates", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      toast.success("Template created");
      void qc.invalidateQueries({ queryKey: ["communications", "templates"] });
    },
    onError: err,
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: MessageTemplateUpdateInput & { id: string }) =>
      apiFetch<MessageTemplateDto>(`/communications/templates/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      toast.success("Template updated");
      void qc.invalidateQueries({ queryKey: ["communications", "templates"] });
    },
    onError: err,
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>(`/communications/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Template deleted");
      void qc.invalidateQueries({ queryKey: ["communications", "templates"] });
    },
    onError: err,
  });
}

export type { MessageTemplateDto, OutboundLogItem, SendMessageInput, BulkSendInput, TemplateChannelDto };
