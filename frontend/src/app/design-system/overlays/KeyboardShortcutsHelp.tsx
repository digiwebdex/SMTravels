import React from "react";
import { Keyboard, X } from "lucide-react";
import { cn } from "../../lib/utils";

const SHORTCUTS = [
  { keys: "⌘ K", desc: "Open command palette" },
  { keys: "⌘ /", desc: "Show keyboard shortcuts" },
  { keys: "Esc", desc: "Close drawer / dialog" },
  { keys: "G D", desc: "Go to Dashboard" },
  { keys: "G C", desc: "Go to CRM" },
  { keys: "G B", desc: "Go to Bookings" },
];

export function KeyboardShortcutsHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Keyboard shortcuts"
        className="relative w-full max-w-md rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--elevation-3)] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-[var(--color-primary)]" />
            <h2 className="text-sm font-bold text-[var(--color-text)]">Keyboard shortcuts</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
            <X size={16} />
          </button>
        </div>
        <ul className="space-y-2">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{s.desc}</span>
              <kbd className={cn(
                "text-[11px] font-mono px-2 py-1 rounded border border-[var(--color-border)]",
                "bg-[var(--color-bg)] text-[var(--color-text)]",
              )}>{s.keys}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
