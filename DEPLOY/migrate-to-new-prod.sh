#!/usr/bin/env bash
###############################################################################
# SM Travels — migrate verified latest build onto the canonical prod server.
#
#   SOURCE (dev/old):  187.77.144.38  srv1468666   (code already pushed to git)
#   TARGET (prod):     200.141.8.183  srv1868345   <-- RUN THIS SCRIPT HERE
#   DOMAIN:            https://smtravelsinternational.com  (Cloudflare -> target)
#   TARGET COMMIT:     127ada8  (branch feature/website-v2-redesign)
#
# SAFETY CONTRACT (enforced below):
#   * NEVER runs `prisma migrate reset` / drops / truncates.
#   * BACKS UP the target DB + app tree + nginx + systemd + env BEFORE changes.
#   * STOPS and reports if the Prisma migration history is divergent.
#   * Idempotent CMS seeds (upsert) only — no blind duplicate inserts.
#   * Two-phase: default run = AUDIT ONLY (read-only). Re-run with APPLY=1
#     to actually migrate.
#
# USAGE (on 200.141.8.183, as root):
#   1) git -C /var/www/SMTravels fetch origin && \
#      git -C /var/www/SMTravels checkout 127ada8   # or: pull the branch
#      # (or scp this file over and run it standalone)
#   2) bash DEPLOY/migrate-to-new-prod.sh            # AUDIT — read-only, no changes
#   3) APPLY=1 bash DEPLOY/migrate-to-new-prod.sh    # MIGRATE (after reviewing audit)
###############################################################################
set -euo pipefail

APP=/var/www/SMTravels
BE=$APP/backend
FE=$APP/frontend
TARGET_COMMIT=127ada8
EXPECT_IP=200.141.8.183
DOMAIN=smtravelsinternational.com
APIPORT=4030
STAMP=$(date +%Y%m%d-%H%M)
BK=/root/smtravels-pre-migration-$STAMP
APPLY=${APPLY:-0}

say(){ printf '\n\033[1;36m== %s\033[0m\n' "$*"; }
ok(){  printf '  \033[32m✔\033[0m %s\n' "$*"; }
warn(){ printf '  \033[33m!\033[0m %s\n' "$*"; }
die(){ printf '\n\033[31m✖ STOP: %s\033[0m\n' "$*" >&2; exit 1; }

###############################################################################
say "PHASE 0 — AUDIT TARGET (read-only)"
HN=$(hostname); IP=$(hostname -I | tr ' ' '\n' | grep -E '^200\.141\.8\.183$' || true)
echo "  hostname : $HN"
echo "  IPs      : $(hostname -I)"
[ -n "$IP" ] || die "This host is NOT 200.141.8.183 (found: $(hostname -I)). Refusing to run on the wrong box."
ok "confirmed running on $EXPECT_IP"
echo "  disk:"; df -h / | sed 's/^/    /'
echo "  mem :"; free -h | sed 's/^/    /'
for u in nginx postgresql smtravels-api; do
  printf '  %-16s %s\n' "$u" "$(systemctl is-active "$u" 2>/dev/null || echo 'n/a')"
done
[ -d "$APP" ] || die "$APP does not exist on target — clone the repo first."
echo "  --- git state ($APP) ---"
git -C "$APP" rev-parse --short HEAD 2>/dev/null | sed 's/^/    HEAD: /' || warn "not a git repo"
git -C "$APP" branch --show-current 2>/dev/null | sed 's/^/    branch: /' || true
DIRTY=$(git -C "$APP" status --porcelain 2>/dev/null | wc -l); echo "    uncommitted files: $DIRTY"
echo "  --- served bundle now ---"
curl -s -m8 "http://127.0.0.1/" 2>/dev/null | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1 | sed 's/^/    local nginx: /' || true
echo "  --- prisma migrate status ---"
( cd "$BE" && npx --no-install prisma migrate status 2>&1 | sed 's/^/    /' ) || warn "migrate status returned non-zero (inspect above)"

if [ "$APPLY" != "1" ]; then
  say "AUDIT COMPLETE — no changes made."
  echo "  Review the above. If the target is healthy and migration history is NOT divergent,"
  echo "  re-run to migrate:   APPLY=1 bash DEPLOY/migrate-to-new-prod.sh"
  exit 0
fi

###############################################################################
say "PHASE 1 — BACKUP TARGET  ->  $BK"
mkdir -p "$BK"
# DB dump (reads DATABASE_URL from target's own env — never printed)
set -a; [ -f "$APP/.env.production" ] && . "$APP/.env.production"; [ -f "$BE/.env.production" ] && . "$BE/.env.production"; set +a
[ -n "${DATABASE_URL:-}" ] || die "DATABASE_URL not found in target env — cannot safely back up DB."
pg_dump "$DATABASE_URL" > "$BK/db.sql" && ok "DB dump -> $BK/db.sql ($(du -h "$BK/db.sql"|cut -f1))"
tar czf "$BK/app-tree.tgz" -C "$(dirname "$APP")" "$(basename "$APP")" --exclude='*/node_modules' --exclude='*/.git' 2>/dev/null && ok "app tree archived"
[ -d "$FE/dist" ]   && cp -a "$FE/dist"   "$BK/frontend-dist"   && ok "frontend/dist backed up"
[ -d "$BE/dist" ]   && cp -a "$BE/dist"   "$BK/backend-dist"    && ok "backend/dist backed up"
cp -a /etc/nginx/sites-available "$BK/nginx-sites-available" 2>/dev/null && ok "nginx config backed up"
cp -a /etc/systemd/system/smtravels-api.service "$BK/" 2>/dev/null && ok "systemd unit backed up"
cp -a "$APP/.env.production" "$BK/env.production.bak" 2>/dev/null && chmod 600 "$BK/env.production.bak" && ok "env backed up (0600)"
git -C "$APP" rev-parse HEAD > "$BK/PRE_MIGRATION_HEAD.txt" 2>/dev/null || true

###############################################################################
say "PHASE 2 — FETCH VERIFIED CODE ($TARGET_COMMIT)"
git -C "$APP" fetch origin --tags
# stash any prod-local edits into the backup rather than losing them
if [ "$(git -C "$APP" status --porcelain | wc -l)" -gt 0 ]; then
  git -C "$APP" stash push -u -m "pre-migration-$STAMP" && warn "local changes stashed (recover via 'git stash list')"
fi
git -C "$APP" checkout "$TARGET_COMMIT"
ok "checked out $(git -C "$APP" rev-parse --short HEAD)"

###############################################################################
say "PHASE 3 — DATABASE (additive only, divergence-guarded)"
cd "$BE"
npm ci
npx prisma generate
# Guard: refuse to proceed on a divergent / failed history.
STAT=$(npx prisma migrate status 2>&1 || true)
echo "$STAT" | sed 's/^/    /'
if echo "$STAT" | grep -qiE 'drift|failed|reset'; then
  die "Migration history is DIVERGENT / has a failed migration on the target. Do NOT force. Investigate manually, then apply the 5 additive CMS migrations by hand. Backup is at $BK."
fi
# Clean case: only additive pending migrations -> deploy (never resets).
npx prisma migrate deploy
ok "prisma migrate deploy complete (additive)"

###############################################################################
say "PHASE 4 — BUILD BACKEND"
npm run build
ok "backend built"

say "PHASE 5 — BUILD FRONTEND"
cd "$FE"
npm ci
npm run build
BUNDLE=$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' dist/index.html | head -1)
echo "    new bundle: $BUNDLE"
MISS=0
for m in /public/hero /public/services /public/statistics /public/home-sections /public/settings QUICK_LINKS; do
  if grep -qF "$m" "dist${BUNDLE}"; then ok "marker $m"; else warn "marker MISSING: $m"; MISS=1; fi
done
[ "$MISS" = 0 ] || die "New frontend bundle is missing CMS markers — build is not the verified one. Aborting before restart."

###############################################################################
say "PHASE 6 — SEED CMS (idempotent upserts)"
cd "$BE"
npm run seed:nav
npm run seed:home
ok "nav/footer + home CMS seeds applied (idempotent)"

###############################################################################
say "PHASE 7 — RESTART SERVICES"
systemctl restart smtravels-api
sleep 3
nginx -t && systemctl reload nginx
ok "smtravels-api restarted; nginx reloaded"

###############################################################################
say "PHASE 8 — VERIFY"
echo "  local health : $(curl -s -m8 http://127.0.0.1:$APIPORT/api/health)"
echo "  public health: $(curl -s -m12 https://$DOMAIN/api/health)"
echo "  public bundle: $(curl -s -m12 https://$DOMAIN/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)  (expect $BUNDLE)"
echo "  direct-origin: $(curl -sk -m12 --resolve $DOMAIN:443:$EXPECT_IP https://$DOMAIN/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)"
for p in / /erp /login /register /portal /agent /customer \
         /api/public/hero /api/public/services /api/public/statistics /api/public/home-sections \
         /api/public/settings /api/public/menus/MAIN_NAV /api/public/packages /api/public/blog \
         /api/public/faqs /api/public/gallery /api/public/testimonials /api/public/banners; do
  printf '  %-34s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' -m10 "https://$DOMAIN$p")"
done
say "PHASE 9 — NO DEPENDENCY ON OLD BOX"
grep -RIl "187.77.144.38\|srv1468666" "$APP" /etc/nginx /etc/systemd/system /etc/cron* 2>/dev/null | sed 's/^/    ref: /' || ok "no reference to old box found"

say "MIGRATION SCRIPT FINISHED"
echo "  Backup retained at: $BK  (do NOT delete until you sign off GO)"
echo "  If anything is wrong, rollback: restore \$BK/env, checkout \$BK/PRE_MIGRATION_HEAD.txt, restore db.sql, rebuild."
