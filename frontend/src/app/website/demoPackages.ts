/**
 * Demo packages for the marketing site when /api/public/packages is empty
 * or unavailable. Same shape as PublicPackageItem / PublicPackageDetail.
 */
import type { PublicPackageDetail, PublicPackageItem } from "@contracts/cms.contract";

export const DEMO_PACKAGES: PublicPackageDetail[] = [
  {
    id: "demo_hajj_premium",
    slug: "hajj-premium-2026",
    title: "Hajj Premium 2026",
    type: "Hajj",
    price: 385000,
    originalPrice: 420000,
    duration: "40 Days",
    departure: "May 2026",
    hotel: "5-Star Haram-View Makkah",
    flight: "Biman Bangladesh Airlines",
    rating: 4.9,
    reviews: 127,
    seats: 8,
    badge: "Best Value",
    image: "/hero-makkah-poster.jpg",
    highlights: ["Haram-view 5-star hotel", "Direct Biman flight", "All meals included", "AC Mina tent", "Guided Ziyarah"],
    featured: true,
    includes: [
      "Return air ticket Dhaka–Jeddah", "Hajj visa", "5-star hotel Makkah (Haram-view)",
      "5-star hotel Madinah", "Mina AC tent", "Arafat & Muzdalifah", "All meals",
      "All Ziyarah tours", "Airport transfers", "Ihram set", "24/7 on-ground support",
    ],
    excludes: ["Personal shopping", "Laundry", "Qurbani (optional)", "Phone/SIM card"],
    itinerary: [
      { day: "Day 1–2", title: "Departure from Dhaka", desc: "Group assembly at HSIA. Flight to Jeddah. Transfer to Madinah hotel." },
      { day: "Day 3–7", title: "Stay in Madinah", desc: "Prayers in Masjid an-Nabawi. Ziyarah of historical sites. Raudah visit." },
      { day: "Day 8", title: "Travel to Makkah", desc: "Don Ihram at Miqat. Travel to Makkah. Check-in at Haram-view hotel." },
      { day: "Day 9–26", title: "Stay in Makkah", desc: "Perform Umrah. Prayers in Masjid al-Haram. Pre-Hajj preparation." },
      { day: "Day 27–30", title: "Hajj Rituals", desc: "Mina, Arafat (Wuquf), Muzdalifah, Jamarat, Qurbani, Tawaf al-Ifadah." },
      { day: "Day 31–40", title: "Post-Hajj & Return", desc: "Farewell Tawaf. Jeddah airport. Flight to Dhaka." },
    ],
    longDesc: "Our flagship Hajj package with Haram-view lodging, full board, and dedicated Bangla-speaking guides throughout the pilgrimage.",
  },
  {
    id: "demo_hajj_economy",
    slug: "hajj-economy-2026",
    title: "Hajj Economy 2026",
    type: "Hajj",
    price: 295000,
    originalPrice: null,
    duration: "35 Days",
    departure: "May 2026",
    hotel: "4-Star Near Haram",
    flight: "Saudi Airlines (Connecting)",
    rating: 4.7,
    reviews: 89,
    seats: 14,
    badge: "Popular",
    image: "/hero-makkah-poster.jpg",
    highlights: ["Near-Haram 4-star hotel", "Connecting flight", "Breakfast included", "Guided Ziyarah", "Mina tent"],
    featured: true,
    includes: [
      "Return air ticket (connecting)", "Hajj visa", "4-star hotel Makkah", "4-star hotel Madinah",
      "Mina tent", "Arafat & Muzdalifah", "Breakfast", "Guided Ziyarah", "Airport transfers",
    ],
    excludes: ["Lunch & dinner", "Personal expenses", "Qurbani", "Laundry"],
    itinerary: [
      { day: "Day 1–2", title: "Departure", desc: "Flight from Dhaka via connecting point to Jeddah. Transfer to Madinah." },
      { day: "Day 3–6", title: "Madinah Stay", desc: "Prayers in Masjid an-Nabawi and historical site Ziyarah." },
      { day: "Day 7–24", title: "Makkah Stay", desc: "Umrah, Haram prayers, Makkah Ziyarah. Pre-Hajj preparation." },
      { day: "Day 25–28", title: "Hajj Days", desc: "Mina, Arafat Wuquf, Muzdalifah, Jamarat, Qurbani, Tawaf al-Ifadah." },
      { day: "Day 29–35", title: "Return", desc: "Farewell Tawaf. Return flight to Dhaka." },
    ],
    longDesc: "Affordable Hajj with near-Haram hotels and professional group management — designed for first-time pilgrims.",
  },
  {
    id: "demo_umrah_gold",
    slug: "umrah-gold-package",
    title: "Umrah Gold Package",
    type: "Umrah",
    price: 145000,
    originalPrice: 165000,
    duration: "14 Days",
    departure: "Any Month",
    hotel: "5-Star Haram-View Makkah",
    flight: "Emirates / Qatar Airways",
    rating: 4.8,
    reviews: 214,
    seats: 20,
    badge: "Most Popular",
    image: "/hero-makkah-poster.jpg",
    highlights: ["5-star Haram-view hotel", "Premium airline", "Makkah + Madinah", "All Ziyarah", "Visa included"],
    featured: true,
    includes: [
      "Return air ticket", "Umrah e-visa", "5-star Makkah hotel (7 nights)", "5-star Madinah hotel (4 nights)",
      "Ziyarah tours both cities", "Airport transfers", "Makkah–Madinah transport", "Umrah guide",
    ],
    excludes: ["Meals (breakfast only if selected)", "Personal shopping", "SIM card"],
    itinerary: [
      { day: "Day 1", title: "Departure Dhaka", desc: "Flight from HSIA. Arrive Madinah. Check-in near Masjid an-Nabawi." },
      { day: "Day 2–4", title: "Madinah Stay", desc: "Prayers, Raudah visit, Ziyarah of Uhud and Quba." },
      { day: "Day 5", title: "Travel to Makkah", desc: "Don Ihram. Travel to Makkah. Perform Umrah (Tawaf & Sa'i)." },
      { day: "Day 6–11", title: "Makkah Stay", desc: "Multiple Tawafs, Haram prayers, Makkah Ziyarah." },
      { day: "Day 12–14", title: "Return", desc: "Farewell. Airport transfer. Flight to Dhaka." },
    ],
    longDesc: "Premium year-round Umrah with Haram-view stays and full Ziyarah in both holy cities.",
  },
  {
    id: "demo_umrah_silver",
    slug: "umrah-silver-package",
    title: "Umrah Silver Package",
    type: "Umrah",
    price: 95000,
    originalPrice: null,
    duration: "10 Days",
    departure: "Any Month",
    hotel: "4-Star Near Haram",
    flight: "Biman / Air Arabia",
    rating: 4.6,
    reviews: 186,
    seats: 25,
    badge: "Popular",
    image: "/hero-makkah-poster.jpg",
    highlights: ["4-star near-Haram hotel", "Makkah + Madinah", "Visa included", "Guided Ziyarah", "Budget-friendly"],
    featured: false,
    includes: [
      "Return air ticket", "Umrah e-visa", "4-star Makkah hotel (6 nights)",
      "4-star Madinah hotel (3 nights)", "Ziyarah tours", "Airport transfers",
    ],
    excludes: ["Meals", "Personal expenses", "Laundry"],
    itinerary: [
      { day: "Day 1", title: "Departure", desc: "Flight to Jeddah/Madinah. Transfer and check-in." },
      { day: "Day 2–3", title: "Madinah", desc: "Prayers, Raudah, Ziyarah." },
      { day: "Day 4", title: "Makkah", desc: "Don Ihram. Travel to Makkah. Perform Umrah." },
      { day: "Day 5–9", title: "Makkah Stay", desc: "Prayers, Tawaf, Makkah Ziyarah." },
      { day: "Day 10", title: "Return", desc: "Jeddah airport. Flight to Dhaka." },
    ],
    longDesc: "Value Umrah package with comfortable near-Haram hotels — ideal for families and seniors.",
  },
  {
    id: "demo_umrah_ramadan",
    slug: "umrah-ramadan-special",
    title: "Umrah Ramadan Special",
    type: "Umrah",
    price: 175000,
    originalPrice: 195000,
    duration: "15 Days",
    departure: "Ramadan 2026",
    hotel: "5-Star Walking Distance Haram",
    flight: "Saudi Airlines / Emirates",
    rating: 4.9,
    reviews: 72,
    seats: 10,
    badge: "Featured",
    image: "/hero-makkah-poster.jpg",
    highlights: ["Ramadan in Haram", "Iftar arrangements", "Walking-distance hotel", "Madinah included", "Limited seats"],
    featured: true,
    includes: [
      "Return air ticket", "Umrah e-visa", "5-star Makkah (10 nights)", "5-star Madinah (3 nights)",
      "Group iftar support", "Ziyarah tours", "Airport transfers",
    ],
    excludes: ["Personal shopping", "Private transport outside plan"],
    itinerary: [
      { day: "Day 1", title: "Arrival", desc: "Arrive Madinah before Ramadan peak. Hotel check-in." },
      { day: "Day 2–4", title: "Madinah", desc: "Taraweeh in Masjid an-Nabawi. Raudah booking support." },
      { day: "Day 5–13", title: "Makkah Ramadan", desc: "Umrah, Taraweeh in Haram, spiritual program." },
      { day: "Day 14–15", title: "Return", desc: "Farewell Tawaf. Return to Dhaka." },
    ],
    longDesc: "Experience the blessings of Ramadan in the Two Holy Mosques with guided support and premium lodging.",
  },
  {
    id: "demo_tour_dubai",
    slug: "tour-dubai-5n6d",
    title: "Tour Dubai 5N/6D",
    type: "Tour",
    price: 85000,
    originalPrice: 99000,
    duration: "6 Days",
    departure: "Oct–Mar",
    hotel: "4-Star Dubai",
    flight: "Emirates / flydubai",
    rating: 4.7,
    reviews: 156,
    seats: 12,
    badge: "Best Seller",
    image: "/hero-makkah-poster.jpg",
    highlights: ["Burj Khalifa visit", "Desert Safari", "Dubai Mall", "Marina Dhow Cruise", "City tour"],
    featured: true,
    includes: [
      "Return flights", "UAE tourist visa", "4-star hotel (5 nights)", "Breakfast daily",
      "All city tours", "Desert safari (dinner)", "Marina dhow cruise", "Airport transfers",
    ],
    excludes: ["Lunch & dinner (except safari & cruise)", "Personal shopping", "Ski Dubai"],
    itinerary: [
      { day: "Day 1", title: "Arrival Dubai", desc: "Fly from Dhaka. Hotel check-in. Evening at Dubai Mall." },
      { day: "Day 2", title: "City Tour", desc: "Souks, Al Fahidi, Creek Abra ride." },
      { day: "Day 3", title: "Burj Khalifa", desc: "At the Top visit and Fountain show." },
      { day: "Day 4", title: "Desert Safari", desc: "Dune bashing and BBQ dinner camp." },
      { day: "Day 5", title: "Palm & Marina", desc: "Palm Jumeirah and Marina cruise." },
      { day: "Day 6", title: "Departure", desc: "Airport transfer. Flight to Dhaka." },
    ],
    longDesc: "Family-friendly Dubai holiday with signature attractions and halal-friendly itinerary.",
  },
  {
    id: "demo_tour_malaysia",
    slug: "tour-malaysia-7n8d",
    title: "Tour Malaysia 7N/8D",
    type: "Tour",
    price: 105000,
    originalPrice: null,
    duration: "8 Days",
    departure: "Sep–Jan",
    hotel: "4-Star KL + Langkawi",
    flight: "Biman / AirAsia",
    rating: 4.6,
    reviews: 98,
    seats: 18,
    badge: null,
    image: "/hero-makkah-poster.jpg",
    highlights: ["Kuala Lumpur", "Genting Highlands", "Langkawi Island", "Batu Caves", "PETRONAS Towers"],
    featured: false,
    includes: [
      "Return flights", "Malaysia eVisa", "4-star hotel (7 nights)", "Breakfast daily",
      "All tours & transfers", "KL–Langkawi internal flight",
    ],
    excludes: ["Lunch & dinner", "Theme park tickets", "Personal shopping"],
    itinerary: [
      { day: "Day 1", title: "Arrival KL", desc: "Arrive Kuala Lumpur. Hotel check-in." },
      { day: "Day 2", title: "KL City Tour", desc: "Batu Caves, Twin Towers, city highlights." },
      { day: "Day 3", title: "Genting", desc: "Cable car and highland leisure." },
      { day: "Day 4–6", title: "Langkawi", desc: "Island stay, Sky Bridge, beaches." },
      { day: "Day 7–8", title: "Return", desc: "Back to KL and flight to Dhaka." },
    ],
    longDesc: "KL + Langkawi combo tour with guided sightseeing and comfortable 4-star stays.",
  },
  {
    id: "demo_hajj_vip",
    slug: "hajj-vip-2026",
    title: "Hajj VIP 2026",
    type: "Hajj",
    price: 525000,
    originalPrice: 560000,
    duration: "42 Days",
    departure: "May 2026",
    hotel: "5-Star Clock Tower / Hilton",
    flight: "Saudi Airlines Direct",
    rating: 5,
    reviews: 41,
    seats: 6,
    badge: "VIP",
    image: "/hero-makkah-poster.jpg",
    highlights: ["Clock Tower / Hilton lodging", "Private transport", "VIP Mina camp", "Dedicated guide", "Full board"],
    featured: true,
    includes: [
      "Direct flights", "Hajj visa", "Premium Makkah & Madinah hotels", "VIP Mina camp",
      "Private transport", "All meals", "Personal Bangla guide", "Full Ziyarah",
    ],
    excludes: ["Personal shopping", "Optional private Qurbani upgrades"],
    itinerary: [
      { day: "Day 1–3", title: "Arrival & Madinah", desc: "VIP reception, Madinah hotel, Raudah support." },
      { day: "Day 4–25", title: "Makkah Premium", desc: "Haram-proximity lodging and spiritual prep." },
      { day: "Day 26–30", title: "Hajj Rituals", desc: "VIP Mina camp and guided rites." },
      { day: "Day 31–42", title: "Rest & Return", desc: "Post-Hajj rest and return to Dhaka." },
    ],
    longDesc: "Ultra-premium Hajj with VIP camp access, private vehicles, and white-glove coordination.",
  },
];

function typeMatches(itemType: string, filter?: string): boolean {
  if (!filter) return true;
  const a = itemType.toUpperCase().replace(/\s+/g, "_");
  const b = filter.toUpperCase().replace(/\s+/g, "_");
  return a === b || a.startsWith(b) || b.startsWith(a);
}

export function listDemoPackages(opts?: {
  featured?: boolean;
  type?: string;
  q?: string;
  limit?: number;
}): { data: PublicPackageItem[]; total: number } {
  let list = [...DEMO_PACKAGES] as PublicPackageItem[];
  if (opts?.featured) list = list.filter((p) => p.featured);
  if (opts?.type) list = list.filter((p) => typeMatches(p.type, opts.type));
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    list = list.filter(
      (p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.type.toLowerCase().includes(q),
    );
  }
  const total = list.length;
  const limit = opts?.limit ?? 50;
  return { data: list.slice(0, limit), total };
}

export function getDemoPackage(slugOrId: string | undefined): PublicPackageDetail | undefined {
  if (!slugOrId) return undefined;
  return DEMO_PACKAGES.find((p) => p.id === slugOrId || p.slug === slugOrId);
}
