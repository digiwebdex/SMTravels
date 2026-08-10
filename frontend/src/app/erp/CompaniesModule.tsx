import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Archive, X } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import {
  useBusinessPartners, useCreateBusinessPartner, useUpdateBusinessPartner, useArchiveBusinessPartner,
  type PartnerFilters,
} from "../hooks/businessNetwork";
import type { BusinessPartnerDto } from "@contracts/business-network.contract";

const TYPES = ["Airline", "Hotel", "Transport", "Visa Partner", "Manpower Employer", "Recruitment", "Local Business", "Other"];
const STATUSES = ["ACTIVE", "PROSPECT", "INACTIVE"];
const typeOpts = [{ value: "", label: "All types" }, ...TYPES.map((t) => ({ value: t, label: t }))];
const statusFilterOpts = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const statusFormOpts = STATUSES.map((s) => ({ value: s, label: s }));
const typeFormOpts = [{ value: "", label: "—" }, ...TYPES.map((t) => ({ value: t, label: t }))];

type Form = {
  name: string; type: string; industry: string; country: string; address: string;
  contactPerson: string; phone: string; whatsapp: string; email: string; website: string;
  services: string; contractRef: string; status: string; notes: string;
};
const emptyForm: Form = {
  name: "", type: "", industry: "", country: "", address: "", contactPerson: "", phone: "",
  whatsapp: "", email: "", website: "", services: "", contractRef: "", status: "ACTIVE", notes: "",
};
const toForm = (p: BusinessPartnerDto): Form => ({
  name: p.name, type: p.type ?? "", industry: p.industry ?? "", country: p.country ?? "", address: p.address ?? "",
  contactPerson: p.contactPerson ?? "", phone: p.phone ?? "", whatsapp: p.whatsapp ?? "", email: p.email ?? "",
  website: p.website ?? "", services: p.services ?? "", contractRef: p.contractRef ?? "", status: p.status, notes: p.notes ?? "",
});

/** Business Network → Companies We Work With (Module 3). Full CRUD, gated on "partners". */
export function CompaniesModule() {
  const { can } = useAuth();
  const canManage = can("partners", "manage");

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const filters: PartnerFilters = useMemo(() => ({ q: q.trim() || undefined, type: type || undefined, status: status || undefined, pageSize: 100 }), [q, type, status]);
  const listQ = useBusinessPartners(filters);

  const createM = useCreateBusinessPartner();
  const updateM = useUpdateBusinessPartner();
  const archiveM = useArchiveBusinessPartner();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: BusinessPartnerDto) => { setEditId(p.id); setForm(toForm(p)); setOpen(true); };

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
        title="Companies We Work With"
        subtitle="Business Network — partner organisations, agreements and contacts"
        actions={canManage ? <Btn icon={Plus} onClick={openNew}>Add company</Btn> : undefined}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <div className="[&_input]:pl-9"><TextInput placeholder="Search name / contact / country" value={q} onChange={setQ} /></div>
        </div>
        <div className="w-48"><SelectInput value={type} onChange={setType} options={typeOpts} /></div>
        <div className="w-44"><SelectInput value={status} onChange={setStatus} options={statusFilterOpts} /></div>
      </div>

      <SectionCard noPad>
        {listQ.isError ? (
          <div className="p-4"><ErrorBanner message="Failed to load companies." onRetry={() => listQ.refetch()} /></div>
        ) : listQ.isLoading ? (
          <div className="py-10 text-center text-slate-400 text-sm">Loading companies…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No companies yet" desc={canManage ? "Add the airlines, hotels, transport, visa and manpower partners you work with." : "No companies match your filters."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Code</th>
                  <th className="px-4 py-3 font-bold">Company</th>
                  <th className="px-4 py-3 font-bold">Type</th>
                  <th className="px-4 py-3 font-bold">Country</th>
                  <th className="px-4 py-3 font-bold">Contact</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  {canManage && <th className="px-4 py-3 font-bold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-500">{p.code}</td>
                    <td className="px-4 py-3 font-semibold text-[#002D62]">{p.name}{p.industry ? <span className="block text-[11px] font-normal text-slate-400">{p.industry}</span> : null}</td>
                    <td className="px-4 py-3 text-slate-600">{p.type || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.country || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.contactPerson || "—"}{p.phone ? <span className="block text-[11px] text-slate-400">{p.phone}</span> : null}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : p.status === "PROSPECT" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Btn size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(p)}>Edit</Btn>
                        <Btn size="sm" variant="ghost" icon={Archive} onClick={() => { if (confirm(`Archive ${p.name}?`)) archiveM.mutate(p.id); }}>Archive</Btn>
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
              <h3 className="font-bold text-[#002D62]">{editId ? "Edit company" : "Add company"}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {([
                ["name", "Company name *", "text"], ["industry", "Industry", "text"], ["country", "Country", "text"],
                ["contactPerson", "Contact person", "text"], ["phone", "Phone", "text"], ["whatsapp", "WhatsApp", "text"],
                ["email", "Email", "text"], ["website", "Website", "text"], ["services", "Services", "text"],
                ["contractRef", "Contract / reference", "text"], ["address", "Address", "text"], ["notes", "Notes", "text"],
              ] as const).map(([k, label, type]) => (
                <div key={k}>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{label}</label>
                  <TextInput type={type} value={form[k]} onChange={(v) => set(k, v)} />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Type</label>
                <SelectInput value={form.type} onChange={(v) => set("type", v)} options={typeFormOpts} />
              </div>
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

export default CompaniesModule;
