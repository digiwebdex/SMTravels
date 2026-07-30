import type { Request, Response } from "express";
import * as print from "../services/print.service";

export async function paymentReceiptPrintHandler(req: Request, res: Response): Promise<void> {
  const html = await print.getPaymentReceiptHtml(req.auth!, req.params.paymentId);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.send(html);
}

export async function bookingVoucherPrintHandler(req: Request, res: Response): Promise<void> {
  const html = await print.getBookingVoucherHtml(req.auth!, req.params.id);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.send(html);
}
