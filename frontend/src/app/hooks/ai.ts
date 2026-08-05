import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type { AiChatInput, AiChatResult } from "@contracts/ai.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

/** Public website AI chat (no auth required). */
export function usePublicAiChat() {
  return useMutation({
    mutationFn: (input: AiChatInput) =>
      apiFetch<AiChatResult>("/public/ai/chat", {
        method: "POST",
        body: JSON.stringify(input),
      }, { auth: false }),
    onError: err,
  });
}

/** Authenticated ERP AI assistant. */
export function useErpAiChat() {
  return useMutation({
    mutationFn: (input: Omit<AiChatInput, "createLead">) =>
      apiFetch<AiChatResult>("/ai/chat", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onError: err,
  });
}

/** Portal AI assistant — simple `{ message }` + Bearer auth. */
export function usePortalAiChat() {
  return useMutation({
    mutationFn: (message: string) =>
      apiFetch<AiChatResult>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    onError: err,
  });
}
