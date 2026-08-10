import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Archive, X } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import {
  useMuftiScholars, useCreateMuftiScholar, useUpdateMuftiScholar, useArchiveMuftiScholar,
  type ScholarFilters,
} from "../hooks/businessNetwork";
import type { MuftiScholarDto } from "@contracts/business-network.contract";

const STATUSES = ["ACTIVE", "PROSPECT", "INACTIVE"];
const statusFilterOpts = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const statusFormOpts = STATUSES.map((s) => ({ value: s, label: s }));

type Form = {
  name: string; title: string; organization: string; specialization: string; phone: string;
  whatsapp: string; email: string; location: string; availability: string; status: string; notes: string;
};
const emptyForm: Form = { name: "", title: "", organization: "", specialization: "", phone: "", whatsapp: "", email: "", location: "", availability: "", status: "ACTIVE", notes: "" };
const toForm = (s: MuftiScholarDto): Form => ({
  name: s.name, title: s.title ?? "", organization: s.organization ?? "", specialization: s.specialization ?? "",
  phone: s.phone ?? "", whatsapp: s.whatsapp ?? "", email: s.email ?? "", location: s.location ?? "",
  availability: s.availability ?? "", status: s.status, notes: s.notes ?? "",
});

/** Business Network → Mufti / Scholar Network (Module 4). Full CRUD, gated on "partners". */
export function MuftiScholarModule() {
  const { can } = useAuth();
  const canManage = can("partners", "manage");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filters: ScholarFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, pageSize: 100 }), [q, status]);
  const listQ = useMuftiScholars(filters);

  const createM = useCreateMuftiScholar();
  const updateM = useUpdateMuftiScholar();
  const archiveM = useArchiveMuftiScholar();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: MuftiScholarDto) => { setEditId(s.id); setForm(toForm(s)); setOpen(true); };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = { ...form, name: form.name.trim(), status: form.status as "ACTIVE" | "INACTIVE" | "PROSPECT" };
    if (editId) updateM.mutate({ id: editId, input: payload }, { onSuccess: () => setOpen(false) });
    else createM.mutate(payload, { onSuccess: () => setOpen(false) });
  };

  const rows = listQ.data?.items ?? [];

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader
        title="Mufti / Scholar Network"
        subtitle="Business Network — scholars and muftis the agency consults"
        actions={canManage ? <Btn icon={Plus} onClick={openNew}>Add scholar</Btn> : undefined}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <div className="[&_input]:pl-9"><TextInput placeholder="Search name / organization / specialization" value={q} onChange={setQ} /></div>
        </div>
        <div className="w-44"><SelectInput value={status} onChange={setStatus} options={statusFilterOpts} /></div>
      </div>

      <SectionCard noPad>
        {listQ.isError ? (
          <div className="p-4"><ErrorBanner message="Failed to load scholars." onRetry={() => listQ.refetch()} /></div>
        ) : listQ.isLoading ? (
          <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No scholars yet" desc={canManage ? "Add the muftis and scholars your agency consults for religious guidance." : "No scholars match your filters."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Code</th>
                  <th className="px-4 py-3 font-bold">Name</th>
                  <th className="px-4 py-3 font-bold">Organization</th>
                  <th className="px-4 py-3 font-bold">Specialization</th>
                  <th className="px-4 py-3 font-bold">Contact</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  {canManage && <th className="px-4 py-3 font-bold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-500">{s.code}</td>
                    <td className="px-4 py-3 font-semibold text-[#002D62]">{s.name}{s.title ? <span className="block text-[11px] font-normal text-slate-400">{s.title}</span> : null}</td>
                    <td className="px-4 py-3 text-slate-600">{s.organization || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{s.specialization || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{s.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : s.status === "PROSPECT" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{s.status}</span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Btn size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(s)}>Edit</Btn>
                        <Btn size="sm" variant="ghost" icon={Archive} onClick={() => { if (confirm(`Archive ${s.name}?`)) archiveM.mutate(s.id); }}>Archive</Btn>
                      </td>
                    )}
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="font-bold text-[#002D62]">{editId ? "Edit scholar" : "Add scholar"}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {([
                ["name", "Name *"], ["title", "Title (e.g. Mufti, Maulana)"], ["organization", "Organization"],
                ["specialization", "Specialization"], ["phone", "Phone"], ["whatsapp", "WhatsApp"], ["email", "Email"],
                ["location", "Location"], ["availability", "Availability"], ["notes", "Notes"],
              ] as const).map(([k, label]) => (
                <div key={k}>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{label}</label>
                  <TextInput value={form[k]} onChange={(v) => set(k, v)} />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
                <SelectInput value={form.status} onChange={(v) => set("status", v)} options={statusFormOpts} />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 sticky bottom-0 bg-white">
              <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
              <Btn disabled={!form.name.trim()} loading={createM.isPending || updateM.isPending} onClick={save}>{editId ? "Save changes" : "Create"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MuftiScholarModule;
