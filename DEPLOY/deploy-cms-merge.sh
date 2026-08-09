#!/usr/bin/env bash
###############################################################################
# SM Travels — AUTHORIZED production deploy of feature/prod-cms-merge @ db5bc04
# TARGET: 200.141.8.183 ONLY.  Backup-first. Self-stopping on every guard.
# NEVER: git clean · touch 187.77.144.38 · delete untracked/env/uploads/keys/backups.
#
# Guards (hard STOP, per owner directive):
#   * refuses to run unless host is 200.141.8.183
#   * STOP if any tracked local changes exist (before any switch)
#   * STOP unless migrate status shows EXACTLY the 5 CMS migrations pending,
#     with no drift/failed  (checked before migrate deploy)
#
# Run:  bash <(git -C /var/www/SMTravels show origin/feature/prod-cms-merge:DEPLOY/deploy-cms-merge.sh)
###############################################################################
set -uo pipefail
APP=/var/www/SMTravels; BE=$APP/backend; FE=$APP/frontend
PIN=db5bc04; DOMAIN=smtravelsinternational.com; APIPORT=4030
CMS_MIGS="20260808000000_cms_nav_footer_fields 20260808010000_statistics_module 20260808020000_home_services 20260808030000_hero_module 20260808040000_home_sections"
die(){ printf '\n\033[31m✖ STOP: %s\033[0m\n' "$*" >&2; exit 1; }
ok(){  printf '  \033[32m✔\033[0m %s\n' "$*"; }
say(){ printf '\n\033[1;36m== %s\033[0m\n' "$*"; }

cd "$APP" 2>/dev/null || die "$APP not found"

say "GUARD 0 — host must be 200.141.8.183"
hostname -I | grep -qw 200.141.8.183 || die "not on 200.141.8.183 (this host: $(hostname -I)). Refusing."
ok "on $(hostname) / 200.141.8.183"

say "GUARD 1 — working tree must be clean (no tracked local changes)"
DIRTY=$(git status --porcelain)
[ -z "$DIRTY" ] || { echo "$DIRTY" | sed 's/^/    /'; die "tracked local changes present — resolve/stash first (owner rule)."; }
ok "working tree clean"

say "STEP 1 — BACKUP (DB + env + current HEAD)"
STAMP=$(date +%Y%m%d-%H%M); BK=/root/smtravels-pre-cms-$STAMP; mkdir -p "$BK"
set -a; . "$BE/.env.production" 2>/dev/null || . "$APP/.env.production"; set +a
[ -n "${DATABASE_URL:-}" ] || die "DATABASE_URL not loaded from env — cannot back up safely."
pg_dump "$DATABASE_URL" > "$BK/db.sql" || die "pg_dump failed"; ok "DB dump -> $BK/db.sql ($(du -h "$BK/db.sql"|cut -f1))"
cp -a "$BE/.env.production" "$BK/env.bak" 2>/dev/null && chmod 600 "$BK/env.bak"
PRE_HEAD=$(git rev-parse HEAD); echo "$PRE_HEAD" > "$BK/PRE_DEPLOY_HEAD.txt"; ok "pre-deploy HEAD $PRE_HEAD saved"

say "STEP 2 — SWITCH CODE to $PIN (untracked data preserved; NO git clean)"
git fetch origin || die "git fetch failed"
git rev-parse -q --verify "$PIN^{commit}" >/dev/null || die "$PIN not found after fetch"
git checkout feature/prod-cms-merge || die "checkout failed"
git reset --hard "$PIN" || die "reset failed"
ok "now at $(git rev-parse --short HEAD) (pinned $PIN)"
# prove untracked prod data survived
for d in uploads api backups .backup-passphrase backend/.env.production; do [ -e "$d" ] && ok "preserved: $d" || echo "    (note: $d not present)"; done

say "STEP 3 — backend deps + client"
cd "$BE"
npm ci || die "npm ci (backend) failed"
./node_modules/.bin/prisma generate || die "prisma generate failed"
set -a; . .env.production 2>/dev/null || . ../.env.production; set +a

say "GUARD 2 — migrate status must be EXACTLY the 5 CMS migrations pending, no drift"
set +e; MS=$(./node_modules/.bin/prisma migrate status --schema=prisma/schema.prisma 2>&1); set -e 2>/dev/null || true
echo "$MS" | sed 's/^/    /'
echo "$MS" | grep -qiE 'drift|not in sync|failed|to resolve' && { git reset --hard "$PRE_HEAD"; die "DRIFT/FAILED reported — code rolled back to $PRE_HEAD, DB untouched."; }
echo "$MS" | grep -qi 'up to date' && { git reset --hard "$PRE_HEAD"; die "0 pending (already applied?) — expected 5. Code rolled back."; }
PEND=$(echo "$MS" | awk '/have not yet been applied/{f=1} f' | grep -oE '20[0-9]{12}_[A-Za-z0-9_]+' | sort -u)
EXP=$(echo $CMS_MIGS | tr ' ' '\n' | sort -u)
if [ "$PEND" != "$EXP" ]; then
  echo "  pending:"; echo "$PEND" | sed 's/^/    /'
  git reset --hard "$PRE_HEAD"; die "pending set != the 5 CMS migrations — code rolled back to $PRE_HEAD, DB untouched."
fi
ok "exactly the 5 CMS migrations pending, no drift/failed"

say "STEP 4 — apply the 5 additive CMS migrations"
./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma || die "migrate deploy failed — inspect; DB may be partially applied. Backup at $BK/db.sql"
ok "migrate deploy complete"

say "STEP 5 — build backend + seed CMS (idempotent)"
npm run build || die "backend build failed"
npm run seed:nav  || die "seed:nav failed"
npm run seed:home || die "seed:home failed"
ok "backend built + CMS seeded"

say "STEP 6 — build frontend"
cd "$FE"
npm ci || die "npm ci (frontend) failed"
npm run build || die "frontend build failed"
BUNDLE=$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' dist/index.html | head -1); ok "frontend built ($BUNDLE)"

say "STEP 7 — restart API (once) + reload nginx"
systemctl restart smtravels-api || die "restart failed"; sleep 3
nginx -t || die "nginx config test failed"; systemctl reload nginx
ok "smtravels-api restarted; nginx reloaded"

say "STEP 8 — VERIFY"
echo "  local health : $(curl -s -m8 http://127.0.0.1:$APIPORT/api/health)"
for p in hero services statistics home-sections settings menus/MAIN_NAV menus/FOOTER_NAV; do
  echo "    /api/public/$p -> $(curl -s -o /dev/null -w '%{http_code}' -m10 http://127.0.0.1/api/public/$p)"
done
echo "  public bundle: $(curl -s -m12 https://$DOMAIN/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)  (built: $BUNDLE)"
echo "  ERP intact: backend=$(ls backend/../backend/src/services/{sales,suppliers,operations,hajjops,communication}.service.ts 2>/dev/null | wc -l)/5"

say "DEPLOY COMPLETE — backup at $BK  (keep until you sign off)."
echo "  Rollback: git reset --hard \$(cat $BK/PRE_DEPLOY_HEAD.txt) ; prisma generate ; npm run build (be+fe) ; restart"
