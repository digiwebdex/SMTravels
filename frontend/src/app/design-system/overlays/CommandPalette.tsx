import React from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, Users, CalendarDays, Receipt, Wallet, Package,
  FolderOpen, Settings, FileEdit, BarChart3, Search,
} from "lucide-react";
import { cn } from "../../lib/utils";

const COMMANDS = [
  { label: "Dashboard", path: "/erp", icon: LayoutDashboard, group: "Navigate" },
  { label: "CRM — Leads", path: "/erp/crm?tab=leads", icon: Users, group: "Navigate" },
  { label: "CRM — Customers", path: "/erp/crm?tab=customers", icon: Users, group: "Navigate" },
  { label: "Bookings", path: "/erp/bookings", icon: CalendarDays, group: "Navigate" },
  { label: "Invoices", path: "/erp/invoices", icon: Receipt, group: "Navigate" },
  { label: "Accounts", path: "/erp/accounts", icon: Wallet, group: "Navigate" },
  { label: "Packages", path: "/erp/packages", icon: Package, group: "Navigate" },
  { label: "Documents / OCR", path: "/erp/documents", icon: FolderOpen, group: "Navigate" },
  { label: "Reports", path: "/erp/reports", icon: BarChart3, group: "Navigate" },
  { label: "CMS", path: "/erp/cms", icon: FileEdit, group: "Navigate" },
  { label: "Settings", path: "/erp/settings", icon: Settings, group: "Navigate" },
  { label: "Design System", path: "/ds", icon: Search, group: "Tools" },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} />
      <Command
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-[var(--radius-xl)]",
          "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--elevation-3)]",
        )}
        label="Command palette"
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4">
          <Search size={16} className="text-[var(--color-text-faint)]" />
          <Command.Input
            placeholder="Search pages, jump anywhere… (⌘K)"
            className="flex-1 py-3.5 text-sm outline-none bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]"
          />
        </div>
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-[var(--color-text-faint)]">
            No matches
          </Command.Empty>
          {["Navigate", "Tools"].map((group) => (
            <Command.Group key={group} heading={group} className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] px-2 py-1.5">
              {COMMANDS.filter((c) => c.group === group).map((c) => {
                const Icon = c.icon;
                return (
                  <Command.Item
                    key={c.path}
                    value={c.label}
                    onSelect={() => {
                      navigate(c.path);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm cursor-pointer aria-selected:bg-[var(--color-primary-tint)] text-[var(--color-text)]"
                  >
                    <Icon size={15} className="text-[var(--color-primary)]" />
                    {c.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
