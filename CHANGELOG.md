# Changelog — SM Travels International

All notable production changes are recorded here.

## [RC1] — 2026-07-30

### Security
- Auth middleware reloads active user from DB on every request (disable/demote takes effect immediately)
- RBAC role links replaced on role change; refresh tokens revoked on role/status change
- Only SUPER_ADMIN may assign SUPER_ADMIN / COMPANY_ADMIN
- Password-reset OTPs no longer persisted in outbound notification bodies
- Upload magic-byte verification (PDF/JPEG/PNG) before store
- Refresh cookie Origin allow-list check + dedicated refresh rate limit
- Upload rate limiting on document / portal upload routes
- Pino redacts Authorization and Cookie headers
- BulkSMS uses HTTPS
- Portal roles (AGENT/CUSTOMER/SUPPLIER) no longer inherit ERP module grants

### Reliability
- Outbound notification atomic claim + stuck PROCESSING reclaim
- SMS/WhatsApp disabled channels cancelled instead of false SENT
- Normalized API error responses with `requestId`
- CORS reject without 500

### Performance
- Narrowed Prisma selects on customers / bookings / invoices lists
- Public CMS GET `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- Lazy-loaded Auth, Booking, Packages, Blog, Gallery, FAQ, CMS legal pages
- Main JS chunk reduced ~768KB → ~679KB
- nginx long-cache for `/assets/*` (immutable); `index.html` no-cache
- gzip_types enabled; `server_tokens off`

### UX / Accessibility
- SampleBadge on remaining unlabeled mock ERP surfaces (Ops, gateways, settings, BI builder)
- FAQ loading / error / empty states
- Contact & Booking phone/email validation; booking step gates
- CRM Drawer Escape + aria; Field htmlFor; responsive StatCards; pagination aria-labels
- Removed silent demo catalog fallbacks; package inquiry routes to `/book`
- Invoice print uses live data + SM Travels branding
- Dead mock conversation / unused invoice arrays removed

### Website / SEO
- Sitemap paths corrected (`/hajj` not `/services/hajj`)
- robots.txt expanded + Disallow `/ds` and workflow `/sitemap`
- Footer no longer links internal design tools

## [Phase 1–7 Launch Cut] — 2026-07-30

Notification Center, Customer/Agent portals, CMS, multi-kind OCR, Gemini AI ERP routes, reports CSV/XLSX/PDF, production readiness pass.
