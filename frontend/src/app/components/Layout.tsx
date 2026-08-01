import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  Menu, X, ChevronDown, Phone, Mail, MapPin, Facebook, Instagram, Youtube, Twitter,
  Umbrella, LogIn, Linkedin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";
import { BrandLogo } from "./BrandLogo";
import { useLang } from "../i18n/useLang";

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.524 5.847L0 24l6.335-1.501A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.032-1.387l-.36-.214-3.754.888.938-3.658-.235-.374A9.818 9.818 0 012.182 12c0-5.413 4.405-9.818 9.818-9.818 5.413 0 9.818 4.405 9.818 9.818 0 5.413-4.405 9.818-9.818 9.818z" />
    </svg>
  );
}

const PRIMARY_NAV = [
  { labelBn: "হজ্ব ও উমরাহ", labelEn: "Hajj & Umrah", path: "/hajj" },
  { labelBn: "ভিসা সার্ভিস", labelEn: "Visa Service", path: "/visa" },
  { labelBn: "এয়ার টিকেট", labelEn: "Air Ticket", path: "/air-ticket" },
  { labelBn: "ট্যুর প্যাকেজ", labelEn: "Tour Packages", path: "/tour-packages" },
  { labelBn: "হোটেল", labelEn: "Hotel", path: "/hotel-booking" },
  { labelBn: "পরিবহন", labelEn: "Transport", path: "/transport" },
];

const OTHERS_NAV = [
  { labelBn: "ম্যানপাওয়ার", labelEn: "Manpower", path: "/manpower" },
  { labelBn: "জ্ঞান কেন্দ্র", labelEn: "Knowledge", path: "/knowledge" },
  { labelBn: "ভিডিও", labelEn: "Videos", path: "/videos" },
  { labelBn: "গ্যালারি", labelEn: "Gallery", path: "/gallery" },
  { labelBn: "জিজ্ঞাসা", labelEn: "FAQ", path: "/faq" },
  { labelBn: "বীমা", labelEn: "Insurance", path: "/faq" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [othersOpen, setOthersOpen] = useState(false);
  const [branchesOpen, setBranchesOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation("layout");
  const { lang, toggle } = useLang();
  const bn = lang === "bn";
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setOthersOpen(false);
    setBranchesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      {/* Top utility bar — Image A */}
      <div className="hidden lg:block bg-[#062D63] text-white text-[12px]">
        <div className="max-w-[1240px] mx-auto px-5 h-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <a href="tel:+8801211190022" className="inline-flex items-center gap-1.5 hover:text-[#F15A24] transition-colors whitespace-nowrap">
              <Phone size={12} className="text-[#F15A24]" /> +880 1211 190 022
            </a>
            <a href="mailto:info@smtravelsinternational.com" className="inline-flex items-center gap-1.5 hover:text-[#F15A24] transition-colors truncate">
              <Mail size={12} className="text-[#F15A24]" /> info@smtravelsinternational.com
            </a>
            <span className="inline-flex items-center gap-1.5 text-white/85 whitespace-nowrap">
              <MapPin size={12} className="text-[#F15A24]" /> {bn ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh"}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link to="/about" className="hover:text-[#F15A24] transition-colors">{bn ? "আমাদের সম্পর্কে" : "About Us"}</Link>
            <Link to="/blog" className="hover:text-[#F15A24] transition-colors">{bn ? "ব্লগ" : "Blog"}</Link>
            <Link to="/portal" className="hover:text-[#F15A24] transition-colors">{bn ? "পোর্টাল" : "Portal"}</Link>
            <div className="relative" onMouseEnter={() => setBranchesOpen(true)} onMouseLeave={() => setBranchesOpen(false)}>
              <button type="button" className="inline-flex items-center gap-1 hover:text-[#F15A24] transition-colors">
                {bn ? "শাখা" : "Branches"} <ChevronDown size={12} />
              </button>
              {branchesOpen && (
                <div className="absolute right-0 top-full pt-2 z-50">
                  <div className="bg-white text-[#062D63] rounded-md shadow-xl border border-[#E5E7EB] py-1 min-w-[160px]">
                    <Link to="/branches" className="block px-4 py-2 text-xs hover:bg-[#EAF5FF]">{bn ? "সব শাখা" : "All branches"}</Link>
                    <Link to="/contact" className="block px-4 py-2 text-xs hover:bg-[#EAF5FF]">{bn ? "যোগাযোগ" : "Contact"}</Link>
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={toggle}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/25 hover:bg-white/10 transition-colors"
              aria-label={bn ? "Switch to English" : "বাংলায় দেখুন"}>
              {bn ? "EN" : "বাং"}
            </button>
          </div>
        </div>
      </div>

      <header className={cn(
        "sticky top-0 z-50 bg-white border-b border-[#E5E7EB] transition-shadow",
        scrolled && "shadow-[0_4px_20px_rgba(6,45,99,0.08)]",
      )}>
        <div className="max-w-[1240px] mx-auto px-4 md:px-5 h-[70px] md:h-[76px] flex items-center gap-3">
          <Link to="/" className="flex-shrink-0" aria-label="SM Travels International">
            <BrandLogo className="h-10 md:h-12 w-auto" />
          </Link>

          <nav className="hidden xl:flex items-center gap-0.5 flex-1 justify-center">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors",
                  isActive(item.path) ? "text-[#1B75BC]" : "text-[#062D63] hover:text-[#1B75BC]",
                )}
              >
                {bn ? item.labelBn : item.labelEn}
              </Link>
            ))}
            <div className="relative" onMouseEnter={() => setOthersOpen(true)} onMouseLeave={() => setOthersOpen(false)}>
              <button type="button"
                className="px-2.5 py-2 text-[13px] font-semibold text-[#062D63] hover:text-[#1B75BC] inline-flex items-center gap-0.5"
                aria-expanded={othersOpen}>
                {bn ? "অন্যান্য" : "Others"} <ChevronDown size={14} className={cn("transition-transform", othersOpen && "rotate-180")} />
              </button>
              {othersOpen && (
                <div className="absolute top-full left-0 pt-2 w-52 z-50">
                  <div className="bg-white rounded-md shadow-xl border border-[#E5E7EB] py-1">
                    {OTHERS_NAV.map((s) => (
                      <Link key={s.path + s.labelEn} to={s.path}
                        className="block px-4 py-2.5 text-sm text-[#062D63] hover:bg-[#EAF5FF] hover:text-[#1B75BC]">
                        {bn ? s.labelBn : s.labelEn}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <Link
              to="/login"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-[#1B75BC] border border-[#1B75BC] rounded-md hover:bg-[#EAF5FF] transition-colors"
            >
              <LogIn size={15} />
              {bn ? "লগইন / রেজিস্টার" : "Login / Register"}
            </Link>
            <Link
              to="/book"
              className="hidden sm:inline-flex items-center px-4 py-2.5 text-[13px] font-bold text-white bg-[#F15A24] rounded-md hover:bg-[#CC3C17] transition-colors shadow-sm"
            >
              {bn ? "যাত্রা শুরু" : "Start Journey"}
            </Link>
            <button type="button" className="xl:hidden p-2.5 rounded-md hover:bg-[#F3F4F6]"
              onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <Menu size={22} className="text-[#062D63]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-[60] xl:hidden transition-opacity", drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
        <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />
        <div className={cn(
          "absolute top-0 right-0 h-full w-[min(100%,360px)] bg-white shadow-2xl transition-transform duration-300 flex flex-col",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}>
          <div className="flex items-center justify-between px-5 h-16 border-b border-[#E5E7EB]">
            <BrandLogo className="h-10 w-auto" />
            <button type="button" onClick={() => setDrawerOpen(false)} className="p-2 rounded-md hover:bg-[#F3F4F6]" aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {[...PRIMARY_NAV, ...OTHERS_NAV].map((item) => (
              <Link key={item.path + item.labelEn} to={item.path}
                className={cn("block px-4 py-3 rounded-md text-sm font-semibold", isActive(item.path) ? "bg-[#EAF5FF] text-[#1B75BC]" : "text-[#062D63] hover:bg-[#F7F8FA]")}>
                {bn ? item.labelBn : item.labelEn}
              </Link>
            ))}
            <Link to="/about" className="block px-4 py-3 rounded-md text-sm font-semibold text-[#062D63]">{bn ? "আমাদের সম্পর্কে" : "About"}</Link>
            <Link to="/contact" className="block px-4 py-3 rounded-md text-sm font-semibold text-[#062D63]">{bn ? "যোগাযোগ" : "Contact"}</Link>
            <button type="button" onClick={toggle} className="w-full text-left px-4 py-3 rounded-md text-sm font-semibold text-[#062D63]">
              {bn ? "English" : "বাংলা"}
            </button>
          </div>
          <div className="p-4 border-t border-[#E5E7EB] space-y-2">
            <Link to="/book" className="block text-center py-3 bg-[#F15A24] text-white font-bold rounded-md text-sm">{bn ? "যাত্রা শুরু" : "Start Journey"}</Link>
            <Link to="/login" className="block text-center py-3 border border-[#1B75BC] text-[#1B75BC] font-bold rounded-md text-sm">{bn ? "লগইন / রেজিস্টার" : "Login / Register"}</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export function Footer() {
  const { t, i18n } = useTranslation("layout");
  const bn = i18n.language?.startsWith("bn");

  return (
    <footer className="bg-[#041E42] text-white">
      <div className="max-w-[1240px] mx-auto px-4 md:px-5 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-10">
          <div className="col-span-2">
            <BrandLogo className="h-12 w-auto brightness-0 invert mb-4" />
            <p className="text-white/65 text-sm leading-relaxed max-w-xs mb-5">
              {bn
                ? "২০১১ সাল থেকে বিশ্বস্ত হজ্ব, উমরাহ, ভিসা ও ভ্রমণ সেবা — স্বচ্ছতা ও ইসলামী শিষ্টাচারের সাথে।"
                : "Trusted Hajj, Umrah, visa and travel services since 2011 — with transparency and Islamic elegance."}
            </p>
            <div className="flex gap-2">
              {[Facebook, Instagram, Youtube, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-white/20 hover:bg-[#F15A24] hover:border-[#F15A24] flex items-center justify-center transition-colors" aria-label="Social">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">{bn ? "দ্রুত লিংক" : "Quick Links"}</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link to="/about" className="hover:text-white">About</Link></li>
              <li><Link to="/packages" className="hover:text-white">{bn ? "প্যাকেজ" : "Packages"}</Link></li>
              <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link to="/branches" className="hover:text-white">{bn ? "শাখা" : "Branches"}</Link></li>
              <li><Link to="/career" className="hover:text-white">{bn ? "ক্যারিয়ার" : "Career"}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">{bn ? "আমাদের সেবা" : "Our Services"}</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link to="/hajj" className="hover:text-white">{bn ? "হজ্ব" : "Hajj"}</Link></li>
              <li><Link to="/umrah" className="hover:text-white">{bn ? "উমরাহ" : "Umrah"}</Link></li>
              <li><Link to="/visa" className="hover:text-white">{bn ? "ভিসা" : "Visa"}</Link></li>
              <li><Link to="/air-ticket" className="hover:text-white">{bn ? "এয়ার টিকেট" : "Air Ticket"}</Link></li>
              <li><Link to="/hotel-booking" className="hover:text-white">{bn ? "হোটেল" : "Hotel"}</Link></li>
              <li><Link to="/transport" className="hover:text-white">{bn ? "পরিবহন" : "Transport"}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">{bn ? "সহায়তা" : "Support"}</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white">{bn ? "যোগাযোগ" : "Contact"}</Link></li>
              <li><Link to="/knowledge" className="hover:text-white">{bn ? "জ্ঞান কেন্দ্র" : "Knowledge"}</Link></li>
              <li><Link to="/privacy" className="hover:text-white">{bn ? "গোপনীয়তা" : "Privacy"}</Link></li>
              <li><Link to="/terms" className="hover:text-white">{bn ? "শর্তাবলি" : "Terms"}</Link></li>
              <li><Link to="/refund" className="hover:text-white">{bn ? "রিফান্ড" : "Refund"}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">{bn ? "যোগাযোগ" : "Contact"}</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex gap-2"><Phone size={14} className="mt-0.5 text-[#F15A24] flex-shrink-0" /> +880 1211 190 022</li>
              <li className="flex gap-2"><Mail size={14} className="mt-0.5 text-[#F15A24] flex-shrink-0" /> info@smtravelsinternational.com</li>
              <li className="flex gap-2"><MapPin size={14} className="mt-0.5 text-[#F15A24] flex-shrink-0" /> {bn ? "ঢাকা ও চট্টগ্রাম, বাংলাদেশ" : "Dhaka & Chittagong, Bangladesh"}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#031632]">
        <div className="max-w-[1240px] mx-auto px-4 md:px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/45">{t("footer.copyright")}</p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-white/55">
            <span className="px-2 py-1 rounded bg-white/10">VISA</span>
            <span className="px-2 py-1 rounded bg-white/10">Mastercard</span>
            <span className="px-2 py-1 rounded bg-white/10 text-[#E2136E]">bKash</span>
            <span className="px-2 py-1 rounded bg-white/10 text-[#F15A24]">Nagad</span>
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
      className="hidden md:flex fixed bottom-6 right-5 z-40 w-14 h-14 bg-[#25D366] text-white rounded-full items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
      aria-label="WhatsApp">
      <WhatsAppIcon size={26} />
    </a>
  );
}

function MobileBottomBar() {
  const { i18n } = useTranslation("layout");
  const bn = i18n.language?.startsWith("bn");
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-[#E5E7EB] px-4 py-3">
      <div className="flex gap-3">
        <a href="https://wa.me/8801712345678" target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-[#25D366] text-white font-bold rounded-md text-sm">
          <WhatsAppIcon size={18} /> WhatsApp
        </a>
        <Link to="/book"
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-[#F15A24] text-white font-bold rounded-md text-sm">
          {bn ? "যাত্রা শুরু" : "Book"}
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
