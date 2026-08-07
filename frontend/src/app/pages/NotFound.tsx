import React from "react";
import { useTranslation } from "react-i18next";
import { Home, MessageCircle } from "lucide-react";
import { PageHero, Section, Btn } from "../website/primitives";

export function NotFoundPage() {
  const { t } = useTranslation("errors");

  return (
    <div>
      <PageHero
        eyebrow="404"
        title={t("notFound.title")}
        subtitle={t("notFound.message")}
        image="/hero-makkah-poster.jpg"
        compact
      />
      <Section>
        <div className="text-center max-w-md mx-auto">
          <p className="text-7xl font-semibold text-[#1B75BC]/20 mb-6" style={{ fontFamily: "var(--font-display)" }}>404</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Btn to="/"><Home size={15} />{t("notFound.backHome")}</Btn>
            <Btn to="/contact" variant="outline"><MessageCircle size={15} />{t("notFound.contactSupport")}</Btn>
          </div>
        </div>
      </Section>
    </div>
  );
}
