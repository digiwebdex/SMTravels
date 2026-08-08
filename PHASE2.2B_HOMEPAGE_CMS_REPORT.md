# Phase 2.2B — Homepage → CMS: Services + Newsletter + Announcement (VERIFIED)

**Date:** 2026-08-08 · **Canonical tree:** `/var/www/SMTravels` (host srv1468666) · **Policy honored:** additive-only migration (CREATE TABLE), 0 data loss, reuse existing Settings, fallback-first UI (no visual change).

> **Brutally honest headline:** This turn I converted **3 more homepage sections and verified them — Services, Newsletter, Announcement bar.** I did **not** convert the **Hero**, **Homepage CTA text**, or build the **Section Manager (reorder)** — those are deferred. And per your rule: **none of these are Admin-UI editable yet** — the data lives in the DB and serves to the site, but there is **no admin screen to edit it** (editable via DB/seed only). Admin CRUD is the agreed "later" work.

---

## 1. Homepage sections completed (CMS-driven, verified)
| Section | Status | Source |
|---|---|---|
| **Services grid** (8 cards) | ✅ this turn | `HomeService` → `/api/public/services` |
| **Newsletter** (heading/desc/placeholder/button) | ✅ this turn | `Setting` (`newsletter.*`) → `/api/public/settings` |
| **Announcement bar** (text/link/bg/color/dismissible) | ✅ this turn | `Setting` (`announcement.*`); **default OFF** → no visual change |
| Statistics | ✅ (Phase 2.2) | `Statistic` → `/api/public/statistics` |
| Popular Packages | ✅ (pre-existing) | `/api/public/packages` |

## 2. Models reused
- **`Setting`** — Newsletter text (8 keys) + Announcement bar (7 keys). No new model needed (your "reuse Settings" rule).
- (Banner model was **not** needed for the announcement bar — a single homepage bar fits Settings; multi-announcement scheduling via Banner remains future.)

## 3. Models added
- **`HomeService`** — `title, shortDesc, icon, image, buttonText, buttonUrl, color, sortOrder, homepage, visible, published` (+ timestamps, soft-delete). Matches your field list.

## 4. APIs added
- **`GET /api/public/services`** → `{ data: [{ id, title, shortDesc, icon, image, buttonText, buttonUrl, color }] }`, filtered `visible && homepage && published`, ordered by `sortOrder`. **Verified 200, 8 items.**
- Newsletter + Announcement reuse the existing **`GET /api/public/settings`** (added in Phase 2.1). Verified serving `newsletter.*` (8) and `announcement.*` (7).

## 5. Admin pages required later (NOT built — honest)
- **No admin UI exists** for: `Statistic`, `HomeService`, or the `newsletter.*` / `announcement.*` settings. They are **not editable from the Admin CMS** yet — only via DB/seed. Building admin CRUD (list/create/edit/delete/publish/reorder) for Statistics + Services + a Settings editor is the pending "later" work you flagged.

## 6. Remaining hardcoded homepage items
- **Hero** — title/subtitle/background/CTA1/CTA2/trust badges/highlights/search-placeholder — still hardcoded. (The bilingual title has an inline highlight span; converting via key-value Settings risks the exact-design rule, so deferred for a proper Hero model/approach.)
- **Homepage CTA text** (the hero's two CTA labels) — still hardcoded (deferred with Hero).
- **Rules & Guidelines / Sunnah & Prohibitions / Video tutorials** sections — still hardcoded (Video section also still references missing `/videos/*` in this tree).
- **Homepage Section Manager** (per-section visible/homepage/sortOrder + reorder) — not built; needs the JSON-driven section renderer refactor.

## 7. Build status
- Backend: `prisma validate` ✔, `generate` ✔, typecheck **0 errors in changed files**, `tsc` build ✔.
- Frontend: changed files typecheck-clean (116 total = pre-existing ERP baseline), `vite build` ✔ (`index-Dyevh1a_.js`), nginx reloaded.
- Migration additive `CREATE TABLE "HomeService"`; **no existing table altered, 0 data loss.** Seed idempotent (HomeService 8; Statistics unchanged; Settings upsert-only).

## 8. API status (via nginx, https)
- `/api/public/services` **200 (8)** · `/api/public/statistics` **200 (5)** · `/api/public/settings` **200** · `/api/health` **200**.
- Served bundle contains the Phase-2.2B code (`public/services`, `announcement.enabled`, `newsletter.` markers present).
- Site integrity: `/ /erp /login /portal /agent /customer` + `/api/public/{menus,packages}` all **200**.

## 9. Homepage completion %
- CMS-driven sections: **5 of ~9** (Services, Packages, Statistics, Newsletter, Announcement) → **~55% by section count**.
- **But the Hero — the largest, most-visible section — is still hardcoded**, so functionally the homepage is **~45–50%** CMS-driven.
- Admin-editable (with a real admin UI): **0%** of the new modules — this is the honest gap.

## 10. Overall Website CMS completion %
- Content pages (Blog/FAQ/Gallery/Testimonials/Pages) + Nav + Footer + these homepage sections are CMS-**served**. Estimated **~55%** of the marketing site is CMS-driven on the read path.
- **Admin write path (edit from CMS UI): materially incomplete** — most new modules have no admin screen yet.

## 11. GO / NO-GO
- **GO** for Phase 2.2B (Services + Newsletter + Announcement) — every verification passed: additive migration, 0 data loss, endpoints 200, homepage serves CMS data, site integrity intact, no visual change.
- **NO-GO** for "Homepage fully CMS-driven" — **Hero + CTA + Section Manager remain**, and **no module is Admin-UI editable yet**.
- **Public Cloudflare host (srv1868345):** separate box, **not updated** by this pass.

**Next verified slice options:** (a) a proper **Hero** conversion (needs a small Hero model or `hero.*` settings + careful bilingual/highlight handling), (b) the **Homepage Section Manager** + JSON renderer, or (c) the **Admin CRUD UIs** for Statistics/Services (makes everything actually editable — the "later" work).
