import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Archive, X } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import { useCandidates, useCreateCandidate, useUpdateCandidate, useArchiveCandidate, useJobOrders, type CandidateFilters } from "../hooks/manpower";
import type { CandidateDto } from "@contracts/manpower.contract";

const STATUSES = ["NEW", "SHORTLISTED", "SCREENING", "INTERVIEW", "SELECTED", "REJECTED", "CONTRACTED", "MEDICAL", "BMET", "VISA", "TICKETED", "DEPLOYED"];
export const CAND_STATUS_CLS: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-600", SHORTLISTED: "bg-sky-50 text-sky-700", SCREENING: "bg-blue-50 text-blue-700",
  INTERVIEW: "bg-indigo-50 text-indigo-700", SELECTED: "bg-emerald-50 text-emerald-700", REJECTED: "bg-red-50 text-red-700",
  CONTRACTED: "bg-teal-50 text-teal-700", MEDICAL: "bg-amber-50 text-amber-700", BMET: "bg-orange-50 text-orange-700",
  VISA: "bg-violet-50 text-violet-700", TICKETED: "bg-cyan-50 text-cyan-700", DEPLOYED: "bg-green-100 text-green-800",
};
const statusFilterOpts = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];

type Form = { jobOrderId: string; fullName: string; phone: string; email: string; gender: string; nationality: string; dob: string; passportNo: string; passportIssueDate: string; passportExpiry: string; nid: string; address: string; education: string; experience: string; skills: string; remarks: string };
const empty: Form = { jobOrderId: "", fullName: "", phone: "", email: "", gender: "", nationality: "", dob: "", passportNo: "", passportIssueDate: "", passportExpiry: "", nid: "", address: "", education: "", experience: "", skills: "", remarks: "" };
const toForm = (c: CandidateDto): Form => ({ jobOrderId: c.jobOrderId, fullName: c.fullName, phone: c.phone ?? "", email: c.email ?? "", gender: c.gender ?? "", nationality: c.nationality ?? "", dob: c.dob ?? "", passportNo: c.passportNo ?? "", passportIssueDate: c.passportIssueDate ?? "", passportExpiry: c.passportExpiry ?? "", nid: c.nid ?? "", address: c.address ?? "", education: c.education ?? "", experience: c.experience ?? "", skills: c.skills ?? "", remarks: c.remarks ?? "" });
const clean = (f: Form) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== "").map(([k, v]) => [k, v])) as Partial<Form>;

/** Manpower → Candidates (Module 6B). Candidate profiles linked to a Job Order + Employer. */
export function CandidatesModule() {
  const { can } = useAuth();
  const canManage = can("bookings", "manage");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filters: CandidateFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, pageSize: 100 }), [q, status]);
  const listQ = useCandidates(filters);
  const jobOrdersQ = useJobOrders({ pageSize: 100 });
  const createM = useCreateCandidate();
  const updateM = useUpdateCandidate();
  const archiveM = useArchiveCandidate();

  const jobOrderOpts = [{ value: "", label: "Select job order *" }, ...(jobOrdersQ.data?.items ?? []).map((j) => ({ value: j.id, label: `${j.jobTitle} — ${j.employerName} (${j.code})` }))];

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (c: CandidateDto) => { setEditId(c.id); setForm(toForm(c)); setOpen(true); };
  const save = () => {
    if (!form.fullName.trim() || (!editId && !form.jobOrderId)) return;
    if (editId) { const { jobOrderId: _drop, ...rest } = clean(form); void _drop; updateM.mutate({ id: editId, input: rest }, { onSuccess: () => setOpen(false) }); }
    else createM.mutate({ ...(clean(form) as { jobOrderId: string; fullName: string }) }, { onSuccess: () => setOpen(false) });
  };
  const rows = listQ.data?.items ?? [];

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="Candidates" subtitle="Manpower — candidate profiles (linked to Job Order → Employer)"
        actions={canManage ? <Btn icon={Plus} onClick={openNew} disabled={(jobOrdersQ.data?.items ?? []).length === 0}>Add candidate</Btn> : undefined} />
      {(jobOrdersQ.data?.items ?? []).length === 0 && !jobOrdersQ.isLoading && (
        <div className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">Create a job order first — candidates belong to a job order.</div>
      )}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><div className="[&_input]:pl-9"><TextInput placeholder="Search name / passport / phone" value={q} onChange={setQ} /></div></div>
        <div className="w-48"><SelectInput value={status} onChange={setStatus} options={statusFilterOpts} /></div>
      </div>

      <SectionCard noPad>
        {listQ.isError ? <div className="p-4"><ErrorBanner message="Failed to load candidates." onRetry={() => listQ.refetch()} /></div>
          : listQ.isLoading ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          : rows.length === 0 ? <EmptyState title="No candidates yet" desc={canManage ? "Add candidates against an open job order." : "No candidates."} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Code</th><th className="px-4 py-3 font-bold">Candidate</th><th className="px-4 py-3 font-bold">Job / Employer</th>
                  <th className="px-4 py-3 font-bold">Passport</th><th className="px-4 py-3 font-bold">Phone</th><th className="px-4 py-3 font-bold">Status</th>{canManage && <th className="px-4 py-3 text-right font-bold">Actions</th>}
                </tr></thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-500">{c.code}</td>
                      <td className="px-4 py-3 font-semibold text-[#002D62]">{c.fullName}{c.nationality ? <span className="block text-[11px] font-normal text-slate-400">{c.nationality}</span> : null}</td>
                      <td className="px-4 py-3 text-slate-600">{c.jobTitle}<span className="block text-[11px] text-slate-400">{c.employerName}</span></td>
                      <td className="px-4 py-3 font-mono text-slate-600">{c.passportNo || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{c.phone || "—"}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CAND_STATUS_CLS[c.status] ?? "bg-slate-100 text-slate-600"}`}>{c.status}</span></td>
                      {canManage && <td className="px-4 py-3 text-right whitespace-nowrap"><Btn size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(c)}>Edit</Btn><Btn size="sm" variant="ghost" icon={Archive} onClick={() => { if (confirm(`Archive ${c.fullName}?`)) archiveM.mutate(c.id); }}>Archive</Btn></td>}
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white"><h3 className="font-bold text-[#002D62]">{editId ? "Edit candidate" : "Add candidate"}</h3><button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
            <div className="p-5 space-y-3">
              {!editId && <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Job order *</label><SelectInput value={form.jobOrderId} onChange={(v) => set("jobOrderId", v)} options={jobOrderOpts} /></div>}
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Full name *</label><TextInput value={form.fullName} onChange={(v) => set("fullName", v)} /></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Gender</label><TextInput value={form.gender} onChange={(v) => set("gender", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">DOB</label><TextInput type="date" value={form.dob} onChange={(v) => set("dob", v)} /></div></div>
              {([["nationality", "Nationality"], ["passportNo", "Passport number"]] as const).map(([k, l]) => <div key={k}><label className="block text-[11px] font-bold text-slate-500 mb-1">{l}</label><TextInput value={form[k]} onChange={(v) => set(k, v)} /></div>)}
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Passport issue</label><TextInput type="date" value={form.passportIssueDate} onChange={(v) => set("passportIssueDate", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Passport expiry</label><TextInput type="date" value={form.passportExpiry} onChange={(v) => set("passportExpiry", v)} /></div></div>
              {([["nid", "NID"], ["phone", "Phone"], ["email", "Email"], ["address", "Address"], ["education", "Education"], ["experience", "Experience"], ["skills", "Skills"], ["remarks", "Remarks"]] as const).map(([k, l]) => <div key={k}><label className="block text-[11px] font-bold text-slate-500 mb-1">{l}</label><TextInput value={form[k]} onChange={(v) => set(k, v)} /></div>)}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 sticky bottom-0 bg-white"><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn disabled={!form.fullName.trim() || (!editId && !form.jobOrderId)} loading={createM.isPending || updateM.isPending} onClick={save}>{editId ? "Save changes" : "Create"}</Btn></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidatesModule;
