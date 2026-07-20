import { prisma } from "../lib/prisma";
import { branchWhere, type AuthCtx } from "../middleware/auth";

const listSelect = {
  id: true,
  branchId: true,
  name: true,
  phone: true,
  email: true,
  district: true,
  division: true,
  createdAt: true,
} as const;

/** List customers the caller is allowed to see. `branchWhere(auth)` pins
 *  non-global roles to their own branch — this is the pattern every list query
 *  in the app reuses. */
export function listCustomers(auth: AuthCtx) {
  return prisma.customer.findMany({
    where: { ...branchWhere(auth), deletedAt: null },
    select: listSelect,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** Fetch one by id. The branch filter is IN the WHERE, so a scoped user asking
 *  for another branch's id gets null → the controller returns 404. Guessing the
 *  id does not help. */
export function getCustomer(auth: AuthCtx, id: string) {
  return prisma.customer.findFirst({
    where: { id, ...branchWhere(auth), deletedAt: null },
    select: listSelect,
  });
}
