import React, { useRef, useState } from "react";
import { Upload, FileText, Check, Pencil } from "lucide-react";
import { cn } from "../../lib/utils";
import { Btn, SectionCard } from "../../lib/ds";

type OcrStep = "upload" | "ocr" | "preview" | "edit" | "save";

/**
 * OCR-in-flow shell — wire to existing OCR upload/apply hooks via callbacks.
 * Does not call APIs itself.
 */
export function OcrInFlow({
  title = "Scan document",
  onUpload,
  onApply,
  previewFields,
  className,
}: {
  title?: string;
  onUpload?: (file: File) => Promise<Record<string, string> | void>;
  onApply?: (fields: Record<string, string>) => void | Promise<void>;
  previewFields?: Record<string, string>;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<OcrStep>("upload");
  const [fields, setFields] = useState<Record<string, string>>(previewFields ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps: OcrStep[] = ["upload", "ocr", "preview", "edit", "save"];

  const handleFile = async (file: File) => {
    setError(null);
    setBusy(true);
    setStep("ocr");
    try {
      const result = await onUpload?.(file);
      if (result) setFields(result);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "OCR failed");
      setStep("upload");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard title={title} className={className} subtitle="Upload → OCR → Preview → Edit → Save">
      <div className="flex flex-wrap gap-1.5 mb-4">
        {steps.map((s) => (
          <span
            key={s}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
              step === s
                ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                : "bg-[var(--color-bg)] text-[var(--color-text-faint)]",
            )}
          >
            {s}
          </span>
        ))}
      </div>

      {step === "upload" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 flex flex-col items-center gap-2 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-tint)]/40 transition-colors"
        >
          <Upload size={22} className="text-[var(--color-primary)]" />
          <p className="text-sm font-semibold text-[var(--color-text)]">Drop passport / NID / visa scan</p>
          <p className="text-xs text-[var(--color-text-faint)]">PDF, JPG, PNG</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </button>
      )}

      {step === "ocr" && (
        <div className="py-10 text-center text-sm text-[var(--color-text-muted)]">
          Reading document…
        </div>
      )}

      {(step === "preview" || step === "edit") && (
        <div className="space-y-3">
          {Object.keys(fields).length === 0 ? (
            <p className="text-xs text-[var(--color-text-faint)] flex items-center gap-2">
              <FileText size={14} /> No fields extracted — enter manually.
            </p>
          ) : (
            Object.entries(fields).map(([k, v]) => (
              <label key={k} className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">{k}</span>
                <input
                  value={v}
                  disabled={step === "preview"}
                  onChange={(e) => setFields((prev) => ({ ...prev, [k]: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] disabled:bg-[var(--color-bg)]"
                />
              </label>
            ))
          )}
          <div className="flex gap-2 justify-end pt-2">
            {step === "preview" && (
              <Btn variant="secondary" size="sm" icon={Pencil} onClick={() => setStep("edit")}>
                Edit
              </Btn>
            )}
            <Btn
              size="sm"
              icon={Check}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onApply?.(fields);
                  setStep("save");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Apply to form
            </Btn>
          </div>
        </div>
      )}

      {step === "save" && (
        <p className="text-sm text-[var(--color-accent)] font-semibold flex items-center gap-2">
          <Check size={16} /> Applied — continue editing the main form.
        </p>
      )}

      {error && <p className="mt-3 text-xs text-[var(--color-danger)]">{error}</p>}
    </SectionCard>
  );
}
