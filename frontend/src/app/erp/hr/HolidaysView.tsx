import { useState } from "react";
import { Plus, CalendarDays, Trash2 } from "lucide-react";
import { ErrorBanner, SkeletonTable } from "../../lib/ds";
import { useHolidays, useCreateHoliday, useDeleteHoliday, type HolidayDto } from "../../hooks/hr";
import { Card, Field, PrimaryBtn, Pill, fmtDate, inputCls, selectCls } from "./ui";

const SCOPES = ["NATIONAL", "COMPANY", "BRANCH", "DEPARTMENT", "OPTIONAL"];
const SCOPE_COLOR: Record<string, { color: string; bg: string }> = {
  NATIONAL: { color: "#1D4ED8", bg: "#DBEAFE" },
  COMPANY: { color: "#065F46", bg: "#D1FAE5" },
  BRANCH: { color: "#92400E", bg: "#FEF3C7" },
  DEPARTMENT: { color: "#7C3AED", bg: "#F5F3FF" },
  OPTIONAL: { color: "#6B7280", bg: "#F3F4F6" },
};

function NewHolidayForm() {
  const createMut = useCreateHoliday();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [scope, setScope] = useState("NATIONAL");
  const [optional, setOptional] = useState(false);

  const canSave = name.trim() && date;
  const submit = () => {
    if (!canSave) return;
    createMut.mutate({ name: name.trim(), date, scope, optional }, { onSuccess: () => { setName(""); setDate(""); } });
  };

  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <Field label="Holiday Name" required><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Independence Day" /></Field>
        <Field label="Date" required><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Scope">
          <select className={selectCls} value={scope} onChange={(e) => setScope(e.target.value)}>
            {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-1.5 h-9 text-[11px] font-medium text-[var(--color-text-muted)]">
          <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} /> Optional
        </label>
        <PrimaryBtn onClick={submit} disabled={!canSave || createMut.isPending}><Plus size={13} /> Add Holiday</PrimaryBtn>
      </div>
    </Card>
  );
}

export function HolidaysView() {
  const year = new Date().getFullYear();
  const { data, isLoading, isError, error } = useHolidays({ year });
  const deleteMut = useDeleteHoliday();
  const rows = [...(data ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <NewHolidayForm />
      <Card>
        <div className="px-5 py-3.5 border-b border-[var(--color-border-subtle)] flex items-center gap-2">
          <CalendarDays size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-[13px] font-black text-[var(--color-text)]">Holidays {year}</h3>
          <span className="text-[11px] text-[var(--color-text-faint)]">({rows.length})</span>
        </div>
        {isLoading ? <SkeletonTable rows={5} cols={1} /> : isError ? (
          <div className="p-4"><ErrorBanner message={(error as Error)?.message || "Failed to load holidays."} /></div>
        ) : rows.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-faint)] py-8 text-center">No holidays configured for {year} yet.</p>
        ) : rows.map((h: HolidayDto) => {
          const cfg = SCOPE_COLOR[h.scope] ?? SCOPE_COLOR.OPTIONAL;
          return (
            <div key={h.id} className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-subtle)] last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-black text-[var(--color-text)] leading-none">{h.date.slice(8, 10)}</span>
                  <span className="text-[8px] text-[var(--color-text-faint)] uppercase">{new Date(h.date).toLocaleDateString("en-US", { month: "short" })}</span>
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold text-[var(--color-text)]">{h.name}</p>
                  <p className="text-[10px] text-[var(--color-text-faint)]">{fmtDate(h.date)}{h.optional ? " · Optional" : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Pill label={h.scope} color={cfg.color} bg={cfg.bg} />
                <button type="button" onClick={() => deleteMut.mutate(h.id)} aria-label={`Remove ${h.name}`}
                  className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] cursor-pointer p-1"><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
