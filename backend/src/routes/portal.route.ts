import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { uploadSingleFile } from "../lib/uploads";
import { uploadRateLimiter } from "../middleware/rateLimit";
import {
  meHandler, dashboardHandler, bookingsHandler, bookingHandler,
  visasHandler, downloadsHandler,
  invoicesHandler, invoiceHandler, paymentsHandler, installmentsHandler,
  documentsHandler, documentHandler, uploadPortalDocumentHandler, portalDocumentFileHandler,
  ticketsHandler, ticketHandler,
  createTicketHandler, ticketMessageHandler, notificationsHandler, readAllNotificationsHandler,
  bankAccountsHandler, submitPaymentProofHandler,
  bookingVoucherPrintHandler,
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
portalRouter.get(`${base}/bookings/:id/voucher`, requireAuth, asyncHandler(bookingVoucherPrintHandler));
portalRouter.get(`${base}/visas`, requireAuth, asyncHandler(visasHandler));
portalRouter.get(`${base}/downloads`, requireAuth, asyncHandler(downloadsHandler));

portalRouter.get(`${base}/invoices`, requireAuth, asyncHandler(invoicesHandler));
portalRouter.get(`${base}/invoices/:id`, requireAuth, asyncHandler(invoiceHandler));

portalRouter.get(`${base}/payments`, requireAuth, asyncHandler(paymentsHandler));
portalRouter.get(`${base}/bank-accounts`, requireAuth, asyncHandler(bankAccountsHandler));
portalRouter.post(`${base}/payments/proof`, requireAuth, uploadRateLimiter, uploadSingleFile, asyncHandler(submitPaymentProofHandler));
portalRouter.get(`${base}/installments`, requireAuth, asyncHandler(installmentsHandler));

portalRouter.get(`${base}/documents`, requireAuth, asyncHandler(documentsHandler));
// NOTE: /documents/:id/file MUST be declared before /documents/:id.
// Multer runs AFTER requireAuth so anonymous requests never touch disk.
portalRouter.get(`${base}/documents/:id/file`, requireAuth, asyncHandler(portalDocumentFileHandler));
portalRouter.get(`${base}/documents/:id`, requireAuth, asyncHandler(documentHandler));
portalRouter.post(`${base}/documents`, requireAuth, uploadRateLimiter, uploadSingleFile, asyncHandler(uploadPortalDocumentHandler));

portalRouter.get(`${base}/tickets`, requireAuth, asyncHandler(ticketsHandler));
portalRouter.get(`${base}/tickets/:id`, requireAuth, asyncHandler(ticketHandler));
portalRouter.post(`${base}/tickets`, requireAuth, asyncHandler(createTicketHandler));
portalRouter.post(`${base}/tickets/:id/messages`, requireAuth, asyncHandler(ticketMessageHandler));

portalRouter.get(`${base}/notifications`, requireAuth, asyncHandler(notificationsHandler));
portalRouter.post(`${base}/notifications/read-all`, requireAuth, asyncHandler(readAllNotificationsHandler));
