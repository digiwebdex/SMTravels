import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { OcrResult } from "@contracts/ocr.contract";

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

export type { OcrResult };
