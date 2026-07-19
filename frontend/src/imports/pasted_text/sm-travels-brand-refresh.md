CONTINUE THE SAME PROJECT — SM Travels International.
This is the FINAL BRAND ALIGNMENT PASS on the complete design we have already 
built together (Design System, Public Website, Auth, all ERP modules, all 
Portals, responsive Tablet/Mobile versions, Sitemap & Prototype).

Do NOT redesign layouts. Do NOT rebuild screens. Do NOT change any 
functionality — this is a LIVE project. Keep every existing screen, component, 
field, table, form, flow, and prototype link exactly as it is.

The ONLY change: replace the current navy + gold palette with the OFFICIAL 
COMPANY BRAND COLORS taken from the company logo, and apply them consistently 
across 100% of the project.

=== OFFICIAL BRAND PALETTE (from the logo) ===
The logo is an orange airplane with a blue flight-path swoosh, the word "SM" in 
orange, "Travels" in bright blue, and "International" in deep navy blue.

Primary — Brand Blue:      #0E6BB8   (hover #0B5794, active #094A7E)
Deep Navy (headings/nav):  #17456B   (the "International" + swoosh navy)
Accent — Brand Orange:     #E8471F   (hover #CC3C17, active #B23413)
Light Blue tint:           #E8F2FA   (selected rows, active nav, info bg)
Light Orange tint:         #FDEDE8   (accent highlights, warning-free alerts)

Neutrals (keep as-is):
Background #F7F8FA · Surface #FFFFFF · Border #E5E7EB
Text primary #111827 · secondary #6B7280 · muted #9CA3AF

Semantic (keep, but harmonize tone with the brand):
Success #16A34A · Warning #F59E0B · Danger #DC2626 · Info = Brand Blue #0E6BB8

=== HOW TO APPLY THE COLORS ===
- Primary buttons, active nav items, links, focus rings, selected states, 
  progress bars, primary chart series → Brand Blue #0E6BB8.
- Sidebar background, top bar, footer, table headers, page headings, dark 
  surfaces → Deep Navy #17456B.
- Orange #E8471F is the ACCENT ONLY — use it sparingly and deliberately for: 
  the main hero CTA ("Book Now" / "Get Quote"), key call-to-action buttons on 
  the public website, important badges/counts, notification dots, the active 
  step in wizards, and secondary chart series. Do NOT use orange as a large 
  background fill or for body text. Target roughly 70% blue / 20% neutral / 
  10% orange across any given screen.
- Charts: Blue → Orange → Navy → Light Blue → Success Green, in that order.
- Status badges keep their semantic meaning (Pending, Confirmed, In Progress, 
  Completed, Cancelled, Paid, Due, Partial, Overdue) — only retune their hues 
  so they sit comfortably beside the new brand palette.
- Gradients (hero, KPI cards, login split-screen): Brand Blue → Deep Navy, with 
  an optional subtle orange accent element. No gold anywhere.

=== REMOVE COMPLETELY ===
Delete every trace of the old palette — Navy #14356B and Gold #C9A227 — from 
tokens, components, illustrations, icons, borders, shadows, gradients, and 
chart colors. Nothing gold should remain anywhere in the file.

=== UPDATE THE TOKENS, NOT JUST THE PIXELS ===
Update the named color styles/variables on the Design System page first, so the 
change cascades to every component and every screen automatically. Keep the 
same token NAMES (primary, accent, surface, border, etc.) so the developer 
handoff and Tailwind config stay valid — only the values change.

=== LOGO & IDENTITY ===
- Place the official logo (orange plane + blue swoosh + "SM Travels 
  International") in: website header, website footer, ERP sidebar top, all 
  portal sidebars, the login/auth split-screen brand panel, invoice and receipt 
  templates, printable reports, email templates, and the favicon/app icon.
- Provide logo variants: full colour on white, full colour on light background, 
  and a reversed/white version for the navy sidebar and dark surfaces.
- Provide a compact mark (plane + swoosh only) for the collapsed sidebar, 
  mobile header, and favicon.
- Maintain clear space around the logo and never stretch, recolour, or add 
  effects to it.

=== CONSISTENCY SWEEP (apply everywhere) ===
Go through and update EVERY area of the project:
Design System · Public Website (Home, About, Hajj, Umrah, Visa, Air Ticket, 
Manpower, Tour Packages, Hotel, Packages list/detail, Blog, Gallery, FAQ, 
Contact, Booking Request, Login/Register) · Authentication · ERP Shell & Super 
Admin Dashboard · CRM & Leads · Bookings · Packages & Services · Accounts · 
Invoices & Payments · Reports & Analytics · CMS · Operations · Settings · 
Customer Portal · Agent Portal · Supplier Portal · Staff Portal · Accountant 
Portal · all Tablet (768px) and Mobile (390px) frames · the Sitemap & Workflow 
map · and all prototype states.

Also recolour the Sitemap & Workflow diagram using the new palette (blue nodes, 
navy connectors, orange for the customer-facing entry points and payment flow) 
so it stays readable.

=== ACCESSIBILITY CHECK ===
Verify WCAG AA contrast after the change: white text on Brand Blue and Deep 
Navy must pass; orange #E8471F must NOT be used for small text on white 
(darken to #C43A15 for text-on-white cases). Check focus rings remain clearly 
visible. Confirm both Bangla (Noto Sans Bengali) and English (Inter) text 
remain legible on all new backgrounds.

=== DELIVER ===
1. The updated Design System page with the final brand tokens and logo assets.
2. A one-page "Brand Style Guide" frame showing: logo variants and clear space, 
   the full colour palette with hex codes and usage rules, the type scale, and 
   button/badge/chart colour examples — ready for developer handoff.
3. A short written summary confirming every page/frame has been updated and 
   listing the final token values, so I can copy them straight into a Tailwind 
   config for the VS Code build.

Reminder: functionality, layouts, content, routes, and prototype links are 
unchanged. This pass is colour, branding, and identity only.