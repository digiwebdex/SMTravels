import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const img = (id: string, w = 1280, h = 720) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=85`;

export const fmtPrice = (n: number) =>
  "৳ " + n.toLocaleString("en-BD");
