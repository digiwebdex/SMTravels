# Milestone B — Money Path Completion Report

**Branch:** `feature/money-path`  
**Base:** `feature/production-integrity` (Sprint A untouched)  
**Date:** 2026-07-31  
**Scope:** Complete the existing revenue workflow only (no gateways, payroll, chat, or new modules).

---

## Completed items

| Task | Status | Notes |
|------|--------|-------|
| 1. Booking payment synchronization | Done | Shared `finance.effects` syncs Invoice + Booking `paidAmount` / status on every pay / reverse / refund / NPSB verify |
| 2. Installment payments | Done | FIFO allocate / LIFO unwind; down payment materialized as installment #1; plan `completed` when all paid |
| 3. Receipt integrity | Done | Receipt still created in-tx; Income ledger row posted; printable/searchable via Payments + Receipts UI (live API) |
| 4. Refund workflow | Done | `PROCESSED` creates OUT payment + receipt, unwinds invoice/booking/installments/commission |
| 5. Agent commission | Done | Accrue PENDING on agent booking payment; settle PAID + wallet CREDIT when invoice fully paid |
| 6. Agent wallet | Done | Wallet created on agent create; settle/unsettle posts CREDIT/DEBIT; balance derived from transactions |
| 7. Finance reports | Verified | Existing report services continue to sum invoice/booking/commission/journal from DB (no fake KPIs on money screens) |
| 8. Frontend payment screens | Done | Booking CTAs wired; Invoices receipts/history/refunds/online; Accounts installments + customer payments use APIs |
| 9. Business validation | Done | Scenarios 1–4 passed via `milestone-b-money-smoke.ts` |

---

## Business scenarios

Script: `backend/src/services/milestone-b-money-smoke.ts`

| Scenario | Result |
|----------|--------|
| 1. Booking → Invoice → Single Payment → Receipt → Complete | PASS — invoice PAID, booking `paidAmount` synced, receipt + income posted |
| 2. Booking → Invoice → 3 Installments → Paid | PASS — plan `completed`, all installments PAID, booking fully paid |
| 3. Booking → Invoice → Refund → Ledger Updated | PASS — OUT payment + receipt; invoice/booking paid reduced; status PARTIAL |
| 4. Booking → Agent Commission → Settlement → Wallet Updated | PASS — commission PAID; wallet balance += rate × gross; CREDIT txn present |

---

## Database validation

- Payment create updates `Invoice.paidAmount` + `Invoice.status` and `Booking.paidAmount` (and PENDING/PROCESSING → CONFIRMED when fully paid).
- Installment rows `paidAmount` / `status` move with payments; plan status flips to `completed`.
- Refund PROCESSED writes OUT `Payment` + `Receipt` and applies negative delta aggregates.
- `Income` CONFIRMED rows posted for collections; voided (soft-deleted) on payment reverse.
- `AgentCommission` + `WalletTransaction` written only from real settlement math (`agent.commissionRate` or `CommissionTier.rate`).

---

## Screens updated

- `frontend/src/app/erp/bookings/BookingDetail.tsx` — Generate Invoice / Record Payment live
- `frontend/src/app/erp/InvoicesModule.tsx` — Receipts, Payment History, Online Payments, Refunds (live totals/actions)
- `frontend/src/app/erp/AccountsModule.tsx` — Installments + Customer Payments (live)
- `frontend/src/app/hooks/finance.ts` — `useCreateInvoiceFromBooking`, broader cache invalidation
- `frontend/src/app/hooks/bookings.ts` — maps installment schedule + linked invoice

---

## APIs verified

| Method | Path | Behavior |
|--------|------|----------|
| POST | `/payments` | Receipt + sync booking/invoice/installments/income/commission |
| POST | `/payments/:id/reverse` | Mirror OUT + unwind aggregates |
| POST | `/payments/:id/verify` | NPSB approve uses same effects |
| PATCH | `/refunds/:id/status` | PROCESSED full side-effects |
| POST | `/installment-plans` | Down payment as installment #1 |
| POST | `/invoices/from-booking/:bookingId` | Create + issue invoice from booking |
| GET | `/bookings/:id` | Includes `invoices[]` + `installments[]` |

---

## Known limitations

- Payment gateway integrations (bKash/Nagad/SSLCommerz charge flows) intentionally out of scope.
- Auto double-entry journal from payments not added; cash trail is Payment + Receipt + Income ledger.
- Some Invoice sub-views (aging mock, vouchers, collection builder helpers) still contain legacy sample scaffolding; money-critical lists/KPIs use backend totals.
- Reports BI module still has mock demo charts (pre-existing); core ReportsModule remains DB-backed.
- Existing agents created before this sprint without wallets get a wallet lazily on first commission settlement.

---

## Files changed (primary)

**Backend**

- `backend/src/services/finance.effects.ts` (new)
- `backend/src/services/payment.service.ts`
- `backend/src/services/paymentProof.service.ts`
- `backend/src/services/invoice.service.ts`
- `backend/src/services/agent.admin.service.ts`
- `backend/src/services/booking.service.ts`
- `backend/src/services/milestone-b-money-smoke.ts` (new)
- `backend/src/contracts/booking.contract.ts`
- `backend/src/controllers/invoices.controller.ts`
- `backend/src/routes/invoices.route.ts`

**Frontend**

- `frontend/src/app/erp/bookings/BookingDetail.tsx`
- `frontend/src/app/erp/bookings/BookingsModule.tsx`
- `frontend/src/app/erp/InvoicesModule.tsx`
- `frontend/src/app/erp/AccountsModule.tsx`
- `frontend/src/app/hooks/finance.ts`
- `frontend/src/app/hooks/bookings.ts`

**Docs**

- `MILESTONE_B_MONEY_PATH_REPORT.md` (this file)

---

## Build status

| Package | Command | Result |
|---------|---------|--------|
| Backend | `npm run build` | PASS |
| Frontend | `npm run build` | PASS |

---

## Smoke test checklist

| Area | Result |
|------|--------|
| Customer | Created in smoke |
| Booking | Created + paidAmount sync |
| Invoice | from-booking + issue |
| Payment | record + installment FIFO |
| Receipt | Generated on payment / refund OUT |
| Ledger | Income posted / reverse void |
| Reports | Unchanged DB aggregations |
| Agent | Commission accrue+settle |
| Commission | Status PENDING→PAID |
| Wallet | Balance + CREDIT history |
| Exports | Not modified this sprint |

---

## Stop

Milestone B complete on `feature/money-path`.  
**Do not start Milestone C** until approved.  
**Do not merge** until approved.
