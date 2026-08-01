import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Facebook, Instagram, Loader2, AlertCircle } from "lucide-react";
import { BRANCHES } from "../lib/data";
import { cn, SITE_IMAGES } from "../lib/utils";
import { apiFetch } from "../lib/api";
import type { ServiceTypeDto } from "@contracts/booking.contract";
import { PageHero, Breadcrumbs, Btn } from "../website/primitives";

const SERVICE_ENUM: Record<string, ServiceTypeDto> = {
  "Hajj Package": "HAJJ", "Umrah Package": "UMRAH", "Visa Services": "VISA", "Air Ticket": "AIR_TICKET",
  "Manpower": "MANPOWER", "Tour Package": "TOUR", "Hotel Booking": "HOTEL",
};

// Maps each service option (the value kept for the API payload) to its i18n label key.
const SERVICE_LABEL_KEY: Record<string, string> = {
  "Hajj Package": "common:services.hajj",
  "Umrah Package": "common:services.umrah",
  "Visa Services": "common:services.visa",
  "Air Ticket": "common:services.airTicket",
  "Manpower": "common:services.manpower",
  "Tour Package": "common:services.tour",
  "Hotel Booking": "common:services.hotel",
  "Other": "form.serviceOther",
};

export function ContactPage() {
  const { t, i18n } = useTranslation("contact");
  const bn = i18n.language?.startsWith("bn");
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setError(t("form.errorRequired"));
      return;
    }
    setSending(true);
    setError("");
    try {
      await apiFetch<{ ok: boolean }>(
        "/public/contact",
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            email: form.email || undefined,
            serviceInterest: SERVICE_ENUM[form.service],
            message: form.message,
          }),
        },
        { auth: false },
      );
      setSent(true);
    } catch {
      setError(t("form.errorFailed"));
    } finally {
      setSending(false);
    }
  };

  const SERVICES = ["Hajj Package", "Umrah Package", "Visa Services", "Air Ticket", "Manpower", "Tour Package", "Hotel Booking", "Other"];

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} image={SITE_IMAGES.airport} compact>
        <Breadcrumbs items={[
          { label: bn ? "হোম" : "Home", to: "/" },
          { label: bn ? "যোগাযোগ" : "Contact" },
        ]} />
      </PageHero>

      <section className="py-10 md:py-14 bg-[#F7F8FA]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-10">
            <div className="text-[#F15A24] text-[12px] font-bold uppercase tracking-widest mb-2">{t("branches.eyebrow")}</div>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#062D63]" style={{ fontFamily: "var(--font-display)" }}>{t("branches.title")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10 md:mb-14">
            {BRANCHES.map((branch, i) => (
              <div key={branch.city} className={cn(
                "bg-white rounded-3xl border p-5 hover:shadow-md transition-shadow",
                i === 0 ? "border-[#F15A24]" : "border-[#E5E7EB]"
              )}>
                {i === 0 && (
                  <div className="text-[10px] font-black text-[#F15A24] uppercase tracking-widest mb-2">{t("branches.headOffice")}</div>
                )}
                <h3 className="text-[15px] font-semibold text-[#062D63] mb-3">{branch.city}</h3>
                <ul className="flex flex-col gap-2.5">
                  <li className="flex items-start gap-2 text-[12px] text-[#6B7280]">
                    <MapPin size={13} className="text-[#D64A12] flex-shrink-0 mt-0.5" />
                    {branch.address}
                  </li>
                  <li>
                    <a href={`tel:${branch.phone}`} className="flex items-center gap-2 text-[12px] text-[#374151] hover:text-[#1B75BC] transition-colors">
                      <Phone size={13} className="text-[#D64A12]" />{branch.phone}
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${branch.email}`} className="flex items-center gap-2 text-[12px] text-[#374151] hover:text-[#1B75BC] transition-colors">
                      <Mail size={13} className="text-[#D64A12]" />{branch.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <Clock size={13} className="text-[#D64A12]" />{branch.hours}
                  </li>
                </ul>
              </div>
            ))}
          </div>

          {/* Map placeholder */}
          <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] h-[300px] bg-[#E9EEF5] flex items-center justify-center mb-14 shadow-sm">
            <div className="text-center text-[#9CA3AF]">
              <MapPin size={36} className="text-[#1B75BC]/30 mx-auto mb-2" />
              <p className="text-[13px] font-semibold">{t("map.label")}</p>
              <p className="text-[11px]">{t("map.caption")}</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-[#E5E7EB] p-7 shadow-sm">
                <h2 className="text-xl font-semibold text-[#062D63] mb-1" style={{ fontFamily: "var(--font-display)" }}>{t("form.title")}</h2>
                <p className="text-[12px] text-[#9CA3AF] mb-6">{t("form.subtitle")}</p>

                {sent ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={32} className="text-[#0E7C66]" />
                    </div>
                    <h3 className="text-[17px] font-black text-[#111827] mb-2">{t("success.title")}</h3>
                    <p className="text-[13px] text-[#6B7280]">{t("success.text")}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {[
                        { key: "name", label: t("form.fullName"), placeholder: t("form.fullNamePlaceholder"), type: "text" },
                        { key: "email", label: t("form.email"), placeholder: t("form.emailPlaceholder"), type: "email" },
                        { key: "phone", label: t("form.phone"), placeholder: t("form.phonePlaceholder"), type: "tel" },
                      ].map(f => (
                        <div key={f.key} className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">{f.label}</label>
                          <input type={f.type} placeholder={f.placeholder}
                            value={form[f.key as keyof typeof form]}
                            onChange={e => set(f.key as keyof typeof form)(e.target.value)}
                            className="px-3 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 transition-all" />
                        </div>
                      ))}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">{t("form.serviceNeeded")}</label>
                        <select value={form.service} onChange={e => set("service")(e.target.value)}
                          className="px-3 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] outline-none focus:border-[#1B75BC] bg-white cursor-pointer">
                          <option value="">{t("form.selectService")}</option>
                          {SERVICES.map(s => <option key={s} value={s}>{t(SERVICE_LABEL_KEY[s])}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">{t("form.message")}</label>
                      <textarea rows={5} placeholder={t("form.messagePlaceholder")}
                        value={form.message} onChange={e => set("message")(e.target.value)}
                        className="px-3 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 transition-all resize-none" />
                    </div>
                    {error && (
                      <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] p-3">
                        <AlertCircle size={14} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
                        <p className="text-[12px] text-[#B91C1C]">{error}</p>
                      </div>
                    )}
                    <Btn type="submit" disabled={sending} variant="primary">
                      {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {sending ? t("form.sending") : t("form.send")}
                    </Btn>
                  </form>
                )}
              </div>
            </div>

            {/* Quick contact */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#062D63] rounded-3xl p-6 text-white">
                <h3 className="text-[15px] font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>{t("quick.title")}</h3>
                <ul className="flex flex-col gap-4">
                  <li>
                    <div className="text-[10px] text-white/40 uppercase font-bold mb-0.5">{t("quick.hotline")}</div>
                    <a href="tel:+88029553421" className="text-[#C89B3C] font-bold text-[15px] hover:underline">+880 2 9553421</a>
                  </li>
                  <li>
                    <div className="text-[10px] text-white/40 uppercase font-bold mb-0.5">{t("quick.whatsapp")}</div>
                    <a href="https://wa.me/8801712345678" target="_blank" rel="noopener noreferrer"
                      className="text-[#25D366] font-bold hover:underline text-[14px]">+880 1712 345678</a>
                  </li>
                  <li>
                    <div className="text-[10px] text-white/40 uppercase font-bold mb-0.5">{t("quick.email")}</div>
                    <a href="mailto:info@smtravel.com.bd" className="text-white/70 hover:text-white text-[13px]">info@smtravel.com.bd</a>
                  </li>
                  <li>
                    <div className="text-[10px] text-white/40 uppercase font-bold mb-0.5">{t("quick.officeHours")}</div>
                    <div className="text-white/70 text-[12px]">{t("quick.officeDays")}<br />{t("quick.officeTime")}</div>
                  </li>
                </ul>
                <div className="mt-5 pt-5 border-t border-white/10">
                  <div className="text-[11px] text-white/40 mb-2">{t("quick.social")}</div>
                  <div className="flex gap-3">
                    {[Facebook, Instagram].map((Icon, i) => (
                      <a key={i} href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#F15A24] transition-colors">
                        <Icon size={14} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#25D366] rounded-2xl p-5 text-white text-center">
                <div className="text-[14px] font-black mb-1">{t("whatsappCard.title")}</div>
                <div className="text-white/70 text-[12px] mb-4">{t("whatsappCard.text")}</div>
                <a href="https://wa.me/8801712345678?text=Hello%20SMTravel%2C%20I%20need%20assistance." target="_blank" rel="noopener noreferrer"
                  className="block py-2.5 bg-white text-[#25D366] font-black rounded-[10px] text-[13px] hover:bg-[#F0FFF4] transition-colors">
                  {t("whatsappCard.cta")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
