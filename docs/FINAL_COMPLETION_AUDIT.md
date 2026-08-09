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
