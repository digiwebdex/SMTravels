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
import { SampleBadge } from "../portal/SampleBadge";
import { useMyNotifications, useMarkAllNotificationsRead, relAge } from "../hooks/notifications";
import { useUsers } from "../hooks/crm";
import {
  useTasks, useCreateTask, useUpdateTask,
  useAnnouncements, useCreateAnnouncement,
  useAuditLogs,
  statusUi, statusApi, priUi, fmtDue, fmtDate, TASK_STATUSES,
} from "../hooks/ops";

type OpsView =
  | "tasks" | "calendar" | "reminders" | "notifications"
  | "announcements" | "chat" | "activity" | "audit"
  | "workflow" | "documents";

const NAV: { id: OpsView; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: "tasks",         label: "Tasks",             icon: CheckSquare,   },
  { id: "calendar",      label: "Calendar",          icon: Calendar,      },
  { id: "reminders",     label: "Reminders",         icon: Bell,          badge: 4 },
  { id: "notifications", label: "Notifications",     icon: Bell,          badge: 3 },
  { id: "announcements", label: "Announcements",     icon: Megaphone,     },
  { id: "chat",          label: "Internal Chat",     icon: MessageSquare, badge: 2 },
  { id: "activity",      label: "Activity Logs",     icon: Activity,      },
  { id: "audit",         label: "Audit Logs",        icon: Shield,        },
  { id: "workflow",      label: "Workflow",           icon: GitBranch,     },
  { id: "documents",     label: "Document Manager",  icon: FolderOpen,    },
];

// ─── shared ────────────────────────────────────────────────────────────────
const PRIORITY_CFG: Record<string, { chip: string; dot: string }> = {
  high:   { chip: "bg-red-50 text-red-600 border-red-200",       dot: "bg-red-500"    },
  medium: { chip: "bg-amber-50 text-amber-600 border-amber-200", dot: "bg-amber-400"  },
  low:    { chip: "bg-slate-100 text-slate-500 border-slate-200",dot: "bg-slate-400"  },
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
    <div className={cn("bg-white rounded-xl border border-slate-200 overflow-hidden", className)}>
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
              className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none w-48" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600">
            <option>All</option>
            {COLS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(["board","list"] as const).map(v=>(
              <button key={v} onClick={()=>setMode(v)}
                className={cn("px-3 py-1.5 text-xs rounded-md capitalize transition-colors",
                  mode===v ? "bg-white shadow text-slate-700 font-medium" : "text-slate-500")}>{v}</button>
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
        <div className="bg-white rounded-xl border border-[#1B75BC]/20 p-5 mb-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title…"
            className="w-full text-base font-semibold border-none focus:outline-none text-slate-800 placeholder:text-slate-300" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description (optional)…"
            className="w-full text-sm text-slate-700 focus:outline-none resize-none placeholder:text-slate-300" />
          <div className="flex items-center gap-3 flex-wrap">
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2">
              <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
            </select>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2">
              <option value="">Unassigned</option>
              {(usersQ.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2" />
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setCreating(false)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600">Cancel</button>
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
                    <span className="text-xs bg-white text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200">{ct.length}</span>
                  </div>
                </div>
                {ct.map(t=>(
                  <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-sm transition-shadow">
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
                        className="text-xs border border-slate-200 rounded px-1 py-0.5 text-slate-600">
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
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600">
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
const CAL_EVENTS = [
  { id:1,  date:8,  title:"Hajj Batch Departure",    color:"#1B75BC" },
  { id:2,  date:10, title:"Saudi Visa Submission",   color:"#F15A24" },
  { id:3,  date:14, title:"Staff Meeting",           color:"#0E7C66" },
  { id:4,  date:15, title:"P&L Review",              color:"#2563EB" },
  { id:5,  date:18, title:"Umrah Group Check-in",    color:"#7C3AED" },
  { id:6,  date:20, title:"Commission Payout",       color:"#EF4444" },
  { id:7,  date:22, title:"Malaysia Tour Departure", color:"#1B75BC" },
  { id:8,  date:25, title:"Board Meeting",           color:"#0E7C66" },
  { id:9,  date:28, title:"Passport Collection",     color:"#F15A24" },
];
const TODAY = 18;

function CalendarView() {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const offset = 1; // July 2024 Mon start
  const cells = [...Array(offset).fill(null), ...Array(31).fill(0).map((_,i)=>i+1)];
  return (
    <div>
      <SampleBadge />
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">July 2024</h3>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronLeft size={14} className="text-slate-500"/></button>
            <button className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Today</button>
            <button className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronRight size={14} className="text-slate-500"/></button>
            <select className="text-sm border border-slate-200 rounded-lg px-2 py-1.5"><option>Month</option><option>Week</option></select>
          </div>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {days.map(d=><div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d,i)=>{
            if(!d) return <div key={i}/>;
            const evs = CAL_EVENTS.filter(e=>e.date===d);
            const isToday = d===TODAY;
            return (
              <div key={i} className={cn("min-h-16 rounded-xl p-1.5 cursor-pointer hover:bg-slate-50 transition-colors border",
                isToday ? "border-[#1B75BC] bg-[#1B75BC]/4" : "border-transparent")}>
                <span className={cn("text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-1",
                  isToday ? "bg-[#1B75BC] text-white" : "text-slate-600")}>{d}</span>
                {evs.slice(0,2).map(e=>(
                  <div key={e.id} className="text-xs rounded px-1 py-0.5 mb-0.5 truncate text-white"
                    style={{ background: e.color }}>{e.title}</div>
                ))}
                {evs.length>2 && <div className="text-xs text-slate-400 px-1">+{evs.length-2}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-800 text-sm">Upcoming</p>
          <button className="flex items-center gap-1 text-xs text-[#1B75BC] hover:underline"><Plus size={11}/> Add</button>
        </div>
        {CAL_EVENTS.filter(e=>e.date>=TODAY).slice(0,6).map(e=>(
          <div key={e.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: e.color }}>{e.date}</div>
            <div><p className="text-sm font-medium text-slate-700">{e.title}</p>
              <p className="text-xs text-slate-400">Jul {e.date}, 2024</p></div>
          </div>
        ))}
        <button className="w-full py-2.5 text-sm bg-[#1B75BC] text-white rounded-xl hover:bg-[#14588F] flex items-center justify-center gap-1.5">
          <Plus size={14}/> New Event
        </button>
      </div>
    </div>
    </div>
  );
}

// ─── REMINDERS ───────────────────────────────────────────────────────────────
const REMIND_DATA = [
  { id:1, title:"Passport expiry — Md. Karim (15 days)",    type:"doc",    priority:"high",   due:"Aug 2",  done:false },
  { id:2, title:"Visa follow-up — Batch #09 Saudi",         type:"visa",   priority:"high",   due:"Jul 19", done:false },
  { id:3, title:"Invoice overdue — NMT Travels",            type:"finance",priority:"medium", due:"Jul 20", done:false },
  { id:4, title:"Annual license renewal — Hajj authority",  type:"admin",  priority:"medium", due:"Aug 10", done:false },
  { id:5, title:"Staff KPI review — Q2 2024",               type:"hr",     priority:"low",    due:"Jul 31", done:false },
  { id:6, title:"Insurance renewal — office building",      type:"admin",  priority:"low",    due:"Aug 15", done:true  },
];
const R_COLOR: Record<string,string> = { doc:"#1B75BC",visa:"#F15A24",finance:"#EF4444",admin:"#0E7C66",hr:"#7C3AED" };

function RemindersView() {
  const [items, setItems] = useState(REMIND_DATA);
  return (
    <div>
      <SampleBadge />
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-800">Reminders</h2>
        <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]"><Plus size={14}/> Add Reminder</button>
      </div>
      <div className="space-y-2">
        {items.map(r=>(
          <div key={r.id} className={cn("flex items-center gap-4 p-4 rounded-xl border bg-white transition-all",
            r.done ? "opacity-50 border-slate-100" : "border-slate-200")}>
            <button onClick={()=>setItems(i=>i.map(x=>x.id===r.id?{...x,done:!x.done}:x))}>
              {r.done ? <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500"/>
                      : <Circle size={18} className="text-slate-300 hover:text-[#1B75BC]"/>}
            </button>
            <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: R_COLOR[r.type]||"#94A3B8" }}/>
            <div className="flex-1">
              <p className={cn("text-sm font-medium", r.done?"line-through text-slate-400":"text-slate-700")}>{r.title}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span className="flex items-center gap-0.5"><Clock size={10}/> Due {r.due}</span>
                <span className="capitalize">{r.type}</span>
              </div>
            </div>
            <PriBadge p={r.priority}/>
            <div className="flex gap-1">
              <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={13}/></button>
              <button onClick={()=>setItems(i=>i.filter(x=>x.id!==r.id))} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13}/></button>
            </div>
          </div>
        ))}
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
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50">
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
              n.read ? "bg-white border-slate-100" : "bg-[#1B75BC]/3 border-[#1B75BC]/15")}>
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
        <div className="bg-white rounded-xl border border-[#1B75BC]/20 p-5 mb-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title…"
            className="w-full text-base font-semibold border-none focus:outline-none text-slate-800 placeholder:text-slate-300"/>
          <div className="h-px bg-slate-100"/>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Write your announcement here…"
            className="w-full text-sm text-slate-700 focus:outline-none resize-none placeholder:text-slate-300"/>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={audience} onChange={(e) => setAudience(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2">
              <option>All Staff</option><option>Sales Team</option><option>Visa Team</option><option>Accounts</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded"/> Pin announcement
            </label>
            <div className="flex gap-2 ml-auto">
              <button onClick={()=>setComposing(false)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600">Cancel</button>
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
          <div key={a.id} className={cn("bg-white rounded-xl border p-5", a.pinned?"border-[#F15A24]/40 bg-[#F15A24]/3":"border-slate-200")}>
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
const CHAT_LIST = [
  { name:"Rahim K.",    preview:"Did you check the visa batch status?",  time:"09:14", unread:2, online:true  },
  { name:"Fatema B.",   preview:"Documents uploaded for batch #08",      time:"09:02", unread:0, online:true  },
  { name:"Kamal H.",    preview:"Invoice sent to NMT Travels",           time:"08:50", unread:0, online:false },
  { name:"Salma T.",    preview:"Client payment received ✓",             time:"Yesterday",unread:0,online:false},
  { name:"Ops Team",    preview:"Meeting rescheduled to 3 PM",           time:"Jul 13", unread:0, online:false, isGroup:true },
];
const MSGS = [
  { from:"Rahim K.", text:"Hey, did you check the Saudi visa batch #09 status?",          time:"09:10", mine:false },
  { from:"Me",       text:"Yes — 42 approved, 3 pending clarification.",                   time:"09:12", mine:true  },
  { from:"Rahim K.", text:"Great! Should I notify the clients now?",                       time:"09:13", mine:false },
  { from:"Me",       text:"Go ahead. Use the WhatsApp template for visa approval.",        time:"09:14", mine:true  },
  { from:"Rahim K.", text:"Done! Also sent the group update.",                             time:"09:15", mine:false },
];

function ChatView() {
  const [msg, setMsg] = useState("");
  const [selected, setSelected] = useState(0);
  return (
    <div>
      <SampleBadge />
    <div className="flex h-[580px] bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 border-r border-slate-100 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-slate-100">
          <div className="relative"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input placeholder="Search…" className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"/></div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {CHAT_LIST.map((u,i)=>(
            <button key={i} onClick={()=>setSelected(i)}
              className={cn("flex items-center gap-2.5 w-full px-3 py-3 text-left border-b border-slate-50 hover:bg-slate-50",
                selected===i && "bg-[#1B75BC]/5")}>
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#1B75BC] flex items-center justify-center text-white text-xs font-bold">
                  {u.name.slice(0,2)}
                </div>
                {u.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700 truncate">{u.name}</p>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{u.time}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{u.preview}</p>
              </div>
              {u.unread>0 && <span className="w-4 h-4 rounded-full bg-[#1B75BC] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{u.unread}</span>}
            </button>
          ))}
        </div>
      </div>
      {/* Thread */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-full bg-[#1B75BC] flex items-center justify-center text-white text-xs font-bold">
            {CHAT_LIST[selected].name.slice(0,2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{CHAT_LIST[selected].name}</p>
            <p className={cn("text-xs",CHAT_LIST[selected].online?"text-emerald-500":"text-slate-400")}>
              {CHAT_LIST[selected].online?"Online":"Offline"}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {MSGS.map((m,i)=>(
            <div key={i} className={cn("flex",m.mine?"justify-end":"justify-start")}>
              <div className={cn("max-w-xs px-3.5 py-2.5 rounded-2xl text-sm",
                m.mine?"bg-[#1B75BC] text-white rounded-br-sm":"bg-slate-100 text-slate-700 rounded-bl-sm")}>
                {m.text}
                <p className={cn("text-xs mt-1 text-right",m.mine?"text-white/60":"text-slate-400")}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100">
          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Paperclip size={15}/></button>
          <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Type a message…"
            className="flex-1 px-3 py-2 text-sm bg-slate-100 rounded-xl focus:outline-none"/>
          <button className="p-2 bg-[#1B75BC] rounded-xl text-white hover:bg-[#14588F]"><Send size={15}/></button>
        </div>
      </div>
    </div>
    </div>
  );
}

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
const ACT_DATA = [
  { user:"Abdullah C.", action:"Created booking",         target:"BK-0892 — Hajj Economy",       module:"Bookings", time:"Today 09:14", icon:CheckSquare, color:"#0E7C66" },
  { user:"Rahim K.",    action:"Updated package pricing", target:"Umrah VIP 2024",               module:"Packages", time:"Today 09:02", icon:Edit2,       color:"#2563EB" },
  { user:"Fatema B.",   action:"Approved visa batch",     target:"Saudi Batch #08 (42 apps)",    module:"Visa",     time:"Today 08:45", icon:Check,       color:"#F15A24" },
  { user:"Kamal H.",    action:"Generated invoice",       target:"INV-2024-0247",                module:"Finance",  time:"Yesterday",   icon:FileText,    color:"#1B75BC" },
  { user:"Nasir A.",    action:"Uploaded passport",       target:"Md. Karim Ullah — KA8823991",  module:"Docs",     time:"Yesterday",   icon:FolderOpen,  color:"#7C3AED" },
  { user:"Salma T.",    action:"Recorded payment",        target:"৳1,85,000 — bKash",           module:"Finance",  time:"Jul 13",      icon:TrendingUp,  color:"#EF4444" },
  { user:"Rahim K.",    action:"Added new agent",         target:"Bismillah Int'l, Comilla",     module:"CRM",      time:"Jul 12",      icon:Users,       color:"#64748B" },
];

function ActivityView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-xl font-bold text-slate-800">Activity Logs</h2><p className="text-sm text-slate-500">All staff actions across the system</p></div>
        <div className="flex gap-2">
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600"><option>All Users</option></select>
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600"><option>All Modules</option></select>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"><Download size={13}/> Export</button>
        </div>
      </div>
      <Card>
        <div className="divide-y divide-slate-50">
          {ACT_DATA.map((log,i)=>(
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: log.color+"15" }}>
                <log.icon size={14} style={{ color: log.color }}/>
              </div>
              <Av name={log.user} color="#64748B"/>
              <div className="flex-1">
                <p className="text-sm text-slate-700"><span className="font-medium">{log.user}</span> {log.action} — <span className="text-[#1B75BC]">{log.target}</span></p>
                <p className="text-xs text-slate-400">{log.module}</p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">{log.time}</span>
            </div>
          ))}
        </div>
      </Card>
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
const WF_LIST = [
  { id:1, name:"Hajj Booking Flow",     count:42, status:"active", last:"Today 09:14" },
  { id:2, name:"Umrah Booking Flow",    count:18, status:"active", last:"Today 08:50" },
  { id:3, name:"Visa Processing",       count:11, status:"active", last:"Yesterday"   },
  { id:4, name:"Document Expiry Alert", count:3,  status:"active", last:"Today 07:00" },
  { id:5, name:"Payment Reminder",      count:8,  status:"paused", last:"Jul 12"      },
];
const WF_NODES = [
  { label:"New Booking",          type:"trigger"  },
  { label:"Payment Confirmed?",   type:"decision" },
  { label:"Collect Docs",         type:"action"   },
  { label:"Submit Visa",          type:"action"   },
  { label:"Notify Client",        type:"action"   },
  { label:"Mark Complete",        type:"end"      },
];
const NODE_CLS: Record<string,string> = {
  trigger:  "bg-[#1B75BC] text-white",
  decision: "bg-[#F15A24] text-white",
  action:   "bg-white text-slate-700 border-2 border-slate-200",
  end:      "bg-[#0E7C66] text-white",
};

function WorkflowView() {
  const [sel, setSel] = useState(1);
  return (
    <div className="space-y-5">
      <SampleBadge />
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">Workflow Automation</h2><p className="text-sm text-slate-500">Automated business process flows</p></div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]"><Plus size={14}/> New Workflow</button>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-2">
          {WF_LIST.map(wf=>(
            <button key={wf.id} onClick={()=>setSel(wf.id)}
              className={cn("w-full text-left p-4 rounded-xl border transition-all",
                sel===wf.id?"border-[#1B75BC] bg-[#1B75BC]/5":"border-slate-200 bg-white hover:bg-slate-50")}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-slate-800">{wf.name}</p>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                  wf.status==="active"?"bg-emerald-50 text-emerald-600":"bg-slate-100 text-slate-500")}>{wf.status}</span>
              </div>
              <p className="text-xs text-slate-400">Triggered {wf.count}× · {wf.last}</p>
            </button>
          ))}
        </div>
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="font-semibold text-slate-800">{WF_LIST.find(w=>w.id===sel)?.name}</p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center gap-1.5"><Edit2 size={12}/> Edit</button>
              <button className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg flex items-center gap-1.5"><Zap size={12}/> Run Now</button>
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-2 min-w-max">
              {WF_NODES.map((node,i)=>(
                <React.Fragment key={i}>
                  <div className={cn("px-3 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex-shrink-0 text-center min-w-24", NODE_CLS[node.type])}>
                    {node.label}
                  </div>
                  {i<WF_NODES.length-1 && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <div className="w-5 h-px bg-slate-300"/>
                      <ChevronRight size={12} className="text-slate-300"/>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Trigger Conditions</p>
            <div className="space-y-2">
              {[
                ["When","New booking is created"],
                ["Service type","is Hajj"],
                ["Payment status","becomes Confirmed"],
              ].map(([key,val],i)=>(
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1B75BC]/10 text-[#1B75BC] font-semibold">{key}</span>
                  <span className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">{val}</span>
                  {i<2&&<span className="text-xs text-slate-400 font-medium">AND</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DOCUMENT MANAGER ────────────────────────────────────────────────────────
const DOCS_DATA = [
  { name:"Hajj 2024 Operations Manual", type:"pdf",  size:"2.1 MB", owner:"Abdullah C.", updated:"Jul 14", shared:true  },
  { name:"Visa SOP — Saudi Arabia",     type:"doc",  size:"480 KB", owner:"Fatema B.",   updated:"Jul 10", shared:true  },
  { name:"Staff Handbook 2024",         type:"pdf",  size:"1.8 MB", owner:"HR Dept.",    updated:"Jun 30", shared:true  },
  { name:"Client Onboarding Checklist", type:"xlsx", size:"120 KB", owner:"Rahim K.",    updated:"Jul 8",  shared:false },
  { name:"Emergency Contact Directory", type:"doc",  size:"95 KB",  owner:"Admin",       updated:"Jul 1",  shared:true  },
];
const DOC_COLOR: Record<string,string> = { pdf:"#EF4444",doc:"#2563EB",xlsx:"#0E7C66",img:"#7C3AED" };

function DocumentsView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-xl font-bold text-slate-800">Document Manager</h2><p className="text-sm text-slate-500">Internal SOPs and operational documents</p></div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]"><Plus size={14}/> Upload</button>
      </div>
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 mb-4 text-center hover:border-slate-300 cursor-pointer">
        <FolderOpen size={22} className="text-slate-300 mx-auto mb-1.5"/>
        <p className="text-sm text-slate-400">Drag & drop files here to upload</p>
      </div>
      <Card>
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {["Name","Type","Size","Owner","Updated","Shared",""].map(h=>(
              <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
            ))}
          </tr></thead>
          <tbody>{DOCS_DATA.map((d,i)=>(
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 group">
              <td className="px-4 py-3"><div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: DOC_COLOR[d.type]||"#64748B" }}>
                  {d.type.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700">{d.name}</span>
              </div></td>
              <td className="px-4 py-3 text-xs uppercase text-slate-500">{d.type}</td>
              <td className="px-4 py-3 text-sm font-mono text-slate-500">{d.size}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{d.owner}</td>
              <td className="px-4 py-3 text-sm text-slate-400">{d.updated}</td>
              <td className="px-4 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                d.shared?"bg-emerald-50 text-emerald-600":"bg-slate-100 text-slate-400")}>{d.shared?"Shared":"Private"}</span></td>
              <td className="px-4 py-3 opacity-0 group-hover:opacity-100"><div className="flex gap-1">
                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Eye size={12}/></button>
                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Download size={12}/></button>
                <button className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── MODULE ROOT ─────────────────────────────────────────────────────────────
export function OperationsModule() {
  const [view, setView] = useState<OpsView>("tasks");
  return (
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
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
  );
}
