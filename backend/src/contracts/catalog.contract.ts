/**
 * Shared Catalog contract (Packages + Services). Catalog data is COMPANY-WIDE:
 * Package/Service and their children carry NO branchId in the schema, so these
 * endpoints apply RBAC only (requirePermission "packages") and do NOT branch-
 * scope — a package is sold from any branch. Same zod+DTO discipline as the
 * other contracts; depends only on `zod`.
 */
import { z } from "zod";
import { serviceTypeSchema, currencySchema, type ServiceTypeDto, type CurrencyDto } from "./booking.contract";

export const PACKAGE_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED", "SUSPENDED"] as const;
export const packageStatusSchema = z.enum(PACKAGE_STATUSES);
export type PackageStatusDto = z.infer<typeof packageStatusSchema>;

const optStr = z.string().trim().optional();
const dateStr = z.string().min(1);

// ── package children ──────────────────────────────────────────────────────────
export const tierSchema = z.object({
  label: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  originalPrice: z.coerce.number().nonnegative().optional(),
  currency: currencySchema.optional(),
  exchangeRate: z.coerce.number().positive().optional(),
  seats: z.coerce.number().int().min(0).optional(),
  occupied: z.coerce.number().int().min(0).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const itineraryDaySchema = z.object({
  day: z.coerce.number().int().min(1),
  title: z.string().min(1),
  description: optStr,
  activities: z.array(z.string()).optional(),
  hotel: optStr,
  breakfast: z.boolean().optional(),
  lunch: z.boolean().optional(),
  dinner: z.boolean().optional(),
  transport: optStr,
});

export const inclusionSchema = z.object({
  kind: z.enum(["include", "exclude"]),
  text: z.string().min(1),
  sortOrder: z.coerce.number().int().optional(),
});

export const availabilitySchema = z.object({
  departureDate: dateStr,
  totalSeats: z.coerce.number().int().min(0).optional(),
  soldSeats: z.coerce.number().int().min(0).optional(),
  status: optStr,
});

// hotels/flights are display-config JSON — kept loose (no upload pipeline yet).
const jsonEntry = z.array(z.record(z.any())).optional();

const packageFields = {
  serviceId: optStr,
  type: serviceTypeSchema,
  name: z.string().trim().min(1),
  slug: optStr,
  code: optStr,
  season: optStr,
  departure: optStr,
  duration: optStr,
  status: packageStatusSchema.optional(),
  basePrice: z.coerce.number().nonnegative(),
  originalPrice: z.coerce.number().nonnegative().optional(),
  currency: currencySchema.optional(),
  exchangeRate: z.coerce.number().positive().optional(),
  totalSeats: z.coerce.number().int().min(0).optional(),
  availableSeats: z.coerce.number().int().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  image: optStr,
  images: z.array(z.string()).optional(),
  shortDesc: optStr,
  longDesc: optStr,
  featured: z.boolean().optional(),
  hotels: jsonEntry,
  flights: jsonEntry,
  tiers: z.array(tierSchema).optional(),
  itinerary: z.array(itineraryDaySchema).optional(),
  inclusions: z.array(inclusionSchema).optional(),
  availability: z.array(availabilitySchema).optional(),
};

export const packageCreateSchema = z.object(packageFields);
export type PackageCreateInput = z.infer<typeof packageCreateSchema>;

export const packageUpdateSchema = z.object({ ...packageFields, type: serviceTypeSchema.optional(), name: z.string().trim().min(1).optional(), basePrice: z.coerce.number().nonnegative().optional() });
export type PackageUpdateInput = z.infer<typeof packageUpdateSchema>;

export const packageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(10),
  sort: z.enum(["name", "price", "date", "bookings"]).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  q: optStr,
  type: serviceTypeSchema.optional(),
  status: packageStatusSchema.optional(),
  season: optStr,
});
export type PackageListQuery = z.infer<typeof packageListQuerySchema>;

// ── services ────────────────────────────────────────────────────────────────
export const serviceCreateSchema = z.object({
  key: z.string().trim().min(1),
  type: serviceTypeSchema,
  name: z.string().trim().min(1),
  category: optStr,
  description: optStr,
  icon: optStr,
  color: optStr,
  refPrefix: optStr,
  maxGroupSize: z.coerce.number().int().min(0).optional(),
  minLeadTimeDays: z.coerce.number().int().min(0).optional(),
  showOnWebsite: z.boolean().optional(),
  allowDirectBooking: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  enableAgentCommission: z.boolean().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;

export const serviceUpdateSchema = serviceCreateSchema.partial().omit({ key: true });
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

// ── response DTOs ───────────────────────────────────────────────────────────
export interface TierDto { id: string; label: string; price: number; originalPrice: number | null; currency: CurrencyDto; baseAmount: number; seats: number; occupied: number; sortOrder: number }
export interface ItineraryDto { id: string; day: number; title: string; description: string | null; activities: string[]; hotel: string | null; breakfast: boolean; lunch: boolean; dinner: boolean; transport: string | null }
export interface InclusionDto { id: string; kind: string; text: string; sortOrder: number }
export interface AvailabilityDto { id: string; departureDate: string; totalSeats: number; soldSeats: number; availableSeats: number; status: string }

export interface PackageListItem {
  id: string;
  code: string;
  slug: string;
  type: ServiceTypeDto;
  name: string;
  season: string | null;
  departure: string | null;
  duration: string | null;
  status: PackageStatusDto;
  basePrice: number;
  originalPrice: number | null;
  currency: CurrencyDto;
  totalSeats: number;
  availableSeats: number;
  rating: number | null;
  bookingsCount: number;
  revenue: number;
  image: string | null;
  featured: boolean;
  shortDesc: string | null;
  createdAt: string;
}

export interface PackageDetail extends PackageListItem {
  longDesc: string | null;
  baseAmount: number;
  exchangeRate: number;
  images: string[];
  hotels: Record<string, unknown>[];
  flights: Record<string, unknown>[];
  serviceId: string | null;
  tiers: TierDto[];
  itinerary: ItineraryDto[];
  inclusions: InclusionDto[];
  availability: AvailabilityDto[];
}

export interface PackageListResponse {
  data: PackageListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  stats: { total: number; active: number; draft: number; totalRevenue: number };
}

export interface ServiceDto {
  id: string;
  key: string;
  type: ServiceTypeDto;
  name: string;
  category: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  refPrefix: string | null;
  maxGroupSize: number | null;
  minLeadTimeDays: number | null;
  showOnWebsite: boolean;
  allowDirectBooking: boolean;
  requireApproval: boolean;
  enableAgentCommission: boolean;
  active: boolean;
  featured: boolean;
  packagesCount: number;
}
export interface ServiceListResponse { data: ServiceDto[] }
