import React from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle, XCircle, ArrowRight, Star, MapPin, Clock, Phone, Shield, Plane, Hotel, Briefcase, Globe, Heart,
} from "lucide-react";
import { SERVICES } from "../lib/data";
import { cn } from "../lib/utils";
import { usePublicPackages } from "../hooks/publicContent";
import {
  PageHero, Breadcrumbs, Section, SectionHeader, PackageCard, AccordionFAQ,
  SkeletonBlock, EmptyState, Btn, Reveal, CtaBand,
} from "../website/primitives";

const ICON_MAP: Record<string, React.ElementType> = {
  star: Star, "map-pin": MapPin, shield: Shield, plane: Plane, hotel: Hotel,
  briefcase: Briefcase, globe: Globe, heart: Heart, users: Star, clock: Clock,
  "dollar-sign": Shield, calendar: Clock, phone: Phone, "check-circle": CheckCircle,
};

const TYPE_BY_SERVICE: Record<string, string | undefined> = {
  hajj: "HAJJ",
  umrah: "UMRAH",
  "tour-packages": "TOUR",
};

export function ServicePage({ serviceId }: { serviceId: string }) {
  const { t, i18n } = useTranslation("servicesPage");
  const bn = i18n.language?.startsWith("bn");
  const service = SERVICES.find((s) => s.id === serviceId);
  const apiType = TYPE_BY_SERVICE[serviceId];
  const { data: pkgData, isLoading: pkgLoading } = usePublicPackages({
    type: apiType,
    limit: 6,
  });
  const livePackages = apiType ? (pkgData?.data ?? []) : [];

  if (!service) {
    return (
      <Section>
        <EmptyState message={t("notFound")} />
      </Section>
    );
  }

  const faqs = service.faqs.map((f, i) => ({ id: `${service.id}-faq-${i}`, question: f.q, answer: f.a }));

  return (
    <div>
      <PageHero
        eyebrow={service.label}
        title={service.tagline}
        subtitle={service.shortDesc}
        image={service.heroImage}
      >
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: service.label },
        ]} />
        <div className="flex flex-wrap gap-3 mt-2">
          <Btn to="/book" variant="orange">{t("common:actions.bookNow")} <ArrowRight size={14} /></Btn>
          <Btn href="https://wa.me/8801712345678" variant="ghost"><Phone size={14} /> {t("hero.whatsapp")}</Btn>
        </div>
      </PageHero>

      <Section>
        <Reveal>
          <p className="text-[#F15A24] text-xs font-bold uppercase tracking-[0.2em] mb-3">{t("overview.eyebrow")}</p>
          <p className="text-[#374151] text-lg leading-relaxed max-w-3xl">{service.description}</p>
        </Reveal>
      </Section>

      <Section tone="soft">
        <SectionHeader eyebrow={t("features.eyebrow")} title={t("features.heading", { service: service.label })} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {service.features.map((f, i) => {
            const Icon = ICON_MAP[f.icon] || Shield;
            return (
              <Reveal key={f.title} delay={i * 0.04}>
                <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] h-full hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${service.color}18`, color: service.color }}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold text-[#062D63] mb-1">{f.title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow={t("packages.eyebrow")} title={t("packages.heading", { service: service.label })} />
        {apiType ? (
          <>
            {pkgLoading && <div className="grid md:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-72" />)}</div>}
            {!pkgLoading && livePackages.length === 0 && <EmptyState message={bn ? "প্যাকেজ শীঘ্রই।" : "Packages coming soon."} />}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {livePackages.map((pkg, i) => (
                <Reveal key={pkg.id} delay={i * 0.05}><PackageCard pkg={pkg} /></Reveal>
              ))}
            </div>
          </>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.packages.map((pkg, i) => (
              <Reveal key={pkg.title} delay={i * 0.05}>
                <div className={cn(
                  "rounded-3xl border-2 overflow-hidden bg-white",
                  i === 1 ? "border-[#F15A24] shadow-xl" : "border-[#E5E7EB]",
                )}>
                  {i === 1 && (
                    <div className="bg-[#F15A24] text-white text-center text-[11px] font-bold py-1.5 uppercase tracking-wider">
                      {t("packages.mostPopular")}
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-semibold text-[#062D63] mb-1">{pkg.title}</h3>
                    <p className="text-2xl font-semibold text-[#1B75BC] mb-3" style={{ fontFamily: "var(--font-display)" }}>
                      ৳ {pkg.price.toLocaleString("en-BD")}
                      <span className="text-xs text-[#9CA3AF] font-normal ml-1">{t("packages.perPerson")}</span>
                    </p>
                    <ul className="space-y-2 mb-5">
                      {pkg.highlights.map((h) => (
                        <li key={h} className="flex gap-2 text-sm text-[#374151]"><CheckCircle size={14} className="text-[#16A34A] mt-0.5" />{h}</li>
                      ))}
                    </ul>
                    <Btn to="/book" variant={i === 1 ? "orange" : "primary"} className="w-full">{t("packages.bookThis")}</Btn>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      <Section tone="tint">
        <SectionHeader eyebrow={t("process.eyebrow")} title={t("process.heading")} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {service.process.map((step, i) => (
            <Reveal key={step.step} delay={i * 0.04}>
              <div className="bg-white rounded-3xl p-5 border border-[#E5E7EB] flex gap-4 h-full">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ backgroundColor: `${service.color}18`, color: service.color }}>
                  {step.step}
                </div>
                <div>
                  <h3 className="font-semibold text-[#062D63] mb-1 text-sm">{step.title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-[#062D63] mb-5 inline-flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
              <CheckCircle size={20} className="text-[#16A34A]" /> {t("includes.included")}
            </h3>
            <ul className="space-y-2.5">
              {service.includes.map((i) => (
                <li key={i} className="flex gap-2.5 text-sm text-[#374151]"><CheckCircle size={14} className="text-[#16A34A] mt-0.5" />{i}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#062D63] mb-5 inline-flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
              <XCircle size={20} className="text-red-500" /> {t("includes.excluded")}
            </h3>
            <ul className="space-y-2.5">
              {service.excludes.map((e) => (
                <li key={e} className="flex gap-2.5 text-sm text-[#374151]"><XCircle size={14} className="text-red-500 mt-0.5" />{e}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {faqs.length > 0 && (
        <Section tone="soft">
          <SectionHeader eyebrow={t("faq.eyebrow")} title={t("faq.heading")} />
          <div className="max-w-3xl mx-auto"><AccordionFAQ items={faqs} /></div>
        </Section>
      )}

      <Section>
        <CtaBand
          title={t("cta.heading", { service: service.label })}
          subtitle={t("cta.subtitle")}
          primary={{ label: t("cta.startBooking"), to: "/book" }}
          secondary={{ label: t("cta.makeEnquiry"), to: "/contact" }}
        />
      </Section>
    </div>
  );
}
