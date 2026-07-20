/**
 * SM Travels — frontend build configuration.
 *
 * NOTE: this is a STATIC Vite build. `VITE_API_URL` is compiled in at BUILD time
 * (from frontend/.env.production, which Vite loads automatically in build mode)
 * and CANNOT be changed on the server after `vite build`.
 *
 * In dev the fallback is the RELATIVE "/api", which the Vite proxy (see
 * vite.config.ts) forwards to the local backend — keeping the API same-origin
 * so the httpOnly refresh cookie works. In prod, VITE_API_URL should also be a
 * same-origin path (e.g. "/api") served by nginx alongside the SPA.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "/api"; // dev fallback → Vite proxy → backend
