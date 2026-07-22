import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  agentMe, agentDashboard, agentLeads, agentCreateLead, agentBookings,
  agentCommissions, agentWallet, agentTeam, agentTeamMember,
} from "../controllers/portal.agent.controller";
import {
  supplierMe, supplierDashboard, supplierRequests, supplierRequest, supplierRequestStatus,
  supplierServices, supplierInvoices, supplierInvoice, supplierPayables, supplierPayments,
} from "../controllers/portal.supplier.controller";
import {
  staffMe, staffDashboard, staffTasks, staffCreateTask, staffTaskStatus,
  staffBookings, staffCustomers, staffDocuments, staffAnnouncements,
} from "../controllers/portal.staff.controller";
import { accountantMe, accountantDashboard } from "../controllers/portal.accountant.controller";

// Agent + Supplier + Staff + Accountant portals. All OWNERSHIP/BRANCH-SCOPED in
// the services. Agent/Supplier are guarded by resolveOwner (requireAgentId/
// requireSupplierId 403 non-matching roles); Staff/Accountant have no owner link
// so are guarded by requireRole. A portal role hitting another portal's routes
// gets 403 either way.
export const portalRolesRouter = Router();

// ── Agent (requireAgentId in the service pins to own agentId; wallet READ-ONLY)
const A = "/portal/agent";
portalRolesRouter.get(`${A}/me`, requireAuth, asyncHandler(agentMe));
portalRolesRouter.get(`${A}/dashboard`, requireAuth, asyncHandler(agentDashboard));
portalRolesRouter.get(`${A}/leads`, requireAuth, asyncHandler(agentLeads));
portalRolesRouter.post(`${A}/leads`, requireAuth, asyncHandler(agentCreateLead));
portalRolesRouter.get(`${A}/bookings`, requireAuth, asyncHandler(agentBookings));
portalRolesRouter.get(`${A}/commissions`, requireAuth, asyncHandler(agentCommissions));
portalRolesRouter.get(`${A}/wallet`, requireAuth, asyncHandler(agentWallet)); // READ-ONLY — no POST/PATCH exists
portalRolesRouter.get(`${A}/team`, requireAuth, asyncHandler(agentTeam));
portalRolesRouter.get(`${A}/team/:id`, requireAuth, asyncHandler(agentTeamMember));

// ── Supplier (requireSupplierId in the service)
const S = "/portal/supplier";
portalRolesRouter.get(`${S}/me`, requireAuth, asyncHandler(supplierMe));
portalRolesRouter.get(`${S}/dashboard`, requireAuth, asyncHandler(supplierDashboard));
portalRolesRouter.get(`${S}/requests`, requireAuth, asyncHandler(supplierRequests));
portalRolesRouter.get(`${S}/requests/:id`, requireAuth, asyncHandler(supplierRequest));
portalRolesRouter.post(`${S}/requests/:id/status`, requireAuth, asyncHandler(supplierRequestStatus));
portalRolesRouter.get(`${S}/services`, requireAuth, asyncHandler(supplierServices));
portalRolesRouter.get(`${S}/invoices`, requireAuth, asyncHandler(supplierInvoices));
portalRolesRouter.get(`${S}/invoices/:id`, requireAuth, asyncHandler(supplierInvoice));
portalRolesRouter.get(`${S}/payables`, requireAuth, asyncHandler(supplierPayables));
portalRolesRouter.get(`${S}/payments`, requireAuth, asyncHandler(supplierPayments));

// ── Staff (branchWhere + assigned-to-me; gated by requireRole STAFF)
const ST = "/portal/staff";
const staffOnly = requireRole(UserRole.STAFF);
portalRolesRouter.get(`${ST}/me`, requireAuth, staffOnly, asyncHandler(staffMe));
portalRolesRouter.get(`${ST}/dashboard`, requireAuth, staffOnly, asyncHandler(staffDashboard));
portalRolesRouter.get(`${ST}/tasks`, requireAuth, staffOnly, asyncHandler(staffTasks));
portalRolesRouter.post(`${ST}/tasks`, requireAuth, staffOnly, asyncHandler(staffCreateTask));
portalRolesRouter.patch(`${ST}/tasks/:id`, requireAuth, staffOnly, asyncHandler(staffTaskStatus));
portalRolesRouter.get(`${ST}/bookings`, requireAuth, staffOnly, asyncHandler(staffBookings));
portalRolesRouter.get(`${ST}/customers`, requireAuth, staffOnly, asyncHandler(staffCustomers));
portalRolesRouter.get(`${ST}/documents`, requireAuth, staffOnly, asyncHandler(staffDocuments));
portalRolesRouter.get(`${ST}/announcements`, requireAuth, staffOnly, asyncHandler(staffAnnouncements));

// ── Accountant (branchWhere; reuses finance/report endpoints elsewhere)
const AC = "/portal/accountant";
const acctOnly = requireRole(UserRole.ACCOUNTANT);
portalRolesRouter.get(`${AC}/me`, requireAuth, acctOnly, asyncHandler(accountantMe));
portalRolesRouter.get(`${AC}/dashboard`, requireAuth, acctOnly, asyncHandler(accountantDashboard));
