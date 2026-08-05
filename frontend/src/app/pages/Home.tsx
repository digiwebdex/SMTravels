import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useTranslation, Trans } from "react-i18next";
import {
  Star, MapPin, Shield, Plane, Briefcase, Hotel, Globe,
  ArrowRight, CheckCircle, Phone, Quote, Clock, Heart, Headphones, TrendingUp,
} from "lucide-react";
import { img, fmtPrice } from "../lib/utils";
import { whatsappUrl } from "../lib/contact";
import { HeroBackground } from "../components/HeroBackground";
import { usePublicPackages, usePublicBlogPosts, usePublicTestimonials, contentLinkKey } from "../hooks/publicContent";

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/** Hero CTA group — Book / Contact / WhatsApp only (no search widget). */
function HeroCtas() {
  const { t } = useTranslation("home");
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-lg mx-auto">
      <Link
        to="/book"
        className="flex-1 py-3.5 px-6 bg-[var(--color-brand-mark)] hover:bg-[var(--color-brand-mark-hover)] text-white font-bold rounded-sm text-[15px] transition-all text-center min-h-[48px] flex items-center justify-center shadow-[0_12px_32px_rgba(241,90,36,0.35)] hover:shadow-[0_16px_40px_rgba(241,90,36,0.45)] hover:-translate-y-0.5"
      >
        {t("hero.cta.book")}
      </Link>
      <Link
        to="/contact"
        className="flex-1 py-3.5 px-6 bg-white/95 hover:bg-white text-[#17456B] font-bold rounded-sm text-[15px] transition-all text-center min-h-[48px] flex items-center justify-center hover:-translate-y-0.5"
      >
        {t("hero.cta.contact")}
      </Link>
      <a
        href={whatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 py-3.5 px-6 border border-white/45 hover:border-white hover:bg-white/10 text-white font-bold rounded-sm text-[15px] transition-all text-center min-h-[48px] flex items-center justify-center gap-2 hover:-translate-y-0.5"
      >
        <Phone size={16} />
        {t("hero.cta.whatsapp")}
      </a>
    </div>
  );
}

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
          if (start >= end) {
            setVal(end);
            return;
          }
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
    <div ref={ref} className="text-center px-2">
      <div className="home-display text-4xl md:text-5xl lg:text-6xl text-white mb-2 tracking-tight">
        {val.toLocaleString()}{suffix}
      </div>
      <div className="text-[12px] md:text-sm text-white/55 font-medium tracking-wide uppercase">{label}</div>
    </div>
  );
}

export function Home() {
  const { t } = useTranslation("home");
  const { packages: allPackages, fromApi: packagesFromApi } = usePublicPackages({ limit: 20 });
  const { posts: allBlogs, fromApi: blogsFromApi } = usePublicBlogPosts({ limit: 10 });
  const { testimonials: allTestimonials } = usePublicTestimonials();
  const featuredPackages = allPackages.slice(0, 4);
  const featuredBlogs = allBlogs.slice(0, 3);
  const featuredTestimonials = allTestimonials.slice(0, 3);

  const servicesRef = useReveal<HTMLElement>();
  const packagesRef = useReveal<HTMLElement>();
  const whyRef = useReveal<HTMLElement>();
  const testimonialsRef = useReveal<HTMLElement>();
  const blogRef = useReveal<HTMLElement>();

  const services = [
    { id: "hajj", i18n: "hajj", icon: Star },
    { id: "umrah", i18n: "umrah", icon: MapPin },
    { id: "visa", i18n: "visa", icon: Shield },
    { id: "air-ticket", i18n: "airTicket", icon: Plane },
    { id: "manpower", i18n: "manpower", icon: Briefcase },
    { id: "tour-packages", i18n: "tour", icon: Globe },
    { id: "hotel-booking", i18n: "hotel", icon: Hotel },
  ];

  const partners = [
    { name: "Biman Bangladesh", src: "/partners/biman.svg" },
    { name: "Saudi Airlines", src: "/partners/saudia.svg" },
    { name: "Qatar Airways", src: "/partners/qatar.svg" },
    { name: "Emirates", src: "/partners/emirates.svg" },
    { name: "Turkish Airlines", src: "/partners/turkish.svg" },
    { name: "Etihad Airways", src: "/partners/etihad.svg" },
    { name: "Air Arabia", src: "/partners/airarabia.svg" },
    { name: "FlyDubai", src: "/partners/flydubai.svg" },
  ];

  return (
    <div className="home-sacred">
      {/* ── HERO — brand + headline + subtitle + CTAs only ── */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
        <HeroBackground posterImg="/hero-makkah-poster.jpg" alt="Masjid al-Haram, Makkah" />

        <div className="relative z-10 w-full max-w-[1100px] mx-auto px-5 md:px-8 flex flex-col items-center text-center gap-4 md:gap-5 py-20 md:py-24">
          <h1 className="home-rise text-[2.15rem] sm:text-4xl md:text-5xl lg:text-[3.75rem] text-white leading-[1.12] max-w-3xl drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
            <Trans
              t={t}
              i18nKey="hero.title"
              components={{ hl: <span className="text-[#F15A24] italic" />, br: <br /> }}
            />
          </h1>

          <p className="home-rise home-rise-delay-1 text-[15px] md:text-lg text-white/80 max-w-lg mx-auto leading-relaxed font-medium drop-shadow-sm">
            {t("hero.subtitle")}
          </p>

          <div className="home-rise home-rise-delay-2 w-full pt-1">
            <HeroCtas />
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#faf9f7] to-transparent pointer-events-none z-[5]" />
      </section>

      {/* ── TRUST RIBBON ── */}
      <section className="relative z-10 -mt-6 md:-mt-8">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          <div className="bg-[#0A2E4D] text-white px-5 md:px-8 py-4 md:py-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:gap-x-10 shadow-[0_20px_50px_rgba(10,46,77,0.25)]">
            {[
              t("trustStrip.license"),
              t("trustStrip.aviation"),
              t("trustStrip.ministry"),
              t("trustStrip.years"),
              t("trustStrip.pilgrims"),
            ].map((item) => (
              <span key={item} className="text-[11px] md:text-[12px] font-semibold tracking-wide text-white/75 whitespace-nowrap">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section ref={servicesRef} className="home-reveal py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <div className="text-center mb-10 md:mb-14">
            <div className="home-ornament text-[11px] font-bold uppercase tracking-[0.22em] mb-3">
              {t("services.eyebrow")}
            </div>
            <h2 className="text-3xl md:text-5xl text-[#0A2E4D] mb-3">{t("services.heading")}</h2>
            <p className="text-[var(--home-muted)] max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              {t("services.subheading")}
            </p>
          </div>

          <div className="flex md:grid md:grid-cols-7 gap-0 overflow-x-auto no-scrollbar border-y border-[var(--home-line)] divide-x divide-[var(--home-line)]">
            {services.map((s) => (
              <Link
                key={s.id}
                to={`/${s.id}`}
                className="min-w-[140px] md:min-w-0 flex-shrink-0 px-5 py-8 md:py-10 text-center group hover:bg-[#1B75BC]/[0.04] transition-colors"
              >
                <s.icon size={26} className="mx-auto mb-4 text-[#1B75BC] group-hover:text-[#F15A24] transition-colors" strokeWidth={1.5} />
                <div className="text-[13px] font-bold text-[#0A2E4D] group-hover:text-[#1B75BC] transition-colors mb-1.5 leading-snug">
                  {t(`services.items.${s.i18n}.label`)}
                </div>
                <div className="text-[11px] text-[var(--home-muted)] leading-snug hidden sm:block">
                  {t(`services.items.${s.i18n}.desc`)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PACKAGES — editorial sacred layout ── */}
      <section ref={packagesRef} className="home-reveal py-16 md:py-24 bg-[#faf9f7] relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 10% 0%, rgba(27,117,188,0.12), transparent 45%), radial-gradient(ellipse at 90% 100%, rgba(241,90,36,0.08), transparent 40%)",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto px-5 md:px-8">
          <div className="text-center mb-12 md:mb-14">
            <div className="home-ornament text-[11px] font-bold uppercase tracking-[0.22em] mb-3">
              {t("packages.eyebrow")}
            </div>
            <h2 className="text-3xl md:text-5xl text-[#0A2E4D] mb-3">{t("packages.heading")}</h2>
            <p className="text-[var(--home-muted)] text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              {t("packages.subheading")}
            </p>
          </div>

          {featuredPackages.length > 0 && (() => {
            const [lead, ...rest] = featuredPackages;
            const leadHref = `/packages/${contentLinkKey(lead, packagesFromApi)}`;
            return (
              <>
                {/* Lead package — split composition */}
                <Link
                  to={leadHref}
                  className="group grid grid-cols-1 lg:grid-cols-12 mb-8 md:mb-10 overflow-hidden bg-[#0A2E4D] shadow-[0_24px_60px_rgba(10,46,77,0.18)]"
                >
                  <div className="relative lg:col-span-7 min-h-[280px] md:min-h-[380px] overflow-hidden">
                    <img
                      src={img(lead.image, 1100, 800)}
                      alt={lead.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061828]/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0A2E4D]/40" />
                    {lead.badge && (
                      <span className="absolute top-5 left-5 text-[10px] font-bold uppercase tracking-[0.2em] bg-[#F15A24] text-white px-3 py-1.5">
                        {lead.badge}
                      </span>
                    )}
                  </div>
                  <div className="lg:col-span-5 flex flex-col justify-center px-6 py-8 md:px-10 md:py-12 text-white">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#F15A24] mb-3">
                      {lead.type}
                    </div>
                    <h3 className="home-display text-3xl md:text-4xl leading-[1.15] mb-4 group-hover:text-[#F15A24] transition-colors">
                      {lead.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/65 mb-6">
                      <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {lead.duration}</span>
                      {lead.departure && (
                        <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {t("packages.departing", { val: lead.departure })}</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between gap-4 pt-5 border-t border-white/15">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-white/45 mb-1">{t("packages.startingFrom")}</div>
                        <div className="text-2xl md:text-3xl font-bold text-[#F15A24]">{fmtPrice(lead.price)}</div>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all">
                        {t("packages.explore")} <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Remaining packages — image + meta below (readable, not overlay-heavy) */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                    {rest.map((pkg) => (
                      <Link
                        key={pkg.slug || pkg.id}
                        to={`/packages/${contentLinkKey(pkg, packagesFromApi)}`}
                        className="group block"
                      >
                        <div className="relative aspect-[16/11] overflow-hidden mb-4 bg-[#0A2E4D]/10">
                          <img
                            src={img(pkg.image, 700, 480)}
                            alt={pkg.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.18em] bg-white/95 text-[#0A2E4D] px-2.5 py-1">
                            {pkg.type}
                          </div>
                        </div>
                        <h3 className="home-display text-2xl text-[#0A2E4D] leading-snug mb-2 group-hover:text-[#1B75BC] transition-colors">
                          {pkg.title}
                        </h3>
                        <div className="flex items-center gap-3 text-[12px] text-[var(--home-muted)] mb-3">
                          <span className="inline-flex items-center gap-1"><Clock size={12} /> {pkg.duration}</span>
                          {pkg.seats != null && (
                            <span>{t("packages.seatsLeft", { count: pkg.seats })}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--home-line)]">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-[var(--home-muted)]">{t("packages.startingFrom")}</div>
                            <div className="text-lg font-bold text-[#F15A24]">{fmtPrice(pkg.price)}</div>
                          </div>
                          <span className="w-9 h-9 rounded-full border border-[#1B75BC]/25 text-[#1B75BC] flex items-center justify-center group-hover:bg-[#1B75BC] group-hover:text-white transition-colors">
                            <ArrowRight size={14} />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          <div className="text-center mt-12">
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-sm transition-colors"
            >
              {t("packages.viewAllPackages")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY — image-led, no floating stickers ── */}
      <section ref={whyRef} className="home-reveal relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[520px]">
          <div className="relative min-h-[320px] lg:min-h-full overflow-hidden">
            <img
              src={img("photo-1720549973451-018d3623b55a", 1200, 900)}
              alt="Hajj pilgrims at Kaaba"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#faf9f7]/30 lg:to-transparent" />
          </div>
          <div className="flex items-center bg-[#faf9f7] px-6 md:px-12 lg:px-16 py-14 md:py-20">
            <div className="max-w-lg">
              <div className="home-ornament justify-start text-[11px] font-bold uppercase tracking-[0.22em] mb-4">
                {t("why.eyebrow")}
              </div>
              <h2 className="text-3xl md:text-5xl text-[#0A2E4D] leading-[1.12] mb-5">
                {t("why.headingLine1")}<br />{t("why.headingLine2")}
              </h2>
              <p className="text-[var(--home-muted)] text-sm md:text-[15px] leading-relaxed mb-8">
                {t("why.body")}
              </p>

              <div className="space-y-5 mb-9">
                {[
                  { icon: CheckCircle, title: t("why.features.govt.title"), desc: t("why.features.govt.desc") },
                  { icon: Headphones, title: t("why.features.support.title"), desc: t("why.features.support.desc") },
                  { icon: Heart, title: t("why.features.trusted.title"), desc: t("why.features.trusted.desc") },
                  { icon: TrendingUp, title: t("why.features.value.title"), desc: t("why.features.value.desc") },
                ].map((i) => (
                  <div key={i.title} className="flex gap-4">
                    <i.icon size={18} className="text-[#F15A24] mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                    <div>
                      <div className="text-[14px] font-bold text-[#0A2E4D] mb-0.5">{i.title}</div>
                      <div className="text-[12px] text-[var(--home-muted)] leading-snug">{i.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-sm transition-colors"
              >
                {t("why.learnStory")} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 md:py-20 bg-[#061828] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #1B75BC 0%, transparent 45%), radial-gradient(circle at 80% 30%, #F15A24 0%, transparent 40%)" }}
        />
        <div className="relative max-w-[1100px] mx-auto px-5 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            <Counter end={10000} suffix="+" label={t("stats.pilgrims")} />
            <Counter end={25} suffix="+" label={t("stats.years")} />
            <Counter end={50} suffix="+" label={t("stats.countries")} />
            <Counter end={4} suffix="" label={t("stats.branches")} />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS — quote-led ── */}
      <section ref={testimonialsRef} className="home-reveal py-16 md:py-24 bg-[#faf9f7]">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          <div className="text-center mb-12 md:mb-16">
            <div className="home-ornament text-[11px] font-bold uppercase tracking-[0.22em] mb-3">
              {t("testimonials.eyebrow")}
            </div>
            <h2 className="text-3xl md:text-5xl text-[#0A2E4D]">{t("testimonials.heading")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {featuredTestimonials.map((item, idx) => (
              <blockquote key={idx} className="relative pt-2">
                <Quote size={28} className="text-[#F15A24]/35 mb-4" strokeWidth={1.5} />
                <p className="home-display text-xl md:text-2xl text-[#0A2E4D] leading-snug mb-6 italic">
                  “{item.text}”
                </p>
                <footer className="flex items-center gap-3 border-t border-[var(--home-line)] pt-4">
                  <div className="w-10 h-10 rounded-full bg-[#1B75BC]/10 flex items-center justify-center font-bold text-[#1B75BC] text-sm flex-shrink-0">
                    {item.initial ?? item.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#0A2E4D]">{item.name}</div>
                    <div className="text-[11px] text-[var(--home-muted)] truncate">{item.city} · {item.package}</div>
                  </div>
                  <div className="ml-auto flex gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} className={i < item.stars ? "text-[#F15A24] fill-[#F15A24]" : "text-[#D6D3CD]"} />
                    ))}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG ── */}
      <section ref={blogRef} className="home-reveal py-16 md:py-24 bg-white">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          <div className="flex items-end justify-between mb-10 md:mb-12 gap-4">
            <div>
              <div className="home-ornament justify-start text-[11px] font-bold uppercase tracking-[0.22em] mb-3">
                {t("blog.eyebrow")}
              </div>
              <h2 className="text-3xl md:text-5xl text-[#0A2E4D]">{t("blog.heading")}</h2>
            </div>
            <Link to="/blog" className="hidden md:inline-flex items-center gap-2 text-[#1B75BC] text-sm font-semibold hover:gap-3 transition-all">
              {t("blog.allArticles")} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {featuredBlogs.map((b) => (
              <Link key={b.slug || b.id} to={`/blog/${contentLinkKey(b, blogsFromApi)}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden mb-4">
                  <img
                    src={img(b.image, 700, 440)}
                    alt={b.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="text-[11px] text-[var(--home-muted)] mb-2 tracking-wide">
                  {b.date} · {t("blog.readTime", { time: b.readTime })}
                </div>
                <h3 className="home-display text-2xl text-[#0A2E4D] leading-snug mb-2 group-hover:text-[#1B75BC] transition-colors">
                  {b.title}
                </h3>
                <p className="text-[13px] text-[var(--home-muted)] leading-relaxed line-clamp-2">{b.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS MARQUEE ── */}
      <section className="py-12 md:py-14 border-y border-[var(--home-line)] bg-[#faf9f7]">
        <div className="text-center mb-8">
          <div className="text-[11px] font-bold text-[var(--home-muted)] uppercase tracking-[0.22em]">{t("partners.heading")}</div>
        </div>
        <div className="home-marquee">
          <div className="home-marquee-track items-center px-8 gap-10 md:gap-14">
            {[...partners, ...partners].map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="flex-shrink-0 h-10 md:h-12 w-[120px] md:w-[150px] flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                title={p.name}
              >
                <img
                  src={p.src}
                  alt={p.name}
                  className="max-h-full max-w-full w-auto object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA — hotline + book (quiet newsletter secondary) ── */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-[#0A2E4D]">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${img("photo-1770786106021-52580470e31e", 1600, 900)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-[#0A2E4D]/85" />
        <div className="relative max-w-[800px] mx-auto px-5 md:px-8 text-center">
          <div className="home-ornament text-[11px] font-bold uppercase tracking-[0.22em] text-[#F15A24] mb-4">
            {t("contact.hotline")}
          </div>
          <h2 className="text-3xl md:text-5xl text-white mb-3 leading-tight">
            {t("ctaClose.heading")}
          </h2>
          <p className="text-white/60 text-sm md:text-base mb-8 max-w-md mx-auto">
            {t("ctaClose.subheading")}
          </p>
          <a
            href="tel:+88029553421"
            className="home-display inline-block text-3xl md:text-4xl text-white hover:text-[#F15A24] transition-colors mb-8"
          >
            +880 2 9553421
          </a>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              to="/book"
              className="w-full sm:w-auto px-8 py-3.5 bg-[var(--color-brand-mark)] hover:bg-[var(--color-brand-mark-hover)] text-white font-bold text-sm transition-colors min-h-[48px] flex items-center justify-center"
            >
              {t("hero.cta.book")}
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-3.5 border border-white/35 hover:bg-white/10 text-white font-bold text-sm transition-colors min-h-[48px] flex items-center justify-center gap-2"
            >
              <MapPin size={14} /> {t("contact.branches")}
            </Link>
          </div>
          <p className="text-white/40 text-[12px]">
            <span className="font-semibold text-white/55">{t("contact.officeHours")}</span> {t("contact.hoursValue")}
          </p>
        </div>
      </section>
    </div>
  );
}
