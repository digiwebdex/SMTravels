import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, ZoomIn, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePublicGallery } from "../hooks/publicContent";
import { cn } from "../lib/utils";

export function GalleryPage() {
  const { t } = useTranslation("gallery");
  const { images, isLoading } = usePublicGallery();
  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(images.map(g => g.category)))],
    [images],
  );

  const filtered = active === "All" ? images : images.filter(g => g.category === active);

  const prev = () => {
    if (lightbox === null) return;
    setLightbox(i => (i! - 1 + filtered.length) % filtered.length);
  };

  const next = () => {
    if (lightbox === null) return;
    setLightbox(i => (i! + 1) % filtered.length);
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-[#1B75BC] py-14 text-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-2">{t("hero.eyebrow")}</div>
          <h1 className="text-3xl font-black mb-2">{t("hero.title")}</h1>
          <p className="text-white/60 text-sm">{t("hero.subtitle")}</p>
        </div>
      </section>

      <section className="py-12 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap mb-8">
            {categories.map(c => (
              <button key={c} onClick={() => setActive(c)}
                className={cn("px-4 py-2 rounded-full text-[12px] font-bold transition-all cursor-pointer",
                  active === c ? "bg-[#1B75BC] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#1B75BC]/30"
                )}>
                {c === "All" ? t("filters.all") : c}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-[#6B7280] gap-2">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading gallery…</span>
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4 space-y-3 md:space-y-4">
              {filtered.map((g, i) => (
                <div key={String(g.id)} className="break-inside-avoid relative group cursor-pointer rounded-[12px] overflow-hidden shadow-sm border border-[#E5E7EB]"
                  onClick={() => setLightbox(i)}>
                  <img src={g.src} alt={g.caption}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-[#1B75BC]/0 group-hover:bg-[#1B75BC]/40 transition-all duration-300 flex items-center justify-center">
                    <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-[#1B75BC]/80 to-transparent">
                    <div className="text-white text-[11px] font-semibold">{g.caption}</div>
                    <div className="text-white/60 text-[10px]">{g.category}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && filtered[lightbox] && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center px-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white cursor-pointer p-2" onClick={() => setLightbox(null)}>
            <X size={28} />
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white cursor-pointer p-2 bg-white/10 rounded-full"
            onClick={e => { e.stopPropagation(); prev(); }}>
            <ChevronLeft size={28} />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white cursor-pointer p-2 bg-white/10 rounded-full"
            onClick={e => { e.stopPropagation(); next(); }}>
            <ChevronRight size={28} />
          </button>
          <div className="max-w-4xl max-h-[85vh] w-full" onClick={e => e.stopPropagation()}>
            <img src={filtered[lightbox].src} alt={filtered[lightbox].caption}
              className="w-full h-full object-contain rounded-[12px]" />
            <div className="text-center mt-3">
              <div className="text-white font-semibold text-sm">{filtered[lightbox].caption}</div>
              <div className="text-white/50 text-[11px]">{filtered[lightbox].category}</div>
              <div className="text-white/30 text-[10px] mt-1">{lightbox + 1} / {filtered.length}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
