import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { usePublicGallery } from "../hooks/publicContent";
import {
  PageHero, Breadcrumbs, Section, SkeletonBlock, EmptyState, ErrorState, Reveal,
} from "../website/primitives";
import { mediaUrl, cn } from "../lib/utils";

export function GalleryPage() {
  const { t, i18n } = useTranslation("gallery");
  const bn = i18n.language?.startsWith("bn");
  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const { data, isLoading, isError } = usePublicGallery();
  const images = data ?? [];
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(images.map((g) => g.category).filter(Boolean)))],
    [images],
  );
  const filtered = active === "All" ? images : images.filter((g) => g.category === active);

  const prev = () => { if (lightbox !== null) setLightbox((i) => (i! - 1 + filtered.length) % filtered.length); };
  const next = () => { if (lightbox !== null) setLightbox((i) => (i! + 1) % filtered.length); };

  return (
    <div>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} image="/hero-kaaba.jpg">
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: bn ? "গ্যালারি" : "Gallery" },
        ]} />
      </PageHero>

      <Section tone="soft">
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map((c) => (
            <button key={c} type="button" onClick={() => setActive(c)}
              className={cn("px-4 py-2 rounded-full text-xs font-bold", active === c ? "bg-[#1B75BC] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]")}>
              {c === "All" ? t("filters.all") : c}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonBlock key={i} className="h-48 break-inside-avoid mb-4" />)}
          </div>
        )}
        {isError && <ErrorState message={bn ? "গ্যালারি লোড হয়নি।" : "Could not load gallery."} />}
        {!isLoading && !isError && filtered.length === 0 && <EmptyState message={bn ? "কোনো ছবি নেই।" : "No images yet."} />}

        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4 space-y-3 md:space-y-4">
          {filtered.map((g, i) => (
            <Reveal key={g.id} delay={(i % 4) * 0.04} className="break-inside-avoid">
              <button
                type="button"
                className="relative group w-full rounded-2xl overflow-hidden shadow-sm border border-[#E5E7EB] cursor-pointer text-left"
                onClick={() => setLightbox(i)}
              >
                <img src={mediaUrl(g.image, 600, 500)} alt={g.title} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-[#062D63]/0 group-hover:bg-[#062D63]/40 transition-all flex items-center justify-center">
                  <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-[#041E42]/90 to-transparent">
                  <div className="text-white text-xs font-semibold">{g.title}</div>
                  <div className="text-white/60 text-[10px]">{g.category}</div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </Section>

      {lightbox !== null && filtered[lightbox] && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center px-4" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button type="button" className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={() => setLightbox(null)} aria-label="Close"><X size={28} /></button>
          <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-white/10 rounded-full" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous"><ChevronLeft size={28} /></button>
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-white/10 rounded-full" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next"><ChevronRight size={28} /></button>
          <div className="max-w-4xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img src={mediaUrl(filtered[lightbox].image, 1200, 800)} alt={filtered[lightbox].title} className="w-full h-full object-contain rounded-2xl" />
            <div className="text-center mt-3">
              <div className="text-white font-semibold text-sm">{filtered[lightbox].title}</div>
              <div className="text-white/50 text-xs">{filtered[lightbox].category}</div>
              <div className="text-white/30 text-[10px] mt-1">{lightbox + 1} / {filtered.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
