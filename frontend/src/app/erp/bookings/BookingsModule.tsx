import React, { useState, useEffect } from "react";
import {
  Search, Plus, Eye, Edit3, Printer, Trash2,
  ChevronLeft, ChevronRight, Star, MapPin, Globe,
  Plane, Hotel, Briefcase, Map, ArrowUpDown, SlidersHorizontal,
  Download, CalendarDays, Wallet, CheckCircle2,
  Clock, XCircle, PauseCircle, RefreshCw,
} from "lucide-react";
import { cn, fmtPrice } from "../../lib/utils";
import { SkeletonTable, ErrorBanner } from "../../lib/ds";
import { BookingWizard } from "./BookingWizard";
import { BookingDetail } from "./BookingDetail";
import {
  useBookings, useBranches, useBooking, useDeleteBooking,
  mapListItem, mapDetail, SERVICE_ENUM, STATUS_ENUM, type BookingListParams,
} from "../../hooks/bookings";

// ─── Types & Constants ─────────────────────────────────────────────────────────
export type ServiceType = "Hajj" | "Umrah" | "Visa" | "Air Ticket" | "Hotel" | "Manpower" | "Tour";
export type BookingStatus = "Draft" | "Confirmed" | "Pending" | "Processing" | "Cancelled" | "On Hold" | "Completed";

export interface Traveler {
  id: string;
  name: string;
  dob: string;
  gender: "Male" | "Female";
  nationality: string;
  passportNo: string;
  passportExpiry: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  mahram?: string;
}

export interface Installment {
  id: number;
  label: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "Paid" | "Due" | "Overdue" | "Upcoming";
}

export interface Booking {
  id: string;
  ref: string; // display reference: bookingNo when confirmed, else "Draft"
  customer: { name: string; phone: string; email: string; };
  service: ServiceType;
  package: string;
  amount: number;
  paid: number;
  status: BookingStatus;
  branch: string;
  staff: string;
  agent?: string;
  createdAt: string;
  departure?: string;
  travelers: number;
  travelerList: Traveler[];
  installments: Installment[];
  serviceDetails: Record<string, string | number | boolean | string[]>;
  activityLog: { time: string; actor: string; action: string; note?: string; }[];
}

export const SERVICE_CFG: Record<ServiceType, { icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>; color: string; bg: string; light: string; }> = {
  "Hajj":       { icon: Star,      color: "#1B75BC", bg: "#1B75BC", light: "#EEF2FF" },
  "Umrah":      { icon: MapPin,    color: "#F15A24", bg: "#F15A24", light: "#FFF9E6" },
  "Visa":       { icon: Globe,     color: "#7C3AED", bg: "#7C3AED", light: "#F5F3FF" },
  "Air Ticket": { icon: Plane,     color: "#2563EB", bg: "#2563EB", light: "#EFF6FF" },
  "Hotel":      { icon: Hotel,     color: "#EA580C", bg: "#EA580C", light: "#FFF7ED" },
  "Manpower":   { icon: Briefcase, color: "#0E7C66", bg: "#0E7C66", light: "#ECFDF5" },
  "Tour":       { icon: Map,       color: "#0891B2", bg: "#0891B2", light: "#F0F9FF" },
};

export const STATUS_CFG: Record<BookingStatus, { color: string; bg: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  "Draft":      { color: "#6B7280", bg: "#F3F4F6", icon: Edit3          },
  "Confirmed":  { color: "#065F46", bg: "#D1FAE5", icon: CheckCircle2  },
  "Pending":    { color: "#92400E", bg: "#FEF3C7", icon: Clock          },
  "Processing": { color: "#1D4ED8", bg: "#DBEAFE", icon: RefreshCw      },
  "Cancelled":  { color: "#991B1B", bg: "#FEE2E2", icon: XCircle        },
  "On Hold":    { color: "#374151", bg: "#F3F4F6", icon: PauseCircle    },
  "Completed":  { color: "#1B75BC", bg: "#EEF2FF", icon: CheckCircle2   },
};

// ─── Shared UI ─────────────────────────────────────────────────────────────────
export function ServiceBadge({ service, small }: { service: ServiceType; small?: boolean }) {
  const cfg = SERVICE_CFG[service];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 font-bold rounded-full text-white",
      small ? "px-2 py-0.5 text-[9px] gap-0.5" : "px-2.5 py-1 text-[10px]"
    )} style={{ backgroundColor: cfg.bg }}>
      <Icon size={small ? 8 : 10} />
      {service}
    </span>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Icon size={9} />
      {status}
    </span>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white border border-[#E5E7EB] rounded-[14px]", className)}>{children}</div>;
}

// ─── List: Stats strip ─────────────────────────────────────────────────────────
interface Stats { total: number; confirmed: number; inProgress: number; revenueCollected: number }
function StatsStrip({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {[
        { label: "Total Bookings", value: stats.total.toString(), icon: CalendarDays, color: "#1B75BC", bg: "#EEF2FF" },
        { label: "Confirmed",      value: stats.confirmed.toString(), icon: CheckCircle2, color: "#0E7C66", bg: "#ECFDF5" },
        { label: "In Progress",    value: stats.inProgress.toString(),   icon: RefreshCw,    color: "#2563EB", bg: "#EFF6FF" },
        { label: "Revenue Collected", value: `৳${(stats.revenueCollected / 100000).toFixed(1)}L`, icon: Wallet, color: "#F15A24", bg: "#FFF9E6" },
      ].map(s => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
              <Icon size={17} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[18px] font-black text-[#111827] leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
              <div className="text-[10px] text-[#9CA3AF] font-medium">{s.label}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Bookings List ─────────────────────────────────────────────────────────────
const ALL_STATUSES: BookingStatus[] = ["Draft", "Confirmed", "Pending", "Processing", "Cancelled", "On Hold", "Completed"];
const ALL_SERVICES: ServiceType[] = ["Hajj", "Umrah", "Visa", "Air Ticket", "Hotel", "Manpower", "Tour"];

function BookingsList({ onNew, onDetail }: { onNew: () => void; onDetail: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "All">("All");
  const [serviceFilter, setServiceFilter] = useState<ServiceType | "All">("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [sortField, setSortField] = useState<"id" | "amount" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const PER_PAGE = 8;

  // debounce the free-text search (server-side filter)
  useEffect(() => {
    const t = setTimeout(() => { setQ(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const params: BookingListParams = {
    page, pageSize: PER_PAGE, sort: sortField, dir: sortDir,
    q: q || undefined,
    status: statusFilter !== "All" ? STATUS_ENUM[statusFilter] : undefined,
    serviceType: serviceFilter !== "All" ? SERVICE_ENUM[serviceFilter] : undefined,
    branchId: branchFilter !== "All" ? branchFilter : undefined,
  };

  const { data: resp, isLoading, isError, error, refetch, isFetching } = useBookings(params);
  const { data: branches } = useBranches();
  const del = useDeleteBooking();

  const rows = (resp?.data ?? []).map(mapListItem);
  const stats = resp?.stats ?? { total: 0, confirmed: 0, inProgress: 0, revenueCollected: 0, byStatus: {} };
  const totalPages = resp?.totalPages ?? 1;
  const total = resp?.total ?? 0;

  const toggleSort = (field: "id" | "amount" | "date") => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("All"); setServiceFilter("All"); setBranchFilter("All"); setPage(1); };

  return (
    <div className="p-5 md:p-7">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-black text-[#111827]">Bookings</h1>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">{total} total{isFetching ? " · refreshing…" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 h-9 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:border-[#1B75BC]/30 transition-colors cursor-pointer">
            <Download size={13} className="text-[#9CA3AF]" /> Export
          </button>
          <button onClick={onNew}
            className="flex items-center gap-1.5 h-9 px-4 bg-[#1B75BC] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#14588F] transition-colors cursor-pointer shadow-lg shadow-[#1B75BC]/20">
            <Plus size={14} /> New Booking
          </button>
        </div>
      </div>

      <StatsStrip stats={stats} />

      {/* Filter bar */}
      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              placeholder="Search by ID, customer, package..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[13px] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 placeholder:text-[#D1D5DB]"
            />
          </div>
          <select value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#374151] outline-none focus:border-[#1B75BC] cursor-pointer">
            <option value="All">All Branches</option>
            {(branches ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={() => setShowAdvanced(v => !v)}
            className={cn("flex items-center gap-1.5 h-9 px-3 border rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer",
              showAdvanced ? "border-[#1B75BC] bg-[#1B75BC]/5 text-[#1B75BC]" : "border-[#E5E7EB] bg-[#F7F8FA] text-[#374151] hover:border-[#1B75BC]/30"
            )}>
            <SlidersHorizontal size={13} /> Filters
            {(serviceFilter !== "All") && <span className="w-4 h-4 bg-[#1B75BC] text-white text-[9px] font-black rounded-full flex items-center justify-center">1</span>}
          </button>
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["All", ...ALL_STATUSES] as const).map(s => {
            const count = s === "All" ? total : (stats.byStatus[STATUS_ENUM[s as BookingStatus] ?? ""] ?? 0);
            return (
              <button key={s} onClick={() => { setStatusFilter(s as BookingStatus | "All"); setPage(1); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border",
                  statusFilter === s
                    ? "border-[#1B75BC] bg-[#1B75BC] text-white"
                    : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#1B75BC]/30 hover:text-[#374151]"
                )}>
                {s}
                <span className={cn("text-[9px] font-black px-1 py-0.5 rounded-full",
                  statusFilter === s ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#9CA3AF]")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {showAdvanced && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F3F4F6] flex-wrap">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mr-1">Service:</span>
            {(["All", ...ALL_SERVICES] as const).map(s => (
              <button key={s} onClick={() => { setServiceFilter(s as ServiceType | "All"); setPage(1); }}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border",
                  serviceFilter === s
                    ? "text-white border-transparent"
                    : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#1B75BC]/30"
                )}
                style={serviceFilter === s && s !== "All" ? { backgroundColor: SERVICE_CFG[s as ServiceType].bg } : serviceFilter === s ? { backgroundColor: "#1B75BC" } : {}}>
                {s}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {isError ? (
          <div className="p-6">
            <ErrorBanner message={(error as Error)?.message || "Failed to load bookings."} onRetry={() => refetch()} />
          </div>
        ) : isLoading ? (
          <div className="p-4"><SkeletonTable rows={8} cols={7} /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
                  <tr>
                    {[
                      { key: "id",      label: "Booking ID",   sortable: true },
                      { key: "customer",label: "Customer",      sortable: false },
                      { key: "service", label: "Service",       sortable: false },
                      { key: "package", label: "Package",       sortable: false },
                      { key: "amount",  label: "Amount",        sortable: true  },
                      { key: "paid",    label: "Paid / Due",    sortable: false },
                      { key: "status",  label: "Status",        sortable: false },
                      { key: "branch",  label: "Branch",        sortable: false },
                      { key: "staff",   label: "Staff",         sortable: false },
                      { key: "date",    label: "Created",       sortable: true  },
                      { key: "actions", label: "",              sortable: false },
                    ].map(col => (
                      <th key={col.key} className="text-left px-4 py-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">
                        {col.sortable ? (
                          <button onClick={() => toggleSort(col.key as "id" | "amount" | "date")} className="flex items-center gap-1 hover:text-[#374151] cursor-pointer transition-colors">
                            {col.label}
                            <ArrowUpDown size={10} className={sortField === col.key ? "text-[#1B75BC]" : ""} />
                          </button>
                        ) : col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {rows.map(b => {
                    const due = b.amount - b.paid;
                    return (
                      <tr key={b.id} className="hover:bg-[#F7F8FA] transition-colors group cursor-pointer"
                        onClick={() => onDetail(b.id)}>
                        <td className="px-4 py-3">
                          <span className="text-[12px] font-black text-[#1B75BC]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.ref}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-[12px] font-semibold text-[#111827] whitespace-nowrap">{b.customer.name}</div>
                            <div className="text-[10px] text-[#9CA3AF]">{b.customer.phone}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><ServiceBadge service={b.service} small /></td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-[#374151] max-w-[140px] block truncate">{b.package}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[12px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(b.amount)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-[10px] text-[#0E7C66] font-bold">Paid: {fmtPrice(b.paid)}</div>
                            {due > 0 && <div className="text-[10px] text-[#DC2626] font-bold">Due: {fmtPrice(due)}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-[#6B7280]">{b.branch}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-[11px] text-[#374151]">{b.staff}</div>
                            {b.agent && <div className="text-[9px] text-[#9CA3AF]">via {b.agent}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-[#9CA3AF]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.createdAt}</span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onDetail(b.id)}
                              className="p-1.5 rounded-[6px] text-[#9CA3AF] hover:text-[#1B75BC] hover:bg-[#1B75BC]/8 transition-colors cursor-pointer" title="View">
                              <Eye size={13} />
                            </button>
                            <button className="p-1.5 rounded-[6px] text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer" title="Edit">
                              <Edit3 size={13} />
                            </button>
                            {b.status === "Draft" ? (
                              <button onClick={() => del.mutate(b.id)} disabled={del.isPending}
                                className="p-1.5 rounded-[6px] text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer" title="Delete draft">
                                <Trash2 size={13} />
                              </button>
                            ) : (
                              <button className="p-1.5 rounded-[6px] text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer" title="Print">
                                <Printer size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F4F6]">
                <span className="text-[11px] text-[#9CA3AF]">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} bookings
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#E5E7EB] text-[#374151] disabled:opacity-40 hover:border-[#1B75BC]/30 transition-colors cursor-pointer">
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={cn("w-8 h-8 flex items-center justify-center rounded-[6px] text-[12px] font-medium border transition-colors cursor-pointer",
                        page === i + 1 ? "bg-[#1B75BC] text-white border-[#1B75BC]" : "border-[#E5E7EB] text-[#374151] hover:border-[#1B75BC]/30"
                      )}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#E5E7EB] text-[#374151] disabled:opacity-40 hover:border-[#1B75BC]/30 transition-colors cursor-pointer">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {rows.length === 0 && (
              <div className="py-16 text-center">
                <Search size={32} className="text-[#E5E7EB] mx-auto mb-3" />
                <p className="text-[13px] text-[#6B7280] font-medium">No bookings match your filters</p>
                <button onClick={clearFilters}
                  className="mt-2 text-[12px] text-[#1B75BC] font-semibold hover:underline cursor-pointer">
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Detail loader (fetches the full booking by id) ─────────────────────────────
function BookingDetailLoader({ id, onBack, onEdit }: { id: string; onBack: () => void; onEdit: () => void }) {
  const { data, isLoading, isError, error, refetch } = useBooking(id);
  if (isLoading) {
    return <div className="p-6"><SkeletonTable rows={6} cols={4} /></div>;
  }
  if (isError || !data) {
    return (
      <div className="p-6">
        <ErrorBanner message={(error as Error)?.message || "Booking not found."} onRetry={() => refetch()} />
        <button onClick={onBack} className="mt-3 text-[12px] text-[#1B75BC] font-semibold hover:underline cursor-pointer">← Back to bookings</button>
      </div>
    );
  }
  return <BookingDetail booking={mapDetail(data)} onBack={onBack} onEdit={onEdit} />;
}

// ─── Module Shell ──────────────────────────────────────────────────────────────
type View = "list" | "new" | { id: string };

export function BookingsModule() {
  const [view, setView] = useState<View>("list");

  if (view === "list") {
    return <BookingsList onNew={() => setView("new")} onDetail={id => setView({ id })} />;
  }
  if (view === "new") {
    return <BookingWizard onBack={() => setView("list")} onComplete={id => setView({ id })} />;
  }
  return (
    <BookingDetailLoader
      id={(view as { id: string }).id}
      onBack={() => setView("list")}
      onEdit={() => setView("new")}
    />
  );
}
