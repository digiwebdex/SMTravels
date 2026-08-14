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
import { KnowledgePage, KnowledgeDetailPage } from "./pages/Knowledge";
import { ContactPage } from "./pages/Contact";
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
const MuallimModule = lazyNamed(() => import("./erp/MuallimModule"), "MuallimModule");
const CurrencyModule = lazyNamed(() => import("./erp/CurrencyModule"), "CurrencyModule");
const IntegrationsModule = lazyNamed(() => import("./erp/IntegrationsModule"), "IntegrationsModule");
const CompaniesModule = lazyNamed(() => import("./erp/CompaniesModule"), "CompaniesModule");
const MuftiScholarModule = lazyNamed(() => import("./erp/MuftiScholarModule"), "MuftiScholarModule");
const PayrollModule = lazyNamed(() => import("./erp/PayrollModule"), "PayrollModule");
const EmployersModule = lazyNamed(() => import("./erp/EmployersModule"), "EmployersModule");
const JobOrdersModule = lazyNamed(() => import("./erp/JobOrdersModule"), "JobOrdersModule");
const CandidatesModule = lazyNamed(() => import("./erp/CandidatesModule"), "CandidatesModule");
const RecruitmentModule = lazyNamed(() => import("./erp/RecruitmentModule"), "RecruitmentModule");
const MedicalModule = lazyNamed(() => import("./erp/MedicalModule"), "MedicalModule");
const BmetModule = lazyNamed(() => import("./erp/BmetModule"), "BmetModule");
const VisaModule = lazyNamed(() => import("./erp/VisaModule"), "VisaModule");
const DeploymentModule = lazyNamed(() => import("./erp/DeploymentModule"), "DeploymentModule");
const InquiriesModule = lazyNamed(() => import("./erp/InquiriesModule"), "InquiriesModule");
const QuotesModule = lazyNamed(() => import("./erp/QuotesModule"), "QuotesModule");
const SalesModule          = lazyNamed(() => import("./erp/SalesModule"), "SalesModule");
const SmsCenterModule      = lazyNamed(() => import("./erp/SmsCenterModule"), "SmsCenterModule");
const SettingsModule       = lazyNamed(() => import("./erp/SettingsModule"), "SettingsModule");
const HrModule             = lazyNamed(() => import("./erp/HrModule"), "HrModule");

// Portals
const CustomerPortal   = lazyNamed(() => import("./portal/CustomerPortal"), "CustomerPortal");
const AgentPortal      = lazyNamed(() => import("./portal/AgentPortal"), "AgentPortal");
const SupplierPortal   = lazyNamed(() => import("./portal/SupplierPortal"), "SupplierPortal");
const StaffPortal      = lazyNamed(() => import("./portal/StaffPortal"), "StaffPortal");
const AccountantPortal = lazyNamed(() => import("./portal/AccountantPortal"), "AccountantPortal");
const EmployeePortal   = lazyNamed(() => import("./portal/EmployeePortal"), "EmployeePortal");

// Standalone heavy pages
const SitemapWorkflow  = lazyNamed(() => import("./pages/Sitemap"), "SitemapWorkflow");
const DesignSystemPage = lazyNamed(() => import("./pages/DesignSystem"), "DesignSystemPage");
const PackagesPage = lazyNamed(() => import("./pages/Packages"), "PackagesPage");
const PackageDetailPage = lazyNamed(() => import("./pages/Packages"), "PackageDetailPage");
const BlogPage = lazyNamed(() => import("./pages/Blog"), "BlogPage");
const BlogDetailPage = lazyNamed(() => import("./pages/Blog"), "BlogDetailPage");
const GalleryPage = lazyNamed(() => import("./pages/Gallery"), "GalleryPage");
const FAQPage = lazyNamed(() => import("./pages/FAQ"), "FAQPage");
const BookingPage = lazyNamed(() => import("./pages/Booking"), "BookingPage");
const LoginPage = lazyNamed(() => import("./pages/Auth"), "LoginPage");
const RegisterPage = lazyNamed(() => import("./pages/Auth"), "RegisterPage");
const PrivacyPage = lazyNamed(() => import("./pages/CmsPages"), "PrivacyPage");
const TermsPage = lazyNamed(() => import("./pages/CmsPages"), "TermsPage");
const RefundPage = lazyNamed(() => import("./pages/CmsPages"), "RefundPage");
const CareerPage = lazyNamed(() => import("./pages/CmsPages"), "CareerPage");
const BranchesPage = lazyNamed(() => import("./pages/CmsPages"), "BranchesPage");
const TestimonialsPage = lazyNamed(() => import("./pages/CmsPages"), "TestimonialsPage");
const VideosPage = lazyNamed(() => import("./pages/CmsPages"), "VideosPage");


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
function TransportPage() { return <ServicePage serviceId="transport" />; }

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
      { path: "sales", element: withSuspense(<SalesModule />) },
      { path: "sms", element: withSuspense(<SmsCenterModule />) },
      { path: "whatsapp", element: <ComingSoon k="whatsapp" group="communication" /> },
      { path: "ocr", element: <ComingSoon k="ocr" group="operations" /> },
      // HR: use the real HrModule from the RC branch (supersedes the ComingSoon placeholder).
      { path: "hr", element: withSuspense(<HrModule />) },
      // Phase 2 final-menu placeholders — nav home + RBAC only, functionality lands in later phases.
      { path: "muallim", element: withSuspense(<MuallimModule />) },
      { path: "manpower/job-orders", element: withSuspense(<JobOrdersModule />) },
      { path: "manpower/candidates", element: withSuspense(<CandidatesModule />) },
      { path: "manpower/employers", element: withSuspense(<EmployersModule />) },
      { path: "manpower/recruitment", element: withSuspense(<RecruitmentModule />) },
      { path: "manpower/visa", element: withSuspense(<VisaModule />) },
      { path: "manpower/medical", element: withSuspense(<MedicalModule />) },
      { path: "manpower/bmet", element: withSuspense(<BmetModule />) },
      { path: "manpower/deployment", element: withSuspense(<DeploymentModule />) },
      { path: "network/companies", element: withSuspense(<CompaniesModule />) },
      { path: "network/scholars", element: withSuspense(<MuftiScholarModule />) },
      { path: "hr/payroll", element: withSuspense(<PayrollModule />) },
      { path: "settings/currency", element: withSuspense(<CurrencyModule />) },
      { path: "integrations", element: withSuspense(<IntegrationsModule />) },
      { path: "packages/inquiries", element: withSuspense(<InquiriesModule />) },
      { path: "packages/quotes", element: withSuspense(<QuotesModule />) },
    ],
  },
  { path: "/sitemap", element: withSuspense(<SitemapWorkflow />) },
  { path: "/ds", element: withSuspense(<DesignSystemPage />) },
  { path: "/portal", element: guard(["CUSTOMER"], <CustomerPortal />) },
  { path: "/agent", element: guard(["AGENT"], <AgentPortal />) },
  { path: "/supplier", element: guard(["SUPPLIER"], <SupplierPortal />) },
  { path: "/staff", element: guard(["STAFF"], <StaffPortal />) },
  { path: "/accountant", element: guard(["ACCOUNTANT"], <AccountantPortal />) },
  // Employee self-service: any internal role that can carry an HR employee link.
  { path: "/employee", element: guard(ERP_ROLES, <EmployeePortal />) },
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
      { path: "packages", element: withSuspense(<PackagesPage />) },
      { path: "packages/:id", element: withSuspense(<PackageDetailPage />) },
      { path: "blog", element: withSuspense(<BlogPage />) },
      { path: "blog/:id", element: withSuspense(<BlogDetailPage />) },
      { path: "gallery", element: withSuspense(<GalleryPage />) },
      { path: "videos", element: withSuspense(<VideosPage />) },
      { path: "knowledge", Component: KnowledgePage },
      { path: "knowledge/:slug", Component: KnowledgeDetailPage },
      { path: "faq", element: withSuspense(<FAQPage />) },
      { path: "contact", Component: ContactPage },
      { path: "privacy", element: withSuspense(<PrivacyPage />) },
      { path: "terms", element: withSuspense(<TermsPage />) },
      { path: "refund", element: withSuspense(<RefundPage />) },
      { path: "career", element: withSuspense(<CareerPage />) },
      { path: "branches", element: withSuspense(<BranchesPage />) },
      { path: "testimonials", element: withSuspense(<TestimonialsPage />) },
      { path: "hotels", Component: HotelBookingPage },
      { path: "transport", Component: TransportPage },
      { path: "book", element: withSuspense(<BookingPage />) },
      { path: "login", element: withSuspense(<LoginPage />) },
      { path: "register", element: withSuspense(<RegisterPage />) },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
