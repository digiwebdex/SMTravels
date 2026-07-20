/**
 * SM Travels — frontend build configuration.
 *
 * NOTE: this is a STATIC Vite build. `VITE_API_URL` is compiled in at BUILD time
 * (from frontend/.env.production, which Vite loads automatically in build mode)
 * and CANNOT be changed on the server after `vite build`.
 *
 * Not wired into any UI component yet — the app currently runs on mock data.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:4030/api"; // dev fallback (local backend)
