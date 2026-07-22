import type { Request, Response } from "express";
import { ticketCreateSchema, ticketMessageSchema } from "../contracts/portal.contract";
import * as portal from "../services/portal.service";

export async function meHandler(req: Request, res: Response) { res.json(await portal.getProfile(req.auth!)); }
export async function dashboardHandler(req: Request, res: Response) { res.json(await portal.getDashboard(req.auth!)); }

export async function bookingsHandler(req: Request, res: Response) { res.json({ data: await portal.listBookings(req.auth!) }); }
export async function bookingHandler(req: Request, res: Response) { res.json(await portal.getBooking(req.auth!, req.params.id)); }

export async function invoicesHandler(req: Request, res: Response) { res.json({ data: await portal.listInvoices(req.auth!) }); }
export async function invoiceHandler(req: Request, res: Response) { res.json(await portal.getInvoice(req.auth!, req.params.id)); }

export async function paymentsHandler(req: Request, res: Response) { res.json({ data: await portal.listPayments(req.auth!) }); }
export async function installmentsHandler(req: Request, res: Response) { res.json({ data: await portal.listInstallmentPlans(req.auth!) }); }

export async function documentsHandler(req: Request, res: Response) { res.json({ data: await portal.listDocuments(req.auth!) }); }
export async function documentHandler(req: Request, res: Response) { res.json(await portal.getDocument(req.auth!, req.params.id)); }

export async function ticketsHandler(req: Request, res: Response) { res.json({ data: await portal.listTickets(req.auth!) }); }
export async function ticketHandler(req: Request, res: Response) { res.json(await portal.getTicket(req.auth!, req.params.id)); }
export async function createTicketHandler(req: Request, res: Response) { res.status(201).json(await portal.createTicket(req.auth!, ticketCreateSchema.parse(req.body))); }
export async function ticketMessageHandler(req: Request, res: Response) { res.status(201).json(await portal.addTicketMessage(req.auth!, req.params.id, ticketMessageSchema.parse(req.body).body)); }

export async function notificationsHandler(req: Request, res: Response) { res.json({ data: await portal.listNotifications(req.auth!) }); }
export async function readAllNotificationsHandler(req: Request, res: Response) { res.json(await portal.markAllNotificationsRead(req.auth!)); }
