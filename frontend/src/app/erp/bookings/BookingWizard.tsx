import React, { useState } from "react";
import {
  ChevronLeft, ChevronRight, Check, Plus, Trash2, Upload,
  AlertCircle, FileText, CreditCard, Banknote,
  Smartphone, Building2, CheckCircle2, Info, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, fmtPrice } from "../../lib/utils";
import { ServiceType, SERVICE_CFG } from "./BookingsModule";
import { useCreateBooking, useSaveDraft, useConfirmBooking, SERVICE_ENUM } from "../../hooks/bookings";
import type { ApiError } from "../../lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface WizardProps {
  onBack: () => void;
  onComplete: (id: string) => void;
}

interface TravelerForm {
  id: string;
  name: string; dob: string; gender: string; nationality: string;
  passportNo: string; passportExpiry: string; phone: string; email: string;
  mahram: string;
}

interface ChargeForm { label: string; amount: number }
interface PricingForm { unitPrice: number; qty: number; discountType: string; discountValue: number; approvedBy: string; charges: ChargeForm[] }
interface PaymentForm { mode: "full" | "installment"; installments: number; method: string; received: number; txnRef: string; notes: string }

type Detail = Record<string, string | number | boolean>;

interface WizardForm {
  detail: Detail;
  travelers: TravelerForm[];
  pricing: PricingForm;
  payment: PaymentForm;
}

// Sensible per-service defaults so a click-through yields mostly-valid data.
function initialDetail(service: ServiceType): Detail {
  switch (service) {
    case "Hajj": return { packageTier: "", season: "Hajj 1447 (May–Jun 2026)", groupAssign: "", departureDate: "", returnDate: "", roomType: "Quad (4/room)", transport: "Saudi Public Bus", hotelMakkah: "Makkah Towers Hotel", hotelMadinah: "Al Salam Hotel Madinah", daysMakkah: "", daysMadinah: "", specialRequests: "" };
    case "Umrah": return { packageTier: "", season: "Ramadan 2026", departureDate: "", returnDate: "", roomType: "Quad (4/room)", transport: "Saudi Public Bus", hotelMakkah: "Makkah Towers Hotel", hotelMadinah: "Al Salam Hotel Madinah", daysMakkah: "", daysMadinah: "", specialRequests: "" };
    case "Visa": return { destinationCountry: "Saudi Arabia", visaType: "Tourist", processingSpeed: "Normal (15 working days)", passportCount: 1, purpose: "", notes: "" };
    case "Air Ticket": return { airline: "Saudi Arabian Airlines", pnr: "", journeyType: "Return", origin: "", destination: "", cabinClass: "Economy", departAt: "", returnAt: "", baseFare: "", taxAmount: "", agentMarkup: "", fareType: "Net Fare (SMT)", baggage: "" };
    case "Hotel": return { city: "", hotelName: "", starRating: "", checkIn: "", checkOut: "", roomType: "Standard", rooms: 1, guests: 2, boardBasis: "Bed & Breakfast", confirmationNo: "", distanceFromHaram: "", specialRequests: "" };
    case "Manpower": return { workerCategory: "Unskilled", jobTitle: "Construction Worker", destinationCountry: "Saudi Arabia", destinationCity: "", employer: "", contractDuration: "12 months", monthlySalary: "", accommodation: "Employer-provided" };
    case "Tour": return { packageTier: "Malaysia 7D/6N", tourType: "Group Tour", destinations: "", duration: "", departureDate: "", returnDate: "", travelers: 2, hotelCategory: "3 Star", roomSharing: "Twin sharing", mealPlan: "Breakfast Only", itineraryNote: "" };
  }
}

function computeTotal(p: PricingForm): number {
  const sub = (Number(p.unitPrice) || 0) * (Number(p.qty) || 0);
  const disc = p.discountType === "pct" ? (sub * (Number(p.discountValue) || 0)) / 100
    : p.discountType === "amount" ? Number(p.discountValue) || 0 : 0;
  const extras = (p.charges || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
  return Math.max(0, sub - disc + extras);
}

// Build the server-side wizardData (DTO-shaped) from the local form.
function buildWizardData(form: WizardForm) {
  const primary = form.travelers[0];
  const cleanDetail = Object.fromEntries(Object.entries(form.detail).filter(([, v]) => v !== "" && v != null));
  return {
    detail: cleanDetail,
    travelers: form.travelers.filter((t) => t.name.trim()).map((t, i) => ({
      name: t.name, dob: t.dob || undefined, gender: (t.gender || "Male").toUpperCase(),
      nationality: t.nationality || undefined, passportNo: t.passportNo || undefined,
      passportExpiry: t.passportExpiry || undefined, phone: t.phone || undefined, email: t.email || undefined,
      isPrimary: i === 0, mahramRelation: t.mahram ? t.mahram.toUpperCase() : undefined,
    })),
    charges: (form.pricing.charges || []).filter((c) => c.label?.trim()).map((c) => ({ label: c.label, amount: Number(c.amount) || 0 })),
    customer: primary && primary.name.trim() && primary.phone.trim()
      ? { name: primary.name, phone: primary.phone, email: primary.email || undefined } : undefined,
    pricing: { unitPrice: Number(form.pricing.unitPrice) || 0, qty: Number(form.pricing.qty) || 0, discountType: form.pricing.discountType, discountValue: Number(form.pricing.discountValue) || 0, total: computeTotal(form.pricing) },
    payment: { mode: form.payment.mode, installments: form.payment.installments, method: form.payment.method, received: Number(form.payment.received) || 0 },
  };
}

// ─── Shared form atoms ─────────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#111827] bg-white outline-none transition-all focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10 placeholder:text-[#D1D5DB]";
const selectCls = `${inputCls} cursor-pointer`;
const labelCls = "block text-[11px] font-bold text-[#374151] uppercase tracking-wide mb-1";

function Field({ label, required, children, hint }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}</label>
      {children}
      {hint && <p className="text-[10px] text-[#9CA3AF] mt-1 flex items-center gap-1"><Info size={9} />{hint}</p>}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-4">{children}</div>;
}

// value/onChange binder over the detail object
type DetailProps = { detail: Detail; set: (k: string, v: string | number) => void };
const val = (d: Detail, k: string) => (d[k] === undefined || d[k] === null ? "" : String(d[k]));

// ─── Step 1: Choose service ────────────────────────────────────────────────────
const SERVICES: { type: ServiceType; desc: string }[] = [
  { type: "Hajj",       desc: "Full Hajj packages — group & individual, all tiers" },
  { type: "Umrah",      desc: "Year-round Umrah — economy, standard & VIP" },
  { type: "Visa",       desc: "Saudi, UAE, Malaysia, Schengen & more" },
  { type: "Air Ticket", desc: "Manual PNR entry — domestic & international flights" },
  { type: "Hotel",      desc: "Makkah, Madinah, domestic & international hotels" },
  { type: "Manpower",   desc: "Skilled & unskilled worker placement & documentation" },
  { type: "Tour",       desc: "Domestic & international tour packages" },
];

function StepService({ selected, onSelect }: { selected: ServiceType | null; onSelect: (s: ServiceType) => void }) {
  return (
    <div>
      <h3 className="text-[15px] font-black text-[#111827] mb-1">What service are you booking?</h3>
      <p className="text-[12px] text-[#9CA3AF] mb-6">Select the service type — the form will adapt accordingly.</p>
      <div className="grid grid-cols-2 gap-3">
        {SERVICES.map(s => {
          const cfg = SERVICE_CFG[s.type];
          const Icon = cfg.icon;
          const active = selected === s.type;
          return (
            <button key={s.type} onClick={() => onSelect(s.type)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-[12px] border-2 text-left transition-all cursor-pointer group",
                active ? "border-[#0E6BB8] bg-[#0E6BB8]/3 shadow-md" : "border-[#E5E7EB] bg-white hover:border-[#0E6BB8]/30 hover:shadow-sm"
              )}>
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: active ? `${cfg.color}20` : cfg.light }}>
                <Icon size={19} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-[13px] font-black mb-0.5 transition-colors", active ? "text-[#0E6BB8]" : "text-[#111827] group-hover:text-[#0E6BB8]")}>
                  {s.type}
                </div>
                <div className="text-[11px] text-[#9CA3AF] leading-snug">{s.desc}</div>
              </div>
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                active ? "bg-[#0E6BB8] border-[#0E6BB8]" : "border-[#D1D5DB]")}>
                {active && <Check size={11} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Service-specific details ─────────────────────────────────────────
function HajjUmrahDetails({ service, detail, set }: { service: ServiceType } & DetailProps) {
  const packages = service === "Hajj"
    ? ["Economy (40D — Quad)", "Standard (40D — Triple)", "Premium (40D — Double)", "VIP Elite (40D — Single)"]
    : ["Economy (10D/7N)", "Standard (14D/12N)", "Premium (21D/19N)", "VIP (21D/19N — 5★)", "Custom Duration"];

  return (
    <div className="flex flex-col gap-5">
      <Grid2>
        <Field label="Package" required>
          <select className={selectCls} value={val(detail, "packageTier")} onChange={e => set("packageTier", e.target.value)}>
            <option value="">Select package</option>
            {packages.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Season / Period" required>
          <select className={selectCls} value={val(detail, "season")} onChange={e => set("season", e.target.value)}>
            {(service === "Hajj"
              ? ["Hajj 1447 (May–Jun 2026)"]
              : ["Ramadan 2026", "Off-peak Jan–Feb", "School Break Mar–Apr", "Summer Jul–Aug", "Custom"]
            ).map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </Grid2>
      {service === "Hajj" && (
        <Field label="Group Assignment">
          <select className={selectCls} value={val(detail, "groupAssign")} onChange={e => set("groupAssign", e.target.value)}>
            <option value="">Unassigned</option>
            {["Group A — Dhaka North", "Group B — Dhaka South", "Group C — Chittagong", "Group D — Sylhet", "Group E — Special"].map(g => <option key={g}>{g}</option>)}
          </select>
        </Field>
      )}
      <Grid2>
        <Field label="Departure Date" required>
          <input type="date" className={inputCls} value={val(detail, "departureDate")} onChange={e => set("departureDate", e.target.value)} />
        </Field>
        <Field label="Return Date">
          <input type="date" className={inputCls} value={val(detail, "returnDate")} onChange={e => set("returnDate", e.target.value)} />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Room Type" required>
          <select className={selectCls} value={val(detail, "roomType")} onChange={e => set("roomType", e.target.value)}>
            {["Quad (4/room)", "Triple (3/room)", "Double (2/room)", "Single (1/room)"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Transport" required>
          <select className={selectCls} value={val(detail, "transport")} onChange={e => set("transport", e.target.value)}>
            {["Saudi Public Bus", "Private Van", "Intercity Train + Bus", "Full Private"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Hotel — Makkah" required>
          <select className={selectCls} value={val(detail, "hotelMakkah")} onChange={e => set("hotelMakkah", e.target.value)}>
            {["Makkah Towers Hotel", "Hilton Suites Makkah", "Al Marwa Rayhaan", "Grand Zamzam Hotel", "Economy Hotel (≤1km)"].map(h => <option key={h}>{h}</option>)}
          </select>
        </Field>
        <Field label="Hotel — Madinah" required>
          <select className={selectCls} value={val(detail, "hotelMadinah")} onChange={e => set("hotelMadinah", e.target.value)}>
            {["Al Salam Hotel Madinah", "Madinah Hilton", "Oberoi Madinah", "Al Anwar Hotel", "Economy Hotel (≤500m)"].map(h => <option key={h}>{h}</option>)}
          </select>
        </Field>
      </Grid2>
      <Field label="Days in Makkah / Madinah">
        <Grid2>
          <input type="number" className={inputCls} placeholder="Days in Makkah (e.g. 14)" value={val(detail, "daysMakkah")} onChange={e => set("daysMakkah", e.target.value)} />
          <input type="number" className={inputCls} placeholder="Days in Madinah (e.g. 8)" value={val(detail, "daysMadinah")} onChange={e => set("daysMadinah", e.target.value)} />
        </Grid2>
      </Field>
      <Field label="Special Requests / Notes">
        <textarea className={cn(inputCls, "resize-none")} rows={3} placeholder="Wheelchair, dietary requirements, adjoining rooms, etc." value={val(detail, "specialRequests")} onChange={e => set("specialRequests", e.target.value)} />
      </Field>
    </div>
  );
}

function VisaDetails({ detail, set }: DetailProps) {
  return (
    <div className="flex flex-col gap-5">
      <Grid2>
        <Field label="Destination Country" required>
          <select className={selectCls} value={val(detail, "destinationCountry")} onChange={e => set("destinationCountry", e.target.value)}>
            {["Saudi Arabia", "UAE", "Malaysia", "Qatar", "Kuwait", "Bahrain", "Oman", "UK", "Schengen (Multiple)", "USA", "Canada"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Visa Type" required>
          <select className={selectCls} value={val(detail, "visaType")} onChange={e => set("visaType", e.target.value)}>
            {["Tourist", "Business", "Work/Employment", "Student", "Transit", "Medical", "Family Visit"].map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Processing Speed" required>
          <select className={selectCls} value={val(detail, "processingSpeed")} onChange={e => set("processingSpeed", e.target.value)}>
            {["Normal (15 working days)", "Express (7 working days)", "Super Express (3 working days)"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="No. of Passports" required>
          <input type="number" min="1" max="50" className={inputCls} value={val(detail, "passportCount")} onChange={e => set("passportCount", e.target.value)} />
        </Field>
      </Grid2>
      <Field label="Travel Purpose / Details">
        <textarea className={cn(inputCls, "resize-none")} rows={2} placeholder="Brief purpose of travel (required for some visa types)" value={val(detail, "purpose")} onChange={e => set("purpose", e.target.value)} />
      </Field>

      <div>
        <div className={labelCls}>Document Checklist</div>
        <div className="border border-[#E5E7EB] rounded-[10px] overflow-hidden divide-y divide-[#F3F4F6]">
          {[
            { doc: "Original Passport (min. 6 months validity)", required: true, default: true },
            { doc: "Passport-size photo (white background, 2×2)", required: true, default: true },
            { doc: "NID photocopy", required: true, default: true },
            { doc: "Bank statement (last 3–6 months)", required: false, default: false },
            { doc: "Employment letter / NOC", required: false, default: false },
            { doc: "Trade license (for business visa)", required: false, default: false },
            { doc: "Hotel booking confirmation", required: false, default: false },
            { doc: "Flight itinerary", required: false, default: false },
            { doc: "Travel insurance", required: false, default: false },
          ].map((d, i) => (
            <label key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F8FA] cursor-pointer">
              <input type="checkbox" defaultChecked={d.default} className="w-4 h-4 accent-[#0E6BB8]" />
              <span className="text-[12px] text-[#374151] flex-1">{d.doc}</span>
              {d.required && <span className="text-[9px] font-bold text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.5 rounded-full">Required</span>}
            </label>
          ))}
        </div>
      </div>

      <Field label="Notes / Special Instructions">
        <textarea className={cn(inputCls, "resize-none")} rows={2} placeholder="Any additional notes for the visa team" value={val(detail, "notes")} onChange={e => set("notes", e.target.value)} />
      </Field>
    </div>
  );
}

function AirTicketDetails({ detail, set }: DetailProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px] px-4 py-3 flex items-start gap-2.5">
        <Info size={14} className="text-[#2563EB] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#1D4ED8] leading-relaxed">This is a <strong>manual booking module</strong> — no airline API connection. Enter PNR and fare details directly from your GDS terminal (Galileo/Sabre/Amadeus) or airline portal.</p>
      </div>
      <Grid2>
        <Field label="Airline" required>
          <select className={selectCls} value={val(detail, "airline")} onChange={e => set("airline", e.target.value)}>
            {["Saudi Arabian Airlines", "Biman Bangladesh Airlines", "Emirates", "Qatar Airways", "Air Arabia", "Flydubai", "IndiGo", "US-Bangla Airlines", "Regent Airways", "Other"].map(a => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="PNR / Booking Reference" required hint="Enter the 6-character GDS locator">
          <input className={inputCls} placeholder="e.g. XAB123" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }} value={val(detail, "pnr")} onChange={e => set("pnr", e.target.value)} />
        </Field>
      </Grid2>
      <Field label="Journey Type" required>
        <div className="flex gap-3">
          {["One-way", "Return", "Multi-city"].map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="journey" value={t} className="accent-[#0E6BB8]" checked={val(detail, "journeyType") === t} onChange={() => set("journeyType", t)} />
              <span className="text-[12px] text-[#374151]">{t}</span>
            </label>
          ))}
        </div>
      </Field>
      <Grid3>
        <Field label="Origin" required>
          <input className={inputCls} placeholder="DAC — Dhaka" value={val(detail, "origin")} onChange={e => set("origin", e.target.value)} />
        </Field>
        <Field label="Destination" required>
          <input className={inputCls} placeholder="JED — Jeddah" value={val(detail, "destination")} onChange={e => set("destination", e.target.value)} />
        </Field>
        <Field label="Class" required>
          <select className={selectCls} value={val(detail, "cabinClass")} onChange={e => set("cabinClass", e.target.value)}>
            {["Economy", "Premium Economy", "Business", "First"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </Grid3>
      <Grid2>
        <Field label="Departure Date & Time" required>
          <input type="datetime-local" className={inputCls} value={val(detail, "departAt")} onChange={e => set("departAt", e.target.value)} />
        </Field>
        <Field label="Return Date & Time">
          <input type="datetime-local" className={inputCls} value={val(detail, "returnAt")} onChange={e => set("returnAt", e.target.value)} />
        </Field>
      </Grid2>
      <div className="border border-[#E5E7EB] rounded-[10px] overflow-hidden">
        <div className="bg-[#F7F8FA] px-4 py-2.5 border-b border-[#E5E7EB]">
          <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">Fare Breakdown</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <Field label="Base Fare (৳)" required>
            <input type="number" className={inputCls} placeholder="0" value={val(detail, "baseFare")} onChange={e => set("baseFare", e.target.value)} />
          </Field>
          <Field label="Tax / Surcharge (৳)">
            <input type="number" className={inputCls} placeholder="0" value={val(detail, "taxAmount")} onChange={e => set("taxAmount", e.target.value)} />
          </Field>
          <Field label="Agent Markup (৳)">
            <input type="number" className={inputCls} placeholder="0" value={val(detail, "agentMarkup")} onChange={e => set("agentMarkup", e.target.value)} />
          </Field>
          <Field label="Fare Type">
            <select className={selectCls} value={val(detail, "fareType")} onChange={e => set("fareType", e.target.value)}>
              {["Net Fare (SMT)", "Full Published Fare", "Special Corporate Fare", "Group Fare"].map(f => <option key={f}>{f}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <Field label="Baggage Allowance">
        <input className={inputCls} placeholder="e.g. 30kg checked + 7kg hand luggage" value={val(detail, "baggage")} onChange={e => set("baggage", e.target.value)} />
      </Field>
    </div>
  );
}

function HotelDetails({ detail, set }: DetailProps) {
  return (
    <div className="flex flex-col gap-5">
      <Grid2>
        <Field label="City / Destination" required>
          <input className={inputCls} placeholder="e.g. Makkah, Dubai, Cox's Bazar" value={val(detail, "city")} onChange={e => set("city", e.target.value)} />
        </Field>
        <Field label="Hotel Name" required>
          <input className={inputCls} placeholder="Full hotel name" value={val(detail, "hotelName")} onChange={e => set("hotelName", e.target.value)} />
        </Field>
      </Grid2>
      <Grid3>
        <Field label="Star Rating">
          <select className={selectCls} value={val(detail, "starRating")} onChange={e => set("starRating", e.target.value)}>
            <option value="">Select</option>
            {[{ l: "3 Star", v: 3 }, { l: "4 Star", v: 4 }, { l: "5 Star", v: 5 }].map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </Field>
        <Field label="Check-in Date" required>
          <input type="date" className={inputCls} value={val(detail, "checkIn")} onChange={e => set("checkIn", e.target.value)} />
        </Field>
        <Field label="Check-out Date" required>
          <input type="date" className={inputCls} value={val(detail, "checkOut")} onChange={e => set("checkOut", e.target.value)} />
        </Field>
      </Grid3>
      <Grid3>
        <Field label="Room Type" required>
          <select className={selectCls} value={val(detail, "roomType")} onChange={e => set("roomType", e.target.value)}>
            {["Standard", "Deluxe", "Superior", "Junior Suite", "Suite", "Executive"].map(r => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="No. of Rooms" required>
          <input type="number" min="1" className={inputCls} value={val(detail, "rooms")} onChange={e => set("rooms", e.target.value)} />
        </Field>
        <Field label="No. of Guests" required>
          <input type="number" min="1" className={inputCls} value={val(detail, "guests")} onChange={e => set("guests", e.target.value)} />
        </Field>
      </Grid3>
      <Field label="Board Basis" required>
        <div className="grid grid-cols-2 gap-2">
          {["Room Only", "Bed & Breakfast", "Half Board (2 meals)", "Full Board (3 meals)", "All Inclusive"].map(b => (
            <label key={b} className="flex items-center gap-2 p-2.5 border border-[#E5E7EB] rounded-[8px] cursor-pointer hover:border-[#0E6BB8]/30 transition-colors">
              <input type="radio" name="board" value={b} className="accent-[#0E6BB8]" checked={val(detail, "boardBasis") === b} onChange={() => set("boardBasis", b)} />
              <span className="text-[12px] text-[#374151]">{b}</span>
            </label>
          ))}
        </div>
      </Field>
      <Grid2>
        <Field label="Confirmation No. (if pre-booked)">
          <input className={inputCls} placeholder="Hotel confirmation number" value={val(detail, "confirmationNo")} onChange={e => set("confirmationNo", e.target.value)} />
        </Field>
        <Field label="Distance from Haram (if applicable)">
          <input className={inputCls} placeholder="e.g. 200m, 1.5km" value={val(detail, "distanceFromHaram")} onChange={e => set("distanceFromHaram", e.target.value)} />
        </Field>
      </Grid2>
      <Field label="Special Requests">
        <textarea className={cn(inputCls, "resize-none")} rows={2} placeholder="Early check-in, high floor, smoking/non-smoking, etc." value={val(detail, "specialRequests")} onChange={e => set("specialRequests", e.target.value)} />
      </Field>
    </div>
  );
}

function ManpowerDetails({ detail, set }: DetailProps) {
  return (
    <div className="flex flex-col gap-5">
      <Grid2>
        <Field label="Worker Category" required>
          <select className={selectCls} value={val(detail, "workerCategory")} onChange={e => set("workerCategory", e.target.value)}>
            {["Unskilled", "Semi-Skilled", "Skilled", "Technical / Professional"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Job / Subcategory" required>
          <select className={selectCls} value={val(detail, "jobTitle")} onChange={e => set("jobTitle", e.target.value)}>
            {["Construction Worker", "Electrician", "Plumber", "Mason / Bricklayer", "Painter", "Carpenter", "Driver", "Security Guard", "Housemaid", "Nurse", "Engineer", "Other"].map(j => <option key={j}>{j}</option>)}
          </select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Destination Country" required>
          <select className={selectCls} value={val(detail, "destinationCountry")} onChange={e => set("destinationCountry", e.target.value)}>
            {["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Malaysia", "Oman", "Bahrain", "Jordan", "Singapore"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Destination City">
          <input className={inputCls} placeholder="e.g. Riyadh, Dubai, Doha" value={val(detail, "destinationCity")} onChange={e => set("destinationCity", e.target.value)} />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Employer / Company Name" required>
          <input className={inputCls} placeholder="Employer or recruiting agency name" value={val(detail, "employer")} onChange={e => set("employer", e.target.value)} />
        </Field>
        <Field label="Contract Duration" required>
          <select className={selectCls} value={val(detail, "contractDuration")} onChange={e => set("contractDuration", e.target.value)}>
            {["6 months", "12 months", "24 months (2 years)", "36 months (3 years)", "Open-ended"].map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Monthly Salary" required>
          <input className={inputCls} placeholder="e.g. SAR 1,200" value={val(detail, "monthlySalary")} onChange={e => set("monthlySalary", e.target.value)} />
        </Field>
        <Field label="Accommodation">
          <select className={selectCls} value={val(detail, "accommodation")} onChange={e => set("accommodation", e.target.value)}>
            {["Employer-provided", "Worker self-arranged", "Allowance provided"].map(a => <option key={a}>{a}</option>)}
          </select>
        </Field>
      </Grid2>

      <div>
        <div className={labelCls}>Document Stage Tracker</div>
        <div className="border border-[#E5E7EB] rounded-[10px] overflow-hidden divide-y divide-[#F3F4F6]">
          {[
            { stage: "Police Clearance Certificate", days: "7–10 days" },
            { stage: "Medical / Fitness Test (GAMCA)", days: "1–3 days" },
            { stage: "BMET Registration", days: "3–5 days" },
            { stage: "Smart Card Collection (BMET)", days: "5–7 days" },
            { stage: "Embassy / Visa Stamping", days: "7–15 days" },
            { stage: "Airline Ticket", days: "On departure date" },
            { stage: "BOESL / Flight Clearance", days: "1–2 days" },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <select className="text-[11px] border border-[#E5E7EB] rounded-[6px] px-2 py-1 text-[#374151] outline-none cursor-pointer">
                <option>Pending</option>
                <option>In Progress</option>
                <option>Done</option>
                <option>N/A</option>
              </select>
              <span className="text-[12px] text-[#374151] flex-1">{d.stage}</span>
              <span className="text-[10px] text-[#9CA3AF]">{d.days}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TourDetails({ detail, set }: DetailProps) {
  return (
    <div className="flex flex-col gap-5">
      <Grid2>
        <Field label="Tour Package" required>
          <select className={selectCls} value={val(detail, "packageTier")} onChange={e => set("packageTier", e.target.value)}>
            {["Malaysia 7D/6N", "Thailand 10D/9N Premium", "Singapore + Malaysia 8D", "Dubai 5D/4N", "Maldives 4D/3N", "Cox's Bazar 3D/2N", "Sundarbans 2D/1N", "Sylhet 3D/2N", "Custom Package"].map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Tour Type">
          <select className={selectCls} value={val(detail, "tourType")} onChange={e => set("tourType", e.target.value)}>
            {["Group Tour", "Private / Customized", "Honeymoon Package", "Family Package", "Corporate Group"].map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Primary Destination(s)" required>
          <input className={inputCls} placeholder="e.g. Kuala Lumpur, Genting, Penang" value={val(detail, "destinations")} onChange={e => set("destinations", e.target.value)} />
        </Field>
        <Field label="Duration">
          <input className={inputCls} placeholder="e.g. 7D/6N" value={val(detail, "duration")} onChange={e => set("duration", e.target.value)} />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Departure Date" required>
          <input type="date" className={inputCls} value={val(detail, "departureDate")} onChange={e => set("departureDate", e.target.value)} />
        </Field>
        <Field label="Return Date">
          <input type="date" className={inputCls} value={val(detail, "returnDate")} onChange={e => set("returnDate", e.target.value)} />
        </Field>
      </Grid2>
      <Grid3>
        <Field label="No. of Travelers" required>
          <input type="number" min="1" className={inputCls} value={val(detail, "travelers")} onChange={e => set("travelers", e.target.value)} />
        </Field>
        <Field label="Hotel Category" required>
          <select className={selectCls} value={val(detail, "hotelCategory")} onChange={e => set("hotelCategory", e.target.value)}>
            {["3 Star", "4 Star", "5 Star", "Budget"].map(h => <option key={h}>{h}</option>)}
          </select>
        </Field>
        <Field label="Room Sharing">
          <select className={selectCls} value={val(detail, "roomSharing")} onChange={e => set("roomSharing", e.target.value)}>
            {["Twin sharing", "Double room", "Triple sharing", "Single rooms"].map(r => <option key={r}>{r}</option>)}
          </select>
        </Field>
      </Grid3>
      <Field label="Meal Plan" required>
        <div className="flex gap-3 flex-wrap">
          {["No Meals", "Breakfast Only", "Breakfast + 2 Dinners", "All Meals Included"].map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="meal" value={m} className="accent-[#0E6BB8]" checked={val(detail, "mealPlan") === m} onChange={() => set("mealPlan", m)} />
              <span className="text-[12px] text-[#374151]">{m}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Itinerary / Day Plan">
        <textarea className={cn(inputCls, "resize-none")} rows={4} placeholder="Day 1: Arrival, transfer to hotel...&#10;Day 2: City tour...&#10;Day 3: ..." value={val(detail, "itineraryNote")} onChange={e => set("itineraryNote", e.target.value)} />
      </Field>
    </div>
  );
}

// ─── Step 3: Travelers ─────────────────────────────────────────────────────────
function StepTravelers({ service, travelers, setTravelers }: { service: ServiceType | null; travelers: TravelerForm[]; setTravelers: (t: TravelerForm[]) => void }) {
  const add = () => setTravelers([...travelers, {
    id: String(travelers.length + 1), name: "", dob: "", gender: "Male", nationality: "Bangladeshi",
    passportNo: "", passportExpiry: "", phone: "", email: "", mahram: "",
  }]);
  const remove = (id: string) => setTravelers(travelers.filter(t => t.id !== id));
  const update = (id: string, field: keyof TravelerForm, v: string) =>
    setTravelers(travelers.map(t => t.id === id ? { ...t, [field]: v } : t));

  const needsMahram = service === "Hajj" || service === "Umrah";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-black text-[#111827]">Traveler Information</h3>
          <p className="text-[12px] text-[#9CA3AF]">Add all travelers — passport details required for all.</p>
        </div>
        <button onClick={add}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0E6BB8] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#0B5794] transition-colors cursor-pointer">
          <Plus size={13} /> Add Traveler
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {travelers.map((t, i) => (
          <div key={t.id} className="border border-[#E5E7EB] rounded-[12px] overflow-hidden">
            <div className="flex items-center justify-between bg-[#F7F8FA] px-4 py-2.5 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#0E6BB8] text-white text-[10px] font-black flex items-center justify-center">{i + 1}</div>
                <span className="text-[12px] font-bold text-[#374151]">{t.name || `Traveler ${i + 1}`}</span>
                {i === 0 && <span className="text-[9px] font-bold text-white bg-[#E8471F] px-1.5 py-0.5 rounded-full">PRIMARY</span>}
              </div>
              {i > 0 && (
                <button onClick={() => remove(t.id)} className="text-[#DC2626] hover:text-[#991B1B] cursor-pointer p-1">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <Field label="Full Name (as on passport)" required>
                  <input className={inputCls} placeholder="Full name" value={t.name} onChange={e => update(t.id, "name", e.target.value)} />
                </Field>
              </div>
              <Field label="Date of Birth" required>
                <input type="date" className={inputCls} value={t.dob} onChange={e => update(t.id, "dob", e.target.value)} />
              </Field>
              <Field label="Gender" required>
                <select className={selectCls} value={t.gender} onChange={e => update(t.id, "gender", e.target.value)}>
                  <option>Male</option><option>Female</option>
                </select>
              </Field>
              <Field label="Nationality">
                <input className={inputCls} value={t.nationality} onChange={e => update(t.id, "nationality", e.target.value)} />
              </Field>
              <Field label="Passport Number" required>
                <input className={inputCls} placeholder="AA1234567" style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  value={t.passportNo} onChange={e => update(t.id, "passportNo", e.target.value)} />
              </Field>
              <Field label="Passport Expiry" required>
                <input type="date" className={inputCls} value={t.passportExpiry} onChange={e => update(t.id, "passportExpiry", e.target.value)} />
              </Field>
              {i === 0 ? (
                <>
                  <Field label="Phone / WhatsApp" required>
                    <input type="tel" className={inputCls} placeholder="+880 1X XXX XXXXX" value={t.phone} onChange={e => update(t.id, "phone", e.target.value)} />
                  </Field>
                  <Field label="Email Address">
                    <input type="email" className={inputCls} placeholder="email@example.com" value={t.email} onChange={e => update(t.id, "email", e.target.value)} />
                  </Field>
                </>
              ) : (
                needsMahram && (
                  <Field label="Mahram Relationship (if female)">
                    <select className={selectCls} value={t.mahram} onChange={e => update(t.id, "mahram", e.target.value)}>
                      <option value="">N/A (male traveler)</option>
                      {["Husband", "Father", "Brother", "Son", "Uncle"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Documents ─────────────────────────────────────────────────────────
const DOC_TYPES: Record<ServiceType, string[]> = {
  "Hajj":       ["Passport Copy (all pages)", "NID Copy", "Passport-size Photo (white bg)", "Medical Certificate", "Vaccination Card (Meningitis)", "Mahram Certificate (if applicable)", "Previous Hajj Certificate (if any)"],
  "Umrah":      ["Passport Copy", "NID Copy", "Passport-size Photo (white bg)", "Vaccination Card"],
  "Visa":       ["Passport (original)", "Photo", "NID Copy", "Bank Statement", "Employment/NOC Letter", "Trade License (business)"],
  "Air Ticket": ["Passport Copy (for international)", "NID / Birth Certificate (for domestic)"],
  "Hotel":      ["Passport Copy", "NID Copy"],
  "Manpower":   ["Passport Copy", "NID Copy", "Birth Certificate", "Police Clearance", "Medical / GAMCA Certificate", "Photo (Passport-size)", "Educational Certificate", "Trade Certificate (if skilled)", "BMET Smart Card", "Employer Demand Letter"],
  "Tour":       ["Passport Copy", "NID Copy", "Passport-size Photo", "Travel Insurance (for some destinations)"],
};

function StepDocuments({ service }: { service: ServiceType | null }) {
  const docs = service ? DOC_TYPES[service] : DOC_TYPES["Umrah"];
  return (
    <div>
      <h3 className="text-[15px] font-black text-[#111827] mb-1">Documents & Attachments</h3>
      <p className="text-[12px] text-[#9CA3AF] mb-6">Upload scanned copies. Accepted formats: PDF, JPG, PNG. Max 5MB each.</p>
      <div className="grid grid-cols-2 gap-3">
        {docs.map(doc => (
          <div key={doc} className="border border-[#E5E7EB] rounded-[10px] overflow-hidden">
            <div className="bg-[#F7F8FA] px-3 py-2 border-b border-[#E5E7EB] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#374151]">{doc}</span>
              <span className="text-[9px] text-[#9CA3AF] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded-full">PDF/IMG</span>
            </div>
            <div className="p-3">
              <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-[#E5E7EB] rounded-[8px] cursor-pointer hover:border-[#0E6BB8]/40 hover:bg-[#0E6BB8]/2 transition-colors group">
                <Upload size={16} className="text-[#D1D5DB] group-hover:text-[#0E6BB8] mb-1 transition-colors" />
                <span className="text-[10px] text-[#9CA3AF] group-hover:text-[#0E6BB8] transition-colors">Click to upload</span>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px] p-3 flex items-start gap-2.5">
        <Info size={14} className="text-[#2563EB] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#1D4ED8]">Documents can also be uploaded later from the booking detail page. Incomplete documents will trigger a task reminder.</p>
      </div>
    </div>
  );
}

// ─── Step 5: Pricing & Discounts ───────────────────────────────────────────────
function StepPricing({ pricing, setPricing }: { pricing: PricingForm; setPricing: (p: PricingForm) => void }) {
  const set = (patch: Partial<PricingForm>) => setPricing({ ...pricing, ...patch });
  const subtotal = (Number(pricing.unitPrice) || 0) * (Number(pricing.qty) || 0);
  const discount = pricing.discountType === "pct" ? subtotal * (Number(pricing.discountValue) || 0) / 100
    : pricing.discountType === "amount" ? Number(pricing.discountValue) || 0 : 0;
  const extras = pricing.charges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const total = Math.max(0, subtotal - discount + extras);

  const setCharge = (i: number, field: keyof ChargeForm, v: string) =>
    set({ charges: pricing.charges.map((c, idx) => idx === i ? { ...c, [field]: field === "amount" ? Number(v) : v } : c) });

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-[15px] font-black text-[#111827] mb-1">Pricing & Discounts</h3>
      <div className="border border-[#E5E7EB] rounded-[12px] overflow-hidden">
        <div className="bg-[#F7F8FA] px-4 py-2.5 border-b border-[#E5E7EB]">
          <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">Base Pricing</span>
        </div>
        <div className="p-4 grid grid-cols-3 gap-4">
          <Field label="Unit Price (per person)" required>
            <input type="number" className={inputCls} value={pricing.unitPrice || ""} onChange={e => set({ unitPrice: Number(e.target.value) })} />
          </Field>
          <Field label="Quantity (travelers)" required>
            <input type="number" className={inputCls} value={pricing.qty || ""} onChange={e => set({ qty: Number(e.target.value) })} />
          </Field>
          <Field label="Subtotal">
            <div className="flex items-center h-[42px] px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[13px] font-bold text-[#111827]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtPrice(subtotal)}
            </div>
          </Field>
        </div>
      </div>

      <div className="border border-[#E5E7EB] rounded-[12px] overflow-hidden">
        <div className="bg-[#F7F8FA] px-4 py-2.5 border-b border-[#E5E7EB]">
          <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">Discount</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <Field label="Discount Type">
            <select className={selectCls} value={pricing.discountType} onChange={e => set({ discountType: e.target.value })}>
              <option value="none">No discount</option>
              <option value="amount">Fixed amount (৳)</option>
              <option value="pct">Percentage (%)</option>
              <option value="group">Group discount</option>
              <option value="promo">Promo code</option>
            </select>
          </Field>
          {pricing.discountType !== "none" && (
            <Field label={pricing.discountType === "pct" ? "Discount %" : "Discount Amount (৳)"}>
              <input type="number" className={inputCls} placeholder={pricing.discountType === "pct" ? "5" : "5000"}
                value={pricing.discountValue || ""} onChange={e => set({ discountValue: Number(e.target.value) })} />
            </Field>
          )}
          {pricing.discountType !== "none" && <Field label="Approved By">
            <input className={inputCls} placeholder="Manager name / authorization" value={pricing.approvedBy} onChange={e => set({ approvedBy: e.target.value })} />
          </Field>}
        </div>
      </div>

      <div className="border border-[#E5E7EB] rounded-[12px] overflow-hidden">
        <div className="flex items-center justify-between bg-[#F7F8FA] px-4 py-2.5 border-b border-[#E5E7EB]">
          <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">Additional Charges</span>
          <button onClick={() => set({ charges: [...pricing.charges, { label: "", amount: 0 }] })}
            className="text-[11px] text-[#0E6BB8] font-semibold hover:underline cursor-pointer flex items-center gap-1"><Plus size={11} /> Add charge</button>
        </div>
        <div className="divide-y divide-[#F3F4F6]">
          {pricing.charges.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <input className="flex-1 text-[12px] text-[#374151] bg-transparent outline-none" value={c.label} placeholder="Charge label" onChange={e => setCharge(i, "label", e.target.value)} />
              <input type="number" className="w-28 px-2 py-1.5 border border-[#E5E7EB] rounded-[6px] text-[12px] outline-none text-right" value={c.amount || ""} onChange={e => setCharge(i, "amount", e.target.value)} />
              <button onClick={() => set({ charges: pricing.charges.filter((_, idx) => idx !== i) })} className="text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer"><Trash2 size={12} /></button>
            </div>
          ))}
          {pricing.charges.length === 0 && <div className="px-4 py-3 text-[11px] text-[#9CA3AF]">No additional charges.</div>}
        </div>
      </div>

      {/* Total summary */}
      <div className="bg-[#0E6BB8] rounded-[12px] p-5 text-white">
        <div className="flex flex-col gap-2 mb-4">
          {[
            ["Subtotal", fmtPrice(subtotal)],
            ["Discount", discount > 0 ? `− ${fmtPrice(discount)}` : "—"],
            ["Additional charges", fmtPrice(extras)],
          ].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between text-[12px]">
              <span className="text-white/60">{l}</span>
              <span className="text-white font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/20 pt-4 flex items-center justify-between">
          <span className="text-[14px] font-bold text-white/80">Total Amount</span>
          <span className="text-[24px] font-black text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Step 6: Payment Plan ──────────────────────────────────────────────────────
function StepPayment({ payment, setPayment, total }: { payment: PaymentForm; setPayment: (p: PaymentForm) => void; total: number }) {
  const set = (patch: Partial<PaymentForm>) => setPayment({ ...payment, ...patch });
  const perInst = Math.ceil(total / Math.max(1, payment.installments));

  const PAYMENT_METHODS = [
    { key: "cash", icon: Banknote, label: "Cash" },
    { key: "bank", icon: Building2, label: "Bank Transfer" },
    { key: "bkash", icon: Smartphone, label: "bKash" },
    { key: "nagad", icon: Smartphone, label: "Nagad" },
    { key: "cheque", icon: FileText, label: "Cheque" },
    { key: "card", icon: CreditCard, label: "Card" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-[15px] font-black text-[#111827] mb-4">Payment Plan</h3>
        <div className="flex gap-3 mb-5">
          {[
            { key: "full", label: "Full Payment", sub: "Pay entire amount now" },
            { key: "installment", label: "Installment Plan", sub: "Split into multiple payments" },
          ].map(m => (
            <button key={m.key} onClick={() => set({ mode: m.key as "full" | "installment" })}
              className={cn("flex-1 p-4 rounded-[12px] border-2 text-left transition-all cursor-pointer",
                payment.mode === m.key ? "border-[#0E6BB8] bg-[#0E6BB8]/3" : "border-[#E5E7EB] hover:border-[#0E6BB8]/30"
              )}>
              <div className={cn("text-[13px] font-bold mb-0.5", payment.mode === m.key ? "text-[#0E6BB8]" : "text-[#111827]")}>{m.label}</div>
              <div className="text-[11px] text-[#9CA3AF]">{m.sub}</div>
            </button>
          ))}
        </div>

        {payment.mode === "installment" && (
          <div className="border border-[#E5E7EB] rounded-[12px] p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className={labelCls}>Number of Installments</div>
              <div className="flex items-center gap-2">
                <button onClick={() => set({ installments: Math.max(2, payment.installments - 1) })} className="w-7 h-7 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#374151] hover:border-[#0E6BB8]/30 cursor-pointer text-lg leading-none">−</button>
                <span className="w-8 text-center text-[14px] font-black text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{payment.installments}</span>
                <button onClick={() => set({ installments: Math.min(12, payment.installments + 1) })} className="w-7 h-7 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#374151] hover:border-[#0E6BB8]/30 cursor-pointer text-lg leading-none">+</button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: payment.installments }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0E6BB8]/8 text-[#0E6BB8] text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-[12px] text-[#374151] w-32">{i === 0 ? "Booking Deposit" : i === payment.installments - 1 ? "Final Payment" : `Installment ${i + 1}`}</span>
                  <input type="number" className="flex-1 px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-[12px] outline-none focus:border-[#0E6BB8] text-right" defaultValue={perInst} />
                  <input type="date" className="px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-[11px] outline-none focus:border-[#0E6BB8] cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className={labelCls}>Initial Payment Method</div>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(m => {
            const Icon = m.icon;
            return (
              <button key={m.key} onClick={() => set({ method: m.key })}
                className={cn("flex items-center gap-2.5 p-3 rounded-[10px] border-2 transition-all cursor-pointer",
                  payment.method === m.key ? "border-[#0E6BB8] bg-[#0E6BB8]/5" : "border-[#E5E7EB] hover:border-[#0E6BB8]/30"
                )}>
                <Icon size={15} style={{ color: payment.method === m.key ? "#0E6BB8" : "#9CA3AF" }} />
                <span className={cn("text-[12px] font-medium", payment.method === m.key ? "text-[#0E6BB8]" : "text-[#374151]")}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Grid2>
        <Field label="Received Amount (৳)" required>
          <input type="number" className={inputCls} placeholder="Amount received today" value={payment.received || ""} onChange={e => set({ received: Number(e.target.value) })} />
        </Field>
        <Field label="Transaction / Receipt No.">
          <input className={inputCls} placeholder="Bank ref. / mobile transaction ID" value={payment.txnRef} onChange={e => set({ txnRef: e.target.value })} />
        </Field>
      </Grid2>
      <Field label="Payment Notes">
        <textarea className={cn(inputCls, "resize-none")} rows={2} placeholder="e.g. Deposited to Dhaka HQ main account — SB ref: 123456" value={payment.notes} onChange={e => set({ notes: e.target.value })} />
      </Field>
    </div>
  );
}

// ─── Step 7: Review & Confirm ──────────────────────────────────────────────────
function StepReview({ service, form, total }: { service: ServiceType | null; form: WizardForm; total: number }) {
  const cfg = service ? SERVICE_CFG[service] : null;
  const Icon = cfg?.icon;
  const primary = form.travelers[0];
  const received = Number(form.payment.received) || 0;

  const sections = [
    { title: "Service", items: [["Type", service || "—"], ["Package", String(form.detail.packageTier || form.detail.hotelName || form.detail.destinations || "—")], ["Departure", String(form.detail.departureDate || form.detail.checkIn || form.detail.departAt || "—")]] },
    { title: "Travelers", items: [["Count", String(form.travelers.filter(t => t.name.trim()).length)], ["Primary", primary?.name || "—"], ["Passport", primary?.passportNo || "—"]] },
    { title: "Pricing", items: [["Unit Price", fmtPrice(Number(form.pricing.unitPrice) || 0)], ["Quantity", `×${form.pricing.qty}`], ["Total", fmtPrice(total)]] },
    { title: "Payment", items: [["Plan", form.payment.mode === "installment" ? `${form.payment.installments} Installments` : "Full Payment"], ["Received", fmtPrice(received)], ["Remaining", fmtPrice(Math.max(0, total - received))]] },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-[15px] font-black text-[#111827] mb-1">Review & Confirm</h3>
        <p className="text-[12px] text-[#9CA3AF]">Please review all details before confirming the booking.</p>
      </div>

      {service && cfg && Icon && (
        <div className="flex items-center gap-4 p-4 rounded-[12px]" style={{ backgroundColor: cfg.light }}>
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: `${cfg.color}20` }}>
            <Icon size={22} style={{ color: cfg.color }} />
          </div>
          <div>
            <div className="text-[16px] font-black" style={{ color: cfg.color }}>{service} Booking</div>
            <div className="text-[12px] text-[#6B7280]">{form.travelers.filter(t => t.name.trim()).length} Traveler(s) · {fmtPrice(total)}</div>
          </div>
          <div className="ml-auto px-3 py-1 bg-[#FEF3C7] border border-[#E8471F]/30 rounded-full text-[11px] font-bold text-[#92400E]">Pending Confirmation</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {sections.map(s => (
          <div key={s.title} className="border border-[#E5E7EB] rounded-[10px] overflow-hidden">
            <div className="bg-[#F7F8FA] px-3 py-2 border-b border-[#E5E7EB] text-[10px] font-black text-[#9CA3AF] uppercase tracking-wide">{s.title}</div>
            <div className="p-3 flex flex-col gap-2">
              {s.items.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[11px] text-[#9CA3AF]">{k}</span>
                  <span className="text-[11px] font-semibold text-[#111827]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#FEF3C7] border border-[#E8471F]/40 rounded-[10px] p-4 flex items-start gap-3">
        <AlertCircle size={15} className="text-[#C43A15] flex-shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#92400E] leading-relaxed">
          <strong>Before confirming:</strong> verify that passport validity exceeds 6 months from departure, all document uploads are complete, and the initial payment has been received and recorded.
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-[#ECFDF5] border border-[#6EE7B7] rounded-[10px]">
        <CheckCircle2 size={14} className="text-[#0E7C66] flex-shrink-0" />
        <span className="text-[11px] text-[#065F46]">Booking number will be auto-generated (gapless, per branch/year) on confirmation.</span>
      </div>
    </div>
  );
}

// ─── Wizard Shell ──────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Service",    sub: "Choose type" },
  { label: "Details",   sub: "Service info" },
  { label: "Travelers", sub: "Passenger info" },
  { label: "Documents", sub: "Uploads" },
  { label: "Pricing",   sub: "Fees & discounts" },
  { label: "Payment",   sub: "Payment plan" },
  { label: "Review",    sub: "Confirm" },
];

const emptyForm = (): WizardForm => ({
  detail: {},
  travelers: [{ id: "1", name: "", dob: "", gender: "Male", nationality: "Bangladeshi", passportNo: "", passportExpiry: "", phone: "", email: "", mahram: "" }],
  pricing: { unitPrice: 0, qty: 1, discountType: "none", discountValue: 0, approvedBy: "", charges: [] },
  payment: { mode: "installment", installments: 3, method: "cash", received: 0, txnRef: "", notes: "" },
});

export function BookingWizard({ onBack, onComplete }: WizardProps) {
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ServiceType | null>(null);
  const [form, setForm] = useState<WizardForm>(emptyForm);
  const [draftId, setDraftId] = useState<string | null>(null);

  const create = useCreateBooking();
  const saveDraft = useSaveDraft();
  const confirm = useConfirmBooking();
  const busy = create.isPending || saveDraft.isPending || confirm.isPending;

  const canNext = step === 0 ? !!service : true;
  const cfg = service ? SERVICE_CFG[service] : null;
  const total = computeTotal(form.pricing);

  const selectService = (s: ServiceType) => {
    setService(s);
    setForm(f => ({ ...f, detail: initialDetail(s) }));
  };

  const next = async () => {
    if (!canNext || busy) return;
    try {
      if (step === 0 && service) {
        // create the DRAFT once the service is known (gives us an id to autosave against)
        if (!draftId) {
          const res = await create.mutateAsync({
            serviceType: SERVICE_ENUM[service], amount: 0, currency: "BDT",
            detail: {}, customer: buildWizardData(form).customer,
            wizardData: buildWizardData(form), currentStep: 1,
          });
          setDraftId(res.id);
        }
      } else if (draftId) {
        // per-step server-side autosave (resume on any device — never browser storage)
        await saveDraft.mutateAsync({ id: draftId, currentStep: step + 1, wizardData: buildWizardData(form) });
      }
      setStep(s => Math.min(STEPS.length - 1, s + 1));
    } catch (e) {
      toast.error((e as ApiError).message || "Could not save this step.");
    }
  };

  const prev = () => { if (step === 0) onBack(); else setStep(s => Math.max(0, s - 1)); };

  const doConfirm = async () => {
    if (!draftId || busy) return;
    try {
      await saveDraft.mutateAsync({ id: draftId, currentStep: STEPS.length - 1, wizardData: buildWizardData(form) });
      const res = await confirm.mutateAsync(draftId);
      toast.success(`Booking confirmed — ${res.bookingNo}`);
      onComplete(res.id);
    } catch (e) {
      toast.error((e as ApiError).message || "Could not confirm booking. Check required fields.");
    }
  };

  const setDetail = (k: string, v: string | number) => setForm(f => ({ ...f, detail: { ...f.detail, [k]: v } }));

  const stepContent = [
    <StepService selected={service} onSelect={selectService} />,
    service ? <div>
      {(service === "Hajj" || service === "Umrah") && <HajjUmrahDetails service={service} detail={form.detail} set={setDetail} />}
      {service === "Visa" && <VisaDetails detail={form.detail} set={setDetail} />}
      {service === "Air Ticket" && <AirTicketDetails detail={form.detail} set={setDetail} />}
      {service === "Hotel" && <HotelDetails detail={form.detail} set={setDetail} />}
      {service === "Manpower" && <ManpowerDetails detail={form.detail} set={setDetail} />}
      {service === "Tour" && <TourDetails detail={form.detail} set={setDetail} />}
    </div> : <div />,
    <StepTravelers service={service} travelers={form.travelers} setTravelers={(t) => setForm(f => ({ ...f, travelers: t }))} />,
    <StepDocuments service={service} />,
    <StepPricing pricing={form.pricing} setPricing={(p) => setForm(f => ({ ...f, pricing: p }))} />,
    <StepPayment payment={form.payment} setPayment={(p) => setForm(f => ({ ...f, payment: p }))} total={total} />,
    <StepReview service={service} form={form} total={total} />,
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left sidebar: steps */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col overflow-y-auto no-scrollbar">
        <div className="p-5 border-b border-[#F3F4F6]">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] hover:text-[#374151] mb-4 cursor-pointer transition-colors group">
            <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> Back to bookings
          </button>
          <h2 className="text-[14px] font-black text-[#111827]">New Booking</h2>
          {service && cfg && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-[5px] flex items-center justify-center" style={{ backgroundColor: cfg.light }}>
                {React.createElement(cfg.icon, { size: 11, style: { color: cfg.color } })}
              </div>
              <span className="text-[12px] font-semibold" style={{ color: cfg.color }}>{service}</span>
              {draftId && <span className="text-[9px] text-[#9CA3AF] bg-[#F3F4F6] px-1.5 py-0.5 rounded-full">Draft saved</span>}
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 px-3">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button key={s.label} onClick={() => i < step && setStep(i)}
                className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] mb-1 text-left transition-all cursor-pointer",
                  active ? "bg-[#0E6BB8]/5" : done ? "hover:bg-[#F7F8FA]" : "cursor-not-allowed opacity-50"
                )}>
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 transition-all",
                  done ? "bg-[#0E7C66] text-white" : active ? "bg-[#0E6BB8] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"
                )}>
                  {done ? <Check size={12} /> : i + 1}
                </div>
                <div>
                  <div className={cn("text-[12px] font-bold", active ? "text-[#0E6BB8]" : done ? "text-[#374151]" : "text-[#9CA3AF]")}>{s.label}</div>
                  <div className="text-[10px] text-[#9CA3AF]">{s.sub}</div>
                </div>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#F3F4F6]">
          <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div className="h-full bg-[#0E6BB8] rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <div className="text-[10px] text-[#9CA3AF] mt-1.5">Step {step + 1} of {STEPS.length}</div>
        </div>
      </aside>

      {/* Right: form content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-[720px] mx-auto px-8 py-8">
            {stepContent[step]}
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex-shrink-0 bg-white border-t border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
          <button onClick={prev} disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] text-[#374151] font-medium text-[13px] rounded-[8px] hover:border-[#0E6BB8]/30 transition-colors cursor-pointer disabled:opacity-50">
            <ChevronLeft size={15} /> {step === 0 ? "Cancel" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            {step === STEPS.length - 1 ? (
              <button onClick={doConfirm} disabled={busy}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0E7C66] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#065F46] transition-colors cursor-pointer shadow-lg shadow-[#0E7C66]/20 disabled:opacity-60">
                {confirm.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Confirm Booking
              </button>
            ) : (
              <button onClick={next} disabled={!canNext || busy}
                className={cn("flex items-center gap-2 px-6 py-2.5 font-bold text-[13px] rounded-[8px] transition-colors cursor-pointer",
                  canNext && !busy ? "bg-[#0E6BB8] text-white hover:bg-[#0B5794] shadow-lg shadow-[#0E6BB8]/20" : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                )}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : null} Continue <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
