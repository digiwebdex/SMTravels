import type { Request, Response } from "express";
import { customerCreateSchema, customerUpdateSchema, customerListQuerySchema } from "../contracts/crm.contract";
import * as customers from "../services/customer.service";

export async function listCustomersHandler(req: Request, res: Response): Promise<void> {
  res.json(await customers.listCustomers(req.auth!, customerListQuerySchema.parse(req.query)));
}
export async function getCustomerHandler(req: Request, res: Response): Promise<void> {
  res.json(await customers.getCustomer(req.auth!, req.params.id));
}
export async function createCustomerHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await customers.createCustomer(req.auth!, customerCreateSchema.parse(req.body)));
}
export async function updateCustomerHandler(req: Request, res: Response): Promise<void> {
  res.json(await customers.updateCustomer(req.auth!, req.params.id, customerUpdateSchema.parse(req.body)));
}
export async function deleteCustomerHandler(req: Request, res: Response): Promise<void> {
  await customers.deleteCustomer(req.auth!, req.params.id);
  res.json({ ok: true });
}
