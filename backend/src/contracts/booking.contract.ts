/**
 * Shared Bookings contract — the SINGLE source of truth for the wire shape,
 * imported by the backend (runtime zod validation) AND the frontend (type-only,
 * so the two can't drift). Deliberately depends on nothing but `zod`:
 * enums are declared as z.enum here (NOT imported from @prisma/client) so the
 * frontend can import this file without pulling in Prisma.
 */
import { z } from "zod";

// ── enums (mirror prisma/schema.prisma) ──────────────────────────────────────
export const SERVICE_TYPES = ["HAJJ", "UMRAH", "VISA", "AIR_TICKET", "MANPOWER", "TOUR", "HOTEL"] as const;
export const serviceTypeSchema = z.enum(SERVICE_TYPES);
export type ServiceTypeDto = z.infer<typeof serviceTypeSchema>;

export const BOOKING_STATUSES = ["DRAFT", "PENDING", "PROCESSING", "CONFIRMED", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
export const bookingStatusSchema = z.enum(BOOKING_STATUSES);
export type BookingStatusDto = z.infer<typeof bookingStatusSchema>;

export const currencySchema = z.enum(["BDT", "USD", "SAR"]);
export type CurrencyDto = z.infer<typeof currencySchema>;

export const genderSchema = z.enum(["MALE", "FEMALE"]);
export const stageStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "DONE", "NOT_APPLICABLE"]);

// A permissive YYYY-MM-DD (date-only) or ISO datetime string.
const dateStr = z.string().min(1);

// ── per-service detail schemas (required fields match the wizard UI) ──────────
export const hajjDetailSchema = z.object({
  packageTier: z.string().min(1),
  season: z.string().min(1),
  groupAssign: z.string().optional(),
  departureDate: dateStr,
  returnDate: dateStr.optional(),
  roomType: z.string().min(1),
  transport: z.string().min(1),
  hotelMakkah: z.string().min(1),
  hotelMadinah: z.string().min(1),
  daysMakkah: z.coerce.number().int().nonnegative().optional(),
  daysMadinah: z.coerce.number().int().nonnegative().optional(),
  // package components (Phase 2)
  haramDistanceMakkah: z.string().optional(),
  haramDistanceMadinah: z.string().optional(),
  tentCategory: z.string().optional(),
  maktabNo: z.string().optional(),
  qurbani: z.boolean().optional(),
  mahramRequired: z.boolean().optional(),
  specialRequests: z.string().optional(),
});

// Umrah: no Hajj-only Mina/Maktab/Qurbani fields, but a visa window instead.
export const umrahDetailSchema = hajjDetailSchema
  .omit({ groupAssign: true, tentCategory: true, maktabNo: true, qurbani: true })
  .extend({
    visaIssuedAt: dateStr.optional(),
    visaExpiry: dateStr.optional(),
  });

export const visaDetailSchema = z.object({
  destinationCountry: z.string().min(1),
  visaType: z.string().min(1),
  processingSpeed: z.string().min(1),
  passportCount: z.coerce.number().int().min(1),
  purpose: z.string().optional(),
  visaNumber: z.string().optional(),
  visaExpiry: dateStr.optional(),
  notes: z.string().optional(),
});

export const airTicketDetailSchema = z.object({
  airline: z.string().min(1),
  pnr: z.string().min(1),
  journeyType: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  cabinClass: z.string().min(1),
  departAt: dateStr,
  returnAt: dateStr.optional(),
  baseFare: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative().optional(),
  agentMarkup: z.coerce.number().nonnegative().optional(),
  fareType: z.string().optional(),
  baggage: z.string().optional(),
});

export const hotelDetailSchema = z.object({
  city: z.string().min(1),
  hotelName: z.string().min(1),
  starRating: z.coerce.number().int().min(1).max(7).optional(),
  checkIn: dateStr,
  checkOut: dateStr,
  roomType: z.string().min(1),
  rooms: z.coerce.number().int().min(1),
  guests: z.coerce.number().int().min(1),
  boardBasis: z.string().min(1),
  confirmationNo: z.string().optional(),
  distanceFromHaram: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const manpowerDetailSchema = z.object({
  workerCategory: z.string().min(1),
  jobTitle: z.string().min(1),
  destinationCountry: z.string().min(1),
  destinationCity: z.string().optional(),
  employer: z.string().min(1),
  contractDuration: z.string().min(1),
  monthlySalary: z.string().min(1),
  accommodation: z.string().optional(),
});

export const tourDetailSchema = z.object({
  packageTier: z.string().min(1), // tour package name
  tourType: z.string().optional(),
  destinations: z.string().min(1),
  duration: z.string().optional(),
  departureDate: dateStr,
  returnDate: dateStr.optional(),
  travelers: z.coerce.number().int().min(1).optional(),
  hotelCategory: z.string().min(1),
  roomSharing: z.string().optional(),
  mealPlan: z.string().min(1),
  itineraryNote: z.string().optional(),
});

/** Map serviceType → its strict detail schema (used by create/confirm). */
export const detailSchemaFor = {
  HAJJ: hajjDetailSchema,
  UMRAH: umrahDetailSchema,
  VISA: visaDetailSchema,
  AIR_TICKET: airTicketDetailSchema,
  HOTEL: hotelDetailSchema,
  MANPOWER: manpowerDetailSchema,
  TOUR: tourDetailSchema,
} as const;

// ── travelers / charges / customer ───────────────────────────────────────────
export const travelerSchema = z.object({
  name: z.string().min(1),
  dob: dateStr.optional(),
  gender: genderSchema.optional(),
  nationality: z.string().optional(),
  passportNo: z.string().optional(),
  passportExpiry: dateStr.optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  isPrimary: z.boolean().optional(),
  mahramRelation: z.enum(["HUSBAND", "FATHER", "BROTHER", "SON", "UNCLE", "OTHER"]).optional(),
});

export const chargeSchema = z.object({
  label: z.string().min(1),
  amount: z.number(),
  currency: currencySchema.optional(),
  exchangeRate: z.number().positive().optional(),
  kind: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
});

// ── money (server computes baseAmount + forces BDT rate=1) ────────────────────
const moneyFields = {
  amount: z.number().nonnegative(),
  currency: currencySchema.default("BDT"),
  exchangeRate: z.number().positive().optional(),
  paidAmount: z.number().nonnegative().optional(),
  discountType: z.string().optional(),
  discountValue: z.number().optional(),
};

// ── create / update ───────────────────────────────────────────────────────────
const baseBookingFields = {
  ...moneyFields,
  branchId: z.string().optional(), // global admins may target a branch; others: own
  customerId: z.string().optional(),
  customer: customerSchema.optional(),
  packageId: z.string().optional(),
  agentId: z.string().optional(),
  assignedStaffId: z.string().optional(),
  source: z.string().optional(),
  departureDate: dateStr.optional(),
  returnDate: dateStr.optional(),
  travelers: z.array(travelerSchema).optional(),
  charges: z.array(chargeSchema).optional(),
  notes: z.string().optional(),
  // wizard resume state (also acceptable at create so a draft can be seeded)
  currentStep: z.number().int().min(0).optional(),
  wizardData: z.record(z.any()).optional(),
};

/** Discriminated by serviceType so `detail` is validated per service. */
export const bookingCreateSchema = z.discriminatedUnion("serviceType", [
  z.object({ serviceType: z.literal("HAJJ"), detail: hajjDetailSchema.partial(), ...baseBookingFields }),
  z.object({ serviceType: z.literal("UMRAH"), detail: umrahDetailSchema.partial(), ...baseBookingFields }),
  z.object({ serviceType: z.literal("VISA"), detail: visaDetailSchema.partial(), ...baseBookingFields }),
  z.object({ serviceType: z.literal("AIR_TICKET"), detail: airTicketDetailSchema.partial(), ...baseBookingFields }),
  z.object({ serviceType: z.literal("HOTEL"), detail: hotelDetailSchema.partial(), ...baseBookingFields }),
  z.object({ serviceType: z.literal("MANPOWER"), detail: manpowerDetailSchema.partial(), ...baseBookingFields }),
  z.object({ serviceType: z.literal("TOUR"), detail: tourDetailSchema.partial(), ...baseBookingFields }),
]);
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

/** Update: all fields optional; detail is a loose record validated per-service in the service layer. */
export const bookingUpdateSchema = z.object({
  ...moneyFields,
  amount: z.number().nonnegative().optional(),
  customerId: z.string().optional(),
  customer: customerSchema.optional(),
  agentId: z.string().optional(),
  assignedStaffId: z.string().optional(),
  status: bookingStatusSchema.optional(),
  departureDate: dateStr.optional(),
  returnDate: dateStr.optional(),
  detail: z.record(z.any()).optional(),
  travelers: z.array(travelerSchema).optional(),
  charges: z.array(chargeSchema).optional(),
  notes: z.string().optional(),
});
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;

/** Lightweight per-step autosave for wizard resume (never browser storage). */
export const bookingDraftSchema = z.object({
  currentStep: z.number().int().min(0),
  wizardData: z.record(z.any()),
});
export type BookingDraftInput = z.infer<typeof bookingDraftSchema>;

// ── list query ────────────────────────────────────────────────────────────────
export const bookingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(8),
  sort: z.enum(["id", "amount", "date"]).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  q: z.string().optional(),
  status: bookingStatusSchema.optional(),
  serviceType: serviceTypeSchema.optional(),
  branchId: z.string().optional(),
  agentId: z.string().optional(),
  customerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
export type BookingListQuery = z.infer<typeof bookingListQuerySchema>;

// ── response DTOs (plain types; responses aren't zod-validated on the client) ──
export interface CustomerDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}
export interface TravelerDto {
  id: string;
  name: string;
  dob: string | null;
  gender: "MALE" | "FEMALE" | null;
  nationality: string | null;
  passportNo: string | null; // decrypted server-side for authorized reads
  passportExpiry: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  mahramRelation: string | null;
}
export interface ChargeDto {
  id: string;
  label: string;
  amount: number;
  currency: CurrencyDto;
  baseAmount: number;
  kind: string | null;
}
export interface DocumentDto {
  id: string;
  type: string;
  name: string;
  status: string;
  required: boolean;
  expiryAt: string | null;
}
export interface StageEventDto {
  id: string;
  stage: string;
  status: string;
  note: string | null;
  createdAt: string;
}
export interface ActivityDto {
  id: string;
  action: string;
  note: string | null;
  actor: string | null;
  createdAt: string;
}

export interface BookingListItem {
  id: string;
  bookingNo: string | null;
  serviceType: ServiceTypeDto;
  status: BookingStatusDto;
  amount: number;
  paidAmount: number;
  currency: CurrencyDto;
  branchId: string;
  branchName: string | null;
  customer: { name: string; phone: string; email: string | null } | null;
  packageName: string | null;
  staffName: string | null;
  agentName: string | null;
  travelersCount: number;
  departureDate: string | null;
  createdAt: string;
}

export interface BookingListResponse {
  data: BookingListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  stats: {
    total: number;
    confirmed: number;
    inProgress: number;
    revenueCollected: number;
    byStatus: Record<string, number>;
  };
}

export interface BookingDetailResponse extends BookingListItem {
  currentStep: number;
  wizardData: Record<string, unknown> | null;
  notes: string | null;
  returnDate: string | null;
  discountType: string | null;
  discountValue: number | null;
  detail: Record<string, unknown> | null; // the typed-detail row for this serviceType
  travelers: TravelerDto[];
  charges: ChargeDto[];
  documents: DocumentDto[];
  stageEvents: StageEventDto[];
  activities: ActivityDto[];
}
