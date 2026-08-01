import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Star, MapPin, Shield, Plane, Hotel, Globe, Car, Umbrella,
  Play, ArrowRight, ChevronLeft, ChevronRight, Check, X,
  Clock, Headphones, Users, BadgeCheck, BookOpen,
} from "lucide-react";
import { Reveal, SkeletonBlock, EmptyState, StatCounter } from "../website/primitives";
import { usePublicPackages } from "../hooks/publicContent";
import { GUIDES } from "../website/knowledge/guides";
import { SITE_VIDEOS, videoThumb, type SiteVideo } from "../website/videos";
import { VideoPlayerModal } from "../website/VideoPlayerModal";
import { SITE_IMAGES, mediaUrl, img, fmtPrice, cn } from "../lib/utils";
import type { PublicPackageItem } from "../hooks/publicContent";

const SERVICES = [
  { to: "/hajj", icon: Star, titleBn: "হজ্ব প্যাকেজ", titleEn: "Hajj Package", color: "#1B75BC" },
  { to: "/umrah", icon: MapPin, titleBn: "উমরাহ প্যাকেজ", titleEn: "Umrah Package", color: "#F15A24" },
  { to: "/visa", icon: Shield, titleBn: "ভিসা সার্ভিস", titleEn: "Visa Service", color: "#062D63" },
  { to: "/air-ticket", icon: Plane, titleBn: "এয়ার টিকেট", titleEn: "Air Ticket", color: "#1B75BC" },
  { to: "/tour-packages", icon: Globe, titleBn: "ট্যুর প্যাকেজ", titleEn: "Tour Package", color: "#16A34A" },
  { to: "/hotel-booking", icon: Hotel, titleBn: "হোটেল বুকিং", titleEn: "Hotel Booking", color: "#C89B3C" },
  { to: "/transport", icon: Car, titleBn: "পরিবহন সেবা", titleEn: "Transport", color: "#1B75BC" },
  { to: "/faq", icon: Umbrella, titleBn: "ট্রাভেল ইন্স্যুরেন্স", titleEn: "Travel Insurance", color: "#F15A24" },
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
  { icon: Shield, bn: "বিশ্বস্ত সেবা", en: "Trusted Service", subBn: "১০+ বছরের অভিজ্ঞতা", subEn: "10+ years experience" },
  { icon: Headphones, bn: "২৪/৭ সাপোর্ট", en: "24/7 Support", subBn: "সবসময় পাশে", subEn: "Always with you" },
  { icon: Users, bn: "৫,০০০+ সফল যাত্রী", en: "5,000+ Travelers", subBn: "সন্তুষ্ট হাজি", subEn: "Happy pilgrims" },
  { icon: BadgeCheck, bn: "ATOL ও IATA", en: "ATOL & IATA", subBn: "সনদপ্রাপ্ত এজেন্সি", subEn: "Certified agency" },
];

function PackageSlideCard({ pkg, bn }: { pkg: PublicPackageItem; bn: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="snap-start shrink-0 w-[260px] sm:w-[280px] lg:w-[300px]"
    >
      <Link
        to={`/packages/${pkg.slug || pkg.id}`}
        className="block bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#1B75BC]/40 transition-all group h-full"
      >
        <div className="relative aspect-[16/11] overflow-hidden">
          <img
            src={mediaUrl(pkg.image, 640, 420)}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#062D63]/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {pkg.badge && (
            <span className="absolute top-3 left-3 bg-[#F15A24] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
              {pkg.badge}
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col">
          <h3 className="font-bold text-[#062D63] text-[15px] leading-snug line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-[#1B75BC] transition-colors">
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
            <p className="text-xl font-bold text-[#F15A24] leading-none">
              {fmtPrice(pkg.price)}
              <span className="block mt-1 text-[10px] font-semibold text-[#9CA3AF]">{bn ? "থেকে" : "from"}</span>
            </p>
            <span className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-[#1B75BC] text-[#1B75BC] text-xs font-bold bg-white group-hover:bg-[#1B75BC] group-hover:text-white transition-colors">
              {bn ? "বিস্তারিত দেখুন" : "View Details"} <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function PackageCarouselSection({
  title, seeAllLabel, seeAllTo, packages, loading, bn, accent = "hajj",
}: {
  title: string;
  seeAllLabel: string;
  seeAllTo: string;
  packages: PublicPackageItem[];
  loading?: boolean;
  bn: boolean;
  accent?: "hajj" | "umrah";
}) {
  const reduce = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [activeDot, setActiveDot] = useState(0);

  const updateNav = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
    const cardW = 300;
    setActiveDot(Math.round(el.scrollLeft / cardW));
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
    }, accent === "hajj" ? 4800 : 5200);
    return () => window.clearInterval(id);
  }, [reduce, paused, packages.length, accent]);

  const tone = accent === "hajj"
    ? { chip: "bg-[#EAF5FF] text-[#1B75BC]", bar: "from-[#062D63] to-[#1B75BC]" }
    : { chip: "bg-[#FFF3ED] text-[#F15A24]", bar: "from-[#F15A24] to-[#C89B3C]" };

  const dots = Math.max(1, packages.length - 2);

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold mb-2", tone.chip)}>
            {accent === "hajj" ? (bn ? "হজ্ব" : "Hajj") : (bn ? "উমরাহ" : "Umrah")}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#062D63]">{title}</h2>
          <div className={cn("mt-2 h-1 w-16 rounded-full bg-gradient-to-r", tone.bar)} />
        </div>
        <Link
          to={seeAllTo}
          className="text-sm font-semibold text-[#1B75BC] hover:text-[#062D63] whitespace-nowrap inline-flex items-center gap-1 group"
        >
          {seeAllLabel}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <motion.button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canPrev}
          whileHover={reduce || !canPrev ? undefined : { scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "hidden md:flex absolute -left-3 top-[42%] -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[#1B75BC] text-white items-center justify-center shadow-lg transition-all",
            canPrev ? "hover:bg-[#14588F]" : "opacity-35 cursor-not-allowed",
          )}
          aria-label="Previous packages"
        >
          <ChevronLeft size={20} />
        </motion.button>
        <motion.button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canNext}
          whileHover={reduce || !canNext ? undefined : { scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "hidden md:flex absolute -right-3 top-[42%] -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[#1B75BC] text-white items-center justify-center shadow-lg transition-all",
            canNext ? "hover:bg-[#14588F]" : "opacity-35 cursor-not-allowed",
          )}
          aria-label="Next packages"
        >
          <ChevronRight size={20} />
        </motion.button>

        {loading && (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} className="h-80 w-[280px] shrink-0 rounded-xl" />)}
          </div>
        )}

        {!loading && packages.length === 0 && (
          <EmptyState message={bn ? "এই ধরনের প্যাকেজ এখনো নেই।" : "No packages in this category yet."} />
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

        {packages.length > 3 && (
          <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
            {Array.from({ length: dots }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollerRef.current?.scrollTo({ left: i * 320, behavior: "smooth" })}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === activeDot ? "w-6 bg-[#F15A24]" : "w-1.5 bg-[#D1D5DB] hover:bg-[#9CA3AF]",
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Single night Kaaba Sharif hero — locked to approved Image A pattern */
function KaabaHeroBackground() {
  const reduce = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#EAF5FF]">
      <motion.img
        src="/hero-kaaba.jpg"
        alt="কাবা শরীফ — Dhaka to Saudi Arabia Hajj & Umrah journey"
        className="absolute inset-0 w-full h-full object-cover object-[55%_45%]"
        loading="eager"
        initial={reduce ? false : { scale: 1.04 }}
        animate={reduce ? undefined : { scale: [1.04, 1.0, 1.04] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/hero-kaaba.png";
        }}
      />
      {/* Soft left wash so navy/orange headline stays readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent md:via-white/70 md:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/55 via-transparent to-white/10" />
    </div>
  );
}

export function Home() {
  const { i18n } = useTranslation("home");
  const bn = i18n.language?.startsWith("bn");
  const reduce = useReducedMotion();
  const [ruleTab, setRuleTab] = useState<"hajj" | "umrah">("hajj");
  const [activeVideo, setActiveVideo] = useState<SiteVideo | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const hajjQ = usePublicPackages({ type: "Hajj", limit: 12 });
  const umrahQ = usePublicPackages({ type: "Umrah", limit: 12 });
  const hajjPackages = hajjQ.data?.data ?? [];
  const umrahPackages = umrahQ.data?.data ?? [];

  const ruleGuides = useMemo(() => {
    const slugs = ruleTab === "hajj" ? HAJJ_SLUGS : UMRAH_SLUGS;
    return slugs.map((s) => GUIDES.find((g) => g.slug === s)).filter(Boolean).slice(0, 8) as typeof GUIDES;
  }, [ruleTab]);

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero: Image A night Kaaba + left copy ── */}
      <section className="relative min-h-[72vh] md:min-h-[82vh] flex items-end md:items-center overflow-hidden pb-24 md:pb-28">
        <KaabaHeroBackground />

        <div className="relative max-w-[1240px] w-full mx-auto px-4 md:px-5 py-16 md:py-24">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl"
          >
            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-[3.15rem] font-bold text-[#062D63] leading-[1.22] tracking-tight">
              {bn ? (
                <>বিশ্বস্ততায় আমরাই আপনার<br /><span className="text-[#F15A24]">হজ্ব ও উমরাহ</span> যাত্রার সেরা সাথী</>
              ) : (
                <>Your most trusted partner for<br /><span className="text-[#F15A24]">Hajj & Umrah</span> journeys</>
              )}
            </h1>
            <p className="mt-4 text-[15px] md:text-base text-[#374151] max-w-md leading-relaxed">
              {bn
                ? "হজ্ব, উমরাহ, ভিসা, এয়ার টিকেট ও সম্পূর্ণ প্যাকেজ — লাইসেন্সপ্রাপ্ত এজেন্সির নিরাপদ ও স্বচ্ছ সেবায়।"
                : "Hajj, Umrah, visa, air tickets and complete packages — safe, transparent service from a licensed agency."}
            </p>

            {/* Trust strip — Image A horizontal white cards */}
            <div className="mt-7 grid grid-cols-2 gap-2 max-w-lg">
              {TRUST.map((item, i) => (
                <motion.div
                  key={item.en}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="flex items-center gap-2.5 bg-white border border-[#D6EAF8] rounded-lg px-3 py-2.5 shadow-sm"
                >
                  <span className="w-8 h-8 rounded-md bg-[#EAF5FF] text-[#1B75BC] flex items-center justify-center flex-shrink-0">
                    <item.icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold text-[#062D63] leading-tight">{bn ? item.bn : item.en}</span>
                    <span className="block text-[10px] text-[#6B7280] leading-tight">{bn ? item.subBn : item.subEn}</span>
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <motion.div whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/packages"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#062D63] text-white font-bold text-sm rounded-md hover:bg-[#041E42] transition-colors shadow-md"
                >
                  {bn ? "হজ্ব ও উমরাহ প্যাকেজ দেখুন" : "See Hajj & Umrah Packages"}
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
              <motion.button
                type="button"
                onClick={() => setActiveVideo(SITE_VIDEOS[0])}
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2.5 px-5 py-3.5 bg-white border-2 border-[#F15A24] text-[#F15A24] font-bold text-sm rounded-md hover:bg-[#FFF7F4] transition-colors shadow-sm"
              >
                <span className="w-7 h-7 rounded-full border-2 border-[#F15A24] text-[#F15A24] flex items-center justify-center">
                  <Play size={12} className="ml-0.5 fill-current" />
                </span>
                {bn ? "আমাদের ভিডিও দেখুন" : "Watch Our Video"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {activeVideo && (
        <VideoPlayerModal video={activeVideo} bn={!!bn} onClose={() => setActiveVideo(null)} />
      )}

      {/* ── Floating service bar (overlaps hero — Image A) ── */}
      <section className="relative z-20 -mt-16 md:-mt-20 mb-2 px-4 md:px-5">
        <div className="max-w-[1240px] mx-auto bg-white rounded-xl border border-[#E5E7EB] shadow-[0_12px_40px_rgba(6,45,99,0.12)] px-2 py-3 md:px-3 md:py-4">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-1 md:gap-2">
            {SERVICES.map((s, i) => (
              <Reveal key={s.to} delay={i * 0.03}>
                <motion.div whileHover={reduce ? undefined : { y: -4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={s.to}
                    className="flex flex-col items-center justify-center text-center gap-2 p-2.5 md:p-3 min-h-[96px] md:min-h-[108px] rounded-lg hover:bg-[#EAF5FF]/70 transition-colors"
                  >
                    <span
                      className="w-11 h-11 rounded-lg flex items-center justify-center"
                      style={{ background: `${s.color}14`, color: s.color }}
                    >
                      <s.icon size={24} strokeWidth={1.6} />
                    </span>
                    <span className="text-[11px] md:text-[12px] font-semibold text-[#062D63] leading-snug">
                      {bn ? s.titleBn : s.titleEn}
                    </span>
                  </Link>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rules & Guidelines ── */}
      <section className="bg-white py-14 md:py-20">
        <div className="max-w-[1240px] mx-auto px-4 md:px-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-[#062D63]">
                {bn ? "হজ্ব ও উমরাহ এর নিয়ম ও করণীয়" : "Rules and Duties of Hajj & Umrah"}
              </h2>
              <p className="mt-2 text-sm text-[#6B7280] max-w-xl">
                {bn
                  ? "কুরআন ও সুন্নাহ ভিত্তিক ধাপে ধাপে নির্দেশিকা — নিয়ত থেকে তাওয়াফে বিদায় পর্যন্ত।"
                  : "Step-by-step guidance from Quran & Sunnah — from intention to farewell Tawaf."}
              </p>
            </div>
            <div className="flex justify-center gap-2 p-1 bg-[#EAF5FF] rounded-full w-fit mx-auto md:mx-0">
              {(["hajj", "umrah"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRuleTab(tab)}
                  className={cn(
                    "relative px-5 py-2 rounded-full text-sm font-bold transition-colors",
                    ruleTab === tab ? "text-white" : "text-[#1B75BC] hover:text-[#062D63]",
                  )}
                >
                  {ruleTab === tab && (
                    <motion.span
                      layoutId="ruleTabPill"
                      className="absolute inset-0 bg-[#062D63] rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    {tab === "hajj" ? (bn ? "হজ্ব নিয়ম" : "Hajj Rules") : (bn ? "উমরাহ নিয়ম" : "Umrah Rules")}
                  </span>
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
                    className="flex flex-col p-5 bg-white border border-[#E5E7EB] rounded-lg hover:border-[#1B75BC]/40 hover:shadow-lg hover:-translate-y-1 transition-all h-full"
                  >
                    <div className="w-11 h-11 rounded-md bg-[#EAF5FF] text-[#1B75BC] flex items-center justify-center mb-3">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="font-bold text-[#062D63] mb-1.5 text-[15px]">{bn ? g.titleBn : g.titleEn}</h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2 flex-1 mb-3">
                      {bn ? g.summaryBn : g.summaryEn}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1B75BC]">
                      {bn ? "বিস্তারিত দেখুন" : "View Details"} <ArrowRight size={14} />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 text-center">
            <motion.div className="inline-block" whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/knowledge"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#062D63] text-white font-bold text-sm rounded-md hover:bg-[#041E42] transition-colors"
              >
                {bn ? "হজ্বের সব ধাপ বিস্তারিত দেখুন" : "View All Steps for Hajj in Detail"}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Hajj packages carousel ── */}
      <section className="bg-[#F7F8FA] py-14 md:py-16">
        <div className="max-w-[1240px] mx-auto px-4 md:px-5">
          <PackageCarouselSection
            accent="hajj"
            bn={!!bn}
            title={bn ? "জনপ্রিয় হজ্ব প্যাকেজ" : "Popular Hajj Packages"}
            seeAllLabel={bn ? "সব হজ্ব প্যাকেজ দেখুন" : "See all Hajj packages"}
            seeAllTo="/packages?type=Hajj"
            packages={hajjPackages}
            loading={hajjQ.isLoading}
          />
        </div>
      </section>

      {/* ── Umrah packages carousel ── */}
      <section className="bg-white py-14 md:py-16">
        <div className="max-w-[1240px] mx-auto px-4 md:px-5">
          <PackageCarouselSection
            accent="umrah"
            bn={!!bn}
            title={bn ? "জনপ্রিয় উমরাহ প্যাকেজ" : "Popular Umrah Packages"}
            seeAllLabel={bn ? "সব উমরাহ প্যাকেজ দেখুন" : "See all Umrah packages"}
            seeAllTo="/packages?type=Umrah"
            packages={umrahPackages}
            loading={umrahQ.isLoading}
          />
        </div>
      </section>

      {/* ── Sunnah & Prohibitions ── */}
      <section className="relative py-14 md:py-20 overflow-hidden bg-[#F0F7FC]">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url(${img(SITE_IMAGES.madinah, 1600, 800)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-5">
          <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-8 items-center">
            <Reveal>
              <motion.div whileHover={reduce ? undefined : { y: -4 }} className="bg-white/95 border border-emerald-200 rounded-xl p-6 md:p-7 shadow-sm h-full">
                <h3 className="text-lg font-bold text-emerald-700 mb-4 inline-flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><Check size={16} /></span>
                  {bn ? "সুন্নাতসমূহ" : "Sunnah Acts"}
                </h3>
                <ul className="space-y-2.5 mb-6">
                  {SUNNAH.map((item) => (
                    <li key={item.en} className="flex gap-2 text-sm text-[#374151]">
                      <Check size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                      {bn ? item.bn : item.en}
                    </li>
                  ))}
                </ul>
                <Link to="/knowledge/what-is-ihram"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors">
                  {bn ? "সব সুন্নাত দেখুন" : "View All Sunnahs"} <ArrowRight size={14} />
                </Link>
              </motion.div>
            </Reveal>

            <Reveal delay={0.08} className="hidden lg:flex justify-center">
              <motion.div
                className="w-44 h-44 xl:w-52 xl:h-52 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-[#C89B3C]/30"
                animate={reduce ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src="/hero-kaaba.jpg" alt="Masjid al-Haram, Makkah" className="w-full h-full object-cover object-center" loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = img(SITE_IMAGES.madinah, 400, 400); }} />
              </motion.div>
            </Reveal>

            <Reveal delay={0.12}>
              <motion.div whileHover={reduce ? undefined : { y: -4 }} className="bg-white/95 border border-red-200 rounded-xl p-6 md:p-7 shadow-sm h-full relative">
                <img
                  src={img(SITE_IMAGES.pilgrims, 280, 200)}
                  alt=""
                  className="hidden xl:block absolute -right-2 -bottom-2 w-28 h-28 object-cover rounded-lg opacity-90 shadow-md border-2 border-white"
                  loading="lazy"
                />
                <h3 className="text-lg font-bold text-red-600 mb-4 inline-flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><X size={16} /></span>
                  {bn ? "নিষিদ্ধ কাজ" : "Prohibitions"}
                </h3>
                <ul className="space-y-2.5 mb-6">
                  {PROHIBITIONS.map((item) => (
                    <li key={item.en} className="flex gap-2 text-sm text-[#374151]">
                      <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                      {bn ? item.bn : item.en}
                    </li>
                  ))}
                </ul>
                <Link to="/knowledge/things-that-break-ihram"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-red-500 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
                  {bn ? "সব নিষেধ দেখুন" : "View All Prohibitions"} <ArrowRight size={14} />
                </Link>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Video tutorials ── */}
      <section className="bg-white py-14 md:py-20">
        <div className="max-w-[1240px] mx-auto px-4 md:px-5">
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#062D63]">
              {bn ? "টিউটোরিয়াল ও গাইড ভিডিও" : "Video Tutorials & Guides"}
            </h2>
            <Link to="/videos" className="text-sm font-semibold text-[#1B75BC] hover:underline whitespace-nowrap inline-flex items-center gap-1">
              {bn ? "সব ভিডিও দেখুন" : "View All Videos"} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {SITE_VIDEOS.slice(0, 5).map((v, i) => (
              <Reveal key={v.id} delay={i * 0.04}>
                <motion.button
                  type="button"
                  onClick={() => setActiveVideo(v)}
                  className="group block w-full text-left"
                  whileHover={reduce ? undefined : { y: -4 }}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-[#062D63]">
                    <img
                      src={videoThumb(v)}
                      alt={bn ? v.titleBn : v.titleEn}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="w-11 h-11 rounded-full bg-white/95 text-[#F15A24] flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                        <Play size={18} className="ml-0.5 fill-current" />
                      </span>
                    </div>
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-medium">
                      {v.duration}
                    </span>
                  </div>
                  <p className="mt-2 text-xs md:text-sm font-semibold text-[#062D63] leading-snug line-clamp-2">
                    {bn ? v.titleBn : v.titleEn}
                  </p>
                </motion.button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="relative bg-[#062D63] py-10 md:py-12 overflow-hidden">
        <motion.div
          className="absolute right-4 md:right-16 top-1/2 -translate-y-1/2 text-white/10"
          animate={reduce ? undefined : { x: [0, 24, 0], rotate: [-12, -6, -12] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <Plane size={120} />
        </motion.div>
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-5 grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
          <div className="text-center md:text-left flex md:block flex-col items-center">
            <Users size={22} className="text-[#1B75BC] mb-2" />
            <StatCounter end={100} suffix="K+" label={bn ? "সন্তুষ্ট যাত্রী" : "Satisfied Travelers"} />
          </div>
          <div className="text-center md:text-left flex md:block flex-col items-center">
            <BadgeCheck size={22} className="text-[#1B75BC] mb-2" />
            <StatCounter end={12} suffix="+" label={bn ? "বছরের অভিজ্ঞতা" : "Years Experience"} />
          </div>
          <div className="text-center md:text-left flex md:block flex-col items-center">
            <MapPin size={22} className="text-[#1B75BC] mb-2" />
            <StatCounter end={25} suffix="+" label={bn ? "দেশে সেবা" : "Countries Served"} />
          </div>
          <div className="text-center md:text-left flex md:block flex-col items-center">
            <Star size={22} className="text-[#1B75BC] mb-2" />
            <StatCounter end={500} suffix="+" label={bn ? "হজ্ব গ্রুপ" : "Hajj Groups"} />
          </div>
          <div className="text-center md:text-left flex md:block flex-col items-center">
            <Shield size={22} className="text-[#1B75BC] mb-2" />
            <StatCounter end={98} suffix="%" label={bn ? "ভিসা সফলতা" : "Visa Success Rate"} />
          </div>
        </div>
      </section>

      {/* ── Newsletter — Image A bright blue wave band ── */}
      <section className="relative py-12 md:py-14 overflow-hidden bg-[#1B75BC]">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.35) 0, transparent 40%), radial-gradient(circle at 80% 30%, rgba(241,90,36,0.35) 0, transparent 35%), url(\"data:image/svg+xml,%3Csvg width='120' height='40' viewBox='0 0 120 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q 30 0 60 20 T 120 20 V40 H0Z' fill='%23ffffff' fill-opacity='0.08'/%3E%3C/svg%3E\")",
            backgroundSize: "auto, auto, 240px 40px",
            backgroundRepeat: "no-repeat, no-repeat, repeat-x",
            backgroundPosition: "left, right, bottom",
          }}
          aria-hidden
        />
        <Plane size={72} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 -rotate-12 hidden md:block" aria-hidden />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-5">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {bn ? "সর্বশেষ অফার ও আপডেট পেতে সাবস্ক্রাইব করুন" : "Subscribe for latest offers & updates"}
              </h2>
              <p className="text-white/85 text-sm mt-1">
                {bn ? "নতুন প্যাকেজ ও গাইড সরাসরি আপনার ইনবক্সে।" : "New packages and guides delivered to your inbox."}
              </p>
            </div>
            {subscribed ? (
              <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-white font-semibold bg-white/15 px-5 py-3 rounded-md">
                {bn ? "ধন্যবাদ! সাবস্ক্রিপশন সম্পন্ন।" : "Thank you! You’re subscribed."}
              </motion.p>
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
                  className="flex-1 px-4 py-3 rounded-md bg-white text-[#062D63] text-sm outline-none focus:ring-2 focus:ring-[#C89B3C]"
                />
                <motion.button
                  type="submit"
                  whileHover={reduce ? undefined : { scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-[#F15A24] hover:bg-[#CC3C17] text-white font-bold text-sm rounded-md transition-colors whitespace-nowrap"
                >
                  {bn ? "সাবস্ক্রাইব করুন" : "Subscribe"}
                </motion.button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
