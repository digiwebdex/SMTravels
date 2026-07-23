import { useState } from "react";
import { Users, UserCircle, Building2 } from "lucide-react";
import { cn } from "../lib/utils";
import { LeadsView } from "./crm/LeadsView";
import { CustomersView } from "./crm/CustomersView";
import { CorporateView } from "./crm/CorporateView";

type Segment = "leads" | "customers" | "corporate";

const SEGMENTS: { key: Segment; label: string; icon: React.FC<{ size?: number }> }[] = [
  { key: "leads", label: "Leads", icon: Users },
  { key: "customers", label: "Customers", icon: UserCircle },
  { key: "corporate", label: "Corporate", icon: Building2 },
];

export function CrmModule() {
  const [seg, setSeg] = useState<Segment>("leads");
  return (
    <div className="p-5 md:p-7">
      {/* segmented control */}
      <div className="inline-flex items-center bg-[#F3F4F6] rounded-[10px] p-1 mb-5">
        {SEGMENTS.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.key} onClick={() => setSeg(s.key)}
              className={cn("flex items-center gap-1.5 px-4 h-9 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer",
                seg === s.key ? "bg-white text-[#1B75BC] shadow" : "text-[#9CA3AF] hover:text-[#374151]")}>
              <Icon size={14} /> {s.label}
            </button>
          );
        })}
      </div>

      {seg === "leads" && <LeadsView />}
      {seg === "customers" && <CustomersView />}
      {seg === "corporate" && <CorporateView />}
    </div>
  );
}
