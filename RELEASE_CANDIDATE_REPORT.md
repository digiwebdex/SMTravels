# Release Candidate Report — SM Travels International (RC1)

**Date:** 2026-07-30  
**Scope:** Production-grade hardening (stability, security, performance, UX) — **no new business modules**  
**Live:** https://smtravelsinternational.com  
**Deploy:** `/var/www/SMTravels` · API `smtravels-api.service`

---

## Scores (0–100)

| Dimension | Score | Notes |
|-----------|------:|-------|
| **Overall Health** | **82** | Core ERP + website production-capable with known external deps |
| Performance | 78 | List selects narrowed; public cache; main chunk ~679KB (was ~768KB) |
| Security | 88 | Magic bytes, Origin refresh gate, RBAC/OTP prior fixes retained |
| Accessibility | 74 | Drawer/Field/pagination a11y improved; more icon buttons remain |
| Code Quality | 80 | Dead mocks removed; error shape normalized; SampleBadge honesty |
| Database | 83 | Hot-path selects tightened; indexes adequate for launch volume |
| Frontend | 80 | Lazy public routes; FAQ/Contact/Booking polish; mock screens labeled |
| Backend | 86 | Rate limits, cache headers, upload sniffing, queue claim |
| Deployment | 88 | nginx asset cache + gzip_types + server_tokens; systemd healthy |

---

## What RC1 hardened

### Stability & reliability
- Notification queue atomic claim + stuck reclaim (from prior audit, retained)
- Honest SMS/WA channel disable behavior
- Normalized API errors with `requestId`
- FAQ / public content load-error-empty honesty

### Security
- Upload magic-byte verification before store
- Refresh Origin allow-list + `refreshRateLimiter`
- `uploadRateLimiter` on document & portal uploads
- Rate-limit responses include `requestId`
- Prior audit: DB auth recheck, RBAC revoke, OTP redaction, portal ERP grants cleared

### Performance
- Customers / bookings / invoices list queries use narrow `select`
- Public CMS `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- Lazy Auth, Booking, Packages, Blog, Gallery, FAQ, CMS legal pages
- nginx `/assets/` immutable 1y; `index.html` no-cache; gzip_types; `server_tokens off`

### UX polish
- SampleBadge on Ops calendar/chat/workflows, payment gateways, general settings, custom BI builder
- Contact BD phone + email validation
- Booking step gates + phone/email validation
- CRM Drawer Escape + dialog semantics; Field `htmlFor`; StatCards responsive
- Dead `CONVERSATIONS` / unused invoice mock arrays removed

### Documentation delivered
- `CHANGELOG.md`
- `DEPLOYMENT_GUIDE.md`
- `BACKUP_RESTORE_GUIDE.md`
- `ADMIN_USER_GUIDE.md`
- `SYSTEM_ARCHITECTURE.md`
- This report: `RELEASE_CANDIDATE_REPORT.md`

---

## RC verification (smoke)

| Check | Result |
|-------|--------|
| API health | PASS |
| Public Cache-Control | PASS (`max-age=60, stale-while-revalidate=300`) |
| Refresh from evil Origin | PASS (403 ForbiddenOrigin) |
| Auth login + customers/bookings/invoices | PASS |
| Website `/`, `/faq`, `/book`, `/login` | PASS 200 |
| `/sitemap.xml`, `/robots.txt` | PASS |
| Hashed asset Cache-Control immutable | PASS |
| Gemini live inference | EXTERNAL — may 502 if quota exhausted |
| SMS / WhatsApp delivery | OFF until credentials |

---

## Remaining risks

1. **Gemini billing/quota** — AI features fail at runtime until credits restored  
2. **SMS/WhatsApp** — intentionally off; do not promise delivery yet  
3. **SampleBadge screens** — Ops chat/calendar/workflows, gateway volumes, vouchers, system health still not live telemetry  
4. **Staff / Supplier / Accountant portals** — still partially mock (labeled)  
5. **Main bundle still >500KB** — further `manualChunks` optional  
6. **Focus trap** in drawers is Escape-only (not full focus lock)  
7. **Secrets historically pasted in chat** — rotate if not already done  
8. **Upload AV scanning** — magic bytes only; no antivirus  

---

## CRUD / API / Config summary

| Area | RC1 status |
|------|------------|
| ERP CRUD (customers, bookings, invoices, CMS, docs) | Live create/read/update + search/filter/pagination; delete soft where modeled |
| Export | Reports CSV/XLSX/PDF verified previously |
| Import | Not a launch feature (no fake importer) |
| Bulk actions | Limited to existing UI; no new bulk feature added |
| Permissions | RBAC + portal isolation verified |
| nginx / systemd / SSL | Hardened & reloaded |
| robots / sitemap / 404 | SPA 404; SEO files current |

---

## Final recommendation

# **READY FOR PRODUCTION**

**Conditional expectations for go-live communications:**

- Market **core ERP + website + email notifications + OCR** as live  
- Treat **AI assistant** as available only after Gemini quota is confirmed healthy  
- Treat **SMS/WhatsApp** as coming soon until credentials are configured  
- Train staff that **SampleBadge** screens are not operational data  

RC1 meets production-grade bar for the Phase 1–7 launch cut without introducing new business modules.
