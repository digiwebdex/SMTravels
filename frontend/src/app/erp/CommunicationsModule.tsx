import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare, Users, Megaphone, Mail, Phone, Globe,
  Send, Paperclip, Search, Plus, MoreHorizontal, Check,
  CheckCircle, X, ChevronDown, Star, Archive, Trash2,
  RefreshCw, Filter, Edit2, UserPlus, Hash, AtSign,
  Bell, Lock, Image, FileText, Smile, Clock, AlertTriangle,
  ChevronRight, Layers, Info, Eye, Download, Link2,
} from "lucide-react";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Channel = "internal" | "group" | "announcements" | "email" | "sms" | "whatsapp";

interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  time: string;
  status?: "sent" | "delivered" | "read";
  attachment?: { name: string; size: string };
  mine?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online?: boolean;
  pinned?: boolean;
  channel: Channel;
  isGroup?: boolean;
  members?: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const CONVERSATIONS: Conversation[] = [
  // Internal
  { id:"c1", name:"Abdullah Chowdhury", avatar:"AC", lastMsg:"Please review the passport doc", time:"10:42", unread:2, online:true,  pinned:true, channel:"internal" },
  { id:"c2", name:"Rahim Khan",         avatar:"RK", lastMsg:"Visa batch ready for submission", time:"09:15", unread:0, online:true,  pinned:false,channel:"internal" },
  { id:"c3", name:"Fatema Begum",       avatar:"FB", lastMsg:"Customer called about Hajj group", time:"Yesterday",unread:0,online:false,pinned:false,channel:"internal" },
  { id:"c4", name:"Nasir Ahmed",        avatar:"NA", lastMsg:"New manpower order arrived",  time:"Yesterday",unread:5,online:false,pinned:false,channel:"internal" },
  // Group
  { id:"g1", name:"Hajj 2024 – Operations", avatar:"H2", lastMsg:"Departure list finalized", time:"11:20", unread:3, isGroup:true, members:12, channel:"group" },
  { id:"g2", name:"Visa Processing Team",   avatar:"VP", lastMsg:"Embassy timing updated",   time:"10:05", unread:0, isGroup:true, members:6,  channel:"group" },
  { id:"g3", name:"Management Committee",   avatar:"MC", lastMsg:"Q2 review on Friday",       time:"Jul 12", unread:0, isGroup:true, members:8,  channel:"group" },
  // Announcements
  { id:"a1", name:"System",  avatar:"SY", lastMsg:"Eid holiday: office closed Jul 17–19", time:"Jul 14", unread:1, channel:"announcements" },
  { id:"a2", name:"HR Dept", avatar:"HR", lastMsg:"Quarterly performance reviews start Aug 1", time:"Jul 10", unread:0, channel:"announcements" },
  // Email
  { id:"e1", name:"customer@gmail.com",       avatar:"CU", lastMsg:"Re: Hajj package inquiry", time:"11:30", unread:1, channel:"email" },
  { id:"e2", name:"Ministry of Hajj & Umrah", avatar:"MH", lastMsg:"Permit confirmation – Batch 7", time:"Jul 13", unread:0, channel:"email" },
  { id:"e3", name:"Biman Bangladesh",          avatar:"BB", lastMsg:"Invoice #BG-0891 – payment due", time:"Jul 12", unread:0, channel:"email" },
  // SMS
  { id:"s1", name:"+880 171-234-5678", avatar:"01", lastMsg:"Your booking is confirmed BK-0892", time:"10:15", unread:0, channel:"sms" },
  { id:"s2", name:"+880 181-345-6789", avatar:"01", lastMsg:"Reminder: visa docs needed by Jul 20", time:"09:00", unread:0, channel:"sms" },
  // WhatsApp
  { id:"w1", name:"Md. Karim Ullah",   avatar:"KU", lastMsg:"Thank you! Received the itinerary", time:"11:45", unread:2, online:true,  channel:"whatsapp" },
  { id:"w2", name:"NMT Travels Group", avatar:"NT", lastMsg:"Next batch quota available?",        time:"10:30", unread:0, isGroup:true, members:8, channel:"whatsapp" },
];

const MESSAGES_MAP: Record<string, Message[]> = {
  c1: [
    { id:"m1", sender:"Abdullah Chowdhury", avatar:"AC", content:"Good morning! I've uploaded the passport scan for Md. Al-Mamun. Could you review the OCR output?", time:"10:20", mine:false },
    { id:"m2", sender:"Me", avatar:"ME", content:"On it. I'll check the OCR results and confirm.", time:"10:22", status:"read", mine:true },
    { id:"m3", sender:"Abdullah Chowdhury", avatar:"AC", content:"There's an issue with the given name field — OCR extracted 'ABDULIAH' but it should be 'ABDULLAH'. Please correct and re-verify.", time:"10:38", mine:false },
    { id:"m4", sender:"Me", avatar:"ME", content:"Got it, I've corrected the field and re-run validation. Confidence is now 97%. Approving now.", time:"10:41", status:"read", mine:true },
    { id:"m5", sender:"Abdullah Chowdhury", avatar:"AC", content:"Please review the passport doc", time:"10:42", mine:false },
  ],
  g1: [
    { id:"m1", sender:"Rahim Khan", avatar:"RK", content:"Departure list for Hajj Group BDH-2024-07 has been finalized. 210 pilgrims confirmed.", time:"11:10", mine:false },
    { id:"m2", sender:"Fatema Begum", avatar:"FB", content:"Hotel allocation in Makkah confirmed for all 210. Checking Madinah now.", time:"11:12", mine:false },
    { id:"m3", sender:"Me", avatar:"ME", content:"Biman confirmed the aircraft for Jul 28 departure. Gate B12.", time:"11:15", status:"delivered", mine:true },
    { id:"m4", sender:"Nasir Ahmed", avatar:"NA", content:"Visa stamps complete for 208/210. 2 pending medical clearance.", time:"11:18", mine:false },
    { id:"m5", sender:"Rahim Khan", avatar:"RK", content:"Departure list finalized", time:"11:20", mine:false, attachment:{ name:"DepartureList_BDH-2024-07.xlsx", size:"84 KB" } },
  ],
  e1: [
    { id:"m1", sender:"customer@gmail.com", avatar:"CU", content:"Dear BDH Travels,\n\nI am interested in the Hajj 2025 Economy Package for my family of 4. Could you please share the itinerary, pricing, and payment plan options?\n\nBest regards,\nMd. Jahangir Alam", time:"11:05", mine:false },
    { id:"m2", sender:"Me", avatar:"ME", content:"Dear Mr. Jahangir,\n\nThank you for reaching out to BDH Travels & Tourism. I'd be happy to share details about our Hajj 2025 Economy Package for a family of 4.\n\nPackage highlights are attached.", time:"11:28", status:"delivered", mine:true, attachment:{ name:"Hajj2025_Economy_Brochure.pdf", size:"2.1 MB" } },
    { id:"m3", sender:"customer@gmail.com", avatar:"CU", content:"Re: Hajj package inquiry", time:"11:30", mine:false },
  ],
  w1: [
    { id:"m1", sender:"Md. Karim Ullah", avatar:"KU", content:"السلام عليكم! I just received the booking confirmation. JazakAllah khayran! 🙏", time:"11:40", mine:false },
    { id:"m2", sender:"Me", avatar:"ME", content:"Wa alaikum assalam! You're most welcome, Karim bhai. Your departure is July 28, Terminal 1, 06:30 AM. Please arrive 3 hours early.", time:"11:42", status:"read", mine:true },
    { id:"m3", sender:"Md. Karim Ullah", avatar:"KU", content:"Thank you! Received the itinerary", time:"11:45", mine:false },
  ],
  s1: [
    { id:"m1", sender:"BDH System", avatar:"SY", content:"[AUTO] Your booking BK-0892 is CONFIRMED. Departure: Jul 28 06:30 AM, Terminal 1. Contact: +880 31 716 4521. BDH Travels.", time:"10:15", mine:true },
  ],
  a1: [
    { id:"m1", sender:"System", avatar:"SY", content:"📢 ANNOUNCEMENT: Our offices will be closed on July 17–19, 2024 for Eid Al-Adha. Emergency support line active 24/7: +880 31-716-9999. All operations resume July 20. Eid Mubarak to all staff and clients!", time:"Jul 14, 09:00", mine:false },
  ],
};

// ─── Channel tab config ───────────────────────────────────────────────────────
const CHANNELS: { id: Channel; label: string; icon: React.ElementType; color: string }[] = [
  { id:"internal",     label:"Internal",     icon:MessageSquare, color:"#1B75BC" },
  { id:"group",        label:"Groups",       icon:Users,         color:"#0E7C66" },
  { id:"announcements",label:"Announcements",icon:Megaphone,     color:"#F15A24" },
  { id:"email",        label:"Email",        icon:Mail,          color:"#2563EB" },
  { id:"sms",          label:"SMS",          icon:Phone,         color:"#7C3AED" },
  { id:"whatsapp",     label:"WhatsApp",     icon:Globe,         color:"#25D366" },
];

// ─── Avatar circle ────────────────────────────────────────────────────────────
function Avatar({ initials, color = "#1B75BC", size = "md", online }: {
  initials: string; color?: string; size?: "sm" | "md" | "lg"; online?: boolean;
}) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";
  return (
    <div className="relative flex-shrink-0">
      <div className={cn("rounded-full flex items-center justify-center font-bold text-white", sz)}
        style={{ background: color }}>
        {initials.slice(0, 2)}
      </div>
      {online && (
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MsgBubble({ msg, channel }: { msg: Message; channel: Channel }) {
  const isEmail = channel === "email";
  return (
    <div className={cn("flex gap-2.5 mb-4", msg.mine ? "flex-row-reverse" : "flex-row")}>
      {!msg.mine && <Avatar initials={msg.avatar} size="sm" color={msg.avatar === "SY" ? "#64748B" : "#1B75BC"} />}
      <div className={cn("max-w-[70%]", isEmail && "max-w-[85%]")}>
        {!msg.mine && (
          <p className="text-xs font-medium text-slate-500 mb-1 ml-1">{msg.sender}</p>
        )}
        <div className={cn("rounded-2xl px-4 py-2.5 text-sm",
          msg.mine
            ? "bg-[#1B75BC] text-white rounded-tr-sm"
            : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm",
          isEmail && "rounded-xl"
        )}>
          {isEmail ? (
            <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
          ) : (
            <p>{msg.content}</p>
          )}
          {msg.attachment && (
            <div className={cn("flex items-center gap-2 mt-2 pt-2 border-t text-xs",
              msg.mine ? "border-white/20" : "border-slate-100")}>
              <FileText size={13} />
              <span className="font-medium">{msg.attachment.name}</span>
              <span className="opacity-60">{msg.attachment.size}</span>
            </div>
          )}
        </div>
        <div className={cn("flex items-center gap-1 mt-1 text-xs text-slate-400", msg.mine ? "justify-end" : "justify-start")}>
          <span>{msg.time}</span>
          {msg.mine && msg.status === "read" && <CheckCircle size={11} className="text-blue-400" />}
          {msg.mine && msg.status === "delivered" && <Check size={11} />}
        </div>
      </div>
    </div>
  );
}

// ─── Compose bar ──────────────────────────────────────────────────────────────
function ComposeBar({ channel, onSend }: { channel: Channel; onSend: (msg: string) => void }) {
  const [text, setText] = useState("");
  const isEmail = channel === "email";
  const isSms = channel === "sms";

  if (isEmail) {
    return (
      <div className="border-t border-slate-100 bg-white p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="To:" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none col-span-2" />
          <input placeholder="Subject:" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none col-span-2" />
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="Compose email…" rows={4}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none" />
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {[Paperclip, Image, Link2].map((Icon, i) => (
              <button key={i} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Icon size={15} /></button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Save Draft</button>
            <button onClick={() => { onSend(text); setText(""); }}
              className="px-4 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] flex items-center gap-2">
              <Send size={13} /> Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 bg-white p-3">
      {isSms && (
        <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
          <span>SMS to +880 171-234-5678</span>
          <span className={cn(text.length > 140 ? "text-red-500" : "")}>{text.length}/160</span>
        </div>
      )}
      <div className="flex items-end gap-2">
        {!isSms && (
          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 flex-shrink-0">
            <Paperclip size={16} />
          </button>
        )}
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder={
            channel === "whatsapp" ? "Type a WhatsApp message…" :
            channel === "sms" ? "Type an SMS message…" :
            channel === "announcements" ? "Write an announcement…" :
            "Type a message…"
          }
          rows={1}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(text); setText(""); } }}
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none" />
        {!isSms && (
          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 flex-shrink-0">
            <Smile size={16} />
          </button>
        )}
        <button onClick={() => { onSend(text); setText(""); }} disabled={!text.trim()}
          className={cn("p-2 rounded-xl flex-shrink-0 transition-all",
            text.trim()
              ? channel === "whatsapp" ? "bg-[#25D366] text-white" : "bg-[#1B75BC] text-white"
              : "bg-slate-100 text-slate-300 cursor-not-allowed")}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Announcements compose ────────────────────────────────────────────────────
function AnnouncementCompose({ onPost }: { onPost: () => void }) {
  return (
    <div className="border-t border-slate-100 bg-white p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Megaphone size={15} className="text-[#D64A12]" />
        <span className="text-sm font-semibold text-slate-700">New Announcement</span>
      </div>
      <input placeholder="Title…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
      <textarea rows={3} placeholder="Announcement content…"
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" className="accent-[#1B75BC]" defaultChecked /> All Staff
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" className="accent-[#1B75BC]" /> Send Email
          </label>
        </div>
        <button onClick={onPost} className="px-4 py-1.5 text-sm bg-[#F15A24] text-white rounded-lg hover:bg-amber-600 flex items-center gap-2">
          <Megaphone size={13} /> Post Announcement
        </button>
      </div>
    </div>
  );
}

// ─── Conversation info panel ──────────────────────────────────────────────────
function ConvInfo({ conv, channel }: { conv: Conversation; channel: Channel }) {
  if (!conv) return null;
  return (
    <div className="w-64 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-4 border-b border-slate-100 text-center">
        <Avatar initials={conv.avatar} size="lg" online={conv.online} color={CHANNELS.find(c => c.id === channel)?.color} />
        <p className="font-semibold text-slate-800 mt-2 text-sm">{conv.name}</p>
        {conv.isGroup && <p className="text-xs text-slate-400">{conv.members} members</p>}
        {conv.online && <p className="text-xs text-emerald-500">Online</p>}
      </div>
      <div className="p-4 space-y-3">
        {conv.isGroup && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Members</p>
            {["Abdullah C.", "Rahim K.", "Fatema B.", "Nasir A."].map(m => (
              <div key={m} className="flex items-center gap-2 py-1">
                <Avatar initials={m.slice(0,2).replace(/\s/,"")} size="sm" color="#64748B" />
                <span className="text-xs text-slate-600">{m}</span>
              </div>
            ))}
            <button className="text-xs text-[#1B75BC] hover:underline mt-1 flex items-center gap-1">
              <UserPlus size={11} /> Add member
            </button>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Shared Files</p>
          {[
            { name:"DepartureList.xlsx", size:"84 KB" },
            { name:"Hajj2025_Brochure.pdf", size:"2.1 MB" },
          ].map(f => (
            <div key={f.name} className="flex items-center gap-2 py-1.5">
              <FileText size={12} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-700 truncate">{f.name}</p>
                <p className="text-xs text-slate-400">{f.size}</p>
              </div>
              <button className="ml-auto p-1 hover:bg-slate-100 rounded"><Download size={11} className="text-slate-400" /></button>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          {[
            { label:"Mute notifications", icon:Bell },
            { label:"Search in conversation", icon:Search },
            { label:"Archive", icon:Archive },
          ].map(({ label, icon: Icon }) => (
            <button key={label} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg">
              <Icon size={13} className="text-slate-400" /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────
export function CommunicationsModule() {
  const [channel, setChannel] = useState<Channel>("internal");
  const [selectedId, setSelectedId] = useState<string>("c1");
  const [messages, setMessages] = useState<Record<string, Message[]>>(MESSAGES_MAP);
  const [showInfo, setShowInfo] = useState(true);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const channelCfg = CHANNELS.find(c => c.id === channel)!;
  const convList = CONVERSATIONS.filter(c => c.channel === channel && (
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  ));
  const selected = CONVERSATIONS.find(c => c.id === selectedId) ?? convList[0];
  const msgs = selected ? (messages[selected.id] ?? []) : [];

  const totalUnread = CONVERSATIONS.reduce((s, c) => s + c.unread, 0);

  const handleSend = (text: string) => {
    if (!text.trim() || !selected) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "Me", avatar: "ME",
      content: text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent", mine: true,
    };
    setMessages(prev => ({ ...prev, [selected.id]: [...(prev[selected.id] ?? []), newMsg] }));
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, selectedId]);

  // Auto-select first conversation when switching channels
  useEffect(() => {
    const first = CONVERSATIONS.find(c => c.channel === channel);
    if (first) setSelectedId(first.id);
  }, [channel]);

  return (
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      {/* ── Channel sidebar ── */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Communications</h2>
          {totalUnread > 0 && (
            <span className="text-xs font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {totalUnread}
            </span>
          )}
        </div>
        <nav className="flex-1 py-2 no-scrollbar overflow-y-auto">
          {CHANNELS.map(ch => {
            const unread = CONVERSATIONS.filter(c => c.channel === ch.id).reduce((s, c) => s + c.unread, 0);
            return (
              <button key={ch.id} onClick={() => setChannel(ch.id)}
                className={cn("w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                  channel === ch.id ? "bg-[#1B75BC]/8 text-[#1B75BC] font-medium" : "text-slate-600 hover:bg-slate-50")}>
                <ch.icon size={15} style={{ color: channel === ch.id ? ch.color : undefined }}
                  className={channel === ch.id ? "" : "text-slate-400"} />
                <span className="flex-1 text-left">{ch.label}</span>
                {unread > 0 && (
                  <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={{ background: ch.color }}>
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
            <Plus size={14} />
            {channel === "group" ? "New Group" : channel === "announcements" ? "New Announcement" : "New Message"}
          </button>
        </div>
      </div>

      {/* ── Conversation list ── */}
      <div className="w-72 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-3 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder={`Search ${channelCfg.label.toLowerCase()}…`}
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Pinned */}
          {channel === "internal" && convList.filter(c => c.pinned).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-1">Pinned</p>
              {convList.filter(c => c.pinned).map(conv => (
                <ConvItem key={conv.id} conv={conv} selected={selectedId === conv.id}
                  channelColor={channelCfg.color} onClick={() => setSelectedId(conv.id)} />
              ))}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-1">Other</p>
            </div>
          )}
          {convList.filter(c => channel !== "internal" || !c.pinned).map(conv => (
            <ConvItem key={conv.id} conv={conv} selected={selectedId === conv.id}
              channelColor={channelCfg.color} onClick={() => setSelectedId(conv.id)} />
          ))}
          {convList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <channelCfg.icon size={28} className="text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Message thread ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F7F8FA]">
        {selected ? (
          <>
            {/* Thread header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <Avatar initials={selected.avatar} online={selected.online} color={channelCfg.color} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{selected.name}</p>
                <p className="text-xs text-slate-400">
                  {selected.online ? "Online" : selected.isGroup ? `${selected.members} members` : "Offline"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-slate-100 rounded-lg"><Search size={15} className="text-slate-500" /></button>
                <button className="p-2 hover:bg-slate-100 rounded-lg"><Phone size={15} className="text-slate-500" /></button>
                <button onClick={() => setShowInfo(v => !v)}
                  className={cn("p-2 rounded-lg", showInfo ? "bg-slate-100 text-slate-700" : "hover:bg-slate-100 text-slate-500")}>
                  <Info size={15} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg"><MoreHorizontal size={15} className="text-slate-500" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 no-scrollbar">
              {channel === "announcements" && (
                <div className="flex justify-center mb-4">
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 rounded-full">
                    📢 Announcement — visible to all staff
                  </span>
                </div>
              )}
              {msgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <channelCfg.icon size={32} className="text-slate-200 mb-3" />
                  <p className="text-slate-400 text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                msgs.map(msg => <MsgBubble key={msg.id} msg={msg} channel={channel} />)
              )}
              <div ref={bottomRef} />
            </div>

            {/* Compose */}
            {channel === "announcements" ? (
              <AnnouncementCompose onPost={() => handleSend("New announcement posted")} />
            ) : (
              <ComposeBar channel={channel} onSend={handleSend} />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <channelCfg.icon size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">Select a conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Info panel ── */}
      {showInfo && selected && <ConvInfo conv={selected} channel={channel} />}
    </div>
  );
}

// ─── Conversation list item ───────────────────────────────────────────────────
function ConvItem({ conv, selected, channelColor, onClick }: {
  conv: Conversation; selected: boolean; channelColor: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={cn("w-full flex items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50",
        selected ? "bg-blue-50/60 border-r-2 border-[#1B75BC]" : "")}>
      <Avatar initials={conv.avatar} online={conv.online} color={channelColor} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={cn("text-sm truncate", conv.unread > 0 ? "font-bold text-slate-800" : "font-medium text-slate-700")}>
            {conv.name}
          </p>
          <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{conv.time}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className={cn("text-xs truncate", conv.unread > 0 ? "text-slate-600 font-medium" : "text-slate-400")}>
            {conv.lastMsg}
          </p>
          {conv.unread > 0 && (
            <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full ml-1 min-w-[18px] text-center flex-shrink-0"
              style={{ background: channelColor }}>
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

