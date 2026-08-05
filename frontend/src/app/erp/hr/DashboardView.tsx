import { Users, Building2, CalendarCheck, Clock, Cake, FileWarning, UserPlus } from "lucide-react";
import { AiInsightCard } from "../../design-system/ai/AiInsightCard";
import { ErrorBanner, SkeletonKpi } from "../../lib/ds";
import { useHrDashboard } from "../../hooks/hr";
import { Card, StatCards, fmtDate } from "./ui";

export function DashboardView({ onGoEmployees }: { onGoEmployees: () => void }) {
  const { data, isLoading, isError, error, refetch } = useHrDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}
      </div>
    );
  }
  if (isError || !data) {
    return <Card className="p-6"><ErrorBanner message={(error as Error)?.message || "Failed to load the HR dashboard."} onRetry={() => refetch()} /></Card>;
  }

  const insights: string[] = [];
  if (data.pendingLeave > 0) insights.push(`${data.pendingLeave} leave request${data.pendingLeave === 1 ? "" : "s"} awaiting approval.`);
  if (data.expiringDocuments.length > 0) insights.push(`${data.expiringDocuments.length} employee document${data.expiringDocuments.length === 1 ? "" : "s"} expiring within 30 days.`);
  if (data.upcomingConfirmations.length > 0) insights.push(`${data.upcomingConfirmations.length} confirmation${data.upcomingConfirmations.length === 1 ? "" : "s"} due soon — review probation status.`);
  if (insights.length === 0) insights.push("No urgent HR actions right now — everything looks up to date.");

  return (
    <div className="space-y-5">
      <StatCards items={[
        { label: "Employees", value: String(data.employeesCount), icon: Users, color: "#1B75BC", bg: "#EEF2FF" },
        { label: "Departments", value: String(data.departmentsCount), icon: Building2, color: "#0E7C66", bg: "#ECFDF5" },
        { label: "Present Today", value: String(data.attendanceToday), icon: CalendarCheck, color: "#F15A24", bg: "#FFF9E6" },
        { label: "On Leave Today", value: String(data.leaveToday), icon: Clock, color: "#7C3AED", bg: "#F5F3FF" },
      ]} />

      <AiInsightCard title="HR Insights" collapsedByDefault={false}>
        <ul className="text-xs space-y-1.5 list-disc pl-4">
          {insights.map((i, idx) => <li key={idx}>{i}</li>)}
        </ul>
      </AiInsightCard>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-black text-[var(--color-text)] flex items-center gap-2"><UserPlus size={14} className="text-[#1B75BC]" /> Recent Joiners</h3>
            <button onClick={onGoEmployees} className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {data.recentJoiners.length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] py-3 text-center">No new joiners in the last 30 days.</p>}
            {data.recentJoiners.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-[12px] py-1.5 border-b border-[var(--color-border-subtle)] last:border-0">
                <div>
                  <p className="font-semibold text-[var(--color-text)]">{e.name}</p>
                  <p className="text-[10px] text-[var(--color-text-faint)]">{e.departmentName ?? "—"}</p>
                </div>
                <span className="text-[10px] text-[var(--color-text-faint)]">{fmtDate(e.joiningDate)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[13px] font-black text-[var(--color-text)] flex items-center gap-2 mb-3"><Cake size={14} className="text-[#F15A24]" /> Upcoming Birthdays</h3>
          <div className="space-y-2">
            {data.upcomingBirthdays.length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] py-3 text-center">No birthdays in the next 30 days.</p>}
            {data.upcomingBirthdays.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-[12px] py-1.5 border-b border-[var(--color-border-subtle)] last:border-0">
                <p className="font-semibold text-[var(--color-text)]">{e.name}</p>
                <span className="text-[10px] text-[var(--color-text-faint)]">{e.daysAway === 0 ? "Today" : `in ${e.daysAway}d`}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[13px] font-black text-[var(--color-text)] flex items-center gap-2 mb-3"><FileWarning size={14} className="text-[#DC2626]" /> Expiring Documents</h3>
          <div className="space-y-2">
            {data.expiringDocuments.length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] py-3 text-center">No documents expiring soon.</p>}
            {data.expiringDocuments.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-[12px] py-1.5 border-b border-[var(--color-border-subtle)] last:border-0">
                <div>
                  <p className="font-semibold text-[var(--color-text)]">{d.title}</p>
                  <p className="text-[10px] text-[var(--color-text-faint)]">{d.employeeName} · {d.type.replace(/_/g, " ")}</p>
                </div>
                <span className="text-[10px] text-[#DC2626] font-semibold">{fmtDate(d.expiryDate)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[13px] font-black text-[var(--color-text)] flex items-center gap-2 mb-3"><Clock size={14} className="text-[#7C3AED]" /> Confirmations Due</h3>
          <div className="space-y-2">
            {data.upcomingConfirmations.length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] py-3 text-center">No confirmations due in the next 30 days.</p>}
            {data.upcomingConfirmations.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-[12px] py-1.5 border-b border-[var(--color-border-subtle)] last:border-0">
                <p className="font-semibold text-[var(--color-text)]">{e.name}</p>
                <span className="text-[10px] text-[var(--color-text-faint)]">{fmtDate(e.dueDate)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
