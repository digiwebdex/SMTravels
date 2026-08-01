import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const img = (id: string, w = 1280, h = 720) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=85`;

/** Resolve CMS/API image fields: full URL, /uploads path, or Unsplash photo id. */
export function mediaUrl(src: string | null | undefined, w = 1280, h = 720): string {
  if (!src) return img("photo-1564769625905-50e93615e769", w, h);
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) return src;
  if (src.startsWith("/")) return src;
  if (src.startsWith("photo-") || src.startsWith("photo_")) return img(src, w, h);
  return src;
}

export const fmtPrice = (n: number) =>
  "৳ " + n.toLocaleString("en-BD");

/** Curated premium Unsplash photo ids for Website V2. */
export const SITE_IMAGES = {
  kaaba: "photo-1564769625905-50e93615e769",
  kaabaNight: "photo-1591604129939-f1efa4d9f7fa",
  madinah: "photo-1591604129939-f1efa4d9f7fa",
  pilgrims: "photo-1519817650395-5d7d17a4a4c5",
  airplane: "photo-1436491865332-7a61a109cc05",
  passport: "photo-1540962351504-03099e0a754b",
  hotel: "photo-1566073771259-6a8506099945",
  family: "photo-1469854523086-cc02fe5d8800",
  airport: "photo-1436491865332-7a61a109cc05",
  visa: "photo-1454165804606-c3d57bc86b40",
} as const;
