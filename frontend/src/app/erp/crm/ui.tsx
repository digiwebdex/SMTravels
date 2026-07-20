import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { STAGE_META } from "../../hooks/crm";
import type { LeadStageDto } from "@contracts/crm.contract";

// Styling mirrors BookingsModule/ErpLayout so CRM looks native to the ERP.
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white border border-[#E5E7EB] rounded-[14px]", className)}>{children}</div>;
}

export function Pill({ label, color, bg, icon: Icon }: { label: string; color: string; bg: string; icon?: React.FC<{ size?: number; className?: string }> }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ color, backgroundColor: bg }}>
      {Icon && <Icon size={9} />}{label}
    </span>
  );
}

export function StageBadge({ stage }: { stage: LeadStageDto }) {
  const m = STAGE_META[stage];
  return <Pill label={m.label} color={m.color} bg={m.bg} />;
}

export function StatCards({ items }: { items: { label: string; value: string; icon: React.FC<{ size?: number; style?: React.CSSProperties }>; color: string; bg: string }[] }) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {items.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
              <Icon size={17} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[18px] font-black text-[#111827] leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
              <div className="text-[10px] text-[#9CA3AF] font-medium">{s.label}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function Pagination({ page, totalPages, total, pageSize, onPage }: { page: number; totalPages: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F4F6]">
      <span className="text-[11px] text-[#9CA3AF]">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#E5E7EB] text-[#374151] disabled:opacity-40 hover:border-[#0E6BB8]/30 transition-colors cursor-pointer">
          <ChevronLeft size={13} />
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button key={i} onClick={() => onPage(i + 1)}
            className={cn("w-8 h-8 flex items-center justify-center rounded-[6px] text-[12px] font-medium border transition-colors cursor-pointer",
              page === i + 1 ? "bg-[#0E6BB8] text-white border-[#0E6BB8]" : "border-[#E5E7EB] text-[#374151] hover:border-[#0E6BB8]/30")}>
            {i + 1}
          </button>
        ))}
        <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#E5E7EB] text-[#374151] disabled:opacity-40 hover:border-[#0E6BB8]/30 transition-colors cursor-pointer">
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// Right-side drawer used for add/edit forms and detail panels.
export function Drawer({ open, onClose, title, subtitle, children, footer, width = "max-w-[520px]" }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={cn("relative bg-white h-full w-full flex flex-col shadow-2xl animate-in slide-in-from-right", width)}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-black text-[#111827]">{title}</h2>
            {subtitle && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#374151] cursor-pointer p-1"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex-shrink-0 border-t border-[#E5E7EB] px-6 py-4 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ── form atoms (match the wizard styling) ─────────────────────────────────────
export const inputCls = "w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#111827] bg-white outline-none transition-all focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10 placeholder:text-[#D1D5DB]";
export const selectCls = `${inputCls} cursor-pointer`;

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">{label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

export function PrimaryBtn({ children, onClick, disabled, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="flex items-center gap-1.5 h-9 px-4 bg-[#0E6BB8] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#0B5794] transition-colors cursor-pointer shadow-lg shadow-[#0E6BB8]/20 disabled:opacity-60">
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-1.5 h-9 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:border-[#0E6BB8]/30 transition-colors cursor-pointer disabled:opacity-50">
      {children}
    </button>
  );
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}
export function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16);
}
