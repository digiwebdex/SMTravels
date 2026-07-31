# Known Limitations — SM Travels International (Go Live)

These items are **intentional** or **externally blocked**. They are not treated as launch blockers for core ERP + website.

## Integrations

1. **Gemini AI requires active billing/quota**  
   Status endpoints may show `connected`, but chat/insights return `AiProviderError` (502) when Google AI Studio prepaid credits are exhausted. Top up credits before marketing the AI assistant.

2. **WhatsApp notifications remain disabled** until Wasender credentials are set (`WASENDER_API_URL`, `WASENDER_API_TOKEN`, `WASENDER_PHONE_NUMBER_ID`). Queue cancels WA rows when the flag is off.

3. **SMS notifications remain disabled** until BulkSMSBD credentials are set (`BULKSMSBD_API_KEY`, `BULKSMSBD_SENDER_ID`).

## Portals (Version 2)

4. **Staff, Supplier, and Accountant portals** are intentionally deferred to Version 2. Routes exist; several screens still use mock/sample data behind `SampleBadge`.

## Sample / non-production UI

5. **Screens marked with SampleBadge** remain intentionally non-production and must stay labeled until implemented (e.g. Ops calendar/chat/workflows, online payment gateway volumes, vouchers UI, system health telemetry, staff KPI, OCR validation sample grid).

## Master data gaps (operational, not defects)

6. No dedicated CRUD modules for **Airlines / Countries / Cities / Visa Types** as separate catalogs — visa/hotel/ticket details live on booking service rows and packages. Enter operational lists via Packages, Services, Suppliers, and booking wizards.

7. **Packages** table is empty at go-live — staff must create Hajj/Umrah/Tour packages before public catalog is populated (no silent demo fallback).

## Infrastructure risks

8. **Root disk ~89% full** at handover — free space before large media uploads; nightly backup aborts if free &lt; 8 GB.

9. **Main SPA chunk still &gt;500 KB** — acceptable for RC; further splitting optional.

10. **Upload scanning** is magic-byte + MIME only (no antivirus).
