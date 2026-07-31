# System Health Report — Go Live Snapshot

**Captured:** 2026-07-30 ~22:00 UTC

## Application

| Component | Status |
|-----------|--------|
| `smtravels-api.service` | active (User=deploy) |
| Health `/api/health` | ok |
| Frontend dist | present (`index.html`) |
| nginx config test | ok |
| Cloudflare Origin SSL | valid **2026-07-26 → 2041-07-22** |
| Asset Cache-Control | `public, immutable` (1y) |
| index.html Cache-Control | `no-cache` |
| gzip_types | enabled (JS/CSS/JSON/…) |
| server_tokens | off |
| Logrotate smtravels | configured |

## Integrations

| Service | Status endpoint | Runtime |
|---------|-----------------|---------|
| Gmail SMTP | connected | Email queue live |
| Google Vision | connected (Service Account) | OCR ready |
| Google Gemini | connected (gemini-2.5-flash) | **Runtime 502 — quota exhausted** |
| BulkSMSBD | flag false | Disabled |
| Wasender WhatsApp | flag false | Disabled |

## Database

| Metric | Value |
|--------|------:|
| Public tables | 83 |
| Foreign keys | 101 |
| Indexes | 249 |
| Migrations applied | 7 (incl. outbound notifications) |
| Branches | 4 |
| Company | SM Travels International |
| Roles / permissions | 12 / 132 |
| Chart accounts | 17 |
| Bank accounts | 3 |
| Catalog services | 7 |
| Packages | 0 (awaiting business entry) |
| Customers (post smoke) | ≥1 go-live test row |

## Host resources (caution)

| Resource | Reading |
|----------|---------|
| Disk `/` | ~89% used (~12G free) — **raise free space** |
| Memory | ~8 GB RAM; swap in use |
| Load | elevated shared VPS (multi-tenant) |
| Backup free-space gate | aborts if &lt; 8 GB free |

## Queue

Notification dashboard: email on; SMS/WA off; no terminal failures observed during go-live checks.
