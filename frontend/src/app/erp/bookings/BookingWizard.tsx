import React, { useState } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, Check, Plus, Trash2, Upload,
  User, Star, MapPin, Globe, Plane, Hotel, Briefcase, Map,
  AlertCircle, Eye, EyeOff, FileText, Camera, CreditCard, Banknote,
  Smartphone, Building2, CheckCircle2, Info,
} from "lucide-react";
import { cn, fmtPrice } from "../../lib/utils";
import { ServiceType, SERVICE_CFG } from "./BookingsModule";

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
function HajjUmrahDetails({ service }: { service: ServiceType }) {
  const packages = service === "Hajj"
    ? ["Economy (40D — Quad)", "Standard (40D — Triple)", "Premium (40D — Double)", "VIP Elite (40D — Single)"]
    : ["Economy (10D/7N)", "Standard (14D/12N)", "Premium (21D/19N)", "VIP (21D/19N — 5★)", "Custom Duration"];

  return (
    <div className="flex flex-col gap-5">
      <Grid2>
        <Field label="Package" required>
          <select className={selectCls}>
            <option value="">Select package</option>
            {packages.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Season / Period" required>
          <select className={selectCls}>
            {service === "Hajj"
              ? ["Hajj 1447 (May–Jun 2026)"].map(o => <option key={o}>{o}</option>)
              : ["Ramadan 2026", "Off-peak Jan–Feb", "School Break Mar–Apr", "Summer Jul–Aug", "Custom"].map(o => <option key={o}>{o}</option>)
            }
          </select>
        </Field>
      </Grid2>
      {service === "Hajj" && (
        <Field label="Group Assignment">
          <select className={selectCls}>
            <option value="">Unassigned</option>
            {["Group A — Dhaka North", "Group B — Dhaka South", "Group C — Chittagong", "Group D — Sylhet", "Group E — Special"].map(g => <option key={g}>{g}</option>)}
          </select>
        </Field>
      )}
      <Grid2>
        <Field label="Departure Date" required>
          <input type="date" className={inputCls} />
        </Field>
        <Field label="Return Date">
          <input type="date" className={inputCls} />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Room Type" required>
          <select className={selectCls}>
            {["Quad (4/room)", "Triple (3/room)", "Double (2/room)", "Single (1/room)"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Transport" required>
          <select className={selectCls}>
            {["Saudi Public Bus", "Private Van", "Intercity Train + Bus", "Full Private"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Hotel — Makkah" required>
          <select className={selectCls}>
            {["Makkah Towers Hotel", "Hilton Suites Makkah", "Al Marwa Rayhaan", "Grand Zamzam Hotel", "Economy Hotel (≤1km)"].map(h => <option key={h}>{h}</option>)}
          </select>
        </Field>
        <Field label="Hotel — Madinah" required>
          <select className={selectCls}>
            {["Al Salam Hotel Madinah", "Madinah Hilton", "Oberoi Madinah", "Al Anwar Hotel", "Economy Hotel (≤500m)"].map(h => <option key={h}>{h}</option>)}
          </select>
        </Field>
      </Grid2>
      <Field label="Days in Makkah / Madinah">
        <Grid2>
          <input type="number" className={inputCls} placeholder="Days in Makkah (e.g. 14)" />
          <input type="number" className={inputCls} placeholder="Days in Madinah (e.g. 8)" />
        </Grid2>
      </Field>
      <div className="bg-[#FFF9E6] border border-[#E8471F]/30 rounded-[10px] p-4">
        <div className="text-[11px] font-bold text-[#92400E] mb-3 uppercase tracking-wide">Mahram Information</div>
        <Grid2>
          <Field label="Mahram Required?">
            <select className={selectCls}>
              <option>Not required (male traveler)</option>
              <option>Yes — adding as traveler</option>
              <option>Yes — separate booking reference</option>
            </select>
          </Field>
          <Field label="Mahram Relationship">
            <select className={selectCls}>
              <option value="">N/A</option>
              {["Husband", "Father", "Brother", "Son", "Uncle"].map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </Grid2>
      </div>
      <Field label="Special Requests / Notes">
        <textarea className={cn(inputCls, "resize-none")} rows={3} placeholder="Wheelchair, dietary requirements, adjoining rooms, etc." />
      </Field>
    </div>
  );
}

function VisaDetails() {
  return (
    <div className="flex flex-col gap-5">
      <Grid2>
        <Field label="Destination Country" required>
          <select className={selectCls}>
            {["Saudi Arabia", "UAE", "Malaysia", "Qatar", "Kuwait", "Bahrain", "Oman", "UK", "Schengen (Multiple)", "USA", "Canada"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Visa Type" required>
          <select className={selectCls}>
            {["Tourist", "Business", "Work/Employment", "Student", "Transit", "Medical", "Family Visit"].map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Processing Speed" required>
          <select className={selectCls}>
            <option>Normal (15 working days)</option>
            <option>Express (7 working days)</option>
            <option>Super Express (3 working days)</option>
          </select>
        </Field>
        <Field label="No. of Passports" required>
          <input type="number" min="1" max="50" className={inputCls} defaultValue="1" />
        </Field>
      </Grid2>
      <Field label="Travel Purpose / Details">
        <textarea className={cn(inputCls, "resize-none")} rows={2} placeholder="Brief purpose of travel (required for some visa types)" />
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
        <textarea className={cn(inputCls, "resize-none")} rows={2} placeholder="Any additional notes for the visa team" />
      </Field>
    </div>
  );
}

function AirTicketDetails() {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px] px-4 py-3 flex items-start gap-2.5">
        <Info size={14} className="text-[#2563EB] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#1D4ED8] leading-relaxed">This is a <strong>manual booking module</strong> — no airline API connection. Enter PNR and fare details directly from your GDS terminal (Galileo/Sabre/Amadeus) or airline portal.</p>
      </div>
      <Grid2>
        <Field label="Airline" required>
          <select className={selectCls}>
            {["Saudi Arabian Airlines", "Biman Bangladesh Airlines", "Emirates", "Qatar Airways", "Air Arabia", "Flydubai", "IndiGo", "US-Bangla Airlines", "Regent Airways", "Other"].map(a => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="PNR / Booking Reference" required hint="Enter the 6-character GDS locator">
          <input className={inputCls} placeholder="e.g. XAB123" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }} />
        </Field>
      </Grid2>
      <Field label="Journey Type" required>
        <div className="flex gap-3">
          {["One-way", "Return", "Multi-city"].map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="journey" value={t} className="accent-[#0E6BB8]" defaultChecked={t === "Return"} />
              <span className="text-[12px] text-[#374151]">{t}</span>
            </label>
          ))}
        </div>
      </Field>
      <Grid3>
        <Field label="Origin" required>
          <input className={inputCls} placeholder="DAC — Dhaka" />
        </Field>
        <Field label="Destination" required>
          <input className={inputCls} placeholder="JED — Jeddah" />
        </Field>
        <Field label="Class" required>
          <select className={selectCls}>
            {["Economy", "Premium Economy", "Business", "First"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </Grid3>
      <Grid2>
        <Field label="Departure Date & Time" required>
          <input type="datetime-local" className={inputCls} />
        </Field>
        <Field label="Return Date & Time">
          <input type="datetime-local" className={inputCls} />
        </Field>
      </Grid2>
      <div className="border border-[#E5E7EB] rounded-[10px] overflow-hidden">
        <div className="bg-[#F7F8FA] px-4 py-2.5 border-b border-[#E5E7EB]">
          <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">Fare Breakdown</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <Field label="Base Fare (৳)" required>
            <input type="number" className={inputCls} placeholder="0" />
          </Field>
          <Field label="Tax / Surcharge (৳)">
            <input type="number" className={inputCls} placeholder="0" />
          </Field>
          <Field label="Agent Markup (৳)">
            <input type="number" className={inputCls} placeholder="0" />
          </Field>
          <Field label="Fare Type">
            <select className={selectCls}>
              {["Net Fare (SMT)", "Full Published Fare", "Special Corporate Fare", "Group Fare"].map(f => <option key={f}>{f}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <Field label="Baggage Allowance">
        <input className={inputCls} placeholder="e.g. 30kg checked + 7kg hand luggage" />
      </Field>
    </div>
  );
}

function HotelDetails() {
  return (
    <div className="flex flex-col gap-5">
      <Grid2>
        <Field label="City / Destination" required>
          <input className={inputCls} placeholder="e.g. Makkah, Dubai, Cox's Bazar" />
        </Field>
        <Field label="Hotel Name" required>
          <input className={inputCls} placeholder="Full hotel name" />
        </Field>
      </Grid2>
      <Grid3>
        <Field label="Star Rating">
          <select className={selectCls}>
            {["3 Star", "4 Star", "5 Star", "Unrated / Budget"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Check-in Date" required>
          <input type="date" className={inputCls} />
        </Field>
        <Field label="Check-out Date" required>
          <input type="date" className={inputCls} />
        </Field>
      </Grid3>
      <Grid3>
        <Field label="Room Type" required>
          <select className={selectCls}>
            {["Standard", "Deluxe", "Superior", "Junior Suite", "Suite", "Executive"].map(r => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="No. of Rooms" required>
          <input type="number" min="1" className={inputCls} defaultValue="1" />
        </Field>
        <Field label="No. of Guests" required>
          <input type="number" min="1" className={inputCls} defaultValue="2" />
        </Field>
      </Grid3>
      <Field label="Board Basis" required>
        <div className="grid grid-cols-2 gap-2">
          {["Room Only", "Bed & Breakfast", "Half Board (2 meals)", "Full Board (3 meals)", "All Inclusive"].map(b => (
            <label key={b} className="flex items-center gap-2 p-2.5 border border-[#E5E7EB] rounded-[8px] cursor-pointer hover:border-[#0E6BB8]/30 transition-colors">
              <input type="radio" name="board" value={b} className="accent-[#0E6BB8]" defaultChecked={b === "Bed & Breakfast"} />
              <span className="text-[12px] text-[#374151]">{b}</span>
            </label>
          ))}
        </div>
      </Field>
      <Grid2>
        <Field label="Confirmation No. (if pre-booked)">
          <input className={inputCls} placeholder="Hotel confirmation number" />
        </Field>
        <Field label="Distance from Haram (if applicable)">
          <input className={inputCls} placeholder="e.g. 200m, 1.5km" />
        </Field>
      </Grid2>
      <Field label="Special Requests">
        <textarea className={cn(inputCls, "resize-none")} rows={2} placeholder="Early check-in, high floor, smoking/non-smoking, etc." />
      </Field>
    </div>
  );
}

function ManpowerDetails() {
  return (
    <div className="flex flex-col gap-5">
      <Grid2>
        <Field label="Worker Category" required>
          <select className={selectCls}>
            {["Unskilled", "Semi-Skilled", "Skilled", "Technical / Professional"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Job / Subcategory" required>
          <select className={selectCls}>
            {["Construction Worker", "Electrician", "Plumber", "Mason / Bricklayer", "Painter", "Carpenter", "Driver", "Security Guard", "Housemaid", "Nurse", "Engineer", "Other"].map(j => <option key={j}>{j}</option>)}
          </select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Destination Country" required>
          <select className={selectCls}>
            {["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Malaysia", "Oman", "Bahrain", "Jordan", "Singapore"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Destination City">
          <input className={inputCls} placeholder="e.g. Riyadh, Dubai, Doha" />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Employer / Company Name" required>
          <input className={inputCls} placeholder="Employer or recruiting agency name" />
        </Field>
        <Field label="Contract Duration" required>
          <select className={selectCls}>
            {["6 months", "12 months", "24 months (2 years)", "36 months (3 years)", "Open-ended"].map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Monthly Salary" required>
          <input className={inputCls} placeholder="e.g. SAR 1,200" />
        </Field>
        <Field label="Accommodation">
          <select className={selectCls}>
            <option>Employer-provided</option>
            <option>Worker self-arranged</option>
            <option>Allowance provided</option>
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

function TourDetails() {
  return (
    <div className="flex flex-col gap-5">
      <Grid2>
        <Field label="Tour Package" required>
          <select className={selectCls}>
            {["Malaysia 7D/6N", "Thailand 10D/9N Premium", "Singapore + Malaysia 8D", "Dubai 5D/4N", "Maldives 4D/3N", "Cox's Bazar 3D/2N", "Sundarbans 2D/1N", "Sylhet 3D/2N", "Custom Package"].map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Tour Type">
          <select className={selectCls}>
            {["Group Tour", "Private / Customized", "Honeymoon Package", "Family Package", "Corporate Group"].map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Primary Destination(s)" required>
          <input className={inputCls} placeholder="e.g. Kuala Lumpur, Genting, Penang" />
        </Field>
        <Field label="Duration">
          <input className={inputCls} placeholder="e.g. 7D/6N" />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Departure Date" required>
          <input type="date" className={inputCls} />
        </Field>
        <Field label="Return Date">
          <input type="date" className={inputCls} />
        </Field>
      </Grid2>
      <Grid3>
        <Field label="No. of Travelers" required>
          <input type="number" min="1" className={inputCls} defaultValue="2" />
        </Field>
        <Field label="Hotel Category" required>
          <select className={selectCls}>
            {["3 Star", "4 Star", "5 Star", "Budget"].map(h => <option key={h}>{h}</option>)}
          </select>
        </Field>
        <Field label="Room Sharing">
          <select className={selectCls}>
            {["Twin sharing", "Double room", "Triple sharing", "Single rooms"].map(r => <option key={r}>{r}</option>)}
          </select>
        </Field>
      </Grid3>
      <Field label="Meal Plan" required>
        <div className="flex gap-3 flex-wrap">
          {["No Meals", "Breakfast Only", "Breakfast + 2 Dinners", "All Meals Included"].map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="meal" value={m} className="accent-[#0E6BB8]" defaultChecked={m === "Breakfast Only"} />
              <span className="text-[12px] text-[#374151]">{m}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Transport Inclusions">
        <div className="grid grid-cols-2 gap-2">
          {["Airport transfers (in/out)", "City sightseeing coach", "Cable car / boat", "Internal flights", "Train / Monorail pass"].map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-[#0E6BB8]" defaultChecked />
              <span className="text-[12px] text-[#374151]">{t}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Itinerary / Day Plan">
        <textarea className={cn(inputCls, "resize-none")} rows={4} placeholder="Day 1: Arrival, transfer to hotel...&#10;Day 2: City tour...&#10;Day 3: ..." />
      </Field>
    </div>
  );
}

// ─── Step 3: Travelers ─────────────────────────────────────────────────────────
function StepTravelers({ service }: { service: ServiceType | null }) {
  const [travelers, setTravelers] = useState<TravelerForm[]>([{
    id: "1", name: "", dob: "", gender: "Male", nationality: "Bangladeshi",
    passportNo: "", passportExpiry: "", phone: "", email: "", mahram: "",
  }]);

  const add = () => setTravelers(ts => [...ts, {
    id: String(ts.length + 1), name: "", dob: "", gender: "Male", nationality: "Bangladeshi",
    passportNo: "", passportExpiry: "", phone: "", email: "", mahram: "",
  }]);

  const remove = (id: string) => setTravelers(ts => ts.filter(t => t.id !== id));
  const update = (id: string, field: keyof TravelerForm, val: string) =>
    setTravelers(ts => ts.map(t => t.id === id ? { ...t, [field]: val } : t));

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
function StepPricing() {
  const [discType, setDiscType] = useState("none");
  const basePrice = 120000;
  const qty = 2;
  const discount = discType === "amount" ? 5000 : discType === "pct" ? basePrice * qty * 0.05 : 0;
  const extras = 3500;
  const total = basePrice * qty - discount + extras;

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-[15px] font-black text-[#111827] mb-1">Pricing & Discounts</h3>
      <div className="border border-[#E5E7EB] rounded-[12px] overflow-hidden">
        <div className="bg-[#F7F8FA] px-4 py-2.5 border-b border-[#E5E7EB]">
          <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">Base Pricing</span>
        </div>
        <div className="p-4 grid grid-cols-3 gap-4">
          <Field label="Unit Price (per person)" required>
            <input type="number" className={inputCls} defaultValue={basePrice} />
          </Field>
          <Field label="Quantity (travelers)" required>
            <input type="number" className={inputCls} defaultValue={qty} />
          </Field>
          <Field label="Subtotal">
            <div className="flex items-center h-[42px] px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[13px] font-bold text-[#111827]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtPrice(basePrice * qty)}
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
            <select className={selectCls} value={discType} onChange={e => setDiscType(e.target.value)}>
              <option value="none">No discount</option>
              <option value="amount">Fixed amount (৳)</option>
              <option value="pct">Percentage (%)</option>
              <option value="group">Group discount</option>
              <option value="promo">Promo code</option>
            </select>
          </Field>
          {discType !== "none" && (
            <Field label={discType === "pct" ? "Discount %" : "Discount Amount (৳)"}>
              <input type="number" className={inputCls} placeholder={discType === "pct" ? "5" : "5000"} />
            </Field>
          )}
          {discType !== "none" && <Field label="Approved By">
            <input className={inputCls} placeholder="Manager name / authorization" />
          </Field>}
        </div>
      </div>

      <div className="border border-[#E5E7EB] rounded-[12px] overflow-hidden">
        <div className="flex items-center justify-between bg-[#F7F8FA] px-4 py-2.5 border-b border-[#E5E7EB]">
          <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">Additional Charges</span>
          <button className="text-[11px] text-[#0E6BB8] font-semibold hover:underline cursor-pointer flex items-center gap-1"><Plus size={11} /> Add charge</button>
        </div>
        <div className="divide-y divide-[#F3F4F6]">
          {[
            { label: "Visa processing fee", amount: 2500 },
            { label: "SMT service charge", amount: 1000 },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <input className="flex-1 text-[12px] text-[#374151] bg-transparent outline-none" defaultValue={c.label} />
              <input type="number" className="w-28 px-2 py-1.5 border border-[#E5E7EB] rounded-[6px] text-[12px] outline-none text-right" defaultValue={c.amount} />
              <button className="text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Total summary */}
      <div className="bg-[#0E6BB8] rounded-[12px] p-5 text-white">
        <div className="flex flex-col gap-2 mb-4">
          {[
            ["Subtotal", fmtPrice(basePrice * qty)],
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
function StepPayment() {
  const [mode, setMode] = useState<"full" | "installment">("installment");
  const [installments, setInstallments] = useState(3);
  const total = 243500;
  const perInst = Math.ceil(total / installments);

  const PAYMENT_METHODS = [
    { key: "cash", icon: Banknote, label: "Cash" },
    { key: "bank", icon: Building2, label: "Bank Transfer" },
    { key: "bkash", icon: Smartphone, label: "bKash" },
    { key: "nagad", icon: Smartphone, label: "Nagad" },
    { key: "cheque", icon: FileText, label: "Cheque" },
    { key: "card", icon: CreditCard, label: "Card" },
  ];
  const [payMethod, setPayMethod] = useState("cash");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-[15px] font-black text-[#111827] mb-4">Payment Plan</h3>
        <div className="flex gap-3 mb-5">
          {[
            { key: "full", label: "Full Payment", sub: "Pay entire amount now" },
            { key: "installment", label: "Installment Plan", sub: "Split into multiple payments" },
          ].map(m => (
            <button key={m.key} onClick={() => setMode(m.key as "full" | "installment")}
              className={cn("flex-1 p-4 rounded-[12px] border-2 text-left transition-all cursor-pointer",
                mode === m.key ? "border-[#0E6BB8] bg-[#0E6BB8]/3" : "border-[#E5E7EB] hover:border-[#0E6BB8]/30"
              )}>
              <div className={cn("text-[13px] font-bold mb-0.5", mode === m.key ? "text-[#0E6BB8]" : "text-[#111827]")}>{m.label}</div>
              <div className="text-[11px] text-[#9CA3AF]">{m.sub}</div>
            </button>
          ))}
        </div>

        {mode === "installment" && (
          <div className="border border-[#E5E7EB] rounded-[12px] p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className={labelCls}>Number of Installments</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setInstallments(n => Math.max(2, n - 1))} className="w-7 h-7 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#374151] hover:border-[#0E6BB8]/30 cursor-pointer text-lg leading-none">−</button>
                <span className="w-8 text-center text-[14px] font-black text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{installments}</span>
                <button onClick={() => setInstallments(n => Math.min(12, n + 1))} className="w-7 h-7 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#374151] hover:border-[#0E6BB8]/30 cursor-pointer text-lg leading-none">+</button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: installments }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0E6BB8]/8 text-[#0E6BB8] text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-[12px] text-[#374151] w-32">{i === 0 ? "Booking Deposit" : i === installments - 1 ? "Final Payment" : `Installment ${i + 1}`}</span>
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
              <button key={m.key} onClick={() => setPayMethod(m.key)}
                className={cn("flex items-center gap-2.5 p-3 rounded-[10px] border-2 transition-all cursor-pointer",
                  payMethod === m.key ? "border-[#0E6BB8] bg-[#0E6BB8]/5" : "border-[#E5E7EB] hover:border-[#0E6BB8]/30"
                )}>
                <Icon size={15} style={{ color: payMethod === m.key ? "#0E6BB8" : "#9CA3AF" }} />
                <span className={cn("text-[12px] font-medium", payMethod === m.key ? "text-[#0E6BB8]" : "text-[#374151]")}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Grid2>
        <Field label="Received Amount (৳)" required>
          <input type="number" className={inputCls} placeholder="Amount received today" />
        </Field>
        <Field label="Transaction / Receipt No.">
          <input className={inputCls} placeholder="Bank ref. / mobile transaction ID" />
        </Field>
      </Grid2>
      <Field label="Payment Notes">
        <textarea className={cn(inputCls, "resize-none")} rows={2} placeholder="e.g. Deposited to Dhaka HQ main account — SB ref: 123456" />
      </Field>
    </div>
  );
}

// ─── Step 7: Review & Confirm ──────────────────────────────────────────────────
function StepReview({ service }: { service: ServiceType | null }) {
  const cfg = service ? SERVICE_CFG[service] : null;
  const Icon = cfg?.icon;

  const sections = [
    { title: "Service", items: [["Type", service || "—"], ["Package", "Economy Plus (14D)"], ["Departure", "15 Dec 2025"]] },
    { title: "Travelers", items: [["Count", "2"], ["Primary", "Md. Harunur Rashid"], ["Passport", "AB1234567"]] },
    { title: "Pricing", items: [["Unit Price", "৳ 1,20,000"], ["Quantity", "×2"], ["Total", "৳ 2,43,500"]] },
    { title: "Payment", items: [["Plan", "3 Installments"], ["Received", "৳ 30,000"], ["Remaining", "৳ 2,13,500"]] },
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
            <div className="text-[12px] text-[#6B7280]">Economy Plus (14D) · 2 Travelers · ৳ 2,43,500</div>
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

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#0E6BB8]" />
        <span className="text-[12px] text-[#374151]">I confirm that all provided information is accurate and the booking is ready for processing. I agree to the <a href="#" className="text-[#0E6BB8] font-semibold hover:underline">SMTravel booking terms</a>.</span>
      </label>

      <div className="flex items-center gap-3 p-3 bg-[#ECFDF5] border border-[#6EE7B7] rounded-[10px]">
        <CheckCircle2 size={14} className="text-[#0E7C66] flex-shrink-0" />
        <span className="text-[11px] text-[#065F46]">Booking ID will be auto-generated on confirmation. Confirmation email + SMS will be sent automatically.</span>
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

export function BookingWizard({ onBack, onComplete }: WizardProps) {
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ServiceType | null>(null);

  const canNext = step === 0 ? !!service : true;
  const cfg = service ? SERVICE_CFG[service] : null;

  const next = () => { if (canNext) setStep(s => Math.min(STEPS.length - 1, s + 1)); };
  const prev = () => { if (step === 0) onBack(); else setStep(s => Math.max(0, s - 1)); };
  const confirm = () => onComplete("BK-2848");

  const stepContent = [
    <StepService selected={service} onSelect={setService} />,
    service && <div>
      {(service === "Hajj" || service === "Umrah") && <HajjUmrahDetails service={service} />}
      {service === "Visa" && <VisaDetails />}
      {service === "Air Ticket" && <AirTicketDetails />}
      {service === "Hotel" && <HotelDetails />}
      {service === "Manpower" && <ManpowerDetails />}
      {service === "Tour" && <TourDetails />}
    </div>,
    <StepTravelers service={service} />,
    <StepDocuments service={service} />,
    <StepPricing />,
    <StepPayment />,
    <StepReview service={service} />,
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
          <button onClick={prev}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] text-[#374151] font-medium text-[13px] rounded-[8px] hover:border-[#0E6BB8]/30 transition-colors cursor-pointer">
            <ChevronLeft size={15} /> {step === 0 ? "Cancel" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            {step === STEPS.length - 1 ? (
              <button onClick={confirm}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0E7C66] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#065F46] transition-colors cursor-pointer shadow-lg shadow-[#0E7C66]/20">
                <CheckCircle2 size={15} /> Confirm Booking
              </button>
            ) : (
              <button onClick={next} disabled={!canNext}
                className={cn("flex items-center gap-2 px-6 py-2.5 font-bold text-[13px] rounded-[8px] transition-colors cursor-pointer",
                  canNext ? "bg-[#0E6BB8] text-white hover:bg-[#0B5794] shadow-lg shadow-[#0E6BB8]/20" : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                )}>
                Continue <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
