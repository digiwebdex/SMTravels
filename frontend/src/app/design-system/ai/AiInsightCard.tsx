import React from "react";
import { Sparkles, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { SectionCard, Spinner } from "../../lib/ds";

/**
 * AI insight slot — collapses automatically when unavailable / error / empty.
 * Frontend-only; pass `available={false}` or error from existing Gemini hooks.
 */
export function AiInsightCard({
  title = "AI Insights",
  children,
  available = true,
  loading = false,
  error,
  collapsedByDefault = false,
  className,
}: {
  title?: string;
  children?: React.ReactNode;
  available?: boolean;
  loading?: boolean;
  error?: string | null;
  collapsedByDefault?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(!collapsedByDefault);

  if (!available) return null;
  if (error && /503|502|quota|unavailable|billing/i.test(error)) return null;

  return (
    <SectionCard
      className={cn("border-[var(--color-secondary)]/20", className)}
      title={title}
      actions={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] p-1"
          aria-expanded={open}
          aria-label={open ? "Collapse AI insights" : "Expand AI insights"}
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      }
      noPad={!open}
    >
      <div className="flex items-start gap-3 px-0">
        <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-secondary-tint)] flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-[var(--color-secondary)]" />
        </div>
        <div className="flex-1 min-w-0 text-sm text-[var(--color-text-muted)]">
          {loading && <Spinner size={18} />}
          {!loading && error && (
            <p className="flex items-center gap-1.5 text-[var(--color-warning)] text-xs">
              <AlertCircle size={12} /> {error}
            </p>
          )}
          {!loading && !error && open && (children ?? (
            <p className="text-xs">Ask AI for a summary of this record.</p>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
