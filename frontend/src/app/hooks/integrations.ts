import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type { IntegrationsStatusDto, IntegrationTestInput } from "@contracts/integrations.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

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
