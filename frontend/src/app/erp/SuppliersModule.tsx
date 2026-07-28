import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Truck, Building2, Wallet, FileText, Search, ChevronLeft, ChevronRight, Plus,
  Phone, Mail, Globe, CreditCard, Lock, Star, Pencil, Trash2, Package,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  PageHeader, SectionCard, KpiTile, StatusBadge, Btn, TextInput, SelectInput,
  EmptyState, ErrorBanner, SkeletonTable, SkeletonKpi, Avatar, formatAmount,
  type StatusKey,
} from "../lib/ds";
import { Drawer, Field, inputCls, selectCls, PrimaryBtn, GhostBtn } from "./crm/ui";
import { useAuth } from "../auth/AuthContext";
import {
  useSuppliers, useSupplier, useCreateSupplier, useUpdateSupplier,
  useCreateSupplierService, useUpdateSupplierService, useDeleteSupplierService,
  type SupplierFilters, type SupplierListItem, type SupplierDetail,
} from "../hooks/suppliers";

const money = (n: number, c = "BDT") => formatAmount(n, c as "BDT" | "USD" | "SAR");
const SUP_STATUS: Record<string, StatusKey> = { VERIFIED: "verified", PENDING: "pending", SUSPENDED: "warning" };
const PAY_STATUS: Record<string, StatusKey> = { PENDING: "pending", PARTIAL: "partial", PAID: "paid", OVERDUE: "overdue" };
const INV_STATUS: Record<string, StatusKey> = { pending: "pending", paid: "paid", partial: "partial", overdue: "overdue", draft: "draft", cancelled: "cancelled" };

function SupStatus({ status }: { status: string }) {
  const { t } = useTranslation("erpSuppliers");
  return <StatusBadge status={SUP_STATUS[status] ?? "inactive"} label={t(`statusLabel.${status}`, status)} />;
}

// ─── LIST ──────────────────────────────────────────────────────────────────────
function SupplierList({ onOpen, onNew }: { onOpen: (id: string) => void; onNew: () => void }) {
  const { t } = useTranslation("erpSuppliers");
  const { can } = useAuth();
  const canManage = can("suppliers", "manage");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const filters: SupplierFilters = useMemo(() => ({ q: q.trim() || undefined, category: category.trim() || undefined, status: status || undefined }), [q, category, status]);
  const { data, isLoading, isError, refetch } = useSuppliers(filters);

  const statusOpts = [{ value: "", label: t("filter.status") }, ...["PENDING", "VERIFIED", "SUSPENDED"].map((v) => ({ value: v, label: t(`statusLabel.${v}`) }))];
  const scopeLabel = data?.branchScope ? t("yourBranch") : t("scopeAll");

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title={t("title")} subtitle={t("subtitle")} badge={{ label: "Vendors", status: "info" }}
        actions={canManage ? <Btn icon={Plus} onClick={onNew}>{t("new")}</Btn> : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {isLoading || !data ? (
          <>{Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}</>
        ) : (
          <>
            <KpiTile label={t("kpi.total")} value={data.stats.total} icon={Truck} accent="#1B75BC" />
            <KpiTile label={t("kpi.verified")} value={data.stats.byStatus.VERIFIED ?? 0} icon={Building2} accent="#0E7C66" />
            <KpiTile label={t("kpi.outstanding")} value={money(data.stats.totalOutstanding)} sub={scopeLabel} icon={Wallet} accent="#F15A24" />
            <KpiTile label={t("kpi.invoiced")} value={money(data.stats.totalInvoiced)} icon={FileText} accent="#14588F" />
          </>
        )}
      </div>

      {data && <p className="text-[11px] text-slate-400 mb-4">{t("scopeNote", { branch: scopeLabel })}</p>}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <div className="[&_input]:pl-9"><TextInput placeholder={t("filter.search")} value={q} onChange={setQ} /></div>
        </div>
        <div className="w-full sm:w-48"><TextInput placeholder={t("filter.category")} value={category} onChange={setCategory} /></div>
        <div className="w-full sm:w-44"><SelectInput value={status} onChange={setStatus} options={statusOpts} /></div>
      </div>

      <SectionCard noPad>
        {isError ? (
          <div className="p-5"><ErrorBanner message="Failed to load suppliers." onRetry={refetch} /></div>
        ) : isLoading || !data ? (
          <div className="p-5"><SkeletonTable rows={6} cols={7} /></div>
        ) : data.data.length === 0 ? (
          <EmptyState variant="no-results" title={t("empty")} desc={t("emptyDesc")} action={canManage ? onNew : undefined} actionLabel={t("new")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3 font-bold">{t("col.supplier")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.category")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.contact")}</th>
                  <th className="px-4 py-3 font-bold text-center">{t("col.services")}</th>
                  <th className="px-4 py-3 font-bold text-right">{t("col.outstanding")}</th>
                  <th className="px-4 py-3 font-bold text-right">{t("col.invoiced")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.status")}</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((s: SupplierListItem) => (
                  <tr key={s.id} onClick={() => onOpen(s.id)} className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="sm" color="#14588F" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{s.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{s.supplierCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.category ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <p className="truncate max-w-[160px]">{s.contactPerson ?? "—"}</p>
                      {s.phone && <p className="text-[11px] text-slate-400">{s.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700">{s.servicesCount}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#F15A24]">{money(s.outstanding)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">{money(s.totalInvoiced)}</td>
                    <td className="px-4 py-3"><SupStatus status={s.status} /></td>
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
type Tab = "services" | "invoices" | "payables";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Icon size={14} className="text-slate-400 flex-shrink-0" />
      <span className="text-[11px] uppercase tracking-wide text-slate-400 w-24 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-700 font-medium truncate">{value}</span>
    </div>
  );
}

function SupplierDetailView({ id, onBack, onEdit }: { id: string; onBack: () => void; onEdit: (s: SupplierDetail) => void }) {
  const { t } = useTranslation("erpSuppliers");
  const { can } = useAuth();
  const canManage = can("suppliers", "manage");
  const { data: s, isLoading, isError, refetch } = useSupplier(id);
  const [tab, setTab] = useState<Tab>("services");
  const [svcForm, setSvcForm] = useState<{ open: boolean; editing: SupplierDetail["services"][number] | null }>({ open: false, editing: null });
  const delSvc = useDeleteSupplierService();

  if (isLoading || !s) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"><ChevronLeft size={16} />{t("back")}</button>
        {isError ? <ErrorBanner message="Failed to load supplier." onRetry={refetch} /> : <SkeletonTable rows={8} cols={4} />}
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "services", label: t("tab.services"), count: s.services.length },
    { key: "invoices", label: t("tab.invoices"), count: s.invoices.length },
    { key: "payables", label: t("tab.payables"), count: s.payables.length },
  ];
  const scopeLabel = t("yourBranch"); // detail payables are always caller-scoped

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ChevronLeft size={16} />{t("back")}</button>
        {canManage && <Btn variant="secondary" icon={Pencil} size="sm" onClick={() => onEdit(s)}>{t("detail.edit")}</Btn>}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Avatar name={s.name} size="xl" color="#14588F" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-800">{s.name}</h1>
            <SupStatus status={s.status} />
            {s.rating != null && <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600"><Star size={12} className="fill-amber-400 text-amber-400" />{s.rating.toFixed(1)}</span>}
          </div>
          <p className="text-sm text-slate-400 font-mono mt-0.5">{s.supplierCode}{s.category ? ` · ${s.category}` : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile label={t("detail.outstanding")} value={money(s.outstanding)} sub={scopeLabel} icon={Wallet} accent="#F15A24" />
        <KpiTile label={t("detail.invoiced")} value={money(s.totalInvoiced)} icon={FileText} accent="#14588F" />
        <KpiTile label={t("detail.services")} value={s.servicesCount} icon={Package} accent="#0E7C66" />
        <KpiTile label={t("detail.payables")} value={s.payablesCount} sub={scopeLabel} icon={CreditCard} accent="#1B75BC" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <SectionCard title={t("detail.contact")}>
            {[s.contactPerson, s.phone, s.email, s.website, s.tradeLicense, s.tin, s.address, s.bankName, s.accountNo, s.routingNo].every((v) => !v) ? (
              <p className="text-xs text-slate-400 italic">{t("detail.noContact")}</p>
            ) : (
              <div className="divide-y divide-slate-50">
                <InfoRow icon={Building2} label={t("form.contactPerson")} value={s.contactPerson} />
                <InfoRow icon={Phone} label={t("form.phone")} value={s.phone} />
                <InfoRow icon={Mail} label={t("form.email")} value={s.email} />
                <InfoRow icon={Globe} label={t("form.website")} value={s.website} />
                <InfoRow icon={FileText} label={t("form.tradeLicense")} value={s.tradeLicense} />
                <InfoRow icon={FileText} label={t("form.tin")} value={s.tin} />
                <InfoRow icon={Building2} label={t("form.address")} value={s.address} />
                <InfoRow icon={Building2} label={t("form.bankName")} value={s.bankName} />
                <InfoRow icon={CreditCard} label={t("form.accountNo")} value={s.accountNo} />
                <InfoRow icon={CreditCard} label={t("form.routingNo")} value={s.routingNo} />
              </div>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard noPad>
            <div className="flex items-center justify-between px-3 pt-3 border-b border-slate-100">
              <div className="flex items-center gap-1">
                {tabs.map((tb) => (
                  <button key={tb.key} onClick={() => setTab(tb.key)}
                    className={cn("px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors -mb-px border-b-2",
                      tab === tb.key ? "text-[#1B75BC] border-[#1B75BC]" : "text-slate-500 border-transparent hover:text-slate-700")}>
                    {tb.label} <span className="text-[10px] text-slate-400">({tb.count})</span>
                  </button>
                ))}
              </div>
              {tab === "services" && canManage && (
                <button onClick={() => setSvcForm({ open: true, editing: null })} className="flex items-center gap-1 text-xs font-bold text-[#1B75BC] hover:text-[#14588F] pr-2"><Plus size={13} />{t("detail.addService")}</button>
              )}
            </div>

            {tab === "services" && (
              s.services.length === 0 ? <EmptyState variant="no-data" title={t("detail.noServices")} compact />
                : <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-2.5 font-bold">{t("svcCol.name")}</th>
                      <th className="px-4 py-2.5 font-bold">{t("svcCol.category")}</th>
                      <th className="px-4 py-2.5 font-bold text-right">{t("svcCol.price")}</th>
                      <th className="px-4 py-2.5 font-bold text-center">{t("svcCol.bookings")}</th>
                      <th className="px-4 py-2.5 font-bold text-center">{t("svcCol.active")}</th>
                      {canManage && <th className="px-2 py-2.5" />}
                    </tr></thead>
                    <tbody>{s.services.map((v) => (
                      <tr key={v.id} className="border-b border-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700">{v.name}</td>
                        <td className="px-4 py-3 text-slate-500">{v.category ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">{v.price != null ? money(v.price, v.currency) : (v.priceLabel ?? "—")}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-500">{v.bookingsCount}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={v.active ? "active" : "inactive"} size="xs" /></td>
                        {canManage && <td className="px-2 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setSvcForm({ open: true, editing: v })} className="p-1 text-slate-400 hover:text-[#1B75BC]" title={t("detail.editService")}><Pencil size={13} /></button>
                            <button onClick={() => { if (confirm(t("detail.confirmRemove"))) delSvc.mutate(v.id); }} className="p-1 text-slate-400 hover:text-red-500" title={t("detail.removeService")}><Trash2 size={13} /></button>
                          </div>
                        </td>}
                      </tr>
                    ))}</tbody>
                  </table></div>
            )}

            {tab === "invoices" && (
              s.invoices.length === 0 ? <EmptyState variant="no-data" title={t("detail.noInvoices")} compact />
                : <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-2.5 font-bold">{t("invCol.no")}</th>
                      <th className="px-4 py-2.5 font-bold">{t("invCol.desc")}</th>
                      <th className="px-4 py-2.5 font-bold text-right">{t("invCol.amount")}</th>
                      <th className="px-4 py-2.5 font-bold">{t("invCol.status")}</th>
                      <th className="px-4 py-2.5 font-bold text-right">{t("invCol.due")}</th>
                    </tr></thead>
                    <tbody>{s.invoices.map((v) => (
                      <tr key={v.id} className="border-b border-slate-50">
                        <td className="px-4 py-3 font-mono text-slate-700">{v.invoiceNo}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate">{v.description ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-800">{money(v.amount, v.currency)}</td>
                        <td className="px-4 py-3"><StatusBadge status={INV_STATUS[v.status.toLowerCase()] ?? "info"} label={v.status} size="xs" /></td>
                        <td className="px-4 py-3 text-right text-slate-400 text-xs">{v.dueDate ?? "—"}</td>
                      </tr>
                    ))}</tbody>
                  </table></div>
            )}

            {tab === "payables" && (
              <div>
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50/60 border-b border-amber-100 text-amber-800">
                  <Lock size={14} className="flex-shrink-0" />
                  <p className="text-[11px] leading-snug">{t("detail.payablesNote", { branch: scopeLabel })}</p>
                </div>
                {s.payables.length === 0 ? <EmptyState variant="no-data" title={t("detail.noPayables")} compact />
                  : <div className="overflow-x-auto"><table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="px-4 py-2.5 font-bold">{t("payCol.due")}</th>
                        <th className="px-4 py-2.5 font-bold text-right">{t("payCol.amount")}</th>
                        <th className="px-4 py-2.5 font-bold text-right">{t("payCol.paid")}</th>
                        <th className="px-4 py-2.5 font-bold text-right">{t("payCol.outstanding")}</th>
                        <th className="px-4 py-2.5 font-bold">{t("payCol.status")}</th>
                      </tr></thead>
                      <tbody>{s.payables.map((p) => (
                        <tr key={p.id} className="border-b border-slate-50">
                          <td className="px-4 py-3 text-slate-600">{p.dueDate ?? "—"}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700">{money(p.amount, p.currency)}</td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-700">{money(p.paidAmount, p.currency)}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-[#F15A24]">{money(p.dueAmount, p.currency)}</td>
                          <td className="px-4 py-3"><StatusBadge status={PAY_STATUS[p.status] ?? "info"} label={p.status} size="xs" /></td>
                        </tr>
                      ))}</tbody>
                    </table></div>}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {svcForm.open && <ServiceFormDrawer supplierId={s.id} service={svcForm.editing} onClose={() => setSvcForm({ open: false, editing: null })} />}
    </div>
  );
}

// ─── FORMS ───────────────────────────────────────────────────────────────────
function SupplierFormDrawer({ supplier, onClose, onSaved }: { supplier: SupplierDetail | null; onClose: () => void; onSaved: (s: SupplierDetail) => void }) {
  const { t } = useTranslation("erpSuppliers");
  const create = useCreateSupplier();
  const update = useUpdateSupplier();
  const editing = !!supplier;
  const [f, setF] = useState({
    name: supplier?.name ?? "", category: supplier?.category ?? "", contactPerson: supplier?.contactPerson ?? "",
    phone: supplier?.phone ?? "", email: supplier?.email ?? "", website: supplier?.website ?? "",
    tradeLicense: supplier?.tradeLicense ?? "", tin: supplier?.tin ?? "", address: supplier?.address ?? "",
    bankName: supplier?.bankName ?? "", accountNo: supplier?.accountNo ?? "", routingNo: supplier?.routingNo ?? "",
    rating: supplier?.rating != null ? String(supplier.rating) : "", status: supplier?.status ?? "PENDING",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const busy = create.isPending || update.isPending;
  const valid = f.name.trim().length >= 2;

  const submit = () => {
    const input = {
      name: f.name.trim(), category: f.category, contactPerson: f.contactPerson, phone: f.phone, email: f.email,
      website: f.website, tradeLicense: f.tradeLicense, tin: f.tin, address: f.address,
      bankName: f.bankName, accountNo: f.accountNo, routingNo: f.routingNo,
      rating: f.rating ? Number(f.rating) : undefined, status: f.status as "PENDING" | "VERIFIED" | "SUSPENDED",
    };
    if (editing) update.mutate({ id: supplier!.id, input }, { onSuccess: onSaved });
    else create.mutate(input, { onSuccess: onSaved });
  };

  return (
    <Drawer open onClose={onClose} width="max-w-[560px]"
      title={editing ? t("form.editTitle") : t("form.createTitle")}
      subtitle={editing ? supplier!.supplierCode : undefined}
      footer={<><GhostBtn onClick={onClose}>{t("form.cancel")}</GhostBtn><PrimaryBtn onClick={submit} disabled={!valid || busy}>{t("form.save")}</PrimaryBtn></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Field label={t("form.name")} required><input className={inputCls} value={f.name} onChange={set("name")} /></Field></div>
        <Field label={t("form.category")}><input className={inputCls} value={f.category} onChange={set("category")} placeholder="Hotel, Transport…" /></Field>
        <Field label={t("form.status")}>
          <select className={selectCls} value={f.status} onChange={set("status")}>
            {["PENDING", "VERIFIED", "SUSPENDED"].map((v) => <option key={v} value={v}>{t(`statusLabel.${v}`)}</option>)}
          </select>
        </Field>
        <Field label={t("form.contactPerson")}><input className={inputCls} value={f.contactPerson} onChange={set("contactPerson")} /></Field>
        <Field label={t("form.phone")}><input className={inputCls} value={f.phone} onChange={set("phone")} /></Field>
        <Field label={t("form.email")}><input className={inputCls} value={f.email} onChange={set("email")} type="email" /></Field>
        <Field label={t("form.website")}><input className={inputCls} value={f.website} onChange={set("website")} /></Field>
        <Field label={t("form.tradeLicense")}><input className={inputCls} value={f.tradeLicense} onChange={set("tradeLicense")} /></Field>
        <Field label={t("form.tin")}><input className={inputCls} value={f.tin} onChange={set("tin")} /></Field>
        <div className="col-span-2"><Field label={t("form.address")}><input className={inputCls} value={f.address} onChange={set("address")} /></Field></div>
        <Field label={t("form.bankName")}><input className={inputCls} value={f.bankName} onChange={set("bankName")} /></Field>
        <Field label={t("form.accountNo")}><input className={inputCls} value={f.accountNo} onChange={set("accountNo")} /></Field>
        <Field label={t("form.routingNo")}><input className={inputCls} value={f.routingNo} onChange={set("routingNo")} /></Field>
        <Field label={t("form.rating")}><input className={inputCls} value={f.rating} onChange={set("rating")} type="number" min={0} max={5} step={0.1} /></Field>
      </div>
    </Drawer>
  );
}

function ServiceFormDrawer({ supplierId, service, onClose }: { supplierId: string; service: SupplierDetail["services"][number] | null; onClose: () => void }) {
  const { t } = useTranslation("erpSuppliers");
  const create = useCreateSupplierService();
  const update = useUpdateSupplierService();
  const editing = !!service;
  const [f, setF] = useState({
    name: service?.name ?? "", category: service?.category ?? "",
    price: service?.price != null ? String(service.price) : "", currency: service?.currency ?? "BDT",
    active: service?.active ?? true,
  });
  const busy = create.isPending || update.isPending;
  const valid = f.name.trim().length >= 2;

  const submit = () => {
    const input = {
      name: f.name.trim(), category: f.category || undefined,
      price: f.price ? Number(f.price) : undefined, currency: f.currency as "BDT" | "USD" | "SAR", active: f.active,
    };
    if (editing) update.mutate({ serviceId: service!.id, input }, { onSuccess: onClose });
    else create.mutate({ id: supplierId, input }, { onSuccess: onClose });
  };

  return (
    <Drawer open onClose={onClose} width="max-w-[440px]"
      title={editing ? t("detail.editService") : t("detail.addService")}
      footer={<><GhostBtn onClick={onClose}>{t("form.cancel")}</GhostBtn><PrimaryBtn onClick={submit} disabled={!valid || busy}>{t("form.saveService")}</PrimaryBtn></>}
    >
      <div className="flex flex-col gap-4">
        <Field label={t("form.svcName")} required><input className={inputCls} value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} /></Field>
        <Field label={t("form.svcCategory")}><input className={inputCls} value={f.category} onChange={(e) => setF((p) => ({ ...p, category: e.target.value }))} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("form.svcPrice")}><input className={inputCls} value={f.price} onChange={(e) => setF((p) => ({ ...p, price: e.target.value }))} type="number" min={0} /></Field>
          <Field label="Currency">
            <select className={selectCls} value={f.currency} onChange={(e) => setF((p) => ({ ...p, currency: e.target.value }))}>
              {["BDT", "USD", "SAR"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={f.active} onChange={(e) => setF((p) => ({ ...p, active: e.target.checked }))} className="w-4 h-4 accent-[#1B75BC]" />
          {t("form.svcActive")}
        </label>
      </div>
    </Drawer>
  );
}

// ─── entry ───────────────────────────────────────────────────────────────────
export function SuppliersModule() {
  const [selected, setSelected] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<SupplierDetail | null>(null);

  const openNew = () => { setEditSupplier(null); setFormOpen(true); };
  const openEdit = (s: SupplierDetail) => { setEditSupplier(s); setFormOpen(true); };

  return (
    <>
      {selected
        ? <SupplierDetailView id={selected} onBack={() => setSelected(null)} onEdit={openEdit} />
        : <SupplierList onOpen={setSelected} onNew={openNew} />}
      {formOpen && (
        <SupplierFormDrawer
          supplier={editSupplier}
          onClose={() => setFormOpen(false)}
          onSaved={(d) => { setFormOpen(false); if (!selected) setSelected(d.id); }}
        />
      )}
    </>
  );
}

export default SuppliersModule;
