/**
 * Language persistence — COOKIE only.
 *
 * The data policy bans localStorage/sessionStorage (ESLint-enforced), so the
 * user's language choice rides in a plain cookie (same pattern as the sidebar
 * cookie). Default is Bangla ("bn"); English ("en") is the fallback.
 */
export type Lang = "bn" | "en";
export const LANGS: Lang[] = ["bn", "en"];
export const DEFAULT_LANG: Lang = "bn";
const COOKIE = "st_lang";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function readLangCookie(): Lang {
  const m = typeof document !== "undefined" ? document.cookie.match(/(?:^|;\s*)st_lang=(bn|en)/) : null;
  return (m?.[1] as Lang) ?? DEFAULT_LANG;
}

export function writeLangCookie(lang: Lang): void {
  document.cookie = `${COOKIE}=${lang}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

/** Keep <html lang="…"> in sync so `:lang(bn)` CSS + a11y are correct. */
export function applyHtmlLang(lang: Lang): void {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}
