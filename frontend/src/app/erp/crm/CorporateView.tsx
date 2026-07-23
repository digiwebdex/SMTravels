import { useState, useEffect } from "react";
import { Search, Plus, Building2, Edit3, FileText, Package, Phone, Mail, User, MapPin } from "lucide-react";
import { cn } from "../../lib/utils";
import { fmtPrice } from "../../lib/utils";
import { SkeletonTable, ErrorBanner } from "../../lib/ds";
import { useCorporateList, useCorporate, useBranches, type CorporateProfile } from "../../hooks/crm";
import { Card, StatCards, Pagination, Drawer, fmtDate } from "./ui";
import { CorporateFormDrawer } from "./forms";

function KV({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.FC<{ size?: number; className?: string }> }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[13px] font-semibold text-[#111827] flex items-center gap-1.5">{Icon && <Icon size={12} className="text-[#9CA3AF]" />}{value || <span className="text-[#D1D5DB]">—</span>}</div>
    </div>
  );
}

export function CorporateView() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("All");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editCorp, setEditCorp] = useState<CorporateProfile | null>(null);
  const PER_PAGE = 10;

  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const params = { page, pageSize: PER_PAGE, sort: "date", dir: "desc", q: q || undefined, branchId: branch !== "All" ? branch : undefined };
  const { data, isLoading, isError, error, refetch, isFetching } = useCorporateList(params);
  const { data: branches } = useBranches();
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  const openNew = () => { setEditCorp(null); setFormOpen(true); };
  const openEdit = (c: CorporateProfile) => { setEditCorp(c); setFormOpen(true); setDetailId(null); };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-[20px] font-black text-[#111827]">Corporate Clients</h1><p className="text-[11px] text-[#9CA3AF] mt-0.5">{total} total{isFetching ? " · refreshing…" : ""}</p></div>
        <button onClick={openNew} className="flex items-center gap-1.5 h-9 px-4 bg-[#1B75BC] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#14588F] transition-colors cursor-pointer shadow-lg shadow-[#1B75BC]/20"><Plus size={14} /> New Corporate Client</button>
      </div>

      <StatCards items={[
        { label: "Corporate Clients", value: String(total), icon: Building2, color: "#1B75BC", bg: "#EEF2FF" },
        { label: "With Trade License", value: String(rows.filter((r) => r.tradeLicense).length), icon: FileText, color: "#0E7C66", bg: "#ECFDF5" },
        { label: "Branches", value: String((branches ?? []).length), icon: MapPin, color: "#2563EB", bg: "#EFF6FF" },
        { label: "This Page", value: String(rows.length), icon: User, color: "#F15A24", bg: "#FFF9E6" },
      ]} />

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input placeholder="Search by company, contact, phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 h-9 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[13px] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 placeholder:text-[#D1D5DB]" />
          </div>
          <select value={branch} onChange={(e) => { setBranch(e.target.value); setPage(1); }} className="h-9 px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#374151] cursor-pointer">
            <option value="All">All Branches</option>{(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </Card>

      {isError ? (
        <Card className="p-6"><ErrorBanner message={(error as Error)?.message || "Failed to load corporate clients."} onRetry={() => refetch()} /></Card>
      ) : isLoading ? (
        <Card className="p-4"><SkeletonTable rows={8} cols={5} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB]"><tr>{["Company", "Contact Person", "Phone", "Trade License", "TIN", "Created"].map((h) => <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F8FA] transition-colors cursor-pointer" onClick={() => setDetailId(c.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-[#0E7C66] text-white flex items-center justify-center flex-shrink-0"><Building2 size={15} /></div>
                        <div className="text-[12px] font-semibold text-[#111827]">{c.companyName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-[11px] text-[#374151]">{c.contactPerson || c.name}</span></td>
                    <td className="px-4 py-3"><span className="text-[11px] text-[#6B7280]">{c.phone}</span></td>
                    <td className="px-4 py-3"><span className="text-[11px] text-[#374151] font-mono">{c.tradeLicense || "—"}</span></td>
                    <td className="px-4 py-3"><span className="text-[11px] text-[#6B7280] font-mono">{c.tin || "—"}</span></td>
                    <td className="px-4 py-3"><span className="text-[10px] text-[#9CA3AF]">{fmtDate(c.createdAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data?.totalPages ?? 1} total={total} pageSize={PER_PAGE} onPage={setPage} />
          {rows.length === 0 && <div className="py-16 text-center"><Building2 size={32} className="text-[#E5E7EB] mx-auto mb-3" /><p className="text-[13px] text-[#6B7280] font-medium">No corporate clients yet</p></div>}
        </Card>
      )}

      {detailId && <CorporateProfileDrawer corpId={detailId} onClose={() => setDetailId(null)} onEdit={openEdit} />}
      {formOpen && <CorporateFormDrawer open={formOpen} onClose={() => setFormOpen(false)} corp={editCorp} />}
    </div>
  );
}

function CorporateProfileDrawer({ corpId, onClose, onEdit }: { corpId: string; onClose: () => void; onEdit: (c: CorporateProfile) => void }) {
  const { data: c, isLoading, isError, error, refetch } = useCorporate(corpId);
  return (
    <Drawer open onClose={onClose} width="max-w-[600px]" title={c ? c.companyName : "Corporate Client"} subtitle={c ? `${c.name} · ${c.phone}` : undefined}>
      {isLoading ? <SkeletonTable rows={5} cols={3} /> : isError || !c ? <ErrorBanner message={(error as Error)?.message || "Not found."} onRetry={() => refetch()} /> : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#0E7C66]"><Building2 size={9} /> Corporate</span>
            <button onClick={() => onEdit(c)} className="ml-auto flex items-center gap-1.5 h-8 px-3 border border-[#E5E7EB] rounded-[7px] text-[11px] font-medium text-[#374151] hover:border-[#1B75BC]/30 cursor-pointer"><Edit3 size={12} /> Edit</button>
          </div>
          <div className="border border-[#E5E7EB] rounded-[12px] p-4 grid grid-cols-2 gap-4">
            <KV label="Company" value={c.companyName} icon={Building2} />
            <KV label="Contact Person" value={c.contactPerson} icon={User} />
            <KV label="Trade License" value={c.tradeLicense} icon={FileText} />
            <KV label="TIN" value={c.tin} icon={FileText} />
            <KV label="Phone" value={c.phone} icon={Phone} />
            <KV label="Email" value={c.email} icon={Mail} />
            <KV label="Address" value={c.address} icon={MapPin} />
            <KV label="Branch" value={c.branchName} icon={Building2} />
          </div>
          <div className="text-[11px] font-black text-[#9CA3AF] uppercase tracking-wide flex items-center gap-1.5"><Package size={13} /> Bookings ({c.bookingsCount})</div>
          <div className="flex flex-col gap-2">
            {c.bookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3 border border-[#E5E7EB] rounded-[10px] px-4 py-2.5">
                <div className="flex-1"><div className="text-[12px] font-bold text-[#1B75BC]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.bookingNo || "Draft"}</div><div className="text-[10px] text-[#9CA3AF]">{b.serviceType} · {b.status}</div></div>
                <span className="text-[12px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(b.amount)}</span>
              </div>
            ))}
            {c.bookings.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-4 text-center">No bookings yet.</p>}
          </div>
        </div>
      )}
    </Drawer>
  );
}
