import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  Menu, X, ChevronDown, Phone, Mail, MapPin, Facebook, Instagram, Youtube, Twitter,
  LogIn, Linkedin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";
import { BrandLogo } from "./BrandLogo";
import { PaymentLogos } from "../website/PaymentLogos";
import { useLang } from "../i18n/useLang";
import { PwaInstallBanner } from "./PwaInstallBanner";
import { usePublicMenu, usePublicSettings } from "../hooks/publicContent";

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

// bn labels for known routes so CMS-driven nav/footer stay bilingual (structure & order come from CMS).
const BN_LABELS: Record<string, string> = {
  "/hajj": "হজ্ব ও উমরাহ", "/umrah": "উমরাহ", "/visa": "ভিসা সার্ভিস", "/air-ticket": "এয়ার টিকেট",
  "/tour-packages": "ট্যুর প্যাকেজ", "/hotel-booking": "হোটেল", "/transport": "পরিবহন", "/manpower": "ম্যানপাওয়ার",
  "/knowledge": "জ্ঞান কেন্দ্র", "/gallery": "গ্যালারি", "/faq": "জিজ্ঞাসা", "/packages": "প্যাকেজ",
  "/blog": "ব্লগ", "/contact": "যোগাযোগ", "/about": "আমাদের সম্পর্কে", "/branches": "শাখা",
  "/career": "ক্যারিয়ার", "/privacy": "গোপনীয়তা", "/terms": "শর্তাবলি", "/refund": "রিফান্ড", "/": "হোম",
};
type NavLink = { labelEn: string; labelBn: string; path: string };
type CmsMenuItem = { label: string; url: string; megaMenu?: boolean; children?: CmsMenuItem[] };
/** CMS drives structure/order; bn label falls back to a known-route map to keep the UI bilingual. */
function toNav(items: CmsMenuItem[]): NavLink[] {
  return items.map((i) => ({ labelEn: i.label, labelBn: BN_LABELS[i.url] ?? i.label, path: i.url }));
}

const FOOTER_QUICK_FALLBACK: NavLink[] = [
  { labelEn: "About", labelBn: "আমাদের সম্পর্কে", path: "/about" },
  { labelEn: "Packages", labelBn: "প্যাকেজ", path: "/packages" },
  { labelEn: "Blog", labelBn: "ব্লগ", path: "/blog" },
  { labelEn: "Branches", labelBn: "শাখা", path: "/branches" },
  { labelEn: "Career", labelBn: "ক্যারিয়ার", path: "/career" },
];
const FOOTER_SERVICES_FALLBACK: NavLink[] = [
  { labelEn: "Hajj", labelBn: "হজ্ব", path: "/hajj" },
  { labelEn: "Umrah", labelBn: "উমরাহ", path: "/umrah" },
  { labelEn: "Visa", labelBn: "ভিসা", path: "/visa" },
  { labelEn: "Air Ticket", labelBn: "এয়ার টিকেট", path: "/air-ticket" },
  { labelEn: "Hotel", labelBn: "হোটেল", path: "/hotel-booking" },
  { labelEn: "Transport", labelBn: "পরিবহন", path: "/transport" },
];
const FOOTER_SOCIAL = [
  { Icon: Facebook, key: "social.facebook" }, { Icon: Instagram, key: "social.instagram" },
  { Icon: Youtube, key: "social.youtube" }, { Icon: Twitter, key: "social.twitter" }, { Icon: Linkedin, key: "social.linkedin" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [othersOpen, setOthersOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation("layout");
  const { lang, toggle } = useLang();
  const bn = lang === "bn";
  const location = useLocation();

  // CMS-driven navigation (falls back to the built-in nav if the API is unavailable — no layout change).
  const mainMenu = usePublicMenu("MAIN_NAV");
  const cmsMain = (mainMenu.data?.items ?? []) as CmsMenuItem[];
  const cmsOthers = cmsMain.find((i) => i.megaMenu);
  const primaryNav: NavLink[] = cmsMain.length ? toNav(cmsMain.filter((i) => !i.megaMenu)) : PRIMARY_NAV;
  const othersNav: NavLink[] = cmsOthers?.children?.length ? toNav(cmsOthers.children) : OTHERS_NAV;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setOthersOpen(false);
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
      <div className="hidden lg:block bg-[#002D62] text-white text-[12px]">
        <div className="max-w-[1240px] mx-auto px-5 h-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <span className="font-semibold text-[#F37021] whitespace-nowrap">{bn ? "২৪/৭ সাপোর্ট" : "24/7 Support"}</span>
            <a href="tel:+8801211190022" className="inline-flex items-center gap-1.5 hover:text-[#F37021] transition-colors whitespace-nowrap">
              <Phone size={12} className="text-[#F37021]" /> +880 1211 190 022
            </a>
            <a href="mailto:support@smtravels.com" className="inline-flex items-center gap-1.5 hover:text-[#F37021] transition-colors truncate">
              <Mail size={12} className="text-[#F37021]" /> support@smtravels.com
            </a>
            <span className="inline-flex items-center gap-1.5 text-white/85 whitespace-nowrap">
              <MapPin size={12} className="text-[#F37021]" /> {bn ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh"}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link to="/about" className="hover:text-[#F37021] transition-colors">{bn ? "আমাদের সম্পর্কে" : "About Us"}</Link>
            <Link to="/blog" className="hover:text-[#F37021] transition-colors">{bn ? "ব্লগ" : "Blog"}</Link>
            <Link to="/contact" className="hover:text-[#F37021] transition-colors">{bn ? "হেল্পলাইন" : "Helpline"}</Link>
            <button type="button" onClick={toggle}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-white/25 hover:bg-white/10 transition-colors"
              aria-label={bn ? "Switch to English" : "বাংলায় দেখুন"}>
              {bn ? "বাংলা - ৳" : "English - $"} <ChevronDown size={12} />
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
            {primaryNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors",
                  isActive(item.path) ? "text-[#1B75BC]" : "text-[#002D62] hover:text-[#1B75BC]",
                )}
              >
                {bn ? item.labelBn : item.labelEn}
              </Link>
            ))}
            <div className="relative" onMouseEnter={() => setOthersOpen(true)} onMouseLeave={() => setOthersOpen(false)}>
              <button type="button"
                className="px-2.5 py-2 text-[13px] font-semibold text-[#002D62] hover:text-[#1B75BC] inline-flex items-center gap-0.5"
                aria-expanded={othersOpen}>
                {bn ? "অন্যান্য" : "Others"} <ChevronDown size={14} className={cn("transition-transform", othersOpen && "rotate-180")} />
              </button>
              {othersOpen && (
                <div className="absolute top-full left-0 pt-2 w-52 z-50">
                  <div className="bg-white rounded-md shadow-xl border border-[#E5E7EB] py-1">
                    {othersNav.map((s) => (
                      <Link key={s.path + s.labelEn} to={s.path}
                        className="block px-4 py-2.5 text-sm text-[#002D62] hover:bg-[#EAF5FF] hover:text-[#1B75BC]">
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
              className="hidden sm:inline-flex items-center px-4 py-2.5 text-[13px] font-bold text-white bg-[#F37021] rounded-md hover:bg-[#D85A12] transition-colors shadow-sm"
            >
              {bn ? "যাত্রা শুরু করুন" : "Start Journey"}
            </Link>
            <button type="button" className="xl:hidden p-2.5 rounded-md hover:bg-[#F3F4F6]"
              onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <Menu size={22} className="text-[#002D62]" />
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
            {[...primaryNav, ...othersNav].map((item) => (
              <Link key={item.path + item.labelEn} to={item.path}
                className={cn("block px-4 py-3 rounded-md text-sm font-semibold", isActive(item.path) ? "bg-[#EAF5FF] text-[#1B75BC]" : "text-[#002D62] hover:bg-[#F7F8FA]")}>
                {bn ? item.labelBn : item.labelEn}
              </Link>
            ))}
            <Link to="/about" className="block px-4 py-3 rounded-md text-sm font-semibold text-[#002D62]">{bn ? "আমাদের সম্পর্কে" : "About"}</Link>
            <Link to="/contact" className="block px-4 py-3 rounded-md text-sm font-semibold text-[#002D62]">{bn ? "যোগাযোগ" : "Contact"}</Link>
            <button type="button" onClick={toggle} className="w-full text-left px-4 py-3 rounded-md text-sm font-semibold text-[#002D62]">
              {bn ? "English" : "বাংলা"}
            </button>
          </div>
          <div className="p-4 border-t border-[#E5E7EB] space-y-2">
            <Link to="/book" className="block text-center py-3 bg-[#F37021] text-white font-bold rounded-md text-sm">{bn ? "যাত্রা শুরু করুন" : "Start Journey"}</Link>
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

  // CMS-driven footer (falls back to built-in values if the API is unavailable — no layout change).
  const quickMenu = usePublicMenu("QUICK_LINKS");
  const servicesMenu = usePublicMenu("FOOTER_NAV");
  const s = usePublicSettings().data ?? {};
  const quickLinks: NavLink[] = quickMenu.data?.items?.length ? toNav(quickMenu.data.items as CmsMenuItem[]) : FOOTER_QUICK_FALLBACK;
  const services: NavLink[] = servicesMenu.data?.items?.length ? toNav(servicesMenu.data.items as CmsMenuItem[]) : FOOTER_SERVICES_FALLBACK;

  return (
    <footer className="bg-[#001F45] text-white relative">
      <div className="h-1.5 w-full bg-gradient-to-r from-[#1B75BC] via-[#F37021] to-[#C89B3C]" aria-hidden />
      <div className="max-w-[1240px] mx-auto px-4 md:px-5 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-10">
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center mb-4 bg-white rounded-xl px-3 py-2.5 shadow-lg" aria-label="SM Travels International">
              <img src="/logo.png" alt="SM Travels International" className="h-12 w-auto object-contain" />
            </Link>
            <p className="text-white/65 text-sm leading-relaxed max-w-xs mb-5">
              {s["footer.description"] || (bn
                ? "২০১১ সাল থেকে বিশ্বস্ত হজ্ব, উমরাহ, ভিসা ও ভ্রমণ সেবা — স্বচ্ছতা ও ইসলামী শিষ্টাচারের সাথে।"
                : "Trusted Hajj, Umrah, visa and travel services since 2011 — with transparency and Islamic elegance.")}
            </p>
            <div className="flex gap-2">
              {FOOTER_SOCIAL.map(({ Icon, key }) => {
                const href = s[key] || "#";
                const name = key.split(".")[1];
                return (
                  <a key={key} href={href} target={href !== "#" ? "_blank" : undefined} rel="noreferrer"
                    aria-label={name} title={name}
                    className="w-9 h-9 rounded-full border border-white/20 hover:bg-[#F37021] hover:border-[#F37021] flex items-center justify-center transition-colors">
                    <Icon size={15} aria-hidden />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">{bn ? "দ্রুত লিংক" : "Quick Links"}</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              {quickLinks.map((l) => (
                <li key={l.path}><Link to={l.path} className="hover:text-white">{bn ? l.labelBn : l.labelEn}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">{bn ? "আমাদের সেবা" : "Our Services"}</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              {services.map((l) => (
                <li key={l.path}><Link to={l.path} className="hover:text-white">{bn ? l.labelBn : l.labelEn}</Link></li>
              ))}
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
              <li className="flex gap-2"><Phone size={14} className="mt-0.5 text-[#F37021] flex-shrink-0" /> {s["company.phone"] || "+880 1211 190 022"}</li>
              <li className="flex gap-2"><Mail size={14} className="mt-0.5 text-[#F37021] flex-shrink-0" /> {s["company.email"] || "support@smtravels.com"}</li>
              <li className="flex gap-2"><MapPin size={14} className="mt-0.5 text-[#F37021] flex-shrink-0" /> {s["company.address"] || (bn ? "ঢাকা ও চট্টগ্রাম, বাংলাদেশ" : "Dhaka & Chittagong, Bangladesh")}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#031632]">
        <div className="max-w-[1240px] mx-auto px-4 md:px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/45">{s["footer.copyright"] || t("footer.copyright")}</p>
          <PaymentLogos />
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF3F8] text-[#111827]" style={{ fontFamily: "var(--font-body)" }}>
      <Header />
      <main className="flex-1"><Outlet /></main>
      <div className="md:hidden h-[84px]" aria-hidden />
      <Footer />
      <PwaInstallBanner />
    </div>
  );
}
