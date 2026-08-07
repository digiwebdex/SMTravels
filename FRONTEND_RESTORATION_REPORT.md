# SM Travels — FRONTEND RESTORATION REPORT
**Branch:** `feature/marketing-restore` (`dab5782`, off production `master`/`5a41c16`)
**Source of the latest design:** `feature/website-v2-redesign` (`5507a77`)
**Date:** 2026-08-06

## What & why
Production V2.0's public homepage was the **simpler** 553-line Home; the **richer marketing frontend** (778-line Home with video gallery, package carousels, dedicated Hajj/Umrah sections, modern nav, premium footer) lives on `feature/website-v2-redesign`. This restores that marketing layer onto V2.0 **without touching any backend, API, auth, ERP, admin, or database code.**

## Preservation guarantee (verified)
`git diff --stat origin/master` touches **only** the public marketing frontend. **0 files** changed under `erp/`, `portal/`, `auth/`, or `backend/`. Kept V2.0's `Auth.tsx` (authentication unchanged), `DesignSystem.tsx`, and every ERP/portal route. The data layer is **endpoint-identical** to V2.0's unchanged `/public/*` CMS API (packages/blog/faqs/gallery/testimonials/banners/menus/pages), so the restored pages read live CMS content through the same backend. `lib/utils` was taken as an **additive superset** (`cn`/`fmtPrice`/`img` byte-identical; adds `SITE_IMAGES`/`mediaUrl`/`PACKAGE_IMAGE_FALLBACK`).

## Restored components
| Requested | Status | Where |
|---|---|---|
| Latest Hero section | ✅ Restored | `Home.tsx` `ApproveHeroBackground` (kaaba hero) |
| Flight route illustration | ✅ Restored | `Home.tsx` hero graphics |
| Service cards grid | ✅ Restored | `Home.tsx` service links grid |
| Hajj package section | ✅ Restored | `Home.tsx` (`usePublicPackages({type:"Hajj"})`) |
| Umrah package section | ✅ Restored | `Home.tsx` (`usePublicPackages({type:"Umrah"})`) |
| Better package cards | ✅ Restored | `PackageCarousel` + `PackageSlideCard` |
| Video gallery | ✅ Restored | `website/videos.ts` + `VideoPlayerModal` + Home video section |
| Statistics section | ✅ Restored | `website/primitives.tsx` `StatCounter` |
| Premium footer | ✅ Restored | `Layout.tsx` footer (payment logos, columns, socials) |
| Modern navigation | ✅ Restored | `Layout.tsx` (utility bar + primary nav + Others dropdown + mobile drawer) |
| Mobile responsiveness | ✅ Present | responsive Tailwind (`md:`/`lg:`/`xl:` + mobile drawer) |
| Lazy loading | ✅ Present | route-level `lazyNamed`/`Suspense` + `SkeletonBlock` |
| Image optimization | ✅ Restored | `mediaUrl()`/`img()`/`SITE_IMAGES` + `PACKAGE_IMAGE_FALLBACK` |
| **Search cards** | ⚠️ **NOT in source** | Not present in the redesign branch's Home |
| **Comparison section** | ⚠️ **NOT in source** | Not present in the redesign branch's Home |
| **Newsletter** | ⚠️ **NOT in source** | Not present in the redesign `Layout` footer |

> **Honest note:** three requested items (search cards, comparison section, newsletter) do **not** exist in the `feature/website-v2-redesign` source, so they were **not** restored (I did not fabricate them). If they belong to a still-newer design, point me at that branch/commit and I'll port them.

## Files changed
Pages: Home, About, Packages, Contact, Blog, FAQ, Gallery, Knowledge (new), ServicePage, Sitemap, NotFound, CmsPages, Booking · New `website/` dir: primitives, videos, VideoPlayerModal, demoPackages, knowledge/guides, PaymentLogos · Shared marketing: `components/Layout.tsx`, `hooks/publicContent.ts`, `lib/data.ts`, `lib/utils.ts` · `routes.tsx` (+`/videos`, `/knowledge`, `/knowledge/:slug`; `/transport` & `/hotels` → `ServicePage`).  24 files changed, 3938 insertions(+), 2442 deletions(-) ; **0 backend/erp/portal/auth**.

## Post-restoration verification
- **Frontend build (vite):** ✅ PASS.
- **TypeScript:** ✅ marketing layer clean (0 errors in pages/website/routes); the 26 remaining `tsc` errors are the **pre-existing lucide-icon type baseline in unchanged ERP files** (documented previously; don't block the esbuild build).
- **Routes:** ✅ every marketing nav target resolves to a defined route (`/`, `/about`, `/hajj`, `/umrah`, `/visa`, `/air-ticket`, `/tour-packages`, `/hotel-booking`, `/transport`, `/manpower`, `/knowledge`, `/videos`, `/gallery`, `/faq`, `/blog`, `/packages`, `/contact`, legal, `/login`) — no broken links.
- **Responsive:** ✅ responsive utilities + mobile drawer present (visual QA on devices recommended post-deploy).
- **SEO metadata:** ✅ `index.html` has `<title>`, description, canonical OG (`og:title/description/url/image`), Twitter card, `lang`.
- **Structured data (JSON-LD):** ⚠️ **0 found** — recommend adding `Organization`/`LocalBusiness`/`BreadcrumbList` schema.org JSON-LD for rich results.
- **Accessibility:** nav links/buttons carry `aria-label`s; recommend a labeling pass on icon-only controls (see the QA report's a11y section) — most of those are in ERP (unchanged).
- **Performance / Lighthouse:** the main JS bundle grew **~720 KB → ~902 KB (272 KB gzip)** from the richer pages + `motion` animations; charts stay lazy-chunked. Recommend `manualChunks` (split `motion`/vendor) + lazy-load heavy sections before a Lighthouse pass. *(Headless Lighthouse was not run in this environment; run it against the deployed URL.)*

## Deploy (I could not run it — the live box is unreachable from here)
This work is on `srv1468666`; the **live site is `srv1868345` (200.141.8.183)**, which is **not SSH-reachable from here**. The branch is pushed to origin for you to deploy:
```bash
# on srv1868345 (live), after reviewing the branch/PR:
cd /var/www/SMTravels
git fetch origin
git checkout feature/marketing-restore     # or merge to master first
(cd frontend && npm ci && npm run build)    # backend NOT rebuilt/changed
systemctl reload nginx                      # static dist only; no API/service change needed
```
No `smtravels-api` restart or DB migration is required — **only the public `frontend/dist` changes.**

## Recommendation
Restore is build-verified and scope-safe. Before go-live: (1) visual/responsive QA on real devices, (2) run Lighthouse on the deployed URL, (3) add JSON-LD structured data, (4) decide whether the 3 missing sections (search/comparison/newsletter) are wanted — if so, provide the design/source and I'll add them.
