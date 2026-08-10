import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Archive, X } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import { useDeploymentList, useCreateDeployment, useUpdateDeployment, useArchiveDeployment, type StageFilters } from "../hooks/manpowerStages";
import { useCandidates } from "../hooks/manpower";
import type { ManpowerDeploymentDto, DeploymentCreateInput, DeploymentUpdateInput } from "@contracts/manpower-stages.contract";

const STATUSES = ["PENDING", "TICKETED", "READY", "DEPARTED", "DEPLOYED", "CANCELLED"];
const CLS: Record<string, string> = { PENDING: "bg-slate-100 text-slate-600", TICKETED: "bg-cyan-50 text-cyan-700", READY: "bg-blue-50 text-blue-700", DEPARTED: "bg-indigo-50 text-indigo-700", DEPLOYED: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-red-50 text-red-700" };
const CAND_OK = ["VISA", "TICKETED", "DEPLOYED"];
const statusFilterOpts = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const statusFormOpts = STATUSES.map((s) => ({ value: s, label: s }));

type Form = { candidateId: string; ticketRef: string; flightNo: string; departureAirport: string; destination: string; departureDate: string; arrivalDate: string; remarks: string; status: string };
const empty: Form = { candidateId: "", ticketRef: "", flightNo: "", departureAirport: "", destination: "", departureDate: "", arrivalDate: "", remarks: "", status: "PENDING" };
const toForm = (d: ManpowerDeploymentDto): Form => ({ candidateId: d.candidateId, ticketRef: d.ticketRef ?? "", flightNo: d.flightNo ?? "", departureAirport: d.departureAirport ?? "", destination: d.destination ?? "", departureDate: d.departureDate ?? "", arrivalDate: d.arrivalDate ?? "", remarks: d.remarks ?? "", status: d.status });

/** Manpower → Deployment (Module 6B-3). One deployment per candidate (needs APPROVED visa),
 *  PENDING→TICKETED→READY→DEPARTED→DEPLOYED/CANCELLED. */
export function DeploymentModule() {
  const { can } = useAuth();
  const canManage = can("bookings", "manage");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filters: StageFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, pageSize: 100 }), [q, status]);
  const listQ = useDeploymentList(filters);
  const candQ = useCandidates({ pageSize: 100 });
  const createM = useCreateDeployment();
  const updateM = useUpdateDeployment();
  const archiveM = useArchiveDeployment();

  const candOpts = [{ value: "", label: "Select candidate *" }, ...(candQ.data?.items ?? []).filter((c) => CAND_OK.includes(c.status)).map((c) => ({ value: c.id, label: `${c.fullName} (${c.code}) — ${c.jobTitle}` }))];

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (d: ManpowerDeploymentDto) => { setEditId(d.id); setForm(toForm(d)); setOpen(true); };
  const save = () => {
    if (!editId && !form.candidateId) return;
    const body: Record<string, string> = {};
    for (const k of ["ticketRef", "flightNo", "departureAirport", "destination", "departureDate", "arrivalDate", "remarks"] as const) if (form[k]) body[k] = form[k];
    if (editId) updateM.mutate({ id: editId, input: { ...body, status: form.status as DeploymentUpdateInput["status"] } }, { onSuccess: () => setOpen(false) });
    else createM.mutate({ candidateId: form.candidateId, ...body } as DeploymentCreateInput, { onSuccess: () => setOpen(false) });
  };
  const rows = listQ.data?.items ?? [];

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="Deployment" subtitle="Manpower — final ticketing & deployment"
        actions={canManage ? <Btn icon={Plus} onClick={openNew} disabled={candOpts.length <= 1}>Add deployment</Btn> : undefined} />
      {candOpts.length <= 1 && !candQ.isLoading && <div className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">No candidates with an approved visa yet.</div>}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><div className="[&_input]:pl-9"><TextInput placeholder="Search candidate / ticket / code" value={q} onChange={setQ} /></div></div>
        <div className="w-48"><SelectInput value={status} onChange={setStatus} options={statusFilterOpts} /></div>
      </div>

      <SectionCard noPad>
        {listQ.isError ? <div className="p-4"><ErrorBanner message="Failed to load deployments." onRetry={() => listQ.refetch()} /></div>
          : listQ.isLoading ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          : rows.length === 0 ? <EmptyState title="No deployments" desc={canManage ? "Add a deployment for a candidate with an approved visa." : "No records."} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Code</th><th className="px-4 py-3 font-bold">Candidate</th><th className="px-4 py-3 font-bold">Ticket</th>
                  <th className="px-4 py-3 font-bold">Destination</th><th className="px-4 py-3 font-bold">Departure</th><th className="px-4 py-3 font-bold">Status</th>{canManage && <th className="px-4 py-3 text-right font-bold">Actions</th>}
                </tr></thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-500">{d.code}</td>
                      <td className="px-4 py-3 font-semibold text-[#002D62]">{d.candidateName}<span className="block text-[11px] font-normal text-slate-400">{d.jobTitle} · {d.employerName}</span></td>
                      <td className="px-4 py-3 font-mono text-slate-600">{d.ticketRef || "—"}{d.flightNo ? <span className="block text-[11px] text-slate-400">{d.flightNo}</span> : null}</td>
                      <td className="px-4 py-3 text-slate-600">{d.destination || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{d.departureDate || "—"}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CLS[d.status] ?? "bg-slate-100 text-slate-600"}`}>{d.status}</span></td>
                      {canManage && <td className="px-4 py-3 text-right whitespace-nowrap"><Btn size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(d)}>Edit</Btn><Btn size="sm" variant="ghost" icon={Archive} onClick={() => { if (confirm(`Archive ${d.code}?`)) archiveM.mutate(d.id); }}>Archive</Btn></td>}
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white"><h3 className="font-bold text-[#002D62]">{editId ? "Edit deployment" : "Add deployment"}</h3><button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
            <div className="p-5 space-y-3">
              {!editId && <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Candidate *</label><SelectInput value={form.candidateId} onChange={(v) => set("candidateId", v)} options={candOpts} /></div>}
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Ticket / reference</label><TextInput value={form.ticketRef} onChange={(v) => set("ticketRef", v)} /></div><div className="w-32"><label className="block text-[11px] font-bold text-slate-500 mb-1">Flight no.</label><TextInput value={form.flightNo} onChange={(v) => set("flightNo", v)} /></div></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Departure airport</label><TextInput value={form.departureAirport} onChange={(v) => set("departureAirport", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Destination</label><TextInput value={form.destination} onChange={(v) => set("destination", v)} /></div></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Departure date</label><TextInput type="date" value={form.departureDate} onChange={(v) => set("departureDate", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Arrival date</label><TextInput type="date" value={form.arrivalDate} onChange={(v) => set("arrivalDate", v)} /></div></div>
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

export default DeploymentModule;
