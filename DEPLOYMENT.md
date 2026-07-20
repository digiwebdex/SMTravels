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
cd /f/Projects/SMTravels/frontend && npm install && npm run build   # -> frontend/dist
cd /f/Projects/SMTravels/backend  && npm install && npm run build   # tsc -> backend/dist
# backend/package.json MUST list `prisma` AND `@prisma/client` in "dependencies"
# (not devDependencies) so `npm ci --omit=dev` provides the CLI on the server.
```

## Deploy (local, Git Bash)
```bash
cd /f/Projects/SMTravels
bash deploy-smtravels.sh --dry-run    # validate paths + preview, changes nothing
bash deploy-smtravels.sh              # rsync/tar artifacts, npm ci --omit=dev, prisma migrate, restart
```
- Path form is `/f/Projects/SMTravels` (Git Bash). NOT `F:\...`, NOT `/mnt/f/...`.
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

## Node version policy
- **Backend REQUIRES Node 22** — the server runs `/usr/bin/node` = v22.x, and the systemd unit + `npm ci` must match. `.nvmrc`/`.node-version` at the repo root pin `22`. Locally: `fnm use 22` (or `fnm exec --using 22 -- <cmd>`) so `node -v` shows 22 **before** `npm install` in `backend/`.
- **Frontend builds on either** Node 22 or 24 — static Vite output is version-agnostic (`engines: >=22`).

## Backend (`backend/`) — Express + Prisma + TypeScript
- Entrypoint `src/main.ts` → `tsc` → **`dist/main.js`** (matches the systemd unit's `ExecStart`). Binds **127.0.0.1:4030 only** (never 0.0.0.0).
- `prisma` **and** `@prisma/client` are in **dependencies** so `npm ci --omit=dev` + `prisma migrate deploy` work on the server.
- Middleware: helmet · cors (`CORS_ORIGIN`) · compression · express-rate-limit · pino (pino-http + `x-request-id`) · zod validation · centralized error handler. Graceful shutdown on SIGTERM.
- `GET /api/health` → 200 `{status, version, uptime, ...}` — the deploy script health-checks this after a backend deploy.
- Scripts: `dev` (tsx watch) · `build` (tsc) · `start` · `typecheck` · `prisma:migrate` · `prisma:seed`.

### Local backend dev (Windows)
```
fnm install 22 && fnm use 22           # node -v must show v22 BEFORE installing
cd backend && npm install && npx prisma generate && npm run dev
```
Local PostgreSQL (do NOT use the production DB). Simplest options:
- **Native (no Docker):** `winget install PostgreSQL.PostgreSQL`, then in `psql -U postgres`:
  `CREATE USER smtravels_user WITH PASSWORD 'devpassword'; CREATE DATABASE smtravels_db OWNER smtravels_user;`
- **Docker Desktop (if installed):**
  `docker run --name smtravels-pg -e POSTGRES_USER=smtravels_user -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=smtravels_db -p 5432:5432 -d postgres:16`

Local `DATABASE_URL` (already set in `backend/.env`):
`postgresql://smtravels_user:devpassword@localhost:5432/smtravels_db?schema=public`

The **server's** `DATABASE_URL` lives in `/var/www/SMTravels/.env.production` (native PG :5440, db `smtravels_db`) — never connect to it from your machine.

## Raw SQL in migrations — DO NOT let these get dropped
Some invariants can't be expressed in `schema.prisma`, so they live as hand-written SQL
inside ordinary Prisma migrations. They **are** applied by `prisma migrate deploy` (the
server path — verified locally). But:

> ⚠️ `prisma db push` and `prisma migrate reset` BYPASS/WIPE them.
> `db push` syncs the schema directly and never runs migration SQL → the triggers and
> partial indexes silently vanish. On the server use **only** `prisma migrate deploy`
> (the deploy script already does). Never `db push`/`reset` against a real DB.

- `backend/prisma/migrations/20260720181300_partial_unique_and_blind_indexes/migration.sql`
  - **Partial unique indexes** (`WHERE deleted_at IS NULL`) on natural keys (user email,
    customer email/phone, invoice_no, booking_no, package code/slug, agent/supplier code,
    promo code, cms/blog slugs) — so a soft-deleted row doesn't block re-registration.
  - **Blind-index** lookup indexes on the HMAC hash columns (customer NID/passport, agent
    NID, traveler passport, user NID) — exact-match lookup of encrypted PII.
- `backend/prisma/migrations/20260720181400_journal_balance_trigger/migration.sql`
  - **Deferred constraint trigger**: every POSTED journal entry must balance
    (Σdebits = Σcredits) and have ≥1 line — enforced at COMMIT, on every write path.

**PII columns** (`Traveler/Customer/Agent/User/Document` passport/NID) store AES-256-GCM
**ciphertext** (`src/lib/pii.ts`). The app **fails to start** without `PII_KEK_CURRENT_ID`,
`PII_KEK_<id>`, `PII_INDEX_KEY` — set these in `/var/www/SMTravels/.env.production`
alongside `DATABASE_URL`. The gapless-numbering allocator and the
`baseAmount = amount × exchangeRate` money invariant live in the service layer.

See `SCHEMA_DECISIONS.md` for the full rationale and UI-ambiguity log.
