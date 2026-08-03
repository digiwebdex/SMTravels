# Backup & Restore Guide — SM Travels International

## What to back up

| Asset | Location | Priority |
|-------|----------|----------|
| PostgreSQL database | `DATABASE_URL` | Critical |
| Uploaded documents | `/var/www/SMTravels/uploads` | Critical |
| Production env | `/var/www/SMTravels/.env.production` | Critical (offline/encrypted) |
| Vision service account | `/var/www/SMTravels/api/keys/` | High |
| nginx vhost | `/etc/nginx/sites-enabled/smtravelsinternational.com` | Medium |
| systemd unit | `/etc/systemd/system/smtravels-api.service` | Medium |
| Built artifacts | Optional — rebuild from git | Low |

Existing encrypted backups may live under `/var/www/SMTravels/backups` (restricted permissions).

## Database backup (logical)

```bash
# Example — adjust user/db from DATABASE_URL
set -a; source <(grep -v '^#' /var/www/SMTravels/.env.production | sed 's/^/export /'); set +a
# Prefer pg_dump with connection URI:
pg_dump "$DATABASE_URL" --format=custom --file="/var/www/SMTravels/backups/db-$(date +%Y%m%d-%H%M).dump"
```

Encrypt before offsite copy:

```bash
gpg --symmetric --cipher-algo AES256 "…dump"
```

## Files backup

```bash
tar -C /var/www/SMTravels -czf "/var/www/SMTravels/backups/uploads-$(date +%Y%m%d).tgz" uploads
# Env (store offline only):
cp -a /var/www/SMTravels/.env.production "/secure-offline/smtravels-env-$(date +%Y%m%d)"
```

## Recommended schedule

- DB: daily custom dump + weekly full
- Uploads: daily incremental / weekly full
- Retain ≥ 30 days locally; replicate offsite weekly
- Test restore monthly

## Restore procedure

1. **Stop API** — `systemctl stop smtravels-api.service`
2. **Restore DB** — `pg_restore --clean --if-exists -d "$DATABASE_URL" backup.dump` (or drop/recreate then restore)
3. **Restore uploads** — extract tarball to `/var/www/SMTravels/uploads` with `deploy` ownership
4. **Restore env** if needed (mode 600, owner deploy/root as configured)
5. **Migrate** — `cd /var/www/SMTravels/backend && npx prisma migrate deploy`
6. **Start** — `systemctl start smtravels-api.service`
7. **Verify** — health + login + open one document download + one invoice list

## Point-in-time

If using managed Postgres (or WAL archiving), follow the provider’s PITR docs; logical dumps alone do not provide PITR.

## After restore

- Revoke all refresh sessions if compromise suspected: truncate/update `RefreshToken`
- Rotate JWT secrets and force re-login if env was exposed
- Re-check Vision/Gemini/SMTP status endpoints
