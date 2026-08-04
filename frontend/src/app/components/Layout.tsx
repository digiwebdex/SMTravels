import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  Menu, X, ChevronDown, Globe, Star, MapPin, Shield, Plane,
  Briefcase, Hotel, Phone, Mail, Facebook, Instagram, Youtube,
  Twitter, ChevronRight, Clock, MessageCircle, ArrowRight, Calendar,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";
import { BrandLogo } from "./BrandLogo";
import { AiChatWidget } from "./AiChatWidget";
import { PwaInstallBanner } from "./PwaInstallBanner";
import { useLang } from "../i18n/useLang";
import { CONTACT, telUrl, whatsappUrl } from "../lib/contact";

// ─── WhatsApp Icon ────────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.524 5.847L0 24l6.335-1.501A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.032-1.387l-.36-.214-3.754.888.938-3.658-.235-.374A9.818 9.818 0 012.182 12c0-5.413 4.405-9.818 9.818-9.818 5.413 0 9.818 4.405 9.818 9.818 0 5.413-4.405 9.818-9.818 9.818z" />
    </svg>
  );
}

// `labelKey`/`descKey` resolve in the "layout" namespace; `label` kept as a
// stable lookup id (see desktop nav) — display text always comes from t().
const SERVICE_NAV = [
  { label: "Hajj Management",  labelKey: "serviceNav.hajj.label",      descKey: "serviceNav.hajj.desc",      path: "/hajj",          icon: Star,     color: "#F15A24" },
  { label: "Umrah Packages",   labelKey: "serviceNav.umrah.label",     descKey: "serviceNav.umrah.desc",     path: "/umrah",         icon: MapPin,   color: "#1B75BC" },
  { label: "Visa Services",    labelKey: "serviceNav.visa.label",      descKey: "serviceNav.visa.desc",      path: "/visa",          icon: Shield,   color: "#0E7C66" },
  { label: "Air Tickets",      labelKey: "serviceNav.airTicket.label", descKey: "serviceNav.airTicket.desc", path: "/air-ticket",    icon: Plane,    color: "#2563EB" },
  { label: "Manpower",         labelKey: "serviceNav.manpower.label",  descKey: "serviceNav.manpower.desc",  path: "/manpower",      icon: Briefcase,color: "#7C3AED" },
  { label: "Tour Packages",    labelKey: "serviceNav.tour.label",      descKey: "serviceNav.tour.desc",      path: "/tour-packages", icon: Globe,    color: "#EA580C" },
  { label: "Hotel Booking",    labelKey: "serviceNav.hotel.label",     descKey: "serviceNav.hotel.desc",     path: "/hotel-booking", icon: Hotel,    color: "#0891B2" },
];

const MAIN_NAV = [
  { label: "Home",     i18nKey: "common:nav.home",     path: "/" },
  { label: "About",    i18nKey: "common:nav.about",    path: "/about" },
  { label: "Packages", i18nKey: "common:nav.packages", path: "/packages" },
  { label: "Blog",     i18nKey: "common:nav.blog",     path: "/blog" },
  { label: "Gallery",  i18nKey: "common:nav.gallery",  path: "/gallery" },
  { label: "FAQ",      i18nKey: "common:nav.faq",      path: "/faq" },
  { label: "Contact",  i18nKey: "common:nav.contact",  path: "/contact" },
];

// ─── HEADER ──────────────────────────────────────────────────────────────────
export function Header() {
  const [scrolled,      setScrolled]      = useState(false);
  const [servicesOpen,  setServicesOpen]  = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const { t } = useTranslation("layout");
  const { lang, toggle } = useLang();
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
        scrolled
          ? "bg-[var(--color-surface)] shadow-[var(--elevation-2)]"
          : "bg-[var(--color-surface)]/95 backdrop-blur-md shadow-none"
      )}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-[60px] md:h-[68px] flex items-center gap-3 md:gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <BrandLogo className="h-11 md:h-12 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0">
            {["Home","About"].map(label => {
              const item = MAIN_NAV.find(n => n.label === label)!;
              return (
                <Link key={item.path} to={item.path}
                  className={cn("px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors",
                    isActive(item.path) ? "text-[#1B75BC] bg-[#1B75BC]/8 font-semibold" : "text-[#374151] hover:text-[#1B75BC] hover:bg-[#F3F4F6]"
                  )}>
                  {t(item.i18nKey)}
                </Link>
              );
            })}

            {/* Services mega-dropdown */}
            <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
              <button className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer",
                isServiceActive ? "text-[#1B75BC] bg-[#1B75BC]/8 font-semibold" : "text-[#374151] hover:text-[#1B75BC] hover:bg-[#F3F4F6]"
              )}>
                {t("common:nav.services")} <ChevronDown size={13} className={cn("transition-transform duration-200", servicesOpen && "rotate-180")} />
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
                            <div className="text-[13px] font-semibold text-[#111827] group-hover:text-[#1B75BC] transition-colors">{t(s.labelKey)}</div>
                            <div className="text-[11px] text-[#9CA3AF]">{t(s.descKey)}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                    <Link to="/packages" className="flex items-center justify-between p-3 bg-[var(--color-primary)] rounded-[10px] hover:bg-[var(--color-primary-hover)] transition-colors">
                      <div>
                        <div className="text-[13px] font-bold text-white">{t("services.viewAllPackages")}</div>
                        <div className="text-[11px] text-white/60">{t("services.viewAllSub")}</div>
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
                {t(item.i18nKey)}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 md:gap-2 ml-auto lg:ml-0">
            {/* Language — tablet+ */}
            <button onClick={toggle}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-2 border border-[#E5E7EB] rounded-[8px] text-[12px] font-semibold text-[#374151] hover:border-[#1B75BC] transition-all cursor-pointer min-h-[40px]">
              <Globe size={13} className="text-[#9CA3AF]" /> {lang === "bn" ? "বাংলা" : "EN"}
            </button>

            {/* Action buttons — i18n pattern: whitespace-nowrap + shrink-0 = content-sized,
                never clip/wrap when Bangla labels run longer; px-3 xl:px-4 buys space at lg. */}
            {/* Login — desktop only */}
            <Link to="/login"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 xl:px-4 py-2.5 border-2 border-[var(--color-primary)] text-[var(--color-primary)] text-[12px] font-bold rounded-[8px] hover:bg-[var(--color-primary)]/5 transition-all min-h-[40px] whitespace-nowrap shrink-0">
              {t("common:actions.login")}
            </Link>

            {/* Agent Register — tablet+ */}
            <Link to="/register"
              className="hidden md:inline-flex items-center gap-1.5 px-3 xl:px-4 py-2.5 bg-[var(--color-brand-mark)] text-white text-[12px] font-bold rounded-[8px] hover:bg-[var(--color-brand-mark-hover)] transition-all min-h-[40px] whitespace-nowrap shrink-0">
              {t("common:actions.agentRegister")}
            </Link>

            {/* Book Now — desktop */}
            <Link to="/book"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 xl:px-4 py-2.5 bg-[var(--color-primary)] text-white text-[12px] font-bold rounded-[8px] hover:bg-[var(--color-primary-hover)] transition-all min-h-[40px] whitespace-nowrap shrink-0">
              {t("common:actions.bookNow")}
            </Link>

            {/* Hamburger — visible below lg */}
            <button
              onClick={() => setDrawerOpen(v => !v)}
              className="lg:hidden flex items-center justify-center w-11 h-11 rounded-[8px] text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer flex-shrink-0"
              aria-label={drawerOpen ? t("aria.closeMenu") : t("aria.openMenu")}
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
                  {t(item.i18nKey)}
                </Link>
              ))}
            </div>

            {/* Services accordion */}
            <div className="border-t border-[#F3F4F6] pt-3 mb-4">
              <button
                onClick={() => setServicesExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-bold text-[#9CA3AF] uppercase tracking-widest cursor-pointer"
              >
                {t("nav.ourServices")}
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
                        <div className="font-semibold">{t(s.labelKey)}</div>
                        <div className="text-[11px] text-[#9CA3AF]">{t(s.descKey)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth + Lang */}
            <div className="border-t border-[#F3F4F6] pt-3 flex flex-col gap-2 px-1">
              <Link to="/login"
                className="flex items-center justify-center min-h-[48px] border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-bold rounded-[10px] text-[14px] hover:bg-[var(--color-primary)]/5 transition-colors">
                {t("mobile.customerLogin")}
              </Link>
              <Link to="/register"
                className="flex items-center justify-center min-h-[48px] bg-[var(--color-brand-mark)] text-white font-bold rounded-[10px] text-[14px] hover:bg-[var(--color-brand-mark-hover)] transition-colors">
                {t("common:actions.agentRegister")}
              </Link>
              <button
                onClick={toggle}
                className="flex items-center justify-center gap-2 min-h-[44px] border border-[#E5E7EB] text-[#374151] font-semibold rounded-[10px] text-[13px] hover:border-[#1B75BC]/30 transition-colors cursor-pointer">
                <Globe size={14} className="text-[#9CA3AF]" />
                {lang === "en" ? t("common:lang.switchToBn") : t("common:lang.switchToEn")}
              </button>
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div className="border-t border-[#F3F4F6] px-4 py-3 flex-shrink-0 bg-[#F7F8FA]">
          <div className="text-[10px] text-[#9CA3AF] text-center">
            {t("drawer.hotline")}: <a href="tel:+88029553421" className="text-[#1B75BC] font-bold">+880 2 9553421</a>
            {" · "}{t("drawer.hours")}
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
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
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
                <div className="text-[17px] font-black leading-tight">{t("common:brand.name")}</div>
                <div className="text-[11px] text-white/50 tracking-wide">{t("footer.tagline")}</div>
              </div>
            </div>
            <p className="text-[13px] text-white/60 leading-relaxed mb-5 max-w-xs">
              {t("footer.about")}
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {[t("footer.badges.atab"), t("footer.badges.govt"), t("footer.badges.iso")].map(b => (
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
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-white/40 mb-4">{t("footer.quickLinks")}</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { i18nKey: "common:nav.home",          path: "/" },
                { i18nKey: "footer.links.aboutUs",     path: "/about" },
                { i18nKey: "footer.links.allPackages", path: "/packages" },
                { i18nKey: "common:nav.blog",          path: "/blog" },
                { i18nKey: "common:nav.gallery",       path: "/gallery" },
                { i18nKey: "common:nav.faq",           path: "/faq" },
                { i18nKey: "footer.links.contactUs",   path: "/contact" },
                { i18nKey: "footer.links.bookOnline",  path: "/book" },
              ].map(l => (
                <li key={l.path}>
                  <Link to={l.path} className="text-[13px] text-white/60 hover:text-[#D64A12] transition-colors flex items-center gap-1.5">
                    <ChevronRight size={11} className="text-white/30" /> {t(l.i18nKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-white/40 mb-4">{t("common:nav.services")}</h4>
            <ul className="flex flex-col gap-2.5">
              {SERVICE_NAV.map(s => (
                <li key={s.path}>
                  <Link to={s.path} className="text-[13px] text-white/60 hover:text-[#D64A12] transition-colors flex items-center gap-1.5">
                    <ChevronRight size={11} className="text-white/30" /> {t(s.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-white/40 mb-4">{t("common:nav.contact")}</h4>
            <ul className="flex flex-col gap-3 mb-5">
              <li className="flex items-start gap-2 text-[13px] text-white/60">
                <MapPin size={13} className="text-[#D64A12] flex-shrink-0 mt-0.5" />
                {t("footer.address")}
              </li>
              <li><a href="tel:+88029553421" className="flex items-center gap-2 text-[13px] text-white/60 hover:text-white transition-colors">
                <Phone size={13} className="text-[#D64A12]" /> +880 2 9553421
              </a></li>
              <li><a href="mailto:info@smtravel.com.bd" className="flex items-center gap-2 text-[13px] text-white/60 hover:text-white transition-colors">
                <Mail size={13} className="text-[#D64A12]" /> info@smtravel.com.bd
              </a></li>
              <li className="flex items-center gap-2 text-[13px] text-white/60">
                <Clock size={13} className="text-[#D64A12]" /> {t("footer.hours")}
              </li>
            </ul>
            {/* Newsletter */}
            <div>
              <div className="text-[12px] font-bold text-white/70 mb-2">{t("footer.newsletter.heading")}</div>
              <div className="flex gap-2">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={t("footer.newsletter.placeholder")}
                  className="flex-1 min-w-0 px-3 py-2 bg-white/10 border border-white/20 rounded-[8px] text-[12px] text-white placeholder-white/30 outline-none focus:border-[#F15A24] transition-all" />
                <button onClick={() => { navigate("/contact", { state: { email } }); setEmail(""); }}
                  aria-label={t("footer.newsletter.heading")}
                  className="w-9 h-9 flex-shrink-0 bg-[var(--color-brand-mark)] hover:bg-[var(--color-brand-mark-hover)] rounded-[8px] flex items-center justify-center transition-colors cursor-pointer">
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
          <div className="text-[11px] text-white/40">{t("footer.copyright")}</div>
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <Link to="/privacy" className="text-[10px] md:text-[11px] text-white/35 hover:text-white/60 transition-colors">{t("footer.legal.privacy")}</Link>
            <Link to="/terms" className="text-[10px] md:text-[11px] text-white/35 hover:text-white/60 transition-colors">{t("footer.legal.terms")}</Link>
            <Link to="/refund" className="text-[10px] md:text-[11px] text-white/35 hover:text-white/60 transition-colors">{t("footer.legal.refund")}</Link>
            <Link to="/branches" className="text-[10px] md:text-[11px] text-white/35 hover:text-white/60 transition-colors">{t("footer.links.branches", { defaultValue: "Branches" })}</Link>
            <Link to="/career" className="text-[10px] md:text-[11px] text-white/35 hover:text-white/60 transition-colors">{t("footer.links.career", { defaultValue: "Career" })}</Link>
          </div>
          <div className="text-[10px] text-white/30 w-full md:w-auto">{t("footer.license")}</div>
        </div>
      </div>
    </footer>
  );
}

// ─── WHATSAPP FLOAT (desktop/tablet only — mobile uses bottom bar) ────────────
function WhatsAppFloat() {
  const { t } = useTranslation("layout");
  const [tip, setTip] = useState(false);
  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-40 flex-col items-end gap-2">
      {tip && (
        <div className="bg-white rounded-[12px] shadow-xl border border-[#E5E7EB] px-3 py-2 text-[12px] font-medium text-[#374151] whitespace-nowrap">
          {t("whatsapp.tooltip")}
        </div>
      )}
      <a href={whatsappUrl()}
        target="_blank" rel="noopener noreferrer"
        onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}
        className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all"
        aria-label={t("aria.whatsapp")}>
        <WhatsAppIcon size={26} />
      </a>
    </div>
  );
}

// ─── MOBILE STICKY CTA BAR — Call / WhatsApp / Book ───────────────────────────
function MobileBottomBar() {
  const { t } = useTranslation("layout");
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(10,46,77,0.08)]"
      aria-label={t("mobileCta.aria")}
    >
      <div className="flex gap-2 max-w-lg mx-auto">
        <a
          href={telUrl()}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl border border-[#1B75BC]/25 bg-[#E8F2FA] text-[#17456B] font-bold text-[11px] hover:bg-[#1B75BC]/10 transition-colors"
          aria-label={t("mobileCta.callAria", { phone: CONTACT.phoneDisplay })}
        >
          <Phone size={18} className="text-[#1B75BC]" />
          {t("mobileCta.call")}
        </a>
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-[1.15] flex flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl bg-[#25D366] text-white font-bold text-[11px] hover:bg-[#1da855] transition-colors shadow-sm"
          aria-label={t("aria.whatsapp")}
        >
          <WhatsAppIcon size={18} />
          {t("whatsapp.label")}
        </a>
        <Link
          to="/book"
          className="flex-[1.15] flex flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl bg-[var(--color-brand-mark)] text-white font-bold text-[11px] hover:bg-[var(--color-brand-mark-hover)] transition-colors shadow-sm"
        >
          <Calendar size={18} />
          {t("mobileCta.book")}
        </Link>
      </div>
    </nav>
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
      <Footer />
      {/* Bottom spacing on mobile for sticky CTA bar */}
      <div className="md:hidden h-[76px] safe-area-inset-bottom" aria-hidden />
      <WhatsAppFloat />
      <AiChatWidget />
      <PwaInstallBanner />
      <MobileBottomBar />
    </div>
  );
}
