/**
 * Settings / admin contract — users, roles, branches, agents, suppliers.
 * Permission module: "settings" (see seed MODULES).
 */
import { z } from "zod";

const optStr = z.string().trim().optional();
const emailField = z.string().trim().email();

export const userRoleSchema = z.enum([
  "SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "STAFF", "ACCOUNTANT",
  "SALES_EXECUTIVE", "VISA_EXECUTIVE", "HAJJ_EXECUTIVE", "UMRAH_EXECUTIVE",
  "AGENT", "SUPPLIER", "CUSTOMER",
]);

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: optStr,
  role: userRoleSchema.optional(),
  branchId: optStr,
  status: z.enum(["active", "inactive", "all"]).default("all"),
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;

export const userCreateSchema = z.object({
  name: z.string().trim().min(1),
  email: emailField,
  password: z.string().min(8),
  role: userRoleSchema,
  branchId: optStr,
  phone: optStr,
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  role: userRoleSchema.optional(),
  branchId: optStr.nullable(),
  phone: optStr.nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const branchUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  address: optStr.nullable(),
  phone: optStr.nullable(),
  mobile: optStr.nullable(),
  email: optStr.nullable(),
  hours: optStr.nullable(),
  mapUrl: optStr.nullable(),
  status: z.enum(["active", "setup", "inactive"]).optional(),
  managerId: optStr.nullable(),
  isHq: z.boolean().optional(),
});
export type BranchUpdateInput = z.infer<typeof branchUpdateSchema>;

export const agentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: optStr,
  branchId: optStr,
  status: optStr,
});
export type AgentListQuery = z.infer<typeof agentListQuerySchema>;

export const agentCreateSchema = z.object({
  name: z.string().trim().min(1),
  agentCode: optStr,
  branchId: optStr,
  phone: optStr,
  email: emailField.optional().or(z.literal("")),
  tier: z.enum(["SILVER", "GOLD", "PLATINUM"]).optional(),
  commissionRate: z.coerce.number().nonnegative().optional(),
  parentAgentId: optStr,
});
export type AgentCreateInput = z.infer<typeof agentCreateSchema>;

export const agentUpdateSchema = agentCreateSchema.partial().omit({ agentCode: true });
export type AgentUpdateInput = z.infer<typeof agentUpdateSchema>;

export const supplierListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: optStr,
  status: optStr,
});
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>;

export const supplierCreateSchema = z.object({
  name: z.string().trim().min(1),
  supplierCode: optStr,
  category: optStr,
  contactPerson: optStr,
  phone: optStr,
  email: emailField.optional().or(z.literal("")),
  website: optStr,
  address: optStr,
});
export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;

export const supplierUpdateSchema = supplierCreateSchema.partial().omit({ supplierCode: true }).extend({
  status: z.enum(["PENDING", "VERIFIED", "SUSPENDED"]).optional(),
});
export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;

// ── DTOs ──────────────────────────────────────────────────────────────────────
export interface UserListItem {
  id: string; name: string; email: string; phone: string | null;
  role: string; branchId: string | null; branchName: string | null;
  status: string; lastActiveAt: string | null; createdAt: string;
}
export interface UserListResponse {
  data: UserListItem[];
  page: number; pageSize: number; total: number; totalPages: number;
}

export interface RolePermissionRow { module: string; access: string }
export interface RoleDto {
  id: string; key: string; name: string; description: string | null;
  isSystem: boolean; userCount: number; permissions: RolePermissionRow[];
}

export interface BranchListItem {
  id: string; code: string; name: string; city: string; isHq: boolean;
  address: string | null; phone: string | null; email: string | null;
  status: string; managerId: string | null; managerName: string | null; staffCount: number;
}

export interface AgentListItem {
  id: string; agentCode: string; name: string; branchId: string | null; branchName: string | null;
  phone: string | null; email: string | null; tier: string; commissionRate: number;
  status: string; bookingsCount: number; createdAt: string;
}
export interface AgentListResponse {
  data: AgentListItem[];
  page: number; pageSize: number; total: number; totalPages: number;
}

export interface SupplierListItem {
  id: string; supplierCode: string; name: string; category: string | null;
  contactPerson: string | null; phone: string | null; email: string | null;
  status: string; servicesCount: number; createdAt: string;
}
export interface SupplierListResponse {
  data: SupplierListItem[];
  page: number; pageSize: number; total: number; totalPages: number;
}
