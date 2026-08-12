import { z } from "zod";

/** Company profile (singleton) — the admin Settings → Company panel. */
export const companyUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  legalName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  website: z.string().trim().optional(),
  logoUrl: z.string().optional(), // data-URI or URL
  primaryColor: z.string().optional(),
});
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;

export interface CompanyDto {
  id: string;
  name: string;
  legalName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
}
