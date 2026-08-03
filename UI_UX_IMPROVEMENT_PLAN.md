# UI / UX Improvement Plan — SM Travels International

**Date:** 2026-07-31  
**Constraint:** No architecture redesign. No new modules unless required to finish existing workflows. Prefer honesty (hide/remove) over placeholders.

---

## Principles

1. **Truth in UI** — If it isn’t API-backed, don’t show it as a primary nav item.  
2. **One tree** — Align production UI with mounted APIs (`smtravels-src` baseline + selective deploy merges).  
3. **Finish the first viewport job** — Don’t add marketing chrome; fix broken CTAs and empty states.  
4. **i18n completeness** — bn is product default; ERP body copy still mostly EN.

---

## Workstreams

### U1 — Remove false-live surfaces (P0)

| Item | Action | Files / areas |
|------|--------|----------------|
| Partners nav (prod) | Mount API **or** remove/hide Partners until mounted | `partners.route.ts`, ErpLayout, routes |
| Dashboard summary | Mount `dashboardRouter` **or** stop calling `/dashboard/summary` and use existing bookings/report hooks | `SuperAdminDashboard`, `dashboard.route.ts` |
| ComingSoon OCR/HR/AI/Integrations | Point to real modules (`/erp/documents`, `/erp/hr` after deploy, Settings integrations, AI slots) or delete nav entries | deploy `routes.tsx` |
| Documents secondary tools | Remove Versions/Signature/Sharing/Watermark/Trash from nav **or** label “Not available” and disable | `DocumentsModule.tsx` |
| Reports “saved schedules” | Remove fake list or mark demo-only | `ReportsModule.tsx` |
| Reports BI staff/custom | Hide SampleBadge tabs until wired | `ReportsBIModule.tsx` |

### U2 — SampleBadge cleanup (P1)

| Surface | Action |
|---------|--------|
| Accounts: gateways, transfer, installment mocks | Hide gateways (already disabled) or collapse to Settings; replace mocks with live lists or remove tabs |
| Invoices: online payments, vouchers | Hide until gateway/voucher APIs exist |
| Ops: calendar, reminders, chat, workflow | Keep Tasks/Announcements/Audit; demote or hide the rest |
| Settings: general/backup/health SampleBadge | Wire health to `/system/*` status endpoints already present; hide backup until real |
| Portals: supplier support/messages/reports; staff support; accountant tax | Shrink nav to live endpoints only |

### U3 — Workflow CTAs (closes business gaps without new modules)

| Improvement | Detail |
|-------------|--------|
| After lead convert | Button: “Create booking for this customer” with `customerId` prefilled |
| Booking detail | “Create invoice” using existing invoice create API + booking charges |
| OCR Validation | Wire Apply → apply draft fields via existing traveler/customer PATCH; disable Approve until persist succeeds |
| Package editor | Empty itinerary/tiers by default (no `SAMPLE_*` seed content) |
| Payment success | Refresh booking paid display from invoice totals (until B4 fixed) |

### U4 — Portal honesty

| Portal | Improvement |
|--------|-------------|
| Customer | Keep read-only profile; add link to support ticket instead of editable fake fields |
| Agent | Clarify “Commissions managed by office”; hide wallet balance if zero/uninitialized |
| Accountant | Nav = Dashboard + deep-links into ERP finance modules staff already use, instead of mock ledgers |
| Employee (when deployed) | Add bn strings for portal labels |

### U5 — Public site polish

| Item | Action |
|------|--------|
| Auth terms/privacy | Link `/privacy`, `/terms` (CmsPages) |
| Footer newsletter | Remove or wire to contact/lead intake |
| Social icons | Real URLs or remove |
| Contact map | Embed real map or remove placeholder block |
| Service pages | Optionally load package highlights from CMS API (optional; not a new module) |

### U6 — i18n & design-system adoption

| Item | Action |
|------|--------|
| ERP module strings | Extract to `erpCommon` / per-module ns; fill bn |
| Employee / HR | Add `portalEmployee` + `erpHr` namespaces |
| Design system | Prefer ModulePage/DataTable/PortalShell on remaining SampleBadge replacements (src already has DS; deploy needs DS package when merging) |
| AI cards | Label “Tips” unless Gemini response is shown |

### U7 — Notification & status clarity

| Item | Action |
|------|--------|
| Communications send UI | Show channel health (SMTP/SMS/WA) beside Send — reuse integrations status |
| HR leave rows | Visual dual-approval stepper (Manager → HR) |
| Duplicate HR in-app | Fix B10; then confirm single bell entry |

---

## Priority order

1. U1 (stop lying to users in production)  
2. U3 (finish money/OCR workflows users already start)  
3. U2 (shrink SampleBadge surface area)  
4. U4–U5 (portal + public honesty)  
5. U6–U7 (polish for enterprise feel)

---

## Explicit non-goals (this plan)

- Visual rebrand / new design system from scratch  
- New modules (payroll, biometric attendance, chat inbox V2, payment gateways) unless required by a P0/P1 workflow  
- Multi-tenant UX
