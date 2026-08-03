# Operations Runbook — SM Travels International

## Service control

```bash
systemctl status smtravels-api.service
systemctl restart smtravels-api.service
journalctl -u smtravels-api.service -n 100 --no-pager
journalctl -u smtravels-api.service -f
```

API binds `127.0.0.1:4030`. Public traffic: nginx → Cloudflare.

## Health probes

```bash
curl -sS http://127.0.0.1:4030/api/health
# Authenticated:
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4030/api/system/smtp/status
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4030/api/system/gemini/status
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4030/api/system/google-vision/status
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4030/api/notifications/dashboard
```

## Deploy (summary)

See `DEPLOYMENT_GUIDE.md`. After rsync of `frontend/dist` + `backend/dist`:

```bash
systemctl restart smtravels-api.service
nginx -t && systemctl reload nginx
```

## Backups

- Cron: `/etc/cron.d/smtravels` → `/usr/local/bin/smtravels-backup.sh` at 02:30
- Log: `/var/log/smtravels-backup.log`
- Verify: `smtravels-restore.sh --verify-only <dump.sql.gz>`
- Full restore: see `BACKUP_RESTORE_GUIDE.md` / `BACKUP_VERIFICATION.md`

## Common incidents

| Symptom | Action |
|---------|--------|
| Site 502 | `systemctl status smtravels-api`; check journal; restart |
| Login fails for all | Check DB connectivity on port 5440; check JWT secrets in env |
| Emails not sending | SMTP status endpoint; Gmail app password; outbound queue FAILED rows |
| AI 502 | Gemini quota — billing, not app bug |
| Disk full / backup abort | Free space (&lt;8 GB free aborts backup); prune old logs/artifacts |
| Upload 415 | Only PDF/JPG/PNG; content must match magic bytes |

## Monitoring (existing host tooling)

- `*/5` healthcheck: `/opt/scripts/healthcheck.sh`
- `*/6h` system monitor: `/opt/scripts/system-monitor.sh`
- `06:00` SSL check: `/root/vps-system/bin/ssl-check.sh`
- App logs: journald + pino JSON (requestId on every response)

## Security notes

- Never expose `/uploads/` (nginx deny)
- Env file mode 600; Vision JSON under `api/keys/`
- Disable departed staff immediately (tokens revoked on status change)
