import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Star, MapPin, Shield, Plane, Hotel, Globe, Car, Umbrella,
  Play, ArrowRight, ChevronLeft, ChevronRight, Check, X,
  Clock, Headphones, Users, BadgeCheck, BookOpen,
} from "lucide-react";
import { Reveal, SkeletonBlock, EmptyState, ErrorState, StatCounter } from "../website/primitives";
import { usePublicPackages } from "../hooks/publicContent";
import { GUIDES } from "../website/knowledge/guides";
import { SITE_VIDEOS } from "../website/videos";
import { SITE_IMAGES, mediaUrl, img, fmtPrice, cn } from "../lib/utils";
import type { PublicPackageItem } from "../hooks/publicContent";

const SERVICES = [
  { to: "/hajj", icon: Star, titleBn: "হজ্ব প্যাকেজ", titleEn: "Hajj Package" },
  { to: "/umrah", icon: MapPin, titleBn: "উমরাহ প্যাকেজ", titleEn: "Umrah Package" },
  { to: "/visa", icon: Shield, titleBn: "ভিসা সার্ভিস", titleEn: "Visa Service" },
  { to: "/air-ticket", icon: Plane, titleBn: "এয়ার টিকেট", titleEn: "Air Ticket" },
  { to: "/tour-packages", icon: Globe, titleBn: "ট্যুর প্যাকেজ", titleEn: "Tour Package" },
  { to: "/hotel-booking", icon: Hotel, titleBn: "হোটেল", titleEn: "Hotel" },
  { to: "/transport", icon: Car, titleBn: "পরিবহন", titleEn: "Transport" },
  { to: "/faq", icon: Umbrella, titleBn: "ট্রাভেল ইন্স্যুরেন্স", titleEn: "Travel Insurance" },
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
  { icon: Headphones, bn: "২৪/৭ সাপোর্ট", en: "24/7 Support" },
  { icon: Users, bn: "৫,০০০+ সন্তুষ্ট যাত্রী", en: "5,000+ Happy Travelers" },
  { icon: BadgeCheck, bn: "ATOL ও IATA সনদ", en: "ATOL & IATA Certified" },
];

function PackageSlideCard({ pkg, bn }: { pkg: PublicPackageItem; bn: boolean }) {
  return (
    <Link
      to={`/packages/${pkg.slug || pkg.id}`}
      className="snap-start shrink-0 w-[260px] sm:w-[280px] bg-white border border-[#E5E7EB] rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        <img src={mediaUrl(pkg.image, 600, 400)} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        {pkg.badge && (
          <span className="absolute top-3 left-0 bg-[#F15A24] text-white text-[10px] font-bold px-3 py-1 rounded-r-md shadow">
            {pkg.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[#062D63] text-sm leading-snug line-clamp-2 mb-2 min-h-[2.5rem]">{pkg.title}</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6B7280] mb-3">
          <span className="inline-flex items-center gap-1"><Clock size={11} className="text-[#1B75BC]" />{pkg.duration}</span>
          <span className="inline-flex items-center gap-1"><Plane size={11} className="text-[#1B75BC]" />{pkg.flight || "—"}</span>
          <span className="inline-flex items-center gap-1"><Hotel size={11} className="text-[#1B75BC]" />{pkg.hotel || "—"}</span>
        </div>
        <p className="text-xl font-bold text-[#F15A24] mb-2">{fmtPrice(pkg.price)}</p>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1B75BC] group-hover:gap-1.5 transition-all">
          {bn ? "বিস্তারিত দেখুন" : "View Details"} <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export function Home() {
  const { i18n } = useTranslation("home");
  const bn = i18n.language?.startsWith("bn");
  const [ruleTab, setRuleTab] = useState<"hajj" | "umrah">("hajj");
  const [videoOpen, setVideoOpen] = useState(false);
  const [email, setEmail] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  const packagesQ = usePublicPackages({ limit: 12 });
  const packages = packagesQ.data?.data ?? [];

  const ruleGuides = useMemo(() => {
    const slugs = ruleTab === "hajj" ? HAJJ_SLUGS : UMRAH_SLUGS;
    return slugs.map((s) => GUIDES.find((g) => g.slug === s)).filter(Boolean).slice(0, 8) as typeof GUIDES;
  }, [ruleTab]);

  const scrollPackages = (dir: -1 | 1) => {
    carouselRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero (Image A) ── */}
      <section className="relative min-h-[78vh] md:min-h-[86vh] flex items-center overflow-hidden">
        <img
          src={img(SITE_IMAGES.kaabaNight, 1920, 1080)}
          alt="Masjid al-Haram, Makkah"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/20 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-white/10" />

        <div className="relative max-w-[1240px] w-full mx-auto px-4 md:px-5 py-20 md:py-28">
          <Reveal>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-bold text-[#062D63] leading-[1.2] max-w-xl tracking-tight">
              {bn ? (
                <>আপনার বিশ্বস্ত সঙ্গী<br /><span className="text-[#F15A24]">হজ্ব ও উমরাহ</span> যাত্রায়</>
              ) : (
                <>Your trusted partner for<br /><span className="text-[#F15A24]">Hajj & Umrah</span></>
              )}
            </h1>
            <p className="mt-4 text-base md:text-lg text-[#374151] max-w-md leading-relaxed">
              {bn
                ? "লাইসেন্সপ্রাপ্ত এজেন্সি — নিরাপদ, স্বচ্ছ ও সম্পূর্ণ সেবায় আপনার পবিত্র যাত্রা।"
                : "Licensed agency — safe, transparent and complete service for your sacred journey."}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {TRUST.map((item) => (
                <div key={item.en} className="flex items-center gap-2.5 bg-white/90 border border-[#1B75BC]/20 rounded-full pl-1.5 pr-3.5 py-1.5 shadow-sm">
                  <span className="w-9 h-9 rounded-full border border-[#1B75BC]/30 bg-[#EAF5FF] text-[#1B75BC] flex items-center justify-center">
                    <item.icon size={16} />
                  </span>
                  <span className="text-[12px] font-semibold text-[#062D63] leading-tight max-w-[110px]">
                    {bn ? item.bn : item.en}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#062D63] text-white font-bold text-sm rounded-md hover:bg-[#041E42] transition-colors shadow-md"
              >
                {bn ? "হজ্ব ও উমরাহ প্যাকেজ দেখুন" : "See Hajj & Umrah Packages"}
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="inline-flex items-center gap-3 text-[#062D63] font-semibold hover:text-[#F15A24] transition-colors"
              >
                <span className="w-12 h-12 rounded-full border-2 border-[#F15A24] text-[#F15A24] flex items-center justify-center bg-white shadow-sm">
                  <Play size={18} className="ml-0.5 fill-current" />
                </span>
                {bn ? "আমাদের ভিডিও দেখুন" : "Watch Our Video"}
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {videoOpen && (
        <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4" onClick={() => setVideoOpen(false)} role="dialog" aria-modal>
          <div className="w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <iframe
              title="SM Travels video"
              src={`https://www.youtube.com/embed/${SITE_VIDEOS[0].youtubeId}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* ── Service shortcut grid ── */}
      <section className="bg-white border-b border-[#EAF5FF]">
        <div className="max-w-[1240px] mx-auto px-4 md:px-5 py-8 md:py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
            {SERVICES.map((s, i) => (
              <Reveal key={s.to} delay={i * 0.03}>
                <Link
                  to={s.to}
                  className="flex flex-col items-center justify-center text-center gap-2.5 p-4 min-h-[118px] bg-white border border-[#D6EAF8] rounded-lg hover:border-[#1B75BC] hover:shadow-md transition-all"
                >
                  <s.icon size={28} strokeWidth={1.5} className="text-[#1B75BC]" />
                  <span className="text-[12px] md:text-[13px] font-semibold text-[#062D63] leading-snug">
                    {bn ? s.titleBn : s.titleEn}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rules & Guidelines (Knowledge) ── */}
      <section className="bg-white py-14 md:py-20">
        <div className="max-w-[1240px] mx-auto px-4 md:px-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#062D63] text-center md:text-left">
              {bn ? "হজ্ব ও উমরাহর নিয়মকানুন" : "Rules and Guidelines for Hajj and Umrah"}
            </h2>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setRuleTab("hajj")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-bold border transition-colors",
                  ruleTab === "hajj" ? "bg-[#062D63] text-white border-[#062D63]" : "bg-white text-[#1B75BC] border-[#1B75BC]",
                )}
              >
                {bn ? "হজ্ব নিয়ম" : "Hajj Rules"}
              </button>
              <button
                type="button"
                onClick={() => setRuleTab("umrah")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-bold border transition-colors",
                  ruleTab === "umrah" ? "bg-[#062D63] text-white border-[#062D63]" : "bg-white text-[#1B75BC] border-[#1B75BC]",
                )}
              >
                {bn ? "উমরাহ নিয়ম" : "Umrah Rules"}
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {ruleGuides.map((g, i) => (
              <Reveal key={g.slug} delay={i * 0.03}>
                <Link
                  to={`/knowledge/${g.slug}`}
                  className="flex flex-col p-5 bg-white border border-[#E5E7EB] rounded-lg hover:border-[#1B75BC]/40 hover:shadow-md transition-all h-full"
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
              </Reveal>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/knowledge"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#062D63] text-white font-bold text-sm rounded-md hover:bg-[#041E42] transition-colors"
            >
              {bn ? "হজ্বের সব ধাপ বিস্তারিত দেখুন" : "View All Steps for Hajj in Detail"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Popular packages carousel ── */}
      <section className="bg-[#F7F8FA] py-14 md:py-20">
        <div className="max-w-[1240px] mx-auto px-4 md:px-5">
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#062D63]">
              {bn ? "জনপ্রিয় হজ্ব ও উমরাহ প্যাকেজ" : "Popular Hajj & Umrah Packages"}
            </h2>
            <Link to="/packages" className="text-sm font-semibold text-[#1B75BC] hover:underline whitespace-nowrap inline-flex items-center gap-1">
              {bn ? "সব প্যাকেজ দেখুন" : "See all packages"} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => scrollPackages(-1)}
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#1B75BC] text-white items-center justify-center shadow-lg hover:bg-[#14588F]"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scrollPackages(1)}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#1B75BC] text-white items-center justify-center shadow-lg hover:bg-[#14588F]"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>

            {packagesQ.isLoading && (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} className="h-72 w-[280px] shrink-0" />)}
              </div>
            )}
            {packagesQ.isError && <ErrorState message={bn ? "প্যাকেজ লোড করা যায়নি।" : "Could not load packages."} />}
            {!packagesQ.isLoading && !packagesQ.isError && packages.length === 0 && (
              <EmptyState message={bn ? "এখনো কোনো প্যাকেজ নেই।" : "No packages yet."} />
            )}
            {packages.length > 0 && (
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar scroll-smooth"
              >
                {packages.map((pkg) => (
                  <PackageSlideCard key={pkg.id} pkg={pkg} bn={!!bn} />
                ))}
              </div>
            )}
          </div>
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
              <div className="bg-white/95 border border-emerald-200 rounded-xl p-6 md:p-7 shadow-sm h-full">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50">
                  {bn ? "সব সুন্নাত দেখুন" : "View All Sunnahs"} <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="hidden lg:flex justify-center">
              <div className="w-44 h-44 xl:w-52 xl:h-52 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-[#C89B3C]/30">
                <img src={img(SITE_IMAGES.madinah, 400, 400)} alt="Green Dome, Madinah" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="bg-white/95 border border-red-200 rounded-xl p-6 md:p-7 shadow-sm h-full relative">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-red-500 text-red-600 text-sm font-semibold hover:bg-red-50">
                  {bn ? "সব নিষেধ দেখুন" : "View All Prohibitions"} <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Video tutorials (5) ── */}
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
                <a
                  href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group block"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-[#062D63]">
                    <img
                      src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                      alt={bn ? v.titleBn : v.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="w-11 h-11 rounded-full bg-white/95 text-[#F15A24] flex items-center justify-center shadow">
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
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="relative bg-[#062D63] py-10 md:py-12 overflow-hidden">
        <Plane size={120} className="absolute right-4 md:right-16 top-1/2 -translate-y-1/2 text-white/10 -rotate-12" aria-hidden />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-5 grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
          <div className="text-center md:text-left flex md:block flex-col items-center">
            <Users size={22} className="text-[#1B75BC] mb-2" />
            <StatCounter end={100} suffix="K+" label={bn ? "সন্তুষ্ট হাজি" : "Happy Pilgrims"} />
          </div>
          <div className="text-center md:text-left flex md:block flex-col items-center">
            <BadgeCheck size={22} className="text-[#1B75BC] mb-2" />
            <StatCounter end={12} suffix="+" label={bn ? "বছরের অভিজ্ঞতা" : "Years Experience"} />
          </div>
          <div className="text-center md:text-left flex md:block flex-col items-center">
            <MapPin size={22} className="text-[#1B75BC] mb-2" />
            <StatCounter end={25} suffix="+" label={bn ? "দেশ" : "Countries"} />
          </div>
          <div className="text-center md:text-left flex md:block flex-col items-center">
            <Shield size={22} className="text-[#1B75BC] mb-2" />
            <StatCounter end={98} suffix="%" label={bn ? "সন্তুষ্টির হার" : "Satisfaction"} />
          </div>
          <div className="text-center md:text-left flex md:block flex-col items-center">
            <Headphones size={22} className="text-[#1B75BC] mb-2" />
            <StatCounter end={24} suffix="/7" label={bn ? "সাপোর্ট" : "Support"} />
          </div>
        </div>
      </section>

      {/* ── Newsletter banner ── */}
      <section className="relative py-12 md:py-14 overflow-hidden bg-gradient-to-r from-[#062D63] via-[#1B75BC] to-[#F15A24]">
        <Plane size={80} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/15 -rotate-12 hidden md:block" aria-hidden />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-5">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {bn ? "সর্বশেষ অফার পেতে সাবস্ক্রাইব করুন" : "Subscribe to get the latest offers"}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {bn ? "নতুন প্যাকেজ ও গাইড সরাসরি আপনার ইনবক্সে।" : "New packages and guides delivered to your inbox."}
              </p>
            </div>
            <form
              className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:min-w-[420px]"
              onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
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
              <button type="submit" className="px-6 py-3 bg-[#F15A24] hover:bg-[#CC3C17] text-white font-bold text-sm rounded-md transition-colors whitespace-nowrap">
                {bn ? "সাবস্ক্রাইব" : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
