/** localStorage helpers for ERP nav favorites / recent paths (frontend-only). */

const FAV_KEY = "smtravels-nav-favorites";
const RECENT_KEY = "smtravels-nav-recent";

export function loadFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]"); } catch { return []; }
}

export function toggleFavorite(path: string): string[] {
  const cur = loadFavorites();
  const next = cur.includes(path) ? cur.filter((p) => p !== path) : [path, ...cur].slice(0, 12);
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
}

export function loadRecent(): { path: string; label: string; at: number }[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}

export function pushRecent(path: string, label: string) {
  const cur = loadRecent().filter((r) => r.path !== path);
  const next = [{ path, label, at: Date.now() }, ...cur].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
