import React from "react";
import { cn } from "../../lib/utils";
import { PageHeader } from "../../lib/ds";

/** Dense reports canvas: filter bar + full-width content. */
export function ReportsShell({
  title,
  subtitle,
  filters,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {filters && (
        <div className="flex flex-wrap items-end gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--elevation-1)]">
          {filters}
        </div>
      )}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--elevation-1)] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
