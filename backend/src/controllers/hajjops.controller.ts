import type { Request, Response } from "express";
import * as ops from "../services/hajjops.service";
import {
  quotaCreateSchema, quotaUpdateSchema, quotaListQuerySchema,
  batchCreateSchema, batchUpdateSchema, batchListQuerySchema,
  assignCapacitySchema,
  registrationCreateSchema, registrationUpdateSchema, registrationListQuerySchema,
} from "../contracts/hajjops.contract";

// ── quota ─────────────────────────────────────────────────────────────────
export async function listQuotasHandler(req: Request, res: Response) {
  res.json(await ops.listQuotas(req.auth!, quotaListQuerySchema.parse(req.query)));
}
export async function createQuotaHandler(req: Request, res: Response) {
  res.status(201).json(await ops.createQuota(req.auth!, quotaCreateSchema.parse(req.body)));
}
export async function updateQuotaHandler(req: Request, res: Response) {
  res.json(await ops.updateQuota(req.auth!, req.params.id, quotaUpdateSchema.parse(req.body)));
}
export async function deleteQuotaHandler(req: Request, res: Response) {
  await ops.deleteQuota(req.auth!, req.params.id);
  res.json({ ok: true });
}

// ── batch ─────────────────────────────────────────────────────────────────
export async function listBatchesHandler(req: Request, res: Response) {
  res.json(await ops.listBatches(req.auth!, batchListQuerySchema.parse(req.query)));
}
export async function getBatchHandler(req: Request, res: Response) {
  res.json(await ops.getBatch(req.auth!, req.params.id));
}
export async function createBatchHandler(req: Request, res: Response) {
  res.status(201).json(await ops.createBatch(req.auth!, batchCreateSchema.parse(req.body)));
}
export async function updateBatchHandler(req: Request, res: Response) {
  res.json(await ops.updateBatch(req.auth!, req.params.id, batchUpdateSchema.parse(req.body)));
}
export async function deleteBatchHandler(req: Request, res: Response) {
  await ops.deleteBatch(req.auth!, req.params.id);
  res.json({ ok: true });
}

// ── assign booking → capacity ───────────────────────────────────────────────
export async function assignCapacityHandler(req: Request, res: Response) {
  res.json(await ops.assignBookingCapacity(req.auth!, assignCapacitySchema.parse(req.body)));
}

// ── pilgrim registration ────────────────────────────────────────────────────
export async function listRegistrationsHandler(req: Request, res: Response) {
  res.json(await ops.listRegistrations(req.auth!, registrationListQuerySchema.parse(req.query)));
}
export async function getRegistrationHandler(req: Request, res: Response) {
  res.json(await ops.getRegistration(req.auth!, req.params.id));
}
export async function createRegistrationHandler(req: Request, res: Response) {
  res.status(201).json(await ops.createRegistration(req.auth!, registrationCreateSchema.parse(req.body)));
}
export async function updateRegistrationHandler(req: Request, res: Response) {
  res.json(await ops.updateRegistration(req.auth!, req.params.id, registrationUpdateSchema.parse(req.body)));
}
export async function deleteRegistrationHandler(req: Request, res: Response) {
  await ops.deleteRegistration(req.auth!, req.params.id);
  res.json({ ok: true });
}

// ── passport-expiry alerts ──────────────────────────────────────────────────
export async function passportAlertsHandler(req: Request, res: Response) {
  const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
  const windowMonths = req.query.windowMonths ? Number(req.query.windowMonths) : undefined;
  res.json(await ops.passportAlerts(req.auth!, { branchId, windowMonths }));
}
