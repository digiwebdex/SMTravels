# SMTravel International — Master Design Prompt
### Premium Travel Agency Website + SaaS ERP Dashboard
*Step-by-step build prompt for Figma AI / Figma Make (or a design brief for a human designer)*

---

## How to use this document

Run the steps **in order**. Each numbered step is a self-contained prompt block you can paste into Figma AI one at a time. Steps 0–3 build the foundation (tokens + components); Steps 4–7 build every screen on top of them. Do not skip the foundation — the whole system depends on it.

> ⚠️ **Before Step 0:** Upload the SMTravel logo into Figma. If you have no logo yet, use the recommended default palette in Step 1.

---

## STEP 0 — Project setup & mission brief

> **Paste this into Figma AI:**
>
> "Create a new Figma design system and product file for **SMTravel International**, a Bangladesh-based premium travel company offering **Hajj, Umrah, Visa Processing, Air Ticketing (manual booking only — no live GDS/PNR integration), Manpower/Overseas Employment, Tour Packages, Hotel Booking, and Corporate Travel**.
>
> The visual target is **enterprise-grade and trustworthy**, blending: Apple's whitespace and restraint, Stripe's crisp navy/gradient product UI, and the premium warmth of Qatar Airways and Emirates. Aesthetic direction: **modern glassmorphism, soft layered shadows, generously rounded cards, large white space, smooth multi-stop gradients, premium typography, subtle motion.** The audience includes pilgrims, migrant workers, corporate clients, and travel agents — so it must feel **premium yet reassuring, and fully bilingual-ready (English + Bangla / বাংলা)**.
>
> Build the file with **Auto Layout everywhere, reusable components + variants, design tokens/variables, and a mobile-first responsive approach**. Two product areas live in this file:
> 1. **Marketing website** (public pages)
> 2. **SaaS ERP dashboard** (authenticated app: Customer, Agent, Supplier, Admin roles)
>
> Set up pages in Figma named: `🎨 Foundations`, `🧩 Components`, `🌐 Website`, `📊 ERP – App`, `📱 Responsive`, `♿ Accessibility`, `📦 Handoff`."

---

## STEP 1 — Extract the color palette from the logo

> **Paste this into Figma AI:**
>
> "Analyze the uploaded SMTravel logo. Sample its dominant, secondary, and accent colors. Build the **entire palette from these logo colors** — do not introduce unrelated hues. From each sampled color, generate a **10-step tint/shade ramp (50→900)**. Then define semantic roles. Save everything as **Figma Variables (color tokens)** under a collection called `Color`, with modes for **Light** and **Dark**."

### Recommended default palette (use only if no logo is available — otherwise replace with logo-derived hex)

This default suits a Bangladesh Hajj/Umrah premium brand: emerald (heritage + trust), deep navy (Stripe-like authority), warm gold (luxury/Kaaba warmth).

| Token | Role | Hex |
|---|---|---|
| `color/primary/600` | Primary brand (emerald/teal-green) | `#0B6E4F` |
| `color/primary/500` | Primary hover | `#0E8A63` |
| `color/primary/50` | Primary tint bg | `#E7F4EF` |
| `color/secondary/900` | Deep navy (headers, ERP sidebar) | `#0A2540` |
| `color/secondary/700` | Navy support | `#153A5B` |
| `color/accent/500` | Gold accent (CTAs, premium tags) | `#C9A227` |
| `color/accent/300` | Gold hover/glow | `#E3C558` |
| `color/success/500` | Success | `#16A34A` |
| `color/warning/500` | Warning | `#D97706` |
| `color/danger/500` | Error/destructive | `#DC2626` |
| `color/info/500` | Info | `#0EA5E9` |
| `color/neutral/0` | Pure white surface | `#FFFFFF` |
| `color/neutral/50` | App background | `#F7F9FB` |
| `color/neutral/100` | Card border / divider | `#EAEEF2` |
| `color/neutral/500` | Secondary text | `#5B6B7B` |
| `color/neutral/900` | Primary text | `#0B1720` |

### Gradients (define as variables)
- `gradient/hero` → 135° from `secondary/900` → `primary/600` → `accent/500` at low opacity overlay
- `gradient/glass` → white 12% → white 4% (for glassmorphism fills)
- `gradient/cta` → `primary/600` → `primary/500`

---

## STEP 2 — Foundations: type, spacing, radius, elevation, effects

> **Paste this into Figma AI:**
>
> "On the `🎨 Foundations` page, create these token collections as Figma Variables and a visual specimen frame for each."

### Typography
- **Display / Headings:** a modern geometric sans (recommend **Sohne, Inter Display, or SF Pro** feel). **Bangla pairing:** *Noto Sans Bengali / Hind Siliguri* for Bangla content.
- Type scale (rem): `Display 3.5 / H1 2.5 / H2 2 / H3 1.5 / H4 1.25 / Body-L 1.125 / Body 1 / Small 0.875 / Caption 0.75`
- Weights: 400 / 500 / 600 / 700. Line-height: headings 1.15, body 1.6. Letter-spacing: headings −0.5%.

### Spacing scale (4px base)
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128` → tokens `space/1 … space/13`

### Radius
`radius/sm 8 · radius/md 12 · radius/lg 16 · radius/xl 24 · radius/2xl 32 · radius/pill 999`

### Elevation / shadows (soft, layered — Apple/Stripe feel)
- `shadow/xs` → 0 1 2 rgba(11,23,32,.06)
- `shadow/sm` → 0 4 12 rgba(11,23,32,.08)
- `shadow/md` → 0 12 32 rgba(11,23,32,.10)
- `shadow/glow` → 0 8 40 accent-tinted for premium CTAs

### Glassmorphism effect style
- Fill `gradient/glass`, background blur **20**, border 1px white @ 40% opacity, `radius/xl`, `shadow/sm`.

### Motion tokens
- Easing `cubic-bezier(0.22, 1, 0.36, 1)`; durations `fast 120ms / base 200ms / slow 320ms`. Hover lift −2px + shadow step-up.

---

## STEP 3 — Core component library (build once, reuse everywhere)

> **Paste this into Figma AI:**
>
> "On the `🧩 Components` page, build these as **components with variants**, all Auto Layout, all bound to tokens, all with hover/focus/active/disabled states and visible keyboard focus rings."

Build: **Buttons** (primary/secondary/ghost/gold-CTA/icon, 3 sizes) · **Input, Select, Date-picker, Search, Textarea, Toggle, Checkbox, Radio** (default/focus/error/disabled) · **Glass Card, Feature Card, Package Card, Pricing Card, Stat/KPI Card** · **Navbar** (transparent-on-hero → solid-on-scroll) · **Mega-menu** · **Footer** · **Breadcrumb, Tabs, Pagination, Accordion** · **Badge / Status Pill / Tag** · **Avatar, Toast, Modal, Drawer, Tooltip** · **Table** (sortable header, row hover, sticky first col, pagination) · **Chart placeholders** (line/bar/donut/area) · **Sidebar nav item** (default/active/collapsed) · **Stepper** (for booking flows) · **File-upload dropzone** · **Empty state, Skeleton loader** · **Sticky mobile action bar** (WhatsApp + Call + Book Now).

---

## STEP 4 — Marketing website (Desktop-first, then responsive)

> Build each page below on the `🌐 Website` page as a **1440px desktop frame**, using only Step 3 components. Then generate **Tablet (768)** and **Mobile (390)** variants per Step 6.

### 4.1 — Home
> "Design the SMTravel home page. **Hero:** full-bleed `gradient/hero` over a subtle Kaaba/aircraft imagery, glass search-widget card floating on it with a **service switcher (Hajj · Umrah · Visa · Ticketing · Tour · Hotel · Manpower · Corporate)** and contextual fields + gold **Book Now** CTA. Below: trust bar (IATA/HAAB/BMET/ATAB accreditation logos, years in business, pilgrims served). Then: **service grid** (8 glass feature cards with icons), **featured packages** carousel (Package Cards with price 'from ৳', duration, rating), **why SMTravel** (3–4 value props), **Hajj/Umrah countdown** module, **testimonials** slider, **stats band** (KPI cards), **blog teasers**, **partner airlines/hotels** logo marquee, newsletter + WhatsApp CTA, then Footer. Large whitespace, soft shadows, one clear CTA per section."

### 4.2 — About
> "Company story, mission/vision, timeline (Stepper as milestones), leadership team (Avatar cards), licenses & certifications, offices map (Dhaka HQ), CSR. Premium editorial layout, generous whitespace."

### 4.3 — Packages (listing)
> "Filterable package grid: left filter rail (type, destination, price range slider, duration, month, rating), sort dropdown, responsive Package Card grid, map toggle, pagination. Sticky filter on scroll. Empty + loading states."

### 4.4 — Hajj (landing)
> "Dedicated Hajj page: emotive hero, package tiers (Economy / Standard / Premium / VIP as Pricing Cards), what's included/excluded accordion, itinerary Stepper (Makkah→Mina→Arafat→Muzdalifah→Madinah), visa & requirements checklist, pricing table, guide/mentor info, FAQ accordion, inquiry form + WhatsApp. Reassuring, spiritual, premium tone."

### 4.5 — Umrah (landing)
> "Same architecture as Hajj: year-round Umrah packages, hotel-distance-to-Haram badges, flexible date picker, family/group pricing, add-ons (transport, ziyarat tours), quick-quote form."

### 4.6 — Visa Processing
> "Visa page: country grid (Saudi, UAE, Malaysia, Schengen, etc.) with flag cards, visa-type tabs (tourist/work/business/umrah), required-documents checklist, processing-time + fee table, step tracker, apply/upload-documents CTA, disclaimer."

### 4.7 — Manpower / Overseas Employment
> "Compliant recruitment page: destination countries, job categories, BMET/registration info, employer vs jobseeker split CTAs, process Stepper (register→verify→deploy), required documents, success stats, inquiry form. Formal, trustworthy, government-compliant tone."

### 4.8 — Contact
> "Contact page: glass contact form (name, phone, service dropdown, message), office cards with map embed, direct WhatsApp/Call buttons, business hours, branch locations, social links."

### 4.9 — Blog (listing + article)
> "Blog index: featured post hero, category chips, responsive article-card grid, search, pagination. Article template: reading-width column, hero image, author + date, share buttons, related posts, in-content CTA. Clean editorial typography."

### 4.10 — Login / Auth
> "Split-screen auth: left = branded gradient/glass panel with value props; right = login form (email/phone + password), social/OTP option, 'forgot password', role hint (Customer/Agent/Supplier/Admin), sign-up link. Also design Register, OTP-verify, Forgot-password, Reset screens."

---

## STEP 5 — SaaS ERP dashboard (authenticated app)

> Build on the `📊 ERP – App` page. **Shell:** collapsible left **navy sidebar** (icon + label, active state, role-based sections), glass **top bar** (global search, notifications bell w/ badge, help, avatar menu, workspace switcher), breadcrumb, content area on `neutral/50`. All dashboards reuse KPI Cards, Tables, Charts, Tabs, Drawers from Step 3.

### 5.1 — Customer Dashboard
> "For pilgrims/travelers: welcome header, KPI cards (upcoming trips, pending payments, documents status, active bookings), booking timeline, payment history table + pay-now, document vault (upload/status), visa/application tracker (Stepper), notifications, quick actions (new inquiry, WhatsApp support)."

### 5.2 — Agent Dashboard
> "For travel agents/sub-agents: sales KPIs (bookings, commission earned, conversion), leads/CRM snapshot, my customers table, create-booking flow entry, commission ledger, targets progress, downline (if applicable), payout status."

### 5.3 — Supplier Portal
> "For hotels/airlines/manpower partners: assigned bookings, inventory/allotment table, rate management, invoices & settlements, performance metrics, document exchange, messaging with admin."

### 5.4 — Admin Dashboard
> "Master overview: revenue/bookings/leads KPI cards with trend charts (line + area), bookings-by-service donut, funnel, recent-activity feed, top agents leaderboard, cashflow snapshot, system alerts, quick links to all modules below."

### 5.5 — CRM
> "Lead pipeline **Kanban** (New→Contacted→Quoted→Won→Lost) with draggable lead cards, plus list view toggle, lead detail Drawer (contact, service interest, activity log, notes, assign-to-agent, WhatsApp/call), filters, source analytics."

### 5.6 — Booking Management
> "All bookings table (ref, customer, service, status pill, amount, agent, date) with advanced filters, bulk actions, status workflow, booking detail view. **Ticketing = manual booking only:** a manual-entry form (airline, PNR/ticket no. entered by staff, route, pax, fare, issue date) — no live GDS/fare-search UI. Include package/hotel/visa/manpower booking types."

### 5.7 — Accounting
> "Finance module: invoices (list + create), receipts, payments/vouchers, ledger, accounts receivable/payable, agent commissions & payouts, expense tracking, tax/VAT fields (Bangladesh), P&L summary cards, export. Clean tabular UI + status pills."

### 5.8 — Reports
> "Report center: filter bar (date range, service, agent, branch), KPI summary row, chart panels (revenue trend, service mix, agent performance, visa success rate, refunds), data tables, schedule/export (PDF/Excel/CSV). Card-based report gallery."

### 5.9 — CMS (Content Management)
> "Manage website content: pages, packages (create/edit with rich fields, images, pricing tiers, itinerary builder), blog posts editor, banners/hero slides, testimonials, FAQ, media library, menu builder, SEO fields. WYSIWYG + preview."

### 5.10 — Settings
> "Tabbed settings: Profile, Organization/branding, Users & Roles (RBAC matrix), Branches, Payment gateways (bKash/Nagad/card), Notification preferences, API/Integrations, Localization (EN/BN, currency ৳, timezone), Security (2FA, sessions), Audit log."

### 5.11 — Notification Center
> "Full-page + dropdown panel: tabs (All / Bookings / Payments / System / Marketing), grouped by date, read/unread states, action buttons inline, mark-all-read, preferences link, real-time toast examples."

---

## STEP 6 — Responsive: Desktop · Tablet · Mobile

> **Paste this into Figma AI:**
>
> "For every website page and ERP screen, produce three responsive frames using these breakpoints and **mobile-first behavior**:
> - **Mobile 390px** — single column, hamburger + slide-in drawer nav, stacked cards, collapsible filters in a bottom-sheet, tables become stacked cards or horizontal scroll, ERP sidebar becomes a bottom tab bar or drawer. **Add the sticky bottom action bar with WhatsApp (green), Call (navy), and Book Now (gold) buttons** on all public pages.
> - **Tablet 768px** — 2-column grids, condensed sidebar (icons), persistent search.
> - **Desktop 1440px** — full layouts as designed.
>
> Ensure tap targets ≥ 44px, respect safe areas, and keep the same tokens/components across all breakpoints via Auto Layout resizing and constraints."

---

## STEP 7 — Accessibility (WCAG 2.1 AA)

> **Paste this into Figma AI:**
>
> "On the `♿ Accessibility` page, document and enforce: **color contrast ≥ 4.5:1** for text (verify gold-on-white and text-on-gradient — darken where needed), visible **focus indicators** on all interactive components, semantic heading order, form labels + error text + helper text (never color-only errors — pair with icon/text), keyboard-navigable menus/modals/drawers, reduced-motion variant, min 44px targets, and Bangla/English text-length resilience. Provide a light + dark mode check."

---

## STEP 8 — Production-ready handoff

> **Paste this into Figma AI:**
>
> "On the `📦 Handoff` page: publish all components + tokens as a **Team Library**; name and organize layers cleanly; add a cover thumbnail; create a component-usage doc; annotate spacing/behavior on 2–3 key flows (booking, lead→won, manual ticket entry); export icon set; and add a **redlines/spec** frame referencing token names so developers implement from variables, not hard-coded values. Ensure every screen uses components + variables end-to-end (no detached styles)."

---

## Quick-start (if your AI tool takes one big prompt)

If your tool prefers a single mega-prompt rather than steps, paste **Step 0 + Step 1 + Step 2 + Step 3** together first (foundation), let it build, then feed **Steps 4–7** in batches. Foundation-first prevents inconsistent, un-tokenized output.

---

### Reminder
Replace the Step 1 default palette with **logo-sampled colors** for a true brand-derived system. Upload the logo and re-run Step 1.