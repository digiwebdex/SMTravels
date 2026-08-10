import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Archive, X } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import { useJobOrders, useCreateJobOrder, useUpdateJobOrder, useArchiveJobOrder, useEmployerOptions, type JobOrderFilters } from "../hooks/manpower";
import type { JobOrderDto } from "@contracts/manpower.contract";

const STATUSES = ["OPEN", "IN_PROGRESS", "FILLED", "CLOSED", "CANCELLED"];
const CURRENCIES = ["SAR", "USD", "BDT"];
const statusFilterOpts = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const statusFormOpts = STATUSES.map((s) => ({ value: s, label: s }));
const currencyOpts = CURRENCIES.map((c) => ({ value: c, label: c }));
const STATUS_CLS: Record<string, string> = { OPEN: "bg-emerald-50 text-emerald-700", IN_PROGRESS: "bg-blue-50 text-blue-700", FILLED: "bg-indigo-50 text-indigo-700", CLOSED: "bg-slate-100 text-slate-500", CANCELLED: "bg-red-50 text-red-700" };

type Form = { employerId: string; jobTitle: string; category: string; country: string; quantity: string; salary: string; currency: string; accommodation: string; food: string; workingHours: string; contractDuration: string; requirements: string; deadline: string; status: string; notes: string };
const empty: Form = { employerId: "", jobTitle: "", category: "", country: "", quantity: "1", salary: "", currency: "SAR", accommodation: "", food: "", workingHours: "", contractDuration: "", requirements: "", deadline: "", status: "OPEN", notes: "" };
const toForm = (j: JobOrderDto): Form => ({ employerId: j.employerId, jobTitle: j.jobTitle, category: j.category ?? "", country: j.country ?? "", quantity: String(j.quantity), salary: j.salary ?? "", currency: j.currency, accommodation: j.accommodation ?? "", food: j.food ?? "", workingHours: j.workingHours ?? "", contractDuration: j.contractDuration ?? "", requirements: j.requirements ?? "", deadline: j.deadline ?? "", status: j.status, notes: j.notes ?? "" });

/** Manpower → Job Orders (Module 6A). Job orders linked to an Employer. Gated on "bookings". */
export function JobOrdersModule() {
  const { can } = useAuth();
  const canManage = can("bookings", "manage");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [employerId, setEmployerId] = useState("");
  const filters: JobOrderFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, employerId: employerId || undefined, pageSize: 100 }), [q, status, employerId]);
  const listQ = useJobOrders(filters);
  const employersQ = useEmployerOptions();
  const createM = useCreateJobOrder();
  const updateM = useUpdateJobOrder();
  const archiveM = useArchiveJobOrder();

  const employerOpts = [{ value: "", label: "Select employer *" }, ...(employersQ.data ?? []).map((e) => ({ value: e.id, label: `${e.name} (${e.code})` }))];
  const employerFilterOpts = [{ value: "", label: "All employers" }, ...(employersQ.data ?? []).map((e) => ({ value: e.id, label: e.name }))];

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (j: JobOrderDto) => { setEditId(j.id); setForm(toForm(j)); setOpen(true); };
  const save = () => {
    if (!form.employerId || !form.jobTitle.trim()) return;
    const payload = {
      employerId: form.employerId, jobTitle: form.jobTitle.trim(), category: form.category.trim() || undefined,
      country: form.country.trim() || undefined, quantity: Number(form.quantity) || 1,
      salary: form.salary ? Number(form.salary) : undefined, currency: form.currency as "BDT" | "USD" | "SAR",
      accommodation: form.accommodation.trim() || undefined, food: form.food.trim() || undefined,
      workingHours: form.workingHours.trim() || undefined, contractDuration: form.contractDuration.trim() || undefined,
      requirements: form.requirements.trim() || undefined, deadline: form.deadline || undefined,
      status: form.status as "OPEN" | "IN_PROGRESS" | "FILLED" | "CLOSED" | "CANCELLED", notes: form.notes.trim() || undefined,
    };
    if (editId) updateM.mutate({ id: editId, input: payload }, { onSuccess: () => setOpen(false) });
    else createM.mutate(payload, { onSuccess: () => setOpen(false) });
  };
  const rows = listQ.data?.items ?? [];

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="Job Orders" subtitle="Manpower — demand from employers (Employer → Job Order)"
        actions={canManage ? <Btn icon={Plus} onClick={openNew} disabled={(employersQ.data ?? []).length === 0}>Add job order</Btn> : undefined} />
      {(employersQ.data ?? []).length === 0 && !employersQ.isLoading && (
        <div className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">Add an employer first — job orders belong to an employer.</div>
      )}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><div className="[&_input]:pl-9"><TextInput placeholder="Search job title / country" value={q} onChange={setQ} /></div></div>
        <div className="w-52"><SelectInput value={employerId} onChange={setEmployerId} options={employerFilterOpts} /></div>
        <div className="w-44"><SelectInput value={status} onChange={setStatus} options={statusFilterOpts} /></div>
      </div>

      <SectionCard noPad>
        {listQ.isError ? <div className="p-4"><ErrorBanner message="Failed to load job orders." onRetry={() => listQ.refetch()} /></div>
          : listQ.isLoading ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          : rows.length === 0 ? <EmptyState title="No job orders yet" desc={canManage ? "Create a job order for an employer — title, country, quantity, salary." : "No job orders."} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Code</th><th className="px-4 py-3 font-bold">Job title</th><th className="px-4 py-3 font-bold">Employer</th>
                  <th className="px-4 py-3 font-bold">Country</th><th className="px-4 py-3 font-bold text-right">Qty</th><th className="px-4 py-3 font-bold text-right">Salary</th>
                  <th className="px-4 py-3 font-bold">Deadline</th><th className="px-4 py-3 font-bold">Status</th>{canManage && <th className="px-4 py-3 text-right font-bold">Actions</th>}
                </tr></thead>
                <tbody>
                  {rows.map((j) => (
                    <tr key={j.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-500">{j.code}</td>
                      <td className="px-4 py-3 font-semibold text-[#002D62]">{j.jobTitle}{j.category ? <span className="block text-[11px] font-normal text-slate-400">{j.category}</span> : null}</td>
                      <td className="px-4 py-3 text-slate-600">{j.employerName}</td>
                      <td className="px-4 py-3 text-slate-600">{j.country || "—"}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{j.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">{j.salary ? `${j.salary} ${j.currency}` : "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{j.deadline || "—"}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLS[j.status] ?? "bg-slate-100 text-slate-600"}`}>{j.status}</span></td>
                      {canManage && <td className="px-4 py-3 text-right whitespace-nowrap"><Btn size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(j)}>Edit</Btn><Btn size="sm" variant="ghost" icon={Archive} onClick={() => { if (confirm(`Cancel ${j.code}?`)) archiveM.mutate(j.id); }}>Cancel</Btn></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </SectionCard>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md h-full bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white"><h3 className="font-bold text-[#002D62]">{editId ? "Edit job order" : "Add job order"}</h3><button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
            <div className="p-5 space-y-3">
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Employer *</label><SelectInput value={form.employerId} onChange={(v) => set("employerId", v)} options={employerOpts} /></div>
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Job title *</label><TextInput value={form.jobTitle} onChange={(v) => set("jobTitle", v)} /></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label><TextInput value={form.category} onChange={(v) => set("category", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Country</label><TextInput value={form.country} onChange={(v) => set("country", v)} /></div></div>
              <div className="flex gap-3"><div className="w-24"><label className="block text-[11px] font-bold text-slate-500 mb-1">Quantity</label><TextInput type="number" value={form.quantity} onChange={(v) => set("quantity", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Salary</label><TextInput type="number" value={form.salary} onChange={(v) => set("salary", v)} /></div><div className="w-24"><label className="block text-[11px] font-bold text-slate-500 mb-1">Currency</label><SelectInput value={form.currency} onChange={(v) => set("currency", v)} options={currencyOpts} /></div></div>
              {([["accommodation", "Accommodation"], ["food", "Food"], ["workingHours", "Working hours"], ["contractDuration", "Contract duration"], ["requirements", "Requirements"], ["notes", "Notes"]] as const).map(([k, label]) => (
                <div key={k}><label className="block text-[11px] font-bold text-slate-500 mb-1">{label}</label><TextInput value={form[k]} onChange={(v) => set(k, v)} /></div>
              ))}
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Deadline</label><TextInput type="date" value={form.deadline} onChange={(v) => set("deadline", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label><SelectInput value={form.status} onChange={(v) => set("status", v)} options={statusFormOpts} /></div></div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 sticky bottom-0 bg-white"><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn disabled={!form.employerId || !form.jobTitle.trim()} loading={createM.isPending || updateM.isPending} onClick={save}>{editId ? "Save changes" : "Create"}</Btn></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobOrdersModule;
