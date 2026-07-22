import type { Request, Response } from "express";
import { leadCreateSchema } from "../contracts/portal.contract";
import * as agent from "../services/portal.agent.service";

export async function agentMe(req: Request, res: Response) { res.json(await agent.getProfile(req.auth!)); }
export async function agentDashboard(req: Request, res: Response) { res.json(await agent.getDashboard(req.auth!)); }
export async function agentLeads(req: Request, res: Response) { res.json({ data: await agent.listLeads(req.auth!) }); }
export async function agentCreateLead(req: Request, res: Response) { res.status(201).json(await agent.createLead(req.auth!, leadCreateSchema.parse(req.body))); }
export async function agentBookings(req: Request, res: Response) { res.json({ data: await agent.listBookings(req.auth!) }); }
export async function agentCommissions(req: Request, res: Response) { res.json({ data: await agent.listCommissions(req.auth!) }); }
export async function agentWallet(req: Request, res: Response) { res.json(await agent.getWallet(req.auth!)); }
export async function agentTeam(req: Request, res: Response) { res.json({ data: await agent.listTeam(req.auth!) }); }
export async function agentTeamMember(req: Request, res: Response) { res.json(await agent.getTeamMember(req.auth!, req.params.id)); }
