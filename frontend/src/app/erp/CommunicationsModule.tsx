import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare, Users, Megaphone, Mail, Phone, Globe,
  Send, Paperclip, Search, Plus, MoreHorizontal, Check,
  CheckCircle, X, ChevronDown, Star, Archive, Trash2,
  RefreshCw, Filter, Edit2, UserPlus, Hash, AtSign,
  Bell, Lock, Image, FileText, Smile, Clock, AlertTriangle,
  ChevronRight, Layers, Info, Eye, Download, Link2,
  LayoutTemplate, History, Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  useMessageTemplates, useSendMessage, useBulkSend, useOutboundLog,
  useNotificationDashboard, useOutboundQueue, useRetryOutbound,
  type MessageTemplateDto, type TemplateChannelDto,
} from "../hooks/communications";
import { ModulePage } from "../design-system/patterns/ModulePage";

// ─── Types ────────────────────────────────────────────────────────────────────
/** UI channel keys for outbound compose panels (lowercase). */
type OutboundChannelDto = "email" | "sms" | "whatsapp";
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


// ─── Channel tab config ───────────────────────────────────────────────────────
type OutboundTab = "templates" | "send" | "bulk" | "log" | "queue" | "dashboard";

const OUTBOUND_CHANNELS: OutboundChannelDto[] = ["email", "sms", "whatsapp"];

function isOutbound(ch: Channel): ch is OutboundChannelDto {
  return OUTBOUND_CHANNELS.includes(ch as OutboundChannelDto);
}

function uiToTemplateChannel(ch: OutboundChannelDto): TemplateChannelDto {
  return ch.toUpperCase() as TemplateChannelDto;
}
const CHANNELS: { id: Channel; label: string; icon: React.ElementType; color: string }[] = [
  { id:"email",        label:"Email",        icon:Mail,          color:"#2563EB" },
  { id:"sms",          label:"SMS",          icon:Phone,         color:"#7C3AED" },
  { id:"whatsapp",     label:"WhatsApp",     icon:Globe,         color:"#25D366" },
  { id:"announcements",label:"Center",       icon:Bell,          color:"#1B75BC" },
];

// ─── Outbound ops (email / SMS / WhatsApp) ────────────────────────────────────

function OutboundOpsPanel({ channel, channelCfg }: { channel: OutboundChannelDto; channelCfg: typeof CHANNELS[number] }) {
  const [tab, setTab] = useState<OutboundTab>("dashboard");
  const tplChannel = uiToTemplateChannel(channel);
  const templatesQ = useMessageTemplates(tplChannel);
  const outboundQ = useOutboundLog();
  const sendMut = useSendMessage();
  const bulkMut = useBulkSend();
  const dashQ = useNotificationDashboard();
  const queueQ = useOutboundQueue({ channel: channel.toUpperCase() });
  const failedQ = useOutboundQueue({ channel: channel.toUpperCase(), status: "FAILED" });
  const retryMut = useRetryOutbound();

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bulkBody, setBulkBody] = useState("");
  const [audience, setAudience] = useState<"customers" | "leads">("customers");

  const applyTemplate = (t: MessageTemplateDto) => {
    if (t.content) setBody(t.content);
    setTab("send");
  };

  const handleSend = () => {
    if (!to.trim() || !body.trim()) return;
    sendMut.mutate({ channel, to: to.trim(), body: body.trim(), ...(channel === "email" ? { subject: subject.trim() || "Message from SM Travels" } : {}) });
  };

  const handleBulk = () => {
    if (!bulkBody.trim()) return;
    bulkMut.mutate({ channel: channel as "sms" | "whatsapp", body: bulkBody.trim(), audience });
  };

  const tabs: { id: OutboundTab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: Layers },
    { id: "send", label: "Send", icon: Send },
    { id: "templates", label: "Templates", icon: LayoutTemplate },
    ...(channel !== "email" ? [{ id: "bulk" as OutboundTab, label: "Bulk", icon: Users }] : []),
    { id: "queue", label: "Queue", icon: Clock },
    { id: "log", label: "History", icon: History },
  ];

  return (
    <div className="flex-1 flex min-w-0">
      <div className="w-48 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] py-3">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
              tab === t.id ? "bg-[#1B75BC]/8 text-[#1B75BC] font-medium" : "text-slate-600 hover:bg-slate-50")}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-5">
            <channelCfg.icon size={20} style={{ color: channelCfg.color }} />
            <h2 className="text-lg font-bold text-slate-800">{channelCfg.label} — {tabs.find(t => t.id === tab)?.label}</h2>
          </div>

          {tab === "dashboard" && (
            <div className="space-y-4">
              {dashQ.isLoading && <p className="text-sm text-slate-400">Loading dashboard…</p>}
              {dashQ.data && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Pending", value: dashQ.data.pending },
                      { label: "Scheduled", value: dashQ.data.scheduled },
                      { label: "Failed", value: dashQ.data.failedTerminal },
                      {
                        label: "Channel",
                        value: dashQ.data.flags[channel === "email" ? "email" : channel === "sms" ? "sms" : "whatsapp"]
                          ? "Live"
                          : "Log-only",
                      },
                    ].map((c) => (
                      <div key={c.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">{c.label}</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{c.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Last 24h by status</p>
                    <div className="space-y-1">
                      {dashQ.data.last24h.filter((r) => r.channel === channel.toUpperCase()).length === 0 && (
                        <p className="text-sm text-slate-400">No activity in the last 24 hours for this channel.</p>
                      )}
                      {dashQ.data.last24h
                        .filter((r) => r.channel === channel.toUpperCase())
                        .map((r) => (
                          <div key={`${r.status}-${r.channel}`} className="flex justify-between text-sm py-1 border-b border-slate-50">
                            <span className="text-slate-600">{r.status}</span>
                            <span className="font-medium text-slate-800">{r.count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  {(failedQ.data?.items.length ?? 0) > 0 && (
                    <div className="bg-[var(--color-surface)] border border-red-100 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-700 mb-2">Failed — retry</p>
                      {failedQ.data!.items.slice(0, 8).map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-2 py-2 border-b border-slate-50 last:border-0">
                          <div className="min-w-0">
                            <p className="text-sm text-slate-800 truncate">{item.event} → {item.to}</p>
                            <p className="text-xs text-red-500 truncate">{item.lastError ?? "Failed"}</p>
                          </div>
                          <button
                            onClick={() => retryMut.mutate(item.id)}
                            disabled={retryMut.isPending}
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 flex-shrink-0"
                          >
                            Retry
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "queue" && (
            <div className="space-y-2">
              {queueQ.isLoading && <p className="text-sm text-slate-400">Loading queue…</p>}
              {(queueQ.data?.items.length ?? 0) === 0 && !queueQ.isLoading && (
                <p className="text-sm text-slate-400 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">Queue is empty.</p>
              )}
              {(queueQ.data?.items ?? []).map((item) => (
                <div key={item.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{item.event}</p>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      item.status === "SENT" ? "bg-emerald-50 text-emerald-700" :
                      item.status === "FAILED" ? "bg-red-50 text-red-700" :
                      item.status === "SCHEDULED" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-100 text-slate-600",
                    )}>{item.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">To: {item.to} · attempts {item.attempts}</p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.bodyPreview}</p>
                  {item.status === "FAILED" && (
                    <button onClick={() => retryMut.mutate(item.id)} className="mt-2 text-xs text-[#1B75BC] hover:underline">
                      Retry now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "send" && (
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
              <input value={to} onChange={e => setTo(e.target.value)}
                placeholder={channel === "email" ? "To (email address)" : "To (phone number, e.g. +8801712345678)"}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
              {channel === "email" && (
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
              )}
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={6}
                placeholder="Message body…"
                className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none" />
              {channel === "sms" && (
                <p className={cn("text-xs text-right", body.length > 160 ? "text-red-500" : "text-slate-400")}>{body.length}/160</p>
              )}
              <button onClick={handleSend} disabled={sendMut.isPending || !to.trim() || !body.trim()}
                className="px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                style={{ background: channelCfg.color }}>
                {sendMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send {channelCfg.label}
              </button>
            </div>
          )}

          {tab === "templates" && (
            <div className="space-y-3">
              {templatesQ.isLoading && <p className="text-sm text-slate-400">Loading templates…</p>}
              {templatesQ.isError && <p className="text-sm text-red-500">Failed to load templates.</p>}
              {(templatesQ.data ?? []).length === 0 && !templatesQ.isLoading && (
                <p className="text-sm text-slate-400 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">No templates for {channelCfg.label} yet.</p>
              )}
              {(templatesQ.data ?? []).map(t => (
                <div key={t.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                      {t.event && <p className="text-xs text-slate-400 mt-0.5">{t.event}</p>}
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full",
                      t.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{t.status}</span>
                  </div>
                  {t.content && <p className="text-sm text-slate-600 mt-2 line-clamp-3 whitespace-pre-line">{t.content}</p>}
                  <button onClick={() => applyTemplate(t)}
                    className="mt-3 text-xs text-[#1B75BC] hover:underline flex items-center gap-1">
                    <Edit2 size={11} /> Use in compose
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "bulk" && channel !== "email" && (
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
              <p className="text-xs text-slate-500">Send to up to 100 active {audience} (branch-scoped). Use {"{name}"} for personalization.</p>
              <select value={audience} onChange={e => setAudience(e.target.value as "customers" | "leads")}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="customers">Active customers</option>
                <option value="leads">Active leads</option>
              </select>
              <textarea value={bulkBody} onChange={e => setBulkBody(e.target.value)} rows={5}
                placeholder="Bulk message…"
                className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
              <button onClick={handleBulk} disabled={bulkMut.isPending || !bulkBody.trim()}
                className="px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                style={{ background: channelCfg.color }}>
                {bulkMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                Send bulk {channelCfg.label}
              </button>
            </div>
          )}

          {tab === "log" && (
            <div className="space-y-2">
              {outboundQ.isLoading && <p className="text-sm text-slate-400">Loading history…</p>}
              {(outboundQ.data ?? []).length === 0 && !outboundQ.isLoading && (
                <p className="text-sm text-slate-400 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">No outbound messages logged yet.</p>
              )}
              {(outboundQ.data ?? []).map(row => (
                <div key={row.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{row.action.replace(/OUTBOUND_/g, "").replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-400 truncate">{row.target ?? "—"}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{new Date(row.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
            : "bg-[var(--color-surface)] border border-[var(--color-border)] text-slate-700 rounded-tl-sm",
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
      <div className="border-t border-slate-100 bg-[var(--color-surface)] p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="To:" className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none col-span-2" />
          <input placeholder="Subject:" className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none col-span-2" />
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="Compose email…" rows={4}
          className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none" />
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {[Paperclip, Image, Link2].map((Icon, i) => (
              <button key={i} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Icon size={15} /></button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">Save Draft</button>
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
    <div className="border-t border-slate-100 bg-[var(--color-surface)] p-3">
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
          className="flex-1 border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none" />
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
    <div className="border-t border-slate-100 bg-[var(--color-surface)] p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Megaphone size={15} className="text-[#D64A12]" />
        <span className="text-sm font-semibold text-slate-700">New Announcement</span>
      </div>
      <input placeholder="Title…" className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none" />
      <textarea rows={3} placeholder="Announcement content…"
        className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
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
    <div className="w-64 flex-shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col overflow-y-auto no-scrollbar">
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
  const [channel, setChannel] = useState<Channel>("email");
  const channelCfg = CHANNELS.find(c => c.id === channel)!;
  const outbound = isOutbound(channel);
  const dashQ = useNotificationDashboard();
  const allQueue = useOutboundQueue({});
  const retryMut = useRetryOutbound();

  return (
    <div className="p-5 md:p-7">
      <ModulePage title="Communications" subtitle="Email, SMS, WhatsApp & in-app notification center">
        <div className="flex min-h-[70vh] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden bg-[#F0F2F5]">
          <div className="w-56 flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
            <div className="px-4 py-4 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Communications</h2>
            </div>
            <nav className="flex-1 py-2 no-scrollbar overflow-y-auto">
              {CHANNELS.map(ch => (
                <button key={ch.id} onClick={() => setChannel(ch.id)}
                  className={cn("w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                    channel === ch.id ? "bg-[#1B75BC]/8 text-[#1B75BC] font-medium" : "text-slate-600 hover:bg-slate-50")}>
                  <ch.icon size={15} style={{ color: channel === ch.id ? ch.color : undefined }}
                    className={channel === ch.id ? "" : "text-slate-400"} />
                  <span className="flex-1 text-left">{ch.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {outbound ? (
            <OutboundOpsPanel channel={channel} channelCfg={channelCfg} />
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl space-y-4">
                <h2 className="text-lg font-bold text-slate-800">Notification Center</h2>
                <p className="text-sm text-slate-500">
                  Unified outbound queue across Email, SMS, WhatsApp, and In-App. Staff chat inbox is deferred to V2.
                </p>
                {dashQ.data && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[var(--color-surface)] border rounded-xl p-4"><p className="text-xs text-slate-400">Pending</p><p className="text-xl font-bold">{dashQ.data.pending}</p></div>
                    <div className="bg-[var(--color-surface)] border rounded-xl p-4"><p className="text-xs text-slate-400">Scheduled</p><p className="text-xl font-bold">{dashQ.data.scheduled}</p></div>
                    <div className="bg-[var(--color-surface)] border rounded-xl p-4"><p className="text-xs text-slate-400">Failed</p><p className="text-xl font-bold">{dashQ.data.failedTerminal}</p></div>
                    <div className="bg-[var(--color-surface)] border rounded-xl p-4">
                      <p className="text-xs text-slate-400">Providers</p>
                      <p className="text-sm font-medium mt-1">
                        E:{dashQ.data.flags.email ? "on" : "off"} · S:{dashQ.data.flags.sms ? "on" : "off"} · W:{dashQ.data.flags.whatsapp ? "on" : "off"}
                      </p>
                    </div>
                  </div>
                )}
                <div className="bg-[var(--color-surface)] border rounded-xl divide-y">
                  {(allQueue.data?.items ?? []).slice(0, 40).map((item) => (
                    <div key={item.id} className="p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{item.channel} · {item.event}</p>
                        <p className="text-xs text-slate-500 truncate">{item.to} — {item.bodyPreview}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-500">{item.status}</span>
                        {item.status === "FAILED" && (
                          <button onClick={() => retryMut.mutate(item.id)} className="text-xs text-[#1B75BC]">Retry</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(allQueue.data?.items.length ?? 0) === 0 && (
                    <p className="p-5 text-sm text-slate-400">No outbound notifications yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </ModulePage>
    </div>
  );
}
