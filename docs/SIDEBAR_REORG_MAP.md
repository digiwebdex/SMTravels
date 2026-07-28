# ERP Sidebar Reorganization — Mapping & Plan

Planning doc for the SM Travels ERP sidebar reorganization (companion to
`SCHEMA_DECISIONS.md`). This is a **regroup + gap-fill**, not a rebuild: every
existing module keeps working; nav is regrouped and new sections get placeholders.

## Decisions (approved)

1. **Consolidate to 10 parent groups** (not the spec's ~32 flat sections):
   Dashboard · CRM · Bookings & Services · Operations · Partners & Suppliers ·
   Finance · Communication · Reports · Portals · Administration.
   Group so each role reaches its core screens in 1–2 clicks.
2. **7 merges = nav-level only.** Multiple menu entries point at the ONE existing
   screen with a pre-applied filter (e.g. Hajj→Bookings, Umrah→Bookings both open
   the existing Bookings screen filtered by service). Modules are NOT rewritten;
   the only touch is a ≤3-line additive "read starting filter from the URL" on
   Bookings. No filter param = today's exact behavior.
3. **Provider mismatches** (WhatsApp = Wasender vs built Meta mock; OCR = Google
   Vision vs generic mock; AI = Gemini): interfaces are provider-agnostic — the
   concrete provider is chosen when real credentials are wired, not now.
4. **Language:** English `t()` labels now (erpNav namespace). Bangla is deferred
   to the coordinated Pass-3 sweep — not displayed in the ERP yet.
5. **AI Assistant** stays a placeholder (Phase 5, separately security-scoped).

## Legend

- **Built** — functionality exists & is reachable now (regroup only).
- **New** — not built → "Coming soon" placeholder (Step 3).
- **Move** — duplicates an existing module → consolidate, don't rebuild.
- **(model)** — backend/data exists, no admin screen yet.

## Built ERP screens (15) + portals (5)

Dashboard `/erp` · CRM `/erp/crm` · Bookings `/erp/bookings` · Packages
`/erp/packages` · Services `/erp/services` · Hajj/Umrah Ops `/erp/hajj-ops` ·
Accounts `/erp/accounts` · Invoices & Payments `/erp/invoices` · Reports
`/erp/reports` · Reports & BI `/erp/reports-bi` · Documents `/erp/documents` ·
Communications `/erp/communications` · CMS `/erp/cms` · Operations `/erp/ops` ·
Settings `/erp/settings` — plus Customer/Agent/Supplier/Staff/Accountant portals.

## Map — spec section → disposition

| Spec section / item | Disposition | Maps to |
|---|---|---|
| **Dashboard** → Executive | Built | SuperAdminDashboard `/erp` |
| Dashboard → Branch / My / Notification Center | New / Built(portal) | branch view new; My = portals; bell exists (model) |
| **CRM** → Leads · Customers · Corporate · Follow-up | Built | CrmModule `/erp/crm` (tabs) |
| CRM → Customer Documents | **Move** | → Documents (owner-scoped) |
| **Hajj** → Seasons · Pilgrims · Groups · Operations | Built | Hajj/Umrah Ops (quota, registration, batches, passport) |
| Hajj → Packages · Bookings | **Move** | → Packages / Bookings (filter = Hajj) |
| Hajj → Mahram | Built | Traveler form (mahram relation) |
| **Umrah** → Groups · Operations | Built | Hajj/Umrah Ops |
| Umrah → Packages · Bookings | **Move** | → Packages / Bookings (filter = Umrah) |
| Umrah → Ziyarah | New | package itinerary covers routes |
| **Air Ticket** → Reservation · Ticket Issue | **Move** | → Bookings (service = Air Ticket) |
| Air Ticket → Refund | **Move** | → Invoices — Refunds |
| Air Ticket → Reissue · Airlines | New | airline master (model) |
| **Visa** → Applications | **Move** | → Bookings (service = Visa) |
| Visa → Processing/Embassy/Approved/Rejected/Expired | Built | booking stage events (status views) |
| Visa → Documents | **Move** | → Documents |
| **Passport & Documents** → Tracking · OCR Scanner | Built | Hajj/Umrah Ops (alerts) + Item 4 OCR |
| Passport → Verification · Archive | **Move** | → Documents (merge w/ Document Center) |
| Passport → Collection · Return | New | custody workflow |
| **Package Management** (all types) | Built | PackageManagement `/erp/packages` + Services — filter by type (canonical home for all "Packages") |
| **Finance** → Accounts · Cash Book · Bank · Journal · Ledger | Built | AccountsModule `/erp/accounts` |
| Finance → Trial Balance · P&L · Balance Sheet | Built | ReportsModule (P&L, Balance Sheet, Cash Flow) |
| Finance → Manual Transfer · NPSB · Payment Verification | New | Phase 4 payment gateways |
| **Invoices & Payments** (all 6 items) | Built | InvoicesModule `/erp/invoices` — full match (tabs) |
| **Sales** → Discounts · Coupons | Built | wizard discounts + promo (model) |
| Sales → Quotations · Sales Orders | New | not built |
| **Expenses** → Supplier Payments/Office/Utilities/Misc/Marketing | Built | Expense model + Accounts (model) |
| Expenses → Salary | **Move** | → HR & Payroll (new) |
| **Reports & Analytics** (all) | Built | ReportsModule + Reports & BI |
| **Website CMS** (all) | Built | CmsModule `/erp/cms` |
| CMS → SEO | New | per-page meta (partial) |
| **Settings** → Company/Branch/Users/Roles/Currency/Language/Invoice/Backup | Built | SettingsModule `/erp/settings` |
| Settings → Prayer Time · Hijri · API Integrations | New | not built |
| Settings → Audit Log | Built | Operations — logs |
| **Security** → Activity Logs · Login History · Backup & Restore | Built | Operations / Settings |
| Security → Device Logs · IP Restrictions · 2FA | New | 2FA field exists (model) |
| **Communication** → Announcements · Internal Chat · Notifications | Built | Communications + Operations |
| Communication → Broadcast | **Move** | → merge w/ Channels + Marketing |
| **Communication Channels** → Email Center | Built | Communications (email) |
| Channels → SMS Center · WhatsApp Center | New | senders exist (model); center UI new |
| **Tasks** → My Tasks · Calendar · Reminders · Staff Assignment | Built | Operations + Staff portal |
| Tasks → Follow-up | **Move** | → CRM Follow-up |
| **Document Center** (all doc types) | **Move** | → DocumentsModule (single canonical Documents home) |
| **Customer / Agent Portal** | Built | `/portal` · `/agent` (+ supplier/staff/accountant) |
| Portal → AI Chat | New | Phase 5 |
| **Partners** → B2B Agents · Sub Agents | New | agent + downline (model); admin UI new |
| Partners → Referral · Corporate · Saudi | New | not built |
| **Suppliers** (all categories) | **Move** | supplier + portal (model); one Suppliers admin |
| **Hotels** → Hotel Suppliers | **Move** | → Suppliers |
| Hotels → List · Room Allocation · Rooming · Check In/Out | New | hotel ops (HotelBooking model) |
| **Transport** (all) | New | full new module |
| **Operations Team** → Muallim | Built | batch Muallim / Maktab |
| Ops Team → Leaders/Guides/Imam/Medical/Drivers/Coordinators | New | roster new |
| **HR & Payroll** → Commission | Built | agent commission + wallet (model) |
| HR → Employees/Attendance/Leave/Payroll/Incentives | New | full new module |
| **Marketing** → campaigns | **Move** | → merge w/ Communication Channels |
| Marketing → Referral · Coupons · Lead Import | New | coupons = promo (model) |
| **Branch Management** → List · Users · Performance · Revenue | Built | Settings + Reports |
| Branch → Targets | New | not built |
| **AI Assistant** (Gemini, all) | New | placeholder — Phase 5, security-scoped |
| **OCR Center** → Passport OCR | Built | Item 4 (mock) — in traveler form |
| OCR → Visa/NID/Ticket/Voucher · History | New | OCR interface exists (model) |

## Step 2 — the 10 groups (existing screens + Bookings merges)

Groups render only when they contain a screen the user's role can see (empty
groups — Partners & Suppliers, Portals — populate in Step 3).

1. **Dashboard** — Dashboard `/erp`
2. **CRM** — CRM & Leads `/erp/crm`
3. **Bookings & Services** — All Bookings `/erp/bookings`, Hajj `?service=HAJJ`,
   Umrah `?service=UMRAH`, Visa `?service=VISA`, Air Ticket `?service=AIR_TICKET`,
   Packages `/erp/packages`, Services `/erp/services`
4. **Operations** — Hajj/Umrah Ops `/erp/hajj-ops`, Documents `/erp/documents`,
   Operations `/erp/ops`
5. **Partners & Suppliers** — *(Step 3 placeholders)*
6. **Finance** — Accounts `/erp/accounts`, Invoices & Payments `/erp/invoices`
7. **Communication** — Communications `/erp/communications`
8. **Reports** — Reports & Analytics `/erp/reports`, Reports & BI `/erp/reports-bi`
9. **Portals** — *(role-scoped separate navs; Step 3 decides admin links)*
10. **Administration** — CMS `/erp/cms`, Settings `/erp/settings`

## Step 3 — new sections, ranked by build complexity (to be scoped each as its own pass)

Placeholders only in Step 3; functionality later. AI Assistant stays a
placeholder regardless. Ranking delivered with the Step 3 pass.
