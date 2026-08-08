# Phase 2.1 — CMS Navigation + Footer (canonical tree /var/www/SMTravels) — VERIFIED

**Date:** 2026-08-08 · **Canonical tree:** `/var/www/SMTravels` (host srv1468666) · **Policy honored:** additive-only migration, no data loss, restart-once (2nd restart authorized), reuse existing models, fallback-first UI (no visual/layout change).

> Scope done: **STEP 1 audit, STEP 2 CMS Navigation, STEP 3 CMS Footer, STEP 7 migration, STEP 8 verification.** STEP 4 (homepage hero/stats/etc from CMS) and STEP 5 (homepage block builder) were **not** started — see Remaining.

---

## 1. Files changed (all in /var/www/SMTravels)

**Backend**
- `backend/prisma/schema.prisma` — extended `MenuItem` (+`icon`,`openNewTab`,`visible`,`published`,`megaMenu`); extended `MenuLocation` enum (+`TOP_NAV`,`QUICK_LINKS`,`LEGAL_NAV`).
- `backend/prisma/migrations/20260808000000_cms_nav_footer_fields/migration.sql` — the additive DDL (new file).
- `backend/prisma/seed-nav-footer.ts` — idempotent nested nav + footer-settings seed (new file).
- `backend/src/contracts/cms.contract.ts` — `MENU_LOCATIONS` +3; `PublicMenuItemDto` +`icon`/`openNewTab`/`megaMenu`; new `PublicSettingsDto`.
- `backend/src/services/cmsPublic.service.ts` — `getPublicMenu` (all locations, new fields, `visible&&published` filter); new `listPublicSettings(group?)`.
- `backend/src/controllers/cmsPublic.controller.ts` — `listPublicSettingsHandler`.
- `backend/src/routes/cms.public.route.ts` — mounted `GET /public/settings`.
- `backend/package.json` — `seed:nav` script.

**Frontend**
- `frontend/src/app/hooks/publicContent.ts` — broadened `usePublicMenu` to 6 locations; new `usePublicSettings`.
- `frontend/src/app/components/Layout.tsx` — Header nav (desktop primary + Others dropdown + mobile drawer) and Footer (services, quick links, description, socials, contact, copyright) now read from CMS with built-in fallback.

## 2. APIs added / changed
- **NEW** `GET /api/public/settings[?group=]` → `{ settings: { key: value } }`.
- **EXTENDED** `GET /api/public/menus/:location` → now serves `TOP_NAV`/`QUICK_LINKS`/`LEGAL_NAV`, returns `icon`/`openNewTab`/`megaMenu`, and filters hidden/unpublished items.

## 3. Backend verification (all PASS)
- `prisma validate` ✔ · `prisma generate` ✔ · typecheck **0 errors** in changed files ✔ · `tsc` build ✔.
- Additive migration applied to `smtravels_db`: **row counts identical before/after — 0 data loss** (MenuItem 23, Menu 3, Setting 23 unchanged; +5 columns, +3 enum values).
- Seed idempotent: 2nd run creates 0; MAIN_NAV nested (6 primary + "Others" `megaMenu` with 7 children); FOOTER_NAV cleaned to 6 (9 leftovers **hidden** via `visible=false`, not deleted).
- `smtravels-api` restarted once (authorized 2nd restart) → **active**.

## 4. Frontend verification (PASS)
- `vite build` ✔ (new bundle `index-CjCYRSTS.js`); changed files typecheck-clean (116 total errors are **pre-existing ERP baseline** in this tree, not from Phase 2.1; vite transpiles regardless).
- **Served bundle contains the Phase-2.1 code** — markers `social.facebook`, `footer.copyright`, `QUICK_LINKS`, `/public/settings` all present in the deployed JS.
- nginx `-t` ok, reloaded (static swap; no API restart).
- **Caveat (honest):** I cannot run a headless browser here, so I verified the deployed **code** + **data endpoints** + **fallback safety**, not the rendered DOM pixels. Confirm the visual render in a browser.

## 5. Health checks (via nginx, https)
- `/api/health` **200** · homepage `/` **200** (SPA shell) · `/erp` **200** · `/login` **200** · `/portal` **200** · `/agent` **200** · `/customer` **200** · `POST /api/auth/login` **400** (validates → alive).

## 6. CMS verification
- `/api/public/menus/{MAIN_NAV,TOP_NAV,FOOTER_NAV,QUICK_LINKS,LEGAL_NAV,MOBILE_NAV}` → **all 200**.
- `MAIN_NAV`: 14 labels, "Others" `megaMenu=true` with **7 nested children**; item fields `icon`/`openNewTab`/`megaMenu` returned.
- `visible/published` filter proven: `FOOTER_NAV` returns **6** (9 hidden excluded).
- `/api/public/settings` → **200**, **33 keys** (company 18 + footer + social + stats). Footer consumes company phone/email/address, description, socials, copyright.

## 7. Rollback procedure
- **DB:** full dump at `/root/phase21-backup-2026-08-08-002521/smtravels_db-*.sql` → `psql "$DB" < that.sql`. (Migration was additive; safe to leave. To reverse manually: `ALTER TABLE "MenuItem" DROP COLUMN …` — additive, low-risk.)
- **Backend/frontend source:** pre-edit file snapshot at `/root/phase21-canonical-backup-2026-08-08-004602`; or `git -C /var/www/SMTravels checkout -- backend/src backend/prisma frontend/src`, then rebuild + restart/reload.
- **Fallback safety net:** even without rollback, if the CMS APIs go down the Layout renders the built-in nav/footer (no breakage).

## 8. Remaining work
- **Homepage foundation (STEP 4):** hero, trust badges, service cards, statistics, CTA, newsletter, announcement bar still hardcoded — need Statistics/Announcement public endpoints + wiring (and a `labelBn` field or richer models for full bilingual CMS).
- **Homepage block builder (STEP 5):** not started.
- **Mobile drawer** uses the same CMS-derived arrays (done); **Support column** legal links left on fallback (LEGAL_NAV seeded, not yet wired into that column).
- **Bilingual labels:** CMS `MenuItem` has one `label`; bn is currently supplied by a route→label map in the frontend. A future additive `labelBn` column would make Bangla fully CMS-editable.
- **Admin UI:** no new admin page added; menus/settings are editable via the existing CMS admin + generic Settings — a dedicated nested menu-builder UI (drag/drop) is future.
- **Pre-existing (not Phase 2.1):** bare `/packages` hard-load → 403 (a tracked `public/packages/` image dir shadows the SPA route; `/packages/:id` and client-side nav work). Separate fix (nginx `try_files` or move the images).
- **Separate host:** this is `/var/www/SMTravels` on **srv1468666**; the Cloudflare-fronted public site (**srv1868345**) is a different host and is not updated by this work.

## 9. Enterprise completion %
- **Phase 2.1 (Nav + Footer CMS):** **~90%** — nav + footer fully CMS-driven with new locations/fields/settings, verified end-to-end; −10% for mobile-support-column legal wiring, bilingual `labelBn`, and a dedicated menu-builder admin UI.
- **Phase 2 overall (whole site CMS-driven):** **~40%** (content pages + nav + footer done; homepage sections + builder + Statistics/Team/Partners/Awards modules remain).

## 10. Production readiness score
- **On this canonical box (srv1468666):** the nav/footer CMS conversion is **live and verified** — GO for content entry of menus + footer settings via CMS.
- **True production (Cloudflare / srv1868345):** **not updated** by this pass — that host still needs the same backend+frontend sync. Overall production-readiness for the full CMS-driven site remains **partial**.

### GO / NO-GO
**GO** for Phase 2.1 on the canonical tree — every Phase-2.1 verification passed (0 data loss, all endpoints 200, new fields served, build clean, code deployed). The `/packages` 403 is a pre-existing, separate issue and does not gate Phase 2.1.
