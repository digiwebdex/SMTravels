import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, downloadViaApi } from "../lib/api";
import type {
  DocumentDto, DocumentListResult, DocumentTypeDto,
} from "@contracts/document.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

// ── query keys ────────────────────────────────────────────────────────────────
export const documentKeys = {
  list: (p: unknown) => ["documents", "list", p] as const,
  all: ["documents"] as const,
};

export interface DocumentListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  type?: string;
  status?: string;
  bookingId?: string;
  customerId?: string;
}

function qstr(p: Record<string, string | number | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "" && v !== "All") s.set(k, String(v));
  return s.toString();
}

export const useErpDocuments = (params: DocumentListParams = {}) =>
  useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => apiFetch<DocumentListResult>(`/documents?${qstr(params as Record<string, string | number | undefined>)}`),
  });

/** Upload one document. Exactly one owner id (bookingId/travelerId/customerId/
 *  supplierId) — mirrors the backend contract. */
export interface UploadDocumentInput {
  file: File;
  type: DocumentTypeDto;
  name?: string;
  bookingId?: string;
  travelerId?: string;
  customerId?: string;
  supplierId?: string;
  expiryAt?: string; // yyyy-mm-dd
  required?: boolean;
}

function toFormData(input: UploadDocumentInput): FormData {
  const fd = new FormData();
  fd.append("file", input.file);
  fd.append("type", input.type);
  for (const k of ["name", "bookingId", "travelerId", "customerId", "supplierId", "expiryAt"] as const) {
    const v = input[k];
    if (v) fd.append(k, v);
  }
  if (input.required != null) fd.append("required", String(input.required));
  return fd;
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadDocumentInput) =>
      apiFetch<DocumentDto>("/documents", { method: "POST", body: toFormData(input) }),
    onSuccess: (d) => {
      toast.success(`"${d.name}" uploaded`);
      void qc.invalidateQueries({ queryKey: documentKeys.all });
    },
    onError: err,
  });
}

/** ERP download — authenticated fetch, then a browser save. */
export const downloadDocumentFile = (d: Pick<DocumentDto, "id" | "name">) =>
  downloadViaApi(`/documents/${d.id}/file`, d.name).catch(err);
