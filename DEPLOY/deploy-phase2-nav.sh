#!/usr/bin/env bash
###############################################################################
# SM Travels — Phase 2 deploy: FINAL ERP NAVIGATION (frontend-only) @ 21949b2.
# Layers on the ALREADY-LIVE CMS+OCR baseline. TARGET: 200.141.8.183 ONLY.
#
# Phase 2 has NO DB changes → this script runs `migrate status` ONLY (never deploy),
# rebuilds the FRONTEND with devDependencies (the NODE_ENV=production fix), and does
# NOT restart smtravels-api (backend is byte-identical to the verified baseline).
#
# NEVER: git clean · migrate deploy/reset · touch 187.77.144.38 · delete untracked/
# env/uploads/api/backups/.backup-passphrase.
#
# Run:  bash <(git -C /var/www/SMTravels show origin/feature/prod-cms-merge:DEPLOY/deploy-phase2-nav.sh)
###############################################################################
set -uo pipefail
APP=/var/www/SMTravels; BE=$APP/backend; FE=$APP/frontend
PIN=21949b2; DOMAIN=smtravelsinternational.com; APIPORT=4030
P2_MARKERS=("businessNetwork" "/erp/manpower/job-orders" "Muallim / Mutawwif")
die(){ printf '\n\033[31m✖ STOP: %s\033[0m\n' "$*" >&2; exit 1; }
ok(){  printf '  \033[32m✔\033[0m %s\n' "$*"; }
say(){ printf '\n\033[1;36m== %s\033[0m\n' "$*"; }

cd "$APP" 2>/dev/null || die "$APP not found"

say "GUARD 0 — host must be 200.141.8.183"
hostname -I | grep -qw 200.141.8.183 || die "not on 200.141.8.183 (this host: $(hostname -I)). Refusing."
ok "on $(hostname) / 200.141.8.183"

say "GUARD 1 — no tracked local changes (known prod-only untracked allowed)"
git diff --quiet --exit-code        || die "tracked UNSTAGED changes present — resolve/review first."
git diff --cached --quiet --exit-code || die "tracked STAGED changes present — resolve/review first."
UNEXPECTED=""
while IFS= read -r u; do
  [ -z "$u" ] && continue
  case "$u" in
    .backup-passphrase | api/ | api/* | backend/tests/ | backend/tests/* | backups/ | backups/* | uploads/ | uploads/* ) : ;;
    *) UNEXPECTED="${UNEXPECTED}${u}"$'\n' ;;
  esac
done < <(git status --porcelain | sed -n 's/^?? //p')
[ -z "$UNEXPECTED" ] || { printf '%s' "$UNEXPECTED" | sed 's/^/    unexpected untracked: /'; die "unexpected untracked path(s) — review manually."; }
ok "tracked tree clean; only known production-only untracked present (preserved)"

# pg_dump/libpq reject Prisma's ?schema= param — strip only that, keep everything else.
pg_url_for_dump() {
  local url="$1" base query newq kv; local -a parts
  base="${url%%\?*}"; [ "$base" = "$url" ] && { printf '%s' "$url"; return; }
  query="${url#*\?}"; newq=""; local IFS='&'; read -ra parts <<< "$query"
  for kv in "${parts[@]}"; do case "$kv" in schema=*|"") ;; *) newq="${newq:+$newq&}$kv" ;; esac; done
  [ -n "$newq" ] && printf '%s?%s' "$base" "$newq" || printf '%s' "$base"
}

say "STEP 1 — BACKUP (DB + env + current HEAD) before any code change"
STAMP=$(date +%Y%m%d-%H%M); BK=/root/smtravels-pre-phase2-$STAMP; mkdir -p "$BK"
set -a; . "$BE/.env.production" 2>/dev/null || . "$APP/.env.production"; set +a
[ -n "${DATABASE_URL:-}" ] || die "DATABASE_URL not loaded — cannot back up safely."
pg_dump --dbname="$(pg_url_for_dump "$DATABASE_URL")" > "$BK/db.sql" || die "pg_dump failed"
[ -s "$BK/db.sql" ] || die "pg_dump produced an EMPTY file — aborting."
ok "DB dump -> $BK/db.sql ($(du -h "$BK/db.sql"|cut -f1))"
cp -a "$BE/.env.production" "$BK/env.bak" 2>/dev/null && chmod 600 "$BK/env.bak"
PRE_HEAD=$(git rev-parse HEAD); echo "$PRE_HEAD" > "$BK/PRE_DEPLOY_HEAD.txt"; ok "pre-deploy HEAD $PRE_HEAD saved (baseline)"

say "STEP 2 — SWITCH CODE to $PIN (Phase 2; untracked data preserved; NO git clean)"
git fetch origin
git rev-parse -q --verify "$PIN^{commit}" >/dev/null || die "$PIN not found after fetch"
git checkout feature/prod-cms-merge
git reset --hard "$PIN"
HEAD_NOW=$(git rev-parse --short HEAD)
[ "$HEAD_NOW" = "$PIN" ] || die "HEAD is $HEAD_NOW, expected $PIN"
ok "HEAD = $HEAD_NOW (pinned $PIN)"
for d in uploads api backups .backup-passphrase backend/.env.production; do [ -e "$d" ] && ok "preserved: $d"; done

say "STEP 3 — DB SAFETY: migrate STATUS only (Phase 2 has NO DB changes)"
cd "$BE"
set -a; . .env.production 2>/dev/null || . ../.env.production; set +a
MS=$(./node_modules/.bin/prisma migrate status --schema=prisma/schema.prisma 2>&1)
echo "$MS" | sed 's/^/    /'
echo "$MS" | grep -qiE 'drift|not in sync|failed|to resolve' && { git reset --hard "$PRE_HEAD"; die "DRIFT/FAILED — code rolled back to baseline, DB untouched."; }
echo "$MS" | grep -qi 'have not yet been applied' && { git reset --hard "$PRE_HEAD"; die "Unexpected PENDING migrations for a frontend-only phase — code rolled back, DB untouched."; }
echo "$MS" | grep -qi 'up to date' || echo "  (note: could not see 'up to date' — inspect above; no migration will be applied regardless)"
ok "DB unchanged; no migration applied"

say "STEP 4 — FRONTEND: install WITH devDependencies (fixes NODE_ENV=production omit)"
cd "$FE"
npm ci --include=dev || die "npm ci --include=dev failed"
./node_modules/.bin/vite --version >/dev/null 2>&1 || die "vite still missing after --include=dev — investigate."
ok "vite present: $(./node_modules/.bin/vite --version)"
echo "  -- typecheck (informational; known pre-existing cross-package/type-annotation errors) --"
npm run typecheck > /tmp/p2-tsc.log 2>&1 && ok "typecheck exit 0" || echo "  (typecheck non-zero — pre-existing; the gate is the vite build below. See /tmp/p2-tsc.log)"
npm run build || die "frontend build failed"
BUNDLE=$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' dist/index.html | head -1)
ok "frontend built -> $BUNDLE"

say "STEP 5 — verify NEW nav markers present in the built bundle"
for m in "${P2_MARKERS[@]}"; do
  grep -qF "$m" "dist${BUNDLE}" && ok "marker present: $m" || die "Phase-2 marker MISSING ($m) — build is not 21949b2. Aborting before serving."
done
grep -qF "index-CdgZZGSw" dist/index.html && die "old bundle still referenced — investigate." || ok "old index-CdgZZGSw.js retired"

say "STEP 6 — reload nginx (NO API restart — backend byte-identical to baseline)"
nginx -t || die "nginx config test failed"
systemctl reload nginx
ok "nginx reloaded; smtravels-api left running (baseline preserved)"

say "STEP 7 — VERIFY LIVE"
echo "  health (should be UNCHANGED baseline uptime): $(curl -s -m8 http://127.0.0.1:$APIPORT/api/health)"
echo "  local bundle: $(curl -s -m8 http://127.0.0.1/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)  (built: $BUNDLE)"
for r in / /erp /login /portal /agent /customer; do
  printf '    %-12s -> %s\n' "$r" "$(curl -s -o /dev/null -w '%{http_code}' -m10 https://$DOMAIN$r)"
done
echo "  public bundle: $(curl -s -m12 https://$DOMAIN/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)"

say "PHASE 2 DEPLOY COMPLETE — HEAD $PIN. Backup: $BK (keep until sign-off)."
echo "  Rollback: git reset --hard \$(cat $BK/PRE_DEPLOY_HEAD.txt) ; cd frontend && npm ci --include=dev && npm run build ; nginx -s reload"
