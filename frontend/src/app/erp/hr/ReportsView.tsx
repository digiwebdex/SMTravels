import React, { useState } from "react";
import { Download, Users, UserPlus, Building2, CalendarCheck, CalendarDays, ShieldCheck, Cake, FileWarning } from "lucide-react";
import { downloadHrReport, type HrReportKey, type HrReportFormat } from "../../hooks/hr";
import { Card, selectCls } from "./ui";

const REPORTS: { key: HrReportKey; label: string; desc: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { key: "employees", label: "Employee Directory", desc: "Full roster with contact & org details.", icon: Users },
  { key: "joining", label: "Joining Report", desc: "New hires within a date range.", icon: UserPlus },
  { key: "department", label: "Department Headcount", desc: "Staff distribution by department.", icon: Building2 },
  { key: "attendance", label: "Attendance Report", desc: "Daily attendance log.", icon: CalendarCheck },
  { key: "leave", label: "Leave Report", desc: "Leave requests and balances.", icon: CalendarDays },
  { key: "confirmation", label: "Confirmation Due", desc: "Employees due for confirmation.", icon: ShieldCheck },
  { key: "birthday", label: "Birthday Report", desc: "Upcoming employee birthdays.", icon: Cake },
  { key: "document-expiry", label: "Document Expiry", desc: "Documents nearing expiry.", icon: FileWarning },
];

function ReportCard({ report }: { report: (typeof REPORTS)[number] }) {
  const [format, setFormat] = useState<HrReportFormat>("csv");
  const [downloading, setDownloading] = useState(false);
  const Icon = report.icon;

  const download = async () => {
    setDownloading(true);
    try {
      await downloadHrReport(report.key, format);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-primary-tint)] flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-[var(--color-primary)]" />
        </div>
        <div className="min-w-0">
          <p className="text-[12.5px] font-black text-[var(--color-text)]">{report.label}</p>
          <p className="text-[10.5px] text-[var(--color-text-faint)]">{report.desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select value={format} onChange={(e) => setFormat(e.target.value as HrReportFormat)} className={`${selectCls} h-9 flex-1`}>
          <option value="csv">CSV</option>
          <option value="xlsx">Excel (XLSX)</option>
          <option value="pdf">PDF</option>
        </select>
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          className="flex items-center gap-1.5 h-9 px-3 bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-[var(--radius-sm)] text-[12px] font-bold hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer disabled:opacity-60 flex-shrink-0"
        >
          <Download size={13} /> {downloading ? "…" : "Export"}
        </button>
      </div>
    </Card>
  );
}

export function ReportsView() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {REPORTS.map((r) => <ReportCard key={r.key} report={r} />)}
    </div>
  );
}
