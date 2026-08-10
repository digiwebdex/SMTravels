import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Archive, X } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import { useEmployers, useCreateEmployer, useUpdateEmployer, useArchiveEmployer, type EmployerFilters } from "../hooks/manpower";
import type { EmployerDto } from "@contracts/manpower.contract";

const STATUSES = ["ACTIVE", "INACTIVE", "BLACKLISTED"];
const statusFilterOpts = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const statusFormOpts = STATUSES.map((s) => ({ value: s, label: s }));

type Form = { name: string; country: string; city: string; industry: string; contactPerson: string; phone: string; whatsapp: string; email: string; address: string; status: string; notes: string };
const empty: Form = { name: "", country: "", city: "", industry: "", contactPerson: "", phone: "", whatsapp: "", email: "", address: "", status: "ACTIVE", notes: "" };
const toForm = (e: EmployerDto): Form => ({ name: e.name, country: e.country ?? "", city: e.city ?? "", industry: e.industry ?? "", contactPerson: e.contactPerson ?? "", phone: e.phone ?? "", whatsapp: e.whatsapp ?? "", email: e.email ?? "", address: e.address ?? "", status: e.status, notes: e.notes ?? "" });

/** Manpower → Employers (Module 6A). Foreign employers + job-order counts. Gated on "bookings". */
export function EmployersModule() {
  const { can } = useAuth();
  const canManage = can("bookings", "manage");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filters: EmployerFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, pageSize: 100 }), [q, status]);
  const listQ = useEmployers(filters);
  const createM = useCreateEmployer();
  const updateM = useUpdateEmployer();
  const archiveM = useArchiveEmployer();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (e: EmployerDto) => { setEditId(e.id); setForm(toForm(e)); setOpen(true); };
  const save = () => {
    if (!form.name.trim()) return;
    const payload = { ...form, name: form.name.trim(), status: form.status as "ACTIVE" | "INACTIVE" | "BLACKLISTED" };
    if (editId) updateM.mutate({ id: editId, input: payload }, { onSuccess: () => setOpen(false) });
    else createM.mutate(payload, { onSuccess: () => setOpen(false) });
  };
  const rows = listQ.data?.items ?? [];

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="Employers" subtitle="Manpower — foreign employers and their job orders"
        actions={canManage ? <Btn icon={Plus} onClick={openNew}>Add employer</Btn> : undefined} />
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><div className="[&_input]:pl-9"><TextInput placeholder="Search name / country" value={q} onChange={setQ} /></div></div>
        <div className="w-44"><SelectInput value={status} onChange={setStatus} options={statusFilterOpts} /></div>
      </div>

      <SectionCard noPad>
        {listQ.isError ? <div className="p-4"><ErrorBanner message="Failed to load employers." onRetry={() => listQ.refetch()} /></div>
          : listQ.isLoading ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          : rows.length === 0 ? <EmptyState title="No employers yet" desc={canManage ? "Add the foreign employers you recruit for." : "No employers."} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Code</th><th className="px-4 py-3 font-bold">Employer</th><th className="px-4 py-3 font-bold">Country</th>
                  <th className="px-4 py-3 font-bold">Contact</th><th className="px-4 py-3 font-bold">Job orders</th><th className="px-4 py-3 font-bold">Status</th>{canManage && <th className="px-4 py-3 text-right font-bold">Actions</th>}
                </tr></thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-500">{e.code}</td>
                      <td className="px-4 py-3 font-semibold text-[#002D62]">{e.name}{e.industry ? <span className="block text-[11px] font-normal text-slate-400">{e.industry}</span> : null}</td>
                      <td className="px-4 py-3 text-slate-600">{[e.city, e.country].filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{e.contactPerson || "—"}{e.phone ? <span className="block text-[11px] text-slate-400">{e.phone}</span> : null}</td>
                      <td className="px-4 py-3 text-slate-600">{e.jobOrderCount}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${e.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : e.status === "BLACKLISTED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"}`}>{e.status}</span></td>
                      {canManage && <td className="px-4 py-3 text-right whitespace-nowrap"><Btn size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(e)}>Edit</Btn><Btn size="sm" variant="ghost" icon={Archive} onClick={() => { if (confirm(`Archive ${e.name}?`)) archiveM.mutate(e.id); }}>Archive</Btn></td>}
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white"><h3 className="font-bold text-[#002D62]">{editId ? "Edit employer" : "Add employer"}</h3><button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
            <div className="p-5 space-y-3">
              {([["name", "Employer name *"], ["country", "Country"], ["city", "City"], ["industry", "Industry"], ["contactPerson", "Contact person"], ["phone", "Phone"], ["whatsapp", "WhatsApp"], ["email", "Email"], ["address", "Address"], ["notes", "Notes"]] as const).map(([k, label]) => (
                <div key={k}><label className="block text-[11px] font-bold text-slate-500 mb-1">{label}</label><TextInput value={form[k]} onChange={(v) => set(k, v)} /></div>
              ))}
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label><SelectInput value={form.status} onChange={(v) => set("status", v)} options={statusFormOpts} /></div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 sticky bottom-0 bg-white"><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn disabled={!form.name.trim()} loading={createM.isPending || updateM.isPending} onClick={save}>{editId ? "Save changes" : "Create"}</Btn></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployersModule;
