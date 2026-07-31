# HR Phase 1 — Completion Report

**Product:** SM Travels International (single-company ERP)  
**Scope:** Core HR plug-in module  
**Date:** 2026-07-31  
**Source:** `/root/smtravels-src`

## Verdict

Phase 1 Core HR is **implemented and smoke-verified** as a branch-scoped, RBAC-gated plug-in. Existing booking/CRM/finance tables and auth flows were not rewritten. No `tenantId`.

**Readiness score: 88 / 100**

| Area | Score | Notes |
|------|------:|-------|
| Schema & soft-delete/audit | 95 | New HR tables only; migration applied |
| APIs & contracts | 92 | `/api/hr/*` + `/api/hr/me/*` |
| Admin UI | 90 | Dashboard → Reports tabs on design-system |
| Employee portal | 88 | `/employee` via PortalShell |
| Leave dual approval | 90 | Status machine + notifications |
| Attendance | 85 | Manual upsert + corrections |
| Reports export | 88 | CSV / XLSX / PDF |
| Notifications / AI / nav | 85 | in-app + outbound events; AI slot; i18n |
| Automated tests | 75 | Service smoke script (no Jest suite yet) |
| Non-goals respected | 95 | No payroll engine, biometrics, multi-tenant |

## Architecture (locked)

- **Single company** — singleton `Company`; no `tenantId` on HR rows.
- **Operational boundary** — `branchId` via existing `branchWhere()` / global roles.
- **RBAC** — module `"hr"` with `view` | `full` (seed MATRIX).
- **Workflow** — native leave/attendance status machines (no workflow engine).
- **Integrations** — reuse `inApp` + `OutboundNotification` enqueue; AI permission list includes `"hr"`.

## Delivered commits

| Commit | Milestone |
|--------|-----------|
| `cc1c633` | DB schema, migration, `hr` seed |
| `b6f10a6` | REST APIs + contracts + AI `"hr"` gate |
| `1a04239` | Admin UI, portal, leave/attendance/reports screens, nav/i18n |
| `b4e3981` | Notification events + AiInsightCard polish |
| *(this)* | Smoke tests + completion report |

## Schema (new tables only)

Org: `HrDepartment`, `HrSection`, `HrTeam`, `HrDesignation`  
People: `Employee` (+ optional unique `userId`), `EmployeeTimelineEvent`  
Docs: `HrEmployeeDocument`  
Leave: `HrLeaveType`, `HrLeaveBalance`, `HrLeaveRequest`  
Holiday: `HrHoliday`  
Attendance: `HrAttendanceRecord`, `HrAttendanceCorrection`

Soft delete (`deletedAt` / `deletedById`) and audit (`createdById` / `updatedById`) on business rows. Employee codes: `EMP-{branch}-{year}-{seq}`.

Migration: `backend/prisma/migrations/20260731024623_hr_phase1_core/`

## APIs

Mounted at `/api/hr` (`backend/src/routes/hr.route.ts`):

- Org CRUD (departments, sections, teams, designations)
- Employees CRUD, timeline, soft delete, status changes, documents
- Leave types / balances / requests (submit, manager approve, HR approve, reject, cancel)
- Holidays CRUD + calendar query
- Attendance manual upsert + corrections approve/reject
- Dashboard aggregates
- Reports export `?format=csv|xlsx|pdf`
- Portal `/api/hr/me/*` (auth + `Employee.userId === req.user.id`)

Gates: `requireAuth` + `requirePermission("hr","view"|"manage")`; manager actions also allow linked manager ownership in service.

## Frontend

- Nav: ErpLayout `module: "hr"` → `/erp/hr` (`nav.hr` en/bn)
- `HrModule.tsx` tabs: Dashboard | Employees | Organization | Documents | Leave | Holidays | Attendance | Reports
- `EmployeePortal.tsx` at `/employee` (profile, docs, leave, attendance)
- Design-system `ModulePage` / `DataTable` / `AiInsightCard` — no new UI framework

## Permissions (seed)

| Role | `hr` access |
|------|-------------|
| SUPER_ADMIN / COMPANY_ADMIN / BRANCH_MANAGER | full |
| ACCOUNTANT | view |
| CUSTOMER / AGENT | none |

Default leave types seeded (e.g. ANNUAL, CASUAL, …).

## Notifications

Events (`backend/src/services/hr.notification.ts`):

`leave_submitted`, `leave_approved`, `leave_rejected`, `attendance_correction`, `birthday_reminder`, `confirmation_reminder`, `document_expiring`, `new_employee`

Leave/attendance/new-employee paths write **in-app** notifications and enqueue **OutboundNotification** (IN_APP) without failing the business operation on enqueue errors.

## Tests run

```text
npx tsx prisma/seed.ts          # structural + demo
npx prisma migrate status       # up to date
npx tsc --noEmit                # backend OK
npx tsx scripts/hr-smoke.ts     # all assertions passed
npm run build                   # frontend (prior milestone; HrModule chunk present)
```

Smoke coverage (`backend/scripts/hr-smoke.ts`):

- Branch isolation (CTG manager cannot see Dhaka employee)
- Global admin sees cross-branch
- Employee code auto-generation
- Leave submit → HR approve
- Dashboard `employeesCount`
- Employees report table build
- Soft delete hides employee
- `hr` permission + SUPER_ADMIN full grant

## Explicit non-goals (unchanged)

- Multi-tenant / `tenantId`
- Payroll / salary calculation engine (reference field only)
- Biometric / geo attendance
- Replacing Staff/Supplier/Accountant portals
- Changing booking/CRM/finance APIs or tables

## Known limitations / Phase 2 candidates

- No Jest/Vitest HR unit suite yet — smoke script only
- Birthday / confirmation / document-expiry reminders are event strings + dashboard surfaces; scheduled job not yet shipping
- Optional manager `Task` on leave submit not created
- Unified multi-channel notification worker/templates remain outside this Phase 1 commit set (HR uses in-app + outbound enqueue helper)
- Frontend HR copy is mostly English UI strings (nav label is i18n’d)

## Success criteria checklist

- [x] Existing ERP modules unchanged in behavior (HR additive only)
- [x] HR queries branch-scoped via auth context
- [x] Soft delete + audit on HR entities
- [x] Leave/attendance dual approval with notifications
- [x] Completion report with readiness score
