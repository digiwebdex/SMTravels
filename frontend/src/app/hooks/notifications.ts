import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export interface MyNotification {
  id: string;
  title: string;
  body: string | null;
  type: string | null;
  color: string | null;
  read: boolean;
  createdAt: string;
}

const KEY = ["notifications", "mine"] as const;

/** My in-app notifications (any authenticated user; userId-scoped server-side). */
export const useMyNotifications = () =>
  useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<{ data: MyNotification[] }>("/notifications").then((r) => r.data),
    refetchInterval: 60_000, // staff leave the ERP open all day — keep the bell fresh
  });

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ ok: boolean }>("/notifications/read-all", { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** "2m" / "3h" / "5d" style relative age for the bell dropdown. */
export function relAge(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
