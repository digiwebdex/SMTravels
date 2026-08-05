import type { Request, Response } from "express";
import { leadCreateSchema, ticketCreateSchema, ticketMessageSchema } from "../contracts/portal.contract";
import * as agent from "../services/portal.agent.service";

export async function agentMe(req: Request, res: Response) { res.json(await agent.getProfile(req.auth!)); }
export async function agentDashboard(req: Request, res: Response) { res.json(await agent.getDashboard(req.auth!)); }
export async function agentLeads(req: Request, res: Response) { res.json({ data: await agent.listLeads(req.auth!) }); }
export async function agentCreateLead(req: Request, res: Response) { res.status(201).json(await agent.createLead(req.auth!, leadCreateSchema.parse(req.body))); }
export async function agentBookings(req: Request, res: Response) { res.json({ data: await agent.listBookings(req.auth!) }); }
export async function agentCustomers(req: Request, res: Response) { res.json({ data: await agent.listCustomers(req.auth!) }); }
export async function agentCommissions(req: Request, res: Response) { res.json({ data: await agent.listCommissions(req.auth!) }); }
export async function agentWallet(req: Request, res: Response) { res.json(await agent.getWallet(req.auth!)); }
export async function agentTeam(req: Request, res: Response) { res.json({ data: await agent.listTeam(req.auth!) }); }
export async function agentTeamMember(req: Request, res: Response) { res.json(await agent.getTeamMember(req.auth!, req.params.id)); }
export async function agentDocuments(req: Request, res: Response) { res.json({ data: await agent.listDocuments(req.auth!) }); }
export async function agentPayments(req: Request, res: Response) { res.json({ data: await agent.listPayments(req.auth!) }); }
export async function agentTickets(req: Request, res: Response) { res.json({ data: await agent.listTickets(req.auth!) }); }
export async function agentTicket(req: Request, res: Response) { res.json(await agent.getTicket(req.auth!, req.params.id)); }
export async function agentCreateTicket(req: Request, res: Response) { res.status(201).json(await agent.createTicket(req.auth!, ticketCreateSchema.parse(req.body))); }
export async function agentTicketMessage(req: Request, res: Response) { res.status(201).json(await agent.addTicketMessage(req.auth!, req.params.id, ticketMessageSchema.parse(req.body).body)); }
