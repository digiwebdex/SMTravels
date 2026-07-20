/**
 * BDH Travels Design System — Canonical Primitives
 * Single source of truth for all shared UI patterns.
 *
 * Brand tokens:
 *   Navy   #0E6BB8  (primary)
 *   Gold   #E8471F  (accent)
 *   Emerald #0E7C66 (success / finance)
 *   BG     #F0F2F5  (ERP background)
 */

import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Minus, AlertCircle, AlertTriangle,
  CheckCircle, XCircle, Clock, FileText, Package, Inbox,
  RefreshCw, WifiOff, ServerCrash, Search, Plus,
} from "lucide-react";
import { cn } from "./utils";

// ─── Brand tokens (use these constants, not raw hex) ─────────────────────────
export const BRAND = {
  navy:    "#0E6BB8",
  navyDk:  "#0B5794",
  gold:    "#E8471F",
  emerald: "#0E7C66",
  erpBg:   "#F0F2F5",
} as const;

// ─── Status catalog ───────────────────────────────────────────────────────────
// Every status used anywhere in the system lives here.
export type StatusKey =
  // Booking / Lead
  | "new" | "contacted" | "follow-up" | "negotiating" | "converted" | "lost"
  | "pending" | "processing" | "confirmed" | "completed" | "cancelled"
  // Invoice / Payment
  | "draft" | "sent" | "paid" | "partial" | "overdue" | "refunded"
  // Document / Task / Service
  | "active" | "inactive" | "uploaded" | "verified" | "rejected"
  | "high" | "medium" | "low"
  // Generic
  | "info" | "warning" | "critical" | "success" | "error";

interface StatusCfg { label: string; bg: string; text: string; border: string; dot: string }

export const STATUS_MAP: Record<StatusKey, StatusCfg> = {
  // Lead lifecycle
  new:         { label: "New",         bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400" },
  contacted:   { label: "Contacted",   bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200",  dot: "bg-purple-400" },
  "follow-up": { label: "Follow-up",   bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400" },
  negotiating: { label: "Negotiating", bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-400" },
  converted:   { label: "Converted",   bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  lost:        { label: "Lost",        bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     dot: "bg-red-400" },
  // Booking lifecycle
  pending:     { label: "Pending",     bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400" },
  processing:  { label: "Processing",  bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400" },
  confirmed:   { label: "Confirmed",   bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  completed:   { label: "Completed",   bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200",    dot: "bg-teal-500" },
  cancelled:   { label: "Cancelled",   bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-400" },
  // Invoice / Payment
  draft:       { label: "Draft",       bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-400" },
  sent:        { label: "Sent",        bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400" },
  paid:        { label: "Paid",        bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  partial:     { label: "Partial",     bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400" },
  overdue:     { label: "Overdue",     bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     dot: "bg-red-500" },
  refunded:    { label: "Refunded",    bg: "bg-slate-100",  text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-500" },
  // Document / service
  active:      { label: "Active",      bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  inactive:    { label: "Inactive",    bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-400" },
  uploaded:    { label: "Uploaded",    bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400" },
  verified:    { label: "Verified",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  rejected:    { label: "Rejected",    bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     dot: "bg-red-500" },
  // Priority
  high:        { label: "High",        bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     dot: "bg-red-500" },
  medium:      { label: "Medium",      bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400" },
  low:         { label: "Low",         bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-400" },
  // Generic system
  info:        { label: "Info",        bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400" },
  warning:     { label: "Warning",     bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400" },
  critical:    { label: "Critical",    bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     dot: "bg-red-500" },
  success:     { label: "Success",     bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  error:       { label: "Error",       bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     dot: "bg-red-500" },
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({
  status, label, showDot = false, size = "sm",
}: {
  status: StatusKey;
  label?: string;
  showDot?: boolean;
  size?: "xs" | "sm" | "md";
}) {
  const cfg = STATUS_MAP[status];
  const text = label ?? cfg.label;
  const sizeCls = size === "xs"
    ? "px-1.5 py-px text-[9px]"
    : size === "md"
    ? "px-3 py-1 text-xs"
    : "px-2 py-0.5 text-[11px]";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold border",
      sizeCls, cfg.bg, cfg.text, cfg.border
    )}>
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />}
      {text}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type BtnSize    = "xs" | "sm" | "md" | "lg";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary:   "bg-[#0E6BB8] text-white hover:bg-[#0B5794] border-transparent shadow-sm",
  secondary: "bg-white text-slate-700 border-slate-200 hover:border-[#0E6BB8]/30 hover:bg-slate-50",
  ghost:     "bg-transparent text-slate-600 border-transparent hover:bg-slate-100",
  danger:    "bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm",
  gold:      "bg-[#E8471F] text-white hover:bg-[#CC3C17] border-transparent shadow-sm",
};

const BTN_SIZE: Record<BtnSize, string> = {
  xs: "px-2.5 py-1.5 text-[11px] rounded-lg gap-1",
  sm: "px-3 py-2 text-xs rounded-xl gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-5 py-3 text-sm rounded-2xl gap-2",
};

export function Btn({
  variant = "primary", size = "md", loading = false, disabled = false,
  icon: Icon, iconEnd: IconEnd, children, className, onClick, type = "button",
}: {
  variant?: BtnVariant; size?: BtnSize;
  loading?: boolean; disabled?: boolean;
  icon?: React.ElementType; iconEnd?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}) {
  const iconSz = size === "xs" ? 12 : size === "sm" ? 13 : 14;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold border transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        BTN_VARIANT[variant], BTN_SIZE[size], className
      )}
      style={{ minHeight: size === "xs" ? 32 : size === "sm" ? 36 : size === "lg" ? 48 : 40 }}
    >
      {loading ? (
        <RefreshCw size={iconSz} className="animate-spin" />
      ) : Icon ? (
        <Icon size={iconSz} />
      ) : null}
      {children}
      {!loading && IconEnd && <IconEnd size={iconSz} />}
    </button>
  );
}

// ─── KpiTile (canonical metric card) ─────────────────────────────────────────
export function KpiTile({
  label, value, sub, trend, icon: Icon, accent = BRAND.navy, loading = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;        // positive = up, negative = down, 0/undefined = flat
  icon: React.ElementType;
  accent?: string;
  loading?: boolean;
}) {
  if (loading) return <SkeletonKpi />;
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendCls  = trend === undefined || trend === 0
    ? "text-slate-400"
    : trend > 0 ? "text-emerald-600" : "text-red-500";
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accent}18` }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-0.5 text-xs font-semibold", trendCls)}>
            <TrendIcon size={13} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-800 leading-none"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  title, subtitle, actions, badge,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: { label: string; status: StatusKey };
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800">{title}</h1>
            {badge && <StatusBadge status={badge.status} label={badge.label} />}
          </div>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
export function SectionCard({
  title, subtitle, actions, children, className, noPad = false,
}: {
  title?: string; subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 overflow-hidden", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            {title && <p className="font-bold text-slate-800 text-sm">{title}</p>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
type EmptyVariant = "no-data" | "no-results" | "no-connection" | "error" | "coming-soon";

const EMPTY_CFG: Record<EmptyVariant, {
  icon: React.ElementType; title: string; desc: string; color: string; bg: string;
}> = {
  "no-data":       { icon: Inbox,       title: "Nothing here yet",         desc: "Add your first item to get started.",                color: "#0E6BB8", bg: "#EEF2FF" },
  "no-results":    { icon: Search,      title: "No results found",          desc: "Try adjusting your filters or search term.",         color: "#374151", bg: "#F9FAFB" },
  "no-connection": { icon: WifiOff,     title: "Connection lost",           desc: "Check your internet and try again.",                 color: "#DC2626", bg: "#FEF2F2" },
  "error":         { icon: ServerCrash, title: "Something went wrong",      desc: "An unexpected error occurred. Please try again.",    color: "#DC2626", bg: "#FEF2F2" },
  "coming-soon":   { icon: Package,     title: "Coming soon",               desc: "This section is under construction.",                color: "#E8471F", bg: "#FFF9E6" },
};

export function EmptyState({
  variant = "no-data", title, desc, action, actionLabel = "Add item", compact = false,
}: {
  variant?: EmptyVariant;
  title?: string;
  desc?: string;
  action?: () => void;
  actionLabel?: string;
  compact?: boolean;
}) {
  const cfg = EMPTY_CFG[variant];
  const Icon = cfg.icon;
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-10 px-4" : "py-16 px-4"
    )}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: cfg.bg }}>
        <Icon size={24} style={{ color: cfg.color }} />
      </div>
      <p className="text-sm font-bold text-slate-800 mb-1">{title ?? cfg.title}</p>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{desc ?? cfg.desc}</p>
      {action && (
        <button onClick={action}
          className="mt-5 flex items-center gap-1.5 px-4 py-2 bg-[#0E6BB8] text-white text-xs font-bold rounded-xl hover:bg-[#0B5794] transition-colors"
          style={{ minHeight: 40 }}>
          <Plus size={13} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export function ErrorBanner({
  message, onRetry, variant = "error",
}: {
  message: string;
  onRetry?: () => void;
  variant?: "error" | "warning" | "info";
}) {
  const cfg = {
    error:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    icon: XCircle },
    warning: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  icon: AlertTriangle },
    info:    { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   icon: AlertCircle },
  }[variant];
  const Icon = cfg.icon;
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", cfg.bg, cfg.border)}>
      <Icon size={15} className={cfg.text} />
      <p className={cn("text-sm font-medium flex-1", cfg.text)}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={cn("text-xs font-bold underline underline-offset-2", cfg.text)}>
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-slate-200 rounded-lg", className)} />;
}

export function SkeletonKpi() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <Pulse className="w-10 h-10 rounded-lg" />
        <Pulse className="w-12 h-4" />
      </div>
      <div className="space-y-1.5">
        <Pulse className="w-24 h-7" />
        <Pulse className="w-32 h-3" />
      </div>
    </div>
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Pulse className={cn("h-3 rounded", i === 0 ? "w-24" : i === cols - 1 ? "w-10" : "w-full max-w-[120px]")} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Pulse className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Pulse className="w-9 h-9 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Pulse className="h-3 w-32" />
          <Pulse className="h-2.5 w-24" />
        </div>
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Pulse key={i} className={cn("h-2.5 rounded", i === lines - 2 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-6 w-40" />
          <Pulse className="h-3 w-56" />
        </div>
        <Pulse className="h-10 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <Pulse className="h-8 w-56 rounded-lg" />
          <Pulse className="h-8 w-32 rounded-lg" />
        </div>
        <SkeletonTable rows={6} cols={6} />
      </div>
    </div>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────
export function FormField({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error  && <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
      {!error && hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

const inputBase = [
  "w-full px-3 py-2.5 text-sm border rounded-xl bg-white text-slate-800",
  "placeholder:text-slate-300 outline-none transition-all",
  "focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10",
].join(" ");

export function TextInput({
  placeholder, value, onChange, type = "text", error, disabled,
}: {
  placeholder?: string; value?: string;
  onChange?: (v: string) => void;
  type?: string; error?: boolean; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn(inputBase, "border-slate-200", error && "border-red-400 focus:ring-red-400/10")}
    />
  );
}

export function SelectInput({
  value, onChange, options, placeholder, disabled,
}: {
  value?: string; onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <select
      value={value} onChange={e => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn(inputBase, "border-slate-200 cursor-pointer")}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Currency & number formatting (canonical) ─────────────────────────────────
/**
 * formatAmount(amount, currency?, lang?)
 *
 * currency defaults to "BDT"
 * Returns: ৳ 1,20,000  /  SAR 5,000  /  USD 1,234
 */
export function formatAmount(
  amount: number,
  currency: "BDT" | "SAR" | "USD" | "EUR" | "GBP" = "BDT",
  lang: "en" | "bn" = "en",
): string {
  const locale = lang === "bn" ? "bn-BD" : "en-BD";
  const num = Math.abs(amount).toLocaleString(locale);
  const prefix: Record<string, string> = {
    BDT: "৳",
    SAR: "SAR",
    USD: "US$",
    EUR: "€",
    GBP: "£",
  };
  const p = prefix[currency] ?? currency;
  const sign = amount < 0 ? "−" : "";
  return `${sign}${p} ${num}`;
}

/** Compact format: ৳ 12.5L / ৳ 2.3Cr / ৳ 500K */
export function formatAmountShort(amount: number, currency: "BDT" | "SAR" | "USD" = "BDT"): string {
  const p = currency === "BDT" ? "৳" : currency === "SAR" ? "SAR" : "US$";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  if (abs >= 10_000_000) return `${sign}${p} ${(abs / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000)    return `${sign}${p} ${(abs / 100_000).toFixed(1)}L`;
  if (abs >= 1_000)      return `${sign}${p} ${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${p} ${abs}`;
}

// ─── Date formatting ──────────────────────────────────────────────────────────
export function formatDate(
  date: string | Date,
  style: "short" | "medium" | "long" = "medium",
  lang: "en" | "bn" = "en",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = lang === "bn" ? "bn-BD" : "en-GB";
  if (style === "short")  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "2-digit" });
  if (style === "long")   return d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({
  name, src, size = "md", color,
}: {
  name: string; src?: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; color?: string;
}) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const sizeCls = { xs: "w-6 h-6 text-[9px]", sm: "w-8 h-8 text-[11px]", md: "w-9 h-9 text-xs",
                    lg: "w-11 h-11 text-sm", xl: "w-14 h-14 text-base" }[size];
  return src ? (
    <img src={src} alt={name} className={cn("rounded-full object-cover", sizeCls)} />
  ) : (
    <div className={cn("rounded-full flex items-center justify-center font-black text-white flex-shrink-0", sizeCls)}
      style={{ backgroundColor: color ?? BRAND.navy }}>
      {initials}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = BRAND.navy }: { size?: number; color?: string }) {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full border-2 border-slate-200"
        style={{ width: size, height: size, borderTopColor: color }} />
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  return label ? (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  ) : <div className="h-px bg-slate-200" />;
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
export function ProgressBar({
  value, max = 100, color = BRAND.navy, showLabel = false, size = "md",
}: {
  value: number; max?: number; color?: string; showLabel?: boolean; size?: "sm" | "md" | "lg";
}) {
  const pct = Math.min(100, (value / max) * 100);
  const h = { sm: "h-1", md: "h-2", lg: "h-3" }[size];
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex-1 bg-slate-100 rounded-full overflow-hidden", h)}>
        <div className={cn("h-full rounded-full transition-all")} style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {showLabel && <span className="text-xs font-semibold text-slate-500 w-9 text-right">{Math.round(pct)}%</span>}
    </div>
  );
}

// ─── Tag / Chip ───────────────────────────────────────────────────────────────
export function Tag({ label, onRemove, color }: { label: string; onRemove?: () => void; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-600">
      {color && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />}
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 text-slate-400 hover:text-slate-700">
          <XCircle size={11} />
        </button>
      )}
    </span>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

// ─── NotificationDot ─────────────────────────────────────────────────────────
export function NotifBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

// ─── BanglaNumber ────────────────────────────────────────────────────────────
const BN_DIGITS = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
export function toBanglaDigits(n: number | string): string {
  return String(n).replace(/\d/g, d => BN_DIGITS[+d]);
}

// ─── useLoadingState ─────────────────────────────────────────────────────────
export function useLoadingState(delay = 1200) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return loading;
}
