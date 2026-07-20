import React, { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router";
import {
  LayoutDashboard, Users, CalendarDays, Package, Layers, Wallet,
  Receipt, BarChart3, FileEdit, Settings2, Settings, ChevronLeft,
  ChevronRight, Bell, Search, ChevronDown, Globe, LogOut, UserCircle,
  HelpCircle, Building2, X, Menu, Briefcase, Star, TrendingUp,
  AlertTriangle, RefreshCw, FolderOpen, MessageSquare, LineChart,
} from "lucide-react";
import { cn } from "../lib/utils";
import { MobileDrawer } from "../lib/responsive";

// ─── Mobile bottom nav items ──────────────────────────────────────────────────
const MOBILE_NAV = [
  { icon: LayoutDashboard, label: "Home",     path: "/erp",          exact: true },
  { icon: CalendarDays,    label: "Bookings", path: "/erp/bookings"              },
  { icon: Users,           label: "CRM",      path: "/erp/crm"                   },
  { icon: Receipt,         label: "Invoices", path: "/erp/invoices"              },
  { icon: Settings,        label: "Settings", path: "/erp/settings"              },
];

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",       path: "/erp",          exact: true },
      { icon: Users,           label: "CRM & Leads",     path: "/erp/crm" },
      { icon: CalendarDays,    label: "Bookings",         path: "/erp/bookings" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: Package,         label: "Packages",         path: "/erp/packages" },
      { icon: Layers,          label: "Services",         path: "/erp/services" },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: Wallet,          label: "Accounts",         path: "/erp/accounts" },
      { icon: Receipt,         label: "Invoices & Payments", path: "/erp/invoices" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { icon: BarChart3,       label: "Reports & Analytics", path: "/erp/reports" },
      { icon: LineChart,       label: "Reports & BI",         path: "/erp/reports-bi" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { icon: FolderOpen,     label: "Documents",            path: "/erp/documents" },
      { icon: MessageSquare,  label: "Communications",        path: "/erp/communications" },
    ],
  },
  {
    label: "Content & System",
    items: [
      { icon: FileEdit,        label: "CMS",              path: "/erp/cms" },
      { icon: Settings2,       label: "Operations",       path: "/erp/ops" },
      { icon: Settings,        label: "Settings",         path: "/erp/settings" },
    ],
  },
];

const BRANCHES = ["All Branches", "Dhaka HQ (Main)", "Chittagong", "Sylhet", "Khulna", "Rajshahi"];

const NOTIFICATIONS = [
  { id: 1, type: "booking", msg: "New booking #BK-2847 needs confirmation", time: "2m", unread: true },
  { id: 2, type: "payment", msg: "Payment received ৳1,20,000 — INV-0391", time: "15m", unread: true },
  { id: 3, type: "alert",   msg: "3 visa applications expiring in 48h", time: "1h", unread: true },
  { id: 4, type: "lead",    msg: "High-value lead assigned: MD Group (Hajj ×24)", time: "2h", unread: false },
  { id: 5, type: "system",  msg: "Scheduled report generated: Q3 2025", time: "3h", unread: false },
];

const typeIcon: Record<string, { icon: React.FC<{ size?: number; className?: string }>, color: string, bg: string }> = {
  booking: { icon: CalendarDays, color: "#0E6BB8", bg: "#EEF2FF" },
  payment: { icon: Wallet,        color: "#0E7C66", bg: "#ECFDF5" },
  alert:   { icon: AlertTriangle, color: "#DC2626", bg: "#FEF2F2" },
  lead:    { icon: TrendingUp,    color: "#E8471F", bg: "#FFF9E6" },
  system:  { icon: Settings,      color: "#6B7280", bg: "#F3F4F6" },
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, onMobileClose }: {
  collapsed: boolean; onToggle: () => void; onMobileClose?: () => void;
}) {
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside className={cn(
      "fixed top-0 left-0 h-screen z-30 flex flex-col transition-all duration-200 ease-in-out select-none",
      "bg-[#17456B]",
      collapsed ? "w-16" : "w-60",
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 flex-shrink-0 border-b border-white/10",
        collapsed ? "justify-center px-0" : "px-5 gap-3"
      )}>
        <div className="w-8 h-8 bg-[#E8471F] rounded-[8px] flex items-center justify-center flex-shrink-0">
          <span className="text-[#0E6BB8] font-black text-[11px]">SM</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-black text-[13px] leading-tight whitespace-nowrap">SMTravel</div>
            <div className="text-white/40 text-[9px] whitespace-nowrap">ERP Platform</div>
          </div>
        )}
        {onMobileClose && (
          <button onClick={onMobileClose} className="ml-auto text-white/60 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <div className="px-4 pt-3 pb-1">
                <span className="text-white/30 text-[9px] font-bold uppercase tracking-[0.12em]">{group.label}</span>
              </div>
            )}
            {collapsed && <div className="my-2 mx-3 h-px bg-white/10" />}
            {group.items.map((item) => {
              const active = isActive(item.path, item.exact);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center mx-2 rounded-[8px] transition-all duration-150 cursor-pointer group relative",
                    collapsed ? "justify-center p-2.5 mb-0.5" : "gap-3 px-3 py-2 mb-0.5",
                    active
                      ? "bg-[#E8471F]/15 text-[#C43A15]"
                      : "text-white/65 hover:text-white hover:bg-white/8"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#E8471F] rounded-r-full" />
                  )}
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-[13px] font-medium whitespace-nowrap">{item.label}</span>
                  )}
                  {collapsed && (
                    <span className="absolute left-full ml-3 px-2 py-1 bg-[#0B5794] text-white text-[11px] font-medium rounded-[6px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: branch + user */}
      <div className="flex-shrink-0 border-t border-white/10">
        {!collapsed && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 px-2.5 py-2 bg-white/6 rounded-[8px]">
              <Building2 size={12} className="text-[#C43A15] flex-shrink-0" />
              <div className="flex-1 overflow-hidden">
                <div className="text-white/40 text-[9px] font-bold uppercase tracking-wide">Branch</div>
                <div className="text-white text-[11px] font-semibold truncate">Dhaka HQ (Main)</div>
              </div>
            </div>
          </div>
        )}
        <div className={cn(
          "flex items-center border-t border-white/10",
          collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
        )}>
          <div className="w-7 h-7 rounded-full bg-[#E8471F] flex items-center justify-center flex-shrink-0">
            <span className="text-[#0E6BB8] text-[10px] font-black">AR</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden">
                <div className="text-white text-[12px] font-semibold truncate">Md. Abdur Rahman</div>
                <div className="text-white/40 text-[10px]">Super Admin</div>
              </div>
              <Link to="/login" title="Sign out" className="text-white/40 hover:text-white/80 transition-colors cursor-pointer">
                <LogOut size={14} />
              </Link>
            </>
          )}
        </div>
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-center py-2.5 border-t border-white/10",
            "text-white/30 hover:text-white/70 transition-colors cursor-pointer hover:bg-white/5"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <div className="flex items-center gap-1.5 text-[10px] font-medium">
              <ChevronLeft size={12} /> Collapse
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({
  sidebarCollapsed, onMobileMenuOpen,
  selectedBranch, onBranchChange,
  dateRange, onDateRangeChange,
}: {
  sidebarCollapsed: boolean;
  onMobileMenuOpen: () => void;
  selectedBranch: string;
  onBranchChange: (b: string) => void;
  dateRange: string;
  onDateRangeChange: (r: string) => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  const DATE_RANGES = ["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "Last 3 Months", "This Year", "Custom Range"];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
      if (!branchRef.current?.contains(e.target as Node)) setBranchOpen(false);
      if (!dateRef.current?.contains(e.target as Node)) setDateOpen(false);
      if (!userRef.current?.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 z-20 flex items-center bg-white border-b border-[#E5E7EB] transition-all duration-200",
      // Mobile: full width. Desktop: offset by sidebar
      "left-0",
      sidebarCollapsed ? "lg:left-16" : "lg:left-60"
    )}>
      <div className="flex items-center gap-3 px-5 w-full">
        {/* Mobile menu */}
        <button onClick={onMobileMenuOpen} className="lg:hidden text-[#6B7280] hover:text-[#374151] cursor-pointer p-1">
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] mr-2 hidden sm:flex">
          <span className="font-semibold text-[#0E6BB8]">ERP</span>
          <ChevronRight size={12} />
          <span className="font-medium text-[#374151]">Super Admin Dashboard</span>
        </div>

        <div className="flex-1" />

        {/* Branch selector */}
        <div className="relative hidden md:block" ref={branchRef}>
          <button
            onClick={() => { setBranchOpen(v => !v); setDateOpen(false); setNotifOpen(false); setUserOpen(false); }}
            className="flex items-center gap-2 h-9 px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:border-[#0E6BB8]/30 transition-colors cursor-pointer"
          >
            <Building2 size={13} className="text-[#0E6BB8]" />
            <span className="max-w-[120px] truncate">{selectedBranch}</span>
            <ChevronDown size={12} className="text-[#9CA3AF]" />
          </button>
          {branchOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-[10px] shadow-xl py-1.5 min-w-[180px] z-50">
              {BRANCHES.map(b => (
                <button key={b} onClick={() => { onBranchChange(b); setBranchOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px] hover:bg-[#F7F8FA] transition-colors cursor-pointer flex items-center justify-between",
                    selectedBranch === b ? "text-[#0E6BB8] font-semibold" : "text-[#374151]"
                  )}>
                  {b}
                  {selectedBranch === b && <div className="w-1.5 h-1.5 rounded-full bg-[#0E6BB8]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date range */}
        <div className="relative hidden md:block" ref={dateRef}>
          <button
            onClick={() => { setDateOpen(v => !v); setBranchOpen(false); setNotifOpen(false); setUserOpen(false); }}
            className="flex items-center gap-2 h-9 px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:border-[#0E6BB8]/30 transition-colors cursor-pointer"
          >
            <CalendarDays size={13} className="text-[#0E6BB8]" />
            <span>{dateRange}</span>
            <ChevronDown size={12} className="text-[#9CA3AF]" />
          </button>
          {dateOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-[10px] shadow-xl py-1.5 min-w-[160px] z-50">
              {DATE_RANGES.map(r => (
                <button key={r} onClick={() => { onDateRangeChange(r); setDateOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px] hover:bg-[#F7F8FA] transition-colors cursor-pointer flex items-center justify-between",
                    dateRange === r ? "text-[#0E6BB8] font-semibold" : "text-[#374151]"
                  )}>
                  {r}
                  {dateRange === r && <div className="w-1.5 h-1.5 rounded-full bg-[#0E6BB8]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button className="h-9 w-9 flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F7F8FA] rounded-[8px] transition-colors cursor-pointer hidden md:flex">
          <RefreshCw size={15} />
        </button>

        {/* Search */}
        <button className="h-9 w-9 flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F7F8FA] rounded-[8px] transition-colors cursor-pointer">
          <Search size={15} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(v => !v); setBranchOpen(false); setDateOpen(false); setUserOpen(false); }}
            className="h-9 w-9 flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F7F8FA] rounded-[8px] transition-colors cursor-pointer relative"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#DC2626] rounded-full text-white text-[9px] font-black flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-[12px] shadow-xl w-80 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
                <span className="text-[13px] font-bold text-[#111827]">Notifications</span>
                <button className="text-[11px] text-[#0E6BB8] font-semibold hover:underline cursor-pointer">Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto no-scrollbar py-1.5">
                {NOTIFICATIONS.map(n => {
                  const cfg = typeIcon[n.type] || typeIcon.system;
                  const Icon = cfg.icon;
                  return (
                    <div key={n.id} className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-[#F7F8FA] transition-colors cursor-pointer",
                      n.unread && "bg-[#0E6BB8]/3"
                    )}>
                      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                        <Icon size={14} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[12px] leading-snug", n.unread ? "text-[#111827] font-medium" : "text-[#6B7280]")}>{n.msg}</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{n.time} ago</p>
                      </div>
                      {n.unread && <div className="w-2 h-2 bg-[#0E6BB8] rounded-full flex-shrink-0 mt-1.5" />}
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-2.5 border-t border-[#F3F4F6] text-center">
                <button className="text-[12px] text-[#0E6BB8] font-semibold hover:underline cursor-pointer">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setUserOpen(v => !v); setBranchOpen(false); setDateOpen(false); setNotifOpen(false); }}
            className="flex items-center gap-2.5 h-9 pl-1 pr-2.5 hover:bg-[#F7F8FA] rounded-[8px] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#0E6BB8] flex items-center justify-center">
              <span className="text-white text-[10px] font-black">AR</span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[12px] font-semibold text-[#111827] leading-tight">Md. Abdur Rahman</div>
              <div className="text-[10px] text-[#9CA3AF]">Super Admin</div>
            </div>
            <ChevronDown size={12} className="text-[#9CA3AF] hidden sm:block" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-[12px] shadow-xl w-52 z-50 py-1.5">
              <div className="px-4 py-3 border-b border-[#F3F4F6]">
                <div className="text-[12px] font-bold text-[#111827]">Md. Abdur Rahman</div>
                <div className="text-[11px] text-[#9CA3AF]">admin@smtravel.com.bd</div>
              </div>
              {[
                { icon: UserCircle, label: "My Profile" },
                { icon: Building2,  label: "Branch Settings" },
                { icon: HelpCircle, label: "Help & Support" },
                { icon: Globe,      label: "Public Website", to: "/" },
                { icon: BarChart3,  label: "Sitemap & Workflow", to: "/sitemap" },
                { icon: Layers,    label: "Design System", to: "/ds" },
              ].map(item => (
                item.to ? (
                  <Link key={item.label} to={item.to}
                    className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-[#374151] hover:bg-[#F7F8FA] hover:text-[#0E6BB8] transition-colors cursor-pointer">
                    <item.icon size={13} className="text-[#9CA3AF]" /> {item.label}
                  </Link>
                ) : (
                  <button key={item.label}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-[#374151] hover:bg-[#F7F8FA] hover:text-[#0E6BB8] transition-colors cursor-pointer">
                    <item.icon size={13} className="text-[#9CA3AF]" /> {item.label}
                  </button>
                )
              ))}
              <div className="border-t border-[#F3F4F6] mt-1.5 pt-1.5">
                <Link to="/login" className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer">
                  <LogOut size={13} /> Sign Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── ERP Layout ───────────────────────────────────────────────────────────────
export function ErpLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [dateRange, setDateRange] = useState("This Month");

  // Provide branch/date context to children via outlet context
  const outletCtx = { selectedBranch, dateRange };

  const location = useLocation();

  const mobileNavActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Mobile sidebar drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} width="w-60">
        <Sidebar collapsed={false} onToggle={() => {}} onMobileClose={() => setMobileOpen(false)} />
      </MobileDrawer>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      </div>

      {/* Topbar */}
      <Topbar
        sidebarCollapsed={collapsed}
        onMobileMenuOpen={() => setMobileOpen(true)}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Main content — extra bottom padding on mobile for bottom nav */}
      <main className={cn(
        "transition-all duration-200 pt-16 min-h-screen",
        "pb-20 lg:pb-0",
        collapsed ? "lg:ml-16" : "lg:ml-60"
      )}>
        <Outlet context={outletCtx} />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 lg:hidden">
        <div className="flex items-center justify-around px-1 py-1.5">
          {MOBILE_NAV.map(item => {
            const active = mobileNavActive(item.path, item.exact);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl relative"
                style={{ minHeight: 44, minWidth: 52 }}
              >
                <item.icon size={21} className={active ? "text-[#0E6BB8]" : "text-slate-400"} />
                <span className={cn(
                  "text-[10px] font-semibold leading-none",
                  active ? "text-[#0E6BB8]" : "text-slate-400"
                )}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#0E6BB8] rounded-full" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
