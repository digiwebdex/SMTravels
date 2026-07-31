/**
 * ERP AI assistants — thin wrappers over gemini.service role facades.
 * Does not re-initialize Gemini; uses existing singleton.
 */
import type { Request, Response } from "express";
import { z } from "zod";
import {
  customerAi,
  officeAi,
  salesAi,
  financeAi,
  reportsAi,
  operationsAi,
} from "../services/gemini.service";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";

const textSchema = z.object({
  context: z.string().trim().min(1).max(12000).optional(),
  message: z.string().trim().min(1).max(8000).optional(),
  id: z.string().optional(),
}).refine((v) => !!(v.context || v.message || v.id), { message: "Provide context, message, or id" });

async function contextFromBody(req: Request): Promise<string> {
  const input = textSchema.parse(req.body);
  if (input.context || input.message) return (input.context ?? input.message)!;
  if (input.id) {
    // Prefer booking summary context when id looks like a booking
    const booking = await prisma.booking.findFirst({
      where: { id: input.id, deletedAt: null },
      select: {
        bookingNo: true,
        serviceType: true,
        status: true,
        amount: true,
        currency: true,
        customer: { select: { name: true, phone: true, email: true } },
      },
    });
    if (booking) {
      return JSON.stringify(booking);
    }
    const customer = await prisma.customer.findFirst({
      where: { id: input.id, deletedAt: null },
      select: { name: true, phone: true, email: true },
    });
    if (customer) return JSON.stringify(customer);
    const lead = await prisma.lead.findFirst({
      where: { id: input.id, deletedAt: null },
      select: { name: true, phone: true, email: true, serviceInterest: true, notes: true },
    });
    if (lead) return JSON.stringify(lead);
    throw new HttpError(404, "NotFound", { detail: "Record not found for AI context." });
  }
  throw new HttpError(400, "ValidationError");
}

async function reply(fn: (c: string) => Promise<string>, req: Request, res: Response) {
  const ctx = await contextFromBody(req);
  const text = await fn(ctx);
  res.json({ reply: text });
}

export async function aiCustomerSummaryHandler(req: Request, res: Response) {
  await reply((c) => customerAi.chatbot(`Summarize this customer for staff:\n${c}`), req, res);
}
export async function aiBookingSummaryHandler(req: Request, res: Response) {
  await reply((c) => operationsAi.bookingSummary(c), req, res);
}
export async function aiPackageRecommendHandler(req: Request, res: Response) {
  await reply((c) => customerAi.packageRecommendation(c), req, res);
}
export async function aiEmailWriterHandler(req: Request, res: Response) {
  await reply((c) => officeAi.emailWriter(c), req, res);
}
export async function aiWhatsappWriterHandler(req: Request, res: Response) {
  await reply((c) => officeAi.whatsappReply(c), req, res);
}
export async function aiSmsWriterHandler(req: Request, res: Response) {
  await reply((c) => officeAi.smsWriter(c), req, res);
}
export async function aiLeadAnalysisHandler(req: Request, res: Response) {
  await reply((c) => salesAi.leadAnalysis(c), req, res);
}
export async function aiRevenueAnalysisHandler(req: Request, res: Response) {
  await reply((c) => financeAi.revenueSummary(c), req, res);
}
export async function aiExpenseAnalysisHandler(req: Request, res: Response) {
  await reply((c) => financeAi.expenseAnalysis(c), req, res);
}
export async function aiInsightsHandler(req: Request, res: Response) {
  await reply((c) => reportsAi.businessInsights(c), req, res);
}
export async function aiMonthlySummaryHandler(req: Request, res: Response) {
  await reply((c) => reportsAi.monthlySummary(c), req, res);
}
