/**
 * Currency (Module 2) contract. Date-effective exchange rates + base/supported
 * config (stored in Setting group "currency"). Rates are DEFAULTS for new financial
 * entries — posted transactions keep their own currency/exchangeRate/baseAmount and
 * are never recalculated.
 */
import { z } from "zod";

export const CURRENCIES = ["BDT", "USD", "SAR"] as const;
export const currencyEnum = z.enum(CURRENCIES);

export const exchangeRateListQuerySchema = z.object({
  currency: currencyEnum.optional(),
  active: z.enum(["true", "false"]).optional(),
});
export type ExchangeRateListQuery = z.infer<typeof exchangeRateListQuerySchema>;

export const exchangeRateCreateSchema = z.object({
  currency: currencyEnum,
  baseCurrency: currencyEnum.default("BDT"),
  rate: z.coerce.number().positive(),
  effectiveDate: z.string().min(8), // ISO yyyy-mm-dd
  source: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  active: z.boolean().optional(),
});
export type ExchangeRateCreateInput = z.infer<typeof exchangeRateCreateSchema>;

export const exchangeRateUpdateSchema = exchangeRateCreateSchema.partial();
export type ExchangeRateUpdateInput = z.infer<typeof exchangeRateUpdateSchema>;

export const currencySettingsSchema = z.object({
  base: currencyEnum,
  supported: z.array(currencyEnum).min(1),
});
export type CurrencySettingsInput = z.infer<typeof currencySettingsSchema>;

export interface ExchangeRateDto {
  id: string;
  currency: string;
  baseCurrency: string;
  rate: string;
  effectiveDate: string;
  source: string | null;
  note: string | null;
  active: boolean;
  createdAt: string;
}
export interface ExchangeRateListResponse {
  rates: ExchangeRateDto[];
}
export interface CurrencySettingsDto {
  base: string;
  supported: string[];
}
