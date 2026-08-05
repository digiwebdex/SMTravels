import React from "react";
import { Link } from "react-router";
import { Star, MapPin, ArrowRight } from "lucide-react";
import { usePublicCmsPage, usePublicTestimonials } from "../hooks/publicContent";
import { BRANCHES } from "../lib/data";

/** Thin CMS page — loads published CmsPage by slug and renders body. */
export function CmsContentPage({ slug, fallbackTitle }: { slug: string; fallbackTitle?: string }) {
  const { page, isLoading, isError } = usePublicCmsPage(slug);

  return (
    <>
      <section className="bg-[#1B75BC] py-14 text-white">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-2">SM Travels</div>
          <h1 className="text-3xl font-black mb-2">
            {page?.title ?? fallbackTitle ?? (isLoading ? "Loading…" : "Page")}
          </h1>
          {page?.metaDesc && <p className="text-white/60 text-sm max-w-2xl">{page.metaDesc}</p>}
        </div>
      </section>

      <section className="py-12 md:py-16 bg-[#F7F8FA]">
        <div className="max-w-[900px] mx-auto px-6">
          {isLoading && <p className="text-sm text-slate-400">Loading content…</p>}
          {isError && !page && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-600 mb-4">This page is not available yet.</p>
              <Link to="/" className="text-sm text-[#1B75BC] font-semibold hover:underline">Back to home</Link>
            </div>
          )}
          {page?.body && (
            <article className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 prose prose-slate max-w-none">
              <div className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap">{page.body}</div>
            </article>
          )}
        </div>
      </section>
    </>
  );
}

export function PrivacyPage() { return <CmsContentPage slug="privacy" fallbackTitle="Privacy Policy" />; }
export function TermsPage() { return <CmsContentPage slug="terms" fallbackTitle="Terms of Use" />; }
export function RefundPage() { return <CmsContentPage slug="refund" fallbackTitle="Refund Policy" />; }
export function CareerPage() { return <CmsContentPage slug="career" fallbackTitle="Careers" />; }
export function HotelsInfoPage() { return <CmsContentPage slug="hotels" fallbackTitle="Hotel Booking" />; }
export function TransportPage() { return <CmsContentPage slug="transport" fallbackTitle="Transport Services" />; }

export function BranchesPage() {
  const { page, isLoading } = usePublicCmsPage("branches");

  return (
    <>
      <section className="bg-[#1B75BC] py-14 text-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-2">SM Travels</div>
          <h1 className="text-3xl font-black mb-2">{page?.title ?? "Our Branches"}</h1>
          <p className="text-white/60 text-sm">{page?.metaDesc ?? "Visit us across Bangladesh"}</p>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {BRANCHES.map((b) => (
            <div key={b.city} className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B75BC]/10 flex items-center justify-center">
                  <MapPin size={18} className="text-[#1B75BC]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{b.name}</h2>
                  <p className="text-sm text-slate-500">{b.city}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2">{b.address}</p>
              <p className="text-sm text-slate-600">{b.phone} · {b.mobile}</p>
              <p className="text-sm text-slate-500 mt-1">{b.email}</p>
              <p className="text-xs text-slate-400 mt-2">{b.hours}</p>
            </div>
          ))}
        </div>
        {page?.body && !isLoading && (
          <div className="max-w-[900px] mx-auto px-6 mt-10">
            <article className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
              <div className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap">{page.body}</div>
            </article>
          </div>
        )}
      </section>
    </>
  );
}

export function TestimonialsPage() {
  const { testimonials, isLoading } = usePublicTestimonials();

  return (
    <>
      <section className="bg-[#1B75BC] py-14 text-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-[#D64A12] text-[12px] font-bold uppercase tracking-widest mb-2">Reviews</div>
          <h1 className="text-3xl font-black mb-2">Customer Testimonials</h1>
          <p className="text-white/60 text-sm">What pilgrims and travellers say about SM Travels</p>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-6">
          {isLoading && <p className="text-sm text-slate-400 mb-4">Loading…</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {testimonials.map((t, i) => (
              <div key={`${t.name}-${i}`} className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#1B75BC] text-white flex items-center justify-center font-bold">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.city}{t.package ? ` · ${t.package}` : ""}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={12} className={s < t.stars ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B75BC] hover:underline">
              Share your experience <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
