import { useState } from "react";
import { Plus, ArrowLeft, Calculator, CheckCircle2, Wallet, Lock, X } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import {
  usePayrollRuns, usePayrollRun, useCreatePayrollRun, useCalculatePayrollRun,
  useApprovePayrollRun, useMarkPayrollRunPaid, useClosePayrollRun, useUpdatePayslip,
} from "../hooks/payroll";
import type { PayslipDto } from "@contracts/payroll.contract";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_CLS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600", CALCULATED: "bg-blue-50 text-blue-700",
  APPROVED: "bg-amber-50 text-amber-700", PAID: "bg-emerald-50 text-emerald-700", CLOSED: "bg-slate-200 text-slate-500",
};
const money = (v: string) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const EDITABLE_FIELDS = ["basic", "allowances", "bonus", "overtime", "deductions", "advance", "loan"] as const;

function StatusPill({ s }: { s: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLS[s] ?? "bg-slate-100 text-slate-600"}`}>{s}</span>;
}

/** HR → Payroll (Module 5). Runs list + create + run detail with editable payslips
 *  and the DRAFT→CALCULATED→APPROVED→PAID→CLOSED workflow. Gated on "settings". */
export function PayrollModule() {
  const { can } = useAuth();
  const canManage = can("settings", "manage");
  const [selected, setSelected] = useState<string | null>(null);
  if (selected) return <RunDetail id={selected} canManage={canManage} onBack={() => setSelected(null)} />;
  return <RunList canManage={canManage} onOpen={setSelected} />;
}

function RunList({ canManage, onOpen }: { canManage: boolean; onOpen: (id: string) => void }) {
  const [status, setStatus] = useState("");
  const runsQ = usePayrollRuns(status || undefined);
  const createM = useCreatePayrollRun();
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(String(now.getUTCMonth() + 1));
  const [year, setYear] = useState(String(now.getUTCFullYear()));
  const [label, setLabel] = useState("");

  const runs = runsQ.data?.runs ?? [];
  const statusOpts = [{ value: "", label: "All statuses" }, ...["DRAFT", "CALCULATED", "APPROVED", "PAID", "CLOSED"].map((s) => ({ value: s, label: s }))];
  const monthOpts = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));

  const create = () => createM.mutate(
    { periodMonth: Number(month), periodYear: Number(year), label: label.trim() || undefined },
    { onSuccess: (d) => { setOpen(false); setLabel(""); onOpen(d.id); } },
  );

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="Payroll" subtitle="Monthly payroll runs & payslips"
        actions={canManage ? <Btn icon={Plus} onClick={() => setOpen(true)}>New payroll run</Btn> : undefined} />
      <div className="w-48"><SelectInput value={status} onChange={setStatus} options={statusOpts} /></div>

      <SectionCard noPad>
        {runsQ.isError ? <div className="p-4"><ErrorBanner message="Failed to load payroll runs." onRetry={() => runsQ.refetch()} /></div>
          : runsQ.isLoading ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          : runs.length === 0 ? <EmptyState title="No payroll runs yet" desc={canManage ? "Create a monthly payroll run, then calculate payslips for active employees." : "No payroll runs."} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Run</th><th className="px-4 py-3 font-bold">Period</th>
                  <th className="px-4 py-3 font-bold">Employees</th><th className="px-4 py-3 font-bold text-right">Gross</th>
                  <th className="px-4 py-3 font-bold text-right">Net</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3" />
                </tr></thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => onOpen(r.id)}>
                      <td className="px-4 py-3 font-mono text-slate-500">{r.code}{r.label ? <span className="block text-[11px] text-slate-400 font-sans">{r.label}</span> : null}</td>
                      <td className="px-4 py-3 text-slate-600">{MONTHS[r.periodMonth - 1]} {r.periodYear}</td>
                      <td className="px-4 py-3 text-slate-600">{r.payslipCount}</td>
                      <td className="px-4 py-3 text-right font-mono">{money(r.grossTotal)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#002D62]">{money(r.netTotal)}</td>
                      <td className="px-4 py-3"><StatusPill s={r.status} /></td>
                      <td className="px-4 py-3 text-right"><Btn size="sm" variant="ghost" onClick={() => onOpen(r.id)}>Open</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </SectionCard>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-bold text-[#002D62]">New payroll run</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Month</label><SelectInput value={month} onChange={setMonth} options={monthOpts} /></div>
                <div className="w-28"><label className="block text-[11px] font-bold text-slate-500 mb-1">Year</label><TextInput type="number" value={year} onChange={setYear} /></div>
              </div>
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Label (optional)</label><TextInput value={label} onChange={setLabel} placeholder="e.g. August salary" /></div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200">
              <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
              <Btn loading={createM.isPending} onClick={create}>Create</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RunDetail({ id, canManage, onBack }: { id: string; canManage: boolean; onBack: () => void }) {
  const runQ = usePayrollRun(id);
  const calcM = useCalculatePayrollRun();
  const approveM = useApprovePayrollRun();
  const payM = useMarkPayrollRunPaid();
  const closeM = useClosePayrollRun();
  const updateSlip = useUpdatePayslip();

  const run = runQ.data;
  const editable = canManage && (run?.status === "DRAFT" || run?.status === "CALCULATED");

  const saveField = (slip: PayslipDto, field: (typeof EDITABLE_FIELDS)[number], raw: string) => {
    const v = Number(raw);
    if (!Number.isFinite(v) || v < 0 || String(v) === slip[field]) return;
    updateSlip.mutate({ id: slip.id, input: { [field]: v } });
  };

  return (
    <div className="p-5 md:p-7 space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back to payroll</button>

      {runQ.isError ? <ErrorBanner message="Failed to load run." onRetry={() => runQ.refetch()} />
        : runQ.isLoading || !run ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
        : (
          <>
            <PageHeader title={`${MONTHS[run.periodMonth - 1]} ${run.periodYear} payroll`} subtitle={`${run.code}${run.label ? ` · ${run.label}` : ""}`}
              badge={undefined}
              actions={
                <div className="flex items-center gap-2">
                  <StatusPill s={run.status} />
                  {canManage && (run.status === "DRAFT" || run.status === "CALCULATED") && <Btn icon={Calculator} loading={calcM.isPending} onClick={() => calcM.mutate(id)}>{run.status === "DRAFT" ? "Calculate" : "Recalculate"}</Btn>}
                  {canManage && run.status === "CALCULATED" && <Btn icon={CheckCircle2} loading={approveM.isPending} onClick={() => approveM.mutate(id)}>Approve</Btn>}
                  {canManage && run.status === "APPROVED" && <Btn icon={Wallet} loading={payM.isPending} onClick={() => { if (confirm("Mark this payroll as paid?")) payM.mutate(id); }}>Mark paid</Btn>}
                  {canManage && run.status === "PAID" && <Btn icon={Lock} loading={closeM.isPending} onClick={() => closeM.mutate(id)}>Close</Btn>}
                </div>
              } />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[["Employees", String(run.payslipCount)], ["Gross", money(run.grossTotal)], ["Deductions", money(run.deductionTotal)], ["Net payable", money(run.netTotal)]].map(([k, v]) => (
                <div key={k} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">{k}</div>
                  <div className="text-lg font-bold text-[#002D62]">{v}</div>
                </div>
              ))}
            </div>

            <SectionCard title="Payslips" subtitle={editable ? "Edit amounts inline — gross/net recalculate on save." : "Locked after approval."} noPad>
              {run.payslips.length === 0 ? (
                <EmptyState title="No payslips" desc={canManage ? "Click Calculate to generate payslips for active employees." : "Not calculated yet."} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead><tr className="text-left text-slate-500 border-b border-slate-200 whitespace-nowrap">
                      <th className="px-3 py-2 font-bold">Employee</th>
                      {["Basic", "Allow.", "Bonus", "OT", "Deduct", "Advance", "Loan"].map((h) => <th key={h} className="px-2 py-2 font-bold text-right">{h}</th>)}
                      <th className="px-3 py-2 font-bold text-right">Gross</th><th className="px-3 py-2 font-bold text-right">Net</th><th className="px-3 py-2 font-bold">Paid</th>
                    </tr></thead>
                    <tbody>
                      {run.payslips.map((s) => (
                        <tr key={s.id} className="border-b border-slate-100">
                          <td className="px-3 py-2 font-semibold text-[#002D62] whitespace-nowrap">{s.employeeName}{s.employeeCode ? <span className="block text-[10px] font-mono font-normal text-slate-400">{s.employeeCode}</span> : null}</td>
                          {EDITABLE_FIELDS.map((f) => (
                            <td key={f} className="px-1 py-1 text-right">
                              {editable ? (
                                <input type="number" min={0} defaultValue={s[f]} onBlur={(e) => saveField(s, f, e.target.value)}
                                  className="w-20 px-2 py-1 text-right rounded border border-slate-200 focus:border-[#1B75BC] outline-none font-mono" />
                              ) : <span className="font-mono px-2">{money(s[f])}</span>}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right font-mono font-semibold">{money(s.gross)}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-[#002D62]">{money(s.net)}</td>
                          <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${s.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{s.paymentStatus}</span></td>
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

export default PayrollModule;
