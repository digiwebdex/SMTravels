import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Archive, X, PackagePlus } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import { useInquiries, useCreateInquiry, useUpdateInquiry, useArchiveInquiry, useCreatePackage, type InquiryFilters } from "../hooks/customPackage";
import type { InquiryDto } from "@contracts/custom-package.contract";

const STATUSES = ["NEW", "REVIEWING", "PACKAGE_BUILDING", "QUOTED", "APPROVED", "BOOKED", "CANCELLED"];
const CLS: Record<string, string> = { NEW: "bg-slate-100 text-slate-600", REVIEWING: "bg-blue-50 text-blue-700", PACKAGE_BUILDING: "bg-indigo-50 text-indigo-700", QUOTED: "bg-violet-50 text-violet-700", APPROVED: "bg-amber-50 text-amber-700", BOOKED: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-red-50 text-red-700" };
const statusFilterOpts = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const TRAVEL_TYPES = ["", "Hajj", "Umrah", "Visa", "Tour", "Custom"].map((t) => ({ value: t, label: t || "—" }));
const BOOLS = ["visaRequired", "transportRequired", "foodRequired", "ziyaratRequired", "muallimRequired"] as const;
const BOOL_LABELS: Record<string, string> = { visaRequired: "Visa", transportRequired: "Transport", foodRequired: "Food", ziyaratRequired: "Ziyarat", muallimRequired: "Muallim/Guide" };

type Form = { contactName: string; contactPhone: string; contactEmail: string; travelType: string; destination: string; departureDate: string; returnDate: string; adults: string; children: string; infants: string; preferredHotel: string; hotelNights: string; notes: string } & Record<(typeof BOOLS)[number], boolean>;
const empty: Form = { contactName: "", contactPhone: "", contactEmail: "", travelType: "", destination: "", departureDate: "", returnDate: "", adults: "1", children: "0", infants: "0", preferredHotel: "", hotelNights: "", notes: "", visaRequired: false, transportRequired: false, foodRequired: false, ziyaratRequired: false, muallimRequired: false };
const toForm = (i: InquiryDto): Form => ({ contactName: i.contactName, contactPhone: i.contactPhone ?? "", contactEmail: i.contactEmail ?? "", travelType: i.travelType ?? "", destination: i.destination ?? "", departureDate: i.departureDate ?? "", returnDate: i.returnDate ?? "", adults: String(i.adults), children: String(i.children), infants: String(i.infants), preferredHotel: i.preferredHotel ?? "", hotelNights: i.hotelNights != null ? String(i.hotelNights) : "", notes: i.notes ?? "", visaRequired: i.visaRequired, transportRequired: i.transportRequired, foodRequired: i.foodRequired, ziyaratRequired: i.ziyaratRequired, muallimRequired: i.muallimRequired });

/** ERP → Packages → Inquiries (Module 7). Customer package inquiries → build package. */
export function InquiriesModule() {
  const { can } = useAuth();
  const canManage = can("packages", "manage");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filters: InquiryFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, pageSize: 100 }), [q, status]);
  const listQ = useInquiries(filters);
  const createM = useCreateInquiry();
  const updateM = useUpdateInquiry();
  const archiveM = useArchiveInquiry();
  const buildPkg = useCreatePackage();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (i: InquiryDto) => { setEditId(i.id); setForm(toForm(i)); setOpen(true); };
  const save = () => {
    if (!form.contactName.trim()) return;
    const payload: Record<string, unknown> = { contactName: form.contactName.trim(), adults: Number(form.adults) || 0, children: Number(form.children) || 0, infants: Number(form.infants) || 0 };
    for (const k of ["contactPhone", "contactEmail", "travelType", "destination", "departureDate", "returnDate", "preferredHotel", "notes"] as const) if (form[k]) payload[k] = form[k];
    if (form.hotelNights) payload.hotelNights = Number(form.hotelNights);
    for (const b of BOOLS) payload[b] = form[b];
    if (editId) updateM.mutate({ id: editId, input: payload }, { onSuccess: () => setOpen(false) });
    else createM.mutate(payload as { contactName: string }, { onSuccess: () => setOpen(false) });
  };
  const build = (i: InquiryDto) => buildPkg.mutate({ inquiryId: i.id, customerId: i.customerId || undefined, name: `${i.travelType || "Custom"} package — ${i.contactName}`, travelType: i.travelType || undefined });
  const rows = listQ.data?.items ?? [];

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="Package Inquiries" subtitle="Custom package requests → build a package"
        actions={canManage ? <Btn icon={Plus} onClick={openNew}>New inquiry</Btn> : undefined} />
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><div className="[&_input]:pl-9"><TextInput placeholder="Search name / destination / code" value={q} onChange={setQ} /></div></div>
        <div className="w-52"><SelectInput value={status} onChange={setStatus} options={statusFilterOpts} /></div>
      </div>

      <SectionCard noPad>
        {listQ.isError ? <div className="p-4"><ErrorBanner message="Failed to load inquiries." onRetry={() => listQ.refetch()} /></div>
          : listQ.isLoading ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          : rows.length === 0 ? <EmptyState title="No inquiries yet" desc={canManage ? "Log a customer's custom-package request, then build a package from it." : "No inquiries."} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Code</th><th className="px-4 py-3 font-bold">Contact</th><th className="px-4 py-3 font-bold">Type</th>
                  <th className="px-4 py-3 font-bold">Travel</th><th className="px-4 py-3 font-bold">Pax</th><th className="px-4 py-3 font-bold">Status</th>{canManage && <th className="px-4 py-3 text-right font-bold">Actions</th>}
                </tr></thead>
                <tbody>
                  {rows.map((i) => (
                    <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-500">{i.code}</td>
                      <td className="px-4 py-3 font-semibold text-[#002D62]">{i.contactName}{i.contactPhone ? <span className="block text-[11px] font-normal text-slate-400">{i.contactPhone}</span> : null}</td>
                      <td className="px-4 py-3 text-slate-600">{i.travelType || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{i.destination || "—"}{i.departureDate ? <span className="block text-[11px] text-slate-400">{i.departureDate}</span> : null}</td>
                      <td className="px-4 py-3 text-slate-600">{i.adults}+{i.children}+{i.infants}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CLS[i.status] ?? "bg-slate-100 text-slate-600"}`}>{i.status}</span></td>
                      {canManage && <td className="px-4 py-3 text-right whitespace-nowrap">
                        {!i.customPackageId && i.status !== "CANCELLED" && <Btn size="sm" variant="secondary" icon={PackagePlus} loading={buildPkg.isPending} onClick={() => build(i)}>Build package</Btn>}
                        <Btn size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(i)}>Edit</Btn>
                        <Btn size="sm" variant="ghost" icon={Archive} onClick={() => { if (confirm(`Archive ${i.code}?`)) archiveM.mutate(i.id); }}>Archive</Btn>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </SectionCard>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md h-full bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white"><h3 className="font-bold text-[#002D62]">{editId ? "Edit inquiry" : "New inquiry"}</h3><button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
            <div className="p-5 space-y-3">
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Contact name *</label><TextInput value={form.contactName} onChange={(v) => set("contactName", v)} /></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Phone</label><TextInput value={form.contactPhone} onChange={(v) => set("contactPhone", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Email</label><TextInput value={form.contactEmail} onChange={(v) => set("contactEmail", v)} /></div></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Travel type</label><SelectInput value={form.travelType} onChange={(v) => set("travelType", v)} options={TRAVEL_TYPES} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Destination</label><TextInput value={form.destination} onChange={(v) => set("destination", v)} /></div></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Departure</label><TextInput type="date" value={form.departureDate} onChange={(v) => set("departureDate", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Return</label><TextInput type="date" value={form.returnDate} onChange={(v) => set("returnDate", v)} /></div></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Adults</label><TextInput type="number" value={form.adults} onChange={(v) => set("adults", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Children</label><TextInput type="number" value={form.children} onChange={(v) => set("children", v)} /></div><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Infants</label><TextInput type="number" value={form.infants} onChange={(v) => set("infants", v)} /></div></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Preferred hotel</label><TextInput value={form.preferredHotel} onChange={(v) => set("preferredHotel", v)} /></div><div className="w-24"><label className="block text-[11px] font-bold text-slate-500 mb-1">Nights</label><TextInput type="number" value={form.hotelNights} onChange={(v) => set("hotelNights", v)} /></div></div>
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Requirements</label><div className="flex flex-wrap gap-2">{BOOLS.map((b) => <button key={b} type="button" onClick={() => set(b, !form[b])} className={`px-3 py-1.5 rounded-md border text-[12px] font-semibold ${form[b] ? "bg-[#002D62] text-white border-[#002D62]" : "bg-white text-slate-600 border-slate-300"}`}>{BOOL_LABELS[b]}</button>)}</div></div>
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Notes</label><TextInput value={form.notes} onChange={(v) => set("notes", v)} /></div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 sticky bottom-0 bg-white"><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn disabled={!form.contactName.trim()} loading={createM.isPending || updateM.isPending} onClick={save}>{editId ? "Save changes" : "Create"}</Btn></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InquiriesModule;
