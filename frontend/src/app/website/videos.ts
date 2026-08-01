/** On-site guide videos + optional YouTube fallback. CMS has no video list API. */
export interface SiteVideo {
  id: string;
  /** Local MP4 path under /public (preferred for in-site playback). */
  src?: string;
  /** Poster / thumbnail image path. */
  poster?: string;
  /** Optional YouTube id fallback when src is missing. */
  youtubeId?: string;
  titleBn: string;
  titleEn: string;
  category: "Hajj" | "Umrah" | "Visa" | "Air Ticket" | "Travel Tips";
  duration: string;
  views: string;
}

export function videoThumb(v: SiteVideo): string {
  if (v.poster) return v.poster;
  if (v.youtubeId) return `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
  return "/hero-kaaba.jpg";
}

export const SITE_VIDEOS: SiteVideo[] = [
  {
    id: "v1",
    src: "/videos/hajj-complete-guide.mp4",
    poster: "/videos/hajj-complete-guide.jpg",
    titleBn: "হজ্ব সম্পূর্ণ গাইড — এ থেকে জেড",
    titleEn: "Complete Hajj Guide A to Z",
    category: "Hajj",
    duration: "0:15",
    views: "Guide",
  },
  {
    id: "v2",
    src: "/videos/umrah-steps.mp4",
    poster: "/videos/umrah-steps.jpg",
    titleBn: "উমরাহ পদক্ষেপসমূহ",
    titleEn: "Umrah Step by Step",
    category: "Umrah",
    duration: "0:15",
    views: "Guide",
  },
  {
    id: "v3",
    src: "/videos/saudi-visa.mp4",
    poster: "/videos/saudi-visa.jpg",
    titleBn: "সৌদি ভিসা প্রক্রিয়া",
    titleEn: "Saudi Visa Process",
    category: "Visa",
    duration: "0:15",
    views: "Guide",
  },
  {
    id: "v4",
    src: "/videos/air-ticket-tips.mp4",
    poster: "/videos/air-ticket-tips.jpg",
    titleBn: "বিমান টিকিট কেনার টিপস",
    titleEn: "Air Ticket Buying Tips",
    category: "Air Ticket",
    duration: "0:15",
    views: "Guide",
  },
  {
    id: "v5",
    src: "/videos/packing-checklist.mp4",
    poster: "/videos/packing-checklist.jpg",
    titleBn: "হজ্ব-উমরাহ প্যাকিং চেকলিস্ট",
    titleEn: "Hajj-Umrah Packing Checklist",
    category: "Travel Tips",
    duration: "0:15",
    views: "Guide",
  },
  {
    id: "v6",
    src: "/videos/ihram-how.mp4",
    poster: "/videos/ihram-how.jpg",
    titleBn: "ইহরাম কিভাবে পরবেন",
    titleEn: "How to Wear Ihram",
    category: "Umrah",
    duration: "0:15",
    views: "Guide",
  },
];
