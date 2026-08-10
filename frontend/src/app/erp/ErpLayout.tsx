import React, { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import {
  LayoutDashboard, Users, CalendarDays, Package, Layers, Wallet,
  Receipt, BarChart3, FileEdit, Settings2, Settings, ChevronLeft,
  ChevronRight, Bell, Search, ChevronDown, Globe, LogOut, UserCircle,
  HelpCircle, Building2, X, Menu, Briefcase, Star, TrendingUp,
  AlertTriangle, RefreshCw, FolderOpen, MessageSquare, LineChart,
  Moon, Plane, Stamp, ClipboardList,
  Handshake, Truck, UsersRound, Hotel, Bus, Tag, Megaphone, Smartphone,
  MessageCircle, ScanLine, Plug, Sparkles, BadgeDollarSign,
} from "lucide-react";
import { cn } from "../lib/utils";
import { MobileDrawer } from "../lib/responsive";
import { BrandLogo } from "../components/BrandLogo";
import { useMyNotifications, useMarkAllNotificationsRead, relAge } from "../hooks/notifications";
import { useLang } from "../i18n/useLang";
import { useBranches, type BranchOption } from "../hooks/bookings";

// ─── Mobile bottom nav items ──────────────────────────────────────────────────
const MOBILE_NAV = [
  { icon: LayoutDashboard, label: "Home",     path: "/erp",          exact: true },
  { icon: CalendarDays,    label: "Bookings", path: "/erp/bookings"              },
  { icon: Users,           label: "CRM",      path: "/erp/crm"                   },
  { icon: Receipt,         label: "Invoices", path: "/erp/invoices"              },
  { icon: Settings,        label: "Settings", path: "/erp/settings"              },
];

// ─── Nav config ───────────────────────────────────────────────────────────────
// `module` maps each item to an RBAC permission module (see backend seed). The
// sidebar hides any item the signed-in user's roles don't grant (view|full).
// FINAL PRODUCTION MENU (Phase 2 — see docs/PHASE_2_FINAL_NAVIGATION.md). Single
// source of truth. Labels resolve via the erpNav i18n namespace (`group.<key>` /
// `item.<labelKey>`). Each item maps to a REAL route, a `svc`-filtered Bookings
// screen, an existing screen + `q` tab hint, or an explicit ComingSoon placeholder.
// `module` reuses EXISTING RBAC keys (no new permission keys in Phase 2) so nothing
// vanishes; dedicated modules (manpower/business_network/payroll/currency) arrive
// with their backend in later phases. Groups with no visible items don't render.
type NavItem = { icon: React.ElementType; labelKey: string; path: string; exact?: boolean; svc?: string; q?: string; module: string; soon?: boolean };
const NAV_GROUPS: { key: string; items: NavItem[] }[] = [
  { key: "dashboard", items: [
    { icon: LayoutDashboard, labelKey: "dashboard", path: "/erp", exact: true, module: "dashboard" },
  ] },
  { key: "crm", items: [
    { icon: Users,      labelKey: "customers", path: "/erp/crm", q: "tab=customers", module: "crm" },
    { icon: TrendingUp, labelKey: "leads",     path: "/erp/crm", q: "tab=leads",     module: "crm" },
    { icon: Handshake,  labelKey: "agents",    path: "/erp/partners",                module: "partners" },
    { icon: Building2,  labelKey: "corporate", path: "/erp/crm", q: "tab=corporate", module: "crm" },
  ] },
  { key: "airTicketing", items: [
    { icon: CalendarDays, labelKey: "airBookings",  path: "/erp/bookings",  svc: "AIR_TICKET", module: "bookings" },
    { icon: Plane,        labelKey: "tickets",      path: "/erp/bookings",  svc: "AIR_TICKET", q: "view=tickets", module: "bookings" },
    { icon: Truck,        labelKey: "airSuppliers", path: "/erp/suppliers", module: "suppliers" },
  ] },
  { key: "visa", items: [
    { icon: Stamp,  labelKey: "visaApplications", path: "/erp/bookings", svc: "VISA", module: "bookings" },
    { icon: Layers, labelKey: "visaTypes",        path: "/erp/services", module: "packages" },
  ] },
  { key: "hajjUmrah", items: [
    { icon: Star,       labelKey: "hajj",     path: "/erp/bookings", svc: "HAJJ",  module: "bookings" },
    { icon: Moon,       labelKey: "umrah",    path: "/erp/bookings", svc: "UMRAH", module: "bookings" },
    { icon: Users,      labelKey: "pilgrims", path: "/erp/hajj-ops", q: "tab=pilgrims", module: "ops" },
    { icon: Package,    labelKey: "packages", path: "/erp/packages", module: "packages" },
    { icon: UsersRound, labelKey: "groups",   path: "/erp/hajj-ops", q: "tab=groups", module: "ops" },
    { icon: UserCircle, labelKey: "muallim",  path: "/erp/muallim", module: "operations_team" },
  ] },
  { key: "manpower", items: [
    { icon: ClipboardList, labelKey: "jobOrders",   path: "/erp/manpower/job-orders",  module: "bookings" },
    { icon: Users,         labelKey: "candidates",  path: "/erp/manpower/candidates",  module: "bookings" },
    { icon: Building2,     labelKey: "employers",   path: "/erp/manpower/employers",   module: "bookings" },
    { icon: UsersRound,    labelKey: "recruitment", path: "/erp/manpower/recruitment", module: "bookings" },
    { icon: Stamp,         labelKey: "mpVisa",      path: "/erp/manpower/visa",        module: "bookings", soon: true },
    { icon: ScanLine,      labelKey: "medical",     path: "/erp/manpower/medical",     module: "bookings", soon: true },
    { icon: FileEdit,      labelKey: "bmet",        path: "/erp/manpower/bmet",        module: "bookings", soon: true },
    { icon: Plane,         labelKey: "deployment",  path: "/erp/manpower/deployment",  module: "bookings", soon: true },
  ] },
  { key: "tour", items: [
    { icon: Package,      labelKey: "tourPackages", path: "/erp/packages", q: "type=tour", module: "packages" },
    { icon: CalendarDays, labelKey: "tourBookings", path: "/erp/bookings", svc: "TOUR", module: "bookings" },
    { icon: Bus,          labelKey: "transport",    path: "/erp/transport", module: "ops", soon: true },
  ] },
  { key: "hotel", items: [
    { icon: CalendarDays, labelKey: "hotelBookings", path: "/erp/bookings", svc: "HOTEL", module: "bookings" },
    { icon: Hotel,        labelKey: "hotels",        path: "/erp/hotels", module: "suppliers", soon: true },
  ] },
  { key: "operations", items: [
    { icon: ClipboardList, labelKey: "tasks",          path: "/erp/ops", q: "tab=tasks", module: "ops" },
    { icon: FolderOpen,    labelKey: "assignments",    path: "/erp/ops", q: "tab=assignments", module: "ops" },
    { icon: UsersRound,    labelKey: "operationsTeam", path: "/erp/ops-team", module: "operations_team" },
  ] },
  { key: "accounts", items: [
    { icon: TrendingUp, labelKey: "income",           path: "/erp/accounts", q: "tab=income",   module: "accounts" },
    { icon: Receipt,    labelKey: "expenses",         path: "/erp/accounts", q: "tab=expenses", module: "accounts" },
    { icon: Wallet,     labelKey: "customerPayments", path: "/erp/accounts", q: "tab=payments", module: "accounts" },
    { icon: Truck,      labelKey: "supplierPayments", path: "/erp/accounts", q: "tab=payables", module: "accounts" },
    { icon: Receipt,    labelKey: "invoices",         path: "/erp/invoices", module: "invoices" },
    { icon: BarChart3,  labelKey: "accountsReports",  path: "/erp/reports", q: "tab=accounts", module: "reports" },
  ] },
  { key: "hrPayroll", items: [
    { icon: Users,           labelKey: "employees",  path: "/erp/hr", q: "tab=employees",  module: "settings" },
    { icon: CalendarDays,    labelKey: "attendance", path: "/erp/hr", q: "tab=attendance", module: "settings" },
    { icon: FolderOpen,      labelKey: "leave",      path: "/erp/hr", q: "tab=leave",      module: "settings" },
    { icon: BadgeDollarSign, labelKey: "payroll",    path: "/erp/hr/payroll", module: "settings" },
  ] },
  { key: "businessNetwork", items: [
    { icon: Building2,  labelKey: "companies",    path: "/erp/network/companies", module: "partners" },
    { icon: UserCircle, labelKey: "scholars",     path: "/erp/network/scholars",  module: "partners" },
    { icon: Truck,      labelKey: "netSuppliers", path: "/erp/suppliers", module: "suppliers" },
    { icon: Handshake,  labelKey: "b2bPartners",  path: "/erp/partners",  module: "partners" },
  ] },
  { key: "communication", items: [
    { icon: MessageCircle, labelKey: "whatsapp",      path: "/erp/whatsapp",       module: "crm", soon: true },
    { icon: Smartphone,    labelKey: "sms",           path: "/erp/sms",            module: "communication" },
    { icon: MessageSquare, labelKey: "notifications", path: "/erp/communications", module: "crm" },
  ] },
  { key: "reports", items: [
    { icon: Tag,        labelKey: "salesReports",    path: "/erp/reports", q: "tab=sales",      module: "reports" },
    { icon: Star,       labelKey: "hajjReports",     path: "/erp/reports", q: "tab=hajj",       module: "reports" },
    { icon: Briefcase,  labelKey: "manpowerReports", path: "/erp/reports", q: "tab=manpower",   module: "reports" },
    { icon: Wallet,     labelKey: "accountReports",  path: "/erp/reports", q: "tab=accounts",   module: "reports" },
    { icon: Settings2,  labelKey: "opsReports",      path: "/erp/reports", q: "tab=operations", module: "reports" },
  ] },
  { key: "settings", items: [
    { icon: Building2,  labelKey: "companySettings", path: "/erp/settings", q: "tab=company",  module: "settings" },
    { icon: Users,      labelKey: "usersRoles",      path: "/erp/settings", q: "tab=users",    module: "settings" },
    { icon: Globe,      labelKey: "branches",        path: "/erp/settings", q: "tab=branches", module: "settings" },
    { icon: Wallet,     labelKey: "currency",        path: "/erp/settings/currency", module: "settings" },
    { icon: FileEdit,   labelKey: "cms",             path: "/erp/cms", module: "cms" },
    { icon: Settings2,  labelKey: "systemSettings",  path: "/erp/settings", q: "tab=system",   module: "settings" },
  ] },
];

const ALL_BRANCHES = "all";

const typeIcon: Record<string, { icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>, color: string, bg: string }> = {
  booking: { icon: CalendarDays, color: "#1B75BC", bg: "#EEF2FF" },
  payment: { icon: Wallet,        color: "#0E7C66", bg: "#ECFDF5" },
  alert:   { icon: AlertTriangle, color: "#DC2626", bg: "#FEF2F2" },
  lead:    { icon: TrendingUp,    color: "#F15A24", bg: "#FFF9E6" },
  system:  { icon: Settings,      color: "#6B7280", bg: "#F3F4F6" },
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, onMobileClose }: {
  collapsed: boolean; onToggle: () => void; onMobileClose?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("erpNav");
  const { user, can, logout } = useAuth();

  // A merged entry is active only when its service filter (svc) AND/OR tab hint (q)
  // match the current URL. Base "All Bookings" is active only with no service filter.
  const isActiveItem = (item: { path: string; exact?: boolean; svc?: string; q?: string }) => {
    const onPath = item.exact
      ? location.pathname === item.path
      : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
    if (!onPath) return false;
    const svc = searchParams.get("service");
    if (item.svc) { if (svc !== item.svc) return false; }
    else if (item.path === "/erp/bookings") { if (svc) return false; }
    if (item.q) {
      const [qk, qv] = item.q.split("=");
      if (searchParams.get(qk) !== qv) return false;
    }
    return true;
  };

  // Hide items/groups the signed-in user's RBAC permissions don't grant.
  const visibleGroups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((it) => can(it.module)) }))
    .filter((g) => g.items.length > 0);

  const handleSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = (user?.name ?? "")
    .split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "SM";
  const roleLabel = (user?.role ?? "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

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
        <BrandLogo variant="tile" className="w-8 h-8 rounded-[8px]" />
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-black text-[13px] leading-tight whitespace-nowrap">SM Travels</div>
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
        {visibleGroups.map((group) => (
          <div key={group.key} className="mb-1">
            {!collapsed && (
              <div className="px-4 pt-3 pb-1">
                <span className="text-white/30 text-[9px] font-bold uppercase tracking-[0.12em]">{t(`group.${group.key}`)}</span>
              </div>
            )}
            {collapsed && <div className="my-2 mx-3 h-px bg-white/10" />}
            {group.items.map((item) => {
              const active = isActiveItem(item);
              const label = t(`item.${item.labelKey}`);
              const params: string[] = [];
              if (item.svc) params.push(`service=${item.svc}`);
              if (item.q) params.push(item.q);
              const to = params.length ? `${item.path}?${params.join("&")}` : item.path;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.labelKey}
                  to={to}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center mx-2 rounded-[8px] transition-all duration-150 cursor-pointer group relative",
                    collapsed ? "justify-center p-2.5 mb-0.5" : "gap-3 px-3 py-2 mb-0.5",
                    active
                      ? "bg-[#F15A24]/15 text-[#D64A12]"
                      : "text-white/65 hover:text-white hover:bg-white/8"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#F15A24] rounded-r-full" />
                  )}
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-[13px] font-medium whitespace-nowrap flex-1">{label}</span>
                  )}
                  {!collapsed && item.soon && (
                    <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-white/35 border border-white/15 rounded-[4px] px-1 py-px flex-shrink-0">{t("coming.soon")}</span>
                  )}
                  {collapsed && (
                    <span className="absolute left-full ml-3 px-2 py-1 bg-[#14588F] text-white text-[11px] font-medium rounded-[6px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                      {label}
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
              <Building2 size={12} className="text-[#D64A12] flex-shrink-0" />
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
          <div className="w-7 h-7 rounded-full bg-[#F15A24] flex items-center justify-center flex-shrink-0">
            <span className="text-[#1B75BC] text-[10px] font-black">{initials}</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden">
                <div className="text-white text-[12px] font-semibold truncate">{user?.name ?? "—"}</div>
                <div className="text-white/40 text-[10px]">{roleLabel || "—"}</div>
              </div>
              <button onClick={handleSignOut} title="Sign out" className="text-white/40 hover:text-white/80 transition-colors cursor-pointer">
                <LogOut size={14} />
              </button>
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
  branches, selectedBranchId, selectedBranchLabel, onBranchChange,
  dateRange, onDateRangeChange,
}: {
  sidebarCollapsed: boolean;
  onMobileMenuOpen: () => void;
  branches: BranchOption[];
  selectedBranchId: string;
  selectedBranchLabel: string;
  onBranchChange: (id: string) => void;
  dateRange: string;
  onDateRangeChange: (r: string) => void;
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const initials = (user?.name ?? "")
    .split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "SM";
  const roleLabel = (user?.role ?? "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const handleSignOut = async () => { await logout(); navigate("/login", { replace: true }); };

  const notifQ = useMyNotifications();
  const notifications = notifQ.data ?? [];
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter(n => !n.read).length;
  const { lang, toggle } = useLang();

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
          <span className="font-semibold text-[#1B75BC]">ERP</span>
          <ChevronRight size={12} />
          <span className="font-medium text-[#374151]">Super Admin Dashboard</span>
        </div>

        <div className="flex-1" />

        {/* Branch selector */}
        <div className="relative hidden md:block" ref={branchRef}>
          <button
            onClick={() => { setBranchOpen(v => !v); setDateOpen(false); setNotifOpen(false); setUserOpen(false); }}
            className="flex items-center gap-2 h-9 px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:border-[#1B75BC]/30 transition-colors cursor-pointer"
          >
            <Building2 size={13} className="text-[#1B75BC]" />
            <span className="max-w-[120px] truncate">{selectedBranchLabel}</span>
            <ChevronDown size={12} className="text-[#9CA3AF]" />
          </button>
          {branchOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-[10px] shadow-xl py-1.5 min-w-[200px] z-50">
              {[{ id: ALL_BRANCHES, name: "All Branches" }, ...branches].map(b => (
                <button key={b.id} onClick={() => { onBranchChange(b.id); setBranchOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px] hover:bg-[#F7F8FA] transition-colors cursor-pointer flex items-center justify-between",
                    selectedBranchId === b.id ? "text-[#1B75BC] font-semibold" : "text-[#374151]"
                  )}>
                  {b.name}
                  {selectedBranchId === b.id && <div className="w-1.5 h-1.5 rounded-full bg-[#1B75BC]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date range */}
        <div className="relative hidden md:block" ref={dateRef}>
          <button
            onClick={() => { setDateOpen(v => !v); setBranchOpen(false); setNotifOpen(false); setUserOpen(false); }}
            className="flex items-center gap-2 h-9 px-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#374151] hover:border-[#1B75BC]/30 transition-colors cursor-pointer"
          >
            <CalendarDays size={13} className="text-[#1B75BC]" />
            <span>{dateRange}</span>
            <ChevronDown size={12} className="text-[#9CA3AF]" />
          </button>
          {dateOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-[10px] shadow-xl py-1.5 min-w-[160px] z-50">
              {DATE_RANGES.map(r => (
                <button key={r} onClick={() => { onDateRangeChange(r); setDateOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px] hover:bg-[#F7F8FA] transition-colors cursor-pointer flex items-center justify-between",
                    dateRange === r ? "text-[#1B75BC] font-semibold" : "text-[#374151]"
                  )}>
                  {r}
                  {dateRange === r && <div className="w-1.5 h-1.5 rounded-full bg-[#1B75BC]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language toggle (bn/en) — ERP i18n. Values are English until the
            Bangla sweep; the toggle proves the framework is wired end to end. */}
        <button
          onClick={toggle}
          title={lang === "en" ? "বাংলা" : "English"}
          className="h-9 px-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#374151] hover:bg-[#F7F8FA] rounded-[8px] transition-colors cursor-pointer"
        >
          <Globe size={15} className="text-[#0E6BB8]" />
          {lang === "en" ? "EN" : "বাং"}
        </button>

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
                {unreadCount > 0 && (
                  <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
                    className="text-[11px] text-[#1B75BC] font-semibold hover:underline cursor-pointer disabled:opacity-50">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto no-scrollbar py-1.5">
                {notifications.length === 0 && (
                  <p className="px-4 py-6 text-center text-[12px] text-[#9CA3AF]">
                    {notifQ.isLoading ? "Loading…" : "No notifications yet."}
                  </p>
                )}
                {notifications.map(n => {
                  const cfg = typeIcon[n.type ?? "system"] || typeIcon.system;
                  const Icon = cfg.icon;
                  return (
                    <div key={n.id} className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-[#F7F8FA] transition-colors",
                      !n.read && "bg-[#1B75BC]/3"
                    )}>
                      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                        <Icon size={14} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[12px] leading-snug", !n.read ? "text-[#111827] font-medium" : "text-[#6B7280]")}>
                          {n.title}{n.body ? ` — ${n.body}` : ""}
                        </p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{relAge(n.createdAt)} ago</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-[#1B75BC] rounded-full flex-shrink-0 mt-1.5" />}
                    </div>
                  );
                })}
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
            <div className="w-7 h-7 rounded-full bg-[#1B75BC] flex items-center justify-center">
              <span className="text-white text-[10px] font-black">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[12px] font-semibold text-[#111827] leading-tight">{user?.name ?? "—"}</div>
              <div className="text-[10px] text-[#9CA3AF]">{roleLabel || "—"}</div>
            </div>
            <ChevronDown size={12} className="text-[#9CA3AF] hidden sm:block" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-[12px] shadow-xl w-52 z-50 py-1.5">
              <div className="px-4 py-3 border-b border-[#F3F4F6]">
                <div className="text-[12px] font-bold text-[#111827]">{user?.name ?? "—"}</div>
                <div className="text-[11px] text-[#9CA3AF]">{user?.email ?? ""}</div>
              </div>
              {[
                { icon: UserCircle, label: "My Profile", to: "/erp/settings" },
                { icon: Building2,  label: "Branch Settings", to: "/erp/settings" },
                { icon: HelpCircle, label: "Help & Support", disabled: true },
                { icon: Globe,      label: "Public Website", to: "/" },
                { icon: BarChart3,  label: "Sitemap & Workflow", to: "/sitemap" },
                { icon: Layers,    label: "Design System", to: "/ds" },
              ].map(item => (
                item.to ? (
                  <Link key={item.label} to={item.to} onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-[#374151] hover:bg-[#F7F8FA] hover:text-[#1B75BC] transition-colors cursor-pointer">
                    <item.icon size={13} className="text-[#9CA3AF]" /> {item.label}
                  </Link>
                ) : (
                  <button key={item.label} disabled title={`${item.label} is not available in this build`}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-[#9CA3AF] opacity-60 cursor-not-allowed">
                    <item.icon size={13} className="text-[#9CA3AF]" /> {item.label}
                  </button>
                )
              ))}
              <div className="border-t border-[#F3F4F6] mt-1.5 pt-1.5">
                <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer">
                  <LogOut size={13} /> Sign Out
                </button>
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
  const [selectedBranchId, setSelectedBranchId] = useState(ALL_BRANCHES);
  const [dateRange, setDateRange] = useState("This Month");

  // Real branches for the topbar filter (branch-scoped: a branch user only sees
  // their own). The selected branch id flows to the dashboard via outlet context.
  const branchesQ = useBranches();
  const branches = branchesQ.data ?? [];
  const branchLabel =
    selectedBranchId === ALL_BRANCHES
      ? "All Branches"
      : branches.find((b) => b.id === selectedBranchId)?.name ?? "All Branches";

  // Provide branch/date context to children via outlet context
  const outletCtx = { branchId: selectedBranchId, branchLabel, dateRange };

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
        branches={branches}
        selectedBranchId={selectedBranchId}
        selectedBranchLabel={branchLabel}
        onBranchChange={setSelectedBranchId}
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
                <item.icon size={21} className={active ? "text-[#1B75BC]" : "text-slate-400"} />
                <span className={cn(
                  "text-[10px] font-semibold leading-none",
                  active ? "text-[#1B75BC]" : "text-slate-400"
                )}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#1B75BC] rounded-full" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
