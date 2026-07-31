import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../../lib/utils";

// Small shared atoms for the HR module views — styling mirrors erp/crm/ui.tsx
// so HR looks native to the rest of the ERP without cross-importing CRM internals.

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--elevation-1)]", className)}>{children}</div>;
}

export function Pill({ label, color, bg, icon: Icon }: { label: string; color: string; bg: string; icon?: React.FC<{ size?: number; className?: string }> }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ color, backgroundColor: bg }}>
      {Icon && <Icon size={9} />}{label}
    </span>
  );
}

export function StatCards({ items }: { items: { label: string; value: string; icon: React.FC<{ size?: number; style?: React.CSSProperties }>; color: string; bg: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {items.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
              <Icon size={17} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[18px] font-black text-[var(--color-text)] leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
              <div className="text-[10px] text-[var(--color-text-faint)] font-medium">{s.label}</div>
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
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-subtle)]">
      <span className="text-[11px] text-[var(--color-text-faint)]">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] disabled:opacity-40 hover:border-[var(--color-primary)]/30 transition-colors cursor-pointer">
          <ChevronLeft size={13} />
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button type="button" key={i} aria-label={`Page ${i + 1}`} aria-current={page === i + 1 ? "page" : undefined} onClick={() => onPage(i + 1)}
            className={cn("w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[12px] font-medium border transition-colors cursor-pointer",
              page === i + 1 ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30")}>
            {i + 1}
          </button>
        ))}
        <button type="button" aria-label="Next page" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] disabled:opacity-40 hover:border-[var(--color-primary)]/30 transition-colors cursor-pointer">
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

/** Right-side drawer used for add/edit forms and detail panels. */
export function Drawer({ open, onClose, title, subtitle, children, footer, width = "max-w-[520px]" }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className={cn("relative bg-[var(--color-surface)] h-full w-full flex flex-col shadow-[var(--elevation-3)] animate-in slide-in-from-right", width)}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-black text-[var(--color-text)]">{title}</h2>
            {subtitle && <p className="text-[11px] text-[var(--color-text-faint)] mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] cursor-pointer p-1"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex-shrink-0 border-t border-[var(--color-border)] px-6 py-4 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ── form atoms ────────────────────────────────────────────────────────────────
export const inputCls = "w-full px-3 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text)] bg-[var(--color-surface)] outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 placeholder:text-[var(--color-text-faint)]";
export const selectCls = `${inputCls} cursor-pointer`;

let fieldSeq = 0;
export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  const id = React.useId?.() ?? `field-${++fieldSeq}`;
  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id: (children as React.ReactElement<{ id?: string }>).props.id ?? id })
    : children;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wide">{label}{required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}</label>
      {child}
    </div>
  );
}

export function PrimaryBtn({ children, onClick, disabled, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="flex items-center gap-1.5 h-9 px-4 bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-[var(--radius-sm)] text-[12px] font-bold hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer shadow-[var(--elevation-2)] disabled:opacity-60">
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-1.5 h-9 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[12px] font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 transition-colors cursor-pointer disabled:opacity-50">
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

export function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { color: "#6B7280", bg: "#F3F4F6" };
  return <Pill label={status.replace(/_/g, " ")} color={cfg.color} bg={cfg.bg} />;
}
const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  DRAFT: { color: "#6B7280", bg: "#F3F4F6" },
  OFFERED: { color: "#7C3AED", bg: "#F5F3FF" },
  JOINED: { color: "#1D4ED8", bg: "#DBEAFE" },
  PROBATION: { color: "#92400E", bg: "#FEF3C7" },
  CONFIRMED: { color: "#065F46", bg: "#D1FAE5" },
  TRANSFERRED: { color: "#0E7490", bg: "#CFFAFE" },
  RESIGNED: { color: "#991B1B", bg: "#FEE2E2" },
  TERMINATED: { color: "#991B1B", bg: "#FEE2E2" },
  ARCHIVED: { color: "#6B7280", bg: "#F3F4F6" },
  SUBMITTED: { color: "#1D4ED8", bg: "#DBEAFE" },
  MANAGER_APPROVED: { color: "#0E7490", bg: "#CFFAFE" },
  HR_APPROVED: { color: "#065F46", bg: "#D1FAE5" },
  REJECTED: { color: "#991B1B", bg: "#FEE2E2" },
  CANCELLED: { color: "#6B7280", bg: "#F3F4F6" },
  PRESENT: { color: "#065F46", bg: "#D1FAE5" },
  LATE: { color: "#92400E", bg: "#FEF3C7" },
  EARLY_LEAVE: { color: "#92400E", bg: "#FEF3C7" },
  ABSENT: { color: "#991B1B", bg: "#FEE2E2" },
  HALF_DAY: { color: "#92400E", bg: "#FEF3C7" },
  ON_LEAVE: { color: "#7C3AED", bg: "#F5F3FF" },
  HOLIDAY: { color: "#0E7490", bg: "#CFFAFE" },
};
