import type { Request, Response } from "express";
import { supplierListQuerySchema, supplierCreateSchema, supplierUpdateSchema } from "../contracts/settings.contract";
import * as suppliers from "../services/supplier.admin.service";

export async function listSuppliersHandler(req: Request, res: Response): Promise<void> {
  res.json(await suppliers.listSuppliers(req.auth!, supplierListQuerySchema.parse(req.query)));
}

export async function createSupplierHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await suppliers.createSupplier(req.auth!, supplierCreateSchema.parse(req.body)));
}

export async function updateSupplierHandler(req: Request, res: Response): Promise<void> {
  res.json(await suppliers.updateSupplier(req.auth!, req.params.id, supplierUpdateSchema.parse(req.body)));
}
