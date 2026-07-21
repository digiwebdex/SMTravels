import type { Request, Response } from "express";
import {
  invoiceCreateSchema, invoiceUpdateSchema, invoiceListQuerySchema,
  paymentRecordSchema, paymentListQuerySchema, refundCreateSchema, refundStatusUpdateSchema,
  installmentPlanCreateSchema, ledgerListQuerySchema,
} from "../contracts/finance.contract";
import * as invoices from "../services/invoice.service";
import * as payments from "../services/payment.service";

// invoices
export async function listInvoicesHandler(req: Request, res: Response) { res.json(await invoices.listInvoices(req.auth!, invoiceListQuerySchema.parse(req.query))); }
export async function getInvoiceHandler(req: Request, res: Response) { res.json(await invoices.getInvoice(req.auth!, req.params.id)); }
export async function createInvoiceHandler(req: Request, res: Response) { res.status(201).json(await invoices.createInvoice(req.auth!, invoiceCreateSchema.parse(req.body))); }
export async function updateInvoiceHandler(req: Request, res: Response) { res.json(await invoices.updateInvoice(req.auth!, req.params.id, invoiceUpdateSchema.parse(req.body))); }
export async function issueInvoiceHandler(req: Request, res: Response) { res.json(await invoices.issueInvoice(req.auth!, req.params.id)); }
export async function cancelInvoiceHandler(req: Request, res: Response) { res.json(await invoices.cancelInvoice(req.auth!, req.params.id)); }
export async function deleteInvoiceHandler(req: Request, res: Response) { await invoices.deleteInvoice(req.auth!, req.params.id); res.json({ ok: true }); }

// payments (immutable ledger)
export async function listPaymentsHandler(req: Request, res: Response) { res.json(await payments.listPayments(req.auth!, paymentListQuerySchema.parse(req.query))); }
export async function recordPaymentHandler(req: Request, res: Response) { res.status(201).json(await payments.recordPayment(req.auth!, paymentRecordSchema.parse(req.body))); }
export async function reversePaymentHandler(req: Request, res: Response) { res.json(await payments.reversePayment(req.auth!, req.params.id)); }

// refunds
export async function listRefundsHandler(req: Request, res: Response) { res.json(await payments.listRefunds(req.auth!, paymentListQuerySchema.parse(req.query))); }
export async function createRefundHandler(req: Request, res: Response) { res.status(201).json(await payments.createRefund(req.auth!, refundCreateSchema.parse(req.body))); }
export async function updateRefundHandler(req: Request, res: Response) { res.json(await payments.updateRefundStatus(req.auth!, req.params.id, refundStatusUpdateSchema.parse(req.body).status)); }

// installment plans
export async function listPlansHandler(req: Request, res: Response) { res.json(await payments.listInstallmentPlans(req.auth!, ledgerListQuerySchema.parse(req.query))); }
export async function createPlanHandler(req: Request, res: Response) { res.status(201).json(await payments.createInstallmentPlan(req.auth!, installmentPlanCreateSchema.parse(req.body))); }
