# SM Travels International — REMOVE SAAS / SUBSCRIPTION SYSTEM REPORT
**Branch:** `feature/release-candidate-v2` · **Date:** 2026-08-04

> Mission: remove every SaaS / subscription / licensing / usage-limit feature so the product
> is unambiguously a **single-company ERP** — no plans, no tiers, no trials, no user/storage/
> branch limits, no upgrade CTAs. Business finance (invoices, payments, expenses, accounting,
> package/service pricing) must be **kept** — those are operations, not SaaS.

---

## 0. Headline finding

**SM Travels International was already, structurally, a single-company ERP — there was no SaaS/subscription system to dismantle.** A repository-wide audit found:

- **0** occurrences of `subscription` anywhere (frontend or backend).
- **0** SaaS database models — `schema.prisma` has no `Subscription`, `Plan`, `TenantSubscription`, `BillingPlan`, `License`, `SubscriptionUsage`, `PlanFeature`, or `Trial` model.
- **0** subscription/billing/plan/license **menus, nav tabs, routes, controllers, services, or APIs**.
- **0** pricing-plan cards (Starter/Pro/Business/Enterprise), current-plan badges, renewal dates, or trial states.

The subscription-plans surface referenced in earlier direction ("delete the subscription plan — this is a single-company ERP, not SaaS") had **already been removed** in a prior session. This pass confirmed that removal is complete and eliminated the **one** remaining SaaS-flavored remnant.

---

## 1. What was removed in this pass

### The only genuine SaaS remnant: OCR "Monthly Usage" quota widget
**File:** `frontend/src/app/erp/SettingsModule.tsx` (OCR Settings tab)

Removed a fabricated **metered-usage / upgrade-plan** widget — the classic SaaS quota pattern, which makes no sense for an unlimited single-company deployment:

| Removed element | Was |
|---|---|
| **"Monthly Usage"** panel | `Scans used 312 / 500` meter + progress bar |
| **"Upgrade Plan"** CTA | `Resets Aug 1, 2024 · [Upgrade Plan]` button |
| Per-document **usage counts** | fabricated `"1,840 scans"`, `"342 scans"`, `"510 scans"`, `"0 scans"` metered-usage figures |

**Kept:** the Supported Document Types list itself with its Active/Disabled toggles — that is legitimate OCR configuration, not a SaaS limit. Only the fake usage/quota/upgrade metrics were stripped.

### Cosmetic wording cleanup
**File:** `frontend/src/app/pages/DesignSystem.tsx`
- Relabeled a gold-button *variant showcase* from `Upgrade` → `Confirm` (internal design-system reference page — never subscription functionality, but the word is now gone).

---

## 2. What was reviewed and deliberately KEPT (business ops, not SaaS)

Every other match for the audit terms is legitimate business functionality explicitly on the KEEP list:

| Match | File(s) | Why it stays |
|---|---|---|
| Package **pricing tiers** (`PricingTier`, `PricingTierEditor`) | `erp/PackageManagement.tsx`, `backend/package.service.ts` (`packagePricing`) | Per-package travel pricing — core business |
| Service **pricing rules** (`PricingRule`) | `erp/ServicesConfig.tsx` | Per-service fees/commissions — core business |
| Booking **pricing & discounts** (`PricingForm`) | `erp/bookings/BookingWizard.tsx`, `backend/booking.service.ts` | Booking totals — core business |
| Cabin/room **"upgrades"** | `lib/data.ts` (marketing copy) | Travel upsell language, not app subscription |
| Manpower **"license"** (BOESL/BMET), **Trade license** | `lib/data.ts`, `SettingsModule.tsx` company reg | Regulatory credentials — core business |
| `LICENSE` **document type** | `backend/contracts/document.contract.ts` | A passport/ID document category — core business |
| Payment / EPS gateway / Invoice / Customer / Supplier payments, Expenses, Accounting, Finance | Accounts, Invoices, Finance modules | Explicitly on the KEEP list |

None of these are SaaS/subscription features; removing them would have deleted the ERP's actual business logic.

---

## 3. Removal inventory

| Category | Removed |
|---|---|
| **Files removed** | None required — no SaaS-only file existed |
| **Routes removed** | None — no subscription/billing/plan/license route existed |
| **Menus removed** | None — no Subscription/Plans/Upgrade/Pricing/License menu existed |
| **Components removed** | 1 in-place UI block: OCR "Monthly Usage" quota + "Upgrade Plan" panel; fabricated per-doc scan-usage metrics |
| **APIs removed** | None — no subscription/plan/billing/license/tenant-billing endpoint existed |
| **Database changes** | None — no SaaS models/tables exist in `schema.prisma`; no migration needed. **No accounting/finance table touched.** |
| **Wording cleaned** | 1 design-system demo label (`Upgrade` → `Confirm`) |

---

## 4. Validation

| Check | Result |
|---|---|
| No Subscription menu | ✅ (0 in repo) |
| No Pricing **plan** page / plan cards | ✅ (business package/service pricing kept; no subscription pricing exists) |
| No Upgrade button | ✅ removed |
| No Plan cards (Starter/Pro/Business/Enterprise) | ✅ (0 in repo) |
| No Trial | ✅ (0 — only "Trade license", unrelated) |
| No Storage / Branch / User Limit | ✅ (0 in repo) |
| No SaaS wording ("Monthly Usage", "Upgrade Plan", "Contact Sales", "Renewal") | ✅ removed / 0 remaining |
| No Billing Plan / tenant-subscription references | ✅ (0 in repo) |
| `tsc --noEmit` | ✅ **0 errors** |
| Contracts import guard | ✅ OK |
| Frontend build (`vite`) | ✅ PASS (~8s) |
| Backend build (`tsc -p`) | ✅ PASS |

Final grep for SaaS-specific phrases (`upgrade plan`, `current plan`, `renewal date`, `free/paid plan`, `storage/user/branch limit`, `license usage/expiry/warning`, `plan comparison`, `billing plan`, `tenant subscription`, `contact sales`, `subscription`, `starter/pro/business/enterprise plan`, `scans used`, `monthly usage`) → **0 matches.**

---

## 5. Remaining SaaS references

**None.** No subscription, plan, billing, licensing, trial, or usage-limit functionality remains in the frontend, backend, routes, menus, database, or documentation.

---

## 6. Final confirmation

✅ **SM Travels International is now confirmed as a dedicated Single-Company ERP.**
There is one company, unlimited users/branches/storage, no plans, no trials, no subscriptions,
no license limits, and no upgrade paths. All business operations — bookings, invoicing,
payments (incl. EPS gateway), supplier/customer payments, expenses, accounting, and package/
service pricing — remain fully intact.
