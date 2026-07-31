# Backup Verification — SM Travels International

**Verified:** 2026-07-30 (Go Live package)

## Schedule

| Job | Schedule | Script |
|-----|----------|--------|
| Nightly DB + uploads | `30 2 * * *` root | `/usr/local/bin/smtravels-backup.sh` (`/etc/cron.d/smtravels`) |
| Log rotation | weekly | `/etc/logrotate.d/smtravels` → `/var/log/smtravels-backup.log` |

## Local retention

- Daily: 14 copies under `/var/www/SMTravels/backups/daily/`
- Weekly (Sunday): 4 copies under `.../backups/weekly/`
- Offsite: encrypted `.gpg` via rclone → `gdrive:SMTravels-Backups/`

## Go-live verification performed

| Check | Result |
|-------|--------|
| Latest nightly dump gzip integrity | PASS |
| Uploads tar list | PASS |
| Restore into **temporary** DB then drop | PASS (`tables=82`, `branches=4`) |
| Fresh go-live dump `smtravels_db_20260730-220025.sql.gz` | PASS (44K, includes post-RC schema) |
| Fresh dump `--verify-only` restore | PASS |
| Offsite encrypted push | PASS (`OFFSITE_OK`) |

## Restore tooling

```bash
# Non-destructive verify
smtravels-restore.sh --verify-only /var/www/SMTravels/backups/daily/smtravels_db_YYYYMMDD-HHMMSS.sql.gz

# Full production restore (interactive YES; stops API)
smtravels-restore.sh /var/www/SMTravels/backups/daily/smtravels_db_YYYYMMDD-HHMMSS.sql.gz
```

Script paths: `/usr/local/bin/smtravels-restore.sh`, source copy `deploy/smtravels-restore.sh`.

## Notes

- Nightly job at 02:30 may lag same-day schema changes — run a manual backup after major deploys (as done for go-live).
- Backup aborts if free disk &lt; 8 GB — monitor disk.
- Passphrase file: `/var/www/SMTravels/.backup-passphrase` (mode 600) — never commit.
