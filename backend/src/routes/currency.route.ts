import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listExchangeRatesHandler, createExchangeRateHandler, updateExchangeRateHandler,
  deactivateExchangeRateHandler, getCurrencySettingsHandler, setCurrencySettingsHandler,
} from "../controllers/currency.controller";

// Currency (Module 2). Date-effective exchange rates + base/supported config.
// Gated on the existing "settings" module (view reads, manage writes) — no new perm key.
export const currencyRouter = Router();
const view = requirePermission("currency", "view");
const manage = requirePermission("currency", "manage");

currencyRouter.get("/currency/rates", requireAuth, view, asyncHandler(listExchangeRatesHandler));
currencyRouter.post("/currency/rates", requireAuth, manage, asyncHandler(createExchangeRateHandler));
currencyRouter.patch("/currency/rates/:id", requireAuth, manage, asyncHandler(updateExchangeRateHandler));
currencyRouter.delete("/currency/rates/:id", requireAuth, manage, asyncHandler(deactivateExchangeRateHandler));
currencyRouter.get("/currency/settings", requireAuth, view, asyncHandler(getCurrencySettingsHandler));
currencyRouter.put("/currency/settings", requireAuth, manage, asyncHandler(setCurrencySettingsHandler));
