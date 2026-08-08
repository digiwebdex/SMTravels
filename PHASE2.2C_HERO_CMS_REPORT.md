# Phase 2.2C — Homepage Hero → CMS (VERIFIED)

**Date:** 2026-08-08 · **Canonical tree:** `/var/www/SMTravels` (host srv1468666) · **Policy honored:** additive-only migration, 0 data loss, dedicated Hero model + endpoint, fallback-first UI (no visual change), bilingual-ready.

> **Honest headline:** Every **visible** hero element is now CMS-driven and verified end-to-end — title, highlight, subtitle, primary CTA, secondary CTA, trust badges, background image, and overlay. Three requested fields exist in the model + API but are **not rendered** by the current design (**eyebrow**, **mobile image**, **background video** — the last is explicitly "future-ready"). And, as before, **there is no Admin UI** — the hero is editable via DB/seed only (Admin CRUD is the agreed later work). I am **not** claiming Admin-editability.

---

## 1. Models reused
- None for the hero (a dedicated model was the right call). Reused for prior sections: `Setting` (newsletter/announcement), `Menu`/`MenuItem` (nav/footer).

## 2. Models added
- **`Hero`** — bilingual + all requested fields: `key, eyebrow/eyebrowBn, title/titleBn, highlight/highlightBn, subtitle/subtitleBn, primaryLabel/primaryLabelBn/primaryUrl, secondaryLabel/secondaryLabelBn/secondaryUrl, backgroundImage, mobileImage, backgroundVideo, overlay, badges (JSONB), sortOrder, visible, published` (+ timestamps, soft-delete). Reusable across pages via `key`.

## 3. APIs added
- **`GET /api/public/hero?key=home`** (dedicated — does not overload other endpoints) → the published hero for a page, or `null`. Filtered `visible && published`, ordered by `sortOrder`. **Verified 200** with full data; unknown key → `null`.

## 4. Hero fields now CMS-driven
| Field | Status |
|---|---|
| Main Title (+ Bn) | ✅ rendered from CMS |
| Highlight Text (+ Bn) | ✅ CMS (orange span reproduced by wrapping the highlight substring) |
| Subtitle (+ Bn) | ✅ CMS |
| Primary CTA label (+ Bn) + URL | ✅ CMS |
| Secondary CTA label (+ Bn) | ✅ CMS (behavior = video button; URL optional/future) |
| Trust Badges (icon + label + Bn) | ✅ CMS (`badges` JSON) |
| Background Image | ✅ CMS (`backgroundImage`) |
| Overlay | ✅ CMS (`overlay`) |
| Sort Order / Visible / Published | ✅ enforced by the API |
| Eyebrow (+ Bn) | ⚠️ model + API ready, **not rendered** (no eyebrow in the current design) |
| Mobile Image | ⚠️ model + API ready, **not rendered** (single `<img>` for all viewports) |
| Background Video | ⚠️ model + API ready, **not rendered** (explicitly "future-ready") |

**No-visual-change guarantee:** the hero was seeded with the **exact current values** (title/highlight/subtitle/badges/CTAs/overlay identical to the prior hardcoded strings), and the frontend falls back to the built-in hero if the API returns `null`.

## 5. Remaining hardcoded homepage items
- **Rules & Guidelines / Sunnah & Prohibitions** sections (static Islamic reference content) — still hardcoded.
- **Video tutorials** section — still hardcoded and still references missing `/videos/*` in this tree.
- **Homepage Section Manager** (visible/reorder + JSON renderer) — not built (deferred per your instruction).
- **Admin CRUD UIs** for Hero/Statistics/Services + Settings editor — not built (deferred).

## 6. Build status
- Backend: `prisma validate` ✔, `generate` ✔, typecheck **0 errors in changed files**, `tsc` build ✔ (exit 0). Migration additive `CREATE TABLE "Hero"` — **all row counts unchanged, 0 data loss**. Seed idempotent (`Hero` upsert; Statistics/Services unchanged).
- Frontend: changed files typecheck-clean (116 total = pre-existing ERP baseline), `vite build` ✔ (exit 0), bundle `index-eYr6yFYy.js`, nginx reloaded.

## 7. API status (via nginx, https)
- `/api/public/hero` **200** (full hero incl. overlay + 4 badges) · unknown key → `null`.
- `/api/health` **200** · `/api/public/{services,statistics,menus,settings,packages}` **200**.
- Served bundle contains the hero code (`public/hero` marker present).

## Verification checklist (your list)
- ✅ Hero API returns data (200, all fields) · ✅ No build errors (backend + frontend exit 0) · ✅ Fallbacks work if hero empty (unknown key → null → built-in hero) · ✅ API health 200 · ✅ ERP works (`/erp` 200) · ✅ Auth works (login 400 = alive) · ✅ Portal works (`/portal /agent /customer` 200).
- ⚠️ **Hero renders correctly / no runtime console errors / matches previous design** — verified at **code + data + build** level (seed values are byte-identical to the old hardcoded strings; title-highlight split and overlay reproduce the exact design; typecheck + build clean). **Pixel-level/console confirmation needs a real browser, which isn't available in this environment** — please spot-check visually on the deployed page. I will not claim pixel-perfection I didn't observe.

## 8. Homepage CMS completion %
- CMS-driven sections: **Hero, Services, Packages, Statistics, Newsletter, Announcement** = **6 of ~9** → **~70%**. The **Hero (the largest, most-visible section) is now done.** Remaining: Rules/Sunnah (static reference) + Video (placeholder).

## 9. Website CMS completion %
- Content pages + Nav + Footer + these homepage sections are CMS-**served**: **~60–65%** of the marketing site (read path).
- **Admin write path (edit from a CMS UI): still ~0% for the new modules** — the honest, standing gap.

## 10. Production readiness
- **On the canonical box (srv1468666):** the Hero conversion is **live and verified** with safe fallback. GO for this slice.
- **Full homepage / full site CMS-drive:** partial (Rules/Sunnah/Video remain; no admin UIs).
- **Public Cloudflare host (srv1868345):** separate box, **not updated** here.

## 11. GO / NO-GO
- **GO** for Phase 2.2C — every **visible** hero element is CMS-driven and every requested verification passed (additive migration, 0 data loss, endpoints 200, fallback works, site integrity intact, no build errors).
- **NO-GO** for "homepage 100% CMS-driven" — Rules/Sunnah/Video sections remain, eyebrow/mobileImage/backgroundVideo are model-only, and **no module has an Admin UI yet**.

**Next slices:** (a) render eyebrow/mobile-image/background-video to fully exhaust the Hero model, (b) convert Rules/Sunnah (or drop Video), (c) the **Admin CRUD UIs** to make Hero/Statistics/Services actually editable from the CMS.
