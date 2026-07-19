import React, { useState } from "react";
import {
  LayoutDashboard, CheckSquare, Briefcase, Users, BarChart3,
  FolderOpen, Megaphone, LifeBuoy, Bell, User, LogOut,
  ChevronRight, ChevronDown, ChevronUp, Search, Plus, Eye,
  Check, X, Clock, AlertCircle, CheckCircle, Circle,
  Calendar, MapPin, Phone, Mail, Star, Edit2, Send,
  Paperclip, Download, Filter, ArrowRight, Info, Package,
  TrendingUp, TrendingDown, MoreHorizontal, Pin, Hash,
  FileText, RefreshCw, MessageSquare, Layers, Target,
} from "lucide-react";
import { cn } from "../lib/utils";
import { MobileDrawer, MobileBottomNav, FilterDrawer, FilterSection, ScrollTable } from "../lib/responsive";

type StaffView =
  | "dashboard" | "tasks" | "bookings" | "customers"
  | "reports" | "documents" | "announcements" | "support"
  | "notifications" | "profile";

const NAV: { id: StaffView; icon: React.ElementType; label: string; badge?: number }[] = [
  { id: "dashboard",     icon: LayoutDashboard, label: "Dashboard"           },
  { id: "tasks",         icon: CheckSquare,     label: "Daily Tasks",  badge: 4 },
  { id: "bookings",      icon: Briefcase,       label: "Bookings"            },
  { id: "customers",     icon: Users,           label: "Customers"           },
  { id: "reports",       icon: BarChart3,       label: "My Reports"          },
  { id: "documents",     icon: FolderOpen,      label: "Documents"           },
  { id: "announcements", icon: Megaphone,       label: "Announcements"       },
  { id: "support",       icon: LifeBuoy,        label: "Support"             },
  { id: "notifications", icon: Bell,            label: "Notifications", badge:3 },
  { id: "profile",       icon: User,            label: "Profile"             },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const TASKS = [
  { id: 1,  title: "Follow up with Rafiqul Islam re: Hajj package",  priority: "high",   due: "Today 12:00",   done: false, category: "Sales"    },
  { id: 2,  title: "Prepare group visa documents for BK-0892",       priority: "high",   due: "Today 15:00",   done: false, category: "Visa"     },
  { id: 3,  title: "Send itinerary to Malaysia tour group",          priority: "medium", due: "Today 17:00",   done: false, category: "Operations"},
  { id: 4,  title: "Update hotel confirmation for Umrah group",      priority: "medium", due: "Today 18:00",   done: false, category: "Hotel"    },
  { id: 5,  title: "Collect balance payment from Mr. Karim",         priority: "low",    due: "Tomorrow 10:00",done: false, category: "Finance"  },
  { id: 6,  title: "Review and file supplier invoices",              priority: "low",    due: "Tomorrow 14:00",done: true,  category: "Finance"  },
  { id: 7,  title: "Send pre-departure SMS to BK-0892 pilgrims",     priority: "medium", due: "Aug 1",         done: true,  category: "Comm"     },
];

const BOOKINGS = [
  { id:"BK-0892", customer:"Md. Karim Ullah",   service:"Hajj Economy 2024",  status:"confirmed", departure:"Aug 5",  assignedTo:"Me",    amount:520000 },
  { id:"BK-0891", customer:"Nasrin Begum",       service:"Umrah Standard",     status:"processing",departure:"Aug 15", assignedTo:"Me",    amount:185000 },
  { id:"BK-0889", customer:"Abdul Karim",        service:"Malaysia Tour 5D/4N",status:"confirmed", departure:"Sep 2",  assignedTo:"Me",    amount:215000 },
  { id:"BK-0882", customer:"Tahmina Khatun",     service:"Saudi Visa Only",    status:"completed", departure:"—",      assignedTo:"Me",    amount:8500   },
];

const CUSTOMERS_DATA = [
  { id:"CU-0214", name:"Md. Karim Ullah",  phone:"+880 1711 XXXXXX", lastBooking:"BK-0892", status:"vip",    bookings:3 },
  { id:"CU-0212", name:"Nasrin Begum",     phone:"+880 1912 XXXXXX", lastBooking:"BK-0891", status:"active", bookings:1 },
  { id:"CU-0209", name:"Abdul Karim",      phone:"+880 1811 XXXXXX", lastBooking:"BK-0889", status:"active", bookings:2 },
  { id:"CU-0201", name:"Tahmina Khatun",   phone:"+880 1611 XXXXXX", lastBooking:"BK-0882", status:"active", bookings:1 },
];

const ANNOUNCEMENTS = [
  { id:1, title:"Ramadan Office Hours Update",                 body:"Office will operate 9am–3pm during Ramadan. All client meetings to be scheduled accordingly.",      date:"Jul 15", pinned:true,  from:"Management"  },
  { id:2, title:"New Hajj Package Pricing for 2024 Season",    body:"Updated Hajj economy and premium packages are now live. Please refer to the updated price list.",   date:"Jul 10", pinned:true,  from:"Sales Head"  },
  { id:3, title:"Mandatory Compliance Training — July 28",     body:"All staff must attend the compliance training session on July 28 at 2pm in the conference room.",   date:"Jul 8",  pinned:false, from:"HR"          },
  { id:4, title:"System Maintenance — July 20 2–4am",         body:"The ERP system will be offline for scheduled maintenance. Please save all work before 1:55am.",     date:"Jul 7",  pinned:false, from:"IT"          },
];

const DOCS_DATA = [
  { id:1, name:"Hajj Package SOP 2024",         type:"PDF",  size:"2.4 MB", date:"Jun 15", category:"Procedures" },
  { id:2, name:"Visa Application Checklist",     type:"DOCX", size:"340 KB", date:"Jun 10", category:"Visa"       },
  { id:3, name:"Client Communication Templates", type:"PDF",  size:"1.1 MB", date:"May 28", category:"Templates"  },
  { id:4, name:"BDH Travel Policy 2024",         type:"PDF",  size:"890 KB", date:"Jan 5",  category:"Policy"     },
  { id:5, name:"Hotel Rate Agreement — Makkah",  type:"PDF",  size:"560 KB", date:"Mar 20", category:"Contracts"  },
];

const NOTIFS_DATA = [
  { id:1, title:"New booking assigned to you",          body:"BK-0891 (Nasrin Begum — Umrah Standard) has been assigned to your queue.", time:"2h ago",  read:false, color:"#14356B" },
  { id:2, title:"Task overdue: Collect balance payment", body:"Task #5 was due at 10:00am. Please action immediately.",                    time:"3h ago",  read:false, color:"#EF4444" },
  { id:3, title:"Customer document approved",           body:"Md. Karim Ullah's visa documents have been verified by the visa team.",      time:"Yesterday",read:false,color:"#0E7C66" },
  { id:4, title:"New announcement from Management",     body:"Ramadan office hours update. Please check the announcements section.",       time:"Jul 15",  read:true,  color:"#C9A227" },
];

const SUP_TICKETS = [
  { id:"IT-041", subject:"Cannot access visa processing module", status:"open",     date:"Jul 15", msgs:2 },
  { id:"IT-038", subject:"Client record merge request — CU-0214",status:"resolved", date:"Jul 5",  msgs:3 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtBDT = (n: number) => "৳" + n.toLocaleString("en-BD");

const PRIORITY_CFG: Record<string, { cls: string; dot: string; label: string }> = {
  high:   { cls: "text-red-600 bg-red-50 border-red-200",        dot: "bg-red-500",    label: "High"   },
  medium: { cls: "text-amber-600 bg-amber-50 border-amber-200",  dot: "bg-amber-400",  label: "Medium" },
  low:    { cls: "text-slate-500 bg-slate-100 border-slate-200", dot: "bg-slate-400",  label: "Low"    },
};

const BK_STATUS: Record<string, { label: string; cls: string }> = {
  confirmed:  { label: "Confirmed",  cls: "bg-blue-50 text-blue-700 border-blue-200"       },
  processing: { label: "Processing", cls: "bg-amber-50 text-amber-700 border-amber-200"    },
  completed:  { label: "Completed",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled:  { label: "Cancelled",  cls: "bg-red-50 text-red-600 border-red-200"          },
};

function Chip({ label, cls }: { label: string; cls: string }) {
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", cls)}>{label}</span>;
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function StaffDashboard({ onGo }: { onGo: (v: StaffView) => void }) {
  const pending = TASKS.filter(t => !t.done);
  const highPriority = pending.filter(t => t.priority === "high");

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Staff Dashboard</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Good morning, Rafiq!</h1>
          <p className="text-sm text-slate-500 mt-0.5">Saturday, Jul 20, 2024 · Branch: Agrabad HO</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#14356B] to-[#0E7C66] flex items-center justify-center text-white font-bold">
          RI
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Pending Tasks",   val: pending.length,                  sub:"Today",         color:"bg-amber-500",    Icon:CheckSquare  },
          { label:"My Bookings",     val: BOOKINGS.length,                 sub:"Active",        color:"bg-[#14356B]",    Icon:Briefcase    },
          { label:"Customers",       val: CUSTOMERS_DATA.length,           sub:"Assigned",      color:"bg-[#0E7C66]",    Icon:Users        },
          { label:"Completed",       val: TASKS.filter(t=>t.done).length,  sub:"Today",         color:"bg-purple-500",   Icon:CheckCircle  },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white mb-2", k.color)}>
              <k.Icon size={15} />
            </div>
            <p className="text-2xl font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{k.val}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* High priority tasks */}
      {highPriority.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-red-500" />
              <p className="text-sm font-bold text-red-700">Urgent Tasks ({highPriority.length})</p>
            </div>
            <button onClick={() => onGo("tasks")} className="text-xs text-red-600 font-semibold hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {highPriority.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-red-100">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <p className="text-sm text-slate-800 flex-1 font-medium">{t.title}</p>
                <span className="text-xs text-red-500 font-semibold whitespace-nowrap">{t.due}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's bookings snapshot */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-800">My Bookings</p>
          <button onClick={() => onGo("bookings")} className="text-xs text-[#14356B] font-semibold hover:underline">View all</button>
        </div>
        <div className="divide-y divide-slate-100">
          {BOOKINGS.slice(0, 3).map(b => (
            <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#14356B]/8 flex items-center justify-center text-[#14356B] text-xs font-bold flex-shrink-0">
                {b.customer.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{b.customer}</p>
                <p className="text-xs text-slate-400 truncate">{b.service} · {b.id}</p>
              </div>
              <Chip label={BK_STATUS[b.status].label} cls={BK_STATUS[b.status].cls} />
            </div>
          ))}
        </div>
      </div>

      {/* Announcements pinned */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Pin size={14} className="text-[#C9A227]" />
            <p className="font-bold text-slate-800">Pinned Announcements</p>
          </div>
          <button onClick={() => onGo("announcements")} className="text-xs text-[#14356B] font-semibold hover:underline">All</button>
        </div>
        <div className="divide-y divide-slate-100">
          {ANNOUNCEMENTS.filter(a => a.pinned).map(a => (
            <div key={a.id} className="px-5 py-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                <span className="text-xs text-slate-400 whitespace-nowrap">{a.date}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.body}</p>
              <p className="text-xs text-[#14356B] mt-1 font-medium">From: {a.from}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Productivity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="font-bold text-slate-800 mb-4">Today's Progress</p>
        <div className="space-y-3">
          {[
            { label:"Tasks completed", done: TASKS.filter(t=>t.done).length, total: TASKS.length, color:"#14356B" },
            { label:"Bookings active",  done: BOOKINGS.filter(b=>b.status==="confirmed").length, total:BOOKINGS.length, color:"#0E7C66" },
          ].map(p => (
            <div key={p.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500">{p.label}</span>
                <span className="font-bold text-slate-700">{p.done}/{p.total}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width:`${(p.done/p.total)*100}%`, background:p.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DAILY TASKS ─────────────────────────────────────────────────────────────
function TasksView() {
  const [tasks, setTasks] = useState(TASKS);
  const [filter, setFilter] = useState<"all"|"pending"|"done">("all");
  const [addModal, setAddModal] = useState(false);

  const toggle = (id: number) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const shown = tasks.filter(t => filter === "all" ? true : filter === "pending" ? !t.done : t.done);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daily Tasks</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {tasks.filter(t=>!t.done).length} pending · {tasks.filter(t=>t.done).length} completed
          </p>
        </div>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#14356B] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2a56]">
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {([["all","All"],["pending","Pending"],["done","Done"]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              filter === k ? "bg-[#14356B] text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-[#14356B]/30")}>
            {l}
          </button>
        ))}
      </div>

      {/* Tasks by priority */}
      {(["high","medium","low"] as const).map(priority => {
        const group = shown.filter(t => t.priority === priority);
        if (!group.length) return null;
        const cfg = PRIORITY_CFG[priority];
        return (
          <div key={priority}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cfg.label} Priority</p>
            </div>
            <div className="space-y-2">
              {group.map(t => (
                <div key={t.id} className={cn("flex items-start gap-3 p-4 bg-white rounded-xl border transition-all",
                  t.done ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-[#14356B]/20")}>
                  <button onClick={() => toggle(t.id)}
                    className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                      t.done ? "border-emerald-500 bg-emerald-500" : "border-slate-300 hover:border-[#14356B]")}>
                    {t.done && <Check size={11} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold", t.done ? "line-through text-slate-400" : "text-slate-800")}>{t.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{t.due}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{t.category}</span>
                    </div>
                  </div>
                  <Chip label={cfg.label} cls={cfg.cls} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Add Task</h3>
              <button onClick={() => setAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Task Description</label>
              <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14356B]/20" placeholder="What needs to be done?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none">
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Due Date/Time</label>
                <input type="datetime-local" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
              <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none">
                {["Sales","Visa","Operations","Hotel","Finance","Comm","Admin"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={() => setAddModal(false)}
              className="w-full py-3 bg-[#14356B] text-white font-semibold text-sm rounded-xl hover:bg-[#0f2a56]">
              Save Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────
function StaffBookings() {
  const [search, setSearch] = useState("");
  const shown = BOOKINGS.filter(b => b.customer.toLowerCase().includes(search.toLowerCase()) || b.id.includes(search));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Booking Management</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none w-48" />
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Total",     val:BOOKINGS.length,                                color:"text-slate-800" },
          { label:"Confirmed", val:BOOKINGS.filter(b=>b.status==="confirmed").length, color:"text-blue-600" },
          { label:"Processing",val:BOOKINGS.filter(b=>b.status==="processing").length,color:"text-amber-600"},
          { label:"Completed", val:BOOKINGS.filter(b=>b.status==="completed").length, color:"text-emerald-600"},
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
            <p className={cn("text-xl font-black", s.color)} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[640px] md:min-w-0">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Booking ID","Customer","Service","Departure","Amount","Status",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map(b => (
              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5 text-xs font-mono text-slate-500">{b.id}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#14356B]/10 flex items-center justify-center text-[#14356B] text-xs font-bold">
                      {b.customer.split(" ").map(n=>n[0]).slice(0,2).join("")}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{b.customer}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{b.service}</td>
                <td className="px-4 py-3.5 text-sm text-slate-500">{b.departure}</td>
                <td className="px-4 py-3.5 text-sm font-mono font-bold text-slate-800">{fmtBDT(b.amount)}</td>
                <td className="px-4 py-3.5"><Chip label={BK_STATUS[b.status].label} cls={BK_STATUS[b.status].cls} /></td>
                <td className="px-4 py-3.5">
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
function StaffCustomers() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Customers</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search customers…" className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none w-52" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[640px] md:min-w-0">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Customer","Contact","Last Booking","Bookings","Status",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CUSTOMERS_DATA.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold",
                      c.status==="vip"?"bg-[#C9A227]/20 text-[#C9A227]":"bg-[#14356B]/10 text-[#14356B]")}>
                      {c.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{c.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-500">{c.phone}</td>
                <td className="px-4 py-3.5 text-xs font-mono text-slate-500">{c.lastBooking}</td>
                <td className="px-4 py-3.5 text-sm font-bold text-slate-700">{c.bookings}</td>
                <td className="px-4 py-3.5">
                  {c.status === "vip"
                    ? <span className="flex items-center gap-1 text-xs text-[#C9A227] font-bold"><Star size={11} className="fill-[#C9A227]"/>VIP</span>
                    : <span className="text-xs text-emerald-600 font-semibold">Active</span>}
                </td>
                <td className="px-4 py-3.5">
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function StaffReports() {
  const months = ["Feb","Mar","Apr","May","Jun","Jul"];
  const vals = [3,5,4,6,5,4];
  const max = Math.max(...vals);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">My Reports</h2>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Bookings (Jul)",  val:"4",    delta:"+1", up:true  },
          { label:"Tasks Done",      val:"7",    delta:"+3", up:true  },
          { label:"Customers Served",val:"12",   delta:"+2", up:true  },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xl font-black text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
              <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5",
                s.up ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50")}>
                {s.up ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}{s.delta}
              </span>
            </div>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="font-bold text-slate-800 mb-4">Bookings Closed per Month</p>
        <div className="flex items-end gap-2 h-28">
          {vals.map((v,i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg" style={{ height:`${(v/max)*100}%`, background: i===vals.length-1?"#14356B":"#14356B33" }} />
              <p className="text-xs text-slate-400">{months[i]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-slate-800">Performance Summary</p>
          <button className="flex items-center gap-1.5 text-xs text-[#14356B] font-semibold border border-[#14356B]/30 px-3 py-1.5 rounded-lg hover:bg-[#14356B]/5">
            <Download size={12}/> Export
          </button>
        </div>
        {[
          { label:"Task Completion Rate", val:"78%",   bar:78,  color:"#14356B" },
          { label:"Booking Close Rate",   val:"64%",   bar:64,  color:"#0E7C66" },
          { label:"Customer Satisfaction",val:"4.7★",  bar:94,  color:"#C9A227" },
          { label:"Response Time (avg)",  val:"1.8h",  bar:75,  color:"#7C3AED" },
        ].map(r => (
          <div key={r.label} className="mb-3 last:mb-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">{r.label}</span>
              <span className="font-bold text-slate-700">{r.val}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width:`${r.bar}%`, background:r.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
function StaffDocuments() {
  const [search, setSearch] = useState("");
  const shown = DOCS_DATA.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Documents</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search docs…"
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none w-44" />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {["All","Procedures","Visa","Templates","Policy","Contracts"].map(c => (
          <button key={c} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-[#14356B]/30 hover:text-[#14356B] transition-colors">
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[640px] md:min-w-0">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Document","Category","Size","Updated",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-9 bg-red-100 border border-red-200 rounded-lg flex items-center justify-center text-red-600 text-xs font-bold">{d.type}</div>
                    <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">{d.category}</span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">{d.size}</td>
                <td className="px-4 py-3.5 text-xs text-slate-400">{d.date}</td>
                <td className="px-4 py-3.5">
                  <button className="flex items-center gap-1 text-xs text-[#14356B] font-semibold hover:underline">
                    <Download size={12}/> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
function StaffAnnouncements() {
  const [expanded, setExpanded] = useState<number|null>(1);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Announcements</h2>
      <div className="space-y-3">
        {ANNOUNCEMENTS.map(a => (
          <div key={a.id} className={cn("bg-white rounded-2xl border overflow-hidden",
            a.pinned ? "border-[#C9A227]/40" : "border-slate-200")}>
            <button className="w-full flex items-start gap-3 p-5 text-left" onClick={() => setExpanded(expanded===a.id?null:a.id)}>
              {a.pinned && <Pin size={14} className="text-[#C9A227] flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-bold text-slate-800">{a.title}</p>
                  {a.pinned && <span className="text-xs px-2 py-0.5 bg-[#C9A227]/15 text-[#C9A227] rounded-full font-bold border border-[#C9A227]/30">Pinned</span>}
                </div>
                <p className="text-xs text-slate-400">From: {a.from} · {a.date}</p>
              </div>
              {expanded===a.id ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
            </button>
            {expanded===a.id && (
              <div className="px-5 pb-5 border-t border-slate-100">
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{a.body}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SUPPORT ─────────────────────────────────────────────────────────────────
function StaffSupport() {
  const [active, setActive] = useState<string|null>(null);
  const MSGS = [
    { from:"Me",         text:"I cannot access the visa processing module. Getting a 403 error.", time:"Jul 15 09:00", mine:true  },
    { from:"IT Support", text:"Hi Rafiq, I've checked your permissions. A fix has been applied. Please clear your cache and retry.", time:"Jul 15 09:45", mine:false },
  ];

  if (active) return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setActive(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
          <ChevronRight size={16} className="rotate-180" />
        </button>
        <div>
          <p className="font-bold text-slate-800">{SUP_TICKETS.find(t=>t.id===active)?.subject}</p>
          <p className="text-xs text-slate-400">{active} · Open</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {MSGS.map((m,i) => (
          <div key={i} className={cn("flex",m.mine?"justify-end":"justify-start")}>
            {!m.mine && <div className="w-8 h-8 rounded-full bg-[#14356B] flex items-center justify-center text-white text-xs font-bold mr-2 self-end flex-shrink-0">IT</div>}
            <div className={cn("max-w-sm px-4 py-2.5 rounded-2xl text-sm",m.mine?"bg-[#14356B] text-white rounded-br-sm":"bg-slate-100 text-slate-700 rounded-bl-sm")}>
              {m.text}
              <p className={cn("text-xs mt-1",m.mine?"text-white/60":"text-slate-400")}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input placeholder="Type reply…" className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm focus:outline-none" />
        <button className="p-2.5 bg-[#14356B] text-white rounded-xl"><Send size={16} /></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Support Tickets</h2>
        <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#14356B] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2a56]">
          <Plus size={14}/> New Ticket
        </button>
      </div>
      {SUP_TICKETS.map(t => (
        <div key={t.id} onClick={() => setActive(t.id)}
          className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-3">
              <p className="text-xs font-mono text-slate-400 mb-1">{t.id}</p>
              <p className="font-semibold text-slate-800">{t.subject}</p>
            </div>
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border flex-shrink-0",
              t.status==="open"?"bg-blue-50 text-blue-600 border-blue-200":"bg-emerald-50 text-emerald-600 border-emerald-200")}>
              {t.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1"><MessageSquare size={11}/>{t.msgs} messages</span>
            <span>{t.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function StaffNotifications() {
  const [list, setList] = useState(NOTIFS_DATA);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
        <button onClick={() => setList(n => n.map(x => ({ ...x, read:true })))}
          className="text-sm text-[#14356B] font-semibold hover:underline">Mark all read</button>
      </div>
      <div className="space-y-2.5">
        {list.map(n => (
          <div key={n.id} onClick={() => setList(ls => ls.map(x => x.id===n.id?{...x,read:true}:x))}
            className={cn("flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
              n.read?"bg-white border-slate-200":"bg-[#14356B]/3 border-[#14356B]/15")}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:n.color+"18" }}>
              <div className="w-3 h-3 rounded-full" style={{ background:n.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-800">{n.title}</p>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[#14356B] flex-shrink-0" />}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap mt-0.5">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function StaffProfile() {
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>
      <div className="bg-gradient-to-br from-[#14356B] to-[#1a4a8a] rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-black flex-shrink-0">RI</div>
        <div>
          <p className="text-xl font-bold">Rafiqul Islam</p>
          <p className="text-white/70 text-sm mt-0.5">Booking Officer · Agrabad HO</p>
          <p className="text-white/60 text-xs mt-1 font-mono">EMP-0047 · Since Jan 2022</p>
        </div>
        <button onClick={() => setEditing(v=>!v)} className="ml-auto p-2 hover:bg-white/10 rounded-xl text-white/70">
          <Edit2 size={15} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-semibold text-slate-700 text-sm">Personal Information</p>
        {[
          ["Full Name","Rafiqul Islam"],["Employee ID","EMP-0047"],["Role","Booking Officer"],
          ["Department","Operations"],["Branch","Agrabad HO"],
          ["Phone","+880 1711 XXXXXX"],["Email","rafiq@bdhtravels.com"],
        ].map(([l,v]) => (
          <div key={l}>
            <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
            <input defaultValue={v} disabled={!editing || ["Employee ID","Role","Department","Branch"].includes(l)}
              className={cn("w-full px-3 py-2.5 text-sm rounded-xl border transition-colors",
                editing && !["Employee ID","Role","Department","Branch"].includes(l)
                  ? "border-[#14356B]/40 bg-white focus:outline-none"
                  : "border-transparent bg-slate-50 text-slate-700 cursor-default")} />
          </div>
        ))}
        {editing && (
          <button onClick={() => setEditing(false)}
            className="w-full py-3 bg-[#14356B] text-white font-semibold text-sm rounded-xl hover:bg-[#0f2a56] flex items-center justify-center gap-2">
            <Check size={15}/> Save
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5">
        <p className="font-semibold text-slate-700 text-sm">Security</p>
        {["Change Password","Notification Preferences"].map(item => (
          <button key={item} className="flex items-center justify-between w-full p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <span className="text-sm font-medium text-slate-700">{item}</span>
            <ChevronRight size={15} className="text-slate-400" />
          </button>
        ))}
      </div>

      <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50">
        <LogOut size={16}/> Sign Out
      </button>
    </div>
  );
}

// ─── Sidebar inner component (shared desktop + drawer) ───────────────────────
function StaffSidebar({ view, go, onClose }: { view: StaffView; go: (v: StaffView) => void; onClose?: () => void }) {
  return (
    <aside className="w-56 bg-[#14356B] flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-black">BDH</div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">BDH Travels</p>
            <p className="text-white/50 text-xs">Staff Portal</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={16}/></button>
        )}
      </div>
      <div className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/8">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">RI</div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">Rafiqul Islam</p>
            <p className="text-white/50 text-xs truncate">Booking Officer</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2 overflow-y-auto no-scrollbar space-y-0.5">
        {NAV.map(item => (
          <button key={item.id} onClick={() => { go(item.id); onClose?.(); }}
            className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
              view === item.id
                ? "bg-white/15 text-white font-semibold"
                : "text-white/60 hover:text-white hover:bg-white/8")}
            style={{ minHeight: 44 }}>
            <item.icon size={16} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge ? (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{item.badge}</span>
            ) : null}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 w-full px-3 py-2 rounded-xl hover:bg-white/5"
          style={{ minHeight: 44 }}>
          <LogOut size={14}/> Sign Out
        </button>
      </div>
    </aside>
  );
}

// Mobile bottom nav items
const STAFF_BOTTOM_NAV = [
  { id: "dashboard"     as StaffView, icon: LayoutDashboard, label: "Home"     },
  { id: "tasks"         as StaffView, icon: CheckSquare,     label: "Tasks",  badge: 4 },
  { id: "bookings"      as StaffView, icon: Briefcase,       label: "Bookings" },
  { id: "notifications" as StaffView, icon: Bell,            label: "Alerts", badge: 3 },
  { id: "profile"       as StaffView, icon: User,            label: "Profile"  },
];

// ─── SHELL ────────────────────────────────────────────────────────────────────
export function StaffPortal() {
  const [view, setView] = useState<StaffView>("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const go = (v: StaffView) => setView(v);

  const render = () => {
    switch (view) {
      case "dashboard":     return <StaffDashboard onGo={go} />;
      case "tasks":         return <TasksView />;
      case "bookings":      return <StaffBookings />;
      case "customers":     return <StaffCustomers />;
      case "reports":       return <StaffReports />;
      case "documents":     return <StaffDocuments />;
      case "announcements": return <StaffAnnouncements />;
      case "support":       return <StaffSupport />;
      case "notifications": return <StaffNotifications />;
      case "profile":       return <StaffProfile />;
    }
  };

  const unreadNotif = NOTIFS_DATA.filter(n => !n.read).length;
  const currentLabel = NAV.find(n => n.id === view)?.label ?? "";

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* ── Desktop layout ── */}
      <div className="hidden md:flex h-screen overflow-hidden">
        <StaffSidebar view={view} go={go} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0 h-14">
            <p className="text-sm font-semibold text-slate-600">{currentLabel}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => go("notifications")} className="relative p-2 hover:bg-slate-100 rounded-xl">
                <Bell size={17} className="text-slate-500" />
                {unreadNotif > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold">
                    {unreadNotif}
                  </span>
                )}
              </button>
              <button onClick={() => go("profile")} className="w-7 h-7 rounded-full bg-[#14356B]/15 flex items-center justify-center text-[#14356B] text-xs font-bold">
                RI
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">{render()}</div>
          </main>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile drawer */}
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="w-56">
          <StaffSidebar view={view} go={go} onClose={() => setDrawerOpen(false)} />
        </MobileDrawer>

        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ minWidth: 44 }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#14356B] flex items-center justify-center text-white text-xs font-black">BDH</div>
            </button>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">{currentLabel}</p>
              <p className="text-xs text-slate-400">Rafiqul Islam · Staff</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => go("notifications")} className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100">
              <Bell size={18} className="text-slate-500" />
              {unreadNotif > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold">
                  {unreadNotif}
                </span>
              )}
            </button>
            <button onClick={() => go("profile")}
              className="w-8 h-8 rounded-full bg-[#14356B]/15 flex items-center justify-center text-[#14356B] text-xs font-bold">
              RI
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          {render()}
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav
          items={STAFF_BOTTOM_NAV}
          active={view}
          onChange={go}
        />
      </div>
    </div>
  );
}

export default StaffPortal;
