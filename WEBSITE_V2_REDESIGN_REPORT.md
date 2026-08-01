# Website V2 Premium Redesign — Report

**Branch:** `feature/website-v2-redesign`  
**Scope:** Public marketing site only (`frontend/src/app/pages`, Layout, website primitives, public content hooks)  
**Date:** 2026-08-01

## Summary

Premium Bangla-first redesign of the public website with a shared visual system (brand tokens + Motion), live wiring to existing `GET /api/public/*` CMS endpoints, a static Islamic Guidance Center, and restyled public pages — without backend, ERP, portal, auth logic, or API changes.

## What shipped

| Area | Deliverable |
|---|---|
| Tokens | `frontend/src/styles/tokens.css`, fonts (Cormorant / DM Sans / Noto Bengali) |
| Hooks | `frontend/src/app/hooks/publicContent.ts` → packages, blog, FAQs, testimonials, gallery, CMS pages, menus, banners |
| Primitives | `frontend/src/app/website/primitives.tsx` — Reveal, PageHero, PackageCard, GuideCard, VideoCard, AccordionFAQ, etc. |
| Shell | Premium Header + mega Footer in `Layout.tsx` |
| Home V2 | Full-bleed Kaaba hero (no booking widget / floating promo), services, knowledge preview, Hajj/Umrah API packages, videos, why-us, counters, testimonials, blog, FAQ, newsletter |
| Knowledge | `/knowledge`, `/knowledge/:slug` — static bn/en guides in `website/knowledge/guides.ts` |
| Core pages | Packages, Blog, Gallery, FAQ, Service pages wired to public APIs where available |
| New routes | `/transport`, `/videos`, `/testimonials`, `/branches`, `/privacy`, `/terms`, `/refund`, `/career` |
| Company/Auth | About, Contact, Booking, Auth, NotFound visual restyle (logic unchanged) |

## Brand tokens used

`#1B75BC`, `#062D63`, `#F15A24`, `#EAF5FF`, `#FFFFFF`, `#16A34A`, `#C89B3C`

## Data strategy

- **CMS-backed:** packages, blog, FAQs, testimonials, gallery, legal/career CMS page slugs via `/api/public/*`
- **Static (no CMS model):** Knowledge Center guides; curated YouTube list for Videos
- **Service editorial copy:** still from `lib/data` SERVICES (no public service API); live packages overlaid for Hajj/Umrah/Tour

## Quality gates

| Gate | Result |
|---|---|
| `cd frontend && npm run build` | **PASS** |
| Existing public paths preserved | Yes (only additive routes) |
| Backend / ERP / portals touched | No |
| Motion + `prefers-reduced-motion` | Yes (`Reveal` / `StatCounter`) |

## Responsive / a11y / SEO notes

- Shared `PageHero` + breadcrumbs on public pages
- Accordion FAQ uses `aria-expanded`; focus-visible rings on interactive primitives
- Lazy images on cards; skeleton loaders on API pages
- Document titles remain via existing i18n / page copy (no new backend SEO endpoints)

## Out of scope (unchanged)

- ERP, portals, Milestone E portal stash
- Backend/CMS schema for Knowledge or Videos
- Merging to `master`

## Suggested follow-ups

1. Seed/publish CMS pages for privacy/terms/refund/career/branches so fallback copy is replaced live  
2. Add Knowledge PDF assets when available (links currently placeholder)  
3. Optional: public video CMS model later; until then curated list remains  
