import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  authApi,
  setAccessToken,
  setSessionExpiredHandler,
  type MeResponse,
  type PublicUser,
} from "../lib/api";

type Status = "loading" | "authed" | "anon";

interface AuthValue {
  status: Status;
  user: PublicUser | null;
  roles: string[];
  /** module -> "view" | "full" (highest access the user's RBAC roles grant). */
  permissions: Record<string, string>;
  /** RBAC check used to gate UI (e.g. hide sidebar items). */
  can: (module: string, level?: "view" | "manage") => boolean;
  login: (email: string, password: string) => Promise<PublicUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const ANON = { user: null as PublicUser | null, roles: [] as string[], permissions: {} as Record<string, string> };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<typeof ANON>(ANON);

  const applyMe = (me: MeResponse) => {
    setData({ user: me.user, roles: me.roles, permissions: me.permissions });
    setStatus("authed");
  };

  // Bootstrap on load: /auth/me sends no token, gets a 401, which apiFetch turns
  // into a silent /auth/refresh using the httpOnly cookie — so a page refresh
  // restores the session. No cookie ⇒ refresh fails ⇒ anonymous.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      setData(ANON);
      setStatus("anon");
    });
    let alive = true;
    (async () => {
      try {
        const me = await authApi.me();
        if (alive) applyMe(me);
      } catch {
        if (alive) {
          setData(ANON);
          setStatus("anon");
        }
      }
    })();
    return () => {
      alive = false;
      setSessionExpiredHandler(null);
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<PublicUser> => {
    const { accessToken } = await authApi.login(email, password);
    setAccessToken(accessToken);
    const me = await authApi.me(); // pull role + RBAC permission map
    setData({ user: me.user, roles: me.roles, permissions: me.permissions });
    setStatus("authed");
    return me.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setData(ANON);
      setStatus("anon");
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user: data.user,
      roles: data.roles,
      permissions: data.permissions,
      can: (module, level = "view") => {
        const access = data.permissions[module];
        if (!access || access === "none") return false;
        return level === "manage" ? access === "full" : access === "view" || access === "full";
      },
      login,
      logout,
    }),
    [status, data, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
