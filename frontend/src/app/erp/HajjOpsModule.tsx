import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users, CalendarClock, IdCard, AlertTriangle, Search } from "lucide-react";
import { cn } from "../lib/utils";
import {
  PageHeader, SectionCard, EmptyState, ErrorBanner, SkeletonTable, Btn,
  TextInput, SelectInput, FormField, ProgressBar, formatDate,
} from "../lib/ds";
import {
  useQuotas, useBatches, useRegistrations, usePassportAlerts,
  useCreateQuota, useCreateBatch, useCreateRegistration,
} from "../hooks/hajjops";
import { useMuallimOptions } from "../hooks/operations";

type Tab = "quota" | "batches" | "registrations" | "alerts";
const TABS: { key: Tab; icon: React.ElementType }[] = [
  { key: "quota", icon: Users },
  { key: "batches", icon: CalendarClock },
  { key: "registrations", icon: IdCard },
  { key: "alerts", icon: AlertTriangle },
];

/** Option lists whose labels come from the shared erpCommon namespace. */
function useServiceOpts() {
  const { t } = useTranslation("erpCommon");
  return [
    { value: "HAJJ", label: t("service.HAJJ") },
    { value: "UMRAH", label: t("service.UMRAH") },
  ];
}
function useQuotaTypeOpts() {
  const { t } = useTranslation("erpCommon");
  return [
    { value: "GOVT", label: t("quotaType.GOVT") },
    { value: "PRIVATE", label: t("quotaType.PRIVATE") },
  ];
}

type Tone = "green" | "amber" | "red" | "slate" | "blue";
function Badge({ text, tone }: { text: string; tone: Tone }) {
  const map = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  }[tone];
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", map)}>{text}</span>;
}
const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{children}</th>
);
const Td = ({ children, mono }: { children: React.ReactNode; mono?: boolean }) => (
  <td className={cn("px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap", mono && "font-mono")}>{children}</td>
);

// ── Quota tab ─────────────────────────────────────────────────────────────────
function QuotaTab() {
  const { t } = useTranslation("erpHajjOps");
  const serviceOpts = useServiceOpts();
  const quotaTypeOpts = useQuotaTypeOpts();
  const q = useQuotas();
  const create = useCreateQuota();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ serviceType: "HAJJ", season: "", label: "", quotaType: "GOVT", allotted: "" });
  const submit = () => {
    if (!f.season || !f.label || !f.allotted) return;
    create.mutate(
      { serviceType: f.serviceType as "HAJJ", season: f.season, label: f.label, quotaType: f.quotaType as "GOVT", allotted: Number(f.allotted) },
      { onSuccess: () => { setOpen(false); setF({ serviceType: "HAJJ", season: "", label: "", quotaType: "GOVT", allotted: "" }); } },
    );
  };
  return (
    <SectionCard title={t("quota.title")} subtitle={t("quota.subtitle")} noPad
      actions={<Btn size="sm" icon={Plus} onClick={() => setOpen((v) => !v)}>{t("quota.new")}</Btn>}>
      {open && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-50 border-b border-slate-100">
          <FormField label={t("erpCommon:field.service")}><SelectInput value={f.serviceType} onChange={(v) => setF({ ...f, serviceType: v })} options={serviceOpts} /></FormField>
          <FormField label={t("erpCommon:field.season")} required><TextInput placeholder={t("quota.form.seasonPh")} value={f.season} onChange={(v) => setF({ ...f, season: v })} /></FormField>
          <FormField label={t("quota.form.label")} required><TextInput placeholder={t("quota.form.labelPh")} value={f.label} onChange={(v) => setF({ ...f, label: v })} /></FormField>
          <FormField label={t("erpCommon:field.type")}><SelectInput value={f.quotaType} onChange={(v) => setF({ ...f, quotaType: v })} options={quotaTypeOpts} /></FormField>
          <FormField label={t("quota.form.allotted")} required><div className="flex gap-2"><TextInput type="number" placeholder={t("quota.form.allottedPh")} value={f.allotted} onChange={(v) => setF({ ...f, allotted: v })} /><Btn size="sm" loading={create.isPending} onClick={submit}>{t("erpCommon:action.add")}</Btn></div></FormField>
        </div>
      )}
      {q.isError ? <div className="p-4"><ErrorBanner message={t("quota.error")} onRetry={() => q.refetch()} /></div>
        : q.isLoading ? <SkeletonTable rows={4} cols={6} />
        : (q.data ?? []).length === 0 ? <EmptyState variant="no-data" title={t("quota.empty.title")} desc={t("quota.empty.desc")} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>{t("quota.col.label")}</Th><Th>{t("erpCommon:field.service")}</Th><Th>{t("erpCommon:field.season")}</Th><Th>{t("erpCommon:field.type")}</Th><Th>{t("quota.col.allotted")}</Th><Th>{t("quota.col.filled")}</Th><Th>{t("quota.col.remaining")}</Th><Th>{t("quota.col.utilisation")}</Th></tr></thead>
              <tbody>
                {(q.data ?? []).map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td>{row.label}{row.branchName ? "" : ` · ${t("quota.companyWide")}`}</Td>
                    <Td>{t(`erpCommon:service.${row.serviceType}`)}</Td>
                    <Td mono>{row.season}</Td>
                    <Td><Badge text={t(`erpCommon:quotaType.${row.quotaType}_short`)} tone="blue" /></Td>
                    <Td mono>{row.allotted.toLocaleString()}</Td>
                    <Td mono>{row.filled.toLocaleString()}</Td>
                    <Td mono>{row.remaining.toLocaleString()}</Td>
                    <td className="px-4 py-3 w-40"><ProgressBar value={row.filled} max={row.allotted || 1} showLabel color={row.remaining === 0 ? "#DC2626" : "#1B75BC"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </SectionCard>
  );
}

// ── Batches tab ───────────────────────────────────────────────────────────────
function BatchesTab() {
  const { t } = useTranslation("erpHajjOps");
  const serviceOpts = useServiceOpts();
  const q = useBatches();
  const create = useCreateBatch();
  const { data: muallims } = useMuallimOptions();
  const [open, setOpen] = useState(false);
  const empty = { serviceType: "HAJJ", name: "", season: "", totalSeats: "", muallimId: "", muallimName: "", maktab: "", departureDate: "" };
  const [f, setF] = useState(empty);
  const muallimOpts = [{ value: "", label: t("batchPicker.none", { ns: "erpOperations", defaultValue: "— Free-text / none —" }) },
    ...(muallims ?? []).map((m) => ({ value: m.id, label: `${m.name} (${m.memberCode})` }))];
  const submit = () => {
    if (!f.name || !f.totalSeats) return;
    create.mutate(
      { serviceType: f.serviceType as "HAJJ", name: f.name, season: f.season || undefined, totalSeats: Number(f.totalSeats), muallimId: f.muallimId || undefined, muallimName: f.muallimName || undefined, maktab: f.maktab || undefined, departureDate: f.departureDate || undefined },
      { onSuccess: () => { setOpen(false); setF(empty); } },
    );
  };
  const statusTone = (s: string): Tone => (s === "OPEN" ? "green" : s === "DEPARTED" ? "blue" : s === "CANCELLED" ? "red" : "slate");
  return (
    <SectionCard title={t("batches.title")} subtitle={t("batches.subtitle")} noPad
      actions={<Btn size="sm" icon={Plus} onClick={() => setOpen((v) => !v)}>{t("batches.new")}</Btn>}>
      {open && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-100">
          <FormField label={t("erpCommon:field.service")}><SelectInput value={f.serviceType} onChange={(v) => setF({ ...f, serviceType: v })} options={serviceOpts} /></FormField>
          <FormField label={t("batches.form.name")} required><TextInput placeholder={t("batches.form.namePh")} value={f.name} onChange={(v) => setF({ ...f, name: v })} /></FormField>
          <FormField label={t("erpCommon:field.season")}><TextInput placeholder={t("batches.form.seasonPh")} value={f.season} onChange={(v) => setF({ ...f, season: v })} /></FormField>
          <FormField label={t("batches.form.totalSeats")} required><TextInput type="number" placeholder={t("batches.form.totalSeatsPh")} value={f.totalSeats} onChange={(v) => setF({ ...f, totalSeats: v })} /></FormField>
          <FormField label={t("batchPicker.label", { ns: "erpOperations", defaultValue: "Muallim (roster)" })}>
            <SelectInput value={f.muallimId} onChange={(v) => setF({ ...f, muallimId: v })} options={muallimOpts} />
          </FormField>
          <FormField label={t("batches.form.muallim")}><TextInput placeholder={t("batches.form.muallimPh")} value={f.muallimName} onChange={(v) => setF({ ...f, muallimName: v })} disabled={!!f.muallimId} /></FormField>
          <FormField label={t("batches.form.maktab")}><TextInput placeholder={t("batches.form.maktabPh")} value={f.maktab} onChange={(v) => setF({ ...f, maktab: v })} /></FormField>
          <FormField label={t("batches.form.departure")}><TextInput type="date" value={f.departureDate} onChange={(v) => setF({ ...f, departureDate: v })} /></FormField>
          <div className="flex items-end"><Btn loading={create.isPending} onClick={submit}>{t("batches.form.create")}</Btn></div>
        </div>
      )}
      {q.isError ? <div className="p-4"><ErrorBanner message={t("batches.error")} onRetry={() => q.refetch()} /></div>
        : q.isLoading ? <SkeletonTable rows={4} cols={7} />
        : (q.data ?? []).length === 0 ? <EmptyState variant="no-data" title={t("batches.empty.title")} desc={t("batches.empty.desc")} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>{t("batches.col.code")}</Th><Th>{t("erpCommon:field.name")}</Th><Th>{t("erpCommon:field.service")}</Th><Th>{t("batches.col.departure")}</Th><Th>{t("batches.col.muallim")}</Th><Th>{t("batches.col.maktab")}</Th><Th>{t("batches.col.seats")}</Th><Th>{t("erpCommon:field.status")}</Th></tr></thead>
              <tbody>
                {(q.data ?? []).map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td mono>{b.code}</Td>
                    <Td>{b.name}</Td>
                    <Td>{t(`erpCommon:service.${b.serviceType}`)}</Td>
                    <Td mono>{b.departureDate ? formatDate(b.departureDate, "medium") : "—"}</Td>
                    <Td>{b.muallimName ?? "—"}</Td>
                    <Td>{b.maktab ?? "—"}</Td>
                    <td className="px-4 py-3 w-44">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-slate-700">{b.filledSeats}/{b.totalSeats}</span>
                        <div className="flex-1"><ProgressBar value={b.filledSeats} max={b.totalSeats || 1} color={b.remainingSeats === 0 ? "#DC2626" : "#0E7C66"} /></div>
                      </div>
                    </td>
                    <Td><Badge text={t(`batches.status.${b.status}`)} tone={statusTone(b.status)} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </SectionCard>
  );
}

// ── Registrations tab ─────────────────────────────────────────────────────────
function RegistrationsTab() {
  const { t } = useTranslation("erpHajjOps");
  const serviceOpts = useServiceOpts();
  const quotaTypeOpts = useQuotaTypeOpts();
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const q = useRegistrations({ q: applied || undefined });
  const create = useCreateRegistration();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ pilgrimName: "", serviceType: "HAJJ", season: "", quotaType: "GOVT", preRegSerial: "", pid: "", trackingNo: "" });
  const submit = () => {
    if (!f.pilgrimName || !f.season) return;
    create.mutate(
      { pilgrimName: f.pilgrimName, serviceType: f.serviceType as "HAJJ", season: f.season, quotaType: f.quotaType as "GOVT", status: "PENDING", preRegSerial: f.preRegSerial || undefined, pid: f.pid || undefined, trackingNo: f.trackingNo || undefined },
      { onSuccess: () => { setOpen(false); setF({ pilgrimName: "", serviceType: "HAJJ", season: "", quotaType: "GOVT", preRegSerial: "", pid: "", trackingNo: "" }); } },
    );
  };
  const statusTone = (s: string): Tone => (s === "CONFIRMED" || s === "REGISTERED" ? "green" : s === "CANCELLED" ? "red" : "amber");
  return (
    <SectionCard title={t("reg.title")} subtitle={t("reg.subtitle")} noPad
      actions={<Btn size="sm" icon={Plus} onClick={() => setOpen((v) => !v)}>{t("reg.new")}</Btn>}>
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#1B75BC]"
            placeholder={t("reg.searchPh")}
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setApplied(search.trim())}
          />
        </div>
        <Btn size="sm" variant="secondary" onClick={() => setApplied(search.trim())}>{t("erpCommon:action.search")}</Btn>
        {applied && <Btn size="sm" variant="ghost" onClick={() => { setSearch(""); setApplied(""); }}>{t("erpCommon:action.clear")}</Btn>}
      </div>
      {open && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-100">
          <FormField label={t("reg.form.pilgrimName")} required><TextInput value={f.pilgrimName} onChange={(v) => setF({ ...f, pilgrimName: v })} /></FormField>
          <FormField label={t("erpCommon:field.service")}><SelectInput value={f.serviceType} onChange={(v) => setF({ ...f, serviceType: v })} options={serviceOpts} /></FormField>
          <FormField label={t("erpCommon:field.season")} required><TextInput placeholder={t("reg.form.seasonPh")} value={f.season} onChange={(v) => setF({ ...f, season: v })} /></FormField>
          <FormField label={t("erpCommon:field.type")}><SelectInput value={f.quotaType} onChange={(v) => setF({ ...f, quotaType: v })} options={quotaTypeOpts} /></FormField>
          <FormField label={t("reg.form.preRegSerial")}><TextInput value={f.preRegSerial} onChange={(v) => setF({ ...f, preRegSerial: v })} /></FormField>
          <FormField label={t("reg.form.pid")}><TextInput value={f.pid} onChange={(v) => setF({ ...f, pid: v })} /></FormField>
          <FormField label={t("reg.form.trackingNo")}><TextInput value={f.trackingNo} onChange={(v) => setF({ ...f, trackingNo: v })} /></FormField>
          <div className="flex items-end"><Btn loading={create.isPending} onClick={submit}>{t("reg.form.submit")}</Btn></div>
        </div>
      )}
      {q.isError ? <div className="p-4"><ErrorBanner message={t("reg.error")} onRetry={() => q.refetch()} /></div>
        : q.isLoading ? <SkeletonTable rows={4} cols={6} />
        : (q.data ?? []).length === 0 ? <EmptyState variant={applied ? "no-results" : "no-data"} title={applied ? t("reg.empty.noResultsTitle") : t("reg.empty.noDataTitle")} desc={applied ? t("reg.empty.noResultsDesc") : t("reg.empty.noDataDesc")} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>{t("reg.col.pilgrim")}</Th><Th>{t("erpCommon:field.service")}</Th><Th>{t("erpCommon:field.season")}</Th><Th>{t("reg.col.preRegSerial")}</Th><Th>{t("reg.col.pid")}</Th><Th>{t("reg.col.tracking")}</Th><Th>{t("reg.col.booking")}</Th><Th>{t("erpCommon:field.status")}</Th></tr></thead>
              <tbody>
                {(q.data ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td>{r.pilgrimName}</Td>
                    <Td>{t(`erpCommon:service.${r.serviceType}`)}</Td>
                    <Td mono>{r.season}</Td>
                    <Td mono>{r.preRegSerial ?? "—"}</Td>
                    <Td mono>{r.pid ?? "—"}</Td>
                    <Td mono>{r.trackingNo ?? "—"}</Td>
                    <Td mono>{r.bookingNo ?? "—"}</Td>
                    <Td><Badge text={t(`reg.status.${r.status}`)} tone={statusTone(r.status)} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </SectionCard>
  );
}

// ── Passport alerts tab ───────────────────────────────────────────────────────
function AlertsTab() {
  const { t } = useTranslation("erpHajjOps");
  const q = usePassportAlerts();
  const tone = (s: string): Tone => (s === "expired" || s === "critical" ? "red" : "amber");
  return (
    <SectionCard title={t("alerts.title")} subtitle={t("alerts.subtitle")} noPad>
      {q.isError ? <div className="p-4"><ErrorBanner message={t("alerts.error")} onRetry={() => q.refetch()} /></div>
        : q.isLoading ? <SkeletonTable rows={4} cols={6} />
        : (q.data ?? []).length === 0 ? <EmptyState variant="no-data" title={t("alerts.empty.title")} desc={t("alerts.empty.desc")} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>{t("alerts.col.pilgrim")}</Th><Th>{t("alerts.col.booking")}</Th><Th>{t("erpCommon:field.service")}</Th><Th>{t("alerts.col.departure")}</Th><Th>{t("alerts.col.expiry")}</Th><Th>{t("alerts.col.validAtDeparture")}</Th><Th>{t("alerts.col.alert")}</Th></tr></thead>
              <tbody>
                {(q.data ?? []).map((a) => (
                  <tr key={a.travelerId} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td>{a.travelerName}</Td>
                    <Td mono>{a.bookingNo ?? "—"}</Td>
                    <Td>{a.serviceType === "HAJJ" || a.serviceType === "UMRAH" ? t(`erpCommon:service.${a.serviceType}`) : a.serviceType}</Td>
                    <Td mono>{a.departureDate ? formatDate(a.departureDate, "medium") : "—"}</Td>
                    <Td mono>{a.passportExpiry ? formatDate(a.passportExpiry, "medium") : "—"}</Td>
                    <Td mono>{a.monthsValidAtDeparture != null ? t("alerts.months", { n: a.monthsValidAtDeparture }) : "—"}</Td>
                    <Td><Badge text={t(`alerts.severity.${a.severity}`)} tone={tone(a.severity)} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </SectionCard>
  );
}

export function HajjOpsModule() {
  const { t } = useTranslation("erpHajjOps");
  const [tab, setTab] = useState<Tab>("quota");
  return (
    <div className="p-5 md:p-7">
      <PageHeader title={t("page.title")} subtitle={t("page.subtitle")} />
      <div className="flex items-center gap-1 mb-5 border-b border-slate-200">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.key;
          return (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors",
                active ? "border-[#1B75BC] text-[#1B75BC]" : "border-transparent text-slate-500 hover:text-slate-700")}>
              <Icon size={15} /> {t(`tab.${tb.key}`)}
            </button>
          );
        })}
      </div>
      {tab === "quota" && <QuotaTab />}
      {tab === "batches" && <BatchesTab />}
      {tab === "registrations" && <RegistrationsTab />}
      {tab === "alerts" && <AlertsTab />}
    </div>
  );
}
