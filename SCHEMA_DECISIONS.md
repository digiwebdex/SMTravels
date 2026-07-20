# Schema Decisions & UI-Ambiguity Log

Why the SM Travels database schema (`backend/prisma/schema.prisma`) looks the way it
does. Every model was derived from what the ERP/portal UI actually captures or
displays (`frontend/src/app/...`), not a generic ERP template. This file is the
record of the judgment calls — especially where the UI was ambiguous or silent and
a rule forced a decision.

## 0. Tenancy — SINGLE-TENANT
SMTravels is a single-client build (SM Travels International). Confirmed with the
owner. Therefore: **no `companyId` on any table** (`branchId` is the top scope),
`Company` is a one-row settings table, and **no `SubscriptionPlan`**. The mock's
"Subscription Plans / SaaS" screens are generic-template noise (same class as the
leftover "BDH Travels" brand and the faked per-departure-date seats). The separate
multi-tenant product (TravelAgencySaaS) is where the SaaS play lives.
> If SMTravels is ever resold to other agencies, this is a rewrite: `companyId`
> must be backfilled onto ~57 tables, added to every unique/index, and enforced by
> a tenant-isolation Prisma extension. Decide before there is production data.

## 1. Rules that ADD structure the UI does not have
The UI is a mock on hardcoded data; these non-negotiables were imposed on top:
- **Money everywhere.** The UI renders bare `৳` numbers and stuffs foreign amounts
  (SAR salaries, USD visa fees) into free text. Every monetary row instead carries
  `amount @db.Decimal(18,4)`, `currency`, `exchangeRate @db.Decimal(18,8)`,
  `baseAmount @db.Decimal(18,4)`. **Base currency = BDT.** Invariant
  `baseAmount = amount × exchangeRate` (and BDT ⇒ `exchangeRate = 1`) is enforced in
  the **service layer** (a DB CHECK can't reference a rate that may legitimately be
  1.0 for BDT while non-BDT rows vary; the service is the single write path for money).
- **`branchId` on every transactional model.** The finance UI has *no* branch field
  on invoices/payments/income/expense (only bank accounts) — added throughout for
  branch scoping and the reports.
- **Soft delete** (`deletedAt`) on all business models — EXCEPT the immutable ledger.
- **Booking DRAFT + resume.** The wizard is all uncontrolled inputs with a transient
  `step` integer and no persistence. Added `BookingStatus.DRAFT`, `Booking.currentStep`,
  and `Booking.wizardData (Json)` so a partial booking is saved server-side and
  resumes on any device (never browser storage).
- **Documents on the volume.** The UI discards the selected file. `Document` stores
  `filePath` + `mimeType` + `sizeBytes` (files live on the server volume) + OCR
  metadata columns.

## 2. Immutable ledger
`JournalEntry`, `JournalLine`, `Payment`, `Receipt`, **and `WalletTransaction`** are
append-only: **no `deletedAt`**, `onDelete: Restrict` on their relations, and
reversal fields (`isReversed`, `reversalOfId`, `reversedById`, `postedAt`).
Corrections are reversal entries, never updates/deletes. `WalletTransaction` was
added to the user's original four because a wallet is a ledger. **Confirmed.**

## 3. Renames / merges (approved)
- `SupplierPayment` → **`SupplierPayable`** — it is a payable *schedule* (mirror of
  `InstallmentPlan`), not a money movement. Movements are `Payment(direction: OUT)`.
- `Voucher` → **`PromoCode`** — "voucher" is overloaded in travel. Customer-portal
  "vouchers" (booking voucher, itinerary, visa copy PDFs) are generated `Document`s.
- `CustomerPayment` dropped — it is `Payment(direction: IN)`.
- Invoice vs SupplierInvoice kept **separate** (the Accountant view unifies them via
  a `type` discriminator, but separate tables are cleaner for distinct lifecycles).
- Payment unified (customer + supplier, `direction` in/out).

## 4. Typed booking details (no EAV)
The UI's `serviceDetails` is a free-form `Record<string, string|number|...>` with
inconsistent keys and fragile string-matching trackers. Replaced by **7 typed 1:1
tables** (`HajjBooking`, `UmrahBooking`, `VisaBooking`, `AirTicketBooking`,
`HotelBooking`, `ManpowerBooking`, `TourBooking`) carrying the real per-service
fields. `ServiceFieldDef` (a dynamic field-definition builder in ServicesConfig) was
**dropped** — it is the same EAV problem through the back door; add it only when a
concrete requirement appears. Per-service processing stages (Visa 4-step, Manpower
7-step BMET) → a `stageStatus` enum on the detail **plus** a `BookingStageEvent`
history table.

## 5. onDelete policy (guardrail 4)
Default **`Restrict`** — deleting a `Customer`, `User`, `Branch`, `Package`, `Agent`,
`Supplier`, `Invoice`, or `Booking` that is referenced fails; use soft delete instead.
`Cascade` is used **only** on fully-owned child rows that have no independent meaning
and only matter if the parent is hard-deleted (e.g. a draft):
`PackagePricing/Itinerary/Inclusion/Availability`, `InvoiceItem`, the 7 booking
detail tables, `Traveler`, `Document` (of a booking/traveler), `BookingCharge/StageEvent/Activity`,
`LeadActivity`, `Installment`, `TicketMessage`, `MenuItem`, `Message`, `Note`,
`RolePermission`, `UserRoleLink`, `Notification`, `CorporateClient`, `FollowUp/CallLog`
(of a lead). `Task.relatedBooking/relatedLead` use `SetNull` (a task outlives its link).
Ledger relations are `Restrict` to reinforce immutability.

## 6. Gapless numbering (guardrail B)
`Invoice.invoiceNo`, `Receipt.receiptNo`, `JournalEntry.ref` are **gapless per branch
per year** (audit). Postgres native `SEQUENCE` is deliberately NOT used — it is
non-transactional, so a rolled-back insert burns a number → gaps. Instead:
`DocumentSequence(scope, branchId, year, lastValue)` allocated with
`SELECT ... FOR UPDATE` **inside the document's transaction**, so a rollback un-consumes
the number. Invoice numbers are allocated at **issue** (not draft) so deleting a draft
never gaps. Issued invoices are **cancelled via status, never deleted**. (Allocation
helper is in the service layer.)

## 7. Partial unique indexes (guardrail D)
With soft delete, a plain unique on `email`/`code` would let a deleted row block
re-registration. So natural keys are **partial unique `WHERE deleted_at IS NULL`**
(raw SQL — Prisma can't express partial indexes): `User.email`, `Customer.email/phone`,
`Agent.agentCode/email`, `Supplier.supplierCode`, `Branch.code`, `Package.code/slug`,
`PromoCode.code`, `Booking.bookingNo`, `Invoice.invoiceNo`, `CmsPage/BlogPost/BlogCategory.slug`.
Immutable-ledger keys (`Receipt.receiptNo`, `JournalEntry.ref`, `Payment.reference`)
use plain unique (no `deletedAt`).

## 8. Journal balance (guardrail C)
Enforced in the **DB** via a deferred `CONSTRAINT TRIGGER` (raw SQL) — Σdebits = Σcredits
and ≥1 line for any `POSTED` entry; drafts may be unbalanced. Chosen over an app-only
check because accounting integrity must hold against every write path (services,
scripts, migrations, bugs, concurrency). `INITIALLY DEFERRED` lets multi-row line
inserts happen mid-transaction; the check runs at COMMIT. A service-layer pre-check
gives a friendly error first. Proven: an unbalanced posted entry is rejected at commit.

## 9. PII at rest (guardrail 2)
`Traveler.passportNo`, `Customer.nid/passportNo`, `Agent.nid`, `User.nid`,
`Document.ocrPassportNo` are **AES-256-GCM encrypted** by a Prisma `$extends`
(`src/lib/pii.ts`). Keys come from env (`PII_KEK_CURRENT_ID`, `PII_KEK_<id>`,
`PII_INDEX_KEY`) and the app **FAILS LOUDLY at import** if they're missing — it will
never silently write plaintext. A companion `*Hash` column (HMAC-SHA256 blind index)
enables exact-match lookup without decrypting (Customer NID/passport are deduped =
unique; a Traveler passport recurs across bookings = non-unique). **Rotation:** the
ciphertext embeds its `keyId` and each row stores `piiKeyId`; to rotate, add
`PII_KEK_2` + bump `PII_KEK_CURRENT_ID`, then a re-encrypt job walks
`WHERE piiKeyId < current`.

## 10. Dates & timestamps
`@db.Timestamptz(6)` (UTC) for audit/event times; app timezone Asia/Dhaka. **Calendar
dates are `@db.Date`** (a Hajj departure or passport expiry is a date, not a moment):
`departureDate`, `returnDate`, `passportExpiry`, `visaExpiry`, `dob`, `Installment.dueDate`,
`PackageAvailability.departureDate`, `Document.expiryAt`. `AirTicketBooking.departAt/returnAt`
are `Timestamptz` (a flight is a moment).

## 11. Enums
All ~40 enums are defined in the schema (never free strings): `UserRole`(12),
`BookingStatus`, `ServiceType`, `Currency`, `InvoiceStatus`, `PaymentMethod/Direction/Status`,
`InstallmentStatus`, `PayableStatus`, `RefundStatus`, `PromoType/Status`, `AccountClass`,
`AccountRole`, `NormalBalance`, `BankAccountType`, `JournalStatus`, `LeadStage`,
`LeadInterest`, `TaskPriority/Status`, `AgentTier`, `CommissionStatus`, `WalletTxnType`,
`SupplierStatus`, `BookingRequestStatus`, `ContentStatus`, `BannerType`, `MenuLocation`,
`MediaType`, `MessageChannel`, `TemplateChannel`, `TicketStatus`, `AuditSeverity`,
`CustomerType`, `Gender`, `MahramRelation`, `StageStatus`, `DocumentType/Status/OwnerType`.

## 12. RBAC (#3 from approval)
RBAC (`Role`/`Permission`/`RolePermission`/`UserRoleLink`) is the **authorization
source of truth**; `User.role` (enum) only drives UI affordances. The seed creates one
default `Role` per enum value (12) pre-loaded with a module permission matrix, so an
enum value can't drift from its role.

## 13. Composite indexes (#2 from approval)
Real query shapes, not one-column-per-field. On `Booking`: `(branchId, createdAt)`,
`(branchId, serviceType, status)`, `(agentId, createdAt)`, `(customerId, createdAt)`;
extended to Invoice/Payment/Installment/Document/Lead/Task/AuditLog for their own
screens. (Reports' 4th filter is **agent**, not status — status is record-level.)

## 14. UI ambiguities and how each was resolved
- **Brand: "BDH Travels" vs "SM Travels".** Mock leftover → Company row is
  "SM Travels International"; HQ = Dhaka (resolving the Dhaka-vs-Chattogram mock conflict).
- **`travelers` count vs `travelerList`.** Kept `Booking.travelersCount` (manual) +
  `Traveler[]` rows; the count is authoritative for pricing, the rows for details.
- **Customer/staff/agent/package all free strings in the UI.** Normalized to FKs.
- **Documents had no file model.** Added file path + metadata; OCR extract columns
  (name/passport/dob/expiry/confidence) — the fuller DMS the UI hints at (versions,
  e-signatures, watermark, share-links) is **deferred** to a later pass (approved #7).
- **Three status vocabularies + per-service stage strings.** Booking status, installment
  status, document status are distinct enums; per-service processing stage is separate.
- **Package pricing.** Class tiers (Economy/Standard/Premium/VIP), **per person** —
  NOT per-occupancy (no single/double/triple pricing in the UI). Discount is derived
  from `originalPrice`. Package `hotels`/`flights` are display config → `Json` (they
  are presentation, not transactional).
- **Per-departure-date seats** are faked in the UI → modeled properly on
  `PackageAvailability` (real `totalSeats`/`soldSeats` per date).
- **Multi-currency barely exists in the UI** (only ServicesConfig pricing rules +
  invoice/bank currency). The money rule applies it uniformly regardless.
- **Commission** appears per-booking and as monthly rollups → `AgentCommission`
  supports both (`bookingId?` + `period?`); tiers → `CommissionTier`; the 1% sub-agent
  override → `isOverride` + `Agent.parentAgentId` self-hierarchy.
- **Supplier procurement** (`BookingRequest` REQ-*, accept/decline) and KYC docs are
  first-class; `SupplierService.priceLabel` keeps the original free-text price
  alongside a numeric `price`.
- **Lead & SupportTicket have no record in the UI** (only a funnel + ticket lists) —
  designed from scratch: Lead stages New→Qualified→Proposal→Negotiation→Won/Lost.
- **Settings** are typed panels in the UI; modeled as `Setting(key,value,group)` with
  integration configs (BulkSMSBD/Wasender/bKash/Nagad/SSLCommerz/SMTP/OCR) as settings.
  Bank accounts are a distinct `BankAccount` (not chart-of-accounts nodes); `Account`
  gains explicit `accountClass` + `normalBalance` (the UI only implied them by code range).

## 15. Deferred / excluded (add when a concrete need appears)
`ServiceFieldDef` (EAV), `TaxFiling`, `SubscriptionPlan`, system-health/backup/workflow-
automation builders. These are UI screens without a transactional requirement yet.

## 16. Raw-SQL migrations (NOT in the Prisma model layer)
Because Prisma cannot express these, they live in dedicated migrations and would be
lost by `prisma db push` — see DEPLOYMENT.md "Raw SQL in migrations":
- `20260720181300_partial_unique_and_blind_indexes` — partial unique + blind-index indexes.
- `20260720181400_journal_balance_trigger` — the deferred balance constraint trigger.
