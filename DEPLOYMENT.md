# SMTravels — Deployment & Ops

Temporary domain: **smtravels.digiwebdex.com** (a main domain replaces it later — see "Domain: one place" below).

## Architecture (NO Docker — deliberate; the VPS is disk/RAM constrained)
- **Frontend**: Vite + React 18 + React Router 7 SPA. Built **locally**, uploaded as static `dist/`. Served directly by nginx. No port, no process.
- **Backend**: Node + Express + TypeScript + Prisma. Bare Node under **systemd** (`smtravels-api.service`), bound to **127.0.0.1:4030 only**.
- **DB**: isolated `smtravels_db` / `smtravels_user` on the existing native PostgreSQL 16 at `127.0.0.1:5440`. Enforced by a `pg_hba.conf` block scoped to `smtravels_user` (can reach only `smtravels_db`).
- **Web**: one nginx vhost `/etc/nginx/sites-available/smtravels.digiwebdex.com`.

## ⚠️ Node runtime is SHARED
The systemd unit uses the system Node at `/usr/bin/node` (**currently v22.22.2**), shared with ~other projects on the box. Node 20 was dropped from the spec (EOL April 2026).
- Put `"engines": { "node": ">=22" }` in `backend/package.json`.
- **Risk**: if another project upgrades `/usr/bin/node` to something incompatible, `smtravels-api` can break. **Fallback**: install a private Node via `fnm`/`nvm` for the `deploy` user and point `ExecStart` at that absolute path.

## Domain: one place per config
- Backend: `.env.production` → `APP_DOMAIN` / `PUBLIC_ORIGIN` (top of file).
- nginx: `sites-available/smtravels.digiwebdex.com` → the single `server_name` line (marked with a banner comment) + certbot-managed `ssl_certificate` paths.

## First build (local, Git Bash)
After restructuring the Figma export into `frontend/` + `backend/`:
```bash
cd /f/Download/SMTravels/frontend && npm install && npm run build   # -> frontend/dist
cd /f/Download/SMTravels/backend  && npm install && npm run build   # tsc -> backend/dist
# backend/package.json MUST list `prisma` AND `@prisma/client` in "dependencies"
# (not devDependencies) so `npm ci --omit=dev` provides the CLI on the server.
```

## Deploy (local, Git Bash)
```bash
cd /f/Download/SMTravels
bash deploy-smtravels.sh --dry-run    # validate paths + preview, changes nothing
bash deploy-smtravels.sh              # rsync/tar artifacts, npm ci --omit=dev, prisma migrate, restart
```
- Path form is `/f/Download/SMTravels` (Git Bash). NOT `F:\...`, NOT `/mnt/f/...`.
- Optional, for a true server-diff dry-run + delta transfer: `choco install rsync -y` (admin PowerShell). The script auto-detects it.
- Fails loudly if any `dist/` is missing/empty. `--delete` is scoped to `frontend/dist`, `backend/dist`, `backend/prisma`; `uploads/`, `backups/`, `.env*` are always excluded.

## Install the systemd service (ONLY after the first successful backend deploy)
```bash
# on the server (as root):
cp /var/www/SMTravels/deploy/smtravels-api.service /etc/systemd/system/
# adjust ExecStart entrypoint if your build output isn't dist/main.js
systemctl daemon-reload
systemctl enable --now smtravels-api.service
systemctl status smtravels-api.service
ss -tulpn | grep 4030        # MUST be 127.0.0.1:4030, never 0.0.0.0

# let the deploy user restart just this one service (narrow sudoers):
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart smtravels-api.service, /usr/bin/systemctl status smtravels-api.service' \
  > /etc/sudoers.d/91-smtravels-deploy && chmod 440 /etc/sudoers.d/91-smtravels-deploy && visudo -cf /etc/sudoers.d/91-smtravels-deploy
```

## Server paths
```
/var/www/SMTravels/frontend/dist   nginx root (static SPA)
/var/www/SMTravels/backend         Node app (dist/, prisma/, node_modules/, package*.json)
/var/www/SMTravels/uploads         passports/visas — OUTSIDE web root, nginx denies direct access
/var/www/SMTravels/backups         DB backups (smtravels_db only)
/var/www/SMTravels/.env.production chmod 600
/var/www/SMTravels/deploy/         systemd unit template
```
