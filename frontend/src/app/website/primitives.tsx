import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronRight, Play, Star } from "lucide-react";
import { cn, fmtPrice, mediaUrl } from "../lib/utils";
import type { PublicPackageItem, PublicTestimonialItem } from "../hooks/publicContent";

export function Reveal({
  children, className, delay = 0, y = 24,
}: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Section({
  children, className, id, tone = "white",
}: {
  children: React.ReactNode; className?: string; id?: string;
  tone?: "white" | "tint" | "navy" | "soft";
}) {
  const bg =
    tone === "tint" ? "bg-[#EAF5FF]" :
    tone === "navy" ? "bg-[#062D63] text-white" :
    tone === "soft" ? "bg-[#F7F8FA]" : "bg-white";
  return (
    <section id={id} className={cn("py-14 md:py-20", bg, className)}>
      <div className="max-w-[1240px] mx-auto px-4 md:px-5">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow, title, subtitle, action, light,
}: {
  eyebrow?: string; title: string; subtitle?: string;
  action?: React.ReactNode; light?: boolean;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-14">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className={cn(
            "text-xs font-bold uppercase tracking-[0.2em] mb-3",
            light ? "text-[#C89B3C]" : "text-[#F15A24]",
          )}>{eyebrow}</p>
        )}
        <h2 className={cn(
          "text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-tight tracking-tight",
          light ? "text-white" : "text-[#062D63]",
        )} style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
        {subtitle && (
          <p className={cn("mt-3 text-base md:text-lg leading-relaxed", light ? "text-white/75" : "text-[#6B7280]")}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="opacity-60" aria-hidden />}
            {item.to ? (
              <Link to={item.to} className="hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded">
                {item.label}
              </Link>
            ) : (
              <span className="text-white font-medium" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({
  eyebrow, title, subtitle, image, children, compact,
}: {
  eyebrow?: string; title: string; subtitle?: string; image?: string;
  children?: React.ReactNode; compact?: boolean;
}) {
  const src = image
    ? (image.startsWith("/") || image.startsWith("http") ? image : mediaUrl(image, 1920, 1080))
    : "/hero-kaaba.jpg";
  return (
    <div className={cn("relative overflow-hidden bg-[#062D63]", compact ? "min-h-[36vh]" : "min-h-[48vh]")}>
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#041E42]/95 via-[#062D63]/80 to-[#062D63]/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#041E42]/90 via-transparent to-[#062D63]/30" />
      <div className={cn("relative max-w-[1240px] mx-auto px-4 md:px-5 pt-24 pb-12 md:pt-32", compact ? "md:pb-12" : "md:pb-16")}>
        {eyebrow && <p className="text-[#C89B3C] text-xs font-bold uppercase tracking-[0.2em] mb-3">{eyebrow}</p>}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight max-w-3xl leading-[1.15]">
          {title}
        </h1>
        {subtitle && <p className="mt-3 text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}

export function Btn({
  to, href, children, variant = "primary", size = "md", className, onClick, type = "button", disabled,
}: {
  to?: string; href?: string; children: React.ReactNode;
  variant?: "primary" | "orange" | "ghost" | "outline" | "white";
  size?: "sm" | "md" | "lg"; className?: string;
  onClick?: () => void; type?: "button" | "submit"; disabled?: boolean;
}) {
  const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-3 text-[15px]", lg: "px-8 py-3.5 text-base" };
  const variants = {
    primary: "bg-[#1B75BC] text-white hover:bg-[#14588F] shadow-lg shadow-[#1B75BC]/25",
    orange: "bg-[#F15A24] text-white hover:bg-[#CC3C17] shadow-lg shadow-[#F15A24]/25",
    ghost: "bg-white/10 text-white hover:bg-white/20 backdrop-blur",
    outline: "border-2 border-[#1B75BC] text-[#1B75BC] hover:bg-[#EAF5FF]",
    white: "bg-white text-[#062D63] hover:bg-[#EAF5FF]",
  };
  const cls = cn(
    "inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B75BC] disabled:opacity-50",
    sizes[size], variants[variant], className,
  );
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  if (href) return <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{children}</a>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-[#E5E7EB]", className)} aria-hidden />;
}

export function IconCard({
  to, icon: Icon, title, desc, color = "#1B75BC",
}: {
  to: string; icon: React.ElementType; title: string; desc: string; color?: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col items-center text-center p-5 rounded-lg bg-white border border-[#D6EAF8] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#1B75BC] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B75BC]"
    >
      <div
        className="w-14 h-14 rounded-md flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${color}14`, color }}
      >
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <h3 className="font-semibold text-[#062D63] text-[15px] mb-1">{title}</h3>
      <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">{desc}</p>
    </Link>
  );
}

export function GuideCard({
  to, icon: Icon, title, summary,
}: { to: string; icon: React.ElementType; title: string; summary: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col p-5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#1B75BC]/40 hover:shadow-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B75BC]"
    >
      <div className="w-11 h-11 rounded-md bg-[#EAF5FF] text-[#1B75BC] flex items-center justify-center mb-3 group-hover:bg-[#1B75BC] group-hover:text-white transition-colors">
        <Icon size={20} />
      </div>
      <h3 className="font-semibold text-[#062D63] mb-1.5 group-hover:text-[#1B75BC] transition-colors">{title}</h3>
      <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2 flex-1">{summary}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1B75BC]">
        বিস্তারিত দেখুন <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function PackageCard({ pkg }: { pkg: PublicPackageItem }) {
  return (
    <Link
      to={`/packages/${pkg.slug || pkg.id}`}
      className="group flex flex-col rounded-lg overflow-hidden bg-white border border-[#E5E7EB] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B75BC]"
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        <img
          src={mediaUrl(pkg.image, 800, 550)}
          alt={pkg.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {pkg.badge && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F15A24] text-white">
            {pkg.badge}
          </span>
        )}
        {pkg.seats > 0 && pkg.seats <= 12 && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-[#062D63]">
            {pkg.seats} seats left
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <p className="text-white font-bold text-lg drop-shadow" style={{ fontFamily: "var(--font-display)" }}>
            {fmtPrice(pkg.price)}
          </p>
          {pkg.originalPrice && pkg.originalPrice > pkg.price && (
            <p className="text-white/70 text-sm line-through">{fmtPrice(pkg.originalPrice)}</p>
          )}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1B75BC] mb-1">{pkg.type}</p>
        <h3 className="font-semibold text-[#062D63] text-lg leading-snug mb-3 group-hover:text-[#1B75BC] transition-colors">
          {pkg.title}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-[#6B7280] mb-4">
          <span>{pkg.duration}</span>
          <span className="truncate">{pkg.flight || "—"}</span>
          <span className="truncate col-span-2">{pkg.hotel || "—"}</span>
        </div>
        {(pkg.highlights?.length ?? 0) > 0 && (
          <ul className="flex flex-wrap gap-1.5 mb-4">
            {pkg.highlights.slice(0, 3).map((h) => (
              <li key={h} className="px-2 py-0.5 rounded-full bg-[#EAF5FF] text-[#062D63] text-[10px] font-medium">{h}</li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
          <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
            <Star size={12} className="text-[#C89B3C] fill-[#C89B3C]" /> {pkg.rating.toFixed(1)}
            <span className="text-[#9CA3AF]">({pkg.reviews})</span>
          </span>
          <span className="text-sm font-semibold text-[#F15A24] inline-flex items-center gap-1">
            বিস্তারিত <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TestimonialCard({ t }: { t: PublicTestimonialItem }) {
  return (
    <div className="relative p-6 md:p-8 rounded-lg bg-white border border-[#E5E7EB] shadow-sm h-full">
      <div className="flex gap-0.5 mb-4" aria-label={`${t.stars} stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} className={i < t.stars ? "text-[#C89B3C] fill-[#C89B3C]" : "text-[#E5E7EB]"} />
        ))}
      </div>
      <p className="text-[#374151] leading-relaxed mb-6 text-[15px]">“{t.text}”</p>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1B75BC] to-[#062D63] text-white flex items-center justify-center font-bold text-sm">
          {t.initial || t.name.slice(0, 1)}
        </div>
        <div>
          <p className="font-semibold text-[#062D63] text-sm">{t.name}</p>
          <p className="text-xs text-[#6B7280]">{t.city}{t.package ? ` · ${t.package}` : ""}</p>
        </div>
      </div>
    </div>
  );
}

export function VideoCard({
  title, youtubeId, duration, views, category,
}: { title: string; youtubeId: string; duration?: string; views?: string; category?: string }) {
  const thumb = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  return (
    <a
      href={`https://www.youtube.com/watch?v=${youtubeId}`}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-lg overflow-hidden bg-white border border-[#E5E7EB] shadow-sm hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B75BC]"
    >
      <div className="relative aspect-video overflow-hidden">
        <img src={thumb} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/95 text-[#F15A24] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play size={22} className="ml-0.5 fill-current" />
          </div>
        </div>
        {duration && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 text-white text-[11px] font-medium">{duration}</span>
        )}
      </div>
      <div className="p-4">
        {category && <p className="text-[11px] font-bold uppercase tracking-wider text-[#1B75BC] mb-1">{category}</p>}
        <h3 className="font-semibold text-[#062D63] text-sm leading-snug line-clamp-2 group-hover:text-[#1B75BC]">{title}</h3>
        {views && <p className="text-xs text-[#9CA3AF] mt-1.5">{views}</p>}
      </div>
    </a>
  );
}

export function StatCounter({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) { setVal(end); return; }
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(end * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.35 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, reduce]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-semibold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        {val.toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-sm text-white/70 font-medium">{label}</p>
    </div>
  );
}

export function AccordionFAQ({ items }: { items: { id: string; question: string; answer: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id} className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : item.id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-[#062D63] hover:bg-[#EAF5FF]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B75BC]"
            >
              <span>{item.question}</span>
              <ChevronRight size={18} className={cn("text-[#1B75BC] transition-transform flex-shrink-0", isOpen && "rotate-90")} />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-[#6B7280] leading-relaxed text-[15px] border-t border-[#F3F4F6] pt-3">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CtaBand({ title, subtitle, primary, secondary }: {
  title: string; subtitle?: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#062D63] via-[#1B75BC] to-[#062D63] p-8 md:p-12 text-center">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#F15A24]/20 blur-3xl" aria-hidden />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#C89B3C]/15 blur-3xl" aria-hidden />
      <h3 className="relative text-2xl md:text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
      {subtitle && <p className="relative mt-3 text-white/75 max-w-xl mx-auto">{subtitle}</p>}
      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
        <Btn to={primary.to} variant="orange" size="lg">{primary.label}</Btn>
        {secondary && <Btn to={secondary.to} variant="ghost" size="lg">{secondary.label}</Btn>}
      </div>
    </div>
  );
}

export function Newsletter({ onSubmit }: { onSubmit?: (email: string) => void }) {
  const [email, setEmail] = useState("");
  return (
    <form
      className="flex flex-col sm:flex-row gap-3"
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(email); setEmail(""); }}
    >
      <label className="sr-only" htmlFor="newsletter-email">Email</label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="আপনার ইমেইল"
        className="flex-1 px-5 py-3.5 rounded-md border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C89B3C]"
      />
      <Btn type="submit" variant="orange" size="lg">সাবস্ক্রাইব</Btn>
    </form>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#F7F8FA] px-6 py-16 text-center text-[#6B7280]">
      {message}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700 text-sm">
      {message}
    </div>
  );
}
