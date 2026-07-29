import type { Request, Response } from "express";
import * as sales from "../services/sales.service";
import { quotationListQuerySchema, quotationCreateSchema, quotationUpdateSchema } from "../contracts/sales.contract";

// Sales (Quotations → Sales Orders). Creating/editing a quotation writes only
// Quotation rows (never the ledger). Conversion creates a DRAFT booking in one tx.
export async function listQuotationsHandler(req: Request, res: Response) {
  res.json(await sales.listQuotations(req.auth!, quotationListQuerySchema.parse(req.query)));
}
export async function getQuotationHandler(req: Request, res: Response) {
  res.json(await sales.getQuotation(req.auth!, req.params.id));
}
export async function createQuotationHandler(req: Request, res: Response) {
  res.status(201).json(await sales.createQuotation(req.auth!, quotationCreateSchema.parse(req.body)));
}
export async function updateQuotationHandler(req: Request, res: Response) {
  res.json(await sales.updateQuotation(req.auth!, req.params.id, quotationUpdateSchema.parse(req.body)));
}
export async function convertQuotationHandler(req: Request, res: Response) {
  res.json(await sales.convertQuotation(req.auth!, req.params.id));
}
export async function deleteQuotationHandler(req: Request, res: Response) {
  res.json(await sales.deleteQuotation(req.auth!, req.params.id));
}
