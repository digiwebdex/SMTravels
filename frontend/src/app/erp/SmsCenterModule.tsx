import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Smartphone, Send, CheckCircle2, FileText, AlertTriangle, Search, Plus, Pencil, Trash2, Info,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  PageHeader, SectionCard, KpiTile, StatusBadge, Btn, TextInput, SelectInput,
  EmptyState, ErrorBanner, SkeletonTable, SkeletonKpi, formatDate, type StatusKey,
} from "../lib/ds";
import { Drawer, Field, inputCls, selectCls, PrimaryBtn, GhostBtn } from "./crm/ui";
import { useAuth } from "../auth/AuthContext";
import { useCustomers, useBranches } from "../hooks/crm";
import { useBatches } from "../hooks/hajjops";
import {
  useSmsTemplates, useSmsLogs, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useSendSms,
  type LogFilters, type MessageTemplateDto, type MessageLogDto,
} from "../hooks/communication";

const MSG_STATUS: Record<string, StatusKey> = { SENT: "success", LOGGED: "info", FAILED: "error" };
const LEAD_STAGES = ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
const SERVICES = ["HAJJ", "UMRAH", "VISA", "AIR_TICKET", "MANPOWER", "TOUR", "HOTEL"];

function MsgStatus({ status }: { status: string }) {
  const { t } = useTranslation("erpSms");
  return <StatusBadge status={MSG_STATUS[status] ?? "info"} label={t(`statusLabel.${status}`, status)} size="xs" />;
}

type Tab = "log" | "templates" | "send";

// ─── LOG TAB ───────────────────────────────────────────────────────────────────
function LogTab() {
  const { t } = useTranslation("erpSms");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filters: LogFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined }), [q, status]);
  const { data, isLoading, isError, refetch } = useSmsLogs(filters);
  const statusOpts = [{ value: "", label: t("log.status") }, ...["SENT", "LOGGED", "FAILED"].map((s) => ({ value: s, label: t(`statusLabel.${s}`) }))];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {isLoading || !data ? <>{Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}</> : (
          <>
            <KpiTile label={t("kpi.total")} value={data.stats.total} icon={Smartphone} accent="#1B75BC" />
            <KpiTile label={t("kpi.sent")} value={data.stats.sent} icon={CheckCircle2} accent="#0E7C66" />
            <KpiTile label={t("kpi.logged")} value={data.stats.logged} icon={Info} accent="#14588F" />
            <KpiTile label={t("kpi.failed")} value={data.stats.failed} icon={AlertTriangle} accent="#DC2626" />
          </>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <div className="[&_input]:pl-9"><TextInput placeholder={t("log.search")} value={q} onChange={setQ} /></div>
        </div>
        <div className="w-full sm:w-44"><SelectInput value={status} onChange={setStatus} options={statusOpts} /></div>
      </div>
      <SectionCard noPad>
        {isError ? <div className="p-5"><ErrorBanner message="Failed to load messages." onRetry={refetch} /></div>
          : isLoading || !data ? <div className="p-5"><SkeletonTable rows={6} cols={6} /></div>
          : data.data.length === 0 ? <EmptyState variant="no-data" title={t("log.empty")} desc={t("log.emptyDesc")} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3 font-bold">{t("log.col.when")}</th>
                  <th className="px-4 py-3 font-bold">{t("log.col.recipient")}</th>
                  <th className="px-4 py-3 font-bold">{t("log.col.body")}</th>
                  <th className="px-4 py-3 font-bold">{t("log.col.status")}</th>
                  <th className="px-4 py-3 font-bold">{t("log.col.by")}</th>
                  <th className="px-4 py-3 font-bold">{t("log.col.branch")}</th>
                </tr></thead>
                <tbody>
                  {data.data.map((m: MessageLogDto) => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(m.createdAt, "short")}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700 font-mono text-xs">{m.recipient}</p>
                        {m.recipientName && <p className="text-[11px] text-slate-400">{m.recipientName}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[360px] truncate" title={m.body}>{m.body}</td>
                      <td className="px-4 py-3"><MsgStatus status={m.status} /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{m.sentByName ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{m.branchName ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </SectionCard>
    </div>
  );
}

// ─── TEMPLATES TAB ─────────────────────────────────────────────────────────────
function TemplatesTab({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation("erpSms");
  const { data, isLoading, isError, refetch } = useSmsTemplates();
  const del = useDeleteTemplate();
  const [form, setForm] = useState<{ open: boolean; editing: MessageTemplateDto | null }>({ open: false, editing: null });

  return (
    <SectionCard noPad>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <p className="font-bold text-slate-800 text-sm">{t("tab.templates")}</p>
        {canManage && <button onClick={() => setForm({ open: true, editing: null })} className="flex items-center gap-1 text-xs font-bold text-[#1B75BC] hover:text-[#14588F]"><Plus size={14} />{t("tpl.new")}</button>}
      </div>
      {isError ? <div className="p-5"><ErrorBanner message="Failed to load templates." onRetry={refetch} /></div>
        : isLoading || !data ? <div className="p-5"><SkeletonTable rows={4} cols={3} /></div>
        : data.length === 0 ? <EmptyState variant="no-data" title={t("tpl.empty")} desc={t("tpl.emptyDesc")} action={canManage ? () => setForm({ open: true, editing: null }) : undefined} actionLabel={t("tpl.new")} />
        : (
          <div className="divide-y divide-slate-50">
            {data.map((tpl) => (
              <div key={tpl.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 text-sm">{tpl.name}</p>
                    {tpl.category && <span className="text-[10px] uppercase tracking-wide text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">{tpl.category}</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{tpl.content}</p>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setForm({ open: true, editing: tpl })} className="p-1.5 text-slate-400 hover:text-[#1B75BC]" title={t("tpl.edit")}><Pencil size={14} /></button>
                    <button onClick={() => { if (confirm(t("tpl.confirmDelete"))) del.mutate(tpl.id); }} className="p-1.5 text-slate-400 hover:text-red-500" title={t("tpl.delete")}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      {form.open && <TemplateFormDrawer template={form.editing} onClose={() => setForm({ open: false, editing: null })} />}
    </SectionCard>
  );
}

function TemplateFormDrawer({ template, onClose }: { template: MessageTemplateDto | null; onClose: () => void }) {
  const { t } = useTranslation("erpSms");
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const editing = !!template;
  const [f, setF] = useState({ name: template?.name ?? "", category: template?.category ?? "", event: template?.event ?? "", content: template?.content ?? "" });
  const busy = create.isPending || update.isPending;
  const valid = f.name.trim().length >= 2 && f.content.trim().length >= 1;
  const submit = () => {
    const input = { name: f.name.trim(), content: f.content.trim(), category: f.category || undefined, event: f.event || undefined, channel: "SMS" as const };
    if (editing) update.mutate({ id: template!.id, input }, { onSuccess: onClose });
    else create.mutate(input, { onSuccess: onClose });
  };
  return (
    <Drawer open onClose={onClose} width="max-w-[520px]"
      title={editing ? t("tpl.form.editTitle") : t("tpl.form.createTitle")}
      footer={<><GhostBtn onClick={onClose}>{t("tpl.form.cancel")}</GhostBtn><PrimaryBtn onClick={submit} disabled={!valid || busy}>{t("tpl.form.save")}</PrimaryBtn></>}
    >
      <div className="space-y-4">
        <Field label={t("tpl.form.name")} required><input className={inputCls} value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("tpl.form.category")}><input className={inputCls} value={f.category} onChange={(e) => setF((p) => ({ ...p, category: e.target.value }))} placeholder="Booking, Marketing…" /></Field>
          <Field label={t("tpl.form.event")}><input className={inputCls} value={f.event} onChange={(e) => setF((p) => ({ ...p, event: e.target.value }))} placeholder="booking.confirmed" /></Field>
        </div>
        <Field label={t("tpl.form.content")} required>
          <textarea className={cn(inputCls, "min-h-[120px] resize-y")} value={f.content} onChange={(e) => setF((p) => ({ ...p, content: e.target.value }))} />
        </Field>
        <p className="text-[11px] text-slate-400">{t("tpl.form.hint")}</p>
      </div>
    </Drawer>
  );
}

// ─── SEND TAB ──────────────────────────────────────────────────────────────────
function SendTab() {
  const { t } = useTranslation("erpSms");
  const { roles } = useAuth();
  const isGlobalRole = roles.includes("SUPER_ADMIN") || roles.includes("COMPANY_ADMIN");
  const send = useSendSms();
  const { data: templates } = useSmsTemplates();
  const { data: customers } = useCustomers({ page: 1, pageSize: 100 });
  const { data: batches } = useBatches();
  const { data: branches } = useBranches();

  const [mode, setMode] = useState<"manual" | "customer" | "lead" | "batch">("manual");
  const [phones, setPhones] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [leadStage, setLeadStage] = useState("");
  const [leadService, setLeadService] = useState("");
  const [batchId, setBatchId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [body, setBody] = useState("");
  const [branchId, setBranchId] = useState("");

  const effectiveBody = templateId ? (templates?.find((x) => x.id === templateId)?.content ?? "") : body;

  const targetValid =
    mode === "manual" ? phones.trim().length > 0 && (!isGlobalRole || !!branchId)
    : mode === "customer" ? !!customerId
    : mode === "batch" ? !!batchId
    : true; // lead segment: empty = whole branch
  const valid = targetValid && effectiveBody.trim().length > 0 && !send.isPending;

  const submit = () => {
    const input: Record<string, unknown> = { mode };
    if (templateId) input.templateId = templateId; else input.body = body.trim();
    if (mode === "manual") { input.phones = phones.split(/[\n,]/).map((p) => p.trim()).filter(Boolean); if (isGlobalRole && branchId) input.branchId = branchId; }
    if (mode === "customer") input.customerId = customerId;
    if (mode === "lead") { if (leadStage) input.leadStage = leadStage; if (leadService) input.leadService = leadService; }
    if (mode === "batch") input.batchId = batchId;
    send.mutate(input as never);
  };

  const modeOpts = (["manual", "customer", "lead", "batch"] as const).map((m) => ({ value: m, label: t(`send.mode.${m}`) }));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <SectionCard title={t("send.title")}>
        <div className="space-y-4">
          <Field label={t("send.audience")}><SelectInput value={mode} onChange={(v) => setMode(v as typeof mode)} options={modeOpts} /></Field>

          {mode === "manual" && (
            <>
              <Field label={t("send.phones")}>
                <textarea className={cn(inputCls, "min-h-[90px] resize-y font-mono text-xs")} value={phones} onChange={(e) => setPhones(e.target.value)} placeholder={t("send.phonesPh")} />
              </Field>
              {isGlobalRole && (
                <Field label={t("send.branch")} required>
                  <select className={selectCls} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                    <option value="">—</option>{(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
              )}
            </>
          )}
          {mode === "customer" && (
            <Field label={t("send.customer")} required>
              <select className={selectCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">{t("send.customerPh")}</option>{(customers?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
              </select>
            </Field>
          )}
          {mode === "lead" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("send.leadStage")}>
                <select className={selectCls} value={leadStage} onChange={(e) => setLeadStage(e.target.value)}>
                  <option value="">{t("send.anyStage")}</option>{LEAD_STAGES.map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
                </select>
              </Field>
              <Field label={t("send.leadService")}>
                <select className={selectCls} value={leadService} onChange={(e) => setLeadService(e.target.value)}>
                  <option value="">{t("send.anyService")}</option>{SERVICES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </Field>
            </div>
          )}
          {mode === "batch" && (
            <Field label={t("send.batch")} required>
              <select className={selectCls} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                <option value="">{t("send.batchPh")}</option>{(batches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name} · {b.code}</option>)}
              </select>
            </Field>
          )}

          <Field label={t("send.template")}>
            <select className={selectCls} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">{t("send.templatePh")}</option>{(templates ?? []).map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
            </select>
          </Field>
          {!templateId && (
            <Field label={t("send.body")}>
              <textarea className={cn(inputCls, "min-h-[100px] resize-y")} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("send.bodyPh")} />
            </Field>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">{t("send.chars", { count: effectiveBody.length })}</span>
            <Btn icon={Send} onClick={submit} disabled={!valid} loading={send.isPending}>{t("send.send")}</Btn>
          </div>
          <p className="text-[11px] text-slate-400">{t("send.recipientsHint")}</p>
        </div>
      </SectionCard>

      {templateId && (
        <SectionCard title={t("send.body")}>
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{effectiveBody}</p>
        </SectionCard>
      )}
    </div>
  );
}

// ─── entry ───────────────────────────────────────────────────────────────────
export function SmsCenterModule() {
  const { t } = useTranslation("erpSms");
  const { can } = useAuth();
  const canManage = can("communication", "manage");
  const [tab, setTab] = useState<Tab>("log");
  const tabs: { key: Tab; label: string }[] = [
    { key: "log", label: t("tab.log") },
    { key: "templates", label: t("tab.templates") },
    ...(canManage ? [{ key: "send" as Tab, label: t("tab.send") }] : []),
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title={t("title")} subtitle={t("subtitle")} badge={{ label: "SMS", status: "info" }} />

      <div className="flex items-start gap-2 px-4 py-3 mb-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">{t("notConfigured")}</p>
      </div>

      <div className="flex items-center gap-1 mb-5 border-b border-slate-200">
        {tabs.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={cn("px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors",
              tab === tb.key ? "text-[#1B75BC] border-[#1B75BC]" : "text-slate-500 border-transparent hover:text-slate-700")}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "log" && <LogTab />}
      {tab === "templates" && <TemplatesTab canManage={canManage} />}
      {tab === "send" && canManage && <SendTab />}
    </div>
  );
}

export default SmsCenterModule;
