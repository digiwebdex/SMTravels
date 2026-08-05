import React, { useState } from "react";
import { Menu, X, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { BrandLogo } from "../../components/BrandLogo";
import { ThemeToggle } from "../navigation/ThemeToggle";

export type PortalNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Shared portal chrome — dark navy sidebar + surface topbar + mobile bottom nav.
 * Drives the 5 role portals (Customer / Agent / Supplier / Staff / Accountant)
 * with a consistent, premium shell while each portal owns its own screens/state.
 */
export function PortalShell({
  title,
  navItems,
  activeId,
  onNav,
  onLogout,
  userName,
  children,
  bottomNav = true,
  headerExtra,
}: {
  title: string;
  navItems: PortalNavItem[];
  activeId: string;
  onNav: (id: string) => void;
  onLogout?: () => void;
  userName?: string;
  children: React.ReactNode;
  bottomNav?: boolean;
  headerExtra?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (userName ?? "")
    .split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "SM";

  const activeItem = navItems.find((n) => n.id === activeId);
  // Bottom nav shows at most 5 items on mobile; rest remain reachable from the sidebar drawer.
  const mobileItems = navItems.slice(0, 5);

  const SidebarInner = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <div className="flex items-center gap-3 h-16 px-5 flex-shrink-0 border-b border-[var(--color-sidebar-border)]">
        <BrandLogo variant="tile" className="w-8 h-8 rounded-[var(--radius-sm)]" />
        <div className="overflow-hidden">
          <div className="text-[var(--color-sidebar-fg)] font-black text-[13px] leading-tight whitespace-nowrap">
            SM Travels
          </div>
          <div className="text-[var(--color-sidebar-muted)] text-[9px] whitespace-nowrap">{title}</div>
        </div>
        <button
          onClick={onItemClick}
          className="ml-auto lg:hidden text-[var(--color-sidebar-muted)] hover:text-[var(--color-sidebar-fg)] cursor-pointer"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 no-scrollbar">
        {navItems.map((item) => {
          const active = item.id === activeId;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { onNav(item.id); onItemClick?.(); }}
              className={cn(
                "w-full flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-all duration-150 cursor-pointer relative",
                active
                  ? "bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-fg)]"
                  : "text-[var(--color-sidebar-muted)] hover:text-[var(--color-sidebar-fg)] hover:bg-[var(--color-sidebar-hover)]",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[var(--color-primary)] rounded-r-full" />
              )}
              <Icon size={17} className="flex-shrink-0" />
              <span className="text-[13px] font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex-shrink-0 border-t border-[var(--color-sidebar-border)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-black">{initials}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-[var(--color-sidebar-fg)] text-[12px] font-semibold truncate">
              {userName ?? "—"}
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              className="text-[var(--color-sidebar-muted)] hover:text-[var(--color-sidebar-fg)] transition-colors cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Mobile drawer backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-200",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Mobile drawer */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-64 z-50 flex flex-col lg:hidden transition-transform duration-200 ease-out select-none",
        "bg-[var(--color-sidebar-mid)] shadow-[var(--elevation-3)]",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <SidebarInner onItemClick={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-60 z-30 flex-col bg-[var(--color-sidebar-mid)] select-none">
        <SidebarInner />
      </aside>

      {/* Topbar */}
      <header className={cn(
        "fixed top-0 right-0 left-0 lg:left-60 h-16 z-20 flex items-center",
        "bg-[var(--color-topbar)] border-b border-[var(--color-border)] shadow-[var(--elevation-1)]",
      )}>
        <div className="flex items-center gap-3 px-4 md:px-6 w-full">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer p-1"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-[var(--color-text)] truncate">
              {activeItem?.label ?? title}
            </h1>
          </div>

          <div className="flex-1" />

          {headerExtra}
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className={cn(
        "pt-16 min-h-screen lg:ml-60",
        bottomNav ? "pb-20 lg:pb-6" : "pb-6",
      )}>
        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      {bottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-30 lg:hidden shadow-[var(--elevation-2)]">
          <div className="flex items-center justify-around px-1 py-1.5">
            {mobileItems.map((item) => {
              const active = item.id === activeId;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNav(item.id)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl relative cursor-pointer"
                  style={{ minHeight: 44, minWidth: 52 }}
                >
                  <Icon size={21} className={active ? "text-[var(--color-primary)]" : "text-[var(--color-text-faint)]"} />
                  <span className={cn(
                    "text-[10px] font-semibold leading-none truncate max-w-[64px]",
                    active ? "text-[var(--color-primary)]" : "text-[var(--color-text-faint)]",
                  )}>
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--color-primary)] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
