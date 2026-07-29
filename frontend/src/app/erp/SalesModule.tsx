import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText, Send, CheckCircle2, XCircle, ArrowRightLeft, Search, ChevronLeft, ChevronRight,
  Plus, Trash2, Pencil, User, Lock, Package as PackageIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  PageHeader, SectionCard, KpiTile, StatusBadge, Btn, TextInput, SelectInput,
  EmptyState, ErrorBanner, SkeletonTable, SkeletonKpi, Avatar, formatAmount, formatDate,
  type StatusKey,
} from "../lib/ds";
import { Drawer, Field, inputCls, selectCls, PrimaryBtn, GhostBtn } from "./crm/ui";
import { useAuth } from "../auth/AuthContext";
import { useCustomers } from "../hooks/crm";
import {
  useQuotations, useQuotation, useCreateQuotation, useUpdateQuotation, useConvertQuotation, useDeleteQuotation,
  type SalesFilters, type QuotationListItem, type QuotationDetail,
} from "../hooks/sales";

const SERVICES = ["HAJJ", "UMRAH", "VISA", "AIR_TICKET", "MANPOWER", "TOUR", "HOTEL"] as const;
const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"] as const;
const QSTATUS: Record<string, StatusKey> = {
  DRAFT: "draft", SENT: "sent", ACCEPTED: "confirmed", REJECTED: "rejected", EXPIRED: "cancelled", CONVERTED: "completed",
};
const money = (n: number, c = "BDT") => formatAmount(n, c as "BDT" | "USD" | "SAR");

function QStatus({ status }: { status: string }) {
  const { t } = useTranslation("erpSales");
  return <StatusBadge status={QSTATUS[status] ?? "info"} label={t(`statusLabel.${status}`, status)} />;
}

// ─── LIST ──────────────────────────────────────────────────────────────────────
function QuotationList({ onOpen, onNew }: { onOpen: (id: string) => void; onNew: () => void }) {
  const { t } = useTranslation("erpSales");
  const { can } = useAuth();
  const canManage = can("sales", "manage");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const filters: SalesFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, serviceType: service || undefined }), [q, status, service]);
  const { data, isLoading, isError, refetch } = useQuotations(filters);

  const statusOpts = [{ value: "", label: t("filter.status") }, ...STATUSES.map((s) => ({ value: s, label: t(`statusLabel.${s}`) }))];
  const serviceOpts = [{ value: "", label: t("filter.service") }, ...SERVICES.map((s) => ({ value: s, label: s.replace("_", " ") }))];
  const openCount = (data?.stats.byStatus.DRAFT ?? 0) + (data?.stats.byStatus.SENT ?? 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title={t("title")} subtitle={t("subtitle")} badge={{ label: "Pre-sale", status: "info" }}
        actions={canManage ? <Btn icon={Plus} onClick={onNew}>{t("new")}</Btn> : undefined}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {isLoading || !data ? (<>{Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}</>) : (
          <>
            <KpiTile label={t("kpi.total")} value={data.stats.total} icon={FileText} accent="#1B75BC" />
            <KpiTile label={t("kpi.open")} value={openCount} icon={Send} accent="#F15A24" />
            <KpiTile label={t("kpi.accepted")} value={data.stats.byStatus.ACCEPTED ?? 0} icon={CheckCircle2} accent="#0E7C66" />
            <KpiTile label={t("kpi.value")} value={money(data.stats.totalValue)} icon={ArrowRightLeft} accent="#14588F" />
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <div className="[&_input]:pl-9"><TextInput placeholder={t("filter.search")} value={q} onChange={setQ} /></div>
        </div>
        <div className="w-full sm:w-44"><SelectInput value={status} onChange={setStatus} options={statusOpts} /></div>
        <div className="w-full sm:w-44"><SelectInput value={service} onChange={setService} options={serviceOpts} /></div>
      </div>

      <SectionCard noPad>
        {isError ? <div className="p-5"><ErrorBanner message="Failed to load quotations." onRetry={refetch} /></div>
          : isLoading || !data ? <div className="p-5"><SkeletonTable rows={6} cols={6} /></div>
          : data.data.length === 0 ? <EmptyState variant="no-results" title={t("empty")} desc={t("emptyDesc")} action={canManage ? onNew : undefined} actionLabel={t("new")} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-3 font-bold">{t("col.quoteNo")}</th>
                    <th className="px-4 py-3 font-bold">{t("col.recipient")}</th>
                    <th className="px-4 py-3 font-bold">{t("col.service")}</th>
                    <th className="px-4 py-3 font-bold text-right">{t("col.total")}</th>
                    <th className="px-4 py-3 font-bold">{t("col.status")}</th>
                    <th className="px-4 py-3 font-bold text-right">{t("col.valid")}</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((qt: QuotationListItem) => (
                    <tr key={qt.id} onClick={() => onOpen(qt.id)} className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-700">{qt.quoteNo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={qt.recipientName ?? "?"} size="xs" color={qt.recipientType === "lead" ? "#F15A24" : "#1B75BC"} />
                          <div className="min-w-0">
                            <p className="text-slate-700 font-medium truncate">{qt.recipientName ?? "—"}</p>
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">{qt.recipientType === "lead" ? t("lead") : t("customer")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{qt.serviceType.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{money(qt.total, qt.currency)}</td>
                      <td className="px-4 py-3"><QStatus status={qt.status} /></td>
                      <td className="px-4 py-3 text-right text-slate-400 text-xs">{qt.validUntil ? formatDate(qt.validUntil, "short") : "—"}</td>
                      <td className="px-2 py-3 text-slate-300"><ChevronRight size={16} /></td>
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

// ─── DETAIL ──────────────────────────────────────────────────────────────────
function QuotationDetailView({ id, onBack, onEdit }: { id: string; onBack: () => void; onEdit: (q: QuotationDetail) => void }) {
  const { t } = useTranslation("erpSales");
  const { can } = useAuth();
  const canManage = can("sales", "manage");
  const { data: q, isLoading, isError, refetch } = useQuotation(id);
  const update = useUpdateQuotation();
  const convert = useConvertQuotation();
  const del = useDeleteQuotation();

  if (isLoading || !q) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"><ChevronLeft size={16} />{t("back")}</button>
        {isError ? <ErrorBanner message="Failed to load quotation." onRetry={refetch} /> : <SkeletonTable rows={6} cols={4} />}
      </div>
    );
  }

  const setStatus = (status: "SENT" | "ACCEPTED" | "REJECTED") => update.mutate({ id: q.id, input: { status } });
  const busy = update.isPending || convert.isPending;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ChevronLeft size={16} />{t("back")}</button>
        {canManage && q.status !== "CONVERTED" && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {q.status === "DRAFT" && <Btn variant="secondary" icon={Pencil} size="sm" onClick={() => onEdit(q)}>{t("detail.edit")}</Btn>}
            {q.status === "DRAFT" && <Btn variant="secondary" icon={Send} size="sm" loading={busy} onClick={() => setStatus("SENT")}>{t("detail.send")}</Btn>}
            {q.status === "SENT" && <Btn variant="secondary" icon={XCircle} size="sm" loading={busy} onClick={() => setStatus("REJECTED")}>{t("detail.reject")}</Btn>}
            {q.status === "SENT" && <Btn icon={CheckCircle2} size="sm" loading={busy} onClick={() => setStatus("ACCEPTED")}>{t("detail.accept")}</Btn>}
            {q.status === "ACCEPTED" && <Btn icon={ArrowRightLeft} size="sm" loading={busy} onClick={() => { if (confirm(t("detail.confirmConvert"))) convert.mutate(q.id); }}>{t("detail.convert")}</Btn>}
            {(q.status === "DRAFT" || q.status === "REJECTED" || q.status === "EXPIRED") && <Btn variant="danger" icon={Trash2} size="sm" onClick={() => { if (confirm(t("detail.confirmDelete"))) del.mutate(q.id, { onSuccess: onBack }); }}>{" "}</Btn>}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#1B75BC]/10 flex items-center justify-center flex-shrink-0"><FileText size={24} className="text-[#1B75BC]" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-800 font-mono">{q.quoteNo}</h1>
            <QStatus status={q.status} />
          </div>
          <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
            <User size={13} /> {q.recipientName ?? "—"} · <span className="uppercase text-[11px] tracking-wide">{q.recipientType === "lead" ? t("lead") : t("customer")}</span>
            {q.branchName ? ` · ${q.branchName}` : ""} · {q.serviceType.replace("_", " ")}
          </p>
        </div>
      </div>

      {q.status === "CONVERTED" && (
        <div className="flex items-center gap-2 px-4 py-3 mb-6 rounded-xl bg-teal-50 border border-teal-200 text-teal-800">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <p className="text-sm font-medium flex-1">{t("detail.converted")}</p>
          {q.bookingId && <a href={`/erp/bookings`} className="text-xs font-bold underline underline-offset-2">{t("detail.bookingLink")}</a>}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile label={t("detail.subtotal")} value={money(q.subtotal, q.currency)} icon={FileText} accent="#64748B" />
        <KpiTile label={t("detail.discount")} value={money(q.discountAmount, q.currency)} sub={q.promoCode ?? undefined} icon={ArrowRightLeft} accent="#F15A24" />
        <KpiTile label={t("detail.total")} value={money(q.total, q.currency)} sub={q.currency !== "BDT" ? `${money(q.baseAmount)} @ ${q.exchangeRate}` : undefined} icon={CheckCircle2} accent="#0E7C66" />
        <KpiTile label={t("detail.lines")} value={q.lines.length} icon={PackageIcon} accent="#1B75BC" />
      </div>

      <SectionCard noPad>
        <div className="px-5 py-3 border-b border-slate-100"><p className="font-bold text-slate-800 text-sm">{t("detail.lines")}</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
              <th className="px-5 py-2.5 font-bold">{t("form.lineDesc")}</th>
              <th className="px-4 py-2.5 font-bold">{t("col.service")}</th>
              <th className="px-4 py-2.5 font-bold text-center">{t("form.lineQty")}</th>
              <th className="px-4 py-2.5 font-bold text-right">{t("form.linePrice")}</th>
              <th className="px-5 py-2.5 font-bold text-right">{t("form.lineAmount")}</th>
            </tr></thead>
            <tbody>
              {q.lines.map((l) => (
                <tr key={l.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 text-slate-700 font-medium">{l.description}</td>
                  <td className="px-4 py-3 text-slate-500">{l.serviceType?.replace("_", " ") ?? "—"}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-500">{l.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">{money(l.unitPrice, q.currency)}</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-slate-800">{money(l.amount, q.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-100"><td colSpan={4} className="px-5 py-2 text-right text-xs text-slate-500 font-semibold">{t("detail.subtotal")}</td><td className="px-5 py-2 text-right font-mono text-slate-700">{money(q.subtotal, q.currency)}</td></tr>
              {q.discountAmount > 0 && <tr><td colSpan={4} className="px-5 py-1 text-right text-xs text-[#F15A24] font-semibold">− {t("detail.discount")}</td><td className="px-5 py-1 text-right font-mono text-[#F15A24]">−{money(q.discountAmount, q.currency)}</td></tr>}
              <tr className="border-t border-slate-100"><td colSpan={4} className="px-5 py-2.5 text-right text-sm font-black text-slate-800">{t("detail.total")}</td><td className="px-5 py-2.5 text-right font-mono font-black text-[#0E7C66]">{money(q.total, q.currency)}</td></tr>
            </tfoot>
          </table>
        </div>
        {q.notes && <div className="px-5 py-3 border-t border-slate-100 text-sm text-slate-600"><span className="text-[11px] uppercase tracking-wide text-slate-400 mr-2">{t("detail.notes")}</span>{q.notes}</div>}
      </SectionCard>

      <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5"><Lock size={11} />{t("detail.noLedgerNote")}</p>
    </div>
  );
}

// ─── FORM (itemized) ───────────────────────────────────────────────────────────
type LineRow = { description: string; serviceType: string; quantity: string; unitPrice: string };
const emptyLine = (): LineRow => ({ description: "", serviceType: "", quantity: "1", unitPrice: "" });

function QuotationFormDrawer({ quote, onClose, onSaved }: { quote: QuotationDetail | null; onClose: () => void; onSaved: (q: QuotationDetail) => void }) {
  const { t } = useTranslation("erpSales");
  const create = useCreateQuotation();
  const update = useUpdateQuotation();
  const editing = !!quote;
  const { data: customers } = useCustomers({ page: 1, pageSize: 100 });

  const [f, setF] = useState({
    customerId: quote?.customerId ?? "",
    serviceType: quote?.serviceType ?? "HAJJ",
    currency: quote?.currency ?? "BDT",
    exchangeRate: quote?.exchangeRate ? String(quote.exchangeRate) : "",
    discountAmount: quote?.discountAmount ? String(quote.discountAmount) : "",
    validUntil: quote?.validUntil ?? "",
    notes: quote?.notes ?? "",
  });
  const [lines, setLines] = useState<LineRow[]>(
    quote?.lines.length ? quote.lines.map((l) => ({ description: l.description, serviceType: l.serviceType ?? "", quantity: String(l.quantity), unitPrice: String(l.unitPrice) })) : [emptyLine()],
  );
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setLine = (i: number, k: keyof LineRow, v: string) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));

  const subtotal = lines.reduce((a, l) => a + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const discount = Math.min(Number(f.discountAmount) || 0, subtotal);
  const total = subtotal - discount;
  const busy = create.isPending || update.isPending;
  const validLines = lines.filter((l) => l.description.trim() && Number(l.unitPrice) >= 0);
  const valid = (editing || f.customerId) && validLines.length > 0 && (f.currency === "BDT" || Number(f.exchangeRate) > 0);

  const submit = () => {
    const payloadLines = validLines.map((l) => ({ description: l.description.trim(), serviceType: (l.serviceType || undefined) as never, quantity: Number(l.quantity) || 1, unitPrice: Number(l.unitPrice) || 0 }));
    const common = {
      serviceType: f.serviceType as never, currency: f.currency as "BDT" | "USD" | "SAR",
      exchangeRate: f.currency !== "BDT" ? Number(f.exchangeRate) : undefined,
      discountAmount: f.discountAmount ? Number(f.discountAmount) : undefined,
      validUntil: f.validUntil || undefined, notes: f.notes || undefined, lines: payloadLines,
    };
    if (editing) update.mutate({ id: quote!.id, input: common }, { onSuccess: onSaved });
    else create.mutate({ ...common, customerId: f.customerId }, { onSuccess: onSaved });
  };

  return (
    <Drawer open onClose={onClose} width="max-w-[680px]"
      title={editing ? t("form.editTitle") : t("form.createTitle")}
      subtitle={editing ? quote!.quoteNo : undefined}
      footer={<><GhostBtn onClick={onClose}>{t("form.cancel")}</GhostBtn><PrimaryBtn onClick={submit} disabled={!valid || busy}>{t("form.save")}</PrimaryBtn></>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {!editing && (
            <div className="col-span-2"><Field label={t("form.recipient")} required>
              <select className={selectCls} value={f.customerId} onChange={set("customerId")}>
                <option value="">{t("form.recipientPh")}</option>
                {(customers?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
              </select>
            </Field></div>
          )}
          <Field label={t("form.service")}>
            <select className={selectCls} value={f.serviceType} onChange={set("serviceType")}>{SERVICES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
          </Field>
          <Field label={t("form.validUntil")}><input className={inputCls} type="date" value={f.validUntil} onChange={set("validUntil")} /></Field>
          <Field label={t("form.currency")}>
            <select className={selectCls} value={f.currency} onChange={set("currency")}>{["BDT", "USD", "SAR"].map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </Field>
          {f.currency !== "BDT" && <Field label={t("form.exchangeRate")}><input className={inputCls} type="number" min={0} step="0.0001" value={f.exchangeRate} onChange={set("exchangeRate")} /></Field>}
        </div>

        {/* line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">{t("form.lines")}</label>
            <button onClick={() => setLines((ls) => [...ls, emptyLine()])} className="flex items-center gap-1 text-xs font-bold text-[#1B75BC] hover:text-[#14588F]"><Plus size={13} />{t("form.addLine")}</button>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input className={cn(inputCls, "col-span-5")} placeholder={t("form.lineDesc")} value={l.description} onChange={(e) => setLine(i, "description", e.target.value)} />
                <select className={cn(selectCls, "col-span-3")} value={l.serviceType} onChange={(e) => setLine(i, "serviceType", e.target.value)}>
                  <option value="">—</option>{SERVICES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
                <input className={cn(inputCls, "col-span-1 text-center")} type="number" min={1} value={l.quantity} onChange={(e) => setLine(i, "quantity", e.target.value)} />
                <input className={cn(inputCls, "col-span-2")} type="number" min={0} placeholder={t("form.linePrice")} value={l.unitPrice} onChange={(e) => setLine(i, "unitPrice", e.target.value)} />
                <button onClick={() => setLines((ls) => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls)} className="col-span-1 flex justify-center text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("form.discount")}><input className={inputCls} type="number" min={0} value={f.discountAmount} onChange={set("discountAmount")} /></Field>
          <div className="flex flex-col justify-end gap-1 text-right">
            <p className="text-xs text-slate-500">{t("form.subtotal")}: <span className="font-mono font-semibold text-slate-700">{money(subtotal, f.currency)}</span></p>
            <p className="text-sm font-black text-[#0E7C66]">{t("form.total")}: <span className="font-mono">{money(total, f.currency)}</span></p>
          </div>
        </div>
        <Field label={t("form.notes")}><input className={inputCls} value={f.notes} onChange={set("notes")} /></Field>
      </div>
    </Drawer>
  );
}

// ─── entry ───────────────────────────────────────────────────────────────────
export function SalesModule() {
  const [selected, setSelected] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editQuote, setEditQuote] = useState<QuotationDetail | null>(null);
  const openNew = () => { setEditQuote(null); setFormOpen(true); };
  const openEdit = (q: QuotationDetail) => { setEditQuote(q); setFormOpen(true); };

  return (
    <>
      {selected
        ? <QuotationDetailView id={selected} onBack={() => setSelected(null)} onEdit={openEdit} />
        : <QuotationList onOpen={setSelected} onNew={openNew} />}
      {formOpen && (
        <QuotationFormDrawer quote={editQuote} onClose={() => setFormOpen(false)} onSaved={(q) => { setFormOpen(false); if (!selected) setSelected(q.id); }} />
      )}
    </>
  );
}

export default SalesModule;
