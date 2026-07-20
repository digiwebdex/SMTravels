import React, { useState } from "react";
import {
  Star, MapPin, FileText, Plane, Users, Hotel, Car, Shield,
  Briefcase, GraduationCap, Settings, ChevronRight, ChevronLeft,
  Plus, Trash2, Check, X, ToggleLeft, ToggleRight, Info,
  AlertTriangle, CheckCircle, Clock, DollarSign, Globe,
  Bell, Lock, RefreshCw, Save, Edit2, Copy, ArrowUpDown,
  HelpCircle, Zap, Upload, Download, Eye, ChevronDown, Building2,
} from "lucide-react";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type ServiceView = "grid" | "config";
type ConfigTab = "general" | "fields" | "pricing" | "documents" | "sla" | "notifications";

interface ServiceDef {
  id: string; name: string; category: string; description: string;
  icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string; bg: string;
  stats: { bookings: number; pending: number; revenue: string; avgTime: string };
  active: boolean; featured: boolean;
}

interface FieldDef {
  id: string; name: string; label: string; type: string;
  required: boolean; visibleTo: string[]; order: number;
}

interface DocDef {
  id: string; name: string; required: boolean; fileTypes: string; maxMb: number; notes: string;
}

interface PricingRule {
  id: string; label: string; type: string; amount: number; currency: string; note: string;
}

// ─── Service definitions ──────────────────────────────────────────────────────
const SERVICES: ServiceDef[] = [
  {
    id: "hajj", name: "Hajj Service", category: "Pilgrimage", icon: Star,
    color: "#E8471F", bg: "#FFF9E6",
    description: "Full Hajj pilgrimage management — registration, visa, flights, Makkah & Madinah accommodation, group coordination and on-site support.",
    stats: { bookings: 342, pending: 27, revenue: "৳14.2 Cr", avgTime: "180 days" },
    active: true, featured: true,
  },
  {
    id: "umrah", name: "Umrah Service", category: "Pilgrimage", icon: MapPin,
    color: "#0E6BB8", bg: "#EEF2FF",
    description: "Year-round and seasonal Umrah packages — economy to VIP, with hotel, transport, and pilgrim coordination.",
    stats: { bookings: 1124, pending: 84, revenue: "৳9.8 Cr", avgTime: "30 days" },
    active: true, featured: true,
  },
  {
    id: "visa", name: "Visa Processing", category: "Documentation", icon: FileText,
    color: "#7C3AED", bg: "#F5F3FF",
    description: "Multi-country visa application, tracking, embassy coordination and document verification service.",
    stats: { bookings: 487, pending: 63, revenue: "৳61L", avgTime: "7 days" },
    active: true, featured: false,
  },
  {
    id: "air", name: "Air Ticket — Manual", category: "Travel", icon: Plane,
    color: "#2563EB", bg: "#EFF6FF",
    description: "Manual airline ticket booking via GDS or direct, with PNR management and traveler coordination.",
    stats: { bookings: 621, pending: 12, revenue: "৳2.8 Cr", avgTime: "1 day" },
    active: true, featured: false,
  },
  {
    id: "manpower", name: "Manpower Service", category: "Recruitment", icon: Users,
    color: "#EA580C", bg: "#FFF7ED",
    description: "International worker placement — skilled, semi-skilled, professional categories to GCC and beyond.",
    stats: { bookings: 198, pending: 31, revenue: "৳89L", avgTime: "60 days" },
    active: true, featured: false,
  },
  {
    id: "hotel", name: "Hotel Booking", category: "Accommodation", icon: Hotel,
    color: "#0E7C66", bg: "#ECFDF5",
    description: "Domestic and international hotel reservations — individual, group and corporate bookings.",
    stats: { bookings: 143, pending: 8, revenue: "৳18L", avgTime: "2 days" },
    active: true, featured: false,
  },
  {
    id: "transport", name: "Transport Service", category: "Ground", icon: Car,
    color: "#6B7280", bg: "#F3F4F6",
    description: "Airport transfers, private car hire, coach/bus charter for pilgrim and corporate groups.",
    stats: { bookings: 284, pending: 5, revenue: "৳12L", avgTime: "1 day" },
    active: true, featured: false,
  },
  {
    id: "insurance", name: "Travel Insurance", category: "Coverage", icon: Shield,
    color: "#DC2626", bg: "#FEF2F2",
    description: "Comprehensive travel insurance — medical, trip cancellation, lost baggage, and hajj-specific policies.",
    stats: { bookings: 412, pending: 0, revenue: "৳24L", avgTime: "Instant" },
    active: false, featured: false,
  },
  {
    id: "corporate", name: "Corporate Travel", category: "B2B", icon: Briefcase,
    color: "#374151", bg: "#F3F4F6",
    description: "End-to-end corporate travel management — flights, hotels, visa, per-diem tracking for organizations.",
    stats: { bookings: 67, pending: 3, revenue: "৳38L", avgTime: "3 days" },
    active: false, featured: false,
  },
  {
    id: "student", name: "Student Consultancy", category: "Education", icon: GraduationCap,
    color: "#0891B2", bg: "#F0F9FF",
    description: "Study-abroad consultancy — university selection, student visa, pre-departure briefing and post-arrival support.",
    stats: { bookings: 34, pending: 9, revenue: "৳8L", avgTime: "90 days" },
    active: false, featured: false,
  },
];

// ─── Default field templates per service ─────────────────────────────────────
const DEFAULT_FIELDS: Record<string, FieldDef[]> = {
  hajj: [
    { id: "f1", name: "full_name",     label: "Full Name (as on passport)", type: "text",   required: true,  visibleTo: ["customer","agent","admin"], order: 1 },
    { id: "f2", name: "passport_no",   label: "Passport Number",             type: "text",   required: true,  visibleTo: ["customer","agent","admin"], order: 2 },
    { id: "f3", name: "passport_exp",  label: "Passport Expiry Date",        type: "date",   required: true,  visibleTo: ["customer","agent","admin"], order: 3 },
    { id: "f4", name: "nid_no",        label: "NID / Birth Certificate No.", type: "text",   required: true,  visibleTo: ["customer","agent","admin"], order: 4 },
    { id: "f5", name: "dob",           label: "Date of Birth",               type: "date",   required: true,  visibleTo: ["customer","agent","admin"], order: 5 },
    { id: "f6", name: "mahram",        label: "Mahram / Guardian Details",   type: "text",   required: false, visibleTo: ["customer","agent","admin"], order: 6 },
    { id: "f7", name: "medical_notes", label: "Medical / Health Notes",      type: "textarea",required: false,visibleTo: ["customer","agent","admin"], order: 7 },
    { id: "f8", name: "package_tier",  label: "Package Tier Selected",       type: "select", required: true,  visibleTo: ["agent","admin"],           order: 8 },
  ],
  visa: [
    { id: "f1", name: "full_name",     label: "Full Name", type: "text",   required: true,  visibleTo: ["customer","agent","admin"], order: 1 },
    { id: "f2", name: "passport_no",   label: "Passport Number", type: "text", required: true, visibleTo: ["customer","agent","admin"], order: 2 },
    { id: "f3", name: "destination",   label: "Destination Country", type: "select", required: true, visibleTo: ["customer","agent","admin"], order: 3 },
    { id: "f4", name: "visa_type",     label: "Visa Type", type: "select", required: true, visibleTo: ["customer","agent","admin"], order: 4 },
    { id: "f5", name: "travel_date",   label: "Intended Travel Date", type: "date", required: true, visibleTo: ["customer","agent","admin"], order: 5 },
    { id: "f6", name: "occupation",    label: "Occupation", type: "text", required: false, visibleTo: ["customer","agent","admin"], order: 6 },
  ],
};

const DEFAULT_DOCS: Record<string, DocDef[]> = {
  hajj: [
    { id: "d1", name: "Passport (Valid 6+ months)", required: true, fileTypes: "JPG, PDF", maxMb: 5, notes: "Colour scanned copy, all pages" },
    { id: "d2", name: "NID / Birth Certificate",    required: true, fileTypes: "JPG, PDF", maxMb: 3, notes: "Both sides for NID" },
    { id: "d3", name: "Recent Passport Photo",      required: true, fileTypes: "JPG",      maxMb: 1, notes: "White background, 35×45mm" },
    { id: "d4", name: "Medical Fitness Certificate",required: true, fileTypes: "PDF",      maxMb: 5, notes: "Issued within 30 days" },
    { id: "d5", name: "Bank Statement (3 months)",  required: false,fileTypes: "PDF",      maxMb: 5, notes: "Certified by bank" },
  ],
  visa: [
    { id: "d1", name: "Passport Scan",              required: true, fileTypes: "JPG, PDF", maxMb: 5, notes: "Valid 6 months beyond travel" },
    { id: "d2", name: "Passport Photo (2 copies)",  required: true, fileTypes: "JPG",      maxMb: 2, notes: "White background" },
    { id: "d3", name: "Bank Statement",             required: true, fileTypes: "PDF",      maxMb: 5, notes: "Last 3 months, certified" },
    { id: "d4", name: "Employer NOC",               required: false,fileTypes: "PDF",      maxMb: 3, notes: "On company letterhead" },
  ],
};

const DEFAULT_PRICING: Record<string, PricingRule[]> = {
  hajj: [
    { id: "p1", label: "Economy Class",     type: "fixed",  amount: 580000,  currency: "BDT", note: "Per person, includes visa" },
    { id: "p2", label: "Standard Class",    type: "fixed",  amount: 720000,  currency: "BDT", note: "Per person, 4★ hotel" },
    { id: "p3", label: "Premium Class",     type: "fixed",  amount: 950000,  currency: "BDT", note: "Per person, 5★ hotel" },
    { id: "p4", label: "Service Charge",    type: "fixed",  amount: 5000,    currency: "BDT", note: "Non-refundable application fee" },
    { id: "p5", label: "Agent Commission",  type: "percent",amount: 8,       currency: "BDT", note: "% of package price" },
  ],
  visa: [
    { id: "p1", label: "KSA Visa (Business)",  type: "fixed",  amount: 12500, currency: "BDT", note: "Includes embassy fee" },
    { id: "p2", label: "UAE Visa (Tourist)",   type: "fixed",  amount: 8500,  currency: "BDT", note: "30-day single entry" },
    { id: "p3", label: "UK Visa (Standard)",   type: "fixed",  amount: 22000, currency: "BDT", note: "6-month multiple entry" },
    { id: "p4", label: "Agent Commission",     type: "percent",amount: 10,    currency: "BDT", note: "% of visa fee" },
  ],
};

// ─── Shared atoms ─────────────────────────────────────────────────────────────
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white border border-[#E5E7EB] rounded-[14px]", className)}>{children}</div>;
}

const inputCls = "w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[9px] text-[13px] text-[#111827] bg-white outline-none focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10 transition-all placeholder:text-[#D1D5DB]";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-[#DC2626] ml-0.5">*</span>}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(!checked)}>
      <div className={cn("w-10 h-5 rounded-full transition-colors relative flex-shrink-0", checked ? "bg-[#0E7C66]" : "bg-[#D1D5DB]")}>
        <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", checked ? "left-5" : "left-0.5")} />
      </div>
      {label && <span className="text-[12px] text-[#374151] font-medium">{label}</span>}
    </div>
  );
}

// ─── SERVICE GRID ─────────────────────────────────────────────────────────────
function ServiceGrid({ services, onConfigure }: { services: ServiceDef[]; onConfigure: (id: string) => void }) {
  const [svcs, setSvcs] = useState(services);
  const toggleActive = (id: string) => setSvcs(s => s.map(svc => svc.id === id ? { ...svc, active: !svc.active } : svc));

  const activeCount = svcs.filter(s => s.active).length;
  const catGroups = svcs.reduce<Record<string, ServiceDef[]>>((acc, svc) => {
    if (!acc[svc.category]) acc[svc.category] = [];
    acc[svc.category].push(svc);
    return acc;
  }, {});

  return (
    <div className="p-5 md:p-7">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-black text-[#111827]">Services Configuration</h1>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">{svcs.length} services · {activeCount} active · {svcs.length - activeCount} inactive</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#ECFDF5] border border-[#6EE7B7] rounded-[8px] text-[11px] text-[#065F46] font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0E7C66] animate-pulse" />
            {activeCount} services live
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Services",   value: svcs.length.toString(),           color: "#0E6BB8", bg: "#EEF2FF" },
          { label: "Active",           value: activeCount.toString(),            color: "#0E7C66", bg: "#ECFDF5" },
          { label: "Total Bookings",   value: svcs.reduce((s, v) => s + v.stats.bookings, 0).toLocaleString(), color: "#E8471F", bg: "#FFF9E6" },
          { label: "Total Pending",    value: svcs.reduce((s, v) => s + v.stats.pending, 0).toString(), color: "#DC2626", bg: "#FEF2F2" },
        ].map(stat => (
          <Card key={stat.label} className="px-4 py-3">
            <div className="text-[18px] font-black" style={{ color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
            <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Service cards by category */}
      {Object.entries(catGroups).map(([cat, catSvcs]) => (
        <div key={cat} className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">{cat}</span>
            <div className="flex-1 h-px bg-[#F3F4F6]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {catSvcs.map(svc => {
              const Icon = svc.icon;
              return (
                <Card key={svc.id} className={cn("p-5 transition-all hover:shadow-md", !svc.active && "opacity-70")}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: svc.bg }}>
                        <Icon size={20} style={{ color: svc.color }} />
                      </div>
                      <div>
                        <div className="text-[13px] font-black text-[#111827]">{svc.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                            svc.active ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#F3F4F6] text-[#9CA3AF]")}>
                            {svc.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                          {svc.featured && (
                            <span className="text-[9px] font-bold text-[#C43A15] bg-[#FFF9E6] px-1.5 py-0.5 rounded-full">FEATURED</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Toggle checked={svc.active} onChange={() => toggleActive(svc.id)} />
                  </div>

                  <p className="text-[11px] text-[#6B7280] leading-relaxed mb-4 line-clamp-2">{svc.description}</p>

                  <div className="grid grid-cols-4 gap-0 mb-4 border border-[#F3F4F6] rounded-[8px] overflow-hidden">
                    {[
                      { label: "Bookings", value: svc.stats.bookings.toLocaleString() },
                      { label: "Pending",  value: svc.stats.pending.toString() },
                      { label: "Revenue",  value: svc.stats.revenue },
                      { label: "Avg Time", value: svc.stats.avgTime },
                    ].map((s, i) => (
                      <div key={s.label} className={cn("px-2 py-2 text-center", i > 0 && "border-l border-[#F3F4F6]")}>
                        <div className="text-[11px] font-bold text-[#111827]" style={{ fontFamily: i < 2 ? "'JetBrains Mono', monospace" : undefined }}>{s.value}</div>
                        <div className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wide">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => onConfigure(svc.id)}
                    className="w-full h-9 flex items-center justify-center gap-1.5 border border-[#E5E7EB] rounded-[8px] text-[12px] font-semibold text-[#374151] hover:border-[#0E6BB8]/40 hover:text-[#0E6BB8] hover:bg-[#EEF2FF]/50 transition-all cursor-pointer">
                    <Settings size={13} /> Configure Service <ChevronRight size={12} />
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SERVICE CONFIG PANEL ─────────────────────────────────────────────────────
const CONFIG_TABS: Array<{ id: ConfigTab; label: string; icon: React.FC<any> }> = [
  { id: "general",       label: "General",          icon: Settings },
  { id: "fields",        label: "Form Fields",       icon: FileText },
  { id: "pricing",       label: "Pricing Rules",     icon: DollarSign },
  { id: "documents",     label: "Documents",         icon: Upload },
  { id: "sla",           label: "SLA & Workflow",    icon: Clock },
  { id: "notifications", label: "Notifications",     icon: Bell },
];

function ServiceConfigPanel({ svc, onBack }: { svc: ServiceDef; onBack: () => void }) {
  const [tab, setTab] = useState<ConfigTab>("general");
  const [active, setActive] = useState(svc.active);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields state
  const [fields, setFields] = useState<FieldDef[]>(
    DEFAULT_FIELDS[svc.id] || DEFAULT_FIELDS.hajj
  );
  const [docs, setDocs] = useState<DocDef[]>(
    DEFAULT_DOCS[svc.id] || DEFAULT_DOCS.hajj
  );
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(
    DEFAULT_PRICING[svc.id] || DEFAULT_PRICING.visa
  );

  const Icon = svc.icon;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 1000);
  };

  const moveField = (id: string, dir: "up" | "down") => {
    const idx = fields.findIndex(f => f.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === fields.length - 1) return;
    const next = [...fields];
    [next[idx], next[dir === "up" ? idx - 1 : idx + 1]] = [next[dir === "up" ? idx - 1 : idx + 1], next[idx]];
    setFields(next.map((f, i) => ({ ...f, order: i + 1 })));
  };

  const updateField = (id: string, patch: Partial<FieldDef>) =>
    setFields(f => f.map(x => x.id === id ? { ...x, ...patch } : x));

  const addField = () => setFields(f => [...f, {
    id: `f${Date.now()}`, name: "new_field", label: "New Field", type: "text",
    required: false, visibleTo: ["customer","agent","admin"], order: f.length + 1,
  }]);

  const removeField = (id: string) => setFields(f => f.filter(x => x.id !== id));

  const updateDoc = (id: string, patch: Partial<DocDef>) =>
    setDocs(d => d.map(x => x.id === id ? { ...x, ...patch } : x));
  const addDoc = () => setDocs(d => [...d, { id: `d${Date.now()}`, name: "", required: true, fileTypes: "PDF, JPG", maxMb: 5, notes: "" }]);
  const removeDoc = (id: string) => setDocs(d => d.filter(x => x.id !== id));

  const updatePricing = (id: string, patch: Partial<PricingRule>) =>
    setPricingRules(r => r.map(x => x.id === id ? { ...x, ...patch } : x));
  const addPricing = () => setPricingRules(r => [...r, { id: `p${Date.now()}`, label: "", type: "fixed", amount: 0, currency: "BDT", note: "" }]);
  const removePricing = (id: string) => setPricingRules(r => r.filter(x => x.id !== id));

  const FIELD_TYPES = ["text", "number", "email", "phone", "date", "select", "multiselect", "textarea", "file", "checkbox"];

  return (
    <div className="p-5 md:p-7">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-[13px]">
          <button onClick={onBack} className="text-[#0E6BB8] font-semibold hover:underline cursor-pointer">Services</button>
          <ChevronRight size={13} className="text-[#D1D5DB]" />
          <span className="text-[#374151] font-semibold">{svc.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-[11px] text-[#0E7C66] font-semibold">
              <CheckCircle size={13} /> Saved
            </span>
          )}
          <button onClick={onBack} className="h-9 px-3 border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:bg-[#F7F8FA] transition-colors cursor-pointer">
            <ChevronLeft size={14} className="inline" /> Back
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 h-9 px-4 bg-[#0E6BB8] rounded-[8px] text-[12px] font-bold text-white hover:bg-[#0B5794] transition-colors cursor-pointer disabled:opacity-60 shadow-sm">
            {saving ? <><RefreshCw size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* Service header card */}
      <Card className="p-5 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-[14px] flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: svc.bg }}>
            <Icon size={26} style={{ color: svc.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[18px] font-black text-[#111827]">{svc.name}</h1>
              <span className="text-[10px] font-bold text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full">{svc.category}</span>
            </div>
            <p className="text-[12px] text-[#6B7280] leading-relaxed max-w-xl">{svc.description}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[12px] text-[#374151] font-medium">{active ? "Service is live" : "Service is offline"}</span>
            <Toggle checked={active} onChange={setActive} />
          </div>
        </div>
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-0 mt-5 pt-4 border-t border-[#F3F4F6] divide-x divide-[#F3F4F6]">
          {[
            { label: "Total Bookings", value: svc.stats.bookings.toLocaleString() },
            { label: "Pending",        value: svc.stats.pending.toString() },
            { label: "Revenue",        value: svc.stats.revenue },
            { label: "Avg Processing", value: svc.stats.avgTime },
          ].map(stat => (
            <div key={stat.label} className="px-5 py-1">
              <div className="text-[15px] font-black text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
              <div className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Config tabs */}
      <div className="flex gap-1 mb-5 bg-[#F3F4F6] p-1 rounded-[10px] overflow-x-auto no-scrollbar">
        {CONFIG_TABS.map(t => {
          const TabIcon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0",
                tab === t.id ? "bg-white text-[#0E6BB8] shadow-sm" : "text-[#9CA3AF] hover:text-[#374151]")}>
              <TabIcon size={12} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── GENERAL TAB ── */}
      {tab === "general" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <Card className="p-5 space-y-4">
              <h2 className="text-[14px] font-black text-[#111827] pb-3 border-b border-[#F3F4F6]">Basic Settings</h2>
              <div>
                <FieldLabel required>Service Display Name</FieldLabel>
                <input defaultValue={svc.name} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Short Description</FieldLabel>
                <textarea defaultValue={svc.description} rows={3} className={cn(inputCls, "resize-none")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <select defaultValue={svc.category} className={cn(inputCls, "cursor-pointer")}>
                    {["Pilgrimage","Documentation","Travel","Recruitment","Accommodation","Ground","Coverage","B2B","Education"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Service Icon (internal)</FieldLabel>
                  <select className={cn(inputCls, "cursor-pointer")}>
                    <option>{svc.name} (current)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Primary Contact Email</FieldLabel>
                  <input defaultValue="hajj@smtravel.com.bd" className={inputCls} type="email" />
                </div>
                <div>
                  <FieldLabel>WhatsApp Number</FieldLabel>
                  <input defaultValue="+8801712-345678" className={inputCls} type="tel" />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                {[
                  { label: "Show on public website",   hint: "Appears in services menu and homepage",       defaultChecked: true },
                  { label: "Allow direct booking",      hint: "Customers can book without agent",           defaultChecked: true },
                  { label: "Require admin approval",    hint: "All bookings need admin confirmation",       defaultChecked: false },
                  { label: "Enable agent commission",   hint: "Agents earn commission on this service",    defaultChecked: true },
                  { label: "Mark as featured service",  hint: "Displayed prominently on homepage",         defaultChecked: svc.featured },
                ].map(opt => (
                  <div key={opt.label} className="flex items-start justify-between gap-4 py-2 border-b border-[#F7F8FA]">
                    <div>
                      <div className="text-[12px] font-semibold text-[#374151]">{opt.label}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{opt.hint}</div>
                    </div>
                    <Toggle checked={opt.defaultChecked} onChange={() => {}} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <h2 className="text-[13px] font-black text-[#111827] pb-3 border-b border-[#F3F4F6]">Quick Settings</h2>
              <div>
                <FieldLabel>Default Currency</FieldLabel>
                <select className={cn(inputCls, "cursor-pointer")} defaultValue="BDT">
                  <option>BDT — Bangladeshi Taka</option>
                  <option>USD — US Dollar</option>
                  <option>SAR — Saudi Riyal</option>
                </select>
              </div>
              <div>
                <FieldLabel>Max Group Size</FieldLabel>
                <input type="number" defaultValue={50} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Min Booking Lead Time</FieldLabel>
                <select className={cn(inputCls, "cursor-pointer")}>
                  <option>7 days before departure</option>
                  <option>14 days before departure</option>
                  <option>30 days before departure</option>
                </select>
              </div>
              <div>
                <FieldLabel>Booking Reference Prefix</FieldLabel>
                <input defaultValue="HAJJ" maxLength={6} className={inputCls} />
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-[13px] font-black text-[#111827] pb-3 mb-3 border-b border-[#F3F4F6]">Danger Zone</h2>
              <div className="space-y-2">
                <button className="w-full h-9 border border-[#E5E7EB] rounded-[8px] text-[11px] font-semibold text-[#6B7280] hover:bg-[#F7F8FA] transition-colors cursor-pointer">
                  Reset to Defaults
                </button>
                <button className="w-full h-9 border border-[#FECACA] rounded-[8px] text-[11px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer">
                  Disable Service Permanently
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── FIELDS TAB ── */}
      {tab === "fields" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F3F4F6]">
            <div>
              <h2 className="text-[14px] font-black text-[#111827]">Form Fields Configuration</h2>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">Drag to reorder. Controls which fields appear on the booking form.</p>
            </div>
            <button onClick={addField}
              className="flex items-center gap-1.5 h-8 px-3 bg-[#EEF2FF] text-[#0E6BB8] font-bold rounded-[8px] text-[11px] hover:bg-[#0E6BB8] hover:text-white transition-colors cursor-pointer">
              <Plus size={12} /> Add Field
            </button>
          </div>
          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-3 p-3.5 bg-[#F7F8FA] rounded-[10px] border border-[#E5E7EB] group hover:border-[#0E6BB8]/20 transition-colors">
                {/* Order */}
                <div className="flex flex-col gap-0.5 flex-shrink-0 pt-0.5">
                  <button onClick={() => moveField(field.id, "up")} disabled={i === 0}
                    className="w-5 h-5 flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] disabled:opacity-30 cursor-pointer"><ArrowUpDown size={10} /></button>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#0E6BB8] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {field.order}
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <FieldLabel>Field Label</FieldLabel>
                    <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <FieldLabel>Field Name</FieldLabel>
                    <input value={field.name} onChange={e => updateField(field.id, { name: e.target.value })} className={cn(inputCls, "font-mono text-[11px]")} />
                  </div>
                  <div>
                    <FieldLabel>Input Type</FieldLabel>
                    <select value={field.type} onChange={e => updateField(field.id, { type: e.target.value })} className={cn(inputCls, "cursor-pointer")}>
                      {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Required</FieldLabel>
                    <div className="flex items-center gap-2 mt-2">
                      <Toggle checked={field.required} onChange={v => updateField(field.id, { required: v })} />
                      <span className="text-[11px] text-[#6B7280]">{field.required ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 pt-4">
                  <button onClick={() => removeField(field.id)}
                    className="w-7 h-7 flex items-center justify-center text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-[6px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#FFF9E6] border border-[#E8471F]/30 rounded-[8px] flex items-center gap-2 text-[11px] text-[#78590F]">
            <AlertTriangle size={13} className="text-[#C43A15] flex-shrink-0" />
            Removing a required field from a live service may cause existing bookings to fail validation.
          </div>
        </Card>
      )}

      {/* ── PRICING TAB ── */}
      {tab === "pricing" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F3F4F6]">
            <div>
              <h2 className="text-[14px] font-black text-[#111827]">Pricing Rules</h2>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">Define fees, commissions, and pricing tiers for this service.</p>
            </div>
            <button onClick={addPricing}
              className="flex items-center gap-1.5 h-8 px-3 bg-[#EEF2FF] text-[#0E6BB8] font-bold rounded-[8px] text-[11px] hover:bg-[#0E6BB8] hover:text-white transition-colors cursor-pointer">
              <Plus size={12} /> Add Rule
            </button>
          </div>
          <div className="rounded-[10px] border border-[#E5E7EB] overflow-hidden mb-5">
            <table className="w-full min-w-[600px]">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  {["Label / Tier", "Type", "Amount", "Currency", "Notes", ""].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricingRules.map(rule => (
                  <tr key={rule.id} className="border-t border-[#F3F4F6] group">
                    <td className="py-2.5 px-3">
                      <input value={rule.label} onChange={e => updatePricing(rule.id, { label: e.target.value })}
                        className="w-36 px-2 py-1.5 border border-[#E5E7EB] rounded-[7px] text-[12px] font-semibold text-[#111827] focus:border-[#0E6BB8] outline-none" />
                    </td>
                    <td className="py-2.5 px-3">
                      <select value={rule.type} onChange={e => updatePricing(rule.id, { type: e.target.value })}
                        className="w-28 px-2 py-1.5 border border-[#E5E7EB] rounded-[7px] text-[12px] text-[#374151] focus:border-[#0E6BB8] outline-none cursor-pointer bg-white">
                        {["fixed","percent","per-person","per-group"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input type="number" value={rule.amount} onChange={e => updatePricing(rule.id, { amount: +e.target.value })}
                        className="w-28 px-2 py-1.5 border border-[#E5E7EB] rounded-[7px] text-[12px] font-mono text-[#111827] focus:border-[#0E6BB8] outline-none" />
                    </td>
                    <td className="py-2.5 px-3">
                      <select value={rule.currency} onChange={e => updatePricing(rule.id, { currency: e.target.value })}
                        className="w-20 px-2 py-1.5 border border-[#E5E7EB] rounded-[7px] text-[12px] text-[#374151] focus:border-[#0E6BB8] outline-none cursor-pointer bg-white">
                        {["BDT","USD","SAR"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input value={rule.note} onChange={e => updatePricing(rule.id, { note: e.target.value })}
                        className="w-48 px-2 py-1.5 border border-[#E5E7EB] rounded-[7px] text-[11px] text-[#6B7280] focus:border-[#0E6BB8] outline-none" placeholder="Note…" />
                    </td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => removePricing(rule.id)}
                        className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-[5px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel>Global Agent Commission %</FieldLabel>
              <input type="number" defaultValue={8} className={inputCls} />
              <p className="text-[10px] text-[#9CA3AF] mt-1">Applied if no per-booking override</p>
            </div>
            <div>
              <FieldLabel>Tax Rate %</FieldLabel>
              <input type="number" defaultValue={0} className={inputCls} />
            </div>
            <div>
              <FieldLabel>Payment Methods</FieldLabel>
              <div className="space-y-1.5 mt-1">
                {["Bank Transfer","Mobile Banking (bKash/Nagad)","Cash at Branch","Online Payment Gateway"].map(m => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-[#0E6BB8]" />
                    <span className="text-[11px] text-[#374151]">{m}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {tab === "documents" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F3F4F6]">
            <div>
              <h2 className="text-[14px] font-black text-[#111827]">Required Documents</h2>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">Documents customers must upload during or after booking.</p>
            </div>
            <button onClick={addDoc}
              className="flex items-center gap-1.5 h-8 px-3 bg-[#EEF2FF] text-[#0E6BB8] font-bold rounded-[8px] text-[11px] hover:bg-[#0E6BB8] hover:text-white transition-colors cursor-pointer">
              <Plus size={12} /> Add Document
            </button>
          </div>
          <div className="space-y-3">
            {docs.map((doc, i) => (
              <div key={doc.id} className="p-4 bg-[#F7F8FA] rounded-[10px] border border-[#E5E7EB] group">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: doc.required ? "#EEF2FF" : "#F3F4F6" }}>
                    <FileText size={13} style={{ color: doc.required ? "#0E6BB8" : "#9CA3AF" }} />
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                      <FieldLabel>Document Name</FieldLabel>
                      <input value={doc.name} onChange={e => updateDoc(doc.id, { name: e.target.value })} className={inputCls} placeholder="e.g. Passport scan" />
                    </div>
                    <div>
                      <FieldLabel>Accepted Formats</FieldLabel>
                      <input value={doc.fileTypes} onChange={e => updateDoc(doc.id, { fileTypes: e.target.value })} className={inputCls} placeholder="PDF, JPG" />
                    </div>
                    <div>
                      <FieldLabel>Max Size (MB)</FieldLabel>
                      <input type="number" value={doc.maxMb} onChange={e => updateDoc(doc.id, { maxMb: +e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <FieldLabel>Required</FieldLabel>
                      <div className="flex items-center gap-2 mt-2">
                        <Toggle checked={doc.required} onChange={v => updateDoc(doc.id, { required: v })} />
                        <span className="text-[11px] text-[#6B7280]">{doc.required ? "Mandatory" : "Optional"}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeDoc(doc.id)}
                    className="text-[#9CA3AF] hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0 mt-4">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="mt-3 pl-10">
                  <FieldLabel>Notes for applicant</FieldLabel>
                  <input value={doc.notes} onChange={e => updateDoc(doc.id, { notes: e.target.value })} className={inputCls} placeholder="Any special instructions…" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── SLA TAB ── */}
      {tab === "sla" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="p-5 space-y-4">
            <h2 className="text-[14px] font-black text-[#111827] pb-3 border-b border-[#F3F4F6]">Processing SLA</h2>
            <div>
              <FieldLabel>Standard Processing Time (business days)</FieldLabel>
              <input type="number" defaultValue={7} className={inputCls} />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F7F8FA]">
              <div>
                <div className="text-[12px] font-semibold text-[#374151]">Express Processing Available</div>
                <div className="text-[10px] text-[#9CA3AF]">Offer faster turnaround for additional fee</div>
              </div>
              <Toggle checked={true} onChange={() => {}} />
            </div>
            <div>
              <FieldLabel>Express Processing Time (business days)</FieldLabel>
              <input type="number" defaultValue={3} className={inputCls} />
            </div>
            <div>
              <FieldLabel>Express Surcharge (৳)</FieldLabel>
              <input type="number" defaultValue={3000} className={inputCls} />
            </div>
            <div>
              <FieldLabel>SLA Breach Alert (days before deadline)</FieldLabel>
              <input type="number" defaultValue={2} className={inputCls} />
            </div>
          </Card>
          <Card className="p-5 space-y-4">
            <h2 className="text-[14px] font-black text-[#111827] pb-3 border-b border-[#F3F4F6]">Approval Workflow</h2>
            <div className="space-y-3">
              {[
                { step: 1, label: "Application Submitted",      actor: "System (automatic)", status: "active" },
                { step: 2, label: "Document Verification",      actor: "Visa Executive",     status: "active" },
                { step: 3, label: "Manager Review & Approval",  actor: "Branch Manager",     status: "active" },
                { step: 4, label: "Embassy Submission",         actor: "Visa Executive",     status: "active" },
                { step: 5, label: "Outcome Notification",       actor: "System (automatic)", status: "active" },
              ].map(step => (
                <div key={step.step} className="flex items-center gap-3 p-3 bg-[#F7F8FA] rounded-[8px]">
                  <div className="w-6 h-6 rounded-full bg-[#0E6BB8] text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-[#111827]">{step.label}</div>
                    <div className="text-[10px] text-[#9CA3AF]">{step.actor}</div>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0E7C66] flex-shrink-0" />
                </div>
              ))}
              <button className="w-full h-8 border-2 border-dashed border-[#D1D5DB] rounded-[8px] text-[11px] font-semibold text-[#9CA3AF] hover:border-[#0E6BB8]/50 hover:text-[#0E6BB8] transition-colors cursor-pointer flex items-center justify-center gap-1">
                <Plus size={12} /> Add Step
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {tab === "notifications" && (
        <Card className="p-5">
          <h2 className="text-[14px] font-black text-[#111827] pb-3 mb-5 border-b border-[#F3F4F6]">Notification Templates</h2>
          <div className="space-y-4">
            {[
              { event: "Booking Confirmed",     channels: ["Email","SMS","WhatsApp"], active: true },
              { event: "Document Requested",    channels: ["Email","WhatsApp"],       active: true },
              { event: "Application Submitted", channels: ["Email"],                  active: true },
              { event: "Status Update",         channels: ["SMS","WhatsApp"],         active: true },
              { event: "SLA Breach Warning",    channels: ["Email","SMS"],            active: false },
              { event: "Completion / Delivery", channels: ["Email","SMS","WhatsApp"], active: true },
              { event: "Cancellation",          channels: ["Email","SMS"],            active: true },
            ].map(notif => (
              <div key={notif.event} className="flex items-center gap-4 p-4 bg-[#F7F8FA] rounded-[10px] border border-[#E5E7EB]">
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-[#111827]">{notif.event}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {notif.channels.map(ch => (
                      <span key={ch} className="text-[9px] font-bold text-[#0E6BB8] bg-[#EEF2FF] px-2 py-0.5 rounded-full">{ch}</span>
                    ))}
                  </div>
                </div>
                <button className="h-7 px-2.5 border border-[#E5E7EB] rounded-[6px] text-[11px] text-[#374151] hover:bg-[#F3F4F6] cursor-pointer transition-colors">
                  Edit Template
                </button>
                <Toggle checked={notif.active} onChange={() => {}} />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-[#F3F4F6] grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Default SMS Template</FieldLabel>
              <textarea defaultValue={`Dear {name}, your {service} booking #{id} has been confirmed. Contact: +8801712-345678`} rows={3} className={cn(inputCls, "resize-none text-[11px]")} />
            </div>
            <div>
              <FieldLabel>Sender Name / ID</FieldLabel>
              <input defaultValue="SMTravel" className={inputCls} />
              <p className="text-[10px] text-[#9CA3AF] mt-1">SMS Sender ID (max 11 chars)</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export function ServicesConfigPage() {
  const [view, setView] = useState<ServiceView>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedSvc = SERVICES.find(s => s.id === selectedId);

  const handleConfigure = (id: string) => {
    setSelectedId(id);
    setView("config");
  };

  return (
    <div>
      {view === "grid" && <ServiceGrid services={SERVICES} onConfigure={handleConfigure} />}
      {view === "config" && selectedSvc && (
        <ServiceConfigPanel svc={selectedSvc} onBack={() => setView("grid")} />
      )}
    </div>
  );
}
