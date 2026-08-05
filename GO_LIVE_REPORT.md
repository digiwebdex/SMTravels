# Go Live Report — SM Travels International

**Date:** 2026-07-30  
**Status from RC1:** READY FOR PRODUCTION  
**This package:** Verify, stabilize, document, and hand over — **no new features**

Live URL: https://smtravelsinternational.com  
Deploy root: `/var/www/SMTravels`  
API: systemd `smtravels-api.service` → `127.0.0.1:4030`

---

## 1. Deployment Status — **PASS**

| Check | Result |
|-------|--------|
| nginx vhost + proxy `/api` | OK |
| SSL Cloudflare Origin CA | Valid through **2041-07-22** |
| systemd Restart=on-failure, EnvironmentFile | OK |
| Production build (frontend/backend dist) | Deployed |
| Static assets + immutable cache | OK |
| Compression (gzip_types) | OK |
| Log rotation (`/etc/logrotate.d/smtravels`) | OK |
| Permissions env 600 / uploads+backups 750 | OK |
| Application startup / health | OK |

## 2. Database Status — **PASS**

| Check | Result |
|-------|--------|
| Migrations | 7 applied (latest outbound notifications) |
| Tables / FKs / indexes | 83 / 101 / 249 |
| Constraints | Present (unique, journal balance trigger, PII blind indexes) |
| Backup script | `/usr/local/bin/smtravels-backup.sh` nightly 02:30 |
| Restore script | `/usr/local/bin/smtravels-restore.sh` (+ `--verify-only`) |
| Scheduled backups | `/etc/cron.d/smtravels` |
| Restore test (temp DB) | **PASS** |
| Fresh go-live backup + offsite | **PASS** (`20260730-220025`) |

## 3. API Status — **PASS**

Auth, customers, bookings, invoices, payments, documents, CMS, reports, notifications dashboard, branches, users, suppliers, packages, accounts — verified responding under RBAC. Error bodies include `requestId`.

## 4. Website Status — **PASS**

`/`, `/hajj`, `/faq`, `/privacy`, sitemap, robots — HTTP 200. SEO paths corrected in RC1. No silent demo catalog fallback.

## 5. ERP Status — **PASS (ready for data entry)**

Core modules operational. Master data seed:

| Module | Ready | Notes |
|--------|-------|-------|
| Company Profile | Yes | `SM Travels International` |
| Branches | Yes | 4 branches |
| Employees / Users | Yes | CRUD `/admin/users` — create staff at cutover |
| Roles | Yes | 12 system roles + RBAC matrix |
| Suppliers | Yes | CRUD API empty — enter suppliers |
| Packages (Hajj/Umrah/Tour) | Yes | Catalog CRUD — **0 packages; enter before public sell** |
| Services | Yes | 7 service types |
| Payment / COA / Banks | Yes | 17 accounts, 3 bank accounts |
| Airlines / Countries / Cities / Visa Types | N/A as separate catalogs | Captured on bookings/packages |

## 6. Portal Status — **PARTIAL**

| Portal | Status |
|--------|--------|
| Customer | Live (ownership-scoped) |
| Agent | Live (Phase 1–7) |
| Staff / Supplier / Accountant | **V2** — SampleBadge / deferred |

## 7. Notification Status — **EMAIL LIVE**

| Channel | Flag |
|---------|------|
| Email (SMTP) | ON |
| SMS | OFF (await BulkSMSBD) |
| WhatsApp | OFF (await Wasender) |
| In-app | ON |
| Worker | Running (15s) |

## 8. OCR Status — **PASS**

Google Vision Service Account connected. Upload magic-byte validation active. Multi-kind parsers deployed.

## 9. AI Status — **CONFIGURED / QUOTA BLOCKED**

Gemini model `gemini-2.5-flash` status connected; runtime chat returns **502 quota/billing**. Do not market AI until credits restored.

## 10. Backup Status — **PASS**

Nightly + retention + encrypted offsite verified. Fresh go-live dump created. See `BACKUP_VERIFICATION.md`.

## 11. Monitoring Status — **PASS (host-level)**

- App: pino request logs + journald + health endpoints  
- Host: existing `/opt/scripts/healthcheck.sh`, `system-monitor.sh`, SSL check  
- Disk: **89% — action required** to protect backups  

## 12. Known Limitations

See `KNOWN_LIMITATIONS.md` (Gemini, SMS/WA, V2 portals, SampleBadge, disk, catalog emptiness).

## 13. Go Live Checklist

See `GO_LIVE_CHECKLIST.md`.

## 14. Final Recommendation

# **GO LIVE APPROVED**

Proceed with production handover for:

- Public website  
- Staff ERP (CRM, bookings, finance, documents, CMS, reports, email notifications)  
- Customer & Agent portals  
- OCR  

**Before customer-facing AI / SMS / WhatsApp claims:** resolve Gemini billing and messaging credentials.

**First ops priority after cutover:** free disk space on `/` and enter real packages + staff users.

---

### End-to-end verification (2026-07-30)

Customer create → Visa booking draft → Invoice issue (`INV-DHK-2026-0001`) → Payment (`PAY-DHK-2026-0001`) → Money receipt print (**SM Travels International**, 200) → Reports CSV 200 → Vision/SMTP connected → AI 502 (quota) documented.

### Document package

| File | Purpose |
|------|---------|
| `GO_LIVE_REPORT.md` | This summary |
| `GO_LIVE_CHECKLIST.md` | Cutover ticks |
| `OPERATIONS_RUNBOOK.md` | Day-2 ops |
| `SYSTEM_HEALTH_REPORT.md` | Snapshot metrics |
| `KNOWN_LIMITATIONS.md` | Explicit non-goals |
| `BACKUP_VERIFICATION.md` | Backup proof |
| Plus RC/audit guides already on server | Deploy / Backup / Admin / Architecture / Changelog |
