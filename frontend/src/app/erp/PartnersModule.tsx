import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Handshake, Users, Wallet, Coins, Search, ChevronLeft, ChevronRight,
  Phone, Mail, Building2, CreditCard, Lock, GitBranch, Save,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  PageHeader, SectionCard, KpiTile, StatusBadge, Btn, TextInput, SelectInput,
  EmptyState, ErrorBanner, SkeletonTable, SkeletonKpi, Avatar, formatAmount, formatDate,
  type StatusKey,
} from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import { usePartners, usePartner, useUpdatePartner, type PartnerFilters, type PartnerListItem, type PartnerDetail } from "../hooks/partners";

// ── small shared bits ─────────────────────────────────────────────────────────
const TIER_CLS: Record<string, string> = {
  SILVER:   "bg-slate-100 text-slate-600 border-slate-200",
  GOLD:     "bg-amber-50 text-amber-700 border-amber-200",
  PLATINUM: "bg-indigo-50 text-indigo-700 border-indigo-200",
};
function TierPill({ tier }: { tier: string }) {
  const { t } = useTranslation("erpPartners");
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", TIER_CLS[tier] ?? TIER_CLS.SILVER)}>
      {t(`tierLabel.${tier}`, tier)}
    </span>
  );
}
// agent status → StatusBadge key (suspended has no dedicated key → warning)
const STATUS_KEY: Record<string, StatusKey> = { active: "active", inactive: "inactive", suspended: "warning" };
function AgentStatus({ status }: { status: string }) {
  const { t } = useTranslation("erpPartners");
  return <StatusBadge status={STATUS_KEY[status] ?? "inactive"} label={t(`statusLabel.${status}`, status)} />;
}

const money = (n: number) => formatAmount(n, "BDT");

// BookingStatus → StatusKey (ON_HOLD has no dedicated status entry)
const BOOKING_STATUS_KEY: Record<string, StatusKey> = {
  DRAFT: "draft", PENDING: "pending", PROCESSING: "processing", CONFIRMED: "confirmed",
  ON_HOLD: "warning", COMPLETED: "completed", CANCELLED: "cancelled",
};

// ─── LIST ──────────────────────────────────────────────────────────────────────
function PartnerList({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useTranslation("erpPartners");
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const filters: PartnerFilters = useMemo(() => ({ q: q.trim() || undefined, tier: tier || undefined, status: status || undefined }), [q, tier, status]);
  const { data, isLoading, isError, refetch } = usePartners(filters);

  const tierOpts = [{ value: "", label: t("filter.tier") }, ...["SILVER", "GOLD", "PLATINUM"].map((v) => ({ value: v, label: t(`tierLabel.${v}`) }))];
  const statusOpts = [{ value: "", label: t("filter.status") }, ...["active", "inactive", "suspended"].map((v) => ({ value: v, label: t(`statusLabel.${v}`) }))];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title={t("title")} subtitle={t("subtitle")} badge={{ label: "B2B", status: "info" }} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading || !data ? (
          <>{Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}</>
        ) : (
          <>
            <KpiTile label={t("kpi.total")} value={data.stats.total} icon={Handshake} accent="#1B75BC" />
            <KpiTile label={t("kpi.active")} value={data.stats.active} icon={Users} accent="#0E7C66" />
            <KpiTile label={t("kpi.wallet")} value={money(data.stats.totalWalletBalance)} icon={Wallet} accent="#F15A24" />
            <KpiTile label={t("kpi.commission")} value={money(data.stats.totalCommission)} icon={Coins} accent="#14588F" />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <div className="[&_input]:pl-9"><TextInput placeholder={t("filter.search")} value={q} onChange={setQ} /></div>
        </div>
        <div className="w-full sm:w-44"><SelectInput value={tier} onChange={setTier} options={tierOpts} /></div>
        <div className="w-full sm:w-44"><SelectInput value={status} onChange={setStatus} options={statusOpts} /></div>
      </div>

      <SectionCard noPad>
        {isError ? (
          <div className="p-5"><ErrorBanner message="Failed to load partners." onRetry={refetch} /></div>
        ) : isLoading || !data ? (
          <div className="p-5"><SkeletonTable rows={6} cols={8} /></div>
        ) : data.data.length === 0 ? (
          <EmptyState variant="no-results" title={t("empty")} desc={t("emptyDesc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3 font-bold">{t("col.partner")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.tier")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.parent")}</th>
                  <th className="px-4 py-3 font-bold text-center">{t("col.subAgents")}</th>
                  <th className="px-4 py-3 font-bold text-center">{t("col.bookings")}</th>
                  <th className="px-4 py-3 font-bold text-right">{t("col.commission")}</th>
                  <th className="px-4 py-3 font-bold text-right">{t("col.wallet")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.status")}</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((p: PartnerListItem) => (
                  <tr key={p.id} onClick={() => onOpen(p.id)}
                    className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{p.agentCode}{p.branchName ? ` · ${p.branchName}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><TierPill tier={p.tier} /></td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.parentName ?? <span className="text-slate-400 italic">{t("topLevel")}</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700">{p.subAgentCount}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700">{p.bookingsCount}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">{money(p.commissionEarned)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{money(p.walletBalance)}</td>
                    <td className="px-4 py-3"><AgentStatus status={p.status} /></td>
                    <td className="px-2 py-3 text-slate-300"><ChevronRight size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── DETAIL ──────────────────────────────────────────────────────────────────
type DetailTab = "bookings" | "commissions" | "wallet";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Icon size={14} className="text-slate-400 flex-shrink-0" />
      <span className="text-[11px] uppercase tracking-wide text-slate-400 w-24 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-700 font-medium truncate">{value}</span>
    </div>
  );
}

function TierStatusEditor({ partner }: { partner: PartnerDetail }) {
  const { t } = useTranslation("erpPartners");
  const { can } = useAuth();
  const canManage = can("partners", "manage");
  const update = useUpdatePartner();
  const [tier, setTier] = useState(partner.tier);
  const [status, setStatus] = useState(partner.status);
  const dirty = tier !== partner.tier || status !== partner.status;

  const tierOpts = ["SILVER", "GOLD", "PLATINUM"].map((v) => ({ value: v, label: t(`tierLabel.${v}`) }));
  const statusOpts = ["active", "inactive", "suspended"].map((v) => ({ value: v, label: t(`statusLabel.${v}`) }));

  const save = () =>
    update.mutate({ id: partner.id, input: { tier: tier as PartnerDetail["tier"] as any, status: status as any } },
      { onSuccess: () => toast.success(t("detail.saved")) });

  return (
    <SectionCard title={t("detail.manage")} subtitle={t("detail.manageNote")}>
      {!canManage ? (
        <div className="flex items-start gap-2.5 text-slate-500">
          <Lock size={15} className="mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-xs">{t("detail.readonlyNote")}</p>
            <div className="flex items-center gap-2"><TierPill tier={partner.tier} /><AgentStatus status={partner.status} /></div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{t("col.tier")}</label>
            <div className="mt-1.5"><SelectInput value={tier} onChange={setTier} options={tierOpts} /></div>
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{t("col.status")}</label>
            <div className="mt-1.5"><SelectInput value={status} onChange={setStatus} options={statusOpts} /></div>
          </div>
          <Btn icon={Save} onClick={save} disabled={!dirty} loading={update.isPending}>{t("detail.save")}</Btn>
        </div>
      )}
    </SectionCard>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return <th className={cn("px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider text-slate-400", `text-${align}`)}>{children}</th>;
}

function PartnerDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const { t } = useTranslation("erpPartners");
  const { data: p, isLoading, isError, refetch } = usePartner(id);
  const [tab, setTab] = useState<DetailTab>("bookings");

  if (isLoading || !p) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"><ChevronLeft size={16} />{t("back")}</button>
        {isError ? <ErrorBanner message="Failed to load partner." onRetry={refetch} /> : <SkeletonTable rows={8} cols={4} />}
      </div>
    );
  }

  const tabs: { key: DetailTab; label: string; count: number }[] = [
    { key: "bookings", label: t("tab.bookings"), count: p.bookings.length },
    { key: "commissions", label: t("tab.commissions"), count: p.commissions.length },
    { key: "wallet", label: t("tab.wallet"), count: p.walletTransactions.length },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"><ChevronLeft size={16} />{t("back")}</button>

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Avatar name={p.name} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-800">{p.name}</h1>
            <TierPill tier={p.tier} />
            <AgentStatus status={p.status} />
          </div>
          <p className="text-sm text-slate-400 font-mono mt-0.5">
            {p.agentCode}{p.branchName ? ` · ${p.branchName}` : ""}
            {p.parentName ? <> · <span className="text-slate-500">{t("col.parent")}: {p.parentName}</span></> : <> · <span className="italic">{t("topLevel")}</span></>}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile label={t("detail.earned")} value={money(p.commissionEarned)} icon={Coins} accent="#0E7C66" />
        <KpiTile label={t("detail.pending")} value={money(p.commissionPending)} icon={Coins} accent="#F15A24" />
        <KpiTile label={t("kpi.wallet")} value={money(p.walletBalance)} sub={`${p.walletCurrency}`} icon={Wallet} accent="#1B75BC" />
        <KpiTile label={t("detail.subCount")} value={p.subAgentCount} sub={`${p.bookingsCount} ${t("tab.bookings").toLowerCase()}`} icon={Users} accent="#14588F" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* left column: manage + downline + contact */}
        <div className="space-y-6">
          <TierStatusEditor partner={p} />

          {/* Downline tree */}
          <SectionCard title={t("detail.downline")} subtitle={t("detail.downlineSub")} noPad>
            {p.subAgents.length === 0 ? (
              <EmptyState variant="no-data" title={t("detail.noDownline")} compact />
            ) : (
              <div className="p-4 space-y-1">
                {/* root */}
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <GitBranch size={14} className="text-[#1B75BC]" /> {p.name} <span className="text-[10px] text-slate-400 font-mono">({p.agentCode})</span>
                </div>
                <div className="ml-2 border-l border-slate-200 pl-4 space-y-2 pt-1">
                  {p.subAgents.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-slate-300">└</span>
                        <Avatar name={s.name} size="xs" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700 font-medium truncate">{s.name} <span className="text-[10px] text-slate-400 font-mono">{s.agentCode}</span></p>
                          <div className="flex items-center gap-1.5 mt-0.5"><TierPill tier={s.tier} /><AgentStatus status={s.status} /></div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-mono font-semibold text-emerald-700">{money(s.commissionEarned)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{money(s.walletBalance)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Contact & bank */}
          <SectionCard title={t("detail.contact")}>
            {[p.phone, p.email, p.tradeLicense, p.bankName, p.accountNo, p.bankBranch, p.bkashNo, p.nagadNo].every((v) => !v) ? (
              <p className="text-xs text-slate-400 italic">{t("detail.noContact")}</p>
            ) : (
              <div className="divide-y divide-slate-50">
                <InfoRow icon={Phone} label={t("field.phone")} value={p.phone} />
                <InfoRow icon={Mail} label={t("field.email")} value={p.email} />
                <InfoRow icon={Building2} label={t("field.tradeLicense")} value={p.tradeLicense} />
                <InfoRow icon={Building2} label={t("field.bank")} value={p.bankName} />
                <InfoRow icon={CreditCard} label={t("field.account")} value={p.accountNo} />
                <InfoRow icon={Building2} label={t("field.bankBranch")} value={p.bankBranch} />
                <InfoRow icon={CreditCard} label={t("field.bkash")} value={p.bkashNo} />
                <InfoRow icon={CreditCard} label={t("field.nagad")} value={p.nagadNo} />
              </div>
            )}
          </SectionCard>
        </div>

        {/* right column: activity tabs */}
        <div className="lg:col-span-2">
          <SectionCard noPad>
            <div className="flex items-center gap-1 px-3 pt-3 border-b border-slate-100">
              {tabs.map((tb) => (
                <button key={tb.key} onClick={() => setTab(tb.key)}
                  className={cn("px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors -mb-px border-b-2",
                    tab === tb.key ? "text-[#1B75BC] border-[#1B75BC]" : "text-slate-500 border-transparent hover:text-slate-700")}>
                  {tb.label} <span className="text-[10px] text-slate-400">({tb.count})</span>
                </button>
              ))}
            </div>

            {tab === "bookings" && <BookingsTab p={p} />}
            {tab === "commissions" && <CommissionsTab p={p} />}
            {tab === "wallet" && <WalletTab p={p} />}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function BookingsTab({ p }: { p: PartnerDetail }) {
  const { t } = useTranslation("erpPartners");
  if (p.bookings.length === 0) return <EmptyState variant="no-data" title={t("detail.noBookings")} compact />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-slate-100">
          <Th>{t("bkCol.no")}</Th><Th>{t("bkCol.service")}</Th><Th>{t("bkCol.status")}</Th>
          <Th align="right">{t("bkCol.amount")}</Th><Th align="right">{t("bkCol.date")}</Th>
        </tr></thead>
        <tbody>
          {p.bookings.map((b) => (
            <tr key={b.id} className="border-b border-slate-50">
              <td className="px-4 py-3 font-mono text-slate-700">{b.bookingNo ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">{b.serviceType}</td>
              <td className="px-4 py-3"><StatusBadge status={BOOKING_STATUS_KEY[b.status] ?? "info"} label={b.status} size="xs" /></td>
              <td className="px-4 py-3 text-right font-mono text-slate-800">{money(b.amount)}</td>
              <td className="px-4 py-3 text-right text-slate-400 text-xs">{formatDate(b.createdAt, "short")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommissionsTab({ p }: { p: PartnerDetail }) {
  const { t } = useTranslation("erpPartners");
  if (p.commissions.length === 0) return <EmptyState variant="no-data" title={t("detail.noCommissions")} compact />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-slate-100">
          <Th>{t("commCol.ref")}</Th><Th align="right">{t("commCol.gross")}</Th><Th align="right">{t("commCol.rate")}</Th>
          <Th align="right">{t("commCol.amount")}</Th><Th>{t("commCol.status")}</Th><Th align="right">{t("commCol.date")}</Th>
        </tr></thead>
        <tbody>
          {p.commissions.map((c) => (
            <tr key={c.id} className="border-b border-slate-50">
              <td className="px-4 py-3">
                <span className="font-mono text-slate-700">{c.bookingNo ?? c.period ?? "—"}</span>
                {c.isOverride && <span className="ml-2 text-[9px] font-bold uppercase text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1 py-px">{t("override")}</span>}
              </td>
              <td className="px-4 py-3 text-right font-mono text-slate-500">{money(c.grossAmount)}</td>
              <td className="px-4 py-3 text-right font-mono text-slate-500">{c.rate}</td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">{money(c.amount)}</td>
              <td className="px-4 py-3"><StatusBadge status={c.status === "PAID" ? "paid" : "pending"} size="xs" /></td>
              <td className="px-4 py-3 text-right text-slate-400 text-xs">{formatDate(c.createdAt, "short")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WalletTab({ p }: { p: PartnerDetail }) {
  const { t } = useTranslation("erpPartners");
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-50/60 border-b border-amber-100 text-amber-800">
        <Lock size={14} className="flex-shrink-0" />
        <p className="text-[11px] leading-snug">{t("detail.walletNote")}</p>
      </div>
      {p.walletTransactions.length === 0 ? (
        <EmptyState variant="no-data" title={t("detail.noWallet")} compact />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <Th align="right">{t("wtCol.date")}</Th><Th>{t("wtCol.type")}</Th><Th>{t("wtCol.desc")}</Th>
              <Th align="right">{t("wtCol.amount")}</Th><Th>{t("wtCol.method")}</Th><Th>{t("wtCol.ref")}</Th>
            </tr></thead>
            <tbody>
              {p.walletTransactions.map((w) => (
                <tr key={w.id} className={cn("border-b border-slate-50", w.isReversed && "opacity-50")}>
                  <td className="px-4 py-3 text-right text-slate-400 text-xs whitespace-nowrap">{formatDate(w.postedAt, "short")}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={w.type === "CREDIT" ? "success" : "error"} label={w.type === "CREDIT" ? t("credit") : t("debit")} size="xs" />
                    {w.isReversed && <span className="ml-1.5 text-[9px] font-bold uppercase text-slate-400 line-through">{t("reversed")}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate">{w.description ?? "—"}</td>
                  <td className={cn("px-4 py-3 text-right font-mono font-semibold", w.type === "CREDIT" ? "text-emerald-700" : "text-red-600")}>
                    {w.type === "CREDIT" ? "+" : "−"}{money(w.amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{w.method ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{w.reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── entry ───────────────────────────────────────────────────────────────────
export function PartnersModule() {
  const [selected, setSelected] = useState<string | null>(null);
  return selected
    ? <PartnerDetailView id={selected} onBack={() => setSelected(null)} />
    : <PartnerList onOpen={setSelected} />;
}

export default PartnersModule;
