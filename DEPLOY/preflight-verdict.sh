#!/usr/bin/env bash
# SM Travels — SELF-VERIFYING production preflight for feature/prod-cms-merge @ db5bc04
# READ-ONLY. Changes nothing (no checkout/reset/migrate/seed/build/restart/reload).
# Run on 200.141.8.183. It evaluates each check and prints a GO/NO-GO verdict.
cd /var/www/SMTravels 2>/dev/null || { echo "FATAL: /var/www/SMTravels not found"; exit 1; }
DOMAIN=smtravelsinternational.com
PASS=0; FAIL=0; WARN=0
p(){ printf '  [PASS] %s\n' "$*"; PASS=$((PASS+1)); }
f(){ printf '  [FAIL] %s\n' "$*"; FAIL=$((FAIL+1)); }
w(){ printf '  [WARN] %s\n' "$*"; WARN=$((WARN+1)); }
i(){ printf '  [info] %s\n' "$*"; }

echo "================= PRODUCTION PREFLIGHT REPORT ================="
echo "target branch: feature/prod-cms-merge   expected commit: db5bc04"

echo "----- TARGET IDENTITY -----"
IPS=$(hostname -I); HN=$(hostname)
i "hostname: $HN"; i "ips: $IPS"
echo "$IPS" | grep -qw 200.141.8.183 && p "running on 200.141.8.183" || f "NOT on 200.141.8.183 — wrong host"

echo "----- GIT BASE -----"
git fetch origin --quiet 2>/dev/null
HEAD=$(git rev-parse --short HEAD); BR=$(git branch --show-current)
i "branch: $BR   HEAD: $HEAD"
DIRTY=$(git status --porcelain | wc -l); i "uncommitted working-tree files: $DIRTY"
if git cat-file -e db5bc04 2>/dev/null; then
  if git merge-base --is-ancestor db5bc04 HEAD 2>/dev/null; then
    w "db5bc04 already in HEAD — target may already be on the merge (verify intent)"
  elif git merge-base --is-ancestor ecb53b2 HEAD 2>/dev/null; then
    p "HEAD contains the ecb53b2 base — additive analysis is valid"
  else
    f "HEAD does NOT contain ecb53b2 base — divergent target; STOP and report"
  fi
else
  f "db5bc04 not fetched — check origin/remote"
fi

echo "----- CHANGE SET  HEAD..db5bc04 -----"
DIFF=$(git diff --name-status HEAD..db5bc04)
NTOTAL=$(echo "$DIFF" | grep -c .); NDEL=$(echo "$DIFF" | grep -c '^D')
NSENS=$(echo "$DIFF" | awk '{print $2}' | grep -cE 'sales|suppliers|operations|hajjops|communication|\.env|(^|/)uploads/|nginx|systemd|(^|/)api/')
i "files changed: $NTOTAL"
[ "$NDEL" -eq 0 ] && p "zero file deletions" || { f "$NDEL file DELETION(s) — NOT additive"; echo "$DIFF" | grep '^D' | sed 's/^/      /'; }
[ "$NSENS" -eq 0 ] && p "no ERP / env / uploads / nginx / systemd / api files touched" || f "$NSENS sensitive file(s) touched — STOP"

echo "----- PRODUCTION DATA (preserve) -----"
for d in uploads api backups backend/tests .backup-passphrase backend/.env.production; do
  [ -e "$d" ] && i "present: $d ($(du -sh "$d" 2>/dev/null | cut -f1))" || w "absent: $d"
done

echo "----- MIGRATION SAFETY -----"
MS=$(npx --prefix backend prisma migrate status 2>&1)
CMS_PENDING=0
for m in 20260808000000_cms_nav_footer_fields 20260808010000_statistics_module 20260808020000_home_services 20260808030000_hero_module 20260808040000_home_sections; do
  echo "$MS" | grep -q "$m" && CMS_PENDING=$((CMS_PENDING+1))
done
for m in 20260727195133_hajj_umrah_ops 20260728155523_ops_team_roster 20260728165530_sales_quotations 20260729035035_sms_message_log; do
  [ -f "backend/prisma/migrations/$m/migration.sql" ] && : || w "ops migration file missing on disk: $m"
done
if echo "$MS" | grep -qiE 'drift|not in sync|failed|resolve'; then
  f "migrate status reports DRIFT/FAILED — STOP, do not deploy"; echo "$MS" | sed 's/^/      /'
elif echo "$MS" | grep -qi 'have not yet been applied'; then
  p "clean history; $CMS_PENDING/5 CMS migrations pending (migrate deploy would apply only these)"
elif echo "$MS" | grep -qi 'up to date'; then
  w "schema reports up to date — CMS migrations may ALREADY be applied (verify intent)"
else
  w "could not classify migrate status — inspect manually:"; echo "$MS" | sed 's/^/      /'
fi

echo "----- SERVICES / NGINX -----"
for s in nginx smtravels-api postgresql; do a=$(systemctl is-active $s 2>/dev/null); [ "$a" = active ] && p "$s active" || f "$s = $a"; done
ROOT=$(nginx -T 2>/dev/null | grep -A15 "server_name $DOMAIN" | grep -m1 root | tr -s ' ')
echo "$ROOT" | grep -q '/var/www/SMTravels/frontend/dist' && p "nginx root = /var/www/SMTravels/frontend/dist" || w "nginx root:$ROOT"

echo "----- BUNDLES / HEALTH -----"
LB=$(curl -s -m8 http://127.0.0.1/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)
PB=$(curl -s -m12 https://$DOMAIN/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)
i "local bundle:  ${LB:-none}"; i "public bundle: ${PB:-none}"
[ "$LB" = "$PB" ] && p "local and public serve the same bundle (origin = this box)" || w "local/public bundle differ"
H=$(curl -s -m10 https://$DOMAIN/api/health); echo "$H" | grep -q '"status":"ok"' && p "public /api/health ok" || f "health: $H"

echo "----- CMS API STATUS (pre-deploy) -----"
for pth in settings hero services statistics home-sections menus/MAIN_NAV menus/FOOTER_NAV; do
  c=$(curl -s -o /dev/null -w '%{http_code}' -m10 https://$DOMAIN/api/public/$pth); i "/api/public/$pth -> $c"
done
i "(hero/services/statistics/home-sections are EXPECTED 404 until deploy; settings/menus may already be 200)"

echo "----- ERP PRESERVATION (target source) -----"
BE=$(ls backend/src/services/{sales,suppliers,operations,hajjops,communication}.service.ts 2>/dev/null | wc -l)
FE=$(ls frontend/src/app/erp/{SalesModule,SuppliersModule,OperationsTeamModule,HajjOpsModule,SmsCenterModule}.tsx frontend/src/app/components/AiChatWidget.tsx 2>/dev/null | wc -l)
[ "$BE" -eq 5 ] && p "ERP backend modules present (5/5)" || f "ERP backend modules $BE/5"
[ "$FE" -eq 6 ] && p "ERP frontend modules present (6/6)" || f "ERP frontend modules $FE/6"

echo "=============================================================="
echo "SUMMARY: PASS=$PASS  FAIL=$FAIL  WARN=$WARN"
if [ "$FAIL" -eq 0 ]; then
  echo "VERDICT: GO for deployment (preflight clean). Deploy remains owner-authorized."
else
  echo "VERDICT: NO-GO — $FAIL blocking check(s) failed above. Do not deploy; report the FAIL lines."
fi
echo "NOTE: this script changed nothing. No checkout/migrate/seed/build/restart was performed."