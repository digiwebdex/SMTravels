import React, { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Star, MapPin, Shield, Plane, Hotel, Globe, Car, Umbrella,
  Play, Sparkles, ScanText, Headphones, Lock, Award, BadgeCheck,
  ArrowRight, BookOpen,
} from "lucide-react";
import {
  Reveal, Section, SectionHeader, Btn, PackageCard, TestimonialCard, VideoCard,
  StatCounter, AccordionFAQ, CtaBand, Newsletter, SkeletonBlock, EmptyState, ErrorState, IconCard, GuideCard,
} from "../website/primitives";
import { usePublicPackages, usePublicTestimonials, usePublicBlog, usePublicFaqs } from "../hooks/publicContent";
import { GUIDES } from "../website/knowledge/guides";
import { SITE_VIDEOS } from "../website/videos";
import { SITE_IMAGES, mediaUrl, img } from "../lib/utils";
import { HeroBackground } from "../components/HeroBackground";

const SERVICES = [
  { to: "/hajj", icon: Star, titleBn: "হজ্ব", titleEn: "Hajj", descBn: "সরকার-অনুমোদিত পূর্ণাঙ্গ প্যাকেজ", descEn: "Govt-approved full packages", color: "#F15A24" },
  { to: "/umrah", icon: MapPin, titleBn: "উমরাহ", titleEn: "Umrah", descBn: "সারা বছরের উমরাহ সেবা", descEn: "Year-round Umrah", color: "#1B75BC" },
  { to: "/visa", icon: Shield, titleBn: "ভিসা", titleEn: "Visa", descBn: "সৌদি ও বিশ্ব ভিসা", descEn: "Saudi & global visas", color: "#16A34A" },
  { to: "/air-ticket", icon: Plane, titleBn: "বিমান টিকিট", titleEn: "Air Ticket", descBn: "সেরা ভাড়ার নিশ্চয়তা", descEn: "Best fares", color: "#062D63" },
  { to: "/hotel-booking", icon: Hotel, titleBn: "হোটেল", titleEn: "Hotel", descBn: "হারাম-নিকট আবাসন", descEn: "Near-Haram stays", color: "#0891B2" },
  { to: "/transport", icon: Car, titleBn: "পরিবহন", titleEn: "Transport", descBn: "ট্রান্সফার ও জিয়ারত", descEn: "Transfers & Ziyarah", color: "#7C3AED" },
  { to: "/tour-packages", icon: Globe, titleBn: "ট্যুর", titleEn: "Tour", descBn: "নির্বাচিত বিশ্বভ্রমণ", descEn: "Curated tours", color: "#C89B3C" },
  { to: "/faq", icon: Umbrella, titleBn: "বীমা", titleEn: "Insurance", descBn: "নিরাপদ যাত্রা", descEn: "Travel cover", color: "#0E7C66" },
];

const WHY = [
  { icon: Sparkles, titleBn: "এআই সহায়তা", titleEn: "AI Assistance", descBn: "স্মার্ট পরামর্শ ও পোর্টাল ইনসাইট", descEn: "Smart guidance & portal insights" },
  { icon: ScanText, titleBn: "OCR পাসপোর্ট", titleEn: "Passport OCR", descBn: "দ্রুত ও নির্ভুল নথি প্রক্রিয়াকরণ", descEn: "Fast, accurate document capture" },
  { icon: Headphones, titleBn: "২৪/৭ সাপোর্ট", titleEn: "24/7 Support", descBn: "যাত্রার প্রতিটি ধাপে সহায়তা", descEn: "Help at every step" },
  { icon: Lock, titleBn: "নিরাপদ পেমেন্ট", titleEn: "Secure Pay", descBn: "এন্টারপ্রাইজ-গ্রেড আর্থিক নিরাপত্তা", descEn: "Enterprise-grade money path" },
  { icon: Award, titleBn: "ATOL / ATAB", titleEn: "ATOL / ATAB", descBn: "লাইসেন্সপ্রাপ্ত বিশ্বস্ত এজেন্সি", descEn: "Licensed trusted agency" },
  { icon: BadgeCheck, titleBn: "IATA", titleEn: "IATA", descBn: "আন্তর্জাতিক বিমান মান", descEn: "International air standards" },
  { icon: Star, titleBn: "অভিজ্ঞতা", titleEn: "Experience", descBn: "হাজারো হাজির আস্থা", descEn: "Trusted by thousands" },
];

export function Home() {
  const { t, i18n } = useTranslation("home");
  const bn = i18n.language?.startsWith("bn");
  const hajjQ = usePublicPackages({ type: "HAJJ", limit: 4 });
  const umrahQ = usePublicPackages({ type: "UMRAH", limit: 4 });
  const testiQ = usePublicTestimonials();
  const blogQ = usePublicBlog({ limit: 3 });
  const faqQ = usePublicFaqs();
  const [videoOpen, setVideoOpen] = useState(false);

  const hajj = hajjQ.data?.data ?? [];
  const umrah = umrahQ.data?.data ?? [];
  const faqs = (faqQ.data ?? []).slice(0, 6).map((f) => ({ id: f.id, question: f.question, answer: f.answer }));
  const guidesPreview = GUIDES.slice(0, 8);

  return (
    <div className="overflow-x-hidden">
      {/* ── Premium Hero ── */}
      <section className="relative min-h-[92vh] flex items-end md:items-center overflow-hidden bg-[#062D63]">
        <HeroBackground posterImg={img(SITE_IMAGES.kaaba, 1920, 1080)} alt="Masjid al-Haram, Makkah" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041E42]/95 via-[#062D63]/80 to-[#062D63]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041E42] via-transparent to-[#062D63]/30" />

        <div className="relative max-w-[1200px] w-full mx-auto px-4 md:px-6 pt-32 pb-20 md:py-28">
          <Reveal>
            <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#C89B3C] text-xs font-bold uppercase tracking-[0.2em] mb-6">
              <Star size={12} className="fill-[#C89B3C]" /> SM Travels International
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-semibold text-white leading-[1.08] max-w-3xl tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {bn ? (
                <>নিরাপদ সফর,<br /><span className="text-[#F15A24]">নিশ্চিত সেবা।</span></>
              ) : (
                <>Safe travel,<br /><span className="text-[#F15A24]">guaranteed service.</span></>
              )}
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/80 max-w-xl leading-relaxed">
              {bn
                ? "আপনার আস্থাই আমাদের অঙ্গীকার — হজ্ব, উমরাহ ও ভ্রমণে প্রিমিয়াম অভিজ্ঞতা।"
                : "Your trust is our promise — premium Hajj, Umrah and travel experiences."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                bn ? "২০১১ থেকে বিশ্বস্ত" : "Trusted since 2011",
                bn ? "২৪/৭ সাপোর্ট" : "24/7 Support",
                bn ? "১০০কে+ সন্তুষ্ট" : "100K+ Clients",
                "ATOL & IATA",
              ].map((b) => (
                <span key={b} className="px-3.5 py-2 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-semibold backdrop-blur">
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Btn to="/packages" variant="orange" size="lg">
                {bn ? "হজ্ব ও উমরাহ প্যাকেজ" : "View Hajj & Umrah Packages"} <ArrowRight size={18} />
              </Btn>
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="inline-flex items-center gap-3 text-white font-semibold hover:text-[#C89B3C] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full px-2 py-1"
              >
                <span className="w-12 h-12 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                  <Play size={18} className="ml-0.5 fill-white" />
                </span>
                {bn ? "আমাদের ভিডিও দেখুন" : "Watch Our Video"}
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {videoOpen && (
        <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4" onClick={() => setVideoOpen(false)} role="dialog" aria-modal>
          <div className="w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
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

      {/* ── Services ── */}
      <Section>
        <Reveal>
          <SectionHeader
            eyebrow={bn ? "সেবাসমূহ" : "Services"}
            title={bn ? "এক ছাদের নিচে সব ভ্রমণ সেবা" : "Every journey, one premium house"}
            subtitle={bn ? "হজ্ব থেকে বীমা — একই মানের অভিজ্ঞতা।" : "From Hajj to insurance — one standard of excellence."}
          />
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {SERVICES.map((s, i) => (
            <Reveal key={s.to} delay={i * 0.04}>
              <IconCard
                to={s.to}
                icon={s.icon}
                title={bn ? s.titleBn : s.titleEn}
                desc={bn ? s.descBn : s.descEn}
                color={s.color}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Knowledge Center preview ── */}
      <Section tone="tint">
        <Reveal>
          <SectionHeader
            eyebrow={bn ? "ইসলামী গাইডেন্স" : "Islamic Guidance"}
            title={bn ? "হজ্ব ও উমরাহ জ্ঞান কেন্দ্র" : "Hajj & Umrah Knowledge Center"}
            subtitle={bn ? "ইহরাম থেকে বিদায়ী তাওয়াফ — নির্ভরযোগ্য গাইড।" : "From Ihram to farewell Tawaf — trusted guides."}
            action={<Btn to="/knowledge" variant="outline" size="sm">{bn ? "সব গাইড" : "All guides"} <BookOpen size={16} /></Btn>}
          />
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {guidesPreview.map((g, i) => (
            <Reveal key={g.slug} delay={i * 0.03}>
              <GuideCard
                to={`/knowledge/${g.slug}`}
                icon={BookOpen}
                title={bn ? g.titleBn : g.titleEn}
                summary={bn ? g.summaryBn : g.summaryEn}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Hajj packages ── */}
      <Section>
        <Reveal>
          <SectionHeader
            eyebrow="Hajj"
            title={bn ? "জনপ্রিয় হজ্ব প্যাকেজ" : "Popular Hajj Packages"}
            action={<Btn to="/packages?type=HAJJ" variant="outline" size="sm">{bn ? "সব দেখুন" : "View all"}</Btn>}
          />
        </Reveal>
        {hajjQ.isLoading && <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">{[1,2,3,4].map((i) => <SkeletonBlock key={i} className="h-80" />)}</div>}
        {hajjQ.isError && <ErrorState message={bn ? "প্যাকেজ লোড করা যায়নি।" : "Could not load packages."} />}
        {!hajjQ.isLoading && !hajjQ.isError && hajj.length === 0 && <EmptyState message={bn ? "এখনো কোনো হজ্ব প্যাকেজ নেই।" : "No Hajj packages yet."} />}
        {hajj.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {hajj.map((p, i) => <Reveal key={p.id} delay={i * 0.05}><PackageCard pkg={p} /></Reveal>)}
          </div>
        )}
      </Section>

      {/* ── Umrah packages ── */}
      <Section tone="soft">
        <Reveal>
          <SectionHeader
            eyebrow="Umrah"
            title={bn ? "জনপ্রিয় উমরাহ প্যাকেজ" : "Popular Umrah Packages"}
            action={<Btn to="/packages?type=UMRAH" variant="outline" size="sm">{bn ? "সব দেখুন" : "View all"}</Btn>}
          />
        </Reveal>
        {umrahQ.isLoading && <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">{[1,2,3,4].map((i) => <SkeletonBlock key={i} className="h-80" />)}</div>}
        {umrahQ.isError && <ErrorState message={bn ? "প্যাকেজ লোড করা যায়নি।" : "Could not load packages."} />}
        {!umrahQ.isLoading && !umrahQ.isError && umrah.length === 0 && <EmptyState message={bn ? "এখনো কোনো উমরাহ প্যাকেজ নেই।" : "No Umrah packages yet."} />}
        {umrah.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {umrah.map((p, i) => <Reveal key={p.id} delay={i * 0.05}><PackageCard pkg={p} /></Reveal>)}
          </div>
        )}
      </Section>

      {/* ── Videos ── */}
      <Section>
        <Reveal>
          <SectionHeader
            eyebrow={bn ? "ভিডিও" : "Videos"}
            title={bn ? "টিউটোরিয়াল ও গাইড" : "Tutorials & Guides"}
            action={<Btn to="/videos" variant="outline" size="sm">{bn ? "সব ভিডিও" : "All videos"}</Btn>}
          />
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SITE_VIDEOS.slice(0, 3).map((v, i) => (
            <Reveal key={v.id} delay={i * 0.05}>
              <VideoCard
                title={bn ? v.titleBn : v.titleEn}
                youtubeId={v.youtubeId}
                duration={v.duration}
                views={v.views}
                category={v.category}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Why choose us ── */}
      <Section tone="navy">
        <Reveal>
          <SectionHeader
            light
            eyebrow={bn ? "কেন আমরা" : "Why us"}
            title={bn ? "প্রযুক্তি, আস্থা ও ইসলামী শিষ্টাচার" : "Technology, trust & Islamic elegance"}
          />
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY.map((w, i) => (
            <Reveal key={w.titleEn} delay={i * 0.04}>
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors h-full">
                <div className="w-11 h-11 rounded-xl bg-[#F15A24]/20 text-[#F15A24] flex items-center justify-center mb-4">
                  <w.icon size={20} />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{bn ? w.titleBn : w.titleEn}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{bn ? w.descBn : w.descEn}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Counters ── */}
      <section className="relative py-16 md:py-20 overflow-hidden bg-[#062D63]">
        <img src={mediaUrl(SITE_IMAGES.pilgrims, 1600, 600)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" loading="lazy" />
        <div className="absolute inset-0 bg-[#062D63]/85" />
        <div className="relative max-w-[1200px] mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter end={100000} suffix="+" label={bn ? "সন্তুষ্ট যাত্রী" : "Happy pilgrims"} />
          <StatCounter end={25000} suffix="+" label={bn ? "ভিসা সম্পন্ন" : "Visas processed"} />
          <StatCounter end={25} suffix="+" label={bn ? "দেশ" : "Countries"} />
          <StatCounter end={15} suffix="+" label={bn ? "বছরের অভিজ্ঞতা" : "Years of service"} />
        </div>
      </section>

      {/* ── Testimonials ── */}
      <Section>
        <Reveal>
          <SectionHeader
            eyebrow={bn ? "প্রশংসাপত্র" : "Testimonials"}
            title={bn ? "যাত্রীদের আস্থা" : "Trusted by travellers"}
            action={<Btn to="/testimonials" variant="outline" size="sm">{bn ? "আরও" : "More"}</Btn>}
          />
        </Reveal>
        {testiQ.isLoading && <div className="grid md:grid-cols-3 gap-5">{[1,2,3].map((i) => <SkeletonBlock key={i} className="h-56" />)}</div>}
        {testiQ.isError && <ErrorState message={bn ? "প্রশংসাপত্র লোড হয়নি।" : "Could not load testimonials."} />}
        {(testiQ.data?.length ?? 0) > 0 && (
          <div className="grid md:grid-cols-3 gap-5">
            {testiQ.data!.slice(0, 3).map((item, i) => (
              <Reveal key={item.id} delay={i * 0.05}><TestimonialCard t={item} /></Reveal>
            ))}
          </div>
        )}
      </Section>

      {/* ── Blog ── */}
      <Section tone="soft">
        <Reveal>
          <SectionHeader
            eyebrow={bn ? "ব্লগ" : "Blog"}
            title={bn ? "ভ্রমণ ও ইবাদতের জ্ঞান" : "Travel & worship insights"}
            action={<Btn to="/blog" variant="outline" size="sm">{bn ? "সব পোস্ট" : "All posts"}</Btn>}
          />
        </Reveal>
        {blogQ.isLoading && <div className="grid md:grid-cols-3 gap-5">{[1,2,3].map((i) => <SkeletonBlock key={i} className="h-64" />)}</div>}
        {(blogQ.data?.data?.length ?? 0) > 0 && (
          <div className="grid md:grid-cols-3 gap-5">
            {blogQ.data!.data.slice(0, 3).map((post, i) => (
              <Reveal key={post.id} delay={i * 0.05}>
                <Link to={`/blog/${post.slug}`} className="group block rounded-3xl overflow-hidden bg-white border border-[#E5E7EB] hover:shadow-xl transition-all">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={mediaUrl(post.image, 800, 500)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#1B75BC] mb-1">{post.category}</p>
                    <h3 className="font-semibold text-[#062D63] group-hover:text-[#1B75BC] line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-[#6B7280] mt-2 line-clamp-2">{post.excerpt}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      {/* ── FAQ ── */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <Reveal>
            <SectionHeader
              eyebrow="FAQ"
              title={bn ? "সাধারণ জিজ্ঞাসা" : "Frequently asked"}
              subtitle={bn ? "বুকিং, ভিসা ও প্যাকেজ সম্পর্কে দ্রুত উত্তর।" : "Quick answers on booking, visas and packages."}
            />
            <Btn to="/faq" variant="primary" size="sm">{bn ? "সব প্রশ্ন" : "All FAQs"}</Btn>
          </Reveal>
          <Reveal delay={0.1}>
            {faqQ.isLoading && <SkeletonBlock className="h-64" />}
            {faqs.length > 0 && <AccordionFAQ items={faqs} />}
            {!faqQ.isLoading && faqs.length === 0 && <EmptyState message={bn ? "এখনো কোনো FAQ নেই।" : "No FAQs yet."} />}
          </Reveal>
        </div>
      </Section>

      {/* ── Newsletter + CTA ── */}
      <Section tone="navy">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <p className="text-[#C89B3C] text-xs font-bold uppercase tracking-[0.2em] mb-3">{bn ? "নিউজলেটার" : "Newsletter"}</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
              {bn ? "পরবর্তী সফরের আপডেট পান" : "Stay ahead of your next journey"}
            </h2>
            <p className="mt-3 text-white/70 mb-6">{bn ? "নতুন প্যাকেজ ও গাইড সরাসরি ইনবক্সে।" : "New packages and guides in your inbox."}</p>
            <Newsletter />
          </Reveal>
          <Reveal delay={0.1}>
            <CtaBand
              title={bn ? "আজই পরবর্তী যাত্রা পরিকল্পনা করুন" : "Plan your next journey today"}
              subtitle={bn ? "বিশেষজ্ঞ দল প্রস্তুত আপনার সেবায়।" : "Our specialists are ready to help."}
              primary={{ label: bn ? "যাত্রা শুরু" : "Start journey", to: "/book" }}
              secondary={{ label: bn ? "যোগাযোগ" : "Contact", to: "/contact" }}
            />
          </Reveal>
        </div>
      </Section>
    </div>
  );
}

export default Home;
