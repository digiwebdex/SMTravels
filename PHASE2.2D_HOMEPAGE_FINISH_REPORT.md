# Phase 2.2D — Homepage Section Manager + JSON Foundation + Rules/Sunnah/Video (VERIFIED)

**Date:** 2026-08-08 · **Canonical tree:** `/var/www/SMTravels` (host srv1468666) · **Policy honored:** additive-only migration, 0 data loss, reuse-first, fallback-first (no visual change), single API restart.

> **Brutally honest headline:** I built the **Section Manager + JSON renderer foundation** (`HomeSection` model + API + per-section visibility/order/headings) and **fully converted Sunnah/Prohibitions + all three remaining section headings**. But the homepage is **NOT 100% CMS-driven**: the **Rules guide-cards** still draw their title/summary from the frontend **GUIDES knowledge base**, and the **Video cards** still draw from the frontend **SITE_VIDEOS** list. Those two are separate large content systems (a Knowledge module + a Video library) — I did **not** migrate them, so two sections still contain hardcoded *visible* content. Per your rule, I am **not** claiming 100%.

---

## Remaining hardcoded homepage items
| Item | Status |
|---|---|
| **Rules guide-cards** (title + summary of the 8+8 knowledge cards) | ❌ from `GUIDES` (frontend knowledge base). Heading, visibility, and slug-selection ARE CMS; the **card text is not**. |
| **Video cards** (title/duration/thumbnail of 6 videos) | ❌ from `SITE_VIDEOS` (frontend). Heading + visibility ARE CMS; the **card content is not** (and the `/videos/*` assets are missing in this tree). |
| Section reorder (drag-drop) | ⚠️ `sortOrder` exists in the model/API and drives render order data, but the frontend renders sections in fixed JSX order (reorder-by-config not wired). |
| Admin UIs for any module | ❌ not built (deferred per your instruction) — everything editable via DB/seed only. |

## What IS now CMS-driven (this phase)
- **Homepage Section Manager:** `HomeSection` model (`key,type,eyebrow/Bn,title/Bn,subtitle/Bn,config JSON,sortOrder,visible,published`). Every homepage section has a row; `visible` toggles it (the **Rules/Sunnah/Video sections are wrapped in a `show()` check** — set `visible=false` in the DB and they disappear, fallback-safe).
- **JSON renderer foundation:** the `config` JSONB per section is the future-ready content store (already carrying the Sunnah/Prohibitions lists and Rules slug config).
- **Sunnah & Prohibitions:** heading + **both lists (5 + 5, bilingual)** now render from `HomeSection.config` with fallback — fully CMS.
- **Section headings:** Rules, Sunnah, Video eyebrows/titles now come from CMS.

## Models
- **Reused:** none new for this — but the pattern reuses the same public-API + fallback approach as Hero/Services/Statistics.
- **Added:** **`HomeSection`** (additive `CREATE TABLE`, **0 data loss** — Hero/Statistic/HomeService counts unchanged before/after).

## APIs added
- **`GET /api/public/home-sections`** → `{ data: [{ key,type,eyebrow*,title*,subtitle*,config,sortOrder,visible }] }`, published sections ordered by `sortOrder`. **Verified 200, 8 sections.**

## Homepage sections converted (running total)
| Section | CMS status |
|---|---|
| Hero | ✅ fully (2.2C) |
| Services | ✅ fully (2.2B) |
| Rules & Guidelines | ⚠️ heading + visibility + slugs CMS; **card text = GUIDES (frontend)** |
| Popular Packages | ✅ fully (pre-existing) |
| Sunnah & Prohibitions | ✅ **fully (this phase)** |
| Video Tutorials | ⚠️ heading + visibility CMS; **card content = SITE_VIDEOS (frontend)** |
| Statistics | ✅ fully (2.2) |
| Newsletter | ✅ fully (2.2B) |
| Announcement bar | ✅ fully (2.2B, default-off) |

**Fully CMS-driven: 7 of 9.** Partial (heading/visibility only): 2 (Rules, Video).

## Verification results (every checkpoint)
**Backend**
- Typecheck: **0 errors in changed files** (full backend tsc is slow but clean of my changes).
- Build: **exit 0**; `/public/home-sections` compiled into `dist`.
- Seed: **exit 0**, idempotent — `HomeSection` created 8 on first run, **0 on re-run (no duplicates)**, total 8; Statistics/HomeService/Hero/Settings unchanged.
- Migration: additive `CREATE TABLE "HomeSection"` — **row counts unchanged, 0 data loss**.
- Restart: **once**; `systemctl is-active` = active; `/api/health` **200**.
- **All backend APIs 200:** `home-sections, hero, services, statistics, settings` (+ menus, packages).

**Frontend**
- Build: **exit 0**, changed files typecheck-clean; new `dist`; new bundle `index-BQ-9GB3q.js`.
- Bundle **consumes** the home-sections, hero, statistics, and services APIs (markers present).
- **Fallback:** hero unknown-key → `null`; all hooks `.catch(() => fallback)` — sections render the built-in content if the API is down.
- **Site integrity:** `/ /erp /login /portal /agent /customer` **200**; auth login **400** (alive); `/api/health` **200**.
- ⚠️ **Pixel/console render** verified at code+data+build level only (no headless browser here) — seed values are byte-identical to the old strings; please eyeball the deployed homepage.

## Homepage CMS completion %
- **~90%** — 7 of 9 sections fully CMS + a working Section Manager (visibility) + JSON foundation. The remaining ~10% is the **Rules guide-card text** and **Video card content** (separate Knowledge + Video content systems).

## Website CMS completion %
- **~65–70%** (read path): content pages + nav + footer + 7/9 homepage sections CMS-served. **Admin write path still ~0%** for the new modules (no admin UIs) — the standing gap.

## GO / NO-GO
- **GO** for Phase 2.2D — Section Manager + JSON foundation + Sunnah + headings delivered; every requested verification passed (additive migration, 0 data loss, seed exit 0/idempotent, all APIs 200, site integrity intact, no build errors).
- **NO-GO** for "Homepage 100% CMS-driven" — **Rules guide-cards and Video cards still contain hardcoded visible content** (GUIDES + SITE_VIDEOS). Reaching true 100% requires a **Knowledge/Guides CMS module** and a **Video CMS module** (or removing the Video section, as was done in the other tree).
- **Public Cloudflare host (srv1868345):** separate box, **not updated** here.

**To reach 100%:** convert `GUIDES` → a Knowledge model (+ migrate the guide content) so Rules cards are CMS; convert `SITE_VIDEOS` → a Video model (or retire the section). Both are content-migration modules, not wiring.
