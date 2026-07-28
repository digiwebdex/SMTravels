import { createBrowserRouter } from "react-router";
import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { SkeletonPage } from "./lib/ds";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { ERP_ROLES, type Role } from "./auth/roles";
import { ComingSoon } from "./erp/ComingSoon"; // tiny placeholder; direct import keeps its props typed

// ── Eager: public website (the landing path — must load fast) ────────────────
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { ServicePage } from "./pages/ServicePage";
import { PackagesPage, PackageDetailPage } from "./pages/Packages";
import { BlogPage, BlogDetailPage } from "./pages/Blog";
import { GalleryPage } from "./pages/Gallery";
import { FAQPage } from "./pages/FAQ";
import { ContactPage } from "./pages/Contact";
import { BookingPage } from "./pages/Booking";
import { LoginPage, RegisterPage } from "./pages/Auth";
import { NotFoundPage } from "./pages/NotFound";

// ── Lazy: heavy app sections (each becomes its own chunk, loaded on demand) ──
function lazyNamed<M, N extends keyof M>(factory: () => Promise<M>, name: N) {
  return lazy(() =>
    factory().then((m) => ({ default: m[name] as unknown as ComponentType })),
  );
}

// ERP shell + modules
const ErpLayout            = lazyNamed(() => import("./erp/ErpLayout"), "ErpLayout");
const SuperAdminDashboard  = lazyNamed(() => import("./erp/SuperAdminDashboard"), "SuperAdminDashboard");
const CrmModule            = lazyNamed(() => import("./erp/CrmModule"), "CrmModule");
const BookingsModule       = lazyNamed(() => import("./erp/bookings/BookingsModule"), "BookingsModule");
const PackageManagementPage = lazyNamed(() => import("./erp/PackageManagement"), "PackageManagementPage");
const ServicesConfigPage   = lazyNamed(() => import("./erp/ServicesConfig"), "ServicesConfigPage");
const AccountsModule       = lazyNamed(() => import("./erp/AccountsModule"), "AccountsModule");
const InvoicesModule       = lazyNamed(() => import("./erp/InvoicesModule"), "InvoicesModule");
const ReportsModule        = lazyNamed(() => import("./erp/ReportsModule"), "ReportsModule");
const DocumentsModule      = lazyNamed(() => import("./erp/DocumentsModule"), "DocumentsModule");
const CommunicationsModule = lazyNamed(() => import("./erp/CommunicationsModule"), "CommunicationsModule");
const ReportsBIModule      = lazyNamed(() => import("./erp/ReportsBIModule"), "ReportsBIModule");
const CmsModule            = lazyNamed(() => import("./erp/CmsModule"), "CmsModule");
const OperationsModule     = lazyNamed(() => import("./erp/OperationsModule"), "OperationsModule");
const HajjOpsModule        = lazyNamed(() => import("./erp/HajjOpsModule"), "HajjOpsModule");
const PartnersModule       = lazyNamed(() => import("./erp/PartnersModule"), "PartnersModule");
const SuppliersModule      = lazyNamed(() => import("./erp/SuppliersModule"), "SuppliersModule");
const OperationsTeamModule = lazyNamed(() => import("./erp/OperationsTeamModule"), "OperationsTeamModule");
const SettingsModule       = lazyNamed(() => import("./erp/SettingsModule"), "SettingsModule");

// Portals
const CustomerPortal   = lazyNamed(() => import("./portal/CustomerPortal"), "CustomerPortal");
const AgentPortal      = lazyNamed(() => import("./portal/AgentPortal"), "AgentPortal");
const SupplierPortal   = lazyNamed(() => import("./portal/SupplierPortal"), "SupplierPortal");
const StaffPortal      = lazyNamed(() => import("./portal/StaffPortal"), "StaffPortal");
const AccountantPortal = lazyNamed(() => import("./portal/AccountantPortal"), "AccountantPortal");

// Standalone heavy pages
const SitemapWorkflow  = lazyNamed(() => import("./pages/Sitemap"), "SitemapWorkflow");
const DesignSystemPage = lazyNamed(() => import("./pages/DesignSystem"), "DesignSystemPage");

// Suspense wrapper using the app's EXISTING full-page skeleton (no new spinner)
const withSuspense = (el: ReactNode): ReactNode => (
  <Suspense fallback={<SkeletonPage />}>{el}</Suspense>
);

// Role-gate a subtree, then lazy-load it. ProtectedRoute handles the loading/
// anon/wrong-role cases before the chunk is ever fetched.
const guard = (allow: Role[], el: ReactNode): ReactNode => (
  <ProtectedRoute allow={allow}>{withSuspense(el)}</ProtectedRoute>
);

// ── Service page wrappers (eager, tiny) ──────────────────────────────────────
function HajjPage() { return <ServicePage serviceId="hajj" />; }
function UmrahPage() { return <ServicePage serviceId="umrah" />; }
function VisaPage() { return <ServicePage serviceId="visa" />; }
function AirTicketPage() { return <ServicePage serviceId="air-ticket" />; }
function ManpowerPage() { return <ServicePage serviceId="manpower" />; }
function TourPackagesPage() { return <ServicePage serviceId="tour-packages" />; }
function HotelBookingPage() { return <ServicePage serviceId="hotel-booking" />; }

export const router = createBrowserRouter([
  {
    path: "/erp",
    element: guard(ERP_ROLES, <ErpLayout />),
    children: [
      { index: true, element: withSuspense(<SuperAdminDashboard />) },
      { path: "crm", element: withSuspense(<CrmModule />) },
      { path: "bookings", element: withSuspense(<BookingsModule />) },
      { path: "packages", element: withSuspense(<PackageManagementPage />) },
      { path: "services", element: withSuspense(<ServicesConfigPage />) },
      { path: "accounts", element: withSuspense(<AccountsModule />) },
      { path: "invoices", element: withSuspense(<InvoicesModule />) },
      { path: "reports", element: withSuspense(<ReportsModule />) },
      { path: "documents", element: withSuspense(<DocumentsModule />) },
      { path: "communications", element: withSuspense(<CommunicationsModule />) },
      { path: "reports-bi", element: withSuspense(<ReportsBIModule />) },
      { path: "cms", element: withSuspense(<CmsModule />) },
      { path: "ops", element: withSuspense(<OperationsModule />) },
      { path: "hajj-ops", element: withSuspense(<HajjOpsModule />) },
      { path: "settings", element: withSuspense(<SettingsModule />) },
      { path: "partners", element: withSuspense(<PartnersModule />) },
      // Step 3 placeholders — nav home + RBAC module, no functionality yet.
      { path: "suppliers", element: withSuspense(<SuppliersModule />) },
      { path: "ops-team", element: withSuspense(<OperationsTeamModule />) },
      { path: "hotels", element: <ComingSoon k="hotels" group="partners" /> },
      { path: "transport", element: <ComingSoon k="transport" group="partners" /> },
      { path: "sales", element: <ComingSoon k="sales" group="finance" /> },
      { path: "marketing", element: <ComingSoon k="marketing" group="communication" /> },
      { path: "sms", element: <ComingSoon k="sms" group="communication" /> },
      { path: "whatsapp", element: <ComingSoon k="whatsapp" group="communication" /> },
      { path: "ocr", element: <ComingSoon k="ocr" group="operations" /> },
      { path: "hr", element: <ComingSoon k="hr" group="admin" /> },
      { path: "integrations", element: <ComingSoon k="integrations" group="admin" /> },
      { path: "ai", element: <ComingSoon k="ai" group="admin" /> },
    ],
  },
  { path: "/sitemap", element: withSuspense(<SitemapWorkflow />) },
  { path: "/ds", element: withSuspense(<DesignSystemPage />) },
  { path: "/portal", element: guard(["CUSTOMER"], <CustomerPortal />) },
  { path: "/agent", element: guard(["AGENT"], <AgentPortal />) },
  { path: "/supplier", element: guard(["SUPPLIER"], <SupplierPortal />) },
  { path: "/staff", element: guard(["STAFF"], <StaffPortal />) },
  { path: "/accountant", element: guard(["ACCOUNTANT"], <AccountantPortal />) },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "hajj", Component: HajjPage },
      { path: "umrah", Component: UmrahPage },
      { path: "visa", Component: VisaPage },
      { path: "air-ticket", Component: AirTicketPage },
      { path: "manpower", Component: ManpowerPage },
      { path: "tour-packages", Component: TourPackagesPage },
      { path: "hotel-booking", Component: HotelBookingPage },
      { path: "packages", Component: PackagesPage },
      { path: "packages/:id", Component: PackageDetailPage },
      { path: "blog", Component: BlogPage },
      { path: "blog/:id", Component: BlogDetailPage },
      { path: "gallery", Component: GalleryPage },
      { path: "faq", Component: FAQPage },
      { path: "contact", Component: ContactPage },
      { path: "book", Component: BookingPage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
