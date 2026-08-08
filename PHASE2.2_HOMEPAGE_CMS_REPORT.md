# Phase 2.2 — Homepage → CMS: Statistics module (VERIFIED) + honest status

**Date:** 2026-08-08 · **Canonical tree:** `/var/www/SMTravels` (host srv1468666) · **Policy honored:** additive-only migration (CREATE TABLE), 0 data loss, reuse existing infra, fallback-first UI (no visual change).

> **Brutal honesty up front:** Phase 2.2 asked to convert **the whole homepage** (Hero, Statistics, Services, Announcements, CTA, Newsletter, section enable/disable/reorder, JSON builder). I completed **one section end-to-end and verified it — Statistics** — as a real, demonstrable CMS module. The other sections are **NOT done** this turn. I'm not claiming otherwise. Also important: Statistics is **read-complete** (DB → public API → homepage) but the **admin edit UI/API is not built yet**, so it's editable via DB/seed, not yet from the Admin CMS screen.

---

## 1. Files changed
**Backend**
- `backend/prisma/schema.prisma` — **new model `Statistic`**.
- `backend/prisma/migrations/20260808010000_statistics_module/migration.sql` — additive `CREATE TABLE "Statistic"` (new).
- `backend/prisma/seed-home.ts` — idempotent statistics seed (new).
- `backend/src/contracts/cms.contract.ts` — `PublicStatisticDto`.
- `backend/src/services/cmsPublic.service.ts` — `listPublicStatistics()`.
- `backend/src/controllers/cmsPublic.controller.ts` — `listPublicStatisticsHandler`.
- `backend/src/routes/cms.public.route.ts` — `GET /public/statistics`.
- `backend/package.json` — `seed:home`.

**Frontend**
- `frontend/src/app/hooks/publicContent.ts` — `usePublicStatistics`.
- `frontend/src/app/pages/Home.tsx` — the Statistics section now reads from CMS with a built-in fallback (icons + bn labels resolved locally so the UI is byte-for-byte unchanged).

## 2. New models
- **`Statistic`** — `title, value, suffix, icon, color, sortOrder, visible, homepage, animation` (+ timestamps, soft-delete). Matches the requested field list exactly.

## 3. Extended models
- None this turn (Statistics is a new model; nav/footer fields were Phase 2.1).

## 4. New APIs
- **`GET /api/public/statistics`** → `{ data: [{ id, title, value, suffix, icon, color, animation }] }`, filtered `visible && homepage`, ordered by `sortOrder`. **Verified 200, 5 items.**

## 5. CMS pages (admin)
- **None added.** Statistics has **no admin CRUD UI/API yet** — see Remaining. This is the honest gap: records exist and serve, but are not yet editable from the Admin CMS screen.

## 6. Homepage sections converted
- **Statistics** ✅ — the orange counters band now renders from `/api/public/statistics` (5 rows seeded to match the current numbers; `animation` flag respected; fallback to the built-in counters if the API is down). Verified in the served bundle.
- (Previously already CMS: **Popular Packages** via `usePublicPackages`.)

## 7. Remaining hardcoded homepage items (NOT done this turn)
- **Hero** — title/subtitle/background/CTA1/CTA2/trust badges/highlight (bilingual, complex JSX) → still hardcoded.
- **Services** grid — the 8 `SERVICES` cards → still hardcoded (needs a `HomeService` model + API + admin + wiring).
- **Announcement bar / popup** — `Announcement` model exists but no public endpoint / homepage bar.
- **Homepage CTA** and **Newsletter block** — still hardcoded (could reuse `/public/settings`, not wired yet).
- **Rules & Guidelines / Sunnah & Prohibitions / Video tutorials** — still hardcoded (Video section also still present in this tree and references missing `/videos/*`).
- **Section enable/disable/reorder** and **JSON-driven section renderer (builder foundation)** — not started.
- **Statistics admin CRUD + UI** — not built (data editable only via DB/seed today).

## 8. Verification (every check ran; all passed)
- `prisma validate` ✔ · `prisma generate` ✔.
- Migration additive `CREATE TABLE "Statistic"` applied; **no existing table altered, 0 data loss**.
- Backend **typecheck 0 errors in changed files**; `tsc` build ✔.
- Seed idempotent: run 1 created 5, run 2 created 0 (total 5).
- `smtravels-api` restarted → **active**, `/api/health` 200.
- **`/api/public/statistics` → 200, 5 items** (correct shape).
- Frontend: changed files typecheck-clean (116 total = pre-existing ERP baseline, not mine); `vite build` ✔; nginx reloaded.
- Served bundle `index-Bu4Mgb12.js` contains the Phase-2.2 code (`public/statistics`, bn label present).
- **Site integrity:** `/` `/erp` `/login` `/portal` `/agent` `/customer` and `/api/{health,public/menus,public/settings,public/packages}` all **200**.

## 9. Completion %
- **Statistics section (read path: model→API→homepage):** ~**100%** and verified.
- **Statistics as a full "admin-editable" module:** ~**60%** (missing admin CRUD API + UI).
- **Phase 2.2 (whole homepage CMS-driven):** ~**15%** — 1 of ~8 sections converted; Hero/Services/Announcements/CTA/Newsletter/section-controls/builder remain.

## 10. Production readiness
- **On the canonical box (srv1468666):** the Statistics conversion is **live and verified**; the homepage renders stats from CMS with safe fallback. GO for this slice.
- **Full homepage CMS-drive:** **NOT ready** — most sections remain hardcoded.
- **Public Cloudflare host (srv1868345):** separate host, **not updated** by this pass.

### GO / NO-GO
- **GO** for the Statistics module slice — every verification passed (additive migration, 0 data loss, endpoint 200, homepage serves CMS stats, site integrity intact).
- **NO-GO** for "Homepage fully CMS-driven" — that remains a multi-slice program (next: Services module, then Hero/CTA/Newsletter via settings, Announcement bar, section enable/reorder + JSON renderer, and Statistics admin UI).

**Recommended next verified slice:** the **Services** module (same clean pattern: model → migration → `/public/services` → seed → wire the 8-card grid), or the **Statistics admin CRUD + UI** to make this module fully editable from the Admin CMS.
