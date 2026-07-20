import React from "react";
import { Link } from "react-router";
import { CheckCircle, Award, Users, Globe, Shield, Target, Heart, ArrowRight, Star } from "lucide-react";
import { img } from "../lib/utils";

const MILESTONES = [
  { year: "1998", event: "Founded in Dhaka's Motijheel commercial area" },
  { year: "2002", event: "Received first government Hajj pilgrimage license" },
  { year: "2007", event: "Opened Chittagong and Sylhet branch offices" },
  { year: "2012", event: "Expanded to Umrah year-round services" },
  { year: "2016", event: "Launched manpower & international recruitment division" },
  { year: "2019", event: "Served 1,000+ pilgrims in a single Hajj season" },
  { year: "2022", event: "ISO 9001:2015 certification achieved" },
  { year: "2024", event: "Crossed 10,000 total pilgrims milestone" },
];

const TEAM = [
  { name: "Mohammad Shahadat Hossain", role: "Chairman & Managing Director", exp: "30+ years in travel industry" },
  { name: "Md. Rafiqul Islam", role: "Director, Hajj & Umrah Operations", exp: "Expert in Saudi regulations" },
  { name: "Nusrat Jahan", role: "Head of Visa Services", exp: "Specialized in Gulf & European visas" },
  { name: "Abdullah Al Mamun", role: "Head of Corporate Travel", exp: "15+ years corporate travel mgmt" },
];

const CERTS = [
  "ATAB Member (Travel Agents Assoc. of Bangladesh)",
  "Civil Aviation Authority of Bangladesh — Approved",
  "Ministry of Religious Affairs — Hajj Licensed",
  "BMET Registered (Manpower Export)",
  "ISO 9001:2015 Certified",
  "IATA Accredited Agency",
];

export function About() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <img src={img("photo-1693590614566-1d3ea9ef32f7", 1920, 600)} alt="Umrah pilgrims"
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E6BB8]/95 to-[#0E6BB8]/70" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="max-w-xl">
            <div className="text-[#C43A15] text-[12px] font-bold uppercase tracking-widest mb-3">Company Profile</div>
            <h1 className="text-4xl font-black text-white mb-4">About SMTravel International</h1>
            <p className="text-white/70 leading-relaxed text-sm">
              Bangladesh's most trusted Hajj, Umrah & travel management company — serving pilgrims and travelers with integrity since 1998.
            </p>
          </div>
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <div className="text-[#C43A15] text-[12px] font-bold uppercase tracking-widest mb-3">Our Story</div>
            <h2 className="text-3xl font-black text-[#111827] mb-5">A Legacy Built on Trust</h2>
            <div className="flex flex-col gap-4 text-[13px] text-[#374151] leading-relaxed">
              <p>
                SMTravel International was founded in 1998 in Dhaka's Motijheel commercial district with a single mission: to make the sacred Hajj pilgrimage accessible, affordable, and stress-free for every Bangladeshi Muslim.
              </p>
              <p>
                Over 25 years, we have grown from a single-room office to a multi-branch, full-service travel management company — trusted by over 10,000 pilgrims, families, and corporate clients across Bangladesh.
              </p>
              <p>
                Today, SMTravel International offers Hajj packages, Umrah year-round, visa services for 50+ countries, air ticket booking, manpower deployment, world tour packages, and hotel reservations — all under one roof, with the same dedication to quality and care.
              </p>
            </div>

            <div className="flex gap-6 mt-8">
              {[
                { n: "25+", l: "Years" },
                { n: "10K+", l: "Pilgrims" },
                { n: "50+", l: "Countries" },
                { n: "4", l: "Branches" },
              ].map(i => (
                <div key={i.l} className="text-center">
                  <div className="text-2xl font-black text-[#0E6BB8]">{i.n}</div>
                  <div className="text-[11px] text-[#9CA3AF]">{i.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <img src={img("photo-1720549973451-018d3623b55a", 500, 350)} alt="Kaaba aerial" className="rounded-2xl object-cover h-[220px] w-full shadow-lg" />
            <img src={img("photo-1693590614566-1d3ea9ef32f7", 500, 350)} alt="Pilgrims" className="rounded-2xl object-cover h-[220px] w-full shadow-lg mt-8" />
          </div>
        </div>
      </section>

      {/* ── MISSION / VISION / VALUES ── */}
      <section className="py-12 md:py-20 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="text-[#C43A15] text-[12px] font-bold uppercase tracking-widest mb-2">Our Foundation</div>
            <h2 className="text-3xl font-black text-[#111827]">Mission, Vision & Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                icon: Target,
                title: "Our Mission",
                color: "#0E6BB8",
                bg: "#EEF2FF",
                text: "To provide the highest quality Hajj, Umrah and travel services that honor the sacred trust our clients place in us — with transparency, professionalism, and genuine care for every pilgrim's journey.",
              },
              {
                icon: Globe,
                title: "Our Vision",
                color: "#0E7C66",
                bg: "#ECFDF5",
                text: "To be South Asia's most respected Islamic travel management company — setting the benchmark for pilgrimage services, traveler safety, and community trust by 2030.",
              },
              {
                icon: Heart,
                title: "Our Values",
                color: "#DC2626",
                bg: "#FEF2F2",
                text: "Integrity, Compassion, Excellence, Accountability. We treat every pilgrim as family, every journey as sacred, and every promise as a covenant.",
              },
            ].map(v => (
              <div key={v.title} className="bg-white rounded-2xl p-7 border border-[#E5E7EB] shadow-sm">
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-4" style={{ backgroundColor: v.bg }}>
                  <v.icon size={22} style={{ color: v.color }} />
                </div>
                <h3 className="text-[17px] font-black text-[#111827] mb-3">{v.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MILESTONES ── */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[900px] mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="text-[#C43A15] text-[12px] font-bold uppercase tracking-widest mb-2">Our Journey</div>
            <h2 className="text-3xl font-black text-[#111827]">25 Years of Milestones</h2>
          </div>
          <div className="relative">
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-[#E5E7EB] -translate-x-1/2" />
            <div className="flex flex-col gap-8">
              {MILESTONES.map((m, i) => (
                <div key={m.year} className={cn("flex gap-6 items-start", i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse")}>
                  <div className={cn("flex-1 hidden md:block", i % 2 === 0 ? "text-right" : "text-left")} />
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#0E6BB8] text-white text-[11px] font-black flex items-center justify-center border-4 border-white shadow">
                      {m.year.slice(2)}
                    </div>
                  </div>
                  <div className="flex-1 bg-[#F7F8FA] rounded-[12px] p-4 border border-[#E5E7EB]">
                    <div className="text-[12px] font-black text-[#C43A15] mb-0.5">{m.year}</div>
                    <div className="text-[13px] text-[#374151]">{m.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CERTIFICATIONS ── */}
      <section className="py-12 md:py-20 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="text-[#C43A15] text-[12px] font-bold uppercase tracking-widest mb-2">Certifications & Accreditations</div>
            <h2 className="text-3xl font-black text-[#111827]">Licensed & Trusted</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {CERTS.map(c => (
              <div key={c} className="flex items-center gap-3 bg-white rounded-[12px] p-4 border border-[#E5E7EB]">
                <CheckCircle size={18} className="text-[#0E7C66] flex-shrink-0" />
                <span className="text-[13px] text-[#374151] font-medium">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="text-[#C43A15] text-[12px] font-bold uppercase tracking-widest mb-2">Our Leadership</div>
            <h2 className="text-3xl font-black text-[#111827]">Meet the Team</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {TEAM.map(t => (
              <div key={t.name} className="bg-[#F7F8FA] rounded-2xl p-6 text-center border border-[#E5E7EB]">
                <div className="w-16 h-16 bg-[#0E6BB8]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black text-[#0E6BB8]">
                  {t.name[0]}
                </div>
                <h3 className="text-[14px] font-bold text-[#111827] mb-1">{t.name}</h3>
                <div className="text-[12px] font-semibold text-[#0E6BB8] mb-1">{t.role}</div>
                <div className="text-[11px] text-[#9CA3AF]">{t.exp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-10 md:py-16 bg-[#0E6BB8] text-white text-center">
        <div className="max-w-xl mx-auto px-4 md:px-6">
          <Star size={32} className="text-[#C43A15] mx-auto mb-4" fill="currentColor" />
          <h2 className="text-2xl font-black mb-3">Ready to Begin Your Journey?</h2>
          <p className="text-white/60 text-sm mb-7">Speak with our travel experts today. No obligation, just honest advice.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/contact" className="px-6 py-3 bg-[#E8471F] text-[#0E6BB8] font-bold rounded-[10px] text-sm hover:bg-[#CC3C17] transition-colors">
              Contact Us
            </Link>
            <Link to="/packages" className="px-6 py-3 border-2 border-white/30 text-white font-bold rounded-[10px] text-sm hover:border-white/50 transition-colors">
              View Packages <ArrowRight size={14} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function cn(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(" "); }
