import type { Request, Response } from "express";
import {
  accountCreateSchema, accountUpdateSchema, bankAccountCreateSchema, bankAccountUpdateSchema,
  journalCreateSchema, journalListQuerySchema, expenseCreateSchema, incomeCreateSchema, ledgerListQuerySchema,
} from "../contracts/finance.contract";
import * as accounts from "../services/account.service";
import * as journal from "../services/journal.service";
import * as ledger from "../services/ledger.service";

// chart of accounts
export async function listAccountsHandler(req: Request, res: Response) { res.json(await accounts.listAccounts(req.auth!)); }
export async function createAccountHandler(req: Request, res: Response) { res.status(201).json(await accounts.createAccount(req.auth!, accountCreateSchema.parse(req.body))); }
export async function updateAccountHandler(req: Request, res: Response) { res.json(await accounts.updateAccount(req.auth!, req.params.id, accountUpdateSchema.parse(req.body))); }
export async function deleteAccountHandler(req: Request, res: Response) { await accounts.deleteAccount(req.auth!, req.params.id); res.json({ ok: true }); }

// bank accounts
export async function listBankHandler(req: Request, res: Response) { res.json(await accounts.listBankAccounts(req.auth!)); }
export async function createBankHandler(req: Request, res: Response) { res.status(201).json(await accounts.createBankAccount(req.auth!, bankAccountCreateSchema.parse(req.body))); }
export async function updateBankHandler(req: Request, res: Response) { res.json(await accounts.updateBankAccount(req.auth!, req.params.id, bankAccountUpdateSchema.parse(req.body))); }
export async function deleteBankHandler(req: Request, res: Response) { await accounts.deleteBankAccount(req.auth!, req.params.id); res.json({ ok: true }); }

// journal (immutable ledger)
export async function listJournalHandler(req: Request, res: Response) { res.json(await journal.listJournal(req.auth!, journalListQuerySchema.parse(req.query))); }
export async function getJournalHandler(req: Request, res: Response) { res.json(await journal.getJournal(req.auth!, req.params.id)); }
export async function createJournalHandler(req: Request, res: Response) { res.status(201).json(await journal.createJournal(req.auth!, journalCreateSchema.parse(req.body))); }
export async function postJournalHandler(req: Request, res: Response) { res.json(await journal.postJournal(req.auth!, req.params.id)); }
export async function reverseJournalHandler(req: Request, res: Response) { res.json(await journal.reverseJournal(req.auth!, req.params.id)); }

// income / expense
export async function listExpensesHandler(req: Request, res: Response) { res.json(await ledger.listExpenses(req.auth!, ledgerListQuerySchema.parse(req.query))); }
export async function createExpenseHandler(req: Request, res: Response) { res.status(201).json(await ledger.createExpense(req.auth!, expenseCreateSchema.parse(req.body))); }
export async function listIncomeHandler(req: Request, res: Response) { res.json(await ledger.listIncome(req.auth!, ledgerListQuerySchema.parse(req.query))); }
export async function createIncomeHandler(req: Request, res: Response) { res.status(201).json(await ledger.createIncome(req.auth!, incomeCreateSchema.parse(req.body))); }
