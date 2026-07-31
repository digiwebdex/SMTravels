# Go Live Checklist — SM Travels International

Mark each item at cutover. Owner: ops + SM Travels admin.

## Pre-cutover (done in Go Live package)

- [x] RC1 hardening deployed
- [x] nginx SSL (Cloudflare Origin CA) valid through 2041
- [x] systemd `smtravels-api` active on `127.0.0.1:4030`
- [x] `.env.production` mode 600
- [x] Uploads / backups directories 750
- [x] Prisma migrations applied (incl. outbound notifications)
- [x] Nightly backup + restore verify
- [x] Fresh go-live backup + offsite push
- [x] Health / Vision / SMTP connected
- [x] Customer → Booking → Invoice → Payment → Receipt smoke
- [x] Public website + legal pages 200
- [x] Documentation package generated

## Cutover day

- [ ] Confirm Cloudflare DNS/proxy orange-cloud for apex + www
- [ ] Confirm Gemini credits if AI will be announced
- [ ] Decide SMS/WhatsApp launch date (credentials)
- [ ] Create additional staff users (roles + branches)
- [ ] Enter real packages (Hajj/Umrah/Tour) in ERP catalog
- [ ] Confirm company logo/address on print templates
- [ ] Soft-delete or archive go-live smoke customer if desired
- [ ] Rotate any secrets previously shared outside the server
- [ ] Free disk space if usage ≥ 85% (currently ~89%)
- [ ] Announce internal go-live to staff; share ADMIN_USER_GUIDE

## First 24 hours

- [ ] Watch `journalctl -u smtravels-api -f` for 5xx spikes
- [ ] Confirm nightly backup log at 02:30
- [ ] Spot-check one real customer booking + receipt print
- [ ] Confirm email delivery (welcome / invoice events)

## Do not announce as live yet

- [ ] AI assistant (until Gemini quota healthy)
- [ ] WhatsApp / SMS channels (until credentials)
- [ ] Staff / Supplier / Accountant portals as complete products
