# Business Workflow Gaps — SM Travels International

**Date:** 2026-07-31  
**Rule:** No new modules unless required to complete an existing workflow. Prefer wiring existing APIs/UI.

Each gap: **where the flow starts → where it stops → what “done” looks like**.

---

## P0 — Production false paths

### BWG-1 · Partners admin
- **Start:** ERP → Partners  
- **Stops:** FE calls `/api/partners` → **404** (router unmounted)  
- **Done:** Mount `partnersRouter` **or** remove Partners from nav/routes  

### BWG-2 · Executive dashboard summary
- **Start:** `/erp` SuperAdminDashboard loads summary  
- **Stops:** `/api/dashboard/summary` → **404**  
- **Done:** Mount dashboard route **or** rebuild summary from existing report/booking hooks  

### BWG-3 · HR on production
- **Start:** Staff open `/erp/hr` or employee opens `/employee`  
- **Stops:** ComingSoon / no route; `/api/hr/*` → **404**  
- **Done:** Deploy src HR migration + API + UI + employee portal (existing Phase 1 — not a new module)

### BWG-4 · Tree merge
- **Start:** “Ship next release”  
- **Stops:** src has HR; prod has hajj-ops/sales/sms/partners without safe schema alignment  
- **Done:** Single release branch; decide keep/drop deploy-only modules; one migration set  

---

## P1 — Revenue & ops pipelines that stop mid-flow

### BWG-5 · Lead convert → booking
- **Start:** CRM Convert Lead  
- **Stops:** Customer created + lead WON; **no booking**  
- **Done:** CTA/prefill booking wizard with `customerId` (optional auto-draft) using existing booking API  

### BWG-6 · Booking → invoice
- **Start:** Confirmed booking with charges  
- **Stops:** Staff must manually create invoice and re-key  
- **Done:** “Create invoice from booking” using existing invoice create + `bookingId`  

### BWG-7 · Payment → booking paid total
- **Start:** Record/verify payment on invoice  
- **Stops:** Invoice `paidAmount` updates; **`Booking.paidAmount` unchanged**  
- **Done:** Sync booking paid (or stop displaying booking paid as truth)  

### BWG-8 · Payment → installment settlement
- **Start:** Customer/staff pay against installment plan  
- **Stops:** Plan rows never move to PAID  
- **Done:** On payment (optional `installmentId`), update installment paidAmount/status  

### BWG-9 · Refund processed → money
- **Start:** Mark refund PROCESSED  
- **Stops:** Status only; no ledger/payment OUT / invoice rollback  
- **Done:** Define accounting side-effect on PROCESSED (payment reverse or OUT + invoice adjust)  

### BWG-10 · Agent commission / wallet
- **Start:** Agent-sourced booking paid  
- **Stops:** No commission row; wallet never credited; portal read-only  
- **Done:** Accrual rule on payment verify/confirm + ensure AgentWallet on agent create (schema already exists — **not a new module**)  

### BWG-11 · OCR extract → entity fields
- **Start:** Upload passport / run OCR / Apply  
- **Stops:** Draft JSON or Document OCR columns; traveler/booking fields not written; Validation UI no-op  
- **Done:** Apply draft via existing PATCH APIs; wire Documents Validation Approve  

---

## P2 — Portal, CMS, notifications, reports

### BWG-12 · Accountant portal depth
- **Start:** Accountant opens Income/Journal/Tax tabs  
- **Stops:** Most screens mock; only dashboard/me live  
- **Done:** Either wire to finance APIs **or** deep-link into ERP accounts/invoices (shrink portal)  

### BWG-13 · Supplier / staff support threads
- **Start:** Reply in support UI  
- **Stops:** SampleBadge / unbound send  
- **Done:** Use existing ticket APIs or remove tabs  

### BWG-14 · CMS scheduled publish
- **Start:** Set page SCHEDULED + publishedAt  
- **Stops:** Never flips to PUBLISHED  
- **Done:** Worker/cron or publish-on-read check  

### BWG-15 · Invoice OVERDUE
- **Start:** SENT invoice past dueDate  
- **Stops:** Status stays SENT; reports undercount overdue  
- **Done:** Nightly job or on-read transition  

### BWG-16 · HR reminders
- **Start:** Birthday / confirmation / doc expiry approaching  
- **Stops:** Event allowlist + dashboard widgets only; no scheduled notify  
- **Done:** Cron using existing notification enqueue (after HR deployed)  

### BWG-17 · Custom / scheduled reports
- **Start:** Reports “saved schedules” / BI builder  
- **Stops:** Hardcoded lists / SampleBadge  
- **Done:** Remove from nav **or** persist schedules against existing export endpoints  

### BWG-18 · SMS / WhatsApp delivery
- **Start:** Send from Communications  
- **Stops:** Outbound cancelled without BulkSMSBD / Wasender credentials  
- **Done:** Production credentials + health UX (plumbing exists)  

---

## P3 — Intentional / labeled deferrals (track, don’t expand)

| ID | Gap | Disposition |
|----|-----|-------------|
| BWG-19 | Payment gateways (bKash/Nagad/SSL) | Product non-goal until integrations phase; keep disabled |
| BWG-20 | Staff chat inbox | Explicit V2 deferral in Communications UI |
| BWG-21 | Payroll / biometric attendance | HR Phase 1 non-goals |
| BWG-22 | Airlines/Countries/Cities master data CRUD | Documented limitation; not blocking core path |

---

## Ideal happy path (target state)

```text
Public intake → Lead
  → Convert → Customer
    → Booking (draft → confirm)
      → Documents + OCR apply to traveler
      → Invoice from booking
        → Payment (+ installment settle)
          → Receipt + email
          → Booking.paidAmount sync
          → Agent commission/wallet (if agentId)
      → Status → COMPLETED (guarded transitions)
CRM/Ops tasks & notifications throughout
HR (deployed): leave dual approve; attendance; employee portal
```

Anything outside this path that is still in primary nav should be **removed or labeled** until wired.
