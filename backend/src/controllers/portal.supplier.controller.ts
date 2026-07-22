import type { Request, Response } from "express";
import { requestStatusSchema } from "../contracts/portal.contract";
import * as supplier from "../services/portal.supplier.service";

export async function supplierMe(req: Request, res: Response) { res.json(await supplier.getProfile(req.auth!)); }
export async function supplierDashboard(req: Request, res: Response) { res.json(await supplier.getDashboard(req.auth!)); }
export async function supplierRequests(req: Request, res: Response) { res.json({ data: await supplier.listRequests(req.auth!) }); }
export async function supplierRequest(req: Request, res: Response) { res.json(await supplier.getRequest(req.auth!, req.params.id)); }
export async function supplierRequestStatus(req: Request, res: Response) { res.json(await supplier.setRequestStatus(req.auth!, req.params.id, requestStatusSchema.parse(req.body))); }
export async function supplierServices(req: Request, res: Response) { res.json({ data: await supplier.listServices(req.auth!) }); }
export async function supplierInvoices(req: Request, res: Response) { res.json({ data: await supplier.listInvoices(req.auth!) }); }
export async function supplierInvoice(req: Request, res: Response) { res.json(await supplier.getInvoice(req.auth!, req.params.id)); }
export async function supplierPayables(req: Request, res: Response) { res.json({ data: await supplier.listPayables(req.auth!) }); }
export async function supplierPayments(req: Request, res: Response) { res.json({ data: await supplier.listPayments(req.auth!) }); }
