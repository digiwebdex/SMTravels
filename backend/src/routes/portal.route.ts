import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import {
  meHandler, dashboardHandler, bookingsHandler, bookingHandler,
  invoicesHandler, invoiceHandler, paymentsHandler, installmentsHandler,
  documentsHandler, documentHandler, ticketsHandler, ticketHandler,
  createTicketHandler, ticketMessageHandler, notificationsHandler, readAllNotificationsHandler,
} from "../controllers/portal.controller";

// Customer Portal — OWNERSHIP-SCOPED. Every handler resolves the caller's own
// customerId server-side (requireCustomerId) and pins the query to it; a
// non-owned id 404s. No RBAC-module permission needed — access is the ownership
// link itself. requireAuth only; resolveOwner enforces the portal role.
export const portalRouter = Router();
const base = "/portal";

portalRouter.get(`${base}/me`, requireAuth, asyncHandler(meHandler));
portalRouter.get(`${base}/dashboard`, requireAuth, asyncHandler(dashboardHandler));

portalRouter.get(`${base}/bookings`, requireAuth, asyncHandler(bookingsHandler));
portalRouter.get(`${base}/bookings/:id`, requireAuth, asyncHandler(bookingHandler));

portalRouter.get(`${base}/invoices`, requireAuth, asyncHandler(invoicesHandler));
portalRouter.get(`${base}/invoices/:id`, requireAuth, asyncHandler(invoiceHandler));

portalRouter.get(`${base}/payments`, requireAuth, asyncHandler(paymentsHandler));
portalRouter.get(`${base}/installments`, requireAuth, asyncHandler(installmentsHandler));

portalRouter.get(`${base}/documents`, requireAuth, asyncHandler(documentsHandler));
portalRouter.get(`${base}/documents/:id`, requireAuth, asyncHandler(documentHandler));

portalRouter.get(`${base}/tickets`, requireAuth, asyncHandler(ticketsHandler));
portalRouter.get(`${base}/tickets/:id`, requireAuth, asyncHandler(ticketHandler));
portalRouter.post(`${base}/tickets`, requireAuth, asyncHandler(createTicketHandler));
portalRouter.post(`${base}/tickets/:id/messages`, requireAuth, asyncHandler(ticketMessageHandler));

portalRouter.get(`${base}/notifications`, requireAuth, asyncHandler(notificationsHandler));
portalRouter.post(`${base}/notifications/read-all`, requireAuth, asyncHandler(readAllNotificationsHandler));
