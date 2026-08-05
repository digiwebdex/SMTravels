import React, { useState } from "react";
import {
  Users, Mail, Phone, Globe, Send, Edit2, Bell,
  Clock, Layers, LayoutTemplate, History, Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  useMessageTemplates, useSendMessage, useBulkSend, useOutboundLog,
  useNotificationDashboard, useOutboundQueue, useRetryOutbound,
  type MessageTemplateDto, type TemplateChannelDto,
} from "../hooks/communications";
import { EmptyState } from "../lib/ds";
import { ModulePage } from "../design-system/patterns/ModulePage";

// ─── Types ────────────────────────────────────────────────────────────────────
/** UI channel keys for outbound compose panels (lowercase). */
type OutboundChannelDto = "email" | "sms" | "whatsapp";
type Channel = "internal" | "group" | "announcements" | "email" | "sms" | "whatsapp";

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

// ─── Inline loader ────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 size={20} className="animate-spin text-slate-300" />
    </div>
  );
}

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
              {dashQ.isLoading && <Loader />}
              {dashQ.isError && !dashQ.isLoading && <EmptyState variant="error" compact />}
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
              {queueQ.isLoading && <Loader />}
              {queueQ.isError && !queueQ.isLoading && <EmptyState variant="error" compact />}
              {!queueQ.isLoading && !queueQ.isError && (queueQ.data?.items.length ?? 0) === 0 && (
                <EmptyState variant="no-data" title="Queue is empty" desc="No queued messages for this channel." compact />
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
              {templatesQ.isLoading && <Loader />}
              {templatesQ.isError && !templatesQ.isLoading && <EmptyState variant="error" compact />}
              {!templatesQ.isLoading && !templatesQ.isError && (templatesQ.data ?? []).length === 0 && (
                <EmptyState variant="no-data" title={`No ${channelCfg.label} templates`} desc="Templates you create will appear here." compact />
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
              {outboundQ.isLoading && <Loader />}
              {outboundQ.isError && !outboundQ.isLoading && <EmptyState variant="error" compact />}
              {!outboundQ.isLoading && !outboundQ.isError && (outboundQ.data ?? []).length === 0 && (
                <EmptyState variant="no-data" title="No history yet" desc="Sent messages will be logged here." compact />
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
                  {allQueue.isLoading && <Loader />}
                  {allQueue.isError && !allQueue.isLoading && <EmptyState variant="error" compact />}
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
                  {!allQueue.isLoading && !allQueue.isError && (allQueue.data?.items.length ?? 0) === 0 && (
                    <EmptyState variant="no-data" title="No notifications yet" desc="Outbound notifications will appear here." compact />
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
