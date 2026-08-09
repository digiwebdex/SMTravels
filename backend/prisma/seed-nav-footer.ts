/**
 * Phase 2.1 — idempotent nav + footer seed (reuses Menu/MenuItem/Setting).
 * update-or-create keyed on (menuId,label) — never deletes, never duplicates.
 *   npm run seed:nav
 */
import { PrismaClient, type MenuLocation } from "@prisma/client";
const prisma = new PrismaClient();

type Item = { label: string; url: string; icon?: string; openNewTab?: boolean; megaMenu?: boolean; children?: Item[] };
/** exclusive: hide (visible=false) any top-level item in this menu not in `items` — cleans up
 *  leftovers from an earlier seed without deleting them. */
type MenuDef = { location: MenuLocation; name: string; items: Item[]; exclusive?: boolean };

const MENUS: MenuDef[] = [
  { location: "TOP_NAV", name: "Top Bar", items: [
    { label: "About Us", url: "/about" }, { label: "Blog", url: "/blog" }, { label: "Helpline", url: "/contact" },
  ] },
  { location: "MAIN_NAV", name: "Main Navigation", items: [
    { label: "Hajj & Umrah", url: "/hajj", icon: "star" },
    { label: "Visa", url: "/visa", icon: "shield" },
    { label: "Air Ticket", url: "/air-ticket", icon: "plane" },
    { label: "Tour", url: "/tour-packages", icon: "globe" },
    { label: "Hotel", url: "/hotel-booking", icon: "hotel" },
    { label: "Transport", url: "/transport", icon: "car" },
    { label: "Others", url: "#", megaMenu: true, children: [
      { label: "Manpower", url: "/manpower" }, { label: "Knowledge", url: "/knowledge" },
      { label: "Gallery", url: "/gallery" }, { label: "FAQ", url: "/faq" },
      { label: "Packages", url: "/packages" }, { label: "Blog", url: "/blog" },
      { label: "Contact", url: "/contact" },
    ] },
  ] },
  { location: "FOOTER_NAV", name: "Footer — Services", exclusive: true, items: [
    { label: "Hajj", url: "/hajj" }, { label: "Umrah", url: "/umrah" }, { label: "Visa", url: "/visa" },
    { label: "Air Ticket", url: "/air-ticket" }, { label: "Hotel", url: "/hotel-booking" }, { label: "Transport", url: "/transport" },
  ] },
  { location: "QUICK_LINKS", name: "Footer — Quick Links", items: [
    { label: "About", url: "/about" }, { label: "Packages", url: "/packages" }, { label: "Blog", url: "/blog" },
    { label: "Branches", url: "/branches" }, { label: "Knowledge", url: "/knowledge" }, { label: "Career", url: "/career" },
  ] },
  { location: "LEGAL_NAV", name: "Footer — Legal", items: [
    { label: "Privacy", url: "/privacy" }, { label: "Terms", url: "/terms" }, { label: "Refund", url: "/refund" },
  ] },
  { location: "MOBILE_NAV", name: "Mobile Navigation", items: [
    { label: "Home", url: "/" }, { label: "Hajj & Umrah", url: "/hajj" }, { label: "Visa", url: "/visa" },
    { label: "Air Ticket", url: "/air-ticket" }, { label: "Tour", url: "/tour-packages" },
    { label: "Hotel", url: "/hotel-booking" }, { label: "Transport", url: "/transport" },
    { label: "Manpower", url: "/manpower" }, { label: "Knowledge", url: "/knowledge" },
    { label: "Gallery", url: "/gallery" }, { label: "FAQ", url: "/faq" }, { label: "Contact", url: "/contact" },
  ] },
];

let created = 0, updated = 0;

async function upsertItem(menuId: string, parentId: string | null, order: number, it: Item): Promise<string> {
  const data = {
    sortOrder: order, parentId, icon: it.icon ?? null,
    openNewTab: it.openNewTab ?? false, megaMenu: it.megaMenu ?? false,
    visible: true, published: true,
  };
  const existing = await prisma.menuItem.findFirst({ where: { menuId, label: it.label, parentId } })
    ?? await prisma.menuItem.findFirst({ where: { menuId, label: it.label } });
  if (existing) {
    await prisma.menuItem.update({ where: { id: existing.id }, data: { url: it.url, ...data } });
    updated++;
    return existing.id;
  }
  const row = await prisma.menuItem.create({ data: { menuId, label: it.label, url: it.url, ...data } });
  created++;
  return row.id;
}

async function seedMenus() {
  for (const m of MENUS) {
    const menu = await prisma.menu.upsert({
      where: { location: m.location },
      update: { name: m.name },
      create: { location: m.location, name: m.name },
    });
    let order = 0;
    const keptLabels = new Set<string>();
    for (const top of m.items) {
      keptLabels.add(top.label);
      const parentId = await upsertItem(menu.id, null, order++, top);
      let childOrder = 0;
      for (const child of top.children ?? []) await upsertItem(menu.id, parentId, childOrder++, child);
    }
    if (m.exclusive) {
      // Hide (do NOT delete) leftover top-level items from a prior seed.
      const hidden = await prisma.menuItem.updateMany({
        where: { menuId: menu.id, parentId: null, label: { notIn: [...keptLabels] }, visible: true },
        data: { visible: false },
      });
      if (hidden.count) console.log(`  ${m.location}: hid ${hidden.count} leftover item(s)`);
    }
  }
}

const FOOTER_SETTINGS: [string, string, string][] = [
  ["footer", "footer.description", "Trusted Hajj, Umrah, visa and travel services since 1998 — with transparency, government approval and Islamic elegance."],
  ["footer", "footer.copyright", "© SM Travels International. All rights reserved."],
  ["footer", "footer.emergency", "+880 1211 190 022"],
  ["social", "social.facebook", "https://facebook.com/smtravels"],
  ["social", "social.instagram", "https://instagram.com/smtravels"],
  ["social", "social.youtube", "https://youtube.com/@smtravels"],
  ["social", "social.twitter", "https://x.com/smtravels"],
  ["social", "social.linkedin", "https://linkedin.com/company/smtravels"],
  ["company", "company.logo", "/logo.png"],
  ["company", "company.name", "SM Travels International"],
];

async function seedFooterSettings() {
  const company = await prisma.company.findFirst();
  if (!company) return;
  for (const [group, key, value] of FOOTER_SETTINGS) {
    await prisma.setting.upsert({
      where: { companyId_key: { companyId: company.id, key } },
      update: {},                       // never overwrite an admin-edited value
      create: { companyId: company.id, key, value, group },
    });
  }
}

async function main() {
  console.log(`\n▶ Seeding nav + footer into: ${(process.env.DATABASE_URL ?? "").replace(/:\/\/[^@]*@/, "://***@")}\n`);
  await seedMenus();
  await seedFooterSettings();
  const settings = await prisma.setting.count();
  console.log(`  MenuItem: created ${created}, updated ${updated}`);
  console.log(`  Settings total: ${settings}\n`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
