import React, { useState } from "react";
import {
  Plus, Search, Filter, MoreHorizontal, Edit2, Eye, Copy, Archive,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Trash2, Star,
  CheckCircle, XCircle, X, Upload, Calendar, MapPin, Plane,
  Hotel, Coffee, Sunset, Moon, Users, DollarSign, TrendingUp,
  Clock, AlertTriangle, Check, ChevronDown, Image, Info,
  Globe, Package, Tag, BarChart3, ArrowUpRight, Building2,
  Layers, FileText, Settings2, Zap, RefreshCw, Download,
} from "lucide-react";
import { cn, fmtPrice, img } from "../lib/utils";
import { SkeletonTable, ErrorBanner } from "../lib/ds";
import {
  usePackages, usePackage, useCreatePackage, useUpdatePackage, useDeletePackage,
  mapListItem, mapDetail, toPackagePayload, pkgTypeToEnum, pkgStatusToEnum,
  type PackageListParams,
} from "../hooks/catalog";
import { ModulePage } from "../design-system/patterns/ModulePage";

// ─── Types ────────────────────────────────────────────────────────────────────
type PkgView = "list" | "form" | "detail";
type FormTab = "basic" | "pricing" | "itinerary" | "hotels" | "inclusions" | "images" | "calendar";
type DetailTab = "overview" | "pricing" | "itinerary" | "bookings";
type PkgStatus = "Active" | "Draft" | "Archived" | "Suspended";
type PkgType = "Hajj" | "Umrah" | "Tour" | "Visa" | "Manpower" | "Hotel";

interface PricingTier {
  id: string; label: string; price: number; originalPrice?: number; seats: number; occupied: number;
}

interface ItineraryDay {
  id: string; day: number; title: string; desc: string;
  activities: string[]; hotel: string;
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
  transport: string; expanded: boolean;
}

interface HotelEntry { id: string; city: string; name: string; stars: number; roomType: string; nights: number; }
interface FlightEntry { id: string; carrier: string; flightNo: string; from: string; to: string; cabin: string; dep: string; arr: string; }

interface Package {
  id: string; code: string; name: string; slug: string; type: PkgType; season: string;
  departure: string; duration: string; status: PkgStatus;
  basePrice: number; originalPrice?: number; totalSeats: number; availableSeats: number;
  rating: number; bookings: number; revenue: number; image: string;
  shortDesc: string; featured: boolean;
  tiers: PricingTier[]; itinerary: ItineraryDay[];
  hotels: HotelEntry[]; flights: FlightEntry[];
  includes: string[]; excludes: string[];
  images: string[]; departureDates: string[];
  availability?: { departureDate: string; totalSeats: number; soldSeats: number; availableSeats: number }[];
}

// ─── Presentation config (colours only — data comes from usePackages) ─────────
const TYPE_CFG: Record<PkgType, { color: string; bg: string; text: string }> = {
  Hajj:     { color: "#1B75BC", bg: "#EEF2FF", text: "text-[#1B75BC]" },
  Umrah:    { color: "#F15A24", bg: "#FFF9E6", text: "text-[#D64A12]" },
  Tour:     { color: "#EA580C", bg: "#FFF7ED", text: "text-[#EA580C]" },
  Visa:     { color: "#7C3AED", bg: "#F5F3FF", text: "text-[#7C3AED]" },
  Manpower: { color: "#2563EB", bg: "#EFF6FF", text: "text-[#2563EB]" },
  Hotel:    { color: "#0E7C66", bg: "#ECFDF5", text: "text-[#0E7C66]" },
};

const STATUS_CFG: Record<PkgStatus, { color: string; bg: string; dot: string }> = {
  Active:    { color: "#065F46", bg: "#D1FAE5", dot: "#0E7C66" },
  Draft:     { color: "#92400E", bg: "#FEF3C7", dot: "#F59E0B" },
  Archived:  { color: "#374151", bg: "#F3F4F6", dot: "#9CA3AF" },
  Suspended: { color: "#991B1B", bg: "#FEE2E2", dot: "#DC2626" },
};

// ─── Shared atoms ─────────────────────────────────────────────────────────────
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white border border-[#E5E7EB] rounded-[14px]", className)}>{children}</div>;
}

function TypeBadge({ type }: { type: PkgType }) {
  const cfg = TYPE_CFG[type];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>{type}</span>
  );
}

function StatusBadge({ status }: { status: PkgStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
      {status}
    </span>
  );
}

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[9px] text-[13px] text-[#111827] bg-white outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 transition-all placeholder:text-[#D1D5DB]";
const selectCls = cn(inputCls, "cursor-pointer appearance-none");

function PageBreadcrumb({ items, action }: { items: { label: string; onClick?: () => void }[]; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div className="flex items-center gap-1.5 text-[13px]">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={13} className="text-[#D1D5DB]" />}
            {item.onClick ? (
              <button onClick={item.onClick}
                className="text-[#1B75BC] font-semibold hover:underline cursor-pointer">{item.label}</button>
            ) : (
              <span className="text-[#374151] font-semibold">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
      {action}
    </div>
  );
}

// ─── PACKAGE LIST VIEW ────────────────────────────────────────────────────────
function PackageListView({
  onNew, onEdit, onView,
}: { onNew: () => void; onEdit: (id: string) => void; onView: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<PkgType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<PkgStatus | "All">("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const PER_PAGE = 10;

  const types: Array<PkgType | "All"> = ["All", "Hajj", "Umrah", "Tour", "Visa", "Manpower", "Hotel"];

  React.useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const params: PackageListParams = {
    page, pageSize: PER_PAGE, sort: "date", dir: "desc",
    q: q || undefined,
    type: typeFilter !== "All" ? pkgTypeToEnum(typeFilter) : undefined,
    status: statusFilter !== "All" ? pkgStatusToEnum(statusFilter) : undefined,
  };
  const { data, isLoading, isError, error, refetch } = usePackages(params);
  const del = useDeletePackage();
  const filtered = (data?.data ?? []).map(mapListItem);
  const total = data?.total ?? 0;
  const stats = data?.stats ?? { total: 0, active: 0, draft: 0, totalRevenue: 0 };
  const totalPages = data?.totalPages ?? 1;

  const toggleSelect = (id: string) => {
    setSelected(s => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAll = () => {
    setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-black text-[#111827]">All Packages</h1>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">{stats.total} total packages · {stats.active} active</p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled title="Export is not available in this build"
            className="flex items-center gap-1.5 h-9 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#9CA3AF] opacity-60 cursor-not-allowed">
            <Download size={13} className="text-[#9CA3AF]" /> Export
          </button>
          <button onClick={onNew}
            className="flex items-center gap-1.5 h-9 px-4 bg-[#1B75BC] rounded-[8px] text-[12px] font-bold text-white hover:bg-[#14588F] transition-colors cursor-pointer shadow-sm">
            <Plus size={14} /> New Package
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-4">
        <div className="flex flex-col gap-3">
          {/* Type pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={cn(
                  "h-7 px-3 rounded-full text-[11px] font-bold transition-all cursor-pointer",
                  typeFilter === t
                    ? t === "All" ? "bg-[#1B75BC] text-white" : "text-white"
                    : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E9EAEC]"
                )}
                style={typeFilter === t && t !== "All" ? { backgroundColor: TYPE_CFG[t as PkgType].color } : {}}>
                {t}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                className="h-7 px-2.5 border border-[#E5E7EB] rounded-[7px] text-[11px] text-[#374151] bg-white outline-none cursor-pointer focus:border-[#1B75BC]">
                <option value="All">All Status</option>
                {(["Active","Draft","Archived","Suspended"] as PkgStatus[]).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search packages by name or ID…"
                className="w-full pl-8 pr-3 h-9 border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#111827] bg-[#F7F8FA] outline-none focus:border-[#1B75BC] focus:bg-white transition-all" />
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 ml-auto text-[12px]">
                <span className="text-[#9CA3AF]">{selected.size} selected</span>
                <button disabled title="Archive is not available in this build" className="h-7 px-2.5 bg-[#F3F4F6] text-[#9CA3AF] font-medium rounded-[6px] opacity-60 cursor-not-allowed text-[11px]">Archive</button>
                <button disabled title="Duplicate is not available in this build" className="h-7 px-2.5 bg-[#F3F4F6] text-[#9CA3AF] font-medium rounded-[6px] opacity-60 cursor-not-allowed text-[11px]">Duplicate</button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {isError ? (
          <div className="p-6"><ErrorBanner message={(error as Error)?.message || "Failed to load packages."} onRetry={() => refetch()} /></div>
        ) : isLoading ? (
          <div className="p-4"><SkeletonTable rows={8} cols={8} /></div>
        ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
              <tr>
                <th className="w-10 py-3 pl-4">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="w-3.5 h-3.5 accent-[#1B75BC] cursor-pointer" />
                </th>
                {["Package", "Type", "Price From", "Availability", "Season", "Bookings", "Status", ""].map(h => (
                  <th key={h} className="text-left py-3 pr-4 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(pkg => {
                const pct = Math.round(((pkg.totalSeats - pkg.availableSeats) / pkg.totalSeats) * 100);
                const isSelected = selected.has(pkg.id);
                return (
                  <tr key={pkg.id}
                    className={cn("border-b border-[#F7F8FA] hover:bg-[#FAFBFC] transition-colors group", isSelected && "bg-[#EEF2FF]")}>
                    <td className="pl-4 py-3.5">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(pkg.id)}
                        className="w-3.5 h-3.5 accent-[#1B75BC] cursor-pointer" />
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[10px] overflow-hidden flex-shrink-0 bg-[#F3F4F6]">
                          <img src={`https://images.unsplash.com/${pkg.image}?w=96&h=96&fit=crop&auto=format`} alt={pkg.name}
                            className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[13px] font-bold text-[#111827] leading-tight line-clamp-1 max-w-[200px]">{pkg.name}</span>
                            {pkg.featured && <Star size={11} fill="#F15A24" className="text-[#D64A12] flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#9CA3AF]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{pkg.code}</span>
                            <span className="text-[10px] text-[#9CA3AF]">·</span>
                            <span className="text-[10px] text-[#9CA3AF]">{pkg.duration}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4"><TypeBadge type={pkg.type} /></td>
                    <td className="py-3.5 pr-4">
                      <div className="text-[13px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(pkg.basePrice)}</div>
                      {pkg.originalPrice && (
                        <div className="text-[10px] text-[#9CA3AF] line-through">{fmtPrice(pkg.originalPrice)}</div>
                      )}
                    </td>
                    <td className="py-3.5 pr-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{pkg.availableSeats}</span>
                        <span className="text-[10px] text-[#9CA3AF]">/ {pkg.totalSeats}</span>
                      </div>
                      <div className="w-20 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? "#DC2626" : pct >= 70 ? "#F59E0B" : "#0E7C66" }} />
                      </div>
                    </td>
                    <td className="py-3.5 pr-4"><span className="text-[12px] text-[#374151]">{pkg.season}</span></td>
                    <td className="py-3.5 pr-4">
                      <div className="text-[13px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{pkg.bookings}</div>
                      {pkg.rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Star size={9} fill="#F15A24" className="text-[#D64A12]" />
                          <span className="text-[10px] text-[#9CA3AF]">{pkg.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 pr-4"><StatusBadge status={pkg.status} /></td>
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onView(pkg.id)} title="View" className="w-7 h-7 flex items-center justify-center text-[#9CA3AF] hover:text-[#1B75BC] hover:bg-[#EEF2FF] rounded-[6px] transition-colors cursor-pointer"><Eye size={14} /></button>
                        <button onClick={() => onEdit(pkg.id)} title="Edit" className="w-7 h-7 flex items-center justify-center text-[#9CA3AF] hover:text-[#1B75BC] hover:bg-[#EEF2FF] rounded-[6px] transition-colors cursor-pointer"><Edit2 size={14} /></button>
                        <button disabled title="Duplicate is not available in this build" className="w-7 h-7 flex items-center justify-center text-[#9CA3AF] opacity-60 cursor-not-allowed rounded-[6px]"><Copy size={14} /></button>
                        <button disabled title="More is not available in this build" className="w-7 h-7 flex items-center justify-center text-[#9CA3AF] opacity-60 cursor-not-allowed rounded-[6px]"><MoreHorizontal size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-[#9CA3AF]">
            <Package size={32} className="mx-auto mb-3 text-[#E5E7EB]" />
            <p className="text-[13px] font-medium">No packages match your filters</p>
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F4F6]">
            <span className="text-[11px] text-[#9CA3AF]">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} packages</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="h-7 px-2.5 border border-[#E5E7EB] rounded-[6px] text-[11px] text-[#374151] hover:bg-[#F7F8FA] cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-40">
                <ChevronLeft size={12} /> Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={cn("h-7 w-7 rounded-[6px] text-[11px] font-medium cursor-pointer transition-colors",
                  page === i + 1 ? "bg-[#1B75BC] text-white" : "text-[#374151] hover:bg-[#F7F8FA] border border-[#E5E7EB]")}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-7 px-2.5 border border-[#E5E7EB] rounded-[6px] text-[11px] text-[#374151] hover:bg-[#F7F8FA] cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-40">
                Next <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </Card>
    </div>
  );
}

// ─── ITINERARY BUILDER ────────────────────────────────────────────────────────
function ItineraryBuilder({ days, onChange }: { days: ItineraryDay[]; onChange: (d: ItineraryDay[]) => void }) {
  const [actInput, setActInput] = useState<Record<string, string>>({});

  const update = (id: string, patch: Partial<ItineraryDay>) =>
    onChange(days.map(d => d.id === id ? { ...d, ...patch } : d));

  const toggleExpand = (id: string) =>
    onChange(days.map(d => d.id === id ? { ...d, expanded: !d.expanded } : d));

  const addDay = () => {
    const newDay: ItineraryDay = {
      id: `d${Date.now()}`, day: days.length + 1, title: `Day ${days.length + 1}`,
      desc: "", activities: [], hotel: "", meals: { breakfast: false, lunch: false, dinner: false },
      transport: "", expanded: true,
    };
    onChange([...days, newDay]);
  };

  const removeDay = (id: string) => {
    const next = days.filter(d => d.id !== id).map((d, i) => ({ ...d, day: i + 1 }));
    onChange(next);
  };

  const moveDay = (id: string, dir: "up" | "down") => {
    const idx = days.findIndex(d => d.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === days.length - 1) return;
    const next = [...days];
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onChange(next.map((d, i) => ({ ...d, day: i + 1 })));
  };

  const addActivity = (id: string) => {
    const val = (actInput[id] || "").trim();
    if (!val) return;
    const day = days.find(d => d.id === id)!;
    update(id, { activities: [...day.activities, val] });
    setActInput(s => ({ ...s, [id]: "" }));
  };

  const removeActivity = (dayId: string, act: string) => {
    const day = days.find(d => d.id === dayId)!;
    update(dayId, { activities: day.activities.filter(a => a !== act) });
  };

  return (
    <div>
      <div className="relative">
        {/* Timeline spine */}
        {days.length > 0 && (
          <div className="absolute left-[22px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#1B75BC]/30 via-[#F15A24]/30 to-[#0E7C66]/30" />
        )}
        <div className="flex flex-col gap-3">
          {days.map((day, idx) => (
            <div key={day.id} className="flex gap-4">
              {/* Day circle */}
              <div className="flex flex-col items-center flex-shrink-0 pt-3">
                <div className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 font-black text-[13px] shadow-sm",
                  day.expanded
                    ? "bg-[#1B75BC] border-[#1B75BC] text-white"
                    : "bg-white border-[#E5E7EB] text-[#374151]"
                )}>
                  {day.day}
                </div>
              </div>

              {/* Day card */}
              <div className="flex-1 mb-1">
                <div className={cn(
                  "bg-white border rounded-[12px] overflow-hidden transition-all",
                  day.expanded ? "border-[#1B75BC]/30 shadow-md" : "border-[#E5E7EB] hover:border-[#1B75BC]/20"
                )}>
                  {/* Day header — always visible */}
                  <button
                    onClick={() => toggleExpand(day.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F7F8FA] transition-colors text-left"
                  >
                    <div className="flex-1">
                      <div className="text-[13px] font-bold text-[#111827]">{day.title || `Day ${day.day} — Untitled`}</div>
                      {!day.expanded && (
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#9CA3AF]">
                          {day.hotel && <span className="flex items-center gap-0.5"><Hotel size={9} /> {day.hotel.split(",")[0]}</span>}
                          {day.activities.length > 0 && <span>{day.activities.length} activities</span>}
                          <span className="flex items-center gap-1">
                            {day.meals.breakfast && <span>B</span>}
                            {day.meals.lunch && <span>L</span>}
                            {day.meals.dinner && <span>D</span>}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); moveDay(day.id, "up"); }}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-[4px] hover:bg-[#F3F4F6] transition-colors">
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); moveDay(day.id, "down"); }}
                        disabled={idx === days.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-[4px] hover:bg-[#F3F4F6] transition-colors">
                        <ArrowDown size={12} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); removeDay(day.id); }}
                        className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer rounded-[4px] hover:bg-[#FEF2F2] transition-colors">
                        <Trash2 size={12} />
                      </button>
                      <ChevronDown size={14} className={cn("text-[#9CA3AF] transition-transform ml-1", day.expanded && "rotate-180")} />
                    </div>
                  </button>

                  {/* Expanded content */}
                  {day.expanded && (
                    <div className="px-4 pb-4 border-t border-[#F7F8FA] pt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Day Title" required>
                          <input value={day.title} onChange={e => update(day.id, { title: e.target.value })}
                            className={inputCls} placeholder="e.g. Arrival in Makkah" />
                        </FormField>
                        <FormField label="Hotel / Accommodation">
                          <input value={day.hotel} onChange={e => update(day.id, { hotel: e.target.value })}
                            className={inputCls} placeholder="e.g. Hilton Makkah Convention, Makkah" />
                        </FormField>
                      </div>
                      <FormField label="Day Description">
                        <textarea value={day.desc} onChange={e => update(day.id, { desc: e.target.value })}
                          rows={2} className={cn(inputCls, "resize-none")} placeholder="Describe the day's program…" />
                      </FormField>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Activities">
                          <div className="flex gap-2 mb-2">
                            <input
                              value={actInput[day.id] || ""}
                              onChange={e => setActInput(s => ({ ...s, [day.id]: e.target.value }))}
                              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addActivity(day.id))}
                              className={cn(inputCls, "flex-1")} placeholder="Type activity + Enter" />
                            <button onClick={() => addActivity(day.id)}
                              className="h-10 px-3 bg-[#1B75BC] text-white rounded-[9px] text-[12px] font-medium hover:bg-[#14588F] transition-colors cursor-pointer flex-shrink-0">
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {day.activities.map(act => (
                              <span key={act} className="flex items-center gap-1 bg-[#EEF2FF] text-[#1B75BC] text-[10px] font-medium px-2.5 py-1 rounded-full">
                                {act}
                                <button onClick={() => removeActivity(day.id, act)} className="text-[#1B75BC]/50 hover:text-[#1B75BC] cursor-pointer"><X size={10} /></button>
                              </span>
                            ))}
                          </div>
                        </FormField>
                        <div>
                          <FormField label="Transport">
                            <input value={day.transport} onChange={e => update(day.id, { transport: e.target.value })}
                              className={inputCls} placeholder="e.g. Private AC Bus" />
                          </FormField>
                          <div className="mt-3">
                            <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">Meals Included</label>
                            <div className="flex gap-3">
                              {(["breakfast","lunch","dinner"] as const).map(meal => (
                                <label key={meal} className="flex items-center gap-1.5 cursor-pointer">
                                  <input type="checkbox" className="w-3.5 h-3.5 accent-[#1B75BC]"
                                    checked={day.meals[meal]} onChange={e => update(day.id, { meals: { ...day.meals, [meal]: e.target.checked } })} />
                                  <span className="text-[11px] text-[#374151] capitalize">{meal.charAt(0).toUpperCase()}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={addDay}
        className="mt-4 flex items-center gap-2 h-10 px-4 border-2 border-dashed border-[#D1D5DB] rounded-[10px] text-[12px] font-semibold text-[#9CA3AF] hover:border-[#1B75BC]/50 hover:text-[#1B75BC] hover:bg-[#EEF2FF]/50 transition-all cursor-pointer w-full justify-center">
        <Plus size={14} /> Add Day
      </button>
    </div>
  );
}

// ─── PRICING TIER EDITOR ──────────────────────────────────────────────────────
function PricingTierEditor({ tiers, onChange }: { tiers: PricingTier[]; onChange: (t: PricingTier[]) => void }) {
  const update = (id: string, patch: Partial<PricingTier>) =>
    onChange(tiers.map(t => t.id === id ? { ...t, ...patch } : t));
  const addTier = () => onChange([...tiers, { id: `t${Date.now()}`, label: "New Tier", price: 0, seats: 10, occupied: 0 }]);
  const remove = (id: string) => onChange(tiers.filter(t => t.id !== id));

  return (
    <div>
      <div className="rounded-[10px] border border-[#E5E7EB] overflow-hidden mb-3">
        <table className="w-full">
          <thead className="bg-[#F7F8FA]">
            <tr>
              {["Tier Label", "Base Price (৳)", "Original Price (৳)", "Discount", "Total Seats", "Occupied", ""].map(h => (
                <th key={h} className="text-left py-2.5 px-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => {
              const disc = tier.originalPrice ? Math.round((1 - tier.price / tier.originalPrice) * 100) : 0;
              return (
                <tr key={tier.id} className="border-t border-[#F3F4F6] group">
                  <td className="py-2.5 px-3">
                    <input value={tier.label} onChange={e => update(tier.id, { label: e.target.value })}
                      className="w-28 px-2 py-1.5 border border-[#E5E7EB] rounded-[7px] text-[12px] font-bold text-[#111827] focus:border-[#1B75BC] outline-none" />
                  </td>
                  <td className="py-2.5 px-3">
                    <input type="number" value={tier.price} onChange={e => update(tier.id, { price: +e.target.value })}
                      className="w-32 px-2 py-1.5 border border-[#E5E7EB] rounded-[7px] text-[12px] font-mono text-[#111827] focus:border-[#1B75BC] outline-none" />
                  </td>
                  <td className="py-2.5 px-3">
                    <input type="number" value={tier.originalPrice || ""} onChange={e => update(tier.id, { originalPrice: +e.target.value || undefined })}
                      placeholder="—"
                      className="w-32 px-2 py-1.5 border border-[#E5E7EB] rounded-[7px] text-[12px] font-mono text-[#6B7280] focus:border-[#1B75BC] outline-none" />
                  </td>
                  <td className="py-2.5 px-3">
                    {disc > 0
                      ? <span className="text-[11px] font-bold text-[#0E7C66] bg-[#ECFDF5] px-2 py-0.5 rounded-full">{disc}% off</span>
                      : <span className="text-[11px] text-[#D1D5DB]">—</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    <input type="number" value={tier.seats} onChange={e => update(tier.id, { seats: +e.target.value })}
                      className="w-16 px-2 py-1.5 border border-[#E5E7EB] rounded-[7px] text-[12px] font-mono text-[#111827] focus:border-[#1B75BC] outline-none" />
                  </td>
                  <td className="py-2.5 px-3">
                    <div>
                      <span className="text-[12px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{tier.occupied}</span>
                      <div className="w-12 h-1 bg-[#F3F4F6] rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-[#1B75BC] rounded-full" style={{ width: `${(tier.occupied / tier.seats) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <button onClick={() => remove(tier.id)}
                      className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-[5px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-[#E5E7EB] bg-[#F7F8FA]">
            <tr>
              <td colSpan={4} className="py-2 px-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Totals</td>
              <td className="py-2 px-3 text-[12px] font-black text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {tiers.reduce((s, t) => s + t.seats, 0)}
              </td>
              <td className="py-2 px-3 text-[12px] font-black text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {tiers.reduce((s, t) => s + t.occupied, 0)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <button onClick={addTier}
        className="flex items-center gap-1.5 h-8 px-3 border border-dashed border-[#D1D5DB] rounded-[8px] text-[11px] font-semibold text-[#9CA3AF] hover:border-[#1B75BC]/50 hover:text-[#1B75BC] transition-colors cursor-pointer">
        <Plus size={12} /> Add Tier
      </button>
    </div>
  );
}

// ─── INCLUSION/EXCLUSION EDITOR ───────────────────────────────────────────────
function InclusionEditor({
  includes, excludes,
  onIncludesChange, onExcludesChange,
}: { includes: string[]; excludes: string[]; onIncludesChange: (v: string[]) => void; onExcludesChange: (v: string[]) => void }) {
  const [incInput, setIncInput] = useState("");
  const [excInput, setExcInput] = useState("");

  const addItem = (list: string[], val: string, setter: (v: string[]) => void, inputSetter: (v: string) => void) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setter([...list, trimmed]);
    inputSetter("");
  };

  const Panel = ({ title, items, onRemove, input, onInput, onAdd, color }: {
    title: string; items: string[]; onRemove: (i: number) => void;
    input: string; onInput: (v: string) => void; onAdd: () => void; color: string;
  }) => (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          {color === "#0E7C66" ? <CheckCircle size={12} style={{ color }} /> : <XCircle size={12} style={{ color }} />}
        </div>
        <span className="text-[12px] font-bold text-[#374151]">{title}</span>
        <span className="text-[10px] text-[#9CA3AF] ml-auto">{items.length} items</span>
      </div>
      <div className="flex gap-2 mb-3">
        <input value={input} onChange={e => onInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), onAdd())}
          className={cn(inputCls, "flex-1")} placeholder="Add item + Enter" />
        <button onClick={onAdd} className="h-10 px-3 rounded-[9px] text-white text-[12px] font-medium transition-colors cursor-pointer flex-shrink-0"
          style={{ backgroundColor: color }}>
          <Plus size={14} />
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 p-2.5 bg-[#F7F8FA] rounded-[8px] group hover:bg-[#F3F4F6] transition-colors">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}15` }}>
              {color === "#0E7C66" ? <Check size={9} style={{ color }} /> : <X size={9} style={{ color }} />}
            </div>
            <span className="text-[12px] text-[#374151] flex-1 leading-snug">{item}</span>
            <button onClick={() => onRemove(i)} className="text-[#9CA3AF] hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex gap-6">
      <Panel title="What's Included" items={includes} color="#0E7C66"
        onRemove={i => onIncludesChange(includes.filter((_, j) => j !== i))}
        input={incInput} onInput={setIncInput} onAdd={() => addItem(includes, incInput, onIncludesChange, setIncInput)} />
      <div className="w-px bg-[#E5E7EB]" />
      <Panel title="What's Excluded" items={excludes} color="#DC2626"
        onRemove={i => onExcludesChange(excludes.filter((_, j) => j !== i))}
        input={excInput} onInput={setExcInput} onAdd={() => addItem(excludes, excInput, onExcludesChange, setExcInput)} />
    </div>
  );
}

// ─── PACKAGE CALENDAR ─────────────────────────────────────────────────────────
function PackageCalendar({ dates, onToggle }: { dates: string[]; onToggle: (d: string) => void }) {
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(4); // May

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dayNames = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); } else setViewMonth(m => m+1); };

  const dateStr = (day: number) => `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const isSelected = (day: number) => dates.includes(dateStr(day));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-[#111827]">{monthNames[viewMonth]} {viewYear}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-[7px] border border-[#E5E7EB] text-[#374151] hover:bg-[#F7F8FA] cursor-pointer transition-colors"><ChevronLeft size={14} /></button>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-[7px] border border-[#E5E7EB] text-[#374151] hover:bg-[#F7F8FA] cursor-pointer transition-colors"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map(d => <div key={d} className="text-center text-[9px] font-bold text-[#9CA3AF] uppercase py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const selected = isSelected(day);
          return (
            <button key={day} onClick={() => onToggle(dateStr(day))}
              className={cn(
                "h-9 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer",
                selected
                  ? "bg-[#1B75BC] text-white font-bold shadow-sm"
                  : "text-[#374151] hover:bg-[#EEF2FF] hover:text-[#1B75BC]"
              )}>
              {day}
              {selected && <div className="w-1 h-1 bg-white/60 rounded-full mx-auto mt-0.5" />}
            </button>
          );
        })}
      </div>
      {dates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
          <div className="text-[11px] font-bold text-[#374151] mb-2">Selected Departure Dates ({dates.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {dates.map(d => (
              <span key={d} className="flex items-center gap-1 bg-[#EEF2FF] text-[#1B75BC] text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {d}
                <button onClick={() => onToggle(d)} className="text-[#1B75BC]/50 hover:text-[#1B75BC] cursor-pointer"><X size={9} /></button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PACKAGE FORM VIEW ────────────────────────────────────────────────────────
const FORM_TABS: Array<{ id: FormTab; label: string; icon: React.FC<any> }> = [
  { id: "basic",      label: "Basic Info",    icon: Info },
  { id: "pricing",    label: "Pricing",        icon: Tag },
  { id: "itinerary",  label: "Itinerary",      icon: MapPin },
  { id: "hotels",     label: "Hotels & Flights", icon: Hotel },
  { id: "inclusions", label: "Inclusions",     icon: CheckCircle },
  { id: "images",     label: "Images",         icon: Image },
  { id: "calendar",   label: "Calendar",       icon: Calendar },
];

function PackageFormView({ pkg, isEdit, onBack, onSave }: {
  pkg?: Package; isEdit: boolean; onBack: () => void; onSave: () => void;
}) {
  const [activeTab, setActiveTab] = useState<FormTab>("basic");
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState(pkg?.name || "");
  const [type, setType] = useState<PkgType>(pkg?.type || "Hajj");
  const [season, setSeason] = useState(pkg?.season || "");
  const [duration, setDuration] = useState(pkg?.duration || "");
  const [departure, setDeparture] = useState(pkg?.departure || "");
  const [status, setStatus] = useState<PkgStatus>(pkg?.status || "Draft");
  const [shortDesc, setShortDesc] = useState(pkg?.shortDesc || "");
  const [longDesc, setLongDesc] = useState("");
  const [featured, setFeatured] = useState(pkg?.featured || false);
  const [tiers, setTiers] = useState<PricingTier[]>(pkg?.tiers ?? []);
  const [days, setDays] = useState<ItineraryDay[]>(pkg?.itinerary ?? []);
  const [hotels, setHotels] = useState<HotelEntry[]>(pkg?.hotels ?? []);
  const [flights, setFlights] = useState<FlightEntry[]>(pkg?.flights ?? []);
  const [includes, setIncludes] = useState<string[]>(pkg?.includes ?? []);
  const [excludes, setExcludes] = useState<string[]>(pkg?.excludes?.length ? pkg.excludes : ["Visa fee", "Travel insurance", "Personal expenses"]);
  const [departureDates, setDepartureDates] = useState<string[]>(pkg?.departureDates || ["2026-05-12", "2026-05-14"]);

  const create = useCreatePackage();
  const update = useUpdatePackage(pkg?.id ?? "");

  const handleSave = async () => {
    setSaving(true);
    // Unsplash image IDs are kept as-is (no upload pipeline yet — Documents/media module later).
    const payload = toPackagePayload({
      name, type, season, duration, departure, status, shortDesc, longDesc, featured,
      tiers, days, hotels, flights, includes, excludes, departureDates, image: pkg?.image,
    });
    try {
      if (isEdit && pkg?.id) await update.mutateAsync(payload);
      else await create.mutateAsync(payload);
      onSave();
    } catch {
      /* toast handled by hook */
    } finally {
      setSaving(false);
    }
  };

  const addHotel = () => setHotels(h => [...h, { id: `h${Date.now()}`, city: "", name: "", stars: 4, roomType: "", nights: 3 }]);
  const removeHotel = (id: string) => setHotels(h => h.filter(x => x.id !== id));
  const updateHotel = (id: string, patch: Partial<HotelEntry>) => setHotels(h => h.map(x => x.id === id ? { ...x, ...patch } : x));

  const addFlight = () => setFlights(f => [...f, { id: `f${Date.now()}`, carrier: "", flightNo: "", from: "", to: "", cabin: "Economy", dep: "", arr: "" }]);
  const removeFlight = (id: string) => setFlights(f => f.filter(x => x.id !== id));
  const updateFlight = (id: string, patch: Partial<FlightEntry>) => setFlights(f => f.map(x => x.id === id ? { ...x, ...patch } : x));

  const toggleDate = (d: string) =>
    setDepartureDates(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  return (
    <div>
      <PageBreadcrumb
        items={[{ label: "Packages", onClick: onBack }, { label: isEdit ? `Edit: ${pkg?.name || "Package"}` : "New Package" }]}
        action={
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="h-9 px-3 border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:bg-[#F7F8FA] transition-colors cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#1B75BC] rounded-[8px] text-[12px] font-bold text-white hover:bg-[#14588F] transition-colors cursor-pointer disabled:opacity-60 shadow-sm">
              {saving ? <><RefreshCw size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> {isEdit ? "Update Package" : "Create Package"}</>}
            </button>
          </div>
        }
      />

      <div className="flex gap-6">
        {/* Vertical tab nav */}
        <div className="w-44 flex-shrink-0">
          <Card className="p-1.5 sticky top-20">
            {FORM_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-left transition-all cursor-pointer mb-0.5",
                    activeTab === tab.id
                      ? "bg-[#1B75BC] text-white shadow-sm"
                      : "text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#374151]"
                  )}>
                  <Icon size={14} className="flex-shrink-0" />
                  <span className="text-[12px] font-medium">{tab.label}</span>
                </button>
              );
            })}
          </Card>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === "basic" && (
            <Card className="p-5 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6]">
                <div>
                  <h2 className="text-[15px] font-black text-[#111827]">Basic Information</h2>
                  <p className="text-[11px] text-[#9CA3AF]">Core package details and metadata</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] text-[#374151] font-medium">Featured</span>
                  <div onClick={() => setFeatured(f => !f)}
                    className={cn("w-10 h-5 rounded-full transition-colors cursor-pointer relative", featured ? "bg-[#F15A24]" : "bg-[#D1D5DB]")}>
                    <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", featured ? "left-5" : "left-0.5")} />
                  </div>
                </label>
              </div>
              <FormField label="Package Name" required>
                <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Hajj Economy Package 2026" />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Package Type" required>
                  <select value={type} onChange={e => setType(e.target.value as PkgType)} className={selectCls}>
                    {(["Hajj","Umrah","Tour","Visa","Manpower","Hotel"] as PkgType[]).map(t => <option key={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Status" required>
                  <select value={status} onChange={e => setStatus(e.target.value as PkgStatus)} className={selectCls}>
                    {(["Active","Draft","Archived","Suspended"] as PkgStatus[]).map(s => <option key={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Duration" required hint="e.g. 21 Days">
                  <input value={duration} onChange={e => setDuration(e.target.value)} className={inputCls} placeholder="21 Days" />
                </FormField>
                <FormField label="Season / Occasion" required>
                  <input value={season} onChange={e => setSeason(e.target.value)} className={inputCls} placeholder="Hajj 2026" />
                </FormField>
                <FormField label="Departure Period">
                  <input value={departure} onChange={e => setDeparture(e.target.value)} className={inputCls} placeholder="May 2026" />
                </FormField>
              </div>
              <FormField label="Short Description" required hint="Shown on package cards — keep under 120 chars">
                <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={2}
                  className={cn(inputCls, "resize-none")} placeholder="Brief, compelling description of the package…" />
                <div className="text-right text-[10px] text-[#9CA3AF] mt-1">{shortDesc.length}/120</div>
              </FormField>
              <FormField label="Full Description">
                <textarea value={longDesc} onChange={e => setLongDesc(e.target.value)} rows={5}
                  className={cn(inputCls, "resize-none")} placeholder="Detailed description with highlights, conditions, and notes…" />
              </FormField>
            </Card>
          )}

          {activeTab === "pricing" && (
            <Card className="p-5">
              <div className="pb-4 mb-5 border-b border-[#F3F4F6]">
                <h2 className="text-[15px] font-black text-[#111827]">Pricing Tiers</h2>
                <p className="text-[11px] text-[#9CA3AF]">Define multiple pricing options per person. Agent commission is set globally in Settings.</p>
              </div>
              <PricingTierEditor tiers={tiers} onChange={setTiers} />
              <div className="mt-5 pt-5 border-t border-[#F3F4F6] grid grid-cols-3 gap-4">
                <FormField label="Agent Commission %" hint="Overrides global default">
                  <input type="number" defaultValue={8} className={inputCls} placeholder="8" />
                </FormField>
                <FormField label="Tax / VAT %" hint="Applied at checkout">
                  <input type="number" defaultValue={0} className={inputCls} placeholder="0" />
                </FormField>
                <FormField label="Early Bird Discount %" hint="Applied before cutoff date">
                  <input type="number" defaultValue={5} className={inputCls} placeholder="5" />
                </FormField>
              </div>
            </Card>
          )}

          {activeTab === "itinerary" && (
            <Card className="p-5">
              <div className="pb-4 mb-5 border-b border-[#F3F4F6] flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-black text-[#111827]">Itinerary Builder</h2>
                  <p className="text-[11px] text-[#9CA3AF]">Day-by-day program. Drag to reorder. Click a day to expand.</p>
                </div>
                <span className="text-[11px] font-bold text-[#1B75BC] bg-[#EEF2FF] px-2.5 py-1 rounded-full">{days.length} days</span>
              </div>
              <ItineraryBuilder days={days} onChange={setDays} />
            </Card>
          )}

          {activeTab === "hotels" && (
            <div className="space-y-4">
              <Card className="p-5">
                <div className="pb-4 mb-4 border-b border-[#F3F4F6] flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-black text-[#111827]">Hotel Configuration</h2>
                    <p className="text-[11px] text-[#9CA3AF]">Add hotels per destination city.</p>
                  </div>
                  <button onClick={addHotel} className="flex items-center gap-1.5 h-8 px-3 bg-[#EEF2FF] text-[#1B75BC] font-bold rounded-[8px] text-[11px] hover:bg-[#1B75BC] hover:text-white transition-colors cursor-pointer">
                    <Plus size={12} /> Add Hotel
                  </button>
                </div>
                <div className="space-y-3">
                  {hotels.map(hotel => (
                    <div key={hotel.id} className="p-4 bg-[#F7F8FA] rounded-[10px] border border-[#E5E7EB] group">
                      <div className="flex items-start gap-3">
                        <Hotel size={16} className="text-[#0E7C66] mt-2.5 flex-shrink-0" />
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                          <FormField label="City">
                            <input value={hotel.city} onChange={e => updateHotel(hotel.id, { city: e.target.value })} className={inputCls} placeholder="Makkah" />
                          </FormField>
                          <div className="md:col-span-2">
                            <FormField label="Hotel Name">
                              <input value={hotel.name} onChange={e => updateHotel(hotel.id, { name: e.target.value })} className={inputCls} placeholder="Hotel name" />
                            </FormField>
                          </div>
                          <FormField label="Stars">
                            <select value={hotel.stars} onChange={e => updateHotel(hotel.id, { stars: +e.target.value })} className={selectCls}>
                              {[3,4,5].map(s => <option key={s} value={s}>{s}★</option>)}
                            </select>
                          </FormField>
                          <FormField label="Nights">
                            <input type="number" value={hotel.nights} onChange={e => updateHotel(hotel.id, { nights: +e.target.value })} className={inputCls} placeholder="7" />
                          </FormField>
                        </div>
                        <button onClick={() => removeHotel(hotel.id)} className="mt-2 text-[#9CA3AF] hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="pb-4 mb-4 border-b border-[#F3F4F6] flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-black text-[#111827]">Flight Configuration</h2>
                    <p className="text-[11px] text-[#9CA3AF]">Manual airline & flight entry. No live GDS — for display only.</p>
                  </div>
                  <button onClick={addFlight} className="flex items-center gap-1.5 h-8 px-3 bg-[#EEF2FF] text-[#1B75BC] font-bold rounded-[8px] text-[11px] hover:bg-[#1B75BC] hover:text-white transition-colors cursor-pointer">
                    <Plus size={12} /> Add Flight
                  </button>
                </div>
                <div className="space-y-3">
                  {flights.map(flight => (
                    <div key={flight.id} className="p-4 bg-[#F7F8FA] rounded-[10px] border border-[#E5E7EB] group">
                      <div className="flex items-start gap-3">
                        <Plane size={16} className="text-[#2563EB] mt-2.5 flex-shrink-0" />
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-3">
                          <div className="md:col-span-2">
                            <FormField label="Carrier">
                              <input value={flight.carrier} onChange={e => updateFlight(flight.id, { carrier: e.target.value })} className={inputCls} placeholder="Biman Bangladesh Airlines" />
                            </FormField>
                          </div>
                          <FormField label="Flight No.">
                            <input value={flight.flightNo} onChange={e => updateFlight(flight.id, { flightNo: e.target.value })} className={inputCls} placeholder="BG-043" />
                          </FormField>
                          <FormField label="Route">
                            <div className="flex items-center gap-1">
                              <input value={flight.from} onChange={e => updateFlight(flight.id, { from: e.target.value })} className={cn(inputCls, "w-16 text-center font-mono")} placeholder="DAC" maxLength={3} />
                              <ArrowRight size={12} className="text-[#9CA3AF] flex-shrink-0" />
                              <input value={flight.to} onChange={e => updateFlight(flight.id, { to: e.target.value })} className={cn(inputCls, "w-16 text-center font-mono")} placeholder="JED" maxLength={3} />
                            </div>
                          </FormField>
                          <FormField label="Cabin">
                            <select value={flight.cabin} onChange={e => updateFlight(flight.id, { cabin: e.target.value })} className={selectCls}>
                              {["Economy","Premium Economy","Business","First"].map(c => <option key={c}>{c}</option>)}
                            </select>
                          </FormField>
                          <FormField label="Dep / Arr">
                            <div className="flex gap-1">
                              <input value={flight.dep} onChange={e => updateFlight(flight.id, { dep: e.target.value })} className={cn(inputCls, "font-mono text-center")} placeholder="09:30" />
                            </div>
                          </FormField>
                        </div>
                        <button onClick={() => removeFlight(flight.id)} className="mt-2 text-[#9CA3AF] hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "inclusions" && (
            <Card className="p-5">
              <div className="pb-4 mb-5 border-b border-[#F3F4F6]">
                <h2 className="text-[15px] font-black text-[#111827]">Inclusions & Exclusions</h2>
                <p className="text-[11px] text-[#9CA3AF]">Clearly define what is and isn't covered. Type and press Enter to add.</p>
              </div>
              <InclusionEditor includes={includes} excludes={excludes}
                onIncludesChange={setIncludes} onExcludesChange={setExcludes} />
            </Card>
          )}

          {activeTab === "images" && (
            <Card className="p-5">
              <div className="pb-4 mb-5 border-b border-[#F3F4F6]">
                <h2 className="text-[15px] font-black text-[#111827]">Package Images</h2>
                <p className="text-[11px] text-[#9CA3AF]">First image is the cover. Supported: JPG, PNG, WebP. Max 5MB each.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Current images */}
                {(pkg?.images || ["photo-1591604466107-ec97de577aff", "photo-1576158113928-4c240eaaf360"]).map((imgId, i) => (
                  <div key={imgId} className="relative aspect-video rounded-[10px] overflow-hidden bg-[#F3F4F6] group">
                    <img src={`https://images.unsplash.com/${imgId}?w=400&h=225&fit=crop`} alt="Package image" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button disabled title="Removing images is not available in this build" className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-[#9CA3AF] opacity-60 cursor-not-allowed"><Trash2 size={13} /></button>
                    </div>
                    {i === 0 && <span className="absolute top-2 left-2 text-[9px] font-black bg-[#F15A24] text-[#1B75BC] px-1.5 py-0.5 rounded-full">COVER</span>}
                  </div>
                ))}
                {/* Upload slot */}
                <button disabled title="Image upload is not available in this build" className="aspect-video rounded-[10px] border-2 border-dashed border-[#D1D5DB] flex flex-col items-center justify-center gap-2 opacity-60 cursor-not-allowed">
                  <Upload size={20} className="text-[#D1D5DB]" />
                  <span className="text-[10px] font-medium text-[#9CA3AF]">Upload Image</span>
                </button>
              </div>
              <div className="mt-4 p-3 bg-[#F7F8FA] rounded-[8px] text-[11px] text-[#9CA3AF] flex items-center gap-2">
                <Info size={13} className="flex-shrink-0" /> Images are optimized automatically. Recommended: 1280×720px landscape.
              </div>
            </Card>
          )}

          {activeTab === "calendar" && (
            <Card className="p-5">
              <div className="pb-4 mb-5 border-b border-[#F3F4F6]">
                <h2 className="text-[15px] font-black text-[#111827]">Departure Calendar</h2>
                <p className="text-[11px] text-[#9CA3AF]">Click dates to toggle departure days. Bookings are attached to these dates.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PackageCalendar dates={departureDates} onToggle={toggleDate} />
                <div>
                  <div className="text-[12px] font-bold text-[#374151] mb-3">Seat Availability by Departure</div>
                  {departureDates.length > 0 ? (
                    <div className="space-y-2.5">
                      {departureDates.map(d => (
                        <div key={d} className="flex items-center gap-3 p-3 bg-[#F7F8FA] rounded-[9px] border border-[#E5E7EB]">
                          <div className="text-[11px] font-bold text-[#1B75BC]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d}</div>
                          <div className="flex-1">
                            <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                              <div className="h-full bg-[#1B75BC] rounded-full" style={{ width: "54%" }} />
                            </div>
                          </div>
                          <span className="text-[10px] text-[#9CA3AF]">27/50 seats</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-[#D1D5DB]">
                      <Calendar size={24} className="mx-auto mb-2" />
                      <p className="text-[11px]">No departure dates selected</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PACKAGE DETAIL VIEW ──────────────────────────────────────────────────────
function PackageDetailView({ pkg, onBack, onEdit }: { pkg: Package; onBack: () => void; onEdit: () => void }) {
  const [tab, setTab] = useState<DetailTab>("overview");

  const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
    { id: "overview",  label: "Overview" },
    { id: "pricing",   label: "Pricing & Tiers" },
    { id: "itinerary", label: "Itinerary" },
    { id: "bookings",  label: "Bookings" },
  ];

  const pct = Math.round(((pkg.totalSeats - pkg.availableSeats) / pkg.totalSeats) * 100);

  return (
    <div>
      <PageBreadcrumb
        items={[{ label: "Packages", onClick: onBack }, { label: pkg.name }]}
        action={
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="h-9 px-3 border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:bg-[#F7F8FA] transition-colors cursor-pointer">
              <ChevronLeft size={14} className="inline" /> Back
            </button>
            <button onClick={onEdit}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#1B75BC] rounded-[8px] text-[12px] font-bold text-white hover:bg-[#14588F] transition-colors cursor-pointer">
              <Edit2 size={13} /> Edit Package
            </button>
          </div>
        }
      />

      {/* Hero */}
      <Card className="overflow-hidden mb-5">
        <div className="relative h-52 bg-[#1B75BC]">
          <img src={`https://images.unsplash.com/${pkg.image}?w=1200&h=420&fit=crop&auto=format`} alt={pkg.name}
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B75BC]/90 via-[#1B75BC]/60 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <TypeBadge type={pkg.type} />
              <StatusBadge status={pkg.status} />
              {pkg.featured && (
                <span className="inline-flex items-center gap-1 text-[#D64A12] text-[10px] font-bold">
                  <Star size={10} fill="#F15A24" /> Featured
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white leading-tight mb-1">{pkg.name}</h1>
            <div className="flex items-center gap-4 text-[12px] text-white/70">
              <span className="flex items-center gap-1"><Clock size={12} /> {pkg.duration}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {pkg.season}</span>
              <span className="flex items-center gap-1"><Users size={12} /> {pkg.totalSeats} seats total</span>
              {pkg.rating > 0 && <span className="flex items-center gap-1"><Star size={11} fill="#F15A24" className="text-[#D64A12]" /> {pkg.rating}/5</span>}
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-[#F3F4F6]">
          {[
            { label: "Base Price",   value: fmtPrice(pkg.basePrice), sub: pkg.originalPrice ? `was ${fmtPrice(pkg.originalPrice)}` : "per person" },
            { label: "Bookings",     value: pkg.bookings.toString(), sub: "confirmed" },
            { label: "Revenue",      value: pkg.revenue > 0 ? `৳${(pkg.revenue/100000).toFixed(1)}L` : "৳0", sub: "total collected" },
            { label: "Seats Left",   value: `${pkg.availableSeats}/${pkg.totalSeats}`, sub: `${pct}% occupied` },
            { label: "Rating",       value: pkg.rating > 0 ? `${pkg.rating}/5` : "—", sub: pkg.rating > 0 ? "avg review" : "no reviews yet" },
          ].map(stat => (
            <div key={stat.label} className="px-5 py-4">
              <div className="text-[18px] font-black text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{stat.label}</div>
              <div className="text-[10px] text-[#9CA3AF]">{stat.sub}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#F3F4F6] p-1 rounded-[10px] w-fit">
        {DETAIL_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("h-8 px-4 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer",
              tab === t.id ? "bg-white text-[#1B75BC] shadow-sm" : "text-[#9CA3AF] hover:text-[#374151]")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <h3 className="text-[13px] font-bold text-[#111827] mb-2">Description</h3>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">{pkg.shortDesc}</p>
            </Card>
            <Card className="p-5">
              <h3 className="text-[13px] font-bold text-[#111827] mb-3">Hotels</h3>
              <div className="space-y-2">
                {pkg.hotels.length === 0 && <p className="text-[11px] text-[#9CA3AF]">No hotels configured.</p>}
                {pkg.hotels.map((h, i) => (
                  <div key={h.id || i} className="flex items-center gap-3 p-3 bg-[#F7F8FA] rounded-[8px]">
                    <Hotel size={14} className="text-[#0E7C66] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold text-[#111827]">{h.name}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{h.city} · {h.nights} nights · {"★".repeat(Number(h.stars) || 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-[13px] font-bold text-[#111827] mb-3">Flights</h3>
              <div className="space-y-2">
                {pkg.flights.length === 0 && <p className="text-[11px] text-[#9CA3AF]">No flights configured.</p>}
                {pkg.flights.map((f, i) => (
                  <div key={f.id || i} className="flex items-center gap-3 p-3 bg-[#F7F8FA] rounded-[8px]">
                    <Plane size={14} className="text-[#2563EB] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold text-[#111827]">{f.carrier}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{f.flightNo} · {f.from} → {f.to} · {f.cabin}</div>
                    </div>
                    <div className="text-[10px] font-mono text-[#374151]">{f.dep}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-[13px] font-bold text-[#111827] mb-3">Inclusions</h3>
              <div className="space-y-1.5">
                {pkg.includes?.slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-[#374151]">
                    <CheckCircle size={12} className="text-[#0E7C66] flex-shrink-0 mt-0.5" /> {item}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-[13px] font-bold text-[#111827] mb-3">Departure Dates</h3>
              <div className="space-y-1.5">
                {(pkg.availability ?? []).length === 0 && <p className="text-[11px] text-[#9CA3AF]">No departures scheduled.</p>}
                {(pkg.availability ?? []).map(a => (
                  <div key={a.departureDate} className="flex items-center justify-between p-2.5 bg-[#F7F8FA] rounded-[7px]">
                    <span className="text-[11px] font-bold text-[#1B75BC]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.departureDate}</span>
                    <span className="text-[10px] text-[#9CA3AF]">{a.availableSeats}/{a.totalSeats} seats</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "pricing" && (
        <Card className="p-5">
          {/* Read-only preview in the detail view — pricing is edited from the package Edit form. */}
          <fieldset disabled className="border-0 p-0 m-0">
            <PricingTierEditor tiers={pkg.tiers} onChange={() => undefined} />
          </fieldset>
        </Card>
      )}

      {tab === "itinerary" && (
        <Card className="p-5">
          <div className="relative">
            {pkg.itinerary.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-6 text-center">No itinerary added yet.</p>}
            {pkg.itinerary.map((day, i) => (
              <div key={day.id} className="flex gap-4 mb-5">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#1B75BC] text-white flex items-center justify-center font-black text-[13px] flex-shrink-0 z-10">{day.day}</div>
                  {i < pkg.itinerary.length - 1 && <div className="w-px flex-1 bg-[#E5E7EB] mt-2" />}
                </div>
                <div className="flex-1 pb-2">
                  <h4 className="text-[13px] font-bold text-[#111827] mb-1">{day.title}</h4>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed mb-2">{day.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {day.activities.map(a => (
                      <span key={a} className="bg-[#EEF2FF] text-[#1B75BC] text-[10px] font-medium px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-[#9CA3AF]">
                    {day.hotel && <span className="flex items-center gap-1"><Hotel size={10} /> {day.hotel.split(",")[0]}</span>}
                    {day.transport && <span className="flex items-center gap-1"><Plane size={10} /> {day.transport}</span>}
                    <span>{day.meals.breakfast ? "B " : ""}{day.meals.lunch ? "L " : ""}{day.meals.dinner ? "D" : ""}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "bookings" && (
        <Card className="p-5">
          <div className="py-12 text-center text-[#D1D5DB]">
            <BarChart3 size={32} className="mx-auto mb-3" />
            <p className="text-[13px] text-[#9CA3AF] font-medium">Booking history for this package</p>
            <p className="text-[11px] text-[#D1D5DB]">27 bookings · Navigate to Bookings module for full details</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Loaders: fetch a package by id for edit/detail ───────────────────────────
function PackageFormLoader({ id, onBack, onSave }: { id: string; onBack: () => void; onSave: () => void }) {
  const { data, isLoading, isError, error, refetch } = usePackage(id);
  if (isLoading) return <div className="p-6"><SkeletonTable rows={6} cols={4} /></div>;
  if (isError || !data) return <div className="p-6"><ErrorBanner message={(error as Error)?.message || "Package not found."} onRetry={() => refetch()} /></div>;
  return <PackageFormView pkg={mapDetail(data)} isEdit onBack={onBack} onSave={onSave} />;
}

function PackageDetailLoader({ id, onBack, onEdit }: { id: string; onBack: () => void; onEdit: () => void }) {
  const { data, isLoading, isError, error, refetch } = usePackage(id);
  if (isLoading) return <div className="p-6"><SkeletonTable rows={6} cols={4} /></div>;
  if (isError || !data) return <div className="p-6"><ErrorBanner message={(error as Error)?.message || "Package not found."} onRetry={() => refetch()} /></div>;
  return <PackageDetailView pkg={mapDetail(data)} onBack={onBack} onEdit={onEdit} />;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export function PackageManagementPage() {
  const [view, setView] = useState<PkgView>("list");
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const goList = () => { setView("list"); setSelectedId(null); };
  const goCreate = () => { setIsEdit(false); setSelectedId(null); setView("form"); };
  const goEdit = (id: string) => { setIsEdit(true); setSelectedId(id); setView("form"); };
  const goDetail = (id: string) => { setSelectedId(id); setView("detail"); };

  return (
    <div className="p-5 md:p-7">
      <ModulePage title="Package Management" subtitle="Create, price & publish Hajj, Umrah, tour and other packages">
        {view === "list" && <PackageListView onNew={goCreate} onEdit={goEdit} onView={goDetail} />}
        {view === "form" && (
          isEdit && selectedId
            ? <PackageFormLoader id={selectedId} onBack={goList} onSave={goList} />
            : <PackageFormView pkg={undefined} isEdit={false} onBack={goList} onSave={goList} />
        )}
        {view === "detail" && selectedId && (
          <PackageDetailLoader id={selectedId} onBack={goList} onEdit={() => goEdit(selectedId)} />
        )}
      </ModulePage>
    </div>
  );
}

// ─── Fix: missing ArrowRight import ──────────────────────────────────────────
function ArrowRight({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
