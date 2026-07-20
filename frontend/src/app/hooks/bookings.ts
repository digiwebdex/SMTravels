import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  BookingListResponse,
  BookingListItem,
  BookingDetailResponse,
  BookingCreateInput,
  BookingUpdateInput,
  ServiceTypeDto,
  BookingStatusDto,
} from "@contracts/booking.contract";
import type { Booking, ServiceType, BookingStatus } from "../erp/bookings/BookingsModule";

// ── enum ↔ UI-label maps ──────────────────────────────────────────────────────
export const SERVICE_LABEL: Record<ServiceTypeDto, ServiceType> = {
  HAJJ: "Hajj", UMRAH: "Umrah", VISA: "Visa", AIR_TICKET: "Air Ticket",
  HOTEL: "Hotel", MANPOWER: "Manpower", TOUR: "Tour",
};
export const SERVICE_ENUM: Record<ServiceType, ServiceTypeDto> = {
  Hajj: "HAJJ", Umrah: "UMRAH", Visa: "VISA", "Air Ticket": "AIR_TICKET",
  Hotel: "HOTEL", Manpower: "MANPOWER", Tour: "TOUR",
};
const STATUS_LABEL: Record<BookingStatusDto, BookingStatus> = {
  DRAFT: "Draft", PENDING: "Pending", PROCESSING: "Processing", CONFIRMED: "Confirmed",
  ON_HOLD: "On Hold", COMPLETED: "Completed", CANCELLED: "Cancelled",
};
export const STATUS_ENUM: Partial<Record<BookingStatus, BookingStatusDto>> = {
  Draft: "DRAFT", Pending: "PENDING", Processing: "PROCESSING", Confirmed: "CONFIRMED",
  "On Hold": "ON_HOLD", Completed: "COMPLETED", Cancelled: "CANCELLED",
};

// ── DTO → view-model mapping (keeps the existing UI components unchanged) ──────
export function mapListItem(x: BookingListItem): Booking {
  return {
    id: x.id,
    ref: x.bookingNo ?? "Draft",
    customer: x.customer
      ? { name: x.customer.name, phone: x.customer.phone, email: x.customer.email ?? "" }
      : { name: "—", phone: "", email: "" },
    service: SERVICE_LABEL[x.serviceType],
    package: x.packageName ?? "—",
    amount: x.amount,
    paid: x.paidAmount,
    status: STATUS_LABEL[x.status],
    branch: x.branchName ?? "—",
    staff: x.staffName ?? "—",
    agent: x.agentName ?? undefined,
    createdAt: x.createdAt.slice(0, 10),
    departure: x.departureDate ?? undefined,
    travelers: x.travelersCount,
    travelerList: [],
    installments: [],
    serviceDetails: {},
    activityLog: [],
  };
}

function buildServiceDetails(service: ServiceTypeDto, d: Record<string, unknown> | null): Record<string, string | number> {
  if (!d) return {};
  const g = (k: string) => d[k];
  const out: Record<string, string | number> = {};
  const put = (k: string, v: unknown) => { if (v != null && v !== "") out[k] = v as string | number; };
  switch (service) {
    case "HAJJ":
    case "UMRAH":
      put("Package", g("packageTier")); put("Season", g("season")); put("Group", g("groupAssign"));
      put("Room Type", g("roomType")); put("Transport", g("transport"));
      put("Hotel Makkah", g("hotelMakkah")); put("Hotel Madinah", g("hotelMadinah"));
      put("Mahram", g("mahramRequired") ? "Yes" : "No"); break;
    case "VISA":
      put("Country", g("destinationCountry")); put("Visa Type", g("visaType"));
      put("Processing", g("processingSpeed")); put("No. Passports", g("passportCount"));
      put("Status", g("visaNumber") ? "Issued" : g("stageStatus") === "IN_PROGRESS" ? "Under Review" : "Pending Submission"); break;
    case "AIR_TICKET":
      put("Airline", g("airline")); put("PNR", g("pnr"));
      put("Route", g("origin") && g("destination") ? `${g("origin")} → ${g("destination")}` : "");
      put("Class", g("cabinClass")); put("Fare Type", g("fareType")); break;
    case "HOTEL":
      put("City", g("city")); put("Hotel", g("hotelName")); put("Stars", g("starRating"));
      put("Check-in", g("checkIn")); put("Check-out", g("checkOut"));
      put("Room", g("roomType")); put("Guests", g("guests")); put("Board", g("boardBasis")); break;
    case "MANPOWER":
      put("Category", g("workerCategory")); put("Subcategory", g("jobTitle"));
      put("Destination", [g("destinationCity"), g("destinationCountry")].filter(Boolean).join(", "));
      put("Employer", g("employer")); put("Contract", g("contractDuration")); put("Salary", g("monthlySalary")); break;
    case "TOUR":
      put("Destination", g("destinations")); put("Duration", g("duration"));
      put("Hotel", g("hotelCategory")); put("Meal Plan", g("mealPlan")); put("Travelers", g("travelers")); break;
  }
  return out;
}

export function mapDetail(x: BookingDetailResponse): Booking {
  return {
    ...mapListItem(x),
    travelerList: x.travelers.map((t) => ({
      id: t.id, name: t.name, dob: t.dob ?? "", gender: t.gender === "FEMALE" ? "Female" : "Male",
      nationality: t.nationality ?? "Bangladeshi", passportNo: t.passportNo ?? "", passportExpiry: t.passportExpiry ?? "",
      phone: t.phone ?? "", email: t.email ?? "", isPrimary: t.isPrimary, mahram: t.mahramRelation ?? undefined,
    })),
    installments: [], // payment schedule belongs to the Finance module (later)
    serviceDetails: buildServiceDetails(x.serviceType, x.detail),
    activityLog: x.activities.map((a) => ({
      time: a.createdAt.replace("T", " ").slice(0, 16), actor: a.actor ?? "System", action: a.action, note: a.note ?? undefined,
    })),
  };
}

// ── query params ──────────────────────────────────────────────────────────────
export interface BookingListParams {
  page: number; pageSize: number; sort: "id" | "amount" | "date"; dir: "asc" | "desc";
  q?: string; status?: BookingStatusDto; serviceType?: ServiceTypeDto; branchId?: string;
}
function qs(p: BookingListParams): string {
  const s = new URLSearchParams();
  s.set("page", String(p.page)); s.set("pageSize", String(p.pageSize)); s.set("sort", p.sort); s.set("dir", p.dir);
  if (p.q) s.set("q", p.q);
  if (p.status) s.set("status", p.status);
  if (p.serviceType) s.set("serviceType", p.serviceType);
  if (p.branchId) s.set("branchId", p.branchId);
  return s.toString();
}

// ── query keys ────────────────────────────────────────────────────────────────
export const bookingKeys = {
  all: ["bookings"] as const,
  list: (p: BookingListParams) => ["bookings", "list", p] as const,
  detail: (id: string) => ["bookings", "detail", id] as const,
  branches: ["branches"] as const,
};

// ── hooks ─────────────────────────────────────────────────────────────────────
export function useBookings(params: BookingListParams) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => apiFetch<BookingListResponse>(`/bookings?${qs(params)}`),
    placeholderData: (prev) => prev, // keep previous page visible while fetching next
  });
}

export function useBooking(id: string | null) {
  return useQuery({
    queryKey: bookingKeys.detail(id ?? ""),
    queryFn: () => apiFetch<BookingDetailResponse>(`/bookings/${id}`),
    enabled: !!id,
  });
}

export interface BranchOption { id: string; code: string; name: string; city: string; isHq: boolean }
export function useBranches() {
  return useQuery({
    queryKey: bookingKeys.branches,
    queryFn: () => apiFetch<{ data: BranchOption[] }>("/branches").then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingCreateInput) =>
      apiFetch<BookingDetailResponse>("/bookings", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export function useUpdateBooking(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingUpdateInput) =>
      apiFetch<BookingDetailResponse>(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      qc.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useSaveDraft() {
  return useMutation({
    mutationFn: ({ id, currentStep, wizardData }: { id: string; currentStep: number; wizardData: Record<string, unknown> }) =>
      apiFetch<{ id: string; currentStep: number }>(`/bookings/${id}/draft`, {
        method: "PATCH",
        body: JSON.stringify({ currentStep, wizardData }),
      }),
  });
}

export function useConfirmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<BookingDetailResponse>(`/bookings/${id}/confirm`, { method: "POST" }),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: bookingKeys.detail(b.id) });
    },
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/bookings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      toast.success("Booking deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete booking"),
  });
}
