import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type { OcrResult, OcrApplyResult, DocumentOcrDetailDto } from "@contracts/ocr.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export const ocrKeys = {
  pending: (p: unknown) => ["ocr", "pending", p] as const,
  history: (p: unknown) => ["ocr", "history", p] as const,
  detail: (id: string) => ["ocr", "detail", id] as const,
};

/** Scan a passport image → extracted fields to PRE-FILL an editable form. */
export function useScanPassport() {
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiFetch<OcrResult>("/ocr/passport", { method: "POST", body: fd });
    },
  });
}

export function useRunDocumentOcr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      apiFetch<DocumentOcrDetailDto>(`/documents/${documentId}/ocr`, { method: "POST" }),
    onSuccess: (d) => {
      toast.success(`OCR complete · confidence ${d.ocrConfidence ?? 0}%`);
      void qc.invalidateQueries({ queryKey: ["ocr"] });
      void qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: err,
  });
}

export function useDocumentOcr(id: string | null) {
  return useQuery({
    queryKey: ocrKeys.detail(id ?? ""),
    queryFn: () => apiFetch<DocumentOcrDetailDto>(`/documents/${id}/ocr`),
    enabled: !!id,
  });
}

export function useOcrPending(params: { page?: number; pageSize?: number } = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  return useQuery({
    queryKey: ocrKeys.pending({ page, pageSize }),
    queryFn: () =>
      apiFetch<{ data: DocumentOcrDetailDto[]; total: number }>(
        `/documents-ocr/pending?page=${page}&pageSize=${pageSize}`,
      ),
  });
}

export function useOcrHistory(params: { page?: number; pageSize?: number } = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 30;
  return useQuery({
    queryKey: ocrKeys.history({ page, pageSize }),
    queryFn: () =>
      apiFetch<{ data: { id: string; action: string; target: string | null; userId: string | null; createdAt: string }[]; total: number }>(
        `/documents-ocr/history?page=${page}&pageSize=${pageSize}`,
      ),
  });
}

export function useCorrectDocumentOcr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Record<string, unknown> }) =>
      apiFetch<DocumentOcrDetailDto>(`/documents/${id}/ocr`, {
        method: "PATCH",
        body: JSON.stringify({ fields }),
      }),
    onSuccess: (d) => {
      toast.success("Corrections saved");
      void qc.invalidateQueries({ queryKey: ocrKeys.detail(d.id) });
      void qc.invalidateQueries({ queryKey: ["ocr"] });
    },
    onError: err,
  });
}

export function useApplyOcr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      target: "customer" | "traveler" | "visa" | "booking";
      fields: Record<string, unknown>;
      correctedFields?: Record<string, string>;
      documentId?: string;
      customerId?: string;
      travelerId?: string;
      bookingId?: string;
      phone?: string;
      createCustomer?: boolean;
    }) => apiFetch<OcrApplyResult>("/ocr/apply", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (r) => {
      toast.success(
        r.persisted
          ? `OCR applied${r.createdCustomer ? " · customer created" : r.updatedCustomer ? " · customer updated" : ""}${r.updatedTraveler ? " · traveler updated" : ""}`
          : "Draft mapped",
      );
      void qc.invalidateQueries({ queryKey: ["ocr"] });
      void qc.invalidateQueries({ queryKey: ["documents"] });
      void qc.invalidateQueries({ queryKey: ["customers"] });
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: err,
  });
}

export type { OcrResult, OcrApplyResult, DocumentOcrDetailDto };
