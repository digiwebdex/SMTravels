# SM Travels International — FINAL PRODUCT AUDIT
**Release Candidate V2 · Phase 1** · branch `feature/release-candidate-v2`

> Audit of the current working tree (frontend 39,314 TSX lines · 15 ERP modules · 7 portals · backend 30 routers / 43 services). Method: marker scans + two deep structural sub-audits (frontend completeness, backend/security) + baseline builds. **Read-only — no code changed in this phase.**

---

## 0. Executive summary

| Dimension | State |
|---|---|
| **Backend build** (`tsc`) | ✅ **PASS** — clean |
| **Frontend build** (`vite`) | ✅ **PASS** — 9.7s |
| **Backend security** | ✅ **0 critical, 0 high** — defense-in-depth verified (RBAC, zod, magic-byte uploads, no stack-trace leaks, env-only secrets) |
| **Core workflows wired** | ✅ Lead · Customer · Booking · Invoice · Payment · Documents · Reports · CRM · HR · Portals — API-backed |
| **New modules (HR/AI/OCR/CMS)** | ✅ Fully implemented — **no stubs**, graceful 503 when AI/Vision creds absent |
| **"Incomplete feel"** | ⚠️ Concentrated in **~9 secondary sub-tabs** showing sample/mock data (many intentionally unwired — see §1) |
| **Real bugs found** | **1** frontend data bug · **1** backend validation gap |
| **Brand hygiene** | ⚠️ ~30 stale `BDH Travels` leftovers (mock data + a little chrome + CMS defaults) |

**Overall:** the product is fundamentally solid and secure. The gap to "polished RC" is **honesty of the unfinished secondary screens** (replace fake data with real empty/"not configured" states, or remove), **brand cleanup**, and **two concrete bug fixes** — not architectural work.

---

## 1. Sample / mock screens (the main "completion" work)

`<SampleBadge/>` ("Sample data — not connected") appears on **specific sub-tabs**, not whole modules — the rest of each module is API-wired. Several of these are **intentionally unwired per the manual-only scope** the owner set earlier (payment gateways, workflow automation, chat) and must NOT be wired to live APIs — for an RC they need an **honest empty / "configure later" state**, not fabricated data.

| Module → sub-view | file:line | Status / recommendation |
|---|---|---|
| Accounts → **Payment Gateways** | `erp/AccountsModule.tsx:981` | Mock `GATEWAYS` + inline creds. **Manual-only scope** → convert to config-only "not connected" state; remove fake creds |
| Invoices → **Online Payments** | `erp/InvoicesModule.tsx:1298` | Mock `PAYMENT_HISTORY`. Same — gateway feature deferred → honest empty state |
| Invoices → **Vouchers** | `erp/InvoicesModule.tsx:1432` | Mock `VOUCHERS` → wire to real docs OR empty state |
| Documents → **OCR field review** | `erp/DocumentsModule.tsx:374` | Partially wired (list + `useRunOcr`), but OCR fields mock + `onApply` no-op (`:381`) → finish apply, or empty until OCR run |
| Settings → **General / Backup / Health** | `:216 / :491 / :1140` | Static input defaults, fake `HEALTH_ITEMS` + CPU bars → wire General to settings API; Backup/Health = honest read-only state |
| Operations → **Calendar / Reminders / Chat / Workflow** | `:303 / :375 / :563 / :754` | All hardcoded. Chat + workflow-automation = deferred → empty states; Calendar/Reminders → wire or empty |
| ReportsBI → **Staff KPI / Custom Builder** | `:770 / :908` | `RADAR_DATA` + preview mock → wire or remove (see §5 duplicate) |
| Staff Portal → **Support** | `portal/StaffPortal.tsx:597` | Mock tickets → wire to support API or empty state |
| Supplier Portal → **Reports / Messages / Support** | `:571 / :684 / :757` | Mock → empty states (messaging deferred) |
| Accountant Portal → **Tax** (+ under-labeled Dashboard/Reports/Invoices) | `portal/AccountantPortal.tsx:423` | ⚠️ **Whole portal is mock** (`INCOME_ROWS`/`JOURNAL_ENTRIES`/…), only Tax badged → wire to the finance APIs (which exist) or badge honestly |

**Under-labeling (inconsistent honesty):** `OperationsModule` ActivityView (`~638`) + DocumentView (`822`), and `AccountantPortal` dashboard/reports/invoices render mock data with **no badge** — worse than a badge. Fix: wire or clearly empty.

---

## 2. Fake charts (hardcoded literal series)

| file:line | Chart |
|---|---|
| `erp/AccountsModule.tsx:185` `MONTHLY_CASHFLOW` | Cashflow AreaChart (`:1079`) |
| `erp/ReportsBIModule.tsx:66` `RADAR_DATA` | Staff-KPI RadarChart (`:848`) |
| `portal/AccountantPortal.tsx:49` `INCOME_DATA`/`EXPENSE_DATA` | Income/Expense chart |
| `portal/SupplierPortal.tsx:566` inline `values=[…]` | Hand-rolled bar chart |

→ Replace with data derived from the real finance/reports hooks (which exist), or remove the chart on deferred screens.

## 3. Dead buttons (decorative — no handler)

~15, all on the sample/mock sub-views above: `AccountsModule:986` "Add Gateway", `ReportsBIModule:776` "PDF Report", `SettingsModule:493` "Backup Now", `OperationsModule:352/378/757/779` (New Event/Reminder/Workflow/Run Now) + calendar arrows, `InvoicesModule:1439` "Create Voucher", `DocumentsModule:404` "Approve Document", `SupplierPortal:761`/`StaffPortal:601` "New Ticket". Empty handler: `DocumentsModule:381` OCR `onApply`.
**Dead `href="#"`:** footer socials (`Contact.tsx:226`, `Layout.tsx:336`), Auth brand-panel + legal links (`Auth.tsx:314,644,645,713,714,801`) → point to real routes (`/privacy`, `/terms`, `/refund`) or real social URLs.

## 4. "Coming Soon" / placeholder
- `erp/SettingsModule.tsx:407` renders literal **"Coming soon — disabled"** (gateway list) → replace with honest "configure later" copy.
- `lib/ds.tsx:254` DS preset `"coming-soon"` — **no consumer found** (not user-facing). No lorem ipsum anywhere.

## 5. Duplicate / unused
- **Duplicate reporting surfaces:** `erp/ReportsModule.tsx` (`/erp/reports`, fully wired) **and** `erp/ReportsBIModule.tsx` (`/erp/reports-bi`, partly sample) — **both in the sidebar** (`ErpLayout.tsx:113,114`). → Decide: keep one, or clearly differentiate (Reports = statements, BI = analytics) and finish BI.
- No orphaned source files; every route resolves to a real page. `hooks/portal.ts` vs `hooks/portals.ts` — both used (confusingly named, not dead).

## 6. Brand hygiene — stale `BDH Travels` (~30 refs)
- **Mock data:** `AccountsModule:134,1022,1024`, `DocumentsModule:661,701,771-774,905,951`, `SupplierPortal:59-81,721` (chat sender names).
- **Visible chrome:** `pages/Sitemap.tsx:353` "BDH Travels ERP", `SettingsModule.tsx:239` logo glyph "BDH", `lib/responsive.tsx:94` `logoLabel="BDH"` default (mobile top-bar).
- **CMS default form values:** `CmsModule.tsx:394,434,1392-1427` `bdhtravels.com` / "BDH Travels & Tourism" (prefilled + shown in live preview).
→ Global replace to **SM Travels International** (chrome + CMS defaults); mock-data refs die when those screens are de-mocked.

## 7. Bugs to fix

| Sev | Where | Issue |
|---|---|---|
| **Bug (FE)** | `lib/data.ts:267` | Air-ticket package "Economy Class Dhaka–Dubai" **missing required `hotel` field** (TS2741) → `pkg.hotel` is `undefined` for that package |
| **Med (BE)** | `hr.controller.ts:254,257,260` | correction approve/reject handlers read `req.body.note` (persisted) with **no zod validation / length cap** — only handlers bypassing zod |
| Low (BE) | `ocr.controller.ts:36`, `system.controller.ts:54` | OCR path skips magic-byte check (file not stored/served — limited impact) |
| Low (BE) | `health.controller.ts:14` | `/api/health` exposes `NODE_ENV` + version unauthenticated (minor) |

## 8. TypeScript (`tsc --noEmit`): 94 errors — **only 1 is a real bug**
- **90** = lucide-icon FC type mismatch (cosmetic pattern) — `ServicesConfig`, `crm/*`, `hr/*`, `Auth`, `ServicePage`. Fix: type icon maps as `LucideIcon` instead of narrow `FC<{size}>`.
- **3** = `import.meta.env` typing gap (`lib/config.ts:14`, `Auth.tsx:421,562`) — add `vite/client` types (real typecheck gap, runtime-safe).
- **1** = the `lib/data.ts:267` bug above.

## 9. Clean (verified — no action)
0 `TODO`/`FIXME` · 0 `console.log` (FE+BE) · 0 debug/test endpoints · 0 hardcoded secrets · 0 `eval`/`exec` · raw SQL is parameterized · error handler prod-safe · uploads validated · every route authed/scoped · new modules complete.

---

## Recommended fix plan (in scope — no new modules, no business-logic changes)

**Tier A — unambiguous, no product decision (do now):**
1. Fix `lib/data.ts:267` `hotel` field (real bug).
2. Add `vite/client` types → clears 3 tsc errors.
3. Type icon maps as `LucideIcon` → clears the 90 cosmetic tsc errors (→ **tsc clean**).
4. Add zod validation to the 3 HR correction handlers.
5. Brand cleanup: `BDH` → `SM Travels` in chrome + CMS defaults (`Sitemap`, `SettingsModule` glyph, `responsive.tsx`, `CmsModule` defaults).
6. Point dead `href="#"` links to real routes / real socials.

**Tier B — honest-state pass (do now, no new features):** convert every remaining `SampleBadge`/mock sub-tab to a real **empty / "not configured" state** and remove the decorative dead buttons + fake charts on them — so nothing fake ships. Wire the ones whose backend already exists (Accountant portal finance tabs, Settings→General, OCR apply).

**Tier C — product decisions (need owner):**
- Payment-gateway + Online-Payments + Vouchers screens: keep as config-only, or remove? (manual-only scope says no live wiring)
- Reports vs Reports-BI duplicate: keep both (differentiated) or drop BI?
- Chat / Workflow-automation Operations tabs: keep as "coming in a later release" empty state, or remove from the sidebar for V2?

> Tiers A + B make the product ship-ready and honest without touching business logic or scope. Tier C is three small owner calls.
