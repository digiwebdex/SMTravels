import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { documentKeys } from "./documents";
import type { OcrResult } from "@contracts/ocr.contract";
import type { DocumentOcrResultDto } from "@contracts/document.contract";

const err = (e: Error) => toast.error(e.message || "OCR failed");

/** Scan a passport image → extracted fields to PRE-FILL an editable form.
 *  The result is a review draft, never authoritative (staff verify + edit). */
export function useScanPassport() {
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiFetch<OcrResult>("/ocr/passport", { method: "POST", body: fd });
    },
  });
}

/** Run OCR on a STORED document by id (persisted + audited) — branch feature. */
export function useRunOcr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      apiFetch<DocumentOcrResultDto>(`/documents/${documentId}/ocr`, { method: "POST" }),
    onSuccess: (r) => {
      toast.success(`OCR complete (${r.ocrConfidence ?? 0}% confidence)`);
      void qc.invalidateQueries({ queryKey: documentKeys.all });
    },
    onError: err,
  });
}

export type { OcrResult };
