import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listAccountsHandler, createAccountHandler, updateAccountHandler, deleteAccountHandler,
  listBankHandler, createBankHandler, updateBankHandler, deleteBankHandler,
  listJournalHandler, getJournalHandler, createJournalHandler, postJournalHandler, reverseJournalHandler,
  listExpensesHandler, createExpenseHandler, listIncomeHandler, createIncomeHandler,
} from "../controllers/accounts.controller";

// Accounts module. COA + bank accounts are COMPANY-WIDE (RBAC only). Journal /
// expense / income are BRANCH-SCOPED (branchWhere in the service).
export const accountsRouter = Router();
const view = requirePermission("accounts", "view");
const manage = requirePermission("accounts", "manage");

accountsRouter.get("/accounts", requireAuth, view, asyncHandler(listAccountsHandler));
accountsRouter.post("/accounts", requireAuth, manage, asyncHandler(createAccountHandler));
accountsRouter.patch("/accounts/:id", requireAuth, manage, asyncHandler(updateAccountHandler));
accountsRouter.delete("/accounts/:id", requireAuth, manage, asyncHandler(deleteAccountHandler));

accountsRouter.get("/bank-accounts", requireAuth, view, asyncHandler(listBankHandler));
accountsRouter.post("/bank-accounts", requireAuth, manage, asyncHandler(createBankHandler));
accountsRouter.patch("/bank-accounts/:id", requireAuth, manage, asyncHandler(updateBankHandler));
accountsRouter.delete("/bank-accounts/:id", requireAuth, manage, asyncHandler(deleteBankHandler));

// journal — immutable: create + post + reverse only, NO update/delete
accountsRouter.get("/journal", requireAuth, view, asyncHandler(listJournalHandler));
accountsRouter.get("/journal/:id", requireAuth, view, asyncHandler(getJournalHandler));
accountsRouter.post("/journal", requireAuth, manage, asyncHandler(createJournalHandler));
accountsRouter.post("/journal/:id/post", requireAuth, manage, asyncHandler(postJournalHandler));
accountsRouter.post("/journal/:id/reverse", requireAuth, manage, asyncHandler(reverseJournalHandler));

accountsRouter.get("/expenses", requireAuth, view, asyncHandler(listExpensesHandler));
accountsRouter.post("/expenses", requireAuth, manage, asyncHandler(createExpenseHandler));
accountsRouter.get("/income", requireAuth, view, asyncHandler(listIncomeHandler));
accountsRouter.post("/income", requireAuth, manage, asyncHandler(createIncomeHandler));
