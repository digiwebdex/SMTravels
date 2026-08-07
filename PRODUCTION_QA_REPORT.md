# SM Travels — Marketing Frontend Production QA Report

**Date:** 2026-08-07 · **Branch:** `feature/marketing-restore` (`dab5782` + QA fixes, uncommitted) · **Scope:** public/marketing website only (ERP, portals, auth, backend, DB **not touched**)

**Method:** three independent read-only static auditors (a11y+SEO, broken-assets+data, layout+runtime) across every marketing page, **plus live checks against the production public API** (`https://smtravelsinternational.com/api/public/*`) and asset resolution on the live host, plus a production `tsc`+`vite build`. Not static-analysis only — every homepage section was traced to its data source and verified against what production actually returns.

---

## Verdict: **CONDITIONAL GO**

The marketing **code** is production-ready after the fixes below: it builds clean, has **no broken images, no runtime crashes, accessible core flows, and unique per-route SEO titles**. Go is **conditional on three non-code items** the code cannot resolve:

1. **Ship the fixes** — they are staged in the working tree, not committed/pushed. See §Deploy.
2. **Owner content** — real photography and **video files** (the code degrades gracefully, but see C1/C2).
3. **A product decision** on the non-functional video gallery (supply media or hide it).

---

## What production actually serves (verified live)

| Endpoint | Result | Consequence |
|---|---|---|
| `/api/public/packages` | **real data** — 3 Hajj, 3 Umrah, 1 Tour, 1 Visa (`rating:0, reviews:0`) | Popular Packages + service pages populate correctly |
| `…/testimonials, banners, blog, gallery, faqs` | **200, empty `[]`** | Those sections show their (correct) empty states — no crash, no blank |
| `…/menus`, `…/pages` | **404** | `usePublicMenu` unused (nav is hardcoded ✔); CMS pages fall back to hardcoded text (C4) |
| type filter case | **case-insensitive** (`HAJJ`=`Hajj`) | ServicePage uppercase mismatch is latent only (hardened anyway) |
| `/hero-approve.jpg`, `/hero-approve.png` | **404** | was the site-wide hero — **fixed** |
| `/packages/*.jpg`, `/videos/*.jpg|mp4` | **missing (SPA fallback)** | all package/video imagery was broken — **fixed for images**; videos = C2 |

Empty-state and error handling across all API-driven sections was found **correct** (skeleton → error → empty), so no data-driven section renders blank or throws.

---

## Fixes applied (17 files, build-verified, design unchanged)

### Broken images — CRITICAL/HIGH (resolved)
The restored design referenced an asset scheme never committed to the repo (`/hero-approve.jpg` ×26, `/hero-journey.jpg` ×4, `/packages/umrah-gold.jpg` fallback). All repointed to the **existing** `/hero-makkah-poster.jpg` (ships in `dist`, same visual intent — Makkah hero), preserving the static-hero design:
- `lib/utils.ts` — `SITE_IMAGES.kaabaHero` + `PACKAGE_IMAGE_FALLBACK`
- `lib/data.ts` — 8× `SERVICES[].heroImage` (drives every subpage `PageHero`)
- `pages/{About,Blog,Contact,FAQ,Gallery,Knowledge,NotFound,Packages,CmsPages,Booking}.tsx` — all `PageHero image=…`
- `website/primitives.tsx` (PageHero + VideoCard defaults), `website/videos.ts` (videoThumb default)
- `pages/Home.tsx` — hero `onError` **infinite-loop guard** added + repoint (was ping-ponging between two 404s)
- Added guarded `onError` fallbacks to the **video-thumbnail** images (Home strip + `VideoCard`) so missing posters degrade to a real image, not a broken icon

### Runtime — HIGH (resolved)
- `primitives.tsx` `PackageCard`: `pkg.rating.toFixed(1)` → `(pkg.rating ?? 0).toFixed(1)` and `pkg.reviews ?? 0` — the live API can null these; this would have crashed the whole card grid.

### Accessibility — HIGH/MEDIUM (resolved)
- `Contact.tsx`: icon-only Facebook/Instagram links given `aria-label`; all form fields (name/email/phone/service/message) given associated `htmlFor`/`id`.
- `Layout.tsx`: footer social links given distinct `aria-label`s (were 5× identical "Social"); **"Others" nav dropdown** made keyboard/touch-operable (`onClick` toggle + focus open/close + `aria-haspopup`/`aria-controls`) — was hover-only.
- `Packages/Blog/FAQ`: search inputs given `aria-label` (were placeholder-only).
- `Gallery.tsx`: lightbox given **Escape-to-close + arrow-key nav** (previously mouse-only).
- `Knowledge.tsx`: dead "PDF (coming soon)" `<a href="#">` → `<button disabled>`.
- `About.tsx`: meaningful `alt` on the two story photos.

### SEO — CRITICAL/HIGH (resolved for titles)
- New deploy-safe runtime hook `lib/usePageMeta.ts` sets a **unique per-route `<title>` + meta description** (restored on unmount). Wired into **9 pages**: Home, About, ServicePage (covers `/hajj`, `/umrah`, `/visa`, `/air-ticket`, `/manpower`, `/tour-packages`, `/hotel-booking`, `/transport` with the service name), Packages, Blog, FAQ, Gallery, Knowledge. Previously every route shared the one homepage title.

### Robustness — LOW (resolved)
- `ServicePage.tsx`: `TYPE_BY_SERVICE` normalized to canonical title-case (avoids a demo-fallback trap if the backend ever becomes case-sensitive).
- `CmsPages.tsx`: fixed **duplicate render** of legal text on a 404 (`{!isLoading}` → `{!isLoading && !isError}`).

**Build after fixes:** `vite build` ✓ · **0 marketing-file `tsc` errors** (the 26 remaining are the pre-existing ERP `lucide`/`ErpOutletCtx` baseline, untouched).

---

## Requires OWNER action (not code — flagged, not "fixed")

| # | Sev | Item | Why code can't fix it |
|---|---|---|---|
| **C1** | HIGH | **Real photography** — package cards, hero, About all currently degrade to the single `/hero-makkah-poster.jpg` (Hajj/Umrah on-theme; a Tour/Dubai card also shows Makkah). Package `image` paths in the DB (`/packages/*.jpg`) point to files that don't exist on prod. | Real photos must be added to `frontend/public/packages/` (+ committed) or the DB image fields repointed. No stock can be invented. |
| **C2** | HIGH | **Video gallery is non-functional** — `SITE_VIDEOS` lists 6 guides whose `/videos/*.mp4` don't exist; clicking Play opens a player with no source. Thumbnails now degrade gracefully, but the feature can't play. | Needs the actual video files, **or** a decision to hide the video sections until media exists (a UX change I did not make unilaterally). |
| **C3** | MED | **Newsletter + Contact/Booking forms** — newsletter submit is client-only (no endpoint); confirm Contact/Booking POST targets exist end-to-end. | Backend/endpoint decision. |
| **C4** | MED | **CMS legal pages** (Privacy/Terms/Refund/Career) render short **hardcoded fallback** because `/public/pages/*` 404s; Career fallback exposes `hr@smtravel.com.bd`. | Real legal copy must be entered in the CMS (or `/public/pages` enabled). |
| C5 | LOW | Unsplash stock imagery presented as own photos (About, hero fallback); payment-brand SVGs are approximations; an "Airline Partners" strip is unbuilt though 8 logos + heading exist. | Licensed/owned assets + a product call. |

---

## SEO / a11y items intentionally NOT auto-changed (recommended)

- **`index.html`-level SEO** (JSON-LD Organization/Product/Breadcrumb; per-route `canonical`/`og:url`; `og:image` is currently just the logo). **Important:** the keep-both deploy **preserves the box's local `index.html`**, so editing source `index.html` would not ship — these must be applied to the **live box's** `index.html`. Snippets available on request.
- **Detail-page titles** (`/packages/:id`, `/blog/:slug`, `/knowledge/:slug`) — the hook is ready; a 1-line call each with the loaded item title.
- **Focus-trap** for `VideoPlayerModal` and the mobile drawer (both have Escape; lack focus trap/restore).
- **Contrast**: the `#F37021` eyebrow on light backgrounds is ~3:1 (below AA for small text) — a brand-color change, so left for design sign-off.
- **Perf**: main bundle **904 kB (272 kB gzip)** — driven by eager Home + `motion` + i18n + react-query. A `manualChunks` vendor split is the fix; it's a build-config change I left for approval rather than risk the deploy.

---

## Deploy interaction (must read before shipping these fixes)

- All fixes are in the **working tree, uncommitted**. The deploy script fetches `origin/feature/marketing-restore`, so **nothing here reaches prod until committed + pushed.**
- **`Layout.tsx` was modified.** The keep-both deploy patch guards on the Layout blob being `950b125`; once Layout changes, **that patch must be regenerated** and the deploy script's embedded patch + blob-guard updated. I can do the commit + push + patch-regen together on request.
- These changes are **frontend-only** — no backend/DB/service impact. Publishing is a `dist` rebuild (no API restart, no migration).

**Bottom line:** the restored marketing site is **code-ready and safe to ship**; the remaining gate is content (C1–C4, especially the non-playable videos) plus the mechanical ship step (commit/push + Layout-patch regen).
