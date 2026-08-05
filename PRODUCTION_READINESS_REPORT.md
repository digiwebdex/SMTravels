# SM Travels International — Production Readiness Report

**Date:** 2026-07-30  
**Scope:** Launch cut (Phases 1–7)  
**Deploy:** `/var/www/SMTravels` · API `smtravels-api.service` · `https://smtravelsinternational.com`

---

## 1. Features Completed

### Phase 1 — Notification Center
- Unified notification service (Email / WhatsApp / SMS / In-App)
- DB-backed `OutboundNotification` queue with worker (15s), retry + schedule
- Wasender / BulkSMSBD feature-flagged (log-only until env credentials)
- Event helpers: booking created/updated/cancelled, visa statuses, passport ready, payment, invoice, OTP/password reset, welcome, registration
- ERP Communications UI: Dashboard / Queue / Send / Templates / Bulk / History (no mock inbox)

### Phase 2 — Customer Portal
- Visa Status, Downloads hub, AI Assistant, Notifications, existing bookings/payments/documents/support

### Phase 3 — Agent Portal
- Statements (CSV), Documents, Payments, Notifications, Support (live), mock SampleBadge removed

### Phase 4 — Website & CMS
- Admin CRUD: pages, menus, banners, media
- Public: pages/menus/banners
- Legal & info routes: privacy, terms, refund, career, branches, testimonials, hotels, transport
- CmsModule SampleBadge removed; pages wired to API

### Phase 5 — OCR & AI
- Multi-kind OCR parsers: passport, visa, NID, flight ticket, hotel voucher, medical certificate
- `POST /ocr/:kind`, `POST /ocr/apply` autofill drafts
- ERP Gemini routes: customer/booking summary, package recommend, email/WA/SMS writers, lead/revenue/expense analysis, insights, monthly summary

### Phase 6 — Reporting
- Customers + notifications reports
- Export formats: CSV, Excel (xlsx), PDF
- Service reports (visa/hajj/umrah) via export kinds

### Phase 7
- Dead mock SampleBadge removed from Communications, CMS, Operations
- Migration applied; frontend + backend deployed; smoke tests run

### Unchanged (guardrails)
- Google Cloud Vision / Gemini / Gmail SMTP core services not recreated

---

## 2. Files Created (selected)

| Path |
|------|
| `backend/src/services/whatsapp.service.ts` |
| `backend/src/services/sms.service.ts` |
| `backend/src/services/unifiedNotification.service.ts` |
| `backend/src/services/notificationWorker.ts` |
| `backend/src/controllers/ai.erp.controller.ts` |
| `backend/src/controllers/ocr.controller.ts` |
| `backend/prisma/migrations/20260730120000_outbound_notifications/` |
| `frontend/src/app/pages/CmsPages.tsx` |
| `PRODUCTION_READINESS_REPORT.md` |

Plus CMS service/route extensions and portal helpers from launch work.

---

## 3. Files Modified (selected)

- `backend/prisma/schema.prisma`, `prisma/seed.ts`
- `backend/src/services/notification.service.ts`, `booking.service.ts`, `googleVision.service.ts`, `report.service.ts`, `portal.service.ts`
- `backend/src/main.ts`, `routes/notification.route.ts`, `ai.route.ts`, `system.route.ts`, `reports.route.ts`, `cms*.ts`, `portal.route.ts`
- `backend/src/controllers/reports.controller.ts`
- `frontend/src/app/erp/CommunicationsModule.tsx`, `CmsModule.tsx`, `OperationsModule.tsx`
- `frontend/src/app/portal/CustomerPortal.tsx`, `AgentPortal.tsx`
- `frontend/src/app/hooks/communications.ts`, `cms.ts`, `publicContent.ts`
- `frontend/src/app/routes.tsx`
- `backend/package.json` (exceljs, pdfkit)

---

## 4. Database Changes

Migration `20260730120000_outbound_notifications`:
- Enums `OutboundChannel`, `OutboundStatus`
- Table `OutboundNotification` (+ indexes)
- Index `MessageTemplate_event_channel_idx`

Seed: system `MessageTemplate` rows for booking/payment/visa/passport/welcome/invoice/OTP.

---

## 5. API Endpoints Added

| Method | Path |
|--------|------|
| GET | `/api/notifications/dashboard` |
| GET | `/api/notifications/outbound` |
| POST | `/api/notifications/outbound` |
| POST | `/api/notifications/outbound/:id/retry` |
| GET | `/api/portal/visas` |
| GET | `/api/portal/downloads` |
| GET/POST/PATCH/DELETE | `/api/cms/pages`, `/menus`, `/banners`, `/media` |
| GET | `/api/public/pages/:slug`, `/public/menus/:location`, `/public/banners` |
| POST | `/api/ocr/:kind`, `/api/ocr/apply` |
| POST | `/api/ai/customer-summary`, `booking-summary`, `package-recommend`, `email-writer`, `whatsapp-writer`, `sms-writer`, `lead-analysis`, `revenue-analysis`, `expense-analysis`, `insights`, `monthly-summary` |
| GET | `/api/reports/customers`, `/reports/notifications` |
| GET | `/api/reports/export?format=csv\|xlsx\|pdf` |

---

## 6. Remaining Bugs / Gaps

- Gemini generate may still return **429** if prepaid credits are depleted (client init reports connected).
- SMS / WhatsApp remain **log-only** until `BULKSMSBD_*` / `WASENDER_*` are set in `.env.production`.
- Staff / Supplier / Accountant portals still contain SampleBadge on secondary screens (out of primary ERP nav).
- Operations calendar/chat panes may still be thin vs full wishlist.
- Report PDF is tabular text (not pixel-perfect branded layout).
- Frontend main bundle still >500KB (lazy routes already used for ERP modules).

---

## 7. Performance Improvements

- Outbound worker uses batch claim (25) + unref’d interval (non-blocking shutdown).
- Report Excel/PDF generated on demand (no persistent temp files).
- CMS public page fetch by slug (indexed).

---

## 8. Security Improvements

- Notification queue endpoints gated by `crm`/`settings` permissions.
- OCR apply / kind routes require `documents.manage`.
- Secrets remain env-only; worker never logs OTP bodies.
- Existing JWT / branch scoping preserved.

---

## 9. Test Results (2026-07-30 production)

| Test | Result |
|------|--------|
| `GET /api/health` | OK |
| Startup Vision / Gemini / SMTP | All connected |
| Notification worker | Started |
| Enqueue welcome EMAIL+IN_APP | IDs created |
| Notification dashboard flags | email on, sms/wa off |
| `GET /reports/customers` | 200 |
| Export CSV / XLSX / PDF | 200 |
| `GET /public/pages/privacy` | Seeded CMS content |
| `GET /cms/pages` | 200 |

---

## 10. Production Checklist

- [x] Backend built & deployed to `/var/www/SMTravels/backend`
- [x] Frontend built & deployed to `/var/www/SMTravels/frontend/dist`
- [x] Prisma migrate deploy (`OutboundNotification`)
- [x] Structural seed (templates + CMS pages)
- [x] `smtravels-api` restarted and active
- [x] Startup integration verification
- [ ] Set Wasender + BulkSMSBD credentials when available
- [ ] Confirm Gemini billing credits for AI ERP features
- [ ] Rotate any secrets previously pasted in chat
- [ ] Spot-check portals in browser (customer visa/downloads/AI; agent statements)

---

## 11. Remaining V2 Features (explicitly deferred)

- HR & Payroll, Attendance, Leave, Recruitment
- Referral Program, Coupon System, Campaign Manager, Advanced Marketing
- WhatsApp Inbox & Auto Reply
- Two-Factor Authentication, IP Restriction
- Full staff/supplier/accountant portal mock cleanup (optional polish)

---

*Generated after launch-cut implementation deploy.*
