import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Drawer, Field, inputCls, selectCls, PrimaryBtn } from "./ui";
import { SERVICE_LABEL } from "../../hooks/bookings";
import {
  useCreateLead, useUpdateLead, useUsers, useBranches,
  useCreateCustomer, useUpdateCustomer, useCreateCorporate, useUpdateCorporate,
  STAGE_ORDER, STAGE_META,
  type LeadDetail, type CustomerProfile, type CorporateProfile,
} from "../../hooks/crm";
import type { ServiceTypeDto } from "@contracts/booking.contract";

const SERVICE_OPTS = Object.entries(SERVICE_LABEL) as [ServiceTypeDto, string][];

function Cancel({ onClose }: { onClose: () => void }) {
  return <button onClick={onClose} className="h-9 px-4 border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:border-[#1B75BC]/30 cursor-pointer">Cancel</button>;
}

// ── Lead ──────────────────────────────────────────────────────────────────────
export function LeadFormDrawer({ open, onClose, lead }: { open: boolean; onClose: () => void; lead?: LeadDetail | null }) {
  const editing = !!lead;
  const { data: users } = useUsers();
  const { data: branches } = useBranches();
  const create = useCreateLead();
  const update = useUpdateLead(lead?.id ?? "");
  const busy = create.isPending || update.isPending;
  const [f, setF] = useState(() => ({
    name: lead?.name ?? "", phone: lead?.phone ?? "", email: lead?.email ?? "", source: lead?.source ?? "",
    serviceInterest: lead?.serviceInterest ?? "", interest: lead?.interest ?? "MEDIUM", stage: lead?.stage ?? "NEW",
    assignedToId: lead?.assignedToId ?? "", branchId: "",
  }));
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    const body = {
      name: f.name, phone: f.phone, email: f.email || undefined, source: f.source || undefined,
      serviceInterest: (f.serviceInterest || undefined) as ServiceTypeDto | undefined,
      interest: f.interest as "HIGH" | "MEDIUM" | "LOW", assignedToId: f.assignedToId || undefined,
    };
    try {
      if (editing) await update.mutateAsync({ ...body, stage: f.stage as LeadDetail["stage"] });
      else await create.mutateAsync({ ...body, branchId: f.branchId || undefined });
      onClose();
    } catch { /* toast handled by hook */ }
  };

  return (
    <Drawer open={open} onClose={onClose} title={editing ? "Edit Lead" : "New Lead"} subtitle="Prospect contact & interest"
      footer={<><Cancel onClose={onClose} /><PrimaryBtn onClick={submit} disabled={busy || !f.name || !f.phone}>{busy && <Loader2 size={13} className="animate-spin" />} {editing ? "Save" : "Create Lead"}</PrimaryBtn></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" required><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Phone" required><input className={inputCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        </div>
        <Field label="Email"><input className={inputCls} value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Source"><input className={inputCls} placeholder="Facebook, Referral…" value={f.source} onChange={(e) => set("source", e.target.value)} /></Field>
          <Field label="Service Interest">
            <select className={selectCls} value={f.serviceInterest} onChange={(e) => set("serviceInterest", e.target.value)}>
              <option value="">—</option>
              {SERVICE_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Interest">
            <select className={selectCls} value={f.interest} onChange={(e) => set("interest", e.target.value)}>
              {["HIGH", "MEDIUM", "LOW"].map((i) => <option key={i} value={i}>{i[0] + i.slice(1).toLowerCase()}</option>)}
            </select>
          </Field>
          <Field label="Assigned Executive">
            <select className={selectCls} value={f.assignedToId} onChange={(e) => set("assignedToId", e.target.value)}>
              <option value="">Unassigned</option>
              {(users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        </div>
        {editing ? (
          <Field label="Stage">
            <select className={selectCls} value={f.stage} onChange={(e) => set("stage", e.target.value)}>
              {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Branch">
            <select className={selectCls} value={f.branchId} onChange={(e) => set("branchId", e.target.value)}>
              <option value="">My branch</option>
              {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        )}
      </div>
    </Drawer>
  );
}

// ── Customer ────────────────────────────────────────────────────────────────
export function CustomerFormDrawer({ open, onClose, customer }: { open: boolean; onClose: () => void; customer?: CustomerProfile | null }) {
  const editing = !!customer;
  const { data: branches } = useBranches();
  const create = useCreateCustomer();
  const update = useUpdateCustomer(customer?.id ?? "");
  const busy = create.isPending || update.isPending;
  const [f, setF] = useState(() => ({
    name: customer?.name ?? "", phone: customer?.phone ?? "", email: customer?.email ?? "",
    district: customer?.district ?? "", division: customer?.division ?? "", addressLine: customer?.addressLine ?? "",
    rating: customer?.rating ?? "", nid: customer?.nid ?? "", passportNo: customer?.passportNo ?? "", branchId: "",
  }));
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const submit = async () => {
    const body = { name: f.name, phone: f.phone, email: f.email || undefined, district: f.district || undefined, division: f.division || undefined, addressLine: f.addressLine || undefined, rating: f.rating || undefined, nid: f.nid || undefined, passportNo: f.passportNo || undefined };
    try {
      if (editing) await update.mutateAsync(body);
      else await create.mutateAsync({ ...body, branchId: f.branchId || undefined });
      onClose();
    } catch { /* toast handled by hook */ }
  };
  return (
    <Drawer open={open} onClose={onClose} title={editing ? "Edit Customer" : "New Customer"} subtitle="Individual customer record"
      footer={<><Cancel onClose={onClose} /><PrimaryBtn onClick={submit} disabled={busy || !f.name || !f.phone}>{busy && <Loader2 size={13} className="animate-spin" />} {editing ? "Save" : "Create Customer"}</PrimaryBtn></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" required><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Phone" required><input className={inputCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        </div>
        <Field label="Email"><input className={inputCls} value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="District"><input className={inputCls} value={f.district} onChange={(e) => set("district", e.target.value)} /></Field>
          <Field label="Division"><input className={inputCls} value={f.division} onChange={(e) => set("division", e.target.value)} /></Field>
        </div>
        <Field label="Address"><input className={inputCls} value={f.addressLine} onChange={(e) => set("addressLine", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="NID"><input className={inputCls} value={f.nid} onChange={(e) => set("nid", e.target.value)} /></Field>
          <Field label="Passport No."><input className={inputCls} value={f.passportNo} onChange={(e) => set("passportNo", e.target.value)} /></Field>
        </div>
        {!editing && (
          <Field label="Branch">
            <select className={selectCls} value={f.branchId} onChange={(e) => set("branchId", e.target.value)}>
              <option value="">My branch</option>
              {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        )}
      </div>
    </Drawer>
  );
}

// ── Corporate ────────────────────────────────────────────────────────────────
export function CorporateFormDrawer({ open, onClose, corp }: { open: boolean; onClose: () => void; corp?: CorporateProfile | null }) {
  const editing = !!corp;
  const { data: branches } = useBranches();
  const create = useCreateCorporate();
  const update = useUpdateCorporate(corp?.id ?? "");
  const busy = create.isPending || update.isPending;
  const [f, setF] = useState(() => ({
    companyName: corp?.companyName ?? "", contactPerson: corp?.contactPerson ?? "", tradeLicense: corp?.tradeLicense ?? "", tin: corp?.tin ?? "", address: corp?.address ?? "",
    name: corp?.name ?? "", phone: corp?.phone ?? "", email: corp?.email ?? "", branchId: "",
  }));
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const submit = async () => {
    const body = { companyName: f.companyName, contactPerson: f.contactPerson || undefined, tradeLicense: f.tradeLicense || undefined, tin: f.tin || undefined, address: f.address || undefined, name: f.name, phone: f.phone, email: f.email || undefined };
    try {
      if (editing) await update.mutateAsync(body);
      else await create.mutateAsync({ ...body, branchId: f.branchId || undefined });
      onClose();
    } catch { /* toast handled by hook */ }
  };
  return (
    <Drawer open={open} onClose={onClose} title={editing ? "Edit Corporate Client" : "New Corporate Client"} subtitle="Company & primary contact"
      footer={<><Cancel onClose={onClose} /><PrimaryBtn onClick={submit} disabled={busy || !f.companyName || !f.name || !f.phone}>{busy && <Loader2 size={13} className="animate-spin" />} {editing ? "Save" : "Create"}</PrimaryBtn></>}>
      <div className="flex flex-col gap-4">
        <Field label="Company Name" required><input className={inputCls} value={f.companyName} onChange={(e) => set("companyName", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact Person"><input className={inputCls} value={f.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} /></Field>
          <Field label="Trade License"><input className={inputCls} value={f.tradeLicense} onChange={(e) => set("tradeLicense", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="TIN"><input className={inputCls} value={f.tin} onChange={(e) => set("tin", e.target.value)} /></Field>
          <Field label="Address"><input className={inputCls} value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
        </div>
        <div className="border-t border-[#F3F4F6] pt-3 text-[10px] font-black text-[#9CA3AF] uppercase tracking-wide">Primary Contact</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact Name" required><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Phone" required><input className={inputCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        </div>
        <Field label="Email"><input className={inputCls} value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
        {!editing && (
          <Field label="Branch">
            <select className={selectCls} value={f.branchId} onChange={(e) => set("branchId", e.target.value)}>
              <option value="">My branch</option>
              {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        )}
      </div>
    </Drawer>
  );
}
