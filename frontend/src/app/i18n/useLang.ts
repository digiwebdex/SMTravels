import { useTranslation } from "react-i18next";
import { type Lang, writeLangCookie, applyHtmlLang } from "./lang";

/** Current language + a setter that flips i18next live, persists the cookie,
 *  and updates <html lang>. Use this to wire any language toggle. */
export function useLang(): { lang: Lang; setLang: (l: Lang) => void; toggle: () => void } {
  const { i18n } = useTranslation();
  const lang = (i18n.language === "bn" ? "bn" : "en") as Lang;
  const setLang = (l: Lang) => {
    void i18n.changeLanguage(l);
    writeLangCookie(l);
    applyHtmlLang(l);
  };
  return { lang, setLang, toggle: () => setLang(lang === "bn" ? "en" : "bn") };
}
