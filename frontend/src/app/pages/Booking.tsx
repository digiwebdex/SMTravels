import React, { useState } from "react";
import { Link } from "react-router";
import { useTranslation, Trans } from "react-i18next";
import { CheckCircle, ArrowRight, ArrowLeft, Star, MapPin, Shield, Plane, Briefcase, Hotel, Globe, Phone, User, Mail, Calendar, Users, Loader2, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { apiFetch } from "../lib/api";
import type { ServiceTypeDto } from "@contracts/booking.contract";

const SERVICES: { id: string; enum: ServiceTypeDto; icon: React.ElementType; label: string; color: string; desc: string }[] = [
  { id: "hajj", enum: "HAJJ", icon: Star, label: "Hajj Package", color: "#F15A24", desc: "Govt-approved pilgrimage packages" },
  { id: "umrah", enum: "UMRAH", icon: MapPin, label: "Umrah Package", color: "#1B75BC", desc: "Year-round Umrah services" },
  { id: "visa", enum: "VISA", icon: Shield, label: "Visa Services", color: "#0E7C66", desc: "50+ countries worldwide" },
  { id: "air-ticket", enum: "AIR_TICKET", icon: Plane, label: "Air Ticket", color: "#2563EB", desc: "Best airfare guaranteed" },
  { id: "manpower", enum: "MANPOWER", icon: Briefcase, label: "Manpower", color: "#7C3AED", desc: "International recruitment" },
  { id: "tour", enum: "TOUR", icon: Globe, label: "Tour Package", color: "#EA580C", desc: "Curated world tours" },
  { id: "hotel", enum: "HOTEL", icon: Hotel, label: "Hotel Booking", color: "#0891B2", desc: "Global accommodations" },
];

// i18n keys per service id — label reuses common:services.*, desc lives in booking ns.
const SERVICE_I18N: Record<string, { labelKey: string; descKey: string }> = {
  "hajj": { labelKey: "common:services.hajj", descKey: "services.hajj.desc" },
  "umrah": { labelKey: "common:services.umrah", descKey: "services.umrah.desc" },
  "visa": { labelKey: "common:services.visa", descKey: "services.visa.desc" },
  "air-ticket": { labelKey: "common:services.airTicket", descKey: "services.airTicket.desc" },
  "manpower": { labelKey: "common:services.manpower", descKey: "services.manpower.desc" },
  "tour": { labelKey: "common:services.tour", descKey: "services.tour.desc" },
  "hotel": { labelKey: "common:services.hotel", descKey: "services.hotel.desc" },
};

// Stable step ids; visible labels come from booking:steps.*
const STEP_KEYS = ["service", "tripDetails", "travelers", "confirm"];

function StepIndicator({ current }: { current: number }) {
  const { t } = useTranslation("booking");
  return (
    <div className="flex items-center justify-center mb-10">
      {STEP_KEYS.map((stepKey, i) => (
        <React.Fragment key={stepKey}>
          <div className="flex flex-col items-center">
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black transition-all",
              i < current ? "bg-[#0E7C66] text-white"
                : i === current ? "bg-[#1B75BC] text-white shadow-lg"
                  : "bg-[#E5E7EB] text-[#9CA3AF]"
            )}>
              {i < current ? <CheckCircle size={16} /> : i + 1}
            </div>
            <div className={cn("text-[10px] font-bold mt-1 hidden sm:block",
              i === current ? "text-[#1B75BC]" : i < current ? "text-[#0E7C66]" : "text-[#9CA3AF]"
            )}>
              {t(`steps.${stepKey}`)}
            </div>
          </div>
          {i < STEP_KEYS.length - 1 && (
            <div className={cn("flex-1 h-[2px] mx-2 transition-all", i < current ? "bg-[#0E7C66]" : "bg-[#E5E7EB]")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function BookingPage() {
  const { t } = useTranslation("booking");
  const svcLabel = (s?: (typeof SERVICES)[number]) => (s ? t(SERVICE_I18N[s.id].labelKey) : "");
  const [step, setStep] = useState(0);
  const [service, setService] = useState("");
  const [trip, setTrip] = useState({ from: "", to: "", depart: "", returnDate: "", pax: "2", notes: "" });
  const [traveler, setTraveler] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const setT = (k: keyof typeof trip) => (v: string) => setTrip(f => ({ ...f, [k]: v }));
  const setTr = (k: keyof typeof traveler) => (v: string) => setTraveler(f => ({ ...f, [k]: v }));

  const selectedService = SERVICES.find(s => s.id === service);

  const submit = async () => {
    if (submitting) return;
    if (!traveler.name.trim() || !traveler.phone.trim()) {
      setSubmitError(t("errors.leadRequired"));
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await apiFetch<{ ok: boolean }>(
        "/public/booking-request",
        {
          method: "POST",
          body: JSON.stringify({
            name: traveler.name,
            phone: traveler.phone,
            email: traveler.email || undefined,
            serviceInterest: selectedService?.enum ?? "TOUR",
            travelers: parseInt(trip.pax, 10) || 1,
            travelingFrom: trip.from || undefined,
            destination: trip.to || undefined,
            departDate: trip.depart || undefined,
            returnDate: trip.returnDate || undefined,
            notes: trip.notes || undefined,
          }),
        },
        { auth: false },
      );
      setSubmitted(true);
    } catch {
      setSubmitError(t("errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F7F8FA]">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#0E7C66]" />
          </div>
          <h2 className="text-2xl font-black text-[#111827] mb-3">{t("success.title")}</h2>
          <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
            <Trans
              t={t}
              i18nKey="success.thanks"
              values={{
                name: traveler.name || t("success.fallbackName"),
                service: svcLabel(selectedService) || t("success.fallbackService"),
              }}
              components={{ b: <strong /> }}
            />
          </p>
          <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 mb-6 text-left text-[12px] text-[#374151]">
            <div className="flex justify-between mb-2"><span className="text-[#9CA3AF]">{t("summary.service")}</span><span className="font-bold">{svcLabel(selectedService)}</span></div>
            <div className="flex justify-between mb-2"><span className="text-[#9CA3AF]">{t("summary.travelers")}</span><span className="font-bold">{trip.pax} {t("summary.persons")}</span></div>
            <div className="flex justify-between"><span className="text-[#9CA3AF]">{t("summary.contact")}</span><span className="font-bold">{traveler.phone || traveler.email}</span></div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="px-5 py-2.5 bg-[#1B75BC] text-white font-bold rounded-[10px] text-sm hover:bg-[#14588F] transition-colors">
              {t("success.backHome")}
            </Link>
            <a href="https://wa.me/8801712345678" target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 bg-[#25D366] text-white font-bold rounded-[10px] text-sm hover:bg-[#1da855] transition-colors">
              {t("common:actions.whatsapp")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden min-h-[36vh] flex items-center">
        <img src="/hero-makkah-poster.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041E42]/95 via-[#062D63]/80 to-[#062D63]/50" />
        <div className="relative max-w-[1240px] w-full mx-auto px-4 md:px-5 py-16 text-center md:text-left">
          <div className="text-[#C89B3C] text-[12px] font-bold uppercase tracking-widest mb-2">{t("hero.eyebrow")}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{t("hero.title")}</h1>
          <p className="text-white/70 text-sm max-w-xl">{t("hero.subtitle")}</p>
        </div>
      </section>

      <section className="py-12 bg-[#F7F8FA] min-h-[70vh]">
        <div className="max-w-[700px] mx-auto px-4 md:px-5">
          <StepIndicator current={step} />

          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-5 md:p-7">

            {/* Step 0: Select Service */}
            {step === 0 && (
              <div>
                <h2 className="text-[17px] font-black text-[#111827] mb-1">{t("step0.title")}</h2>
                <p className="text-[12px] text-[#9CA3AF] mb-5">{t("step0.subtitle")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {SERVICES.map(s => (
                    <button key={s.id} onClick={() => setService(s.id)}
                      className={cn(
                        "p-4 rounded-[12px] border-2 text-left transition-all cursor-pointer",
                        service === s.id ? "border-[#1B75BC] bg-[#1B75BC]/5 shadow" : "border-[#E5E7EB] hover:border-[#1B75BC]/30"
                      )}>
                      <s.icon size={20} className="mb-2" style={{ color: s.color }} />
                      <div className="text-[12px] font-bold text-[#111827]">{t(SERVICE_I18N[s.id].labelKey)}</div>
                      <div className="text-[10px] text-[#9CA3AF] mt-0.5">{t(SERVICE_I18N[s.id].descKey)}</div>
                      {service === s.id && <CheckCircle size={14} className="text-[#1B75BC] mt-2" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Trip Details */}
            {step === 1 && (
              <div>
                <h2 className="text-[17px] font-black text-[#111827] mb-1">{t("step1.title")}</h2>
                <p className="text-[12px] text-[#9CA3AF] mb-5">{t("step1.subtitle")}</p>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { k: "from", label: t("step1.fromLabel"), placeholder: t("step1.fromPlaceholder"), icon: MapPin },
                      { k: "to", label: t("step1.toLabel"), placeholder: t("step1.toPlaceholder"), icon: MapPin },
                      { k: "depart", label: t("step1.departLabel"), placeholder: "", icon: Calendar, type: "date" },
                      { k: "returnDate", label: t("step1.returnLabel"), placeholder: "", icon: Calendar, type: "date" },
                    ].map(f => (
                      <div key={f.k} className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">{f.label}</label>
                        <input type={f.type || "text"} placeholder={f.placeholder}
                          value={trip[f.k as keyof typeof trip]}
                          onChange={e => setT(f.k as keyof typeof trip)(e.target.value)}
                          className="px-3 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 transition-all" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">{t("step1.travelersLabel")}</label>
                    <select value={trip.pax} onChange={e => setT("pax")(e.target.value)}
                      className="px-3 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] outline-none focus:border-[#1B75BC] bg-white cursor-pointer">
                      {["1","2","3","4","5","6","7","8","9","10+"].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">{t("step1.notesLabel")}</label>
                    <textarea rows={3} placeholder={t("step1.notesPlaceholder")}
                      value={trip.notes} onChange={e => setT("notes")(e.target.value)}
                      className="px-3 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] outline-none focus:border-[#1B75BC] resize-none transition-all" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Traveler Info */}
            {step === 2 && (
              <div>
                <h2 className="text-[17px] font-black text-[#111827] mb-1">{t("step2.title")}</h2>
                <p className="text-[12px] text-[#9CA3AF] mb-5">{t("step2.subtitle")}</p>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { k: "name", label: t("step2.nameLabel"), placeholder: t("step2.namePlaceholder"), icon: User },
                      { k: "phone", label: t("step2.phoneLabel"), placeholder: t("step2.phonePlaceholder"), icon: Phone, type: "tel" },
                      { k: "email", label: t("step2.emailLabel"), placeholder: t("step2.emailPlaceholder"), icon: Mail, type: "email" },
                    ].map(f => (
                      <div key={f.k} className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">{f.label}</label>
                        <input type={f.type || "text"} placeholder={f.placeholder}
                          value={traveler[f.k as keyof typeof traveler]}
                          onChange={e => setTr(f.k as keyof typeof traveler)(e.target.value)}
                          className="px-3 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 transition-all" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {t("step2.passportNote")}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {step === 3 && (
              <div>
                <h2 className="text-[17px] font-black text-[#111827] mb-1">{t("step3.title")}</h2>
                <p className="text-[12px] text-[#9CA3AF] mb-5">{t("step3.subtitle")}</p>
                <div className="flex flex-col gap-3 mb-5">
                  {[
                    { label: t("summary.service"), value: svcLabel(selectedService) || "—" },
                    { label: t("summary.from"), value: trip.from || "—" },
                    { label: t("summary.destination"), value: trip.to || "—" },
                    { label: t("summary.departure"), value: trip.depart || "—" },
                    { label: t("summary.return"), value: trip.returnDate || "—" },
                    { label: t("summary.travelers"), value: `${trip.pax} ${t("summary.persons")}` },
                    { label: t("summary.leadTraveler"), value: traveler.name || "—" },
                    { label: t("summary.contact"), value: traveler.phone || traveler.email || "—" },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] text-[13px]">
                      <span className="text-[#9CA3AF] font-medium">{r.label}</span>
                      <span className="text-[#111827] font-semibold text-right">{r.value}</span>
                    </div>
                  ))}
                </div>
                {trip.notes && (
                  <div className="bg-[#F7F8FA] rounded-[10px] p-3 text-[12px] text-[#6B7280] mb-4">
                    <span className="font-bold text-[#374151]">{t("summary.notesLabel")}</span>{trip.notes}
                  </div>
                )}
                <p className="text-[11px] text-[#9CA3AF]">
                  {t("step3.agree")}
                </p>
                {submitError && (
                  <div className="mt-4 flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] p-3">
                    <AlertCircle size={14} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#B91C1C]">{submitError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-7 pt-5 border-t border-[#F3F4F6]">
              {step > 0 ? (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#E5E7EB] text-[#374151] font-bold rounded-[10px] text-[13px] hover:border-[#1B75BC]/30 transition-all cursor-pointer">
                  <ArrowLeft size={14} /> {t("common:actions.back")}
                </button>
              ) : <div />}

              {step < 3 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 0 && !service}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 font-bold rounded-[10px] text-[13px] transition-all cursor-pointer",
                    step === 0 && !service
                      ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
                      : "bg-[#1B75BC] hover:bg-[#14588F] text-white"
                  )}>
                  {t("nav.nextStep")} <ArrowRight size={14} />
                </button>
              ) : (
                <button onClick={() => void submit()} disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#0E7C66] hover:bg-[#0a6354] text-white font-bold rounded-[10px] text-[13px] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {submitting ? t("nav.submitting") : t("nav.submitBooking")}
                </button>
              )}
            </div>
          </div>

          {/* Help */}
          <div className="mt-5 text-center text-[12px] text-[#9CA3AF]">
            {t("common:misc.needHelp")} <a href="https://wa.me/8801712345678" target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-bold hover:underline">{t("help.chatWhatsapp")}</a> {t("common:misc.orCall")} <a href="tel:+88029553421" className="text-[#1B75BC] font-bold hover:underline">+880 2 9553421</a>
          </div>
        </div>
      </section>
    </>
  );
}
