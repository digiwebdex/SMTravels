/** Curated YouTube gallery — CMS has no video list API; URLs are editorial content. */
export interface SiteVideo {
  id: string;
  youtubeId: string;
  titleBn: string;
  titleEn: string;
  category: "Hajj" | "Umrah" | "Visa" | "Air Ticket" | "Travel Tips";
  duration: string;
  views: string;
}

export const SITE_VIDEOS: SiteVideo[] = [
  { id: "v1", youtubeId: "kHd8Y6W0z0k", titleBn: "হজ্ব সম্পূর্ণ গাইড — এ থেকে জেড", titleEn: "Complete Hajj Guide A to Z", category: "Hajj", duration: "18:24", views: "125K" },
  { id: "v2", youtubeId: "3JZ_D3ELwOQ", titleBn: "উমরাহ পদক্ষেপসমূহ", titleEn: "Umrah Step by Step", category: "Umrah", duration: "12:10", views: "89K" },
  { id: "v3", youtubeId: "LXb3EKWsInQ", titleBn: "সৌদি ভিসা প্রক্রিয়া", titleEn: "Saudi Visa Processing", category: "Visa", duration: "9:45", views: "67K" },
  { id: "v4", youtubeId: "sB7fMnY4aYI", titleBn: "বিমান টিকিট কেনার টিপস", titleEn: "Air Ticket Buying Tips", category: "Air Ticket", duration: "7:30", views: "42K" },
  { id: "v5", youtubeId: "ScMzIvxBSi4", titleBn: "হজ্ব-উমরাহ প্যাকিং চেকলিস্ট", titleEn: "Hajj & Umrah Packing Checklist", category: "Travel Tips", duration: "6:15", views: "54K" },
  { id: "v6", youtubeId: "eIho2S0ZahI", titleBn: "ইহরাম কিভাবে পরবেন", titleEn: "How to Wear Ihram", category: "Umrah", duration: "8:02", views: "110K" },
];
