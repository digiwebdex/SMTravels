/**
 * Document type constants — dependency-free so the browser bundle never pulls
 * backend contract code (zod etc.) in as a runtime value.
 *
 * ⚠️ KEEP IN SYNC with backend/src/contracts/document.contract.ts
 *    (DOCUMENT_TYPES there mirrors prisma's DocumentType enum). The pre-commit
 *    guard (frontend/scripts/check-contracts-imports.mjs) fails the commit if
 *    the two lists drift.
 *
 * Frontend code imports the VALUE from here; `import type { DocumentTypeDto }`
 * from @contracts is still fine — type-only imports erase at compile time.
 */
export const DOCUMENT_TYPES = [
  "PASSPORT", "PHOTO", "VISA", "NID", "MEDICAL", "VACCINATION",
  "AIR_TICKET", "HOTEL", "INSURANCE", "CONTRACT", "LICENSE", "MAHRAM_CERT", "OTHER",
] as const;
