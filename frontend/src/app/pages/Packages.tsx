import React, { useState } from "react";
import { Link, useParams } from "react-router";
import {
  Star, Clock, MapPin, ChevronRight, Filter, Search, ArrowRight,
  CheckCircle, XCircle, Users, Hotel, Plane, Calendar, Phone, X,
} from "lucide-react";
import { PACKAGES } from "../lib/data";
import { img, fmtPrice, cn } from "../lib/utils";

// ─── PACKAGES LISTING ─────────────────────────────────────────────────────────
const TYPES = ["All", "Hajj", "Umrah", "Tour", "Combined"];
const DURATIONS = ["All", "1–7 Days", "8–15 Days", "16–30 Days", "30+ Days"];
const PRICE_RANGES = ["All", "Under ৳1L", "৳1L–3L", "৳3L–5L", "Above ৳5L"];

export function PackagesPage() {
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = PACKAGES.filter(p => {
    if (type !== "All" && p.type !== type) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0E6BB8] py-10 md:py-14 text-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-[#C43A15] text-[12px] font-bold uppercase tracking-widest mb-2">All Packages</div>
          <h1 className="text-2xl md:text-3xl font-black mb-2">Travel Packages</h1>
          <p className="text-white/60 text-sm">Curated Hajj, Umrah & tour packages for every budget</p>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          {/* Search + Filter toggle */}
          <div className="flex gap-3 mb-4 md:mb-8">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search packages..."
                className="w-full pl-9 pr-4 py-3 md:py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] bg-white outline-none focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10 min-h-[48px]" />
            </div>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={cn(
                "md:hidden flex items-center gap-2 px-4 min-h-[48px] rounded-[10px] border text-[13px] font-bold transition-all cursor-pointer flex-shrink-0",
                filtersOpen ? "bg-[#0E6BB8] text-white border-[#0E6BB8]" : "bg-white text-[#374151] border-[#E5E7EB]"
              )}>
              <Filter size={15} /> Filters
              {type !== "All" && <span className="w-4 h-4 bg-[#E8471F] text-[#0E6BB8] rounded-full text-[9px] font-black flex items-center justify-center">1</span>}
            </button>
          </div>

          {/* Type pills — desktop always visible, mobile collapsible */}
          <div className={cn("mb-6 md:mb-8", !filtersOpen && "hidden md:block")}>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map(t => (
                <button key={t} onClick={() => { setType(t); setFiltersOpen(false); }}
                  className={cn("px-4 py-2.5 rounded-full text-[12px] font-bold transition-all cursor-pointer min-h-[44px]",
                    type === t ? "bg-[#0E6BB8] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#0E6BB8]/30"
                  )}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">
              <p className="text-[15px] font-semibold">No packages found</p>
              <button onClick={() => { setType("All"); setSearch(""); }} className="mt-3 text-[13px] text-[#0E6BB8] font-bold hover:underline cursor-pointer">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filtered.map(pkg => (
                <Link key={pkg.id} to={`/packages/${pkg.id}`}
                  className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group">
                  <div className="relative h-52 overflow-hidden">
                    <img src={img(pkg.image, 600, 420)} alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {pkg.badge && (
                      <div className="absolute top-3 left-3 bg-[#E8471F] text-[#0E6BB8] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                        {pkg.badge}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                      <Star size={11} fill="#F59E0B" className="text-[#F59E0B]" />
                      <span className="text-[11px] font-bold">{pkg.rating}</span>
                      <span className="text-[10px] text-[#9CA3AF]">({pkg.reviews})</span>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-[#0E6BB8]/80 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-white font-bold">
                      {pkg.type}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[14px] font-bold text-[#111827] group-hover:text-[#0E6BB8] transition-colors mb-2 leading-snug">{pkg.title}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6B7280] mb-3">
                      <span className="flex items-center gap-1"><Clock size={10} />{pkg.duration}</span>
                      <span className="flex items-center gap-1"><Hotel size={10} />{pkg.hotel}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} />From {pkg.departure}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {pkg.highlights.slice(0, 3).map(h => (
                        <span key={h} className="text-[10px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-full px-2 py-0.5 text-[#6B7280]">{h}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
                      <div>
                        <div className="text-[10px] text-[#9CA3AF]">Starting from</div>
                        <div className="text-[19px] font-black text-[#0E6BB8]">{fmtPrice(pkg.price)}</div>
                      </div>
                      <div className="text-[11px] text-[#DC2626] font-semibold">
                        {pkg.seats} seats left
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ─── PACKAGE DETAIL ───────────────────────────────────────────────────────────
export function PackageDetailPage() {
  const { id } = useParams();
  const pkg = PACKAGES.find(p => String(p.id) === id);
  const [tab, setTab] = useState<"overview" | "itinerary" | "inclusions">("overview");
  const [form, setForm] = useState({ name: "", phone: "", pax: "2", date: "" });

  if (!pkg) {
    return (
      <div className="py-32 text-center">
        <p className="text-[#6B7280]">Package not found.</p>
        <Link to="/packages" className="mt-4 inline-block text-[#0E6BB8] font-bold hover:underline">← Back to Packages</Link>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px] overflow-hidden">
        <img src={img(pkg.image, 1920, 700)} alt={pkg.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E6BB8]/90 via-[#0E6BB8]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-2 text-white/60 text-[12px] mb-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link to="/packages" className="hover:text-white transition-colors">Packages</Link>
            <ChevronRight size={12} />
            <span className="text-white/80">{pkg.title}</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{pkg.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><Clock size={13} />{pkg.duration}</span>
            <span className="flex items-center gap-1.5"><Hotel size={13} />{pkg.hotel}</span>
            <span className="flex items-center gap-1.5"><Star size={13} fill="#F59E0B" className="text-[#F59E0B]" />{pkg.rating} ({pkg.reviews} reviews)</span>
            <span className="flex items-center gap-1.5"><Users size={13} />{pkg.seats} seats remaining</span>
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="flex gap-1 bg-white rounded-[12px] p-1 border border-[#E5E7EB] mb-6 w-fit">
                {(["overview", "itinerary", "inclusions"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn("px-5 py-2 rounded-[8px] text-[12px] font-bold capitalize transition-all cursor-pointer",
                      tab === t ? "bg-[#0E6BB8] text-white shadow" : "text-[#9CA3AF] hover:text-[#374151]"
                    )}>
                    {t}
                  </button>
                ))}
              </div>

              {tab === "overview" && (
                <div className="flex flex-col gap-5">
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                    <h3 className="text-[16px] font-black text-[#111827] mb-3">Package Highlights</h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {pkg.highlights.map(h => (
                        <div key={h} className="flex items-center gap-2 text-[13px] text-[#374151]">
                          <CheckCircle size={13} className="text-[#0E7C66] flex-shrink-0" />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                    <h3 className="text-[16px] font-black text-[#111827] mb-3">Package Details</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "Duration", val: pkg.duration, icon: Clock },
                        { label: "Hotel", val: pkg.hotel, icon: Hotel },
                        { label: "Flight", val: pkg.flight, icon: Plane },
                        { label: "Departure", val: `From ${pkg.departure}`, icon: MapPin },
                      ].map(d => (
                        <div key={d.label} className="flex flex-col gap-1 bg-[#F7F8FA] rounded-[10px] p-3">
                          <d.icon size={15} className="text-[#0E6BB8]" />
                          <div className="text-[10px] text-[#9CA3AF] uppercase font-bold">{d.label}</div>
                          <div className="text-[12px] font-semibold text-[#374151]">{d.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === "itinerary" && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <h3 className="text-[16px] font-black text-[#111827] mb-5">Day-by-Day Itinerary</h3>
                  <div className="flex flex-col gap-4 relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E5E7EB]" />
                    {pkg.itinerary.map((day, i) => (
                      <div key={i} className="flex gap-5 relative">
                        <div className="w-8 h-8 rounded-full bg-[#0E6BB8] text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 z-10 border-4 border-white shadow">
                          {i + 1}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="text-[13px] font-bold text-[#111827] mb-1">{day.title}</div>
                          <p className="text-[12px] text-[#6B7280] leading-relaxed">{day.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "inclusions" && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                    <h3 className="flex items-center gap-2 text-[15px] font-black text-[#111827] mb-4">
                      <CheckCircle size={17} className="text-[#0E7C66]" /> Included
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {pkg.includes.map(i => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#374151]">
                          <CheckCircle size={12} className="text-[#0E7C66] flex-shrink-0 mt-0.5" />{i}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                    <h3 className="flex items-center gap-2 text-[15px] font-black text-[#111827] mb-4">
                      <XCircle size={17} className="text-[#DC2626]" /> Excluded
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {pkg.excludes.map(e => (
                        <li key={e} className="flex items-start gap-2 text-[12px] text-[#374151]">
                          <XCircle size={12} className="text-[#DC2626] flex-shrink-0 mt-0.5" />{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Booking Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sticky top-24 shadow-lg">
                <div className="flex items-baseline gap-1 mb-1">
                  <div className="text-[28px] font-black text-[#0E6BB8]">{fmtPrice(pkg.price)}</div>
                  <div className="text-[12px] text-[#9CA3AF]">/ person</div>
                </div>
                {pkg.originalPrice && (
                  <div className="text-[12px] text-[#9CA3AF] line-through mb-3">{fmtPrice(pkg.originalPrice)}</div>
                )}

                <div className="inline-flex items-center gap-1 bg-[#FEF9C3] text-[#B45309] text-[10px] font-bold px-2.5 py-1 rounded-full mb-4">
                  🔥 Only {pkg.seats} seats left!
                </div>

                <form className="flex flex-col gap-3" onSubmit={e => e.preventDefault()}>
                  <div>
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1">Full Name</label>
                    <input placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[12px] outline-none focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1">Phone Number</label>
                    <input placeholder="+880 1X XXX XXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[12px] outline-none focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1">Departure Date</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[12px] outline-none focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1">No. of Travelers</label>
                    <select value={form.pax} onChange={e => setForm(f => ({ ...f, pax: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[12px] outline-none focus:border-[#0E6BB8] bg-white cursor-pointer">
                      {["1","2","3","4","5","6+"].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-3 bg-[#0E6BB8] hover:bg-[#0B5794] text-white font-black rounded-[10px] text-[13px] transition-colors cursor-pointer mt-1">
                    Book This Package
                  </button>
                  <a href="https://wa.me/8801712345678" target="_blank" rel="noopener noreferrer"
                    className="w-full py-3 bg-[#25D366] hover:bg-[#1da855] text-white font-bold rounded-[10px] text-[13px] transition-colors flex items-center justify-center gap-2">
                    <Phone size={14} /> WhatsApp Enquiry
                  </a>
                </form>

                <div className="mt-4 pt-4 border-t border-[#F3F4F6] flex items-center gap-2 text-[11px] text-[#9CA3AF]">
                  <CheckCircle size={13} className="text-[#0E7C66]" />
                  No booking fees · Free cancellation within 48hrs
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
