import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Phone, Calendar, MessageCircle, X } from "lucide-react";
import { CONTACT, telUrl, whatsappUrl } from "../lib/contact";
import {
  resolveSmartCta,
  SMART_CTA_DISMISS_KEY,
  SMART_CTA_OFFER_COOLDOWN_MS,
} from "../lib/smartCta";

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.524 5.847L0 24l6.335-1.501A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.032-1.387l-.36-.214-3.754.888.938-3.658-.235-.374A9.818 9.818 0 012.182 12c0-5.413 4.405-9.818 9.818-9.818 5.413 0 9.818 4.405 9.818 9.818 0 5.413-4.405 9.818-9.818 9.818z" />
    </svg>
  );
}

function isOfferDismissed(): boolean {
  try {
    const raw = localStorage.getItem(SMART_CTA_DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true;
    return Date.now() - ts < SMART_CTA_OFFER_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function dismissOffer() {
  try {
    localStorage.setItem(SMART_CTA_DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** Desktop floating WhatsApp — page-aware message. */
function WhatsAppFloat({ waHref }: { waHref: string }) {
  const { t } = useTranslation("layout");
  const [tip, setTip] = useState(false);
  return (
    <div className="hidden md:flex fixed bottom-6 right-5 z-40 flex-col items-end gap-2">
      {tip && (
        <div className="bg-white rounded-xl shadow-xl border border-[#E5E7EB] px-3 py-2 text-[12px] font-medium text-[#374151] whitespace-nowrap">
          {t("whatsapp.tooltip")}
        </div>
      )}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        aria-label={t("aria.whatsapp")}
      >
        <WhatsAppIcon size={26} />
      </a>
    </div>
  );
}

/** Mobile sticky Call / WhatsApp / Book — labels adapt to route. */
function MobileStickyBar({
  bookTo,
  waHref,
  hideBook,
  bookLabel,
}: {
  bookTo: string;
  waHref: string;
  hideBook?: boolean;
  bookLabel: string;
}) {
  const { t } = useTranslation("layout");
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,45,98,0.08)]"
      aria-label={t("smartCta.aria")}
    >
      <div className="flex gap-2 max-w-lg mx-auto">
        <a
          href={telUrl()}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl border border-[#002D62]/15 bg-[#EEF3F8] text-[#002D62] font-bold text-[11px] hover:bg-[#002D62]/5 transition-colors"
          aria-label={t("smartCta.callAria", { phone: CONTACT.phoneDisplay })}
        >
          <Phone size={18} className="text-[#002D62]" />
          {t("smartCta.call")}
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-[1.15] flex flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl bg-[#25D366] text-white font-bold text-[11px] hover:bg-[#1da855] transition-colors shadow-sm"
          aria-label={t("aria.whatsapp")}
        >
          <WhatsAppIcon size={18} />
          {t("whatsapp.label")}
        </a>
        {!hideBook && (
          <Link
            to={bookTo}
            className="flex-[1.15] flex flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl bg-[#F37021] text-white font-bold text-[11px] hover:bg-[#d96218] transition-colors shadow-sm"
          >
            <Calendar size={18} />
            {bookLabel}
          </Link>
        )}
      </div>
    </nav>
  );
}

/**
 * Soft offer card — exit-intent (desktop) or 55% scroll depth.
 * Context headline + WhatsApp / Book actions.
 */
function SmartOfferCard({
  title,
  body,
  bookTo,
  waHref,
  bookLabel,
  hideBook,
  onDismiss,
}: {
  title: string;
  body: string;
  bookTo: string;
  waHref: string;
  bookLabel: string;
  hideBook?: boolean;
  onDismiss: () => void;
}) {
  const { t } = useTranslation("layout");
  return (
    <div className="fixed inset-x-0 bottom-[84px] md:bottom-24 z-[42] px-3 md:px-6 pointer-events-none">
      <div
        className="pointer-events-auto max-w-md mx-auto md:ml-auto md:mr-5 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-4 flex gap-3 animate-[fadeUp_0.35s_ease-out]"
        role="dialog"
        aria-label={title}
      >
        <div className="w-10 h-10 rounded-xl bg-[#002D62] text-white flex items-center justify-center flex-shrink-0">
          <MessageCircle size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#002D62] leading-tight">{title}</p>
          <p className="text-[12px] text-[#6B7280] mt-1 leading-snug">{body}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-bold"
            >
              <WhatsAppIcon size={14} />
              {t("whatsapp.label")}
            </a>
            {!hideBook && (
              <Link
                to={bookTo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F37021] text-white text-xs font-bold"
                onClick={onDismiss}
              >
                <Calendar size={14} />
                {bookLabel}
              </Link>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 p-1 text-[#9CA3AF] hover:text-[#002D62] transition-colors"
          aria-label={t("smartCta.dismiss")}
        >
          <X size={16} />
        </button>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/** Mounted once in marketing Layout — sticky bar + float + smart offer. */
export function SmartCtaSystem() {
  const location = useLocation();
  const { t, i18n } = useTranslation("layout");
  const bn = i18n.language?.startsWith("bn");
  const ctx = useMemo(() => resolveSmartCta(location.pathname), [location.pathname]);

  const waText = bn ? ctx.waTextBn : ctx.waTextEn;
  const waHref = whatsappUrl(waText);
  const bookLabel = t(`smartCta.contexts.${ctx.contextKey}.book`, {
    defaultValue: t("smartCta.contexts.default.book"),
  });
  const offerTitle = t(`smartCta.contexts.${ctx.contextKey}.title`, {
    defaultValue: t("smartCta.contexts.default.title"),
  });
  const offerBody = t(`smartCta.contexts.${ctx.contextKey}.body`, {
    defaultValue: t("smartCta.contexts.default.body"),
  });

  const [offerOpen, setOfferOpen] = useState(false);

  useEffect(() => {
    setOfferOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isOfferDismissed()) return;
    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 12_000);

    const onScroll = () => {
      if (!armed || isOfferDismissed()) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      if (window.scrollY / max >= 0.55) {
        setOfferOpen(true);
        window.removeEventListener("scroll", onScroll);
      }
    };

    const onExit = (e: MouseEvent) => {
      if (!armed || isOfferDismissed()) return;
      if (e.clientY <= 8) {
        setOfferOpen(true);
        document.removeEventListener("mouseout", onExit);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", onExit);
    return () => {
      window.clearTimeout(armTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onExit);
    };
  }, [location.pathname]);

  const closeOffer = () => {
    dismissOffer();
    setOfferOpen(false);
  };

  return (
    <>
      <WhatsAppFloat waHref={waHref} />
      <MobileStickyBar
        bookTo={ctx.bookTo}
        waHref={waHref}
        hideBook={ctx.hideBook}
        bookLabel={bookLabel}
      />
      {offerOpen && (
        <SmartOfferCard
          title={offerTitle}
          body={offerBody}
          bookTo={ctx.bookTo}
          waHref={waHref}
          bookLabel={bookLabel}
          hideBook={ctx.hideBook}
          onDismiss={closeOffer}
        />
      )}
    </>
  );
}
