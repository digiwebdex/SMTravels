import type { Request, Response } from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { reportQuerySchema, exportQuerySchema, serviceTypeSchema } from "../contracts/report.contract";
import * as reports from "../services/report.service";

export async function overviewHandler(req: Request, res: Response) {
  res.json(await reports.overview(req.auth!, reportQuerySchema.parse(req.query)));
}
export async function salesHandler(req: Request, res: Response) {
  res.json(await reports.sales(req.auth!, reportQuerySchema.parse(req.query)));
}
export async function bookingsHandler(req: Request, res: Response) {
  res.json(await reports.bookings(req.auth!, reportQuerySchema.parse(req.query)));
}
export async function agentsHandler(req: Request, res: Response) {
  res.json(await reports.agents(req.auth!, reportQuerySchema.parse(req.query)));
}
export async function pnlHandler(req: Request, res: Response) {
  res.json(await reports.pnl(req.auth!, reportQuerySchema.parse(req.query)));
}
export async function balanceSheetHandler(req: Request, res: Response) {
  res.json(await reports.balanceSheet(req.auth!, reportQuerySchema.parse(req.query)));
}
export async function cashFlowHandler(req: Request, res: Response) {
  res.json(await reports.cashFlow(req.auth!, reportQuerySchema.parse(req.query)));
}
export async function customersHandler(req: Request, res: Response) {
  res.json(await reports.customersReport(req.auth!, reportQuerySchema.parse(req.query)));
}
export async function notificationsHandler(req: Request, res: Response) {
  res.json(await reports.notificationsReport(req.auth!, reportQuerySchema.parse(req.query)));
}

export async function serviceHandler(req: Request, res: Response) {
  const type = serviceTypeSchema.parse(req.params.type.toUpperCase());
  res.json(await reports.serviceReport(req.auth!, type, reportQuerySchema.parse(req.query)));
}

const csvCell = (v: unknown): string => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (headers: string[], rows: (string | number | null)[][]): string =>
  [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

async function buildExportTable(req: Request, q: ReturnType<typeof exportQuerySchema.parse>) {
  let headers: string[] = [];
  let rows: (string | number | null)[][] = [];

  if (q.report === "sales") {
    const r = await reports.sales(req.auth!, q);
    headers = ["Service", "Invoices", "Revenue (BDT)", "% of Total"];
    rows = r.byService.map((s) => [s.label, s.count, s.revenue, `${s.pct}%`]);
    rows.push(["TOTAL", r.invoiceCount, r.totalRevenue, "100%"]);
  } else if (q.report === "bookings" || q.report === "visa" || q.report === "hajj" || q.report === "umrah") {
    if (q.report === "visa" || q.report === "hajj" || q.report === "umrah") {
      const type = q.report === "visa" ? "VISA" : q.report === "hajj" ? "HAJJ" : "UMRAH";
      const r = await reports.serviceReport(req.auth!, type, q);
      headers = ["Metric", "Value"];
      rows = [
        ["Total Bookings", r.totalBookings],
        ["Confirmed", r.confirmed],
        ["Pending", r.pending],
        ["Revenue (BDT)", r.totalRevenue],
        ["Travelers", r.travelers],
      ];
    } else {
      const r = await reports.bookings(req.auth!, q);
      headers = ["Booking No", "Date", "Customer", "Service", "Branch", "Agent", "Currency", "Amount", "Base (BDT)", "Status"];
      rows = r.rows.map((b) => [
        b.bookingNo, b.date, b.customerName, b.serviceType, b.branchName, b.agentName, b.currency, b.amount, b.baseAmount, b.status,
      ]);
    }
  } else if (q.report === "agents") {
    const r = await reports.agents(req.auth!, q);
    headers = ["Agent", "Bookings", "Revenue (BDT)", "Commission (BDT)", "Status"];
    rows = r.agents.map((a) => [a.name, a.bookings, a.revenue, a.commission, a.status]);
  } else if (q.report === "pnl" || q.report === "expenses" || q.report === "income") {
    const r = await reports.pnl(req.auth!, q);
    headers = ["Account", "Type", "Amount (BDT)"];
    rows = [
      ...r.revenueLines.map((l) => [l.name, "Revenue", l.amount] as (string | number)[]),
      ...r.expenseLines.map((l) => [l.name, "Expense", l.amount] as (string | number)[]),
      ["Net Profit", "", r.netProfit],
    ];
  } else if (q.report === "customers") {
    const r = await reports.customersReport(req.auth!, q);
    headers = ["Name", "Phone", "Email", "Date", "Branch"];
    rows = r.rows.map((c) => [c.name, c.phone, c.email, c.date, c.branchId]);
  } else if (q.report === "notifications") {
    const r = await reports.notificationsReport(req.auth!, q);
    headers = ["Channel", "Status", "Count"];
    rows = r.rows.map((x) => [x.channel, x.status, x.count]);
  }

  return { headers, rows };
}

export async function exportHandler(req: Request, res: Response) {
  const q = exportQuerySchema.parse(req.query);
  const { headers, rows } = await buildExportTable(req, q);
  const stamp = new Date().toISOString().slice(0, 10);

  if (q.format === "xlsx") {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(q.report);
    ws.addRow(headers);
    for (const row of rows) ws.addRow(row);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${q.report}-report-${stamp}.xlsx"`);
    res.send(buf);
    return;
  }

  if (q.format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${q.report}-report-${stamp}.pdf"`);
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);
    doc.fontSize(14).text(`SM Travels — ${q.report.toUpperCase()} Report`, { underline: true });
    doc.moveDown();
    doc.fontSize(9).text(headers.join(" | "));
    doc.moveDown(0.5);
    for (const row of rows.slice(0, 80)) {
      doc.text(row.map((c) => (c == null ? "" : String(c))).join(" | "));
    }
    if (rows.length > 80) doc.text(`… and ${rows.length - 80} more rows`);
    doc.end();
    return;
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${q.report}-report-${stamp}.csv"`);
  res.send(toCsv(headers, rows));
}
