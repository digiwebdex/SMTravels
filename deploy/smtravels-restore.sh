#!/usr/bin/env bash
# SM Travels — restore database from a daily gzip dump (DESTRUCTIVE to target DB).
# Usage:
#   smtravels-restore.sh /var/www/SMTravels/backups/daily/smtravels_db_YYYYMMDD-HHMMSS.sql.gz
#   smtravels-restore.sh --verify-only <dump.sql.gz>   # restore into temp DB, then drop
set -euo pipefail
PGPORT=5440
PROD_DB=smtravels_db
VERIFY=0
DUMP=""
for a in "$@"; do
  case "$a" in
    --verify-only) VERIFY=1 ;;
    *) DUMP="$a" ;;
  esac
done
[ -n "$DUMP" ] && [ -f "$DUMP" ] || { echo "Usage: $0 [--verify-only] <dump.sql.gz>"; exit 2; }
gunzip -t "$DUMP"

if [ "$VERIFY" -eq 1 ]; then
  TARGET="smtravels_restore_verify_$(date +%Y%m%d%H%M%S)"
  echo "VERIFY restore into temp DB: $TARGET"
  sudo -u postgres dropdb -p "$PGPORT" --if-exists "$TARGET" || true
  sudo -u postgres createdb -p "$PGPORT" "$TARGET"
  gunzip -c "$DUMP" | sudo -u postgres psql -p "$PGPORT" -d "$TARGET" -v ON_ERROR_STOP=1 -q
  sudo -u postgres psql -p "$PGPORT" -d "$TARGET" -c 'SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='"'"'public'"'"';'
  sudo -u postgres dropdb -p "$PGPORT" "$TARGET"
  echo "VERIFY OK — temp DB dropped"
  exit 0
fi

echo "WARNING: This will REPLACE production database '$PROD_DB'."
echo "Stop API first: systemctl stop smtravels-api.service"
read -r -p "Type YES to continue: " conf
[ "$conf" = "YES" ] || { echo "Aborted"; exit 1; }
systemctl stop smtravels-api.service || true
# Recreate DB
sudo -u postgres dropdb -p "$PGPORT" --if-exists "$PROD_DB"
sudo -u postgres createdb -p "$PGPORT" -O smtravels_user "$PROD_DB"
gunzip -c "$DUMP" | sudo -u postgres psql -p "$PGPORT" -d "$PROD_DB" -v ON_ERROR_STOP=1
cd /var/www/SMTravels/backend && npx prisma migrate deploy
systemctl start smtravels-api.service
curl -sf http://127.0.0.1:4030/api/health
echo
echo "RESTORE COMPLETE"
