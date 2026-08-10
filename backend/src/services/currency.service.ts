/**
 * Currency (Module 2) service. CRUD over date-effective ExchangeRate rows + the
 * base/supported currency config in Setting (group "currency"). SAFETY: changing a
 * rate NEVER touches posted financial rows — Invoice/Payment/etc. keep their own
 * currency/exchangeRate/baseAmount. These rows only supply DEFAULTS for new entries.
 */
import { prisma } from "../lib/prisma";
import type { AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  ExchangeRateCreateInput, ExchangeRateUpdateInput, ExchangeRateListQuery,
  CurrencySettingsInput, ExchangeRateDto,
} from "../contracts/currency.contract";

const DEFAULT_SUPPORTED = ["BDT", "USD", "SAR"];

type RateRow = {
  id: string; currency: string; baseCurrency: string; rate: unknown;
  effectiveDate: Date; source: string | null; note: string | null;
  active: boolean; createdAt: Date;
};

function toDto(r: RateRow): ExchangeRateDto {
  return {
    id: r.id, currency: r.currency, baseCurrency: r.baseCurrency,
    rate: String(r.rate),
    effectiveDate: r.effectiveDate.toISOString().slice(0, 10),
    source: r.source, note: r.note, active: r.active,
    createdAt: r.createdAt.toISOString(),
  };
}

async function companyId(): Promise<string> {
  const c = await prisma.company.findFirst({ select: { id: true } });
  if (!c) throw new HttpError(400, "NoCompany");
  return c.id;
}

export async function listExchangeRates(_auth: AuthCtx, q: ExchangeRateListQuery) {
  const rows = await prisma.exchangeRate.findMany({
    where: {
      deletedAt: null,
      ...(q.currency ? { currency: q.currency } : {}),
      ...(q.active ? { active: q.active === "true" } : {}),
    },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
    take: 500,
  });
  return { rates: rows.map((r) => toDto(r as unknown as RateRow)) };
}

export async function createExchangeRate(auth: AuthCtx, input: ExchangeRateCreateInput) {
  const r = await prisma.exchangeRate.create({
    data: {
      currency: input.currency,
      baseCurrency: input.baseCurrency ?? "BDT",
      rate: input.rate,
      effectiveDate: new Date(input.effectiveDate),
      source: input.source ?? null,
      note: input.note ?? null,
      active: input.active ?? true,
      createdById: auth.userId,
    },
  });
  return toDto(r as unknown as RateRow);
}

export async function updateExchangeRate(_auth: AuthCtx, id: string, input: ExchangeRateUpdateInput) {
  const existing = await prisma.exchangeRate.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  const r = await prisma.exchangeRate.update({
    where: { id },
    data: {
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.baseCurrency ? { baseCurrency: input.baseCurrency } : {}),
      ...(input.rate != null ? { rate: input.rate } : {}),
      ...(input.effectiveDate ? { effectiveDate: new Date(input.effectiveDate) } : {}),
      ...(input.source !== undefined ? { source: input.source ?? null } : {}),
      ...(input.note !== undefined ? { note: input.note ?? null } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
  return toDto(r as unknown as RateRow);
}

export async function deactivateExchangeRate(_auth: AuthCtx, id: string) {
  const existing = await prisma.exchangeRate.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "NotFound");
  await prisma.exchangeRate.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  return { ok: true };
}

export async function getCurrencySettings(_auth: AuthCtx) {
  const rows = await prisma.setting.findMany({
    where: { group: "currency" },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
  const base = map["currency.base"] || "BDT";
  let supported: string[] = DEFAULT_SUPPORTED;
  try {
    if (map["currency.supported"]) supported = JSON.parse(map["currency.supported"]);
  } catch { /* keep default */ }
  return { base, supported };
}

export async function setCurrencySettings(_auth: AuthCtx, input: CurrencySettingsInput) {
  const cid = await companyId();
  await prisma.$transaction([
    prisma.setting.upsert({
      where: { companyId_key: { companyId: cid, key: "currency.base" } },
      update: { value: input.base },
      create: { companyId: cid, key: "currency.base", value: input.base, group: "currency" },
    }),
    prisma.setting.upsert({
      where: { companyId_key: { companyId: cid, key: "currency.supported" } },
      update: { value: JSON.stringify(input.supported) },
      create: { companyId: cid, key: "currency.supported", value: JSON.stringify(input.supported), group: "currency" },
    }),
  ]);
  return { base: input.base, supported: input.supported };
}
