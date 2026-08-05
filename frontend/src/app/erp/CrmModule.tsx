import { useSearchParams } from "react-router";
import { Users, UserCircle, Building2, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { ModulePage } from "../design-system/patterns/ModulePage";
import { LeadsView } from "./crm/LeadsView";
import { CustomersView } from "./crm/CustomersView";
import { CorporateView } from "./crm/CorporateView";

type Segment = "leads" | "customers" | "corporate";

const SEGMENTS: { key: Segment; label: string; icon: LucideIcon }[] = [
  { key: "leads", label: "Leads", icon: Users },
  { key: "customers", label: "Customers", icon: UserCircle },
  { key: "corporate", label: "Corporate", icon: Building2 },
];

const SEGMENT_SUBTITLE: Record<Segment, string> = {
  leads: "Pipeline, follow-ups, and lead conversion",
  customers: "Individual customer accounts and history",
  corporate: "B2B and corporate client relationships",
};

function parseTab(raw: string | null): Segment {
  if (raw === "customers" || raw === "corporate" || raw === "leads") return raw;
  return "leads";
}

export function CrmModule() {
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
        title="CRM"
        subtitle={SEGMENT_SUBTITLE[seg]}
        filters={
          <div className="inline-flex items-center bg-[var(--color-bg)] rounded-[var(--radius-md)] p-1">
            {SEGMENTS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setSeg(s.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 h-9 rounded-[var(--radius-sm)] text-[12px] font-bold transition-all cursor-pointer",
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
        {seg === "leads" && <LeadsView />}
        {seg === "customers" && <CustomersView />}
        {seg === "corporate" && <CorporateView />}
      </ModulePage>
    </div>
  );
}
