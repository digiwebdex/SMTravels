import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Archive, X } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import { useVisaList, useCreateVisa, useUpdateVisa, useArchiveVisa, type StageFilters } from "../hooks/manpowerStages";
import { useCandidates } from "../hooks/manpower";
import type { ManpowerVisaDto, VisaCreateInput, VisaUpdateInput } from "@contracts/manpower-stages.contract";

const STATUSES = ["PENDING", "SUBMITTED", "PROCESSING", "APPROVED", "REJECTED", "EXPIRED"];
const CLS: Record<string, string> = { PENDING: "bg-slate-100 text-slate-600", SUBMITTED: "bg-blue-50 text-blue-700", PROCESSING: "bg-indigo-50 text-indigo-700", APPROVED: "bg-emerald-50 text-emerald-700", REJECTED: "bg-red-50 text-red-700", EXPIRED: "bg-amber-50 text-amber-700" };
const CAND_OK = ["BMET", "VISA", "TICKETED", "DEPLOYED"];
const statusFilterOpts = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const statusFormOpts = STATUSES.map((s) => ({ value: s, label: s }));

type Form = { candidateId: string; visaNumber: string; visaType: string; sponsor: string; issueDate: string; expiryDate: string; documentRef: string; remarks: string; status: string };
const empty: Form = { candidateId: "", visaNumber: "", visaType: "", sponsor: "", issueDate: "", expiryDate: "", documentRef: "", remarks: "", status: "PENDING" };
const toForm = (v: ManpowerVisaDto): Form => ({ candidateId: v.candidateId, visaNumber: v.visaNumber ?? "", visaType: v.visaType ?? "", sponsor: v.sponsor ?? "", issueDate: v.issueDate ?? "", expiryDate: v.expiryDate ?? "", documentRef: v.documentRef ?? "", remarks: v.remarks ?? "", status: v.status });

/** Manpower → Visa (Module 6B-3). One visa record per candidate, PENDING→…→APPROVED/REJECTED. */
export function VisaModule() {
  const { can } = useAuth();
  const canManage = can("bookings", "manage");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filters: StageFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, pageSize: 100 }), [q, status]);
  const listQ = useVisaList(filters);
  const candQ = useCandidates({ pageSize: 100 });
  const createM = useCreateVisa();
  const updateM = useUpdateVisa();
  const archiveM = useArchiveVisa();

  const candOpts = [{ value: "", label: "Select candidate *" }, ...(candQ.data?.items ?? []).filter((c) => CAND_OK.includes(c.status)).map((c) => ({ value: c.id, label: `${c.fullName} (${c.code}) — ${c.jobTitle}` }))];

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (v: ManpowerVisaDto) => { setEditId(v.id); setForm(toForm(v)); setOpen(true); };
  const save = () => {
    if (!editId && !form.candidateId) return;
    const body: Record<string, string> = {};
    for (const k of ["visaNumber", "visaType", "sponsor", "issueDate", "expiryDate", "documentRef", "remarks"] as const) if (form[k]) body[k] = form[k];
    if (editId) updateM.mutate({ id: editId, input: { ...body, status: form.status as VisaUpdateInput["status"] } }, { onSuccess: () => setOpen(false) });
    else createM.mutate({ candidateId: form.candidateId, ...body } as VisaCreateInput, { onSuccess: () => setOpen(false) });
  };
  const rows = listQ.data?.items ?? [];

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="Manpower Visa" subtitle="Manpower — candidate work-visa processing"
        actions={canManage ? <Btn icon={Plus} onClick={openNew} disabled={candOpts.length <= 1}>Add visa</Btn> : undefined} />
      {candOpts.length <= 1 && !candQ.isLoading && <div className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">No candidates have reached the BMET stage yet.</div>}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><div className="[&_input]:pl-9"><TextInput placeholder="Search candidate / visa no / code" value={q} onChange={setQ} /></div></div>
        <div className="w-48"><SelectInput value={status} onChange={setStatus} options={statusFilterOpts} /></div>
      </div>

      <SectionCard noPad>
        {listQ.isError ? <div className="p-4"><ErrorBanner message="Failed to load visa records." onRetry={() => listQ.refetch()} /></div>
          : listQ.isLoading ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          : rows.length === 0 ? <EmptyState title="No visa records" desc={canManage ? "Add a visa record for a candidate who has cleared BMET." : "No records."} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Code</th><th className="px-4 py-3 font-bold">Candidate</th><th className="px-4 py-3 font-bold">Visa no.</th>
                  <th className="px-4 py-3 font-bold">Type</th><th className="px-4 py-3 font-bold">Expiry</th><th className="px-4 py-3 font-bold">Status</th>{canManage && <th className="px-4 py-3 text-right font-bold">Actions</th>}
                </tr></thead>
                <tbody>
                  {rows.map((v) => (
                    <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-500">{v.code}</td>
                      <td className="px-4 py-3 font-semibold text-[#002D62]">{v.candidateName}<span className="block text-[11px] font-normal text-slate-400">{v.jobTitle} · {v.employerName}</span></td>
                      <td className="px-4 py-3 font-mono text-slate-600">{v.visaNumber || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{v.visaType || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{v.expiryDate || "—"}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CLS[v.status] ?? "bg-slate-100 text-slate-600"}`}>{v.status}</span></td>
                      {canManage && <td className="px-4 py-3 text-right whitespace-nowrap"><Btn size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(v)}>Edit</Btn><Btn size="sm" variant="ghost" icon={Archive} onClick={() => { if (confirm(`Archive ${v.code}?`)) archiveM.mutate(v.id); }}>Archive</Btn></td>}
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white"><h3 className="font-bold text-[#002D62]">{editId ? "Edit visa" : "Add visa"}</h3><button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
            <div className="p-5 space-y-3">
              {!editId && <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Candidate *</label><SelectInput value={form.candidateId} onChange={(v) => set("candidateId", v)} options={candOpts} /></div>}
              {([["visaNumber", "Visa number"], ["visaType", "Visa type"], ["sponsor", "Sponsor / employer"]] as const).map(([k, l]) => <div key={k}><label className="block text-[11px] font-bold text-slate-500 mb-1">{l}</label><TextInput value={form[k]} onChange={(val) => set(k, val)} /></div>)}
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Issue date</label><TextInput type="date" value={form.issueDate} onChange={(v) => set("issueDate", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Expiry</label><TextInput type="date" value={form.expiryDate} onChange={(v) => set("expiryDate", v)} /></div></div>
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Document reference</label><TextInput value={form.documentRef} onChange={(v) => set("documentRef", v)} /></div>
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Remarks</label><TextInput value={form.remarks} onChange={(v) => set("remarks", v)} /></div>
              {editId && <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label><SelectInput value={form.status} onChange={(v) => set("status", v)} options={statusFormOpts} /></div>}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 sticky bottom-0 bg-white"><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn disabled={!editId && !form.candidateId} loading={createM.isPending || updateM.isPending} onClick={save}>{editId ? "Save changes" : "Create"}</Btn></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisaModule;
