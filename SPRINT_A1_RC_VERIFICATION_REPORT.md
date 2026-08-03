# Sprint A.1 — Release Candidate Verification

**Date:** 2026-08-01  
**Branch:** `feature/production-integrity`  
**Commit under test:** `219f35c72d3567fa714e8ad8b8e14f3862c5aee7`  
**Runtime:** `/var/www/SMTravels` · API `smtravels-api` · nginx root `frontend/dist`  
**Verdict:** **CONDITIONAL PASS — Release Candidate for Sprint A (Production Integrity)**

Sprint A scope only. No Sprint B (money path) work performed.

---

## Verdict summary

| Gate | Result |
|------|--------|
| Backend `npm run build` | **PASS** |
| Frontend `npm run build` | **PASS** |
| Prisma migrations up to date | **PASS** (8/8 applied) |
| API service active | **PASS** |
| Sprint A 404s fixed (dashboard / partners / HR) | **PASS** (401 with auth) |
| Orphan APIs stay gone | **PASS** (404) |
| Nav ↔ route 1:1 | **PASS** (0 orphans, 0 `soon: true`) |
| Live FE assets (Hr / Partners / Employee) | **PASS** (HTTP 200) |
| Public HTTPS API mounts | **PASS** |
| HTTP smoke script | **PASS** |
| Service smoke (dashboard / partners / HR) | **PASS** |
| Authenticated end-to-end login probes | **SKIPPED** (prod password not available; account may be lockout after failed attempts — journal showed 423) |

**RC decision:** Sprint A integrity goals are met on this branch and on the live process/assets. Suitable to **merge after explicit approval**. Not a claim of full enterprise Gate 0 (money/OCR SampleBadge remain Sprint B+).

---

## Build verification

| Target | Command | Exit |
|--------|---------|------|
| Backend | `cd backend && npm run build` | **0** |
| Frontend | `cd frontend && npm run build` | **0** |
| Prisma | `npx prisma migrate status` | Database schema is up to date |

Frontend chunks present: `HrModule-*.js`, `PartnersModule-*.js`, `EmployeePortal-*.js`.

---

## API verification

### Mounted (must not 404)

| Path | Local | Public HTTPS |
|------|------:|-------------:|
| `GET /api/health` | 200 | 200 |
| `GET /api/dashboard/summary` | 401 | 401 |
| `GET /api/partners` | 401 | 401 |
| `GET /api/hr/dashboard` | 401 | 401 |
| `GET /api/customers` | 401 | — |
| `GET /api/bookings` | 401 | — |
| `GET /api/invoices` | 401 | — |
| `GET /api/reports/overview` | 401 | — |
| `GET /api/cms/pages` | 401 | — |
| `GET /api/portal/me` | 401 | — |
| `GET /api/system/smtp/status` | 401 | — |
| `GET /api/system/gemini/status` | 401 | — |
| `POST /api/ai/chat` | 401 | — |
| `POST /api/ocr/passport` | 401 | — |

Note: `GET /api/ai/chat` returns 404 because the route is **POST-only** — expected.

### Intentionally absent

| Path | Status |
|------|-------:|
| `/api/ops/quotas` | 404 |
| `/api/quotations` | 404 |
| `/api/operations-team` | 404 |
| `/api/sms/templates` | 404 |

### Service-level smoke

```
OK dashboard keys applied,kpis,revenueTrend,...
OK partners 0
OK hr employeesCount 0
```

---

## Frontend / navigation verification

| Check | Result |
|-------|--------|
| ErpLayout nav paths | 16 items, all `/erp…` |
| `routes.tsx` children | Exact match to nav (0 missing) |
| `soon: true` placeholders | **0** |
| `ComingSoon` import | **Absent** |
| `HrModule` + `/employee` | **Present** |
| Live site index bundle | `index-DcBBEJSB.js` matches `frontend/dist` |
| Live `/assets/HrModule-*.js` | **200** |
| Live `/assets/PartnersModule-*.js` | **200** |
| Live `/assets/EmployeePortal-*.js` | **200** |

---

## Smoke checklist (Sprint A product areas)

| Area | Method | Result |
|------|--------|--------|
| Authentication | Route mounted; login locked without password | Mount OK; full login **SKIPPED** |
| Dashboard | Service + `/dashboard/summary` | **PASS** |
| CRM | `/customers` → 401 | Mount **PASS** |
| Bookings | `/bookings` → 401 | Mount **PASS** |
| Invoices | `/invoices` → 401 | Mount **PASS** |
| Payments | Covered under invoices router (not re-exercised with auth) | Mount assumed; auth smoke **SKIPPED** |
| Reports | `/reports/overview` → 401 | Mount **PASS** |
| CMS | `/cms/pages` → 401 | Mount **PASS** |
| Customer portal | `/portal/me` → 401 | Mount **PASS** |
| Agent portal | Portal roles router still mounted | Mount OK; auth **SKIPPED** |
| OCR | `POST /ocr/passport` → 401 | Mount **PASS** |
| AI | `POST /ai/chat` → 401 | Mount **PASS** |
| SMTP | `GET /system/smtp/status` → 401 | Mount **PASS** |
| Notifications | Worker in process (service active); no auth probe | Infra OK |
| HR | Service + `/hr/dashboard` | **PASS** |
| Partners | Service + `/partners` | **PASS** |

---

## Remaining blockers / caveats (not Sprint A regressions)

1. **Authenticated RC login** — provide `SMOKE_PASSWORD` (and unlock admin if 423 lockout) for full HTTP matrix.  
2. **Sprint B+** — booking paid sync, commissions, OCR apply persist, SampleBadge finance/ops tabs.  
3. **Branch not merged to `master`** — RC is on `feature/production-integrity` only.  
4. **`.gitignore` local hygiene** — binary/corrupt append possible on working tree; does not block RC runtime.

---

## Sign-off template

| Role | Approve merge of Sprint A? | Date | Initials |
|------|----------------------------|------|----------|
| Product owner | ☐ Yes ☐ No | | |
| Tech lead | ☐ Yes ☐ No | | |
| Ops | ☐ Yes ☐ No | | |

**Recommended next step after approval:** merge `feature/production-integrity` → `master` (no force), then begin Sprint B (money path) on a new branch.
