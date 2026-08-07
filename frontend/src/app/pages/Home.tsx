import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Star, MapPin, Shield, Plane, Hotel, Globe, Car, Umbrella,
  ArrowRight, ChevronLeft, ChevronRight, Check, X,
  Clock, Headphones, Users, BadgeCheck, BookOpen,
} from "lucide-react";
import { Reveal, SkeletonBlock, EmptyState, StatCounter } from "../website/primitives";
import { usePublicPackages } from "../hooks/publicContent";
import { GUIDES } from "../website/knowledge/guides";
import { SITE_IMAGES, mediaUrl, img, fmtPrice, cn, PACKAGE_IMAGE_FALLBACK } from "../lib/utils";
import { usePageMeta } from "../lib/usePageMeta";
import type { PublicPackageItem } from "../hooks/publicContent";

const SERVICES = [
  { to: "/hajj", icon: Star, titleBn: "হজ্ব প্যাকেজ", titleEn: "Hajj Package", color: "#1B75BC" },
  { to: "/umrah", icon: MapPin, titleBn: "উমরাহ প্যাকেজ", titleEn: "Umrah Package", color: "#F37021" },
  { to: "/visa", icon: Shield, titleBn: "ভিসা সার্ভিস", titleEn: "Visa Service", color: "#002D62" },
  { to: "/air-ticket", icon: Plane, titleBn: "এয়ার টিকেট", titleEn: "Air Ticket", color: "#1B75BC" },
  { to: "/tour-packages", icon: Globe, titleBn: "ট্যুর প্যাকেজ", titleEn: "Tour Package", color: "#16A34A" },
  { to: "/hotel-booking", icon: Hotel, titleBn: "হোটেল বুকিং", titleEn: "Hotel Booking", color: "#C89B3C" },
  { to: "/transport", icon: Car, titleBn: "পরিবহন সেবা", titleEn: "Transport Service", color: "#1B75BC" },
  { to: "/faq", icon: Umbrella, titleBn: "ট্রাভেল ইন্স্যুরেন্স", titleEn: "Travel Insurance", color: "#F37021" },
];

const HAJJ_SLUGS = ["mina", "arafat", "muzdalifah", "ramy", "qurbani", "hair-cutting", "farewell-tawaf", "womens-rules"];
const UMRAH_SLUGS = ["what-is-ihram", "how-to-wear-ihram", "intention-niyyah", "talbiyah", "tawaf", "sai", "farewell-tawaf", "things-that-break-ihram"];

const SUNNAH = [
  { bn: "তাওয়াফের সময় দোয়া পড়া", en: "Recite dua during Tawaf" },
  { bn: "যথাসম্ভব হাজরে আসওয়াদ চুম্বন", en: "Kiss the Black Stone if possible" },
  { bn: "সাফা–মারওয়ায় দ্রুত হাঁটা (পুরুষ)", en: "Brisk pace at Safa–Marwah (men)" },
  { bn: "আরাফাতে বেশি দোয়া ও জিকির", en: "Abundant dua & dhikr at Arafat" },
  { bn: "মক্কায় নফল নামাজ বাড়ানো", en: "Increase nafl prayer in Makkah" },
];

const PROHIBITIONS = [
  { bn: "ইহরামে সুগন্ধি ব্যবহার", en: "Using perfume in Ihram" },
  { bn: "পুরুষের মাথা ঢাকা", en: "Covering the head (men)" },
  { bn: "শিকার করা বা গাছ কাটা", en: "Hunting or cutting plants" },
  { bn: "ঝগড়া ও অশালীন কথা", en: "Quarreling or indecent speech" },
  { bn: "নারীদের জন্য নিষিদ্ধ নিয়ম ভাঙা", en: "Breaking women’s Ihram rules" },
];

const TRUST = [
  { icon: Shield, bn: "বিশ্বস্ত সেবা", en: "Trusted Service" },
  { icon: Headphones, bn: "২৪/৭ সহায়তা", en: "24/7 Support" },
  { icon: Users, bn: "৫,০০০+ সন্তুষ্ট হাজী", en: "5,000+ Happy Pilgrims" },
  { icon: BadgeCheck, bn: "ATOL ও IATA সার্টিফাইড", en: "ATOL & IATA Certified" },
];

function PackageSlideCard({ pkg, bn }: { pkg: PublicPackageItem; bn: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="snap-start shrink-0 w-[260px] sm:w-[280px] lg:w-[300px]"
    >
      <Link
        to={`/packages/${pkg.slug || pkg.id}`}
        className="block bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#1B75BC]/35 transition-all group h-full"
      >
        <div className="relative aspect-[16/11] overflow-hidden bg-[#EAF5FF]">
          <img
            src={mediaUrl(pkg.image, 640, 420)}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.dataset.fallback === "1") return;
              el.dataset.fallback = "1";
              el.src = PACKAGE_IMAGE_FALLBACK;
            }}
          />
          {pkg.badge && (
            <span className="absolute top-3 left-3 bg-[#F37021] text-white text-[10px] font-bold px-3 py-1 rounded-sm uppercase tracking-wide shadow">
              {pkg.badge}
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col">
          <h3 className="font-bold text-[#002D62] text-[15px] leading-snug line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-[#1B75BC] transition-colors">
            {pkg.title}
          </h3>
          <ul className="space-y-1.5 text-[12px] text-[#6B7280] mb-4">
            <li className="flex items-center gap-2">
              <Clock size={13} className="text-[#1B75BC] flex-shrink-0" />
              <span className="truncate">{pkg.duration}</span>
            </li>
            <li className="flex items-center gap-2">
              <Plane size={13} className="text-[#1B75BC] flex-shrink-0" />
              <span className="truncate">{pkg.flight || "—"}</span>
            </li>
            <li className="flex items-center gap-2">
              <Hotel size={13} className="text-[#1B75BC] flex-shrink-0" />
              <span className="truncate">{pkg.hotel || "—"}</span>
            </li>
          </ul>
          <div className="mt-auto flex items-end justify-between gap-2 pt-3 border-t border-[#F3F4F6]">
            <p className="text-xl font-bold text-[#F37021] leading-none">
              {fmtPrice(pkg.price)}
              <span className="block mt-1 text-[10px] font-semibold text-[#9CA3AF]">{bn ? "থেকে" : "from"}</span>
            </p>
            <span className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-[#002D62] text-white text-xs font-bold group-hover:bg-[#1B75BC] transition-colors">
              {bn ? "বিস্তারিত দেখুন" : "View Details"} <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function PackageCarousel({
  title, seeAllLabel, seeAllTo, packages, loading, bn,
}: {
  title: string;
  seeAllLabel: string;
  seeAllTo: string;
  packages: PublicPackageItem[];
  loading?: boolean;
  bn: boolean;
}) {
  const reduce = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateNav = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateNav();
    el.addEventListener("scroll", updateNav, { passive: true });
    window.addEventListener("resize", updateNav);
    return () => {
      el.removeEventListener("scroll", updateNav);
      window.removeEventListener("resize", updateNav);
    };
  }, [packages.length]);

  const scrollBy = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  useEffect(() => {
    if (reduce || paused || packages.length < 2) return;
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 24;
      if (atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: 320, behavior: "smooth" });
    }, 5000);
    return () => window.clearInterval(id);
  }, [reduce, paused, packages.length]);

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-[#F37021] text-xs font-bold uppercase tracking-[0.16em] mb-1.5">
            {bn ? "প্যাকেজ" : "Packages"}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#002D62]">{title}</h2>
          <div className="mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-[#002D62] to-[#F37021]" />
        </div>
        <Link
          to={seeAllTo}
          className="text-sm font-semibold text-[#1B75BC] hover:text-[#002D62] whitespace-nowrap inline-flex items-center gap-1 group"
        >
          {seeAllLabel}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canPrev}
          className={cn(
            "hidden md:flex absolute -left-3 top-[42%] -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[#002D62] text-white items-center justify-center shadow-lg transition-all",
            canPrev ? "hover:bg-[#1B75BC]" : "opacity-35 cursor-not-allowed",
          )}
          aria-label="Previous packages"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canNext}
          className={cn(
            "hidden md:flex absolute -right-3 top-[42%] -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[#002D62] text-white items-center justify-center shadow-lg transition-all",
            canNext ? "hover:bg-[#1B75BC]" : "opacity-35 cursor-not-allowed",
          )}
          aria-label="Next packages"
        >
          <ChevronRight size={20} />
        </button>

        {loading && (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} className="h-80 w-[280px] shrink-0 rounded-xl" />)}
          </div>
        )}

        {!loading && packages.length === 0 && (
          <EmptyState message={bn ? "প্যাকেজ এখনো নেই।" : "No packages yet."} />
        )}

        {!loading && packages.length > 0 && (
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 no-scrollbar scroll-smooth touch-pan-x"
          >
            {packages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={Math.min(i, 4) * 0.05}>
                <PackageSlideCard pkg={pkg} bn={bn} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApproveHeroBackground() {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#001F45]">
      <motion.img
        src={SITE_IMAGES.kaabaHero}
        alt="কাবা শরীফ — Masjid al-Haram, Makkah"
        className="absolute inset-0 w-full h-full object-cover object-[center_45%]"
        loading="eager"
        initial={reduce ? false : { scale: 1.04 }}
        animate={reduce ? undefined : { scale: [1.04, 1.0, 1.04] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        onError={(e) => {
          // Run-once guard: swap to the remote still exactly once, never loop.
          const el = e.target as HTMLImageElement;
          if (el.dataset.fallback === "1") return;
          el.dataset.fallback = "1";
          el.src = img(SITE_IMAGES.kaabaNight, 1920, 1080);
        }}
      />
      {/* Soft left wash so Bangla headline stays readable over golden sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,20,48,0.55) 0%, rgba(0,20,48,0.28) 42%, rgba(0,20,48,0.08) 68%, transparent 82%)",
        }}
        aria-hidden
      />
    </div>
  );
}

export function Home() {
  const { i18n } = useTranslation("home");
  const bn = i18n.language?.startsWith("bn");
  usePageMeta(
    bn ? "হজ্ব, উমরাহ, ভিসা ও এয়ার টিকেট সেবা" : "Hajj, Umrah, Visa & Air Ticket Services in Bangladesh",
    "Government-approved, ATAB-licensed Hajj, Umrah, visa, air ticket, manpower and tour services in Bangladesh.",
  );
  const reduce = useReducedMotion();
  const [ruleTab, setRuleTab] = useState<"hajj" | "umrah">("hajj");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const hajjQ = usePublicPackages({ type: "Hajj", limit: 12 });
  const umrahQ = usePublicPackages({ type: "Umrah", limit: 12 });
  const allPackages = useMemo(
    () => [...(hajjQ.data?.data ?? []), ...(umrahQ.data?.data ?? [])],
    [hajjQ.data, umrahQ.data],
  );
  const packagesLoading = hajjQ.isLoading || umrahQ.isLoading;

  const ruleGuides = useMemo(() => {
    const slugs = ruleTab === "hajj" ? HAJJ_SLUGS : UMRAH_SLUGS;
    return slugs.map((s) => GUIDES.find((g) => g.slug === s)).filter(Boolean).slice(0, 8) as typeof GUIDES;
  }, [ruleTab]);

  return (
    <div className="overflow-x-hidden font-[family-name:var(--font-body)]">
      {/* ── Hero (Approve design) ── */}
      <section className="relative min-h-[78vh] md:min-h-[86vh] flex items-center overflow-hidden pb-16 md:pb-20">
        <ApproveHeroBackground />

        <div className="relative max-w-[1240px] w-full mx-auto px-4 md:px-5 py-16 md:py-24">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[38rem]"
          >
            <h1 className="text-[1.75rem] sm:text-4xl md:text-[2.75rem] lg:text-[3.15rem] font-bold leading-[1.25] tracking-tight text-white drop-shadow-sm">
              {bn ? (
                <>
                  বিশ্বস্ততায় আমরাই আপনার{" "}
                  <span className="text-[#F37021]">হজ্ব ও ওমরাহ</span>{" "}
                  যাত্রার সেরা সাথী
                </>
              ) : (
                <>
                  Your trusted partner for{" "}
                  <span className="text-[#F37021]">Hajj & Umrah</span>{" "}
                  journeys
                </>
              )}
            </h1>

            <p className="mt-4 text-[14px] md:text-[16px] text-white/90 max-w-lg leading-relaxed font-medium">
              {bn
                ? "সরকার অনুমোদিত এজেন্সি — নিরাপদ ফ্লাইট, মানসম্মত হোটেল এবং অভিজ্ঞ গাইডের সাথে আপনার ইবাদতের যাত্রা হোক নিশ্চিন্ত।"
                : "Government-approved agency — safe flights, quality hotels and experienced guides for a peaceful pilgrimage."}
            </p>

            {/* Trust badges — four light boxes like Approve mock */}
            <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-2.5 max-w-xl">
              {TRUST.map((item, i) => (
                <motion.div
                  key={item.en}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.05 }}
                  className="flex flex-col items-start gap-2 rounded-lg bg-[#EAF5FF]/95 border border-white/40 px-3 py-3 shadow-sm backdrop-blur-sm"
                >
                  <span className="w-8 h-8 rounded-md bg-white text-[#1B75BC] flex items-center justify-center shadow-sm">
                    <item.icon size={16} />
                  </span>
                  <span className="text-[11px] md:text-[12px] font-bold text-[#002D62] leading-snug">
                    {bn ? item.bn : item.en}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <motion.div whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/packages"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#002D62] text-white font-bold text-sm rounded-md hover:bg-[#001F45] transition-colors shadow-lg shadow-black/25"
                >
                  {bn ? "হজ্ব ও ওমরাহ প্যাকেজ দেখুন" : "View Hajj & Umrah Packages"}
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Service icon grid — floating over soft blue wash ── */}
      <section className="relative z-20 -mt-10 md:-mt-14 mb-2 px-4 md:px-5">
        <div
          className="max-w-[1240px] mx-auto rounded-2xl border border-[#B8D4ED] shadow-[0_16px_48px_rgba(0,45,98,0.14)] px-3 py-4 md:px-5 md:py-5 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #FFFFFF 0%, #EAF5FF 45%, #FFF4ED 100%)",
          }}
        >
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 md:gap-3">
            {SERVICES.map((s, i) => (
              <Reveal key={s.to} delay={i * 0.03}>
                <motion.div whileHover={reduce ? undefined : { y: -4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={s.to}
                    className="flex flex-col items-center justify-center text-center gap-2.5 p-2.5 md:p-3 min-h-[100px] md:min-h-[112px] rounded-xl bg-white/80 border border-white hover:border-[#1B75BC]/40 hover:shadow-lg transition-all"
                  >
                    <span
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ background: `${s.color}18`, color: s.color }}
                    >
                      <s.icon size={22} strokeWidth={1.75} />
                    </span>
                    <span className="text-[11px] md:text-[12px] font-semibold text-[#002D62] leading-snug">
                      {bn ? s.titleBn : s.titleEn}
                    </span>
                  </Link>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rules & Guidelines — navy atmosphere ── */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #001F45 0%, #002D62 42%, #0A4A8A 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #F37021 0, transparent 28%), radial-gradient(circle at 85% 70%, #7EB8E3 0, transparent 32%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-5">
          <div className="text-center mb-9">
            <p className="text-[#F37021] text-xs font-bold uppercase tracking-[0.18em] mb-2">
              {bn ? "জ্ঞান কেন্দ্র" : "Knowledge Hub"}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {bn ? "হজ্ব ও ওমরাহ এর নিয়ম ও করণীয়" : "Rules and Duties of Hajj & Umrah"}
            </h2>
            <div className="mt-5 flex justify-center gap-2">
              {(["hajj", "umrah"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRuleTab(tab)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-sm font-bold transition-colors border",
                    ruleTab === tab
                      ? "bg-[#F37021] text-white border-[#F37021] shadow-md"
                      : "bg-white/10 text-white border-white/25 hover:bg-white/20",
                  )}
                >
                  {tab === "hajj" ? (bn ? "হজ্ব নিয়ম" : "Hajj Rules") : (bn ? "উমরাহ নিয়ম" : "Umrah Rules")}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={ruleTab}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
            >
              {ruleGuides.map((g, i) => (
                <motion.div key={g.slug} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link
                    to={`/knowledge/${g.slug}`}
                    className="flex flex-col p-5 bg-white/95 border border-white/20 rounded-xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all h-full"
                  >
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#EAF5FF] to-[#D6EBFA] text-[#1B75BC] flex items-center justify-center mb-3">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="font-bold text-[#002D62] mb-1.5 text-[15px]">{bn ? g.titleBn : g.titleEn}</h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2 flex-1 mb-3">
                      {bn ? g.summaryBn : g.summaryEn}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#F37021]">
                      {bn ? "বিস্তারিত দেখুন" : "View Details"} <ArrowRight size={14} />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 text-center">
            <Link
              to="/knowledge"
              className="inline-flex items-center gap-2 px-10 py-3.5 bg-white text-[#002D62] font-bold text-sm rounded-md hover:bg-[#FFF4ED] transition-colors shadow-lg"
            >
              {bn ? "হজ্বের সব ধাপ বিস্তারিত দেখুন" : "View All Steps for Hajj in Detail"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Popular Packages — soft sky band ── */}
      <section
        className="relative py-14 md:py-16 overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #E8F3FC 0%, #F5F8FC 40%, #FFF6F0 100%)",
        }}
      >
        <div
          className="absolute -right-20 top-10 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: "#7EB8E3" }}
          aria-hidden
        />
        <div
          className="absolute -left-16 bottom-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: "#F37021" }}
          aria-hidden
        />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-5">
          <PackageCarousel
            bn={!!bn}
            title={bn ? "জনপ্রিয় হজ্ব ও ওমরাহ প্যাকেজ" : "Popular Hajj & Umrah Packages"}
            seeAllLabel={bn ? "সব প্যাকেজ দেখুন" : "View All Packages"}
            seeAllTo="/packages"
            packages={allPackages}
            loading={packagesLoading}
          />
        </div>
      </section>

      {/* ── Sunnah & Prohibitions — light mint band ── */}
      <section
        className="relative py-14 md:py-20 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #E8F8F1 0%, #F3FAF7 55%, #EEF6FF 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 20%, rgba(22,163,74,0.18) 0, transparent 40%), radial-gradient(circle at 88% 70%, rgba(243,112,33,0.12) 0, transparent 36%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-5">
          <div className="text-center mb-8">
            <p className="text-[#16A34A] text-xs font-bold uppercase tracking-[0.18em] mb-2">
              {bn ? "ইবাদতের দিকনির্দেশনা" : "Guidance for Worship"}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#002D62]">
              {bn ? "সুন্নাহ ও নিষিদ্ধ কাজসমূহ" : "Sunnah & Prohibited Acts"}
            </h2>
            <div className="mt-3 mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-[#F37021]" />
          </div>
          <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
            <Reveal>
              <div className="relative rounded-xl overflow-hidden border border-emerald-200 shadow-md min-h-[320px] flex flex-col bg-white">
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-emerald-300" />
                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-emerald-700 mb-4 inline-flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><Check size={16} /></span>
                    {bn ? "সুন্নাহ কাজসমূহ" : "Sunnah Acts"}
                  </h3>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {SUNNAH.map((item) => (
                      <li key={item.en} className="flex gap-2 text-sm text-[#374151]">
                        <Check size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                        {bn ? item.bn : item.en}
                      </li>
                    ))}
                  </ul>
                  <Link to="/knowledge/what-is-ihram"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors w-fit">
                    {bn ? "সব সুন্নাহ দেখুন" : "See All Sunnah"} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="relative rounded-xl overflow-hidden border border-red-200 shadow-md min-h-[320px] flex flex-col bg-white">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#F37021] to-red-500" />
                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-red-600 mb-4 inline-flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><X size={16} /></span>
                    {bn ? "নিষিদ্ধ কাজসমূহ" : "Prohibited Acts"}
                  </h3>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {PROHIBITIONS.map((item) => (
                      <li key={item.en} className="flex gap-2 text-sm text-[#374151]">
                        <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        {bn ? item.bn : item.en}
                      </li>
                    ))}
                  </ul>
                  <Link to="/knowledge/things-that-break-ihram"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors w-fit">
                    {bn ? "সব নিষেধ দেখুন" : "See All Prohibitions"} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>


      {/* ── Stats — brand orange band (clear break) ── */}
      <section
        className="relative py-12 md:py-14 overflow-hidden"
        style={{
          background: "linear-gradient(105deg, #F37021 0%, #E85A12 45%, #CC3C17 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.35) 0, transparent 40%), radial-gradient(circle at 80% 30%, rgba(0,45,98,0.25) 0, transparent 35%)",
          }}
          aria-hidden
        />
        <Plane size={88} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/15 -rotate-12 hidden md:block" aria-hidden />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-5 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-3">
          {[
            { Icon: Users, end: 100, suffix: "K+", label: bn ? "সন্তুষ্ট যাত্রী" : "Satisfied Travelers" },
            { Icon: BadgeCheck, end: 12, suffix: "+", label: bn ? "বছরের অভিজ্ঞতা" : "Years Experience" },
            { Icon: MapPin, end: 25, suffix: "+", label: bn ? "দেশে সেবা" : "Countries Served" },
            { Icon: Star, end: 500, suffix: "+", label: bn ? "হজ্ব গ্রুপ" : "Hajj Groups" },
            { Icon: Shield, end: 98, suffix: "%", label: bn ? "ভিসা সফলতা" : "Visa Success Rate" },
          ].map(({ Icon, end, suffix, label }) => (
            <div key={label} className="text-center flex flex-col items-center rounded-xl bg-white/15 border border-white/25 px-3 py-4 backdrop-blur-sm">
              <Icon size={22} className="text-white mb-2" />
              <StatCounter end={end} suffix={suffix} label={label} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter — warm light band before dark footer ── */}
      <section
        className="relative py-14 md:py-16 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #FFF4ED 0%, #FFE8D9 50%, #FFF7F2 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 60%, rgba(243,112,33,0.2) 0, transparent 35%), radial-gradient(circle at 90% 30%, rgba(27,117,188,0.15) 0, transparent 35%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-5">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 rounded-2xl border border-[#F5C9A8] bg-white shadow-[0_12px_40px_rgba(243,112,33,0.12)] px-5 py-6 md:px-8 md:py-7">
            <div className="flex items-start gap-4 flex-1">
              <span className="hidden sm:flex w-12 h-12 rounded-xl bg-[#FFF1E8] text-[#F37021] items-center justify-center flex-shrink-0">
                <Plane size={22} />
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#002D62]">
                  {bn ? "সর্বশেষ অফার ও আপডেট পেতে সাবস্ক্রাইব করুন" : "Subscribe for latest offers & updates"}
                </h2>
                <p className="text-[#6B7280] text-sm mt-1">
                  {bn ? "নতুন প্যাকেজ ও গাইড সরাসরি আপনার ইনবক্সে।" : "New packages and guides delivered to your inbox."}
                </p>
              </div>
            </div>
            {subscribed ? (
              <p className="text-[#16A34A] font-semibold bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-md">
                {bn ? "ধন্যবাদ! সাবস্ক্রিপশন সম্পন্ন।" : "Thank you! You’re subscribed."}
              </p>
            ) : (
              <form
                className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:min-w-[420px]"
                onSubmit={(e) => { e.preventDefault(); setEmail(""); setSubscribed(true); }}
              >
                <label className="sr-only" htmlFor="home-newsletter">Email</label>
                <input
                  id="home-newsletter"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={bn ? "আপনার ইমেইল" : "Your email"}
                  className="flex-1 px-4 py-3 rounded-md bg-[#F8FAFC] border border-[#E5E7EB] text-[#002D62] text-sm outline-none focus:ring-2 focus:ring-[#F37021] focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#F37021] hover:bg-[#D85A12] text-white font-bold text-sm rounded-md transition-colors whitespace-nowrap"
                >
                  {bn ? "সাবস্ক্রাইব করুন" : "Subscribe"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
