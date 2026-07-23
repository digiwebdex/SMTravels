/**
 * Public website intake contract (no-auth endpoints). zod-only, shared with
 * the frontend like every other contract.
 *
 * Deliberately PII-light: name/phone/email only. Passport numbers, dates of
 * birth etc. are NEVER accepted here — those are collected by staff inside
 * the ERP where PII is encrypted at rest.
 */
import { z } from "zod";
import { serviceTypeSchema } from "./booking.contract";

const trimmed = (max: number) => z.string().trim().min(1).max(max);
const optTrimmed = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** Booking-request form (/book). */
export const publicBookingRequestSchema = z.object({
  name: trimmed(120),
  phone: trimmed(32),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  serviceInterest: serviceTypeSchema,
  travelers: z.coerce.number().int().min(1).max(500).optional(),
  travelingFrom: optTrimmed(120),
  destination: optTrimmed(120),
  departDate: optTrimmed(10), // yyyy-mm-dd (free text tolerated — display only)
  returnDate: optTrimmed(10),
  notes: optTrimmed(2000),
});
export type PublicBookingRequestInput = z.infer<typeof publicBookingRequestSchema>;

/** Contact form (/contact). */
export const publicContactSchema = z.object({
  name: trimmed(120),
  phone: trimmed(32),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  serviceInterest: serviceTypeSchema.optional(),
  message: trimmed(2000),
});
export type PublicContactInput = z.infer<typeof publicContactSchema>;

/** Both endpoints reply with this and nothing more — no ids, no state. */
export interface PublicIntakeResult {
  ok: true;
}
