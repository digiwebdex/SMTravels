import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { PageHeader, EmptyState } from "../lib/ds";

/**
 * Reusable "Coming soon" placeholder for a nav section that has a home + RBAC
 * module but no functionality yet (Step 3 of the sidebar reorg). One component,
 * one erpNav key per route — no per-section files.
 */
export function ComingSoon({ k, group }: { k: string; group?: string }) {
  const { t } = useTranslation("erpNav");
  const name = t(`item.${k}`);
  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title={name}
        subtitle={group ? t(`group.${group}`) : undefined}
        badge={{ label: t("coming.badge"), status: "warning" }}
      />
      <div className="bg-white rounded-xl border border-slate-200">
        <EmptyState variant="coming-soon" title={t("coming.title")} desc={t("coming.desc", { name })} />
        <div className="flex items-center justify-center gap-2 pb-8 text-[12px] text-slate-400">
          <Sparkles size={13} className="text-[#E8471F]" /> {t("coming.note")}
        </div>
      </div>
    </div>
  );
}
