import React from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail, Clock, Video } from "lucide-react";
import { usePublicPage, usePublicTestimonials } from "../hooks/publicContent";
import {
  PageHero, Breadcrumbs, Section, SkeletonBlock, EmptyState, ErrorState,
  TestimonialCard, Reveal, Btn, CtaBand,
} from "../website/primitives";
import { cn } from "../lib/utils";
import { BRANCHES } from "../lib/data";
import { usePageMeta } from "../lib/usePageMeta";

function CmsBodyPage({
  slug, fallbackTitle, fallbackBody, image = "/hero-makkah-poster.jpg",
}: {
  slug: string; fallbackTitle: string; fallbackBody: string; image?: string;
}) {
  const { i18n } = useTranslation();
  const bn = i18n.language?.startsWith("bn");
  const { data, isLoading, isError } = usePublicPage(slug);
  const title = data?.title || fallbackTitle;
  const body = data?.body || fallbackBody;

  return (
    <div>
      <PageHero title={title} subtitle={data?.metaDesc || undefined} image={image} compact>
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: title },
        ]} />
      </PageHero>
      <Section>
        {isLoading && <SkeletonBlock className="h-48" />}
        {isError && !data && (
          <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed whitespace-pre-wrap">{fallbackBody}</div>
        )}
        {!isLoading && !isError && (
          body.includes("<") ? (
            <div
              className="prose prose-sm max-w-none text-[#374151] leading-relaxed [&_h2]:text-[#062D63] [&_h3]:text-[#062D63] [&_a]:text-[#1B75BC]"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed whitespace-pre-wrap">{body}</div>
          )
        )}
      </Section>
    </div>
  );
}

export function PrivacyPage() {
  const { i18n } = useTranslation();
  const bn = i18n.language?.startsWith("bn");
  return (
    <CmsBodyPage
      slug="privacy"
      image="/hero-makkah-poster.jpg"
      fallbackTitle={bn ? "গোপনীয়তা নীতি" : "Privacy Policy"}
      fallbackBody={bn
        ? "এসএম ট্রাভেলস আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখে। আমরা শুধুমাত্র সেবা প্রদানের জন্য প্রয়োজনীয় তথ্য সংগ্রহ করি এবং তৃতীয় পক্ষের সাথে অননুমোদিতভাবে শেয়ার করি না।"
        : "SM Travels protects your personal information. We collect only what is needed to deliver services and do not share data with third parties without authorization."}
    />
  );
}

export function TermsPage() {
  const { i18n } = useTranslation();
  const bn = i18n.language?.startsWith("bn");
  return (
    <CmsBodyPage
      slug="terms"
      image="/hero-makkah-poster.jpg"
      fallbackTitle={bn ? "সেবার শর্তাবলি" : "Terms of Service"}
      fallbackBody={bn
        ? "আমাদের সেবা ব্যবহারের অর্থ আপনি এসএম ট্রাভেলসের বুকিং, বাতিলকরণ এবং পেমেন্ট নীতিমালা মেনে নিয়েছেন। প্যাকেজ-নির্দিষ্ট শর্ত প্রযোজ্য।"
        : "By using our services you agree to SM Travels booking, cancellation, and payment policies. Package-specific terms apply."}
    />
  );
}

export function RefundPage() {
  const { i18n } = useTranslation();
  const bn = i18n.language?.startsWith("bn");
  return (
    <CmsBodyPage
      slug="refund"
      image="/hero-makkah-poster.jpg"
      fallbackTitle={bn ? "রিফান্ড নীতি" : "Refund Policy"}
      fallbackBody={bn
        ? "রিফান্ড এয়ারলাইন, হোটেল এবং ভিসা নিয়ম অনুযায়ী নির্ধারিত হয়। বাতিলের সময়সীমা প্যাকেজ নিশ্চিতকরণে উল্লেখ থাকে। বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।"
        : "Refunds follow airline, hotel, and visa rules. Cancellation windows are stated on package confirmation. Contact us for details."}
    />
  );
}

export function CareerPage() {
  const { i18n } = useTranslation();
  const bn = i18n.language?.startsWith("bn");
  return (
    <div>
      <CmsBodyPage
        slug="career"
        image="/hero-makkah-poster.jpg"
        fallbackTitle={bn ? "ক্যারিয়ার" : "Careers"}
        fallbackBody={bn
          ? "এসএম ট্রাভেলসে যোগ দিন — হজ্ব, উমরাহ, ভিসা ও কস্টমার সার্ভিস টিমে প্রতিভাবান মানুষ খুঁজছি। সিভি পাঠান: hr@smtravel.com.bd"
          : "Join SM Travels — we hire for Hajj, Umrah, visa, and customer service teams. Send your CV to hr@smtravel.com.bd"}
      />
      <Section tone="tint" className="!pt-0">
        <CtaBand
          title={bn ? "আগ্রহী?" : "Interested?"}
          subtitle={bn ? "আমাদের টিমে আপনার জায়গা হতে পারে।" : "There may be a place for you on our team."}
          primary={{ label: bn ? "যোগাযোগ" : "Contact", to: "/contact" }}
        />
      </Section>
    </div>
  );
}

export function BranchesPage() {
  const { i18n } = useTranslation();
  const bn = i18n.language?.startsWith("bn");
  const { data } = usePublicPage("branches");

  return (
    <div>
      <PageHero
        eyebrow={bn ? "যোগাযোগ" : "Visit us"}
        title={data?.title || (bn ? "আমাদের শাখা" : "Our Branches")}
        subtitle={data?.metaDesc || (bn ? "সারা বাংলাদেশে সেবা।" : "Serving pilgrims across Bangladesh.")}
        image="/hero-makkah-poster.jpg"
      >
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: bn ? "শাখা" : "Branches" },
        ]} />
      </PageHero>
      <Section tone="sky">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BRANCHES.map((branch, i) => (
            <Reveal key={branch.city} delay={i * 0.05}>
              <div className={cn(
                "bg-white rounded-xl border p-6 h-full shadow-sm hover:shadow-lg transition-shadow",
                i === 0 ? "border-[#F37021]" : "border-[#E5E7EB]",
              )}>
                {i === 0 && <p className="text-[10px] font-bold text-[#F37021] uppercase tracking-widest mb-2">{bn ? "প্রধান কার্যালয়" : "Head Office"}</p>}
                <h3 className="text-lg font-bold text-[#002D62] mb-3" style={{ fontFamily: "var(--font-display)" }}>{branch.city}</h3>
                <ul className="space-y-2.5 text-sm text-[#6B7280]">
                  <li className="flex gap-2"><MapPin size={14} className="text-[#F37021] mt-0.5 flex-shrink-0" />{branch.address}</li>
                  <li><a href={`tel:${branch.phone}`} className="flex gap-2 hover:text-[#1B75BC]"><Phone size={14} className="text-[#F37021]" />{branch.phone}</a></li>
                  <li><a href={`mailto:${branch.email}`} className="flex gap-2 hover:text-[#1B75BC]"><Mail size={14} className="text-[#F37021]" />{branch.email}</a></li>
                  <li className="flex gap-2"><Clock size={14} className="text-[#F37021]" />{branch.hours}</li>
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
        {data?.body && (
          data.body.includes("<") ? (
            <div className="mt-10 prose prose-sm max-w-none text-[#374151]" dangerouslySetInnerHTML={{ __html: data.body }} />
          ) : (
            <div className="mt-10 prose prose-sm max-w-none text-[#374151] whitespace-pre-wrap">{data.body}</div>
          )
        )}
      </Section>
    </div>
  );
}

export function TestimonialsPage() {
  const { i18n } = useTranslation();
  const bn = i18n.language?.startsWith("bn");
  const { data, isLoading, isError } = usePublicTestimonials();
  const items = data ?? [];

  return (
    <div>
      <PageHero
        eyebrow={bn ? "আস্থা" : "Trust"}
        title={bn ? "হাজিরদের মতামত" : "Pilgrim Testimonials"}
        subtitle={bn ? "যারা আমাদের সাথে হজ্ব ও উমরাহ করেছেন।" : "From those who travelled with us."}
        image="/hero-makkah-poster.jpg"
      >
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: bn ? "প্রশংসাপত্র" : "Testimonials" },
        ]} />
      </PageHero>
      <Section tone="mint">
        {isLoading && <div className="grid md:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-48" />)}</div>}
        {isError && <ErrorState message={bn ? "লোড হয়নি।" : "Could not load testimonials."} />}
        {!isLoading && !isError && items.length === 0 && <EmptyState message={bn ? "এখনো কোনো মতামত নেই।" : "No testimonials yet."} />}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.04}>
              <TestimonialCard t={item} />
            </Reveal>
          ))}
        </div>
      </Section>
      <Section tone="warm">
        <CtaBand
          title={bn ? "আপনার যাত্রা শুরু করুন" : "Start your journey"}
          primary={{ label: bn ? "বুকিং" : "Book", to: "/book" }}
          secondary={{ label: bn ? "যোগাযোগ" : "Contact", to: "/contact" }}
        />
      </Section>
    </div>
  );
}

export function VideosPage() {
  const { i18n } = useTranslation();
  const bn = i18n.language?.startsWith("bn");
  usePageMeta(bn ? "ভিডিও গ্যালারি" : "Video Gallery", "Hajj and Umrah video guides from SM Travels International — coming soon.");

  return (
    <div>
      <PageHero
        eyebrow={bn ? "শেখা" : "Learn"}
        title={bn ? "ভিডিও গ্যালারি" : "Video Gallery"}
        subtitle={bn ? "হজ্ব, উমরাহ ও ভ্রমণ গাইড ভিডিও শীঘ্রই আসছে।" : "Hajj, Umrah & travel guide videos are coming soon."}
        image="/hero-makkah-poster.jpg"
      >
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: bn ? "ভিডিও" : "Videos" },
        ]} />
      </PageHero>
      <Section tone="sky">
        <div className="max-w-xl mx-auto text-center py-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#EAF5FF] text-[#1B75BC] flex items-center justify-center">
            <Video size={28} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#002D62] mb-2">
            {bn ? "ভিডিও শীঘ্রই আসছে" : "Videos coming soon"}
          </h2>
          <p className="text-[#6B7280] leading-relaxed">
            {bn
              ? "আমরা হজ্ব ও উমরাহ গাইড ভিডিও তৈরি করছি। ততক্ষণে আমাদের জ্ঞান কেন্দ্র দেখুন।"
              : "We’re producing our Hajj & Umrah guide videos. In the meantime, explore our Knowledge Hub."}
          </p>
          <div className="mt-6">
            <Btn to="/knowledge" variant="primary">{bn ? "জ্ঞান কেন্দ্র দেখুন" : "Visit Knowledge Hub"}</Btn>
          </div>
        </div>
      </Section>
    </div>
  );
}
