# SM Travels ERP — Final Completion Audit (Step 1)

**Date:** 2026-08-09 · **Branch:** `feature/prod-cms-merge @ 0e86a93` · **Prod:** `200.141.8.183` (baseline LIVE).

> Read-only audit. System is **~85% built**: 106 Prisma models, 18 migrations, 39 ERP frontend modules, ~50 backend services. The completion work = **13 production-visible ComingSoon routes → real modules**, reusing existing infra wherever possible. Backend services contain **0 mock/simulate**; the 278 "placeholder" text hits are HTML input `placeholder=` attributes (noise), not stubs.

## Honest scope statement
This is a **multi-increment program** (~15–20 new models, ~6–8 additive migrations, ~12 API groups, ~15 CRUD pages). It will be delivered as **verified commits, one module at a time** (build + typecheck gated), not a single change. Nothing is marked done until it builds and is committed. Production is **not** touched during development.

## Completion backlog (priority order, per owner Step 3–9)

| # | Module | Current | Existing to REUSE | Missing (build) | DB change | API | UI | RBAC | Risk | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Muallim / Mutawwif** | ComingSoon | `OperationsTeamMember`, `OpsRoleType.MUALLIM`, `ops.service`, `OperationsTeamModule.tsx` | dedicated Muallim view (roster filtered by role) + assign to group/booking; extra fields (iqama/license/capacity) | **+`MUTAWWIF` enum value + additive cols** | extend `ops` route (role filter) | `/erp/muallim` page | `operations_team` | Med (keep `muallimId` links) | ⏳ next |
| 2 | **Currency Settings** | ComingSoon | `enum Currency{BDT,USD,SAR}`, per-txn `currency/exchangeRate/baseAmount` | Settings→Currency UI + rate table | **+`ExchangeRate` model** | new `currency` route | `/erp/settings/currency` | `settings` | Low (no retro-convert) | ⏳ |
| 3 | **Companies We Work With** | ComingSoon | `Supplier`/`Agent` patterns, drawer UI | new entity + CRUD | **+`BusinessPartner` model** | new `network` route | `/erp/network/companies` | `partners` | Med | ⏳ |
| 4 | **Mufti / Scholar Network** | ComingSoon | CRUD pattern | new entity + CRUD | **+`MuftiScholar` model** | `network` route | `/erp/network/scholars` | `partners` | Med | ⏳ |
| 5 | **Payroll** | ComingSoon | `Employee`, HR module | payroll runs + payslips | **+`PayrollRun`,`Payslip`,`PayComponent`** | new `payroll` route | `/erp/hr/payroll` | `settings`/new `hr` | Med | ⏳ |
| 6 | **Manpower lifecycle** (JobOrders→Deployment) | ComingSoon ×8 | `ManpowerBooking`, `Customer`, `Document`, `VisaBooking` | full lifecycle | **+`Employer`,`JobOrder`,`Candidate`,`RecruitmentApplication`,`MedicalProcessing`,`BmetClearance`,`ManpowerDeployment`** | new `manpower` route group | 8 pages `/erp/manpower/*` | new `manpower` | **High (largest)** | ⏳ |
| 7 | **Custom Package Builder** | partial | `Package`(+Pricing/Itinerary/Inclusion), `Booking`, `publicIntake` | builder UI + inquiry→quote→booking | **+`CustomPackageInquiry` (or extend Package)** | extend `package`/`publicIntake` | website + `/erp/packages` | `packages` | Med | ⏳ |
| — | Hajj & Umrah completion | mostly built | `HajjBooking`,`UmrahBooking`,`HajjQuota`,`DepartureBatch`,`PilgrimRegistration`,`hajjops` | surface Groups/Pilgrims tabs; wire Muallim | none (reuse) | reuse `hajjops` | tabs in `hajj-ops` | `ops` | Low | ⏳ |

## Deferred (documented, NOT silent ComingSoon)
- **Communication → WhatsApp** (`/erp/whatsapp`): needs WhatsApp Business API creds/approval — SMS + Notifications are live; WhatsApp stays a documented deferral until credentials are provisioned.
- **Hotel → Hotels** / **Tour → Transport** (`/erp/hotels`, `/erp/transport`): reuse `Supplier`/`SupplierService`; low priority — will resolve to a supplier-filtered view, not net-new models.
- Non-final-menu ComingSoon (marketing/ocr/integrations/ai) are **not surfaced** in the final nav → not production-visible; routes retained for direct access only.

## Existing modules — regression watch (must keep working, 0 changes unless required)
CRM/Customers/Leads/Corporate, Bookings(+Hajj/Umrah/Visa/AirTicket/Hotel/Tour), Packages/Services, Suppliers, Operations/OpsTeam, HajjOps, Accounts/Invoices/Payments/Journal/Ledger, Communications/SMS, HR(Employees/Attendance/Leave), CMS, OCR, Reports/BI, Partners(agents), Portals ×6, Auth/RBAC.

## Database safety contract (Step 16–17)
Every change = **new additive migration** (`CREATE TABLE`/`ADD COLUMN IF NOT EXISTS`/`ALTER TYPE ADD VALUE`); new fields nullable/defaulted; **never** modify/rename/delete an applied migration; **never** reset/drop/truncate; `migrate status` (no drift) before any `migrate deploy`. Existing 18 migrations frozen.

## Sequencing rationale
Start with best reuse / lowest risk that clears a high-priority placeholder (**Muallim**, **Currency**), then medium net-new (**Companies**, **Mufti/Scholar**, **Payroll**), then the large **Manpower** lifecycle, then **Custom Package**. Each: schema→migration→service→controller→route→page→nav→build→commit.

---

# Step 2 — Delivery verification & final sign-off (2026-08-10)

**Branch:** `feature/prod-cms-merge @ 1ed696b` (clean tree, pushed). **Prod `200.141.8.183` untouched.**

## What was delivered
10 real full-stack modules + 2 hardening phases — see
[COMPLETION_PROGRAM.md](./COMPLETION_PROGRAM.md) for the per-module commit/model/route/page table.
Muallim `77f1ece` · Currency `4975bd7` · Companies `9f39dd4` · Mufti/Scholar `870af30` ·
Payroll `19c0a05` · Manpower 6A `451931b` / 6B-1 `8ccad63` / 6B-2 `959b974` / 6B-3 `411648b` ·
Custom Package `8b95715` · RBAC hardening `6de4616` · tests+rule-centralization `4f50ac1` · docs `1ed696b`.

## Verification gates (all fresh from clean)
| Gate | Result |
|---|---|
| `prisma validate` | ✅ valid |
| backend `tsc` (strict, noUnusedLocals) | **0 errors** |
| `npm test` (23 node:test cases, no DB) | **23/23 pass** |
| frontend `vite build` | ✅ 0 errors |
| RBAC consistency | 21 guarded + 19 nav modules **all ∈ seed MODULES** |
| Route registration | **41/41** route files wired |
| Migrations | 15/15 new models covered · 15/15 `CREATE TABLE IF NOT EXISTS` · 9 idempotent FK blocks · **0 destructive statements** |

## Integrity scan (repo-wide, delivered surface)
- **0** `ComingSoon` in any of the 10 delivered module pages.
- **0** `mock`/`simulate`/`faker`/`dummy`/`not-implemented` in delivered backend services.
  *(The one `TODO` hit is a task-**status** default value `?? "TODO"`, a workflow column, not a stub.)*
- 16 pre-existing `TODO/FIXME` remain in **older, untouched** files (0 in delivered code).

## Deferrals (honest, out of program scope per "stop adding modules after Module 7")
- **Nav-visible (3):** `hotels`, `transport` (→ resolve to Supplier-filtered view, no new models),
  `whatsapp` (needs WhatsApp Business API credentials).
- **URL-only, not in menu (4):** `marketing`, `ocr`, `integrations`, `ai` — retained for direct access, not surfaced.

## Verdict — **CONDITIONAL GO**
Code is complete, verified, and safe to deploy. **Not production-live until the owner runs the
deploy.** Conditions before/at deploy (see [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)):
1. **Backup first** (`deploy/smtravels-backup.sh`), non-empty dump confirmed.
2. `prisma migrate status` shows exactly the 9 additive migrations pending, **no drift**, before `migrate deploy`.
3. **`npm run seed:rbac` before restart** — else all roles (admins included) get 403 on the 4 new modules.
4. Post-deploy smoke: admin sees new nav with data; an unauthorized role gets **403 on a direct payroll API call** (authorization is server-side, not menu-hiding).

**Not verified (cannot be, from dev host):** runtime behavior against the production DB, real
login/RBAC end-to-end, and browser UX — these are the owner's post-deploy smoke tests above.
