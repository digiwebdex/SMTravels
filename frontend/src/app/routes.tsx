import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { ErpLayout } from "./erp/ErpLayout";
import { SuperAdminDashboard } from "./erp/SuperAdminDashboard";
import { BookingsModule } from "./erp/bookings/BookingsModule";
import { PackageManagementPage } from "./erp/PackageManagement";
import { ServicesConfigPage } from "./erp/ServicesConfig";
import { AccountsModule } from "./erp/AccountsModule";
import { InvoicesModule } from "./erp/InvoicesModule";
import { ReportsModule } from "./erp/ReportsModule";
import { DocumentsModule } from "./erp/DocumentsModule";
import { CommunicationsModule } from "./erp/CommunicationsModule";
import { ReportsBIModule } from "./erp/ReportsBIModule";
import { CmsModule } from "./erp/CmsModule";
import { OperationsModule } from "./erp/OperationsModule";
import { SettingsModule } from "./erp/SettingsModule";
import { CustomerPortal } from "./portal/CustomerPortal";
import { AgentPortal } from "./portal/AgentPortal";
import { SupplierPortal } from "./portal/SupplierPortal";
import { StaffPortal } from "./portal/StaffPortal";
import { AccountantPortal } from "./portal/AccountantPortal";
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
import { SitemapWorkflow } from "./pages/Sitemap";
import { DesignSystemPage } from "./pages/DesignSystem";

// Service page wrappers
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
    Component: ErpLayout,
    children: [
      { index: true, Component: SuperAdminDashboard },
      { path: "bookings", Component: BookingsModule },
      { path: "packages", Component: PackageManagementPage },
      { path: "services", Component: ServicesConfigPage },
      { path: "accounts", Component: AccountsModule },
      { path: "invoices", Component: InvoicesModule },
      { path: "reports", Component: ReportsModule },
      { path: "documents", Component: DocumentsModule },
      { path: "communications", Component: CommunicationsModule },
      { path: "reports-bi", Component: ReportsBIModule },
      { path: "cms", Component: CmsModule },
      { path: "ops", Component: OperationsModule },
      { path: "settings", Component: SettingsModule },
    ],
  },
  {
    path: "/sitemap",
    Component: SitemapWorkflow,
  },
  {
    path: "/ds",
    Component: DesignSystemPage,
  },
  {
    path: "/portal",
    Component: CustomerPortal,
  },
  {
    path: "/agent",
    Component: AgentPortal,
  },
  {
    path: "/supplier",
    Component: SupplierPortal,
  },
  {
    path: "/staff",
    Component: StaffPortal,
  },
  {
    path: "/accountant",
    Component: AccountantPortal,
  },
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
