import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  PayrollRunListResponse, PayrollRunDetailDto, PayrollRunDto,
  PayrollRunCreateInput, PayslipUpdateInput,
} from "@contracts/payroll.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export const usePayrollRuns = (status?: string, year?: number) =>
  useQuery({
    queryKey: ["payroll", "runs", status ?? "all", year ?? "all"],
    queryFn: () => {
      const s = new URLSearchParams();
      if (status) s.set("status", status);
      if (year) s.set("year", String(year));
      return apiFetch<PayrollRunListResponse>(`/payroll/runs?${s.toString()}`);
    },
    staleTime: 20_000,
  });

export const usePayrollRun = (id: string | null) =>
  useQuery({
    queryKey: ["payroll", "run", id ?? ""],
    queryFn: () => apiFetch<PayrollRunDetailDto>(`/payroll/runs/${id}`),
    enabled: !!id,
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>, id?: string) => {
  qc.invalidateQueries({ queryKey: ["payroll", "runs"] });
  if (id) qc.invalidateQueries({ queryKey: ["payroll", "run", id] });
};

export function useCreatePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayrollRunCreateInput) => apiFetch<PayrollRunDto>("/payroll/runs", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (d) => { invalidate(qc); toast.success(`${d.code} created`); },
    onError: err,
  });
}

function action(path: string, msg: string) {
  return function useAction() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => apiFetch<PayrollRunDetailDto>(`/payroll/runs/${id}/${path}`, { method: "POST" }),
      onSuccess: (d) => { invalidate(qc, d.id); toast.success(msg); },
      onError: err,
    });
  };
}
export const useCalculatePayrollRun = action("calculate", "Payroll calculated");
export const useApprovePayrollRun = action("approve", "Payroll approved");
export const useMarkPayrollRunPaid = action("pay", "Payroll marked paid");
export const useClosePayrollRun = action("close", "Payroll closed");

export function useUpdatePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PayslipUpdateInput }) =>
      apiFetch<PayrollRunDetailDto>(`/payroll/payslips/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (d) => { invalidate(qc, d.id); },
    onError: err,
  });
}
