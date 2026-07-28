/**
 * Passport OCR contract (Phase 3, Item 4). Type-only — the frontend imports these
 * to type the "scan passport" pre-fill. OCR output is a REVIEW DRAFT, never
 * authoritative: it pre-fills an editable form and is verified by staff.
 */
export interface PassportFields {
  fullName: string | null;
  passportNo: string | null;
  dateOfBirth: string | null; // yyyy-mm-dd
  expiryDate: string | null;  // yyyy-mm-dd
  nationality: string | null;
  gender: "MALE" | "FEMALE" | null;
}

export interface OcrResult {
  provider: "mock" | "cloud";
  confidence: number;         // 0..1 — mock is 0 (unverified)
  fields: PassportFields;
  warning: string | null;     // surfaced in the UI when the data must be reviewed
}
