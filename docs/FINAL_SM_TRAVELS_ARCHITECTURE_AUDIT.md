# SM Travels ERP — Final Architecture Audit (Phase 1)

**Date:** 2026-08-09 · **Branch audited:** `feature/prod-cms-merge @ 126a6a9` (= production `ecb53b2` + CMS + OCR).
**Target production:** `srv1868345 / 200.141.8.183` · `https://smtravelsinternational.com/`. **Old/dev box `187.77.144.38` is NOT a production dependency.**

> Read-only audit. **No implementation performed.** Purpose: map the current app onto the FINAL PRODUCTION MENU and mark each item Reuse / Modify / Create before any change.

## Headline findings
- **The backend is ~85% already built.** 106 Prisma models, 37 route groups. Most "new" menu items are **re-navigation of existing functionality**, not new engineering.
- **Dual currency ALREADY exists** — `enum Currency { BDT USD SAR }`, and every money row carries `currency` + `exchangeRate @db.Decimal(18,8)` + `baseAmount` (invariant `baseAmount = amount × exchangeRate`, base = BDT). No silent conversion; transaction currency is preserved per row. → Requirement is a **Settings→Currency UI + exchange-rate management**, not a data-model rebuild.
- **Packages exist** (`Package`, `PackagePricing`, `PackageItinerary`, `PackageInclusion`, `PackageAvailability`) → Custom Package = **extend**, not a new engine.
- **Muallim exists** as the ops roster (`OperationsTeamMember`, linked via `muallimId/muallimName/muallimNo`) → surface under Hajj & Umrah; add "Mutawwif" as a roster role.
- **Genuinely NEW build:** Manpower lifecycle (JobOrder→Candidate→…→Deployment), Mufti/Scholar Network, Companies-We-Work-With, Payroll runs. All **additive** (new tables), zero changes to existing tables/migrations.
- **Current nav** is a 10-group sidebar in `frontend/src/app/erp/ErpLayout.tsx` (single source), RBAC-gated by a `module:` tag per item, labels via the `erpNav` i18n namespace. → The final menu is a **rewrite of that one array + i18n keys**, not scattered edits.

## Existing inventory (verified)
- **Backend routers (37):** health, system, auth, customer, booking, branch, lead, corporate, user, agent, supplier, catalog, accounts, invoices, receipts, reports, dashboard, hajjOps, ocr, document, notification, public, portal, portalRoles, partners(=agents), suppliers, operations, sales, communication(+communications), integrations, ai, cmsPublic, cms, ops, hr.
- **Key models:** Customer, Lead, Agent, CorporateClient · Booking + {Hajj,Umrah,Visa,AirTicket,Hotel,Manpower,Tour}Booking · Traveler, Document · Package(+Pricing/Itinerary/Inclusion/Availability), Service · Invoice, Payment, Receipt, Refund, InstallmentPlan · Account, JournalEntry/Line, Expense, Income, SupplierPayable · Supplier(+Service/Invoice) · HajjQuota, DepartureBatch, PilgrimRegistration, OperationsTeamMember · Employee(+HR* leave/attendance) · Conversation, Message, OutboundNotification, MessageLog · Setting, Branch, Company, Role/Permission.

---

## OLD → FINAL menu mapping

Legend — **R**=Reuse (surface/re-nav only) · **M**=Modify (extend existing) · **C**=Create (new model/API/UI).

| FINAL menu item | Existing? | R/M/C | Backend API | DB model | Frontend route | Migration | Risk |
|---|---|---|---|---|---|---|---|
| **Dashboard** | yes | R | `dashboardRouter` | (aggregates) | `/erp` | No | Low |
| **CRM › Customers** | yes | R | `customerRouter` | `Customer` | `/erp/crm` | No | Low |
| **CRM › Leads** | yes | R | `leadRouter` | `Lead`,`LeadActivity` | `/erp/crm` | No | Low |
| **CRM › Agents** | yes | R | `agentRouter` | `Agent`,`AgentWallet` | `/erp/crm` (agents) | No | Low |
| **CRM › Corporate Clients** | yes | R | `corporateRouter` | `CorporateClient` | `/erp/crm` | No | Low |
| **Air Ticketing › Bookings** | yes | R | `bookingRouter` (svc=AIR_TICKET) | `Booking`,`AirTicketBooking` | `/erp/bookings` | No | Low |
| **Air Ticketing › Tickets** | partial | M | `bookingRouter` | `AirTicketBooking` (PNR/ticketNo) | `/erp/air-ticketing` | Maybe (add ticketNo/PNR fields if absent) | Low |
| **Air Ticketing › Suppliers** | yes | R | `supplierRouter` | `Supplier` | `/erp/suppliers` | No | Low |
| **Visa › Visa Applications** | yes | R | `bookingRouter` (svc=VISA) | `VisaBooking` | `/erp/visa` | No | Low |
| **Visa › Visa Types** | partial | M | `catalogRouter`/`Service` | `Service`/`Setting` | `/erp/visa/types` | Maybe (visa-type catalog) | Low |
| **Hajj & Umrah › Hajj** | yes | R | `bookingRouter`(HAJJ)+`hajjOpsRouter` | `HajjBooking`,`HajjQuota` | `/erp/hajj` | No | Low |
| **Hajj & Umrah › Umrah** | yes | R | `bookingRouter`(UMRAH) | `UmrahBooking` | `/erp/umrah` | No | Low |
| **Hajj & Umrah › Pilgrims** | yes | R | `hajjOpsRouter` | `PilgrimRegistration`,`Traveler` | `/erp/hajj-ops` | No | Low |
| **Hajj & Umrah › Packages** | yes | R/M | `catalogRouter` | `Package`+children | `/erp/packages` | (see Custom Package) | Low |
| **Hajj & Umrah › Groups** | yes | R | `hajjOpsRouter` | `DepartureBatch` | `/erp/hajj-ops` (groups) | No | Low |
| **Hajj & Umrah › Muallim / Mutawwif** | yes(roster) | M | `opsRouter` | `OperationsTeamMember` | `/erp/muallim` | Maybe (add MUTAWWIF role value) | Med |
| **Manpower › Job Orders** | no | **C** | new `manpowerRouter` | new `JobOrder` | `/erp/manpower/job-orders` | **Yes (additive)** | Med |
| **Manpower › Candidates** | partial | **C** | new | new `Candidate` (link `Customer`) | `/erp/manpower/candidates` | **Yes** | Med |
| **Manpower › Employers** | partial | **C** | new | new `Employer` (or `BusinessPartner`) | `/erp/manpower/employers` | **Yes** | Med |
| **Manpower › Recruitment** | no | **C** | new | new `RecruitmentApplication` | `/erp/manpower/recruitment` | **Yes** | Med |
| **Manpower › Visa & Processing** | partial | M | reuse `VisaBooking`/`Document` | existing | `/erp/manpower/visa` | No | Med |
| **Manpower › Medical** | no | **C** | new | new `MedicalProcessing` | `/erp/manpower/medical` | **Yes** | Med |
| **Manpower › BMET / Clearance** | no | **C** | new | new `BmetClearance` | `/erp/manpower/bmet` | **Yes** | Med |
| **Manpower › Deployment** | partial | M/C | reuse `ManpowerBooking` + new `ManpowerDeployment` | `ManpowerBooking` | `/erp/manpower/deployment` | **Yes** | Med |
| **Tour › Tour Packages** | yes | R | `catalogRouter` | `Package`(TOUR) | `/erp/tour` | No | Low |
| **Tour › Bookings** | yes | R | `bookingRouter`(TOUR) | `TourBooking` | `/erp/tour` | No | Low |
| **Tour › Transport** | no(soon) | **C** | new `transportRouter` | new `TransportService`/reuse `SupplierService` | `/erp/transport` | Maybe | Low |
| **Hotel › Hotel Bookings** | yes | R | `bookingRouter`(HOTEL) | `HotelBooking` | `/erp/hotels` | No | Low |
| **Hotel › Hotels / Suppliers** | yes | R | `supplierRouter` | `Supplier`,`SupplierService` | `/erp/suppliers` | No | Low |
| **Operations › Tasks** | yes | R | `operationsRouter`/`opsRouter` | `Task` | `/erp/ops` | No | Low |
| **Operations › Assignments** | yes | R/M | `operationsRouter` | `Task`(assignee) | `/erp/ops` | No | Low |
| **Operations › Operations Team** | yes | R | `opsRouter` | `OperationsTeamMember` | `/erp/ops-team` | No | Low |
| **Accounts › Income** | yes | R | `accountsRouter` | `Income` | `/erp/accounts` | No | Low |
| **Accounts › Expenses** | yes | R | `accountsRouter` | `Expense` | `/erp/accounts` | No | Low |
| **Accounts › Customer Payments** | yes | R | `accountsRouter` | `Payment`,`Receipt` | `/erp/accounts` | No | Low |
| **Accounts › Supplier Payments** | yes | R | `accountsRouter` | `SupplierPayable` | `/erp/accounts` | No | Low |
| **Accounts › Invoices** | yes | R | `invoicesRouter` | `Invoice`,`InvoiceItem` | `/erp/invoices` | No | Low |
| **Accounts › Reports** | yes | R | `reportsRouter` | (aggregates) | `/erp/reports` | No | Low |
| **HR & Payroll › Employees** | yes | R | `hrRouter` | `Employee` | `/erp/hr` | No | Low |
| **HR & Payroll › Attendance** | yes | R | `hrRouter` | `HrAttendanceRecord` | `/erp/hr` | No | Low |
| **HR & Payroll › Leave** | yes | R | `hrRouter` | `HrLeaveRequest`/`Balance` | `/erp/hr` | No | Low |
| **HR & Payroll › Payroll** | no | **C** | new | new `PayrollRun`,`Payslip` | `/erp/hr/payroll` | **Yes** | Med |
| **Business Network › Companies We Work With** | no | **C** | new `businessNetworkRouter` | new `BusinessPartner` | `/erp/network/companies` | **Yes** | Med |
| **Business Network › Mufti / Scholar Network** | no | **C** | new | new `MuftiScholar` | `/erp/network/scholars` | **Yes** | Med |
| **Business Network › Suppliers** | yes | R | `supplierRouter` | `Supplier` | `/erp/suppliers` | No | Low |
| **Business Network › B2B Partners** | yes | R | `partnersRouter`(agents) | `Agent` | `/erp/partners` | No | Low |
| **Communication › WhatsApp** | yes | R | `communicationRouter` | `Message`,`MessageLog` | `/erp/whatsapp` | No | Low |
| **Communication › SMS** | yes | R | `communicationRouter` | `MessageLog` | `/erp/sms` | No | Low |
| **Communication › Notifications** | yes | R | `notificationRouter` | `Notification`,`OutboundNotification` | `/erp/communications` | No | Low |
| **Reports › Sales/Hajj/Accounts/Ops** | yes | R | `reportsRouter` | (aggregates) | `/erp/reports` | No | Low |
| **Reports › Manpower** | no | **C** | extend `reportsRouter` | new manpower models | `/erp/reports` | No | Low |
| **Settings › Company/Users/Branches/System** | yes | R | `system`/`user`/`branch` | `Company`,`User`,`Role`,`Branch`,`Setting` | `/erp/settings` | No | Low |
| **Settings › Currency** | infra-yes | M | new small `currencyRouter` | `enum Currency`+new `ExchangeRate` cfg | `/erp/settings/currency` | Maybe (rate table) | Low |

## The 6 new business requirements — reuse decision
1. **Dual Currency — EXISTS (BDT/USD/SAR).** Add: Settings→Currency page + an `ExchangeRate` config table (date-effective rates) for defaults; keep per-transaction `currency/exchangeRate/baseAmount` untouched. **No conversion of existing rows.** Additive only.
2. **Custom Package — EXTEND `Package`.** Add optional component columns (hotel/transport/flight/visa/food/guide/muallim/cost/sellingPrice/currency/validity/status/notes). Additive columns; existing packages unaffected.
3. **Companies We Work With — CREATE `BusinessPartner`** (name/type/contact/phone/email/address/country/services/notes/status + optional Documents). Not the tenant `Company`.
4. **Mufti / Scholar Network — CREATE `MuftiScholar`** (relationship/network entity; NOT `Employee`).
5. **Muallim / Mutawwif — REUSE `OperationsTeamMember`** roster; add `MUTAWWIF` role value; surface a dedicated Hajj & Umrah page; keep the existing `muallimId` booking link.
6. **Manpower — CREATE lifecycle** (`JobOrder`, `Candidate`←links `Customer`, `Employer`, `RecruitmentApplication`, `MedicalProcessing`, `BmetClearance`, `ManpowerDeployment`←links `ManpowerBooking`). Reuse Customer/Document/VisaBooking; no duplicate person records.

## RBAC / menu visibility
Reuse the existing `module:`-tag + DB permission model. New `module` keys to seed: `manpower`, `business_network`, `payroll`, `currency`. Map: Admin→all; Accounts→accounts+reports; HR→hr+payroll; Ticketing→bookings(AIR_TICKET); Hajj/Umrah staff→hajj/umrah/ops; Manpower staff→manpower. No new roles invented — extend existing role→permission seeds.

## Migration plan (all additive, prod-safe)
New migrations (dated after `20260808040000_home_sections`), each `CREATE TABLE`/`ADD COLUMN IF NOT EXISTS`/`ALTER TYPE ADD VALUE` only: `custom_package_fields`, `business_partner`, `mufti_scholar`, `manpower_lifecycle`, `payroll`, `exchange_rate_config`, `roster_mutawwif_role`. **No existing migration modified/renamed/deleted; no drop/reset; existing money rows untouched.**

## Risks
- **Manpower scope** is the largest new surface (7 sub-modules) → build incrementally, reuse Customer/Document. **Med.**
- **Muallim role enum** add + surfacing without breaking existing `muallimId` links. **Med.**
- **Menu RBAC**: hiding old items must not remove backend APIs other flows call. Nav-only removal. **Low.**
- **Currency**: must not retro-convert; only add config + UI. **Low.**
- **Deployment**: layers on the not-yet-deployed CMS+OCR branch; single combined deploy via the guarded script (owner-run on 200.141.8.183). **Med (process).**

## NEXT STEP
Phase 2 — author the single-source final nav array + i18n keys + RBAC module map (frontend `ErpLayout.tsx`), no backend change yet. **Await owner review of this audit before implementing.**
