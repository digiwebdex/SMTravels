import { useState } from "react";
import {
  Phone, Mail, User, Activity, Calendar, PhoneCall, StickyNote, CheckSquare,
  ArrowRight, Edit3, Loader2, Plus, CheckCircle2, Building2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { SkeletonTable, ErrorBanner } from "../../lib/ds";
import { Drawer, StageBadge, Pill, Field, inputCls, selectCls, fmtDateTime, fmtDate } from "./ui";
import {
  useLead, useConvertLead, useAddNote, useAddFollowUp, useAddCall, useAddTask,
  INTEREST_META, type LeadDetail,
} from "../../hooks/crm";
import { SERVICE_LABEL } from "../../hooks/bookings";

type Tab = "overview" | "followups" | "calls" | "notes" | "tasks";

function KV({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[13px] font-semibold text-[#111827] flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-[#9CA3AF]" />}{value || <span className="text-[#D1D5DB]">—</span>}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button onClick={onClick}
      className={cn("flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap",
        active ? "border-[#1B75BC] text-[#1B75BC]" : "border-transparent text-[#6B7280] hover:text-[#374151]")}>
      {children}
      {count !== undefined && count > 0 && (
        <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full", active ? "bg-[#1B75BC] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]")}>{count}</span>
      )}
    </button>
  );
}

export function LeadDetailDrawer({ leadId, onClose, onEdit }: { leadId: string; onClose: () => void; onEdit: (l: LeadDetail) => void }) {
  const { data: lead, isLoading, isError, error, refetch } = useLead(leadId);
  const [tab, setTab] = useState<Tab>("overview");
  const convert = useConvertLead();

  const addNote = useAddNote();
  const addFollow = useAddFollowUp();
  const addCall = useAddCall();
  const addTask = useAddTask();

  const [noteBody, setNoteBody] = useState("");
  const [followAt, setFollowAt] = useState("");
  const [followNote, setFollowNote] = useState("");
  const [callDir, setCallDir] = useState("outbound");
  const [callDur, setCallDur] = useState("");
  const [callNote, setCallNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPrio, setTaskPrio] = useState("MEDIUM");

  return (
    <Drawer open onClose={onClose} width="max-w-[680px]"
      title={lead ? lead.name : "Lead"}
      subtitle={lead ? `${lead.phone}${lead.email ? " · " + lead.email : ""}` : undefined}>
      {isLoading ? (
        <SkeletonTable rows={6} cols={3} />
      ) : isError || !lead ? (
        <ErrorBanner message={(error as Error)?.message || "Lead not found."} onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          {/* header actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <StageBadge stage={lead.stage} />
            <Pill label={`${lead.interest[0]}${lead.interest.slice(1).toLowerCase()} interest`} color={INTEREST_META[lead.interest].color} bg={INTEREST_META[lead.interest].bg} />
            {lead.converted && <Pill label="Converted" color="#065F46" bg="#D1FAE5" icon={CheckCircle2} />}
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => onEdit(lead)} className="flex items-center gap-1.5 h-8 px-3 border border-[#E5E7EB] rounded-[7px] text-[11px] font-medium text-[#374151] hover:border-[#1B75BC]/30 cursor-pointer"><Edit3 size={12} /> Edit</button>
              {!lead.converted && (
                <button onClick={() => convert.mutate(lead.id)} disabled={convert.isPending}
                  className="flex items-center gap-1.5 h-8 px-3 bg-[#0E7C66] text-white rounded-[7px] text-[11px] font-bold hover:bg-[#065F46] cursor-pointer disabled:opacity-60">
                  {convert.isPending ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />} Convert to Customer
                </button>
              )}
            </div>
          </div>

          {/* contact card */}
          <div className="border border-[#E5E7EB] rounded-[12px] p-4 grid grid-cols-3 gap-4">
            <KV label="Phone" value={lead.phone} icon={Phone} />
            <KV label="Email" value={lead.email} icon={Mail} />
            <KV label="Source" value={lead.source} />
            <KV label="Service Interest" value={lead.serviceInterest ? SERVICE_LABEL[lead.serviceInterest] : null} />
            <KV label="Assigned Executive" value={lead.assignedToName} icon={User} />
            <KV label="Branch" value={lead.branchName} icon={Building2} />
            <KV label="Last Contact" value={fmtDateTime(lead.lastContactAt)} />
            <KV label="Next Follow-up" value={fmtDateTime(lead.nextFollowUpAt)} icon={Calendar} />
            <KV label="Created" value={fmtDate(lead.createdAt)} />
          </div>

          {/* tabs */}
          <div className="flex items-center gap-1 border-b border-[#E5E7EB] overflow-x-auto">
            <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} count={lead.activities.length}><Activity size={13} /> Activity</TabBtn>
            <TabBtn active={tab === "followups"} onClick={() => setTab("followups")} count={lead.followUps.length}><Calendar size={13} /> Follow-ups</TabBtn>
            <TabBtn active={tab === "calls"} onClick={() => setTab("calls")} count={lead.callLogs.length}><PhoneCall size={13} /> Calls</TabBtn>
            <TabBtn active={tab === "notes"} onClick={() => setTab("notes")} count={lead.notes.length}><StickyNote size={13} /> Notes</TabBtn>
            <TabBtn active={tab === "tasks"} onClick={() => setTab("tasks")} count={lead.tasks.length}><CheckSquare size={13} /> Tasks</TabBtn>
          </div>

          {/* Activity timeline */}
          {tab === "overview" && (
            <div className="relative flex flex-col gap-0">
              {lead.activities.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-6 text-center">No activity yet.</p>}
              {lead.activities.length > 0 && <div className="absolute left-4 top-3 bottom-3 w-px bg-[#F3F4F6]" />}
              {lead.activities.map((a) => (
                <div key={a.id} className="flex gap-4 pb-4 relative">
                  <div className="w-8 h-8 rounded-full bg-[#EEF2FF] border-2 border-white z-10 flex items-center justify-center flex-shrink-0"><Activity size={13} className="text-[#1B75BC]" /></div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[12px] font-bold text-[#374151]">{a.type.replace(/_/g, " ")}</span>
                        {a.note && <span className="text-[12px] text-[#6B7280]"> — {a.note}</span>}
                        <div className="text-[10px] text-[#9CA3AF] mt-0.5">{a.actor ?? "System"}</div>
                      </div>
                      <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtDateTime(a.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Follow-ups */}
          {tab === "followups" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-end gap-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px] p-3">
                <Field label="Due"><input type="datetime-local" className={inputCls} value={followAt} onChange={(e) => setFollowAt(e.target.value)} /></Field>
                <Field label="Note"><input className={inputCls} placeholder="What to do" value={followNote} onChange={(e) => setFollowNote(e.target.value)} /></Field>
                <button onClick={() => followAt && addFollow.mutate({ id: lead.id, body: { dueAt: new Date(followAt).toISOString(), note: followNote || undefined } }, { onSuccess: () => { setFollowAt(""); setFollowNote(""); } })}
                  disabled={!followAt || addFollow.isPending} className="h-[42px] px-3 bg-[#1B75BC] text-white rounded-[8px] text-[12px] font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"><Plus size={13} /> Add</button>
              </div>
              {lead.followUps.map((fu) => (
                <div key={fu.id} className="flex items-center gap-3 border border-[#E5E7EB] rounded-[10px] px-4 py-2.5">
                  <Calendar size={14} className={fu.done ? "text-[#0E7C66]" : "text-[#1B75BC]"} />
                  <div className="flex-1"><div className="text-[12px] font-semibold text-[#374151]">{fu.note || "Follow-up"}</div><div className="text-[10px] text-[#9CA3AF]">Due {fmtDateTime(fu.dueAt)}{fu.assignedTo ? ` · ${fu.assignedTo}` : ""}</div></div>
                  {fu.done ? <Pill label="Done" color="#065F46" bg="#D1FAE5" /> : <Pill label="Pending" color="#92400E" bg="#FEF3C7" />}
                </div>
              ))}
              {lead.followUps.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-4 text-center">No follow-ups scheduled.</p>}
            </div>
          )}

          {/* Calls */}
          {tab === "calls" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-end gap-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px] p-3">
                <Field label="Direction"><select className={selectCls} value={callDir} onChange={(e) => setCallDir(e.target.value)}><option value="outbound">Outbound</option><option value="inbound">Inbound</option></select></Field>
                <Field label="Duration (s)"><input type="number" className={inputCls} value={callDur} onChange={(e) => setCallDur(e.target.value)} /></Field>
                <Field label="Note"><input className={inputCls} value={callNote} onChange={(e) => setCallNote(e.target.value)} /></Field>
                <button onClick={() => addCall.mutate({ id: lead.id, body: { direction: callDir, durationSec: callDur ? Number(callDur) : undefined, note: callNote || undefined } }, { onSuccess: () => { setCallDur(""); setCallNote(""); } })}
                  disabled={addCall.isPending} className="h-[42px] px-3 bg-[#1B75BC] text-white rounded-[8px] text-[12px] font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"><Plus size={13} /> Log</button>
              </div>
              {lead.callLogs.map((c) => (
                <div key={c.id} className="flex items-center gap-3 border border-[#E5E7EB] rounded-[10px] px-4 py-2.5">
                  <PhoneCall size={14} className="text-[#1B75BC]" />
                  <div className="flex-1"><div className="text-[12px] font-semibold text-[#374151] capitalize">{c.direction} call{c.durationSec ? ` · ${c.durationSec}s` : ""}</div>{c.note && <div className="text-[10px] text-[#9CA3AF]">{c.note}</div>}</div>
                  <span className="text-[10px] text-[#9CA3AF]">{fmtDateTime(c.createdAt)}</span>
                </div>
              ))}
              {lead.callLogs.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-4 text-center">No calls logged.</p>}
            </div>
          )}

          {/* Notes */}
          {tab === "notes" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-end gap-2">
                <input className={inputCls} placeholder="Add a note…" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} />
                <button onClick={() => noteBody.trim() && addNote.mutate({ id: lead.id, body: { body: noteBody.trim() } }, { onSuccess: () => setNoteBody("") })}
                  disabled={!noteBody.trim() || addNote.isPending} className="h-[42px] px-3 bg-[#1B75BC] text-white rounded-[8px] text-[12px] font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"><Plus size={13} /> Add</button>
              </div>
              {lead.notes.map((n) => (
                <div key={n.id} className="border border-[#E5E7EB] rounded-[10px] px-4 py-2.5">
                  <div className="text-[12px] text-[#374151]">{n.body}</div>
                  <div className="text-[10px] text-[#9CA3AF] mt-1">{n.author ?? "—"} · {fmtDateTime(n.createdAt)}</div>
                </div>
              ))}
              {lead.notes.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-4 text-center">No notes.</p>}
            </div>
          )}

          {/* Tasks */}
          {tab === "tasks" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-end gap-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px] p-3">
                <Field label="Task"><input className={inputCls} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Prepare quote…" /></Field>
                <Field label="Priority"><select className={selectCls} value={taskPrio} onChange={(e) => setTaskPrio(e.target.value)}>{["HIGH", "MEDIUM", "LOW"].map((p) => <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>)}</select></Field>
                <button onClick={() => taskTitle.trim() && addTask.mutate({ id: lead.id, body: { title: taskTitle.trim(), priority: taskPrio } }, { onSuccess: () => setTaskTitle("") })}
                  disabled={!taskTitle.trim() || addTask.isPending} className="h-[42px] px-3 bg-[#1B75BC] text-white rounded-[8px] text-[12px] font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"><Plus size={13} /> Add</button>
              </div>
              {lead.tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 border border-[#E5E7EB] rounded-[10px] px-4 py-2.5">
                  <CheckSquare size={14} className="text-[#1B75BC]" />
                  <div className="flex-1"><div className="text-[12px] font-semibold text-[#374151]">{t.title}</div>{t.assignee && <div className="text-[10px] text-[#9CA3AF]">{t.assignee}</div>}</div>
                  <Pill label={t.priority[0] + t.priority.slice(1).toLowerCase()} color={t.priority === "HIGH" ? "#991B1B" : t.priority === "MEDIUM" ? "#92400E" : "#6B7280"} bg={t.priority === "HIGH" ? "#FEE2E2" : t.priority === "MEDIUM" ? "#FEF3C7" : "#F3F4F6"} />
                  <Pill label={t.status.replace(/_/g, " ")} color="#374151" bg="#F3F4F6" />
                </div>
              ))}
              {lead.tasks.length === 0 && <p className="text-[12px] text-[#9CA3AF] py-4 text-center">No tasks.</p>}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
