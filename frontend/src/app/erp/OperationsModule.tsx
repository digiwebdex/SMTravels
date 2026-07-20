import React, { useState } from "react";
import {
  CheckSquare, Calendar, Bell, Megaphone, MessageSquare, Activity,
  Shield, GitBranch, FolderOpen, Plus, Search, X, Check, Clock,
  AlertTriangle, Users, Filter, RefreshCw, Paperclip, Send,
  Eye, Edit2, Trash2, Circle, CheckCircle2, ArrowRight, FileText,
  Zap, Flag, Star, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  GripVertical, Download, Circle as Dot, Server, Database, HardDrive,
  MoreHorizontal, TrendingUp, Copy,
} from "lucide-react";
import { cn } from "../lib/utils";

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
function Av({ name, color = "#0E6BB8", size = "sm" }: { name: string; color?: string; size?: "sm" | "md" }) {
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
const TASKS_DATA = [
  { id:1, title:"Process Hajj 2024 batch documents",      assignee:"Abdullah C.", priority:"high",   status:"in-progress", due:"Jul 18", tags:["Hajj","Docs"],    comments:3 },
  { id:2, title:"Follow up with NMT Travels quota",       assignee:"Rahim K.",    priority:"high",   status:"todo",        due:"Jul 16", tags:["Agent"],          comments:1 },
  { id:3, title:"Update Umrah package pricing",           assignee:"Fatema B.",   priority:"medium", status:"todo",        due:"Jul 20", tags:["Umrah"],          comments:0 },
  { id:4, title:"Prepare monthly P&L report",             assignee:"Kamal H.",    priority:"medium", status:"in-progress", due:"Jul 22", tags:["Finance"],        comments:2 },
  { id:5, title:"Visa application follow-up — batch #09", assignee:"Nasir A.",    priority:"high",   status:"blocked",     due:"Jul 17", tags:["Visa"],           comments:5 },
  { id:6, title:"Send welcome kits to new Hajj clients",  assignee:"Salma T.",    priority:"low",    status:"done",        due:"Jul 15", tags:["Hajj","Client"],  comments:1 },
  { id:7, title:"Renew office utility contracts",         assignee:"Abdullah C.", priority:"low",    status:"done",        due:"Jul 10", tags:["Admin"],          comments:0 },
  { id:8, title:"Set up new branch WhatsApp number",      assignee:"Rahim K.",    priority:"medium", status:"todo",        due:"Jul 25", tags:["Admin","Comms"],  comments:0 },
];
const COLS = [
  { id:"todo",        label:"To Do",       color:"bg-slate-400"   },
  { id:"in-progress", label:"In Progress", color:"bg-blue-500"    },
  { id:"blocked",     label:"Blocked",     color:"bg-red-500"     },
  { id:"done",        label:"Done",        color:"bg-emerald-500" },
];

function TasksView() {
  const [mode, setMode] = useState<"board"|"list">("board");
  const [tasks, setTasks] = useState(TASKS_DATA);
  const toggle = (id: number) => setTasks(t => t.map(x => x.id===id ? {...x, status: x.status==="done"?"todo":"done"} : x));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search tasks…" className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none w-48" />
          </div>
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600">
            <option>All Assignees</option>{["Abdullah C.","Rahim K.","Fatema B.","Kamal H.","Nasir A."].map(a=><option key={a}>{a}</option>)}
          </select>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(["board","list"] as const).map(v=>(
              <button key={v} onClick={()=>setMode(v)}
                className={cn("px-3 py-1.5 text-xs rounded-md capitalize transition-colors",
                  mode===v ? "bg-white shadow text-slate-700 font-medium" : "text-slate-500")}>{v}</button>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]">
          <Plus size={14}/> New Task
        </button>
      </div>

      {mode === "board" ? (
        <div className="grid grid-cols-4 gap-4">
          {COLS.map(col => {
            const ct = tasks.filter(t=>t.status===col.id);
            return (
              <div key={col.id} className="bg-slate-100 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", col.color)} />
                    <span className="text-xs font-semibold text-slate-600">{col.label}</span>
                    <span className="text-xs bg-white text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200">{ct.length}</span>
                  </div>
                  <button className="p-1 hover:bg-slate-200 rounded text-slate-400"><Plus size={12}/></button>
                </div>
                {ct.map(t=>(
                  <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-3 cursor-pointer hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-2 mb-2">
                      <button onClick={()=>toggle(t.id)} className="mt-0.5 flex-shrink-0">
                        {t.status==="done" ? <CheckCircle2 size={15} className="text-emerald-500 fill-emerald-500"/> : <Circle size={15} className="text-slate-300"/>}
                      </button>
                      <p className={cn("text-xs font-medium leading-snug", t.status==="done"?"line-through text-slate-400":"text-slate-700")}>{t.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {t.tags.map(tag=><span key={tag} className="text-xs px-1.5 py-0.5 bg-[#0E6BB8]/8 text-[#0E6BB8] rounded-md">{tag}</span>)}
                    </div>
                    <div className="flex items-center justify-between">
                      <PriBadge p={t.priority}/>
                      <div className="flex items-center gap-1.5">
                        {t.comments>0 && <span className="flex items-center gap-0.5 text-xs text-slate-400"><MessageSquare size={10}/>{t.comments}</span>}
                        <span className="text-xs text-slate-400 flex items-center gap-0.5"><Clock size={10}/>{t.due}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 hover:bg-white rounded-lg transition-colors">
                  <Plus size={11}/> Add task
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {["","Task","Assignee","Priority","Status","Due","Tags",""].map((h,i)=>(
                <th key={i} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>{tasks.map(t=>(
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                <td className="px-4 py-3"><button onClick={()=>toggle(t.id)}>
                  {t.status==="done"?<CheckCircle2 size={15} className="text-emerald-500 fill-emerald-500"/>:<Circle size={15} className="text-slate-300"/>}
                </button></td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700 max-w-xs">
                  <span className={cn(t.status==="done"&&"line-through text-slate-400")}>{t.title}</span>
                </td>
                <td className="px-4 py-3"><div className="flex items-center gap-1.5"><Av name={t.assignee}/><span className="text-sm text-slate-600">{t.assignee}</span></div></td>
                <td className="px-4 py-3"><PriBadge p={t.priority}/></td>
                <td className="px-4 py-3"><StBadge s={t.status}/></td>
                <td className="px-4 py-3 text-sm text-slate-500">{t.due}</td>
                <td className="px-4 py-3"><div className="flex gap-1">{t.tags.map(tag=><span key={tag} className="text-xs px-1.5 py-0.5 bg-[#0E6BB8]/8 text-[#0E6BB8] rounded-md">{tag}</span>)}</div></td>
                <td className="px-4 py-3 opacity-0 group-hover:opacity-100"><div className="flex gap-1">
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={12}/></button>
                  <button className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
const CAL_EVENTS = [
  { id:1,  date:8,  title:"Hajj Batch Departure",    color:"#0E6BB8" },
  { id:2,  date:10, title:"Saudi Visa Submission",   color:"#E8471F" },
  { id:3,  date:14, title:"Staff Meeting",           color:"#0E7C66" },
  { id:4,  date:15, title:"P&L Review",              color:"#2563EB" },
  { id:5,  date:18, title:"Umrah Group Check-in",    color:"#7C3AED" },
  { id:6,  date:20, title:"Commission Payout",       color:"#EF4444" },
  { id:7,  date:22, title:"Malaysia Tour Departure", color:"#0E6BB8" },
  { id:8,  date:25, title:"Board Meeting",           color:"#0E7C66" },
  { id:9,  date:28, title:"Passport Collection",     color:"#E8471F" },
];
const TODAY = 18;

function CalendarView() {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const offset = 1; // July 2024 Mon start
  const cells = [...Array(offset).fill(null), ...Array(31).fill(0).map((_,i)=>i+1)];
  return (
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
                isToday ? "border-[#0E6BB8] bg-[#0E6BB8]/4" : "border-transparent")}>
                <span className={cn("text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-1",
                  isToday ? "bg-[#0E6BB8] text-white" : "text-slate-600")}>{d}</span>
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
          <button className="flex items-center gap-1 text-xs text-[#0E6BB8] hover:underline"><Plus size={11}/> Add</button>
        </div>
        {CAL_EVENTS.filter(e=>e.date>=TODAY).slice(0,6).map(e=>(
          <div key={e.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: e.color }}>{e.date}</div>
            <div><p className="text-sm font-medium text-slate-700">{e.title}</p>
              <p className="text-xs text-slate-400">Jul {e.date}, 2024</p></div>
          </div>
        ))}
        <button className="w-full py-2.5 text-sm bg-[#0E6BB8] text-white rounded-xl hover:bg-[#0B5794] flex items-center justify-center gap-1.5">
          <Plus size={14}/> New Event
        </button>
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
const R_COLOR: Record<string,string> = { doc:"#0E6BB8",visa:"#E8471F",finance:"#EF4444",admin:"#0E7C66",hr:"#7C3AED" };

function RemindersView() {
  const [items, setItems] = useState(REMIND_DATA);
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-800">Reminders</h2>
        <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]"><Plus size={14}/> Add Reminder</button>
      </div>
      <div className="space-y-2">
        {items.map(r=>(
          <div key={r.id} className={cn("flex items-center gap-4 p-4 rounded-xl border bg-white transition-all",
            r.done ? "opacity-50 border-slate-100" : "border-slate-200")}>
            <button onClick={()=>setItems(i=>i.map(x=>x.id===r.id?{...x,done:!x.done}:x))}>
              {r.done ? <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500"/>
                      : <Circle size={18} className="text-slate-300 hover:text-[#0E6BB8]"/>}
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
const NOTIF_DATA = [
  { id:1, icon:CheckSquare,  color:"#0E7C66", title:"New booking received",         body:"Hajj Economy — Md. Karim Ullah, ৳5,20,000",    time:"2m ago",  read:false },
  { id:2, icon:TrendingUp,   color:"#0E6BB8", title:"Payment received",             body:"bKash #0892 — ৳92,500 from NMT Travels",        time:"15m ago", read:false },
  { id:3, icon:Check,        color:"#E8471F", title:"Visa batch approved",          body:"Saudi batch #08 — 42 applicants approved",      time:"1h ago",  read:false },
  { id:4, icon:AlertTriangle,color:"#EF4444", title:"Document expiry alert",        body:"3 passports expire within 30 days",             time:"2h ago",  read:true  },
  { id:5, icon:Shield,       color:"#64748B", title:"Backup completed",             body:"Automated daily backup — 14 Jul 02:00 AM",     time:"6h ago",  read:true  },
  { id:6, icon:CheckSquare,  color:"#7C3AED", title:"Task assigned to you",         body:"Process Hajj batch documents — by Abdullah C.",time:"1d ago",  read:true  },
];

function NotificationsView() {
  const [items, setItems] = useState(NOTIF_DATA);
  const unread = items.filter(n=>!n.read).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-xl font-bold text-slate-800">Notifications</h2><p className="text-sm text-slate-500">{unread} unread</p></div>
        <div className="flex gap-2">
          <button onClick={()=>setItems(n=>n.map(x=>({...x,read:true})))}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"><Check size={13}/> Mark all read</button>
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2"><option>All</option><option>Unread</option></select>
        </div>
      </div>
      <div className="space-y-2">
        {items.map(n=>(
          <div key={n.id} onClick={()=>setItems(ns=>ns.map(x=>x.id===n.id?{...x,read:true}:x))}
            className={cn("flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all",
              n.read ? "bg-white border-slate-100" : "bg-[#0E6BB8]/3 border-[#0E6BB8]/15")}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: n.color+"20" }}>
              <n.icon size={16} style={{ color: n.color }}/>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full bg-[#0E6BB8] flex-shrink-0"/>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
const ANN_DATA = [
  { id:1, title:"Eid-ul-Adha Office Closure",         body:"The office will be closed Jun 28–Jul 2 for Eid holidays. Emergency: +880 31 XXX XXXX.",               author:"Abdullah C.", date:"Jun 24", pinned:true,  audience:"All Staff" },
  { id:2, title:"New Hajj Quota Allocation 2024",     body:"We received 850 Hajj quota for 2024, up 12% from last year. Sales team — update package details.",     author:"CEO Office",   date:"Jun 20", pinned:true,  audience:"All Staff" },
  { id:3, title:"System Maintenance — Jul 20, 11 PM", body:"Planned maintenance window for ERP upgrades. System may be unavailable for up to 2 hours.",            author:"IT Admin",    date:"Jul 12", pinned:false, audience:"All Staff" },
  { id:4, title:"Updated Visa Fee Structure",         body:"Saudi Arabia revised processing fees effective July 1. Refer to the updated rate card in shared drive.",author:"Visa Dept.",   date:"Jun 28", pinned:false, audience:"Visa Team" },
];

function AnnouncementsView() {
  const [composing, setComposing] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-800">Announcements</h2>
        <button onClick={()=>setComposing(v=>!v)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]"><Plus size={14}/> New Announcement</button>
      </div>
      {composing && (
        <div className="bg-white rounded-xl border border-[#0E6BB8]/20 p-5 mb-5 space-y-3">
          <input placeholder="Announcement title…" className="w-full text-base font-semibold border-none focus:outline-none text-slate-800 placeholder:text-slate-300"/>
          <div className="h-px bg-slate-100"/>
          <textarea rows={3} placeholder="Write your announcement here…"
            className="w-full text-sm text-slate-700 focus:outline-none resize-none placeholder:text-slate-300"/>
          <div className="flex items-center gap-3 flex-wrap">
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-2">
              <option>All Staff</option><option>Sales Team</option><option>Visa Team</option><option>Accounts</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer"><input type="checkbox" className="rounded"/> Pin announcement</label>
            <div className="flex gap-2 ml-auto">
              <button onClick={()=>setComposing(false)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600">Cancel</button>
              <button onClick={()=>setComposing(false)} className="px-4 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg">Post</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {ANN_DATA.map(a=>(
          <div key={a.id} className={cn("bg-white rounded-xl border p-5", a.pinned?"border-[#E8471F]/40 bg-[#E8471F]/3":"border-slate-200")}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {a.pinned && <span className="flex items-center gap-1 text-xs text-[#C43A15] font-medium"><Flag size={11} className="fill-[#E8471F]"/> Pinned</span>}
                <h3 className="font-semibold text-slate-800">{a.title}</h3>
              </div>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{a.audience}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">{a.body}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Av name={a.author} size="sm"/><span>{a.author}</span><span>·</span><span>{a.date}</span>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={13}/></button>
                <button className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
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
                selected===i && "bg-[#0E6BB8]/5")}>
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-bold">
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
              {u.unread>0 && <span className="w-4 h-4 rounded-full bg-[#0E6BB8] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{u.unread}</span>}
            </button>
          ))}
        </div>
      </div>
      {/* Thread */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-full bg-[#0E6BB8] flex items-center justify-center text-white text-xs font-bold">
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
                m.mine?"bg-[#0E6BB8] text-white rounded-br-sm":"bg-slate-100 text-slate-700 rounded-bl-sm")}>
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
          <button className="p-2 bg-[#0E6BB8] rounded-xl text-white hover:bg-[#0B5794]"><Send size={15}/></button>
        </div>
      </div>
    </div>
  );
}

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
const ACT_DATA = [
  { user:"Abdullah C.", action:"Created booking",         target:"BK-0892 — Hajj Economy",       module:"Bookings", time:"Today 09:14", icon:CheckSquare, color:"#0E7C66" },
  { user:"Rahim K.",    action:"Updated package pricing", target:"Umrah VIP 2024",               module:"Packages", time:"Today 09:02", icon:Edit2,       color:"#2563EB" },
  { user:"Fatema B.",   action:"Approved visa batch",     target:"Saudi Batch #08 (42 apps)",    module:"Visa",     time:"Today 08:45", icon:Check,       color:"#E8471F" },
  { user:"Kamal H.",    action:"Generated invoice",       target:"INV-2024-0247",                module:"Finance",  time:"Yesterday",   icon:FileText,    color:"#0E6BB8" },
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
                <p className="text-sm text-slate-700"><span className="font-medium">{log.user}</span> {log.action} — <span className="text-[#0E6BB8]">{log.target}</span></p>
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
const AUDIT_DATA = [
  { user:"Abdullah C.", ip:"103.12.X.X", event:"LOGIN_SUCCESS",      severity:"info",     resource:"Auth",     time:"Today 09:12" },
  { user:"Kamal H.",    ip:"103.12.X.X", event:"RECORD_DELETED",     severity:"warning",  resource:"Invoice",  time:"Today 09:05" },
  { user:"SYSTEM",      ip:"—",          event:"BACKUP_COMPLETED",   severity:"info",     resource:"Database", time:"Today 02:00" },
  { user:"Rahim K.",    ip:"45.64.X.X",  event:"PERMISSION_CHANGED", severity:"critical", resource:"Roles",    time:"Yesterday"   },
  { user:"Unknown",     ip:"196.33.X.X", event:"LOGIN_FAILED_×3",    severity:"critical", resource:"Auth",     time:"Yesterday"   },
  { user:"Fatema B.",   ip:"103.12.X.X", event:"DATA_EXPORT",        severity:"warning",  resource:"Reports",  time:"Jul 13"      },
  { user:"Abdullah C.", ip:"103.12.X.X", event:"SETTINGS_CHANGED",   severity:"warning",  resource:"Settings", time:"Jul 12"      },
];
const SEV_CFG: Record<string,string> = {
  info:     "bg-blue-50 text-blue-600 border-blue-200",
  warning:  "bg-amber-50 text-amber-600 border-amber-200",
  critical: "bg-red-50 text-red-600 border-red-200",
};

function AuditView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-xl font-bold text-slate-800">Audit Logs</h2><p className="text-sm text-slate-500">Security-critical event trail</p></div>
        <div className="flex gap-2">
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2"><option>All Severity</option><option>Critical</option><option>Warning</option></select>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg"><Download size={13}/> Export CSV</button>
        </div>
      </div>
      <Card>
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {["Time","User","IP Address","Event","Resource","Severity"].map(h=>(
              <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
            ))}
          </tr></thead>
          <tbody>{AUDIT_DATA.map((log,i)=>(
            <tr key={i} className={cn("border-b border-slate-50 hover:bg-slate-50",log.severity==="critical"&&"bg-red-50/30")}>
              <td className="px-4 py-3 text-xs text-slate-400 font-mono">{log.time}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-1.5">
                <Av name={log.user} size="sm" color={log.user==="SYSTEM"?"#64748B":log.user==="Unknown"?"#EF4444":"#0E6BB8"}/>
                <span className="text-sm text-slate-700">{log.user}</span>
              </div></td>
              <td className="px-4 py-3 text-xs text-slate-500 font-mono">{log.ip}</td>
              <td className="px-4 py-3 text-sm font-mono text-slate-700">{log.event}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{log.resource}</td>
              <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border capitalize",SEV_CFG[log.severity])}>{log.severity}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
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
  trigger:  "bg-[#0E6BB8] text-white",
  decision: "bg-[#E8471F] text-white",
  action:   "bg-white text-slate-700 border-2 border-slate-200",
  end:      "bg-[#0E7C66] text-white",
};

function WorkflowView() {
  const [sel, setSel] = useState(1);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">Workflow Automation</h2><p className="text-sm text-slate-500">Automated business process flows</p></div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]"><Plus size={14}/> New Workflow</button>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-2">
          {WF_LIST.map(wf=>(
            <button key={wf.id} onClick={()=>setSel(wf.id)}
              className={cn("w-full text-left p-4 rounded-xl border transition-all",
                sel===wf.id?"border-[#0E6BB8] bg-[#0E6BB8]/5":"border-slate-200 bg-white hover:bg-slate-50")}>
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
                  <span className="text-xs px-2.5 py-1.5 rounded-lg bg-[#0E6BB8]/10 text-[#0E6BB8] font-semibold">{key}</span>
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
        <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#0E6BB8] text-white rounded-lg hover:bg-[#0B5794]"><Plus size={14}/> Upload</button>
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
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)}
              className={cn("w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                view===item.id?"bg-[#0E6BB8]/8 text-[#0E6BB8] font-medium border-r-2 border-[#0E6BB8]":"text-slate-600 hover:bg-slate-50")}>
              <item.icon size={15} className={view===item.id?"text-[#0E6BB8]":"text-slate-400"}/>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{item.badge}</span>}
            </button>
          ))}
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
        {view==="documents"     && <DocumentsView/>}
      </div>
    </div>
  );
}
