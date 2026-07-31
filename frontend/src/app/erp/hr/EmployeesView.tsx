import { useEffect, useState } from "react";
import { Plus, Building2, Phone, Mail, Briefcase, User, Edit3, Clock3 } from "lucide-react";
import { DataTable, type DataColumn } from "../../design-system";
import { AiInsightCard } from "../../design-system/ai/AiInsightCard";
import { ErrorBanner, SkeletonTable } from "../../lib/ds";
import { useBranches } from "../../hooks/bookings";
import {
  useEmployees, useEmployee, useEmployeeTimeline, useCreateEmployee, useSetEmployeeStatus,
  useDepartments, type EmployeeListItem, type EmployeeCreateInput,
} from "../../hooks/hr";
import { Card, Pagination, Pill, Drawer, Field, PrimaryBtn, GhostBtn, StatusPill, fmtDate, fmtDateTime, inputCls, selectCls } from "./ui";

const EMPLOYEE_STATUSES = ["DRAFT", "OFFERED", "JOINED", "PROBATION", "CONFIRMED", "TRANSFERRED", "RESIGNED", "TERMINATED", "ARCHIVED"];

export function EmployeesView() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [departmentId, setDepartmentId] = useState("All");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const PER_PAGE = 10;

  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const params = { page, pageSize: PER_PAGE, q: q || undefined, status: status !== "All" ? status : undefined, departmentId: departmentId !== "All" ? departmentId : undefined };
  const { data, isLoading, isError, error, refetch, isFetching } = useEmployees(params);
  const { data: departments } = useDepartments();
  const rows = data?.data ?? [];

  const columns: DataColumn<EmployeeListItem>[] = [
    {
      id: "name",
      header: "Employee",
      cell: (e) => (
        <button type="button" onClick={() => setDetailId(e.id)} className="flex items-center gap-2.5 text-left cursor-pointer">
          {e.photoUrl ? (
            <img src={e.photoUrl} alt={e.fullName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-fg)] flex items-center justify-center text-[12px] font-black flex-shrink-0">{e.firstName[0]}</div>
          )}
          <div>
            <div className="text-[12px] font-semibold text-[var(--color-text)]">{e.fullName}</div>
            <div className="text-[9px] text-[var(--color-text-faint)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{e.employeeCode}</div>
          </div>
        </button>
      ),
    },
    { id: "contact", header: "Contact", cell: (e) => <div><div className="text-[11px] text-[var(--color-text-muted)]">{e.phone ?? "—"}</div>{e.email && <div className="text-[10px] text-[var(--color-text-faint)]">{e.email}</div>}</div> },
    { id: "dept", header: "Department", cell: (e) => <span className="text-[11px] text-[var(--color-text-muted)]">{e.departmentName ?? "—"}{e.designationName ? ` · ${e.designationName}` : ""}</span> },
    { id: "branch", header: "Branch", cell: (e) => <span className="text-[11px] text-[var(--color-text-muted)]">{e.branchName}</span> },
    { id: "status", header: "Status", cell: (e) => <StatusPill status={e.status} /> },
    { id: "joined", header: "Joined", cell: (e) => <span className="text-[10px] text-[var(--color-text-faint)]">{fmtDate(e.joiningDate)}</span> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-[var(--color-text-faint)]">{data?.total ?? 0} total{isFetching ? " · refreshing…" : ""}</p>
        <PrimaryBtn onClick={() => setFormOpen(true)}><Plus size={14} /> New Employee</PrimaryBtn>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${selectCls} w-auto h-9`}>
            <option value="All">All Statuses</option>
            {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }} className={`${selectCls} w-auto h-9`}>
            <option value="All">All Departments</option>
            {(departments ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </Card>

      {isError ? (
        <Card className="p-6"><ErrorBanner message={(error as Error)?.message || "Failed to load employees."} onRetry={() => refetch()} /></Card>
      ) : (
        <DataTable<EmployeeListItem>
          viewKey="hr-employees"
          columns={columns}
          rows={rows}
          rowKey={(e) => e.id}
          loading={isLoading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, code, phone, email…"
          emptyTitle="No employees found"
          emptyDesc="Try adjusting your search or filters."
          footer={<Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} pageSize={PER_PAGE} onPage={setPage} />}
        />
      )}

      {detailId && <EmployeeDetailDrawer employeeId={detailId} onClose={() => setDetailId(null)} />}
      {formOpen && <NewEmployeeDrawer onClose={() => setFormOpen(false)} onCreated={(id) => { setFormOpen(false); setDetailId(id); }} />}
    </div>
  );
}

function NewEmployeeDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { data: branches } = useBranches();
  const { data: departments } = useDepartments();
  const createMut = useCreateEmployee();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [branchId, setBranchId] = useState("");
  const [departmentIdVal, setDepartmentIdVal] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [status, setStatus] = useState("DRAFT");

  useEffect(() => { if (!branchId && branches && branches.length > 0) setBranchId(branches[0].id); }, [branches, branchId]);

  const canSave = firstName.trim() && lastName.trim() && branchId;

  const submit = () => {
    if (!canSave) return;
    const input: EmployeeCreateInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      branchId,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      departmentId: departmentIdVal || undefined,
      joiningDate: joiningDate || undefined,
      status: status as EmployeeCreateInput["status"],
    } as EmployeeCreateInput;
    createMut.mutate(input, { onSuccess: (d) => onCreated(d.id) });
  };

  return (
    <Drawer open onClose={onClose} title="New Employee" subtitle="Add a new employee record" footer={
      <>
        <GhostBtn onClick={onClose}>Cancel</GhostBtn>
        <PrimaryBtn onClick={submit} disabled={!canSave || createMut.isPending}>{createMut.isPending ? "Saving…" : "Create Employee"}</PrimaryBtn>
      </>
    }>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required><input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Field>
        <Field label="Last Name" required><input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
        <Field label="Phone"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Branch" required>
          <select className={selectCls} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Select branch…</option>
            {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Department">
          <select className={selectCls} value={departmentIdVal} onChange={(e) => setDepartmentIdVal(e.target.value)}>
            <option value="">No department</option>
            {(departments ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Joining Date"><input type="date" className={inputCls} value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} /></Field>
        <Field label="Status">
          <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </Field>
      </div>
    </Drawer>
  );
}

function KV({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.FC<{ size?: number; className?: string }> }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[13px] font-semibold text-[var(--color-text)] flex items-center gap-1.5">{Icon && <Icon size={12} className="text-[var(--color-text-faint)]" />}{value || <span className="text-[var(--color-text-faint)]">—</span>}</div>
    </div>
  );
}

function EmployeeDetailDrawer({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const { data: e, isLoading, isError, error, refetch } = useEmployee(employeeId);
  const { data: timeline } = useEmployeeTimeline(employeeId);
  const setStatusMut = useSetEmployeeStatus();
  const [tab, setTab] = useState<"overview" | "timeline">("overview");
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");

  return (
    <Drawer open onClose={onClose} width="max-w-[640px]" title={e ? e.fullName : "Employee"} subtitle={e ? `${e.employeeCode} · ${e.branchName}` : undefined}>
      {isLoading ? <SkeletonTable rows={5} cols={3} /> : isError || !e ? <ErrorBanner message={(error as Error)?.message || "Not found."} onRetry={() => refetch()} /> : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <StatusPill status={e.status} />
            {e.employmentType && <Pill label={e.employmentType.replace(/_/g, " ")} color="#374151" bg="#F3F4F6" />}
            <button onClick={() => { setNewStatus(e.status); setStatusChangeOpen(true); }} className="ml-auto flex items-center gap-1.5 h-8 px-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[11px] font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 cursor-pointer">
              <Edit3 size={12} /> Change Status
            </button>
          </div>

          {statusChangeOpen && (
            <Card className="p-4 space-y-3">
              <Field label="New Status">
                <select className={selectCls} value={newStatus} onChange={(ev) => setNewStatus(ev.target.value)}>
                  {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </Field>
              <Field label="Note (optional)"><input className={inputCls} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Reason for change…" /></Field>
              <div className="flex justify-end gap-2">
                <GhostBtn onClick={() => setStatusChangeOpen(false)}>Cancel</GhostBtn>
                <PrimaryBtn disabled={setStatusMut.isPending} onClick={() => setStatusMut.mutate({ id: e.id, status: newStatus, note: note || undefined }, { onSuccess: () => { setStatusChangeOpen(false); setNote(""); } })}>
                  {setStatusMut.isPending ? "Saving…" : "Confirm"}
                </PrimaryBtn>
              </div>
            </Card>
          )}

          <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 grid grid-cols-2 gap-4">
            <KV label="Phone" value={e.phone} icon={Phone} />
            <KV label="Email" value={e.email} icon={Mail} />
            <KV label="Department" value={e.departmentName} icon={Building2} />
            <KV label="Designation" value={e.designationName} icon={Briefcase} />
            <KV label="Manager" value={e.managerName} icon={User} />
            <KV label="Joining Date" value={fmtDate(e.joiningDate)} />
          </div>

          <AiInsightCard title="Employee Insights" collapsedByDefault>
            <ul className="text-xs space-y-1.5 list-disc pl-4">
              {e.status === "PROBATION" && e.confirmationDate && (
                <li>Probation ends {fmtDate(e.confirmationDate)} — prepare confirmation review.</li>
              )}
              {e.documentsCount === 0 && <li>No HR documents on file yet — collect NID / contract / photo.</li>}
              {e.leaveBalances.length === 0 && <li>Leave balances not initialized for this employee.</li>}
              {e.status === "JOINED" || e.status === "CONFIRMED" || e.status === "PROBATION" ? (
                <li>Active employee on {e.branchName}{e.departmentName ? ` · ${e.departmentName}` : ""}.</li>
              ) : (
                <li>Lifecycle status is {e.status.replace(/_/g, " ")} — check timeline for history.</li>
              )}
            </ul>
          </AiInsightCard>

          <div className="flex items-center gap-1 border-b border-[var(--color-border-subtle)]">
            {(["overview", "timeline"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 capitalize cursor-pointer ${tab === t ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-text-muted)]"}`}>
                {t === "overview" ? <User size={13} /> : <Clock3 size={13} />} {t}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="grid grid-cols-2 gap-4">
              <KV label="Gender" value={e.gender} />
              <KV label="Date of Birth" value={fmtDate(e.dateOfBirth)} />
              <KV label="Blood Group" value={e.bloodGroup} />
              <KV label="Marital Status" value={e.maritalStatus} />
              <KV label="Emergency Contact" value={e.emergencyContactName ? `${e.emergencyContactName} (${e.emergencyContactPhone ?? "—"})` : null} />
              <KV label="Present Address" value={e.presentAddress} />
              <KV label="Documents" value={String(e.documentsCount)} />
              <KV label="Leave Balances" value={String(e.leaveBalances.length)} />
            </div>
          )}
          {tab === "timeline" && (
            <div className="flex flex-col gap-2">
              {(timeline ?? e.timeline).map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-2.5">
                  <Clock3 size={13} className="text-[var(--color-primary)] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-[var(--color-text)]">{ev.title}</div>
                    {ev.detail && <div className="text-[11px] text-[var(--color-text-muted)]">{ev.detail}</div>}
                  </div>
                  <span className="text-[10px] text-[var(--color-text-faint)] whitespace-nowrap">{fmtDateTime(ev.occurredAt)}</span>
                </div>
              ))}
              {(timeline ?? e.timeline).length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] py-4 text-center">No timeline events yet.</p>}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
