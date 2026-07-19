#!/usr/bin/env bash
#
#  SMTravels — deploy build artifacts from local Windows (Git Bash) to the VPS.
#  Frontend  : static, served directly by nginx  (no port, no process)
#  Backend   : bare Node under systemd, 127.0.0.1:4030  (Step 3)
#
#  RUN FROM GIT BASH (mintty). Path form is /f/Projects/SMTravels  (NOT F:\...  NOT /mnt/f/...)
#
#     bash deploy-smtravels.sh --dry-run     # validate paths + show the plan, change NOTHING
#     bash deploy-smtravels.sh               # real deploy
#
#  Local requirements : ssh, tar   (rsync OPTIONAL but recommended -> `choco install rsync -y`)
#  Transfer method    : uses local rsync if present (true server-diff dry-run + delta);
#                       otherwise tar-over-ssh into a staging dir + the SERVER's rsync --delete.
#
#  This script REFUSES to deploy an empty/missing build (no "rsync nothing, report success").
#
set -euo pipefail

# ==========================  CONFIG — EDIT HERE ONLY  ==========================
#  >>> Target host: the ONE place to change when the real domain/host replaces the temp one <<<
SSH_HOST="187.77.144.38"
SSH_USER="deploy"
SSH_KEY="$HOME/.ssh/smtravels_deploy"        # Git Bash form, e.g. /c/Users/DBL/.ssh/smtravels_deploy
REMOTE_BASE="/var/www/SMTravels"

#  Local source ROOT — Git Bash path form of  F:\Download\SMTravels
LOCAL_ROOT="/f/Projects/SMTravels"

#  Post-deploy backend install/migrate on the server (safe before Step 3 exists).
RUN_BACKEND_INSTALL=1
SERVICE_NAME="smtravels-api.service"
# ==============================================================================

# ------------------------------------------------------------------ args
DRY=0
case "${1:-}" in
  --dry-run) DRY=1 ;;
  "")        : ;;
  *)         echo "Unknown argument: '$1'  (use --dry-run, or no argument for a real deploy)"; exit 2 ;;
esac

# ------------------------------------------------------------------ helpers
SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)
rsh(){ ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "$@"; }
die(){ printf '\n\033[1;31mDEPLOY ABORTED:\033[0m %s\n' "$*" >&2; exit 1; }
say(){ printf '\033[1;36m>> %s\033[0m\n' "$*"; }
ok(){  printf '\033[32m   ok:\033[0m %s\n' "$*"; }

# FINAL intended structure (script is a template against this, even if it doesn't exist yet)
FE_DIST="$LOCAL_ROOT/frontend/dist"
BE_DIR="$LOCAL_ROOT/backend"
BE_DIST="$BE_DIR/dist"

nonempty(){ [ -d "$1" ] && [ -n "$(ls -A "$1" 2>/dev/null)" ]; }

# ------------------------------------------------------------------ preflight (fail LOUD)
say "Preflight (dry-run=$DRY)"
[ -d "$LOCAL_ROOT" ] || die "LOCAL_ROOT not found: '$LOCAL_ROOT'. In Git Bash the path must be /f/Projects/SMTravels (NOT F:\\... and NOT /mnt/f/... which is WSL)."
[ -e "$SSH_KEY" ]    || die "SSH key not found: '$SSH_KEY'."

nonempty "$FE_DIST"              || die "frontend build missing/empty: '$FE_DIST'  — build the frontend first (Vite -> frontend/dist/)."
[ -f "$FE_DIST/index.html" ]     || die "'$FE_DIST/index.html' not found — that is not a valid Vite build output."
nonempty "$BE_DIST"              || die "backend build missing/empty: '$BE_DIST'  — build the backend first (tsc -> backend/dist/)."
[ -f "$BE_DIR/package.json" ]      || die "'$BE_DIR/package.json' missing."
[ -f "$BE_DIR/package-lock.json" ] || die "'$BE_DIR/package-lock.json' missing (npm ci requires it)."
[ -d "$BE_DIR/prisma" ]            || die "'$BE_DIR/prisma' missing."
ok "local artifacts present: frontend/dist (+index.html), backend/dist, package.json, package-lock.json, prisma/"

command -v ssh >/dev/null || die "ssh not found in PATH."
command -v tar >/dev/null || die "tar not found in PATH."
rsh true || die "cannot SSH to ${SSH_USER}@${SSH_HOST} with key '$SSH_KEY'."
ok "ssh ${SSH_USER}@${SSH_HOST} works"

if command -v rsync >/dev/null 2>&1; then METHOD=rsync; else METHOD=tar; fi
if [ "$METHOD" = tar ]; then
  rsh 'command -v rsync >/dev/null 2>&1' \
    || die "No local rsync AND no server rsync — cannot do a scoped --delete mirror. Install rsync locally: choco install rsync -y"
  say "local rsync not found -> using tar-over-ssh + server-side rsync. (For a true server-diff dry-run: choco install rsync -y)"
fi
say "Transfer method: $METHOD"

# excludes: never let a mirror touch persistent data
EXC=(--exclude 'uploads' --exclude 'uploads/' --exclude 'backups' --exclude 'backups/' --exclude '.env.production' --exclude '.env')

# ------------------------------------------------------------------ mirror_dir SRC SUBPATH
#   Mirrors SRC -> $REMOTE_BASE/SUBPATH with --delete SCOPED to that subpath only (never the parent).
mirror_dir(){
  local src="$1" sub="$2" dest="$REMOTE_BASE/$2"
  say "mirror  ${src}/  ->  ${dest}/   (--delete scoped to '${sub}')"
  if [ "$METHOD" = rsync ]; then
    local nflag=(); [ "$DRY" = 1 ] && nflag=(-n -v)
    rsync -az --delete "${EXC[@]}" "${nflag[@]}" -e "ssh ${SSH_OPTS[*]}" "$src/" "${SSH_USER}@${SSH_HOST}:$dest/"
  else
    local stage="$REMOTE_BASE/.stage/$sub"
    if [ "$DRY" = 1 ]; then
      echo "   [dry-run] would upload $(find "$src" -type f | wc -l | tr -d ' ') files (~$(du -sh "$src" 2>/dev/null | cut -f1)); then on server: rsync -a --delete <stage>/ ${dest}/"
      ( cd "$src" && find . -type f | sed 's/^/       + /' | head -40 )
      local n; n=$(cd "$src" && find . -type f | wc -l | tr -d ' '); [ "$n" -gt 40 ] && echo "       ... (+$((n-40)) more)"
    else
      rsh "rm -rf '$stage' && mkdir -p '$stage'"
      tar -C "$src" -czf - . | rsh "tar -C '$stage' -xzf -"
      rsh "mkdir -p '$dest' && rsync -a --delete ${EXC[*]} '$stage/' '$dest/' && rm -rf '$stage'"
      ok "mirrored '$sub'"
    fi
  fi
}

# ------------------------------------------------------------------ put_files SUBDIR FILE...
#   Copies specific files (relative to backend/) into $REMOTE_BASE/SUBDIR. NO --delete (keeps node_modules).
put_files(){
  local sub="$1"; shift; local dest="$REMOTE_BASE/$sub"
  say "copy    $*  ->  ${dest}/   (no delete)"
  if [ "$DRY" = 1 ]; then echo "   [dry-run] would copy: $*"; return 0; fi
  if [ "$METHOD" = rsync ]; then
    local f srcs=(); for f in "$@"; do srcs+=("$BE_DIR/$f"); done
    rsync -az -e "ssh ${SSH_OPTS[*]}" "${srcs[@]}" "${SSH_USER}@${SSH_HOST}:$dest/"
  else
    tar -C "$BE_DIR" -czf - "$@" | rsh "mkdir -p '$dest' && tar -C '$dest' -xzf -"
  fi
  ok "copied into '$sub'"
}

# ==================================  DEPLOY  ==================================
mirror_dir "$FE_DIST"        "frontend/dist"     # static SPA -> nginx root
mirror_dir "$BE_DIST"        "backend/dist"      # compiled backend
mirror_dir "$BE_DIR/prisma"  "backend/prisma"    # schema + migrations
put_files  "backend"         "package.json" "package-lock.json"

if [ "$DRY" = 1 ]; then
  say "DRY-RUN complete — the server was NOT modified."
  exit 0
fi

# ------------------------------------------------------------------ post-deploy (on server, as deploy)
if [ "$RUN_BACKEND_INSTALL" = 1 ]; then
  say "backend: npm ci --omit=dev  (+ prisma migrate/generate if prisma CLI is in prod deps)"
  rsh "set -e; cd '$REMOTE_BASE/backend'
       echo '   server node:' \$(node -v)
       npm ci --omit=dev
       if [ -x node_modules/.bin/prisma ]; then
         node_modules/.bin/prisma migrate deploy
         node_modules/.bin/prisma generate
       else
         echo '   WARNING: prisma CLI not installed by --omit=dev. Put \"prisma\" in dependencies (not devDependencies) so migrate/generate can run on the server.'
       fi"
  ok "backend deps installed"
fi

say "restart ${SERVICE_NAME} if installed (Step 3 installs it + a narrow sudoers rule)"
rsh "if systemctl list-unit-files 2>/dev/null | grep -q '^${SERVICE_NAME}'; then
       sudo -n systemctl restart '${SERVICE_NAME}' 2>/dev/null && echo '   restarted ${SERVICE_NAME}' || echo '   NOTE: could not restart (needs the Step-3 scoped sudoers). Restart as root: systemctl restart ${SERVICE_NAME}'
     else
       echo '   (${SERVICE_NAME} not installed yet — skipping restart)'
     fi"

say "DEPLOY COMPLETE."
