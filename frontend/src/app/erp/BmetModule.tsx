import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Archive, X } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import { useBmetList, useCreateBmet, useUpdateBmet, useArchiveBmet, type StageFilters } from "../hooks/manpowerStages";
import { useCandidates } from "../hooks/manpower";
import type { BmetDto, BmetCreateInput, BmetUpdateInput } from "@contracts/manpower-stages.contract";

const STATUSES = ["PENDING", "REGISTERED", "PROCESSING", "CLEARED", "REJECTED", "EXPIRED"];
const CLS: Record<string, string> = { PENDING: "bg-slate-100 text-slate-600", REGISTERED: "bg-blue-50 text-blue-700", PROCESSING: "bg-indigo-50 text-indigo-700", CLEARED: "bg-emerald-50 text-emerald-700", REJECTED: "bg-red-50 text-red-700", EXPIRED: "bg-amber-50 text-amber-700" };
const CAND_OK = ["MEDICAL", "BMET", "VISA", "TICKETED", "DEPLOYED"];
const statusFilterOpts = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const statusFormOpts = STATUSES.map((s) => ({ value: s, label: s }));

type Form = { candidateId: string; registrationNo: string; registrationDate: string; clearanceNo: string; clearanceDate: string; expiryDate: string; documentRef: string; remarks: string; status: string };
const empty: Form = { candidateId: "", registrationNo: "", registrationDate: "", clearanceNo: "", clearanceDate: "", expiryDate: "", documentRef: "", remarks: "", status: "PENDING" };
const toForm = (b: BmetDto): Form => ({ candidateId: b.candidateId, registrationNo: b.registrationNo ?? "", registrationDate: b.registrationDate ?? "", clearanceNo: b.clearanceNo ?? "", clearanceDate: b.clearanceDate ?? "", expiryDate: b.expiryDate ?? "", documentRef: b.documentRef ?? "", remarks: b.remarks ?? "", status: b.status });

/** Manpower → BMET (Module 6B-2). One BMET record per candidate, PENDING→…→CLEARED/REJECTED. */
export function BmetModule() {
  const { can } = useAuth();
  const canManage = can("bookings", "manage");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filters: StageFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, pageSize: 100 }), [q, status]);
  const listQ = useBmetList(filters);
  const candQ = useCandidates({ pageSize: 100 });
  const createM = useCreateBmet();
  const updateM = useUpdateBmet();
  const archiveM = useArchiveBmet();

  const candOpts = [{ value: "", label: "Select candidate *" }, ...(candQ.data?.items ?? []).filter((c) => CAND_OK.includes(c.status)).map((c) => ({ value: c.id, label: `${c.fullName} (${c.code}) — ${c.jobTitle}` }))];

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (b: BmetDto) => { setEditId(b.id); setForm(toForm(b)); setOpen(true); };
  const save = () => {
    if (!editId && !form.candidateId) return;
    const body: Record<string, string> = {};
    for (const k of ["registrationNo", "registrationDate", "clearanceNo", "clearanceDate", "expiryDate", "documentRef", "remarks"] as const) if (form[k]) body[k] = form[k];
    if (editId) updateM.mutate({ id: editId, input: { ...body, status: form.status as BmetUpdateInput["status"] } }, { onSuccess: () => setOpen(false) });
    else createM.mutate({ candidateId: form.candidateId, ...body } as BmetCreateInput, { onSuccess: () => setOpen(false) });
  };
  const rows = listQ.data?.items ?? [];

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="BMET Clearance" subtitle="Manpower — BMET registration & clearance"
        actions={canManage ? <Btn icon={Plus} onClick={openNew} disabled={candOpts.length <= 1}>Add BMET</Btn> : undefined} />
      {candOpts.length <= 1 && !candQ.isLoading && <div className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">No candidates have reached the medical stage yet.</div>}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><div className="[&_input]:pl-9"><TextInput placeholder="Search candidate / registration / code" value={q} onChange={setQ} /></div></div>
        <div className="w-48"><SelectInput value={status} onChange={setStatus} options={statusFilterOpts} /></div>
      </div>

      <SectionCard noPad>
        {listQ.isError ? <div className="p-4"><ErrorBanner message="Failed to load BMET records." onRetry={() => listQ.refetch()} /></div>
          : listQ.isLoading ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          : rows.length === 0 ? <EmptyState title="No BMET records" desc={canManage ? "Add a BMET record for a candidate who has cleared medical." : "No records."} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Code</th><th className="px-4 py-3 font-bold">Candidate</th><th className="px-4 py-3 font-bold">Registration</th>
                  <th className="px-4 py-3 font-bold">Clearance</th><th className="px-4 py-3 font-bold">Expiry</th><th className="px-4 py-3 font-bold">Status</th>{canManage && <th className="px-4 py-3 text-right font-bold">Actions</th>}
                </tr></thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-500">{b.code}</td>
                      <td className="px-4 py-3 font-semibold text-[#002D62]">{b.candidateName}<span className="block text-[11px] font-normal text-slate-400">{b.jobTitle} · {b.employerName}</span></td>
                      <td className="px-4 py-3 font-mono text-slate-600">{b.registrationNo || "—"}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{b.clearanceNo || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{b.expiryDate || "—"}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CLS[b.status] ?? "bg-slate-100 text-slate-600"}`}>{b.status}</span></td>
                      {canManage && <td className="px-4 py-3 text-right whitespace-nowrap"><Btn size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(b)}>Edit</Btn><Btn size="sm" variant="ghost" icon={Archive} onClick={() => { if (confirm(`Archive ${b.code}?`)) archiveM.mutate(b.id); }}>Archive</Btn></td>}
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white"><h3 className="font-bold text-[#002D62]">{editId ? "Edit BMET" : "Add BMET"}</h3><button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
            <div className="p-5 space-y-3">
              {!editId && <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Candidate *</label><SelectInput value={form.candidateId} onChange={(v) => set("candidateId", v)} options={candOpts} /></div>}
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Registration no.</label><TextInput value={form.registrationNo} onChange={(v) => set("registrationNo", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Registration date</label><TextInput type="date" value={form.registrationDate} onChange={(v) => set("registrationDate", v)} /></div></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Clearance no.</label><TextInput value={form.clearanceNo} onChange={(v) => set("clearanceNo", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Clearance date</label><TextInput type="date" value={form.clearanceDate} onChange={(v) => set("clearanceDate", v)} /></div></div>
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Expiry</label><TextInput type="date" value={form.expiryDate} onChange={(v) => set("expiryDate", v)} /></div>
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

export default BmetModule;
