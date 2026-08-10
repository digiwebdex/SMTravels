/**
 * Phase 9 — business-critical unit tests. Exercises the exact pricing math,
 * quota cap, and lifecycle/stage transition logic that the services import from
 * ./business-rules (not a copy) — so a regression in a real rule fails here.
 *
 * Run:  npm test   (node:test runner via tsx; no DB, no network).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeItemSubtotal, computeSubtotal, computeGrandTotal, isDiscountValid, computeBaseAmount,
  canTransition, isPackageEditable, hasQuotaRoom, shouldAdvanceStatus,
  INQUIRY_TRANSITIONS, PKG_TRANSITIONS, CANDIDATE_TRANSITIONS,
  MED_TRANSITIONS, BMET_TRANSITIONS, VISA_TRANSITIONS, DEPLOY_TRANSITIONS,
} from "./business-rules";

// ─── Pricing math ─────────────────────────────────────────────────────────────
test("item subtotal = quantity × unit price", () => {
  assert.equal(computeItemSubtotal(3, 100), 300);
  assert.equal(computeItemSubtotal(1, 0), 0);
});
test("item subtotal rounds to 2 decimals", () => {
  assert.equal(computeItemSubtotal(3, 33.333), 100);    // 99.999  → 100.00 (up)
  assert.equal(computeItemSubtotal(3, 10.336), 31.01);  // 31.008  → 31.01  (up)
  assert.equal(computeItemSubtotal(3, 10.334), 31);     // 31.002  → 31.00  (down)
});
test("subtotal sums items, coercing string/null money", () => {
  assert.equal(computeSubtotal([{ subtotal: 100 }, { subtotal: "50.5" }, { subtotal: null }]), 150.5);
  assert.equal(computeSubtotal([]), 0);
});
test("grand total = subtotal + markup − discount", () => {
  assert.equal(computeGrandTotal(1000, 200, 100), 1100);
  assert.equal(computeGrandTotal(1000, 0, 0), 1000);
});
test("grand total is floored at 0 (discount can't make price negative)", () => {
  assert.equal(computeGrandTotal(100, 0, 500), 0);
  assert.equal(computeGrandTotal(100, 20, 130), 0);
});
test("discount is valid iff it does not exceed subtotal + markup", () => {
  assert.equal(isDiscountValid(50, 100, 20), true);
  assert.equal(isDiscountValid(120, 100, 20), true); // boundary: exactly subtotal+markup
  assert.equal(isDiscountValid(121, 100, 20), false);
});
test("base amount = amount × exchange rate (BDT rate 1 is identity)", () => {
  assert.equal(computeBaseAmount(100, 1), 100);
  assert.equal(computeBaseAmount(100, 122.5), 12250);
  assert.equal(computeBaseAmount(99.99, 3), 299.97);
});

// ─── Job-order quota cap ──────────────────────────────────────────────────────
test("quota has room only while taken < quantity", () => {
  assert.equal(hasQuotaRoom(0, 3), true);
  assert.equal(hasQuotaRoom(2, 3), true);
  assert.equal(hasQuotaRoom(3, 3), false); // full
  assert.equal(hasQuotaRoom(4, 3), false); // over (defensive)
});

// ─── Candidate recruitment status machine ─────────────────────────────────────
test("candidate advances only along allowed edges", () => {
  assert.equal(canTransition(CANDIDATE_TRANSITIONS, "NEW", "SHORTLISTED"), true);
  assert.equal(canTransition(CANDIDATE_TRANSITIONS, "SCREENING", "SELECTED"), true);
  assert.equal(canTransition(CANDIDATE_TRANSITIONS, "SELECTED", "CONTRACTED"), true);
});
test("candidate cannot skip stages (NEW → SELECTED blocked)", () => {
  assert.equal(canTransition(CANDIDATE_TRANSITIONS, "NEW", "SELECTED"), false);
  assert.equal(canTransition(CANDIDATE_TRANSITIONS, "NEW", "CONTRACTED"), false);
});
test("DEPLOYED is terminal; REJECTED can be re-opened", () => {
  assert.equal(canTransition(CANDIDATE_TRANSITIONS, "DEPLOYED", "REJECTED"), false);
  assert.deepEqual(CANDIDATE_TRANSITIONS.DEPLOYED, []);
  assert.equal(canTransition(CANDIDATE_TRANSITIONS, "REJECTED", "SHORTLISTED"), true);
});
test("any active candidate can be rejected", () => {
  for (const s of ["NEW", "SHORTLISTED", "SCREENING", "INTERVIEW", "SELECTED", "CONTRACTED", "MEDICAL", "BMET", "VISA"]) {
    assert.equal(canTransition(CANDIDATE_TRANSITIONS, s, "REJECTED"), true, `${s} → REJECTED`);
  }
});

// ─── Forward-only auto-advance (stage → candidate status) ─────────────────────
test("stage auto-advance is strictly forward", () => {
  assert.equal(shouldAdvanceStatus("NEW", "SELECTED"), true);
  assert.equal(shouldAdvanceStatus("CONTRACTED", "MEDICAL"), true);
});
test("auto-advance never moves backward or sideways", () => {
  assert.equal(shouldAdvanceStatus("SELECTED", "NEW"), false);
  assert.equal(shouldAdvanceStatus("MEDICAL", "MEDICAL"), false); // equal ≠ advance
  assert.equal(shouldAdvanceStatus("DEPLOYED", "VISA"), false);
});

// ─── Custom package + inquiry lifecycle ───────────────────────────────────────
test("package quote/accept/book path is enforced", () => {
  assert.equal(canTransition(PKG_TRANSITIONS, "DRAFT", "QUOTED"), true);
  assert.equal(canTransition(PKG_TRANSITIONS, "QUOTED", "ACCEPTED"), true);
  assert.equal(canTransition(PKG_TRANSITIONS, "ACCEPTED", "BOOKED"), true);
});
test("package cannot jump DRAFT → ACCEPTED, and BOOKED is terminal", () => {
  assert.equal(canTransition(PKG_TRANSITIONS, "DRAFT", "ACCEPTED"), false);
  assert.equal(canTransition(PKG_TRANSITIONS, "DRAFT", "BOOKED"), false);
  assert.deepEqual(PKG_TRANSITIONS.BOOKED, []);
});
test("package editable only in DRAFT/QUOTED", () => {
  assert.equal(isPackageEditable("DRAFT"), true);
  assert.equal(isPackageEditable("QUOTED"), true);
  assert.equal(isPackageEditable("ACCEPTED"), false);
  assert.equal(isPackageEditable("BOOKED"), false);
});
test("inquiry funnel enforces order; cannot leap NEW → BOOKED", () => {
  assert.equal(canTransition(INQUIRY_TRANSITIONS, "NEW", "REVIEWING"), true);
  assert.equal(canTransition(INQUIRY_TRANSITIONS, "APPROVED", "BOOKED"), true);
  assert.equal(canTransition(INQUIRY_TRANSITIONS, "NEW", "BOOKED"), false);
});

// ─── Manpower sub-stage machines (medical / bmet / visa / deployment) ─────────
test("medical: result only after COMPLETED; FIT/UNFIT are results", () => {
  assert.equal(canTransition(MED_TRANSITIONS, "COMPLETED", "FIT"), true);
  assert.equal(canTransition(MED_TRANSITIONS, "COMPLETED", "UNFIT"), true);
  assert.equal(canTransition(MED_TRANSITIONS, "PENDING", "FIT"), false);
  assert.equal(canTransition(MED_TRANSITIONS, "FIT", "UNFIT"), false); // can't flip a result
});
test("bmet: must register before clearance", () => {
  assert.equal(canTransition(BMET_TRANSITIONS, "REGISTERED", "CLEARED"), true);
  assert.equal(canTransition(BMET_TRANSITIONS, "PENDING", "CLEARED"), false);
});
test("visa: must submit before approval", () => {
  assert.equal(canTransition(VISA_TRANSITIONS, "SUBMITTED", "APPROVED"), true);
  assert.equal(canTransition(VISA_TRANSITIONS, "PROCESSING", "APPROVED"), true);
  assert.equal(canTransition(VISA_TRANSITIONS, "PENDING", "APPROVED"), false);
});
test("deployment: ordered to departure; DEPLOYED is terminal", () => {
  assert.equal(canTransition(DEPLOY_TRANSITIONS, "READY", "DEPARTED"), true);
  assert.equal(canTransition(DEPLOY_TRANSITIONS, "DEPARTED", "DEPLOYED"), true);
  assert.equal(canTransition(DEPLOY_TRANSITIONS, "PENDING", "DEPLOYED"), false);
  assert.deepEqual(DEPLOY_TRANSITIONS.DEPLOYED, []);
});
test("unknown source state transitions to nothing (safe default)", () => {
  assert.equal(canTransition(PKG_TRANSITIONS, "NONSENSE", "QUOTED"), false);
  assert.equal(canTransition(MED_TRANSITIONS, "", "FIT"), false);
});
