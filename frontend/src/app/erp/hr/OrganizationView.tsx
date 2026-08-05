import React, { useState } from "react";
import { Plus, Building2, Layers, UsersRound, IdCard, Trash2 } from "lucide-react";
import { ErrorBanner, SkeletonTable } from "../../lib/ds";
import {
  useDepartments, useCreateDepartment, useDeleteDepartment,
  useSections, useCreateSection, useDeleteSection,
  useTeams, useCreateTeam, useDeleteTeam,
  useDesignations, useCreateDesignation, useDeleteDesignation,
  type DepartmentDto, type SectionDto, type TeamDto, type DesignationDto,
} from "../../hooks/hr";
import { Card, Field, PrimaryBtn, inputCls, selectCls } from "./ui";

function Row({ title, subtitle, meta, onDelete }: { title: string; subtitle?: string | null; meta?: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)] last:border-0">
      <div>
        <p className="text-[12.5px] font-semibold text-[var(--color-text)]">{title}</p>
        {subtitle && <p className="text-[11px] text-[var(--color-text-faint)]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {meta && <span className="text-[11px] text-[var(--color-text-faint)]">{meta}</span>}
        <button type="button" onClick={onDelete} aria-label={`Remove ${title}`}
          className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] cursor-pointer p-1">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function OrgSection<T>({ icon: Icon, title, items, isLoading, isError, error, render, form }: {
  icon: React.ElementType;
  title: string;
  items: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  render: (item: T) => React.ReactNode;
  form: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={15} className="text-[var(--color-primary)]" />
        <h3 className="text-[13px] font-black text-[var(--color-text)]">{title}</h3>
        <span className="text-[11px] text-[var(--color-text-faint)]">({items?.length ?? 0})</span>
      </div>
      {form}
      <div className="mt-3 border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden max-h-[320px] overflow-y-auto">
        {isLoading ? <SkeletonTable rows={3} cols={1} /> : isError ? (
          <div className="p-4"><ErrorBanner message={(error as Error)?.message || "Failed to load."} /></div>
        ) : !items || items.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-faint)] py-6 text-center">Nothing here yet.</p>
        ) : items.map((i) => render(i))}
      </div>
    </Card>
  );
}

function DepartmentsCard() {
  const { data, isLoading, isError, error } = useDepartments();
  const createMut = useCreateDepartment();
  const deleteMut = useDeleteDepartment();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    createMut.mutate({ name: name.trim(), code: code.trim() || undefined }, { onSuccess: () => { setName(""); setCode(""); } });
  };

  return (
    <OrgSection<DepartmentDto>
      icon={Building2}
      title="Departments"
      items={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      form={
        <div className="flex items-end gap-2">
          <div className="flex-1"><Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales" /></Field></div>
          <div className="w-24"><Field label="Code"><input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} placeholder="SLS" /></Field></div>
          <PrimaryBtn onClick={submit} disabled={!name.trim() || createMut.isPending}><Plus size={13} /> Add</PrimaryBtn>
        </div>
      }
      render={(d) => (
        <Row key={d.id} title={d.name} subtitle={d.code} meta={`${d.employeesCount} staff · ${d.sectionsCount} sections`} onDelete={() => deleteMut.mutate(d.id)} />
      )}
    />
  );
}

function SectionsCard() {
  const { data: departments } = useDepartments();
  const { data, isLoading, isError, error } = useSections();
  const createMut = useCreateSection();
  const deleteMut = useDeleteSection();
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const submit = () => {
    if (!name.trim() || !departmentId) return;
    createMut.mutate({ name: name.trim(), departmentId }, { onSuccess: () => setName("") });
  };

  return (
    <OrgSection<SectionDto>
      icon={Layers}
      title="Sections"
      items={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      form={
        <div className="flex items-end gap-2">
          <div className="flex-1"><Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ticketing" /></Field></div>
          <div className="w-40">
            <Field label="Department">
              <select className={selectCls} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">Select…</option>
                {(departments ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          </div>
          <PrimaryBtn onClick={submit} disabled={!name.trim() || !departmentId || createMut.isPending}><Plus size={13} /> Add</PrimaryBtn>
        </div>
      }
      render={(s) => (
        <Row key={s.id} title={s.name} subtitle={s.departmentName} meta={`${s.employeesCount} staff · ${s.teamsCount} teams`} onDelete={() => deleteMut.mutate(s.id)} />
      )}
    />
  );
}

function TeamsCard() {
  const { data: sections } = useSections();
  const { data, isLoading, isError, error } = useTeams();
  const createMut = useCreateTeam();
  const deleteMut = useDeleteTeam();
  const [name, setName] = useState("");
  const [sectionId, setSectionId] = useState("");

  const submit = () => {
    if (!name.trim() || !sectionId) return;
    createMut.mutate({ name: name.trim(), sectionId }, { onSuccess: () => setName("") });
  };

  return (
    <OrgSection<TeamDto>
      icon={UsersRound}
      title="Teams"
      items={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      form={
        <div className="flex items-end gap-2">
          <div className="flex-1"><Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Domestic Desk" /></Field></div>
          <div className="w-40">
            <Field label="Section">
              <select className={selectCls} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                <option value="">Select…</option>
                {(sections ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>
          <PrimaryBtn onClick={submit} disabled={!name.trim() || !sectionId || createMut.isPending}><Plus size={13} /> Add</PrimaryBtn>
        </div>
      }
      render={(t) => (
        <Row key={t.id} title={t.name} subtitle={t.sectionName} meta={`${t.employeesCount} staff`} onDelete={() => deleteMut.mutate(t.id)} />
      )}
    />
  );
}

function DesignationsCard() {
  const { data, isLoading, isError, error } = useDesignations();
  const createMut = useCreateDesignation();
  const deleteMut = useDeleteDesignation();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    createMut.mutate({ name: name.trim(), level: level ? Number(level) : undefined }, { onSuccess: () => { setName(""); setLevel(""); } });
  };

  return (
    <OrgSection<DesignationDto>
      icon={IdCard}
      title="Designations"
      items={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      form={
        <div className="flex items-end gap-2">
          <div className="flex-1"><Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Executive" /></Field></div>
          <div className="w-24"><Field label="Level"><input type="number" className={inputCls} value={level} onChange={(e) => setLevel(e.target.value)} placeholder="1" /></Field></div>
          <PrimaryBtn onClick={submit} disabled={!name.trim() || createMut.isPending}><Plus size={13} /> Add</PrimaryBtn>
        </div>
      }
      render={(d) => (
        <Row key={d.id} title={d.name} subtitle={d.level != null ? `Level ${d.level}` : undefined} meta={`${d.employeesCount} staff`} onDelete={() => deleteMut.mutate(d.id)} />
      )}
    />
  );
}

export function OrganizationView() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <DepartmentsCard />
      <SectionsCard />
      <TeamsCard />
      <DesignationsCard />
    </div>
  );
}