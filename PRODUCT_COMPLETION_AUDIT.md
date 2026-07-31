# Product Completion Audit — SM Travels International

**Date:** 2026-07-31  
**Scope:** Full product surface (backend APIs, ERP UI, portals, public website, integrations)  
**Primary source tree:** `/root/smtravels-src` (feature-complete baseline including HR)  
**Live deploy tree:** `/var/www/SMTravels` (production; behind on HR; ahead on some unmounted modules)  
**Method:** Code review of routes, services, frontend modules, portals, and live HTTP checks — **no new features built in this phase**.

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ Complete | Implemented end-to-end against schema + mounted API + usable UI |
| 🟡 Partial | Usable core path; secondary screens mock, unwired, or env-gated |
| ❌ Missing | Claimed in nav/docs or required by workflow but not implemented |
| 🐞 Bug | Incorrect or false-live behavior in code/production |
| ⚠ UX | Usable but honesty, i18n, empty-state, or clarity issues |

### Overall readiness

| Lens | Score | Notes |
|------|------:|-------|
| Core revenue path (CRM → booking → invoice → payment → receipt) | **82 / 100** | Manual staff path works |
| Enterprise production quality | **68 / 100** | Tree drift, SampleBadge surfaces, money sync gaps |
| Public website | **85 / 100** | Strong; CMS hybrid; some static gaps |
| Portals | **72 / 100** | Customer strongest; accountant weakest |
| HR (src only) | **88 / 100** | Phase 1 complete in src; **not on prod** |
| Integrations (Gemini / Vision / SMTP / SMS / WA) | **70 / 100** | Plumbing complete; SMS/WA env-off |

**Critical finding:** `/root/smtravels-src` and `/var/www/SMTravels` have **diverged**. Live production returns **404** for `/api/partners`, `/api/dashboard/summary`, and `/api/hr/*` while frontend/nav still expose related surfaces.

---

## 1. Platform & architecture

| Feature | Status | Evidence |
|---------|--------|----------|
| Single-company + `branchId` scoping | ✅ | `branchWhere()`, AuthCtx; no `tenantId` |
| Auth (login / refresh / OTP reset) | ✅ | `auth.route.ts` |
| RBAC module matrix | ✅ | Permissions + `requirePermission` |
| Soft delete + audit patterns | ✅ | Business entities; `ActivityLog` |
| Source ↔ deploy parity | 🐞 | HR only in src; partners/dashboard/hajj-ops drift on deploy |
| Payment gateways (bKash/Nagad/SSL) | ❌ | Explicitly disabled in Settings UI + comments |
| Multi-tenant SaaS | ❌ | Out of product scope (intentional) |

---

## 2. Public website

| Feature | Status | Notes |
|---------|--------|-------|
| Home (packages/blog/testimonials APIs + i18n) | 🟡 | Hybrid CMS + hardcoded service sections |
| About / service pages | 🟡 | Service pages from static `lib/data` |
| Packages / Blog / FAQ / Gallery | ✅ | Public CMS with fallbacks |
| Contact form + booking request | ✅ | `public.route.ts` intake → CRM lead |
| Auth pages | ✅ | Login / register flows |
| CMS pages (privacy, terms, refund, career…) | ✅ src / ❌ deploy | `CmsPages.tsx` in src only |
| Contact map / branches | ⚠ | Map placeholder; branches partly hardcoded |
| Newsletter / social `href="#"` | ⚠ | Non-functional footer controls |
| i18n (bn default + en) | ✅ | Public namespaces solid |

---

## 3. CRM

| Feature | Status | Notes |
|---------|--------|-------|
| Leads CRUD + stage + notes/calls/tasks/followups | ✅ | `lead.service.ts` + CrmModule |
| Customers CRUD + detail | ✅ | |
| Corporate clients | ✅ | |
| Lead → Customer convert | 🟡 | Creates customer + WON; **no booking** |
| OCR in customer form | 🟡 | `OcrInFlow` present; apply path partial |
| AI insight cards | ⚠ | Mostly static tips, not Gemini |

---

## 4. Bookings & catalog

| Feature | Status | Notes |
|---------|--------|-------|
| Booking list / wizard / detail | ✅ | Draft → confirm → bookingNo |
| Service-typed details (Hajj/Umrah/Visa/…) | ✅ | Detail upserts on confirm |
| Travelers / documents / activity tabs | ✅ | |
| Document OCR from booking | 🟡 | Run OCR works; apply-to-entity partial |
| Status lifecycle enforcement | 🟡 | Free-form status patch; weak machine |
| Booking → invoice CTA | ❌ | Manual invoice create only |
| `Booking.paidAmount` after payment | 🐞 | Payment updates invoice only |
| Packages CRUD (pricing, itinerary, calendar) | ✅ | |
| Package form SAMPLE defaults | ⚠ | Risk of shipping sample content |
| Services catalog | ✅ | No delete route (minor) |

---

## 5. Finance

| Feature | Status | Notes |
|---------|--------|-------|
| Chart of accounts / bank accounts | ✅ | |
| Journal create / post / reverse | ✅ | |
| Income / expense entries | ✅ | |
| Invoices issue / cancel | ✅ | |
| Payments record / verify / reverse + receipt print | ✅ | NPSB proof path |
| Refunds | 🟡 | Status change without money movement when PROCESSED |
| Installment plans | 🟡 | Create/list only; payment does not settle installments |
| Money transfer / gateway screens | 🟡 / ❌ | SampleBadge / disabled |
| Online payments / vouchers UI | 🟡 | SampleBadge mocks |
| Agent commission accrual | ❌ | Schema + reads; no write on pay |
| Agent wallet ledger writes | ❌ | Portal READ-ONLY; createAgent skips wallet |

---

## 6. Documents, OCR, AI

| Feature | Status | Notes |
|---------|--------|-------|
| Document upload + magic-byte check | ✅ | `uploads.ts` |
| `POST /documents/:id/ocr` | ✅ | Persists OCR fields on Document |
| `POST /ocr/:kind` ephemeral parse | ✅ | system/ocr routes |
| `POST /ocr/apply` | 🟡 | Returns form **draft** only — no DB write |
| Documents module OCR Validation UI | 🐞 | SampleBadge; `onApply={() => {}}`; Approve unbound |
| Versions / signature / sharing / watermark / trash | ❌ | Nav present; mock data |
| Gemini chat + ERP AI writers | 🟡 | Complete when keyed; env/quota gated |
| AI insight cards in ERP | ⚠ | Often decorative static copy |
| Google Vision health | ✅ | `/system/google-vision/status` |

---

## 7. CMS (admin)

| Feature | Status | Notes |
|---------|--------|-------|
| Pages / blog / FAQs / testimonials / menus / banners / media | ✅ | |
| Categories | 🟡 | Local state |
| Web settings persistence | 🟡 | Form UI weak evidence of save |
| SCHEDULED → PUBLISHED auto job | ❌ | No scheduler |

---

## 8. Communications & notifications

| Feature | Status | Notes |
|---------|--------|-------|
| Templates CRUD + send + bulk + outbound queue | ✅ | `communications.service.ts` |
| In-app notifications | ✅ | |
| Outbound worker (15s) | ✅ | `notificationWorker.ts` in-process |
| SMTP email | 🟡 | Works when configured; else log-only |
| SMS / WhatsApp | 🟡 | Plumbing; cancelled without credentials |
| Staff chat inbox | ❌ | Explicitly deferred V2 in UI |
| HR reminder cron (birthday/doc expiry) | ❌ | Event strings only |

---

## 9. Operations & reports

| Feature | Status | Notes |
|---------|--------|-------|
| Tasks / announcements / audit list | ✅ | `ops.service.ts` |
| Calendar / reminders / chat / workflow UI | 🟡 | SampleBadge |
| Reports overview / sales / bookings / agents / P&L / BS / CF / export | ✅ | |
| Custom / scheduled saved reports | 🟡 | Hardcoded `SAVED_REPORTS` |
| Reports BI staff KPI / builder | 🟡 | SampleBadge |
| Deploy HajjOps / Ops Team / Sales / SMS modules | 🟡 | UI present on deploy; APIs unmounted or schema-orphaned |

---

## 10. Settings

| Feature | Status | Notes |
|---------|--------|-------|
| Users / roles / branches / agents / suppliers | ✅ | |
| Integrations status + test | ✅ | |
| Payment gateway toggles | ❌ | Disabled “coming soon” |
| General / backup / health panels | 🟡 | SampleBadge |
| Permissions matrix persistence | 🟡 | Local INIT_MATRIX risk |

---

## 11. HR (Phase 1)

| Feature | Status | Notes |
|---------|--------|-------|
| Org / employees / docs / leave / holidays / attendance / reports | ✅ | In `/root/smtravels-src` |
| Employee portal `/employee` | ✅ | src only |
| Leave dual approval + notifications | ✅ | src; optional manager skip |
| HR on production | ❌ / 🐞 | Live `/api/hr/*` = **404**; ComingSoon UI |
| Payroll | ❌ | Phase 1 non-goal |
| Reminder scheduler | ❌ | |

---

## 12. Portals

| Portal | Status | Notes |
|--------|--------|-------|
| Customer `/portal` | 🟡→✅ | Core live; profile read-only; deploy still has more SampleBadge |
| Agent `/agent` | 🟡 | Live reads; convert disabled; wallet never accrues |
| Supplier `/supplier` | 🟡 | Core live; reports/messages/support SampleBadge |
| Staff `/staff` | 🟡 | Tasks/bookings live; support mock |
| Accountant `/accountant` | 🟡 | Dashboard live; most ledgers/tax mock |
| Employee `/employee` | ✅ src / ❌ deploy | |

---

## 13. Deploy-only vs src-only matrix

| Capability | smtravels-src | Production deploy |
|------------|:-------------:|:-----------------:|
| HR + Employee portal | ✅ | ❌ ComingSoon / 404 |
| Design system package | ✅ | ❌ |
| CmsPages public routes | ✅ | ❌ |
| Partners UI | — | 🟡 UI → API 404 |
| Dashboard summary hook | — | 🐞 UI → API 404 |
| HajjOps / Sales / SMS / OpsTeam UI | — | 🟡 / schema drift |

---

## 14. Companion documents

| Document | Purpose |
|----------|---------|
| [BUG_TRACKER.md](./BUG_TRACKER.md) | Prioritized defects with evidence |
| [UI_UX_IMPROVEMENT_PLAN.md](./UI_UX_IMPROVEMENT_PLAN.md) | UX honesty & polish (no redesign) |
| [BUSINESS_WORKFLOW_GAPS.md](./BUSINESS_WORKFLOW_GAPS.md) | Mid-pipeline workflow stops |
| [FINAL_RELEASE_CHECKLIST.md](./FINAL_RELEASE_CHECKLIST.md) | Gate to enterprise production quality |

**Roadmap:** see § prioritized milestones at end of `FINAL_RELEASE_CHECKLIST.md` and the completion canvas.
