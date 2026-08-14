import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type { IntegrationsStatusDto, IntegrationTestInput } from "@contracts/integrations.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export interface WasenderConfig {
  enabled: boolean;
  baseUrl: string;
  hasApiKey: boolean;
  apiKeyMasked: string;
  configured: boolean;
}
export interface WasenderInput {
  enabled?: boolean;
  baseUrl?: string;
  apiKey?: string;
}

export const integrationKeys = {
  status: ["integrations", "status"] as const,
};

export function useIntegrationsStatus() {
  return useQuery({
    queryKey: integrationKeys.status,
    queryFn: () => apiFetch<IntegrationsStatusDto>("/integrations/status"),
    staleTime: 30_000,
  });
}

export function useTestIntegration() {
  return useMutation({
    mutationFn: (input: IntegrationTestInput) =>
      apiFetch<{ ok: boolean; message?: string }>("/integrations/test", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => toast.success("Test message sent"),
    onError: err,
  });
}

// ── Wasender WhatsApp gateway (admin-settable) ───────────────────────────────
export function useWasenderConfig() {
  return useQuery({
    queryKey: ["integrations", "wasender"],
    queryFn: () => apiFetch<WasenderConfig>("/integrations/wasender"),
    staleTime: 30_000,
  });
}

export function useSaveWasender() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WasenderInput) =>
      apiFetch<WasenderConfig>("/integrations/wasender", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("WhatsApp (Wasender) settings saved");
    },
    onError: err,
  });
}

export function useTestWasender() {
  return useMutation({
    mutationFn: (to: string) =>
      apiFetch<{ ok: boolean }>("/integrations/wasender/test", { method: "POST", body: JSON.stringify({ to }) }),
    onSuccess: () => toast.success("Test WhatsApp message sent ✓"),
    onError: err,
  });
}
