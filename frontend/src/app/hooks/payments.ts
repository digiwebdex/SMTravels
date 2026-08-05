import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  PaymentDto,
  PaymentProofSubmitInput,
  PaymentVerifyInput,
  PendingPaymentListResponse,
  PublicBankAccountDto,
} from "@contracts/finance.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export const paymentKeys = {
  portalBanks: ["payments", "portal", "banks"] as const,
  pendingVerify: ["payments", "pending-verify"] as const,
};

export function usePortalBankAccounts() {
  return useQuery({
    queryKey: paymentKeys.portalBanks,
    queryFn: () => apiFetch<{ data: PublicBankAccountDto[] }>("/portal/bank-accounts").then((r) => r.data),
  });
}

export interface SubmitPaymentProofInput extends PaymentProofSubmitInput {
  file?: File;
}

export function useSubmitPaymentProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitPaymentProofInput) => {
      const fd = new FormData();
      fd.append("amount", String(input.amount));
      if (input.currency) fd.append("currency", input.currency);
      fd.append("reference", input.reference);
      if (input.invoiceId) fd.append("invoiceId", input.invoiceId);
      if (input.bookingId) fd.append("bookingId", input.bookingId);
      if (input.documentId) fd.append("documentId", input.documentId);
      if (input.file) fd.append("file", input.file);
      return apiFetch<PaymentDto>("/portal/payments/proof", { method: "POST", body: fd });
    },
    onSuccess: () => {
      toast.success("Payment proof submitted — awaiting verification");
      void qc.invalidateQueries({ queryKey: ["portal", "payments"] });
      void qc.invalidateQueries({ queryKey: ["portal", "invoices"] });
      void qc.invalidateQueries({ queryKey: ["portal", "dashboard"] });
    },
    onError: err,
  });
}

export function usePendingVerifyPayments() {
  return useQuery({
    queryKey: paymentKeys.pendingVerify,
    queryFn: () => apiFetch<PendingPaymentListResponse>("/payments/pending-verify"),
    refetchInterval: 60_000,
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: PaymentVerifyInput & { id: string }) =>
      apiFetch<PaymentDto>(`/payments/${id}/verify`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_, vars) => {
      toast.success(vars.approve ? "Payment approved" : "Payment rejected");
      void qc.invalidateQueries({ queryKey: paymentKeys.pendingVerify });
      void qc.invalidateQueries({ queryKey: ["fin"] });
    },
    onError: err,
  });
}
