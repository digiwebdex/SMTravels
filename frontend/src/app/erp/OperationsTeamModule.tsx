import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  UsersRound, Globe, Building2, Star, Search, ChevronLeft, ChevronRight, Plus,
  Phone, Mail, MapPin, Languages, IdCard, ShieldCheck, Pencil, Trash2, CalendarDays, BadgeCheck,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  PageHeader, SectionCard, KpiTile, StatusBadge, Btn, TextInput, SelectInput,
  EmptyState, ErrorBanner, SkeletonTable, SkeletonKpi, Avatar, formatDate,
  type StatusKey,
} from "../lib/ds";
import { Drawer, Field, inputCls, selectCls, PrimaryBtn, GhostBtn } from "./crm/ui";
import { useAuth } from "../auth/AuthContext";
import { useBranches } from "../hooks/crm";
import {
  useOpsMembers, useOpsMember, useCreateOpsMember, useUpdateOpsMember, useDeleteOpsMember,
  type OpsFilters, type OpsMemberListItem, type OpsMemberDetail,
} from "../hooks/operations";

const ROLES = ["MUALLIM", "GUIDE", "IMAM", "MEDICAL", "DRIVER", "COORDINATOR", "OTHER"] as const;
const STATUSES = ["ACTIVE", "INACTIVE", "ON_LEAVE"] as const;
const ROLE_CLS: Record<string, string> = {
  MUALLIM: "bg-emerald-50 text-emerald-700 border-emerald-200",
  GUIDE: "bg-blue-50 text-blue-700 border-blue-200",
  IMAM: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MEDICAL: "bg-red-50 text-red-600 border-red-200",
  DRIVER: "bg-amber-50 text-amber-700 border-amber-200",
  COORDINATOR: "bg-purple-50 text-purple-700 border-purple-200",
  OTHER: "bg-slate-100 text-slate-600 border-slate-200",
};
const OPS_STATUS: Record<string, StatusKey> = { ACTIVE: "active", INACTIVE: "inactive", ON_LEAVE: "warning" };

function RolePill({ role }: { role: string }) {
  const { t } = useTranslation("erpOperations");
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", ROLE_CLS[role] ?? ROLE_CLS.OTHER)}>{t(`roleLabel.${role}`, role)}</span>;
}
function OpsStatus({ status }: { status: string }) {
  const { t } = useTranslation("erpOperations");
  return <StatusBadge status={OPS_STATUS[status] ?? "inactive"} label={t(`statusLabel.${status}`, status)} />;
}
function ScopeBadge({ isGlobal, branchName }: { isGlobal: boolean; branchName: string | null }) {
  const { t } = useTranslation("erpOperations");
  return isGlobal
    ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B75BC]"><Globe size={12} />{t("scope.global")}</span>
    : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500"><Building2 size={12} />{branchName ?? t("scope.branch")}</span>;
}

// ─── LIST ──────────────────────────────────────────────────────────────────────
function MemberList({ onOpen, onNew }: { onOpen: (id: string) => void; onNew: () => void }) {
  const { t } = useTranslation("erpOperations");
  const { can } = useAuth();
  const canManage = can("operations_team", "manage");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const filters: OpsFilters = useMemo(() => ({ q: q.trim() || undefined, roleType: role || undefined, status: status || undefined }), [q, role, status]);
  const { data, isLoading, isError, refetch } = useOpsMembers(filters);

  const roleOpts = [{ value: "", label: t("filter.role") }, ...ROLES.map((r) => ({ value: r, label: t(`roleLabel.${r}`) }))];
  const statusOpts = [{ value: "", label: t("filter.status") }, ...STATUSES.map((s) => ({ value: s, label: t(`statusLabel.${s}`) }))];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title={t("title")} subtitle={t("subtitle")} badge={{ label: "Roster", status: "info" }}
        actions={canManage ? <Btn icon={Plus} onClick={onNew}>{t("new")}</Btn> : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {isLoading || !data ? (
          <>{Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}</>
        ) : (
          <>
            <KpiTile label={t("kpi.total")} value={data.stats.total} icon={UsersRound} accent="#1B75BC" />
            <KpiTile label={t("kpi.global")} value={data.stats.global} icon={Globe} accent="#0E7C66" />
            <KpiTile label={t("kpi.branch")} value={data.stats.branchScoped} icon={Building2} accent="#14588F" />
            <KpiTile label={t("kpi.muallims")} value={data.stats.byRole.MUALLIM ?? 0} icon={BadgeCheck} accent="#F15A24" />
          </>
        )}
      </div>
      {data && <p className="text-[11px] text-slate-400 mb-4">{t("scopeNote")}</p>}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <div className="[&_input]:pl-9"><TextInput placeholder={t("filter.search")} value={q} onChange={setQ} /></div>
        </div>
        <div className="w-full sm:w-44"><SelectInput value={role} onChange={setRole} options={roleOpts} /></div>
        <div className="w-full sm:w-44"><SelectInput value={status} onChange={setStatus} options={statusOpts} /></div>
      </div>

      <SectionCard noPad>
        {isError ? (
          <div className="p-5"><ErrorBanner message="Failed to load roster." onRetry={refetch} /></div>
        ) : isLoading || !data ? (
          <div className="p-5"><SkeletonTable rows={6} cols={6} /></div>
        ) : data.data.length === 0 ? (
          <EmptyState variant="no-results" title={t("empty")} desc={t("emptyDesc")} action={canManage ? onNew : undefined} actionLabel={t("new")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3 font-bold">{t("col.member")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.role")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.location")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.languages")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.scope")}</th>
                  <th className="px-4 py-3 font-bold">{t("col.status")}</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((m: OpsMemberListItem) => (
                  <tr key={m.id} onClick={() => onOpen(m.id)} className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} size="sm" color="#0E7C66" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{m.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{m.memberCode}{m.phone ? ` · ${m.phone}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RolePill role={m.roleType} /></td>
                    <td className="px-4 py-3 text-slate-500">{m.baseLocation ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[160px] truncate">{m.languages ?? "—"}</td>
                    <td className="px-4 py-3"><ScopeBadge isGlobal={m.isGlobal} branchName={m.branchName} /></td>
                    <td className="px-4 py-3"><OpsStatus status={m.status} /></td>
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

function MemberDetailView({ id, onBack, onEdit }: { id: string; onBack: () => void; onEdit: (m: OpsMemberDetail) => void }) {
  const { t } = useTranslation("erpOperations");
  const { can } = useAuth();
  const canManage = can("operations_team", "manage");
  const { data: m, isLoading, isError, refetch } = useOpsMember(id);
  const del = useDeleteOpsMember();

  if (isLoading || !m) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"><ChevronLeft size={16} />{t("back")}</button>
        {isError ? <ErrorBanner message="Failed to load member." onRetry={refetch} /> : <SkeletonTable rows={6} cols={3} />}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ChevronLeft size={16} />{t("back")}</button>
        {canManage && (
          <div className="flex items-center gap-2">
            <Btn variant="secondary" icon={Pencil} size="sm" onClick={() => onEdit(m)}>{t("detail.edit")}</Btn>
            <Btn variant="danger" icon={Trash2} size="sm" onClick={() => { if (confirm(t("detail.confirmDelete"))) del.mutate(m.id, { onSuccess: onBack }); }}>{" "}</Btn>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Avatar name={m.name} size="xl" color="#0E7C66" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-800">{m.name}</h1>
            <RolePill role={m.roleType} />
            <OpsStatus status={m.status} />
            {m.rating != null && <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600"><Star size={12} className="fill-amber-400 text-amber-400" />{m.rating.toFixed(1)}</span>}
          </div>
          <p className="text-sm text-slate-400 font-mono mt-0.5 flex items-center gap-2">
            {m.memberCode} · <ScopeBadge isGlobal={m.isGlobal} branchName={m.branchName} />
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SectionCard title={t("detail.contact")}>
            <div className="divide-y divide-slate-50">
              <InfoRow icon={Phone} label={t("field.phone")} value={m.phone} />
              <InfoRow icon={Mail} label={t("field.email")} value={m.email} />
              <InfoRow icon={MapPin} label={t("field.baseLocation")} value={m.baseLocation} />
              <InfoRow icon={Languages} label={t("field.languages")} value={m.languages} />
            </div>
          </SectionCard>

          <SectionCard title={t("detail.identity")}>
            <div className="divide-y divide-slate-50">
              <InfoRow icon={Globe} label={t("field.nationality")} value={m.nationality} />
              <InfoRow icon={IdCard} label={t("field.licenseNo")} value={m.licenseNo} />
              {/* passportNo is PII — decrypted server-side for this authorized view */}
              <div className="flex items-center gap-2.5 py-1.5">
                <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
                <span className="text-[11px] uppercase tracking-wide text-slate-400 w-24 flex-shrink-0">{t("field.passportNo")}</span>
                <span className="text-sm text-slate-700 font-medium font-mono">{m.passportNo ?? "—"}</span>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard title={t("detail.assigned")} subtitle={t("detail.assignedSub")} noPad>
          {m.assignedBatches.length === 0 ? (
            <EmptyState variant="no-data" title={t("detail.noAssigned")} compact />
          ) : (
            <div className="divide-y divide-slate-50">
              {m.assignedBatches.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CalendarDays size={16} className="text-[#1B75BC] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{b.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{b.code}{b.branchName ? ` · ${b.branchName}` : ""}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{b.departureDate ? formatDate(b.departureDate, "short") : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ─── FORM ────────────────────────────────────────────────────────────────────
function MemberFormDrawer({ member, onClose, onSaved }: { member: OpsMemberDetail | null; onClose: () => void; onSaved: (m: OpsMemberDetail) => void }) {
  const { t } = useTranslation("erpOperations");
  const { roles } = useAuth();
  const isGlobalRole = roles.includes("SUPER_ADMIN") || roles.includes("COMPANY_ADMIN");
  const { data: branches } = useBranches();
  const create = useCreateOpsMember();
  const update = useUpdateOpsMember();
  const editing = !!member;
  const [f, setF] = useState({
    name: member?.name ?? "", roleType: member?.roleType ?? "MUALLIM",
    branchId: member?.branchId ?? "", // "" = global/shared crew
    phone: member?.phone ?? "", email: member?.email ?? "", nationality: member?.nationality ?? "",
    baseLocation: member?.baseLocation ?? "", languages: member?.languages ?? "", licenseNo: member?.licenseNo ?? "",
    passportNo: member?.passportNo ?? "", rating: member?.rating != null ? String(member.rating) : "",
    status: member?.status ?? "ACTIVE", notes: member?.notes ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const busy = create.isPending || update.isPending;
  const valid = f.name.trim().length >= 2;

  const submit = () => {
    const input = {
      name: f.name.trim(), roleType: f.roleType as (typeof ROLES)[number],
      // global roles choose ("" = global / a branch id); scoped users omit it → backend forces their branch
      branchId: isGlobalRole ? (f.branchId || "") : undefined,
      phone: f.phone, email: f.email, nationality: f.nationality, baseLocation: f.baseLocation,
      languages: f.languages, licenseNo: f.licenseNo, passportNo: f.passportNo,
      rating: f.rating ? Number(f.rating) : undefined, status: f.status as (typeof STATUSES)[number], notes: f.notes,
    };
    if (editing) update.mutate({ id: member!.id, input }, { onSuccess: onSaved });
    else create.mutate(input, { onSuccess: onSaved });
  };

  return (
    <Drawer open onClose={onClose} width="max-w-[560px]"
      title={editing ? t("form.editTitle") : t("form.createTitle")}
      subtitle={editing ? member!.memberCode : undefined}
      footer={<><GhostBtn onClick={onClose}>{t("form.cancel")}</GhostBtn><PrimaryBtn onClick={submit} disabled={!valid || busy}>{t("form.save")}</PrimaryBtn></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Field label={t("form.name")} required><input className={inputCls} value={f.name} onChange={set("name")} /></Field></div>
        <Field label={t("form.role")}>
          <select className={selectCls} value={f.roleType} onChange={set("roleType")}>{ROLES.map((r) => <option key={r} value={r}>{t(`roleLabel.${r}`)}</option>)}</select>
        </Field>
        <Field label={t("form.status")}>
          <select className={selectCls} value={f.status} onChange={set("status")}>{STATUSES.map((s) => <option key={s} value={s}>{t(`statusLabel.${s}`)}</option>)}</select>
        </Field>
        {isGlobalRole && (
          <div className="col-span-2"><Field label={t("form.scope")}>
            <select className={selectCls} value={f.branchId} onChange={set("branchId")}>
              <option value="">{t("form.scopeGlobal")}</option>
              {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field></div>
        )}
        <Field label={t("form.phone")}><input className={inputCls} value={f.phone} onChange={set("phone")} /></Field>
        <Field label={t("form.email")}><input className={inputCls} value={f.email} onChange={set("email")} type="email" /></Field>
        <Field label={t("form.nationality")}><input className={inputCls} value={f.nationality} onChange={set("nationality")} placeholder="BD, SA…" /></Field>
        <Field label={t("form.baseLocation")}><input className={inputCls} value={f.baseLocation} onChange={set("baseLocation")} placeholder="Makkah, Dhaka…" /></Field>
        <div className="col-span-2"><Field label={t("form.languages")}><input className={inputCls} value={f.languages} onChange={set("languages")} placeholder="Bangla, Arabic, English" /></Field></div>
        <Field label={t("form.licenseNo")}><input className={inputCls} value={f.licenseNo} onChange={set("licenseNo")} /></Field>
        <Field label={t("form.rating")}><input className={inputCls} value={f.rating} onChange={set("rating")} type="number" min={0} max={5} step={0.1} /></Field>
        <div className="col-span-2"><Field label={t("form.passportNo")}><input className={inputCls} value={f.passportNo} onChange={set("passportNo")} /></Field></div>
      </div>
    </Drawer>
  );
}

// ─── entry ───────────────────────────────────────────────────────────────────
export function OperationsTeamModule() {
  const [selected, setSelected] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editMember, setEditMember] = useState<OpsMemberDetail | null>(null);
  const openNew = () => { setEditMember(null); setFormOpen(true); };
  const openEdit = (m: OpsMemberDetail) => { setEditMember(m); setFormOpen(true); };

  return (
    <>
      {selected
        ? <MemberDetailView id={selected} onBack={() => setSelected(null)} onEdit={openEdit} />
        : <MemberList onOpen={setSelected} onNew={openNew} />}
      {formOpen && (
        <MemberFormDrawer
          member={editMember}
          onClose={() => setFormOpen(false)}
          onSaved={(m) => { setFormOpen(false); if (!selected) setSelected(m.id); }}
        />
      )}
    </>
  );
}

export default OperationsTeamModule;
