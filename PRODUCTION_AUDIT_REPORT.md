# SM Travels International — Production Audit Report

**Date:** 2026-07-30  
**Scope:** Full ERP + public website (`/root/smtravels-src` → deployed `/var/www/SMTravels`)  
**Live:** https://smtravelsinternational.com  
**Auditor role:** Senior software architect / production engineer  
**Constraint honored:** No new business modules built (HR, campaigns, WA inbox, 2FA deferred)

---

## 1. Overall Health Score

### **78 / 100**

| Area | Score | Notes |
|------|------:|-------|
| Backend / API | 85 | Auth recheck, RBAC revoke, queue claim, OTP redaction shipped |
| Database | 82 | Indexes adequate for launch; portal RBAC matrix corrected live |
| Frontend / UX | 72 | SEO fixed; silent demo fallbacks removed; some ERP mocks labeled |
| Security | 84 | Critical privilege + OTP leaks fixed; Helmet/CORS/rate limits OK |
| Performance | 68 | Main chunk ~768KB; ERP lazy-loaded; reports still in-memory |
| OCR / AI | 70 | Vision connected; Gemini configured but **billing/quota exhausted** |
| Notifications | 80 | Email live; SMS/WA correctly feature-flagged off |
| Reports | 78 | CSV/XLSX/PDF smoke OK |
| Website / SEO | 86 | Sitemap/robots/legal/404 paths corrected |

---

## 2. Critical Issues

| # | Issue | Status |
|---|--------|--------|
| C1 | RBAC `UserRoleLink` never revoked on demotion — privileged access retained | **FIXED** |
| C2 | Password-reset OTPs stored in `OutboundNotification.body` and exposed via list API | **FIXED** |
| C3 | `settings.manage` could assign `SUPER_ADMIN` / `COMPANY_ADMIN` | **FIXED** (hierarchy gate) |
| C4 | Sitemap listed `/services/*` URLs that 404 | **FIXED** |
| C5 | Public site silently showed demo catalog as live inventory | **FIXED** |
| C6 | Invoice print used mock “BDH Travels” branding | **FIXED** (live invoice + SM Travels) |

---

## 3. High Priority Issues

| # | Issue | Status |
|---|--------|--------|
| H1 | Access JWT trusted without DB status/role re-check | **FIXED** (`requireAuth` / `optionalAuth` load active user) |
| H2 | Seed matrix gave AGENT/CUSTOMER/SUPPLIER ERP module grants | **FIXED** (seed + live DB permissions set to `none`) |
| H3 | Outbound queue non-atomic claim; SMS/WA log-only marked SENT | **FIXED** (atomic claim + cancel when channel disabled) |
| H4 | Request logs could capture `Authorization` / cookies | **FIXED** (pino redact) |
| H5 | CORS deny threw → risk of 500 | **FIXED** (`cb(null, false)`) |
| H6 | BulkSMS used cleartext HTTP | **FIXED** (`https://bulksmsbd.net/api/smsapi`) |
| H7 | Authenticated `/ai/chat` could create CRM leads | **FIXED** (public route only) |
| H8 | Footer exposed `/ds` + internal workflow `/sitemap` | **FIXED** (removed; robots Disallow) |
| H9 | Gemini API quota/billing exhausted (502 `AiProviderError`) | **MANUAL** — top up Google AI Studio credits |
| H10 | Staff / Supplier / Accountant portals still mock (SampleBadge) | **DEFERRED V2** (labeled; not launch blockers for core ERP) |

---

## 4. Medium Priority Issues

| # | Issue | Status |
|---|--------|--------|
| M1 | Online payments / vouchers / system health / backup / staff KPI / OCR validation UI still mock | **MITIGATED** — `SampleBadge` added |
| M2 | Upload validation is MIME/extension only (no magic bytes) | Open — needs lib + ops decision |
| M3 | Refresh-token rotation not fully transactional | Open |
| M4 | CSRF Origin check on `/auth/refresh` cookie path | Open (SameSite=Lax + Secure already) |
| M5 | Reports load large sets in memory | Open — OK at current volume |
| M6 | Package inquiry was no-op | **FIXED** — redirects to `/book` with query params |
| M7 | Blog padded with Lorem ipsum | **FIXED** |
| M8 | Public menus location `footer` 404 if not seeded | Open — legal pages use CMS pages API (OK) |
| M9 | Contact/Booking form validation soft | Open |
| M10 | JWT min length now enforced (32+) | **FIXED** |
| M11 | Main JS chunk >500KB warning | Open |

---

## 5. Low Priority Issues

| # | Issue | Status |
|---|--------|--------|
| L1 | Newsletter footer is UI-only | Open |
| L2 | Social links `href="#"` | Open |
| L3 | Per-route meta / OG image weak | Open |
| L4 | Dead unused mock constants in Communications/Accounts | Open (bundle weight) |
| L5 | Health endpoint exposes `env` | Low risk |
| L6 | `/ds` and workflow `/sitemap` routes still exist (disallowed in robots, unlinked from footer) | Acceptable |

---

## 6. Bugs Fixed Automatically

1. **RBAC replace-on-role-change** + refresh-token revoke on role/status change
2. **Privilege escalation guard** — only `SUPER_ADMIN` assigns `SUPER_ADMIN` / `COMPANY_ADMIN`
3. **Auth middleware** reloads active user from DB (disabled/demoted users lose API access immediately)
4. **Password reset OTP** sent directly; stored body redacted; list API redacts OTP events
5. **Notification worker** atomic claim, stuck `PROCESSING` reclaim, SMS/WA cancel when disabled, SMTP-off fails honestly
6. **Pino redaction** of auth headers/cookies
7. **CORS** reject without 500
8. **BulkSMS HTTPS**
9. **AI lead creation** limited to public chat
10. **Portal role ERP permissions** cleared in DB + seed matrix
11. **Sitemap / robots.txt** corrected for real routes + legal pages
12. **Footer** removed internal `/ds` and workflow sitemap; added branches/career
13. **Public content hooks** no longer silent-fallback to demo data
14. **Invoice detail/print** SM Travels branding + live `useInvoice`
15. **SampleBadge** on remaining mock ERP surfaces
16. **Package detail form** validates and routes to `/book`
17. **Blog** no Lorem ipsum padding

---

## 7. Files Modified

### Backend
- `backend/src/services/user.admin.service.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/app.ts`
- `backend/src/lib/env.ts`
- `backend/src/lib/notify.ts`
- `backend/src/services/notification.service.ts`
- `backend/src/services/unifiedNotification.service.ts`
- `backend/src/services/ai.service.ts`
- `backend/src/controllers/ai.controller.ts`
- `backend/src/routes/ai.route.ts`
- `backend/prisma/seed.ts`

### Frontend
- `frontend/public/sitemap.xml`
- `frontend/public/robots.txt`
- `frontend/src/app/components/Layout.tsx`
- `frontend/src/app/hooks/publicContent.ts`
- `frontend/src/app/pages/Blog.tsx`
- `frontend/src/app/pages/Packages.tsx`
- `frontend/src/app/erp/InvoicesModule.tsx`
- `frontend/src/app/erp/SettingsModule.tsx`
- `frontend/src/app/erp/DocumentsModule.tsx`
- `frontend/src/app/erp/ReportsBIModule.tsx`

### Ops / DB (production)
- Deployed `frontend/dist` + `backend/dist`
- Restarted `smtravels-api.service`
- Live update: AGENT / CUSTOMER / SUPPLIER `RolePermission.access → none`
- Ephemeral audit user created then disabled after smoke tests

---

## 8. Performance Improvements

| Item | Detail |
|------|--------|
| Honest empty states | Avoids rendering large demo catalogs when CMS/API empty |
| Notification claim | Prevents double-send under multi-tick / future multi-instance |
| Stuck processing reclaim | Recovers queue after worker crash (~10 min) |
| Remaining | Vite `manualChunks` for `index` (~768KB); SQL aggregates for large reports; image CDN |

---

## 9. Security Improvements

| Item | Detail |
|------|--------|
| Session invalidation | Role/status change revokes refresh tokens; access path checks DB |
| Least privilege | Portal roles cannot use ERP permission matrix |
| Secret hygiene | OTP not stored/listed; logs redact Bearer/cookies |
| Transport | BulkSMS over HTTPS |
| AuthZ | AI lead creation only on public endpoint; JWT secret min length 32 |
| CORS | Fail closed without error 500 |

---

## 10. Remaining Manual Tasks

1. **Top up Google Gemini billing/credits** — AI chat & ERP AI helpers return 502 until fixed
2. **Provide Wasender + BulkSMSBD credentials** when SMS/WhatsApp should go live (flags currently `false`)
3. **Rotate any secrets previously pasted in chat** (JWT, SMTP app password, Gemini, Vision SA if exposed)
4. **Business decision:** keep or remove `/ds` and workflow `/sitemap` routes entirely
5. **Business decision:** wire real online payment gateways / vouchers / system health telemetry (currently labeled sample)
6. **Staff / Supplier / Accountant portal** live data (V2)
7. **Upload magic-byte validation** + optional AV
8. **Origin allow-list check** on cookie refresh endpoint
9. **Frontend chunk splitting** for main bundle
10. **Confirm production address/phone** on invoice footer (currently domain + brand; add HQ address when confirmed)
11. **Delete disabled smoke user** `audit.smoke@smtravels.local` after review (already disabled + soft-deleted)

---

## 11. Smoke Test Results (production)

| Workflow | Result |
|----------|--------|
| Health | PASS |
| Auth login / refresh | PASS |
| Disabled user JWT rejected | PASS |
| Customers / bookings / invoices / payments | PASS |
| Notification dashboard / outbound | PASS (email on; SMS/WA off) |
| CMS pages | PASS |
| Reports CSV / XLSX / PDF | PASS |
| Google Vision status | PASS (`connected`) |
| Gemini status | PASS (`connected`) — **runtime calls 502 quota** |
| SMTP status | PASS (`connected`) |
| OCR route auth/validation | PASS (400 without file) |
| Public packages/blog/faqs/gallery/privacy | PASS |
| Website `/`, `/hajj`, `/umrah`, legal pages | PASS 200 |
| Sitemap `/hajj` (not `/services/hajj`) | PASS |
| robots Disallow `/ds` | PASS |
| AI chat / public AI | FAIL 502 — Gemini quota (external) |

---

## 12. Final Go / No-Go Recommendation

### **CONDITIONAL GO** for production launch of core ERP + website

**May go live now for:**
- Public website (SEO, legal, booking intake, CMS pages)
- Staff ERP: customers, bookings, visas/docs pipeline, invoices/payments, CMS admin, reports, email notifications
- Customer & Agent portals (Phase 1–7 live paths)
- OCR (Vision connected)

**Do not market as fully live until:**
1. Gemini credits restored (if AI assistant is part of launch messaging)
2. Optional: SMS/WhatsApp credentials if those channels are promised
3. Staff clearly understand SampleBadge screens (online payments stats, vouchers, system health, staff KPI, OCR validation grid, Staff/Supplier/Accountant portals) are **not** live operational data

**No-Go triggers that were present and are now cleared:** privilege retention on demotion, OTP leakage, wrong-brand invoice print, SEO 404 sitemap, silent demo inventory.

---

*Generated by production audit run 2026-07-30. Deployed to `/var/www/SMTravels` with API restart.*
