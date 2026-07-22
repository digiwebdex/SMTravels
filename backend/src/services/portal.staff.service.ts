/**
 * Staff Portal service. Staff is BRANCH-SCOPED (branchWhere), NOT owner-scoped:
 * they have no Customer/Agent/Supplier link. Two scopes combine:
 *   - branch data (their branch's customers / documents / announcements / tickets)
 *     pinned to auth.branchId — a staffer never sees another branch's rows.
 *   - assigned-to-me (their tasks / bookings) pinned to auth.userId.
 * Fetch/mutate-by-id 404s cross-branch or cross-assignee.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthCtx } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  StaffProfile, StaffTask, StaffBooking, StaffCustomer, StaffDocument,
  StaffAnnouncement, StaffDashboard, TaskCreateInput,
} from "../contracts/portal.contract";

const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : Number(d));
const iso = (d: Date): string => d.toISOString();
const dOnly = (d: Date | null | undefined): string | null => (d ? d.toISOString().slice(0, 10) : null);

/** The staff caller's branch id (403 if the account has no branch). */
function branchOf(auth: AuthCtx): string {
  if (!auth.branchId) throw new HttpError(403, "NoBranch", { detail: "This account has no branch." });
  return auth.branchId;
}

export async function getProfile(auth: AuthCtx): Promise<StaffProfile> {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: auth.userId }, include: { branch: { select: { name: true } } } }); // direct → nid decrypts
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, nid: u.nid, employeeId: u.employeeId, department: u.department, role: u.role, branchName: u.branch?.name ?? null };
}

// ── tasks (assigned-to-me) ──────────────────────────────────────────────────────
const toTask = (t: { id: string; title: string; priority: string; status: string; category: string | null; dueAt: Date | null; createdAt: Date }): StaffTask => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, category: t.category, dueAt: t.dueAt ? iso(t.dueAt) : null, createdAt: iso(t.createdAt) });

export async function listTasks(auth: AuthCtx): Promise<StaffTask[]> {
  const rows = await prisma.task.findMany({ where: { assigneeId: auth.userId, deletedAt: null }, orderBy: [{ status: "asc" }, { dueAt: "asc" }] });
  return rows.map(toTask);
}
export async function createTask(auth: AuthCtx, input: TaskCreateInput): Promise<StaffTask> {
  const t = await prisma.task.create({ data: { assigneeId: auth.userId, title: input.title, priority: input.priority, category: input.category, status: "TODO", dueAt: input.dueAt ? new Date(input.dueAt) : null } });
  return toTask(t);
}
/** Toggle/set status on an OWN task — 404 if the task is not assigned to me. */
export async function setTaskStatus(auth: AuthCtx, id: string, status: string): Promise<StaffTask> {
  const owned = await prisma.task.findFirst({ where: { id, assigneeId: auth.userId, deletedAt: null }, select: { id: true } });
  if (!owned) throw new HttpError(404, "NotFound", { detail: "Task not found." });
  const t = await prisma.task.update({ where: { id }, data: { status: status as never } });
  return toTask(t);
}

// ── assigned bookings (assignedStaffId = me) ────────────────────────────────────
export async function listBookings(auth: AuthCtx): Promise<StaffBooking[]> {
  const rows = await prisma.booking.findMany({ where: { assignedStaffId: auth.userId, deletedAt: null }, include: { customer: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  return rows.map((b) => ({ id: b.id, bookingNo: b.bookingNo, customerName: b.customer?.name ?? null, serviceType: b.serviceType, status: b.status, departureDate: dOnly(b.departureDate), baseAmount: num(b.baseAmount) }));
}

// ── branch customers (branchWhere) ──────────────────────────────────────────────
export async function listCustomers(auth: AuthCtx): Promise<StaffCustomer[]> {
  const branchId = branchOf(auth);
  const rows = await prisma.customer.findMany({ where: { branchId, deletedAt: null }, include: { _count: { select: { bookings: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return rows.map((c) => ({ id: c.id, name: c.name, phone: c.phone, bookings: c._count.bookings, createdAt: iso(c.createdAt) }));
}

// ── branch documents (docs on this branch's bookings or customers) ──────────────
export async function listDocuments(auth: AuthCtx): Promise<StaffDocument[]> {
  const branchId = branchOf(auth);
  const custIds = (await prisma.customer.findMany({ where: { branchId, deletedAt: null }, select: { id: true } })).map((c) => c.id);
  const rows = await prisma.document.findMany({
    where: { deletedAt: null, OR: [{ booking: { branchId } }, { customerId: { in: custIds } }] },
    orderBy: { createdAt: "desc" }, take: 200,
  });
  return rows.map((d) => ({ id: d.id, name: d.name, type: d.type, status: d.status, createdAt: iso(d.createdAt) }));
}

// ── announcements (branch + global) ─────────────────────────────────────────────
export async function listAnnouncements(auth: AuthCtx): Promise<StaffAnnouncement[]> {
  const branchId = branchOf(auth);
  const rows = await prisma.announcement.findMany({ where: { deletedAt: null, OR: [{ branchId }, { branchId: null }] }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] });
  return rows.map((a) => ({ id: a.id, title: a.title, body: a.body, pinned: a.pinned, createdAt: iso(a.createdAt) }));
}

// ── dashboard ────────────────────────────────────────────────────────────────────
export async function getDashboard(auth: AuthCtx): Promise<StaffDashboard> {
  const branchId = branchOf(auth);
  const [u, tasks, bookingCount, custCount, pinned] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: auth.userId }, select: { name: true, branch: { select: { name: true } } } }),
    prisma.task.findMany({ where: { assigneeId: auth.userId, deletedAt: null }, select: { status: true } }),
    prisma.booking.count({ where: { assignedStaffId: auth.userId, deletedAt: null } }),
    prisma.customer.count({ where: { branchId, deletedAt: null } }),
    prisma.announcement.findMany({ where: { deletedAt: null, pinned: true, OR: [{ branchId }, { branchId: null }] }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const byStatus = new Map<string, number>();
  for (const t of tasks) byStatus.set(t.status, (byStatus.get(t.status) ?? 0) + 1);
  return {
    staffName: u.name, branchName: u.branch?.name ?? null,
    counts: { openTasks: tasks.filter((t) => t.status !== "DONE").length, assignedBookings: bookingCount, branchCustomers: custCount },
    tasksByStatus: [...byStatus.entries()].map(([status, count]) => ({ status, count })),
    pinnedAnnouncements: pinned.map((a) => ({ id: a.id, title: a.title, body: a.body, pinned: a.pinned, createdAt: iso(a.createdAt) })),
  };
}
