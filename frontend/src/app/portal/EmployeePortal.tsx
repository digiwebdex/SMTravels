import { useState } from "react";
import {
  User, FileText, CalendarDays, Clock3, Bell, LogOut, Download,
  Play, Square, Plus, Phone, Mail, Building2, Briefcase, KeyRound, Sparkles, Check, Shield,
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "../design-system";
import { cn } from "../lib/utils";
import { useAuth } from "../auth/AuthContext";
import { SkeletonPage } from "../lib/ds";
import { useMyNotifications, useMarkAllNotificationsRead, relAge } from "../hooks/notifications";
import {
  useHrMe, useUpdateHrMe, useMyLeaveRequests, useCreateMyLeaveRequest, useMyLeaveTypes,
  useMyAttendance, useClockIn, useClockOut, useCreateMyAttendanceCorrection,
  downloadMyDocument, useChangePassword, useMyApprovals,
  useManagerApproveLeave, useManagerApproveCorrection, useRejectLeaveRequest, useRejectCorrection,
} from "../hooks/hr";

type PortalView = "profile" | "documents" | "leave" | "attendance" | "approvals" | "notifications" | "assistant" | "password";

const NAV: { id: PortalView; icon: typeof User; label: string }[] = [
  { id: "profile", icon: User, label: "My Profile" },
  { id: "documents", icon: FileText, label: "My Documents" },
  { id: "leave", icon: CalendarDays, label: "Leave" },
  { id: "attendance", icon: Clock3, label: "Attendance" },
  { id: "approvals", icon: Shield, label: "Approvals" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "assistant", icon: Sparkles, label: "AI Assistant" },
  { id: "password", icon: KeyRound, label: "Change Password" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}
function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(11, 16);
}

const inputCls = "w-full px-3 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]";

function KV({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: typeof User }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[13px] font-semibold text-[var(--color-text)] flex items-center gap-1.5">{Icon && <Icon size={12} className="text-[var(--color-text-faint)]" />}{value || <span className="text-[var(--color-text-faint)]">—</span>}</div>
    </div>
  );
}

// ─── PROFILE ────────────────────────────────────────────────────────────────
function ProfileView() {
  const { data: me } = useHrMe();
  const updateMut = useUpdateHrMe();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [presentAddress, setPresentAddress] = useState("");

  if (!me) return null;
  const initials = `${me.firstName[0] ?? ""}${me.lastName[0] ?? ""}`.toUpperCase();

  const startEdit = () => {
    setPhone(me.phone ?? "");
    setEmail(me.email ?? "");
    setEmergencyName(me.emergencyContactName ?? "");
    setEmergencyPhone(me.emergencyContactPhone ?? "");
    setPresentAddress(me.presentAddress ?? "");
    setEditing(true);
  };

  const save = () => {
    updateMut.mutate({
      phone: phone.trim() || null,
      email: email.trim() || null,
      emergencyContactName: emergencyName.trim() || null,
      emergencyContactPhone: emergencyPhone.trim() || null,
      presentAddress: presentAddress.trim() || null,
    }, { onSuccess: () => setEditing(false) });
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-[var(--color-primary)] to-[#14588F] rounded-[var(--radius-lg)] p-5 text-white flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-black flex-shrink-0">{initials}</div>
        <div>
          <p className="text-xl font-bold">{me.fullName}</p>
          <p className="text-white/70 text-sm mt-0.5">{me.designationName ?? "Employee"} · {me.branchName}</p>
          <p className="text-white/60 text-xs mt-1 font-mono">{me.employeeCode}</p>
        </div>
      </div>

      {!editing ? (
        <>
          <div className="flex justify-end">
            <button type="button" onClick={startEdit}
              className="h-9 px-3.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[12px] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 cursor-pointer">
              Edit personal info
            </button>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 grid grid-cols-2 gap-4">
            <KV label="Phone" value={me.phone} icon={Phone} />
            <KV label="Email" value={me.email} icon={Mail} />
            <KV label="Department" value={me.departmentName} icon={Building2} />
            <KV label="Designation" value={me.designationName} icon={Briefcase} />
            <KV label="Manager" value={me.managerName} />
            <KV label="Joining Date" value={fmtDate(me.joiningDate)} />
            <KV label="Employment Type" value={me.employmentType?.replace(/_/g, " ")} />
            <KV label="Status" value={me.status?.replace(/_/g, " ")} />
            <KV label="Emergency Contact" value={me.emergencyContactName} />
            <KV label="Emergency Phone" value={me.emergencyContactPhone} />
            <div className="col-span-2"><KV label="Present Address" value={me.presentAddress} /></div>
          </div>
        </>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-3">
          <p className="text-[13px] font-bold text-[var(--color-text)]">Personal information</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">Phone</label><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">Email</label><input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">Emergency Contact</label><input className={inputCls} value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} /></div>
            <div><label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">Emergency Phone</label><input className={inputCls} value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">Present Address</label><input className={inputCls} value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setEditing(false)} className="h-9 px-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[12px] cursor-pointer">Cancel</button>
            <button type="button" onClick={save} disabled={updateMut.isPending}
              className="h-9 px-4 bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-[var(--radius-sm)] text-[12px] font-bold disabled:opacity-60 cursor-pointer">
              {updateMut.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DOCUMENTS (read-only) ──────────────────────────────────────────────────
function DocumentsView() {
  const { data: me } = useHrMe();
  const docs = me?.documents ?? [];
  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-bold text-[var(--color-text)]">My Documents</h2>
      {docs.length === 0 ? (
        <p className="text-[12px] text-[var(--color-text-faint)] text-center py-10">No documents on file yet.</p>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] divide-y divide-[var(--color-border-subtle)]">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-primary-tint)] flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-[var(--color-primary)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-[var(--color-text)] truncate">{d.title}</p>
                  <p className="text-[10px] text-[var(--color-text-faint)]">{d.type.replace(/_/g, " ")}{d.expiryDate ? ` · expires ${fmtDate(d.expiryDate)}` : ""}</p>
                </div>
              </div>
              <button type="button" onClick={() => downloadMyDocument(d)} aria-label={`Download ${d.title}`}
                className="text-[var(--color-text-faint)] hover:text-[var(--color-primary)] cursor-pointer p-1.5 flex-shrink-0">
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LEAVE ──────────────────────────────────────────────────────────────────
function LeaveView() {
  const { data: me } = useHrMe();
  const { data: requests } = useMyLeaveRequests();
  const { data: leaveTypes } = useMyLeaveTypes();
  const createMut = useCreateMyLeaveRequest();
  const [showForm, setShowForm] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const balances = me?.leaveBalances ?? [];
  const canSave = leaveTypeId && fromDate && toDate;
  const submit = () => {
    if (!canSave) return;
    createMut.mutate({ leaveTypeId, fromDate, toDate, reason: reason.trim() || undefined, submit: true }, {
      onSuccess: () => { setShowForm(false); setLeaveTypeId(""); setFromDate(""); setToDate(""); setReason(""); },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[var(--color-text)]">Leave</h2>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 h-9 px-3.5 bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-[var(--radius-sm)] text-[12px] font-bold hover:bg-[var(--color-primary-hover)] cursor-pointer">
          <Plus size={13} /> Request Leave
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 space-y-3">
          <select className={inputCls} value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
            <option value="">Select leave type…</option>
            {(leaveTypes ?? []).map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className={inputCls} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <input type="date" className={inputCls} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
          <button onClick={submit} disabled={!canSave || createMut.isPending}
            className="w-full h-10 bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-[var(--radius-sm)] text-[12px] font-bold disabled:opacity-60 cursor-pointer">
            {createMut.isPending ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {balances.map((b) => (
          <div key={`${b.leaveTypeId}-${b.year ?? "y"}`} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-3.5">
            <p className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wide">{b.leaveTypeName}{b.year != null ? ` · ${b.year}` : ""}</p>
            <p className="text-[18px] font-black text-[var(--color-text)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.available}</p>
            <p className="text-[10px] text-[var(--color-text-faint)]">available · {b.used} used</p>
          </div>
        ))}
        {balances.length === 0 && <p className="col-span-full text-[12px] text-[var(--color-text-faint)] text-center py-4">No leave balances yet.</p>}
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] divide-y divide-[var(--color-border-subtle)]">
        <div className="px-4 py-3"><p className="text-[12px] font-bold text-[var(--color-text)]">My Requests</p></div>
        {(requests?.data ?? []).length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] text-center py-6">No leave requests yet.</p>}
        {(requests?.data ?? []).map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-[12px] font-semibold text-[var(--color-text)]">{r.leaveTypeName}</p>
              <p className="text-[10px] text-[var(--color-text-faint)]">{fmtDate(r.fromDate)} → {fmtDate(r.toDate)} · {r.days} day(s)</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-muted)]">{r.status.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ATTENDANCE ─────────────────────────────────────────────────────────────
function AttendanceView() {
  const { data } = useMyAttendance();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const correctionMut = useCreateMyAttendanceCorrection();
  const rows = data?.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = rows.find((r) => r.date.slice(0, 10) === today);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [reqIn, setReqIn] = useState("");
  const [reqOut, setReqOut] = useState("");
  const [reason, setReason] = useState("");

  const submitCorrection = () => {
    if (!correctId) return;
    const row = rows.find((r) => r.id === correctId);
    if (!row) return;
    const date = row.date.slice(0, 10);
    correctionMut.mutate({
      attendanceId: correctId,
      requestedClockIn: reqIn ? `${date}T${reqIn}:00` : undefined,
      requestedClockOut: reqOut ? `${date}T${reqOut}:00` : undefined,
      reason: reason.trim() || undefined,
    }, {
      onSuccess: () => { setCorrectId(null); setReqIn(""); setReqOut(""); setReason(""); },
    });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-[15px] font-bold text-[var(--color-text)]">Attendance</h2>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] text-[var(--color-text-faint)]">Today</p>
          <p className="text-[13px] font-semibold text-[var(--color-text)]">
            {todayRow?.clockIn ? `In: ${fmtTime(todayRow.clockIn)}` : "Not clocked in"}
            {todayRow?.clockOut ? ` · Out: ${fmtTime(todayRow.clockOut)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => clockIn.mutate()} disabled={clockIn.isPending || !!todayRow?.clockIn}
            className="flex items-center gap-1.5 h-9 px-4 bg-[var(--color-success,#0E7C66)] text-white rounded-[var(--radius-sm)] text-[12px] font-bold disabled:opacity-50 cursor-pointer">
            <Play size={13} /> Clock In
          </button>
          <button onClick={() => clockOut.mutate()} disabled={clockOut.isPending || !todayRow?.clockIn || !!todayRow?.clockOut}
            className="flex items-center gap-1.5 h-9 px-4 bg-[var(--color-danger)] text-white rounded-[var(--radius-sm)] text-[12px] font-bold disabled:opacity-50 cursor-pointer">
            <Square size={13} /> Clock Out
          </button>
        </div>
      </div>

      {correctId && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 space-y-3">
          <p className="text-[12px] font-bold text-[var(--color-text)]">Request attendance correction</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">Requested In</label><input type="time" className={inputCls} value={reqIn} onChange={(e) => setReqIn(e.target.value)} /></div>
            <div><label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">Requested Out</label><input type="time" className={inputCls} value={reqOut} onChange={(e) => setReqOut(e.target.value)} /></div>
          </div>
          <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setCorrectId(null)} className="h-9 px-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[12px] cursor-pointer">Cancel</button>
            <button type="button" onClick={submitCorrection} disabled={correctionMut.isPending || (!reqIn && !reqOut)}
              className="h-9 px-4 bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-[var(--radius-sm)] text-[12px] font-bold disabled:opacity-60 cursor-pointer">
              {correctionMut.isPending ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] divide-y divide-[var(--color-border-subtle)]">
        <div className="px-4 py-3"><p className="text-[12px] font-bold text-[var(--color-text)]">History</p></div>
        {rows.length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] text-center py-6">No attendance records yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-2">
            <p className="text-[12px] font-semibold text-[var(--color-text)]">{fmtDate(r.date)}</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">{fmtTime(r.clockIn)} – {fmtTime(r.clockOut)}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-muted)]">{r.status.replace(/_/g, " ")}</span>
            <button type="button" onClick={() => setCorrectId(r.id)}
              className="text-[10px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer">Correct</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MANAGER APPROVALS ──────────────────────────────────────────────────────
function ApprovalsView() {
  const { data, isLoading, refetch } = useMyApprovals();
  const leaveApprove = useManagerApproveLeave();
  const leaveReject = useRejectLeaveRequest();
  const corrApprove = useManagerApproveCorrection();
  const corrReject = useRejectCorrection();
  const leave = data?.leave ?? [];
  const corrections = data?.corrections ?? [];

  const done = () => { void refetch(); };

  if (isLoading) return <p className="text-[12px] text-[var(--color-text-faint)] py-8 text-center">Loading…</p>;

  return (
    <div className="space-y-5">
      <h2 className="text-[15px] font-bold text-[var(--color-text)]">Team Approvals</h2>
      <p className="text-[12px] text-[var(--color-text-faint)]">Leave and attendance corrections from your direct reports.</p>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] divide-y divide-[var(--color-border-subtle)]">
        <div className="px-4 py-3"><p className="text-[12px] font-bold text-[var(--color-text)]">Leave ({leave.length})</p></div>
        {leave.length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] text-center py-6">No leave awaiting your approval.</p>}
        {leave.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-2">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[var(--color-text)]">{r.employeeName} · {r.leaveTypeName}</p>
              <p className="text-[10px] text-[var(--color-text-faint)]">{fmtDate(r.fromDate)} → {fmtDate(r.toDate)} · {r.days} day(s)</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button type="button" title="Approve" onClick={() => leaveApprove.mutate({ id: r.id }, { onSuccess: done })}
                className="p-1.5 text-[#065F46] hover:bg-[#D1FAE5] rounded cursor-pointer"><Check size={14} /></button>
              <button type="button" title="Reject" onClick={() => leaveReject.mutate({ id: r.id }, { onSuccess: done })}
                className="p-1.5 text-[var(--color-danger)] hover:bg-[#FEE2E2] rounded cursor-pointer text-[11px] font-bold px-2">Reject</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] divide-y divide-[var(--color-border-subtle)]">
        <div className="px-4 py-3"><p className="text-[12px] font-bold text-[var(--color-text)]">Attendance corrections ({corrections.length})</p></div>
        {corrections.length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] text-center py-6">No corrections awaiting your approval.</p>}
        {corrections.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-2">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[var(--color-text)]">{c.employeeName} · {fmtDate(c.date)}</p>
              <p className="text-[10px] text-[var(--color-text-faint)]">{c.reason ?? "Correction request"}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button type="button" title="Approve" onClick={() => corrApprove.mutate({ id: c.id }, { onSuccess: done })}
                className="p-1.5 text-[#065F46] hover:bg-[#D1FAE5] rounded cursor-pointer"><Check size={14} /></button>
              <button type="button" title="Reject" onClick={() => corrReject.mutate({ id: c.id }, { onSuccess: done })}
                className="p-1.5 text-[var(--color-danger)] hover:bg-[#FEE2E2] rounded cursor-pointer text-[11px] font-bold px-2">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
function NotificationsView() {
  const q = useMyNotifications();
  const markAll = useMarkAllNotificationsRead();
  const list = q.data ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[var(--color-text)]">Notifications</h2>
        <button onClick={() => markAll.mutate()} disabled={markAll.isPending || list.every((n) => n.read)}
          className="text-[12px] text-[var(--color-primary)] font-semibold hover:underline disabled:opacity-50 cursor-pointer">Mark all read</button>
      </div>
      {list.length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] text-center py-8">Nothing here yet.</p>}
      <div className="space-y-2">
        {list.map((n) => (
          <div key={n.id} className={cn("flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] border",
            n.read ? "bg-[var(--color-surface)] border-[var(--color-border)]" : "bg-[var(--color-primary-tint)] border-[var(--color-primary)]/20")}>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-[var(--color-text)]">{n.title}</p>
              {n.body && <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{n.body}</p>}
            </div>
            <span className="text-[10px] text-[var(--color-text-faint)] flex-shrink-0">{relAge(n.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI ASSISTANT (live insights from portal data) ──────────────────────────
function AssistantView() {
  const { data: me } = useHrMe();
  const { data: leave } = useMyLeaveRequests();
  const { data: attendance } = useMyAttendance();
  if (!me) return null;

  const insights: string[] = [];
  const lowBal = (me.leaveBalances ?? []).filter((b) => b.available <= 2 && b.available >= 0);
  if (lowBal.length > 0) insights.push(`Low leave balance on: ${lowBal.map((b) => b.leaveTypeName).join(", ")}.`);
  const pendingLeave = (leave?.data ?? []).filter((r) => r.status === "SUBMITTED" || r.status === "MANAGER_APPROVED");
  if (pendingLeave.length > 0) insights.push(`You have ${pendingLeave.length} leave request(s) still in approval.`);
  const expiring = (me.documents ?? []).filter((d) => {
    if (!d.expiryDate) return false;
    const days = Math.round((new Date(d.expiryDate).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days <= 30;
  });
  if (expiring.length > 0) insights.push(`${expiring.length} of your document(s) expire within 30 days — contact HR to renew.`);
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = (attendance?.data ?? []).find((r) => r.date.slice(0, 10) === today);
  if (!todayRow?.clockIn) insights.push("You have not clocked in today yet.");
  else if (!todayRow.clockOut) insights.push("You are clocked in — remember to clock out when you finish.");
  if (insights.length === 0) insights.push("Everything looks current — no urgent actions on your profile.");

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-bold text-[var(--color-text)] flex items-center gap-2"><Sparkles size={16} className="text-[var(--color-primary)]" /> AI Assistant</h2>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
        <p className="text-[12px] text-[var(--color-text-muted)] mb-3">Insights from your live HR data (leave, attendance, documents).</p>
        <ul className="text-[13px] text-[var(--color-text)] space-y-2 list-disc pl-5">
          {insights.map((i, idx) => <li key={idx}>{i}</li>)}
        </ul>
      </div>
    </div>
  );
}

// ─── CHANGE PASSWORD ────────────────────────────────────────────────────────
function PasswordView() {
  const { logout } = useAuth();
  const mut = useChangePassword();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const canSave = currentPassword && newPassword.length >= 8 && newPassword === confirm;

  const submit = () => {
    if (!canSave) return;
    mut.mutate({ currentPassword, newPassword }, {
      onSuccess: () => { void logout(); },
    });
  };

  return (
    <div className="space-y-4 max-w-md">
      <h2 className="text-[15px] font-bold text-[var(--color-text)]">Change Password</h2>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-3">
        <div><label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">Current password</label><input type="password" className={inputCls} value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" /></div>
        <div><label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">New password</label><input type="password" className={inputCls} value={newPassword} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" /></div>
        <div><label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">Confirm new password</label><input type="password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></div>
        {newPassword && confirm && newPassword !== confirm && <p className="text-[11px] text-[var(--color-danger)]">Passwords do not match.</p>}
        <button type="button" onClick={submit} disabled={!canSave || mut.isPending}
          className="w-full h-10 bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-[var(--radius-sm)] text-[12px] font-bold disabled:opacity-60 cursor-pointer">
          {mut.isPending ? "Updating…" : "Update password"}
        </button>
      </div>
    </div>
  );
}

// ─── SHELL ──────────────────────────────────────────────────────────────────
export function EmployeePortal() {
  const { user, logout } = useAuth();
  const { data: me, isLoading, isError } = useHrMe();
  const [view, setView] = useState<PortalView>("profile");

  const navItems: PortalNavItem[] = NAV;

  if (isLoading) return <SkeletonPage />;
  if (isError || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
        <div className="max-w-sm w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 text-center space-y-3">
          <User size={32} className="mx-auto text-[var(--color-text-faint)]" />
          <h1 className="text-[15px] font-bold text-[var(--color-text)]">No employee profile linked</h1>
          <p className="text-[12px] text-[var(--color-text-faint)]">Your account isn't linked to an HR employee record yet. Contact HR to get set up.</p>
          <button onClick={() => void logout()} className="mt-2 flex items-center gap-1.5 mx-auto h-9 px-4 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[12px] font-medium text-[var(--color-text-muted)] hover:border-[var(--color-danger)]/40 hover:text-[var(--color-danger)] cursor-pointer">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case "profile": return <ProfileView />;
      case "documents": return <DocumentsView />;
      case "leave": return <LeaveView />;
      case "attendance": return <AttendanceView />;
      case "approvals": return <ApprovalsView />;
      case "notifications": return <NotificationsView />;
      case "assistant": return <AssistantView />;
      case "password": return <PasswordView />;
    }
  };

  return (
    <PortalShell
      title="My Portal"
      navItems={navItems}
      activeId={view}
      onNav={(id) => setView(id as PortalView)}
      onLogout={() => void logout()}
      userName={me.fullName ?? user?.name}
    >
      <div className="max-w-2xl mx-auto">{renderView()}</div>
    </PortalShell>
  );
}

export default EmployeePortal;
