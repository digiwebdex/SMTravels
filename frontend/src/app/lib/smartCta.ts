/**
 * Smart CTA rules — pick headline / WhatsApp copy / primary action from the route.
 * Keeps the sticky bar & exit-intent offer context-aware without per-page wiring.
 */

export type SmartCtaContext = {
  id: string;
  /** i18n key under layout.smartCta.contexts.<id> */
  contextKey: string;
  bookTo: string;
  waTextEn: string;
  waTextBn: string;
  /** Hide the Book button (e.g. already on /book) */
  hideBook?: boolean;
};

const DEFAULT: SmartCtaContext = {
  id: "default",
  contextKey: "default",
  bookTo: "/book",
  waTextEn: "Assalamu Alaikum SM Travels — I need travel assistance.",
  waTextBn: "আসসালামু আলাইকুম এসএম ট্রাভেলস — আমার ভ্রমণ সহায়তা দরকার।",
};

const RULES: { match: RegExp; ctx: SmartCtaContext }[] = [
  {
    match: /^\/hajj/,
    ctx: {
      id: "hajj",
      contextKey: "hajj",
      bookTo: "/book?service=hajj",
      waTextEn: "Assalamu Alaikum — I want details about Hajj packages.",
      waTextBn: "আসসালামু আলাইকুম — হজ্ব প্যাকেজ সম্পর্কে জানতে চাই।",
    },
  },
  {
    match: /^\/umrah/,
    ctx: {
      id: "umrah",
      contextKey: "umrah",
      bookTo: "/book?service=umrah",
      waTextEn: "Assalamu Alaikum — I want details about Umrah packages.",
      waTextBn: "আসসালামু আলাইকুম — উমরাহ প্যাকেজ সম্পর্কে জানতে চাই।",
    },
  },
  {
    match: /^\/visa/,
    ctx: {
      id: "visa",
      contextKey: "visa",
      bookTo: "/book?service=visa",
      waTextEn: "Assalamu Alaikum — I need help with a visa application.",
      waTextBn: "আসসালামু আলাইকুম — ভিসা আবেদনে সহায়তা চাই।",
    },
  },
  {
    match: /^\/air-ticket/,
    ctx: {
      id: "air",
      contextKey: "air",
      bookTo: "/book?service=air-ticket",
      waTextEn: "Assalamu Alaikum — I need an air ticket quote.",
      waTextBn: "আসসালামু আলাইকুম — এয়ার টিকেটের কোটেশন চাই।",
    },
  },
  {
    match: /^\/(packages|tour-packages)/,
    ctx: {
      id: "packages",
      contextKey: "packages",
      bookTo: "/book",
      waTextEn: "Assalamu Alaikum — I want help choosing a travel package.",
      waTextBn: "আসসালামু আলাইকুম — ট্রাভেল প্যাকেজ বেছে নিতে সাহায্য চাই।",
    },
  },
  {
    match: /^\/manpower/,
    ctx: {
      id: "manpower",
      contextKey: "manpower",
      bookTo: "/contact?topic=manpower",
      waTextEn: "Assalamu Alaikum — I want manpower / overseas job guidance.",
      waTextBn: "আসসালামু আলাইকুম — ম্যানপাওয়ার / বিদেশে চাকরির গাইডেন্স চাই।",
    },
  },
  {
    match: /^\/hotel-booking/,
    ctx: {
      id: "hotel",
      contextKey: "hotel",
      bookTo: "/book?service=hotel",
      waTextEn: "Assalamu Alaikum — I need hotel booking assistance.",
      waTextBn: "আসসালামু আলাইকুম — হোটেল বুকিংয়ে সহায়তা চাই।",
    },
  },
  {
    match: /^\/transport/,
    ctx: {
      id: "transport",
      contextKey: "transport",
      bookTo: "/book?service=transport",
      waTextEn: "Assalamu Alaikum — I need transport / transfer booking.",
      waTextBn: "আসসালামু আলাইকুম — পরিবহন / ট্রান্সফার বুকিং চাই।",
    },
  },
  {
    match: /^\/book/,
    ctx: {
      id: "book",
      contextKey: "book",
      bookTo: "/book",
      hideBook: true,
      waTextEn: "Assalamu Alaikum — I need help completing my booking.",
      waTextBn: "আসসালামু আলাইকুম — বুকিং সম্পন্ন করতে সাহায্য চাই।",
    },
  },
  {
    match: /^\/contact/,
    ctx: {
      id: "contact",
      contextKey: "contact",
      bookTo: "/book",
      waTextEn: "Assalamu Alaikum — contacting you from the website.",
      waTextBn: "আসসালামু আলাইকুম — ওয়েবসাইট থেকে যোগাযোগ করছি।",
    },
  },
];

export function resolveSmartCta(pathname: string): SmartCtaContext {
  const path = pathname.split("?")[0] || "/";
  for (const rule of RULES) {
    if (rule.match.test(path)) return rule.ctx;
  }
  return DEFAULT;
}

export const SMART_CTA_DISMISS_KEY = "smtravels_smart_cta_offer_dismissed";
export const SMART_CTA_OFFER_COOLDOWN_MS = 1000 * 60 * 60 * 24; // 24h
