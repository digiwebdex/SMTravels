import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, Globe, Target, Heart, Star } from "lucide-react";
import { img, SITE_IMAGES } from "../lib/utils";
import {
  PageHero, Breadcrumbs, Section, SectionHeader, Reveal, CtaBand,
} from "../website/primitives";

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
  const { t, i18n } = useTranslation("about");
  const bn = i18n.language?.startsWith("bn");

  return (
    <div>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.heading")} subtitle={t("hero.subtitle")} image={SITE_IMAGES.pilgrims}>
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: bn ? "আমাদের সম্পর্কে" : "About" },
        ]} />
      </PageHero>

      <Section>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <p className="text-[#F15A24] text-xs font-bold uppercase tracking-[0.2em] mb-3">{t("story.eyebrow")}</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#062D63] mb-5" style={{ fontFamily: "var(--font-display)" }}>{t("story.heading")}</h2>
            <div className="space-y-4 text-[#374151] leading-relaxed">
              <p>SMTravel International was founded in 1998 in Dhaka&apos;s Motijheel commercial district with a single mission: to make the sacred Hajj pilgrimage accessible, affordable, and stress-free for every Bangladeshi Muslim.</p>
              <p>Over 25 years, we have grown from a single-room office to a multi-branch, full-service travel management company — trusted by over 10,000 pilgrims, families, and corporate clients across Bangladesh.</p>
              <p>Today we offer Hajj, Umrah, visa, air tickets, manpower, tours, and hotels — under one roof.</p>
            </div>
            <div className="flex gap-6 mt-8">
              {[
                { n: "25+", l: t("stats.years") },
                { n: "10K+", l: t("stats.pilgrims") },
                { n: "50+", l: t("stats.countries") },
                { n: "4", l: t("stats.branches") },
              ].map((i) => (
                <div key={i.l} className="text-center">
                  <div className="text-2xl font-semibold text-[#1B75BC]" style={{ fontFamily: "var(--font-display)" }}>{i.n}</div>
                  <div className="text-xs text-[#9CA3AF]">{i.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              <img src={img(SITE_IMAGES.kaaba, 500, 350)} alt="" className="rounded-3xl object-cover h-[220px] w-full shadow-lg" />
              <img src={img(SITE_IMAGES.pilgrims, 500, 350)} alt="" className="rounded-3xl object-cover h-[220px] w-full shadow-lg mt-8" />
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeader eyebrow={t("foundation.eyebrow")} title={t("foundation.heading")} />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Target, title: t("mission.title"), color: "#1B75BC", text: "To provide the highest quality Hajj, Umrah and travel services that honor the sacred trust our clients place in us." },
            { icon: Globe, title: t("vision.title"), color: "#16A34A", text: "To be South Asia's most respected Islamic travel management company by 2030." },
            { icon: Heart, title: t("values.title"), color: "#F15A24", text: "Integrity, Compassion, Excellence, Accountability — every pilgrim as family." },
          ].map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06}>
              <div className="bg-white rounded-3xl p-7 border border-[#E5E7EB] h-full">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${v.color}18`, color: v.color }}>
                  <v.icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-[#062D63] mb-3">{v.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow={t("milestones.eyebrow")} title={t("milestones.heading")} />
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-[#E5E7EB]" />
          <div className="space-y-6">
            {MILESTONES.map((m, i) => (
              <Reveal key={m.year} delay={i * 0.03}>
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-[#062D63] text-white text-[11px] font-bold flex items-center justify-center border-4 border-white shadow z-10 flex-shrink-0">
                    {m.year.slice(2)}
                  </div>
                  <div className="flex-1 bg-[#F7F8FA] rounded-2xl p-4 border border-[#E5E7EB]">
                    <div className="text-xs font-bold text-[#F15A24] mb-0.5">{m.year}</div>
                    <div className="text-sm text-[#374151]">{m.event}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="tint">
        <SectionHeader eyebrow={t("certs.eyebrow")} title={t("certs.heading")} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CERTS.map((c) => (
            <div key={c} className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-[#E5E7EB]">
              <CheckCircle size={18} className="text-[#16A34A] flex-shrink-0" />
              <span className="text-sm text-[#374151] font-medium">{c}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow={t("team.eyebrow")} title={t("team.heading")} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {TEAM.map((member) => (
            <div key={member.name} className="bg-[#F7F8FA] rounded-3xl p-6 text-center border border-[#E5E7EB]">
              <div className="w-16 h-16 bg-[#EAF5FF] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-semibold text-[#1B75BC]">
                {member.name[0]}
              </div>
              <h3 className="text-sm font-semibold text-[#062D63] mb-1">{member.name}</h3>
              <div className="text-xs font-semibold text-[#1B75BC] mb-1">{member.role}</div>
              <div className="text-[11px] text-[#9CA3AF]">{member.exp}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <CtaBand
          title={t("cta.heading")}
          subtitle={t("cta.subtitle")}
          primary={{ label: t("cta.contact"), to: "/contact" }}
          secondary={{ label: t("cta.viewPackages"), to: "/packages" }}
        />
        <div className="text-center mt-6">
          <Star size={20} className="text-[#C89B3C] inline" fill="currentColor" />
        </div>
      </Section>
    </div>
  );
}
