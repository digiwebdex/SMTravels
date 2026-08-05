import React, { useState } from "react";
import { Link } from "react-router";
import { useTranslation, Trans } from "react-i18next";
import { ChevronDown, ChevronUp, Search, MessageCircle, Phone } from "lucide-react";
import { cn } from "../lib/utils";
import { usePublicFaqs } from "../hooks/publicContent";

function faqsToArray(faqs: Record<string, { q: string; a: string }[]>) {
  return Object.entries(faqs).map(([category, items]) => ({ category, items }));
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border rounded-[12px] overflow-hidden transition-all", open ? "border-[#1B75BC]/30 shadow-sm" : "border-[#E5E7EB]")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-[#F7F8FA] transition-colors cursor-pointer gap-3"
      >
        <span className="text-[14px] font-semibold text-[#111827]">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-[#1B75BC] flex-shrink-0" aria-hidden />
          : <ChevronDown size={16} className="text-[#9CA3AF] flex-shrink-0" aria-hidden />}
      </button>
      {open && (
        <div className="px-4 pb-4 bg-[#F7F8FA]">
          <p className="text-[13px] text-[#6B7280] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export function FAQPage() {
  const { t } = useTranslation("faq");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const { faqs, isLoading, isError, refetch } = usePublicFaqs();
  const faqArray = faqsToArray(faqs);
  const categories = faqArray.map((c) => c.category);

  const allFiltered = search.trim()
    ? faqArray.flatMap((c) =>
        c.items.filter(
          (q) =>
            q.q.toLowerCase().includes(search.toLowerCase()) ||
            q.a.toLowerCase().includes(search.toLowerCase()),
        ),
      )
    : (faqArray[active]?.items ?? []);

  return (
    <>
      <section className="bg-[#1B75BC] py-16 text-center text-white">
        <div className="max-w-[700px] mx-auto px-6">
          <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-2">{t("hero.eyebrow")}</div>
          <h1 className="text-3xl font-black mb-3">{t("hero.title")}</h1>
          <p className="text-white/60 text-sm mb-7">{t("hero.subtitle")}</p>
          <div className="relative max-w-lg mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" aria-hidden />
            <input
              type="search"
              aria-label={t("hero.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("hero.searchPlaceholder")}
              className="w-full pl-11 pr-4 py-3 bg-white rounded-[12px] text-[13px] text-[#111827] outline-none placeholder-[#D1D5DB]"
            />
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F7F8FA]">
        <div className="max-w-[1100px] mx-auto px-6">
          {isLoading && <p className="text-center text-sm text-[#6B7280] py-16">Loading FAQs…</p>}
          {isError && (
            <div className="text-center py-16 space-y-3">
              <p className="text-sm text-red-600">Could not load FAQs.</p>
              <button type="button" onClick={() => refetch()} className="text-sm text-[#1B75BC] font-semibold hover:underline">
                Try again
              </button>
            </div>
          )}
          {!isLoading && !isError && faqArray.length === 0 && (
            <p className="text-center text-sm text-[#6B7280] py-16">No FAQs published yet.</p>
          )}
          {!isLoading && !isError && faqArray.length > 0 && (
            <>
              {!search.trim() && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6 md:mb-8 flex-nowrap md:flex-wrap">
                  {categories.map((cat, i) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActive(i)}
                      className={cn(
                        "flex-shrink-0 px-4 py-2.5 rounded-full text-[12px] font-bold transition-all cursor-pointer min-h-[44px]",
                        active === i
                          ? "bg-[#1B75BC] text-white"
                          : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#1B75BC]/30 hover:text-[#1B75BC]",
                      )}
                    >
                      {t(`categories.${cat}`, { defaultValue: cat })}
                    </button>
                  ))}
                </div>
              )}

              {search.trim() && (
                <div className="mb-4 text-[13px] text-[#6B7280]">
                  <Trans
                    t={t}
                    i18nKey="results.found"
                    count={allFiltered.length}
                    values={{ query: search }}
                    components={{
                      c: <strong className="text-[#111827]" />,
                      q: <strong className="text-[#1B75BC]" />,
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-3">
                {allFiltered.length > 0 ? (
                  allFiltered.map((item, i) => <FAQItem key={`${item.q}-${i}`} q={item.q} a={item.a} />)
                ) : (
                  <div className="text-center py-12 text-[#9CA3AF]">
                    <p className="text-[14px]">{t("results.noneTitle", { query: search })}</p>
                    <p className="text-[12px] mt-1">{t("results.noneHint")}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mt-12 bg-white rounded-2xl border border-[#E5E7EB] p-7 text-center">
            <h3 className="text-[17px] font-black text-[#111827] mb-2">{t("cta.title")}</h3>
            <p className="text-[13px] text-[#6B7280] mb-5">{t("cta.text")}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B75BC] text-white font-bold rounded-[10px] text-sm hover:bg-[#14588F] transition-colors">
                <MessageCircle size={14} /> {t("cta.contact")}
              </Link>
              <a href="tel:+88029553421" className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#1B75BC] text-[#1B75BC] font-bold rounded-[10px] text-sm hover:bg-[#1B75BC]/5 transition-colors">
                <Phone size={14} /> {t("cta.callHotline")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
