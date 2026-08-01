import React from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  BookOpen, Check, X, Download, PlayCircle, ArrowRight,
} from "lucide-react";
import {
  PageHero, Breadcrumbs, Section, SectionHeader, Reveal, GuideCard, Btn,
  AccordionFAQ, VideoCard, EmptyState,
} from "../website/primitives";
import { GUIDES, getGuide, getRelatedGuides } from "../website/knowledge/guides";
import { SITE_VIDEOS } from "../website/videos";

export function KnowledgePage() {
  const { i18n } = useTranslation();
  const bn = i18n.language?.startsWith("bn");
  const cats = [
    { id: "ritual", label: bn ? "আমল" : "Rituals" },
    { id: "rules", label: bn ? "নিয়ম" : "Rules" },
    { id: "checklist", label: bn ? "চেকলিস্ট" : "Checklists" },
    { id: "docs", label: bn ? "নথি" : "Documents" },
  ] as const;

  return (
    <div>
      <PageHero
        eyebrow={bn ? "ইসলামী গাইডেন্স সেন্টার" : "Islamic Guidance Center"}
        title={bn ? "হজ্ব ও উমরাহ জ্ঞান কেন্দ্র" : "Hajj & Umrah Knowledge Center"}
        subtitle={bn ? "বিশ্বস্ত গাইড — ইহরাম থেকে বিদায়ী তাওয়াফ পর্যন্ত।" : "Trusted guides — from Ihram to farewell Tawaf."}
        image="/hero-kaaba.jpg"
      >
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: bn ? "জ্ঞান কেন্দ্র" : "Knowledge" },
        ]} />
      </PageHero>

      {cats.map((cat) => {
        const items = GUIDES.filter((g) => g.category === cat.id);
        if (!items.length) return null;
        return (
          <Section key={cat.id} tone={cat.id === "ritual" ? "white" : cat.id === "rules" ? "tint" : "soft"}>
            <Reveal>
              <SectionHeader title={cat.label} subtitle={bn ? `${items.length}টি গাইড` : `${items.length} guides`} />
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((g, i) => (
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
        );
      })}
    </div>
  );
}

export function KnowledgeDetailPage() {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const bn = i18n.language?.startsWith("bn");
  const guide = slug ? getGuide(slug) : undefined;

  if (!guide) {
    return (
      <div>
        <PageHero title={bn ? "গাইড পাওয়া যায়নি" : "Guide not found"} image="/hero-kaaba.jpg" compact>
          <Breadcrumbs items={[
            { label: bn ? "হোম" : "Home", to: "/" },
            { label: bn ? "জ্ঞান কেন্দ্র" : "Knowledge", to: "/knowledge" },
            { label: "404" },
          ]} />
        </PageHero>
        <Section><EmptyState message={bn ? "এই বিষয়টি নেই।" : "This topic does not exist."} />
          <div className="mt-6 text-center"><Btn to="/knowledge">{bn ? "সব গাইড" : "All guides"}</Btn></div>
        </Section>
      </div>
    );
  }

  const related = getRelatedGuides(guide.slug, 4);
  const videos = SITE_VIDEOS.filter((v) => guide.relatedVideos?.includes(v.id)).slice(0, 2);
  const next = guide.nextSlug ? getGuide(guide.nextSlug) : undefined;
  const faqs = guide.faqs.map((f, i) => ({ id: `${guide.slug}-faq-${i}`, question: f.q, answer: f.a }));

  return (
    <div>
      <PageHero
        eyebrow={bn ? "জ্ঞান কেন্দ্র" : "Knowledge Center"}
        title={bn ? guide.titleBn : guide.titleEn}
        subtitle={bn ? guide.summaryBn : guide.summaryEn}
        image={guide.image || "/hero-kaaba.jpg"}
      >
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: bn ? "জ্ঞান কেন্দ্র" : "Knowledge", to: "/knowledge" },
          { label: bn ? guide.titleBn : guide.titleEn },
        ]} />
      </PageHero>

      <Section>
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {guide.duaAr && (
              <Reveal>
                <div className="rounded-lg bg-[#EAF5FF] border border-[#1B75BC]/15 p-8 text-center">
                  <p className="text-2xl md:text-3xl text-[#062D63] leading-relaxed mb-3" dir="rtl" style={{ fontFamily: "var(--font-display)" }}>{guide.duaAr}</p>
                  {guide.duaBn && <p className="text-[#1B75BC] font-medium">{guide.duaBn}</p>}
                </div>
              </Reveal>
            )}

            <Reveal>
              <h2 className="text-2xl font-semibold text-[#062D63] mb-3" style={{ fontFamily: "var(--font-display)" }}>
                {bn ? "ব্যাখ্যা" : "Explanation"}
              </h2>
              <p className="text-[#374151] leading-relaxed text-lg">{bn ? guide.explanationBn : guide.explanationEn}</p>
            </Reveal>

            {(guide.quran?.length || guide.hadith?.length) && (
              <Reveal>
                <div className="space-y-4">
                  {guide.quran?.map((q) => (
                    <blockquote key={q.ref} className="border-l-4 border-[#C89B3C] pl-5 py-2">
                      <p className="text-[#062D63] italic leading-relaxed">{bn ? q.textBn : q.textEn}</p>
                      <cite className="text-xs text-[#6B7280] not-italic mt-2 block">{q.ref}</cite>
                    </blockquote>
                  ))}
                  {guide.hadith?.map((h) => (
                    <blockquote key={h.ref} className="border-l-4 border-[#1B75BC] pl-5 py-2">
                      <p className="text-[#062D63] leading-relaxed">{bn ? h.textBn : h.textEn}</p>
                      <cite className="text-xs text-[#6B7280] not-italic mt-2 block">{h.ref}</cite>
                    </blockquote>
                  ))}
                </div>
              </Reveal>
            )}

            <Reveal>
              <h2 className="text-2xl font-semibold text-[#062D63] mb-4" style={{ fontFamily: "var(--font-display)" }}>
                {bn ? "ধাপে ধাপে" : "Step by step"}
              </h2>
              <ol className="space-y-3">
                {(bn ? guide.stepsBn : guide.stepsEn).map((step, i) => (
                  <li key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-[#F7F8FA] border border-[#E5E7EB]">
                    <span className="w-8 h-8 rounded-full bg-[#1B75BC] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-[#374151] pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-6">
                  <h3 className="font-semibold text-emerald-800 mb-3 inline-flex items-center gap-2"><Check size={18} /> {bn ? "করণীয়" : "Do"}</h3>
                  <ul className="space-y-2 text-sm text-emerald-900/80">
                    {(bn ? guide.doBn : guide.doEn).map((x) => <li key={x} className="flex gap-2"><Check size={14} className="mt-0.5 text-emerald-600" />{x}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-6">
                  <h3 className="font-semibold text-red-800 mb-3 inline-flex items-center gap-2"><X size={18} /> {bn ? "বর্জনীয়" : "Don't"}</h3>
                  <ul className="space-y-2 text-sm text-red-900/80">
                    {(bn ? guide.dontBn : guide.dontEn).map((x) => <li key={x} className="flex gap-2"><X size={14} className="mt-0.5 text-red-500" />{x}</li>)}
                  </ul>
                </div>
              </div>
            </Reveal>

            {faqs.length > 0 && (
              <Reveal>
                <h2 className="text-2xl font-semibold text-[#062D63] mb-4" style={{ fontFamily: "var(--font-display)" }}>FAQ</h2>
                <AccordionFAQ items={faqs} />
              </Reveal>
            )}

            {videos.length > 0 && (
              <Reveal>
                <h2 className="text-2xl font-semibold text-[#062D63] mb-4" style={{ fontFamily: "var(--font-display)" }}>
                  {bn ? "সম্পর্কিত ভিডিও" : "Related videos"}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {videos.map((v) => (
                    <VideoCard key={v.id} title={bn ? v.titleBn : v.titleEn} youtubeId={v.youtubeId} duration={v.duration} views={v.views} category={v.category} />
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 self-start">
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-[#062D63] mb-3">{bn ? "ডাউনলোড" : "Download"}</h3>
              <p className="text-sm text-[#6B7280] mb-4">{bn ? "এই গাইডের সংক্ষিপ্ত PDF (শীঘ্রই)।" : "Short PDF of this guide (coming soon)."}</p>
              <Btn variant="outline" className="w-full" href="#" onClick={() => undefined}>
                <Download size={16} /> PDF
              </Btn>
            </div>
            {next && (
              <Link to={`/knowledge/${next.slug}`} className="block rounded-lg bg-[#062D63] text-white p-6 hover:bg-[#041E42] transition-colors">
                <p className="text-xs text-[#C89B3C] font-bold uppercase tracking-wider mb-2">{bn ? "পরবর্তী ধাপ" : "Next step"}</p>
                <p className="font-semibold text-lg mb-2">{bn ? next.titleBn : next.titleEn}</p>
                <span className="inline-flex items-center gap-1 text-sm text-white/80">{bn ? "চালিয়ে যান" : "Continue"} <ArrowRight size={14} /></span>
              </Link>
            )}
            <div className="rounded-lg border border-[#E5E7EB] p-6">
              <h3 className="font-semibold text-[#062D63] mb-3 inline-flex items-center gap-2"><PlayCircle size={18} /> {bn ? "সাহায্য?" : "Need help?"}</h3>
              <Btn to="/contact" variant="orange" className="w-full mb-2">{bn ? "যোগাযোগ" : "Contact"}</Btn>
              <Btn to="/book" variant="outline" className="w-full">{bn ? "বুকিং" : "Book"}</Btn>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="tint">
        <SectionHeader title={bn ? "সম্পর্কিত গাইড" : "Related guides"} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {related.map((g) => (
            <GuideCard key={g.slug} to={`/knowledge/${g.slug}`} icon={BookOpen} title={bn ? g.titleBn : g.titleEn} summary={bn ? g.summaryBn : g.summaryEn} />
          ))}
        </div>
      </Section>
    </div>
  );
}
