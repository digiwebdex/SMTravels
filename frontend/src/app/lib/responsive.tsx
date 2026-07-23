import React, { useState, useEffect, useRef } from "react";
import { X, SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { cn } from "./utils";

// ─── useBreakpoint ────────────────────────────────────────────────────────────
export function useBreakpoint(bp: number = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < bp : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < bp);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [bp]);
  return isMobile;
}

// ─── MobileDrawer (slide-in from left) ───────────────────────────────────────
export function MobileDrawer({
  open, onClose, children, width = "w-64",
}: {
  open: boolean; onClose: () => void; children: React.ReactNode; width?: string;
}) {
  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={cn("absolute left-0 top-0 h-full z-10 overflow-y-auto", width)}>
        {children}
      </div>
    </div>
  );
}

// ─── MobileBottomNav ──────────────────────────────────────────────────────────
export function MobileBottomNav<T extends string>({
  items, active, onChange,
}: {
  items: { id: T; icon: React.ElementType; label: string; badge?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 md:hidden safe-area-pb">
      <div className="flex items-center justify-around px-1 py-1.5">
        {items.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[52px] relative"
              style={{ minHeight: 44 }}
            >
              <item.icon
                size={22}
                className={isActive ? "text-[#1B75BC]" : "text-slate-400"}
              />
              <span className={cn(
                "text-[10px] font-semibold leading-none",
                isActive ? "text-[#1B75BC]" : "text-slate-400"
              )}>
                {item.label}
              </span>
              {item.badge ? (
                <span className="absolute top-1 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-black">
                  {item.badge}
                </span>
              ) : null}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#1B75BC] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── MobileTopBar ─────────────────────────────────────────────────────────────
export function MobileTopBar({
  title, subtitle, onMenuOpen, rightSlot, logoLabel = "BDH",
}: {
  title: string; subtitle?: string;
  onMenuOpen?: () => void;
  rightSlot?: React.ReactNode;
  logoLabel?: string;
}) {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 md:hidden">
      {onMenuOpen ? (
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 flex-shrink-0"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#1B75BC] flex items-center justify-center text-white text-xs font-black">
            {logoLabel}
          </div>
        </button>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-[#1B75BC] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
          {logoLabel}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>
      {rightSlot && <div className="flex items-center gap-1.5 flex-shrink-0">{rightSlot}</div>}
    </div>
  );
}

// ─── FilterDrawer (slide-up sheet) ───────────────────────────────────────────
export function FilterDrawer({
  open, onClose, title = "Filter & Sort", children,
}: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-slate-500" />
            <p className="font-bold text-slate-800">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-5">{children}</div>
        <div className="px-5 pb-8">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#1B75BC] text-white font-bold rounded-2xl hover:bg-[#14588F] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FilterSection (used inside FilterDrawer) ──────────────────────────────
export function FilterSection({
  label, options, selected, onChange,
}: {
  label: string;
  options: string[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "px-3 py-2 rounded-xl text-sm font-semibold border transition-all",
              selected === opt
                ? "bg-[#1B75BC] text-white border-[#1B75BC]"
                : "bg-white text-slate-600 border-slate-200 hover:border-[#1B75BC]/30"
            )}
            style={{ minHeight: 44 }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ScrollTable (horizontal scroll on mobile) ─────────────────────────────
export function ScrollTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="min-w-[600px] md:min-w-0 px-4 md:px-0">
          {children}
        </div>
      </div>
      {/* Right fade hint on mobile */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none md:hidden" />
    </div>
  );
}

// ─── CardList (mobile alternative to table) ────────────────────────────────
export function CardList<T extends object>({
  items, renderCard,
}: {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-3 md:hidden">
      {items.map((item, i) => (
        <div key={i}>{renderCard(item, i)}</div>
      ))}
    </div>
  );
}

// ─── StepBar (wizard progress) ────────────────────────────────────────────
export function StepBar({
  steps, current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                i < current
                  ? "bg-[#1B75BC] border-[#1B75BC] text-white"
                  : i === current
                  ? "bg-white border-[#1B75BC] text-[#1B75BC]"
                  : "bg-white border-slate-200 text-slate-400"
              )}>
                {i < current ? <Check size={14} /> : i + 1}
              </div>
              <span className={cn(
                "text-[9px] font-semibold whitespace-nowrap",
                i === current ? "text-[#1B75BC]" : "text-slate-400"
              )}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-1 mb-4 rounded-full",
                i < current ? "bg-[#1B75BC]" : "bg-slate-200"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── MobileMenuButton ─────────────────────────────────────────────────────
export function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600"
      aria-label="Open menu"
    >
      <div className="space-y-1.5">
        <span className="block w-5 h-0.5 bg-current rounded-full" />
        <span className="block w-5 h-0.5 bg-current rounded-full" />
        <span className="block w-3.5 h-0.5 bg-current rounded-full" />
      </div>
    </button>
  );
}

// ─── ContextMenu (mobile "more options" bottom sheet) ─────────────────────
export function ContextSheet({
  open, onClose, title, actions,
}: {
  open: boolean; onClose: () => void; title?: string;
  actions: { label: string; icon?: React.ElementType; onClick: () => void; danger?: boolean }[];
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl pb-8">
        {title && (
          <div className="px-5 py-4 border-b border-slate-100 text-center">
            <p className="text-sm font-bold text-slate-700">{title}</p>
          </div>
        )}
        <div className="p-3 space-y-1">
          {actions.map(a => (
            <button
              key={a.label}
              onClick={() => { a.onClick(); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-colors",
                a.danger
                  ? "text-red-500 hover:bg-red-50"
                  : "text-slate-800 hover:bg-slate-100"
              )}
              style={{ minHeight: 44 }}
            >
              {a.icon && <a.icon size={18} className={a.danger ? "text-red-400" : "text-slate-500"} />}
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SectionToggle (collapsible mobile section) ───────────────────────────
export function SectionToggle({
  label, defaultOpen = true, children,
}: {
  label: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full py-2 text-left"
        style={{ minHeight: 44 }}
      >
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
