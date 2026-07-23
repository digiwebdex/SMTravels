import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  Star, MapPin, Shield, Plane, Briefcase, Hotel, Globe,
  ChevronRight, ArrowRight, CheckCircle, Users, Award, Calendar,
  Phone, Quote, Clock, TrendingUp, Heart, Headphones,
} from "lucide-react";
import { cn, img, fmtPrice } from "../lib/utils";
import { PACKAGES, TESTIMONIALS, SERVICES, BLOGS } from "../lib/data";

// ─── Hero Booking Widget ──────────────────────────────────────────────────────
const SERVICE_TYPES = ["Hajj", "Umrah", "Visa", "Air Ticket", "Tour Package", "Hotel"];

function BookingWidget() {
  const [service, setService] = useState(SERVICE_TYPES[0]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [pax, setPax] = useState("1 Traveler");

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-3xl mx-auto">
      {/* Service Tabs — horizontally scrollable on mobile */}
      <div className="flex gap-1 mb-4 md:mb-5 bg-[#F3F4F6] rounded-[10px] p-1 overflow-x-auto no-scrollbar -mx-1 px-1">
        {SERVICE_TYPES.map(t => (
          <button key={t} onClick={() => setService(t)}
            className={cn("flex-shrink-0 px-3 md:px-4 py-2 rounded-[8px] text-[11px] md:text-[12px] font-semibold transition-all cursor-pointer min-h-[36px]",
              service === t ? "bg-[#1B75BC] text-white shadow" : "text-[#6B7280] hover:text-[#374151]"
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* Fields — 1 col on mobile, 2 on sm, 4 on md */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">From</label>
          <input value={from} onChange={e => setFrom(e.target.value)}
            placeholder="Dhaka (DAC)"
            className="px-3 py-3 md:py-2.5 border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#111827] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 transition-all min-h-[48px]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">To / Service</label>
          <input value={to} onChange={e => setTo(e.target.value)}
            placeholder="Jeddah / Makkah"
            className="px-3 py-3 md:py-2.5 border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#111827] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 transition-all min-h-[48px]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Departure</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-3 md:py-2.5 border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#111827] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 transition-all min-h-[48px]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Travelers</label>
          <select value={pax} onChange={e => setPax(e.target.value)}
            className="px-3 py-3 md:py-2.5 border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#111827] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 transition-all bg-white cursor-pointer min-h-[48px]">
            {["1 Traveler","2 Travelers","3 Travelers","4+ Travelers"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Link to="/book" className="flex-1 py-3.5 md:py-3 bg-[#1B75BC] hover:bg-[#14588F] text-white font-bold rounded-[10px] text-[14px] transition-colors text-center min-h-[48px] flex items-center justify-center">
          Search & Book Now
        </Link>
        <Link to="/contact" className="px-4 md:px-5 py-3.5 md:py-3 border-2 border-[#F15A24] text-[#D64A12] font-bold rounded-[10px] text-[13px] hover:bg-[#F15A24]/5 transition-colors flex items-center min-h-[48px]">
          Get Quote
        </Link>
      </div>
    </div>
  );
}

// ─── Counter ──────────────────────────────────────────────────────────────────
function Counter({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = () => {
          start += Math.ceil(end / 60);
          if (start >= end) { setVal(end); return; }
          setVal(start);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black text-white mb-1">
        {val.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-white/60 font-medium">{label}</div>
    </div>
  );
}

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
export function Home() {
  const services = [
    { id: "hajj", icon: Star, label: "Hajj Management", color: "#F15A24", bg: "#FFF9E6", desc: "Govt-approved packages, 25+ years experience" },
    { id: "umrah", icon: MapPin, label: "Umrah Packages", color: "#1B75BC", bg: "#EEF2FF", desc: "Year-round, fully inclusive packages" },
    { id: "visa", icon: Shield, label: "Visa Services", color: "#0E7C66", bg: "#ECFDF5", desc: "50+ countries, fast processing" },
    { id: "air-ticket", icon: Plane, label: "Air Tickets", color: "#2563EB", bg: "#EFF6FF", desc: "Best fares, all major airlines" },
    { id: "manpower", icon: Briefcase, label: "Manpower", color: "#7C3AED", bg: "#F5F3FF", desc: "International recruitment & BMET clearance" },
    { id: "tour-packages", icon: Globe, label: "Tour Packages", color: "#EA580C", bg: "#FFF7ED", desc: "Curated world tours, group & private" },
    { id: "hotel-booking", icon: Hotel, label: "Hotel Booking", color: "#0891B2", bg: "#F0F9FF", desc: "Premium hotels, Makkah to worldwide" },
  ];

  const partners = [
    "Biman Bangladesh", "Saudi Airlines", "Qatar Airways", "Emirates", "Turkish Airlines",
    "Etihad Airways", "Air Arabia", "FlyDubai",
  ];

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] md:min-h-[92vh] flex items-center justify-center overflow-hidden">
        <img src={img("photo-1770786106021-52580470e31e", 1920, 1080)}
          alt="Kaaba Makkah" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B75BC]/85 via-[#1B75BC]/70 to-[#1B75BC]/90" />

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col items-center text-center gap-6 md:gap-8 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 bg-[#F15A24]/20 border border-[#F15A24]/30 rounded-full px-4 py-1.5 text-[#D64A12] text-[12px] font-semibold">
            <Star size={13} fill="currentColor" />
            Bangladesh's Most Trusted Hajj & Travel Partner
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-3 md:mb-4">
              Your Journey to the<br />
              <span className="text-[#D64A12]">Holy Land</span> Starts Here
            </h1>
            <p className="text-base md:text-lg text-white/70 max-w-xl mx-auto">
              Government-approved Hajj & Umrah packages, visa services, air tickets, and world tours — all under one trusted roof since 1998.
            </p>
          </div>

          {/* Trust Badges — 2×2 on mobile, row on larger */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 md:gap-3 w-full max-w-lg sm:max-w-none mx-auto">
            {[
              { icon: Award, text: "ATAB Member" },
              { icon: CheckCircle, text: "Govt. Approved" },
              { icon: Users, text: "10,000+ Pilgrims" },
              { icon: Calendar, text: "25+ Years" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 md:px-4 py-2 text-white text-[11px] md:text-[12px] font-medium">
                <Icon size={12} className="text-[#D64A12]" />
                {text}
              </div>
            ))}
          </div>

          <BookingWidget />

          <p className="text-white/40 text-[11px]">
            No hidden fees · 24/7 WhatsApp support · Easy cancellation · Trusted by 10,000+ families
          </p>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="bg-[#1B75BC] py-4">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap items-center justify-center gap-6">
          {[
            "📋 ATAB License: 0123",
            "✈️ Civil Aviation Auth. Approved",
            "🕌 Ministry of Religious Affairs Enrolled",
            "🏆 25+ Years of Excellence",
            "👥 10,000+ Happy Pilgrims",
          ].map(t => (
            <span key={t} className="text-white/70 text-[12px] font-medium">{t}</span>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-12 md:py-20 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-2">What We Offer</div>
            <h2 className="text-3xl font-black text-[#111827] mb-3">Comprehensive Travel Services</h2>
            <p className="text-[#6B7280] max-w-xl mx-auto text-sm">From sacred Hajj journeys to international tours, we handle every detail with expertise and care.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4">
            {services.map(s => (
              <Link key={s.id} to={`/${s.id}`}
                className="bg-white rounded-2xl p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-[#E5E7EB] group cursor-pointer">
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: s.bg }}>
                  <s.icon size={22} style={{ color: s.color }} />
                </div>
                <div className="text-[13px] font-bold text-[#111827] group-hover:text-[#1B75BC] transition-colors mb-1">{s.label}</div>
                <div className="text-[10px] text-[#9CA3AF] leading-snug">{s.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PACKAGES ── */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-2">Popular Packages</div>
              <h2 className="text-3xl font-black text-[#111827]">Featured Travel Packages</h2>
            </div>
            <Link to="/packages" className="hidden md:flex items-center gap-1.5 text-[#1B75BC] text-[13px] font-semibold hover:gap-3 transition-all">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {PACKAGES.slice(0, 4).map(pkg => (
              <Link key={pkg.id} to={`/packages/${pkg.id}`}
                className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group">
                <div className="relative h-48 overflow-hidden">
                  <img src={img(pkg.image, 600, 400)} alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {pkg.badge && (
                    <div className="absolute top-3 left-3 bg-[#F15A24] text-[#1B75BC] text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wide">
                      {pkg.badge}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                    <Star size={11} fill="#F59E0B" className="text-[#F59E0B]" />
                    <span className="text-[11px] font-bold text-[#374151]">{pkg.rating}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">{pkg.type}</div>
                  <h3 className="text-[14px] font-bold text-[#111827] mb-2 group-hover:text-[#1B75BC] transition-colors leading-snug">{pkg.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mb-3">
                    <Clock size={11} /> {pkg.duration}
                    <span className="mx-1 text-[#E5E7EB]">·</span>
                    <MapPin size={11} /> Departing {pkg.departure}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
                    <div>
                      <div className="text-[10px] text-[#9CA3AF]">Starting from</div>
                      <div className="text-[18px] font-black text-[#1B75BC]">{fmtPrice(pkg.price)}</div>
                    </div>
                    <div className="text-[11px] text-[#9CA3AF]">{pkg.seats} seats left</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link to="/packages" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#1B75BC] text-[#1B75BC] font-bold rounded-[10px] text-sm hover:bg-[#1B75BC]/5 transition-colors">
              View All Packages <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-12 md:py-20 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-3">Why Choose Us</div>
              <h2 className="text-3xl font-black text-[#111827] mb-5">
                25 Years of Trust,<br />10,000+ Happy Families
              </h2>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-8">
                SMTravel International is Bangladesh's premier travel management company, specializing in Hajj, Umrah, and international travel. Government-approved, ATAB-licensed, and ISO-certified, we have helped tens of thousands of pilgrims fulfill their dreams since 1998.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {[
                  { icon: CheckCircle, title: "Govt. Approved", desc: "Ministry of Religious Affairs & Civil Aviation licensed", color: "#0E7C66" },
                  { icon: Headphones, title: "24/7 Support", desc: "Round-the-clock assistance in Bangla & English", color: "#1B75BC" },
                  { icon: Heart, title: "Trusted Service", desc: "25+ years, 10,000+ families served with care", color: "#DC2626" },
                  { icon: TrendingUp, title: "Best Value", desc: "Competitive prices with no hidden charges", color: "#F15A24" },
                ].map(i => (
                  <div key={i.title} className="bg-white rounded-[12px] p-4 border border-[#E5E7EB]">
                    <div className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3" style={{ backgroundColor: `${i.color}15` }}>
                      <i.icon size={17} style={{ color: i.color }} />
                    </div>
                    <div className="text-[13px] font-bold text-[#111827] mb-1">{i.title}</div>
                    <div className="text-[11px] text-[#6B7280] leading-snug">{i.desc}</div>
                  </div>
                ))}
              </div>

              <Link to="/about" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#1B75BC] text-white font-bold rounded-[10px] text-sm hover:bg-[#14588F] transition-colors">
                Learn Our Story <ArrowRight size={14} />
              </Link>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={img("photo-1720549973451-018d3623b55a", 700, 500)} alt="Hajj pilgrims at Kaaba" className="w-full object-cover h-[440px]" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-[#E5E7EB]">
                <div className="text-3xl font-black text-[#1B75BC] mb-1">25+</div>
                <div className="text-[12px] text-[#6B7280]">Years of Excellence</div>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#F15A24] text-[#1B75BC] rounded-2xl px-4 py-3 shadow-xl">
                <div className="text-2xl font-black mb-0.5">10K+</div>
                <div className="text-[11px] font-bold">Pilgrims Served</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-12 md:py-20 bg-[#1B75BC]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            <Counter end={10000} suffix="+" label="Happy Pilgrims" />
            <Counter end={25} suffix="+" label="Years of Service" />
            <Counter end={50} suffix="+" label="Countries Served" />
            <Counter end={4} suffix="" label="Branch Offices" />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-2">Testimonials</div>
            <h2 className="text-3xl font-black text-[#111827]">What Our Pilgrims Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {TESTIMONIALS.slice(0, 3).map((t, idx) => (
              <div key={idx} className="bg-[#F7F8FA] rounded-2xl p-6 border border-[#E5E7EB] relative">
                <Quote size={28} className="text-[#D64A12]/30 mb-3" />
                <p className="text-[13px] text-[#374151] leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1B75BC]/10 flex items-center justify-center font-bold text-[#1B75BC] text-sm flex-shrink-0">
                    {t.initial ?? t.name[0]}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-[#111827]">{t.name}</div>
                    <div className="text-[11px] text-[#9CA3AF]">{t.city} · {t.package}</div>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} className={i < t.stars ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#E5E7EB]"} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG PREVIEW ── */}
      <section className="py-12 md:py-20 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-2">Latest Articles</div>
              <h2 className="text-3xl font-black text-[#111827]">Travel Insights & Guides</h2>
            </div>
            <Link to="/blog" className="hidden md:flex items-center gap-1.5 text-[#1B75BC] text-[13px] font-semibold hover:gap-3 transition-all">
              All Articles <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {BLOGS.slice(0, 3).map(b => (
              <Link key={b.id} to={`/blog/${b.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <div className="relative h-48 overflow-hidden">
                  <img src={img(b.image, 600, 300)} alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-[#1B75BC] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {b.category}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] text-[#9CA3AF] mb-1.5">{b.date} · {b.readTime} read</div>
                  <h3 className="text-[14px] font-bold text-[#111827] group-hover:text-[#1B75BC] transition-colors leading-snug mb-2">{b.title}</h3>
                  <p className="text-[12px] text-[#6B7280] leading-relaxed line-clamp-2">{b.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── AIRLINE PARTNERS ── */}
      <section className="py-12 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-6">
            <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">Our Airline Partners</div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {partners.map(p => (
              <div key={p} className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px] px-6 py-3 text-[12px] font-semibold text-[#6B7280] hover:border-[#1B75BC]/30 hover:text-[#1B75BC] transition-all">
                ✈ {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="py-10 md:py-16 bg-[#1B75BC]">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-3">Stay Updated</div>
          <h2 className="text-2xl font-black text-white mb-2">Get Exclusive Offers & Hajj News</h2>
          <p className="text-white/60 text-sm mb-7">Subscribe for package updates, Hajj lottery results, and travel tips directly to your inbox.</p>
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Enter your email address"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-[10px] text-white text-[13px] placeholder-white/40 outline-none focus:border-[#F15A24] focus:ring-1 focus:ring-[#F15A24] transition-all" />
            <button type="submit"
              className="px-6 py-3 bg-[#F15A24] hover:bg-[#CC3C17] text-[#1B75BC] font-bold rounded-[10px] text-[13px] transition-colors cursor-pointer flex-shrink-0">
              Subscribe Now
            </button>
          </form>
          <p className="text-white/30 text-[10px] mt-3">No spam, unsubscribe anytime.</p>
        </div>
      </section>

      {/* ── QUICK CONTACT ── */}
      <section className="py-12 bg-[#F7F8FA] border-t border-[#E5E7EB]">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-10 h-10 bg-[#1B75BC]/10 rounded-full flex items-center justify-center">
              <Phone size={17} className="text-[#1B75BC]" />
            </div>
            <div>
              <div className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">Hotline</div>
              <a href="tel:+88029553421" className="font-bold text-[#1B75BC] hover:underline">+880 2 9553421</a>
            </div>
          </div>
          <div className="text-[#E5E7EB] text-2xl hidden md:block">|</div>
          <div className="text-sm text-[#6B7280]">
            <span className="font-semibold text-[#374151]">Office Hours:</span> Sunday – Thursday, 9:00 AM – 6:00 PM
          </div>
          <div className="text-[#E5E7EB] text-2xl hidden md:block">|</div>
          <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#1B75BC] text-[#1B75BC] font-bold rounded-[10px] text-[13px] hover:bg-[#1B75BC]/5 transition-colors">
            <MapPin size={14} /> Branch Offices
          </Link>
        </div>
      </section>
    </>
  );
}
