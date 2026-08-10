# SM Travels ERP — Completion Program Deployment Runbook

**Owner-run only.** Claude's shell (`187.77.144.38` / srv1468666) **cannot** reach
production and never deploys. This is the exact, ordered procedure to ship
`feature/prod-cms-merge @ 4f50ac1` to production **`200.141.8.183`** (srv1868345).

> Nothing here has been run against production. Every step is backup-first and
> reversible. Follow the order — the RBAC seed ordering is not optional.

---

## 0. Pre-flight (read-only, GO/NO-GO)

```bash
cd /var/www/SMTravels
hostname -I | grep -q 200.141.8.183 || { echo "WRONG HOST — abort"; exit 1; }
bash DEPLOY/preflight-verdict.sh          # existing self-verifying GO/NO-GO probe
git fetch origin && git log --oneline -1 origin/feature/prod-cms-merge   # expect 4f50ac1
```

Confirm the working tree has **no tracked local changes** (untracked prod-only
paths — `uploads/`, `api/`, `backups/`, `backend/.env.production`, `.backup-passphrase`
— are expected and must be preserved; never `git clean`/`stash`).

---

## 1. Backup first (hard gate)

```bash
bash deploy/smtravels-backup.sh           # full DB dump + verify non-empty
git rev-parse HEAD > /root/PRE_DEPLOY_HEAD.txt   # rollback anchor
```

Do not proceed unless the dump exists and is non-empty.

## 2. Fetch + switch code

```bash
git checkout feature/prod-cms-merge && git pull --ff-only origin feature/prod-cms-merge
```

## 3. Install dependencies

```bash
cd backend  && npm ci
cd ../frontend && npm ci
```

No new runtime dependencies were introduced by the completion program — it reuses
`@prisma/client`, `express`, `zod` (and `tsx` for seeds/tests). `npm ci` installs
exactly `package-lock.json`.

## 4. Apply migrations — **9 additive** (expected pending)

The completion program adds these on top of the CMS set. All are
`CREATE TABLE IF NOT EXISTS` + idempotent FK blocks — **zero destructive statements.**

```
20260810000000_exchange_rate            20260810050000_manpower_candidate
20260810010000_business_partner         20260810060000_manpower_medical_bmet
20260810020000_mufti_scholar            20260810070000_manpower_visa_deployment
20260810030000_payroll                  20260810080000_custom_package
20260810040000_manpower_foundation
```

```bash
cd backend
./node_modules/.bin/prisma migrate status   # verify: exactly these pending, NO drift/failed
npm run prisma:migrate                       # prisma migrate deploy  (backup already taken)
```

If `migrate status` reports drift or a failed migration, **stop** and
`git reset --hard $(cat /root/PRE_DEPLOY_HEAD.txt)` — the DB was not modified.

## 5. RBAC seed — **before anything serves the new routes** {#rbac}

```bash
cd backend && npm run seed:rbac
```

`seed:rbac` is **idempotent + additive** (production-safe): it upserts only the 4
new permissions and their role grants, touching no existing permission, role, or
demo data. **This must run before the app restarts.** Until these `RolePermission`
rows exist, the dedicated module keys have no grants and *every* role — admins
included — gets **403** on `manpower` / `payroll` / `currency` / `business_network`.

## 6. Build

```bash
cd backend  && npm run build      # tsc → dist/  (test files excluded)
cd ../frontend && npm run build   # vite → served bundle
```

## 7. Restart the API + serve the frontend

Restart per the box's process manager (PM2/systemd — as configured on srv1868345).
Frontend is static output; no API restart needed for a frontend-only change, but a
full deploy restarts the API so the new routes load.

## 8. Post-deploy smoke (owner)

- Log in as an **admin** → the new nav groups (Manpower, Payroll, Currency,
  Companies/Scholars, Packages → Custom/Inquiries/Quotes) load with data.
- Log in as a role **without** payroll access → confirm a direct
  `GET /api/payroll/...` returns **403** (not just a hidden menu).
- Create one Currency rate, one Job Order, one Custom Package quote → totals compute.

---

## Rollback

Code: `git reset --hard $(cat /root/PRE_DEPLOY_HEAD.txt)` then rebuild + restart.
Data: the migrations are additive (new tables only) — a rollback of code leaves the
new tables unused and harmless. If a full DB restore is required, use
`deploy/smtravels-restore.sh` with the dump from step 1.

## RBAC reference (final keys)

| Module key | Replaced (interim) | Guard | Roles with access (view/full) |
|---|---|---|---|
| `manpower` | `bookings` | `requirePermission("manpower", view\|manage)` | admins full; BranchMgr/Staff/Sales/Visa/Hajj/Umrah/Agent full; Accountant view |
| `payroll` | `settings` | `requirePermission("payroll", …)` | admins + BranchMgr + Accountant full |
| `currency` | `settings` | `requirePermission("currency", …)` | admins + Accountant full; BranchMgr view |
| `business_network` | `partners` | `requirePermission("business_network", …)` | admins + BranchMgr full; Sales view |

`view` passes on access `view`|`full`; `manage` requires `full`; missing/`none` → 403.
