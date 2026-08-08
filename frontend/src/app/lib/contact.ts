/** Shared public contact CTAs — keep in sync across hero, layout, smart CTA. */
export const CONTACT = {
  phoneDisplay: "+880 1211 190 022",
  phoneTel: "+8801211190022",
  whatsappE164: "8801712345678",
  whatsappText: "Assalamu Alaikum SM Travels",
} as const;

export function whatsappUrl(text = CONTACT.whatsappText): string {
  return `https://wa.me/${CONTACT.whatsappE164}?text=${encodeURIComponent(text)}`;
}

export function telUrl(): string {
  return `tel:${CONTACT.phoneTel}`;
}
