import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Btn } from "../../lib/ds";

/** Multi-step wizard chrome with sticky footer actions. */
export function WizardShell({
  title,
  subtitle,
  steps,
  currentStep,
  children,
  onBack,
  onNext,
  onCancel,
  nextLabel = "Continue",
  backLabel = "Back",
  nextDisabled,
  nextLoading,
  className,
}: {
  title: string;
  subtitle?: string;
  steps: string[];
  currentStep: number;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onCancel?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col min-h-[calc(100vh-8rem)]", className)}>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--color-text)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
        <div className="flex flex-wrap gap-2 mt-4">
          {steps.map((s, i) => (
            <span
              key={s}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                i === currentStep
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                  : i < currentStep
                    ? "bg-[var(--color-accent-tint)] text-[var(--color-accent)]"
                    : "bg-[var(--color-bg)] text-[var(--color-text-faint)]",
              )}
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 pb-24">{children}</div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-60 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm shadow-[var(--elevation-2)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {onCancel && <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>}
            {onBack && (
              <Btn variant="secondary" size="sm" icon={ChevronLeft} onClick={onBack}>
                {backLabel}
              </Btn>
            )}
          </div>
          {onNext && (
            <Btn size="sm" iconEnd={ChevronRight} onClick={onNext} disabled={nextDisabled} loading={nextLoading}>
              {nextLabel}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
