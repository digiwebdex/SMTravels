# Deployment Guide — SM Travels International

## Architecture (production)

| Layer | Path / Unit |
|-------|-------------|
| Source of truth | `/root/smtravels-src` (git) |
| Deploy root | `/var/www/SMTravels` |
| Frontend static | `/var/www/SMTravels/frontend/dist` |
| Backend | `/var/www/SMTravels/backend` → `node dist/main.js` |
| Env | `/var/www/SMTravels/.env.production` (mode 600) |
| Uploads | `/var/www/SMTravels/uploads` (outside web root) |
| systemd | `smtravels-api.service` → `127.0.0.1:4030` |
| nginx | `smtravelsinternational.com` → static + `/api` proxy |
| SSL | Cloudflare Origin CA on origin; HSTS at Cloudflare edge |

## Prerequisites

- Node.js 22.x (see `backend/package.json` engines)
- PostgreSQL reachable via `DATABASE_URL`
- Cloudflare DNS + proxy for apex/www

## Build & deploy (standard)

```bash
# 1) Backend
cd /root/smtravels-src/backend
npm ci
npx prisma migrate deploy
npm run build
rsync -a --delete --exclude node_modules --exclude .env \
  dist/ /var/www/SMTravels/backend/dist/
rsync -a --delete --exclude node_modules \
  src/ /var/www/SMTravels/backend/src/
rsync -a prisma/ /var/www/SMTravels/backend/prisma/
# Install deps on deploy host if package.json changed:
# (cd /var/www/SMTravels/backend && npm ci --omit=dev)

# 2) Frontend
cd /root/smtravels-src/frontend
npm ci
npm run build
rsync -a --delete dist/ /var/www/SMTravels/frontend/dist/

# 3) Restart API
systemctl restart smtravels-api.service
systemctl status smtravels-api.service --no-pager

# 4) Reload nginx if vhost changed
nginx -t && systemctl reload nginx
```

## Environment checklist

Required in `.env.production`:

- `DATABASE_URL`, `JWT_SECRET` (≥32), `JWT_REFRESH_SECRET` (≥32, distinct)
- `CORS_ORIGIN=https://smtravelsinternational.com`
- `UPLOAD_DIR=/var/www/SMTravels/uploads`
- `HOST=127.0.0.1`, `PORT=4030`, `NODE_ENV=production`
- PII KEK vars (see `backend/src/lib/pii.ts`)

Optional integrations (safe when missing):

- SMTP (`SMTP_*`) — email
- `GEMINI_API_KEY` / `GEMINI_MODEL` — AI
- `GOOGLE_APPLICATION_CREDENTIALS` — Vision OCR
- `WASENDER_*` — WhatsApp
- `BULKSMSBD_*` — SMS

## Health checks

```bash
curl -sS http://127.0.0.1:4030/api/health
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4030/api/system/smtp/status
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4030/api/system/gemini/status
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4030/api/system/google-vision/status
```

## Rollback

1. Keep previous `frontend/dist` and `backend/dist` tarballs before rsync.
2. Restore prior dist trees.
3. `systemctl restart smtravels-api.service`
4. If a migration must roll back, restore DB from backup first (see BACKUP_RESTORE_GUIDE.md).

## Do not

- Commit `.env.production` or Vision JSON keys
- Serve `/uploads/` via nginx (denied by design)
- Bind the API to `0.0.0.0` publicly
