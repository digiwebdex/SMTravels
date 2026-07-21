import { Prisma, type AccountClass, type NormalBalance } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { mapUniqueError } from "../lib/prismaErrors";
import type {
  AccountCreateInput, AccountUpdateInput, AccountDto,
  BankAccountCreateInput, BankAccountUpdateInput, BankAccountDto,
} from "../contracts/finance.contract";

// Chart of accounts + bank accounts are COMPANY-WIDE (no branchId) → RBAC only.
const num = (v: Prisma.Decimal | number | null | undefined): number => (v == null ? 0 : typeof v === "number" ? v : Number(v));

function defaultNormalBalance(cls: AccountClass): NormalBalance {
  return cls === "ASSET" || cls === "EXPENSE" ? "DEBIT" : "CREDIT";
}

function toAccountDto(a: Prisma.AccountGetPayload<object>): AccountDto {
  return {
    id: a.id, code: a.code, name: a.name, parentId: a.parentId, accountClass: a.accountClass, role: a.role,
    normalBalance: a.normalBalance, currency: a.currency as AccountDto["currency"], balance: num(a.balance), active: a.active,
  };
}

export async function listAccounts(_auth: AuthCtx): Promise<{ data: AccountDto[] }> {
  const rows = await prisma.account.findMany({ where: { deletedAt: null }, orderBy: { code: "asc" } });
  return { data: rows.map(toAccountDto) };
}

export async function createAccount(auth: AuthCtx, input: AccountCreateInput): Promise<AccountDto> {
  let id: string;
  try {
    const a = await prisma.account.create({
      data: {
        code: input.code, name: input.name, parentId: input.parentId || null, accountClass: input.accountClass as AccountClass,
        role: input.role ?? "DETAIL", normalBalance: (input.normalBalance as NormalBalance) ?? defaultNormalBalance(input.accountClass as AccountClass),
        currency: input.currency ?? "BDT", active: input.active ?? true,
      },
    });
    id = a.id;
  } catch (err) { mapUniqueError(err); }
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "ACCOUNT_CREATED", target: id!, module: "accounts" } });
  return toAccountDto(await prisma.account.findUniqueOrThrow({ where: { id: id! } }));
}

export async function updateAccount(auth: AuthCtx, id: string, input: AccountUpdateInput): Promise<AccountDto> {
  const existing = await prisma.account.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  const data: Prisma.AccountUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.accountClass !== undefined) data.accountClass = input.accountClass as AccountClass;
  if (input.role !== undefined) data.role = input.role;
  if (input.normalBalance !== undefined) data.normalBalance = input.normalBalance as NormalBalance;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.active !== undefined) data.active = input.active;
  if (input.parentId !== undefined) data.parent = input.parentId ? { connect: { id: input.parentId } } : { disconnect: true };
  await prisma.account.update({ where: { id }, data });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "ACCOUNT_UPDATED", target: id, module: "accounts" } });
  return toAccountDto(await prisma.account.findUniqueOrThrow({ where: { id } }));
}

export async function deleteAccount(auth: AuthCtx, id: string): Promise<void> {
  const a = await prisma.account.findFirst({ where: { id, deletedAt: null }, select: { id: true, _count: { select: { journalLines: true, children: true } } } });
  if (!a) throw new HttpError(404, "NotFound");
  if (a._count.journalLines > 0) throw new HttpError(409, "AccountInUse", { detail: "Account has journal lines; deactivate it instead." });
  if (a._count.children > 0) throw new HttpError(409, "AccountHasChildren", { detail: "Account has sub-accounts." });
  await prisma.account.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "ACCOUNT_DELETED", target: id, module: "accounts" } });
}

// ── bank accounts ─────────────────────────────────────────────────────────────
function toBankDto(b: Prisma.BankAccountGetPayload<object>): BankAccountDto {
  return {
    id: b.id, name: b.name, bankName: b.bankName, type: b.type, accountNumber: b.accountNumber, iban: b.iban,
    branchName: b.branchName, currency: b.currency as BankAccountDto["currency"], balance: num(b.balance), coaAccountId: b.coaAccountId, active: b.active,
  };
}

export async function listBankAccounts(_auth: AuthCtx): Promise<{ data: BankAccountDto[] }> {
  const rows = await prisma.bankAccount.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" } });
  return { data: rows.map(toBankDto) };
}

export async function createBankAccount(auth: AuthCtx, input: BankAccountCreateInput): Promise<BankAccountDto> {
  const b = await prisma.bankAccount.create({
    data: {
      name: input.name, bankName: input.bankName, type: input.type ?? "CURRENT", accountNumber: input.accountNumber, iban: input.iban,
      branchName: input.branchName, currency: input.currency ?? "BDT", coaAccountId: input.coaAccountId || null,
      active: input.active ?? true, balance: input.openingBalance ?? 0,
    },
  });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "BANK_ACCOUNT_CREATED", target: b.id, module: "accounts" } });
  return toBankDto(b);
}

export async function updateBankAccount(auth: AuthCtx, id: string, input: BankAccountUpdateInput): Promise<BankAccountDto> {
  const existing = await prisma.bankAccount.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "NotFound");
  const data: Prisma.BankAccountUpdateInput = {};
  for (const k of ["name", "bankName", "type", "accountNumber", "iban", "branchName", "currency", "active"] as const) {
    if (input[k] !== undefined) (data as Record<string, unknown>)[k] = input[k];
  }
  if (input.coaAccountId !== undefined) data.coaAccount = input.coaAccountId ? { connect: { id: input.coaAccountId } } : { disconnect: true };
  await prisma.bankAccount.update({ where: { id }, data });
  await prisma.activityLog.create({ data: { userId: auth.userId, action: "BANK_ACCOUNT_UPDATED", target: id, module: "accounts" } });
  return toBankDto(await prisma.bankAccount.findUniqueOrThrow({ where: { id } }));
}

export async function deleteBankAccount(_auth: AuthCtx, id: string): Promise<void> {
  const b = await prisma.bankAccount.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!b) throw new HttpError(404, "NotFound");
  await prisma.bankAccount.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
}
