/**
 * Operations Team roster ADMIN contract. Muallim / guide / imam / medical / driver
 * / coordinator crew.
 *
 * Scope: nullable branchId — null = global/shared crew (e.g. a Makkah muallim
 * serving every branch); set = branch-local staff. Branch users see own + global;
 * global roles see all. Assignment to a batch carries the branch via
 * DepartureBatch.branchId; the muallim link (batch.muallimId) resolves to the
 * canonical roster row and snapshots its name/number onto the batch.
 *
 * passportNo is PII: encrypted at rest (AES-GCM) + HMAC blind index, decrypted only
 * on authorized read; never returned in the list (PII minimization).
 */
import { z } from "zod";

export const opsRoleTypeSchema = z.enum(["MUALLIM", "GUIDE", "IMAM", "MEDICAL", "DRIVER", "COORDINATOR", "OTHER"]);
export const opsMemberStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]);

const optStr = z.string().trim().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

export const opsListQuerySchema = z.object({
  q: z.string().trim().optional(),
  roleType: opsRoleTypeSchema.optional(),
  status: opsMemberStatusSchema.optional(),
  branchId: z.string().trim().optional(), // global roles: "global" = shared crew only, or a branch id, else all
});
export type OpsListQuery = z.infer<typeof opsListQuerySchema>;

export const opsMemberCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  roleType: opsRoleTypeSchema,
  branchId: z.string().trim().optional(), // empty/absent = global (null); a branch id = branch-local
  phone: optStr,
  email: z.string().trim().email().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  nationality: optStr,
  baseLocation: optStr,
  languages: optStr,
  licenseNo: optStr,
  passportNo: optStr, // PII — encrypted at rest
  rating: z.number().min(0).max(5).optional(),
  status: opsMemberStatusSchema.optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});
export type OpsMemberCreateInput = z.infer<typeof opsMemberCreateSchema>;

export const opsMemberUpdateSchema = opsMemberCreateSchema.partial();
export type OpsMemberUpdateInput = z.infer<typeof opsMemberUpdateSchema>;

// The muallim → batch link is assigned through the batch (hajjops) create/update
// via its `muallimId` field, which resolves to a roster row and snapshots name/no.

// ── DTOs ──────────────────────────────────────────────────────────────────────
export interface OpsMemberListItem {
  id: string;
  memberCode: string;
  name: string;
  roleType: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  baseLocation: string | null;
  languages: string | null;
  licenseNo: string | null;
  rating: number | null;
  status: string;
  branchId: string | null;
  branchName: string | null;
  isGlobal: boolean;      // branchId === null
  createdAt: string;
}
export interface OpsMemberListResponse {
  data: OpsMemberListItem[];
  stats: { total: number; global: number; branchScoped: number; byRole: Record<string, number>; byStatus: Record<string, number> };
}

export interface OpsAssignedBatch {
  id: string; code: string; name: string; serviceType: string;
  departureDate: string | null; branchId: string; branchName: string | null;
}
export interface OpsMemberDetail extends OpsMemberListItem {
  passportNo: string | null; // decrypted for an authorized viewer; excluded from the list
  notes: string | null;
  assignedBatches: OpsAssignedBatch[]; // batches this member is the linked muallim of
}
