/**
 * Phase 2.2 — idempotent homepage seed (Statistics).
 * Values match the current hardcoded homepage counters so the UI is unchanged.
 *   npm run seed:home
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const STATS = [
  { title: "Satisfied Travelers", value: 100, suffix: "K+", icon: "Users", color: "#FFFFFF", sortOrder: 0 },
  { title: "Years Experience", value: 12, suffix: "+", icon: "BadgeCheck", color: "#FFFFFF", sortOrder: 1 },
  { title: "Countries Served", value: 25, suffix: "+", icon: "MapPin", color: "#FFFFFF", sortOrder: 2 },
  { title: "Hajj Groups", value: 500, suffix: "+", icon: "Star", color: "#FFFFFF", sortOrder: 3 },
  { title: "Visa Success Rate", value: 98, suffix: "%", icon: "Shield", color: "#FFFFFF", sortOrder: 4 },
];

// Homepage service cards — values match the current hardcoded grid so the UI is unchanged.
const SERVICES = [
  { title: "Hajj Package", buttonUrl: "/hajj", icon: "Star", color: "#1B75BC", sortOrder: 0 },
  { title: "Umrah Package", buttonUrl: "/umrah", icon: "MapPin", color: "#F37021", sortOrder: 1 },
  { title: "Visa Service", buttonUrl: "/visa", icon: "Shield", color: "#002D62", sortOrder: 2 },
  { title: "Air Ticket", buttonUrl: "/air-ticket", icon: "Plane", color: "#1B75BC", sortOrder: 3 },
  { title: "Tour Package", buttonUrl: "/tour-packages", icon: "Globe", color: "#16A34A", sortOrder: 4 },
  { title: "Hotel Booking", buttonUrl: "/hotel-booking", icon: "Hotel", color: "#C89B3C", sortOrder: 5 },
  { title: "Transport Service", buttonUrl: "/transport", icon: "Car", color: "#1B75BC", sortOrder: 6 },
  { title: "Travel Insurance", buttonUrl: "/faq", icon: "Umbrella", color: "#F37021", sortOrder: 7 },
];

// Newsletter + Announcement bar via existing Setting model (reused). Announcement defaults OFF (no visual change).
const HOME_SETTINGS: [string, string, string][] = [
  ["newsletter", "newsletter.heading_en", "Subscribe for latest offers & updates"],
  ["newsletter", "newsletter.heading_bn", "সর্বশেষ অফার ও আপডেট পেতে সাবস্ক্রাইব করুন"],
  ["newsletter", "newsletter.desc_en", "New packages and guides delivered to your inbox."],
  ["newsletter", "newsletter.desc_bn", "নতুন প্যাকেজ ও গাইড সরাসরি আপনার ইনবক্সে।"],
  ["newsletter", "newsletter.placeholder_en", "Your email"],
  ["newsletter", "newsletter.placeholder_bn", "আপনার ইমেইল"],
  ["newsletter", "newsletter.button_en", "Subscribe"],
  ["newsletter", "newsletter.button_bn", "সাবস্ক্রাইব করুন"],
  ["announcement", "announcement.enabled", "false"],
  ["announcement", "announcement.text_en", "Hajj 2026 registration is now open — talk to our team today."],
  ["announcement", "announcement.text_bn", "হজ্ব ২০২৬ নিবন্ধন এখন খোলা — আজই আমাদের সাথে যোগাযোগ করুন।"],
  ["announcement", "announcement.link", "/hajj"],
  ["announcement", "announcement.bg", "#002D62"],
  ["announcement", "announcement.color", "#FFFFFF"],
  ["announcement", "announcement.dismissible", "true"],
];

const HERO = {
  key: "home",
  title: "Your trusted partner for Hajj & Umrah journeys",
  titleBn: "বিশ্বস্ততায় আমরাই আপনার হজ্ব ও ওমরাহ যাত্রার সেরা সাথী",
  highlight: "Hajj & Umrah",
  highlightBn: "হজ্ব ও ওমরাহ",
  subtitle: "Government-approved agency — safe flights, quality hotels and experienced guides for a peaceful pilgrimage.",
  subtitleBn: "সরকার অনুমোদিত এজেন্সি — নিরাপদ ফ্লাইট, মানসম্মত হোটেল এবং অভিজ্ঞ গাইডের সাথে আপনার ইবাদতের যাত্রা হোক নিশ্চিন্ত।",
  primaryLabel: "View Hajj & Umrah Packages",
  primaryLabelBn: "হজ্ব ও ওমরাহ প্যাকেজ দেখুন",
  primaryUrl: "/packages",
  secondaryLabel: "Watch Our Video",
  secondaryLabelBn: "আমাদের ভিডিও দেখুন",
  backgroundImage: "/hero-approve.jpg",
  overlay: "linear-gradient(90deg, rgba(0,20,48,0.55) 0%, rgba(0,20,48,0.28) 42%, rgba(0,20,48,0.08) 68%, transparent 82%)",
  badges: [
    { icon: "Shield", label: "Trusted Service", labelBn: "বিশ্বস্ত সেবা" },
    { icon: "Headphones", label: "24/7 Support", labelBn: "২৪/৭ সহায়তা" },
    { icon: "Users", label: "5,000+ Happy Pilgrims", labelBn: "৫,০০০+ সন্তুষ্ট হাজী" },
    { icon: "BadgeCheck", label: "ATOL & IATA Certified", labelBn: "ATOL ও IATA সার্টিফাইড" },
  ],
};

// Homepage Section Manager + JSON renderer foundation. sortOrder = current render order.
const SUNNAH = [
  { en: "Recite dua during Tawaf", bn: "তাওয়াফের সময় দোয়া পড়া" },
  { en: "Kiss the Black Stone if possible", bn: "যথাসম্ভব হাজরে আসওয়াদ চুম্বন" },
  { en: "Brisk pace at Safa–Marwah (men)", bn: "সাফা–মারওয়ায় দ্রুত হাঁটা (পুরুষ)" },
  { en: "Abundant dua & dhikr at Arafat", bn: "আরাফাতে বেশি দোয়া ও জিকির" },
  { en: "Increase nafl prayer in Makkah", bn: "মক্কায় নফল নামাজ বাড়ানো" },
];
const PROHIBITIONS = [
  { en: "Using perfume in Ihram", bn: "ইহরামে সুগন্ধি ব্যবহার" },
  { en: "Covering the head (men)", bn: "পুরুষের মাথা ঢাকা" },
  { en: "Hunting or cutting plants", bn: "শিকার করা বা গাছ কাটা" },
  { en: "Quarreling or indecent speech", bn: "ঝগড়া ও অশালীন কথা" },
  { en: "Breaking women’s Ihram rules", bn: "নারীদের জন্য নিষিদ্ধ নিয়ম ভাঙা" },
];
const HOME_SECTIONS: { key: string; type: string; sortOrder: number; eyebrow?: string; eyebrowBn?: string; title?: string; titleBn?: string; config?: unknown }[] = [
  { key: "hero", type: "hero", sortOrder: 0 },
  { key: "services", type: "services", sortOrder: 1 },
  { key: "rules", type: "rules", sortOrder: 2, eyebrow: "Knowledge Hub", eyebrowBn: "জ্ঞান কেন্দ্র", title: "Rules and Duties of Hajj & Umrah", titleBn: "হজ্ব ও ওমরাহ এর নিয়ম ও করণীয়", config: { hajjSlugs: ["mina", "arafat", "muzdalifah", "ramy", "qurbani", "hair-cutting", "farewell-tawaf", "womens-rules"], umrahSlugs: ["what-is-ihram", "how-to-wear-ihram", "intention-niyyah", "talbiyah", "tawaf", "sai", "farewell-tawaf", "things-that-break-ihram"], ctaEn: "View All Steps for Hajj in Detail", ctaBn: "হজ্বের সব ধাপ বিস্তারিত দেখুন", ctaUrl: "/knowledge" } },
  { key: "packages", type: "packages", sortOrder: 3 },
  { key: "sunnah", type: "sunnah", sortOrder: 4, eyebrow: "Guidance for Worship", eyebrowBn: "ইবাদতের দিকনির্দেশনা", title: "Sunnah & Prohibited Acts", titleBn: "সুন্নাহ ও নিষিদ্ধ কাজসমূহ", config: { sunnah: SUNNAH, prohibitions: PROHIBITIONS } },
  { key: "video", type: "video", sortOrder: 5, eyebrow: "Video Guides", eyebrowBn: "ভিডিও গাইড", title: "Video Tutorials & Guides", titleBn: "ভিডিও টিউটোরিয়াল ও গাইড", config: { ctaEn: "View All Videos", ctaBn: "সব ভিডিও দেখুন", ctaUrl: "/videos" } },
  { key: "stats", type: "stats", sortOrder: 6 },
  { key: "newsletter", type: "newsletter", sortOrder: 7 },
];

async function main() {
  console.log(`\n▶ Seeding homepage statistics into: ${(process.env.DATABASE_URL ?? "").replace(/:\/\/[^@]*@/, "://***@")}\n`);
  let created = 0, existed = 0;
  for (const s of STATS) {
    const existing = await prisma.statistic.findFirst({ where: { title: s.title, deletedAt: null } });
    if (existing) { existed++; continue; }
    await prisma.statistic.create({ data: { ...s, visible: true, homepage: true, animation: true } });
    created++;
  }
  console.log(`  Statistic: created ${created}, existed ${existed}, total ${await prisma.statistic.count()}`);

  let sc = 0, se = 0;
  for (const s of SERVICES) {
    const existing = await prisma.homeService.findFirst({ where: { title: s.title, deletedAt: null } });
    if (existing) { se++; continue; }
    await prisma.homeService.create({ data: { ...s, visible: true, homepage: true, published: true } });
    sc++;
  }
  console.log(`  HomeService: created ${sc}, existed ${se}, total ${await prisma.homeService.count()}`);

  const company = await prisma.company.findFirst();
  if (company) {
    for (const [group, key, value] of HOME_SETTINGS) {
      await prisma.setting.upsert({
        where: { companyId_key: { companyId: company.id, key } },
        update: {},                     // never overwrite an admin-edited value
        create: { companyId: company.id, key, value, group },
      });
    }
    console.log(`  Settings (newsletter+announcement): ensured ${HOME_SETTINGS.length} keys`);
  }

  await prisma.hero.upsert({
    where: { key: HERO.key },
    update: {},                        // never overwrite an admin-edited hero
    create: HERO,
  });
  console.log(`  Hero: ensured key="${HERO.key}", total ${await prisma.hero.count()}`);

  for (const s of HOME_SECTIONS) {
    await prisma.homeSection.upsert({
      where: { key: s.key },
      update: {},                      // never overwrite an admin-edited section
      create: {
        key: s.key, type: s.type, sortOrder: s.sortOrder,
        eyebrow: s.eyebrow ?? null, eyebrowBn: s.eyebrowBn ?? null,
        title: s.title ?? null, titleBn: s.titleBn ?? null,
        config: (s.config ?? undefined) as never,
        visible: true, published: true,
      },
    });
  }
  console.log(`  HomeSection: ensured ${HOME_SECTIONS.length} sections, total ${await prisma.homeSection.count()}\n`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
