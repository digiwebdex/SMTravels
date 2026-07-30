/** Shared public contact CTAs — keep in sync across hero, layout, pages. */
export const CONTACT = {
  phoneDisplay: "+880 2 9553421",
  phoneTel: "+88029553421",
  whatsappE164: "8801712345678",
  whatsappText: "Hello SMTravel",
} as const;

export function whatsappUrl(text = CONTACT.whatsappText): string {
  return `https://wa.me/${CONTACT.whatsappE164}?text=${encodeURIComponent(text)}`;
}

export function telUrl(): string {
  return `tel:${CONTACT.phoneTel}`;
}
