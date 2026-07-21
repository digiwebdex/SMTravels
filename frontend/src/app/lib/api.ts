/**
 * Typed API client for the SM Travels backend.
 *
 * Token policy (matches the backend + the no-browser-storage data policy):
 *   - The access token lives ONLY in this module's memory (never localStorage /
 *     sessionStorage / cookie). A full page reload drops it — see AuthContext,
 *     which re-mints one from the httpOnly refresh cookie on boot.
 *   - Every request is sent with credentials:"include" so the refresh cookie
 *     rides along to /api/auth/refresh.
 *   - On a 401 we transparently refresh ONCE and retry; if that fails the
 *     session is over and the registered handler sends the user to /login.
 */
import { API_BASE_URL } from "./config";

// ── in-memory access token ───────────────────────────────────────────────────
let accessToken: string | null = null;
export function getAccessToken(): string | null {
  return accessToken;
}
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// ── session-expired hook (AuthContext registers a redirect-to-login) ──────────
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: (() => void) | null): void {
  onSessionExpired = fn;
}

// ── shared types ──────────────────────────────────────────────────────────────
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  branchId: string | null;
  avatarUrl: string | null;
  status: string;
}
export interface MeResponse {
  user: PublicUser;
  roles: string[];
  permissions: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message || code);
    this.name = "ApiError";
  }
}

// ── low-level fetch ───────────────────────────────────────────────────────────
async function rawFetch(path: string, init: RequestInit, withAuth: boolean): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (withAuth && accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: "include" });
}

async function toError(res: Response): Promise<ApiError> {
  let code = res.statusText || "Error";
  let message = code;
  try {
    const body = await res.json();
    code = body.error ?? code;
    // Prefer the human-readable detail the backend sends (HttpError `details.detail`)
    // over the bare error code, so friendly messages surface in toasts.
    message = body.message ?? body.details?.detail ?? body.error ?? message;
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(res.status, code, message);
}

// Single-flight refresh: concurrent 401s share one /auth/refresh round-trip.
let refreshInFlight: Promise<boolean> | null = null;
function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await rawFetch("/auth/refresh", { method: "POST" }, false);
        if (!res.ok) return false;
        const data = (await res.json()) as { accessToken: string };
        accessToken = data.accessToken;
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

interface FetchOpts {
  auth?: boolean; // attach access token + refresh-on-401 (default true)
  retry?: boolean; // allow the one refresh+retry (default true)
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, opts: FetchOpts = {}): Promise<T> {
  const auth = opts.auth ?? true;
  let res = await rawFetch(path, init, auth);

  if (res.status === 401 && auth && (opts.retry ?? true)) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      res = await rawFetch(path, init, true); // retry once with the fresh token
    } else {
      accessToken = null;
      onSessionExpired?.();
      throw await toError(res);
    }
  }

  if (!res.ok) throw await toError(res);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

// ── typed auth endpoints ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; user: PublicUser }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      { auth: false },
    ),
  me: () => apiFetch<MeResponse>("/auth/me"),
  logout: () => apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" }, { auth: false, retry: false }),
  forgotPassword: (email: string) =>
    apiFetch<{ ok: boolean; message: string; devOtp?: string }>(
      "/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
      { auth: false },
    ),
  verifyOtp: (email: string, otp: string) =>
    apiFetch<{ resetToken: string }>(
      "/auth/verify-otp",
      { method: "POST", body: JSON.stringify({ email, otp }) },
      { auth: false },
    ),
  resetPassword: (resetToken: string, password: string) =>
    apiFetch<{ ok: boolean }>(
      "/auth/reset-password",
      { method: "POST", body: JSON.stringify({ resetToken, password }) },
      { auth: false },
    ),
};
