import React, { useState } from "react";
import { Link } from "react-router";
import { ChevronDown, ChevronUp, Search, MessageCircle, Phone } from "lucide-react";
import { FAQS } from "../lib/data";
import { cn } from "../lib/utils";

// FAQS is Record<string, {q,a}[]> — convert to array for rendering
const FAQ_ARRAY = Object.entries(FAQS).map(([category, items]) => ({ category, items }));

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border rounded-[12px] overflow-hidden transition-all", open ? "border-[#14356B]/30 shadow-sm" : "border-[#E5E7EB]")}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-[#F7F8FA] transition-colors cursor-pointer gap-3">
        <span className="text-[14px] font-semibold text-[#111827]">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-[#14356B] flex-shrink-0" />
          : <ChevronDown size={16} className="text-[#9CA3AF] flex-shrink-0" />}
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
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const categories = FAQ_ARRAY.map(c => c.category);

  const allFiltered = search.trim()
    ? FAQ_ARRAY.flatMap(c => c.items.filter(q =>
        q.q.toLowerCase().includes(search.toLowerCase()) ||
        q.a.toLowerCase().includes(search.toLowerCase())
      ))
    : FAQ_ARRAY[active]?.items ?? [];

  return (
    <>
      {/* Hero */}
      <section className="bg-[#14356B] py-16 text-center text-white">
        <div className="max-w-[700px] mx-auto px-6">
          <div className="text-[#C9A227] text-[12px] font-bold uppercase tracking-widest mb-2">Help Center</div>
          <h1 className="text-3xl font-black mb-3">Frequently Asked Questions</h1>
          <p className="text-white/60 text-sm mb-7">Find answers to the most common questions about our services.</p>
          <div className="relative max-w-lg mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-3 bg-white rounded-[12px] text-[13px] text-[#111827] outline-none placeholder-[#D1D5DB] border border-white/10"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-[#F7F8FA]">
        <div className="max-w-[1100px] mx-auto px-6">
          {!search && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6 md:mb-8 flex-nowrap md:flex-wrap">
              {categories.map((cat, i) => (
                <button key={cat} onClick={() => { setActive(i); }}
                  className={cn("flex-shrink-0 px-4 py-2.5 rounded-full text-[12px] font-bold transition-all cursor-pointer min-h-[44px]",
                    active === i ? "bg-[#14356B] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#14356B]/30 hover:text-[#14356B]"
                  )}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {search && (
            <div className="mb-4 text-[13px] text-[#6B7280]">
              Found <strong className="text-[#111827]">{allFiltered.length}</strong> result{allFiltered.length !== 1 ? "s" : ""} for "<strong className="text-[#14356B]">{search}</strong>"
            </div>
          )}

          <div className="flex flex-col gap-3">
            {allFiltered.length > 0
              ? allFiltered.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)
              : (
                <div className="text-center py-12 text-[#9CA3AF]">
                  <p className="text-[14px]">No results found for "{search}"</p>
                  <p className="text-[12px] mt-1">Try different keywords or contact our support team</p>
                </div>
              )
            }
          </div>

          {/* Contact CTA */}
          <div className="mt-12 bg-white rounded-2xl border border-[#E5E7EB] p-7 text-center">
            <h3 className="text-[17px] font-black text-[#111827] mb-2">Still have questions?</h3>
            <p className="text-[13px] text-[#6B7280] mb-5">Our team is available 6 days a week to help you.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#14356B] text-white font-bold rounded-[10px] text-sm hover:bg-[#0F2A55] transition-colors">
                <MessageCircle size={14} /> Contact Us
              </Link>
              <a href="tel:+88029553421" className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#14356B] text-[#14356B] font-bold rounded-[10px] text-sm hover:bg-[#14356B]/5 transition-colors">
                <Phone size={14} /> Call Hotline
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
