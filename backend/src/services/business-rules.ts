/**
 * Phase 9 — pure business rules (no prisma, no I/O). Single source of truth for
 * pricing math, the recruitment stage machine, and lifecycle transitions.
 *
 * The services import from here, and the unit tests in business-rules.test.ts
 * exercise these same functions/constants directly — so the tests validate the
 * exact logic production runs, never a copy of it.
 */

// ── shared numeric helpers ───────────────────────────────────────────────────
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const toNum = (v: unknown) => Number(v ?? 0);

// ── Custom Package pricing ───────────────────────────────────────────────────
export const computeItemSubtotal = (quantity: number, unitPrice: number) =>
  round2(quantity * unitPrice);
export const computeSubtotal = (items: { subtotal: unknown }[]) =>
  round2(items.reduce((s, it) => s + toNum(it.subtotal), 0));
/** grand total is floored at 0 so a discount can never produce a negative price. */
export const computeGrandTotal = (subtotal: number, markup: number, discount: number) =>
  round2(Math.max(0, subtotal + markup - discount));
/** a discount may not exceed subtotal + markup. */
export const isDiscountValid = (discount: number, subtotal: number, markup: number) =>
  discount <= subtotal + markup;
/** base (home-currency) amount = amount × exchange rate. */
export const computeBaseAmount = (amount: number, exchangeRate: number) =>
  round2(amount * exchangeRate);

// ── generic transition helper ────────────────────────────────────────────────
export type TransitionMap = Record<string, string[]>;
export const canTransition = (map: TransitionMap, from: string, to: string) =>
  (map[from] ?? []).includes(to);

// ── Custom Package inquiry + package lifecycle ───────────────────────────────
export const INQUIRY_TRANSITIONS: TransitionMap = {
  NEW: ["REVIEWING", "CANCELLED"], REVIEWING: ["PACKAGE_BUILDING", "CANCELLED"], PACKAGE_BUILDING: ["QUOTED", "CANCELLED"],
  QUOTED: ["APPROVED", "CANCELLED"], APPROVED: ["BOOKED", "CANCELLED"], BOOKED: [], CANCELLED: ["NEW"],
};
export const PKG_EDITABLE = ["DRAFT", "QUOTED"];
export const isPackageEditable = (status: string) => PKG_EDITABLE.includes(status);
export const PKG_TRANSITIONS: TransitionMap = {
  DRAFT: ["QUOTED"], QUOTED: ["ACCEPTED", "REJECTED", "EXPIRED", "DRAFT"], ACCEPTED: ["BOOKED", "REJECTED"],
  REJECTED: ["DRAFT"], EXPIRED: ["DRAFT"], BOOKED: [],
};

// ── Manpower recruitment: candidate status machine + slot cap ────────────────
export const CANDIDATE_TRANSITIONS: TransitionMap = {
  NEW: ["SHORTLISTED", "SCREENING", "REJECTED"],
  SHORTLISTED: ["SCREENING", "INTERVIEW", "REJECTED"],
  SCREENING: ["INTERVIEW", "SELECTED", "REJECTED"],
  INTERVIEW: ["SELECTED", "REJECTED"],
  SELECTED: ["CONTRACTED", "REJECTED"],
  CONTRACTED: ["MEDICAL", "REJECTED"],
  MEDICAL: ["BMET", "REJECTED"],
  BMET: ["VISA", "REJECTED"],
  VISA: ["TICKETED", "REJECTED"],
  TICKETED: ["DEPLOYED"],
  DEPLOYED: [],
  REJECTED: ["SHORTLISTED"],
};
/** a job order can hold at most `quantity` candidates in slot statuses. */
export const hasQuotaRoom = (taken: number, quantity: number) => taken < quantity;

// ── Manpower sub-stage machines (medical / bmet / visa / deployment) ─────────
// Candidate auto-advances only forward along this order; REJECTED is handled by
// the caller (a rejected candidate never advances).
export const STAGE_ORDER = ["NEW", "SHORTLISTED", "SCREENING", "INTERVIEW", "SELECTED", "REJECTED", "CONTRACTED", "MEDICAL", "BMET", "VISA", "TICKETED", "DEPLOYED"];
export const shouldAdvanceStatus = (current: string, to: string) =>
  STAGE_ORDER.indexOf(to) > STAGE_ORDER.indexOf(current);

export const MED_TRANSITIONS: TransitionMap = {
  PENDING: ["APPOINTMENT", "COMPLETED"], APPOINTMENT: ["COMPLETED"], COMPLETED: ["FIT", "UNFIT"],
  FIT: ["EXPIRED"], UNFIT: ["PENDING"], EXPIRED: ["PENDING"],
};
export const BMET_TRANSITIONS: TransitionMap = {
  PENDING: ["REGISTERED"], REGISTERED: ["PROCESSING", "CLEARED", "REJECTED"], PROCESSING: ["CLEARED", "REJECTED"],
  CLEARED: ["EXPIRED"], REJECTED: ["PENDING"], EXPIRED: ["PENDING"],
};
export const VISA_TRANSITIONS: TransitionMap = {
  PENDING: ["SUBMITTED"], SUBMITTED: ["PROCESSING", "APPROVED", "REJECTED"], PROCESSING: ["APPROVED", "REJECTED"],
  APPROVED: ["EXPIRED"], REJECTED: ["PENDING"], EXPIRED: ["PENDING"],
};
export const DEPLOY_TRANSITIONS: TransitionMap = {
  PENDING: ["TICKETED", "CANCELLED"], TICKETED: ["READY", "CANCELLED"], READY: ["DEPARTED", "CANCELLED"],
  DEPARTED: ["DEPLOYED", "CANCELLED"], DEPLOYED: [], CANCELLED: ["PENDING"],
};
