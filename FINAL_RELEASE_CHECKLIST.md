# Final Release Checklist — Enterprise Production Quality

**Date:** 2026-07-31  
**Product:** SM Travels International  
**Goal:** Finish remaining work in logical milestones — **no new modules** unless required by an existing workflow.

Companion docs: [PRODUCT_COMPLETION_AUDIT.md](./PRODUCT_COMPLETION_AUDIT.md) · [BUG_TRACKER.md](./BUG_TRACKER.md) · [UI_UX_IMPROVEMENT_PLAN.md](./UI_UX_IMPROVEMENT_PLAN.md) · [BUSINESS_WORKFLOW_GAPS.md](./BUSINESS_WORKFLOW_GAPS.md)

---

## Gate 0 — Do not claim “enterprise complete” until

- [ ] Single canonical codebase (src ↔ prod merged) with one migration history  
- [ ] Zero primary-nav screens that 404 their APIs  
- [ ] Zero SampleBadge on money-critical paths (payments, invoices, commissions)  
- [ ] Payment updates booking paid totals **or** UI stops showing divergent totals  
- [ ] OCR Apply persists traveler/booking fields staff expect  
- [ ] HR Phase 1 either **deployed** or **removed** from all prod nav/docs  
- [ ] `npm run build` green (FE + BE) on release tag  
- [ ] Smoke: lead → booking → invoice → payment → receipt on production-like DB  
- [ ] Backup/restore drill documented and run  
- [ ] SMS/WA either credentialed **or** clearly “email-only” in UI  

---

## Prioritized implementation roadmap

### Milestone A — Production integrity (P0)  
**Outcome:** Live site stops advertising broken modules.

| # | Task | Refs |
|---|------|------|
| A1 | Mount **or** remove Partners API/UI | B1, BWG-1, U1 |
| A2 | Mount **or** retarget Dashboard summary | B2, BWG-2, U1 |
| A3 | Decide deploy-only modules (HajjOps, Sales, SMS, OpsTeam): **merge with schema** or **delete UI + orphan migrations/dist** | B3, BWG-4 |
| A4 | Remove/repurpose ComingSoon entries that duplicate live modules | B13, U1 |
| A5 | Tag release only after A1–A4 on production | Gate 0 |

**Exit:** Live curl of every FE-called `/api/*` base path returns ≠ 404 (auth errors OK).

---

### Milestone B — Money path correctness (P1)  
**Outcome:** Finance numbers reconcile across booking, invoice, installment, agent.

| # | Task | Refs |
|---|------|------|
| B1 | Sync `Booking.paidAmount` on payment record/reverse/verify | B4, BWG-7 |
| B2 | Settle installments when payment targets a plan/installment | B8, BWG-8 |
| B3 | Define refund PROCESSED side-effects | B9, BWG-9 |
| B4 | Create AgentWallet on agent create; accrue commission on paid booking/payment | B5, B12, BWG-10 |
| B5 | Booking detail → Create invoice CTA; lead convert → Create booking CTA | BWG-5, BWG-6, U3 |
| B6 | Hide SampleBadge finance tabs (gateways/online/vouchers) until real | U2 |

**Exit:** Scripted E2E: convert lead → booking confirm → invoice → pay → booking paid matches invoice; agent commission row exists when `agentId` set.

---

### Milestone C — Documents & OCR honesty (P1)  
**Outcome:** OCR is either fully useful or not shown as “Validation.”

| # | Task | Refs |
|---|------|------|
| C1 | Persist `/ocr/apply` draft onto traveler/customer via existing PATCH | B6, BWG-11 |
| C2 | Wire Documents OCR Validation Apply/Approve; remove SampleBadge | B7, U3 |
| C3 | Remove or disable Versions/Signature/Sharing/Watermark/Trash nav | U1 |
| C4 | Ensure magic-byte + Vision health messaging in UI | docs alignment |

**Exit:** Upload passport → OCR → Apply updates traveler fields; no no-op Approve.

---

### Milestone D — HR productionize (existing Phase 1)  
**Outcome:** HR is real on production **or** fully absent — not ComingSoon.

| # | Task | Refs |
|---|------|------|
| D1 | Merge HR schema/migration/API/UI/employee portal from src → prod | BWG-3, HR report |
| D2 | Fix duplicate in-app HR notifications | B10 |
| D3 | Seed `hr` permissions on prod; smoke leave dual-approve | hr-smoke.ts |
| D4 | Optional: reminder cron for birthday/doc expiry (reuse notify) | BWG-16 |

**Exit:** `/erp/hr` and `/employee` work on production; `/api/hr/dashboard` ≠ 404.

---

### Milestone E — Portal & ops shrink-to-fit (P2)  
**Outcome:** Every portal tab hits a live API.

| # | Task | Refs |
|---|------|------|
| E1 | Accountant: deep-link ERP finance or wire ledgers; remove tax mock | BWG-12, U4 |
| E2 | Supplier/Staff: remove or wire support/messages SampleBadge tabs | BWG-13, U2 |
| E3 | Ops: keep Tasks/Announcements/Audit; hide calendar/chat/workflow SampleBadge | U2 |
| E4 | CMS scheduled publish job or on-read publish | B16, BWG-14 |
| E5 | Invoice OVERDUE transition job | B15, BWG-15 |

**Exit:** No SampleBadge in primary portal nav; ops nav matches live endpoints.

---

### Milestone F — Communications & reports polish (P2)  
**Outcome:** Outbound and reports are enterprise-credible.

| # | Task | Refs |
|---|------|------|
| F1 | Production SMS/WA credentials **or** UI lock to email-only with status chips | BWG-18, U7 |
| F2 | Remove fake saved/scheduled reports; keep real export formats | B19, BWG-17 |
| F3 | Reports BI: hide SampleBadge builders | U1 |
| F4 | Booking status transition guards (allowlist) | B11 |

**Exit:** Send path never silently “succeeds” when channel cancelled; exports remain.

---

### Milestone G — Public site & i18n polish (P3)  
**Outcome:** Compliance and localization complete.

| # | Task | Refs |
|---|------|------|
| G1 | Auth/footer legal + social real links; newsletter remove/wire | B14, B17, B18, U5 |
| G2 | Contact map real or removed | U5 |
| G3 | ERP + HR + employee bn i18n namespaces | U6 |
| G4 | Deploy design-system package when merging src UI | U6 |
| G5 | Package editor: no SAMPLE_* defaults | U3 |

**Exit:** No `href="#"` on legal/social; ERP critical screens bilingual.

---

### Milestone H — Release hardening  
**Outcome:** Operable enterprise deployment.

| # | Task |
|---|------|
| H1 | Unified CI: `prisma migrate`, `tsc`, FE build, hr-smoke + booking-finance smoke |
| H2 | Backup/restore verification on prod volume |
| H3 | Update KNOWN_LIMITATIONS / GO_LIVE docs to match code (retire stale claims) |
| H4 | Production env checklist: SMTP, Gemini, Vision ADC, JWT, CORS, UPLOAD_DIR |
| H5 | Final PRODUCT_COMPLETION_AUDIT score ≥ **90** on core path; SampleBadge count = 0 on money paths |

---

## Suggested sequencing (calendar-agnostic)

```text
A (integrity) → B (money) → C (OCR) → D (HR deploy)
        ↘ E (portals/ops) → F (comms/reports) → G (polish) → H (harden)
```

Do **not** start payment gateways, payroll, chat inbox, or biometric attendance until Gates A–D pass.

---

## Sign-off template

| Role | Name | Date | Milestone signed |
|------|------|------|------------------|
| Product owner | | | |
| Tech lead | | | |
| Ops / deploy | | | |

**Enterprise production quality declared when:** Gate 0 checklist is fully checked and Milestones A–D + H are complete.
