import React, { useState, useMemo } from "react";
import {
  Search, Plus, Filter, MoreHorizontal, Eye, Edit3, Printer,
  ChevronDown, ChevronLeft, ChevronRight, Star, MapPin, Globe,
  Plane, Hotel, Briefcase, Map, X, ArrowUpDown, SlidersHorizontal,
  Download, CalendarDays, Users, Wallet, TrendingUp, CheckCircle2,
  AlertCircle, Clock, XCircle, PauseCircle, RefreshCw,
} from "lucide-react";
import { cn, fmtPrice } from "../../lib/utils";
import { BookingWizard } from "./BookingWizard";
import { BookingDetail } from "./BookingDetail";

// ─── Types & Constants ─────────────────────────────────────────────────────────
export type ServiceType = "Hajj" | "Umrah" | "Visa" | "Air Ticket" | "Hotel" | "Manpower" | "Tour";
export type BookingStatus = "Confirmed" | "Pending" | "Processing" | "Cancelled" | "On Hold" | "Completed";

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
  "Hajj":       { icon: Star,      color: "#0E6BB8", bg: "#0E6BB8", light: "#EEF2FF" },
  "Umrah":      { icon: MapPin,    color: "#E8471F", bg: "#E8471F", light: "#FFF9E6" },
  "Visa":       { icon: Globe,     color: "#7C3AED", bg: "#7C3AED", light: "#F5F3FF" },
  "Air Ticket": { icon: Plane,     color: "#2563EB", bg: "#2563EB", light: "#EFF6FF" },
  "Hotel":      { icon: Hotel,     color: "#EA580C", bg: "#EA580C", light: "#FFF7ED" },
  "Manpower":   { icon: Briefcase, color: "#0E7C66", bg: "#0E7C66", light: "#ECFDF5" },
  "Tour":       { icon: Map,       color: "#0891B2", bg: "#0891B2", light: "#F0F9FF" },
};

export const STATUS_CFG: Record<BookingStatus, { color: string; bg: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  "Confirmed":  { color: "#065F46", bg: "#D1FAE5", icon: CheckCircle2  },
  "Pending":    { color: "#92400E", bg: "#FEF3C7", icon: Clock          },
  "Processing": { color: "#1D4ED8", bg: "#DBEAFE", icon: RefreshCw      },
  "Cancelled":  { color: "#991B1B", bg: "#FEE2E2", icon: XCircle        },
  "On Hold":    { color: "#374151", bg: "#F3F4F6", icon: PauseCircle    },
  "Completed":  { color: "#0E6BB8", bg: "#EEF2FF", icon: CheckCircle2   },
};

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_BOOKINGS: Booking[] = [
  {
    id: "BK-2847", customer: { name: "Md. Harunur Rashid", phone: "+880 1711-234567", email: "harunur@gmail.com" },
    service: "Umrah", package: "Economy Plus (14D)", amount: 120000, paid: 60000,
    status: "Confirmed", branch: "Dhaka HQ", staff: "Tahmina Akter", agent: "Rahel Travel",
    createdAt: "2025-11-01", departure: "2025-12-15", travelers: 2,
    travelerList: [
      { id: "T1", name: "Md. Harunur Rashid", dob: "1972-05-14", gender: "Male", nationality: "Bangladeshi", passportNo: "AB1234567", passportExpiry: "2028-03-20", phone: "+880 1711-234567", email: "harunur@gmail.com", isPrimary: true },
      { id: "T2", name: "Fatema Rashid", dob: "1975-09-22", gender: "Female", nationality: "Bangladeshi", passportNo: "AB7654321", passportExpiry: "2027-11-15", phone: "+880 1711-234568", email: "", isPrimary: false, mahram: "Spouse" },
    ],
    installments: [
      { id: 1, label: "Booking Deposit", amount: 30000, dueDate: "2025-11-01", paidDate: "2025-11-01", status: "Paid" },
      { id: 2, label: "2nd Installment", amount: 30000, dueDate: "2025-11-20", paidDate: "2025-11-18", status: "Paid" },
      { id: 3, label: "Final Payment",   amount: 60000, dueDate: "2025-12-01", status: "Due" },
    ],
    serviceDetails: { "Room Type": "Double", "Hotel Makkah": "Towers Hotel", "Hotel Madinah": "Al Salam Hotel", "Transport": "Saudi Bus", "Season": "Ramadan", "Mahram": "Yes" },
    activityLog: [
      { time: "2025-11-01 10:22", actor: "Tahmina Akter", action: "Booking created", note: "Walk-in customer, agent Rahel Travel" },
      { time: "2025-11-01 10:45", actor: "System", action: "Confirmation email sent" },
      { time: "2025-11-18 14:30", actor: "Cashier", action: "Payment received ৳30,000", note: "2nd installment via cash" },
    ],
  },
  {
    id: "BK-2846", customer: { name: "Fatema Begum", phone: "+880 1812-345678", email: "fatema.b@yahoo.com" },
    service: "Hajj", package: "Standard (40D)", amount: 580000, paid: 200000,
    status: "Processing", branch: "Dhaka HQ", staff: "Karim Hossain", agent: undefined,
    createdAt: "2025-10-15", departure: "2026-05-12", travelers: 1,
    travelerList: [
      { id: "T1", name: "Fatema Begum", dob: "1965-03-08", gender: "Female", nationality: "Bangladeshi", passportNo: "BC2345678", passportExpiry: "2029-07-10", phone: "+880 1812-345678", email: "fatema.b@yahoo.com", isPrimary: true, mahram: "Son — Khalid Hossain" },
    ],
    installments: [
      { id: 1, label: "Booking Deposit", amount: 100000, dueDate: "2025-10-15", paidDate: "2025-10-15", status: "Paid" },
      { id: 2, label: "2nd Installment", amount: 100000, dueDate: "2025-12-01", status: "Due" },
      { id: 3, label: "3rd Installment", amount: 100000, dueDate: "2026-02-01", status: "Upcoming" },
      { id: 4, label: "Final Payment",   amount: 280000, dueDate: "2026-04-01", status: "Upcoming" },
    ],
    serviceDetails: { "Group": "Group A (Dhaka North)", "Room Type": "Triple", "Hotel Makkah": "Hilton Suites", "Hotel Madinah": "Madinah Hilton", "Transport": "Saudi Bus + Train", "Mahram": "Son (mahram form attached)" },
    activityLog: [
      { time: "2025-10-15 09:00", actor: "Karim Hossain", action: "Hajj booking created" },
      { time: "2025-10-15 09:30", actor: "System", action: "Hajj application submitted to Ministry" },
      { time: "2025-11-02 11:00", actor: "Karim Hossain", action: "Passport submitted to Hajj office" },
    ],
  },
  {
    id: "BK-2845", customer: { name: "Khandakar Ali", phone: "+880 1923-456789", email: "khandakar.ali@mail.com" },
    service: "Visa", package: "KSA Business Visa", amount: 12500, paid: 12500,
    status: "Processing", branch: "Chittagong", staff: "Nusrat Jahan", agent: "Karim Bros",
    createdAt: "2025-11-05", departure: undefined, travelers: 1,
    travelerList: [
      { id: "T1", name: "Khandakar Ali", dob: "1980-12-25", gender: "Male", nationality: "Bangladeshi", passportNo: "CD3456789", passportExpiry: "2027-08-30", phone: "+880 1923-456789", email: "khandakar.ali@mail.com", isPrimary: true },
    ],
    installments: [
      { id: 1, label: "Full Payment", amount: 12500, dueDate: "2025-11-05", paidDate: "2025-11-05", status: "Paid" },
    ],
    serviceDetails: { "Country": "Saudi Arabia", "Visa Type": "Business", "Processing": "Express (7 days)", "No. Passports": "1", "Status": "Under Review", "Documents": "All submitted" },
    activityLog: [
      { time: "2025-11-05 14:00", actor: "Nusrat Jahan", action: "Visa application created" },
      { time: "2025-11-05 14:30", actor: "System", action: "Documents checklist completed" },
      { time: "2025-11-06 10:00", actor: "Nusrat Jahan", action: "Application submitted to embassy" },
    ],
  },
  {
    id: "BK-2844", customer: { name: "Nasrin Akter", phone: "+880 1634-567890", email: "nasrin.a@gmail.com" },
    service: "Air Ticket", package: "DAC-JED Return (Economy)", amount: 45000, paid: 45000,
    status: "Confirmed", branch: "Dhaka HQ", staff: "Rubel Ahmed",
    createdAt: "2025-10-28", departure: "2025-11-20", travelers: 1,
    travelerList: [
      { id: "T1", name: "Nasrin Akter", dob: "1988-06-17", gender: "Female", nationality: "Bangladeshi", passportNo: "DE4567890", passportExpiry: "2030-01-22", phone: "+880 1634-567890", email: "nasrin.a@gmail.com", isPrimary: true },
    ],
    installments: [
      { id: 1, label: "Full Payment", amount: 45000, dueDate: "2025-10-28", paidDate: "2025-10-28", status: "Paid" },
    ],
    serviceDetails: { "Airline": "Saudi Arabian Airlines", "PNR": "XAB123", "Route": "DAC → JED → DAC", "Departure": "20 Nov 2025 03:30", "Return": "10 Dec 2025 22:45", "Class": "Economy", "Fare Type": "Net Fare" },
    activityLog: [
      { time: "2025-10-28 16:00", actor: "Rubel Ahmed", action: "Air ticket booked", note: "PNR: XAB123" },
      { time: "2025-10-28 16:05", actor: "System", action: "E-ticket sent to customer" },
    ],
  },
  {
    id: "BK-2843", customer: { name: "Jahangir Alam", phone: "+880 1755-678901", email: "jahangir.alam@corp.bd" },
    service: "Umrah", package: "Premium VIP (21D)", amount: 280000, paid: 280000,
    status: "Completed", branch: "Sylhet", staff: "Mariam Khanam", agent: "Al Madina Travel",
    createdAt: "2025-09-10", departure: "2025-10-05", travelers: 4,
    travelerList: [],
    installments: [
      { id: 1, label: "Full Payment", amount: 280000, dueDate: "2025-09-10", paidDate: "2025-09-10", status: "Paid" },
    ],
    serviceDetails: { "Room Type": "Single (4 rooms)", "Hotel Makkah": "Swissôtel Makkah", "Hotel Madinah": "Oberoi Madinah", "Transport": "Private Van", "Mahram": "N/A" },
    activityLog: [],
  },
  {
    id: "BK-2842", customer: { name: "Shirin Sultana", phone: "+880 1899-789012", email: "shirin.s@gmail.com" },
    service: "Tour", package: "Malaysia 7D/6N", amount: 95000, paid: 0,
    status: "Cancelled", branch: "Dhaka HQ", staff: "Rubel Ahmed",
    createdAt: "2025-10-01", departure: "2025-11-28", travelers: 2,
    travelerList: [],
    installments: [],
    serviceDetails: { "Destination": "Kuala Lumpur + Genting", "Duration": "7D/6N", "Hotel": "4-star", "Meal Plan": "Breakfast included", "Transport": "Coach + Cable Car" },
    activityLog: [
      { time: "2025-10-01 11:00", actor: "Rubel Ahmed", action: "Tour booking created" },
      { time: "2025-10-20 09:00", actor: "Shirin Sultana", action: "Cancellation requested via phone" },
      { time: "2025-10-20 12:00", actor: "Rubel Ahmed", action: "Booking cancelled — no charge (within policy)" },
    ],
  },
  {
    id: "BK-2841", customer: { name: "Abdul Karim", phone: "+880 1678-890123", email: "abdulkarim@bmail.com" },
    service: "Visa", package: "UAE Visit Visa", amount: 8500, paid: 8500,
    status: "Pending", branch: "Khulna", staff: "Sadia Islam",
    createdAt: "2025-11-08", travelers: 1,
    travelerList: [
      { id: "T1", name: "Abdul Karim", dob: "1990-11-03", gender: "Male", nationality: "Bangladeshi", passportNo: "EF5678901", passportExpiry: "2026-05-15", phone: "+880 1678-890123", email: "abdulkarim@bmail.com", isPrimary: true },
    ],
    installments: [
      { id: 1, label: "Full Payment", amount: 8500, dueDate: "2025-11-08", paidDate: "2025-11-08", status: "Paid" },
    ],
    serviceDetails: { "Country": "UAE", "Visa Type": "Tourist", "Processing": "Normal (15 days)", "No. Passports": "1", "Status": "Pending Submission", "Notes": "Passport renewed — new copy required" },
    activityLog: [
      { time: "2025-11-08 13:00", actor: "Sadia Islam", action: "Visa application created, pending documents" },
    ],
  },
  {
    id: "BK-2840", customer: { name: "Kamrul Hassan", phone: "+880 1755-901234", email: "kamrul.h@hotmail.com" },
    service: "Hotel", package: "Madinah Al Anwar Hotel (5 nights)", amount: 38000, paid: 38000,
    status: "Confirmed", branch: "Dhaka HQ", staff: "Tahmina Akter",
    createdAt: "2025-10-22", departure: "2025-11-25", travelers: 2,
    travelerList: [],
    installments: [{ id: 1, label: "Full Payment", amount: 38000, dueDate: "2025-10-22", paidDate: "2025-10-22", status: "Paid" }],
    serviceDetails: { "City": "Madinah, Saudi Arabia", "Hotel": "Al Anwar Hotel Madinah", "Stars": "4", "Check-in": "25 Nov 2025", "Check-out": "30 Nov 2025", "Room": "Deluxe Double", "Guests": "2", "Board": "Breakfast included" },
    activityLog: [],
  },
  {
    id: "BK-2839", customer: { name: "Raju Mia", phone: "+880 1532-012345", email: "rajumia@gmail.com" },
    service: "Manpower", package: "Construction Worker — Saudi Arabia", amount: 185000, paid: 100000,
    status: "Processing", branch: "Chittagong", staff: "Nusrat Jahan",
    createdAt: "2025-09-20", travelers: 1,
    travelerList: [
      { id: "T1", name: "Raju Mia", dob: "1995-04-12", gender: "Male", nationality: "Bangladeshi", passportNo: "FG6789012", passportExpiry: "2028-09-01", phone: "+880 1532-012345", email: "rajumia@gmail.com", isPrimary: true },
    ],
    installments: [
      { id: 1, label: "Booking Deposit", amount: 50000, dueDate: "2025-09-20", paidDate: "2025-09-20", status: "Paid" },
      { id: 2, label: "Pre-visa Payment", amount: 50000, dueDate: "2025-10-15", paidDate: "2025-10-14", status: "Paid" },
      { id: 3, label: "Final (on Visa)", amount: 85000, dueDate: "2025-12-01", status: "Due" },
    ],
    serviceDetails: { "Category": "Unskilled", "Subcategory": "Construction Worker", "Destination": "Saudi Arabia (Riyadh)", "Employer": "Al-Rashid Construction Co.", "Contract": "24 months", "Salary": "SAR 1,200/month", "Stage": "Medical done · BMET pending" },
    activityLog: [
      { time: "2025-09-20 10:00", actor: "Nusrat Jahan", action: "Manpower booking created" },
      { time: "2025-10-05 14:00", actor: "Nusrat Jahan", action: "Police clearance received" },
      { time: "2025-10-20 09:00", actor: "Nusrat Jahan", action: "Medical done — Fit certificate received" },
      { time: "2025-11-01 11:00", actor: "System", action: "BMET registration submitted" },
    ],
  },
  {
    id: "BK-2838", customer: { name: "Samira Khanam", phone: "+880 1811-123456", email: "samira.k@gmail.com" },
    service: "Hajj", package: "Economy (40D)", amount: 420000, paid: 420000,
    status: "Completed", branch: "Dhaka HQ", staff: "Karim Hossain",
    createdAt: "2025-01-10", departure: "2025-06-05", travelers: 1,
    travelerList: [],
    installments: [],
    serviceDetails: {},
    activityLog: [],
  },
  {
    id: "BK-2837", customer: { name: "Milon Chowdhury", phone: "+880 1922-234567", email: "milon.c@web.bd" },
    service: "Tour", package: "Thailand 10D/9N Premium", amount: 142000, paid: 71000,
    status: "Pending", branch: "Sylhet", staff: "Mariam Khanam",
    createdAt: "2025-11-03", departure: "2026-01-15", travelers: 3,
    travelerList: [],
    installments: [
      { id: 1, label: "Deposit", amount: 71000, dueDate: "2025-11-03", paidDate: "2025-11-03", status: "Paid" },
      { id: 2, label: "Final",   amount: 71000, dueDate: "2025-12-15", status: "Due" },
    ],
    serviceDetails: { "Destination": "Bangkok + Pattaya + Phuket", "Duration": "10D/9N", "Hotel": "4-5 star", "Meal Plan": "Breakfast + 3 Dinners", "Travelers": "3" },
    activityLog: [],
  },
  {
    id: "BK-2836", customer: { name: "Habibur Rahman", phone: "+880 1733-345678", email: "habib.r@bmail.com" },
    service: "Air Ticket", package: "DAC-DXB-DAC (Business)", amount: 185000, paid: 185000,
    status: "Confirmed", branch: "Dhaka HQ", staff: "Rubel Ahmed",
    createdAt: "2025-11-01", departure: "2025-11-22", travelers: 2,
    travelerList: [],
    installments: [{ id: 1, label: "Full Payment", amount: 185000, dueDate: "2025-11-01", paidDate: "2025-11-01", status: "Paid" }],
    serviceDetails: { "Airline": "Emirates", "PNR": "YMN456", "Route": "DAC → DXB → DAC", "Class": "Business", "Fare Type": "Full Fare" },
    activityLog: [],
  },
];

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
function StatsStrip({ bookings }: { bookings: Booking[] }) {
  const total = bookings.length;
  const confirmed = bookings.filter(b => b.status === "Confirmed").length;
  const pending = bookings.filter(b => b.status === "Pending" || b.status === "Processing").length;
  const revenue = bookings.reduce((s, b) => s + b.paid, 0);

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {[
        { label: "Total Bookings", value: total.toString(), icon: CalendarDays, color: "#0E6BB8", bg: "#EEF2FF" },
        { label: "Confirmed",      value: confirmed.toString(), icon: CheckCircle2, color: "#0E7C66", bg: "#ECFDF5" },
        { label: "In Progress",    value: pending.toString(),   icon: RefreshCw,    color: "#2563EB", bg: "#EFF6FF" },
        { label: "Revenue Collected", value: `৳${(revenue / 100000).toFixed(1)}L`, icon: Wallet, color: "#E8471F", bg: "#FFF9E6" },
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
const ALL_STATUSES: BookingStatus[] = ["Confirmed", "Pending", "Processing", "Cancelled", "On Hold", "Completed"];
const ALL_SERVICES: ServiceType[] = ["Hajj", "Umrah", "Visa", "Air Ticket", "Hotel", "Manpower", "Tour"];
const BRANCHES = ["Dhaka HQ", "Chittagong", "Sylhet", "Khulna", "Rajshahi"];

function BookingsList({ onNew, onDetail }: { onNew: () => void; onDetail: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "All">("All");
  const [serviceFilter, setServiceFilter] = useState<ServiceType | "All">("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [sortField, setSortField] = useState("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const PER_PAGE = 8;

  const filtered = useMemo(() => {
    let list = MOCK_BOOKINGS.filter(b => {
      const q = search.toLowerCase();
      const matchQ = !q || b.id.toLowerCase().includes(q) || b.customer.name.toLowerCase().includes(q) || b.package.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || b.status === statusFilter;
      const matchService = serviceFilter === "All" || b.service === serviceFilter;
      const matchBranch = branchFilter === "All" || b.branch === branchFilter;
      return matchQ && matchStatus && matchService && matchBranch;
    });
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "amount") return (a.amount - b.amount) * dir;
      if (sortField === "date") return (a.createdAt > b.createdAt ? 1 : -1) * dir;
      return (a.id > b.id ? 1 : -1) * dir;
    });
    return list;
  }, [search, statusFilter, serviceFilter, branchFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  return (
    <div className="p-5 md:p-7">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-black text-[#111827]">Bookings</h1>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">{MOCK_BOOKINGS.length} total · Showing all branches</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 h-9 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:border-[#0E6BB8]/30 transition-colors cursor-pointer">
            <Download size={13} className="text-[#9CA3AF]" /> Export
          </button>
          <button onClick={onNew}
            className="flex items-center gap-1.5 h-9 px-4 bg-[#0E6BB8] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#0B5794] transition-colors cursor-pointer shadow-lg shadow-[#0E6BB8]/20">
            <Plus size={14} /> New Booking
          </button>
        </div>
      </div>

      <StatsStrip bookings={MOCK_BOOKINGS} />

      {/* Filter bar */}
      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              placeholder="Search by ID, customer, package..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 h-9 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[13px] outline-none focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10 placeholder:text-[#D1D5DB]"
            />
          </div>
          <select value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#374151] outline-none focus:border-[#0E6BB8] cursor-pointer">
            <option value="All">All Branches</option>
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>
          <button onClick={() => setShowAdvanced(v => !v)}
            className={cn("flex items-center gap-1.5 h-9 px-3 border rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer",
              showAdvanced ? "border-[#0E6BB8] bg-[#0E6BB8]/5 text-[#0E6BB8]" : "border-[#E5E7EB] bg-[#F7F8FA] text-[#374151] hover:border-[#0E6BB8]/30"
            )}>
            <SlidersHorizontal size={13} /> Filters
            {(serviceFilter !== "All") && <span className="w-4 h-4 bg-[#0E6BB8] text-white text-[9px] font-black rounded-full flex items-center justify-center">1</span>}
          </button>
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["All", ...ALL_STATUSES] as const).map(s => {
            const count = s === "All" ? filtered.length : MOCK_BOOKINGS.filter(b => b.status === s).length;
            return (
              <button key={s} onClick={() => { setStatusFilter(s as BookingStatus | "All"); setPage(1); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border",
                  statusFilter === s
                    ? "border-[#0E6BB8] bg-[#0E6BB8] text-white"
                    : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#0E6BB8]/30 hover:text-[#374151]"
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
                    : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#0E6BB8]/30"
                )}
                style={serviceFilter === s && s !== "All" ? { backgroundColor: SERVICE_CFG[s as ServiceType].bg } : serviceFilter === s ? { backgroundColor: "#0E6BB8" } : {}}>
                {s}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
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
                      <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-[#374151] cursor-pointer transition-colors">
                        {col.label}
                        <ArrowUpDown size={10} className={sortField === col.key ? "text-[#0E6BB8]" : ""} />
                      </button>
                    ) : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {paged.map(b => {
                const due = b.amount - b.paid;
                return (
                  <tr key={b.id} className="hover:bg-[#F7F8FA] transition-colors group cursor-pointer"
                    onClick={() => onDetail(b.id)}>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-black text-[#0E6BB8]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.id}</span>
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
                          className="p-1.5 rounded-[6px] text-[#9CA3AF] hover:text-[#0E6BB8] hover:bg-[#0E6BB8]/8 transition-colors cursor-pointer" title="View">
                          <Eye size={13} />
                        </button>
                        <button className="p-1.5 rounded-[6px] text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer" title="Edit">
                          <Edit3 size={13} />
                        </button>
                        <button className="p-1.5 rounded-[6px] text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer" title="Print">
                          <Printer size={13} />
                        </button>
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
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} bookings
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#E5E7EB] text-[#374151] disabled:opacity-40 hover:border-[#0E6BB8]/30 transition-colors cursor-pointer">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={cn("w-8 h-8 flex items-center justify-center rounded-[6px] text-[12px] font-medium border transition-colors cursor-pointer",
                    page === i + 1 ? "bg-[#0E6BB8] text-white border-[#0E6BB8]" : "border-[#E5E7EB] text-[#374151] hover:border-[#0E6BB8]/30"
                  )}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#E5E7EB] text-[#374151] disabled:opacity-40 hover:border-[#0E6BB8]/30 transition-colors cursor-pointer">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Search size={32} className="text-[#E5E7EB] mx-auto mb-3" />
            <p className="text-[13px] text-[#6B7280] font-medium">No bookings match your filters</p>
            <button onClick={() => { setSearch(""); setStatusFilter("All"); setServiceFilter("All"); setBranchFilter("All"); }}
              className="mt-2 text-[12px] text-[#0E6BB8] font-semibold hover:underline cursor-pointer">
              Clear all filters
            </button>
          </div>
        )}
      </Card>
    </div>
  );
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
  const booking = MOCK_BOOKINGS.find(b => b.id === (view as { id: string }).id);
  return (
    <BookingDetail
      booking={booking || MOCK_BOOKINGS[0]}
      onBack={() => setView("list")}
      onEdit={() => setView("new")}
    />
  );
}
