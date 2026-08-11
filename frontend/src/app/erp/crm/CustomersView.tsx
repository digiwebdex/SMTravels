import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  Plus, Users, Building2, UserCircle, Edit3,
  Package, Activity, StickyNote, Phone, Mail, MapPin, Shield,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { fmtPrice } from "../../lib/utils";
import { ErrorBanner, SkeletonTable } from "../../lib/ds";
import { useCustomers, useCustomer, useBranches, type CustomerProfile } from "../../hooks/crm";
import type { CustomerListItem } from "@contracts/crm.contract";
import { Card, StatCards, Pagination, Pill, Drawer, fmtDate, fmtDateTime } from "./ui";
import { CustomerFormDrawer } from "./forms";
import { DataTable, type DataColumn, AiInsightCard } from "../../design-system";

function KV({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
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

  // Deep-link: the top-bar "+ New Customer" lands here with ?new=1 and opens the form.
  const [urlParams, setUrlParams] = useSearchParams();
  useEffect(() => {
    if (urlParams.get("new") === "1") {
      openNew();
      const next = new URLSearchParams(urlParams); next.delete("new"); setUrlParams(next, { replace: true });
    }
  }, [urlParams, setUrlParams]);

  const columns: DataColumn<CustomerListItem>[] = [
    {
      id: "name",
      header: "Name",
      mobileLabel: "Name",
      cell: (c) => (
        <button
          type="button"
          onClick={() => setDetailId(c.id)}
          className="flex items-center gap-2.5 text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#1B75BC] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">{c.name[0]}</div>
          <div>
            <div className="text-[12px] font-semibold text-[#111827]">{c.name}</div>
            {c.rating && <div className="text-[9px] text-[#0E7C66] font-bold">{c.rating}</div>}
          </div>
        </button>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      cell: (c) => (
        <div>
          <div className="text-[11px] text-[#374151]">{c.phone}</div>
          {c.email && <div className="text-[10px] text-[#9CA3AF]">{c.email}</div>}
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (c) => c.type === "CORPORATE" ? <Pill label="Corporate" color="#0E7C66" bg="#ECFDF5" icon={Building2} /> : <Pill label="Individual" color="#1D4ED8" bg="#DBEAFE" />,
    },
    {
      id: "location",
      header: "Location",
      cell: (c) => <span className="text-[11px] text-[#6B7280]">{[c.district, c.division].filter(Boolean).join(", ") || "—"}</span>,
    },
    {
      id: "bookings",
      header: "Bookings",
      cell: (c) => <span className="text-[12px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.bookingsCount}</span>,
    },
    {
      id: "created",
      header: "Created",
      cell: (c) => <span className="text-[10px] text-[#9CA3AF]">{fmtDate(c.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-[20px] font-black text-[#111827]">Customers</h1><p className="text-[11px] text-[#9CA3AF] mt-0.5">{stats.total} total{isFetching ? " · refreshing…" : ""}</p></div>
        <button onClick={openNew} className="flex items-center gap-1.5 h-9 px-4 bg-[#1B75BC] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#14588F] transition-colors cursor-pointer shadow-lg shadow-[#1B75BC]/20"><Plus size={14} /> New Customer</button>
      </div>

      <StatCards items={[
        { label: "Total Customers", value: String(stats.total), icon: Users, color: "#1B75BC", bg: "#EEF2FF" },
        { label: "Individuals", value: String(stats.individual), icon: UserCircle, color: "#2563EB", bg: "#EFF6FF" },
        { label: "Corporate", value: String(stats.corporate), icon: Building2, color: "#0E7C66", bg: "#ECFDF5" },
        { label: "Branches", value: String((branches ?? []).length), icon: MapPin, color: "#F15A24", bg: "#FFF9E6" },
      ]} />

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3">
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
      ) : (
        <DataTable<CustomerListItem>
          viewKey="crm-customers"
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          loading={isLoading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, phone, email…"
          emptyTitle="No customers found"
          emptyDesc="Try adjusting your search or filters."
          footer={<Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} pageSize={PER_PAGE} onPage={setPage} />}
        />
      )}

      {detailId && <CustomerProfileDrawer customerId={detailId} onClose={() => setDetailId(null)} onEdit={openEdit} />}
      {formOpen && <CustomerFormDrawer open={formOpen} onClose={() => setFormOpen(false)} customer={editCustomer} />}
    </div>
  );
}

function CustomerProfileDrawer({ customerId, onClose, onEdit }: { customerId: string; onClose: () => void; onEdit: (c: CustomerProfile) => void }) {
  const { data: c, isLoading, isError, error, refetch } = useCustomer(customerId);
  const [tab, setTab] = useState<"bookings" | "notes" | "activity">("bookings");
  const navigate = useNavigate();
  const startBooking = () => {
    if (!c) return;
    const qs = new URLSearchParams({ new: "1", cname: c.name, cphone: c.phone || "" });
    if (c.email) qs.set("cemail", c.email);
    navigate(`/erp/bookings?${qs.toString()}`);
  };

  return (
    <Drawer open onClose={onClose} width="max-w-[640px]" title={c ? c.name : "Customer"} subtitle={c ? `${c.phone}${c.email ? " · " + c.email : ""}` : undefined}>
      {isLoading ? <SkeletonTable rows={5} cols={3} /> : isError || !c ? <ErrorBanner message={(error as Error)?.message || "Not found."} onRetry={() => refetch()} /> : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {c.isCorporate ? <Pill label="Corporate" color="#0E7C66" bg="#ECFDF5" icon={Building2} /> : <Pill label="Individual" color="#1D4ED8" bg="#DBEAFE" />}
            {c.rating && <Pill label={c.rating} color="#065F46" bg="#D1FAE5" />}
            <button onClick={startBooking} className="ml-auto flex items-center gap-1.5 h-8 px-3 bg-[#1B75BC] text-white rounded-[7px] text-[11px] font-bold hover:bg-[#14588F] cursor-pointer"><Plus size={12} /> New Booking</button>
            <button onClick={() => onEdit(c)} className="flex items-center gap-1.5 h-8 px-3 border border-[#E5E7EB] rounded-[7px] text-[11px] font-medium text-[#374151] hover:border-[#1B75BC]/30 cursor-pointer"><Edit3 size={12} /> Edit</button>
          </div>
          <div className="border border-[#E5E7EB] rounded-[12px] p-4 grid grid-cols-3 gap-4">
            <KV label="Phone" value={c.phone} icon={Phone} />
            <KV label="Email" value={c.email} icon={Mail} />
            <KV label="Branch" value={c.branchName} icon={Building2} />
            <KV label="Location" value={[c.district, c.division].filter(Boolean).join(", ")} icon={MapPin} />
            <KV label="NID" value={c.nid} icon={Shield} />
            <KV label="Passport" value={c.passportNo} icon={Shield} />
          </div>

          <AiInsightCard title="AI Insights" collapsedByDefault>
            <ul className="text-xs space-y-1.5 list-disc pl-4">
              <li>{c.bookings.length} booking{c.bookings.length === 1 ? "" : "s"} on file{c.rating ? ` · rated ${c.rating}` : ""}.</li>
              <li>Consider a follow-up call if the last activity is older than 30 days.</li>
            </ul>
          </AiInsightCard>

          <div className="flex items-center gap-1 border-b border-[#E5E7EB]">
            {(["bookings", "notes", "activity"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 capitalize cursor-pointer", tab === t ? "border-[#1B75BC] text-[#1B75BC]" : "border-transparent text-[#6B7280]")}>
                {t === "bookings" ? <Package size={13} /> : t === "notes" ? <StickyNote size={13} /> : <Activity size={13} />} {t}
                {((t === "bookings" && c.bookings.length) || (t === "notes" && c.notes.length) || (t === "activity" && c.activity.length)) ? <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF]">{t === "bookings" ? c.bookings.length : t === "notes" ? c.notes.length : c.activity.length}</span> : null}
              </button>
            ))}
          </div>

          {tab === "bookings" && (
            <div className="flex flex-col gap-2">
              {c.bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 border border-[#E5E7EB] rounded-[10px] px-4 py-2.5">
                  <div className="flex-1"><div className="text-[12px] font-bold text-[#1B75BC]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.bookingNo || "Draft"}</div><div className="text-[10px] text-[#9CA3AF]">{b.serviceType} · {b.status}</div></div>
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
              {c.activity.map((a) => (<div key={a.id} className="flex items-center gap-3 border border-[#E5E7EB] rounded-[10px] px-4 py-2.5"><Activity size={13} className="text-[#1B75BC]" /><span className="text-[12px] text-[#374151] flex-1">{a.action.replace(/_/g, " ")}</span><span className="text-[10px] text-[#9CA3AF]">{fmtDateTime(a.createdAt)}</span></div>))}
              {c.activity.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-4 text-center">No activity.</p>}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
