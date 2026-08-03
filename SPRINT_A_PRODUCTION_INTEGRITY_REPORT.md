# Sprint A — Production Integrity Report

**Branch:** `feature/production-integrity`  
**Repository:** `/var/www/SMTravels` (SMTravels production checkout)  
**Date:** 2026-08-01  
**Scope:** Align production with schema-backed reality — mount or remove, no new modules.

---

## Completed work

1. **Mounted missing production APIs**
   - `GET /api/dashboard/summary` via `dashboardRouter`
   - `/api/partners` via `partnersRouter`
   - `/api/hr/*` via `hrRouter` (ported from `/root/smtravels-src` HR Phase 1)

2. **Removed false-live UI & orphan code**
   - ComingSoon routes (hotels, transport, marketing, whatsapp, ocr, integrations, ai placeholders)
   - FE modules without schema/API: HajjOps, Sales, OpsTeam, SMS Center, Suppliers (rich UI)
   - Matching hooks + dead backend services/routes/contracts (already schema-orphaned)
   - Unapplied Prisma migrations that created tables absent from schema (hajj/ops/sales/sms)

3. **HR productionized (existing Phase 1 — not a new product module)**
   - Schema models + migration `20260731024623_hr_phase1_core` applied to `smtravels_db`
   - Seed: `hr` + `partners` modules; leave types
   - Admin UI `/erp/hr` + employee portal `/employee`
   - AI permission list includes `"hr"`

4. **Navigation honesty**
   - Sidebar: no `soon: true` placeholders left
   - HR uses module `"hr"`; Partners kept (API mounted)
   - OCR/AI/Integrations no longer duplicate dead nav entries (use Documents / Settings / existing AI slots)

5. **Quality gates**
   - Backend `npm run build` — PASS
   - Frontend `npm run build` — PASS
   - API restarted; mount smoke PASS

---

## Removed files (high level)

| Area | Removed |
|------|---------|
| FE | `ComingSoon.tsx`, `HajjOpsModule`, `SalesModule`, `OperationsTeamModule`, `SmsCenterModule`, `SuppliersModule`, hooks `hajjops/sales/operations/suppliers/communication` |
| BE | Orphan `hajjops/sales/operations/communication/suppliers` services/routes/controllers/contracts; `lib/ocr.ts`; `lib/capacity.ts` |
| Migrations | Unapplied `hajj_umrah_ops`, `ops_team_roster`, `sales_quotations`, `sms_message_log` |

---

## Mounted routes (Sprint A focus)

| Router | Paths | Status |
|--------|-------|--------|
| `dashboardRouter` | `GET /dashboard/summary` | Mounted — was 404, now 401 unauth |
| `partnersRouter` | `GET/PATCH /partners` | Mounted — was 404, now 401 unauth |
| `hrRouter` | `/hr/*`, `/hr/me*` | Mounted — was 404, now 401 unauth |

Full `apiRouter` still includes auth, CRM, bookings, finance, CMS, portals, communications, ops, system/OCR, AI, etc.

---

## 404 fixes (verified live on 127.0.0.1:4030)

| Path | Before | After |
|------|--------|-------|
| `/api/dashboard/summary` | 404 | **401** (auth required) |
| `/api/partners` | 404 | **401** |
| `/api/hr/dashboard` | 404 | **401** |
| `/api/ops/quotas` | (stale) | **404** (intentionally absent) |
| `/api/quotations` | (stale) | **404** |
| `/api/operations-team` | (stale) | **404** |
| `/api/sms/templates` | (stale) | **404** |

---

## Source vs production drift resolution

| Item | Resolution |
|------|------------|
| HR in src, missing on prod | Ported schema/API/UI/migration to production tree |
| Dashboard/partners on prod UI, unmounted | Mounted routers |
| HajjOps/Sales/SMS/OpsTeam without Prisma models | Removed FE + unapplied migrations (no placeholder APIs) |
| Prefer schema as SoT | Kept Agent-based Partners + report-backed Dashboard services |

Note: `/root/smtravels-src` remains a parallel checkout with additional uncommitted redesign work. This sprint’s canonical integrity commit is on **production** `feature/production-integrity`. Promote src separately after merge approval.

---

## Build status

| Target | Command | Result |
|--------|---------|--------|
| Backend | `npm run build` (`tsc`) | **PASS** |
| Frontend | `npm run build` (Vite) | **PASS** |
| Prisma | `migrate deploy` (HR) | **PASS** |
| Prisma | `generate` | **PASS** |

---

## Smoke test

Scripts:
- `backend/scripts/sprint-a-smoke.ts` — HTTP mount + RBAC seed checks  
- `backend/scripts/sprint-a-service-smoke.ts` — dashboard/partners/hr service calls  

Results:
- Health 200  
- Dashboard / partners / HR mounted (401 without token)  
- Orphan APIs remain 404  
- Service smoke: dashboard summary keys OK; partners list OK; HR dashboard OK  
- Authenticated HTTP probes **SKIPPED** (production admin password not available in env; set `SMOKE_PASSWORD` to enable)

Manual restart: `systemctl restart smtravels-api` — active.

---

## Remaining issues (out of Sprint A — do not implement here)

- Sprint B money path: `Booking.paidAmount` sync, commissions, installments, refunds  
- OCR apply persist + Documents Validation wiring  
- SampleBadge surfaces still present on some finance/ops secondary tabs (honesty shrink is B/E)  
- Authenticated end-to-end portal login smoke needs operator password  
- Full sync of redesign WIP from `/root/smtravels-src` into this branch  

---

## Explicit non-goals respected

- No Payment Gateways  
- No Payroll  
- No Chat Inbox  
- No merge to master  
- No new business modules beyond mounting/porting already-built HR Phase 1
