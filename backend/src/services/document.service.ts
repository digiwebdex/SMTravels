/**
 * Documents service (ERP side). Files live on the server volume under
 * env.UPLOAD_DIR (outside the web root); the DB row only stores a relative
 * filePath. Branch scoping follows the house rule: the filter lives in the
 * WHERE clause (via the owner relations), so a scoped user cannot fetch
 * another branch's document even by guessing its id — the query returns
 * nothing (→ 404). Suppliers have no branch → supplier docs are visible to
 * any staff holding the documents permission.
 */
import { Prisma, DocumentOwnerType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthCtx, branchWhere, isGlobalRole } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { moveIntoStore, removeQuietly, absoluteStorePath } from "../lib/uploads";
import type {
  DocumentDto, DocumentListResult, DocumentListQuery, DocumentUploadInput,
} from "../contracts/document.contract";

const dOnly = (d: Date | null | undefined): string | null => (d ? d.toISOString().slice(0, 10) : null);

type DocWithOwners = Prisma.DocumentGetPayload<{
  include: {
    booking: { select: { bookingNo: true } };
    traveler: { select: { name: true } };
    customer: { select: { name: true } };
    supplier: { select: { name: true } };
  };
}>;

const ownerInclude = {
  booking: { select: { bookingNo: true } },
  traveler: { select: { name: true } },
  customer: { select: { name: true } },
  supplier: { select: { name: true } },
} as const;

const toDto = (d: DocWithOwners): DocumentDto => ({
  id: d.id,
  name: d.name,
  type: d.type,
  status: d.status,
  required: d.required,
  ownerType: d.ownerType,
  bookingId: d.bookingId,
  bookingNo: d.booking?.bookingNo ?? null,
  travelerId: d.travelerId,
  customerId: d.customerId,
  supplierId: d.supplierId,
  ownerLabel: d.booking?.bookingNo ?? d.traveler?.name ?? d.customer?.name ?? d.supplier?.name ?? null,
  mimeType: d.mimeType,
  sizeBytes: d.sizeBytes,
  hasFile: !!d.filePath,
  expiryAt: dOnly(d.expiryAt),
  createdAt: d.createdAt.toISOString(),
});

/** WHERE fragment every ERP document query starts from. Global roles see all;
 *  branch users see documents whose OWNER lives in their branch. */
function scopedWhere(auth: AuthCtx): Prisma.DocumentWhereInput {
  if (isGlobalRole(auth.role)) return { deletedAt: null };
  const bw = branchWhere(auth);
  return {
    deletedAt: null,
    OR: [
      { booking: { ...bw, deletedAt: null } },
      { traveler: { booking: { ...bw, deletedAt: null } } },
      { customer: { ...bw, deletedAt: null } },
      { supplier: { deletedAt: null } }, // suppliers are company-wide (no branch)
    ],
  };
}

export async function listDocuments(auth: AuthCtx, query: DocumentListQuery): Promise<DocumentListResult> {
  const where: Prisma.DocumentWhereInput = {
    ...scopedWhere(auth),
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.bookingId ? { bookingId: query.bookingId } : {}),
    ...(query.travelerId ? { travelerId: query.travelerId } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    ...(query.q ? { name: { contains: query.q, mode: "insensitive" as const } } : {}),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      include: ownerInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return { data: rows.map(toDto), total, page: query.page, pageSize: query.pageSize };
}

/** Resolve + authorize the upload target, returning the ownerType. 404s (not
 *  403s) on a target outside the caller's branch — same shape as a bad id. */
async function resolveTarget(auth: AuthCtx, input: DocumentUploadInput): Promise<DocumentOwnerType> {
  const bw = branchWhere(auth);
  if (input.bookingId) {
    const b = await prisma.booking.findFirst({ where: { id: input.bookingId, ...bw, deletedAt: null }, select: { id: true } });
    if (!b) throw new HttpError(404, "NotFound", { detail: "Booking not found." });
    return DocumentOwnerType.BOOKING;
  }
  if (input.travelerId) {
    const t = await prisma.traveler.findFirst({ where: { id: input.travelerId, booking: { ...bw, deletedAt: null } }, select: { id: true } });
    if (!t) throw new HttpError(404, "NotFound", { detail: "Traveler not found." });
    return DocumentOwnerType.TRAVELER;
  }
  if (input.customerId) {
    const c = await prisma.customer.findFirst({ where: { id: input.customerId, ...bw, deletedAt: null }, select: { id: true } });
    if (!c) throw new HttpError(404, "NotFound", { detail: "Customer not found." });
    return DocumentOwnerType.CUSTOMER;
  }
  if (input.supplierId) {
    const s = await prisma.supplier.findFirst({ where: { id: input.supplierId, deletedAt: null }, select: { id: true } });
    if (!s) throw new HttpError(404, "NotFound", { detail: "Supplier not found." });
    return DocumentOwnerType.SUPPLIER;
  }
  throw new HttpError(400, "ValidationError", { detail: "An owner id is required." }); // unreachable (zod refine)
}

export async function createDocument(
  auth: AuthCtx,
  file: Express.Multer.File,
  input: DocumentUploadInput,
): Promise<DocumentDto> {
  try {
    const ownerType = await resolveTarget(auth, input);
    const filePath = moveIntoStore(file.path, file.mimetype);
    const doc = await prisma.document.create({
      data: {
        ownerType,
        bookingId: input.bookingId ?? null,
        travelerId: input.travelerId ?? null,
        customerId: input.customerId ?? null,
        supplierId: input.supplierId ?? null,
        type: input.type,
        name: input.name ?? file.originalname,
        filePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        status: "UPLOADED",
        required: input.required ?? false,
        expiryAt: input.expiryAt ?? null,
        uploadedById: auth.userId,
      },
      include: ownerInclude,
    });
    return toDto(doc);
  } catch (err) {
    removeQuietly(file.path); // failed request must not leave an orphan file
    throw err;
  }
}

export interface FileHandle {
  absPath: string;
  mimeType: string;
  name: string;
}

export async function getDocumentFile(auth: AuthCtx, id: string): Promise<FileHandle> {
  const d = await prisma.document.findFirst({
    where: { id, ...scopedWhere(auth) },
    select: { filePath: true, mimeType: true, name: true },
  });
  if (!d || !d.filePath) throw new HttpError(404, "NotFound", { detail: "Document file not found." });
  return { absPath: absoluteStorePath(d.filePath), mimeType: d.mimeType ?? "application/octet-stream", name: d.name };
}
