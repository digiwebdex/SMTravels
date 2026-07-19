import React, { useState } from "react";
import { Link, useParams } from "react-router";
import { Search, Clock, User, Tag, ArrowRight, Calendar, ChevronRight } from "lucide-react";
import { BLOGS } from "../lib/data";
import { img, cn } from "../lib/utils";

// ─── BLOG LIST ─────────────────────────────────────────────────────────────────
export function BlogPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(BLOGS.map(b => b.category)))];

  const filtered = BLOGS.filter(b => {
    if (activeCategory !== "All" && b.category !== activeCategory) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const featured = BLOGS[0];

  return (
    <>
      {/* Hero */}
      <section className="bg-[#14356B] py-14 text-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-[#C9A227] text-[12px] font-bold uppercase tracking-widest mb-2">Travel Knowledge</div>
          <h1 className="text-3xl font-black mb-2">Travel Insights & Guides</h1>
          <p className="text-white/60 text-sm">Expert tips, Hajj guides, visa advice, and travel inspiration from our team</p>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          {/* Featured */}
          <Link to={`/blog/${featured.id}`} className="block mb-8 md:mb-12 bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] hover:shadow-xl transition-all duration-200 group">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-[260px] md:h-auto overflow-hidden">
                <img src={img(featured.image, 800, 500)} alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-[#C9A227] text-[#14356B] text-[10px] font-black px-3 py-1 rounded-full">
                  Featured
                </div>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="text-[11px] font-bold text-[#14356B] bg-[#14356B]/10 rounded-full px-3 py-1 inline-block mb-3 w-fit">
                  {featured.category}
                </div>
                <h2 className="text-xl font-black text-[#111827] group-hover:text-[#14356B] transition-colors mb-3 leading-snug">{featured.title}</h2>
                <p className="text-[13px] text-[#6B7280] leading-relaxed mb-5 line-clamp-3">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-[11px] text-[#9CA3AF]">
                  <span className="flex items-center gap-1"><User size={11} />{featured.author}</span>
                  <span className="flex items-center gap-1"><Calendar size={11} />{featured.date}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{featured.readTime} read</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5 md:mb-7 items-center">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-9 pr-4 py-2 border border-[#E5E7EB] rounded-[10px] text-[12px] bg-white outline-none focus:border-[#14356B]" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setActiveCategory(c)}
                  className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer",
                    activeCategory === c ? "bg-[#14356B] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#14356B]/30"
                  )}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map(b => (
              <Link key={b.id} to={`/blog/${b.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <div className="relative h-48 overflow-hidden">
                  <img src={img(b.image, 600, 350)} alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-[#14356B] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {b.category}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-[14px] font-bold text-[#111827] group-hover:text-[#14356B] transition-colors mb-2 leading-snug">{b.title}</h3>
                  <p className="text-[12px] text-[#6B7280] leading-relaxed line-clamp-2 mb-3">{b.excerpt}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#9CA3AF]">
                    <span className="flex items-center gap-1"><User size={10} />{b.author}</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{b.readTime} read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#9CA3AF]">
              <p className="text-[15px] font-semibold">No articles found</p>
              <button onClick={() => { setSearch(""); setActiveCategory("All"); }}
                className="mt-3 text-[13px] text-[#14356B] font-bold hover:underline cursor-pointer">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ─── BLOG DETAIL ──────────────────────────────────────────────────────────────
export function BlogDetailPage() {
  const { id } = useParams();
  const blog = BLOGS.find(b => String(b.id) === id);
  const related = BLOGS.filter(b => String(b.id) !== id).slice(0, 3);

  if (!blog) {
    return (
      <div className="py-32 text-center">
        <p className="text-[#6B7280]">Article not found.</p>
        <Link to="/blog" className="mt-4 inline-block text-[#14356B] font-bold hover:underline">← Back to Blog</Link>
      </div>
    );
  }

  const articleContent = `
    ${blog.excerpt}

    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Hajj and Umrah represent the pinnacle of Islamic devotion — a physical, spiritual, and emotional journey that millions of Muslims from around the world undertake each year.

    Planning a successful pilgrimage requires months of careful preparation, from obtaining the necessary documents and visas to selecting the right package and understanding the rituals involved. At SMTravel International, we have guided thousands of pilgrims through this sacred journey over our 25+ years of service.

    Key considerations for a successful pilgrimage include: choosing a reputable, government-licensed agency; securing your Hajj or Umrah slot well in advance; ensuring all medical requirements are met; and attending the mandatory pre-departure orientation sessions.

    Our expert guides are available throughout the journey to provide spiritual guidance, handle logistics, and ensure that every pilgrim can focus on what truly matters — their connection with Allah and the performance of the sacred rites.
  `;

  return (
    <>
      {/* Hero */}
      <section className="relative h-[240px] sm:h-[300px] md:h-[380px] overflow-hidden">
        <img src={img(blog.image, 1920, 700)} alt={blog.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14356B]/90 via-[#14356B]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-[1100px] mx-auto">
          <div className="flex items-center gap-2 text-white/60 text-[11px] mb-3">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight size={11} />
            <Link to="/blog" className="hover:text-white">Blog</Link>
            <ChevronRight size={11} />
            <span className="text-white/80 truncate">{blog.category}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-snug max-w-3xl">{blog.title}</h1>
        </div>
      </section>

      <section className="py-12 bg-[#F7F8FA]">
        <div className="max-w-[1100px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            {/* Article */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                <div className="p-7">
                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 items-center mb-6 pb-5 border-b border-[#F3F4F6]">
                    <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                      <div className="w-7 h-7 bg-[#14356B]/10 rounded-full flex items-center justify-center font-bold text-[#14356B] text-[11px]">
                        {blog.author[0]}
                      </div>
                      {blog.author}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]"><Calendar size={11} />{blog.date}</span>
                    <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]"><Clock size={11} />{blog.readTime} read</span>
                    <span className="bg-[#14356B]/10 text-[#14356B] text-[10px] font-bold px-2.5 py-1 rounded-full">{blog.category}</span>
                  </div>

                  {/* Content */}
                  <div className="prose prose-sm max-w-none">
                    {articleContent.trim().split("\n\n").map((para, i) => (
                      <p key={i} className="text-[13px] text-[#374151] leading-7 mb-4">{para.trim()}</p>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-7 pt-5 border-t border-[#F3F4F6]">
                    {blog.tags?.map(t => (
                      <span key={t} className="flex items-center gap-1 text-[11px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-full px-3 py-1 text-[#6B7280]">
                        <Tag size={10} />{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              {/* CTA */}
              <div className="bg-[#14356B] rounded-2xl p-5 text-white">
                <h4 className="text-[14px] font-black mb-2">Plan Your Hajj / Umrah</h4>
                <p className="text-white/60 text-[12px] mb-4">Talk to our specialists today and get a personalized quote.</p>
                <Link to="/book" className="block text-center py-2.5 bg-[#C9A227] text-[#14356B] font-bold rounded-[10px] text-[12px] hover:bg-[#B8911F] transition-colors">
                  Get Free Quote
                </Link>
              </div>

              {/* Related */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                <h4 className="text-[14px] font-black text-[#111827] mb-4">Related Articles</h4>
                <div className="flex flex-col gap-4">
                  {related.map(r => (
                    <Link key={r.id} to={`/blog/${r.id}`} className="flex gap-3 group">
                      <img src={img(r.image, 120, 90)} alt={r.title}
                        className="w-16 h-16 rounded-[8px] object-cover flex-shrink-0" />
                      <div>
                        <h5 className="text-[12px] font-semibold text-[#374151] group-hover:text-[#14356B] transition-colors leading-snug mb-1">{r.title}</h5>
                        <span className="text-[10px] text-[#9CA3AF]">{r.readTime} read</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
