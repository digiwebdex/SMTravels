import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  ExchangeRateListResponse, ExchangeRateDto, ExchangeRateCreateInput, ExchangeRateUpdateInput,
  CurrencySettingsDto, CurrencySettingsInput,
} from "@contracts/currency.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export const useExchangeRates = (currency?: string) =>
  useQuery({
    queryKey: ["currency", "rates", currency ?? "all"],
    queryFn: () => apiFetch<ExchangeRateListResponse>(`/currency/rates${currency ? `?currency=${currency}` : ""}`),
    staleTime: 30_000,
  });

export const useCurrencySettings = () =>
  useQuery({ queryKey: ["currency", "settings"], queryFn: () => apiFetch<CurrencySettingsDto>("/currency/settings"), staleTime: 60_000 });

export function useCreateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExchangeRateCreateInput) => apiFetch<ExchangeRateDto>("/currency/rates", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["currency", "rates"] }); toast.success("Exchange rate added"); },
    onError: err,
  });
}

export function useUpdateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExchangeRateUpdateInput }) =>
      apiFetch<ExchangeRateDto>(`/currency/rates/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["currency", "rates"] }); toast.success("Rate updated"); },
    onError: err,
  });
}

export function useDeactivateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/currency/rates/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["currency", "rates"] }); toast.success("Rate removed"); },
    onError: err,
  });
}

export function useSetCurrencySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CurrencySettingsInput) => apiFetch<CurrencySettingsDto>("/currency/settings", { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["currency", "settings"] }); toast.success("Currency settings saved"); },
    onError: err,
  });
}
