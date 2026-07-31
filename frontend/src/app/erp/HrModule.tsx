import { useSearchParams } from "react-router";
import {
  LayoutDashboard, Users, Building2, FolderOpen, CalendarDays,
  PartyPopper, Clock3, BarChart3, type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { ModulePage } from "../design-system/patterns/ModulePage";
import { DashboardView } from "./hr/DashboardView";
import { EmployeesView } from "./hr/EmployeesView";
import { OrganizationView } from "./hr/OrganizationView";
import { DocumentsView } from "./hr/DocumentsView";
import { LeaveView } from "./hr/LeaveView";
import { HolidaysView } from "./hr/HolidaysView";
import { AttendanceView } from "./hr/AttendanceView";
import { ReportsView } from "./hr/ReportsView";

type Segment = "dashboard" | "employees" | "organization" | "documents" | "leave" | "holidays" | "attendance" | "reports";

const SEGMENTS: { key: Segment; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "employees", label: "Employees", icon: Users },
  { key: "organization", label: "Organization", icon: Building2 },
  { key: "documents", label: "Documents", icon: FolderOpen },
  { key: "leave", label: "Leave", icon: CalendarDays },
  { key: "holidays", label: "Holidays", icon: PartyPopper },
  { key: "attendance", label: "Attendance", icon: Clock3 },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

const SEGMENT_SUBTITLE: Record<Segment, string> = {
  dashboard: "Headcount, leave, and document health at a glance",
  employees: "Employee directory, profiles, and lifecycle status",
  organization: "Departments, sections, teams, and designations",
  documents: "Employee document uploads and expiry tracking",
  leave: "Leave types, requests, and approvals",
  holidays: "Company holiday calendar",
  attendance: "Daily attendance and correction requests",
  reports: "Export HR reports as CSV, Excel, or PDF",
};

function parseTab(raw: string | null): Segment {
  const valid: Segment[] = ["dashboard", "employees", "organization", "documents", "leave", "holidays", "attendance", "reports"];
  return (valid as string[]).includes(raw ?? "") ? (raw as Segment) : "dashboard";
}

export function HrModule() {
  const [params, setParams] = useSearchParams();
  const seg = parseTab(params.get("tab"));

  const setSeg = (key: Segment) => {
    const next = new URLSearchParams(params);
    next.set("tab", key);
    setParams(next, { replace: true });
  };

  return (
    <div className="p-5 md:p-7">
      <ModulePage
        title="Human Resources"
        subtitle={SEGMENT_SUBTITLE[seg]}
        filters={
          <div className="inline-flex flex-wrap items-center bg-[var(--color-bg)] rounded-[var(--radius-md)] p-1">
            {SEGMENTS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setSeg(s.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 h-9 rounded-[var(--radius-sm)] text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap",
                    seg === s.key
                      ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--elevation-1)]"
                      : "text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]",
                  )}
                >
                  <Icon size={14} /> {s.label}
                </button>
              );
            })}
          </div>
        }
      >
        {seg === "dashboard" && <DashboardView onGoEmployees={() => setSeg("employees")} />}
        {seg === "employees" && <EmployeesView />}
        {seg === "organization" && <OrganizationView />}
        {seg === "documents" && <DocumentsView />}
        {seg === "leave" && <LeaveView />}
        {seg === "holidays" && <HolidaysView />}
        {seg === "attendance" && <AttendanceView />}
        {seg === "reports" && <ReportsView />}
      </ModulePage>
    </div>
  );
}
