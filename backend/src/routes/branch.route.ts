import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, isGlobalRole } from "../middleware/auth";
import { prisma } from "../lib/prisma";

// Minimal read-only branch list for filter dropdowns. Branch-scoped: global
// roles see every branch; everyone else sees only their own.
export const branchRouter = Router();

branchRouter.get(
  "/branches",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const where = isGlobalRole(auth.role) ? {} : { id: auth.branchId ?? "__none__" };
    const branches = await prisma.branch.findMany({
      where,
      select: { id: true, code: true, name: true, city: true, isHq: true },
      orderBy: [{ isHq: "desc" }, { name: "asc" }],
    });
    res.json({ data: branches });
  }),
);
