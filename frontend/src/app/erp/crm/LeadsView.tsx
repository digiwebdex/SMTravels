import { useState, useEffect } from "react";
import {
  Search, Plus, LayoutGrid, List, Users, Trophy, Target, XCircle,
  SlidersHorizontal, Calendar, Trash2, Phone,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { ErrorBanner } from "../../lib/ds";
import { SERVICE_LABEL, SERVICE_ENUM } from "../../hooks/bookings";
import {
  useLeads, useLeadStage, useDeleteLead, useUsers, useBranches,
  STAGE_ORDER, STAGE_META, INTEREST_META, type LeadListItem, type LeadDetail,
} from "../../hooks/crm";
import { Card, StatCards, Pagination, StageBadge, Pill, fmtDateTime } from "./ui";
import { LeadDetailDrawer } from "./LeadDetail";
import { LeadFormDrawer } from "./forms";
import type { ServiceTypeDto } from "@contracts/booking.contract";
import type { LeadStageDto } from "@contracts/crm.contract";
import { DataTable, type DataColumn } from "../../design-system";

const SERVICE_OPTS = Object.entries(SERVICE_LABEL) as [ServiceTypeDto, string][];

export function LeadsView() {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("All");
  const [service, setService] = useState("All");
  const [assignee, setAssignee] = useState("All");
  const [branch, setBranch] = useState("All");
  const [source, setSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [advanced, setAdvanced] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<LeadDetail | null>(null);
  const PER_PAGE = 10;

  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const params = {
    page: view === "kanban" ? 1 : page, pageSize: view === "kanban" ? 200 : PER_PAGE, sort: "date", dir: "desc",
    q: q || undefined, stage: stage !== "All" ? stage : undefined,
    serviceInterest: service !== "All" ? SERVICE_ENUM[service as keyof typeof SERVICE_ENUM] : undefined,
    assignedToId: assignee !== "All" ? assignee : undefined, branchId: branch !== "All" ? branch : undefined,
  };
  const { data, isLoading, isError, error, refetch, isFetching } = useLeads(params);
  const { data: users } = useUsers();
  const { data: branches } = useBranches();
  const setStageMut = useLeadStage();
  const del = useDeleteLead();

  const rows = data?.data ?? [];
  const stats = data?.stats ?? { total: 0, won: 0, open: 0, byStage: {} };

  const openNew = () => { setEditLead(null); setFormOpen(true); };
  const openEdit = (l: LeadDetail) => { setEditLead(l); setFormOpen(true); setDetailId(null); };

  const columns: DataColumn<LeadListItem>[] = [
    {
      id: "name",
      header: "Name",
      mobileLabel: "Name",
      cell: (l) => (
        <button type="button" onClick={() => setDetailId(l.id)} className="text-left cursor-pointer">
          <div className="flex items-center gap-1.5">
            <div className="text-[12px] font-semibold text-[#111827]">{l.name}</div>
            <Pill label={l.interest[0] + l.interest.slice(1).toLowerCase()} color={INTEREST_META[l.interest].color} bg={INTEREST_META[l.interest].bg} />
          </div>
          <div className="text-[10px] text-[#9CA3AF] flex items-center gap-1"><Phone size={9} /> {l.phone}</div>
        </button>
      ),
    },
    { id: "source", header: "Source", cell: (l) => <span className="text-[11px] text-[#6B7280]">{l.source || "—"}</span> },
    { id: "service", header: "Service", cell: (l) => <span className="text-[11px] text-[#374151]">{l.serviceInterest ? SERVICE_LABEL[l.serviceInterest] : "—"}</span> },
    { id: "assigned", header: "Assigned", cell: (l) => <span className="text-[11px] text-[#374151]">{l.assignedToName || <span className="text-[#D1D5DB]">Unassigned</span>}</span> },
    { id: "stage", header: "Stage", cell: (l) => <StageBadge stage={l.stage} /> },
    { id: "lastContact", header: "Last Contact", cell: (l) => <span className="text-[10px] text-[#9CA3AF]">{fmtDateTime(l.lastContactAt)}</span> },
    { id: "nextFollowUp", header: "Next Follow-up", cell: (l) => <span className="text-[10px] text-[#9CA3AF] flex items-center gap-1">{l.nextFollowUpAt && <Calendar size={9} />}{fmtDateTime(l.nextFollowUpAt)}</span> },
    {
      id: "actions",
      header: "",
      cell: (l) => (
        <button
          onClick={(e) => { e.stopPropagation(); del.mutate(l.id); }}
          className="p-1.5 rounded-[6px] text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-all cursor-pointer"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-black text-[#111827]">Leads</h1>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">{stats.total} total{isFetching ? " · refreshing…" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#F3F4F6] rounded-[8px] p-0.5">
            <button onClick={() => setView("table")} className={cn("flex items-center gap-1 px-2.5 h-8 rounded-[6px] text-[12px] font-bold cursor-pointer", view === "table" ? "bg-white text-[#1B75BC] shadow" : "text-[#9CA3AF]")}><List size={13} /> Table</button>
            <button onClick={() => setView("kanban")} className={cn("flex items-center gap-1 px-2.5 h-8 rounded-[6px] text-[12px] font-bold cursor-pointer", view === "kanban" ? "bg-white text-[#1B75BC] shadow" : "text-[#9CA3AF]")}><LayoutGrid size={13} /> Kanban</button>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 h-9 px-4 bg-[#1B75BC] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#14588F] transition-colors cursor-pointer shadow-lg shadow-[#1B75BC]/20"><Plus size={14} /> New Lead</button>
        </div>
      </div>

      <StatCards items={[
        { label: "Total Leads", value: String(stats.total), icon: Users, color: "#1B75BC", bg: "#EEF2FF" },
        { label: "Open", value: String(stats.open), icon: Target, color: "#2563EB", bg: "#EFF6FF" },
        { label: "Won", value: String(stats.won), icon: Trophy, color: "#0E7C66", bg: "#ECFDF5" },
        { label: "Lost", value: String(stats.byStage.LOST ?? 0), icon: XCircle, color: "#DC2626", bg: "#FEF2F2" },
      ]} />

      {/* filters */}
      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input placeholder="Search by name, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[13px] outline-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 placeholder:text-[#D1D5DB]" />
          </div>
          <select value={branch} onChange={(e) => { setBranch(e.target.value); setPage(1); }} className="h-9 px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#374151] outline-none focus:border-[#1B75BC] cursor-pointer">
            <option value="All">All Branches</option>
            {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={() => setAdvanced((v) => !v)} className={cn("flex items-center gap-1.5 h-9 px-3 border rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer", advanced ? "border-[#1B75BC] bg-[#1B75BC]/5 text-[#1B75BC]" : "border-[#E5E7EB] bg-[#F7F8FA] text-[#374151] hover:border-[#1B75BC]/30")}><SlidersHorizontal size={13} /> Filters</button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["All", ...STAGE_ORDER] as const).map((s) => {
            const count = s === "All" ? stats.total : (stats.byStage[s] ?? 0);
            const label = s === "All" ? "All" : STAGE_META[s as LeadStageDto].label;
            return (
              <button key={s} onClick={() => { setStage(s); setPage(1); }}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border",
                  stage === s ? "border-[#1B75BC] bg-[#1B75BC] text-white" : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#1B75BC]/30")}>
                {label}
                <span className={cn("text-[9px] font-black px-1 py-0.5 rounded-full", stage === s ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#9CA3AF]")}>{count}</span>
              </button>
            );
          })}
        </div>
        {advanced && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F3F4F6] flex-wrap">
            <select value={service} onChange={(e) => { setService(e.target.value); setPage(1); }} className="h-8 px-2 bg-white border border-[#E5E7EB] rounded-[7px] text-[11px] text-[#374151] cursor-pointer">
              <option value="All">All Services</option>
              {SERVICE_OPTS.map(([v, l]) => <option key={v} value={l}>{l}</option>)}
            </select>
            <select value={assignee} onChange={(e) => { setAssignee(e.target.value); setPage(1); }} className="h-8 px-2 bg-white border border-[#E5E7EB] rounded-[7px] text-[11px] text-[#374151] cursor-pointer">
              <option value="All">All Executives</option>
              {(users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} className="h-8 px-2 bg-white border border-[#E5E7EB] rounded-[7px] text-[11px] w-28" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 px-2 bg-white border border-[#E5E7EB] rounded-[7px] text-[11px]" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 px-2 bg-white border border-[#E5E7EB] rounded-[7px] text-[11px]" />
          </div>
        )}
      </Card>

      {isError ? (
        <Card className="p-6"><ErrorBanner message={(error as Error)?.message || "Failed to load leads."} onRetry={() => refetch()} /></Card>
      ) : view === "kanban" ? (
        isLoading ? <Card className="p-10 text-center text-[12px] text-[#9CA3AF]">Loading…</Card> :
        <KanbanBoard rows={rows} onOpen={setDetailId} onMove={(id, s) => setStageMut.mutate({ id, stage: s })} />
      ) : (
        <DataTable<LeadListItem>
          viewKey="crm-leads"
          columns={columns}
          rows={rows}
          rowKey={(l) => l.id}
          loading={isLoading}
          emptyTitle="No leads match your filters"
          footer={<Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} pageSize={PER_PAGE} onPage={setPage} />}
        />
      )}

      {detailId && <LeadDetailDrawer leadId={detailId} onClose={() => setDetailId(null)} onEdit={openEdit} />}
      {formOpen && <LeadFormDrawer open={formOpen} onClose={() => setFormOpen(false)} lead={editLead} />}
    </div>
  );
}

function KanbanBoard({ rows, onOpen, onMove }: { rows: LeadListItem[]; onOpen: (id: string) => void; onMove: (id: string, stage: LeadStageDto) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGE_ORDER.map((s) => {
        const items = rows.filter((r) => r.stage === s);
        const m = STAGE_META[s];
        return (
          <div key={s} className="flex-shrink-0 w-[260px]">
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} /><span className="text-[12px] font-black text-[#374151]">{m.label}</span></div>
              <span className="text-[10px] font-black text-[#9CA3AF] bg-[#F3F4F6] px-1.5 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[80px]">
              {items.map((l) => (
                <div key={l.id} className="bg-white border border-[#E5E7EB] rounded-[12px] p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onOpen(l.id)}>
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-bold text-[#111827]">{l.name}</div>
                    <Pill label={l.interest[0] + l.interest.slice(1).toLowerCase()} color={INTEREST_META[l.interest].color} bg={INTEREST_META[l.interest].bg} />
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] mt-1 flex items-center gap-1"><Phone size={9} /> {l.phone}</div>
                  <div className="text-[10px] text-[#6B7280] mt-1">{l.serviceInterest ? SERVICE_LABEL[l.serviceInterest] : "—"}{l.source ? ` · ${l.source}` : ""}</div>
                  <div className="mt-2 pt-2 border-t border-[#F3F4F6] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-[#9CA3AF]">{l.assignedToName || "Unassigned"}</span>
                    <select value={l.stage} onChange={(e) => onMove(l.id, e.target.value as LeadStageDto)} className="text-[10px] border border-[#E5E7EB] rounded-[5px] px-1 py-0.5 text-[#374151] cursor-pointer outline-none">
                      {STAGE_ORDER.map((st) => <option key={st} value={st}>{STAGE_META[st].label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="text-[10px] text-[#D1D5DB] text-center py-4 border-2 border-dashed border-[#F3F4F6] rounded-[10px]">Empty</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
