#!/usr/bin/env bash
# SMTravels nightly backup — smtravels_db ONLY (never pg_dumpall) + uploads.
# Local plaintext (fast restore) + gpg-AES256 encrypted copies pushed offsite to Google Drive.
set -uo pipefail
BASE=/var/www/SMTravels
BK="$BASE/backups"; DAILY="$BK/daily"; WEEKLY="$BK/weekly"
LOG=/var/log/smtravels-backup.log
PASSFILE="$BASE/.backup-passphrase"
PGPORT=5440; DB=smtravels_db
REMOTE="gdrive:SMTravels-Backups"; RCLONE_CONF=/root/.config/rclone/rclone.conf
MIN_FREE_GB=8; KEEP_DAILY=14; KEEP_WEEKLY=4
TS=$(date +%Y%m%d-%H%M%S)
log(){ echo "[$(date '+%F %T')] $*" >> "$LOG"; }
mkdir -p "$DAILY" "$WEEKLY"
log "=== start $TS ==="

# 1) disk precheck — ABORT if low
FREE_GB=$(df -P --block-size=1G / | awk 'NR==2{print $4}')
if [ "${FREE_GB:-0}" -lt "$MIN_FREE_GB" ]; then log "ABORT: free ${FREE_GB}GB < ${MIN_FREE_GB}GB — no backup"; exit 1; fi
log "disk ok: ${FREE_GB}GB free"

# 2) DB dump (scoped to smtravels_db only)
DBFILE="$DAILY/smtravels_db_${TS}.sql.gz"
if sudo -u postgres pg_dump -p "$PGPORT" --no-owner --no-privileges "$DB" | gzip -9 > "$DBFILE"; then
  log "db ok: $(du -h "$DBFILE" | cut -f1) $(basename "$DBFILE")"
else log "ERROR pg_dump failed"; rm -f "$DBFILE"; exit 1; fi

# 3) uploads tarball
UPFILE="$DAILY/smtravels_uploads_${TS}.tar.gz"
if tar -C "$BASE" -czf "$UPFILE" uploads 2>>"$LOG"; then log "uploads ok: $(du -h "$UPFILE" | cut -f1)"; else log "ERROR uploads tar"; fi

# 4) weekly snapshot on Sundays
DOW=$(date +%u)
if [ "$DOW" -eq 7 ]; then cp -a "$DBFILE" "$UPFILE" "$WEEKLY/" 2>>"$LOG" && log "weekly copied"; fi

# 5) local retention
for pat in "$DAILY/smtravels_db_"*.sql.gz "$DAILY/smtravels_uploads_"*.tar.gz; do
  ls -1t $pat 2>/dev/null | tail -n +$((KEEP_DAILY+1)) | xargs -r rm -f; done
for pat in "$WEEKLY/smtravels_db_"*.sql.gz "$WEEKLY/smtravels_uploads_"*.tar.gz; do
  ls -1t $pat 2>/dev/null | tail -n +$((KEEP_WEEKLY+1)) | xargs -r rm -f; done
log "local retention applied (daily=$KEEP_DAILY weekly=$KEEP_WEEKLY)"

# 6) offsite: encrypt then push (refuse if no passphrase — never leak PII)
if [ -s "$PASSFILE" ] && command -v gpg >/dev/null; then
  TMP=$(mktemp -d)
  for f in "$DBFILE" "$UPFILE"; do [ -f "$f" ] || continue
    gpg --batch --yes --pinentry-mode loopback --passphrase-file "$PASSFILE" \
        --symmetric --cipher-algo AES256 -o "$TMP/$(basename "$f").gpg" "$f" 2>>"$LOG"; done
  if rclone --config "$RCLONE_CONF" copy "$TMP"/ "$REMOTE/daily/" 2>>"$LOG"; then log "offsite daily push ok"; else log "WARNING offsite push failed"; fi
  rclone --config "$RCLONE_CONF" delete "$REMOTE/daily/" --min-age "${KEEP_DAILY}d" 2>>"$LOG" || true
  if [ "$DOW" -eq 7 ]; then
    rclone --config "$RCLONE_CONF" copy "$TMP"/ "$REMOTE/weekly/" 2>>"$LOG" && log "offsite weekly push ok"
    rclone --config "$RCLONE_CONF" delete "$REMOTE/weekly/" --min-age "$((KEEP_WEEKLY*7))d" 2>>"$LOG" || true
  fi
  rm -rf "$TMP"
else
  log "WARNING: no passphrase/gpg — SKIPPING offsite push (refusing to upload PII unencrypted)"
fi
log "=== done $TS ==="
