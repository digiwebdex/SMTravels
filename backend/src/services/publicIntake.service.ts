/**
 * Public website → CRM intake. Both forms become Leads (source "website") in
 * the HQ branch, immediately visible in /erp/crm.
 *
 * Duplicate policy: the CRM enforces one active lead per (branch, phone). A
 * repeat inquiry from the same phone must NOT error out a visitor — it appends
 * a note + activity to the existing lead instead. Either way the caller gets
 * the same minimal `{ ok: true }`, so the endpoint never discloses whether a
 * phone number is already known (no enumeration).
 */
import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";
import type { PublicBookingRequestInput, PublicContactInput, PublicIntakeResult } from "../contracts/public.contract";

/** HQ branch id, resolved once per boot (isHq → oldest branch as fallback). */
let hqBranchId: string | null = null;
async function resolveHqBranch(): Promise<string> {
  if (hqBranchId) return hqBranchId;
  const hq =
    (await prisma.branch.findFirst({ where: { isHq: true }, select: { id: true } })) ??
    (await prisma.branch.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }));
  if (!hq) throw new HttpError(503, "NotReady", { detail: "No branch configured yet." });
  hqBranchId = hq.id;
  return hq.id;
}

interface LeadSeedData {
  name: string;
  phone: string;
  email: string | null;
  serviceInterest: PublicBookingRequestInput["serviceInterest"] | null;
  quantity: number | null;
  note: string;
}

async function upsertWebsiteLead(data: LeadSeedData): Promise<void> {
  const branchId = await resolveHqBranch();

  const existing = await prisma.lead.findFirst({
    where: { branchId, phone: data.phone, deletedAt: null },
    select: { id: true },
  });

  if (existing) {
    // Repeat inquiry — enrich the existing lead, never a visitor-facing error.
    await prisma.$transaction([
      prisma.note.create({ data: { leadId: existing.id, body: data.note } }),
      prisma.leadActivity.create({
        data: { leadId: existing.id, actorId: null, type: "WEBSITE_INQUIRY", note: "Repeat inquiry from the website form" },
      }),
    ]);
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          branchId,
          name: data.name,
          phone: data.phone,
          email: data.email,
          source: "website",
          serviceInterest: data.serviceInterest ?? undefined,
          quantity: data.quantity ?? undefined,
          // interest/stage keep their defaults (MEDIUM / NEW); no creator (anonymous)
        },
      });
      await tx.note.create({ data: { leadId: lead.id, body: data.note } });
      await tx.leadActivity.create({
        data: { leadId: lead.id, actorId: null, type: "CREATED", note: "Created from the website form" },
      });
    });
  } catch (err: unknown) {
    // Race with a concurrent submit hitting the partial unique index — treat as
    // the repeat-inquiry case (the first submit already carries the details).
    if ((err as { code?: string }).code !== "P2002") throw err;
  }
}

export async function submitBookingRequest(input: PublicBookingRequestInput): Promise<PublicIntakeResult> {
  const details = [
    input.travelingFrom && `From: ${input.travelingFrom}`,
    input.destination && `Destination: ${input.destination}`,
    input.departDate && `Departure: ${input.departDate}`,
    input.returnDate && `Return: ${input.returnDate}`,
    input.travelers != null && `Travelers: ${input.travelers}`,
    input.notes && `Notes: ${input.notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  await upsertWebsiteLead({
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    serviceInterest: input.serviceInterest,
    quantity: input.travelers ?? null,
    note: `Website booking request\n${details || "(no extra details)"}`,
  });
  return { ok: true };
}

export async function submitContact(input: PublicContactInput): Promise<PublicIntakeResult> {
  await upsertWebsiteLead({
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    serviceInterest: input.serviceInterest ?? null,
    quantity: null,
    note: `Website contact form\n${input.message}`,
  });
  return { ok: true };
}
