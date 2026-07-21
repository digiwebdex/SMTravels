import type { Request, Response } from "express";
import {
  packageCreateSchema, packageUpdateSchema, packageListQuerySchema,
  serviceCreateSchema, serviceUpdateSchema,
} from "../contracts/catalog.contract";
import * as packages from "../services/package.service";
import * as services from "../services/service.service";

// ── packages ──────────────────────────────────────────────────────────────────
export async function listPackagesHandler(req: Request, res: Response): Promise<void> {
  res.json(await packages.listPackages(req.auth!, packageListQuerySchema.parse(req.query)));
}
export async function getPackageHandler(req: Request, res: Response): Promise<void> {
  res.json(await packages.getPackage(req.auth!, req.params.id));
}
export async function createPackageHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await packages.createPackage(req.auth!, packageCreateSchema.parse(req.body)));
}
export async function updatePackageHandler(req: Request, res: Response): Promise<void> {
  res.json(await packages.updatePackage(req.auth!, req.params.id, packageUpdateSchema.parse(req.body)));
}
export async function deletePackageHandler(req: Request, res: Response): Promise<void> {
  await packages.deletePackage(req.auth!, req.params.id);
  res.json({ ok: true });
}

// ── services ──────────────────────────────────────────────────────────────────
export async function listServicesHandler(req: Request, res: Response): Promise<void> {
  res.json(await services.listServices(req.auth!));
}
export async function getServiceHandler(req: Request, res: Response): Promise<void> {
  res.json(await services.getService(req.auth!, req.params.id));
}
export async function createServiceHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await services.createService(req.auth!, serviceCreateSchema.parse(req.body)));
}
export async function updateServiceHandler(req: Request, res: Response): Promise<void> {
  res.json(await services.updateService(req.auth!, req.params.id, serviceUpdateSchema.parse(req.body)));
}
