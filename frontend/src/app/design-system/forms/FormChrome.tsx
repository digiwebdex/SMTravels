import React from "react";
import { cn } from "../../lib/utils";
import { Btn } from "../../lib/ds";

/** Sticky bottom save bar for long forms. */
export function StickySaveBar({
  onSave,
  onCancel,
  saving,
  disabled,
  label = "Save",
  dirtyHint,
  className,
}: {
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  disabled?: boolean;
  label?: string;
  dirtyHint?: string;
  className?: string;
}) {
  return (
    <div className={cn(
      "sticky bottom-0 z-20 -mx-1 mt-6 px-4 py-3 border-t border-[var(--color-border)]",
      "bg-[var(--color-surface)]/95 backdrop-blur-sm flex items-center justify-between gap-3 shadow-[var(--elevation-2)] rounded-b-[var(--radius-lg)]",
      className,
    )}>
      <p className="text-xs text-[var(--color-text-faint)]">{dirtyHint ?? "Changes are not saved until you confirm."}</p>
      <div className="flex gap-2">
        {onCancel && <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>}
        <Btn size="sm" onClick={onSave} loading={saving} disabled={disabled}>{label}</Btn>
      </div>
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3 mb-6", className)}>
      <div>
        <h3 className="text-sm font-bold text-[var(--color-text)]">{title}</h3>
        {description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function ErrorSummary({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-red-50 dark:bg-red-950/30 px-4 py-3" role="alert">
      <p className="text-xs font-bold text-[var(--color-danger)] mb-1">Please fix {errors.length} issue{errors.length > 1 ? "s" : ""}</p>
      <ul className="list-disc pl-4 text-xs text-[var(--color-danger)] space-y-0.5">
        {errors.map((e) => <li key={e}>{e}</li>)}
      </ul>
    </div>
  );
}
