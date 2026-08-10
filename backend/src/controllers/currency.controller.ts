import type { Request, Response } from "express";
import * as currency from "../services/currency.service";
import {
  exchangeRateListQuerySchema, exchangeRateCreateSchema, exchangeRateUpdateSchema,
  currencySettingsSchema,
} from "../contracts/currency.contract";

// Currency (Module 2). Exchange-rate CRUD + base/supported config.
export async function listExchangeRatesHandler(req: Request, res: Response) {
  res.json(await currency.listExchangeRates(req.auth!, exchangeRateListQuerySchema.parse(req.query)));
}
export async function createExchangeRateHandler(req: Request, res: Response) {
  res.status(201).json(await currency.createExchangeRate(req.auth!, exchangeRateCreateSchema.parse(req.body)));
}
export async function updateExchangeRateHandler(req: Request, res: Response) {
  res.json(await currency.updateExchangeRate(req.auth!, req.params.id, exchangeRateUpdateSchema.parse(req.body)));
}
export async function deactivateExchangeRateHandler(req: Request, res: Response) {
  res.json(await currency.deactivateExchangeRate(req.auth!, req.params.id));
}
export async function getCurrencySettingsHandler(req: Request, res: Response) {
  res.json(await currency.getCurrencySettings(req.auth!));
}
export async function setCurrencySettingsHandler(req: Request, res: Response) {
  res.json(await currency.setCurrencySettings(req.auth!, currencySettingsSchema.parse(req.body)));
}
