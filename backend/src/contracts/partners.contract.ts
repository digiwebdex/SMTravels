/**
 * Partners (B2B / sub-agent) ADMIN contract. Read-heavy admin view over the
 * existing Agent / AgentWallet / WalletTransaction / AgentCommission models.
 *
 * The wallet ledger is IMMUTABLE (CREDIT/DEBIT append + reverse only) — there is
 * NO mutating wallet endpoint here. The only writes are commission-tier and
 * status changes on the agent record. All lists are branch-scoped in the service.
 */
import { z } from "zod";

export const agentTierSchema = z.enum(["SILVER", "GOLD", "PLATINUM"]);
export const agentStatusSchema = z.enum(["active", "inactive", "suspended"]);

export const partnerListQuerySchema = z.object({
  q: z.string().trim().optional(),
  tier: agentTierSchema.optional(),
  status: z.string().trim().optional(),
  branchId: z.string().trim().optional(),
});
export type PartnerListQuery = z.infer<typeof partnerListQuerySchema>;

// tier assignment + status management — the ONLY writes in this module
export const partnerUpdateSchema = z.object({
  tier: agentTierSchema.optional(),
  status: agentStatusSchema.optional(),
});
export type PartnerUpdateInput = z.infer<typeof partnerUpdateSchema>;

export interface PartnerListItem {
  id: string;
  agentCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  tier: string;
  status: string;
  commissionRate: number;
  branchId: string | null;
  branchName: string | null;
  parentAgentId: string | null;
  parentName: string | null;
  subAgentCount: number;
  bookingsCount: number;
  commissionEarned: number;  // Σ baseAmount PAID
  commissionPending: number; // Σ baseAmount PENDING
  walletBalance: number;
  createdAt: string;
}
export interface PartnerListResponse {
  data: PartnerListItem[];
  stats: { total: number; active: number; byTier: Record<string, number>; totalWalletBalance: number; totalCommission: number };
}

export interface PartnerWalletTxn {
  id: string; type: string; description: string | null;
  amount: number; baseAmount: number; currency: string;
  method: string | null; reference: string | null; isReversed: boolean; postedAt: string;
}
export interface PartnerCommissionRow {
  id: string; bookingNo: string | null; period: string | null;
  grossAmount: number; rate: number; amount: number; baseAmount: number;
  isOverride: boolean; status: string; createdAt: string;
}
export interface PartnerBookingRow {
  id: string; bookingNo: string | null; serviceType: string; status: string;
  amount: number; baseAmount: number; createdAt: string;
}
export interface PartnerSubAgent {
  id: string; agentCode: string; name: string; tier: string; status: string;
  commissionEarned: number; walletBalance: number;
}

export interface PartnerDetail extends PartnerListItem {
  tradeLicense: string | null;
  bankName: string | null; accountNo: string | null; bankBranch: string | null;
  bkashNo: string | null; nagadNo: string | null;
  walletCurrency: string;
  subAgents: PartnerSubAgent[];        // direct downline only
  bookings: PartnerBookingRow[];
  commissions: PartnerCommissionRow[];
  walletTransactions: PartnerWalletTxn[]; // read-only ledger
}
