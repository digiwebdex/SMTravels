# Bug Tracker — SM Travels International

**Date:** 2026-07-31  
**Status values:** Open · Confirmed · Won’t fix (product scope)  
**Severity:** P0 Critical · P1 High · P2 Medium · P3 Low  

Live checks (2026-07-31): `GET /api/health` → 200; `GET /api/partners` → **404**; `GET /api/dashboard/summary` → **404**; `GET /api/hr/dashboard` → **404**.

---

## P0 — Critical (false-live / deploy integrity)

| ID | Title | Status | Evidence | Impact |
|----|-------|--------|----------|--------|
| **B1** | Partners module calls unmounted API | Open | FE `hooks/partners.ts` → `/api/partners`; `partners.route.ts` exists on deploy but **not** in `routes/index.ts`; live 404 | Partners ERP screen broken in production |
| **B2** | Dashboard summary API unmounted | Open | FE `useDashboardSummary` → `/dashboard/summary`; `dashboard.route.ts` unmounted; live 404 | Executive dashboard KPIs fail / empty |
| **B3** | Source tree ↔ production tree divergence | Open | src: HR mounted + migration; prod: no HR, extra hajj/sales/sms migrations & UI, orphan dist artifacts | Cannot promote either tree safely; features claim false |

---

## P1 — High (money, OCR honesty, revenue ops)

| ID | Title | Status | Evidence | Impact |
|----|-------|--------|----------|--------|
| **B4** | Payment does not update `Booking.paidAmount` | Open | `payment.service.ts` `recordPayment` updates invoice only | Booking revenue / portal paid totals drift from invoices |
| **B5** | Agent commission & wallet never accrue | Open | No `agentCommission.create` / `walletTransaction.create` outside seed; portal documents READ-ONLY; `createAgent` skips wallet | Agent earnings UI shows seed-only / zero forever |
| **B6** | `POST /ocr/apply` does not persist entities | Open | `ocr.controller.ts` returns `{ draft: mapOcrToFormDraft(...) }` only | Claimed autofill does not write traveler/booking |
| **B7** | Documents OCR Validation Approve/Apply no-ops | Open | `DocumentsModule.tsx` `onApply={() => {}}`; Approve unbound; SampleBadge | Staff think OCR is approved when nothing happens |
| **B8** | Installment plans not settled by payments | Open | `createInstallmentPlan` only; payment services never update installment `paidAmount`/status | Due management lies after pay |
| **B9** | Refund PROCESSED is status-only | Open | `updateRefundStatus` sets status; no OUT payment / invoice paid rollback | Finance books incorrect after “processed” refund |

---

## P2 — Medium

| ID | Title | Status | Evidence | Impact |
|----|-------|--------|----------|--------|
| **B10** | HR double in-app notification | Open (src) | `hr.notification.ts`: `inApp()` + outbound IN_APP; worker creates second Notification | Duplicate bell items |
| **B11** | Booking status transitions unconstrained | Open | `updateBooking` accepts arbitrary status except locks on CANCELLED/COMPLETED | Invalid lifecycle states possible |
| **B12** | Create agent without AgentWallet row | Open | `agent.admin.service.ts` `createAgent` | Wallet GET may 404/empty for new agents |
| **B13** | Prod ComingSoon for OCR/HR/AI while APIs exist elsewhere | Open | `routes.tsx` ComingSoon vs live `/documents`, `/ocr`, `/ai` | Confusing IA; duplicate dead nav |
| **B14** | Auth legal links `href="#"` | Open | `Auth.tsx` | Broken compliance links |
| **B15** | Invoice OVERDUE never auto-flipped | Open | Enum used in reports; no cron | Overdue reports undercount |
| **B16** | CMS SCHEDULED never auto-publishes | Open | Status exists; no job | Scheduled content stuck |

---

## P3 — Low

| ID | Title | Status | Evidence | Impact |
|----|-------|--------|----------|--------|
| **B17** | Footer newsletter non-functional | Open | `Layout.tsx` input, no API | Dead control |
| **B18** | Social icons `href="#"` | Open | Layout / Contact | Dead links |
| **B19** | Saved/scheduled reports are constants | Open | `ReportsModule.tsx` `SAVED_REPORTS` | Decorative |
| **B20** | Staff portal nav hardcoded badge | Open | `StaffPortal.tsx` `badge: 4` | Fake urgency |
| **B21** | Deploy WhatsApp env key naming risk | Open | `.env.example` `WASENDER_API_KEY` vs code `WASENDER_API_TOKEN` | Misconfig on enable |
| **B22** | Stale PRODUCTION_AUDIT MIME claim | Open | Audit says MIME-only; code has magic bytes | Doc distrust |

---

## Triage rules (for implementation phase)

1. Fix **B1–B3** before any feature claim about Partners / Dashboard / HR on production.  
2. Fix **B4–B9** before calling finance “enterprise complete.”  
3. Do **not** add new modules to clear this list — mount, wire, or **remove** false UI.  
4. Prefer removing SampleBadge screens over shipping placeholders.
