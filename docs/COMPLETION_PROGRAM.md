# SM Travels ERP — Completion Program (Delivery Record)

**Branch:** `feature/prod-cms-merge` · **Head at close:** `4f50ac1`
**Production origin:** `200.141.8.183` (srv1868345) — **not touched during development.**
All work is committed + pushed; nothing is deployed. Deploy is owner-run via the
guarded scripts and the [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md).

> Goal (owner): turn every production-visible `ComingSoon` route into a **real**
> full-stack module — frontend + API + validation + DB + CRUD + permissions +
> workflow + error/loading/empty states. No mock data, no fake CRUD. Business
> rules enforced server-side.

---

## 1. Modules delivered

Every module is real end-to-end and passed the gate (`prisma validate`, backend
`tsc` 0 errors, frontend `vite build` 0 errors) before commit.

| # | Module | Commit | New models | API route | Frontend |
|---|--------|--------|-----------|-----------|----------|
| 1 | Muallim / Mutawwif | `77f1ece` | *(reuses `OperationsTeamMember` + `MUALLIM` role)* | extends `ops` | `/erp/muallim` |
| 2 | Currency Settings | `4975bd7` | `ExchangeRate` | `currency` | `/erp/settings/currency` |
| 3 | Companies We Work With | `9f39dd4` | `BusinessPartner` | `business-network` | `/erp/network/companies` |
| 4 | Mufti / Scholar Network | `870af30` | `MuftiScholar` | `business-network` | `/erp/network/scholars` |
| 5 | Payroll | `19c0a05` | `PayrollRun`, `Payslip` | `payroll` | `/erp/hr/payroll` |
| 6A | Employers + Job Orders | `451931b` | `Employer`, `JobOrder` | `manpower` | `/erp/manpower/employers`, `/job-orders` |
| 6B-1 | Candidates + Recruitment | `8ccad63` | `Candidate` | `manpower` | `/erp/manpower/candidates`, `/recruitment` |
| 6B-2 | Medical + BMET | `959b974` | `MedicalProcessing`, `BmetClearance` | `manpower` | `/erp/manpower/medical`, `/bmet` |
| 6B-3 | Visa + Deployment | `411648b` | `ManpowerVisa`, `ManpowerDeployment` | `manpower` | `/erp/manpower/visa`, `/deployment` |
| 7 | Custom Package Builder | `8b95715` | `PackageInquiry`, `CustomPackage`, `CustomPackageItem` | `custom-package` | `/erp/packages/custom`, `/inquiries`, `/quotes` |

**Hardening phases:** RBAC (`6de4616`), business-critical tests + rule
centralization (`4f50ac1`).

---

## 2. Server-side business rules (single source of truth)

All money math, quota caps, and lifecycle/stage machines live in
[`backend/src/services/business-rules.ts`](../backend/src/services/business-rules.ts)
— dependency-free (no prisma, no I/O). The services import from it, and the unit
tests exercise the same functions, so the tests validate the exact code that ships.

- **Pricing** — `computeItemSubtotal`, `computeSubtotal`, `computeGrandTotal`
  (floored at 0 so a discount can never make a price negative), `isDiscountValid`
  (discount ≤ subtotal + markup), `computeBaseAmount` (amount × exchange rate).
- **Quota** — `hasQuotaRoom(taken, quantity)` — a job order cannot exceed its slot count.
- **Lifecycle** — `INQUIRY_TRANSITIONS`, `PKG_TRANSITIONS` + `isPackageEditable`,
  `CANDIDATE_TRANSITIONS`, via `canTransition(map, from, to)`.
- **Stages** — `MED_/BMET_/VISA_/DEPLOY_TRANSITIONS`, and forward-only
  `shouldAdvanceStatus` driving candidate auto-advance (never backward; REJECTED never advances).

**Tests:** 23 `node:test` cases, no DB/network. Run `npm test` in `backend/`
(`node --import tsx --test`). Test files are excluded from the `dist` build.

---

## 3. RBAC — see [RBAC section of the runbook](./DEPLOYMENT_RUNBOOK.md#rbac)

Dedicated permission modules replaced interim reuse:
`manpower` (was `bookings`), `payroll` (was `settings`), `currency` (was
`settings`), `business_network` (was `partners`). Authorization is server-side
(`requirePermission` → `RolePermission`); an ungranted role gets **403 on a
direct API call**, not just a hidden menu item. Grants preserve each role's prior
access. **`npm run seed:rbac` must run before/with the deploy** or the new keys
have no grants and everyone (admins included) is locked out of those 4 modules.

---

## 4. Deferrals (documented, not silent)

These remain `ComingSoon` intentionally and are **out of the completion scope**
(owner said "stop adding new business modules" after Module 7):

**Nav-visible (3):**
- `hotels`, `transport` — resolve to a Supplier-filtered view; reuse existing
  `Supplier`/`SupplierService`, no net-new models.
- `whatsapp` — needs WhatsApp Business API credentials/approval. SMS +
  Notifications are already live.

**URL-only, not in the menu (4):** `marketing`, `ocr`, `integrations`, `ai` —
retained for direct access only; not surfaced in the final navigation.

---

## 5. What was NOT changed (regression surface)

CRM/Customers/Leads, Bookings (Hajj/Umrah/Visa/AirTicket/Hotel/Tour), Packages/
Services, Suppliers, Operations/OpsTeam, HajjOps, Accounts/Invoices/Payments,
Communications/SMS, HR, CMS, OCR, Reports, Partners, portals, Auth. The Phase 9
refactor moved rule constants into `business-rules.ts` **verbatim** — behavior is
identical (confirmed by `tsc` + tests). 16 pre-existing `TODO/FIXME` remain in
older files; **0** are in the delivered modules.
