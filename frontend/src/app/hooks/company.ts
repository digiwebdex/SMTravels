import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type { CompanyDto, CompanyUpdateInput } from "@contracts/company.contract";

export function useCompany() {
  return useQuery({ queryKey: ["company"], queryFn: () => apiFetch<CompanyDto>("/company") });
}
export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CompanyUpdateInput) => apiFetch<CompanyDto>("/company", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["company"] }); toast.success("Company updated"); },
    onError: (e: Error) => toast.error(e.message || "Something went wrong"),
  });
}
