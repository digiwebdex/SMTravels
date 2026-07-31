import React, { useState } from "react";
import {
  ChevronLeft, Printer, Share2, Edit3, Download, MoreHorizontal,
  User, Phone, Mail, MapPin, Calendar, Clock, CheckCircle2, XCircle,
  AlertCircle, FileText, Camera, Upload, Eye, Globe, Star, Plane,
  Hotel, Briefcase, Map, RefreshCw, Wallet, Receipt, Activity,
  ChevronDown, ChevronRight, ExternalLink, Copy, Shield, Scan,
  PauseCircle, BarChart3, CreditCard, Banknote, Building2, MessageSquare, Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, fmtPrice } from "../../lib/utils";
import { Booking, ServiceType, SERVICE_CFG, STATUS_CFG, ServiceBadge, StatusBadge } from "./BookingsModule";
import { useSetVisaWindow } from "../../hooks/bookings";
import { useCreateInvoiceFromBooking, useRecordPayment } from "../../hooks/finance";
import { toast } from "sonner";
import { Drawer, Field, inputCls, selectCls, PrimaryBtn } from "../crm/ui";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DetailProps {
  booking: Booking;
  onBack: () => void;
  onEdit: () => void;
}

type Tab = "overview" | "travelers" | "documents" | "payments" | "activity";

// ─── Shared ────────────────────────────────────────────────────────────────────
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white border border-[#E5E7EB] rounded-[14px]", className)}>{children}</div>;
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F3F4F6]">
      <span className="text-[12px] font-black text-[#374151] uppercase tracking-wide">{title}</span>
      {action}
    </div>
  );
}

function KV({ label, value, mono, className }: { label: string; value: React.ReactNode; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">{label}</div>
      <div className={cn("text-[13px] font-semibold text-[#111827]", mono && "font-mono")} style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}>
        {value || <span className="text-[#D1D5DB]">—</span>}
      </div>
    </div>
  );
}

// ─── Booking status timeline ───────────────────────────────────────────────────
const STATUS_FLOW: Record<string, BookingStatus[]> = {
  "Hajj":       ["Pending", "Processing", "Confirmed", "Completed"],
  "Umrah":      ["Pending", "Processing", "Confirmed", "Completed"],
  "Visa":       ["Pending", "Processing", "Confirmed", "Completed"],
  "Air Ticket": ["Pending", "Confirmed", "Completed"],
  "Hotel":      ["Pending", "Confirmed", "Completed"],
  "Manpower":   ["Pending", "Processing", "Confirmed", "Completed"],
  "Tour":       ["Pending", "Confirmed", "Completed"],
};

type BookingStatus = "Pending" | "Processing" | "Confirmed" | "Cancelled" | "On Hold" | "Completed";

function StatusTimeline({ booking }: { booking: Booking }) {
  const flow = STATUS_FLOW[booking.service] || STATUS_FLOW["Umrah"];
  const currentIdx = booking.status === "Cancelled" || booking.status === "On Hold"
    ? -1
    : flow.indexOf(booking.status as BookingStatus);

  if (booking.status === "Cancelled") {
    return (
      <div className="flex items-center gap-3 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px]">
        <XCircle size={18} className="text-[#DC2626] flex-shrink-0" />
        <div>
          <div className="text-[13px] font-bold text-[#991B1B]">Booking Cancelled</div>
          <div className="text-[11px] text-[#DC2626]">This booking has been cancelled. No charges apply (within cancellation policy).</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {flow.map((status, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const isLast = i === flow.length - 1;
        return (
          <React.Fragment key={status}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                done ? "bg-[#0E7C66] border-[#0E7C66]" : active ? "bg-[#1B75BC] border-[#1B75BC]" : "bg-white border-[#E5E7EB]"
              )}>
                {done && !active ? <CheckCircle2 size={14} className="text-white" /> : (
                  <span className="text-[10px] font-black" style={{ color: done || active ? "white" : "#9CA3AF" }}>{i + 1}</span>
                )}
              </div>
              <div className={cn("text-[10px] font-bold text-center whitespace-nowrap",
                active ? "text-[#1B75BC]" : done ? "text-[#0E7C66]" : "text-[#9CA3AF]"
              )}>{status}</div>
            </div>
            {!isLast && (
              <div className="flex-1 h-0.5 mb-5 mx-1" style={{ backgroundColor: i < currentIdx ? "#0E7C66" : "#E5E7EB" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Visa processing tracker ───────────────────────────────────────────────────
function VisaTracker({ details }: { details: Record<string, string | number | boolean | string[]> }) {
  const visaStages = [
    { label: "Documents Received",  done: true  },
    { label: "Checklist Verified",  done: true  },
    { label: "Submitted to Embassy",done: details["Status"] !== "Pending Submission" },
    { label: "Under Review",        done: details["Status"] === "Under Review" || details["Status"] === "Decision" || details["Status"] === "Issued" },
    { label: "Decision",            done: details["Status"] === "Decision" || details["Status"] === "Issued" },
    { label: "Visa Issued",         done: details["Status"] === "Issued" },
  ];
  const currentStep = visaStages.filter(s => s.done).length - 1;

  return (
    <Card>
      <SectionHeader title="Visa Processing Status" />
      <div className="p-5">
        <div className="flex flex-col gap-3">
          {visaStages.map((s, i) => (
            <div key={s.label} className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  s.done ? "bg-[#0E7C66] border-[#0E7C66]" : i === currentStep + 1 ? "bg-[#1B75BC] border-[#1B75BC] animate-pulse" : "bg-white border-[#E5E7EB]"
                )}>
                  {s.done ? <CheckCircle2 size={12} className="text-white" /> : (
                    <span className="text-[8px] font-black" style={{ color: i === currentStep + 1 ? "white" : "#9CA3AF" }}>{i + 1}</span>
                  )}
                </div>
                {i < visaStages.length - 1 && (
                  <div className="w-0.5 h-4 mt-0.5" style={{ backgroundColor: s.done ? "#0E7C66" : "#E5E7EB" }} />
                )}
              </div>
              <div className="pb-3">
                <span className={cn("text-[12px] font-semibold", s.done ? "text-[#065F46]" : i === currentStep + 1 ? "text-[#1B75BC]" : "text-[#9CA3AF]")}>
                  {s.label}
                </span>
                {i === currentStep + 1 && <span className="ml-2 text-[9px] bg-[#DBEAFE] text-[#1D4ED8] font-bold px-1.5 py-0.5 rounded-full">In Progress</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#F3F4F6] grid grid-cols-2 gap-3">
          <KV label="Country" value={String(details["Country"] || "—")} />
          <KV label="Visa Type" value={String(details["Visa Type"] || "—")} />
          <KV label="Processing" value={String(details["Processing"] || "—")} />
          <KV label="No. Passports" value={String(details["No. Passports"] || "—")} />
        </div>
      </div>
    </Card>
  );
}

// ─── Manpower stage tracker ────────────────────────────────────────────────────
function ManpowerTracker({ details }: { details: Record<string, string | number | boolean | string[]> }) {
  const stageStr = String(details["Stage"] || "");
  const stages = [
    { label: "Police Clearance", done: stageStr.includes("Police") || stageStr.includes("Medical") || stageStr.includes("BMET") },
    { label: "Medical / GAMCA",  done: stageStr.includes("Medical") || stageStr.includes("BMET") },
    { label: "BMET Registration",done: stageStr.includes("BMET") && !stageStr.includes("pending") },
    { label: "Embassy / Visa",   done: false },
    { label: "Flight Booked",    done: false },
    { label: "Departed",         done: false },
  ];

  return (
    <Card>
      <SectionHeader title="Manpower Processing Stages" />
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {stages.map((s, i) => (
            <div key={s.label} className={cn(
              "flex items-center gap-2 p-3 rounded-[8px] border",
              s.done ? "border-[#6EE7B7] bg-[#ECFDF5]" : "border-[#E5E7EB] bg-[#F7F8FA]"
            )}>
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                s.done ? "bg-[#0E7C66]" : "bg-[#E5E7EB]"
              )}>
                {s.done ? <CheckCircle2 size={11} className="text-white" /> : <span className="text-[8px] font-black text-[#9CA3AF]">{i+1}</span>}
              </div>
              <span className={cn("text-[10px] font-semibold", s.done ? "text-[#065F46]" : "text-[#9CA3AF]")}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <KV label="Employer" value={String(details["Employer"] || "—")} />
          <KV label="Destination" value={String(details["Destination"] || "—")} />
          <KV label="Contract" value={String(details["Contract"] || "—")} />
          <KV label="Salary" value={String(details["Salary"] || "—")} />
        </div>
      </div>
    </Card>
  );
}

// ─── Umrah visa window (post-creation edit + derived "pending" state) ──────────
function UmrahVisaWindow({ booking }: { booking: Booking }) {
  const { t } = useTranslation("erpBookings");
  const sd = booking.serviceDetails;
  const curExpiry = typeof sd["Visa Expiry"] === "string" && sd["Visa Expiry"] !== "Pending" ? (sd["Visa Expiry"] as string) : "";
  const curIssued = typeof sd["Visa Issued"] === "string" ? (sd["Visa Issued"] as string) : "";
  const pending = !curExpiry;
  const [editing, setEditing] = useState(false);
  const [issued, setIssued] = useState(curIssued);
  const [expiry, setExpiry] = useState(curExpiry);
  const save = useSetVisaWindow(booking.id);
  const openEdit = () => { setIssued(curIssued); setExpiry(curExpiry); setEditing(true); };
  const submit = () => save.mutate({ visaIssuedAt: issued || undefined, visaExpiry: expiry || undefined }, { onSuccess: () => setEditing(false) });

  return (
    <Card>
      <SectionHeader title={t("visa.window")} action={
        pending
          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><AlertCircle size={11} /> {t("visa.pending")}</span>
          : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={11} /> {t("visa.issued")}</span>
      } />
      <div className="p-5">
        {!editing ? (
          <div className="flex items-start justify-between gap-4">
            <div className="grid grid-cols-2 gap-4 flex-1">
              <KV label={t("visa.issuedLabel")} value={curIssued || t("visa.notSet")} mono />
              <KV label={t("visa.expiryLabel")} value={curExpiry || t("visa.pending")} mono />
            </div>
            <button onClick={openEdit}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1B75BC] hover:underline flex-shrink-0 cursor-pointer">
              <Edit3 size={12} /> {pending ? t("visa.add") : t("visa.edit")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-[#9CA3AF]">{t("visa.hint")}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">{t("visa.issuedLabel")}</div>
                <input type="date" value={issued} onChange={e => setIssued(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-[8px] outline-none focus:border-[#1B75BC]" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">{t("visa.expiryLabel")}</div>
                <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-[8px] outline-none focus:border-[#1B75BC]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={submit} disabled={save.isPending}
                className="px-4 py-2 bg-[#0E7C66] text-white text-[12px] font-bold rounded-[8px] hover:bg-[#065F46] cursor-pointer disabled:opacity-60">{t("visa.save")}</button>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 border border-[#E5E7EB] text-[#374151] text-[12px] font-medium rounded-[8px] cursor-pointer">{t("visa.cancel")}</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Overview tab ──────────────────────────────────────────────────────────────
function BookingPayDrawer({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const record = useRecordPayment();
  const due = booking.invoiceDue ?? Math.max(0, booking.amount - booking.paid);
  const [amount, setAmount] = useState(String(due > 0 ? due : ""));
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const submit = async () => {
    if (!booking.invoiceId) {
      toast.error("Generate an invoice first");
      return;
    }
    try {
      await record.mutateAsync({
        invoiceId: booking.invoiceId,
        bookingId: booking.id,
        amount: Number(amount),
        method: method as never,
        reference: reference || undefined,
      });
      onClose();
    } catch { /* toast via hook */ }
  };
  return (
    <Drawer
      open
      onClose={onClose}
      title="Record Payment"
      subtitle={booking.invoiceId ? `Invoice linked · due ${fmtPrice(due)}` : "No invoice yet"}
      footer={
        <>
          <button onClick={onClose} className="h-9 px-4 border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151]">Cancel</button>
          <PrimaryBtn onClick={submit} disabled={record.isPending || !(Number(amount) > 0) || !booking.invoiceId}>
            {record.isPending && <Loader2 size={13} className="animate-spin" />} Record Payment
          </PrimaryBtn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Amount" required>
          <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Method" required>
          <select className={selectCls} value={method} onChange={(e) => setMethod(e.target.value)}>
            {["CASH", "BANK_TRANSFER", "BKASH", "NAGAD", "ROCKET", "CHEQUE", "CARD"].map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
            ))}
          </select>
        </Field>
        <Field label="Reference">
          <input className={inputCls} placeholder="Txn / cheque no." value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
      </div>
    </Drawer>
  );
}

function OverviewTab({ booking, onEdit }: { booking: Booking; onEdit: () => void }) {
  const [payOpen, setPayOpen] = useState(false);
  const genInv = useCreateInvoiceFromBooking();
  const due = Math.max(0, booking.amount - booking.paid);
  const paidPct = booking.amount > 0 ? Math.min(100, Math.round((booking.paid / booking.amount) * 100)) : 0;

  const serviceDetails = Object.entries(booking.serviceDetails)
    .filter(([, v]) => v !== "" && v !== undefined)
    // Umrah visa dates get their own editable card below — don't duplicate here.
    .filter(([k]) => !(booking.service === "Umrah" && (k === "Visa Issued" || k === "Visa Expiry")));

  return (
    <div className="flex flex-col gap-4">
      {payOpen && <BookingPayDrawer booking={booking} onClose={() => setPayOpen(false)} />}
      {/* Status timeline */}
      <Card className="p-5">
        <StatusTimeline booking={booking} />
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: booking info */}
        <div className="col-span-2 flex flex-col gap-4">
          <Card>
            <SectionHeader title="Booking Information" />
            <div className="p-5 grid grid-cols-3 gap-4">
              <KV label="Service" value={<ServiceBadge service={booking.service} />} />
              <KV label="Package" value={booking.package} />
              <KV label="Created" value={booking.createdAt} mono />
              <KV label="Departure" value={booking.departure || "—"} mono />
              <KV label="Travelers" value={`${booking.travelers} person(s)`} />
              <KV label="Branch" value={booking.branch} />
              <KV label="Assigned Staff" value={booking.staff} />
              <KV label="Agent" value={booking.agent || "Direct"} />
              <KV label="Status" value={<StatusBadge status={booking.status} />} />
            </div>
          </Card>

          {/* Customer info */}
          <Card>
            <SectionHeader title="Customer / Primary Contact" />
            <div className="p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1B75BC] flex items-center justify-center text-white font-black text-[16px] flex-shrink-0">
                {booking.customer.name[0]}
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <KV label="Full Name" value={booking.customer.name} />
                <KV label="Phone / WhatsApp" value={booking.customer.phone} />
                <KV label="Email" value={booking.customer.email || "—"} />
              </div>
            </div>
          </Card>

          {/* Service-specific details */}
          {serviceDetails.length > 0 && booking.service !== "Visa" && booking.service !== "Manpower" && (
            <Card>
              <SectionHeader title={`${booking.service} Details`} />
              <div className="p-5 grid grid-cols-3 gap-4">
                {serviceDetails.map(([k, v]) => (
                  <KV key={k} label={k} value={String(v)} />
                ))}
              </div>
            </Card>
          )}

          {/* Umrah visa window — editable after creation, shows "pending" until filled */}
          {booking.service === "Umrah" && <UmrahVisaWindow booking={booking} />}

          {/* Visa tracker */}
          {booking.service === "Visa" && <VisaTracker details={booking.serviceDetails} />}

          {/* Manpower tracker */}
          {booking.service === "Manpower" && <ManpowerTracker details={booking.serviceDetails} />}
        </div>

        {/* Right: payment summary + quick actions */}
        <div className="flex flex-col gap-4">
          <Card>
            <SectionHeader title="Payment Summary" />
            <div className="p-5 flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-[#9CA3AF] font-medium">Payment progress</span>
                  <span className="text-[12px] font-black text-[#1B75BC]">{paidPct}%</span>
                </div>
                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${paidPct}%`, backgroundColor: paidPct === 100 ? "#0E7C66" : "#1B75BC" }} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#9CA3AF]">Total Amount</span>
                  <span className="text-[12px] font-black text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(booking.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#9CA3AF]">Paid</span>
                  <span className="text-[12px] font-bold text-[#0E7C66]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(booking.paid)}</span>
                </div>
                {due > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#9CA3AF]">Remaining Due</span>
                    <span className="text-[12px] font-bold text-[#DC2626]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(due)}</span>
                  </div>
                )}
              </div>
              {due > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!booking.invoiceId) {
                      toast.error("Generate an invoice first");
                      return;
                    }
                    setPayOpen(true);
                  }}
                  className="w-full py-2.5 bg-[#0E7C66] text-white text-[12px] font-bold rounded-[8px] hover:bg-[#065F46] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CreditCard size={13} /> Record Payment
                </button>
              )}
            </div>
          </Card>

          {/* Quick actions */}
          <Card>
            <SectionHeader title="Actions" />
            <div className="p-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => genInv.mutate(booking.id)}
                disabled={genInv.isPending || booking.status === "Draft" || booking.status === "Cancelled"}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-[12px] font-medium text-[#374151] hover:bg-[#F7F8FA] transition-colors cursor-pointer text-left disabled:opacity-50"
              >
                {genInv.isPending ? <Loader2 size={14} className="animate-spin text-[#1B75BC]" /> : <Receipt size={14} style={{ color: "#1B75BC" }} />}
                {booking.invoiceId ? "View / Re-issue Invoice" : "Generate Invoice"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!booking.invoiceId) {
                    toast.error("Generate an invoice first");
                    return;
                  }
                  setPayOpen(true);
                }}
                disabled={due <= 0}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-[12px] font-medium text-[#374151] hover:bg-[#F7F8FA] transition-colors cursor-pointer text-left disabled:opacity-50"
              >
                <CreditCard size={14} style={{ color: "#0E7C66" }} /> Record Payment
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-[12px] font-medium text-[#374151] hover:bg-[#F7F8FA] transition-colors cursor-pointer text-left"
              >
                <Edit3 size={14} style={{ color: "#F15A24" }} /> Edit Booking
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Travelers tab ─────────────────────────────────────────────────────────────
function TravelersTab({ booking }: { booking: Booking }) {
  const [expanded, setExpanded] = useState<string | null>("T1");

  if (!booking.travelerList.length) {
    return (
      <Card className="py-16 text-center">
        <User size={32} className="text-[#E5E7EB] mx-auto mb-2" />
        <p className="text-[13px] text-[#9CA3AF]">No traveler details entered yet.</p>
        <button className="mt-3 text-[12px] text-[#1B75BC] font-semibold hover:underline cursor-pointer">+ Add Travelers</button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {booking.travelerList.map((t, i) => (
        <Card key={t.id} className="overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === t.id ? null : t.id)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F7F8FA] transition-colors cursor-pointer text-left">
            <div className="w-10 h-10 rounded-full bg-[#1B75BC] flex items-center justify-center text-white font-black text-[13px] flex-shrink-0">
              {t.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#111827]">{t.name}</span>
                {t.isPrimary && <span className="text-[9px] font-black text-white bg-[#F15A24] px-1.5 py-0.5 rounded-full">PRIMARY</span>}
                {t.gender === "Female" && t.mahram && (
                  <span className="text-[9px] font-bold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Shield size={8} /> Mahram: {t.mahram}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">{t.gender} · {t.nationality} · DOB: {t.dob}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#374151] bg-[#F3F4F6] px-2 py-1 rounded-[5px]">{t.passportNo}</span>
              <ChevronDown size={14} className={cn("text-[#9CA3AF] transition-transform", expanded === t.id && "rotate-180")} />
            </div>
          </button>

          {expanded === t.id && (
            <div className="border-t border-[#F3F4F6] p-5 grid grid-cols-3 gap-4">
              <KV label="Passport Number" value={t.passportNo} mono />
              <KV label="Passport Expiry" value={t.passportExpiry} mono />
              <KV label="Nationality" value={t.nationality} />
              <KV label="Date of Birth" value={t.dob} mono />
              <KV label="Gender" value={t.gender} />
              {t.phone && <KV label="Phone" value={t.phone} />}
              {t.email && <KV label="Email" value={t.email} />}
              {t.mahram && <KV label="Mahram Relationship" value={t.mahram} />}
              <div className="col-span-3 flex gap-2 mt-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] text-[11px] font-medium text-[#374151] rounded-[6px] hover:border-[#1B75BC]/30 cursor-pointer">
                  <Edit3 size={11} /> Edit
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] text-[11px] font-medium text-[#374151] rounded-[6px] hover:border-[#1B75BC]/30 cursor-pointer">
                  <FileText size={11} /> View Docs
                </button>
              </div>
            </div>
          )}
        </Card>
      ))}

      <button className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#E5E7EB] rounded-[12px] text-[12px] font-medium text-[#9CA3AF] hover:border-[#1B75BC]/40 hover:text-[#1B75BC] transition-colors cursor-pointer w-full justify-center">
        + Add another traveler
      </button>
    </div>
  );
}

// ─── Documents tab ─────────────────────────────────────────────────────────────
const DOC_LIST: Record<ServiceType, { name: string; required: boolean; }[]> = {
  "Hajj":  [
    { name: "Passport (all pages)", required: true },
    { name: "NID Copy", required: true },
    { name: "Passport Photo", required: true },
    { name: "Medical Certificate", required: true },
    { name: "Vaccination Card (Meningitis)", required: true },
    { name: "Mahram Certificate", required: false },
  ],
  "Umrah": [
    { name: "Passport Copy", required: true },
    { name: "NID Copy", required: true },
    { name: "Passport Photo", required: true },
    { name: "Vaccination Card", required: true },
  ],
  "Visa":  [
    { name: "Original Passport", required: true },
    { name: "Passport Photo", required: true },
    { name: "NID Copy", required: true },
    { name: "Bank Statement", required: false },
    { name: "Employment / NOC Letter", required: false },
    { name: "Hotel Booking Confirmation", required: false },
  ],
  "Air Ticket": [
    { name: "Passport Copy", required: true },
    { name: "NID / Birth Certificate", required: false },
  ],
  "Hotel": [{ name: "Passport Copy", required: true }, { name: "NID Copy", required: true }],
  "Manpower": [
    { name: "Passport Copy", required: true },
    { name: "NID Copy", required: true },
    { name: "Police Clearance", required: true },
    { name: "Medical / GAMCA Cert.", required: true },
    { name: "BMET Smart Card", required: true },
    { name: "Demand Letter", required: true },
    { name: "Educational Certificate", required: false },
    { name: "Trade Certificate", required: false },
  ],
  "Tour": [
    { name: "Passport Copy", required: true },
    { name: "NID Copy", required: true },
    { name: "Passport Photo", required: true },
    { name: "Travel Insurance", required: false },
  ],
};

const DOC_STATUSES = ["Uploaded", "Verified", "Pending", "Not Required"];
const DOC_STATUS_CFG: Record<string, { color: string; bg: string }> = {
  "Uploaded":    { color: "#1D4ED8", bg: "#DBEAFE" },
  "Verified":    { color: "#065F46", bg: "#D1FAE5" },
  "Pending":     { color: "#92400E", bg: "#FEF3C7" },
  "Not Required":{ color: "#6B7280", bg: "#F3F4F6" },
};

function DocumentsTab({ booking }: { booking: Booking }) {
  const docs = DOC_LIST[booking.service] || [];
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(docs.map((d, i) => [d.name, i < 2 ? "Verified" : i < 3 ? "Uploaded" : d.required ? "Pending" : "Not Required"]))
  );

  const uploaded = Object.values(statuses).filter(s => s === "Uploaded" || s === "Verified").length;
  const total = docs.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <Card className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `conic-gradient(#0E7C66 ${(uploaded/total)*360}deg, #F3F4F6 0)` }}>
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
            <span className="text-[12px] font-black text-[#111827]">{uploaded}/{total}</span>
          </div>
        </div>
        <div>
          <div className="text-[13px] font-bold text-[#111827]">{uploaded} of {total} documents submitted</div>
          <div className="text-[11px] text-[#9CA3AF]">
            {docs.filter(d => d.required && statuses[d.name] === "Pending").length > 0
              ? `${docs.filter(d => d.required && statuses[d.name] === "Pending").length} required documents still missing`
              : "All required documents received"
            }
          </div>
        </div>
        <button className="ml-auto flex items-center gap-1.5 px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-[11px] font-medium text-[#374151] hover:border-[#1B75BC]/30 cursor-pointer">
          <Upload size={12} /> Upload All
        </button>
      </Card>

      {/* Document cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {docs.map(d => {
          const status = statuses[d.name];
          const scfg = DOC_STATUS_CFG[status] || DOC_STATUS_CFG["Pending"];
          const isVerified = status === "Verified";
          const isUploaded = status === "Uploaded";

          return (
            <Card key={d.name} className={cn("overflow-hidden", !d.required && status === "Pending" && "opacity-60")}>
              {/* Doc thumbnail area */}
              <div className={cn("h-24 flex items-center justify-center relative",
                isVerified ? "bg-[#ECFDF5]" : isUploaded ? "bg-[#EFF6FF]" : "bg-[#F7F8FA]"
              )}>
                {isVerified || isUploaded ? (
                  <>
                    <FileText size={32} className={isVerified ? "text-[#6EE7B7]" : "text-[#93C5FD]"} />
                    {isVerified && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#D1FAE5] border border-[#6EE7B7] rounded-full px-2 py-0.5">
                        <Scan size={9} className="text-[#0E7C66]" />
                        <span className="text-[8px] font-bold text-[#065F46]">OCR Verified</span>
                      </div>
                    )}
                  </>
                ) : (
                  <label className="flex flex-col items-center gap-1 cursor-pointer group">
                    <Upload size={20} className="text-[#D1D5DB] group-hover:text-[#1B75BC] transition-colors" />
                    <span className="text-[10px] text-[#9CA3AF] group-hover:text-[#1B75BC] transition-colors">Upload</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={() => setStatuses(s => ({ ...s, [d.name]: "Uploaded" }))} />
                  </label>
                )}
              </div>

              <div className="p-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-[#374151] truncate">{d.name}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: scfg.color, backgroundColor: scfg.bg }}>
                      {status}
                    </span>
                    {d.required && <span className="text-[8px] text-[#DC2626] font-bold">Required</span>}
                  </div>
                </div>
                {(isVerified || isUploaded) && (
                  <div className="flex gap-1">
                    <button className="p-1 text-[#9CA3AF] hover:text-[#1B75BC] cursor-pointer"><Eye size={12} /></button>
                    <button className="p-1 text-[#9CA3AF] hover:text-[#1B75BC] cursor-pointer"><Download size={12} /></button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Payments tab ──────────────────────────────────────────────────────────────
function PaymentsTab({ booking }: { booking: Booking }) {
  const [payOpen, setPayOpen] = useState(false);
  const genInv = useCreateInvoiceFromBooking();
  const pct = booking.amount > 0 ? Math.min(100, Math.round((booking.paid / booking.amount) * 100)) : 0;
  const due = Math.max(0, booking.amount - booking.paid);
  const INST_CFG: Record<string, { color: string; bg: string }> = {
    "Paid":     { color: "#065F46", bg: "#D1FAE5" },
    "Due":      { color: "#92400E", bg: "#FEF3C7" },
    "Overdue":  { color: "#991B1B", bg: "#FEE2E2" },
    "Upcoming": { color: "#6B7280", bg: "#F3F4F6" },
  };
  const openPay = () => {
    if (!booking.invoiceId) {
      toast.error("Generate an invoice first");
      return;
    }
    setPayOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {payOpen && <BookingPayDrawer booking={booking} onClose={() => setPayOpen(false)} />}
      {/* Summary bar */}
      <Card className="p-5">
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <div className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wide mb-1">Total Amount</div>
            <div className="text-[22px] font-black text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(booking.amount)}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wide mb-1">Amount Paid</div>
            <div className="text-[22px] font-black text-[#0E7C66]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(booking.paid)}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wide mb-1">Remaining Due</div>
            <div className="text-[22px] font-black" style={{ fontFamily: "'JetBrains Mono', monospace", color: due <= 0 ? "#0E7C66" : "#DC2626" }}>
              {fmtPrice(due)}
            </div>
          </div>
        </div>
        <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#0E7C66" : "#1B75BC" }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-[#9CA3AF]">{pct}% paid{booking.invoiceId ? ` · invoice ${booking.invoiceStatus}` : ""}</span>
          <button
            type="button"
            onClick={() => genInv.mutate(booking.id)}
            disabled={genInv.isPending}
            className="text-[11px] text-[#1B75BC] font-bold hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            {genInv.isPending ? <Loader2 size={11} className="animate-spin" /> : <Receipt size={11} />}
            {booking.invoiceId ? "Invoice Linked" : "Generate Invoice"}
          </button>
        </div>
      </Card>

      {/* Installments table */}
      {booking.installments.length > 0 ? (
        <Card className="overflow-hidden">
          <SectionHeader title="Payment Schedule"
            action={
              due > 0 ? (
                <button
                  type="button"
                  onClick={openPay}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B75BC] text-white rounded-[7px] text-[11px] font-bold cursor-pointer hover:bg-[#14588F] transition-colors"
                >
                  <CreditCard size={11} /> Record Payment
                </button>
              ) : undefined
            }
          />
          <div className="divide-y divide-[#F3F4F6]">
            {booking.installments.map(inst => {
              const cfg = INST_CFG[inst.status] || INST_CFG["Upcoming"];
              return (
                <div key={inst.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F7F8FA] transition-colors">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}>{inst.id}</div>
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-[#374151]">{inst.label}</div>
                    <div className="text-[10px] text-[#9CA3AF]">Due: {inst.dueDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(inst.amount)}</div>
                    {inst.paidDate && <div className="text-[9px] text-[#9CA3AF]">Paid: {inst.paidDate}</div>}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-20 text-center" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                    {inst.status}
                  </span>
                  {inst.status !== "Paid" && (
                    <button type="button" onClick={openPay} className="text-[11px] text-[#1B75BC] font-semibold hover:underline cursor-pointer whitespace-nowrap">
                      Record
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="py-12 text-center">
          <Wallet size={28} className="text-[#E5E7EB] mx-auto mb-2" />
          <p className="text-[12px] text-[#9CA3AF]">No installments set up.</p>
          {due > 0 && booking.invoiceId && (
            <button
              type="button"
              onClick={openPay}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0E7C66] text-white rounded-[7px] text-[11px] font-bold cursor-pointer"
            >
              <CreditCard size={11} /> Record Payment
            </button>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Activity tab ──────────────────────────────────────────────────────────────
function ActivityTab({ booking }: { booking: Booking }) {
  return (
    <Card>
      <SectionHeader title="Activity Log" action={
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-[7px] text-[11px] font-medium text-[#374151] cursor-pointer hover:border-[#1B75BC]/30">
          <MessageSquare size={11} /> Add Note
        </button>
      } />
      <div className="p-5">
        {booking.activityLog.length > 0 ? (
          <div className="flex flex-col gap-0 relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-[#F3F4F6]" />
            {booking.activityLog.map((entry, i) => (
              <div key={i} className="flex gap-4 pb-5 last:pb-0 relative">
                <div className="w-8 h-8 rounded-full bg-[#EEF2FF] border-2 border-white z-10 flex items-center justify-center flex-shrink-0">
                  <Activity size={13} className="text-[#1B75BC]" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[12px] font-bold text-[#374151]">{entry.actor} </span>
                      <span className="text-[12px] text-[#6B7280]">{entry.action}</span>
                      {entry.note && <p className="text-[11px] text-[#9CA3AF] mt-0.5 italic">{entry.note}</p>}
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{entry.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <Activity size={28} className="text-[#E5E7EB] mx-auto mb-2" />
            <p className="text-[12px] text-[#9CA3AF]">No activity recorded yet.</p>
          </div>
        )}

        {/* Add note inline */}
        <div className="mt-5 pt-5 border-t border-[#F3F4F6]">
          <textarea
            className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[12px] outline-none resize-none focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 placeholder:text-[#D1D5DB]"
            rows={2} placeholder="Add a note or update (e.g. 'Customer called to confirm departure time...')" />
          <div className="flex justify-end mt-2">
            <button className="px-4 py-1.5 bg-[#1B75BC] text-white text-[11px] font-bold rounded-[7px] hover:bg-[#14588F] cursor-pointer transition-colors">
              Save Note
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Booking Detail ────────────────────────────────────────────────────────────
export function BookingDetail({ booking, onBack, onEdit }: DetailProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const cfg = SERVICE_CFG[booking.service];
  const Icon = cfg.icon;

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "overview",   label: "Overview" },
    { key: "travelers",  label: "Travelers", count: booking.travelerList.length },
    { key: "documents",  label: "Documents" },
    { key: "payments",   label: "Payments",  count: booking.installments.length },
    { key: "activity",   label: "Activity",  count: booking.activityLog.length },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Sticky header */}
      <div className="flex-shrink-0 bg-white border-b border-[#E5E7EB] px-5 md:px-7 py-0">
        <div className="flex items-center gap-4 py-4 border-b border-[#F3F4F6]">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-[12px] text-[#9CA3AF] hover:text-[#374151] cursor-pointer transition-colors group">
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Bookings
          </button>
          <div className="h-4 w-px bg-[#E5E7EB]" />

          {/* Booking ID + service badge */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: cfg.light }}>
              <Icon size={17} style={{ color: cfg.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-black text-[#111827]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{booking.ref}</span>
                <StatusBadge status={booking.status} />
                <ServiceBadge service={booking.service} small />
              </div>
              <div className="text-[11px] text-[#9CA3AF]">{booking.package} · {booking.customer.name} · {booking.branch}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 h-8 px-3 border border-[#E5E7EB] rounded-[7px] text-[11px] font-medium text-[#374151] hover:border-[#1B75BC]/30 cursor-pointer transition-colors">
              <Printer size={12} /> Print
            </button>
            <button className="flex items-center gap-1.5 h-8 px-3 border border-[#E5E7EB] rounded-[7px] text-[11px] font-medium text-[#374151] hover:border-[#1B75BC]/30 cursor-pointer transition-colors">
              <Download size={12} /> PDF
            </button>
            <button onClick={onEdit}
              className="flex items-center gap-1.5 h-8 px-3 bg-[#1B75BC] text-white rounded-[7px] text-[11px] font-bold hover:bg-[#14588F] cursor-pointer transition-colors">
              <Edit3 size={12} /> Edit
            </button>
            <button className="h-8 w-8 flex items-center justify-center border border-[#E5E7EB] rounded-[7px] text-[#9CA3AF] hover:text-[#374151] cursor-pointer hover:border-[#1B75BC]/30 transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-[12px] font-medium border-b-2 transition-all cursor-pointer",
                tab === t.key ? "border-[#1B75BC] text-[#1B75BC]" : "border-transparent text-[#6B7280] hover:text-[#374151] hover:border-[#E5E7EB]"
              )}>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full",
                  tab === t.key ? "bg-[#1B75BC] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]")}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-5 md:p-7">
          {tab === "overview"  && <OverviewTab booking={booking} onEdit={onEdit} />}
          {tab === "travelers" && <TravelersTab booking={booking} />}
          {tab === "documents" && <DocumentsTab booking={booking} />}
          {tab === "payments"  && <PaymentsTab booking={booking} />}
          {tab === "activity"  && <ActivityTab booking={booking} />}
        </div>
      </div>
    </div>
  );
}
