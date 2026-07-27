import React, { useState } from "react";
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

type Tab = "quota" | "batches" | "registrations" | "alerts";
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "quota", label: "Quota", icon: Users },
  { key: "batches", label: "Departure Batches", icon: CalendarClock },
  { key: "registrations", label: "Pilgrim Registration", icon: IdCard },
  { key: "alerts", label: "Passport Alerts", icon: AlertTriangle },
];

const SERVICE_OPTS = [{ value: "HAJJ", label: "Hajj" }, { value: "UMRAH", label: "Umrah" }];
const QUOTA_TYPE_OPTS = [{ value: "GOVT", label: "Government" }, { value: "PRIVATE", label: "Private" }];

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
    <SectionCard title="Government Quota" subtitle="Allotment vs reserved, per season" noPad
      actions={<Btn size="sm" icon={Plus} onClick={() => setOpen((v) => !v)}>New quota</Btn>}>
      {open && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-50 border-b border-slate-100">
          <FormField label="Service"><SelectInput value={f.serviceType} onChange={(v) => setF({ ...f, serviceType: v })} options={SERVICE_OPTS} /></FormField>
          <FormField label="Season" required><TextInput placeholder="2027" value={f.season} onChange={(v) => setF({ ...f, season: v })} /></FormField>
          <FormField label="Label" required><TextInput placeholder="Govt Hajj 2027" value={f.label} onChange={(v) => setF({ ...f, label: v })} /></FormField>
          <FormField label="Type"><SelectInput value={f.quotaType} onChange={(v) => setF({ ...f, quotaType: v })} options={QUOTA_TYPE_OPTS} /></FormField>
          <FormField label="Allotted" required><div className="flex gap-2"><TextInput type="number" placeholder="1000" value={f.allotted} onChange={(v) => setF({ ...f, allotted: v })} /><Btn size="sm" loading={create.isPending} onClick={submit}>Add</Btn></div></FormField>
        </div>
      )}
      {q.isError ? <div className="p-4"><ErrorBanner message="Failed to load quotas" onRetry={() => q.refetch()} /></div>
        : q.isLoading ? <SkeletonTable rows={4} cols={6} />
        : (q.data ?? []).length === 0 ? <EmptyState variant="no-data" title="No quota set" desc="Add a government/private quota allotment for a season." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Label</Th><Th>Service</Th><Th>Season</Th><Th>Type</Th><Th>Allotted</Th><Th>Filled</Th><Th>Remaining</Th><Th>Utilisation</Th></tr></thead>
              <tbody>
                {(q.data ?? []).map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td>{row.label}{row.branchName ? "" : " · company-wide"}</Td>
                    <Td>{row.serviceType === "HAJJ" ? "Hajj" : "Umrah"}</Td>
                    <Td mono>{row.season}</Td>
                    <Td><Badge text={row.quotaType === "GOVT" ? "Govt" : "Private"} tone="blue" /></Td>
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
  const q = useBatches();
  const create = useCreateBatch();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ serviceType: "HAJJ", name: "", season: "", totalSeats: "", muallimName: "", maktab: "", departureDate: "" });
  const submit = () => {
    if (!f.name || !f.totalSeats) return;
    create.mutate(
      { serviceType: f.serviceType as "HAJJ", name: f.name, season: f.season || undefined, totalSeats: Number(f.totalSeats), muallimName: f.muallimName || undefined, maktab: f.maktab || undefined, departureDate: f.departureDate || undefined },
      { onSuccess: () => { setOpen(false); setF({ serviceType: "HAJJ", name: "", season: "", totalSeats: "", muallimName: "", maktab: "", departureDate: "" }); } },
    );
  };
  const statusTone = (s: string): Tone => (s === "OPEN" ? "green" : s === "DEPARTED" ? "blue" : s === "CANCELLED" ? "red" : "slate");
  return (
    <SectionCard title="Group-Departure Batches" subtitle="Seat inventory · Muallim & Maktab" noPad
      actions={<Btn size="sm" icon={Plus} onClick={() => setOpen((v) => !v)}>New batch</Btn>}>
      {open && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-100">
          <FormField label="Service"><SelectInput value={f.serviceType} onChange={(v) => setF({ ...f, serviceType: v })} options={SERVICE_OPTS} /></FormField>
          <FormField label="Batch name" required><TextInput placeholder="Hajj Group 07" value={f.name} onChange={(v) => setF({ ...f, name: v })} /></FormField>
          <FormField label="Season"><TextInput placeholder="2027" value={f.season} onChange={(v) => setF({ ...f, season: v })} /></FormField>
          <FormField label="Total seats" required><TextInput type="number" placeholder="40" value={f.totalSeats} onChange={(v) => setF({ ...f, totalSeats: v })} /></FormField>
          <FormField label="Muallim"><TextInput placeholder="Sh. Abdullah" value={f.muallimName} onChange={(v) => setF({ ...f, muallimName: v })} /></FormField>
          <FormField label="Maktab"><TextInput placeholder="Maktab 12" value={f.maktab} onChange={(v) => setF({ ...f, maktab: v })} /></FormField>
          <FormField label="Departure"><TextInput type="date" value={f.departureDate} onChange={(v) => setF({ ...f, departureDate: v })} /></FormField>
          <div className="flex items-end"><Btn loading={create.isPending} onClick={submit}>Create batch</Btn></div>
        </div>
      )}
      {q.isError ? <div className="p-4"><ErrorBanner message="Failed to load batches" onRetry={() => q.refetch()} /></div>
        : q.isLoading ? <SkeletonTable rows={4} cols={7} />
        : (q.data ?? []).length === 0 ? <EmptyState variant="no-data" title="No departure batches" desc="Create a group-departure batch with a seat count and Muallim." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Code</Th><Th>Name</Th><Th>Service</Th><Th>Departure</Th><Th>Muallim</Th><Th>Maktab</Th><Th>Seats</Th><Th>Status</Th></tr></thead>
              <tbody>
                {(q.data ?? []).map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td mono>{b.code}</Td>
                    <Td>{b.name}</Td>
                    <Td>{b.serviceType === "HAJJ" ? "Hajj" : "Umrah"}</Td>
                    <Td mono>{b.departureDate ? formatDate(b.departureDate, "medium") : "—"}</Td>
                    <Td>{b.muallimName ?? "—"}</Td>
                    <Td>{b.maktab ?? "—"}</Td>
                    <td className="px-4 py-3 w-44">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-slate-700">{b.filledSeats}/{b.totalSeats}</span>
                        <div className="flex-1"><ProgressBar value={b.filledSeats} max={b.totalSeats || 1} color={b.remainingSeats === 0 ? "#DC2626" : "#0E7C66"} /></div>
                      </div>
                    </td>
                    <Td><Badge text={b.status[0] + b.status.slice(1).toLowerCase()} tone={statusTone(b.status)} /></Td>
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
    <SectionCard title="Pilgrim Government Registration" subtitle="Pre-registration serial · PID · tracking no. (encrypted, searchable)" noPad
      actions={<Btn size="sm" icon={Plus} onClick={() => setOpen((v) => !v)}>Register pilgrim</Btn>}>
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#1B75BC]"
            placeholder="Search by serial / PID / tracking no. or name"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setApplied(search.trim())}
          />
        </div>
        <Btn size="sm" variant="secondary" onClick={() => setApplied(search.trim())}>Search</Btn>
        {applied && <Btn size="sm" variant="ghost" onClick={() => { setSearch(""); setApplied(""); }}>Clear</Btn>}
      </div>
      {open && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-100">
          <FormField label="Pilgrim name" required><TextInput value={f.pilgrimName} onChange={(v) => setF({ ...f, pilgrimName: v })} /></FormField>
          <FormField label="Service"><SelectInput value={f.serviceType} onChange={(v) => setF({ ...f, serviceType: v })} options={SERVICE_OPTS} /></FormField>
          <FormField label="Season" required><TextInput placeholder="2027" value={f.season} onChange={(v) => setF({ ...f, season: v })} /></FormField>
          <FormField label="Type"><SelectInput value={f.quotaType} onChange={(v) => setF({ ...f, quotaType: v })} options={QUOTA_TYPE_OPTS} /></FormField>
          <FormField label="Pre-reg serial"><TextInput value={f.preRegSerial} onChange={(v) => setF({ ...f, preRegSerial: v })} /></FormField>
          <FormField label="PID"><TextInput value={f.pid} onChange={(v) => setF({ ...f, pid: v })} /></FormField>
          <FormField label="Tracking no."><TextInput value={f.trackingNo} onChange={(v) => setF({ ...f, trackingNo: v })} /></FormField>
          <div className="flex items-end"><Btn loading={create.isPending} onClick={submit}>Register</Btn></div>
        </div>
      )}
      {q.isError ? <div className="p-4"><ErrorBanner message="Failed to load registrations" onRetry={() => q.refetch()} /></div>
        : q.isLoading ? <SkeletonTable rows={4} cols={6} />
        : (q.data ?? []).length === 0 ? <EmptyState variant={applied ? "no-results" : "no-data"} title={applied ? "No matches" : "No registrations yet"} desc={applied ? "No pilgrim matches that identifier." : "Register a pilgrim's government pre-registration details."} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Pilgrim</Th><Th>Service</Th><Th>Season</Th><Th>Pre-reg serial</Th><Th>PID</Th><Th>Tracking</Th><Th>Booking</Th><Th>Status</Th></tr></thead>
              <tbody>
                {(q.data ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td>{r.pilgrimName}</Td>
                    <Td>{r.serviceType === "HAJJ" ? "Hajj" : "Umrah"}</Td>
                    <Td mono>{r.season}</Td>
                    <Td mono>{r.preRegSerial ?? "—"}</Td>
                    <Td mono>{r.pid ?? "—"}</Td>
                    <Td mono>{r.trackingNo ?? "—"}</Td>
                    <Td mono>{r.bookingNo ?? "—"}</Td>
                    <Td><Badge text={r.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())} tone={statusTone(r.status)} /></Td>
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
  const q = usePassportAlerts();
  const tone = (s: string): Tone => (s === "expired" || s === "critical" ? "red" : "amber");
  const label = (s: string) => (s === "expired" ? "Expired" : s === "critical" ? "Invalid at departure" : "Expiring soon");
  return (
    <SectionCard title="Passport Expiry Alerts" subtitle="A passport must be valid ≥ 6 months beyond the departure date" noPad>
      {q.isError ? <div className="p-4"><ErrorBanner message="Failed to load alerts" onRetry={() => q.refetch()} /></div>
        : q.isLoading ? <SkeletonTable rows={4} cols={6} />
        : (q.data ?? []).length === 0 ? <EmptyState variant="no-data" title="No passport alerts" desc="No pilgrim's passport falls within 6 months of their departure." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Pilgrim</Th><Th>Booking</Th><Th>Service</Th><Th>Departure</Th><Th>Passport expiry</Th><Th>Valid at departure</Th><Th>Alert</Th></tr></thead>
              <tbody>
                {(q.data ?? []).map((a) => (
                  <tr key={a.travelerId} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td>{a.travelerName}</Td>
                    <Td mono>{a.bookingNo ?? "—"}</Td>
                    <Td>{a.serviceType === "HAJJ" ? "Hajj" : a.serviceType === "UMRAH" ? "Umrah" : a.serviceType}</Td>
                    <Td mono>{a.departureDate ? formatDate(a.departureDate, "medium") : "—"}</Td>
                    <Td mono>{a.passportExpiry ? formatDate(a.passportExpiry, "medium") : "—"}</Td>
                    <Td mono>{a.monthsValidAtDeparture != null ? `${a.monthsValidAtDeparture} mo` : "—"}</Td>
                    <Td><Badge text={label(a.severity)} tone={tone(a.severity)} /></Td>
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
  const [tab, setTab] = useState<Tab>("quota");
  return (
    <div className="p-5 md:p-7">
      <PageHeader title="Hajj / Umrah Operations" subtitle="Government quota, group-departure batches, pilgrim registration & passport compliance" />
      <div className="flex items-center gap-1 mb-5 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors",
                active ? "border-[#1B75BC] text-[#1B75BC]" : "border-transparent text-slate-500 hover:text-slate-700")}>
              <Icon size={15} /> {t.label}
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
