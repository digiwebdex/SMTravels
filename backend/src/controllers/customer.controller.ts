import type { Request, Response } from "express";
import * as customers from "../services/customer.service";

export async function listCustomersHandler(req: Request, res: Response): Promise<void> {
  const data = await customers.listCustomers(req.auth!);
  res.json({ data });
}

export async function getCustomerHandler(req: Request, res: Response): Promise<void> {
  const row = await customers.getCustomer(req.auth!, req.params.id);
  if (!row) {
    res.status(404).json({ error: "NotFound", requestId: req.id });
    return;
  }
  res.json({ data: row });
}
