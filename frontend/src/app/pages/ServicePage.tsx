import React, { useState } from "react";
import { Link } from "react-router";
import {
  CheckCircle, XCircle, ChevronDown, ChevronUp, ArrowRight,
  Star, MapPin, Clock, Phone, Shield, Plane, Hotel, Briefcase, Globe, Heart,
} from "lucide-react";
import { SERVICES } from "../lib/data";
import { img, fmtPrice, cn } from "../lib/utils";

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  star: Star, "map-pin": MapPin, shield: Shield, plane: Plane, hotel: Hotel,
  briefcase: Briefcase, globe: Globe, heart: Heart, users: Star, "clock": Clock,
};

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#E5E7EB] rounded-[12px] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-[#F7F8FA] transition-colors cursor-pointer"
      >
        <span className="text-[14px] font-semibold text-[#111827] pr-4">{q}</span>
        {open ? <ChevronUp size={16} className="text-[#9CA3AF] flex-shrink-0" /> : <ChevronDown size={16} className="text-[#9CA3AF] flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 bg-white">
          <p className="text-[13px] text-[#6B7280] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export function ServicePage({ serviceId }: { serviceId: string }) {
  const service = SERVICES.find(s => s.id === serviceId);

  if (!service) {
    return (
      <div className="py-32 text-center text-[#6B7280]">Service not found.</div>
    );
  }

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative py-16 md:py-28 overflow-hidden">
        <img src={img(service.heroImage, 1920, 700)} alt={service.label}
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#14356B]/92 via-[#14356B]/75 to-transparent" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-3 py-1 mb-4"
              style={{ backgroundColor: `${service.color}25` }}>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: service.color }}>
                {service.label}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-4">
              {service.tagline}
            </h1>
            <p className="text-white/70 text-sm leading-relaxed mb-7">{service.shortDesc}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/book" className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-[10px] text-sm transition-colors text-[#14356B]"
                style={{ backgroundColor: service.color }}>
                Book Now <ArrowRight size={14} />
              </Link>
              <a href="https://wa.me/8801712345678" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/30 text-white font-bold rounded-[10px] text-sm hover:bg-white/20 transition-colors">
                <Phone size={14} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESCRIPTION ── */}
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <div className="text-[#C9A227] text-[12px] font-bold uppercase tracking-widest mb-3">Overview</div>
            <p className="text-[#374151] text-[15px] leading-relaxed">{service.description}</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-10 md:py-16 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="text-[#C9A227] text-[12px] font-bold uppercase tracking-widest mb-2">What's Included</div>
            <h2 className="text-2xl font-black text-[#111827]">Why Choose Our {service.label}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {service.features.map(f => {
              const Icon = ICON_MAP[f.icon] || Shield;
              return (
                <div key={f.title} className="bg-white rounded-2xl p-5 border border-[#E5E7EB] hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${service.color}15` }}>
                    <Icon size={18} style={{ color: service.color }} />
                  </div>
                  <h3 className="text-[14px] font-bold text-[#111827] mb-1">{f.title}</h3>
                  <p className="text-[12px] text-[#6B7280] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="text-[#C9A227] text-[12px] font-bold uppercase tracking-widest mb-2">Packages & Pricing</div>
            <h2 className="text-2xl font-black text-[#111827]">{service.label} Packages</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {service.packages.map((pkg, i) => (
              <div key={pkg.title} className={cn(
                "rounded-2xl border-2 overflow-hidden relative",
                i === 1 ? "border-[#C9A227] shadow-xl" : "border-[#E5E7EB]"
              )}>
                {i === 1 && (
                  <div className="bg-[#C9A227] text-[#14356B] text-center text-[11px] font-black py-1.5 uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                {pkg.badge && i !== 1 && (
                  <div className="bg-[#14356B] text-white text-center text-[11px] font-bold py-1.5">
                    {pkg.badge}
                  </div>
                )}
                <div className="p-6 bg-white">
                  <h3 className="text-[16px] font-black text-[#111827] mb-1">{pkg.title}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-black text-[#14356B]">{fmtPrice(pkg.price)}</span>
                    <span className="text-[12px] text-[#9CA3AF]">/ person</span>
                  </div>
                  <div className="flex gap-3 text-[11px] text-[#9CA3AF] mb-4">
                    <span><Clock size={10} className="inline mr-0.5" />{pkg.duration}</span>
                    <span><Hotel size={10} className="inline mr-0.5" />{pkg.hotel}</span>
                  </div>
                  <ul className="flex flex-col gap-2 mb-5">
                    {pkg.highlights.map(h => (
                      <li key={h} className="flex items-center gap-2 text-[12px] text-[#374151]">
                        <CheckCircle size={13} className="text-[#0E7C66] flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <Link to="/book" className={cn(
                    "block text-center py-2.5 rounded-[10px] text-[13px] font-bold transition-colors",
                    i === 1
                      ? "bg-[#C9A227] text-[#14356B] hover:bg-[#B8911F]"
                      : "bg-[#14356B] text-white hover:bg-[#0F2A55]"
                  )}>
                    Book This Package
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-10 md:py-16 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="text-[#C9A227] text-[12px] font-bold uppercase tracking-widest mb-2">How It Works</div>
            <h2 className="text-2xl font-black text-[#111827]">Step-by-Step Process</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {service.process.map(step => (
              <div key={step.step} className="bg-white rounded-2xl p-5 border border-[#E5E7EB] flex gap-4">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 font-black text-[13px]"
                  style={{ backgroundColor: `${service.color}15`, color: service.color }}>
                  {step.step}
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-[#111827] mb-1">{step.title}</h3>
                  <p className="text-[12px] text-[#6B7280] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INCLUDES / EXCLUDES ── */}
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <h3 className="text-[18px] font-black text-[#111827] mb-5 flex items-center gap-2">
                <CheckCircle size={20} className="text-[#0E7C66]" /> What's Included
              </h3>
              <ul className="flex flex-col gap-2.5">
                {service.includes.map(i => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#374151]">
                    <CheckCircle size={14} className="text-[#0E7C66] flex-shrink-0 mt-0.5" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[18px] font-black text-[#111827] mb-5 flex items-center gap-2">
                <XCircle size={20} className="text-[#DC2626]" /> What's Excluded
              </h3>
              <ul className="flex flex-col gap-2.5">
                {service.excludes.map(e => (
                  <li key={e} className="flex items-start gap-2.5 text-[13px] text-[#374151]">
                    <XCircle size={14} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {service.faqs.length > 0 && (
        <section className="py-10 md:py-16 bg-[#F7F8FA]">
          <div className="max-w-[800px] mx-auto px-4 md:px-6">
            <div className="text-center mb-10">
              <div className="text-[#C9A227] text-[12px] font-bold uppercase tracking-widest mb-2">FAQ</div>
              <h2 className="text-2xl font-black text-[#111827]">Frequently Asked Questions</h2>
            </div>
            <div className="flex flex-col gap-3">
              {service.faqs.map(f => (
                <FAQItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ENQUIRY CTA ── */}
      <section className="py-10 md:py-16 bg-[#14356B] text-white text-center">
        <div className="max-w-lg mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-black mb-3">Ready to Book {service.label}?</h2>
          <p className="text-white/60 text-sm mb-7">Contact us today — our specialists will guide you through the entire process.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/book" className="px-6 py-3 font-bold rounded-[10px] text-sm transition-colors text-[#14356B]"
              style={{ backgroundColor: service.color }}>
              Start Booking
            </Link>
            <Link to="/contact" className="px-6 py-3 border-2 border-white/30 text-white font-bold rounded-[10px] text-sm hover:border-white/60 transition-colors">
              Make Enquiry
            </Link>
            <a href="https://wa.me/8801712345678" target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-[#25D366] text-white font-bold rounded-[10px] text-sm hover:bg-[#1da855] transition-colors">
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
