/**
 * Business Network (Module 3) contract — "Companies We Work With". A relationship
 * directory (airlines/hotels/transport/visa/manpower/recruitment/local partners),
 * distinct from Supplier/Agent. Also hosts Mufti/Scholar in Module 4.
 */
import { z } from "zod";

export const businessPartnerStatuses = ["ACTIVE", "INACTIVE", "PROSPECT"] as const;

export const businessPartnerListQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z.string().trim().optional(),
  status: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});
export type BusinessPartnerListQuery = z.infer<typeof businessPartnerListQuerySchema>;

export const businessPartnerCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().max(80).optional(),
  industry: z.string().trim().max(120).optional(),
  country: z.string().trim().max(80).optional(),
  address: z.string().trim().max(500).optional(),
  contactPerson: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  email: z.string().trim().max(160).optional(),
  website: z.string().trim().max(200).optional(),
  services: z.string().trim().max(500).optional(),
  contractRef: z.string().trim().max(120).optional(),
  status: z.enum(businessPartnerStatuses).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type BusinessPartnerCreateInput = z.infer<typeof businessPartnerCreateSchema>;

export const businessPartnerUpdateSchema = businessPartnerCreateSchema.partial();
export type BusinessPartnerUpdateInput = z.infer<typeof businessPartnerUpdateSchema>;

export interface BusinessPartnerDto {
  id: string; code: string; name: string; type: string | null; industry: string | null;
  country: string | null; address: string | null; contactPerson: string | null;
  phone: string | null; whatsapp: string | null; email: string | null; website: string | null;
  services: string | null; contractRef: string | null; status: string; notes: string | null;
  createdAt: string;
}
export interface BusinessPartnerListResponse {
  items: BusinessPartnerDto[]; total: number; page: number; pageSize: number;
}
