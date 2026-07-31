# Milestone D — HR Production Validation & Integration

**Branch:** `feature/hr-production`  
**Date:** 2026-07-31  
**Scope:** Productionize existing HR Phase 1 (no redesign; no Payroll / Recruitment / ATS / Performance).

---

## Summary

HR Phase 1 is mounted on live APIs and was already largely implemented. This milestone closed production gaps: portal auth-only routes, attendance correction queue status bug, leave balance enforcement, lifecycle reminder notifications, portal self-service wiring, portal user linking, and demo/structural seed for HR org units.

**Quality gates:** backend `npm run build` ✅ · frontend `npm run build` ✅  
**Smoke:** 38/38 checks passed against the running API.

---

## Verified APIs

| Area | Routes | Result |
|------|--------|--------|
| Dashboard | `GET /hr/dashboard` | Live KPIs from DB |
| Org | Departments / Sections / Teams / Designations CRUD | Live |
| Employees | List / get / create / update / status / timeline | Live; `userId` linkable on update |
| Documents | List / upload / replace / soft-delete / file | Live |
| Leave | Types / balances / requests + submit / manager / HR / reject / cancel | Live; HR approve checks balance + max/year |
| Holidays | CRUD | Live |
| Attendance | List / upsert / clock-in/out / corrections + approvals | Live |
| Reports | `GET /hr/reports/export` CSV / XLSX / PDF | Live |
| Portal me | `GET/PATCH /hr/me`, leave, attendance, corrections | Live |
| **New portal** | `GET /hr/me/leave-types`, `GET /hr/me/documents/:docId/file`, `GET /hr/me/approvals` | Auth-only, owner/manager scoped |
| Auth | `POST /auth/change-password` | Live (authenticated) |

No 404 / placeholder / dead HR routes found on the inventory above.

---

## Verified UI

### Admin HR (`/erp` → HR module)
- Dashboard KPI cards + AI Insights derived from live dashboard payload (no hard-coded fake numbers)
- Employees CRUD + portal user link field
- Organization (departments / designations)
- Leave types + leave requests with manager/HR actions
- Attendance + **correction queue** (fixed: was filtering `PENDING`; enum is `SUBMITTED` / `MANAGER_APPROVED`)
- Holiday calendar
- Documents
- Reports export (CSV / Excel / PDF)

### Employee Portal (`/employee`)
- Login (existing auth) → linked employee profile required
- Profile + personal info edit (phone, email, emergency contact, address) via `PATCH /hr/me`
- Documents download via `/hr/me/documents/:id/file` (no `hr.view` required)
- Leave request using `/hr/me/leave-types` + balances from `ensureBalances`
- Attendance clock in/out + correction request
- Manager Approvals inbox (`/hr/me/approvals`)
- Notifications (in-app)
- AI Assistant insights from live portal data
- Change Password → `/auth/change-password`

---

## Business scenarios

| # | Flow | Result |
|---|------|--------|
| 1 | Employee linked → portal login → profile → documents | **PASS** |
| 2 | Leave request → manager → HR → balance update → notification | **PASS** (20→18 for 2-day Annual) |
| 3 | Attendance → correction → manager → HR approve | **PASS** |
| 4 | Document expiry → notification (`processHrLifecycleReminders`) | **PASS** |

---

## RBAC verification

| Role / actor | Expectation | Result |
|--------------|-------------|--------|
| SUPER_ADMIN / COMPANY_ADMIN | Full HR | PASS |
| BRANCH_MANAGER | `hr:full` — can view/manage HR | PASS |
| STAFF (no `hr` grant) | Blocked from `/hr/dashboard` (403) | PASS |
| STAFF portal owner | `/hr/me*` OK; admin document file path 403 | PASS |
| Manager (linked `managerId`) | Manager-approve leave/corrections without needing to be the HR module owner | PASS |
| ACCOUNTANT | `hr:view` only (seed matrix) — manage routes remain manage-gated | Seed matrix unchanged |

No permission leaks observed in smoke (portal cannot hit admin file route; plain STAFF cannot open HR dashboard).

---

## Smoke test

Executed against `http://127.0.0.1:4030/api` after restarting `smtravels-api` with the new build.

```
passed=38 failed=0
```

Covered: Employees, Leave, Attendance, Portal, Reports (CSV/XLSX/PDF), Dashboard, Notifications, Permissions, Change Password endpoint.

---

## Known limitations

1. **Production seed** skips demo users (`NODE_ENV=production`). Portal login requires an `Employee.userId` link created via Admin HR (now supported in UI) or structural ops.
2. **AI Assistant** on the portal is rule-based insights from live HR data (same pattern as admin `AiInsightCard`), not a separate LLM chat module.
3. **Lifecycle reminders** run hourly in the notification worker and dedupe for 6 days; first run after process start fires immediately.
4. **Reports date-range UI** still uses defaults (year / current filters on the API); export endpoints themselves are live for all report keys.
5. Smoke users created for validation (`usr_smoke_*`) are local test accounts — rotate/remove if not wanted long-term.
6. Milestone E / Payroll / Recruitment / ATS / Performance were **not** started.

---

## Files changed

- `backend/src/services/hr.service.ts` — ensureBalances on getEmployee; HR leave balance checks; portal leave-types / my-document / manager approvals; lifecycle reminders; `userId` on employee update
- `backend/src/controllers/hr.controller.ts` — portal handlers
- `backend/src/routes/hr.route.ts` — portal routes
- `backend/src/services/notificationWorker.ts` — hourly HR reminder tick
- `backend/src/services/auth.service.ts` + `auth.controller.ts` + `auth.route.ts` — change password
- `backend/prisma/seed.ts` — HR departments/designations + demo employees (non-prod)
- `frontend/src/app/hooks/hr.ts` — portal hooks / downloadMyDocument / change password
- `frontend/src/app/portal/EmployeePortal.tsx` — full self-service wiring
- `frontend/src/app/erp/hr/AttendanceView.tsx` — corrections queue status fix
- `frontend/src/app/erp/hr/EmployeesView.tsx` — portal user link
- `MILESTONE_D_HR_PRODUCTION_REPORT.md` — this report

---

## STOP

Milestone D complete. Awaiting approval before Milestone E.
