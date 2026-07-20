import { useState, useEffect } from "react";
import {
  Search, Plus, Users, Building2, UserCircle, Trash2, Edit3,
  Package, Activity, StickyNote, Phone, Mail, MapPin, Shield,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { fmtPrice } from "../../lib/utils";
import { SkeletonTable, ErrorBanner } from "../../lib/ds";
import { useCustomers, useCustomer, useBranches, type CustomerProfile } from "../../hooks/crm";
import { Card, StatCards, Pagination, Pill, Drawer, fmtDate, fmtDateTime } from "./ui";
import { CustomerFormDrawer } from "./forms";

function KV({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.FC<{ size?: number; className?: string }> }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[13px] font-semibold text-[#111827] flex items-center gap-1.5">{Icon && <Icon size={12} className="text-[#9CA3AF]" />}{value || <span className="text-[#D1D5DB]">—</span>}</div>
    </div>
  );
}

export function CustomersView() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [branch, setBranch] = useState("All");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerProfile | null>(null);
  const PER_PAGE = 10;

  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const params = { page, pageSize: PER_PAGE, sort: "date", dir: "desc", q: q || undefined, type: type !== "All" ? type : undefined, branchId: branch !== "All" ? branch : undefined };
  const { data, isLoading, isError, error, refetch, isFetching } = useCustomers(params);
  const { data: branches } = useBranches();
  const rows = data?.data ?? [];
  const stats = data?.stats ?? { total: 0, individual: 0, corporate: 0 };

  const openNew = () => { setEditCustomer(null); setFormOpen(true); };
  const openEdit = (c: CustomerProfile) => { setEditCustomer(c); setFormOpen(true); setDetailId(null); };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-[20px] font-black text-[#111827]">Customers</h1><p className="text-[11px] text-[#9CA3AF] mt-0.5">{stats.total} total{isFetching ? " · refreshing…" : ""}</p></div>
        <button onClick={openNew} className="flex items-center gap-1.5 h-9 px-4 bg-[#0E6BB8] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#0B5794] transition-colors cursor-pointer shadow-lg shadow-[#0E6BB8]/20"><Plus size={14} /> New Customer</button>
      </div>

      <StatCards items={[
        { label: "Total Customers", value: String(stats.total), icon: Users, color: "#0E6BB8", bg: "#EEF2FF" },
        { label: "Individuals", value: String(stats.individual), icon: UserCircle, color: "#2563EB", bg: "#EFF6FF" },
        { label: "Corporate", value: String(stats.corporate), icon: Building2, color: "#0E7C66", bg: "#ECFDF5" },
        { label: "Branches", value: String((branches ?? []).length), icon: MapPin, color: "#E8471F", bg: "#FFF9E6" },
      ]} />

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input placeholder="Search by name, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 h-9 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[13px] outline-none focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10 placeholder:text-[#D1D5DB]" />
          </div>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="h-9 px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#374151] cursor-pointer">
            <option value="All">All Types</option><option value="INDIVIDUAL">Individual</option><option value="CORPORATE">Corporate</option>
          </select>
          <select value={branch} onChange={(e) => { setBranch(e.target.value); setPage(1); }} className="h-9 px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#374151] cursor-pointer">
            <option value="All">All Branches</option>{(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </Card>

      {isError ? (
        <Card className="p-6"><ErrorBanner message={(error as Error)?.message || "Failed to load customers."} onRetry={() => refetch()} /></Card>
      ) : isLoading ? (
        <Card className="p-4"><SkeletonTable rows={8} cols={6} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB]"><tr>{["Name", "Contact", "Type", "Location", "Bookings", "Created", ""].map((h) => <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F8FA] transition-colors group cursor-pointer" onClick={() => setDetailId(c.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#0E6BB8] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">{c.name[0]}</div>
                        <div><div className="text-[12px] font-semibold text-[#111827]">{c.name}</div>{c.rating && <div className="text-[9px] text-[#0E7C66] font-bold">{c.rating}</div>}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="text-[11px] text-[#374151]">{c.phone}</div>{c.email && <div className="text-[10px] text-[#9CA3AF]">{c.email}</div>}</td>
                    <td className="px-4 py-3">{c.type === "CORPORATE" ? <Pill label="Corporate" color="#0E7C66" bg="#ECFDF5" icon={Building2} /> : <Pill label="Individual" color="#1D4ED8" bg="#DBEAFE" />}</td>
                    <td className="px-4 py-3"><span className="text-[11px] text-[#6B7280]">{[c.district, c.division].filter(Boolean).join(", ") || "—"}</span></td>
                    <td className="px-4 py-3"><span className="text-[12px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.bookingsCount}</span></td>
                    <td className="px-4 py-3"><span className="text-[10px] text-[#9CA3AF]">{fmtDate(c.createdAt)}</span></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} pageSize={PER_PAGE} onPage={setPage} />
          {rows.length === 0 && <div className="py-16 text-center"><Users size={32} className="text-[#E5E7EB] mx-auto mb-3" /><p className="text-[13px] text-[#6B7280] font-medium">No customers found</p></div>}
        </Card>
      )}

      {detailId && <CustomerProfileDrawer customerId={detailId} onClose={() => setDetailId(null)} onEdit={openEdit} />}
      {formOpen && <CustomerFormDrawer open={formOpen} onClose={() => setFormOpen(false)} customer={editCustomer} />}
    </div>
  );
}

function CustomerProfileDrawer({ customerId, onClose, onEdit }: { customerId: string; onClose: () => void; onEdit: (c: CustomerProfile) => void }) {
  const { data: c, isLoading, isError, error, refetch } = useCustomer(customerId);
  const [tab, setTab] = useState<"bookings" | "notes" | "activity">("bookings");

  return (
    <Drawer open onClose={onClose} width="max-w-[640px]" title={c ? c.name : "Customer"} subtitle={c ? `${c.phone}${c.email ? " · " + c.email : ""}` : undefined}>
      {isLoading ? <SkeletonTable rows={5} cols={3} /> : isError || !c ? <ErrorBanner message={(error as Error)?.message || "Not found."} onRetry={() => refetch()} /> : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {c.isCorporate ? <Pill label="Corporate" color="#0E7C66" bg="#ECFDF5" icon={Building2} /> : <Pill label="Individual" color="#1D4ED8" bg="#DBEAFE" />}
            {c.rating && <Pill label={c.rating} color="#065F46" bg="#D1FAE5" />}
            <button onClick={() => onEdit(c)} className="ml-auto flex items-center gap-1.5 h-8 px-3 border border-[#E5E7EB] rounded-[7px] text-[11px] font-medium text-[#374151] hover:border-[#0E6BB8]/30 cursor-pointer"><Edit3 size={12} /> Edit</button>
          </div>
          <div className="border border-[#E5E7EB] rounded-[12px] p-4 grid grid-cols-3 gap-4">
            <KV label="Phone" value={c.phone} icon={Phone} />
            <KV label="Email" value={c.email} icon={Mail} />
            <KV label="Branch" value={c.branchName} icon={Building2} />
            <KV label="Location" value={[c.district, c.division].filter(Boolean).join(", ")} icon={MapPin} />
            <KV label="NID" value={c.nid} icon={Shield} />
            <KV label="Passport" value={c.passportNo} icon={Shield} />
          </div>

          <div className="flex items-center gap-1 border-b border-[#E5E7EB]">
            {(["bookings", "notes", "activity"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 capitalize cursor-pointer", tab === t ? "border-[#0E6BB8] text-[#0E6BB8]" : "border-transparent text-[#6B7280]")}>
                {t === "bookings" ? <Package size={13} /> : t === "notes" ? <StickyNote size={13} /> : <Activity size={13} />} {t}
                {((t === "bookings" && c.bookings.length) || (t === "notes" && c.notes.length) || (t === "activity" && c.activity.length)) ? <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF]">{t === "bookings" ? c.bookings.length : t === "notes" ? c.notes.length : c.activity.length}</span> : null}
              </button>
            ))}
          </div>

          {tab === "bookings" && (
            <div className="flex flex-col gap-2">
              {c.bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 border border-[#E5E7EB] rounded-[10px] px-4 py-2.5">
                  <div className="flex-1"><div className="text-[12px] font-bold text-[#0E6BB8]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.bookingNo || "Draft"}</div><div className="text-[10px] text-[#9CA3AF]">{b.serviceType} · {b.status}</div></div>
                  <span className="text-[12px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(b.amount)}</span>
                </div>
              ))}
              {c.bookings.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-4 text-center">No bookings yet.</p>}
            </div>
          )}
          {tab === "notes" && (
            <div className="flex flex-col gap-2">
              {c.notes.map((n) => (<div key={n.id} className="border border-[#E5E7EB] rounded-[10px] px-4 py-2.5"><div className="text-[12px] text-[#374151]">{n.body}</div><div className="text-[10px] text-[#9CA3AF] mt-1">{n.author ?? "—"} · {fmtDateTime(n.createdAt)}</div></div>))}
              {c.notes.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-4 text-center">No notes.</p>}
            </div>
          )}
          {tab === "activity" && (
            <div className="flex flex-col gap-2">
              {c.activity.map((a) => (<div key={a.id} className="flex items-center gap-3 border border-[#E5E7EB] rounded-[10px] px-4 py-2.5"><Activity size={13} className="text-[#0E6BB8]" /><span className="text-[12px] text-[#374151] flex-1">{a.action.replace(/_/g, " ")}</span><span className="text-[10px] text-[#9CA3AF]">{fmtDateTime(a.createdAt)}</span></div>))}
              {c.activity.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-4 text-center">No activity.</p>}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
