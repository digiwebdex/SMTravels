import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  Menu, X, ChevronDown, Phone, Mail, MapPin, Facebook, Instagram, Youtube,
  Plane, Star, Shield, Hotel, Globe, Briefcase, Car, Umbrella,
  BookOpen, PlayCircle, MessageCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";
import { BrandLogo } from "./BrandLogo";
import { useLang } from "../i18n/useLang";
import { Btn } from "../website/primitives";

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.524 5.847L0 24l6.335-1.501A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.032-1.387l-.36-.214-3.754.888.938-3.658-.235-.374A9.818 9.818 0 012.182 12c0-5.413 4.405-9.818 9.818-9.818 5.413 0 9.818 4.405 9.818 9.818 0 5.413-4.405 9.818-9.818 9.818z" />
    </svg>
  );
}

const SERVICE_NAV = [
  { labelKey: "serviceNav.hajj.label", path: "/hajj", icon: Star, color: "#F15A24" },
  { labelKey: "serviceNav.umrah.label", path: "/umrah", icon: MapPin, color: "#1B75BC" },
  { labelKey: "serviceNav.visa.label", path: "/visa", icon: Shield, color: "#16A34A" },
  { labelKey: "serviceNav.airTicket.label", path: "/air-ticket", icon: Plane, color: "#062D63" },
  { labelKey: "serviceNav.tour.label", path: "/tour-packages", icon: Globe, color: "#C89B3C" },
  { labelKey: "serviceNav.hotel.label", path: "/hotel-booking", icon: Hotel, color: "#0891B2" },
  { labelKey: "serviceNav.transport.label", path: "/transport", icon: Car, color: "#7C3AED" },
  { labelKey: "serviceNav.insurance.label", path: "/faq", icon: Umbrella, color: "#0E7C66" },
];

const MAIN_NAV = [
  { i18nKey: "common:nav.home", path: "/" },
  { i18nKey: "common:nav.about", path: "/about" },
  { i18nKey: "common:nav.packages", path: "/packages" },
  { i18nKey: "common:nav.knowledge", path: "/knowledge" },
  { i18nKey: "common:nav.videos", path: "/videos" },
  { i18nKey: "common:nav.blog", path: "/blog" },
  { i18nKey: "common:nav.contact", path: "/contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const { t } = useTranslation("layout");
  const { lang, toggle } = useLang();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setServicesOpen(false);
    setServicesExpanded(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      {/* Top bar */}
      <div className="hidden lg:block bg-[#062D63] text-white/80 text-xs">
        <div className="max-w-[1200px] mx-auto px-6 h-9 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a href="tel:+8801712345678" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone size={12} /> +880 1712-345678
            </a>
            <a href="mailto:info@smtravelsinternational.com" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail size={12} /> info@smtravelsinternational.com
            </a>
            <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> ঢাকা, বাংলাদেশ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-white transition-colors">{t("common:nav.about")}</Link>
            <Link to="/career" className="hover:text-white transition-colors">ক্যারিয়ার</Link>
            <Link to="/contact" className="hover:text-white transition-colors">{t("common:nav.contact")}</Link>
          </div>
        </div>
      </div>

      <header className={cn(
        "sticky top-0 z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(6,45,99,0.08)] border-[#E5E7EB]/80"
          : "bg-white border-transparent",
      )}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-[68px] md:h-[76px] flex items-center gap-4">
          <Link to="/" className="flex-shrink-0" aria-label="SM Travels International">
            <BrandLogo className="h-11 md:h-12 w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {MAIN_NAV.slice(0, 2).map((item) => (
              <Link key={item.path} to={item.path}
                className={cn(
                  "px-3 py-2 rounded-full text-[13px] font-medium transition-colors",
                  isActive(item.path) ? "text-[#1B75BC] bg-[#EAF5FF]" : "text-[#374151] hover:text-[#1B75BC] hover:bg-[#F7F8FA]",
                )}>
                {t(item.i18nKey)}
              </Link>
            ))}

            <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
              <button type="button"
                className={cn(
                  "px-3 py-2 rounded-full text-[13px] font-medium inline-flex items-center gap-1 transition-colors",
                  SERVICE_NAV.some((s) => isActive(s.path)) ? "text-[#1B75BC] bg-[#EAF5FF]" : "text-[#374151] hover:text-[#1B75BC] hover:bg-[#F7F8FA]",
                )}
                aria-expanded={servicesOpen}
              >
                {t("common:nav.services")} <ChevronDown size={14} className={cn("transition-transform", servicesOpen && "rotate-180")} />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[520px]">
                  <div className="bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] p-3 grid grid-cols-2 gap-1">
                    {SERVICE_NAV.map((s) => (
                      <Link key={s.path} to={s.path}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#EAF5FF] transition-colors">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>
                          <s.icon size={18} />
                        </div>
                        <span className="text-sm font-semibold text-[#062D63]">{t(s.labelKey)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {MAIN_NAV.slice(2).map((item) => (
              <Link key={item.path} to={item.path}
                className={cn(
                  "px-3 py-2 rounded-full text-[13px] font-medium transition-colors",
                  isActive(item.path) ? "text-[#1B75BC] bg-[#EAF5FF]" : "text-[#374151] hover:text-[#1B75BC] hover:bg-[#F7F8FA]",
                )}>
                {t(item.i18nKey)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <button type="button" onClick={toggle}
              className="hidden sm:inline-flex px-3 py-2 rounded-full text-xs font-bold border border-[#E5E7EB] text-[#062D63] hover:bg-[#EAF5FF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B75BC]"
              aria-label={lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}>
              {lang === "bn" ? "EN" : "বাং"}
            </button>
            <Link to="/login" className="hidden md:inline-flex text-sm font-semibold text-[#062D63] hover:text-[#1B75BC] px-2">
              {t("common:actions.login")}
            </Link>
            <Btn to="/book" variant="orange" size="sm" className="hidden sm:inline-flex !py-2.5">
              {t("common:actions.bookNow")}
            </Btn>
            <button type="button" className="lg:hidden p-2.5 rounded-xl hover:bg-[#F3F4F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B75BC]"
              onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <Menu size={22} className="text-[#062D63]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-[60] lg:hidden transition-opacity", drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
        <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />
        <div className={cn(
          "absolute top-0 right-0 h-full w-[min(100%,360px)] bg-white shadow-2xl transition-transform duration-300 flex flex-col",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}>
          <div className="flex items-center justify-between px-5 h-16 border-b border-[#E5E7EB]">
            <BrandLogo className="h-10 w-auto" />
            <button type="button" onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-[#F3F4F6]" aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {MAIN_NAV.map((item) => (
              <Link key={item.path} to={item.path}
                className={cn("block px-4 py-3 rounded-2xl text-sm font-semibold", isActive(item.path) ? "bg-[#EAF5FF] text-[#1B75BC]" : "text-[#062D63] hover:bg-[#F7F8FA]")}>
                {t(item.i18nKey)}
              </Link>
            ))}
            <button type="button" onClick={() => setServicesExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold text-[#062D63] hover:bg-[#F7F8FA]">
              {t("common:nav.services")}
              <ChevronDown size={16} className={cn("transition-transform", servicesExpanded && "rotate-180")} />
            </button>
            {servicesExpanded && SERVICE_NAV.map((s) => (
              <Link key={s.path} to={s.path} className="flex items-center gap-3 pl-8 pr-4 py-2.5 text-sm text-[#374151]">
                <s.icon size={16} style={{ color: s.color }} /> {t(s.labelKey)}
              </Link>
            ))}
            <Link to="/gallery" className="block px-4 py-3 rounded-2xl text-sm font-semibold text-[#062D63]">{t("common:nav.gallery")}</Link>
            <Link to="/faq" className="block px-4 py-3 rounded-2xl text-sm font-semibold text-[#062D63]">{t("common:nav.faq")}</Link>
          </div>
          <div className="p-4 border-t border-[#E5E7EB] space-y-2">
            <Btn to="/book" variant="orange" className="w-full">{t("common:actions.bookNow")}</Btn>
            <Btn to="/login" variant="outline" className="w-full">{t("common:actions.login")}</Btn>
          </div>
        </div>
      </div>
    </>
  );
}

export function Footer() {
  const { t } = useTranslation("layout");
  return (
    <footer className="bg-[#041E42] text-white">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <BrandLogo className="h-12 w-auto brightness-0 invert mb-4" />
            <p className="text-white/65 text-sm leading-relaxed max-w-sm mb-5">
              {t("footer.aboutBlurb", { defaultValue: "২০১১ সাল থেকে বিশ্বস্ত হজ্ব, উমরাহ, ভিসা ও ভ্রমণ সেবা — প্রযুক্তি, স্বচ্ছতা ও ইসলামী শিষ্টাচারের সমন্বয়ে।" })}
            </p>
            <div className="flex gap-2">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#F15A24] flex items-center justify-center transition-colors" aria-label="Social">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#C89B3C] uppercase tracking-wider mb-4">সেবাসমূহ</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              {SERVICE_NAV.slice(0, 6).map((s) => (
                <li key={s.path}><Link to={s.path} className="hover:text-white transition-colors">{t(s.labelKey)}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#C89B3C] uppercase tracking-wider mb-4">দ্রুত লিংক</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link to="/packages" className="hover:text-white">প্যাকেজ</Link></li>
              <li><Link to="/about" className="hover:text-white">আমাদের সম্পর্কে</Link></li>
              <li><Link to="/branches" className="hover:text-white">শাখা</Link></li>
              <li><Link to="/testimonials" className="hover:text-white">প্রশংসাপত্র</Link></li>
              <li><Link to="/career" className="hover:text-white">ক্যারিয়ার</Link></li>
              <li><Link to="/contact" className="hover:text-white">যোগাযোগ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#C89B3C] uppercase tracking-wider mb-4">জ্ঞান কেন্দ্র</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link to="/knowledge" className="hover:text-white inline-flex items-center gap-1.5"><BookOpen size={14} /> ইসলামী গাইড</Link></li>
              <li><Link to="/videos" className="hover:text-white inline-flex items-center gap-1.5"><PlayCircle size={14} /> ভিডিও</Link></li>
              <li><Link to="/blog" className="hover:text-white">ব্লগ</Link></li>
              <li><Link to="/faq" className="hover:text-white">জিজ্ঞাসা</Link></li>
              <li><Link to="/gallery" className="hover:text-white">গ্যালারি</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#C89B3C] uppercase tracking-wider mb-4">যোগাযোগ</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex gap-2"><Phone size={14} className="mt-0.5 text-[#F15A24]" /> +880 1712-345678</li>
              <li className="flex gap-2"><Mail size={14} className="mt-0.5 text-[#F15A24]" /> info@smtravelsinternational.com</li>
              <li className="flex gap-2"><MapPin size={14} className="mt-0.5 text-[#F15A24]" /> আগ্রাবাদ, চট্টগ্রাম ও ঢাকা</li>
              <li className="flex gap-2"><MessageCircle size={14} className="mt-0.5 text-[#25D366]" /> ২৪/৭ হোয়াটসঅ্যাপ</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-xs text-white/40">{t("footer.copyright")}</p>
          <div className="flex flex-wrap gap-4 text-xs text-white/45">
            <Link to="/privacy" className="hover:text-white">গোপনীয়তা</Link>
            <Link to="/terms" className="hover:text-white">শর্তাবলি</Link>
            <Link to="/refund" className="hover:text-white">রিফান্ড</Link>
            <span className="text-white/30">Visa · Mastercard · bKash · Nagad</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  return (
    <a href="https://wa.me/8801712345678?text=Assalamu%20Alaikum%20SM%20Travels"
      target="_blank" rel="noopener noreferrer"
      className="hidden md:flex fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] text-white rounded-full items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all"
      aria-label="WhatsApp">
      <WhatsAppIcon size={26} />
    </a>
  );
}

function MobileBottomBar() {
  const { t } = useTranslation("layout");
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-[#E5E7EB] px-4 py-3 safe-area-inset-bottom">
      <div className="flex gap-3">
        <a href="https://wa.me/8801712345678" target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-[#25D366] text-white font-bold rounded-full text-sm">
          <WhatsAppIcon size={18} /> WhatsApp
        </a>
        <Link to="/book"
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-[#F15A24] text-white font-bold rounded-full text-sm">
          {t("common:actions.bookNow")}
        </Link>
      </div>
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827]" style={{ fontFamily: "var(--font-body)" }}>
      <Header />
      <main className="flex-1"><Outlet /></main>
      <div className="md:hidden h-[72px]" />
      <Footer />
      <WhatsAppFloat />
      <MobileBottomBar />
    </div>
  );
}
