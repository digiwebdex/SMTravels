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

export const resources = {
  en: {
    common: enCommon, layout: enLayout, home: enHome, about: enAbout,
    servicesPage: enServicesPage, packages: enPackages, contact: enContact,
    faq: enFaq, blog: enBlog, gallery: enGallery, booking: enBooking, errors: enErrors,
  },
  bn: {
    common: bnCommon, layout: bnLayout, home: bnHome, about: bnAbout,
    servicesPage: bnServicesPage, packages: bnPackages, contact: bnContact,
    faq: bnFaq, blog: bnBlog, gallery: bnGallery, booking: bnBooking, errors: bnErrors,
  },
} as const;

const startLang = readLangCookie();
applyHtmlLang(startLang);

void i18n.use(initReactI18next).init({
  resources,
  lng: startLang,
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "layout", "home", "about", "servicesPage", "packages", "contact", "faq", "blog", "gallery", "booking", "errors"],
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

// Guard against an unexpected cookie value.
if (!i18n.language) void i18n.changeLanguage(DEFAULT_LANG);

export default i18n;
