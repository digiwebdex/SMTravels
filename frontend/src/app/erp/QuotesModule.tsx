import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Ticket } from "lucide-react";
import { PageHeader, SectionCard, SelectInput, TextInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import { usePackages, useTransitionPackage, useConvertPackage, type PackageFilters } from "../hooks/customPackage";
import type { CustomPackageDto } from "@contracts/custom-package.contract";

const QUOTE_STATUSES = ["QUOTED", "ACCEPTED", "REJECTED", "EXPIRED", "BOOKED"];
const CLS: Record<string, string> = { QUOTED: "bg-violet-50 text-violet-700", ACCEPTED: "bg-amber-50 text-amber-700", REJECTED: "bg-red-50 text-red-700", EXPIRED: "bg-slate-200 text-slate-500", BOOKED: "bg-emerald-100 text-emerald-800" };
const money = (v: string) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusOpts = [{ value: "", label: "All quotes" }, ...QUOTE_STATUSES.map((s) => ({ value: s, label: s }))];

/** ERP → Packages → Quotes (Module 7). Custom packages in the quote lifecycle. */
export function QuotesModule() {
  const { can } = useAuth();
  const canManage = can("packages", "manage");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  // Only quote-lifecycle packages (QUOTED+). When no status filter, we still request all
  // and filter client-side to the quote statuses so DRAFTs don't appear as quotes.
  const filters: PackageFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, pageSize: 100 }), [q, status]);
  const listQ = usePackages(filters);
  const transitionM = useTransitionPackage();
  const convertM = useConvertPackage();

  const rows = (listQ.data?.items ?? []).filter((p: CustomPackageDto) => QUOTE_STATUSES.includes(p.status));
  const trans = (id: string, s: string, needReason = false) => { let reason: string | undefined; if (needReason) { const r = prompt("Reason?"); if (r === null) return; reason = r || undefined; } transitionM.mutate({ id, input: { status: s as "ACCEPTED", reason } }); };

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="Quotes" subtitle="Custom-package quotes — accept, reject, convert to booking" />
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[220px]"><TextInput placeholder="Search name / code" value={q} onChange={setQ} /></div>
        <div className="w-48"><SelectInput value={status} onChange={setStatus} options={statusOpts} /></div>
      </div>
      <SectionCard noPad>
        {listQ.isError ? <div className="p-4"><ErrorBanner message="Failed to load quotes." onRetry={() => listQ.refetch()} /></div>
          : listQ.isLoading ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          : rows.length === 0 ? <EmptyState title="No quotes yet" desc="Generate a quote from a custom package to see it here." />
          : (
            <div className="overflow-x-auto"><table className="w-full text-[13px]">
              <thead><tr className="text-left text-slate-500 border-b border-slate-200"><th className="px-4 py-3 font-bold">Code</th><th className="px-4 py-3 font-bold">Package</th><th className="px-4 py-3 font-bold">Validity</th><th className="px-4 py-3 font-bold text-right">Grand total</th><th className="px-4 py-3 font-bold">Status</th>{canManage && <th className="px-4 py-3 font-bold">Actions</th>}</tr></thead>
              <tbody>{rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-500">{p.code}</td>
                  <td className="px-4 py-3 font-semibold text-[#002D62]">{p.name}{p.customerName ? <span className="block text-[11px] font-normal text-slate-400">{p.customerName}</span> : null}</td>
                  <td className="px-4 py-3 text-slate-500">{p.validityDate || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{money(p.grandTotal)} {p.currency}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CLS[p.status] ?? "bg-slate-100"}`}>{p.status}</span></td>
                  {canManage && <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {p.status === "QUOTED" && <><Btn size="sm" variant="secondary" icon={CheckCircle2} onClick={() => trans(p.id, "ACCEPTED")}>Accept</Btn><Btn size="sm" variant="ghost" icon={XCircle} onClick={() => trans(p.id, "REJECTED", true)}>Reject</Btn></>}
                      {p.status === "ACCEPTED" && <Btn size="sm" variant="secondary" icon={Ticket} loading={convertM.isPending} onClick={() => { if (confirm("Convert to booking?")) convertM.mutate(p.id); }}>Convert to booking</Btn>}
                      {p.status === "BOOKED" && <span className="text-[11px] text-emerald-700">Booked</span>}
                    </div>
                  </td>}
                </tr>
              ))}</tbody>
            </table></div>
          )}
      </SectionCard>
    </div>
  );
}

export default QuotesModule;
