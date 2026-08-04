# SM Travels International — FINAL DEAD ACTION REPORT
**Enterprise Polish · Dead Action Elimination Sprint** · branch `feature/release-candidate-v2`
**Date:** 2026-08-04

> Mandate: every visible action must WORK, or be DISABLED with a clear explanation, or be
> REMOVED. Never leave a dead button. No new features, no new APIs, no UI redesign.
> Resolution rule applied per action: existing API/handler → wire it · functionality exists
> elsewhere → reuse (navigate/print/clipboard) · feature truly absent → disable-with-message
> or remove.

---

## 0. Result

| Metric | Count |
|---|---|
| Files touched this sprint | 18 (BookingDetail + 17) |
| **Dead actions resolved** | **~100** |
| → WIRED to real behaviour | **~35** |
| → DISABLED with explanation | **~63** |
| → REMOVED | **~2** |
| Fake-success handlers removed | **3** (ServicesConfig, CMS Web Settings, + booking note) |
| Residual `onClick={() => {}}` | **0** |
| Residual `onChange={() => {}}` | **0** |
| Residual `href="#"` | **0** |
| Residual `console.log` (app code) | **0** |
| `tsc --noEmit` | ✅ 0 errors |
| Frontend build (vite) | ✅ PASS |
| Backend build (tsc) | ✅ PASS |
| Import guard | ✅ OK |
| **Remaining blockers** | ✅ **0** |

A repo-wide grep now returns **zero** dead-handler literals and **zero** `href="#"`. Every
interactive control the audits found is now functional, honestly disabled, or gone.

---

## 1. WIRED — reused existing behaviour (no new API)

**Booking Detail** (`erp/bookings/BookingDetail.tsx`) — the top-priority screen:
- Print · PDF · Print Voucher · Download PDF → `window.print()`
- Edit · Add Travelers · traveler Edit · Add another traveler → `onEdit` (booking wizard)
- Generate Invoice · Record Payment (×2) · installment Record → `/erp/invoices`
- Send SMS → `/erp/communications`
- View Docs · Upload All · per-doc View/Download/Upload → `/erp/documents`

**Invoices** (`InvoicesModule.tsx`): Send to Customer · Send All Reminders · Remind · Collect
→ `/erp/communications`; receipt-row Print → `window.print()`.
**Reports-BI** (`ReportsBIModule.tsx`): PDF · Export Current PDF → `window.print()`.
**Settings** (`SettingsModule.tsx`): WhatsApp webhook **Copy** → `navigator.clipboard.writeText`.
**CMS** (`CmsModule.tsx`): **Preview Website** → `window.open("/")`.
**ERP shell** (`ErpLayout.tsx`): user-menu My Profile · Branch Settings → `/erp/settings`.
**Bookings list** (`BookingsModule.tsx`): row Edit → detail/edit opener; row Print → `window.print()`.
**Portals**: Customer in-page Sign Out → `logout()`; Supplier notification bell → Messages.
*(Prior QA commit had already wired the 6 Staff/Accountant/Supplier logout buttons + live identity.)*

## 2. DISABLED with a clear tooltip — feature genuinely absent (would need a new API/feature)

Each keeps its place/size, gains `disabled` + an explanatory `title`, and muted styling:

- **Reports** builder: Generate Report, Save Template, Run (saved report), Set Schedule, Reset Filters.
- **Accounts**: Chart-of-Accounts Export/Add Account/row Edit, Income-Expense Filter/Export/Add/row More, Bank Add Account.
- **Packages**: Export, bulk Archive/Duplicate, row Duplicate/More, gallery image delete/upload.
- **Services Config**: Reset to Defaults, Disable Service Permanently, Add Step, Edit Template; the 3 preview toggles; **Save Changes** (was fake success → now read-only disabled).
- **Settings**: logo Upload, email-template Edit, Add Template, template view, Clear All Caches.
- **CMS**: the rich-text WYSIWYG toolbar (all formatting buttons), category Edit/Delete, Clear Cache, **Save All Changes** (was fake success → now disabled).
- **Invoices** list Export; **Reports-BI** Excel/Export Excel; **Bookings** toolbar Export; **ErpLayout** Help & Support.
- **Portals**: Staff document Download + booking/customer details eyes; Accountant Statements + Audit Export; Agent lead Email.
- **Booking Detail**: Share Booking, Add Note, Save Note.

## 3. REMOVED

- Booking Detail header **"More"** menu trigger (opened no menu).
- The fake per-document file input in Booking Detail (replaced by a link to the Documents module).
- Website **social icons** converted from `href="#"` dead links to non-interactive icons (real
  URLs are owner-supplied; "coming soon" is disallowed).

## 4. Fake-success handlers eliminated

- `ServicesConfig` **Save Changes**: was `setTimeout → "Saved"` with no persistence → now an
  honest disabled control ("Read-only — configuration changes are not persisted in this build");
  its 3 display toggles are now genuinely non-interactive (`disabled`).
- `CmsModule` Web-Settings **Save All Changes**: was `setSaved(true)` with no API → disabled with
  "configured on the server".
- Booking Detail **Save Note**: was a no-op → disabled with explanation (no booking-note API).

## 5. Dead links fixed

- `Auth.tsx`: brand-panel Privacy/Terms/Support and register/agent/OTP legal links `href="#"` →
  real `/terms`, `/privacy`, `/contact` (new tab). *(Newsletter → /contact was fixed in the prior QA commit.)*
- `Layout.tsx` + `Contact.tsx`: footer/quick-contact social `href="#"` → non-interactive icons.

## 6. Approximate button inventory

The four audits enumerated ~100 dead/misleading actions across Website, ERP (13 modules),
and 6 Portals. All ~100 are now resolved (§1–§5). The remainder of the application's buttons —
the large majority — were already functional (create/edit/delete mutations, navigation, tabs,
working filters, the real CSV/Excel exports in ReportsModule, portal payment/leave/upload
flows) and were left untouched. Exact per-button totals for the whole app were not counted;
the audited dead-action set is the meaningful denominator and it is now at zero.

## 7. Remaining blockers

**None.** No dead actions remain. The DISABLED items in §2 are not defects — they are
honestly-labelled placeholders for capabilities that would each require a **new backend
feature/endpoint** (report builder, WYSIWYG editor, template CRUD, cache management,
UI-editable settings persistence, gallery image management, list-export endpoints). These are
post-V2 feature work, explicitly out of scope for this "no new features" sprint, and are safe
to ship disabled because they never mislead the user.

## 8. Verification

```
frontend $ npx tsc --noEmit                          → 0 errors
frontend $ node scripts/check-contracts-imports.mjs  → OK
frontend $ npm run build                             → PASS (~10s)
backend  $ npm run build                             → PASS
grep     onClick={() => {}} | onChange={() => {}} | href="#"  → 0 / 0 / 0
```

## 9. Git

Branch `feature/release-candidate-v2` (master untouched, **not merged**):
- `1350ec1` fix(rc): eliminate dead actions in Booking Detail
- `5ba1492` fix(rc): eliminate dead actions
- `<this>`  docs(rc): FINAL_DEAD_ACTION_REPORT

**Verdict:** the application no longer ships a single dead button. Every visible action works,
is honestly disabled with a reason, or has been removed.
