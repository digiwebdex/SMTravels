import React, { useState } from "react";
import { Link } from "react-router";
import {
  CheckSquare, Calendar, Bell, Megaphone, MessageSquare, Activity,
  Shield, GitBranch, FolderOpen, Plus, Search, X, Check, Clock,
  AlertTriangle, Users, Filter, RefreshCw, Paperclip, Send,
  Eye, Edit2, Trash2, Circle, CheckCircle2, ArrowRight, FileText,
  Zap, Flag, Star, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  GripVertical, Download, Circle as Dot, Server, Database, HardDrive,
  MoreHorizontal, TrendingUp, Copy, Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { EmptyState } from "../lib/ds";
import { useMyNotifications, useMarkAllNotificationsRead, relAge } from "../hooks/notifications";
import { useUsers } from "../hooks/crm";
import {
  useTasks, useCreateTask, useUpdateTask,
  useAnnouncements, useCreateAnnouncement,
  useAuditLogs,
  statusUi, statusApi, priUi, fmtDue, fmtDate, TASK_STATUSES,
} from "../hooks/ops";
import { ModulePage } from "../design-system";

type OpsView =
  | "tasks" | "calendar" | "reminders" | "notifications"
  | "announcements" | "chat" | "activity" | "audit"
  | "workflow" | "documents";

const NAV: { id: OpsView; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: "tasks",         label: "Tasks",             icon: CheckSquare,   },
  { id: "calendar",      label: "Calendar",          icon: Calendar,      },
  { id: "reminders",     label: "Reminders",         icon: Bell,          },
  { id: "notifications", label: "Notifications",     icon: Bell,          },
  { id: "announcements", label: "Announcements",     icon: Megaphone,     },
  { id: "chat",          label: "Internal Chat",     icon: MessageSquare, },
  { id: "activity",      label: "Activity Logs",     icon: Activity,      },
  { id: "audit",         label: "Audit Logs",        icon: Shield,        },
  { id: "workflow",      label: "Workflow",           icon: GitBranch,     },
  { id: "documents",     label: "Document Manager",  icon: FolderOpen,    },
];

// ─── shared ────────────────────────────────────────────────────────────────
const PRIORITY_CFG: Record<string, { chip: string; dot: string }> = {
  high:   { chip: "bg-red-50 text-red-600 border-red-200",       dot: "bg-red-500"    },
  medium: { chip: "bg-amber-50 text-amber-600 border-amber-200", dot: "bg-amber-400"  },
  low:    { chip: "bg-slate-100 text-slate-500 border-[var(--color-border)]",dot: "bg-slate-400"  },
};
const STATUS_CFG: Record<string, string> = {
  "todo":        "bg-slate-100 text-slate-500",
  "in-progress": "bg-blue-50 text-blue-600",
  "done":        "bg-emerald-50 text-emerald-600",
  "blocked":     "bg-red-50 text-red-500",
};

function PriBadge({ p }: { p: string }) {
  const c = PRIORITY_CFG[p] ?? PRIORITY_CFG.low;
  return (
    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize", c.chip)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />{p}
    </span>
  );
}
function StBadge({ s }: { s: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_CFG[s] ?? STATUS_CFG.todo)}>
      {s.replace("-", " ")}
    </span>
  );
}
function Av({ name, color = "#1B75BC", size = "sm" }: { name: string; color?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-bold flex-shrink-0",
      size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm")}
      style={{ background: color }}>{name.slice(0, 2)}</div>
  );
}
function Card({ title, children, action, className }: {
  title?: string; children: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <p className="font-semibold text-slate-800 text-sm">{title}</p>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── TASKS ───────────────────────────────────────────────────────────────────
const COLS = [
  { id:"todo",        label:"To Do",       color:"bg-slate-400"   },
  { id:"in-progress", label:"In Progress", color:"bg-blue-500"    },
  { id:"blocked",     label:"Blocked",     color:"bg-red-500"     },
  { id:"done",        label:"Done",        color:"bg-emerald-500" },
];

function TasksView() {
  const [mode, setMode] = useState<"board"|"list">("board");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueAt, setDueAt] = useState("");

  const tasksQ = useTasks({ q: q || undefined, status: statusFilter });
  const createM = useCreateTask();
  const updateM = useUpdateTask();
  const usersQ = useUsers();
  const tasks = (tasksQ.data ?? []).map((t) => ({
    ...t,
    statusUi: statusUi(t.status),
    priUi: priUi(t.priority),
    assignee: t.assigneeName ?? "Unassigned",
  }));

  const setStatus = (id: string, next: string) => {
    updateM.mutate({ id, status: statusApi(next) as "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" });
  };
  const toggle = (id: string, current: string) => setStatus(id, current === "done" ? "todo" : "done");

  const submitCreate = () => {
    if (!title.trim()) return;
    createM.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority as "HIGH" | "MEDIUM" | "LOW",
        assigneeId: assigneeId || undefined,
        dueAt: dueAt || undefined,
      },
      { onSuccess: () => { setCreating(false); setTitle(""); setDescription(""); setAssigneeId(""); setDueAt(""); } },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…"
              className="pl-8 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none w-48" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 text-slate-600">
            <option>All</option>
            {COLS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(["board","list"] as const).map(v=>(
              <button key={v} onClick={()=>setMode(v)}
                className={cn("px-3 py-1.5 text-xs rounded-md capitalize transition-colors",
                  mode===v ? "bg-[var(--color-surface)] shadow text-slate-700 font-medium" : "text-slate-500")}>{v}</button>
            ))}
          </div>
          <button type="button" onClick={() => tasksQ.refetch()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <RefreshCw size={14} className={tasksQ.isFetching ? "animate-spin" : ""} />
          </button>
        </div>
        <button onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
          <Plus size={14}/> New Task
        </button>
      </div>

      {creating && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[#1B75BC]/20 p-5 mb-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title…"
            className="w-full text-base font-semibold border-none focus:outline-none text-slate-800 placeholder:text-slate-300" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description (optional)…"
            className="w-full text-sm text-slate-700 focus:outline-none resize-none placeholder:text-slate-300" />
          <div className="flex items-center gap-3 flex-wrap">
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2">
              <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
            </select>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
              className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2">
              <option value="">Unassigned</option>
              {(usersQ.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)}
              className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2" />
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setCreating(false)} className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg text-slate-600">Cancel</button>
              <button onClick={submitCreate} disabled={createM.isPending || !title.trim()}
                className="px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5">
                {createM.isPending && <Loader2 size={13} className="animate-spin" />} Create
              </button>
            </div>
          </div>
        </div>
      )}

      {tasksQ.isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={24} className="animate-spin" /></div>
      ) : mode === "board" ? (
        <div className="grid grid-cols-4 gap-4">
          {COLS.map(col => {
            const ct = tasks.filter(t=>t.statusUi===col.id);
            return (
              <div key={col.id} className="bg-slate-100 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", col.color)} />
                    <span className="text-xs font-semibold text-slate-600">{col.label}</span>
                    <span className="text-xs bg-[var(--color-surface)] text-slate-500 px-1.5 py-0.5 rounded-full border border-[var(--color-border)]">{ct.length}</span>
                  </div>
                </div>
                {ct.map(t=>(
                  <div key={t.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-2 mb-2">
                      <button onClick={()=>toggle(t.id, t.statusUi)} className="mt-0.5 flex-shrink-0">
                        {t.statusUi==="done" ? <CheckCircle2 size={15} className="text-emerald-500 fill-emerald-500"/> : <Circle size={15} className="text-slate-300"/>}
                      </button>
                      <p className={cn("text-xs font-medium leading-snug flex-1", t.statusUi==="done"?"line-through text-slate-400":"text-slate-700")}>{t.title}</p>
                    </div>
                    {t.category && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs px-1.5 py-0.5 bg-[#1B75BC]/8 text-[#1B75BC] rounded-md">{t.category}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-1">
                      <PriBadge p={t.priUi}/>
                      <select value={t.statusUi} onChange={(e) => setStatus(t.id, e.target.value)}
                        className="text-xs border border-[var(--color-border)] rounded px-1 py-0.5 text-slate-600">
                        {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                      <span>{t.assignee}</span>
                      <span className="flex items-center gap-0.5"><Clock size={10}/>{fmtDue(t.dueAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {["","Task","Assignee","Priority","Status","Due","Category"].map((h,i)=>(
                <th key={i} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>{tasks.map(t=>(
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3"><button onClick={()=>toggle(t.id, t.statusUi)}>
                  {t.statusUi==="done"?<CheckCircle2 size={15} className="text-emerald-500 fill-emerald-500"/>:<Circle size={15} className="text-slate-300"/>}
                </button></td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700 max-w-xs">
                  <span className={cn(t.statusUi==="done"&&"line-through text-slate-400")}>{t.title}</span>
                </td>
                <td className="px-4 py-3"><div className="flex items-center gap-1.5"><Av name={t.assignee}/><span className="text-sm text-slate-600">{t.assignee}</span></div></td>
                <td className="px-4 py-3"><PriBadge p={t.priUi}/></td>
                <td className="px-4 py-3">
                  <select value={t.statusUi} onChange={(e) => setStatus(t.id, e.target.value)}
                    className="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1 text-slate-600">
                    {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{fmtDue(t.dueAt)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{t.category ?? "—"}</td>
              </tr>
            ))}</tbody>
          </table>
          {tasks.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No tasks yet.</p>}
        </Card>
      )}
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

function CalendarView() {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
      <EmptyState
        variant="no-data"
        title="No events scheduled"
        desc="Nothing scheduled yet."
      />
    </div>
  );
}

// ─── REMINDERS ───────────────────────────────────────────────────────────────

function RemindersView() {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Reminders</h2>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState
          variant="no-data"
          title="No reminders"
          desc="Nothing scheduled yet."
        />
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
function NotificationsView() {
  const q = useMyNotifications();
  const markAll = useMarkAllNotificationsRead();
  const items = q.data ?? [];
  const unread = items.filter(n => !n.read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-xl font-bold text-slate-800">Notifications</h2><p className="text-sm text-slate-500">{unread} unread</p></div>
        <div className="flex gap-2">
          <button onClick={() => markAll.mutate()} disabled={markAll.isPending || unread === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50">
            <Check size={13}/> Mark all read
          </button>
          <button type="button" onClick={() => q.refetch()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <RefreshCw size={14} className={q.isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      {q.isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={24} className="animate-spin" /></div>
      ) : (
      <div className="space-y-2">
        {items.map(n=>(
          <div key={n.id}
            className={cn("flex items-start gap-4 p-4 rounded-xl border transition-all",
              n.read ? "bg-[var(--color-surface)] border-slate-100" : "bg-[#1B75BC]/3 border-[#1B75BC]/15")}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1B75BC]/10">
              <Bell size={16} className="text-[#1B75BC]" style={n.color ? { color: n.color } : undefined} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full bg-[#1B75BC] flex-shrink-0"/>}
              </div>
              {n.body && <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>}
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">{relAge(n.createdAt)} ago</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No notifications yet.</p>}
      </div>
      )}
    </div>
  );
}

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
function AnnouncementsView() {
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("All Staff");
  const [pinned, setPinned] = useState(false);

  const annQ = useAnnouncements();
  const createM = useCreateAnnouncement();
  const items = annQ.data ?? [];

  const submit = () => {
    if (!title.trim() || !body.trim()) return;
    createM.mutate(
      { title: title.trim(), body: body.trim(), audience, pinned },
      { onSuccess: () => { setComposing(false); setTitle(""); setBody(""); setPinned(false); } },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-800">Announcements</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => annQ.refetch()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <RefreshCw size={14} className={annQ.isFetching ? "animate-spin" : ""} />
          </button>
          <button onClick={()=>setComposing(v=>!v)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]"><Plus size={14}/> New Announcement</button>
        </div>
      </div>
      {composing && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[#1B75BC]/20 p-5 mb-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title…"
            className="w-full text-base font-semibold border-none focus:outline-none text-slate-800 placeholder:text-slate-300"/>
          <div className="h-px bg-slate-100"/>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Write your announcement here…"
            className="w-full text-sm text-slate-700 focus:outline-none resize-none placeholder:text-slate-300"/>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={audience} onChange={(e) => setAudience(e.target.value)}
              className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2">
              <option>All Staff</option><option>Sales Team</option><option>Visa Team</option><option>Accounts</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded"/> Pin announcement
            </label>
            <div className="flex gap-2 ml-auto">
              <button onClick={()=>setComposing(false)} className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg text-slate-600">Cancel</button>
              <button onClick={submit} disabled={createM.isPending || !title.trim() || !body.trim()}
                className="px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5">
                {createM.isPending && <Loader2 size={13} className="animate-spin" />} Post
              </button>
            </div>
          </div>
        </div>
      )}
      {annQ.isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={24} className="animate-spin" /></div>
      ) : (
      <div className="space-y-3">
        {items.map(a=>(
          <div key={a.id} className={cn("bg-[var(--color-surface)] rounded-xl border p-5", a.pinned?"border-[#F15A24]/40 bg-[#F15A24]/3":"border-[var(--color-border)]")}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {a.pinned && <span className="flex items-center gap-1 text-xs text-[#D64A12] font-medium"><Flag size={11} className="fill-[#F15A24]"/> Pinned</span>}
                <h3 className="font-semibold text-slate-800">{a.title}</h3>
              </div>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{a.audience ?? "All Staff"}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">{a.body}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Av name={a.authorName ?? "Staff"} size="sm"/><span>{a.authorName ?? "Staff"}</span><span>·</span><span>{fmtDate(a.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No announcements yet.</p>}
      </div>
      )}
    </div>
  );
}

// ─── INTERNAL CHAT ────────────────────────────────────────────────────────────

function ChatView() {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
      <EmptyState
        variant="coming-soon"
        title="Internal chat"
        desc="Team chat is planned for a later release."
      />
    </div>
  );
}

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────

function ActivityView() {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Activity Logs</h2>
        <p className="text-sm text-slate-500">All staff actions across the system</p>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState
          variant="no-data"
          title="No activity yet"
          desc="Nothing logged yet."
        />
      </div>
    </div>
  );
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
const SEV_CFG: Record<string,string> = {
  info:     "bg-blue-50 text-blue-600 border-blue-200",
  warning:  "bg-amber-50 text-amber-600 border-amber-200",
  critical: "bg-red-50 text-red-600 border-red-200",
  INFO:     "bg-blue-50 text-blue-600 border-blue-200",
  WARNING:  "bg-amber-50 text-amber-600 border-amber-200",
  CRITICAL: "bg-red-50 text-red-600 border-red-200",
};

function AuditView() {
  const auditQ = useAuditLogs();
  const logs = auditQ.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-xl font-bold text-slate-800">Audit Logs</h2><p className="text-sm text-slate-500">Security-critical event trail</p></div>
        <button type="button" onClick={() => auditQ.refetch()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
          <RefreshCw size={14} className={auditQ.isFetching ? "animate-spin" : ""} />
        </button>
      </div>
      {auditQ.isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={24} className="animate-spin" /></div>
      ) : (
      <Card>
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {["Time","User","IP Address","Event","Resource","Severity"].map(h=>(
              <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
            ))}
          </tr></thead>
          <tbody>{logs.map((log)=>(
            <tr key={log.id} className={cn("border-b border-slate-50 hover:bg-slate-50",
              (log.severity === "critical" || log.severity === "CRITICAL") && "bg-red-50/30")}>
              <td className="px-4 py-3 text-xs text-slate-400 font-mono">{fmtDate(log.createdAt)}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-1.5">
                <Av name={log.userName ?? "Unknown"} size="sm" color={!log.userName ? "#EF4444" : "#1B75BC"}/>
                <span className="text-sm text-slate-700">{log.userName ?? "Unknown"}</span>
              </div></td>
              <td className="px-4 py-3 text-xs text-slate-500 font-mono">{log.ip ?? "—"}</td>
              <td className="px-4 py-3 text-sm font-mono text-slate-700">{log.event}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{log.resource ?? "—"}</td>
              <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border capitalize", SEV_CFG[log.severity] ?? SEV_CFG.info)}>{log.severity.toLowerCase()}</span></td>
            </tr>
          ))}</tbody>
        </table>
        {logs.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No audit logs yet.</p>}
      </Card>
      )}
    </div>
  );
}

// ─── WORKFLOW ────────────────────────────────────────────────────────────────

function WorkflowView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Workflow Automation</h2>
        <p className="text-sm text-slate-500">Automated business process flows</p>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState
          variant="coming-soon"
          title="Workflow automation"
          desc="Workflow automation is planned for a later release."
        />
      </div>
    </div>
  );
}

// ─── DOCUMENT MANAGER ────────────────────────────────────────────────────────

function DocumentsView() {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Document Manager</h2>
        <p className="text-sm text-slate-500">Internal SOPs and operational documents</p>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState
          variant="no-data"
          title="No documents"
          desc="Nothing uploaded yet."
        />
      </div>
    </div>
  );
}

// ─── MODULE ROOT ─────────────────────────────────────────────────────────────
export function OperationsModule() {
  const [view, setView] = useState<OpsView>("tasks");
  return (
    <div className="p-5 md:p-7">
      <ModulePage title="Operations" subtitle="Tasks, calendar, reminders & internal workflows">
      <div className="flex min-h-[70vh] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden bg-[#F0F2F5]">
        <div className="w-56 flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
          <div className="px-4 py-4 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operations</h2>
          </div>
          <nav className="flex-1 py-2 overflow-y-auto no-scrollbar">
            {NAV.map(item=>{
              const cls = cn("w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                view===item.id?"bg-[#1B75BC]/8 text-[#1B75BC] font-medium border-r-2 border-[#1B75BC]":"text-slate-600 hover:bg-slate-50");
              if (item.id === "documents") {
                return (
                  <Link key={item.id} to="/erp/documents" className={cls}>
                    <item.icon size={15} className="text-slate-400"/>
                    <span className="flex-1 text-left">{item.label}</span>
                  </Link>
                );
              }
              return (
              <button key={item.id} onClick={()=>setView(item.id)}
                className={cls}>
                <item.icon size={15} className={view===item.id?"text-[#1B75BC]":"text-slate-400"}/>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{item.badge}</span>}
              </button>
              );
            })}
          </nav>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {view==="tasks"         && <TasksView/>}
          {view==="calendar"      && <CalendarView/>}
          {view==="reminders"     && <RemindersView/>}
          {view==="notifications" && <NotificationsView/>}
          {view==="announcements" && <AnnouncementsView/>}
          {view==="chat"          && <ChatView/>}
          {view==="activity"      && <ActivityView/>}
          {view==="audit"         && <AuditView/>}
          {view==="workflow"      && <WorkflowView/>}
        </div>
      </div>
      </ModulePage>
    </div>
  );
}
