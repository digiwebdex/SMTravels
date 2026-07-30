import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "smtravels_pwa_dismissed";

/** Mobile/desktop install banner when the browser fires beforeinstallprompt. */
export function PwaInstallBanner() {
  const { t } = useTranslation("layout");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-[76px] md:bottom-6 z-[45] px-3 md:px-6 pointer-events-none">
      <div className="pointer-events-auto max-w-lg mx-auto md:ml-auto md:mr-0 bg-[#0A2E4D] text-white rounded-2xl shadow-2xl border border-white/10 p-3.5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src="/icons/icon-192.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">{t("pwa.title")}</p>
          <p className="text-[11px] text-white/65 mt-0.5 leading-snug">{t("pwa.body")}</p>
        </div>
        <button
          type="button"
          onClick={install}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-[#F15A24] hover:bg-[#CC3C17] text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Download size={14} />
          {t("pwa.install")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="flex-shrink-0 p-1.5 text-white/50 hover:text-white transition-colors"
          aria-label={t("pwa.dismiss")}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  // Only register on production builds / https (or localhost)
  const ok =
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (!ok) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[pwa] SW registration failed", err);
    });
  });
}
