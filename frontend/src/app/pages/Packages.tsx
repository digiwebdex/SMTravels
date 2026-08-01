import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Star, Clock, MapPin, CheckCircle, XCircle, Users, Hotel, Plane, Phone, Search,
} from "lucide-react";
import { usePublicPackages, usePublicPackage } from "../hooks/publicContent";
import {
  PageHero, Breadcrumbs, Section, PackageCard, SkeletonBlock, EmptyState, ErrorState, Btn, Reveal,
} from "../website/primitives";
import { fmtPrice, cn, mediaUrl } from "../lib/utils";

const TYPES = ["All", "HAJJ", "UMRAH", "TOUR"] as const;

function normalizeTypeParam(raw: string | null): (typeof TYPES)[number] {
  if (!raw) return "All";
  const u = raw.toUpperCase();
  if (u === "HAJJ" || u === "UMRAH" || u === "TOUR") return u;
  return "All";
}

export function PackagesPage() {
  const { t, i18n } = useTranslation("packages");
  const bn = i18n.language?.startsWith("bn");
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState<(typeof TYPES)[number]>(() => normalizeTypeParam(searchParams.get("type")));
  const [search, setSearch] = useState("");

  useEffect(() => {
    setType(normalizeTypeParam(searchParams.get("type")));
  }, [searchParams]);

  const { data, isLoading, isError } = usePublicPackages({
    type: type === "All" ? undefined : type,
    q: search || undefined,
    limit: 50,
  });
  const packages = data?.data ?? [];

  return (
    <div>
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.heading")}
        subtitle={t("hero.subtitle")}
        image="/hero-kaaba.jpg"
      >
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: bn ? "প্যাকেজ" : "Packages" },
        ]} />
      </PageHero>

      <Section tone="soft">
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("list.searchPlaceholder")}
              className="w-full pl-11 pr-4 py-3.5 rounded-full border border-[#E5E7EB] bg-white text-sm text-[#062D63] outline-none focus:ring-2 focus:ring-[#1B75BC]/30 focus:border-[#1B75BC]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => {
                  setType(tp);
                  if (tp === "All") setSearchParams({});
                  else setSearchParams({ type: tp });
                }}
                className={cn(
                  "px-4 py-2.5 rounded-full text-xs font-bold transition-all min-h-[44px]",
                  type === tp ? "bg-[#1B75BC] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#1B75BC]/40",
                )}
              >
                {tp === "All" ? t("filters.type.all") : t(`filters.type.${tp.toLowerCase()}`, { defaultValue: tp })}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-80" />)}
          </div>
        )}
        {isError && <ErrorState message={bn ? "প্যাকেজ লোড করা যায়নি।" : "Could not load packages."} />}
        {!isLoading && !isError && packages.length === 0 && (
          <EmptyState message={t("list.emptyTitle")} />
        )}
        {!isLoading && !isError && packages.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 0.04}>
                <PackageCard pkg={pkg} />
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

export function PackageDetailPage() {
  const { t, i18n } = useTranslation("packages");
  const bn = i18n.language?.startsWith("bn");
  const { id } = useParams();
  const { data: pkg, isLoading, isError } = usePublicPackage(id);
  const [tab, setTab] = useState<"overview" | "itinerary" | "inclusions">("overview");
  const [form, setForm] = useState({ name: "", phone: "", pax: "2", date: "" });

  const tabs = useMemo(() => (["overview", "itinerary", "inclusions"] as const), []);

  if (isLoading) {
    return (
      <div>
        <SkeletonBlock className="h-[42vh] rounded-none" />
        <Section><SkeletonBlock className="h-64" /></Section>
      </div>
    );
  }

  if (isError || !pkg) {
    return (
      <div>
        <PageHero title={t("detail.notFound")} image="/hero-kaaba.jpg" compact>
          <Breadcrumbs items={[
            { label: bn ? "হোম" : "Home", to: "/" },
            { label: bn ? "প্যাকেজ" : "Packages", to: "/packages" },
            { label: "404" },
          ]} />
        </PageHero>
        <Section>
          <EmptyState message={t("detail.notFound")} />
          <div className="mt-6 text-center"><Btn to="/packages">{t("detail.backToPackages")}</Btn></div>
        </Section>
      </div>
    );
  }

  return (
    <div>
      <div className="relative min-h-[48vh] overflow-hidden bg-[#062D63]">
        <img src={mediaUrl(pkg.image, 1920, 800)} alt={pkg.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041E42] via-[#062D63]/60 to-transparent" />
        <div className="relative max-w-[1200px] mx-auto px-4 md:px-6 pt-28 pb-12">
          <Breadcrumbs items={[
            { label: bn ? "হোম" : "Home", to: "/" },
            { label: bn ? "প্যাকেজ" : "Packages", to: "/packages" },
            { label: pkg.title },
          ]} />
          <p className="text-[#C89B3C] text-xs font-bold uppercase tracking-[0.2em] mb-2">{pkg.type}</p>
          <h1 className="text-3xl md:text-5xl font-semibold text-white max-w-3xl" style={{ fontFamily: "var(--font-display)" }}>{pkg.title}</h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/75">
            <span className="inline-flex items-center gap-1.5"><Clock size={14} />{pkg.duration}</span>
            <span className="inline-flex items-center gap-1.5"><Hotel size={14} />{pkg.hotel}</span>
            <span className="inline-flex items-center gap-1.5"><Star size={14} className="text-[#C89B3C] fill-[#C89B3C]" />{pkg.rating} ({pkg.reviews})</span>
            <span className="inline-flex items-center gap-1.5"><Users size={14} />{t("detail.seatsRemaining", { seats: pkg.seats })}</span>
          </div>
        </div>
      </div>

      <Section tone="soft">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex gap-1 bg-white rounded-2xl p-1 border border-[#E5E7EB] w-fit max-w-full overflow-x-auto">
              {tabs.map((tb) => (
                <button
                  key={tb}
                  type="button"
                  onClick={() => setTab(tb)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap",
                    tab === tb ? "bg-[#1B75BC] text-white" : "text-[#6B7280] hover:text-[#062D63]",
                  )}
                >
                  {t(`detail.tabs.${tb}`)}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="space-y-5">
                {pkg.longDesc && (
                  <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                    <p className="text-[#374151] leading-relaxed">{pkg.longDesc}</p>
                  </div>
                )}
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                  <h3 className="text-lg font-semibold text-[#062D63] mb-3" style={{ fontFamily: "var(--font-display)" }}>{t("detail.overview.highlights")}</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(pkg.highlights ?? []).map((h) => (
                      <div key={h} className="flex items-center gap-2 text-sm text-[#374151]">
                        <CheckCircle size={14} className="text-[#16A34A]" />{h}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: t("detail.fields.duration"), val: pkg.duration, icon: Clock },
                      { label: t("detail.fields.hotel"), val: pkg.hotel, icon: Hotel },
                      { label: t("detail.fields.flight"), val: pkg.flight, icon: Plane },
                      { label: t("detail.fields.departure"), val: pkg.departure, icon: MapPin },
                    ].map((d) => (
                      <div key={d.label} className="rounded-2xl bg-[#EAF5FF] p-3">
                        <d.icon size={16} className="text-[#1B75BC] mb-1" />
                        <p className="text-[10px] uppercase font-bold text-[#6B7280]">{d.label}</p>
                        <p className="text-xs font-semibold text-[#062D63]">{d.val || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "itinerary" && (
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                <div className="space-y-4 relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E5E7EB]" />
                  {(pkg.itinerary ?? []).map((day, i) => (
                    <div key={i} className="flex gap-5 relative">
                      <div className="w-8 h-8 rounded-full bg-[#1B75BC] text-white text-xs font-bold flex items-center justify-center z-10 border-4 border-white shadow">{i + 1}</div>
                      <div className="pb-3">
                        <p className="font-semibold text-[#062D63] text-sm mb-1">{day.title}</p>
                        <p className="text-sm text-[#6B7280]">{day.desc}</p>
                      </div>
                    </div>
                  ))}
                  {(pkg.itinerary?.length ?? 0) === 0 && <EmptyState message={bn ? "ইটিনারারি শীঘ্রই।" : "Itinerary coming soon."} />}
                </div>
              </div>
            )}

            {tab === "inclusions" && (
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                  <h3 className="font-semibold text-[#062D63] mb-4 inline-flex items-center gap-2"><CheckCircle size={18} className="text-[#16A34A]" />{t("detail.inclusions.included")}</h3>
                  <ul className="space-y-2">
                    {(pkg.includes ?? []).map((i) => (
                      <li key={i} className="flex gap-2 text-sm text-[#374151]"><CheckCircle size={14} className="text-[#16A34A] mt-0.5" />{i}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                  <h3 className="font-semibold text-[#062D63] mb-4 inline-flex items-center gap-2"><XCircle size={18} className="text-red-500" />{t("detail.inclusions.excluded")}</h3>
                  <ul className="space-y-2">
                    {(pkg.excludes ?? []).map((e) => (
                      <li key={e} className="flex gap-2 text-sm text-[#374151]"><XCircle size={14} className="text-red-500 mt-0.5" />{e}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 self-start">
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-lg">
              <p className="text-3xl font-semibold text-[#1B75BC]" style={{ fontFamily: "var(--font-display)" }}>{fmtPrice(pkg.price)}</p>
              <p className="text-xs text-[#9CA3AF] mb-3">{t("detail.perPerson")}</p>
              {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                <p className="text-sm text-[#9CA3AF] line-through mb-2">{fmtPrice(pkg.originalPrice)}</p>
              )}
              <p className="inline-flex items-center gap-1 bg-[#FEF9C3] text-[#B45309] text-[11px] font-bold px-2.5 py-1 rounded-full mb-4">
                {t("detail.onlySeatsLeft", { seats: pkg.seats })}
              </p>
              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <input placeholder={t("detail.form.namePlaceholder")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
                <input placeholder="+880 1X XXX XXXXX" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
                <select value={form.pax} onChange={(e) => setForm((f) => ({ ...f, pax: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm bg-white">
                  {["1", "2", "3", "4", "5", "6+"].map((n) => <option key={n}>{n}</option>)}
                </select>
                <Btn to={`/book?package=${pkg.slug || pkg.id}`} variant="primary" className="w-full">{t("detail.form.submit")}</Btn>
                <a href="https://wa.me/8801712345678" target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 bg-[#25D366] hover:bg-[#1da855] text-white font-bold rounded-full text-sm flex items-center justify-center gap-2">
                  <Phone size={14} /> {t("detail.form.whatsapp")}
                </a>
              </form>
              <p className="mt-4 pt-4 border-t border-[#F3F4F6] text-xs text-[#9CA3AF] inline-flex items-center gap-2">
                <CheckCircle size={13} className="text-[#16A34A]" />{t("detail.form.reassurance")}
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </div>
  );
}
