import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission, isGlobalRole } from "../middleware/auth";
import { prisma } from "../lib/prisma";

// Minimal read-only staff directory for assignee dropdowns. Branch-scoped:
// global roles see everyone; others see only their branch's internal staff.
export const userRouter = Router();

userRouter.get(
  "/users",
  requireAuth,
  requirePermission("crm", "view"),
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const where = {
      status: "active",
      deletedAt: null,
      role: { notIn: [UserRole.CUSTOMER, UserRole.AGENT, UserRole.SUPPLIER] },
      ...(isGlobalRole(auth.role) ? {} : { branchId: auth.branchId ?? "__none__" }),
    };
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, role: true, branchId: true },
      orderBy: { name: "asc" },
    });
    res.json({ data: users });
  }),
);
