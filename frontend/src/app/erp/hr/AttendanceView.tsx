import { useState } from "react";
import { Save, Check, X as XIcon } from "lucide-react";
import { DataTable, type DataColumn } from "../../design-system";
import { ErrorBanner } from "../../lib/ds";
import {
  useAttendance, useUpsertAttendance, useAttendanceCorrections,
  useManagerApproveCorrection, useHrApproveCorrection, useRejectCorrection,
  useEmployees, type AttendanceDto, type AttendanceCorrectionDto,
} from "../../hooks/hr";
import { Card, Pagination, Field, PrimaryBtn, StatusPill, fmtDate, fmtDateTime, inputCls, selectCls } from "./ui";

const ATTENDANCE_STATUSES = ["PRESENT", "LATE", "EARLY_LEAVE", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY"];

function ManualUpsertForm() {
  const { data: empResult } = useEmployees({ pageSize: 50 });
  const upsertMut = useUpsertAttendance();
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [status, setStatus] = useState("PRESENT");

  const canSave = employeeId && date;
  const submit = () => {
    if (!canSave) return;
    upsertMut.mutate({
      employeeId, date, status,
      clockIn: clockIn ? `${date}T${clockIn}:00` : undefined,
      clockOut: clockOut ? `${date}T${clockOut}:00` : undefined,
    });
  };

  return (
    <Card className="p-4">
      <h3 className="text-[13px] font-black text-[var(--color-text)] mb-3">Record Attendance</h3>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <Field label="Employee" required>
          <select className={selectCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Select…</option>
            {(empResult?.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        </Field>
        <Field label="Date" required><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Clock In"><input type="time" className={inputCls} value={clockIn} onChange={(e) => setClockIn(e.target.value)} /></Field>
        <Field label="Clock Out"><input type="time" className={inputCls} value={clockOut} onChange={(e) => setClockOut(e.target.value)} /></Field>
        <Field label="Status">
          <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </Field>
        <PrimaryBtn onClick={submit} disabled={!canSave || upsertMut.isPending}><Save size={13} /> {upsertMut.isPending ? "Saving…" : "Save"}</PrimaryBtn>
      </div>
    </Card>
  );
}

function CorrectionsQueue() {
  const { data, isLoading, isError, error } = useAttendanceCorrections({ status: "PENDING" });
  const managerApproveMut = useManagerApproveCorrection();
  const hrApproveMut = useHrApproveCorrection();
  const rejectMut = useRejectCorrection();
  const rows = data?.data ?? [];

  return (
    <Card>
      <div className="px-5 py-3.5 border-b border-[var(--color-border-subtle)]">
        <h3 className="text-[13px] font-black text-[var(--color-text)]">Correction Requests</h3>
      </div>
      {isError ? <div className="p-4"><ErrorBanner message={(error as Error)?.message || "Failed to load corrections."} /></div> : isLoading ? (
        <p className="text-[12px] text-[var(--color-text-faint)] py-6 text-center">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-[12px] text-[var(--color-text-faint)] py-8 text-center">No pending correction requests.</p>
      ) : rows.map((c: AttendanceCorrectionDto) => (
        <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-subtle)] last:border-0">
          <div>
            <p className="text-[12.5px] font-semibold text-[var(--color-text)]">{c.employeeName} · {fmtDate(c.date)}</p>
            <p className="text-[10px] text-[var(--color-text-faint)]">
              {c.requestedClockIn && `In: ${fmtDateTime(c.requestedClockIn)} `}
              {c.requestedClockOut && `Out: ${fmtDateTime(c.requestedClockOut)} `}
              {c.requestedStatus && `Status: ${c.requestedStatus} `}
              {c.reason && `— ${c.reason}`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button title="Manager Approve" onClick={() => managerApproveMut.mutate({ id: c.id })} className="p-1.5 text-[#0E7490] hover:bg-[#CFFAFE] rounded cursor-pointer"><Check size={14} /></button>
            <button title="HR Approve" onClick={() => hrApproveMut.mutate({ id: c.id })} className="p-1.5 text-[#065F46] hover:bg-[#D1FAE5] rounded cursor-pointer"><Check size={14} /></button>
            <button title="Reject" onClick={() => rejectMut.mutate({ id: c.id })} className="p-1.5 text-[var(--color-danger)] hover:bg-[#FEE2E2] rounded cursor-pointer"><XIcon size={14} /></button>
          </div>
        </div>
      ))}
    </Card>
  );
}

export function AttendanceView() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;
  const { data, isLoading, isError, error, isFetching } = useAttendance({ from: date, to: date, page, pageSize: PER_PAGE });
  const rows = data?.data ?? [];

  const columns: DataColumn<AttendanceDto>[] = [
    { id: "employee", header: "Employee", cell: (r) => <div><div className="text-[12px] font-semibold text-[var(--color-text)]">{r.employeeName}</div><div className="text-[9px] text-[var(--color-text-faint)]">{r.employeeCode}</div></div> },
    { id: "date", header: "Date", cell: (r) => <span className="text-[11px] text-[var(--color-text-muted)]">{fmtDate(r.date)}</span> },
    { id: "in", header: "Clock In", cell: (r) => <span className="text-[11px] text-[var(--color-text-muted)]">{r.clockIn ? fmtDateTime(r.clockIn).slice(-5) : "—"}</span> },
    { id: "out", header: "Clock Out", cell: (r) => <span className="text-[11px] text-[var(--color-text-muted)]">{r.clockOut ? fmtDateTime(r.clockOut).slice(-5) : "—"}</span> },
    { id: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
    { id: "note", header: "Note", cell: (r) => <span className="text-[11px] text-[var(--color-text-faint)]">{r.note ?? "—"}</span> },
  ];

  return (
    <div className="space-y-4">
      <ManualUpsertForm />

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[var(--color-text-faint)]">{data?.total ?? 0} records{isFetching ? " · refreshing…" : ""}</p>
        <Field label="">
          <input type="date" className={`${inputCls} h-9`} value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
        </Field>
      </div>

      {isError ? (
        <Card className="p-6"><ErrorBanner message={(error as Error)?.message || "Failed to load attendance."} /></Card>
      ) : (
        <DataTable<AttendanceDto>
          viewKey="hr-attendance"
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          loading={isLoading}
          emptyTitle="No attendance records"
          emptyDesc="No records found for the selected date."
          footer={<Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} pageSize={PER_PAGE} onPage={setPage} />}
        />
      )}

      <CorrectionsQueue />
    </div>
  );
}
