import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";
import type { CompanyUpdateInput, CompanyDto } from "../contracts/company.contract";

type CompanyRow = {
  id: string; name: string; legalName: string | null; address: string | null;
  phone: string | null; email: string | null; website: string | null;
  logoUrl: string | null; primaryColor: string | null;
};
function toDto(c: CompanyRow): CompanyDto {
  return {
    id: c.id, name: c.name, legalName: c.legalName, address: c.address,
    phone: c.phone, email: c.email, website: c.website, logoUrl: c.logoUrl, primaryColor: c.primaryColor,
  };
}

/** The company is a singleton — return the first (oldest) row. */
export async function getCompany(): Promise<CompanyDto> {
  const c = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  if (!c) throw new HttpError(404, "NotFound");
  return toDto(c);
}

export async function updateCompany(input: CompanyUpdateInput): Promise<CompanyDto> {
  const c = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  if (!c) throw new HttpError(404, "NotFound");
  const updated = await prisma.company.update({ where: { id: c.id }, data: input });
  return toDto(updated);
}
