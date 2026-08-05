import React, { useState } from "react";
import { Link } from "react-router";
import {
  Globe, Users, CalendarDays, Receipt, BarChart3, Settings, Shield,
  Briefcase, Building2, UserCircle, Calculator, ArrowRight, ArrowDown,
  ChevronRight, ExternalLink, Package, Layers, FileText, MessageSquare,
  FolderOpen, LineChart, Star, MapPin, Plane, Hotel, HelpCircle,
  BookOpen, Image, Mail, Home, TrendingUp, Wallet, FileEdit,
  AlertCircle, CheckCircle, CreditCard, FileCheck, Landmark,
} from "lucide-react";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type ZoneKey = "public" | "erp" | "customer" | "agent" | "supplier" | "staff" | "accountant";

interface RouteNode {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
  children?: RouteNode[];
}

// ─── Color config per zone ────────────────────────────────────────────────────
const ZONE_CFG: Record<ZoneKey, { bg: string; border: string; text: string; badge: string; dot: string; label: string }> = {
  public:     { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-700",  badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-400",   label: "Public Website" },
  erp:        { bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-800",   badge: "bg-blue-100 text-blue-800",     dot: "bg-[#1B75BC]",   label: "ERP (Staff)" },
  customer:   { bg: "bg-teal-50",    border: "border-teal-200",   text: "text-teal-700",   badge: "bg-teal-100 text-teal-700",     dot: "bg-teal-500",    label: "Customer Portal" },
  agent:      { bg: "bg-slate-50",   border: "border-slate-200",  text: "text-slate-700",  badge: "bg-slate-100 text-slate-700",   dot: "bg-slate-500",   label: "Agent Portal" },
  supplier:   { bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500",  label: "Supplier Portal" },
  staff:      { bg: "bg-indigo-50",  border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500",  label: "Staff Portal" },
  accountant: { bg: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-700",badge: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-600",label: "Accountant Portal" },
};

// ─── Workflow steps ───────────────────────────────────────────────────────────
const WORKFLOW = [
  {
    id: "visitor",
    label: "Visitor / Prospect",
    icon: Globe,
    color: "#F15A24",
    bg: "#FFF9E6",
    border: "#F15A2440",
    desc: "Organic, referral, WhatsApp, social media",
    actions: ["Browse website", "View packages", "WhatsApp inquiry"],
  },
  {
    id: "website",
    label: "Public Website",
    icon: Home,
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#EA580C40",
    desc: "9 service pages, packages, blog, gallery",
    actions: ["/book → Booking Request", "/login → Auth", "WhatsApp CTA"],
  },
  {
    id: "entry",
    label: "Entry Points",
    icon: AlertCircle,
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#7C3AED40",
    desc: "Multiple channels merge into CRM",
    actions: ["Online Booking Form", "Walk-in Registration", "Agent Referral", "WhatsApp → Lead"],
    wide: true,
  },
  {
    id: "crm",
    label: "CRM & Lead Management",
    icon: Users,
    color: "#1B75BC",
    bg: "#EEF2FF",
    border: "#1B75BC40",
    desc: "Centralized lead tracking & assignment",
    actions: ["Lead scoring", "Assign executive", "Follow-up tasks", "Convert to booking"],
  },
  {
    id: "booking",
    label: "Booking Processing",
    icon: CalendarDays,
    color: "#0E7C66",
    bg: "#ECFDF5",
    border: "#0E7C6640",
    desc: "7 service types handled end-to-end",
    actions: ["Hajj / Umrah", "Visa Processing", "Air Ticket", "Hotel / Tour / Manpower"],
    wide: true,
  },
  {
    id: "payment",
    label: "Payment Processing",
    icon: CreditCard,
    color: "#0891B2",
    bg: "#F0F9FF",
    border: "#0891B240",
    desc: "Flexible payment options & tracking",
    actions: ["Invoice generation", "Receipt on payment", "Installment schedule", "Agent commission"],
  },
  {
    id: "accounting",
    label: "Accounting & Ledger",
    icon: Landmark,
    color: "#0E7C66",
    bg: "#ECFDF5",
    border: "#0E7C6640",
    desc: "Double-entry accounting & reconciliation",
    actions: ["Journal entries", "Bank reconciliation", "VAT & tax reports", "Payroll"],
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    icon: BarChart3,
    color: "#1B75BC",
    bg: "#EEF2FF",
    border: "#1B75BC40",
    desc: "Business intelligence & dashboards",
    actions: ["Revenue reports", "Agent performance", "Booking trends", "Export PDF/Excel"],
  },
];

// ─── Route tree ───────────────────────────────────────────────────────────────
const ROUTE_TREE: { zone: ZoneKey; root: string; icon: React.ElementType; routes: RouteNode[] }[] = [
  {
    zone: "public",
    root: "/",
    icon: Globe,
    routes: [
      { path: "/", label: "Home", icon: Home },
      { path: "/hajj", label: "Hajj Services", icon: Star, roles: ["All visitors"] },
      { path: "/umrah", label: "Umrah Services", icon: MapPin },
      { path: "/visa", label: "Visa Processing", icon: FileCheck },
      { path: "/air-ticket", label: "Air Ticket", icon: Plane },
      { path: "/hotel-booking", label: "Hotel Booking", icon: Hotel },
      { path: "/manpower", label: "Manpower", icon: Briefcase },
      { path: "/tour-packages", label: "Tour Packages", icon: Globe },
      { path: "/packages", label: "Package Catalogue", icon: Package },
      { path: "/blog", label: "Blog", icon: BookOpen },
      { path: "/gallery", label: "Gallery", icon: Image },
      { path: "/faq", label: "FAQ", icon: HelpCircle },
      { path: "/contact", label: "Contact", icon: Mail },
      { path: "/book", label: "Book Now", icon: CalendarDays, roles: ["Converts to Lead"] },
      { path: "/login", label: "Login / Register", icon: Shield, roles: ["All roles"] },
    ],
  },
  {
    zone: "erp",
    root: "/erp",
    icon: BarChart3,
    routes: [
      { path: "/erp", label: "Dashboard", icon: BarChart3, roles: ["Admin", "Super Admin", "All Staff"] },
      { path: "/erp/bookings", label: "Bookings (CRM)", icon: CalendarDays, roles: ["Admin", "Sales Exec", "Hajj/Umrah Exec"] },
      { path: "/erp/packages", label: "Package Management", icon: Package, roles: ["Admin", "Package Mgr"] },
      { path: "/erp/services", label: "Services Config", icon: Layers, roles: ["Admin", "Super Admin"] },
      { path: "/erp/accounts", label: "Accounts", icon: Wallet, roles: ["Admin", "Accountant"] },
      { path: "/erp/invoices", label: "Invoices & Payments", icon: Receipt, roles: ["Admin", "Accountant", "Sales Exec"] },
      { path: "/erp/reports", label: "Reports", icon: BarChart3, roles: ["Admin", "Management"] },
      { path: "/erp/reports-bi", label: "BI Analytics", icon: LineChart, roles: ["Admin", "Management"] },
      { path: "/erp/documents", label: "Documents", icon: FolderOpen, roles: ["All Staff"] },
      { path: "/erp/communications", label: "Communications", icon: MessageSquare, roles: ["All Staff"] },
      { path: "/erp/cms", label: "CMS", icon: FileEdit, roles: ["Admin", "Content Mgr"] },
      { path: "/erp/ops", label: "Operations", icon: Settings, roles: ["Admin", "Ops Exec"] },
      { path: "/erp/settings", label: "Settings", icon: Shield, roles: ["Super Admin"] },
    ],
  },
  {
    zone: "customer",
    root: "/portal",
    icon: UserCircle,
    routes: [
      { path: "/portal", label: "Dashboard", icon: BarChart3, roles: ["Customer"] },
      { path: "/portal → Bookings", label: "My Bookings", icon: CalendarDays, roles: ["Customer"] },
      { path: "/portal → Payments", label: "Payments & Invoices", icon: Receipt, roles: ["Customer"] },
      { path: "/portal → Installments", label: "Installment Schedule", icon: CreditCard, roles: ["Customer"] },
      { path: "/portal → Documents", label: "Documents & Visa", icon: FolderOpen, roles: ["Customer"] },
      { path: "/portal → Support", label: "Support Tickets", icon: MessageSquare, roles: ["Customer"] },
    ],
  },
  {
    zone: "agent",
    root: "/agent",
    icon: Briefcase,
    routes: [
      { path: "/agent", label: "Dashboard", icon: BarChart3, roles: ["Agent"] },
      { path: "/agent → Leads", label: "Lead Management", icon: Users, roles: ["Agent"] },
      { path: "/agent → Commission", label: "Commission Reports", icon: TrendingUp, roles: ["Agent"] },
      { path: "/agent → Wallet", label: "Wallet & Payments", icon: Wallet, roles: ["Agent"] },
      { path: "/agent → Team", label: "My Team", icon: Users, roles: ["Agent"] },
    ],
  },
  {
    zone: "supplier",
    root: "/supplier",
    icon: Building2,
    routes: [
      { path: "/supplier", label: "Dashboard", icon: BarChart3, roles: ["Supplier"] },
      { path: "/supplier → Requests", label: "Booking Requests", icon: CalendarDays, roles: ["Supplier"] },
      { path: "/supplier → Services", label: "My Services", icon: Layers, roles: ["Supplier"] },
      { path: "/supplier → Invoices", label: "Invoices & Payments", icon: Receipt, roles: ["Supplier"] },
      { path: "/supplier → Statements", label: "Monthly Statements", icon: FileText, roles: ["Supplier"] },
    ],
  },
  {
    zone: "staff",
    root: "/staff",
    icon: Users,
    routes: [
      { path: "/staff", label: "Dashboard", icon: BarChart3, roles: ["Staff"] },
      { path: "/staff → Tasks", label: "Daily Tasks", icon: CheckCircle, roles: ["Staff"] },
      { path: "/staff → Bookings", label: "Booking Management", icon: CalendarDays, roles: ["Staff"] },
      { path: "/staff → Documents", label: "Documents", icon: FolderOpen, roles: ["Staff"] },
      { path: "/staff → Announcements", label: "Announcements", icon: MessageSquare, roles: ["Staff"] },
    ],
  },
  {
    zone: "accountant",
    root: "/accountant",
    icon: Calculator,
    routes: [
      { path: "/accountant", label: "Financial Dashboard", icon: BarChart3, roles: ["Accountant"] },
      { path: "/accountant → P&L", label: "Income & Expense", icon: TrendingUp, roles: ["Accountant"] },
      { path: "/accountant → Bank", label: "Bank & Cash", icon: Landmark, roles: ["Accountant"] },
      { path: "/accountant → Journal", label: "Journal Entries", icon: FileText, roles: ["Accountant"] },
      { path: "/accountant → Tax", label: "Tax Reports (VAT)", icon: Receipt, roles: ["Accountant"] },
      { path: "/accountant → Audit", label: "Audit Logs", icon: Shield, roles: ["Accountant"] },
    ],
  },
];

// ─── Role legend ──────────────────────────────────────────────────────────────
const ROLES_LEGEND = [
  { label: "Super Admin",    color: "#DC2626", bg: "#FEF2F2" },
  { label: "Admin",          color: "#1B75BC", bg: "#EEF2FF" },
  { label: "Accountant",     color: "#0E7C66", bg: "#ECFDF5" },
  { label: "Sales Exec",     color: "#EA580C", bg: "#FFF7ED" },
  { label: "Hajj/Umrah Exec",color: "#F15A24", bg: "#FFF9E6" },
  { label: "Visa Exec",      color: "#0891B2", bg: "#F0F9FF" },
  { label: "Agent",          color: "#374151", bg: "#F9FAFB" },
  { label: "Supplier",       color: "#7C3AED", bg: "#F5F3FF" },
  { label: "Customer",       color: "#2563EB", bg: "#EFF6FF" },
  { label: "Staff",          color: "#6D28D9", bg: "#EDE9FE" },
];

// ─── Arrow component ──────────────────────────────────────────────────────────
function Arrow({ horizontal = false }: { horizontal?: boolean }) {
  return horizontal ? (
    <div className="flex items-center gap-0 flex-shrink-0">
      <div className="w-8 h-0.5 bg-slate-300" />
      <ChevronRight size={14} className="text-slate-400 -ml-1" />
    </div>
  ) : (
    <div className="flex flex-col items-center gap-0 self-center">
      <div className="w-0.5 h-6 bg-slate-300" />
      <ArrowDown size={14} className="text-slate-400 -mt-1" />
    </div>
  );
}

// ─── Workflow Step Card ───────────────────────────────────────────────────────
function WorkflowStep({ step }: { step: typeof WORKFLOW[number] }) {
  const Icon = step.icon;
  return (
    <div className="relative flex flex-col items-start rounded-2xl border p-4 w-48 flex-shrink-0 bg-white shadow-sm hover:shadow-md transition-shadow"
      style={{ borderColor: step.border, backgroundColor: step.bg }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 flex-shrink-0"
        style={{ backgroundColor: `${step.color}18` }}>
        <Icon size={18} style={{ color: step.color }} />
      </div>
      <p className="text-[13px] font-black text-slate-800 leading-tight mb-1">{step.label}</p>
      <p className="text-[10px] text-slate-500 leading-tight mb-2">{step.desc}</p>
      <div className="flex flex-col gap-1 w-full">
        {step.actions.map(a => (
          <div key={a} className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: step.color }} />
            <span className="text-[10px] text-slate-600 leading-tight">{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Route Card ──────────────────────────────────────────────────────────────
function RouteCard({ node, zone }: { node: RouteNode; zone: ZoneKey }) {
  const cfg = ZONE_CFG[zone];
  const Icon = node.icon;
  const isRealPath = node.path.startsWith("/") && !node.path.includes("→");
  return (
    <div className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2.5 hover:shadow-sm transition-all group", cfg.bg, cfg.border)}>
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", cfg.badge.includes("bg-") ? "" : "bg-white")}>
        <Icon size={13} className={cfg.text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[12px] font-bold leading-tight truncate", cfg.text)}>{node.label}</p>
        {node.roles && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {node.roles.map(r => (
              <span key={r} className="text-[9px] font-semibold text-slate-500 bg-white/60 rounded px-1 py-0.5 border border-slate-200/60">{r}</span>
            ))}
          </div>
        )}
      </div>
      {isRealPath && (
        <Link to={node.path} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <ExternalLink size={11} className="text-slate-400 hover:text-slate-700" />
        </Link>
      )}
    </div>
  );
}

// ─── Zone Panel ──────────────────────────────────────────────────────────────
function ZonePanel({ zone, root, icon: ZoneIcon, routes }: typeof ROUTE_TREE[number]) {
  const cfg = ZONE_CFG[zone];
  return (
    <div className={cn("rounded-2xl border-2 overflow-hidden", cfg.border)}>
      {/* Header */}
      <div className={cn("flex items-center gap-3 px-4 py-3 border-b", cfg.bg, cfg.border)}>
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", cfg.badge)}>
          <ZoneIcon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-[12px] font-black uppercase tracking-wider", cfg.text)}>{cfg.label}</p>
          <p className="text-[10px] text-slate-500 font-mono">{root}</p>
        </div>
        <Link to={root} className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border", cfg.badge, cfg.border)}>
          Open <ExternalLink size={9} />
        </Link>
      </div>
      {/* Routes */}
      <div className="p-3 grid grid-cols-1 gap-1.5 bg-white">
        {routes.map(r => (
          <RouteCard key={r.path} node={r} zone={zone} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SitemapWorkflow() {
  const [activeTab, setActiveTab] = useState<"workflow" | "routes" | "roles">("workflow");

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B75BC] flex items-center justify-center">
              <BarChart3 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">SM Travels ERP</p>
              <p className="text-xs text-slate-400">Sitemap & Workflow Reference</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 ml-4">
            {(["workflow", "routes", "roles"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize",
                  activeTab === tab
                    ? "bg-[#1B75BC] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                )}>
                {tab === "workflow" ? "Business Workflow" : tab === "routes" ? "Route Map" : "Role Access"}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
              <Home size={13} /> Website
            </Link>
            <Link to="/login" className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1B75BC] px-3 py-2 rounded-xl hover:bg-[#14588F] transition-all">
              <Shield size={13} /> Login Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ─── WORKFLOW TAB ─────────────────────────────────────────────── */}
        {activeTab === "workflow" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Business Workflow</h2>
              <p className="text-slate-500 text-sm">End-to-end flow from visitor acquisition to management reporting.</p>
            </div>

            {/* Main linear flow */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 overflow-x-auto">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Primary Flow</p>
              <div className="flex items-start gap-3 min-w-max">
                {WORKFLOW.map((step, i) => (
                  <React.Fragment key={step.id}>
                    <WorkflowStep step={step} />
                    {i < WORKFLOW.length - 1 && (
                      <div className="flex items-start mt-14">
                        <Arrow horizontal />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Sub-flows */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Entry channels */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Entry Channels</p>
                <div className="space-y-2">
                  {[
                    { label: "Organic Website Visit", icon: Globe, color: "#F15A24", action: "Book Now → /book" },
                    { label: "WhatsApp Inquiry", icon: MessageSquare, color: "#25D366", action: "CRM Lead (manual)" },
                    { label: "Walk-in / Phone", icon: Users, color: "#1B75BC", action: "CRM Lead (manual)" },
                    { label: "Agent Referral", icon: Briefcase, color: "#374151", action: "/agent portal → Lead" },
                    { label: "Email Campaign", icon: Mail, color: "#0891B2", action: "Landing → /book" },
                  ].map(ch => {
                    const Icon = ch.icon;
                    return (
                      <div key={ch.label} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50">
                        <Icon size={14} style={{ color: ch.color }} className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-slate-700 truncate">{ch.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{ch.action}</p>
                        </div>
                        <ArrowRight size={12} className="text-slate-300 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Service types */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Service Types</p>
                <div className="space-y-2">
                  {[
                    { label: "Hajj Package",     icon: Star,    color: "#F15A24", route: "/hajj" },
                    { label: "Umrah Package",    icon: MapPin,  color: "#7C3AED", route: "/umrah" },
                    { label: "Visa Processing",  icon: FileCheck, color: "#0891B2", route: "/visa" },
                    { label: "Air Ticket",       icon: Plane,   color: "#2563EB", route: "/air-ticket" },
                    { label: "Hotel Booking",    icon: Hotel,   color: "#EA580C", route: "/hotel-booking" },
                    { label: "Tour Package",     icon: Globe,   color: "#0E7C66", route: "/tour-packages" },
                    { label: "Manpower Abroad",  icon: Briefcase, color: "#374151", route: "/manpower" },
                  ].map(svc => {
                    const Icon = svc.icon;
                    return (
                      <Link key={svc.label} to={svc.route}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 group">
                        <Icon size={14} style={{ color: svc.color }} className="flex-shrink-0" />
                        <p className="text-[12px] font-semibold text-slate-700 flex-1">{svc.label}</p>
                        <ExternalLink size={11} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Payment types */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Payment Methods</p>
                <div className="space-y-2">
                  {[
                    { label: "Full Payment",       icon: CheckCircle, color: "#0E7C66", desc: "Invoice → single receipt" },
                    { label: "Installment Plan",   icon: CalendarDays, color: "#0891B2", desc: "Custom schedule + reminders" },
                    { label: "Bank Transfer",      icon: Landmark,    color: "#1B75BC", desc: "BEFTN / NPSB / RTGS" },
                    { label: "Mobile Banking",     icon: CreditCard,  color: "#7C3AED", desc: "bKash / Nagad / Rocket" },
                    { label: "Card Payment",       icon: CreditCard,  color: "#EA580C", desc: "Visa / Mastercard (gateway)" },
                    { label: "Agent Commission",   icon: TrendingUp,  color: "#F15A24", desc: "Auto-deducted on payment" },
                  ].map(pay => {
                    const Icon = pay.icon;
                    return (
                      <div key={pay.label} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100">
                        <Icon size={14} style={{ color: pay.color }} className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-slate-700">{pay.label}</p>
                          <p className="text-[10px] text-slate-400">{pay.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Portal connections */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Portal Access by Stakeholder</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { zone: "erp" as ZoneKey,       label: "Admin / Staff",   root: "/erp",        stakeholders: ["Super Admin", "Admin", "Executives"] },
                  { zone: "accountant" as ZoneKey, label: "Accountant",      root: "/accountant", stakeholders: ["Accountant", "Finance Mgr"] },
                  { zone: "staff" as ZoneKey,      label: "Field Staff",     root: "/staff",      stakeholders: ["Staff", "Coordinators"] },
                  { zone: "agent" as ZoneKey,      label: "B2B Agent",       root: "/agent",      stakeholders: ["Registered agents", "Sub-agents"] },
                  { zone: "supplier" as ZoneKey,   label: "Supplier",        root: "/supplier",   stakeholders: ["Hotels", "Transport", "Vendors"] },
                  { zone: "customer" as ZoneKey,   label: "Customer",        root: "/portal",     stakeholders: ["Registered pilgrims", "Travelers"] },
                ].map(p => {
                  const cfg = ZONE_CFG[p.zone];
                  return (
                    <Link key={p.root} to={p.root}
                      className={cn("flex flex-col gap-2 rounded-xl border-2 p-4 hover:shadow-md transition-all group", cfg.bg, cfg.border)}>
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", cfg.badge)}>
                        <div className={cn("w-2.5 h-2.5 rounded-full", cfg.dot)} />
                      </div>
                      <div>
                        <p className={cn("text-[12px] font-black", cfg.text)}>{p.label}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.root}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {p.stakeholders.map(s => (
                          <span key={s} className="text-[9px] text-slate-500">{s}</span>
                        ))}
                      </div>
                      <div className={cn("flex items-center gap-1 text-[10px] font-bold mt-auto", cfg.text)}>
                        Open portal <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── ROUTES TAB ───────────────────────────────────────────────── */}
        {activeTab === "routes" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Route Map</h2>
              <p className="text-slate-500 text-sm">All application routes, organized by zone. Click the arrow icon to navigate directly.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {ROUTE_TREE.map(z => (
                <ZonePanel key={z.zone} {...z} />
              ))}
            </div>
          </div>
        )}

        {/* ─── ROLES TAB ────────────────────────────────────────────────── */}
        {activeTab === "roles" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Role Access Matrix</h2>
              <p className="text-slate-500 text-sm">Which roles can access which areas of the system.</p>
            </div>

            {/* Role cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {ROLES_LEGEND.map(role => (
                <div key={role.label} className="rounded-2xl border border-slate-200 p-4 bg-white hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: role.bg }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                  </div>
                  <p className="text-[13px] font-black text-slate-800 mb-1">{role.label}</p>
                </div>
              ))}
            </div>

            {/* Access matrix table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="font-bold text-slate-800 text-sm">Access Matrix</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Area / Route</th>
                      {["Super Admin", "Admin", "Accountant", "Exec", "Agent", "Supplier", "Staff", "Customer"].map(r => (
                        <th key={r} className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { area: "Public Website (/)",    access: [1,1,1,1,1,1,1,1] },
                      { area: "ERP Dashboard (/erp)",  access: [1,1,0,1,0,0,0,0] },
                      { area: "CRM & Leads",           access: [1,1,0,1,0,0,0,0] },
                      { area: "Bookings Module",       access: [1,1,0,1,0,0,0,0] },
                      { area: "Packages & Services",   access: [1,1,0,0,0,0,0,0] },
                      { area: "Accounts (/accounts)",  access: [1,1,1,0,0,0,0,0] },
                      { area: "Invoices (/invoices)",  access: [1,1,1,1,0,0,0,0] },
                      { area: "Reports & BI",          access: [1,1,1,0,0,0,0,0] },
                      { area: "CMS",                   access: [1,1,0,0,0,0,0,0] },
                      { area: "Settings",              access: [1,0,0,0,0,0,0,0] },
                      { area: "Customer Portal",       access: [1,1,0,1,0,0,0,1] },
                      { area: "Agent Portal",          access: [1,1,0,0,1,0,0,0] },
                      { area: "Supplier Portal",       access: [1,1,0,0,0,1,0,0] },
                      { area: "Staff Portal",          access: [1,1,0,1,0,0,1,0] },
                      { area: "Accountant Portal",     access: [1,1,1,0,0,0,0,0] },
                    ].map(row => (
                      <tr key={row.area} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{row.area}</td>
                        {row.access.map((v, i) => (
                          <td key={i} className="px-3 py-3 text-center">
                            {v === 1
                              ? <CheckCircle size={15} className="text-emerald-500 mx-auto" />
                              : <div className="w-3 h-0.5 bg-slate-200 mx-auto rounded-full" />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Login flow */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Login → Portal Routing</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { from: "/login", label: "Login Screen", color: "#1B75BC" },
                  { from: null, label: "→ Role Select", color: "#374151" },
                ].concat(
                  [
                    { from: "/erp",        label: "Admin / Exec → /erp",         color: "#1B75BC" },
                    { from: "/accountant", label: "Accountant → /accountant",    color: "#0E7C66" },
                    { from: "/staff",      label: "Staff → /staff",              color: "#6D28D9" },
                    { from: "/agent",      label: "Agent → /agent",              color: "#374151" },
                    { from: "/supplier",   label: "Supplier → /supplier",        color: "#7C3AED" },
                    { from: "/portal",     label: "Customer → /portal",          color: "#2563EB" },
                  ]
                ).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {item.from ? (
                      <Link to={item.from}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 hover:border-[#1B75BC]/30 hover:shadow-sm transition-all bg-white group">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[12px] font-bold text-slate-700">{item.label}</span>
                        <ExternalLink size={10} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[12px] font-bold text-slate-500">{item.label}</span>
                      </div>
                    )}
                    {i === 1 && <div className="w-px h-8 bg-slate-200 mx-1" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
