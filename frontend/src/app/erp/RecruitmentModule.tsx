import { useState } from "react";
import { PageHeader, SectionCard, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import { useJobOrders, useJobOrderPipeline, useTransitionCandidate } from "../hooks/manpower";
import { CAND_STATUS_CLS } from "./CandidatesModule";
import type { CandidateDto, CandidateTransitionInput } from "@contracts/manpower.contract";

// Recruitment next-step buttons per status (mirrors backend TRANSITIONS).
const NEXT: Record<string, { to: string; label: string }[]> = {
  NEW: [{ to: "SHORTLISTED", label: "Shortlist" }, { to: "SCREENING", label: "Screen" }, { to: "REJECTED", label: "Reject" }],
  SHORTLISTED: [{ to: "SCREENING", label: "Screen" }, { to: "INTERVIEW", label: "Interview" }, { to: "REJECTED", label: "Reject" }],
  SCREENING: [{ to: "INTERVIEW", label: "Interview" }, { to: "SELECTED", label: "Select" }, { to: "REJECTED", label: "Reject" }],
  INTERVIEW: [{ to: "SELECTED", label: "Select" }, { to: "REJECTED", label: "Reject" }],
  SELECTED: [{ to: "CONTRACTED", label: "Contract" }, { to: "REJECTED", label: "Reject" }],
  CONTRACTED: [{ to: "MEDICAL", label: "Send to Medical" }],
  REJECTED: [{ to: "SHORTLISTED", label: "Restore" }],
};

/** Manpower → Recruitment (Module 6B). Per job-order pipeline with quantity tracking
 *  and lifecycle transitions (NEW→SCREENING→INTERVIEW→SELECTED/REJECTED→CONTRACTED). */
export function RecruitmentModule() {
  const { can } = useAuth();
  const canManage = can("bookings", "manage");
  const jobOrdersQ = useJobOrders({ pageSize: 100 });
  const [jobOrderId, setJobOrderId] = useState("");
  const pipeQ = useJobOrderPipeline(jobOrderId || null);
  const transition = useTransitionCandidate();

  const joOpts = [{ value: "", label: "Select a job order…" }, ...(jobOrdersQ.data?.items ?? []).map((j) => ({ value: j.id, label: `${j.jobTitle} — ${j.employerName} (${j.code})` }))];

  const act = (c: CandidateDto, to: string) => {
    let reason: string | undefined;
    if (to === "REJECTED") { const r = prompt(`Reject ${c.fullName} — reason?`); if (r === null) return; reason = r || undefined; }
    transition.mutate({ id: c.id, input: { status: to as CandidateTransitionInput["status"], reason } });
  };

  const p = pipeQ.data;
  const pct = p && p.required > 0 ? Math.min(100, Math.round((p.selected / p.required) * 100)) : 0;

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="Recruitment" subtitle="Manpower — candidate pipeline & selection per job order" />
      <div className="w-full md:w-[28rem]"><SelectInput value={jobOrderId} onChange={setJobOrderId} options={joOpts} /></div>

      {!jobOrderId ? (
        <SectionCard><EmptyState title="Select a job order" desc="Pick a job order to see its recruitment pipeline and selection progress." /></SectionCard>
      ) : pipeQ.isError ? (
        <ErrorBanner message="Failed to load pipeline." onRetry={() => pipeQ.refetch()} />
      ) : pipeQ.isLoading || !p ? (
        <div className="py-10 text-center text-slate-400 text-sm">Loading pipeline…</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[["Required", p.required], ["Selected", p.selected], ["Remaining", p.remaining]].map(([k, v]) => (
              <div key={k} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase">{k}</div>
                <div className="text-2xl font-bold text-[#002D62]">{v}</div>
              </div>
            ))}
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#1B75BC] transition-all" style={{ width: `${pct}%` }} />
          </div>

          <SectionCard title={`${p.jobOrder.jobTitle} · ${p.jobOrder.employerName}`} subtitle={`${p.jobOrder.code} — ${p.candidates.length} candidate(s)`} noPad>
            {p.candidates.length === 0 ? (
              <EmptyState title="No candidates on this job order" desc="Add candidates from the Candidates screen, then move them through the pipeline here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-3 font-bold">Candidate</th><th className="px-4 py-3 font-bold">Passport</th><th className="px-4 py-3 font-bold">Status</th>{canManage && <th className="px-4 py-3 font-bold">Actions</th>}
                  </tr></thead>
                  <tbody>
                    {p.candidates.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-[#002D62]">{c.fullName}<span className="block text-[11px] font-mono font-normal text-slate-400">{c.code}</span>{c.status === "REJECTED" && c.rejectionReason ? <span className="block text-[11px] text-red-500">Reason: {c.rejectionReason}</span> : null}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{c.passportNo || "—"}</td>
                        <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CAND_STATUS_CLS[c.status] ?? "bg-slate-100 text-slate-600"}`}>{c.status}</span></td>
                        {canManage && (
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {(NEXT[c.status] ?? []).map((n) => (
                                <Btn key={n.to} size="sm" variant={n.to === "REJECTED" ? "ghost" : "secondary"} loading={transition.isPending} onClick={() => act(c, n.to)}>{n.label}</Btn>
                              ))}
                              {(NEXT[c.status] ?? []).length === 0 && <span className="text-[11px] text-slate-400">Handed off to {c.status.toLowerCase()} stage</span>}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

export default RecruitmentModule;
