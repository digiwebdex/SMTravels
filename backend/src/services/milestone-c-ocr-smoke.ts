/**
 * Milestone C — OCR workflow smoke (service-level).
 * Run: node -r dotenv/config node_modules/tsx/dist/cli.mjs src/services/milestone-c-ocr-smoke.ts
 *   (with DOTENV_CONFIG_PATH pointing at the production env file)
 */
import { PrismaClient } from "@prisma/client";
import * as ocr from "./ocr.service";
import { parsePassportFields } from "./googleVision.service";
import type { AuthCtx } from "../middleware/auth";

const prisma = new PrismaClient();

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { deletedAt: null },
    select: { id: true, role: true, branchId: true },
    orderBy: { createdAt: "asc" },
  });
  assert(user, "Need a user");
  const branch = await prisma.branch.findFirst({});
  assert(branch, "Need a branch");
  const auth: AuthCtx = { userId: user.id, role: user.role, branchId: user.branchId ?? branch.id };

  const sample = `
PASSPORT
Type P Code BGD
Passport No. BX1234567
Surname RAHMAN
Given Names KARIM
Nationality BANGLADESHI
Date of Birth 15 JAN 1990
Sex M
Date of Expiry 14 JAN 2030
P<BGDRAHMAN<<KARIM<<<<<<<<<<<<<<<<<<<<<<<
BX1234567BGD9001151M3001140<<<<<<<<<<<<<<06
`;
  const parsed = parsePassportFields(sample);
  assert(parsed.passportNo, "parser passportNo");
  assert(parsed.name, "parser name");
  assert(parsed.mrz, "parser mrz");
  console.log("✓ Passport field parser (MRZ + labels)");

  const phone = `019${String(Date.now()).slice(-8)}`;
  const apply1 = await ocr.applyOcr(auth, {
    target: "customer",
    createCustomer: true,
    phone,
    persist: true,
    fields: {
      fullName: "Karim Rahman",
      passportNumber: "BX1234567",
      dateOfBirth: "1990-01-15",
      dateOfExpiry: "2030-01-14",
      nationality: "Bangladeshi",
      gender: "MALE",
      issueCountry: "BGD",
      mrz: parsed.mrz,
      confidence: 92,
    },
  });
  assert(apply1.persisted, "apply persisted");
  assert(apply1.createdCustomer, "customer created");
  assert(apply1.customerId, "customerId");
  const cust = await prisma.customer.findUniqueOrThrow({ where: { id: apply1.customerId! } });
  assert(cust.passportNo, "customer passport persisted");
  assert(cust.passportExpiry, "customer passportExpiry persisted");
  assert(cust.nationality === "Bangladeshi", "customer nationality");
  console.log("✓ Apply creates customer with passport/expiry/nationality");

  const apply2 = await ocr.applyOcr(auth, {
    target: "customer",
    createCustomer: true,
    phone: `018${String(Date.now()).slice(-8)}`,
    persist: true,
    fields: {
      fullName: "Karim Rahman Updated",
      passportNumber: "BX1234567",
      dateOfExpiry: "2030-01-14",
      nationality: "Bangladeshi",
      confidence: 90,
    },
  });
  assert(apply2.customerId === apply1.customerId, "dedupe by passport hash");
  assert(apply2.updatedCustomer || !apply2.createdCustomer, "updated existing, not duplicate");
  console.log("✓ No duplicate customer on same passport");

  const doc = await prisma.document.create({
    data: {
      ownerType: "CUSTOMER",
      customerId: apply1.customerId!,
      type: "PASSPORT",
      name: `smoke-passport-${Date.now()}.pdf`,
      filePath: null,
      status: "UPLOADED",
      uploadedById: user.id,
      ocrStatus: "COMPLETED",
      ocrConfidence: 72,
      ocrName: "KARIM RAHHAN",
      ocrPassportNo: "BX1234567",
      ocrDob: new Date("1990-01-15T00:00:00.000Z"),
      ocrExpiry: new Date("2030-01-14T00:00:00.000Z"),
      ocrNationality: "BGD",
      ocrGender: "MALE",
      ocrIssueCountry: "BGD",
      ocrMrz: parsed.mrz,
      ocrOriginalFields: {
        fullName: "KARIM RAHHAN",
        passportNumber: "BX1234567",
        mrz: parsed.mrz,
        confidence: 72,
      },
    },
  });

  const corrected = await ocr.correctDocumentOcr(auth, doc.id, {
    fields: { fullName: "Karim Rahman" },
  });
  assert(corrected.ocrName === "Karim Rahman", "correction saved");
  assert(corrected.ocrStatus === "CORRECTED", "status CORRECTED");
  assert(corrected.ocrReviewedById === user.id, "reviewer stored");
  assert(corrected.ocrCorrectedFields?.fullName?.corrected === "Karim Rahman", "corrected fields map");
  console.log("✓ Validation corrections + reviewer timestamp");

  const applied = await ocr.applyOcr(auth, {
    target: "customer",
    documentId: doc.id,
    customerId: apply1.customerId!,
    persist: true,
    fields: {
      fullName: "Karim Rahman",
      passportNumber: "BX1234567",
      dateOfBirth: "1990-01-15",
      dateOfExpiry: "2030-01-14",
      nationality: "Bangladeshi",
      gender: "MALE",
      mrz: parsed.mrz,
      confidence: 95,
    },
    correctedFields: { fullName: "Karim Rahman" },
  });
  assert(applied.documentId === doc.id, "document linked");
  const docAfter = await prisma.document.findUniqueOrThrow({ where: { id: doc.id } });
  assert(docAfter.ocrStatus === "APPLIED", "document APPLIED");
  assert(docAfter.ocrAppliedAt, "ocrAppliedAt set");
  assert(docAfter.ocrMrz, "MRZ persisted on document");
  assert(docAfter.status === "VERIFIED", "document verified on apply");
  assert(docAfter.customerId === apply1.customerId, "document linked to customer");
  console.log("✓ Apply persists document MRZ/confidence + links customer");

  const booking = await prisma.booking.create({
    data: {
      branchId: branch.id,
      customerId: apply1.customerId!,
      serviceType: "VISA",
      status: "CONFIRMED",
      bookingNo: `BK-OCR-${Date.now().toString(36)}`,
      amount: 5000,
      baseAmount: 5000,
      paidAmount: 0,
      travelersCount: 1,
      createdById: user.id,
    },
  });
  const traveler = await prisma.traveler.create({
    data: {
      bookingId: booking.id,
      name: "Placeholder",
      isPrimary: true,
    },
  });
  await prisma.document.update({
    where: { id: doc.id },
    data: { bookingId: booking.id, travelerId: traveler.id },
  });

  await ocr.applyOcr(auth, {
    target: "traveler",
    travelerId: traveler.id,
    bookingId: booking.id,
    documentId: doc.id,
    persist: true,
    fields: {
      fullName: "Karim Rahman",
      passportNumber: "BX1234567",
      dateOfBirth: "1990-01-15",
      dateOfExpiry: "2030-01-14",
      nationality: "Bangladeshi",
      gender: "MALE",
      mrz: parsed.mrz,
      confidence: 95,
    },
  });
  const tAfter = await prisma.traveler.findUniqueOrThrow({ where: { id: traveler.id } });
  assert(tAfter.name === "Karim Rahman", "traveler name autofilled");
  assert(tAfter.passportNo, "traveler passport");
  assert(tAfter.passportExpiry, "traveler expiry");
  assert(tAfter.nationality === "Bangladeshi", "traveler nationality");
  assert(tAfter.gender === "MALE", "traveler gender");
  console.log("✓ Booking traveler autofill from OCR Apply");

  const logs = await prisma.activityLog.findMany({
    where: {
      module: "documents",
      action: { in: ["OCR_CORRECTED", "OCR_APPLIED"] },
      target: doc.id,
    },
  });
  assert(logs.length >= 2, "audit logs for correct + apply");
  const hist = await ocr.listOcrHistory(auth, 1, 20);
  assert(hist.total >= 1, "ocr history endpoint returns rows");
  console.log("✓ Audit trail (activity log + history API)");

  console.log("\nAll Milestone C OCR workflow scenarios PASSED.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
