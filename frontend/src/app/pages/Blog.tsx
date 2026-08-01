import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Search, Clock, User, Tag, Calendar } from "lucide-react";
import { usePublicBlog, usePublicBlogPost } from "../hooks/publicContent";
import {
  PageHero, Breadcrumbs, Section, SkeletonBlock, EmptyState, ErrorState, Btn, Reveal,
} from "../website/primitives";
import { mediaUrl, cn } from "../lib/utils";

export function BlogPage() {
  const { t, i18n } = useTranslation("blog");
  const bn = i18n.language?.startsWith("bn");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data, isLoading, isError } = usePublicBlog({ q: search || undefined, limit: 50 });
  const posts = data?.data ?? [];
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((b) => b.category).filter(Boolean)))],
    [posts],
  );
  const filtered = posts.filter((b) => activeCategory === "All" || b.category === activeCategory);
  const featured = posts.find((b) => b.featured) ?? posts[0];

  return (
    <div>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} image="/hero-journey.jpg">
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: bn ? "ব্লগ" : "Blog" },
        ]} />
      </PageHero>

      <Section tone="soft">
        {isLoading && <SkeletonBlock className="h-64 mb-8" />}
        {isError && <ErrorState message={bn ? "ব্লগ লোড হয়নি।" : "Could not load blog posts."} />}

        {!isLoading && !isError && featured && (
          <Reveal>
            <Link to={`/blog/${featured.slug || featured.id}`} className="block mb-10 rounded-lg overflow-hidden border border-[#E5E7EB] bg-white hover:shadow-xl transition-all group">
              <div className="grid md:grid-cols-2">
                <div className="relative h-56 md:h-auto min-h-[260px] overflow-hidden">
                  <img src={mediaUrl(featured.image, 900, 600)} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-4 left-4 bg-[#F15A24] text-white text-[10px] font-bold px-3 py-1 rounded-full">{t("featured")}</span>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-[#1B75BC] bg-[#EAF5FF] rounded-full px-3 py-1 w-fit mb-3">{featured.category}</span>
                  <h2 className="text-2xl font-semibold text-[#062D63] mb-3 group-hover:text-[#1B75BC]" style={{ fontFamily: "var(--font-display)" }}>{featured.title}</h2>
                  <p className="text-sm text-[#6B7280] leading-relaxed mb-5 line-clamp-3">{featured.excerpt}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-[#9CA3AF]">
                    <span className="inline-flex items-center gap-1"><User size={12} />{featured.author}</span>
                    <span className="inline-flex items-center gap-1"><Calendar size={12} />{featured.date}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={12} />{featured.readTime} {t("meta.read")}</span>
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>
        )}

        <div className="flex flex-wrap gap-3 mb-7 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("filters.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 border border-[#E5E7EB] rounded-full text-sm bg-white outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => setActiveCategory(c)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-bold", activeCategory === c ? "bg-[#1B75BC] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]")}>
                {c === "All" ? t("filters.all") : c}
              </button>
            ))}
          </div>
        </div>

        {!isLoading && !isError && filtered.length === 0 && <EmptyState message={t("empty.title")} />}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b, i) => (
            <Reveal key={b.id} delay={i * 0.04}>
              <Link to={`/blog/${b.slug || b.id}`} className="block rounded-lg overflow-hidden border border-[#E5E7EB] bg-white hover:shadow-lg hover:-translate-y-1 transition-all group h-full">
                <div className="relative h-48 overflow-hidden">
                  <img src={mediaUrl(b.image, 600, 350)} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <span className="absolute top-3 left-3 bg-[#1B75BC] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{b.category}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[#062D63] mb-2 group-hover:text-[#1B75BC] leading-snug">{b.title}</h3>
                  <p className="text-sm text-[#6B7280] line-clamp-2 mb-3">{b.excerpt}</p>
                  <div className="flex justify-between text-[11px] text-[#9CA3AF]">
                    <span className="inline-flex items-center gap-1"><User size={10} />{b.author}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={10} />{b.readTime} {t("meta.read")}</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>
    </div>
  );
}

export function BlogDetailPage() {
  const { t, i18n } = useTranslation("blog");
  const bn = i18n.language?.startsWith("bn");
  const { id } = useParams();
  const { data: blog, isLoading, isError } = usePublicBlogPost(id);
  const { data: list } = usePublicBlog({ limit: 6 });
  const related = (list?.data ?? []).filter((b) => b.id !== blog?.id && b.slug !== blog?.slug).slice(0, 3);

  if (isLoading) {
    return <><SkeletonBlock className="h-[42vh] rounded-none" /><Section><SkeletonBlock className="h-64" /></Section></>;
  }

  if (isError || !blog) {
    return (
      <div>
        <PageHero title={t("detail.notFound")} image="/hero-journey.jpg" compact>
          <Breadcrumbs items={[{ label: bn ? "হোম" : "Home", to: "/" }, { label: "Blog", to: "/blog" }, { label: "404" }]} />
        </PageHero>
        <Section>
          <EmptyState message={t("detail.notFound")} />
          <div className="mt-6 text-center"><Btn to="/blog">{t("detail.backToBlog")}</Btn></div>
        </Section>
      </div>
    );
  }

  const paragraphs = (blog.body || blog.excerpt || "").split(/\n\n+/).filter(Boolean);

  return (
    <div>
      <div className="relative min-h-[46vh] overflow-hidden bg-[#062D63]">
        <img src={mediaUrl(blog.image, 1920, 800)} alt={blog.title} className="absolute inset-0 w-full h-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041E42] via-[#062D63]/65 to-transparent" />
        <div className="relative max-w-[1100px] mx-auto px-4 md:px-6 pt-28 pb-12">
          <Breadcrumbs items={[
            { label: bn ? "হোম" : "Home", to: "/" },
            { label: bn ? "ব্লগ" : "Blog", to: "/blog" },
            { label: blog.category },
          ]} />
          <h1 className="text-3xl md:text-4xl font-semibold text-white max-w-3xl leading-snug" style={{ fontFamily: "var(--font-display)" }}>{blog.title}</h1>
        </div>
      </div>

      <Section tone="soft">
        <div className="grid lg:grid-cols-3 gap-8">
          <article className="lg:col-span-2 bg-white rounded-lg border border-[#E5E7EB] p-7">
            <div className="flex flex-wrap gap-4 items-center mb-6 pb-5 border-b border-[#F3F4F6] text-sm text-[#6B7280]">
              <span className="inline-flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-[#EAF5FF] text-[#1B75BC] font-bold text-xs flex items-center justify-center">{blog.author?.[0]}</span>{blog.author}</span>
              <span className="inline-flex items-center gap-1"><Calendar size={12} />{blog.date}</span>
              <span className="inline-flex items-center gap-1"><Clock size={12} />{blog.readTime} {t("meta.read")}</span>
              <span className="bg-[#EAF5FF] text-[#1B75BC] text-[10px] font-bold px-2.5 py-1 rounded-full">{blog.category}</span>
            </div>
            <div className="space-y-4">
              {paragraphs.map((para, i) => (
                <p key={i} className="text-[15px] text-[#374151] leading-7">{para.trim()}</p>
              ))}
            </div>
            {(blog.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-5 border-t border-[#F3F4F6]">
                {blog.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs bg-[#F7F8FA] border border-[#E5E7EB] rounded-full px-3 py-1 text-[#6B7280]">
                    <Tag size={10} />{tag}
                  </span>
                ))}
              </div>
            )}
          </article>

          <aside className="space-y-5">
            <div className="rounded-lg bg-[#062D63] p-6 text-white">
              <h4 className="font-semibold text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>{t("detail.ctaTitle")}</h4>
              <p className="text-white/70 text-sm mb-4">{t("detail.ctaText")}</p>
              <Btn to="/book" variant="orange" className="w-full">{t("detail.getFreeQuote")}</Btn>
            </div>
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-5">
              <h4 className="font-semibold text-[#062D63] mb-4">{t("detail.related")}</h4>
              <div className="space-y-4">
                {related.map((r) => (
                  <Link key={r.id} to={`/blog/${r.slug || r.id}`} className="flex gap-3 group">
                    <img src={mediaUrl(r.image, 120, 90)} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-semibold text-[#374151] group-hover:text-[#1B75BC] leading-snug mb-1">{r.title}</h5>
                      <span className="text-[10px] text-[#9CA3AF]">{r.readTime} {t("meta.read")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </div>
  );
}
