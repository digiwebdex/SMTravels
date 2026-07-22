/**
 * Accountant Portal service. The accountant is BRANCH-SCOPED (branchWhere) and
 * has real finance permissions, so the portal mostly REUSES the existing finance
 * & report endpoints (/reports/*, /journal, /invoices, /income, /expenses) — all
 * already branch-scoped. This service adds only the accountant's own profile and
 * a composed financial dashboard (derived from the branch-scoped report service).
 */
import { prisma } from "../lib/prisma";
import { AuthCtx } from "../middleware/auth";
import * as reports from "./report.service";
import type { AccountantProfile, AccountantDashboard } from "../contracts/portal.contract";

export async function getProfile(auth: AuthCtx): Promise<AccountantProfile> {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: auth.userId }, include: { branch: { select: { name: true } } } }); // direct → nid decrypts
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, nid: u.nid, employeeId: u.employeeId, department: u.department, role: u.role, branchName: u.branch?.name ?? null };
}

export async function getDashboard(auth: AuthCtx): Promise<AccountantDashboard> {
  const [u, pnl, sales, jcount] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: auth.userId }, select: { name: true, branch: { select: { name: true } } } }),
    reports.pnl(auth, { range: "ytd" }),      // branch-scoped for the accountant
    reports.sales(auth, { range: "ytd" }),
    prisma.journalEntry.count({ where: { status: "POSTED", ...(auth.branchId ? { branchId: auth.branchId } : {}) } }),
  ]);
  return {
    accountantName: u.name, branchName: u.branch?.name ?? null,
    revenue: pnl.revenue, expense: pnl.expense, netProfit: pnl.netProfit,
    invoices: { billed: sales.totalRevenue, collected: sales.totalCollected, outstanding: Math.round((sales.totalRevenue - sales.totalCollected) * 100) / 100 },
    postedJournalCount: jcount,
  };
}
