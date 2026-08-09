# Phase 2 — Final ERP Navigation (frontend-only)

**Date:** 2026-08-09 · **Branch:** `feature/prod-cms-merge`. Frontend-only; **no backend/schema/model/currency/package change.**

## What changed (3 areas, 1 nav source of truth)
1. **`frontend/src/app/erp/ErpLayout.tsx`** — rewrote `NAV_GROUPS` (single source) from the old 10-group sidebar to the **final 15-group menu**. Added `NavItem` type + a `q` (tab hint) field; generalized `isActiveItem` + link builder to honor `svc` (service filter) and `q` (tab).
2. **`frontend/src/app/routes.tsx`** — added **13 ComingSoon placeholder routes** for final-menu items not yet built (`muallim`, `manpower/*` ×8, `network/companies`, `network/scholars`, `hr/payroll`, `settings/currency`). **No existing route removed.**
3. **`i18n/locales/{en,bn}/erpNav.json`** — added all final-menu `group.*` / `item.*` keys (kept legacy keys the existing ComingSoon routes still reference); **bn now has real Bangla labels** (was English placeholders).

## Final menu → route/RBAC mapping
Every item maps to a **real route**, a `svc`-filtered Bookings screen, an existing screen + `?tab=` hint, or an **explicit ComingSoon** placeholder. `module` **reuses existing RBAC keys** (no new permission keys in Phase 2, so nothing vanishes for current roles).

| Group | Items → (route, module) |
|---|---|
| Dashboard | `/erp` (dashboard) |
| CRM | Customers `/erp/crm?tab=customers`, Leads `?tab=leads`, Agents `/erp/partners`(partners), Corporate `?tab=corporate` — module crm |
| Air Ticketing | Bookings `/erp/bookings?service=AIR_TICKET`, Tickets (+`view=tickets`), Suppliers `/erp/suppliers` |
| Visa | Applications `/erp/bookings?service=VISA`, Types `/erp/services` |
| Hajj & Umrah | Hajj/Umrah `…?service=HAJJ|UMRAH`, Pilgrims/Groups `/erp/hajj-ops?tab=…`, Packages `/erp/packages`, **Muallim/Mutawwif `/erp/muallim` (ComingSoon → Phase 3)** |
| Manpower | Job Orders/Candidates/Employers/Recruitment/Visa/Medical/BMET/Deployment → `/erp/manpower/*` (ComingSoon → Phase 8) |
| Tour & Travel | Tour Packages `/erp/packages?type=tour`, Bookings `?service=TOUR`, Transport `/erp/transport` |
| Hotel | Hotel Bookings `?service=HOTEL`, Hotels/Suppliers `/erp/hotels` |
| Operations | Tasks/Assignments `/erp/ops?tab=…`, Operations Team `/erp/ops-team` |
| Accounts | Income/Expenses/Cust Pay/Supp Pay `/erp/accounts?tab=…`, Invoices `/erp/invoices`, Reports `/erp/reports?tab=accounts` |
| HR & Payroll | Employees/Attendance/Leave `/erp/hr?tab=…`, **Payroll `/erp/hr/payroll` (ComingSoon → later)** |
| Business Network | **Companies `/erp/network/companies`**, **Mufti/Scholar `/erp/network/scholars`** (ComingSoon → Phases 6/7), Suppliers `/erp/suppliers`, B2B Partners `/erp/partners` |
| Communication | WhatsApp `/erp/whatsapp`, SMS `/erp/sms`, Notifications `/erp/communications` |
| Reports | Sales/Hajj/Manpower/Accounts/Operations → `/erp/reports?tab=…` |
| Settings | Company/Users/Branches/System `/erp/settings?tab=…`, **Currency `/erp/settings/currency` (ComingSoon → Phase 4)**, Website/CMS `/erp/cms` |

## Removed from USER-FACING nav (routes + APIs PRESERVED, reachable directly/contextually)
`All Bookings` (bare), `Documents`, `OCR`, standalone `Sales` (now Reports→Sales), `Marketing`, `Reports BI`, `Integrations`, `AI`. These were obsolete/duplicate/technical menu entries; **their routes and backend APIs are untouched** — nothing deleted, only un-surfaced per the final plan.

## RBAC / visibility
`can(module)` hides any item whose module the user lacks. All items reuse **existing** module keys (`dashboard, crm, bookings, packages, ops, operations_team, documents, partners, suppliers, accounts, invoices, sales, communication, reports, cms, settings`). Dedicated modules (`manpower`, `business_network`, `payroll`, `currency`) will be seeded with their backend in later phases. HR items reuse `settings` (matches current gating) — a dedicated `hr` permission is a Phase-9 RBAC task.

## Verification
- **Frontend typecheck:** 0 errors introduced by Phase 2. (6 pre-existing errors remain — `AppShell` `ErpOutletCtx` missing export + `typeIcon` lucide-vs-`React.FC` mismatch — present before Phase 2; not nav-related.)
- **Frontend build (`vite build`):** exit 0.
- **Nav↔route consistency:** all 34 nav paths resolve to a route (no orphan/404).
- **ERP regression:** all module routes present — crm, bookings, sales, suppliers, ops, hajj-ops, communications, hr, partners, packages, accounts, invoices, reports, cms, settings — + 6 portals + auth guard. No functionality unreachable.
- **No duplicate nav entries** (each item has a distinct path or path+query).

## Next
Phase 3 — Hajj & Umrah surface + Muallim/Mutawwif page (backed by `OperationsTeamMember` roster). Await approval.
