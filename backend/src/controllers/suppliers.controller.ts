import type { Request, Response } from "express";
import * as suppliers from "../services/suppliers.service";
import {
  supplierListQuerySchema, supplierCreateSchema, supplierUpdateSchema,
  supplierServiceCreateSchema, supplierServiceUpdateSchema,
} from "../contracts/suppliers.contract";

// Suppliers (vendor) admin. Reads scope payables by branch in the service; writes
// are supplier + service master data only (payable schedule is read-only).
export async function listSuppliersHandler(req: Request, res: Response) {
  res.json(await suppliers.listSuppliers(req.auth!, supplierListQuerySchema.parse(req.query)));
}
export async function getSupplierHandler(req: Request, res: Response) {
  const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
  res.json(await suppliers.getSupplier(req.auth!, req.params.id, branchId));
}
export async function createSupplierHandler(req: Request, res: Response) {
  res.status(201).json(await suppliers.createSupplier(req.auth!, supplierCreateSchema.parse(req.body)));
}
export async function updateSupplierHandler(req: Request, res: Response) {
  res.json(await suppliers.updateSupplier(req.auth!, req.params.id, supplierUpdateSchema.parse(req.body)));
}
export async function createSupplierServiceHandler(req: Request, res: Response) {
  res.status(201).json(await suppliers.createSupplierService(req.auth!, req.params.id, supplierServiceCreateSchema.parse(req.body)));
}
export async function updateSupplierServiceHandler(req: Request, res: Response) {
  res.json(await suppliers.updateSupplierService(req.auth!, req.params.serviceId, supplierServiceUpdateSchema.parse(req.body)));
}
export async function deleteSupplierServiceHandler(req: Request, res: Response) {
  res.json(await suppliers.deleteSupplierService(req.auth!, req.params.serviceId));
}
