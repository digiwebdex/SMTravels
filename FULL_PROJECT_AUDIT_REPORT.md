# SM Travels — Full-Project Audit + Fixes (2026-08-08)

Four parallel read-only auditors covered **frontend/CMS**, **backend/transaction system**, **security**, and **ops/config/data**. Below: overall verdict, what I **fixed + verified**, and what remains as **owner action** (with exact fixes). Honest constraint: I audited code/APIs/data/config; I **could not click-test the UI** (no browser here), so runtime UI issues are found only where visible in code.

## Overall verdict
- **Security posture: SOUND.** No Critical/High exploitable issues; no SQL-injection surface (zero `$queryRawUnsafe`); every ERP route enforces `requireAuth` + `requirePermission`; JWT/refresh rotation with reuse-detection; scrypt passwords + lockout; PII encrypted. Only 3 LOW hardening items.
- **Transaction/money system: STRUCTURALLY SOUND + above average** — atomic `$transaction` around every multi-write, gapless `FOR UPDATE`-locked numbering, immutable journal ledger, `round4` money invariant. **Money-smoke test passes all 4 scenarios.** A few real integrity edges (fixed/flagged below).
- **Data: CLEAN** — populated, zero orphaned FKs.
- **Runtime: CLEAN** — 16h uptime, no exceptions in logs.
- Real problems were mostly **process/deploy hygiene** (uncommitted work, migration divergence, a shadowed route) — now addressed.

---

## ✅ Fixed and verified this session

| # | Severity | Area | Fix | Verification |
|---|---|---|---|---|
| 1 | **HIGH** | security/perf | `/public/settings` was a fail-open dump (any/all groups). Restricted to an **allow-list** of public groups (company/footer/social/newsletter/announcement/stats). | `?group=secrets` → `{}`; `?group=company` → 18 keys ✔ |
| 2 | **HIGH** | finance | Overpayment guard was read **before** the tx and never re-checked. Added a `SELECT … FOR UPDATE` **re-assert inside the payment tx** (payment.service.ts). | **money-smoke 4/4 PASS** (payment, installments, refund+ledger, commission+wallet) ✔ |
| 3 | **HIGH** | ops/deploy | Entire Phase 2.x CMS + PWA work was **uncommitted** (a `git clean` would destroy it, incl. migrations). **Committed + pushed** (`127ada8` → origin). | `git status` → 0 uncommitted ✔ |
| 4 | **HIGH** | ops/nginx | `/packages` SPA route was **shadowed by the `dist/packages/` image dir** → 403 dead nav link. Added exact-match `location = /packages { try_files /index.html =404; }`. | `/packages` → **200** (was 403); `/packages/:id` → 200 ✔ |
| 5 | MEDIUM | perf/DoS | Unbounded `findMany` on public list endpoints (statistics/services/home-sections/faqs/testimonials/gallery). Added `take` caps. | backend build exit 0 ✔ |
| 6 | MEDIUM | frontend | Dead controls: Auth **Terms/Privacy** `href="#"` → real `/terms` `/privacy`; Contact **social** links wired to CMS `social.*` settings; Knowledge **PDF** button `disabled`. | frontend build exit 0 ✔ |
| 7 | Low | frontend | Knowledge `0`-render bug (`{len \|\| len} &&`) → boolean coercion. | build exit 0 ✔ |
| 8 | MEDIUM | migrations | 5 CMS migrations applied via DDL but unrecorded (diverged history). **`prisma migrate resolve --applied`** for all 5. | `migrate status` → **"Database schema is up to date!"** ✔ |

Site integrity re-verified after all changes: `/ /erp /login /portal /agent /customer` + `/api/health` → 200; auth alive.

---

## ⚠️ Remaining — OWNER ACTION (not fixed; exact fixes given)

### Finance (need a design decision + money-smoke re-test before I touch core money logic)
- **MEDIUM-HIGH — `booking.paidAmount` double-count** (`booking.service.ts:348,383,483`): booking "paid" is written directly with no Payment/Receipt/Income row; a later real payment then *increments* it again. **Fix:** make booking `paidAmount` read-only from the payment side; route any confirm-time down-payment through `recordPayment`.
- **MEDIUM-HIGH — wallet clawback silently dropped** (`finance.effects.ts:379-401`): on refund, `Math.max(0, balance-amount)` clamps a clawback if the agent already withdrew, so `wallet.balance` ≠ Σ transactions. **Fix:** allow a negative balance / post a receivable instead of clamping.
- **MEDIUM — Income voided by string-match** (no `paymentId` FK): fragile. **Fix:** add `Income.paymentId` (additive migration) and void by FK. Also decide whether a processed refund re-opens the invoice.
- **MEDIUM (info) — money math in JS float** then `round4`→Decimal: safe for BDT amounts today; optional to move to end-to-end `Prisma.Decimal`.

### Security hardening (LOW)
- `NODE_ENV` defaults to `"development"` (`lib/env.ts`) — mitigated by the prod env file, but should default to `"production"`.
- Dev CORS origins (`localhost:5173/4173`) are trusted even in prod (`app.ts`) — gate behind non-prod.

### Secrets / config
- **`.env.production` holds plaintext `SMTP_PASS` (Gmail app password) + `PII_KEK_1`** (file is 0600). **Rotate the Gmail app password** and move the PII KEK to a secrets manager. (I can't rotate your Google credential from here.)
- Prune the leftover `smtravels.digiwebdex.com` nginx vhost; retire/label the divergent second source tree at `/root/smtravels-src` (declare `/var/www/SMTravels` authoritative).

### Content / product decisions
- **i18n:** the whole **About page** body + `PackageCard`/`GuideCard`/"seats left" render English even in Bangla mode — needs the strings moved into the `bn/en` i18n namespaces (a content task).
- **"Insurance" nav / "Travel Insurance" card → `/faq`** (no insurance page) — point to a real route or remove.
- **Homepage newsletter** submit is client-only (no endpoint) — wire to a subscribe API or mark non-functional.
- Low: add `onError` fallbacks to Blog/Gallery `<img>`; footer social/announcement fall back to `href="#"` when their CMS value is unset (hide instead).

---

## Bottom line
The software is **fundamentally healthy** — sound security, sound money flow (smoke-verified), clean data. This session fixed the **4 HIGH issues** (settings exposure, overpayment guard, uncommitted-work data-loss, the dead `/packages` route) plus several medium/low ones, all verified. The remaining items are **core-finance edge cases** (needing a design decision + re-test), **secret rotation** (owner-only), and **content/i18n** work — none of them blockers, all documented with exact fixes. **A browser-based click-through of the ERP and site is still recommended** for the runtime UI behaviors I can't reach from code.
