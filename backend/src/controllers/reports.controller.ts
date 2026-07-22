import type { Request, Response } from "express";
import { reportQuerySchema, exportQuerySchema, serviceTypeSchema } from "../contracts/report.contract";
import * as reports from "../services/report.service";

export async function overviewHandler(req: Request, res: Response) { res.json(await reports.overview(req.auth!, reportQuerySchema.parse(req.query))); }
export async function salesHandler(req: Request, res: Response) { res.json(await reports.sales(req.auth!, reportQuerySchema.parse(req.query))); }
export async function bookingsHandler(req: Request, res: Response) { res.json(await reports.bookings(req.auth!, reportQuerySchema.parse(req.query))); }
export async function agentsHandler(req: Request, res: Response) { res.json(await reports.agents(req.auth!, reportQuerySchema.parse(req.query))); }
export async function pnlHandler(req: Request, res: Response) { res.json(await reports.pnl(req.auth!, reportQuerySchema.parse(req.query))); }
export async function balanceSheetHandler(req: Request, res: Response) { res.json(await reports.balanceSheet(req.auth!, reportQuerySchema.parse(req.query))); }
export async function cashFlowHandler(req: Request, res: Response) { res.json(await reports.cashFlow(req.auth!, reportQuerySchema.parse(req.query))); }

export async function serviceHandler(req: Request, res: Response) {
  const type = serviceTypeSchema.parse(req.params.type.toUpperCase());
  res.json(await reports.serviceReport(req.auth!, type, reportQuerySchema.parse(req.query)));
}

// ── CSV export (straightforward; PDF export is deferred to a later phase) ──────
const csvCell = (v: unknown): string => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (headers: string[], rows: (string | number | null)[][]): string =>
  [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

export async function exportHandler(req: Request, res: Response) {
  const q = exportQuerySchema.parse(req.query);
  let headers: string[] = [];
  let rows: (string | number | null)[][] = [];

  if (q.report === "sales") {
    const r = await reports.sales(req.auth!, q);
    headers = ["Service", "Invoices", "Revenue (BDT)", "% of Total"];
    rows = r.byService.map((s) => [s.label, s.count, s.revenue, `${s.pct}%`]);
    rows.push(["TOTAL", r.invoiceCount, r.totalRevenue, "100%"]);
  } else if (q.report === "bookings") {
    const r = await reports.bookings(req.auth!, q);
    headers = ["Booking No", "Date", "Customer", "Service", "Branch", "Agent", "Currency", "Amount", "Base (BDT)", "Status"];
    rows = r.rows.map((b) => [b.bookingNo, b.date, b.customerName, b.serviceType, b.branchName, b.agentName, b.currency, b.amount, b.baseAmount, b.status]);
  } else if (q.report === "agents") {
    const r = await reports.agents(req.auth!, q);
    headers = ["Agent", "Bookings", "Revenue (BDT)", "Commission (BDT)", "Status"];
    rows = r.agents.map((a) => [a.name, a.bookings, a.revenue, a.commission, a.status]);
  } else if (q.report === "pnl") {
    const r = await reports.pnl(req.auth!, q);
    headers = ["Account", "Type", "Amount (BDT)"];
    rows = [
      ...r.revenueLines.map((l) => [l.name, "Revenue", l.amount] as (string | number)[]),
      ...r.expenseLines.map((l) => [l.name, "Expense", l.amount] as (string | number)[]),
      ["Net Profit", "", r.netProfit],
    ];
  }

  const filename = `${q.report}-report-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv(headers, rows));
}
