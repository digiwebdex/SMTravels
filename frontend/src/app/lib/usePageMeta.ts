import { useEffect } from "react";

const SITE = "SM Travels International";

/**
 * Per-route <title> + <meta name="description"> for this SPA (no SSR / head lib).
 * Each marketing page calls this so search results and social shares show a
 * unique title/description instead of the single static homepage one.
 * Values are restored on unmount so back-navigation stays correct.
 */
export function usePageMeta(title?: string, description?: string): void {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = `${title} — ${SITE}`;

    let metaEl: HTMLMetaElement | null = null;
    let prevDesc: string | null = null;
    if (description) {
      metaEl = document.querySelector('meta[name="description"]');
      if (metaEl) {
        prevDesc = metaEl.getAttribute("content");
        metaEl.setAttribute("content", description);
      }
    }

    return () => {
      document.title = prevTitle;
      if (metaEl && prevDesc !== null) metaEl.setAttribute("content", prevDesc);
    };
  }, [title, description]);
}
