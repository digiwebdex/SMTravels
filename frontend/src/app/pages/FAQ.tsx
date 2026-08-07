import React, { useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Search, MessageCircle, Phone } from "lucide-react";
import { usePublicFaqs } from "../hooks/publicContent";
import {
  PageHero, Breadcrumbs, Section, AccordionFAQ, SkeletonBlock, EmptyState, ErrorState, Btn,
} from "../website/primitives";
import { cn } from "../lib/utils";
import { usePageMeta } from "../lib/usePageMeta";

export function FAQPage() {
  const { t, i18n } = useTranslation("faq");
  const bn = i18n.language?.startsWith("bn");
  usePageMeta(bn ? "সাধারণ জিজ্ঞাসা" : "Frequently Asked Questions", "Answers about Hajj, Umrah, visa, air tickets and travel bookings with SM Travels International.");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const { data, isLoading, isError } = usePublicFaqs();
  const faqs = data ?? [];

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)))],
    [faqs],
  );

  const filtered = useMemo(() => {
    let list = faqs;
    if (activeCat !== "All") list = list.filter((f) => f.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [faqs, activeCat, search]);

  const items = filtered.map((f) => ({ id: f.id, question: f.question, answer: f.answer }));

  return (
    <div>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} image="/hero-makkah-poster.jpg">
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: "FAQ" },
        ]} />
        <div className="relative max-w-lg mt-2">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("hero.searchPlaceholder")}
            aria-label={t("hero.searchPlaceholder")}
            className="w-full pl-11 pr-4 py-3.5 bg-white rounded-full text-sm text-[#062D63] outline-none focus:ring-2 focus:ring-[#C89B3C]"
          />
        </div>
      </PageHero>

      <Section tone="sky">
        {!search && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-8 flex-nowrap md:flex-wrap">
            {categories.map((cat) => (
              <button key={cat} type="button" onClick={() => setActiveCat(cat)}
                className={cn(
                  "flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-bold min-h-[44px]",
                  activeCat === cat ? "bg-[#1B75BC] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]",
                )}>
                {cat === "All" ? t("filters.all", { defaultValue: bn ? "সব" : "All" }) : t(`categories.${cat}`, { defaultValue: cat })}
              </button>
            ))}
          </div>
        )}

        {search && (
          <p className="mb-4 text-sm text-[#6B7280]">
            <Trans t={t} i18nKey="results.found" count={filtered.length} values={{ query: search }}
              components={{ c: <strong className="text-[#062D63]" />, q: <strong className="text-[#1B75BC]" /> }} />
          </p>
        )}

        {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-16" />)}</div>}
        {isError && <ErrorState message={bn ? "FAQ লোড হয়নি।" : "Could not load FAQs."} />}
        {!isLoading && !isError && items.length === 0 && (
          <EmptyState message={t("results.noneTitle", { query: search })} />
        )}
        {!isLoading && !isError && items.length > 0 && <AccordionFAQ items={items} />}

        <div className="mt-12 rounded-lg border border-[#E5E7EB] bg-white p-8 text-center">
          <h3 className="text-xl font-semibold text-[#062D63] mb-2" style={{ fontFamily: "var(--font-display)" }}>{t("cta.title")}</h3>
          <p className="text-sm text-[#6B7280] mb-5">{t("cta.text")}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Btn to="/contact"><MessageCircle size={14} /> {t("cta.contact")}</Btn>
            <a href="tel:+88029553421" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#1B75BC] text-[#1B75BC] font-semibold rounded-full text-sm hover:bg-[#EAF5FF]">
              <Phone size={14} /> {t("cta.callHotline")}
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}
