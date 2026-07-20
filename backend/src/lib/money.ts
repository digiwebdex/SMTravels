import { HttpError } from "../middleware/errorHandler";

export type CurrencyCode = "BDT" | "USD" | "SAR";

export interface MoneyParts {
  amount: number;
  currency: CurrencyCode;
  exchangeRate: number;
  baseAmount: number;
}

/**
 * Enforce the money invariant used on every monetary write:
 *   baseAmount = round4(amount × exchangeRate)   and   BDT ⇒ exchangeRate = 1.
 * A non-BDT amount MUST carry an explicit exchangeRate (fail loud otherwise).
 */
export function money(amount: number, currency: CurrencyCode = "BDT", exchangeRate?: number): MoneyParts {
  let rate: number;
  if (currency === "BDT") {
    rate = 1; // base currency — always 1, ignore any supplied rate
  } else {
    if (!exchangeRate || exchangeRate <= 0) {
      throw new HttpError(400, "ExchangeRateRequired", { detail: `${currency} amounts require a positive exchangeRate` });
    }
    rate = exchangeRate;
  }
  return { amount, currency, exchangeRate: rate, baseAmount: round4(amount * rate) };
}

function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}
