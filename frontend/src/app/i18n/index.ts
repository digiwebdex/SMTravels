/**
 * i18next setup. Default language Bangla ("bn"), fallback English ("en").
 * Language is read from / written to a cookie (see lang.ts) — no localStorage.
 *
 * Resources are namespaced by area so each screen only pulls what it needs and
 * keys stay meaningful. Pass 1 (public site) namespaces are registered below;
 * later passes (auth, portals, ERP) add their own.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { readLangCookie, applyHtmlLang, DEFAULT_LANG } from "./lang";

import enCommon from "./locales/en/common.json";
import bnCommon from "./locales/bn/common.json";
import enLayout from "./locales/en/layout.json";
import bnLayout from "./locales/bn/layout.json";
import enHome from "./locales/en/home.json";
import bnHome from "./locales/bn/home.json";
import enAbout from "./locales/en/about.json";
import bnAbout from "./locales/bn/about.json";
import enServicesPage from "./locales/en/servicesPage.json";
import bnServicesPage from "./locales/bn/servicesPage.json";
import enPackages from "./locales/en/packages.json";
import bnPackages from "./locales/bn/packages.json";
import enContact from "./locales/en/contact.json";
import bnContact from "./locales/bn/contact.json";
import enFaq from "./locales/en/faq.json";
import bnFaq from "./locales/bn/faq.json";
import enBlog from "./locales/en/blog.json";
import bnBlog from "./locales/bn/blog.json";
import enGallery from "./locales/en/gallery.json";
import bnGallery from "./locales/bn/gallery.json";
import enBooking from "./locales/en/booking.json";
import bnBooking from "./locales/bn/booking.json";
import enErrors from "./locales/en/errors.json";
import bnErrors from "./locales/bn/errors.json";
// Pass 2 — auth + portals
import enAuth from "./locales/en/auth.json";
import bnAuth from "./locales/bn/auth.json";
import enPortalCommon from "./locales/en/portalCommon.json";
import bnPortalCommon from "./locales/bn/portalCommon.json";
import enPortalCustomer from "./locales/en/portalCustomer.json";
import bnPortalCustomer from "./locales/bn/portalCustomer.json";
import enPortalAgent from "./locales/en/portalAgent.json";
import bnPortalAgent from "./locales/bn/portalAgent.json";
import enPortalSupplier from "./locales/en/portalSupplier.json";
import bnPortalSupplier from "./locales/bn/portalSupplier.json";
import enPortalStaff from "./locales/en/portalStaff.json";
import bnPortalStaff from "./locales/bn/portalStaff.json";
import enPortalAccountant from "./locales/en/portalAccountant.json";
import bnPortalAccountant from "./locales/bn/portalAccountant.json";
// Pass 3 — ERP (per-module namespaces). The bn files are English PLACEHOLDERS
// for now: the ERP is wired to t() keys so the eventual Bangla sweep is a
// translation job (edit the bn JSON), not an extraction job.
import enErpCommon from "./locales/en/erpCommon.json";
import bnErpCommon from "./locales/bn/erpCommon.json";
import enErpHajjOps from "./locales/en/erpHajjOps.json";
import bnErpHajjOps from "./locales/bn/erpHajjOps.json";
import enErpBookings from "./locales/en/erpBookings.json";
import bnErpBookings from "./locales/bn/erpBookings.json";
import enErpNav from "./locales/en/erpNav.json";
import bnErpNav from "./locales/bn/erpNav.json";

export const resources = {
  en: {
    common: enCommon, layout: enLayout, home: enHome, about: enAbout,
    servicesPage: enServicesPage, packages: enPackages, contact: enContact,
    faq: enFaq, blog: enBlog, gallery: enGallery, booking: enBooking, errors: enErrors,
    auth: enAuth, portalCommon: enPortalCommon, portalCustomer: enPortalCustomer,
    portalAgent: enPortalAgent, portalSupplier: enPortalSupplier, portalStaff: enPortalStaff,
    portalAccountant: enPortalAccountant,
    erpCommon: enErpCommon, erpHajjOps: enErpHajjOps, erpBookings: enErpBookings, erpNav: enErpNav,
  },
  bn: {
    common: bnCommon, layout: bnLayout, home: bnHome, about: bnAbout,
    servicesPage: bnServicesPage, packages: bnPackages, contact: bnContact,
    faq: bnFaq, blog: bnBlog, gallery: bnGallery, booking: bnBooking, errors: bnErrors,
    auth: bnAuth, portalCommon: bnPortalCommon, portalCustomer: bnPortalCustomer,
    portalAgent: bnPortalAgent, portalSupplier: bnPortalSupplier, portalStaff: bnPortalStaff,
    portalAccountant: bnPortalAccountant,
    erpCommon: bnErpCommon, erpHajjOps: bnErpHajjOps, erpBookings: bnErpBookings, erpNav: bnErpNav,
  },
} as const;

const startLang = readLangCookie();
applyHtmlLang(startLang);

void i18n.use(initReactI18next).init({
  resources,
  lng: startLang,
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "layout", "home", "about", "servicesPage", "packages", "contact", "faq", "blog", "gallery", "booking", "errors", "auth", "portalCommon", "portalCustomer", "portalAgent", "portalSupplier", "portalStaff", "portalAccountant", "erpCommon", "erpHajjOps", "erpBookings", "erpNav"],
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

// Guard against an unexpected cookie value.
if (!i18n.language) void i18n.changeLanguage(DEFAULT_LANG);

export default i18n;
