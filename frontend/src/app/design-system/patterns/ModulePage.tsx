import React from "react";
import { cn } from "../../lib/utils";
import { PageHeader, SectionCard, Btn, EmptyState, ErrorBanner } from "../../lib/ds";
import type { StatusKey } from "../../lib/ds";

/** Enterprise module page: Title → KPIs → Actions → Filters → Content */
export function ModulePage({
  title,
  subtitle,
  breadcrumb,
  badge,
  primaryAction,
  secondaryActions,
  kpis,
  filters,
  children,
  contextPanel,
  className,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: React.ReactNode;
  badge?: { label: string; status: StatusKey };
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  kpis?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
  contextPanel?: React.ReactNode;
  className?: string;
}) {
  const actions = (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {secondaryActions}
      {primaryAction}
    </div>
  );

  return (
    <div className={cn("space-y-5", className)}>
      <PageHeader title={title} subtitle={subtitle} breadcrumb={breadcrumb} badge={badge} actions={actions} />
      {kpis && <div>{kpis}</div>}
      {filters && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--elevation-1)]">
          {filters}
        </div>
      )}
      <div className={cn(contextPanel ? "grid lg:grid-cols-[1fr_320px] gap-5" : "")}>
        <div className="min-w-0">{children}</div>
        {contextPanel && (
          <aside className="space-y-4 lg:sticky lg:top-4 self-start">{contextPanel}</aside>
        )}
      </div>
    </div>
  );
}

export function ModuleCard({
  title, subtitle, actions, children, noPad, className,
}: {
  title?: string; subtitle?: string; actions?: React.ReactNode;
  children: React.ReactNode; noPad?: boolean; className?: string;
}) {
  return (
    <SectionCard title={title} subtitle={subtitle} actions={actions} noPad={noPad} className={className}>
      {children}
    </SectionCard>
  );
}

export { Btn as PrimaryAction, EmptyState, ErrorBanner };
