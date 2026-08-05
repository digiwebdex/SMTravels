import { useState } from "react";
import { Plus, Check, X as XIcon, Send, Ban } from "lucide-react";
import { DataTable, type DataColumn } from "../../design-system";
import { ErrorBanner } from "../../lib/ds";
import {
  useLeaveTypes, useCreateLeaveType, useLeaveRequests, useCreateLeaveRequest,
  useSubmitLeaveRequest, useManagerApproveLeave, useHrApproveLeave, useRejectLeaveRequest, useCancelLeaveRequest,
  useEmployees, type LeaveRequestDto, type LeaveTypeDto,
} from "../../hooks/hr";
import { Card, Pagination, Field, PrimaryBtn, StatusPill, fmtDate, inputCls, selectCls } from "./ui";

function LeaveTypesCard() {
  const { data, isLoading, isError, error } = useLeaveTypes();
  const createMut = useCreateLeaveType();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [maxPerYear, setMaxPerYear] = useState("");
  const [paid, setPaid] = useState(true);

  const submit = () => {
    if (!name.trim() || !code.trim()) return;
    createMut.mutate({ name: name.trim(), code: code.trim().toUpperCase(), paid, maxPerYear: maxPerYear ? Number(maxPerYear) : undefined },
      { onSuccess: () => { setName(""); setCode(""); setMaxPerYear(""); } });
  };

  return (
    <Card className="p-5">
      <h3 className="text-[13px] font-black text-[var(--color-text)] mb-4">Leave Types</h3>
      <div className="flex flex-wrap items-end gap-2 mb-4">
        <div className="flex-1 min-w-[140px]"><Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Annual Leave" /></Field></div>
        <div className="w-24"><Field label="Code"><input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} placeholder="AL" /></Field></div>
        <div className="w-28"><Field label="Max/Year"><input type="number" className={inputCls} value={maxPerYear} onChange={(e) => setMaxPerYear(e.target.value)} placeholder="20" /></Field></div>
        <label className="flex items-center gap-1.5 h-9 text-[11px] font-medium text-[var(--color-text-muted)]">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Paid
        </label>
        <PrimaryBtn onClick={submit} disabled={!name.trim() || !code.trim() || createMut.isPending}><Plus size={13} /> Add</PrimaryBtn>
      </div>
      {isError ? <ErrorBanner message={(error as Error)?.message || "Failed to load leave types."} /> : (
        <div className="flex flex-wrap gap-2">
          {isLoading && <p className="text-[11px] text-[var(--color-text-faint)]">Loading…</p>}
          {(data ?? []).map((lt: LeaveTypeDto) => (
            <span key={lt.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[var(--color-bg)] border border-[var(--color-border)]">
              {lt.name} <span className="text-[var(--color-text-faint)]">({lt.code})</span>
              {!lt.paid && <span className="text-[9px] text-[var(--color-warning)]">UNPAID</span>}
              {lt.maxPerYear != null && <span className="text-[var(--color-text-faint)]">· {lt.maxPerYear}/yr</span>}
            </span>
          ))}
          {!isLoading && (data ?? []).length === 0 && <p className="text-[11px] text-[var(--color-text-faint)]">No leave types configured yet.</p>}
        </div>
      )}
    </Card>
  );
}

function NewLeaveRequestForm() {
  const { data: empResult } = useEmployees({ pageSize: 50 });
  const { data: leaveTypes } = useLeaveTypes();
  const createMut = useCreateLeaveRequest();
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const canSave = employeeId && leaveTypeId && fromDate && toDate;
  const submit = () => {
    if (!canSave) return;
    createMut.mutate({ employeeId, leaveTypeId, fromDate, toDate, reason: reason.trim() || undefined, submit: true },
      { onSuccess: () => { setFromDate(""); setToDate(""); setReason(""); } });
  };

  return (
    <Card className="p-5">
      <h3 className="text-[13px] font-black text-[var(--color-text)] mb-4">New Leave Request</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <Field label="Employee" required>
          <select className={selectCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Select…</option>
            {(empResult?.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        </Field>
        <Field label="Leave Type" required>
          <select className={selectCls} value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
            <option value="">Select…</option>
            {(leaveTypes ?? []).map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
          </select>
        </Field>
        <Field label="From" required><input type="date" className={inputCls} value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Field>
        <Field label="To" required><input type="date" className={inputCls} value={toDate} onChange={(e) => setToDate(e.target.value)} /></Field>
        <PrimaryBtn onClick={submit} disabled={!canSave || createMut.isPending}><Plus size={13} /> {createMut.isPending ? "Saving…" : "Submit"}</PrimaryBtn>
      </div>
      <div className="mt-3">
        <Field label="Reason (optional)"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for leave…" /></Field>
      </div>
    </Card>
  );
}

const LEAVE_STATUSES = ["DRAFT", "SUBMITTED", "MANAGER_APPROVED", "HR_APPROVED", "REJECTED", "CANCELLED"];

export function LeaveView() {
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const { data, isLoading, isError, error, isFetching } = useLeaveRequests({ status: status !== "All" ? status : undefined, page, pageSize: PER_PAGE });
  const rows = data?.data ?? [];

  const submitMut = useSubmitLeaveRequest();
  const managerApproveMut = useManagerApproveLeave();
  const hrApproveMut = useHrApproveLeave();
  const rejectMut = useRejectLeaveRequest();
  const cancelMut = useCancelLeaveRequest();

  const columns: DataColumn<LeaveRequestDto>[] = [
    { id: "employee", header: "Employee", cell: (r) => <div><div className="text-[12px] font-semibold text-[var(--color-text)]">{r.employeeName}</div><div className="text-[9px] text-[var(--color-text-faint)]">{r.employeeCode}</div></div> },
    { id: "type", header: "Leave Type", cell: (r) => <span className="text-[11px] text-[var(--color-text-muted)]">{r.leaveTypeName}</span> },
    { id: "dates", header: "Dates", cell: (r) => <span className="text-[11px] text-[var(--color-text-muted)]">{fmtDate(r.fromDate)} → {fmtDate(r.toDate)}</span> },
    { id: "days", header: "Days", cell: (r) => <span className="text-[11px] font-semibold text-[var(--color-text)]">{r.days}</span> },
    { id: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
    {
      id: "actions", header: "Actions", cell: (r) => (
        <div className="flex items-center gap-1">
          {r.status === "DRAFT" && <button title="Submit" onClick={() => submitMut.mutate({ id: r.id })} className="p-1.5 text-[var(--color-primary)] hover:bg-[var(--color-primary-tint)] rounded cursor-pointer"><Send size={13} /></button>}
          {r.status === "SUBMITTED" && <button title="Manager Approve" onClick={() => managerApproveMut.mutate({ id: r.id })} className="p-1.5 text-[#0E7490] hover:bg-[#CFFAFE] rounded cursor-pointer"><Check size={13} /></button>}
          {(r.status === "SUBMITTED" || r.status === "MANAGER_APPROVED") && <button title="HR Approve" onClick={() => hrApproveMut.mutate({ id: r.id })} className="p-1.5 text-[#065F46] hover:bg-[#D1FAE5] rounded cursor-pointer"><Check size={13} /></button>}
          {(r.status === "SUBMITTED" || r.status === "MANAGER_APPROVED") && <button title="Reject" onClick={() => rejectMut.mutate({ id: r.id })} className="p-1.5 text-[var(--color-danger)] hover:bg-[#FEE2E2] rounded cursor-pointer"><XIcon size={13} /></button>}
          {(r.status === "DRAFT" || r.status === "SUBMITTED") && <button title="Cancel" onClick={() => cancelMut.mutate(r.id)} className="p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-bg)] rounded cursor-pointer"><Ban size={13} /></button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <LeaveTypesCard />
      <NewLeaveRequestForm />

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[var(--color-text-faint)]">{data?.total ?? 0} requests{isFetching ? " · refreshing…" : ""}</p>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${selectCls} w-auto h-9`}>
          <option value="All">All Statuses</option>
          {LEAVE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {isError ? (
        <Card className="p-6"><ErrorBanner message={(error as Error)?.message || "Failed to load leave requests."} /></Card>
      ) : (
        <DataTable<LeaveRequestDto>
          viewKey="hr-leave-requests"
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          loading={isLoading}
          emptyTitle="No leave requests"
          emptyDesc="Create a request above to get started."
          footer={<Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} pageSize={PER_PAGE} onPage={setPage} />}
        />
      )}
    </div>
  );
}