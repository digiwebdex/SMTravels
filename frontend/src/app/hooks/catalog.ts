import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  PackageListResponse, PackageDetail, PackageListItem, PackageCreateInput, PackageUpdateInput,
  ServiceListResponse, ServiceDto, ServiceUpdateInput, PackageStatusDto,
} from "@contracts/catalog.contract";
import type { ServiceTypeDto } from "@contracts/booking.contract";

// ── enum ↔ UI label maps ──────────────────────────────────────────────────────
export type PkgType = "Hajj" | "Umrah" | "Tour" | "Visa" | "Manpower" | "Hotel";
export type PkgStatus = "Active" | "Draft" | "Archived" | "Suspended";

const TYPE_TO_ENUM: Record<PkgType, ServiceTypeDto> = { Hajj: "HAJJ", Umrah: "UMRAH", Tour: "TOUR", Visa: "VISA", Manpower: "MANPOWER", Hotel: "HOTEL" };
const ENUM_TO_TYPE: Partial<Record<ServiceTypeDto, PkgType>> = { HAJJ: "Hajj", UMRAH: "Umrah", TOUR: "Tour", VISA: "Visa", MANPOWER: "Manpower", HOTEL: "Hotel", AIR_TICKET: "Tour" };
const STATUS_TO_ENUM: Record<PkgStatus, PackageStatusDto> = { Active: "ACTIVE", Draft: "DRAFT", Archived: "ARCHIVED", Suspended: "SUSPENDED" };
const ENUM_TO_STATUS: Record<PackageStatusDto, PkgStatus> = { ACTIVE: "Active", DRAFT: "Draft", ARCHIVED: "Archived", SUSPENDED: "Suspended" };

export const pkgTypeToEnum = (t: PkgType): ServiceTypeDto => TYPE_TO_ENUM[t];
export const pkgStatusToEnum = (s: PkgStatus): PackageStatusDto => STATUS_TO_ENUM[s];

// ── view-model (matches PackageManagement.tsx's Package interface) ────────────
export interface PkgVM {
  id: string; code: string; name: string; slug: string; type: PkgType; season: string;
  departure: string; duration: string; status: PkgStatus;
  basePrice: number; originalPrice?: number; totalSeats: number; availableSeats: number;
  rating: number; bookings: number; revenue: number; image: string; shortDesc: string; featured: boolean;
  tiers: { id: string; label: string; price: number; originalPrice?: number; seats: number; occupied: number }[];
  itinerary: { id: string; day: number; title: string; desc: string; activities: string[]; hotel: string; meals: { breakfast: boolean; lunch: boolean; dinner: boolean }; transport: string; expanded: boolean }[];
  hotels: { id: string; city: string; name: string; stars: number; roomType: string; nights: number }[];
  flights: { id: string; carrier: string; flightNo: string; from: string; to: string; cabin: string; dep: string; arr: string }[];
  includes: string[]; excludes: string[]; images: string[]; departureDates: string[];
  availability?: { departureDate: string; totalSeats: number; soldSeats: number; availableSeats: number }[];
}

export function mapListItem(p: PackageListItem): PkgVM {
  return {
    id: p.id, code: p.code, name: p.name, slug: p.slug, type: ENUM_TO_TYPE[p.type] ?? "Tour", season: p.season ?? "",
    departure: p.departure ?? "", duration: p.duration ?? "", status: ENUM_TO_STATUS[p.status],
    basePrice: p.basePrice, originalPrice: p.originalPrice ?? undefined, totalSeats: p.totalSeats, availableSeats: p.availableSeats,
    rating: p.rating ?? 0, bookings: p.bookingsCount, revenue: p.revenue, image: p.image ?? "", shortDesc: p.shortDesc ?? "", featured: p.featured,
    tiers: [], itinerary: [], hotels: [], flights: [], includes: [], excludes: [], images: [], departureDates: [],
  };
}

export function mapDetail(p: PackageDetail): PkgVM {
  return {
    ...mapListItem(p),
    tiers: p.tiers.map((t) => ({ id: t.id, label: t.label, price: t.price, originalPrice: t.originalPrice ?? undefined, seats: t.seats, occupied: t.occupied })),
    itinerary: p.itinerary.map((d) => ({ id: d.id, day: d.day, title: d.title, desc: d.description ?? "", activities: d.activities, hotel: d.hotel ?? "", meals: { breakfast: d.breakfast, lunch: d.lunch, dinner: d.dinner }, transport: d.transport ?? "", expanded: false })),
    hotels: (p.hotels as PkgVM["hotels"]) ?? [],
    flights: (p.flights as PkgVM["flights"]) ?? [],
    includes: p.inclusions.filter((i) => i.kind === "include").map((i) => i.text),
    excludes: p.inclusions.filter((i) => i.kind === "exclude").map((i) => i.text),
    images: p.images,
    departureDates: p.availability.map((a) => a.departureDate),
    availability: p.availability.map((a) => ({ departureDate: a.departureDate, totalSeats: a.totalSeats, soldSeats: a.soldSeats, availableSeats: a.availableSeats })),
  };
}

/** Build the create/update payload from the (already-controlled) form fields. */
export function toPackagePayload(f: {
  name: string; type: PkgType; season: string; duration: string; departure: string; status: PkgStatus;
  shortDesc: string; longDesc: string; featured: boolean;
  tiers: { label: string; price: number; originalPrice?: number; seats: number; occupied: number }[];
  days: { day: number; title: string; desc: string; activities: string[]; hotel: string; meals: { breakfast: boolean; lunch: boolean; dinner: boolean }; transport: string }[];
  hotels: unknown[]; flights: unknown[]; includes: string[]; excludes: string[]; departureDates: string[];
  image?: string;
}): PackageCreateInput {
  const prices = f.tiers.map((t) => Number(t.price) || 0).filter((n) => n > 0);
  const basePrice = prices.length ? Math.min(...prices) : 0;
  const cheapest = f.tiers.slice().sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))[0];
  return {
    type: pkgTypeToEnum(f.type), name: f.name, season: f.season || undefined, duration: f.duration || undefined,
    departure: f.departure || undefined, status: pkgStatusToEnum(f.status), shortDesc: f.shortDesc || undefined,
    longDesc: f.longDesc || undefined, featured: f.featured, currency: "BDT",
    basePrice, originalPrice: cheapest?.originalPrice ? Number(cheapest.originalPrice) : undefined,
    image: f.image || undefined,
    tiers: f.tiers.map((t, i) => ({ label: t.label, price: Number(t.price) || 0, originalPrice: t.originalPrice ? Number(t.originalPrice) : undefined, seats: Number(t.seats) || 0, occupied: Number(t.occupied) || 0, sortOrder: i })),
    itinerary: f.days.map((d) => ({ day: d.day, title: d.title, description: d.desc || undefined, activities: d.activities, hotel: d.hotel || undefined, breakfast: d.meals.breakfast, lunch: d.meals.lunch, dinner: d.meals.dinner, transport: d.transport || undefined })),
    inclusions: [
      ...f.includes.filter(Boolean).map((text, i) => ({ kind: "include" as const, text, sortOrder: i })),
      ...f.excludes.filter(Boolean).map((text, i) => ({ kind: "exclude" as const, text, sortOrder: i })),
    ],
    availability: f.departureDates.map((d) => ({ departureDate: d })),
    hotels: f.hotels as Record<string, unknown>[],
    flights: f.flights as Record<string, unknown>[],
  };
}

// ── query keys + hooks ────────────────────────────────────────────────────────
export interface PackageListParams { page?: number; pageSize?: number; sort?: string; dir?: string; q?: string; type?: string; status?: string; season?: string }
function qs(p: Record<string, string | number | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "" && v !== "All") s.set(k, String(v));
  return s.toString();
}
export const catalogKeys = {
  packages: (p: unknown) => ["catalog", "packages", p] as const,
  package: (id: string) => ["catalog", "package", id] as const,
  services: ["catalog", "services"] as const,
};
const err = (e: Error) => toast.error(e.message || "Something went wrong");

export function usePackages(params: PackageListParams) {
  return useQuery({
    queryKey: catalogKeys.packages(params),
    queryFn: () => apiFetch<PackageListResponse>(`/packages?${qs(params as Record<string, string | number | undefined>)}`),
    placeholderData: (p) => p,
  });
}
export function usePackage(id: string | null) {
  return useQuery({ queryKey: catalogKeys.package(id ?? ""), queryFn: () => apiFetch<PackageDetail>(`/packages/${id}`), enabled: !!id });
}
export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PackageCreateInput) => apiFetch<PackageDetail>("/packages", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (p) => { qc.invalidateQueries({ queryKey: ["catalog", "packages"] }); toast.success(`Package ${p.code} created`); },
    onError: err,
  });
}
export function useUpdatePackage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PackageUpdateInput) => apiFetch<PackageDetail>(`/packages/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["catalog", "packages"] }); qc.invalidateQueries({ queryKey: catalogKeys.package(id) }); toast.success("Package updated"); },
    onError: err,
  });
}
export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/packages/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["catalog", "packages"] }); toast.success("Package archived"); },
    onError: err,
  });
}

// ── services ──────────────────────────────────────────────────────────────────
export function useServices() {
  return useQuery({ queryKey: catalogKeys.services, queryFn: () => apiFetch<ServiceListResponse>("/services").then((r) => r.data) });
}
export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ServiceUpdateInput }) => apiFetch<ServiceDto>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.services }); },
    onError: err,
  });
}

export type { ServiceDto, PackageDetail };
