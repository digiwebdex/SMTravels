import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  Menu, X, ChevronDown, Globe, Star, MapPin, Shield, Plane,
  Briefcase, Hotel, Phone, Mail, Facebook, Instagram, Youtube,
  Twitter, ChevronRight, Clock, MessageCircle, ArrowRight,
} from "lucide-react";
import { cn } from "../lib/utils";
import { BrandLogo } from "./BrandLogo";

// ─── WhatsApp Icon ────────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.524 5.847L0 24l6.335-1.501A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.032-1.387l-.36-.214-3.754.888.938-3.658-.235-.374A9.818 9.818 0 012.182 12c0-5.413 4.405-9.818 9.818-9.818 5.413 0 9.818 4.405 9.818 9.818 0 5.413-4.405 9.818-9.818 9.818z" />
    </svg>
  );
}

const SERVICE_NAV = [
  { label: "Hajj Management",  path: "/hajj",          icon: Star,     desc: "Govt-approved Hajj packages", color: "#F15A24" },
  { label: "Umrah Packages",   path: "/umrah",         icon: MapPin,   desc: "Year-round Umrah services",   color: "#1B75BC" },
  { label: "Visa Services",    path: "/visa",          icon: Shield,   desc: "50+ countries worldwide",      color: "#0E7C66" },
  { label: "Air Tickets",      path: "/air-ticket",    icon: Plane,    desc: "Best fares guaranteed",        color: "#2563EB" },
  { label: "Manpower",         path: "/manpower",      icon: Briefcase,desc: "International recruitment",   color: "#7C3AED" },
  { label: "Tour Packages",    path: "/tour-packages", icon: Globe,    desc: "Curated world tours",          color: "#EA580C" },
  { label: "Hotel Booking",    path: "/hotel-booking", icon: Hotel,    desc: "Premium accommodations",       color: "#0891B2" },
];

const MAIN_NAV = [
  { label: "Home",     path: "/" },
  { label: "About",    path: "/about" },
  { label: "Packages", path: "/packages" },
  { label: "Blog",     path: "/blog" },
  { label: "Gallery",  path: "/gallery" },
  { label: "FAQ",      path: "/faq" },
  { label: "Contact",  path: "/contact" },
];

// ─── HEADER ──────────────────────────────────────────────────────────────────
export function Header() {
  const [scrolled,      setScrolled]      = useState(false);
  const [servicesOpen,  setServicesOpen]  = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [lang,          setLang]          = useState("EN");
  const location = useLocation();

  /* scroll shadow */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* close everything on route change */
  useEffect(() => {
    setDrawerOpen(false);
    setServicesOpen(false);
    setServicesExpanded(false);
  }, [location.pathname]);

  /* body scroll-lock when drawer open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  const isServiceActive = SERVICE_NAV.some(s => location.pathname.startsWith(s.path));

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)]" : "bg-white/95 backdrop-blur-md"
      )}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-[60px] md:h-[68px] flex items-center gap-3 md:gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <BrandLogo className="h-10 md:h-11 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {["Home","About"].map(label => {
              const item = MAIN_NAV.find(n => n.label === label)!;
              return (
                <Link key={item.path} to={item.path}
                  className={cn("px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors",
                    isActive(item.path) ? "text-[#1B75BC] bg-[#1B75BC]/8 font-semibold" : "text-[#374151] hover:text-[#1B75BC] hover:bg-[#F3F4F6]"
                  )}>
                  {label}
                </Link>
              );
            })}

            {/* Services mega-dropdown */}
            <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
              <button className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer",
                isServiceActive ? "text-[#1B75BC] bg-[#1B75BC]/8 font-semibold" : "text-[#374151] hover:text-[#1B75BC] hover:bg-[#F3F4F6]"
              )}>
                Services <ChevronDown size={13} className={cn("transition-transform duration-200", servicesOpen && "rotate-180")} />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[560px] bg-white rounded-[16px] shadow-2xl border border-[#E5E7EB] p-4 z-50">
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_NAV.map(s => {
                      const Icon = s.icon;
                      return (
                        <Link key={s.path} to={s.path}
                          className="flex items-center gap-3 p-3 rounded-[10px] hover:bg-[#F7F8FA] transition-colors group">
                          <div className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                            <Icon size={17} style={{ color: s.color }} />
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-[#111827] group-hover:text-[#1B75BC] transition-colors">{s.label}</div>
                            <div className="text-[11px] text-[#9CA3AF]">{s.desc}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                    <Link to="/packages" className="flex items-center justify-between p-3 bg-[#1B75BC] rounded-[10px] hover:bg-[#14588F] transition-colors">
                      <div>
                        <div className="text-[13px] font-bold text-white">View All Packages</div>
                        <div className="text-[11px] text-white/60">Hajj, Umrah, Tour & more</div>
                      </div>
                      <ArrowRight size={16} className="text-[#D64A12]" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {MAIN_NAV.slice(2).map(item => (
              <Link key={item.path} to={item.path}
                className={cn("px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors",
                  isActive(item.path) ? "text-[#1B75BC] bg-[#1B75BC]/8 font-semibold" : "text-[#374151] hover:text-[#1B75BC] hover:bg-[#F3F4F6]"
                )}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 md:gap-2 ml-auto lg:ml-0">
            {/* Language — tablet+ */}
            <button onClick={() => setLang(l => l === "EN" ? "বাং" : "EN")}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-2 border border-[#E5E7EB] rounded-[8px] text-[12px] font-semibold text-[#374151] hover:border-[#1B75BC] transition-all cursor-pointer min-h-[40px]">
              <Globe size={13} className="text-[#9CA3AF]" /> {lang}
            </button>

            {/* Login — desktop only */}
            <Link to="/login"
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2.5 border-2 border-[#1B75BC] text-[#1B75BC] text-[12px] font-bold rounded-[8px] hover:bg-[#1B75BC]/5 transition-all min-h-[40px]">
              Login
            </Link>

            {/* Agent Register — tablet+ */}
            <Link to="/register"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#F15A24] text-white text-[12px] font-bold rounded-[8px] hover:bg-[#CC3C17] transition-all min-h-[40px]">
              Agent Register
            </Link>

            {/* Book Now — desktop */}
            <Link to="/book"
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1B75BC] text-white text-[12px] font-bold rounded-[8px] hover:bg-[#14588F] transition-all min-h-[40px]">
              Book Now
            </Link>

            {/* Hamburger — visible below lg */}
            <button
              onClick={() => setDrawerOpen(v => !v)}
              className="lg:hidden flex items-center justify-center w-11 h-11 rounded-[8px] text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer flex-shrink-0"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
            >
              {drawerOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "fixed inset-0 bg-black/40 z-[60] lg:hidden transition-opacity duration-300",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer panel — slides in from right */}
      <div className={cn(
        "fixed top-0 right-0 bottom-0 w-[88vw] max-w-[340px] bg-white z-[70] lg:hidden shadow-2xl",
        "flex flex-col overflow-hidden",
        "transition-transform duration-300 ease-out",
        drawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-[60px] border-b border-[#F3F4F6] flex-shrink-0">
          <Link to="/" className="flex items-center">
            <BrandLogo className="h-9 w-auto" />
          </Link>
          <button onClick={() => setDrawerOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-[8px] hover:bg-[#F3F4F6] text-[#374151] cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Drawer body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3">
            {/* Main links */}
            <div className="flex flex-col gap-0.5 mb-4">
              {MAIN_NAV.map(item => (
                <Link key={item.path} to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-[10px] text-[14px] font-medium transition-colors min-h-[48px]",
                    isActive(item.path) ? "bg-[#1B75BC] text-white font-semibold" : "text-[#374151] hover:bg-[#F3F4F6]"
                  )}>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Services accordion */}
            <div className="border-t border-[#F3F4F6] pt-3 mb-4">
              <button
                onClick={() => setServicesExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-bold text-[#9CA3AF] uppercase tracking-widest cursor-pointer"
              >
                Our Services
                <ChevronDown size={14} className={cn("transition-transform text-[#9CA3AF]", servicesExpanded && "rotate-180")} />
              </button>
              {servicesExpanded && (
                <div className="flex flex-col gap-0.5">
                  {SERVICE_NAV.map(s => (
                    <Link key={s.path} to={s.path}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-[10px] text-[13px] text-[#374151] hover:bg-[#F7F8FA] transition-colors min-h-[48px]">
                      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                        <s.icon size={15} style={{ color: s.color }} />
                      </div>
                      <div>
                        <div className="font-semibold">{s.label}</div>
                        <div className="text-[11px] text-[#9CA3AF]">{s.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth + Lang */}
            <div className="border-t border-[#F3F4F6] pt-3 flex flex-col gap-2 px-1">
              <Link to="/login"
                className="flex items-center justify-center min-h-[48px] border-2 border-[#1B75BC] text-[#1B75BC] font-bold rounded-[10px] text-[14px] hover:bg-[#1B75BC]/5 transition-colors">
                Customer Login
              </Link>
              <Link to="/register"
                className="flex items-center justify-center min-h-[48px] bg-[#F15A24] text-white font-bold rounded-[10px] text-[14px] hover:bg-[#CC3C17] transition-colors">
                Agent Register
              </Link>
              <button
                onClick={() => setLang(l => l === "EN" ? "বাং" : "EN")}
                className="flex items-center justify-center gap-2 min-h-[44px] border border-[#E5E7EB] text-[#374151] font-semibold rounded-[10px] text-[13px] hover:border-[#1B75BC]/30 transition-colors cursor-pointer">
                <Globe size={14} className="text-[#9CA3AF]" />
                {lang === "EN" ? "Switch to বাংলা" : "Switch to English"}
              </button>
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div className="border-t border-[#F3F4F6] px-4 py-3 flex-shrink-0 bg-[#F7F8FA]">
          <div className="text-[10px] text-[#9CA3AF] text-center">
            Hotline: <a href="tel:+88029553421" className="text-[#1B75BC] font-bold">+880 2 9553421</a>
            {" · "}Sun–Thu 9AM–6PM
          </div>
        </div>
      </div>

      {/* Header spacer */}
      <div className="h-[60px] md:h-[68px]" />
    </>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
export function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-[#17456B] text-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <BrandLogo variant="tile" className="w-11 h-11" />
              <div>
                <div className="text-[17px] font-black leading-tight">SM Travels International</div>
                <div className="text-[11px] text-white/50 tracking-wide">Your Trusted Travel Partner Since 1998</div>
              </div>
            </div>
            <p className="text-[13px] text-white/60 leading-relaxed mb-5 max-w-xs">
              Bangladesh's most trusted Hajj, Umrah & travel management company. Government-approved, ATAB licensed.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {["ATAB Member", "Govt. Approved", "ISO Certified"].map(b => (
                <span key={b} className="text-[10px] font-bold px-2.5 py-1 bg-white/10 rounded-full text-white/70 border border-white/15">{b}</span>
              ))}
            </div>
            <div className="flex gap-3">
              {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#F15A24] transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-white/40 mb-4">Quick Links</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: "Home",          path: "/" },
                { label: "About Us",      path: "/about" },
                { label: "All Packages",  path: "/packages" },
                { label: "Blog",          path: "/blog" },
                { label: "Gallery",       path: "/gallery" },
                { label: "FAQ",           path: "/faq" },
                { label: "Contact Us",    path: "/contact" },
                { label: "Book Online",   path: "/book" },
              ].map(l => (
                <li key={l.path}>
                  <Link to={l.path} className="text-[13px] text-white/60 hover:text-[#D64A12] transition-colors flex items-center gap-1.5">
                    <ChevronRight size={11} className="text-white/30" /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-white/40 mb-4">Services</h4>
            <ul className="flex flex-col gap-2.5">
              {SERVICE_NAV.map(s => (
                <li key={s.path}>
                  <Link to={s.path} className="text-[13px] text-white/60 hover:text-[#D64A12] transition-colors flex items-center gap-1.5">
                    <ChevronRight size={11} className="text-white/30" /> {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-white/40 mb-4">Contact</h4>
            <ul className="flex flex-col gap-3 mb-5">
              <li className="flex items-start gap-2 text-[13px] text-white/60">
                <MapPin size={13} className="text-[#D64A12] flex-shrink-0 mt-0.5" />
                32 Motijheel C/A, Dhaka-1000
              </li>
              <li><a href="tel:+88029553421" className="flex items-center gap-2 text-[13px] text-white/60 hover:text-white transition-colors">
                <Phone size={13} className="text-[#D64A12]" /> +880 2 9553421
              </a></li>
              <li><a href="mailto:info@smtravel.com.bd" className="flex items-center gap-2 text-[13px] text-white/60 hover:text-white transition-colors">
                <Mail size={13} className="text-[#D64A12]" /> info@smtravel.com.bd
              </a></li>
              <li className="flex items-center gap-2 text-[13px] text-white/60">
                <Clock size={13} className="text-[#D64A12]" /> Sun–Thu: 9AM – 6PM
              </li>
            </ul>
            {/* Newsletter */}
            <div>
              <div className="text-[12px] font-bold text-white/70 mb-2">Get Travel Updates</div>
              <div className="flex gap-2">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 min-w-0 px-3 py-2 bg-white/10 border border-white/20 rounded-[8px] text-[12px] text-white placeholder-white/30 outline-none focus:border-[#F15A24] transition-all" />
                <button onClick={() => setEmail("")}
                  className="w-9 h-9 flex-shrink-0 bg-[#F15A24] hover:bg-[#CC3C17] rounded-[8px] flex items-center justify-center transition-colors cursor-pointer">
                  <Mail size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-white/40">© 2025 SMTravel International Ltd. All rights reserved.</div>
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            {["Privacy Policy","Terms","Refund Policy"].map(l => (
              <a key={l} href="#" className="text-[10px] md:text-[11px] text-white/35 hover:text-white/60 transition-colors">{l}</a>
            ))}
            <Link to="/sitemap" className="text-[10px] md:text-[11px] text-white/35 hover:text-white/60 transition-colors">Sitemap</Link>
            <Link to="/ds" className="text-[10px] md:text-[11px] text-white/35 hover:text-white/60 transition-colors">Design System</Link>
          </div>
          <div className="text-[10px] text-white/30 w-full md:w-auto">ATAB License No. 0123 | Civil Aviation Approved</div>
        </div>
      </div>
    </footer>
  );
}

// ─── WHATSAPP FLOAT (desktop/tablet only — mobile uses bottom bar) ────────────
function WhatsAppFloat() {
  const [tip, setTip] = useState(false);
  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-40 flex-col items-end gap-2">
      {tip && (
        <div className="bg-white rounded-[12px] shadow-xl border border-[#E5E7EB] px-3 py-2 text-[12px] font-medium text-[#374151] whitespace-nowrap">
          💬 Chat on WhatsApp
        </div>
      )}
      <a href="https://wa.me/8801712345678?text=Hello%20SMTravel"
        target="_blank" rel="noopener noreferrer"
        onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}
        className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all"
        aria-label="Chat on WhatsApp">
        <WhatsAppIcon size={26} />
      </a>
    </div>
  );
}

// ─── MOBILE STICKY BOTTOM BAR ─────────────────────────────────────────────────
function MobileBottomBar() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] px-4 py-3 safe-area-inset-bottom">
      <div className="flex gap-3">
        {/* WhatsApp */}
        <a href="https://wa.me/8801712345678?text=Hello%20SMTravel"
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-[#25D366] text-white font-bold rounded-[12px] text-[14px] hover:bg-[#1da855] transition-colors">
          <WhatsAppIcon size={18} />
          WhatsApp
        </a>
        {/* Book Now */}
        <Link to="/book"
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-[#1B75BC] text-white font-bold rounded-[12px] text-[14px] hover:bg-[#14588F] transition-colors">
          Book Now
        </Link>
      </div>
    </div>
  );
}

// ─── ROOT LAYOUT ─────────────────────────────────────────────────────────────
export function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter','Noto Sans Bengali',sans-serif" }}>
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Bottom spacing on mobile for sticky bar */}
      <div className="md:hidden h-[72px]" />
      <Footer />
      <WhatsAppFloat />
      <MobileBottomBar />
    </div>
  );
}
