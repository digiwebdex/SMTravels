import { useMemo, useState } from "react";
import { Plus, ArrowLeft, Trash2, X, Send, CheckCircle2, XCircle, RotateCcw, Ticket } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import {
  usePackages, usePackage, useCreatePackage, useUpdatePackage, useTransitionPackage,
  useConvertPackage, useArchivePackage, useAddItem, useRemoveItem, type PackageFilters,
} from "../hooks/customPackage";
import type { CustomPackageDto, CustomPackageDetailDto } from "@contracts/custom-package.contract";

const STATUS_CLS: Record<string, string> = { DRAFT: "bg-slate-100 text-slate-600", QUOTED: "bg-violet-50 text-violet-700", ACCEPTED: "bg-amber-50 text-amber-700", REJECTED: "bg-red-50 text-red-700", EXPIRED: "bg-slate-200 text-slate-500", BOOKED: "bg-emerald-100 text-emerald-800" };
const SERVICE_TYPES = ["HAJJ", "UMRAH", "VISA", "AIR_TICKET", "HOTEL", "TRANSPORT", "FOOD", "ZIYARAT", "MUALLIM", "OTHER"];
const CURRENCIES = ["BDT", "USD", "SAR"];
const money = (v: string) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const filterStatusOpts = [{ value: "", label: "All statuses" }, ...["DRAFT", "QUOTED", "ACCEPTED", "REJECTED", "EXPIRED", "BOOKED"].map((s) => ({ value: s, label: s }))];

export function CustomPackagesModule() {
  const { can } = useAuth();
  const canManage = can("packages", "manage");
  const [selected, setSelected] = useState<string | null>(null);
  if (selected) return <PackageBuilder id={selected} canManage={canManage} onBack={() => setSelected(null)} />;
  return <PackageList canManage={canManage} onOpen={setSelected} />;
}

function PackageList({ canManage, onOpen }: { canManage: boolean; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filters: PackageFilters = useMemo(() => ({ q: q.trim() || undefined, status: status || undefined, pageSize: 100 }), [q, status]);
  const listQ = usePackages(filters);
  const createM = useCreatePackage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const rows = listQ.data?.items ?? [];
  const create = () => { if (!name.trim()) return; createM.mutate({ name: name.trim(), currency: currency as "BDT" | "USD" | "SAR" }, { onSuccess: (d) => { setOpen(false); setName(""); onOpen(d.id); } }); };

  return (
    <div className="p-5 md:p-7 space-y-4">
      <PageHeader title="Custom Packages" subtitle="Build customer-specific packages → quote → booking" actions={canManage ? <Btn icon={Plus} onClick={() => setOpen(true)}>New package</Btn> : undefined} />
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[220px]"><TextInput placeholder="Search name / code" value={q} onChange={setQ} /></div>
        <div className="w-48"><SelectInput value={status} onChange={setStatus} options={filterStatusOpts} /></div>
      </div>
      <SectionCard noPad>
        {listQ.isError ? <div className="p-4"><ErrorBanner message="Failed to load packages." onRetry={() => listQ.refetch()} /></div>
          : listQ.isLoading ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          : rows.length === 0 ? <EmptyState title="No custom packages yet" desc={canManage ? "Create a package, add services, price it, and generate a quote." : "No packages."} />
          : (
            <div className="overflow-x-auto"><table className="w-full text-[13px]">
              <thead><tr className="text-left text-slate-500 border-b border-slate-200"><th className="px-4 py-3 font-bold">Code</th><th className="px-4 py-3 font-bold">Package</th><th className="px-4 py-3 font-bold">Items</th><th className="px-4 py-3 font-bold text-right">Grand total</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3" /></tr></thead>
              <tbody>{rows.map((p: CustomPackageDto) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => onOpen(p.id)}>
                  <td className="px-4 py-3 font-mono text-slate-500">{p.code}</td>
                  <td className="px-4 py-3 font-semibold text-[#002D62]">{p.name}{p.customerName ? <span className="block text-[11px] font-normal text-slate-400">{p.customerName}</span> : null}</td>
                  <td className="px-4 py-3 text-slate-600">{p.itemCount}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{money(p.grandTotal)} {p.currency}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLS[p.status] ?? "bg-slate-100"}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-right"><Btn size="sm" variant="ghost" onClick={() => onOpen(p.id)}>Open</Btn></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
      </SectionCard>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200"><h3 className="font-bold text-[#002D62]">New custom package</h3><button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
            <div className="p-5 space-y-3">
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Package name *</label><TextInput value={name} onChange={setName} /></div>
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Currency</label><SelectInput value={currency} onChange={setCurrency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} /></div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200"><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn disabled={!name.trim()} loading={createM.isPending} onClick={create}>Create</Btn></div>
          </div>
        </div>
      )}
    </div>
  );
}

function PackageBuilder({ id, canManage, onBack }: { id: string; canManage: boolean; onBack: () => void }) {
  const pkgQ = usePackage(id);
  const updateM = useUpdatePackage();
  const transitionM = useTransitionPackage();
  const convertM = useConvertPackage();
  const archiveM = useArchivePackage();
  const addItem = useAddItem();
  const removeItem = useRemoveItem();

  const p = pkgQ.data as CustomPackageDetailDto | undefined;
  const editable = canManage && (p?.status === "DRAFT" || p?.status === "QUOTED");

  const [it, setIt] = useState({ serviceType: "HOTEL", description: "", quantity: "1", unitPrice: "", supplier: "" });
  const addLine = () => {
    if (!(Number(it.quantity) > 0)) return;
    addItem.mutate({ id, input: { serviceType: it.serviceType as "HOTEL", description: it.description.trim() || undefined, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) || 0, supplier: it.supplier.trim() || undefined } }, { onSuccess: () => setIt({ serviceType: "HOTEL", description: "", quantity: "1", unitPrice: "", supplier: "" }) });
  };
  const saveMoney = (field: "markup" | "discount", raw: string) => { const v = Number(raw); if (Number.isFinite(v) && v >= 0 && String(v) !== (p?.[field] ?? "")) updateM.mutate({ id, input: { [field]: v } }); };
  const trans = (status: string, needReason = false) => { let reason: string | undefined; if (needReason) { const r = prompt("Reason?"); if (r === null) return; reason = r || undefined; } transitionM.mutate({ id, input: { status: status as "QUOTED", reason } }); };

  return (
    <div className="p-5 md:p-7 space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back to packages</button>
      {pkgQ.isError ? <ErrorBanner message="Failed to load package." onRetry={() => pkgQ.refetch()} />
        : pkgQ.isLoading || !p ? <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
        : (
          <>
            <PageHeader title={p.name} subtitle={`${p.code} · ${p.currency}${p.customerName ? ` · ${p.customerName}` : ""}`}
              actions={<div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLS[p.status] ?? "bg-slate-100"}`}>{p.status}</span>
                {canManage && p.status === "DRAFT" && <Btn icon={Send} loading={transitionM.isPending} onClick={() => trans("QUOTED")}>Generate quote</Btn>}
                {canManage && p.status === "QUOTED" && <><Btn icon={CheckCircle2} loading={transitionM.isPending} onClick={() => trans("ACCEPTED")}>Accept</Btn><Btn variant="ghost" icon={XCircle} onClick={() => trans("REJECTED", true)}>Reject</Btn><Btn variant="ghost" icon={RotateCcw} onClick={() => trans("DRAFT")}>Revise</Btn></>}
                {canManage && p.status === "ACCEPTED" && <Btn icon={Ticket} loading={convertM.isPending} onClick={() => { if (confirm("Convert this accepted package into a booking?")) convertM.mutate(id); }}>Convert to booking</Btn>}
                {(p.status === "REJECTED" || p.status === "EXPIRED") && canManage && <Btn variant="ghost" icon={RotateCcw} onClick={() => trans("DRAFT")}>Reactivate</Btn>}
              </div>} />

            {p.bookingId && <div className="text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">Booking created from this package (ref {p.bookingId}). Complete it in the Bookings module.</div>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tile label="Subtotal" value={`${money(p.subtotal)} ${p.currency}`} />
              <EditTile label="Markup" value={p.markup} suffix={p.currency} editable={editable} onSave={(v) => saveMoney("markup", v)} />
              <EditTile label="Discount" value={p.discount} suffix={p.currency} editable={editable} onSave={(v) => saveMoney("discount", v)} />
              <Tile label="Grand total" value={`${money(p.grandTotal)} ${p.currency}`} accent />
            </div>

            <SectionCard title="Services" subtitle={editable ? "Add/remove items — totals recalc server-side." : "Locked once accepted/booked."} noPad>
              {editable && (
                <div className="flex flex-wrap items-end gap-2 p-4 border-b border-slate-100">
                  <div className="w-36"><label className="block text-[11px] font-bold text-slate-500 mb-1">Service</label><SelectInput value={it.serviceType} onChange={(v) => setIt((s) => ({ ...s, serviceType: v }))} options={SERVICE_TYPES.map((t) => ({ value: t, label: t }))} /></div>
                  <div className="flex-1 min-w-[140px]"><label className="block text-[11px] font-bold text-slate-500 mb-1">Description</label><TextInput value={it.description} onChange={(v) => setIt((s) => ({ ...s, description: v }))} /></div>
                  <div className="w-20"><label className="block text-[11px] font-bold text-slate-500 mb-1">Qty</label><TextInput type="number" value={it.quantity} onChange={(v) => setIt((s) => ({ ...s, quantity: v }))} /></div>
                  <div className="w-28"><label className="block text-[11px] font-bold text-slate-500 mb-1">Unit price</label><TextInput type="number" value={it.unitPrice} onChange={(v) => setIt((s) => ({ ...s, unitPrice: v }))} /></div>
                  <div className="w-32"><label className="block text-[11px] font-bold text-slate-500 mb-1">Supplier</label><TextInput value={it.supplier} onChange={(v) => setIt((s) => ({ ...s, supplier: v }))} /></div>
                  <Btn icon={Plus} loading={addItem.isPending} onClick={addLine}>Add</Btn>
                </div>
              )}
              {p.items.length === 0 ? <EmptyState title="No services yet" desc={editable ? "Add hotel, flight, visa, transport, food, ziyarat, muallim or custom services." : "No items."} />
                : (
                  <div className="overflow-x-auto"><table className="w-full text-[13px]">
                    <thead><tr className="text-left text-slate-500 border-b border-slate-200"><th className="px-4 py-2 font-bold">Service</th><th className="px-4 py-2 font-bold">Description</th><th className="px-4 py-2 font-bold text-right">Qty</th><th className="px-4 py-2 font-bold text-right">Unit</th><th className="px-4 py-2 font-bold text-right">Subtotal</th><th className="px-4 py-2 font-bold">Supplier</th>{editable && <th className="px-4 py-2" />}</tr></thead>
                    <tbody>{p.items.map((line) => (
                      <tr key={line.id} className="border-b border-slate-100">
                        <td className="px-4 py-2 font-semibold text-[#002D62]">{line.serviceType}</td>
                        <td className="px-4 py-2 text-slate-600">{line.description || "—"}</td>
                        <td className="px-4 py-2 text-right">{line.quantity}</td>
                        <td className="px-4 py-2 text-right font-mono">{money(line.unitPrice)}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold">{money(line.subtotal)} {line.currency}</td>
                        <td className="px-4 py-2 text-slate-500">{line.supplier || "—"}</td>
                        {editable && <td className="px-4 py-2 text-right"><Btn size="sm" variant="ghost" icon={Trash2} loading={removeItem.isPending} onClick={() => removeItem.mutate(line.id)}>Remove</Btn></td>}
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
            </SectionCard>
          </>
        )}
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className={`rounded-xl border px-4 py-3 ${accent ? "border-[#1B75BC] bg-[#EAF5FF]" : "border-slate-200 bg-white"}`}><div className="text-[11px] font-bold text-slate-400 uppercase">{label}</div><div className="text-lg font-bold text-[#002D62]">{value}</div></div>;
}
function EditTile({ label, value, suffix, editable, onSave }: { label: string; value: string; suffix: string; editable: boolean; onSave: (v: string) => void }) {
  return <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><div className="text-[11px] font-bold text-slate-400 uppercase">{label}</div>{editable ? <input type="number" min={0} defaultValue={value} onBlur={(e) => onSave(e.target.value)} className="w-full text-lg font-bold text-[#002D62] outline-none border-b border-transparent focus:border-[#1B75BC]" /> : <div className="text-lg font-bold text-[#002D62]">{Number(value).toLocaleString()} {suffix}</div>}</div>;
}

export default CustomPackagesModule;
